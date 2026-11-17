import { useEffect, useRef, useState } from 'react'
import { buscarCep } from '../services/viacep'
import { hojeParaInput, somenteDigitos, validarCadastro } from '../utils/agendamento'
import { formatarCpf, mascararCep, mascararCpf, mascararTelefone } from '../utils/mascaras'

const MASCARAS = { cpf: mascararCpf, telefone: mascararTelefone, cep: mascararCep }

const FORM_VAZIO = {
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

// Dados de um usuário vindo do backend -> estado do formulário (com máscaras de exibição).
function formDoUsuario(usuario) {
  const e = usuario?.endereco ?? {}
  return {
    ...FORM_VAZIO,
    nome: usuario?.nome ?? '',
    cpf: mascararCpf(usuario?.cpf),
    email: usuario?.email ?? '',
    telefone: mascararTelefone(usuario?.telefone),
    dataNascimento: usuario?.dataNascimento ?? '',
    cep: mascararCep(e.cep),
    logradouro: e.logradouro ?? '',
    numero: e.numero ?? '',
    complemento: e.complemento ?? '',
    bairro: e.bairro ?? '',
    cidade: e.cidade ?? '',
    estado: e.estado ?? '',
  }
}

// Mesmas regras do PerfilUpdateRequestDTO (o CPF e a senha não entram na edição).
function validarEdicao(form) {
  if (!form.nome.trim()) return 'Informe o nome completo.'
  if (!form.email.trim()) return 'Informe o e-mail.'
  if (somenteDigitos(form.telefone).length < 10) return 'Informe um telefone com DDD.'
  if (!form.dataNascimento || form.dataNascimento >= hojeParaInput()) {
    return 'A data de nascimento deve estar no passado.'
  }
  if (somenteDigitos(form.cep).length !== 8) return 'CEP deve conter 8 números.'
  if (!/^[A-Za-z]{2}$/.test(form.estado.trim())) return 'UF deve ter exatamente 2 letras.'
  return ''
}

function Campo({ name, label, form, onChange, type = 'text', required = true, dica = null, ...resto }) {
  return (
    <div className="field">
      <label htmlFor={name}>{label}{required ? ' *' : ''}</label>
      <input id={name} name={name} type={type} value={form[name]} onChange={onChange} {...resto} />
      {dica?.msg && <small className={`adm-dica ${dica.tipo}`} role="status">{dica.msg}</small>}
    </div>
  )
}

/**
 * Formulário de usuário usado pelo administrador.
 * - modo "criar": cadastra alguém novo (pede CPF e senha provisória);
 * - modo "editar": altera os dados de um usuário existente (CPF não muda, senha tem ação própria).
 * `onSubmit` recebe o corpo pronto para a API; se lançar erro, a mensagem aparece no formulário.
 */
function FormularioUsuario({ modo = 'criar', usuario = null, rotuloEnviar, onSubmit, onCancelar }) {
  const editando = modo === 'editar'
  const [form, setForm] = useState(() => (editando ? formDoUsuario(usuario) : FORM_VAZIO))
  const [erro, setErro] = useState('')
  const [enviando, setEnviando] = useState(false)
  const [cepStatus, setCepStatus] = useState({ tipo: '', msg: '' })
  const buscaCep = useRef(null)

  useEffect(() => () => buscaCep.current?.abort(), [])

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
      setForm((atual) => ({
        ...atual,
        logradouro: endereco.logradouro || atual.logradouro,
        bairro: endereco.bairro || atual.bairro,
        cidade: endereco.cidade || atual.cidade,
        estado: endereco.estado || atual.estado,
      }))
      setCepStatus({ tipo: 'ok', msg: 'Endereço preenchido. Confira e informe o número.' })
    } catch (e) {
      if (e?.name === 'AbortError') return
      setCepStatus({ tipo: 'erro', msg: 'Não foi possível buscar o CEP agora. Preencha manualmente.' })
    }
  }

  const alterar = (evento) => {
    const { name, value } = evento.target
    const novo = MASCARAS[name] ? MASCARAS[name](value) : value
    setForm((atual) => ({ ...atual, [name]: novo }))

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

  const enviar = async (evento) => {
    evento.preventDefault()
    setErro('')

    const problema = editando ? validarEdicao(form) : validarCadastro({ ...form, confirmarSenha: form.senha })
    if (problema) {
      setErro(problema)
      return
    }

    const dados = {
      nome: form.nome.trim(),
      email: form.email.trim(),
      telefone: somenteDigitos(form.telefone),
      dataNascimento: form.dataNascimento,
      endereco: {
        cep: somenteDigitos(form.cep),
        logradouro: form.logradouro.trim(),
        numero: form.numero.trim(),
        complemento: form.complemento.trim() || null,
        bairro: form.bairro.trim(),
        cidade: form.cidade.trim(),
        estado: form.estado.trim().toUpperCase(),
      },
    }
    if (!editando) {
      dados.cpf = somenteDigitos(form.cpf)
      dados.senha = form.senha
    }

    setEnviando(true)
    try {
      await onSubmit(dados)
    } catch (e) {
      setErro(e.message)
      setEnviando(false)
    }
  }

  const campo = { form, onChange: alterar }

  return (
    <form onSubmit={enviar} noValidate>
      <div className="adm-form-grid">
        <Campo name="nome" label="Nome completo" autoComplete="off" {...campo} />
        {editando ? (
          <div className="field">
            <label htmlFor="cpf">CPF (inalterável)</label>
            <input id="cpf" type="text" value={formatarCpf(usuario?.cpf)} disabled readOnly />
          </div>
        ) : (
          <Campo name="cpf" label="CPF" placeholder="000.000.000-00" inputMode="numeric" maxLength={14} {...campo} />
        )}
        <Campo name="email" label="E-mail" type="email" autoComplete="off" {...campo} />
        <Campo name="telefone" label="Telefone" type="tel" placeholder="(47) 99999-9999" maxLength={15} {...campo} />
        <Campo name="dataNascimento" label="Data de nascimento" type="date" max={hojeParaInput()} {...campo} />
        {!editando && (
          <Campo
            name="senha"
            label="Senha provisória"
            type="password"
            minLength={6}
            autoComplete="new-password"
            placeholder="Mínimo 6 caracteres"
            dica={{ tipo: '', msg: 'A pessoa entra com o e-mail ou CPF e esta senha; depois pode trocá-la em Perfil.' }}
            {...campo}
          />
        )}

        <h3 className="largo">Endereço</h3>
        <Campo name="cep" label="CEP" placeholder="00000-000" inputMode="numeric" maxLength={9} dica={cepStatus} {...campo} />
        <Campo name="logradouro" label="Logradouro" {...campo} />
        <Campo name="numero" label="Número" {...campo} />
        <Campo name="complemento" label="Complemento" required={false} {...campo} />
        <Campo name="bairro" label="Bairro" {...campo} />
        <Campo name="cidade" label="Cidade" {...campo} />
        <Campo name="estado" label="Estado (UF)" maxLength={2} placeholder="SC" {...campo} />
      </div>

      {erro && <div className="alert alert-error" role="alert" style={{ marginTop: '1rem' }}>{erro}</div>}

      <div className="adm-modal-acoes">
        <button type="submit" className="btn btn-primary" disabled={enviando}>
          {enviando ? 'Salvando...' : rotuloEnviar}
        </button>
        <button type="button" className="btn btn-secondary" disabled={enviando} onClick={onCancelar}>
          Cancelar
        </button>
      </div>
    </form>
  )
}

export default FormularioUsuario
