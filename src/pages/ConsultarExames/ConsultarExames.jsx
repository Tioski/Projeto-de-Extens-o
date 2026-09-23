import './ConsultarExames.css'

const exames = [
  { nome: 'Exame de Sangue Completo', data: '20/09/2026', horario: '09:30', status: 'Confirmado', local: 'Unidade Central' },
  { nome: 'Ultrassonografia Abdominal', data: '22/09/2026', horario: '14:10', status: 'Pendente', local: 'Imagem Diagnóstica' },
  { nome: 'Raio-X de Tórax', data: '24/09/2026', horario: '11:00', status: 'Em Atendimento', local: 'Radiologia' },
  { nome: 'Ecocardiograma', data: '26/09/2026', horario: '16:45', status: 'Concluído', local: 'Cardiologia' },
]

function ConsultarExamesPage({ onNavigate = () => {} }) {
  return (
    <div className="page-shell">
      <div className="container page-section consult-section">
        <div className="page-header">
          <h1>Consultar exames</h1>
          <p>Visualize os exames disponíveis e agendados, acompanhando status e informações importantes do seu atendimento.</p>
        </div>

        <div className="search-panel card">
          <label className="field search-wrap" htmlFor="buscar-exame">
            <span>Buscar exame</span>
            <input id="buscar-exame" className="search-input" type="text" placeholder="Digite o nome do exame" />
          </label>
        </div>

        <div className="exam-list">
          {exames.map((exame) => (
            <article key={`${exame.nome}-${exame.data}`} className="card exam-card">
              <div className="exam-header">
                <div>
                  <h3>{exame.nome}</h3>
                  <p>{exame.local}</p>
                </div>
                <span className={`status-badge ${
                  exame.status === 'Confirmado' ? 'status-confirmado' :
                  exame.status === 'Pendente' ? 'status-pendente' :
                  exame.status === 'Em Atendimento' ? 'status-atendimento' :
                  exame.status === 'Concluído' ? 'status-concluido' : 'status-cancelado'
                }`}>{exame.status}</span>
              </div>

              <div className="exam-meta">
                <div><span>Data</span><strong>{exame.data}</strong></div>
                <div><span>Horário</span><strong>{exame.horario}</strong></div>
                <div><span>Local</span><strong>{exame.local}</strong></div>
              </div>

              <div className="exam-actions">
                <button type="button" className="btn btn-secondary" onClick={() => onNavigate('novo-exame')}>
                  Agendar novamente
                </button>
                <button type="button" className="btn btn-primary" onClick={() => onNavigate('painel')}>
                  Detalhes
                </button>
              </div>
            </article>
          ))}
        </div>
      </div>
    </div>
  )
}

export default ConsultarExamesPage
