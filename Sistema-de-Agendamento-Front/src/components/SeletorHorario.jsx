import { useState } from 'react'
import './Agenda.css'
import CalendarioAgenda from './CalendarioAgenda'
import { useAgendaMes, useHorariosDia } from '../hooks/useAgenda'
import { dataIsoDe, dataPorExtensoIso, horaCurta, mesAtual, mesmoInstante } from '../utils/agenda'

/**
 * Escolha de data e horário a partir da agenda real do hospital: o paciente/recepção só enxerga
 * dias abertos e horários livres (o backend valida de novo ao salvar).
 *
 * - value / onChange: instante ISO do horário (o `dataHora` que o backend devolve, pronto para enviar);
 * - indisponiveis: horários que já foram escolhidos em outra opção (não podem repetir);
 * - horarioAtual: horário do próprio agendamento (na remarcação ele aparece ocupado, mas pode ser mantido).
 */
function SeletorHorario({ value = '', onChange, indisponiveis = [], horarioAtual = '', disabled = false }) {
  const [mes, setMes] = useState(() => (value ? mesDoInstante(value) : mesAtual()))
  const [dia, setDia] = useState(() => (value ? dataIsoDe(value) : ''))

  const { dias, erro: erroMes, carregando: carregandoMes } = useAgendaMes(mes.ano, mes.mes)
  const { horarios, erro: erroDia, carregando: carregandoDia } = useHorariosDia(dia)

  const livres = horarios?.horarios.filter((h) => h.situacao === 'LIVRE' || mesmoInstante(h.dataHora, horarioAtual)) ?? []

  return (
    <div className="agd-seletor">
      <CalendarioAgenda
        mes={mes}
        onMudarMes={setMes}
        dias={dias}
        selecionado={dia}
        onSelecionar={setDia}
        carregando={carregandoMes}
        desabilitado={(_, info) => disabled || Boolean(info && (!info.disponivel || info.totalHorarios === 0))}
      />

      <div className="agd-horarios" aria-live="polite">
        {(erroMes || erroDia) && <div className="alert alert-error" role="alert">{erroMes || erroDia}</div>}

        {!dia && <p className="agd-vazio">Escolha um dia no calendário para ver os horários livres.</p>}
        {dia && <h4>{dataPorExtensoIso(dia)}</h4>}
        {carregandoDia && <p className="agd-vazio">Carregando horários...</p>}

        {horarios && !horarios.disponivel && (
          <p className="agd-vazio">Não há atendimento neste dia{horarios.motivo ? `: ${horarios.motivo}` : '.'}</p>
        )}
        {horarios?.disponivel && livres.length === 0 && (
          <p className="agd-vazio">Todos os horários deste dia já foram ocupados ou passaram. Escolha outro dia.</p>
        )}

        {horarios?.disponivel && (
          <div className="agd-slots" role="group" aria-label="Horários do dia">
            {horarios.horarios.map((h) => {
              const permitido = h.situacao === 'LIVRE' || mesmoInstante(h.dataHora, horarioAtual)
              const repetido = indisponiveis.some((i) => mesmoInstante(i, h.dataHora))
              const escolhido = mesmoInstante(h.dataHora, value)
              const bloqueado = disabled || !permitido || (repetido && !escolhido)
              const classes = ['agd-slot']
              if (escolhido) classes.push('escolhido')
              if (!permitido) classes.push(h.situacao === 'OCUPADO' ? 'ocupado' : 'passado')

              let dica = ''
              if (!permitido) dica = h.situacao === 'OCUPADO' ? 'Horário já reservado' : 'Horário que já passou'
              else if (repetido && !escolhido) dica = 'Já escolhido em outra opção'

              return (
                <button
                  key={h.dataHora}
                  type="button"
                  className={classes.join(' ')}
                  disabled={bloqueado}
                  aria-pressed={escolhido}
                  title={dica}
                  onClick={() => onChange(h.dataHora)}
                >
                  {horaCurta(h.inicio)}
                </button>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}

function mesDoInstante(iso) {
  const [ano, mes] = dataIsoDe(iso).split('-').map(Number)
  return { ano, mes: mes - 1 }
}

export default SeletorHorario
