import './Info.css';

function Info() {
  return (
    <section className="info-section">
      <div className="info-container">

        <h2>Informações Úteis</h2>

        <div className="info-cards">

          {/* Horário */}
          <div className="info-card">
            <div className="info-icon">
              ◷
            </div>

            <h3>Horário de Atendimento</h3>

            <p>
              Segunda a Sexta: 7h às 19h
              <br />
              Sábado: 7h às 12h
            </p>
          </div>

          {/* Telefone */}
          <div className="info-card">
            <div className="info-icon">
              ♧
            </div>

            <h3>Telefone</h3>

            <p>
              Central de Atendimento:
              <br />
              <strong>(11) 3456-7890</strong>
            </p>
          </div>

          {/* Endereço */}
          <div className="info-card">
            <div className="info-icon">
              ♧
            </div>

            <h3>Endereço</h3>

            <p>
              Av. Paulista, 1000
              <br />
              Bela Vista, São Paulo - SP
            </p>
          </div>

        </div>

      </div>
    </section>
  );
}

export default Info;