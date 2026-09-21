import './App.css'
import Header from './components/Header'
import Hero from './components/Hero'
import Info from './components/Info'
import Footer from './Footer'

function App() {
  return (
    <div className="app-shell">
      <Header />
      <main className="app-main" aria-label="Conteúdo principal" />
      <Hero />
      <Info />
      <Footer />
    </div>
  )
}

export default App
