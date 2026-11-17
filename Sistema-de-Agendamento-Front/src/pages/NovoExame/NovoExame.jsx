import { useEffect, useRef, useState } from 'react'
import './NovoExame.css'
import { agendamentoApi, exameApi, pacienteApi } from '../../services/api'
import { ROTULOS_PARENTESCO } from '../../utils/agendamento'
import { montarOpcoesParaApi, opcoesPreenchidas, validarOpcoesDeData } from '../../utils/datas'
import ProgressoEtapas from './ProgressoEtapas'
import EtapaExame from './etapas/EtapaExame'
import EtapaPaciente from './etapas/EtapaPaciente'
import EtapaDataHorario from './etapas/EtapaDataHorario'
import EtapaConfirmacao from './etapas/EtapaConfirmacao'

const ETAPAS = [
  { numero: 1, titulo: 'Exame' },
  { numero: 2, titulo: 'Paciente' },
  { numero: 3, titulo: 'Data e Horário' },
  { numero: 4, titulo: 'Confirmação' },
]

function NovoExamePage({ onNavigate = () => {}, params = null }) {
  // Vindo de "Consultar exames": o exame e o paciente já chegam escolhidos.
  // - modo 'reagendar': troca o agendamento atual por um novo (exame e paciente ficam fixos, etapas 1 e 2 travadas);
  // - modo 'novo' (exame concluído): nova solicitação com exame e paciente pré-selecionados.
  const base = params?.agendamento ?? null
  const reagendando = params?.modo === 'reagendar' ? base : null
  const etapaInicial = base ? 3 : 1

  const [etapa, setEtapa] = useState(etapaInicial)
  const [maiorEtapa, setMaiorEtapa] = useState(etapaInicial)

  const [exames, setExames] = useState([])
  const [pacientes, setPacientes] = useState([])
  const [carregando, setCarregando] = useState(true)
  const [erroCarga, setErroCarga] = useState('')

  const [exameId, setExameId] = useState(base?.examePublicId ?? '')
  const [pacienteId, setPacienteId] = useState('')
  const [datas, setDatas] = useState(['', '', ''])
  const [erroDatas, setErroDatas] = useState('')
  const [observacao, setObservacao] = useState('')
  const [enviando, setEnviando] = useState(false)
  const [erroEnvio, setErroEnvio] = useState('')

  const primeiraRenderizacao = useRef(true)

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

  // A cada troca de etapa, leva o foco (e a rolagem) para o título da nova tela.
  useEffect(() => {
    if (primeiraRenderizacao.current) {
      primeiraRenderizacao.current = false
      return
    }
    const titulo = document.getElementById('etapa-titulo')
    titulo?.focus({ preventScroll: true })
    // Rola até a barra de progresso (e não até o título) para que os passos continuem visíveis.
    document.querySelector('.progresso')?.scrollIntoView({ block: 'start', behavior: 'auto' })
  }, [etapa])

  const exameSelecionado = exames.find((e) => e.publicId === exameId)
  const pacienteSelecionado = pacientes.find((p) => p.publicId === pacienteId)
  const contexto = {
    exame: exameSelecionado?.nome ?? '—',
    paciente: pacienteSelecionado
      ? `${pacienteSelecionado.nome} (${ROTULOS_PARENTESCO[pacienteSelecionado.parentesco] ?? pacienteSelecionado.parentesco})`
      : '—',
  }

  const irPara = (numero) => {
    setErroEnvio('')
    setEtapa(numero)
    setMaiorEtapa((atual) => Math.max(atual, numero))
  }

  const escolherExame = (id) => {
    setExameId(id)
    irPara(2)
  }

  const escolherPaciente = (id) => {
    setPacienteId(id)
    irPara(3)
  }

  const dependenteSalvo = (novo) => {
    setPacientes((atual) => [...atual, novo])
    setPacienteId(novo.publicId)
    irPara(3)
  }

  const alterarData = (indice, valor) => {
    setDatas((atual) => atual.map((v, i) => (i === indice ? valor : v)))
    setErroDatas('')
  }

  const continuarDatas = () => {
    const erro = validarOpcoesDeData(datas)
    setErroDatas(erro)
    if (erro) return
    irPara(4)
  }

  const confirmar = async () => {
    setErroEnvio('')

    // Confere de novo antes de enviar (por exemplo, se a pessoa voltou etapas e limpou algo).
    const erro = validarOpcoesDeData(datas)
    if (!exameId || !pacienteId || erro) {
      setErroDatas(erro)
      setEtapa(!exameId ? 1 : !pacienteId ? 2 : 3)
      return
    }

    setEnviando(true)
    try {
      const dados = {
        ...montarOpcoesParaApi(opcoesPreenchidas(datas)),
        observacao: observacao.trim() || null,
      }

      if (reagendando) {
        // O backend cria a nova solicitação e apaga a anterior na mesma operação.
        await agendamentoApi.reagendar(reagendando.publicId, dados)
        onNavigate('consultar-exames')
      } else {
        await agendamentoApi.criar({ pacientePublicId: pacienteId, examePublicId: exameId, ...dados })
        onNavigate('painel')
      }
    } catch (e) {
      setErroEnvio(e.message)
      setEnviando(false)
    }
  }

  const cancelar = () => onNavigate(base ? 'consultar-exames' : 'painel')

  return (
    <div className="page-shell">
      <div className="container page-section novo-exame-page">
        <div className="page-header">
          <h1>{reagendando ? 'Reagendar exame' : 'Novo exame'}</h1>
          <p>
            {reagendando
              ? 'O exame e o paciente já estão definidos. Informe as novas datas e horários e confirme: o agendamento anterior será substituído.'
              : 'Siga as etapas: escolha o exame e o paciente, informe quando prefere fazer e confirme a solicitação.'}
          </p>
        </div>

        <ProgressoEtapas
          etapas={ETAPAS}
          atual={etapa}
          maiorEtapa={maiorEtapa}
          bloqueadas={reagendando ? 2 : 0}
          onIr={irPara}
        />

        {erroCarga && <div className="alert alert-error" role="alert">{erroCarga}</div>}

        <section className="card etapa-card" aria-labelledby="etapa-titulo">
          {etapa === 1 && (
            <EtapaExame
              exames={exames}
              exameId={exameId}
              carregando={carregando}
              onEscolher={escolherExame}
              onContinuar={() => irPara(2)}
              onCancelar={cancelar}
            />
          )}

          {etapa === 2 && (
            <EtapaPaciente
              pacientes={pacientes}
              pacienteId={pacienteId}
              carregando={carregando}
              onEscolher={escolherPaciente}
              onDependenteSalvo={dependenteSalvo}
              onVoltar={() => irPara(1)}
              onContinuar={() => irPara(3)}
            />
          )}

          {etapa === 3 && (
            <EtapaDataHorario
              contexto={contexto}
              datas={datas}
              erro={erroDatas}
              observacao={observacao}
              reagendando={Boolean(reagendando)}
              horarioAtual={reagendando?.dataConfirmada ?? ''}
              onAlterarData={alterarData}
              onAlterarObservacao={setObservacao}
              onVoltar={reagendando ? null : () => irPara(2)}
              onCancelar={cancelar}
              onContinuar={continuarDatas}
            />
          )}

          {etapa === 4 && (
            <EtapaConfirmacao
              contexto={contexto}
              datas={datas}
              observacao={observacao}
              reagendando={Boolean(reagendando)}
              enviando={enviando}
              erro={erroEnvio}
              onVoltar={() => irPara(3)}
              onConfirmar={confirmar}
            />
          )}
        </section>
      </div>
    </div>
  )
}

export default NovoExamePage
