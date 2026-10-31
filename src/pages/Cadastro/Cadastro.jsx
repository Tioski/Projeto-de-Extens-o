import { useEffect, useRef, useState } from 'react'
import './Cadastro.css'
import { authApi, usuarioApi } from '../../services/api'
import { buscarCep } from '../../services/viacep'
import { hojeParaInput, somenteDigitos, validarCadastro } from '../../utils/agendamento'
import { mascararCep, mascararCpf, mascararTelefone } from '../../utils/mascaras'

const FORM_INICIAL = {
  nome: '',
  cpf: '',
  email: '',
  telefone: '',
  dataNascimento: '',
  senha: '',
  confirmarSenha: '',
  cep: '',
  logradouro: '',
  numero: '',
  complemento: '',
  bairro: '',
  cidade: '',
  estado: '',
}

// Campos com máscara de digitação: o valor guardado no estado já fica formatado.
const MASCARAS = { cpf: mascararCpf, telefone: mascararTelefone, cep: mascararCep }

function Campo({ name, label, form, onChange, type = 'text', required = true, ajuda = null, ...resto }) {
  return (
    <div className="field">
      <label htmlFor={name}>{label}</label>
      <input id={name} name={name} type={type} value={form[name]} onChange={onChange} required={required} {...resto} />
      {ajuda?.msg && (
        <small className={`field-hint field-hint-${ajuda.tipo}`} role="status">
          {ajuda.msg}
        </small>
      )}
    </div>
  )
}

function CadastroPage({ onNavigate = () => {}, onLogin = () => {} }) {
  const [form, setForm] = useState(FORM_INICIAL)
  const [erro, setErro] = useState('')
  const [enviando, setEnviando] = useState(false)
  const [cepStatus, setCepStatus] = useState({ tipo: '', msg: '' })
  const buscaCep = useRef(null) // AbortController da consulta em andamento

  // Ao sair da tela, cancela uma consulta de CEP que ainda esteja pendente.
  useEffect(() => () => buscaCep.current?.abort(), [])

  // Consulta o CEP e preenche rua, bairro, cidade e UF. Os campos continuam editáveis.
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

      // Só sobrescreve o que o CEP trouxe (CEPs genéricos de cidade podem vir sem rua/bairro).
      setForm((atual) => ({
        ...atual,
        logradouro: endereco.logradouro || atual.logradouro,
        bairro: endereco.bairro || atual.bairro,
        cidade: endereco.cidade || atual.cidade,
        estado: endereco.estado || atual.estado,
      }))
      setCepStatus({ tipo: 'ok', msg: 'Endereço preenchido. Confira e informe o número.' })

      // Leva o cursor para o próximo campo que a pessoa precisa digitar.
      if (document.activeElement?.id === 'cep') document.getElementById('numero')?.focus()
    } catch (e) {
      if (e?.name === 'AbortError') return
      setCepStatus({ tipo: 'erro', msg: 'Não foi possível buscar o CEP agora. Preencha o endereço manualmente.' })
    }
  }

  const handleChange = (event) => {
    const { name, value } = event.target
    const mascara = MASCARAS[name]
    const novoValor = mascara ? mascara(value) : value
    setForm((atual) => ({ ...atual, [name]: novoValor }))

    if (name === 'cep') {
      const digitos = somenteDigitos(novoValor)
      if (digitos.length === 8) {
        preencherPeloCep(digitos)
      } else {
        // CEP incompleto/apagado: descarta consulta pendente e limpa a mensagem.
        buscaCep.current?.abort()
        setCepStatus({ tipo: '', msg: '' })
      }
    }
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    setErro('')

    const problema = validarCadastro(form)
    if (problema) {
      setErro(problema)
      return
    }

    setEnviando(true)
    try {
      await usuarioApi.cadastrar({
        nome: form.nome.trim(),
        cpf: somenteDigitos(form.cpf),
        email: form.email.trim(),
        senha: form.senha,
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
      })
    } catch (e) {
      setErro(e.message)
      setEnviando(false)
      return
    }

    // Cadastro criado: entra direto usando o login existente. Se falhar, manda para a tela de login.
    try {
      const dados = await authApi.login(form.email.trim(), form.senha)
      onLogin(dados)
    } catch {
      onNavigate('login')
    }
  }

  const campo = { form, onChange: handleChange }

  return (
    <div className="page-shell auth-page">
      <div className="container auth-layout">
        <section className="auth-card card" aria-labelledby="cadastro-title">
          <div className="auth-header">
            <span className="eyebrow">Acesso ao sistema</span>
            <h1 id="cadastro-title">Cadastro</h1>
          </div>

          <form id="cadastro-form" className="auth-form form-grid-two" onSubmit={handleSubmit}>
            <Campo name="nome" label="Nome completo" placeholder="Seu nome completo" {...campo} />
            <Campo name="cpf" label="CPF" placeholder="000.000.000-00" inputMode="numeric" maxLength={14} {...campo} />
            <Campo name="email" label="E-mail" type="email" placeholder="seuemail@exemplo.com" {...campo} />
            <Campo name="telefone" label="Telefone" type="tel" placeholder="(47) 99999-9999" maxLength={15} {...campo} />
            <Campo name="dataNascimento" label="Data de nascimento" type="date" max={hojeParaInput()} {...campo} />
            <div aria-hidden="true" />
            <Campo name="senha" label="Senha" type="password" minLength={6} placeholder="Mínimo 6 caracteres" autoComplete="new-password" {...campo} />
            <Campo name="confirmarSenha" label="Confirmar senha" type="password" placeholder="Repita a senha" autoComplete="new-password" {...campo} />

            <h3 style={{ gridColumn: '1 / -1' }}>Endereço</h3>
            <Campo name="cep" label="CEP" placeholder="00000-000" inputMode="numeric" maxLength={9} ajuda={cepStatus} {...campo} />
            <Campo name="logradouro" label="Logradouro" placeholder="Rua, avenida..." {...campo} />
            <Campo name="numero" label="Número" {...campo} />
            <Campo name="complemento" label="Complemento" required={false} {...campo} />
            <Campo name="bairro" label="Bairro" {...campo} />
            <Campo name="cidade" label="Cidade" {...campo} />
            <Campo name="estado" label="Estado (UF)" maxLength={2} placeholder="SC" {...campo} />
          </form>

          {erro && <div className="alert alert-error" role="alert">{erro}</div>}

          <div className="auth-actions">
            <button type="submit" form="cadastro-form" className="btn btn-primary btn-large" disabled={enviando}>
              {enviando ? 'Cadastrando...' : 'Cadastrar'}
            </button>
            <button type="button" className="btn btn-secondary" onClick={() => onNavigate('login')}>
              Já tenho conta
            </button>
          </div>
        </section>
      </div>
    </div>
  )
}

export default CadastroPage
