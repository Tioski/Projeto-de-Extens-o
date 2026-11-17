import { useState } from 'react'
import SeletorHorario from '../../../components/SeletorHorario'
import { formatarDataHora } from '../../../utils/agendamento'

const OPCOES = [
  { indice: 0, rotulo: '1ª opção', obrigatoria: true },
  { indice: 1, rotulo: '2ª opção', obrigatoria: false },
  { indice: 2, rotulo: '3ª opção', obrigatoria: false },
]

// Etapa 3 — dia e horário. Mesmo padrão da agenda da recepção: escolhe-se o dia no calendário e,
// em seguida, um dos horários livres daquele dia. Só a 1ª opção é obrigatória; a 2ª e a 3ª são opcionais.
function EtapaDataHorario({
  contexto,
  datas,
  erro,
  observacao,
  reagendando,
  horarioAtual,
  onAlterarData,
  onAlterarObservacao,
  onVoltar,
  onCancelar,
  onContinuar,
}) {
  const [opcaoAtiva, setOpcaoAtiva] = useState(0)
  const ativa = OPCOES[opcaoAtiva]

  return (
    <>
      <div className="etapa-cabecalho">
        <h2 id="etapa-titulo" tabIndex={-1}>3. Quando você prefere fazer o exame?</h2>
        <p className="muted-text">
          {reagendando
            ? 'Escolha o novo dia no calendário e depois um horário livre. A 1ª opção é obrigatória; a 2ª e a 3ª são opcionais.'
            : 'Escolha o dia no calendário e depois um horário livre. A 1ª opção é obrigatória; a 2ª e a 3ª são opcionais e ajudam a recepção a encontrar um horário. A recepção confirmará um deles.'}
        </p>
      </div>

      <dl className="etapa-contexto">
        <div><dt>Exame</dt><dd>{contexto.exame}</dd></div>
        <div><dt>Paciente</dt><dd>{contexto.paciente}</dd></div>
      </dl>

      <div>
        <div className="agd-opcoes" role="tablist" aria-label="Opções de data e horário">
          {OPCOES.map(({ indice, rotulo, obrigatoria }) => (
            <button
              key={indice}
              type="button"
              role="tab"
              aria-selected={indice === opcaoAtiva}
              className={`agd-opcao${indice === opcaoAtiva ? ' ativa' : ''}`}
              onClick={() => setOpcaoAtiva(indice)}
            >
              <span>{rotulo} · {obrigatoria ? 'obrigatória' : 'opcional'}</span>
              <strong>{datas[indice] ? formatarDataHora(datas[indice]) : 'Escolher'}</strong>
            </button>
          ))}
        </div>

        {!ativa.obrigatoria && datas[opcaoAtiva] && (
          <p className="opcao-limpar">
            <button type="button" className="link-button" onClick={() => onAlterarData(opcaoAtiva, '')}>
              Limpar a {ativa.rotulo}
            </button>
          </p>
        )}

        {/* key: cada opção abre o calendário no mês/dia do horário que ela já tem */}
        <SeletorHorario
          key={opcaoAtiva}
          value={datas[opcaoAtiva]}
          onChange={(valor) => onAlterarData(opcaoAtiva, valor)}
          indisponiveis={datas.filter((_, i) => i !== opcaoAtiva)}
          horarioAtual={horarioAtual}
        />
      </div>

      {erro && <div className="alert alert-error" role="alert">{erro}</div>}

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
        <button type="button" className="btn btn-primary" onClick={onContinuar}>Continuar</button>
      </div>
    </>
  )
}

export default EtapaDataHorario
