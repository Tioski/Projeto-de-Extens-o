import './Info.css'
import { HOSPITAL } from '../config/hospital'

const infoItems = [
  {
    icon: '◷',
    title: 'Horário de Atendimento',
    text: `${HOSPITAL.horario.dias}\n${HOSPITAL.horario.horas}`,
  },
  {
    icon: '☎',
    title: 'Contato',
    text: `Central de atendimento\n${HOSPITAL.telefone}`,
  },
  {
    icon: '⌂',
    title: 'Localização',
    text: `${HOSPITAL.endereco.logradouro}\n${HOSPITAL.endereco.bairroCidade}\nCEP ${HOSPITAL.endereco.cep}`,
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