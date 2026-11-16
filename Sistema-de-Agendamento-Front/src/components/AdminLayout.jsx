import './AdminLayout.css'
import Icone from './Icone'
import { ehCargoAdmin } from '../services/session'
import { dataIsoHoje, dataPorExtenso, iniciais } from '../utils/admin'

// Recepção e administrador têm as mesmas telas; o administrador troca "Pacientes" por "Usuários" e ganha "Exames".
const MENU_RECEPCAO = [
  { chave: 'recepcao', rotulo: 'Dashboard', icone: 'dashboard' },
  { chave: 'recepcao-agendamentos', rotulo: 'Agendamentos', icone: 'calendario' },
  { chave: 'recepcao-agenda', rotulo: 'Agenda', icone: 'relogio' },
  { chave: 'recepcao-pacientes', rotulo: 'Pacientes', icone: 'pacientes' },
]

const MENU_ADMIN = [
  { chave: 'recepcao', rotulo: 'Dashboard', icone: 'dashboard' },
  { chave: 'recepcao-agendamentos', rotulo: 'Agendamentos', icone: 'calendario' },
  { chave: 'recepcao-agenda', rotulo: 'Agenda', icone: 'relogio' },
  { chave: 'admin-usuarios', rotulo: 'Usuários', icone: 'pacientes' },
  { chave: 'admin-exames', rotulo: 'Exames', icone: 'exame' },
]

// Páginas que "pertencem" a cada item do menu (para marcar o item ativo).
const PAGINAS_DO_ITEM = {
  recepcao: ['recepcao'],
  'recepcao-agendamentos': ['recepcao-agendamentos'],
  'recepcao-agenda': ['recepcao-agenda'],
  'recepcao-pacientes': ['recepcao-pacientes', 'recepcao-novo-paciente'],
  'admin-usuarios': ['admin-usuarios', 'admin-novo-recepcionista', 'recepcao-novo-paciente'],
  'admin-exames': ['admin-exames'],
}

function AdminLayout({
  currentPage = 'recepcao',
  onNavigate = () => {},
  onLogout = () => {},
  session = null,
  titulo = '',
  subtitulo = '',
  children,
}) {
  const nome = session?.nome ?? 'Administrador'
  const ehAdmin = ehCargoAdmin(session?.cargo)
  const menu = ehAdmin ? MENU_ADMIN : MENU_RECEPCAO

  return (
    <div className="adm-shell">
      <aside className="adm-sidebar" aria-label="Menu da área administrativa">
        <div className="adm-marca">
          <span className="adm-marca-icone" aria-hidden="true">
            <Icone nome="hospital" tamanho={20} />
          </span>
          <div>
            <strong>Hospital Santa Cruz de Canoinhas</strong>
            <small>{ehAdmin ? 'ÁREA ADMIN' : 'ÁREA DA RECEPÇÃO'}</small>
          </div>
        </div>

        <nav className="adm-nav">
          {menu.map((item) => {
            const ativo = PAGINAS_DO_ITEM[item.chave]?.includes(currentPage)
            return (
              <button
                key={item.chave}
                type="button"
                className={`adm-nav-item${ativo ? ' ativo' : ''}`}
                aria-current={ativo ? 'page' : undefined}
                onClick={() => onNavigate(item.chave)}
              >
                <Icone nome={item.icone} />
                {item.rotulo}
              </button>
            )
          })}
        </nav>

        <div className="adm-usuario">
          <span className="adm-avatar" aria-hidden="true">{iniciais(nome)}</span>
          <div>
            <strong>{nome}</strong>
            <button type="button" className="adm-sair" onClick={onLogout}>
              <Icone nome="sair" tamanho={14} />
              Sair
            </button>
          </div>
        </div>
      </aside>

      <div className="adm-conteudo">
        <header className="adm-topo">
          <div>
            <h1>{titulo}</h1>
            {subtitulo && <p>{subtitulo}</p>}
          </div>
          <time className="adm-data" dateTime={dataIsoHoje()}>
            {dataPorExtenso()}
          </time>
        </header>

        <main className="adm-main" aria-label="Conteúdo da área administrativa">
          {children}
        </main>
      </div>
    </div>
  )
}

export default AdminLayout
