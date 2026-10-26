import './Header.css'

function Header({ currentPage = 'home', onNavigate = () => {}, session = null, onLogout = () => {} }) {
  const navItems = [
    { label: 'Início', key: 'home' },
    { label: 'Agendar Exame', key: 'novo-exame' },
    { label: 'Consultar Exames', key: 'consultar-exames' },
    { label: 'Painel', key: 'painel' },
  ]

  return (
    <header className="site-header">
      <div className="container header-container">
        <button type="button" className="brand" onClick={() => onNavigate('home')} aria-label="Ir para a página inicial">
          <span className="brand-mark" aria-hidden="true">+</span>
          <span className="brand-text">Hospital Santa Cruz de Canoinhas</span>
        </button>

        <nav className="header-nav" aria-label="Navegação principal">
          {navItems.map((item) => (
            <button
              key={item.key}
              type="button"
              className={`nav-link ${currentPage === item.key ? 'active' : ''}`}
              onClick={() => onNavigate(item.key)}
            >
              {item.label}
            </button>
          ))}

          <button type="button" className="nav-help" onClick={() => onNavigate('login')}>
            Ajuda
          </button>

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
