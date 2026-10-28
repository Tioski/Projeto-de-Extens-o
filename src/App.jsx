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
import PerfilPage from './pages/Perfil/Perfil'
import { clearSession, getSession, saveSession } from './services/session'

const PAGINAS_PROTEGIDAS = ['painel', 'consultar-exames', 'novo-exame', 'perfil']

function App() {
  const [session, setSession] = useState(() => getSession())
  const [currentPage, setCurrentPage] = useState('home')
  // Página protegida que o usuário tentou abrir sem estar logado: volta para ela depois do login.
  const [destino, setDestino] = useState(null)

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
    setCurrentPage(destino ?? 'painel')
    setDestino(null)
  }

  const navegar = (pagina) => {
    if (PAGINAS_PROTEGIDAS.includes(pagina) && !getSession()) {
      setDestino(pagina)
      setCurrentPage('login')
      return
    }
    if (pagina !== 'login' && pagina !== 'cadastro') setDestino(null)
    setCurrentPage(pagina)
  }

  const handleLogout = () => {
    clearSession()
    setSession(null)
    setDestino(null)
    setCurrentPage('home')
  }

  const page = PAGINAS_PROTEGIDAS.includes(currentPage) && !session ? 'login' : currentPage

  const renderPage = () => {
    switch (page) {
      case 'login':
        return <LoginPage onNavigate={navegar} onLogin={handleLogin} />
      case 'cadastro':
        return <CadastroPage onNavigate={navegar} onLogin={handleLogin} />
      case 'consultar-exames':
        return <ConsultarExamesPage onNavigate={navegar} />
      case 'novo-exame':
        return <NovoExamePage onNavigate={navegar} />
      case 'painel':
        return <PainelPage onNavigate={navegar} />
      case 'perfil':
        return <PerfilPage onNavigate={navegar} session={session} />
      default:
        return <HomePage onNavigate={navegar} session={session} />
    }
  }

  return (
    <div className="app-shell">
      <Header currentPage={page} onNavigate={navegar} session={session} onLogout={handleLogout} />
      <main className="app-main" aria-label="Conteúdo principal">
        {renderPage()}
      </main>
      <Footer onNavigate={navegar} session={session} />
    </div>
  )
}

export default App
