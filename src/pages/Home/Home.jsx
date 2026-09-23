import './Home.css'
import Hero from '../../components/Hero'
import Info from '../../components/Info'

const services = [
  { title: 'Agendar exame', description: 'Selecione o procedimento e escolha dia e horário com praticidade.', action: 'Iniciar agendamento' },
  { title: 'Consultar exames', description: 'Acompanhe solicitações e visualize seus próximos atendimentos.', action: 'Ver agenda' },
  { title: 'Painel do paciente', description: 'Monitore sua fila, status e informações essenciais em um só lugar.', action: 'Abrir painel' },
]

const examHighlights = [
  { label: 'Próximo exame', value: 'Raio-X de tórax', detail: '20/09 · 09:30' },
  { label: 'Atendimentos hoje', value: '18', detail: 'Paciente em espera' },
  { label: 'Tempo médio', value: '15 min', detail: 'Até confirmação' },
]

function HomePage({ onNavigate = () => {} }) {
  return (
    <div className="home-page page-shell">
      <Hero onNavigate={onNavigate} />
      <Info />

      <section className="section home-services">
        <div className="container">
          <div className="section-header">
            <h2>Serviços e acessos rápidos</h2>
            <p>Uma experiência simples para facilitar a marcação dos exames e acompanhar cada etapa do atendimento.</p>
          </div>

          <div className="service-grid">
            {services.map((service) => (
              <article key={service.title} className="card service-card">
                <div className="service-icon" aria-hidden="true">✦</div>
                <h3>{service.title}</h3>
                <p>{service.description}</p>
                <button type="button" className="btn btn-secondary" onClick={() => onNavigate(service.title.includes('Agendar') ? 'novo-exame' : service.title.includes('Consultar') ? 'consultar-exames' : 'painel')}>
                  {service.action}
                </button>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="section home-summary">
        <div className="container">
          <div className="summary-grid">
            {examHighlights.map((item) => (
              <article key={item.label} className="card summary-card">
                <span className="summary-label">{item.label}</span>
                <strong>{item.value}</strong>
                <small>{item.detail}</small>
              </article>
            ))}
          </div>
        </div>
      </section>
    </div>
  )
}

export default HomePage
