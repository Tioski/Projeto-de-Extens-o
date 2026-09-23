import './Login.css'

function LoginPage({ onNavigate = () => {} }) {
  return (
    <div className="page-shell auth-page">
      <div className="container auth-layout">
        <section className="auth-card card" aria-labelledby="login-title">
          <div className="auth-header">
            <span className="eyebrow">Portal do paciente</span>
            <h1 id="login-title">Entrar</h1>
          </div>

          <form className="auth-form">
            <div className="field">
              <label htmlFor="email">E-mail</label>
              <input id="email" type="email" placeholder="seuemail@exemplo.com" />
            </div>

            <div className="field">
              <label htmlFor="senha">Senha</label>
              <input id="senha" type="password" placeholder="Digite sua senha" />
            </div>

            <button type="button" className="btn btn-primary btn-large auth-submit" onClick={() => onNavigate('painel')}>
              Entrar
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
