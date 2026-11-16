import { useEffect, useRef, useState } from 'react'
import './Admin.css'
import AdminLayout from '../../components/AdminLayout'
import SeletorHorario from '../../components/SeletorHorario'
import { exameApi, recepcaoApi } from '../../services/api'
import { buscarCep } from '../../services/viacep'
import {
  formatarDataHora,
  hojeParaInput,
  inputParaIso,
  somenteDigitos,
  validarCadastro,
} from '../../utils/agendamento'
import { formatarCpf, mascararCep, mascararCpf, mascararTelefone } from '../../utils/mascaras'

const PACIENTE_INICIAL = {
  nome: '',
  cpf: '',
  email: '',
  telefone: '',
  dataNascimento: '',
  senha: '',
  cep: '',
  logradouro: '',
  numero: '',
  complemento: '',
  bairro: '',
  cidade: '',
  estado: '',
}

const AGENDAMENTO_INICIAL = { exame: '', dataHora: '', consultorio: '', observacao: '' }

const MASCARAS = { cpf: mascararCpf, telefone: mascararTelefone, cep: mascararCep }

function Campo({ name, label, form, onChange, type = 'text', required = true, dica = null, ...resto }) {
  return (
    <div className="field">
      <label htmlFor={name}>{label}{required ? ' *' : ''}</label>
      <input id={name} name={name} type={type} value={form[name]} onChange={onChange} {...resto} />
      {dica?.msg && <small className={`adm-dica ${dica.tipo}`} role="status">{dica.msg}</small>}
    </div>
  )
}

function AdminNovoPaciente({ session = null, currentPage = 'recepcao-novo-paciente', onNavigate = () => {}, onLogout = () => {} }) {
  // etapa: 'paciente' -> 'agendamento' -> 'concluido'
  const [etapa, setEtapa] = useState('paciente')
  const [paciente, setPaciente] = useState(null) // titular devolvido pelo backend
  const [formPaciente, setFormPaciente] = useState(PACIENTE_INICIAL)
  const [formAgendamento, setFormAgendamento] = useState(AGENDAMENTO_INICIAL)
  const [exames, setExames] = useState([])
  const [erroExames, setErroExames] = useState('')
  const [agendado, setAgendado] = useState(null)
  const [erro, setErro] = useState('')
  const [enviando, setEnviando] = useState(false)
  const [cepStatus, setCepStatus] = useState({ tipo: '', msg: '' })
  const buscaCep = useRef(null)

  useEffect(() => () => buscaCep.current?.abort(), [])

  // Os exames só são necessários na segunda etapa, mas já carregam em segundo plano.
  useEffect(() => {
    let ativo = true
    exameApi
      .listar()
      .then((lista) => ativo && setExames(lista))
      .catch((e) => ativo && setErroExames(e.message))
    return () => {
      ativo = false
    }
  }, [])

  const preencherPeloCep = async (cepDigitos) => {
    buscaCep.current?.abort()
    const controlador = new AbortController()
    buscaCep.current = controlador
    setCepStatus({ tipo: 'info', msg: 'Buscando endereço...' })
    try {
      const endereco = await buscarCep(cepDigitos, { signal: controlador.signal })
      if (controlador.signal.aborted) return
      if (!endereco) {
        setCepStatus({ tipo: 'erro', msg: 'CEP não encontrado. Preencha o endereço manualmente.' })
        return
      }
      setFormPaciente((atual) => ({
        ...atual,
        logradouro: endereco.logradouro || atual.logradouro,
        bairro: endereco.bairro || atual.bairro,
        cidade: endereco.cidade || atual.cidade,
        estado: endereco.estado || atual.estado,
      }))
      setCepStatus({ tipo: 'ok', msg: 'Endereço preenchido. Confira e informe o número.' })
      if (document.activeElement?.id === 'cep') document.getElementById('numero')?.focus()
    } catch (e) {
      if (e?.name === 'AbortError') return
      setCepStatus({ tipo: 'erro', msg: 'Não foi possível buscar o CEP agora. Preencha manualmente.' })
    }
  }

  const alterarPaciente = (evento) => {
    const { name, value } = evento.target
    const novo = MASCARAS[name] ? MASCARAS[name](value) : value
    setFormPaciente((atual) => ({ ...atual, [name]: novo }))

    if (name === 'cep') {
      const digitos = somenteDigitos(novo)
      if (digitos.length === 8) {
        preencherPeloCep(digitos)
      } else {
        buscaCep.current?.abort()
        setCepStatus({ tipo: '', msg: '' })
      }
    }
  }

  const alterarAgendamento = (evento) => {
    const { name, value } = evento.target
    setFormAgendamento((atual) => ({ ...atual, [name]: value }))
  }

  const cadastrarPaciente = async (evento) => {
    evento.preventDefault()
    setErro('')

    const problema = validarCadastro({ ...formPaciente, confirmarSenha: formPaciente.senha })
    if (problema) {
      setErro(problema)
      return
    }

    setEnviando(true)
    try {
      const titular = await recepcaoApi.cadastrarPaciente({
        nome: formPaciente.nome.trim(),
        cpf: somenteDigitos(formPaciente.cpf),
        email: formPaciente.email.trim(),
        senha: formPaciente.senha,
        telefone: somenteDigitos(formPaciente.telefone),
        dataNascimento: formPaciente.dataNascimento,
        endereco: {
          cep: somenteDigitos(formPaciente.cep),
          logradouro: formPaciente.logradouro.trim(),
          numero: formPaciente.numero.trim(),
          complemento: formPaciente.complemento.trim() || null,
          bairro: formPaciente.bairro.trim(),
          cidade: formPaciente.cidade.trim(),
          estado: formPaciente.estado.trim().toUpperCase(),
        },
      })
      setPaciente(titular)
      setEtapa('agendamento')
    } catch (e) {
      setErro(e.message)
    } finally {
      setEnviando(false)
    }
  }

  const agendarExame = async (evento) => {
    evento.preventDefault()
    setErro('')

    const { exame, dataHora, consultorio, observacao } = formAgendamento
    if (!exame) return setErro('Selecione o exame.')
    if (!dataHora || new Date(dataHora).getTime() <= Date.now()) {
      return setErro('Informe uma data e um horário no futuro.')
    }
    if (!consultorio.trim()) return setErro('Informe o consultório onde o exame será realizado.')

    setEnviando(true)
    try {
      const criado = await recepcaoApi.agendar({
        pacientePublicId: paciente.publicId,
        examePublicId: exame,
        dataAgendada: inputParaIso(dataHora),
        consultorio: consultorio.trim(),
        observacao: observacao.trim() || null,
      })
      setAgendado(criado)
      setEtapa('concluido')
    } catch (e) {
      setErro(e.message)
    } finally {
      setEnviando(false)
    }
  }

  const novoCadastro = () => {
    setFormPaciente(PACIENTE_INICIAL)
    setFormAgendamento(AGENDAMENTO_INICIAL)
    setPaciente(null)
    setAgendado(null)
    setCepStatus({ tipo: '', msg: '' })
    setErro('')
    setEtapa('paciente')
  }

  const campoPaciente = { form: formPaciente, onChange: alterarPaciente }
  const campoAgendamento = { form: formAgendamento, onChange: alterarAgendamento }
  const passoAtual = etapa === 'paciente' ? 1 : 2

  return (
    <AdminLayout
      currentPage={currentPage}
      onNavigate={onNavigate}
      onLogout={onLogout}
      session={session}
      titulo="Cadastrar Novo Paciente"
      subtitulo="Cadastre o paciente e já agende o exame, informando data, horário e consultório."
    >
      <ol className="adm-passos" aria-label="Etapas">
        <li className={`adm-passo ${passoAtual === 1 ? 'ativo' : 'feito'}`} aria-current={passoAtual === 1 ? 'step' : undefined}>
          <span className="adm-passo-numero">1</span> Dados do paciente
        </li>
        <li className={`adm-passo ${passoAtual === 2 ? 'ativo' : ''}`} aria-current={passoAtual === 2 ? 'step' : undefined}>
          <span className="adm-passo-numero">2</span> Agendar exame
        </li>
      </ol>

      {etapa === 'paciente' && (
        <form className="card adm-formulario" onSubmit={cadastrarPaciente} noValidate>
          <h2>Dados do paciente</h2>
          <div className="adm-form-grid">
            <Campo name="nome" label="Nome completo" autoComplete="off" {...campoPaciente} />
            <Campo name="cpf" label="CPF" placeholder="000.000.000-00" inputMode="numeric" maxLength={14} {...campoPaciente} />
            <Campo name="email" label="E-mail" type="email" placeholder="paciente@exemplo.com" autoComplete="off" {...campoPaciente} />
            <Campo name="telefone" label="Telefone" type="tel" placeholder="(47) 99999-9999" maxLength={15} {...campoPaciente} />
            <Campo name="dataNascimento" label="Data de nascimento" type="date" max={hojeParaInput()} {...campoPaciente} />
            <Campo
              name="senha"
              label="Senha provisória"
              type="password"
              minLength={6}
              autoComplete="new-password"
              placeholder="Mínimo 6 caracteres"
              dica={{ tipo: '', msg: 'O paciente usa o e-mail ou CPF e esta senha para entrar; pode trocá-la depois em Perfil.' }}
              {...campoPaciente}
            />

            <h3>Endereço</h3>
            <Campo name="cep" label="CEP" placeholder="00000-000" inputMode="numeric" maxLength={9} dica={cepStatus} {...campoPaciente} />
            <Campo name="logradouro" label="Logradouro" {...campoPaciente} />
            <Campo name="numero" label="Número" {...campoPaciente} />
            <Campo name="complemento" label="Complemento" required={false} {...campoPaciente} />
            <Campo name="bairro" label="Bairro" {...campoPaciente} />
            <Campo name="cidade" label="Cidade" {...campoPaciente} />
            <Campo name="estado" label="Estado (UF)" maxLength={2} placeholder="SC" {...campoPaciente} />
          </div>

          {erro && <div className="alert alert-error" role="alert" style={{ marginTop: '1rem' }}>{erro}</div>}

          <div className="adm-modal-acoes">
            <button type="submit" className="btn btn-primary" disabled={enviando}>
              {enviando ? 'Cadastrando...' : 'Cadastrar e continuar'}
            </button>
            <button type="button" className="btn btn-secondary" disabled={enviando} onClick={() => onNavigate('recepcao-pacientes')}>
              Cancelar
            </button>
          </div>
        </form>
      )}

      {etapa === 'agendamento' && paciente && (
        <form className="card adm-formulario" onSubmit={agendarExame} noValidate>
          <div className="alert alert-success" role="status" style={{ marginBottom: '1rem' }}>
            Paciente cadastrado: <strong>{paciente.nome}</strong> (CPF {formatarCpf(paciente.cpf)}).
          </div>

          <h2>Agendar exame</h2>
          {erroExames && <div className="alert alert-error" role="alert" style={{ marginBottom: '1rem' }}>{erroExames}</div>}
          <div className="adm-form-grid">
            <div className="field largo">
              <label htmlFor="exame">Exame *</label>
              <select id="exame" name="exame" value={formAgendamento.exame} onChange={alterarAgendamento}>
                <option value="">Selecione o exame</option>
                {exames.map((e) => (
                  <option key={e.publicId} value={e.publicId}>{e.nome}</option>
                ))}
              </select>
            </div>
            <div className="field largo">
              <label>
                Data e horário *{formAgendamento.dataHora && <> — <strong>{formatarDataHora(formAgendamento.dataHora)}</strong></>}
              </label>
              <SeletorHorario
                value={formAgendamento.dataHora}
                onChange={(dataHora) => setFormAgendamento((atual) => ({ ...atual, dataHora }))}
              />
            </div>
            <Campo name="consultorio" label="Consultório" maxLength={100} placeholder="Ex.: Sala 204 - Bloco B" {...campoAgendamento} />
            <div className="largo">
              <Campo name="observacao" label="Observação" required={false} placeholder="Ex.: chegar em jejum de 8 horas" {...campoAgendamento} />
            </div>
          </div>

          {erro && <div className="alert alert-error" role="alert" style={{ marginTop: '1rem' }}>{erro}</div>}

          <div className="adm-modal-acoes">
            <button type="submit" className="btn btn-primary" disabled={enviando}>
              {enviando ? 'Agendando...' : 'Agendar exame'}
            </button>
            <button type="button" className="btn btn-secondary" disabled={enviando} onClick={() => onNavigate('recepcao-agendamentos')}>
              Agendar depois
            </button>
          </div>
        </form>
      )}

      {etapa === 'concluido' && agendado && (
        <section className="card adm-formulario adm-sucesso" aria-live="polite">
          <div className="alert alert-success" role="status">Exame agendado com sucesso.</div>
          <dl className="adm-dl">
            <div><dt>Paciente</dt><dd>{agendado.pacienteNome}</dd></div>
            <div><dt>Exame</dt><dd>{agendado.exameNome}</dd></div>
            <div><dt>Data e horário</dt><dd>{formatarDataHora(agendado.dataConfirmada)}</dd></div>
            <div><dt>Consultório</dt><dd>{agendado.consultorio}</dd></div>
          </dl>
          <div className="adm-modal-acoes">
            <button type="button" className="btn btn-primary" onClick={() => onNavigate('recepcao-agendamentos')}>
              Ver agendamentos
            </button>
            <button type="button" className="btn btn-secondary" onClick={novoCadastro}>
              Cadastrar outro paciente
            </button>
          </div>
        </section>
      )}
    </AdminLayout>
  )
}

export default AdminNovoPaciente
