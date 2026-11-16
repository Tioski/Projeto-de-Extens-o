import './Agenda.css'
import {
  DIAS_SEMANA_CURTO,
  colunaDoPrimeiroDia,
  compararMeses,
  dataIso,
  diasNoMes,
  hojeIso,
  mesAtual,
  nomeDoMes,
  somarMeses,
} from '../utils/agenda'

/**
 * Calendário mensal com a disponibilidade de cada dia.
 * - `dias`: { 'AAAA-MM-DD': DiaAgendaResponseDTO } do mês exibido;
 * - `desabilitado(dia, info)`: true para dias que não podem ser escolhidos;
 * - `mostrarAjustes`: marca com um ponto os dias que têm ajuste próprio (uso da recepção).
 */
function CalendarioAgenda({
  mes,
  onMudarMes,
  dias = {},
  selecionado = '',
  onSelecionar,
  desabilitado = () => false,
  carregando = false,
  mostrarAjustes = false,
}) {
  const hoje = hojeIso()
  const noMesAtual = compararMeses(mes, mesAtual()) <= 0
  const celulasVazias = colunaDoPrimeiroDia(mes.ano, mes.mes)
  const total = diasNoMes(mes.ano, mes.mes)

  return (
    <div className="agd-calendario" aria-busy={carregando}>
      <div className="agd-cal-topo">
        <button
          type="button"
          className="agd-cal-nav"
          aria-label="Mês anterior"
          disabled={noMesAtual}
          onClick={() => onMudarMes(somarMeses(mes, -1))}
        >
          ‹
        </button>
        <strong aria-live="polite">{nomeDoMes(mes.ano, mes.mes)}</strong>
        <button type="button" className="agd-cal-nav" aria-label="Próximo mês" onClick={() => onMudarMes(somarMeses(mes, 1))}>
          ›
        </button>
      </div>

      <div className="agd-cal-grade" role="grid">
        {DIAS_SEMANA_CURTO.map((d) => (
          <span key={d} className="agd-cal-semana" role="columnheader">{d}</span>
        ))}
        {Array.from({ length: celulasVazias }, (_, i) => (
          <span key={`v${i}`} aria-hidden="true" />
        ))}
        {Array.from({ length: total }, (_, i) => {
          const data = dataIso(mes.ano, mes.mes, i + 1)
          const info = dias[data]
          const passado = data < hoje
          const fechado = info ? !info.disponivel : false
          const lotado = info?.disponivel && info.totalHorarios > 0 && info.horariosLivres === 0
          const bloqueado = passado || desabilitado(data, info) || (!info && carregando)

          const classes = ['agd-dia']
          if (data === selecionado) classes.push('selecionado')
          if (data === hoje) classes.push('hoje')
          if (passado) classes.push('passado')
          else if (fechado) classes.push('fechado')
          else if (lotado) classes.push('lotado')
          if (mostrarAjustes && info?.personalizado) classes.push('ajustado')

          let dica = ''
          if (passado) dica = 'Dia que já passou'
          else if (fechado) dica = info.motivo ? `Fechado: ${info.motivo}` : 'Fechado'
          else if (lotado) dica = 'Sem horários livres'
          else if (info) dica = `${info.horariosLivres} de ${info.totalHorarios} horários livres`

          return (
            <button
              key={data}
              type="button"
              role="gridcell"
              className={classes.join(' ')}
              disabled={bloqueado}
              aria-pressed={data === selecionado}
              aria-label={`${i + 1} de ${nomeDoMes(mes.ano, mes.mes).toLowerCase()}${dica ? `. ${dica}` : ''}`}
              title={dica}
              onClick={() => onSelecionar(data)}
            >
              <span>{i + 1}</span>
              {info && !passado && !fechado && <small>{info.horariosLivres}</small>}
            </button>
          )
        })}
      </div>

      <ul className="agd-legenda" aria-label="Legenda do calendário">
        <li><i className="agd-cor livre" /> Com horários livres</li>
        <li><i className="agd-cor lotado" /> Sem horários</li>
        <li><i className="agd-cor fechado" /> Fechado</li>
        {mostrarAjustes && <li><i className="agd-cor ajustado" /> Ajuste próprio</li>}
      </ul>
    </div>
  )
}

export default CalendarioAgenda
