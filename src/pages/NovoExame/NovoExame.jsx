import './NovoExame.css'

const exames = [
  'Consulta de rotina',
  'Raio-X de tórax',
  'Ultrassonografia abdominal',
  'Hemograma completo',
  'Ecocardiograma',
]

const datas = ['18/09/2026', '20/09/2026', '22/09/2026', '24/09/2026']
const horarios = ['08:00', '09:30', '11:00', '14:10', '16:45']

function NovoExamePage({ onNavigate = () => {} }) {
  return (
    <div className="page-shell">
      <div className="container page-section novo-exame-page">
        <div className="page-header">
          <h1>Novo exame</h1>
          <p>Selecione o tipo de exame, data, horário e revise os dados antes de confirmar a solicitação.</p>
        </div>

        <div className="progress-steps" aria-label="Progresso do agendamento">
          <div className="step active"><span>1</span><small>Exame</small></div>
          <div className="step"><span>2</span><small>Dados</small></div>
          <div className="step"><span>3</span><small>Data e Horário</small></div>
          <div className="step"><span>4</span><small>Confirmação</small></div>
        </div>

        <div className="dashboard-grid novo-grid">
          <section className="card panel-card">
            <h3>1. Selecionar exame</h3>
            <div className="option-list">
              {exames.map((exame, index) => (
                <button key={exame} type="button" className={`option-button ${index === 0 ? 'selected' : ''}`}>
                  {exame}
                </button>
              ))}
            </div>
          </section>

          <section className="card panel-card">
            <h3>2. Informações</h3>
            <div className="field">
              <label htmlFor="nome-paciente">Nome completo</label>
              <input id="nome-paciente" type="text" placeholder="Digite seu nome" />
            </div>
            <div className="field">
              <label htmlFor="cpf-paciente">CPF</label>
              <input id="cpf-paciente" type="text" placeholder="000.000.000-00" />
            </div>
            <div className="field">
              <label htmlFor="telefone-paciente">Telefone</label>
              <input id="telefone-paciente" type="tel" placeholder="(47) 99999-9999" />
            </div>
          </section>

          <section className="card panel-card">
            <h3>3. Data e horário</h3>
            <div className="field">
              <label htmlFor="data-exame">Data</label>
              <select id="data-exame" defaultValue="20/09/2026">
                {datas.map((data) => (
                  <option key={data} value={data}>{data}</option>
                ))}
              </select>
            </div>
            <div className="field">
              <label htmlFor="horario-exame">Horário</label>
              <select id="horario-exame" defaultValue="09:30">
                {horarios.map((horario) => (
                  <option key={horario} value={horario}>{horario}</option>
                ))}
              </select>
            </div>
          </section>

          <section className="card panel-card confirmation-panel">
            <h3>4. Confirmar solicitação</h3>
            <div className="confirmation-summary">
              <div><span>Exame</span><strong>Consulta de rotina</strong></div>
              <div><span>Data</span><strong>20/09/2026</strong></div>
              <div><span>Horário</span><strong>09:30</strong></div>
              <div><span>Local</span><strong>Unidade Central</strong></div>
            </div>
            <div className="inline-actions">
              <button type="button" className="btn btn-primary" onClick={() => onNavigate('painel')}>Confirmar agendamento</button>
              <button type="button" className="btn btn-secondary" onClick={() => onNavigate('consultar-exames')}>Consultar exames</button>
            </div>
          </section>
        </div>
      </div>
    </div>
  )
}

export default NovoExamePage
