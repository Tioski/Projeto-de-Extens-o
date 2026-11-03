// Etapa 1 — escolha do exame. Ao tocar em um exame, o assistente já avança para a etapa 2.
function EtapaExame({ exames, exameId, carregando, onEscolher, onContinuar, onCancelar }) {
  return (
    <>
      <div className="etapa-cabecalho">
        <h2 id="etapa-titulo" tabIndex={-1}>1. Qual exame você deseja fazer?</h2>
        <p className="muted-text">Toque no exame para continuar.</p>
      </div>

      {carregando && <p className="muted-text">Carregando exames...</p>}
      {!carregando && exames.length === 0 && (
        <p className="muted-text">Nenhum exame disponível no momento. Tente novamente mais tarde.</p>
      )}

      <div className="option-grid">
        {exames.map((exame) => {
          const selecionado = exame.publicId === exameId
          return (
            <button
              key={exame.publicId}
              type="button"
              className={`option-button option-card ${selecionado ? 'selected' : ''}`}
              aria-pressed={selecionado}
              onClick={() => onEscolher(exame.publicId)}
            >
              <strong>{exame.nome}</strong>
              {exame.descricao && <small>{exame.descricao}</small>}
            </button>
          )
        })}
      </div>

      <div className="etapa-acoes">
        <button type="button" className="btn btn-secondary" onClick={onCancelar}>Cancelar</button>
        <button type="button" className="btn btn-primary" disabled={!exameId} onClick={onContinuar}>
          Continuar
        </button>
      </div>
    </>
  )
}

export default EtapaExame
