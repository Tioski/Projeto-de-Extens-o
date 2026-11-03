import { formatarDataHoraLocal } from '../../../utils/datas'

// Etapa 4 — revisão e envio. Mostra somente as datas que a pessoa informou.
function EtapaConfirmacao({ contexto, datas, observacao, reagendando, enviando, erro, onVoltar, onConfirmar }) {
  const informadas = datas.filter(Boolean)

  return (
    <>
      <div className="etapa-cabecalho">
        <h2 id="etapa-titulo" tabIndex={-1}>4. {reagendando ? 'Confirme o reagendamento' : 'Confirme sua solicitação'}</h2>
        <p className="muted-text">Revise os dados abaixo. Se algo estiver errado, volte e corrija.</p>
      </div>

      <dl className="resumo">
        <div><dt>Exame</dt><dd>{contexto.exame}</dd></div>
        <div><dt>Paciente</dt><dd>{contexto.paciente}</dd></div>
        {informadas.map((valor, i) => (
          <div key={valor}>
            <dt>{informadas.length === 1 ? 'Data e horário desejados' : `${i + 1}ª opção`}</dt>
            <dd>{formatarDataHoraLocal(valor)}</dd>
          </div>
        ))}
        {observacao.trim() && (
          <div><dt>Observação</dt><dd>{observacao.trim()}</dd></div>
        )}
      </dl>

      <p className="muted-text">
        {reagendando
          ? 'Ao confirmar, o agendamento atual deixa de existir e uma nova solicitação fica aguardando a confirmação da recepção.'
          : 'Sua solicitação ficará pendente até a recepção confirmar uma das datas informadas.'}
      </p>

      {erro && <div className="alert alert-error" role="alert">{erro}</div>}

      <div className="etapa-acoes">
        <button type="button" className="btn btn-secondary" disabled={enviando} onClick={onVoltar}>Voltar</button>
        <button type="button" className="btn btn-primary" disabled={enviando} onClick={onConfirmar}>
          {enviando ? 'Enviando...' : reagendando ? 'Confirmar reagendamento' : 'Confirmar solicitação'}
        </button>
      </div>
    </>
  )
}

export default EtapaConfirmacao
