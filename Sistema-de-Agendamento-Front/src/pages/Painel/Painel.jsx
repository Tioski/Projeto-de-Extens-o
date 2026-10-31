import './Painel.css'
import { HOSPITAL } from '../../config/hospital'
import { useAgendamentos } from '../../hooks/useAgendamentos'
import { dataDeReferencia, formatarDataHora, infoStatus } from '../../utils/agendamento'

const doisDigitos = (n) => String(n).padStart(2, '0')

function PainelPage({ onNavigate = () => {} }) {
  const { agendamentos, nomeDoExame, carregando, erro } = useAgendamentos()

  const contar = (status) => agendamentos.filter((a) => a.status === status).length

  const resumo = [
    { label: 'Agendamentos', value: doisDigitos(agendamentos.length), detail: 'Total solicitado' },
    { label: 'Pendentes', value: doisDigitos(contar('PENDENTE')), detail: 'Aguardando confirmação' },
    { label: 'Concluídos', value: doisDigitos(contar('CONCLUIDO')), detail: 'Atendimentos realizados' },
  ]

  const proximos = agendamentos
    .filter((a) => a.status === 'PENDENTE' || a.status === 'CONFIRMADO')
    .sort((a, b) => dataDeReferencia(a) - dataDeReferencia(b))
    .slice(0, 5)

  return (
    <div className="page-shell">
      <div className="container page-section">
        <div className="page-header">
          <h1>Painel do paciente</h1>
          <p>Acompanhe seus exames, prazos e próximos atendimentos em um só lugar.</p>
        </div>

        {erro && <div className="alert alert-error" role="alert">{erro}</div>}

        <div className="summary-grid">
          {resumo.map((item) => (
            <article key={item.label} className="card summary-card">
              <span className="summary-label">{item.label}</span>
              <strong>{carregando ? '--' : item.value}</strong>
              <small>{item.detail}</small>
            </article>
          ))}
        </div>

        <div className="dashboard-grid dashboard-layout">
          <section className="card panel-card">
            <h3>Próximos exames</h3>
            {carregando && <p className="muted-text">Carregando agendamentos...</p>}
            {!carregando && !erro && proximos.length === 0 && (
              <p className="muted-text">Você ainda não tem exames pendentes ou confirmados.</p>
            )}
            <div className="card-list">
              {proximos.map((a) => {
                const status = infoStatus(a.status)
                return (
                  <div key={a.publicId} className="list-item">
                    <div>
                      <strong>{nomeDoExame(a.examePublicId)}</strong>
                      <p>
                        {a.status === 'CONFIRMADO'
                          ? `${formatarDataHora(a.dataConfirmada)}${a.consultorio ? ` • ${a.consultorio}` : ''}`
                          : 'Aguardando confirmação da recepção'}
                      </p>
                    </div>
                    <span className={`status-badge ${status.classe}`}>{status.label}</span>
                  </div>
                )
              })}
            </div>
          </section>

          <section className="card panel-card">
            <h3>Informações úteis</h3>
            <ul className="bullet-list">
              <li>Confirmação por e-mail e WhatsApp</li>
              <li>Chegue com 15 minutos de antecedência</li>
              <li>Leve documentos e encaminhamento, quando houver</li>
              <li>Em caso de alteração, contate a central de atendimento: {HOSPITAL.telefone}</li>
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
