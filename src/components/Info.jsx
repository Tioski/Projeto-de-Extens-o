import './Info.css'

const infoItems = [
  {
    icon: '◷',
    title: 'Horário de Atendimento',
    text: 'Segunda a Sexta: 7h às 19h\nSábado: 7h às 12h',
  },
  {
    icon: '☎',
    title: 'Contato',
    text: 'Central de atendimento\n(47) 3422-2233',
  },
  {
    icon: '⌂',
    title: 'Localização',
    text: 'Rua das Flores, 145\nCentro, Canoinhas - SC',
  },
]

function Info() {
  return (
    <section className="info-section">
      <div className="container">
        <div className="section-header">
          <h2>Informações úteis</h2>
        </div>

        <div className="info-grid">
          {infoItems.map((item) => (
            <article key={item.title} className="info-card card">
              <div className="info-icon" aria-hidden="true">{item.icon}</div>
              <h3>{item.title}</h3>
              <p>{item.text.split('\n').map((line, index) => <span key={`${item.title}-${index}`}>{line}<br /></span>)}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  )
}

export default Info