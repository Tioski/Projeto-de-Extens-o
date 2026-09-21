import './Hero.css';

function HeroSection() {
  return (
    <section className="hero-section">
      <div className="hero-container">

        <div className="hero-content">
          <h1>
            Agende seu exame de forma
            <br />
            rápida e simples
          </h1>

          <p>
            No Hospital Santa Cruz de Canoinhas, sua saúde é nossa prioridade.
            Acesse<br />
            seu portal, escolha o exame desejado e agende sem filas ou burocracia.
          </p>

          <div className="hero-buttons">
            <button className="btn-primary">
              Agendar Exame
              <span>→</span>
            </button>

            <button className="btn-secondary">
              Meus Agendamentos
            </button>
          </div>
        </div>

        <div className="hero-image">
          <img
            src="/hospital.png"
            alt="Atendimento no Hospital Santa Cruz de Canoinhas"
          />
        </div>

      </div>
    </section>
  );
}

export default HeroSection;