import { useState } from 'react'
import './Admin.css'
import AdminLayout from '../../components/AdminLayout'
import FormularioUsuario from '../../components/FormularioUsuario'
import { adminUsuarioApi } from '../../services/api'

function AdminNovoRecepcionista({ session = null, currentPage = 'admin-novo-recepcionista', onNavigate = () => {}, onLogout = () => {} }) {
  const [criado, setCriado] = useState(null)
  // Muda a "chave" do formulário para limpá-lo ao cadastrar outro recepcionista.
  const [rodada, setRodada] = useState(0)

  const cadastrar = async (dados) => {
    const usuario = await adminUsuarioApi.cadastrarRecepcionista(dados)
    setCriado(usuario)
  }

  return (
    <AdminLayout
      currentPage={currentPage}
      onNavigate={onNavigate}
      onLogout={onLogout}
      session={session}
      titulo="Cadastrar Recepcionista"
      subtitulo="Crie um novo acesso à área da recepção."
    >
      {!criado && (
        <div className="card adm-formulario">
          <h2>Dados do recepcionista</h2>
          <FormularioUsuario
            key={rodada}
            modo="criar"
            rotuloEnviar="Cadastrar recepcionista"
            onSubmit={cadastrar}
            onCancelar={() => onNavigate('admin-usuarios')}
          />
        </div>
      )}

      {criado && (
        <div className="card adm-formulario">
          <div className="alert alert-success" role="status">
            {criado.nome} foi cadastrado(a) como recepcionista. Já pode entrar com o e-mail {criado.email} (ou CPF) e a
            senha provisória informada.
          </div>
          <div className="adm-modal-acoes">
            <button type="button" className="btn btn-primary" onClick={() => onNavigate('admin-usuarios')}>
              Ver usuários
            </button>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => {
                setCriado(null)
                setRodada((n) => n + 1)
              }}
            >
              Cadastrar outro
            </button>
          </div>
        </div>
      )}
    </AdminLayout>
  )
}

export default AdminNovoRecepcionista
