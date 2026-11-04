import './Header.css'
import { Hospital } from '@phosphor-icons/react'

// Visitante: só "Início" e "Entrar". Depois do login aparecem as funcionalidades e a aba Perfil.
const NAV_VISITANTE = [{ label: 'Início', key: 'home' }]

const NAV_LOGADO = [
  { label: 'Início', key: 'home' },
  { label: 'Agendar Exame', key: 'novo-exame' },
  { label: 'Consultar Exames', key: 'consultar-exames' },
  { label: 'Painel', key: 'painel' },
  { label: 'Perfil', key: 'perfil' },
]

function Header({ currentPage = 'home', onNavigate = () => {}, session = null, onLogout = () => {} }) {
  const navItems = session ? NAV_LOGADO : NAV_VISITANTE

  return (
    <header className="site-header">
      <div className="container header-container">
        <button type="button" className="brand" onClick={() => onNavigate('home')} aria-label="Ir para a página inicial">
          <span className="brand-mark" aria-hidden="true"><Hospital size={20} weight="fill" /></span>
          <span className="brand-text">Hospital Santa Cruz de Canoinhas</span>
        </button>

        <nav className="header-nav" aria-label="Navegação principal">
          {navItems.map((item) => (
            <button
              key={item.key}
              type="button"
              className={`nav-link ${currentPage === item.key ? 'active' : ''}`}
              aria-current={currentPage === item.key ? 'page' : undefined}
              onClick={() => onNavigate(item.key)}
            >
              {item.label}
            </button>
          ))}

          {session ? (
            <button
              type="button"
              className="btn btn-secondary btn-small header-login"
              onClick={onLogout}
              title={`Conectado como ${session.nome}`}
            >
              Sair
            </button>
          ) : (
            <button type="button" className="btn btn-secondary btn-small header-login" onClick={() => onNavigate('login')}>
              Entrar
            </button>
          )}
        </nav>
      </div>
    </header>
  )
}

export default Header
