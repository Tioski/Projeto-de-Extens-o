import './Footer.css'

function Footer({ onNavigate = () => {} }) {
  return (
    <footer className="site-footer">
      <div className="container footer-main">
        <div className="footer-brand">
          <button type="button" className="footer-logo" onClick={() => onNavigate('home')} aria-label="Ir para a página inicial">
            Hospital Santa Cruz de Canoinhas
          </button>
          <p>
            Oferecendo cuidado humano, segurança e agilidade para cada etapa do seu atendimento.
          </p>
        </div>

        <nav className="footer-nav" aria-label="Navegação do rodapé">
          <div className="footer-nav-group">
            <h2>Serviços</h2>
            <button type="button" onClick={() => onNavigate('novo-exame')}>Agendar exame</button>
            <button type="button" onClick={() => onNavigate('consultar-exames')}>Consultar exames</button>
            <button type="button" onClick={() => onNavigate('painel')}>Meu painel</button>
          </div>

          <div className="footer-nav-group">
            <h2>Atendimento</h2>
            <button type="button" onClick={() => onNavigate('login')}>Entrar</button>
            <button type="button" onClick={() => onNavigate('cadastro')}>Criar conta</button>
            <button type="button" onClick={() => onNavigate('home')}>Ajuda</button>
          </div>
        </nav>
      </div>

      <div className="container footer-bottom">
        <div>
          <p>Horário de Atendimento</p>
          <p>Segunda a Sexta: 7h às 19h</p>
          <p>Sábado: 7h às 12h</p>
        </div>

        <div className="footer-contact">
          <p>Contato: (47) 3422-2233</p>
          <p>Rua das Flores, 145 — Centro, Canoinhas - SC</p>
        </div>
      </div>

      <div className="container footer-legal">
        <p>© 2026 Hospital Santa Cruz de Canoinhas. Todos os direitos reservados.</p>
      </div>
    </footer>
  )
}

export default Footer