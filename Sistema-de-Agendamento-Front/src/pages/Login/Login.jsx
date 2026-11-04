import { useState } from 'react'
import CampoSenha from '../../components/CampoSenha'
import './Login.css'
import { authApi } from '../../services/api'

function LoginPage({ onNavigate = () => {}, onLogin = () => {} }) {
  const [login, setLogin] = useState('')
  const [senha, setSenha] = useState('')
  const [erro, setErro] = useState('')
  const [enviando, setEnviando] = useState(false)

  const handleSubmit = async (event) => {
    event.preventDefault()
    setErro('')
    setEnviando(true)

    try {
      // O backend aceita e-mail ou CPF (só dígitos) no mesmo campo.
      const valor = login.trim()
      const digitos = valor.replace(/\D/g, '')
      const loginEnviado = !valor.includes('@') && digitos.length === 11 ? digitos : valor

      const dados = await authApi.login(loginEnviado, senha)
      onLogin(dados)
    } catch (e) {
      setErro(e.message)
    } finally {
      setEnviando(false)
    }
  }

  return (
    <div className="page-shell auth-page">
      <div className="container auth-layout">
        <section className="auth-card card" aria-labelledby="login-title">
          <div className="auth-header">
            <span className="eyebrow">Portal do paciente</span>
            <h1 id="login-title">Entrar</h1>
          </div>

          <form className="auth-form" onSubmit={handleSubmit}>
            <div className="field">
              <label htmlFor="login">E-mail ou CPF</label>
              <input
                id="login"
                type="text"
                autoComplete="username"
                placeholder="seuemail@exemplo.com"
                value={login}
                onChange={(e) => setLogin(e.target.value)}
                required
              />
            </div>

            <div className="field">
              <label htmlFor="senha">Senha</label>
              <CampoSenha
                id="senha"
                autoComplete="current-password"
                placeholder="Digite sua senha"
                value={senha}
                onChange={(e) => setSenha(e.target.value)}
                required
              />
            </div>

            {erro && <div className="alert alert-error" role="alert">{erro}</div>}

            <button type="submit" className="btn btn-primary btn-large auth-submit" disabled={enviando}>
              {enviando ? 'Entrando...' : 'Entrar'}
            </button>
          </form>

          <div className="auth-links">
            <button type="button" className="link-button" onClick={() => onNavigate('cadastro')}>
              Criar conta
            </button>
            <button type="button" className="link-button" onClick={() => onNavigate('home')}>
              Voltar para a home
            </button>
          </div>
        </section>
      </div>
    </div>
  )
}

export default LoginPage
