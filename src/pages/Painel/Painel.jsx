import './Painel.css'

const resumo = [
  { label: 'Agendamentos', value: '08', detail: 'Este mês' },
  { label: 'Pendentes', value: '02', detail: 'Aguardando confirmação' },
  { label: 'Concluídos', value: '05', detail: 'Últimos 30 dias' },
]

const agendamentos = [
  { nome: 'Raio-X de tórax', data: '20/09 • 09:30', status: 'Confirmado' },
  { nome: 'Hemograma completo', data: '22/09 • 14:00', status: 'Pendente' },
  { nome: 'Ultrassonografia abdominal', data: '24/09 • 10:15', status: 'Em Atendimento' },
]

function PainelPage({ onNavigate = () => {} }) {
  return (
    <div className="page-shell">
      <div className="container page-section">
        <div className="page-header">
          <h1>Painel do paciente</h1>
          <p>Acompanhe seus exames, prazos e próximos atendimentos em um só lugar.</p>
        </div>

        <div className="summary-grid">
          {resumo.map((item) => (
            <article key={item.label} className="card summary-card">
              <span className="summary-label">{item.label}</span>
              <strong>{item.value}</strong>
              <small>{item.detail}</small>
            </article>
          ))}
        </div>

        <div className="dashboard-grid dashboard-layout">
          <section className="card panel-card">
            <h3>Próximos exames</h3>
            <div className="card-list">
              {agendamentos.map((item) => (
                <div key={item.nome} className="list-item">
                  <div>
                    <strong>{item.nome}</strong>
                    <p>{item.data}</p>
                  </div>
                  <span className={`status-badge ${
                    item.status === 'Confirmado' ? 'status-confirmado' :
                    item.status === 'Pendente' ? 'status-pendente' : 'status-atendimento'
                  }`}>{item.status}</span>
                </div>
              ))}
            </div>
          </section>

          <section className="card panel-card">
            <h3>Informações úteis</h3>
            <ul className="bullet-list">
              <li>Confirmação por e-mail e WhatsApp</li>
              <li>Chegue com 15 minutos de antecedência</li>
              <li>Leve documentos e encaminhamento, quando houver</li>
              <li>Em caso de alteração, contate a central de atendimento</li>
            </ul>

            <div className="inline-actions">
              <button type="button" className="btn btn-primary" onClick={() => onNavigate('novo-exame')}>Novo exame</button>
              <button type="button" className="btn btn-secondary" onClick={() => onNavigate('consultar-exames')}>Consultar exames</button>
            </div>
          </section>
        </div>
      </div>
    </div>
  )
}

export default PainelPage
