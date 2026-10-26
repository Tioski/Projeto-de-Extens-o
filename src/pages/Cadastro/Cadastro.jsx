import { useState } from 'react'
import './Cadastro.css'
import { authApi, usuarioApi } from '../../services/api'
import { somenteDigitos } from '../../utils/agendamento'

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

function Campo({ name, label, form, onChange, type = 'text', required = true, ...resto }) {
  return (
    <div className="field">
      <label htmlFor={name}>{label}</label>
      <input id={name} name={name} type={type} value={form[name]} onChange={onChange} required={required} {...resto} />
    </div>
  )
}

function CadastroPage({ onNavigate = () => {}, onLogin = () => {} }) {
  const [form, setForm] = useState(FORM_INICIAL)
  const [erro, setErro] = useState('')
  const [enviando, setEnviando] = useState(false)

  const handleChange = (event) => {
    const { name, value } = event.target
    setForm((atual) => ({ ...atual, [name]: value }))
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    setErro('')

    if (form.senha !== form.confirmarSenha) {
      setErro('As senhas não conferem.')
      return
    }

    setEnviando(true)
    try {
      await usuarioApi.cadastrar({
        nome: form.nome.trim(),
        cpf: somenteDigitos(form.cpf),
        email: form.email.trim(),
        senha: form.senha,
        telefone: form.telefone.trim(),
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
            <Campo name="cpf" label="CPF" placeholder="000.000.000-00" {...campo} />
            <Campo name="email" label="E-mail" type="email" placeholder="seuemail@exemplo.com" {...campo} />
            <Campo name="telefone" label="Telefone" type="tel" placeholder="(47) 99999-9999" {...campo} />
            <Campo name="dataNascimento" label="Data de nascimento" type="date" {...campo} />
            <div aria-hidden="true" />
            <Campo name="senha" label="Senha" type="password" minLength={6} placeholder="Mínimo 6 caracteres" autoComplete="new-password" {...campo} />
            <Campo name="confirmarSenha" label="Confirmar senha" type="password" placeholder="Repita a senha" autoComplete="new-password" {...campo} />

            <h3 style={{ gridColumn: '1 / -1' }}>Endereço</h3>
            <Campo name="cep" label="CEP" placeholder="00000-000" {...campo} />
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
