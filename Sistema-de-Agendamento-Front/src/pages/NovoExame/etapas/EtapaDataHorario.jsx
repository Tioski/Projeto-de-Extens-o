import { useRef } from 'react'
import { DATA_HORA_MAXIMA_INPUT } from '../../../config/agendamento'
import { agoraParaInput } from '../../../utils/agendamento'

const OPCOES = [
  { indice: 0, rotulo: '1ª opção', obrigatoria: true },
  { indice: 1, rotulo: '2ª opção', obrigatoria: false },
  { indice: 2, rotulo: '3ª opção', obrigatoria: false },
]

// Etapa 3 — datas e horários desejados. Só a 1ª opção é obrigatória; a 2ª e a 3ª são opcionais.
function EtapaDataHorario({
  contexto,
  datas,
  erros,
  observacao,
  reagendando,
  onAlterarData,
  onAlterarObservacao,
  onVoltar,
  onCancelar,
  onContinuar,
}) {
  const campos = useRef([])
  const minimo = agoraParaInput()

  // O navegador devolve "" quando o campo foi preenchido só em parte (ex.: dia e mês, sem ano).
  // `validity.badInput` permite avisar a pessoa em vez de ignorar o que ela começou a digitar.
  const continuar = () => {
    const incompletos = OPCOES.map(({ indice }) => Boolean(campos.current[indice]?.validity?.badInput))
    onContinuar(incompletos)
  }

  return (
    <>
      <div className="etapa-cabecalho">
        <h2 id="etapa-titulo" tabIndex={-1}>3. Quando você prefere fazer o exame?</h2>
        <p className="muted-text">
          {reagendando
            ? 'Informe as novas datas e horários. A 1ª opção é obrigatória; a 2ª e a 3ª são opcionais.'
            : 'Informe a data e o horário de sua preferência. A 1ª opção é obrigatória; a 2ª e a 3ª são opcionais e ajudam a recepção a encontrar um horário. A recepção confirmará uma delas.'}
        </p>
      </div>

      <dl className="etapa-contexto">
        <div><dt>Exame</dt><dd>{contexto.exame}</dd></div>
        <div><dt>Paciente</dt><dd>{contexto.paciente}</dd></div>
      </dl>

      <div className="datas-grid">
        {OPCOES.map(({ indice, rotulo, obrigatoria }) => {
          const id = `data-opcao-${indice + 1}`
          const erro = erros[indice]
          const preenchida = Boolean(datas[indice])

          return (
            <div key={id} className={`field ${erro ? 'error' : ''}`}>
              <div className="field-linha">
                <label htmlFor={id}>
                  {rotulo} <span className={obrigatoria ? 'tag-obrigatoria' : 'tag-opcional'}>{obrigatoria ? 'obrigatória' : 'opcional'}</span>
                </label>
                {!obrigatoria && preenchida && (
                  <button type="button" className="link-button link-limpar" aria-label={`Limpar ${rotulo}`} onClick={() => onAlterarData(indice, '')}>
                    Limpar
                  </button>
                )}
              </div>
              <input
                id={id}
                ref={(el) => {
                  campos.current[indice] = el
                }}
                type="datetime-local"
                min={minimo}
                max={DATA_HORA_MAXIMA_INPUT}
                value={datas[indice]}
                aria-invalid={erro ? true : undefined}
                aria-describedby={erro ? `${id}-erro` : undefined}
                onChange={(e) => onAlterarData(indice, e.target.value)}
              />
              {erro && <span id={`${id}-erro`} className="field-error" role="alert">{erro}</span>}
            </div>
          )
        })}
      </div>

      <div className="field">
        <label htmlFor="observacao">Observação (opcional)</label>
        <textarea
          id="observacao"
          rows={3}
          maxLength={500}
          placeholder="Ex.: prefiro horários pela manhã"
          value={observacao}
          onChange={(e) => onAlterarObservacao(e.target.value)}
        />
      </div>

      <div className="etapa-acoes">
        {onVoltar ? (
          <button type="button" className="btn btn-secondary" onClick={onVoltar}>Voltar</button>
        ) : (
          <button type="button" className="btn btn-secondary" onClick={onCancelar}>Cancelar</button>
        )}
        <button type="button" className="btn btn-primary" onClick={continuar}>Continuar</button>
      </div>
    </>
  )
}

export default EtapaDataHorario
