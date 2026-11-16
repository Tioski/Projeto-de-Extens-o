import { useEffect, useRef, useState } from 'react'
import AgendarExameForm from './AgendarExameForm'
import FormularioUsuario from '../../components/FormularioUsuario'
import Icone from '../../components/Icone'
import { adminUsuarioApi } from '../../services/api'
import { dataDeReferencia, formatarData, formatarDataHora, infoStatus } from '../../utils/agendamento'
import { formatarCep, formatarCpf, formatarDataISO, formatarTelefone } from '../../utils/mascaras'
import { ROTULOS_CARGO, idadeEmAnos } from '../../utils/admin'

const TITULOS = {
  ficha: null,
  agendar: 'Agendar exame',
  editar: 'Alterar dados',
  senha: 'Alterar senha',
}

function Dado({ rotulo, valor, largo = false }) {
  return (
    <div className={largo ? 'largo' : undefined}>
      <dt>{rotulo}</dt>
      <dd>{valor || '—'}</dd>
    </div>
  )
}

// Formulário simples de nova senha (o admin não precisa saber a senha antiga).
function FormularioSenha({ usuario, onConcluido, onVoltar }) {
  const [senha, setSenha] = useState('')
  const [confirmar, setConfirmar] = useState('')
  const [erro, setErro] = useState('')
  const [enviando, setEnviando] = useState(false)

  const enviar = async (evento) => {
    evento.preventDefault()
    setErro('')

    if (senha.length < 6) return setErro('A nova senha deve ter no mínimo 6 caracteres.')
    if (senha !== confirmar) return setErro('A confirmação não confere com a nova senha.')

    setEnviando(true)
    try {
      await adminUsuarioApi.alterarSenha(usuario.publicId, senha)
      await onConcluido(`Senha de ${usuario.nome} alterada com sucesso.`)
    } catch (e) {
      setErro(e.message)
      setEnviando(false)
    }
  }

  return (
    <form onSubmit={enviar} noValidate>
      <p className="muted-text">
        Defina uma nova senha para {usuario.nome}. A senha atual deixa de valer e a pessoa usa a nova no próximo
        acesso.
      </p>
      <div className="adm-form-grid" style={{ marginTop: '1rem' }}>
        <div className="field">
          <label htmlFor="nova-senha">Nova senha *</label>
          <input
            id="nova-senha"
            type="password"
            autoComplete="new-password"
            placeholder="Mínimo 6 caracteres"
            value={senha}
            onChange={(e) => setSenha(e.target.value)}
            disabled={enviando}
            autoFocus
          />
        </div>
        <div className="field">
          <label htmlFor="confirmar-senha">Confirmar nova senha *</label>
          <input
            id="confirmar-senha"
            type="password"
            autoComplete="new-password"
            value={confirmar}
            onChange={(e) => setConfirmar(e.target.value)}
            disabled={enviando}
          />
        </div>
      </div>

      {erro && <div className="alert alert-error" role="alert" style={{ marginTop: '1rem' }}>{erro}</div>}

      <div className="adm-modal-acoes">
        <button type="submit" className="btn btn-primary" disabled={enviando}>
          {enviando ? 'Salvando...' : 'Alterar senha'}
        </button>
        <button type="button" className="btn btn-secondary" disabled={enviando} onClick={onVoltar}>
          Voltar
        </button>
      </div>
    </form>
  )
}

/**
 * Janela do usuário (área do administrador): ficha, agendar exame, alterar dados e alterar senha.
 * `titular` é o registro de paciente do usuário, quando ele já existe (recepcionistas e administradores
 * só ganham um quando o admin agenda um exame para eles).
 */
function AdminUsuarioModal({
  usuario,
  titular = null,
  agendamentos = [],
  session = null,
  modoInicial = 'ficha',
  onFechar,
  onConcluido,
  onSessaoAtualizada = () => {},
}) {
  const u = usuario
  const [modo, setModo] = useState(modoInicial) // 'ficha' | 'agendar' | 'editar' | 'senha'
  const [titularId, setTitularId] = useState(titular?.publicId ?? null)
  const [erroTitular, setErroTitular] = useState('')
  const dialogo = useRef(null)
  const e = u.endereco
  const idade = idadeEmAnos(u.dataNascimento)

  useEffect(() => {
    dialogo.current?.focus()
  }, [])

  useEffect(() => {
    const aoTeclar = (ev) => {
      if (ev.key === 'Escape') onFechar()
    }
    document.addEventListener('keydown', aoTeclar)
    return () => document.removeEventListener('keydown', aoTeclar)
  }, [onFechar])

  // Para agendar, o usuário precisa ter um registro de paciente: cria o titular na hora se faltar.
  const preparandoAgenda = modo === 'agendar' && !titularId && !erroTitular
  useEffect(() => {
    if (modo !== 'agendar' || titularId) return undefined
    let ativo = true
    adminUsuarioApi
      .garantirPacienteTitular(u.publicId)
      .then((criado) => ativo && setTitularId(criado.publicId))
      .catch((erro) => ativo && setErroTitular(erro.message))
    return () => {
      ativo = false
    }
  }, [modo, titularId, u.publicId])

  const historico = titularId
    ? agendamentos
        .filter((a) => a.pacientePublicId === titularId)
        .sort((x, y) => dataDeReferencia(y) - dataDeReferencia(x))
    : []

  const enderecoLinha = e
    ? `${e.logradouro}, ${e.numero}${e.complemento ? ` - ${e.complemento}` : ''} • ${e.bairro} • ${e.cidade}/${e.estado} • CEP ${formatarCep(e.cep)}`
    : ''

  const salvarDados = async (dados) => {
    const resposta = await adminUsuarioApi.atualizar(u.publicId, dados)
    // Se o admin editou a própria conta, a sessão acompanha (nome no menu e, se o e-mail mudou, o token novo).
    if (u.publicId === session?.usuarioPublicId) {
      onSessaoAtualizada({
        nome: resposta.usuario.nome,
        ...(resposta.token ? { token: resposta.token } : {}),
      })
    }
    await onConcluido(`Dados de ${resposta.usuario.nome} atualizados com sucesso.`)
  }

  const aoAgendar = async (criado) => {
    await onConcluido(
      `Exame agendado para ${criado.pacienteNome}: ${criado.exameNome} em ${formatarDataHora(criado.dataConfirmada)}${
        criado.consultorio ? ` (${criado.consultorio})` : ''
      }.`,
    )
  }

  const subtitulo =
    modo === 'ficha' ? (ROTULOS_CARGO[u.cargo] ?? u.cargo) : `Usuário: ${u.nome}`

  return (
    <div className="adm-overlay" onMouseDown={(ev) => ev.target === ev.currentTarget && onFechar()}>
      <div
        ref={dialogo}
        className="adm-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="adm-usuario-titulo"
        tabIndex={-1}
      >
        <div className="adm-modal-topo">
          <div>
            <h2 id="adm-usuario-titulo">{TITULOS[modo] ?? u.nome}</h2>
            <p>{subtitulo}</p>
          </div>
          <button type="button" className="adm-fechar" onClick={onFechar} aria-label="Fechar">
            <Icone nome="fechar" />
          </button>
        </div>

        {modo === 'agendar' && (
          <>
            {preparandoAgenda && <p className="adm-vazio">Preparando o cadastro de paciente...</p>}
            {erroTitular && (
              <>
                <div className="alert alert-error" role="alert">{erroTitular}</div>
                <div className="adm-modal-acoes">
                  <button type="button" className="btn btn-secondary" onClick={() => setModo('ficha')}>Voltar</button>
                </div>
              </>
            )}
            {titularId && (
              <AgendarExameForm
                pacientePublicId={titularId}
                onAgendado={aoAgendar}
                onVoltar={() => setModo('ficha')}
              />
            )}
          </>
        )}

        {modo === 'editar' && (
          <FormularioUsuario
            modo="editar"
            usuario={u}
            rotuloEnviar="Salvar alterações"
            onSubmit={salvarDados}
            onCancelar={() => setModo('ficha')}
          />
        )}

        {modo === 'senha' && (
          <FormularioSenha usuario={u} onConcluido={onConcluido} onVoltar={() => setModo('ficha')} />
        )}

        {modo === 'ficha' && (
          <>
            <section className="adm-secao" aria-label="Dados pessoais">
              <h3>Dados pessoais</h3>
              <dl className="adm-dl">
                <Dado rotulo="Nome completo" valor={u.nome} />
                <Dado rotulo="CPF" valor={formatarCpf(u.cpf)} />
                <Dado
                  rotulo="Data de nascimento"
                  valor={`${formatarDataISO(u.dataNascimento)}${idade !== null ? ` (${idade} anos)` : ''}`}
                />
                <Dado rotulo="Perfil de acesso" valor={ROTULOS_CARGO[u.cargo] ?? u.cargo} />
                <Dado rotulo="Situação da conta" valor={u.ativo ? 'Ativa' : 'Inativa'} />
                <Dado rotulo="Cadastrado em" valor={formatarData(u.dataCriacao)} />
              </dl>
            </section>

            <section className="adm-secao" aria-label="Contato">
              <h3>Contato</h3>
              <dl className="adm-dl">
                <Dado rotulo="Telefone" valor={formatarTelefone(u.telefone)} />
                <Dado rotulo="E-mail" valor={u.email} />
                <Dado rotulo="Endereço" valor={enderecoLinha} largo />
              </dl>
            </section>

            <section className="adm-secao" aria-label="Histórico de exames">
              <h3>Exames ({historico.length})</h3>
              {historico.length === 0 && <p className="adm-vazio">Este usuário ainda não tem exames.</p>}
              <div className="adm-lista">
                {historico.map((a) => {
                  const st = infoStatus(a.status)
                  const data = a.dataConfirmada ?? a.dataOpcao1
                  return (
                    <div key={a.publicId} className="adm-atendimento">
                      <div className="adm-atendimento-texto">
                        <strong>{a.exameNome}</strong>
                        <span>
                          {a.dataConfirmada ? formatarDataHora(data) : `Sugerido para ${formatarData(data)}`}
                          {a.consultorio ? ` • ${a.consultorio}` : ''}
                        </span>
                      </div>
                      <span className={`status-badge ${st.classe}`}>{st.label}</span>
                    </div>
                  )
                })}
              </div>
            </section>

            <div className="adm-modal-acoes">
              <button type="button" className="btn btn-primary" onClick={() => setModo('agendar')}>
                Agendar exame
              </button>
              <button type="button" className="btn btn-secondary" onClick={() => setModo('editar')}>
                Alterar dados
              </button>
              <button type="button" className="btn btn-secondary" onClick={() => setModo('senha')}>
                Alterar senha
              </button>
              <button type="button" className="btn btn-secondary" onClick={onFechar}>Fechar</button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}

export default AdminUsuarioModal
