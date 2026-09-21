import './Footer.css';

function Footer() {
  return (
    <footer className="site-footer">
      <div className="footer-main">
        <div className="footer-brand">
          <a className="footer-logo" href="/" aria-label="Hospital Santa Cruz de Canoinhas">
            Hospital Santa Cruz de Canoinhas
          </a>
          <p>
            Oferecendo cuidados de saúde de excelência com agilidade,
            acolhimento e tecnologia para o seu bem-estar.
          </p>
        </div>

        <nav className="footer-nav" aria-label="Navegação do rodapé">
          <div className="footer-nav-group">
            <h2>Serviços</h2>
            <a href="#agendamento">Agendamento</a>
            <a href="#exames">Exames</a>
            <a href="#pronto-atendimento">Pronto Atendimento</a>
          </div>
          <div className="footer-nav-group">
            <h2>Portal</h2>
            <a href="#agendamento-online">Agendamento Online</a>
            <a href="#meus-agendamentos">Meus Agendamentos</a>
            <a href="#fale-conosco">Fale Conosco</a>
          </div>
        </nav>
      </div>

      <div className="footer-bottom">
        <p>&copy; 2026 Hospital Santa Cruz de Canoinhas. Todos os direitos reservados. CNPJ 83.192.096/0001-64</p>
        <div className="footer-legal">
          <a href="#termos-de-uso">Termos de Uso</a>
          <span aria-hidden="true">·</span>
          <a href="#politica-de-privacidade">Política de Privacidade</a>
        </div>
      </div>
    </footer>
  );
}

export default Footer;