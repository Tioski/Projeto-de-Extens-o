import { useEffect, useState } from 'react'
import '../Home/Home.css'
import '../Painel/Painel.css'
import './Perfil.css'
import { pacienteApi, usuarioApi } from '../../services/api'
import { ROTULOS_PARENTESCO, formatarData } from '../../utils/agendamento'
import { formatarCep, formatarCpf, formatarDataISO, formatarTelefone } from '../../utils/mascaras'

const ACOES = [
  {
    titulo: 'Agendar exame',
    descricao: 'Selecione o procedimento, o paciente e sugira três datas e horários.',
    botao: 'Iniciar agendamento',
    destino: 'novo-exame',
  },
  {
    titulo: 'Consultar exames',
    descricao: 'Acompanhe suas solicitações, veja o status e cancele quando precisar.',
    botao: 'Ver meus exames',
    destino: 'consultar-exames',
  },
]

const iniciais = (nome = '') =>
  nome
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((parte) => parte[0].toUpperCase())
    .join('') || '?'

const capitalizar = (texto = '') => texto.charAt(0).toUpperCase() + texto.slice(1).toLowerCase()

function Dado({ rotulo, valor }) {
  return (
    <div className="info-item">
      <dt>{rotulo}</dt>
      <dd>{valor || '—'}</dd>
    </div>
  )
}

function PerfilPage({ onNavigate = () => {}, session = null }) {
  const [estado, setEstado] = useState({ usuario: null, pacientes: [], carregando: true, erro: '' })

  // Os dados só são buscados quando a aba Perfil é aberta.
  useEffect(() => {
    let ativo = true

    Promise.all([usuarioApi.buscarPorPublicId(session.usuarioPublicId), pacienteApi.listarMeus()])
      .then(([usuario, pacientes]) => {
        if (ativo) setEstado({ usuario, pacientes, carregando: false, erro: '' })
      })
      .catch((e) => {
        if (ativo) setEstado((atual) => ({ ...atual, carregando: false, erro: e.message }))
      })

    return () => {
      ativo = false
    }
  }, [session.usuarioPublicId])

  const { usuario, pacientes, carregando, erro } = estado
  const endereco = usuario?.endereco

  return (
    <div className="page-shell">
      <div className="container page-section perfil-page">
        <div className="page-header">
          <h1>Meu perfil</h1>
          <p>Confira os dados que você informou no cadastro e acesse rapidamente os seus exames.</p>
        </div>

        {erro && <div className="alert alert-error" role="alert">{erro}</div>}
        {carregando && <p className="muted-text">Carregando seus dados...</p>}

        {usuario && (
          <>
            <section className="card perfil-identidade" aria-label="Identificação do usuário">
              <span className="perfil-avatar" aria-hidden="true">{iniciais(usuario.nome)}</span>
              <div>
                <h2>{usuario.nome}</h2>
                <p>{usuario.email}</p>
              </div>
              <span className="status-badge status-confirmado">{capitalizar(usuario.cargo)}</span>
            </section>

            <div className="perfil-grid">
              <section className="card panel-card" aria-labelledby="perfil-dados">
                <h3 id="perfil-dados">Dados pessoais</h3>
                <dl className="info-list">
                  <Dado rotulo="Nome completo" valor={usuario.nome} />
                  <Dado rotulo="CPF" valor={formatarCpf(usuario.cpf)} />
                  <Dado rotulo="Data de nascimento" valor={formatarDataISO(usuario.dataNascimento)} />
                  <Dado rotulo="Telefone" valor={formatarTelefone(usuario.telefone)} />
                  <Dado rotulo="E-mail" valor={usuario.email} />
                  <Dado rotulo="Cliente desde" valor={formatarData(usuario.dataCriacao)} />
                </dl>
              </section>

              <section className="card panel-card" aria-labelledby="perfil-endereco">
                <h3 id="perfil-endereco">Endereço</h3>
                <dl className="info-list">
                  <Dado rotulo="CEP" valor={formatarCep(endereco?.cep)} />
                  <Dado rotulo="Logradouro" valor={endereco?.logradouro} />
                  <Dado rotulo="Número" valor={endereco?.numero} />
                  <Dado rotulo="Complemento" valor={endereco?.complemento} />
                  <Dado rotulo="Bairro" valor={endereco?.bairro} />
                  <Dado rotulo="Cidade / UF" valor={endereco ? `${endereco.cidade} / ${endereco.estado}` : ''} />
                </dl>
              </section>
            </div>

            <section className="card panel-card perfil-pacientes" aria-labelledby="perfil-pacientes">
              <h3 id="perfil-pacientes">Pacientes vinculados à sua conta</h3>
              <p className="muted-text">Você (titular) e os dependentes cadastrados para agendar exames.</p>
              <div className="card-list perfil-lista">
                {pacientes.map((p) => (
                  <div key={p.publicId} className="list-item">
                    <div>
                      <strong>{p.nome}</strong>
                      <p>
                        {ROTULOS_PARENTESCO[p.parentesco] ?? p.parentesco}
                        {' · '}Nascimento {formatarDataISO(p.dataNascimento)}
                        {p.cpf ? ` · CPF ${formatarCpf(p.cpf)}` : ''}
                      </p>
                    </div>
                    <span className="status-badge status-atendimento">{p.convenio}</span>
                  </div>
                ))}
              </div>
            </section>
          </>
        )}

        <section className="perfil-acoes" aria-labelledby="perfil-acoes-titulo">
          <h2 id="perfil-acoes-titulo">O que você deseja fazer?</h2>
          <div className="service-grid">
            {ACOES.map((acao) => (
              <article key={acao.destino} className="card service-card">
                <div className="service-icon" aria-hidden="true">✦</div>
                <h3>{acao.titulo}</h3>
                <p>{acao.descricao}</p>
                <button type="button" className="btn btn-secondary" onClick={() => onNavigate(acao.destino)}>
                  {acao.botao}
                </button>
              </article>
            ))}
          </div>
        </section>
      </div>
    </div>
  )
}

export default PerfilPage
