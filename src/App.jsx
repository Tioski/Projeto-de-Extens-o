import './App.css'
import { useState } from 'react'
import Header from './components/Header'
import Footer from './Footer'
import HomePage from './pages/Home/Home'
import LoginPage from './pages/Login/Login'
import CadastroPage from './pages/Cadastro/Cadastro'
import ConsultarExamesPage from './pages/ConsultarExames/ConsultarExames'
import NovoExamePage from './pages/NovoExame/NovoExame'
import PainelPage from './pages/Painel/Painel'

function App() {
  const [currentPage, setCurrentPage] = useState('home')

  const renderPage = () => {
    switch (currentPage) {
      case 'login':
        return <LoginPage onNavigate={setCurrentPage} />
      case 'cadastro':
        return <CadastroPage onNavigate={setCurrentPage} />
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
      <Header currentPage={currentPage} onNavigate={setCurrentPage} />
      <main className="app-main" aria-label="Conteúdo principal">
        {renderPage()}
      </main>
      <Footer onNavigate={setCurrentPage} />
    </div>
  )
}

export default App
