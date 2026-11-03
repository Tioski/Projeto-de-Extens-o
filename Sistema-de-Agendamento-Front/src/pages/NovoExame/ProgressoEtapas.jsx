// Indicador do assistente de agendamento: os 4 passos (1 Exame, 2 Paciente...) e, logo abaixo deles,
// uma barra de progresso que avança conforme a pessoa passa de etapa.
function ProgressoEtapas({ etapas, atual, maiorEtapa, bloqueadas = 0, onIr }) {
  const total = etapas.length
  const porcentagem = Math.round((atual / total) * 100)
  const tituloAtual = etapas.find((e) => e.numero === atual)?.titulo ?? ''

  return (
    <nav className="progresso" aria-label="Etapas do agendamento">
      <ol className="progress-steps">
        {etapas.map((etapa) => {
          const estado = etapa.numero === atual ? 'active' : etapa.numero < atual ? 'done' : 'todo'
          // Só dá para voltar (ou pular para uma etapa já alcançada); as etapas travadas (reagendamento) não.
          const clicavel = etapa.numero !== atual && etapa.numero <= maiorEtapa && etapa.numero > bloqueadas

          return (
            <li key={etapa.numero}>
              <button
                type="button"
                className={`step ${estado}`}
                disabled={!clicavel}
                aria-current={estado === 'active' ? 'step' : undefined}
                onClick={() => onIr(etapa.numero)}
              >
                <span aria-hidden="true">{estado === 'done' ? '✓' : etapa.numero}</span>
                <small>{etapa.titulo}</small>
              </button>
            </li>
          )
        })}
      </ol>

      <div
        className="progress-bar"
        role="progressbar"
        aria-label="Progresso do agendamento"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={porcentagem}
        aria-valuetext={`Etapa ${atual} de ${total}: ${tituloAtual}`}
      >
        <div className="progress-bar-fill" style={{ '--etapa': atual }} />
      </div>

      <p className="progress-status" aria-hidden="true">
        Etapa {atual} de {total} · {tituloAtual}
      </p>
    </nav>
  )
}

export default ProgressoEtapas
