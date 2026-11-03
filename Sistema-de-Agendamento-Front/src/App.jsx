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
import AdminDashboardPage from './pages/Admin/AdminDashboard'
import AdminAgendamentosPage from './pages/Admin/AdminAgendamentos'
import AdminNovoPacientePage from './pages/Admin/AdminNovoPaciente'
import AdminPacientesPage from './pages/Admin/AdminPacientes'
import { clearSession, ehCargoRecepcao, getSession, saveSession } from './services/session'

// Telas da área administrativa (RECEPCIONISTA e ADMIN). Usam o próprio layout (menu lateral), sem Header/Footer.
const PAGINAS_ADMIN = ['recepcao', 'recepcao-agendamentos', 'recepcao-pacientes', 'recepcao-novo-paciente']
const PAGINAS_PROTEGIDAS = ['painel', 'consultar-exames', 'novo-exame', 'perfil', ...PAGINAS_ADMIN]

// Decide qual página realmente aparece, de acordo com a sessão:
// - sem login, páginas protegidas levam ao login;
// - equipe da recepção só vê a área administrativa;
// - paciente nunca vê a área administrativa.
function resolverPagina(pagina, session) {
  if (!session) return PAGINAS_PROTEGIDAS.includes(pagina) ? 'login' : pagina
  if (ehCargoRecepcao(session.cargo)) return PAGINAS_ADMIN.includes(pagina) ? pagina : 'recepcao'
  return PAGINAS_ADMIN.includes(pagina) ? 'painel' : pagina
}

function App() {
  const [session, setSession] = useState(() => getSession())
  const [currentPage, setCurrentPage] = useState('home')
  // Página protegida que o usuário tentou abrir sem estar logado: volta para ela depois do login.
  const [destino, setDestino] = useState(null)
  // Dados extras para a página aberta (ex.: exame a reagendar). Zera a cada navegação.
  const [paramsPagina, setParamsPagina] = useState(null)
  // Muda a cada abertura de "Novo exame": o assistente recomeça da etapa certa em vez de manter o estado antigo.
  const [aberturaNovoExame, setAberturaNovoExame] = useState(0)

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
    const padrao = ehCargoRecepcao(dados.cargo) ? 'recepcao' : 'painel'
    const alvo = destino ? resolverPagina(destino, dados) : padrao
    setCurrentPage(alvo === 'login' ? padrao : alvo)
    setDestino(null)
  }

  const navegar = (pagina, params = null) => {
    if (PAGINAS_PROTEGIDAS.includes(pagina) && !getSession()) {
      setDestino(pagina)
      setCurrentPage('login')
      return
    }
    if (pagina !== 'login' && pagina !== 'cadastro') setDestino(null)
    setParamsPagina(params)
    if (pagina === 'novo-exame') setAberturaNovoExame((n) => n + 1)
    setCurrentPage(pagina)
  }

  const handleLogout = () => {
    clearSession()
    setSession(null)
    setDestino(null)
    setCurrentPage('home')
  }

  // O Perfil pode trocar nome e (se o e-mail mudou) o token: mantém a sessão salva e o Header em dia.
  const atualizarSessao = (parcial) => {
    const atual = getSession()
    if (!atual) return
    setSession(saveSession({ ...atual, ...parcial }))
  }

  const page = resolverPagina(currentPage, session)
  const ehAdmin = PAGINAS_ADMIN.includes(page)
  const propsAdmin = { session, currentPage: page, onNavigate: navegar, onLogout: handleLogout }

  const renderPage = () => {
    switch (page) {
      case 'login':
        return <LoginPage onNavigate={navegar} onLogin={handleLogin} />
      case 'cadastro':
        return <CadastroPage onNavigate={navegar} onLogin={handleLogin} />
      case 'consultar-exames':
        return <ConsultarExamesPage onNavigate={navegar} />
      case 'novo-exame':
        return <NovoExamePage key={aberturaNovoExame} onNavigate={navegar} params={paramsPagina} />
      case 'recepcao':
        return <AdminDashboardPage {...propsAdmin} />
      case 'recepcao-agendamentos':
        return <AdminAgendamentosPage {...propsAdmin} />
      case 'recepcao-pacientes':
        return <AdminPacientesPage {...propsAdmin} />
      case 'recepcao-novo-paciente':
        return <AdminNovoPacientePage {...propsAdmin} />
      case 'painel':
        return <PainelPage onNavigate={navegar} />
      case 'perfil':
        return <PerfilPage onNavigate={navegar} session={session} onSessaoAtualizada={atualizarSessao} />
      default:
        return <HomePage onNavigate={navegar} session={session} />
    }
  }

  if (ehAdmin) return <div className="app-shell">{renderPage()}</div>

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
