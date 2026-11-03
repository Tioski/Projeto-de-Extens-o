import { Component } from 'react'
import './ErrorBoundary.css'

// Rede de segurança: se uma tela lançar um erro inesperado durante a renderização, o React desmonta
// a árvore inteira e a página fica em branco. Este componente captura o erro e mostra uma mensagem
// com a opção de recarregar, em vez da tela branca.
class ErrorBoundary extends Component {
  state = { erro: null }

  static getDerivedStateFromError(erro) {
    return { erro }
  }

  componentDidCatch(erro, info) {
    console.error('Erro inesperado na interface:', erro, info?.componentStack)
  }

  render() {
    if (!this.state.erro) return this.props.children

    return (
      <div className="erro-fatal" role="alert">
        <div className="erro-fatal-card">
          <h1>Algo deu errado</h1>
          <p>
            Ocorreu um problema inesperado nesta tela. Seus dados não foram perdidos no servidor.
            Recarregue a página para continuar.
          </p>
          <button type="button" className="btn btn-primary" onClick={() => window.location.reload()}>
            Recarregar a página
          </button>
        </div>
      </div>
    )
  }
}

export default ErrorBoundary
