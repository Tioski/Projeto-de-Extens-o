import './Admin.css'
import AdminLayout from '../../components/AdminLayout'
import Icone from '../../components/Icone'
import { useAdminAgendamentos } from '../../hooks/useAdminAgendamentos'
import { infoStatus } from '../../utils/agendamento'
import {
  agoraData,
  contarPorStatus,
  iniciais,
  mesmoDia,
  primeiroNome,
  saudacao,
  textoDataHora,
} from '../../utils/admin'

const DIAS_SEMANA = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom']

// Segunda-feira (00:00) da semana atual, no fuso do navegador.
function inicioDaSemana(referencia = new Date()) {
  const inicio = new Date(referencia)
  inicio.setHours(0, 0, 0, 0)
  const diaDaSemana = (inicio.getDay() + 6) % 7 // segunda = 0
  inicio.setDate(inicio.getDate() - diaDaSemana)
  return inicio
}

function CartaoNumero({ rotulo, valor, detalhe, icone, tom, tomDetalhe, carregando }) {
  return (
    <article className="card adm-stat">
      <div className="adm-stat-topo">
        <span className="adm-stat-rotulo">{rotulo}</span>
        <span className={`adm-stat-icone ${tom}`}><Icone nome={icone} /></span>
      </div>
      <strong>{carregando ? '--' : valor}</strong>
      <small className={tomDetalhe}>{detalhe}</small>
    </article>
  )
}

function AdminDashboard({ session = null, currentPage = 'recepcao', onNavigate = () => {}, onLogout = () => {} }) {
  const { agendamentos, carregando, erro } = useAdminAgendamentos()

  const agora = agoraData()
  const contagem = contarPorStatus(agendamentos)
  const realizaveis = agendamentos.filter((a) => a.status === 'CONFIRMADO' || a.status === 'CONCLUIDO')

  // Agenda de hoje: exames marcados para hoje (confirmados ou já concluídos).
  const deHoje = realizaveis.filter((a) => mesmoDia(a.dataConfirmada, agora))
  const aAtenderHoje = deHoje.filter((a) => a.status === 'CONFIRMADO').length

  // "Atendido" conta no dia em que a recepção concluiu o exame (e não no dia em que ele estava marcado).
  const diaDoAtendimento = (a) => a.alteradoEm ?? a.dataConfirmada
  const concluidosHoje = agendamentos.filter(
    (a) => a.status === 'CONCLUIDO' && mesmoDia(diaDoAtendimento(a), agora),
  ).length

  const proximos = agendamentos
    .filter((a) => a.status === 'CONFIRMADO' && new Date(a.dataConfirmada) >= agora)
    .sort((a, b) => new Date(a.dataConfirmada) - new Date(b.dataConfirmada))
    .slice(0, 5)

  // Semana atual: por dia, quantos exames foram concluídos e quantos ainda estão agendados (confirmados).
  const inicioSemana = inicioDaSemana(agora)
  const todosOsDias = DIAS_SEMANA.map((dia, i) => {
    const data = new Date(inicioSemana)
    data.setDate(data.getDate() + i)
    return {
      dia,
      concluidos: agendamentos.filter((a) => a.status === 'CONCLUIDO' && mesmoDia(diaDoAtendimento(a), data)).length,
      agendados: agendamentos.filter((a) => a.status === 'CONFIRMADO' && mesmoDia(a.dataConfirmada, data)).length,
    }
  })
  // Sábado e domingo só aparecem se tiverem movimento.
  const porDia = todosOsDias.filter((d, i) => i < 5 || d.concluidos + d.agendados > 0)
  const maximo = Math.max(1, ...porDia.map((d) => d.concluidos + d.agendados))

  return (
    <AdminLayout
      currentPage={currentPage}
      onNavigate={onNavigate}
      onLogout={onLogout}
      session={session}
      titulo={`${saudacao(agora)}, ${primeiroNome(session?.nome) || 'Administrador'}`}
      subtitulo="Aqui está o panorama geral do Hospital Santa Cruz de Canoinhas para hoje."
    >
      {erro && <div className="alert alert-error" role="alert">{erro}</div>}

      <div className="adm-cards">
        <CartaoNumero
          rotulo="Agendamentos Hoje"
          valor={deHoje.length}
          detalhe={`${aAtenderHoje} ainda por atender`}
          icone="calendario"
          tom="tom-primario"
          carregando={carregando}
        />
        <CartaoNumero
          rotulo="Pacientes Atendidos"
          valor={concluidosHoje}
          detalhe={`${contagem.CONCLUIDO} concluídos no total`}
          icone="pacientes"
          tom="tom-confirmado"
          carregando={carregando}
        />
        <CartaoNumero
          rotulo="Pendentes"
          valor={contagem.PENDENTE}
          detalhe="Aguardando confirmação"
          tomDetalhe="texto-pendente"
          icone="relogio"
          tom="tom-pendente"
          carregando={carregando}
        />
        <CartaoNumero
          rotulo="Cancelamentos"
          valor={contagem.CANCELADO}
          detalhe={`${contagem.RECUSADO} recusados`}
          tomDetalhe="texto-cancelado"
          icone="cancelado"
          tom="tom-cancelado"
          carregando={carregando}
        />
      </div>

      <div className="adm-dashboard">
        <section className="card adm-painel" aria-labelledby="adm-proximos">
          <div className="adm-painel-topo">
            <h2 id="adm-proximos">Próximos Atendimentos</h2>
            <button type="button" className="adm-link" onClick={() => onNavigate('recepcao-agendamentos')}>
              Ver Agenda Completa
            </button>
          </div>

          {carregando && <p className="adm-vazio">Carregando agendamentos...</p>}
          {!carregando && !erro && proximos.length === 0 && (
            <p className="adm-vazio">Nenhum atendimento confirmado pela frente.</p>
          )}

          <div className="adm-lista">
            {proximos.map((a) => {
              const status = infoStatus(a.status)
              return (
                <div key={a.publicId} className="adm-atendimento">
                  <span className="adm-letra" aria-hidden="true">{iniciais(a.pacienteNome).charAt(0)}</span>
                  <div className="adm-atendimento-texto">
                    <strong>{a.pacienteNome}</strong>
                    <span>
                      {a.exameNome} • {textoDataHora(a.dataConfirmada)}
                      {a.consultorio ? ` • ${a.consultorio}` : ''}
                    </span>
                  </div>
                  <span className={`status-badge ${status.classe}`}>{status.label}</span>
                </div>
              )
            })}
          </div>
        </section>

        <div className="adm-coluna">
          <section className="card adm-painel" aria-labelledby="adm-semana">
            <div className="adm-painel-topo">
              <h2 id="adm-semana">Resumo Semanal</h2>
            </div>
            <div
              className="adm-grafico"
              role="img"
              aria-label={`Exames da semana: ${porDia
                .map((d) => `${d.dia}, ${d.concluidos} concluídos e ${d.agendados} agendados`)
                .join('; ')}`}
            >
              {porDia.map((d) => {
                const total = d.concluidos + d.agendados
                return (
                  <div key={d.dia} className="adm-barra-item">
                    <span className="adm-barra-valor">{total}</span>
                    {total === 0 ? (
                      <div className="adm-barra vazia" />
                    ) : (
                      <div className="adm-pilha" style={{ height: `${Math.max(10, Math.round((total / maximo) * 110))}px` }}>
                        {d.agendados > 0 && <div className="adm-seg-agendado" style={{ flex: d.agendados }} />}
                        {d.concluidos > 0 && <div className="adm-seg-concluido" style={{ flex: d.concluidos }} />}
                      </div>
                    )}
                    <span className="adm-barra-dia">{d.dia}</span>
                  </div>
                )
              })}
            </div>
            <ul className="adm-legenda" aria-hidden="true">
              <li><span className="adm-legenda-cor concluido" /> Concluídos</li>
              <li><span className="adm-legenda-cor agendado" /> Agendados</li>
            </ul>
          </section>

          <section className="card adm-painel" aria-labelledby="adm-acoes">
            <div className="adm-painel-topo">
              <h2 id="adm-acoes">Ações Rápidas</h2>
            </div>
            <div className="adm-acoes-rapidas">
              <button type="button" className="btn btn-primary" onClick={() => onNavigate('recepcao-novo-paciente')}>
                <Icone nome="mais" /> Cadastrar Novo Paciente
              </button>
              <button type="button" className="btn btn-secondary" onClick={() => onNavigate('recepcao-agendamentos')}>
                <Icone nome="calendario" /> Ver Todos os Agendamentos
              </button>
            </div>
          </section>
        </div>
      </div>
    </AdminLayout>
  )
}

export default AdminDashboard
