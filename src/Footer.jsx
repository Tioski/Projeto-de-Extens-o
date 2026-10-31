import './Footer.css'
import { HOSPITAL } from './config/hospital'

function Footer({ onNavigate = () => {}, session = null }) {
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
          {session && (
            <div className="footer-nav-group">
              <h2>Serviços</h2>
              <button type="button" onClick={() => onNavigate('novo-exame')}>Agendar exame</button>
              <button type="button" onClick={() => onNavigate('consultar-exames')}>Consultar exames</button>
              <button type="button" onClick={() => onNavigate('painel')}>Meu painel</button>
              <button type="button" onClick={() => onNavigate('perfil')}>Meu perfil</button>
            </div>
          )}

          <div className="footer-nav-group">
            <h2>Atendimento</h2>
            {!session && <button type="button" onClick={() => onNavigate('login')}>Entrar</button>}
            {!session && <button type="button" onClick={() => onNavigate('cadastro')}>Criar conta</button>}
            <button type="button" onClick={() => onNavigate('home')}>Ajuda</button>
          </div>
        </nav>
      </div>

      <div className="container footer-bottom">
        <div>
          <p>Horário de Atendimento</p>
          <p>{HOSPITAL.horario.dias}: {HOSPITAL.horario.horas}</p>
        </div>

        <div className="footer-contact">
          <p>Contato: {HOSPITAL.telefone}</p>
          <p>{HOSPITAL.endereco.completo}</p>
        </div>
      </div>

      <div className="container footer-legal">
        <p>© 2026 Hospital Santa Cruz de Canoinhas. Todos os direitos reservados.</p>
      </div>
    </footer>
  )
}

export default Footer