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
import AdminAgendaPage from './pages/Admin/AdminAgenda'
import AdminNovoPacientePage from './pages/Admin/AdminNovoPaciente'
import AdminPacientesPage from './pages/Admin/AdminPacientes'
import AdminUsuariosPage from './pages/Admin/AdminUsuarios'
import AdminNovoRecepcionistaPage from './pages/Admin/AdminNovoRecepcionista'
import AdminExamesPage from './pages/Admin/AdminExames'
import { clearSession, ehCargoAdmin, ehCargoRecepcao, getSession, saveSession } from './services/session'

// Telas da recepção (RECEPCIONISTA e ADMIN) e telas só do ADMIN. Usam o próprio layout (menu lateral), sem Header/Footer.
const PAGINAS_RECEPCAO = ['recepcao', 'recepcao-agendamentos', 'recepcao-agenda', 'recepcao-pacientes', 'recepcao-novo-paciente']
const PAGINAS_SOMENTE_ADMIN = ['admin-usuarios', 'admin-novo-recepcionista', 'admin-exames']
const PAGINAS_ADMIN = [...PAGINAS_RECEPCAO, ...PAGINAS_SOMENTE_ADMIN]
const PAGINAS_PROTEGIDAS = ['painel', 'consultar-exames', 'novo-exame', 'perfil', ...PAGINAS_ADMIN]

// Decide qual página realmente aparece, de acordo com a sessão:
// - sem login, páginas protegidas levam ao login;
// - recepcionista só vê as telas da recepção;
// - administrador vê as mesmas telas, mas "Pacientes" vira "Usuários" e ainda tem "Exames";
// - paciente nunca vê a área administrativa.
function resolverPagina(pagina, session) {
  if (!session) return PAGINAS_PROTEGIDAS.includes(pagina) ? 'login' : pagina
  if (ehCargoAdmin(session.cargo)) {
    if (pagina === 'recepcao-pacientes') return 'admin-usuarios'
    return PAGINAS_ADMIN.includes(pagina) ? pagina : 'recepcao'
  }
  if (ehCargoRecepcao(session.cargo)) return PAGINAS_RECEPCAO.includes(pagina) ? pagina : 'recepcao'
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
  const propsAdmin = {
    session,
    currentPage: page,
    onNavigate: navegar,
    onLogout: handleLogout,
    onSessaoAtualizada: atualizarSessao,
  }

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
      case 'recepcao-agenda':
        return <AdminAgendaPage {...propsAdmin} />
      case 'recepcao-pacientes':
        return <AdminPacientesPage {...propsAdmin} />
      case 'recepcao-novo-paciente':
        return <AdminNovoPacientePage {...propsAdmin} />
      case 'admin-usuarios':
        return <AdminUsuariosPage {...propsAdmin} />
      case 'admin-novo-recepcionista':
        return <AdminNovoRecepcionistaPage {...propsAdmin} />
      case 'admin-exames':
        return <AdminExamesPage {...propsAdmin} />
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
