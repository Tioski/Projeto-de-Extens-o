import { useEffect, useState } from 'react'
import './NovoExame.css'
import { agendamentoApi, exameApi, pacienteApi } from '../../services/api'
import SeletorHorario from '../../components/SeletorHorario'
import { mascararCpf } from '../../utils/mascaras'
import {
  PARENTESCOS,
  ROTULOS_PARENTESCO as ROTULOS,
  formatarDataHora,
  hojeParaInput,
  inputParaIso,
  somenteDigitos,
  validarDatas,
  validarDependente,
} from '../../utils/agendamento'

const DEPENDENTE_VAZIO = { nome: '', cpf: '', dataNascimento: '', parentesco: 'FILHO', convenio: '' }

function NovoExamePage({ onNavigate = () => {}, params = null }) {
  // Vindo de "Consultar exames": o exame e o paciente já chegam escolhidos.
  // - modo 'reagendar': troca o agendamento atual por um novo (exame e paciente ficam fixos);
  // - modo 'novo' (exame concluído): nova solicitação com exame e paciente pré-selecionados.
  const base = params?.agendamento ?? null
  const reagendando = params?.modo === 'reagendar' ? base : null

  const [exames, setExames] = useState([])
  const [pacientes, setPacientes] = useState([])
  const [carregando, setCarregando] = useState(true)
  const [erroCarga, setErroCarga] = useState('')

  const [exameId, setExameId] = useState(base?.examePublicId ?? '')
  const [pacienteId, setPacienteId] = useState('')
  const [datas, setDatas] = useState(['', '', ''])
  const [opcaoAtiva, setOpcaoAtiva] = useState(0)
  const [observacao, setObservacao] = useState('')
  const [enviando, setEnviando] = useState(false)
  const [erroEnvio, setErroEnvio] = useState('')

  const [mostrarDependente, setMostrarDependente] = useState(false)
  const [dependente, setDependente] = useState(DEPENDENTE_VAZIO)
  const [salvandoDependente, setSalvandoDependente] = useState(false)
  const [erroDependente, setErroDependente] = useState('')

  useEffect(() => {
    let ativo = true

    Promise.all([exameApi.listar(), pacienteApi.listarMeus()])
      .then(([listaExames, listaPacientes]) => {
        if (!ativo) return
        setExames(listaExames)
        setPacientes(listaPacientes)
        const doAgendamento = base && listaPacientes.find((p) => p.publicId === base.pacientePublicId)
        const titular = listaPacientes.find((p) => p.parentesco === 'TITULAR') ?? listaPacientes[0]
        setPacienteId((doAgendamento ?? titular)?.publicId ?? '')
      })
      .catch((e) => {
        if (ativo) setErroCarga(e.message)
      })
      .finally(() => {
        if (ativo) setCarregando(false)
      })

    return () => {
      ativo = false
    }
  }, [base])

  const exameSelecionado = exames.find((e) => e.publicId === exameId)
  const pacienteSelecionado = pacientes.find((p) => p.publicId === pacienteId)

  // Escolhe o horário da opção ativa e avança para a próxima ainda vazia.
  const escolherHorario = (valor) => {
    const novas = datas.map((v, i) => (i === opcaoAtiva ? valor : v))
    setDatas(novas)
    const proxima = [1, 2, 0].map((d) => (opcaoAtiva + d) % 3).find((i) => !novas[i])
    if (proxima !== undefined) setOpcaoAtiva(proxima)
  }

  const alterarDependente = (campo, valor) => {
    setDependente((atual) => ({ ...atual, [campo]: valor }))
  }

  const handleSalvarDependente = async () => {
    setErroDependente('')

    const problema = validarDependente(dependente)
    if (problema) {
      setErroDependente(problema)
      return
    }

    setSalvandoDependente(true)

    try {
      const novo = await pacienteApi.cadastrarDependente({
        nome: dependente.nome.trim(),
        cpf: somenteDigitos(dependente.cpf) || null,
        dataNascimento: dependente.dataNascimento,
        parentesco: dependente.parentesco,
        convenio: dependente.convenio.trim() || null,
      })
      setPacientes((atual) => [...atual, novo])
      setPacienteId(novo.publicId)
      setDependente(DEPENDENTE_VAZIO)
      setMostrarDependente(false)
    } catch (e) {
      setErroDependente(e.message)
    } finally {
      setSalvandoDependente(false)
    }
  }

  const handleConfirmar = async () => {
    setErroEnvio('')

    if (!exameId) {
      setErroEnvio('Selecione um exame.')
      return
    }
    const problemaDatas = validarDatas(datas)
    if (problemaDatas) {
      setErroEnvio(problemaDatas)
      return
    }

    setEnviando(true)
    try {
      const dados = {
        dataOpcao1: inputParaIso(datas[0]),
        dataOpcao2: inputParaIso(datas[1]),
        dataOpcao3: inputParaIso(datas[2]),
        observacao: observacao.trim() || null,
      }

      if (reagendando) {
        // O backend cria a nova solicitação e apaga a anterior na mesma operação.
        await agendamentoApi.reagendar(reagendando.publicId, dados)
        onNavigate('consultar-exames')
      } else {
        await agendamentoApi.criar({ pacientePublicId: pacienteId || null, examePublicId: exameId, ...dados })
        onNavigate('painel')
      }
    } catch (e) {
      setErroEnvio(e.message)
    } finally {
      setEnviando(false)
    }
  }

  return (
    <div className="page-shell">
      <div className="container page-section novo-exame-page">
        <div className="page-header">
          <h1>{reagendando ? 'Reagendar exame' : 'Novo exame'}</h1>
          <p>
            {reagendando
              ? 'O exame e o paciente já estão definidos. Informe as três novas datas e horários e confirme: o agendamento anterior será substituído.'
              : 'Selecione o exame e o paciente, sugira três datas e horários e revise os dados antes de confirmar a solicitação.'}
          </p>
        </div>

        <div className="progress-steps" aria-label="Progresso do agendamento">
          <div className="step active"><span>1</span><small>Exame</small></div>
          <div className="step"><span>2</span><small>Paciente</small></div>
          <div className="step"><span>3</span><small>Data e Horário</small></div>
          <div className="step"><span>4</span><small>Confirmação</small></div>
        </div>

        {erroCarga && <div className="alert alert-error" role="alert">{erroCarga}</div>}
        {carregando && <p className="muted-text">Carregando...</p>}

        <div className="dashboard-grid novo-grid">
          <section className="card panel-card">
            <h3>1. {reagendando ? 'Exame' : 'Selecionar exame'}</h3>
            {reagendando && (
              <div className="confirmation-summary">
                <div><span>Exame a reagendar</span><strong>{exameSelecionado?.nome ?? '—'}</strong></div>
                {reagendando.dataConfirmada && (
                  <div><span>Data atual</span><strong>{formatarDataHora(reagendando.dataConfirmada)}</strong></div>
                )}
              </div>
            )}
            {!reagendando && (
              <div className="option-list">
                {exames.map((exame) => (
                  <button
                    key={exame.publicId}
                    type="button"
                    className={`option-button ${exame.publicId === exameId ? 'selected' : ''}`}
                    onClick={() => setExameId(exame.publicId)}
                    title={exame.descricao}
                  >
                    {exame.nome}
                  </button>
                ))}
              </div>
            )}
          </section>

          <section className="card panel-card">
            <h3>2. Paciente</h3>
            {reagendando && (
              <div className="confirmation-summary">
                <div>
                  <span>Quem fará o exame</span>
                  <strong>
                    {pacienteSelecionado
                      ? `${pacienteSelecionado.nome} (${ROTULOS[pacienteSelecionado.parentesco] ?? pacienteSelecionado.parentesco})`
                      : '—'}
                  </strong>
                </div>
              </div>
            )}
            {!reagendando && (
              <div className="field">
                <label htmlFor="paciente">Quem fará o exame?</label>
                <select id="paciente" value={pacienteId} onChange={(e) => setPacienteId(e.target.value)}>
                  {pacientes.map((p) => (
                    <option key={p.publicId} value={p.publicId}>
                      {p.nome} ({ROTULOS[p.parentesco] ?? p.parentesco})
                    </option>
                  ))}
                </select>
              </div>
            )}

            {!reagendando && (
              <button
                type="button"
                className="btn btn-secondary btn-small"
                onClick={() => setMostrarDependente((v) => !v)}
              >
                {mostrarDependente ? 'Fechar' : 'Adicionar dependente'}
              </button>
            )}

            {mostrarDependente && !reagendando && (
              <div style={{ marginTop: '1rem' }}>
                <div className="field">
                  <label htmlFor="dep-nome">Nome completo</label>
                  <input id="dep-nome" type="text" value={dependente.nome} onChange={(e) => alterarDependente('nome', e.target.value)} />
                </div>
                <div className="field">
                  <label htmlFor="dep-cpf">CPF (opcional)</label>
                  <input id="dep-cpf" type="text" inputMode="numeric" maxLength={14} placeholder="000.000.000-00" value={dependente.cpf} onChange={(e) => alterarDependente('cpf', mascararCpf(e.target.value))} />
                </div>
                <div className="field">
                  <label htmlFor="dep-nascimento">Data de nascimento</label>
                  <input id="dep-nascimento" type="date" max={hojeParaInput()} value={dependente.dataNascimento} onChange={(e) => alterarDependente('dataNascimento', e.target.value)} />
                </div>
                <div className="field">
                  <label htmlFor="dep-parentesco">Parentesco</label>
                  <select id="dep-parentesco" value={dependente.parentesco} onChange={(e) => alterarDependente('parentesco', e.target.value)}>
                    {PARENTESCOS.map((p) => (
                      <option key={p.value} value={p.value}>{p.label}</option>
                    ))}
                  </select>
                </div>
                <div className="field">
                  <label htmlFor="dep-convenio">Convênio (opcional)</label>
                  <input id="dep-convenio" type="text" value={dependente.convenio} onChange={(e) => alterarDependente('convenio', e.target.value)} />
                </div>

                {erroDependente && <div className="alert alert-error" role="alert">{erroDependente}</div>}

                <button type="button" className="btn btn-primary btn-small" disabled={salvandoDependente} onClick={handleSalvarDependente}>
                  {salvandoDependente ? 'Salvando...' : 'Salvar dependente'}
                </button>
              </div>
            )}
          </section>

          <section className="card panel-card">
            <h3>3. Datas e horários</h3>
            <p className="muted-text">Sugira três horários livres. A recepção confirmará um deles.</p>
            <div className="agd-opcoes" role="tablist" aria-label="Opções de data e horário">
              {datas.map((valor, indice) => (
                <button
                  key={indice}
                  type="button"
                  role="tab"
                  aria-selected={indice === opcaoAtiva}
                  className={`agd-opcao${indice === opcaoAtiva ? ' ativa' : ''}`}
                  onClick={() => setOpcaoAtiva(indice)}
                >
                  <span>{indice + 1}ª opção</span>
                  <strong>{valor ? formatarDataHora(valor) : 'Escolher'}</strong>
                </button>
              ))}
            </div>
            <SeletorHorario
              value={datas[opcaoAtiva]}
              onChange={escolherHorario}
              indisponiveis={datas.filter((_, i) => i !== opcaoAtiva)}
            />
            <div className="field">
              <label htmlFor="observacao">Observação (opcional)</label>
              <textarea id="observacao" rows={3} value={observacao} onChange={(e) => setObservacao(e.target.value)} />
            </div>
          </section>

          <section className="card panel-card confirmation-panel">
            <h3>4. {reagendando ? 'Confirmar reagendamento' : 'Confirmar solicitação'}</h3>
            <div className="confirmation-summary">
              <div><span>Exame</span><strong>{exameSelecionado?.nome ?? '—'}</strong></div>
              <div><span>Paciente</span><strong>{pacienteSelecionado?.nome ?? '—'}</strong></div>
              {datas.map((valor, indice) => (
                <div key={indice}>
                  <span>{indice + 1}ª opção</span>
                  <strong>{valor ? formatarDataHora(inputParaIso(valor)) : '—'}</strong>
                </div>
              ))}
            </div>

            {reagendando && (
              <p className="muted-text">
                Ao confirmar, o agendamento atual deixa de existir e uma nova solicitação fica aguardando a confirmação da recepção.
              </p>
            )}

            {erroEnvio && <div className="alert alert-error" role="alert">{erroEnvio}</div>}

            <div className="inline-actions">
              <button type="button" className="btn btn-primary" disabled={enviando || carregando} onClick={handleConfirmar}>
                {enviando ? 'Enviando...' : reagendando ? 'Confirmar reagendamento' : 'Confirmar agendamento'}
              </button>
              <button type="button" className="btn btn-secondary" onClick={() => onNavigate('consultar-exames')}>Consultar exames</button>
            </div>
          </section>
        </div>
      </div>
    </div>
  )
}

export default NovoExamePage
