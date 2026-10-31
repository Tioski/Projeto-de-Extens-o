import { useState } from 'react'
import './Admin.css'
import AdminLayout from '../../components/AdminLayout'
import Icone from '../../components/Icone'
import AdminPacienteModal from './AdminPacienteModal'
import { useAdminAgendamentos, useAdminPacientes } from '../../hooks/useAdminAgendamentos'
import { formatarData, formatarDataHora } from '../../utils/agendamento'
import { formatarCpf, formatarDataISO, formatarTelefone } from '../../utils/mascaras'
import { iniciais, normalizar, soDigitos } from '../../utils/admin'

const POR_PAGINA = 8

function AdminPacientes({ session = null, currentPage = 'recepcao-pacientes', onNavigate = () => {}, onLogout = () => {} }) {
  const { pacientes, carregando, erro, recarregar: recarregarPacientes } = useAdminPacientes()
  // Os agendamentos servem só para o histórico dentro da ficha do paciente.
  const { agendamentos, recarregar: recarregarAgendamentos } = useAdminAgendamentos()

  const [busca, setBusca] = useState('')
  const [filtrosAbertos, setFiltrosAbertos] = useState(false)
  const [tipo, setTipo] = useState('') // '' | 'TITULAR' | 'DEPENDENTE'
  const [semConsulta, setSemConsulta] = useState(false)
  const [pagina, setPagina] = useState(1)
  const [aberto, setAberto] = useState(null) // { publicId, modo } do paciente com a ficha aberta
  const [mensagem, setMensagem] = useState('')

  const termoTexto = normalizar(busca.trim())
  const termoDigitos = soDigitos(busca)

  const filtrados = pacientes.filter((p) => {
    if (tipo === 'TITULAR' && p.parentesco !== 'TITULAR') return false
    if (tipo === 'DEPENDENTE' && p.parentesco === 'TITULAR') return false
    if (semConsulta && p.ultimaConsulta) return false
    if (!termoTexto) return true

    return (
      normalizar(p.nome).includes(termoTexto) ||
      normalizar(p.email).includes(termoTexto) ||
      formatarDataISO(p.dataNascimento).includes(busca.trim()) ||
      (termoDigitos.length >= 3 &&
        (soDigitos(p.cpf).includes(termoDigitos) || soDigitos(p.telefone).includes(termoDigitos)))
    )
  })

  const totalPaginas = Math.max(1, Math.ceil(filtrados.length / POR_PAGINA))
  const paginaAtual = Math.min(pagina, totalPaginas)
  const inicio = (paginaAtual - 1) * POR_PAGINA
  const visiveis = filtrados.slice(inicio, inicio + POR_PAGINA)

  const selecionado = aberto ? pacientes.find((p) => p.publicId === aberto.publicId) : null

  const abrir = (p, modo = 'ficha') => {
    setMensagem('')
    setAberto({ publicId: p.publicId, modo })
  }

  // Exame agendado: atualiza as listas, fecha a ficha e avisa na tela.
  const aoAgendar = async (criado) => {
    await Promise.all([recarregarPacientes(), recarregarAgendamentos()])
    setAberto(null)
    setMensagem(
      `Exame agendado para ${criado.pacienteNome}: ${criado.exameNome} em ${formatarDataHora(criado.dataConfirmada)}${
        criado.consultorio ? ` (${criado.consultorio})` : ''
      }.`,
    )
  }
  const filtrosAtivos = (tipo ? 1 : 0) + (semConsulta ? 1 : 0)

  return (
    <AdminLayout
      currentPage={currentPage}
      onNavigate={onNavigate}
      onLogout={onLogout}
      session={session}
      titulo="Pacientes"
      subtitulo="Acesse o cadastro de todos os pacientes assistidos."
    >
      <div className="adm-titulo-acao">
        <button type="button" className="btn btn-primary" onClick={() => onNavigate('recepcao-novo-paciente')}>
          <Icone nome="mais" /> Cadastrar Paciente
        </button>
      </div>

      <div className="card adm-painel adm-tabela-card">
        <div className="adm-toolbar" style={{ marginBottom: filtrosAbertos ? '0.75rem' : '1rem' }}>
          <div className="adm-busca">
            <Icone nome="busca" />
            <label htmlFor="adm-busca-paciente" className="adm-oculto">
              Buscar por nome, CPF, telefone ou data de nascimento
            </label>
            <input
              id="adm-busca-paciente"
              className="search-input"
              type="search"
              placeholder="Buscar por nome, CPF ou data de nascimento..."
              value={busca}
              onChange={(e) => { setBusca(e.target.value); setPagina(1) }}
            />
          </div>
          <button
            type="button"
            className={`btn btn-secondary adm-filtros-botao${filtrosAtivos ? ' ativo' : ''}`}
            aria-expanded={filtrosAbertos}
            onClick={() => setFiltrosAbertos((v) => !v)}
          >
            <Icone nome="filtros" /> Mais Filtros{filtrosAtivos ? ` (${filtrosAtivos})` : ''}
          </button>
        </div>

        {filtrosAbertos && (
          <div className="adm-filtros-painel">
            <label className="adm-filtro">
              Tipo de paciente
              <select className="adm-select" value={tipo} onChange={(e) => { setTipo(e.target.value); setPagina(1) }}>
                <option value="">Todos</option>
                <option value="TITULAR">Titulares</option>
                <option value="DEPENDENTE">Dependentes</option>
              </select>
            </label>
            <label className="adm-filtro-check">
              <input type="checkbox" checked={semConsulta} onChange={(e) => { setSemConsulta(e.target.checked); setPagina(1) }} />
              Somente quem nunca fez um exame
            </label>
            {filtrosAtivos > 0 && (
              <button type="button" className="adm-link" onClick={() => { setTipo(''); setSemConsulta(false); setPagina(1) }}>
                Limpar filtros
              </button>
            )}
          </div>
        )}

        {mensagem && <div className="alert alert-success" role="status">{mensagem}</div>}
        {erro && <div className="alert alert-error" role="alert">{erro}</div>}
        {carregando && <p className="adm-vazio">Carregando pacientes...</p>}
        {!carregando && !erro && filtrados.length === 0 && <p className="adm-vazio">Nenhum paciente encontrado.</p>}

        {visiveis.length > 0 && (
          <div className="adm-tabela-rolagem">
            <table className="adm-tabela">
              <thead>
                <tr>
                  <th scope="col">Paciente</th>
                  <th scope="col">CPF</th>
                  <th scope="col">Nascimento</th>
                  <th scope="col">Telefone</th>
                  <th scope="col">Última consulta</th>
                  <th scope="col">Próximo exame</th>
                  <th scope="col" className="adm-col-acoes">Ações</th>
                </tr>
              </thead>
              <tbody>
                {visiveis.map((p) => (
                  <tr key={p.publicId}>
                    <td>
                      <div className="adm-paciente-celula">
                        <span className="adm-letra" aria-hidden="true">{iniciais(p.nome).charAt(0)}</span>
                        <div>
                          <strong>{p.nome}</strong>
                          {p.parentesco !== 'TITULAR' && <small>Dependente</small>}
                        </div>
                      </div>
                    </td>
                    <td>{formatarCpf(p.cpf)}</td>
                    <td>{formatarDataISO(p.dataNascimento)}</td>
                    <td>{formatarTelefone(p.telefone)}</td>
                    <td>
                      {p.ultimaConsulta ? (
                        <strong>{formatarData(p.ultimaConsulta)}</strong>
                      ) : (
                        <strong className="texto-cancelado">Nunca</strong>
                      )}
                    </td>
                    <td>{p.proximoExame ? <strong>{formatarData(p.proximoExame)}</strong> : '—'}</td>
                    <td className="adm-col-acoes">
                      <div className="adm-acoes-linha">
                        <button
                          type="button"
                          className="adm-icone-botao"
                          onClick={() => abrir(p)}
                          aria-label={`Ver dados de ${p.nome}`}
                          title="Ver dados"
                        >
                          <Icone nome="olho" tamanho={16} />
                        </button>
                        <button
                          type="button"
                          className="adm-icone-botao"
                          onClick={() => abrir(p, 'agendar')}
                          aria-label={`Agendar exame para ${p.nome}`}
                          title="Agendar exame"
                        >
                          <Icone nome="calendario" tamanho={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {filtrados.length > 0 && (
          <div className="adm-tabela-rodape">
            <span>
              Exibindo {inicio + 1}-{Math.min(inicio + POR_PAGINA, filtrados.length)} de {filtrados.length} pacientes cadastrados
            </span>
            <div className="adm-paginas">
              <button type="button" className="adm-pagina" disabled={paginaAtual === 1} onClick={() => setPagina(paginaAtual - 1)}>
                Anterior
              </button>
              <button type="button" className="adm-pagina ativa" disabled={paginaAtual === totalPaginas} onClick={() => setPagina(paginaAtual + 1)}>
                Próximo
              </button>
            </div>
          </div>
        )}
      </div>

      {selecionado && (
        <AdminPacienteModal
          key={`${selecionado.publicId}-${aberto.modo}`}
          paciente={selecionado}
          agendamentos={agendamentos}
          modoInicial={aberto.modo}
          onFechar={() => setAberto(null)}
          onAgendado={aoAgendar}
        />
      )}
    </AdminLayout>
  )
}

export default AdminPacientes
