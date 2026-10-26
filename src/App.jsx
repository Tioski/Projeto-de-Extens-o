import './App.css'
import { useEffect, useState } from 'react'
import Header from './components/Header'
import Footer from './Footer'
import HomePage from './pages/Home/Home'
import LoginPage from './pages/Login/Login'
import CadastroPage from './pages/Cadastro/Cadastro'
import ConsultarExamesPage from './pages/ConsultarExames/ConsultarExames'
import NovoExamePage from './pages/NovoExame/NovoExame'
import PainelPage from './pages/Painel/Painel'
import { clearSession, getSession, saveSession } from './services/session'

const PAGINAS_PROTEGIDAS = ['painel', 'consultar-exames', 'novo-exame']

function App() {
  const [session, setSession] = useState(() => getSession())
  const [currentPage, setCurrentPage] = useState('home')

  // O wrapper de requisições dispara "auth:expired" quando o backend responde 401.
  useEffect(() => {
    const aoExpirar = () => {
      setSession(null)
      setCurrentPage('login')
    }
    window.addEventListener('auth:expired', aoExpirar)
    return () => window.removeEventListener('auth:expired', aoExpirar)
  }, [])

  const handleLogin = (dados) => {
    setSession(saveSession(dados))
    setCurrentPage('painel')
  }

  const handleLogout = () => {
    clearSession()
    setSession(null)
    setCurrentPage('home')
  }

  const page = PAGINAS_PROTEGIDAS.includes(currentPage) && !session ? 'login' : currentPage

  const renderPage = () => {
    switch (page) {
      case 'login':
        return <LoginPage onNavigate={setCurrentPage} onLogin={handleLogin} />
      case 'cadastro':
        return <CadastroPage onNavigate={setCurrentPage} onLogin={handleLogin} />
      case 'consultar-exames':
        return <ConsultarExamesPage onNavigate={setCurrentPage} />
      case 'novo-exame':
        return <NovoExamePage onNavigate={setCurrentPage} />
      case 'painel':
        return <PainelPage onNavigate={setCurrentPage} />
      default:
        return <HomePage onNavigate={setCurrentPage} />
    }
  }

  return (
    <div className="app-shell">
      <Header currentPage={page} onNavigate={setCurrentPage} session={session} onLogout={handleLogout} />
      <main className="app-main" aria-label="Conteúdo principal">
        {renderPage()}
      </main>
      <Footer onNavigate={setCurrentPage} />
    </div>
  )
}

export default App
