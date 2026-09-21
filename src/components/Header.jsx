import './Header.css';

function Header() {
  return (
    <header className="header">
      <div className="header-container">

        <div className="header-logo">
          <div className="logo-icon">
            +
          </div>

          <span>Hospital Santa Cruz de Canoinhas</span>
        </div>

        <nav className="header-nav">
          <a href="#" className="help-link">
            Ajuda
          </a>

          <button className="login-button">
            Entrar
          </button>
        </nav>

      </div>
    </header>
  );
}

export default Header;