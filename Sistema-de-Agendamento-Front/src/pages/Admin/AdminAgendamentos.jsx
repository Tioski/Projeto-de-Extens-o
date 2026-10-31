import { useState } from 'react'
import './Admin.css'
import AdminLayout from '../../components/AdminLayout'
import Icone from '../../components/Icone'
import AdminAgendamentoModal from './AdminAgendamentoModal'
import { useAdminAgendamentos } from '../../hooks/useAdminAgendamentos'
import { dataDeReferencia, infoStatus } from '../../utils/agendamento'
import {
  ROTULO_STATUS_FILTRO,
  STATUS_LISTA,
  agoraMs,
  contarPorStatus,
  dataExibida,
  ehProximo,
  podeCancelar,
  textoDataHora,
} from '../../utils/admin'

const POR_PAGINA = 6

// Cartões do topo: cada um mostra a contagem e filtra a lista ao clicar.
const CARTOES = [
  { status: 'PENDENTE', icone: 'relogio', tom: 'tom-pendente' },
  { status: 'CONFIRMADO', icone: 'confirmado', tom: 'tom-confirmado' },
  { status: 'CONCLUIDO', icone: 'concluido', tom: 'tom-concluido' },
  { status: 'RECUSADO', icone: 'recusado', tom: 'tom-cancelado' },
  { status: 'CANCELADO', icone: 'cancelado', tom: 'tom-cancelado' },
]

function AdminAgendamentos({ session = null, currentPage = 'recepcao-agendamentos', onNavigate = () => {}, onLogout = () => {} }) {
  const { agendamentos, carregando, erro, recarregar } = useAdminAgendamentos()

  const [busca, setBusca] = useState('')
  const [status, setStatus] = useState('')
  const [de, setDe] = useState('')
  const [ate, setAte] = useState('')
  const [aba, setAba] = useState('proximos') // 'proximos' | 'anteriores' | 'todos'
  const [pagina, setPagina] = useState(1)
  const [detalhe, setDetalhe] = useState(null) // { publicId, modo }
  const [mensagem, setMensagem] = useState('')

  const contagem = contarPorStatus(agendamentos)
  const agora = agoraMs()

  // Filtros (busca, status e período) valem para as três abas.
  const termo = busca.trim().toLowerCase()
  const filtrados = agendamentos.filter((a) => {
    if (status && a.status !== status) return false
    if (termo && !`${a.exameNome} ${a.pacienteNome} ${a.pacienteCpf ?? ''}`.toLowerCase().includes(termo)) return false
    const ref = dataDeReferencia(a)
    if (de && ref < new Date(`${de}T00:00:00`).getTime()) return false
    if (ate && ref > new Date(`${ate}T23:59:59`).getTime()) return false
    return true
  })

  const proximos = filtrados
    .filter((a) => ehProximo(a, agora))
    .sort((x, y) => dataDeReferencia(x) - dataDeReferencia(y))
  const anteriores = filtrados
    .filter((a) => !ehProximo(a, agora))
    .sort((x, y) => dataDeReferencia(y) - dataDeReferencia(x))
  const todos = [...filtrados].sort((x, y) => dataDeReferencia(y) - dataDeReferencia(x))

  const ABAS = [
    { chave: 'proximos', rotulo: 'Próximos', lista: proximos },
    { chave: 'anteriores', rotulo: 'Anteriores', lista: anteriores },
    { chave: 'todos', rotulo: 'Todos', lista: todos },
  ]
  const lista = ABAS.find((x) => x.chave === aba).lista

  const totalPaginas = Math.max(1, Math.ceil(lista.length / POR_PAGINA))
  const paginaAtual = Math.min(pagina, totalPaginas)
  const inicio = (paginaAtual - 1) * POR_PAGINA
  const visiveis = lista.slice(inicio, inicio + POR_PAGINA)

  const filtrarPorStatus = (valor) => {
    setStatus((atual) => (atual === valor ? '' : valor))
    setAba('todos')
    setPagina(1)
  }

  const abrir = (a, modo = 'detalhes') => {
    setMensagem('')
    setDetalhe({ publicId: a.publicId, modo })
  }

  const aoConcluirAcao = async (texto) => {
    await recarregar()
    setDetalhe(null)
    setMensagem(texto)
  }

  const selecionado = detalhe ? agendamentos.find((a) => a.publicId === detalhe.publicId) : null

  return (
    <AdminLayout
      currentPage={currentPage}
      onNavigate={onNavigate}
      onLogout={onLogout}
      session={session}
      titulo="Agendamentos"
      subtitulo="Acompanhe, confirme, conclua ou cancele os exames agendados."
    >
      <div className="adm-titulo-acao">
        <button type="button" className="btn btn-primary" onClick={() => onNavigate('recepcao-novo-paciente')}>
          <Icone nome="novoPaciente" /> Cadastrar Novo Paciente
        </button>
      </div>

      <div className="adm-cards" role="group" aria-label="Resumo por status (clique para filtrar)">
        {CARTOES.map((c) => (
          <button
            key={c.status}
            type="button"
            className={`card adm-stat${status === c.status ? ' ativo' : ''}`}
            aria-pressed={status === c.status}
            onClick={() => filtrarPorStatus(c.status)}
          >
            <div className="adm-stat-topo">
              <span className="adm-stat-rotulo">{ROTULO_STATUS_FILTRO[c.status]}</span>
              <span className={`adm-stat-icone ${c.tom}`}><Icone nome={c.icone} /></span>
            </div>
            <strong>{carregando ? '--' : contagem[c.status]}</strong>
          </button>
        ))}
      </div>

      <div className="adm-toolbar">
        <div className="adm-busca">
          <Icone nome="busca" />
          <label htmlFor="adm-busca" className="adm-oculto">
            Buscar por paciente, CPF ou exame
          </label>
          <input
            id="adm-busca"
            className="search-input"
            type="search"
            placeholder="Buscar por paciente, CPF ou exame"
            value={busca}
            onChange={(e) => { setBusca(e.target.value); setPagina(1) }}
          />
        </div>

        <div className="adm-periodo">
          <Icone nome="calendario" />
          <label htmlFor="adm-de">De</label>
          <input id="adm-de" type="date" value={de} max={ate || undefined} onChange={(e) => { setDe(e.target.value); setPagina(1) }} />
          <label htmlFor="adm-ate">até</label>
          <input id="adm-ate" type="date" value={ate} min={de || undefined} onChange={(e) => { setAte(e.target.value); setPagina(1) }} />
        </div>

        <select
          className="adm-select"
          aria-label="Filtrar por status"
          value={status}
          onChange={(e) => { setStatus(e.target.value); setPagina(1) }}
        >
          <option value="">Todos os status</option>
          {STATUS_LISTA.map((s) => (
            <option key={s} value={s}>{infoStatus(s).label}</option>
          ))}
        </select>
      </div>

      <div className="adm-abas" role="tablist" aria-label="Período dos agendamentos">
        {ABAS.map((x) => (
          <button
            key={x.chave}
            type="button"
            role="tab"
            aria-selected={aba === x.chave}
            className={`adm-aba${aba === x.chave ? ' ativa' : ''}`}
            onClick={() => { setAba(x.chave); setPagina(1) }}
          >
            {x.rotulo}
            <span className="adm-aba-contagem">{x.lista.length}</span>
          </button>
        ))}
      </div>

      {mensagem && <div className="alert alert-success" role="status">{mensagem}</div>}
      {erro && <div className="alert alert-error" role="alert">{erro}</div>}
      {carregando && <p className="adm-vazio">Carregando agendamentos...</p>}
      {!carregando && !erro && lista.length === 0 && <p className="adm-vazio">Nenhum agendamento encontrado.</p>}

      <div className="adm-lista">
        {visiveis.map((a) => {
          const st = infoStatus(a.status)
          const quando = dataExibida(a)
          const atrasado = a.status === 'CONFIRMADO' && dataDeReferencia(a) < agora

          return (
            <article key={a.publicId} className="card adm-linha">
              <span className="adm-linha-icone"><Icone nome="exame" /></span>

              <div className="adm-linha-principal">
                <strong>{a.exameNome}</strong>
                <span>Paciente: {a.pacienteNome}</span>
              </div>

              <div className="adm-linha-quando">
                <strong>{textoDataHora(quando.iso)}</strong>
                <span>
                  {quando.sugerida ? '1ª data sugerida' : a.consultorio ? a.consultorio : 'Consultório não informado'}
                  {atrasado && ' • aguardando conclusão'}
                </span>
              </div>

              <span className={`status-badge ${st.classe}`}>{st.label}</span>

              <div className="adm-linha-links">
                <button type="button" className="adm-link" onClick={() => abrir(a)}>Ver Detalhes</button>
                {a.status === 'CONFIRMADO' && (
                  <button type="button" className="adm-link" onClick={() => abrir(a, 'remarcar')}>Remarcar</button>
                )}
                {podeCancelar(a) && (
                  <button type="button" className="adm-link perigo" onClick={() => abrir(a, 'cancelar')}>Cancelar</button>
                )}
              </div>
            </article>
          )
        })}
      </div>

      {lista.length > 0 && (
        <nav className="adm-paginacao" aria-label="Paginação">
          <span>
            Mostrando {inicio + 1}-{Math.min(inicio + POR_PAGINA, lista.length)} de {lista.length} agendamentos
          </span>
          <div className="adm-paginas">
            <button type="button" className="adm-pagina" disabled={paginaAtual === 1} onClick={() => setPagina(paginaAtual - 1)}>
              Anterior
            </button>
            {Array.from({ length: totalPaginas }, (_, i) => i + 1).map((n) => (
              <button
                key={n}
                type="button"
                className={`adm-pagina${n === paginaAtual ? ' ativa' : ''}`}
                aria-current={n === paginaAtual ? 'page' : undefined}
                onClick={() => setPagina(n)}
              >
                {n}
              </button>
            ))}
            <button type="button" className="adm-pagina" disabled={paginaAtual === totalPaginas} onClick={() => setPagina(paginaAtual + 1)}>
              Próximo
            </button>
          </div>
        </nav>
      )}

      {selecionado && (
        <AdminAgendamentoModal
          key={`${selecionado.publicId}-${detalhe.modo}`}
          agendamento={selecionado}
          modoInicial={detalhe.modo}
          onFechar={() => setDetalhe(null)}
          onConcluido={aoConcluirAcao}
        />
      )}
    </AdminLayout>
  )
}

export default AdminAgendamentos
