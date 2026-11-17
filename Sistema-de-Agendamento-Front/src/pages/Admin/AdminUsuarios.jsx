import { useState } from 'react'
import './Admin.css'
import AdminLayout from '../../components/AdminLayout'
import Icone from '../../components/Icone'
import AdminUsuarioModal from './AdminUsuarioModal'
import { useAdminAgendamentos, useAdminPacientes } from '../../hooks/useAdminAgendamentos'
import { useAdminUsuarios } from '../../hooks/useAdminUsuarios'
import { formatarCpf, formatarTelefone } from '../../utils/mascaras'
import { ROTULOS_CARGO, iniciais, normalizar, soDigitos } from '../../utils/admin'

const POR_PAGINA = 8

const CLASSE_CARGO = {
  PACIENTE: 'status-atendimento',
  RECEPCIONISTA: 'status-confirmado',
  ADMIN: 'status-pendente',
}

function AdminUsuarios({
  session = null,
  currentPage = 'admin-usuarios',
  onNavigate = () => {},
  onLogout = () => {},
  onSessaoAtualizada = () => {},
}) {
  const { usuarios, carregando, erro, recarregar: recarregarUsuarios } = useAdminUsuarios()
  // Pacientes e agendamentos servem para achar o paciente titular de cada usuário e mostrar o histórico.
  const { pacientes, recarregar: recarregarPacientes } = useAdminPacientes()
  const { agendamentos, recarregar: recarregarAgendamentos } = useAdminAgendamentos()

  const [busca, setBusca] = useState('')
  const [cargo, setCargo] = useState('') // '' | 'PACIENTE' | 'RECEPCIONISTA' | 'ADMIN'
  const [pagina, setPagina] = useState(1)
  const [aberto, setAberto] = useState(null) // { publicId, modo }
  const [mensagem, setMensagem] = useState('')

  const termoTexto = normalizar(busca.trim())
  const termoDigitos = soDigitos(busca)

  const filtrados = usuarios.filter((u) => {
    if (cargo && u.cargo !== cargo) return false
    if (!termoTexto) return true
    return (
      normalizar(u.nome).includes(termoTexto) ||
      normalizar(u.email).includes(termoTexto) ||
      (termoDigitos.length >= 3 &&
        (soDigitos(u.cpf).includes(termoDigitos) || soDigitos(u.telefone).includes(termoDigitos)))
    )
  })

  const totalPaginas = Math.max(1, Math.ceil(filtrados.length / POR_PAGINA))
  const paginaAtual = Math.min(pagina, totalPaginas)
  const inicio = (paginaAtual - 1) * POR_PAGINA
  const visiveis = filtrados.slice(inicio, inicio + POR_PAGINA)

  // O CPF do titular é o do usuário: é assim que se liga a conta ao registro de paciente.
  const titularDe = (u) =>
    pacientes.find((p) => p.parentesco === 'TITULAR' && soDigitos(p.cpf) === soDigitos(u.cpf)) ?? null

  const selecionado = aberto ? usuarios.find((u) => u.publicId === aberto.publicId) : null

  const abrir = (u, modo = 'ficha') => {
    setMensagem('')
    setAberto({ publicId: u.publicId, modo })
  }

  // Ação concluída (agendou, alterou dados ou senha): atualiza as listas, fecha a janela e avisa na tela.
  const aoConcluir = async (texto) => {
    await Promise.all([recarregarUsuarios(), recarregarPacientes(), recarregarAgendamentos()])
    setAberto(null)
    setMensagem(texto)
  }

  return (
    <AdminLayout
      currentPage={currentPage}
      onNavigate={onNavigate}
      onLogout={onLogout}
      session={session}
      titulo="Usuários"
      subtitulo="Gerencie o acesso de pacientes, recepcionistas e administradores."
    >
      <div className="adm-titulo-acao">
        <button type="button" className="btn btn-secondary" onClick={() => onNavigate('recepcao-novo-paciente')}>
          <Icone nome="mais" /> Cadastrar Paciente
        </button>
        <button type="button" className="btn btn-primary" onClick={() => onNavigate('admin-novo-recepcionista')}>
          <Icone nome="mais" /> Cadastrar Recepcionista
        </button>
      </div>

      <div className="card adm-painel adm-tabela-card">
        <div className="adm-toolbar">
          <div className="adm-busca">
            <Icone nome="busca" />
            <label htmlFor="adm-busca-usuario" className="adm-oculto">
              Buscar por nome, e-mail, CPF ou telefone
            </label>
            <input
              id="adm-busca-usuario"
              className="search-input"
              type="search"
              placeholder="Buscar por nome, e-mail ou CPF..."
              value={busca}
              onChange={(e) => { setBusca(e.target.value); setPagina(1) }}
            />
          </div>
          <label className="adm-filtro">
            <span className="adm-oculto">Perfil de acesso</span>
            <select className="adm-select" value={cargo} onChange={(e) => { setCargo(e.target.value); setPagina(1) }}>
              <option value="">Todos os perfis</option>
              <option value="PACIENTE">Pacientes</option>
              <option value="RECEPCIONISTA">Recepcionistas</option>
              <option value="ADMIN">Administradores</option>
            </select>
          </label>
        </div>

        {mensagem && <div className="alert alert-success" role="status">{mensagem}</div>}
        {erro && <div className="alert alert-error" role="alert">{erro}</div>}
        {carregando && <p className="adm-vazio">Carregando usuários...</p>}
        {!carregando && !erro && filtrados.length === 0 && <p className="adm-vazio">Nenhum usuário encontrado.</p>}

        {visiveis.length > 0 && (
          <div className="adm-tabela-rolagem">
            <table className="adm-tabela">
              <thead>
                <tr>
                  <th scope="col">Usuário</th>
                  <th scope="col">CPF</th>
                  <th scope="col">Telefone</th>
                  <th scope="col">Perfil</th>
                  <th scope="col" className="adm-col-acoes">Ações</th>
                </tr>
              </thead>
              <tbody>
                {visiveis.map((u) => (
                  <tr key={u.publicId}>
                    <td>
                      <div className="adm-paciente-celula">
                        <span className="adm-letra" aria-hidden="true">{iniciais(u.nome).charAt(0)}</span>
                        <div>
                          <strong>{u.nome}</strong>
                          <small>{u.email}{u.ativo ? '' : ' • conta inativa'}</small>
                        </div>
                      </div>
                    </td>
                    <td>{formatarCpf(u.cpf)}</td>
                    <td>{formatarTelefone(u.telefone)}</td>
                    <td>
                      <span className={`status-badge ${CLASSE_CARGO[u.cargo] ?? 'status-atendimento'}`}>
                        {ROTULOS_CARGO[u.cargo] ?? u.cargo}
                      </span>
                    </td>
                    <td className="adm-col-acoes">
                      <div className="adm-acoes-linha">
                        <button type="button" className="adm-icone-botao" onClick={() => abrir(u)} aria-label={`Ver dados de ${u.nome}`} title="Ver dados">
                          <Icone nome="olho" tamanho={16} />
                        </button>
                        <button type="button" className="adm-icone-botao" onClick={() => abrir(u, 'agendar')} aria-label={`Agendar exame para ${u.nome}`} title="Agendar exame">
                          <Icone nome="calendario" tamanho={16} />
                        </button>
                        <button type="button" className="adm-icone-botao" onClick={() => abrir(u, 'editar')} aria-label={`Alterar dados de ${u.nome}`} title="Alterar dados">
                          <Icone nome="lapis" tamanho={16} />
                        </button>
                        <button type="button" className="adm-icone-botao" onClick={() => abrir(u, 'senha')} aria-label={`Alterar senha de ${u.nome}`} title="Alterar senha">
                          <Icone nome="chave" tamanho={16} />
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
              Exibindo {inicio + 1}-{Math.min(inicio + POR_PAGINA, filtrados.length)} de {filtrados.length} usuários cadastrados
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
        <AdminUsuarioModal
          key={`${selecionado.publicId}-${aberto.modo}`}
          usuario={selecionado}
          titular={titularDe(selecionado)}
          agendamentos={agendamentos}
          session={session}
          modoInicial={aberto.modo}
          onFechar={() => setAberto(null)}
          onConcluido={aoConcluir}
          onSessaoAtualizada={onSessaoAtualizada}
        />
      )}
    </AdminLayout>
  )
}

export default AdminUsuarios
