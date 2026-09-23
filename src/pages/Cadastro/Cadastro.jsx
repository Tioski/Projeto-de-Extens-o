import './Cadastro.css'

function CadastroPage({ onNavigate = () => {} }) {
  return (
    <div className="page-shell auth-page">
      <div className="container auth-layout">
        <section className="auth-card card" aria-labelledby="cadastro-title">
          <div className="auth-header">
            <span className="eyebrow">Acesso ao sistema</span>
            <h1 id="cadastro-title">Cadastro</h1>
          </div>

          <form className="auth-form form-grid-two">
            <div className="field">
              <label htmlFor="nome">Nome completo</label>
              <input id="nome" type="text" placeholder="Seu nome completo" />
            </div>

            <div className="field">
              <label htmlFor="cpf">CPF</label>
              <input id="cpf" type="text" placeholder="000.000.000-00" />
            </div>

            <div className="field">
              <label htmlFor="email">E-mail</label>
              <input id="email" type="email" placeholder="seuemail@exemplo.com" />
            </div>

            <div className="field">
              <label htmlFor="telefone">Telefone</label>
              <input id="telefone" type="tel" placeholder="(47) 99999-9999" />
            </div>

            <div className="field">
              <label htmlFor="senha">Senha</label>
              <input id="senha" type="password" placeholder="Crie uma senha" />
            </div>

            <div className="field">
              <label htmlFor="confirmar-senha">Confirmar senha</label>
              <input id="confirmar-senha" type="password" placeholder="Repita a senha" />
            </div>
          </form>

          <div className="auth-actions">
            <button type="button" className="btn btn-primary btn-large" onClick={() => onNavigate('login')}>
              Cadastrar
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
