import './Home.css'
import { CalendarPlus, MagnifyingGlass, UserCircle } from '@phosphor-icons/react'
import Hero from '../../components/Hero'
import Info from '../../components/Info'
import { useAgendamentos } from '../../hooks/useAgendamentos'
import { dataDeReferencia, formatarDataHora } from '../../utils/agendamento'

const services = [
  { title: 'Agendar exame', icon: CalendarPlus, description: 'Selecione o procedimento e escolha dia e horário com praticidade.', action: 'Iniciar agendamento' },
  { title: 'Consultar exames', icon: MagnifyingGlass, description: 'Acompanhe solicitações e visualize seus próximos atendimentos.', action: 'Ver agenda' },
  { title: 'Painel do paciente', icon: UserCircle, description: 'Monitore sua fila, status e informações essenciais em um só lugar.', action: 'Abrir painel' },
]

// Resumo com dados reais do usuário logado (só é montado quando existe sessão).
function ResumoDoUsuario() {
  const { agendamentos, nomeDoExame, carregando, erro } = useAgendamentos()

  // Se a API falhar, a seção simplesmente não aparece (o Painel mostra o erro em detalhe).
  if (erro) return null

  const abertos = agendamentos.filter((a) => a.status === 'PENDENTE' || a.status === 'CONFIRMADO')
  const proximo = [...abertos].sort((a, b) => dataDeReferencia(a) - dataDeReferencia(b))[0]

  const itens = [
    {
      label: 'Próximo exame',
      value: proximo ? nomeDoExame(proximo.examePublicId) : 'Nenhum',
      detail: !proximo
        ? 'Sem solicitações em aberto'
        : proximo.status === 'CONFIRMADO'
          ? formatarDataHora(proximo.dataConfirmada)
          : 'Aguardando confirmação',
    },
    {
      label: 'Solicitações em aberto',
      value: String(abertos.length).padStart(2, '0'),
      detail: 'Pendentes ou confirmadas',
    },
    {
      label: 'Total de solicitações',
      value: String(agendamentos.length).padStart(2, '0'),
      detail: 'Desde o seu cadastro',
    },
  ]

  return (
    <section className="section home-summary">
      <div className="container">
        <div className="summary-grid">
          {itens.map((item) => (
            <article key={item.label} className="card summary-card">
              <span className="summary-label">{item.label}</span>
              <strong>{carregando ? '--' : item.value}</strong>
              <small>{carregando ? 'Carregando...' : item.detail}</small>
            </article>
          ))}
        </div>
      </div>
    </section>
  )
}

function HomePage({ onNavigate = () => {}, session = null }) {
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
            {services.map(({ icon: Icone, ...service }) => (
              <article key={service.title} className="card service-card">
                <div className="service-icon" aria-hidden="true"><Icone size={26} weight="duotone" /></div>
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

      {session && <ResumoDoUsuario />}
    </div>
  )
}

export default HomePage
