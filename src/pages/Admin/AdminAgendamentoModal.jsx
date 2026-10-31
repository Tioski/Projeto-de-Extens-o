import { useEffect, useRef, useState } from 'react'
import Icone from '../../components/Icone'
import { recepcaoApi } from '../../services/api'
import { agoraParaInput, formatarDataHora, infoStatus, inputParaIso } from '../../utils/agendamento'
import { dataPassou } from '../../utils/admin'
import { formatarCpf, formatarTelefone } from '../../utils/mascaras'

const TITULOS_MODO = {
  remarcar: 'Remarcar exame',
  recusar: 'Recusar solicitação',
  cancelar: 'Cancelar agendamento',
}

function Dado({ rotulo, valor, largo = false }) {
  return (
    <div className={largo ? 'largo' : undefined}>
      <dt>{rotulo}</dt>
      <dd>{valor || '—'}</dd>
    </div>
  )
}

/**
 * Detalhes de um agendamento + ações da recepção:
 * PENDENTE   -> confirmar (data + consultório + observação), recusar ou cancelar
 * CONFIRMADO -> marcar como concluído ou cancelar
 */
function AdminAgendamentoModal({ agendamento, modoInicial = 'detalhes', onFechar, onConcluido }) {
  const a = agendamento
  const status = infoStatus(a.status)
  const opcoes = [a.dataOpcao1, a.dataOpcao2, a.dataOpcao3]
  const passou = dataPassou

  const [modo, setModo] = useState(modoInicial) // 'detalhes' | 'recusar' | 'cancelar'
  const [opcao, setOpcao] = useState(() => {
    const indice = opcoes.findIndex((d) => !passou(d))
    return indice === -1 ? null : indice + 1
  })
  const [consultorio, setConsultorio] = useState(a.consultorio ?? '')
  const [observacao, setObservacao] = useState('')
  const [motivo, setMotivo] = useState('')
  const [novaData, setNovaData] = useState('')
  const [motivoRemarcacao, setMotivoRemarcacao] = useState('')
  const [enviando, setEnviando] = useState(false)
  const [erro, setErro] = useState('')
  const dialogo = useRef(null)

  const pendente = a.status === 'PENDENTE'
  const confirmado = a.status === 'CONFIRMADO'
  const rotuloObservacao = a.status === 'CANCELADO' || a.status === 'RECUSADO' ? 'Motivo' : 'Observação'

  // Foco no diálogo ao abrir.
  useEffect(() => {
    dialogo.current?.focus()
  }, [])

  // Fechamento com Esc (não fecha enquanto uma ação está sendo enviada).
  useEffect(() => {
    const aoTeclar = (e) => {
      if (e.key === 'Escape' && !enviando) onFechar()
    }
    document.addEventListener('keydown', aoTeclar)
    return () => document.removeEventListener('keydown', aoTeclar)
  }, [onFechar, enviando])

  const executar = async (acao, mensagem) => {
    setErro('')
    setEnviando(true)
    try {
      await acao()
      await onConcluido(mensagem)
    } catch (e) {
      setErro(e.message)
      setEnviando(false)
    }
  }

  const confirmar = (evento) => {
    evento.preventDefault()
    if (!opcao) {
      setErro('Todas as datas sugeridas já passaram. Recuse ou cancele a solicitação.')
      return
    }
    if (!consultorio.trim()) {
      setErro('Informe o consultório onde o exame será realizado.')
      return
    }
    executar(
      () =>
        recepcaoApi.confirmar(a.publicId, {
          opcaoEscolhida: opcao,
          consultorio: consultorio.trim(),
          observacao: observacao.trim() || null,
        }),
      'Agendamento confirmado. O paciente já vê a data e o consultório.',
    )
  }

  const concluir = () =>
    executar(() => recepcaoApi.concluir(a.publicId), 'Exame marcado como concluído.')

  const enviarMotivo = (evento) => {
    evento.preventDefault()
    if (!motivo.trim()) {
      setErro('Informe o motivo.')
      return
    }
    if (modo === 'recusar') {
      executar(() => recepcaoApi.recusar(a.publicId, motivo.trim()), 'Solicitação recusada.')
    } else {
      executar(() => recepcaoApi.cancelar(a.publicId, motivo.trim()), 'Agendamento cancelado.')
    }
  }

  const remarcar = (evento) => {
    evento.preventDefault()
    if (!novaData || new Date(novaData).getTime() <= Date.now()) {
      setErro('Informe uma nova data e horário no futuro.')
      return
    }
    if (!consultorio.trim()) {
      setErro('Informe o consultório onde o exame será realizado.')
      return
    }
    executar(
      () =>
        recepcaoApi.remarcar(a.publicId, {
          dataAgendada: inputParaIso(novaData),
          consultorio: consultorio.trim(),
          motivo: motivoRemarcacao.trim() || null,
        }),
      `Exame remarcado para ${formatarDataHora(inputParaIso(novaData))}. O paciente já vê a nova data.`,
    )
  }

  const voltar = () => {
    setModo('detalhes')
    setMotivo('')
    setNovaData('')
    setMotivoRemarcacao('')
    setErro('')
  }

  return (
    <div className="adm-overlay" onMouseDown={(e) => e.target === e.currentTarget && !enviando && onFechar()}>
      <div
        ref={dialogo}
        className="adm-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="adm-modal-titulo"
        tabIndex={-1}
      >
        <div className="adm-modal-topo">
          <div>
            <h2 id="adm-modal-titulo">
              {modo === 'remarcar' && pendente ? 'Confirmar em outra data' : (TITULOS_MODO[modo] ?? a.exameNome)}
            </h2>
            <p>
              {modo === 'detalhes' ? `Paciente: ${a.pacienteNome}` : `${a.exameNome} • ${a.pacienteNome}`}
            </p>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <span className={`status-badge ${status.classe}`}>{status.label}</span>
            <button type="button" className="adm-fechar" onClick={onFechar} disabled={enviando} aria-label="Fechar">
              <Icone nome="fechar" />
            </button>
          </div>
        </div>

        {modo === 'detalhes' && (
          <>
            <section className="adm-secao" aria-label="Dados do paciente">
              <h3>Paciente</h3>
              <dl className="adm-dl">
                <Dado rotulo="Nome" valor={a.pacienteNome} />
                <Dado rotulo="CPF" valor={formatarCpf(a.pacienteCpf)} />
                <Dado rotulo="Telefone" valor={formatarTelefone(a.pacienteTelefone)} />
                <Dado rotulo="E-mail" valor={a.pacienteEmail} />
              </dl>
            </section>

            <section className="adm-secao" aria-label="Dados do exame">
              <h3>Exame</h3>
              <dl className="adm-dl">
                <Dado rotulo="Exame" valor={a.exameNome} />
                <Dado rotulo="Solicitado em" valor={formatarDataHora(a.dataCriacao)} />
                {a.dataConfirmada && <Dado rotulo="Data confirmada" valor={formatarDataHora(a.dataConfirmada)} />}
                {a.consultorio && <Dado rotulo="Consultório" valor={a.consultorio} />}
                {a.observacao && <Dado rotulo={rotuloObservacao} valor={a.observacao} largo />}
              </dl>
            </section>

            {pendente && (
              <form className="adm-secao" onSubmit={confirmar} aria-label="Confirmar agendamento">
                <h3>Confirmar agendamento</h3>
                <fieldset className="adm-opcoes" disabled={enviando}>
                  <legend>Escolha uma das datas sugeridas pelo paciente</legend>
                  {opcoes.map((data, i) => (
                    <label
                      key={i}
                      className={`adm-opcao${passou(data) ? ' passada' : ''}${opcao === i + 1 ? ' marcada' : ''}`}
                    >
                      <input
                        type="radio"
                        name="opcao-data"
                        checked={opcao === i + 1}
                        disabled={passou(data)}
                        onChange={() => setOpcao(i + 1)}
                      />
                      <span>
                        Opção {i + 1}: {formatarDataHora(data)}
                        {passou(data) && ' (já passou)'}
                      </span>
                    </label>
                  ))}
                </fieldset>

                <div className="adm-form-grid">
                  <div className="field">
                    <label htmlFor="adm-consultorio">Consultório *</label>
                    <input
                      id="adm-consultorio"
                      type="text"
                      maxLength={100}
                      value={consultorio}
                      onChange={(e) => setConsultorio(e.target.value)}
                      placeholder="Ex.: Sala 204 - Bloco B"
                      disabled={enviando}
                    />
                  </div>
                  <div className="field">
                    <label htmlFor="adm-observacao">Observação (opcional)</label>
                    <input
                      id="adm-observacao"
                      type="text"
                      value={observacao}
                      onChange={(e) => setObservacao(e.target.value)}
                      placeholder="Ex.: chegar em jejum de 8 horas"
                      disabled={enviando}
                    />
                  </div>
                </div>

                {erro && <div className="alert alert-error" role="alert" style={{ marginTop: '1rem' }}>{erro}</div>}

                <div className="adm-modal-acoes">
                  <button type="submit" className="btn btn-primary" disabled={enviando}>
                    {enviando ? 'Confirmando...' : 'Confirmar agendamento'}
                  </button>
                  <button type="button" className="btn btn-secondary" disabled={enviando} onClick={() => { setModo('remarcar'); setErro('') }}>
                    Confirmar em outra data
                  </button>
                  <button type="button" className="btn btn-secondary" disabled={enviando} onClick={() => { setModo('recusar'); setErro('') }}>
                    Recusar
                  </button>
                  <button type="button" className="btn btn-danger" disabled={enviando} onClick={() => { setModo('cancelar'); setErro('') }}>
                    Cancelar
                  </button>
                </div>
              </form>
            )}

            {confirmado && (
              <div className="adm-secao">
                {erro && <div className="alert alert-error" role="alert">{erro}</div>}
                <div className="adm-modal-acoes">
                  <button type="button" className="btn btn-primary" disabled={enviando} onClick={concluir}>
                    {enviando ? 'Salvando...' : 'Marcar como concluído'}
                  </button>
                  <button type="button" className="btn btn-secondary" disabled={enviando} onClick={() => { setModo('remarcar'); setErro('') }}>
                    Remarcar
                  </button>
                  <button type="button" className="btn btn-danger" disabled={enviando} onClick={() => { setModo('cancelar'); setErro('') }}>
                    Cancelar agendamento
                  </button>
                </div>
              </div>
            )}

            {!pendente && !confirmado && (
              <div className="adm-modal-acoes">
                <button type="button" className="btn btn-secondary" onClick={onFechar}>Fechar</button>
              </div>
            )}
          </>
        )}

        {modo === 'remarcar' && (
          <form onSubmit={remarcar}>
            {a.dataConfirmada && (
              <p className="adm-dica" style={{ margin: '0 0 1rem' }}>
                Data atual: <strong>{formatarDataHora(a.dataConfirmada)}</strong>
                {a.consultorio ? ` • ${a.consultorio}` : ''}
              </p>
            )}
            <div className="adm-form-grid">
              <div className="field">
                <label htmlFor="adm-nova-data">Nova data e horário *</label>
                <input
                  id="adm-nova-data"
                  type="datetime-local"
                  min={agoraParaInput()}
                  value={novaData}
                  onChange={(e) => setNovaData(e.target.value)}
                  disabled={enviando}
                  autoFocus
                />
              </div>
              <div className="field">
                <label htmlFor="adm-remarcar-consultorio">Consultório *</label>
                <input
                  id="adm-remarcar-consultorio"
                  type="text"
                  maxLength={100}
                  value={consultorio}
                  onChange={(e) => setConsultorio(e.target.value)}
                  placeholder="Ex.: Sala 204 - Bloco B"
                  disabled={enviando}
                />
              </div>
              <div className="field largo">
                <label htmlFor="adm-remarcar-motivo">Motivo (opcional, o paciente verá)</label>
                <input
                  id="adm-remarcar-motivo"
                  type="text"
                  value={motivoRemarcacao}
                  onChange={(e) => setMotivoRemarcacao(e.target.value)}
                  placeholder="Ex.: equipamento em manutenção"
                  disabled={enviando}
                />
              </div>
            </div>

            {erro && <div className="alert alert-error" role="alert" style={{ marginTop: '1rem' }}>{erro}</div>}

            <div className="adm-modal-acoes">
              <button type="submit" className="btn btn-primary" disabled={enviando}>
                {enviando ? 'Salvando...' : 'Confirmar nova data'}
              </button>
              <button type="button" className="btn btn-secondary" disabled={enviando} onClick={voltar}>
                Voltar
              </button>
            </div>
          </form>
        )}

        {(modo === 'recusar' || modo === 'cancelar') && (
          <form onSubmit={enviarMotivo}>
            <div className="field">
              <label htmlFor="adm-motivo">
                {modo === 'recusar' ? 'Motivo da recusa' : 'Motivo do cancelamento'} *
              </label>
              <textarea
                id="adm-motivo"
                rows={3}
                value={motivo}
                onChange={(e) => setMotivo(e.target.value)}
                placeholder="O paciente verá este motivo"
                disabled={enviando}
                autoFocus
              />
            </div>

            {erro && <div className="alert alert-error" role="alert" style={{ marginTop: '1rem' }}>{erro}</div>}

            <div className="adm-modal-acoes">
              <button type="submit" className="btn btn-danger" disabled={enviando}>
                {enviando ? 'Salvando...' : modo === 'recusar' ? 'Confirmar recusa' : 'Confirmar cancelamento'}
              </button>
              <button type="button" className="btn btn-secondary" disabled={enviando} onClick={voltar}>
                Voltar
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}

export default AdminAgendamentoModal
