import './Hero.css'

function HeroSection({ onNavigate = () => {} }) {
  return (
    <section className="hero-section">
      <div className="container hero-container">
        <div className="hero-content">
          <span className="eyebrow">Atendimento humanizado</span>
          <h1>Agende seu exame simples e seguro.</h1>
          <p>
            Acesse o portal do Hospital Santa Cruz de Canoinhas e agende sua avaliação com praticidade,
            rapidez e segurança.
          </p>

          <div className="hero-actions">
            <button type="button" className="btn btn-primary btn-large" onClick={() => onNavigate('novo-exame')}>
              Agendar Exame
              <span aria-hidden="true">→</span>
            </button>
            <button type="button" className="btn btn-secondary btn-large" onClick={() => onNavigate('consultar-exames')}>
              Consultar Exames
            </button>
          </div>
        </div>

        <div className="hero-visual" aria-label="Ilustração institucional do hospital">
          <img src="/hospital.jpg" alt="Fachada do Hospital Santa Cruz de Canoinhas" />
        </div>
      </div>
    </section>
  )
}

export default HeroSection