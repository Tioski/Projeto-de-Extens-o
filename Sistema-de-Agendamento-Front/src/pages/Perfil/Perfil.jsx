import { useEffect, useState } from 'react'
import CampoSenha from '../../components/CampoSenha'
import '../Home/Home.css'
import '../Painel/Painel.css'
import './Perfil.css'
import { pacienteApi, usuarioApi } from '../../services/api'
import {
  PARENTESCOS,
  ROTULOS_PARENTESCO,
  formatarData,
  hojeParaInput,
  somenteDigitos,
  validarDependente,
} from '../../utils/agendamento'
import {
  formatarCep,
  formatarCpf,
  formatarDataISO,
  formatarTelefone,
  mascararCep,
  mascararCpf,
  mascararTelefone,
} from '../../utils/mascaras'

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

const SENHA_INICIAL = { senhaAtual: '', novaSenha: '', confirmarSenha: '' }

function Campo({ id, label, value, onChange, type = 'text', ...resto }) {
  return (
    <div className="field">
      <label htmlFor={id}>{label}</label>
      {type === 'password' ? (
        <CampoSenha id={id} name={id} value={value} onChange={onChange} {...resto} />
      ) : (
        <input id={id} name={id} type={type} value={value} onChange={onChange} {...resto} />
      )}
    </div>
  )
}

// Valores do usuário -> estado do formulário de edição (com máscaras de exibição).
function formDoUsuario(usuario) {
  const e = usuario.endereco ?? {}
  return {
    nome: usuario.nome ?? '',
    email: usuario.email ?? '',
    telefone: mascararTelefone(usuario.telefone),
    dataNascimento: usuario.dataNascimento ?? '',
    cep: mascararCep(e.cep),
    logradouro: e.logradouro ?? '',
    numero: e.numero ?? '',
    complemento: e.complemento ?? '',
    bairro: e.bairro ?? '',
    cidade: e.cidade ?? '',
    estado: e.estado ?? '',
  }
}

function validarEdicao(form) {
  if (!form.nome.trim()) return 'Informe o nome completo.'
  if (somenteDigitos(form.telefone).length < 10) return 'Informe um telefone com DDD.'
  if (!form.dataNascimento || form.dataNascimento >= hojeParaInput()) {
    return 'A data de nascimento deve estar no passado.'
  }
  if (somenteDigitos(form.cep).length !== 8) return 'CEP deve conter 8 números.'
  if (!/^[A-Za-z]{2}$/.test(form.estado.trim())) return 'UF deve ter exatamente 2 letras.'
  return ''
}

function PerfilPage({ onNavigate = () => {}, session = null, onSessaoAtualizada = () => {} }) {
  const [estado, setEstado] = useState({ usuario: null, pacientes: [], carregando: true, erro: '' })
  const [editando, setEditando] = useState(false)
  const [form, setForm] = useState(null)
  const [salvando, setSalvando] = useState(false)
  const [erroForm, setErroForm] = useState('')
  const [sucessoForm, setSucessoForm] = useState('')
  const [formSenha, setFormSenha] = useState(SENHA_INICIAL)
  const [salvandoSenha, setSalvandoSenha] = useState(false)
  const [erroSenha, setErroSenha] = useState('')
  const [sucessoSenha, setSucessoSenha] = useState('')

  // Dependentes: edição inline e remoção com confirmação
  const [editandoDep, setEditandoDep] = useState(null) // publicId do dependente em edição
  const [formDep, setFormDep] = useState(null)
  const [confirmandoRemocao, setConfirmandoRemocao] = useState(null) // publicId aguardando confirmação
  const [processandoDep, setProcessandoDep] = useState(false)
  const [erroDep, setErroDep] = useState('')
  const [sucessoDep, setSucessoDep] = useState('')

  // Os dados só são buscados quando a aba Perfil é aberta.
  useEffect(() => {
    let ativo = true

    Promise.all([usuarioApi.me(), pacienteApi.listarMeus()])
      .then(([usuario, pacientes]) => {
        if (ativo) setEstado({ usuario, pacientes, carregando: false, erro: '' })
      })
      .catch((e) => {
        if (ativo) setEstado((atual) => ({ ...atual, carregando: false, erro: e.message }))
      })

    return () => {
      ativo = false
    }
  }, [session?.usuarioPublicId])

  const { usuario, pacientes, carregando, erro } = estado
  const endereco = usuario?.endereco

  const iniciarEdicao = () => {
    setForm(formDoUsuario(usuario))
    setErroForm('')
    setSucessoForm('')
    setEditando(true)
  }

  const cancelarEdicao = () => {
    setEditando(false)
    setErroForm('')
  }

  const alterarCampo = (evento) => {
    const { name, value } = evento.target
    const mascara = { telefone: mascararTelefone, cep: mascararCep }[name]
    setForm((atual) => ({ ...atual, [name]: mascara ? mascara(value) : value }))
  }

  const salvarDados = async (evento) => {
    evento.preventDefault()
    setErroForm('')

    const problema = validarEdicao(form)
    if (problema) {
      setErroForm(problema)
      return
    }

    setSalvando(true)
    try {
      const resposta = await usuarioApi.atualizarMe({
        nome: form.nome.trim(),
        email: form.email.trim(),
        telefone: somenteDigitos(form.telefone),
        dataNascimento: form.dataNascimento,
        endereco: {
          cep: somenteDigitos(form.cep),
          logradouro: form.logradouro.trim(),
          numero: form.numero.trim(),
          complemento: form.complemento.trim() || null,
          bairro: form.bairro.trim(),
          cidade: form.cidade.trim(),
          estado: form.estado.trim().toUpperCase(),
        },
      })

      // Se o e-mail mudou, o backend devolve um token novo (o antigo deixa de valer).
      onSessaoAtualizada({
        nome: resposta.usuario.nome,
        ...(resposta.token ? { token: resposta.token } : {}),
      })
      setEstado((atual) => ({ ...atual, usuario: resposta.usuario }))
      setEditando(false)
      setSucessoForm('Dados atualizados com sucesso.')

      // O nome do paciente titular acompanha o cadastro: atualiza a lista sem bloquear a tela.
      pacienteApi
        .listarMeus()
        .then((lista) => setEstado((atual) => ({ ...atual, pacientes: lista })))
        .catch(() => {})
    } catch (e) {
      setErroForm(e.message)
    } finally {
      setSalvando(false)
    }
  }

  const iniciarEdicaoDep = (p) => {
    setErroDep('')
    setSucessoDep('')
    setConfirmandoRemocao(null)
    setFormDep({
      nome: p.nome ?? '',
      cpf: mascararCpf(p.cpf ?? ''),
      dataNascimento: p.dataNascimento ?? '',
      parentesco: p.parentesco,
      convenio: p.convenio === 'Particular' ? '' : (p.convenio ?? ''),
    })
    setEditandoDep(p.publicId)
  }

  const cancelarEdicaoDep = () => {
    setEditandoDep(null)
    setFormDep(null)
    setErroDep('')
  }

  const alterarCampoDep = (campo, valor) => {
    setFormDep((atual) => ({ ...atual, [campo]: campo === 'cpf' ? mascararCpf(valor) : valor }))
  }

  const salvarDependente = async (evento) => {
    evento.preventDefault()
    setErroDep('')

    const problema = validarDependente(formDep)
    if (problema) {
      setErroDep(problema)
      return
    }

    setProcessandoDep(true)
    try {
      const atualizado = await pacienteApi.atualizarDependente(editandoDep, {
        nome: formDep.nome.trim(),
        cpf: somenteDigitos(formDep.cpf) || null,
        dataNascimento: formDep.dataNascimento,
        parentesco: formDep.parentesco,
        convenio: formDep.convenio.trim() || null,
      })
      setEstado((atual) => ({
        ...atual,
        pacientes: atual.pacientes.map((p) => (p.publicId === atualizado.publicId ? atualizado : p)),
      }))
      setEditandoDep(null)
      setFormDep(null)
      setSucessoDep(`Dados de ${atualizado.nome} atualizados.`)
    } catch (e) {
      setErroDep(e.message)
    } finally {
      setProcessandoDep(false)
    }
  }

  const removerDependente = async (p) => {
    setErroDep('')
    setSucessoDep('')
    setProcessandoDep(true)
    try {
      await pacienteApi.removerDependente(p.publicId)
      setEstado((atual) => ({ ...atual, pacientes: atual.pacientes.filter((x) => x.publicId !== p.publicId) }))
      setConfirmandoRemocao(null)
      setSucessoDep(`${p.nome} foi removido da sua conta.`)
    } catch (e) {
      setErroDep(e.message)
      setConfirmandoRemocao(null)
    } finally {
      setProcessandoDep(false)
    }
  }

  const alterarCampoSenha = (evento) => {
    const { name, value } = evento.target
    setFormSenha((atual) => ({ ...atual, [name]: value }))
  }

  const salvarSenha = async (evento) => {
    evento.preventDefault()
    setErroSenha('')
    setSucessoSenha('')

    if (formSenha.novaSenha.length < 6) {
      setErroSenha('A nova senha deve ter no mínimo 6 caracteres.')
      return
    }
    if (formSenha.novaSenha !== formSenha.confirmarSenha) {
      setErroSenha('A confirmação não confere com a nova senha.')
      return
    }
    if (formSenha.novaSenha === formSenha.senhaAtual) {
      setErroSenha('A nova senha deve ser diferente da senha atual.')
      return
    }

    setSalvandoSenha(true)
    try {
      await usuarioApi.alterarSenha({ senhaAtual: formSenha.senhaAtual, novaSenha: formSenha.novaSenha })
      setFormSenha(SENHA_INICIAL)
      setSucessoSenha('Senha alterada com sucesso.')
    } catch (e) {
      setErroSenha(e.message)
    } finally {
      setSalvandoSenha(false)
    }
  }

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

            {sucessoForm && <div className="alert alert-success" role="status">{sucessoForm}</div>}

            {!editando && (
              <div className="perfil-grid">
                <section className="card panel-card" aria-labelledby="perfil-dados">
                  <div className="perfil-card-topo">
                    <h3 id="perfil-dados">Dados pessoais</h3>
                    <button type="button" className="btn btn-secondary btn-small" onClick={iniciarEdicao}>
                      Editar dados
                    </button>
                  </div>
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
            )}

            {editando && form && (
              <form className="perfil-edicao" onSubmit={salvarDados}>
                <div className="perfil-grid">
                  <section className="card panel-card" aria-labelledby="perfil-dados-edicao">
                    <h3 id="perfil-dados-edicao">Dados pessoais</h3>
                    <div className="perfil-campos">
                      <Campo id="nome" label="Nome completo" value={form.nome} onChange={alterarCampo} required />
                      <div className="field">
                        <label htmlFor="cpf">CPF (inalterável)</label>
                        <input id="cpf" type="text" value={formatarCpf(usuario.cpf)} disabled readOnly />
                      </div>
                      <Campo id="dataNascimento" label="Data de nascimento" type="date" max={hojeParaInput()} value={form.dataNascimento} onChange={alterarCampo} required />
                      <Campo id="telefone" label="Telefone" type="tel" maxLength={15} value={form.telefone} onChange={alterarCampo} required />
                      <div className="perfil-campo-largo">
                        <Campo id="email" label="E-mail" type="email" value={form.email} onChange={alterarCampo} required />
                      </div>
                    </div>
                  </section>

                  <section className="card panel-card" aria-labelledby="perfil-endereco-edicao">
                    <h3 id="perfil-endereco-edicao">Endereço</h3>
                    <div className="perfil-campos">
                      <Campo id="cep" label="CEP" inputMode="numeric" maxLength={9} value={form.cep} onChange={alterarCampo} required />
                      <Campo id="logradouro" label="Logradouro" value={form.logradouro} onChange={alterarCampo} required />
                      <Campo id="numero" label="Número" value={form.numero} onChange={alterarCampo} required />
                      <Campo id="complemento" label="Complemento" value={form.complemento} onChange={alterarCampo} />
                      <Campo id="bairro" label="Bairro" value={form.bairro} onChange={alterarCampo} required />
                      <Campo id="cidade" label="Cidade" value={form.cidade} onChange={alterarCampo} required />
                      <Campo id="estado" label="Estado (UF)" maxLength={2} value={form.estado} onChange={alterarCampo} required />
                    </div>
                  </section>
                </div>

                {erroForm && <div className="alert alert-error" role="alert">{erroForm}</div>}

                <div className="perfil-acoes-form">
                  <button type="submit" className="btn btn-primary" disabled={salvando}>
                    {salvando ? 'Salvando...' : 'Salvar alterações'}
                  </button>
                  <button type="button" className="btn btn-secondary" disabled={salvando} onClick={cancelarEdicao}>
                    Cancelar
                  </button>
                </div>
              </form>
            )}

            <section className="card panel-card" aria-labelledby="perfil-senha">
              <h3 id="perfil-senha">Segurança e senha</h3>
              <p className="muted-text">Para sua segurança, informe a senha atual antes de definir uma nova.</p>
              <form className="perfil-senha-form" onSubmit={salvarSenha}>
                <div className="perfil-campo-largo">
                  <Campo id="senhaAtual" label="Senha atual" type="password" autoComplete="current-password" value={formSenha.senhaAtual} onChange={alterarCampoSenha} required />
                </div>
                <Campo id="novaSenha" label="Nova senha" type="password" minLength={6} autoComplete="new-password" placeholder="Mínimo 6 caracteres" value={formSenha.novaSenha} onChange={alterarCampoSenha} required />
                <Campo id="confirmarSenha" label="Confirmar nova senha" type="password" autoComplete="new-password" value={formSenha.confirmarSenha} onChange={alterarCampoSenha} required />

                {erroSenha && <div className="alert alert-error perfil-campo-largo" role="alert">{erroSenha}</div>}
                {sucessoSenha && <div className="alert alert-success perfil-campo-largo" role="status">{sucessoSenha}</div>}

                <div className="perfil-campo-largo">
                  <button type="submit" className="btn btn-primary" disabled={salvandoSenha}>
                    {salvandoSenha ? 'Alterando...' : 'Alterar senha'}
                  </button>
                </div>
              </form>
            </section>

            <section className="card panel-card perfil-pacientes" aria-labelledby="perfil-pacientes">
              <h3 id="perfil-pacientes">Pacientes vinculados à sua conta</h3>
              <p className="muted-text">Você (titular) e os dependentes cadastrados para agendar exames.</p>
              {sucessoDep && <div className="alert alert-success" role="status">{sucessoDep}</div>}
              {erroDep && !editandoDep && <div className="alert alert-error" role="alert">{erroDep}</div>}

              <div className="card-list perfil-lista">
                {pacientes.map((p) => {
                  const dependente = p.parentesco !== 'TITULAR'

                  if (editandoDep === p.publicId && formDep) {
                    return (
                      <form key={p.publicId} className="perfil-dep-form" onSubmit={salvarDependente}>
                        <strong>Editar dados de {p.nome}</strong>
                        <div className="perfil-campos">
                          <Campo id="dep-nome" label="Nome completo" value={formDep.nome} onChange={(e) => alterarCampoDep('nome', e.target.value)} required />
                          <Campo id="dep-cpf" label="CPF (opcional)" inputMode="numeric" maxLength={14} placeholder="000.000.000-00" value={formDep.cpf} onChange={(e) => alterarCampoDep('cpf', e.target.value)} />
                          <Campo id="dep-nascimento" label="Data de nascimento" type="date" max={hojeParaInput()} value={formDep.dataNascimento} onChange={(e) => alterarCampoDep('dataNascimento', e.target.value)} required />
                          <div className="field">
                            <label htmlFor="dep-parentesco">Parentesco</label>
                            <select id="dep-parentesco" value={formDep.parentesco} onChange={(e) => alterarCampoDep('parentesco', e.target.value)}>
                              {PARENTESCOS.map((par) => (
                                <option key={par.value} value={par.value}>{par.label}</option>
                              ))}
                            </select>
                          </div>
                          <div className="perfil-campo-largo">
                            <Campo id="dep-convenio" label="Convênio (opcional)" value={formDep.convenio} onChange={(e) => alterarCampoDep('convenio', e.target.value)} />
                          </div>
                        </div>

                        {erroDep && <div className="alert alert-error" role="alert">{erroDep}</div>}

                        <div className="perfil-acoes-form">
                          <button type="submit" className="btn btn-primary btn-small" disabled={processandoDep}>
                            {processandoDep ? 'Salvando...' : 'Salvar alterações'}
                          </button>
                          <button type="button" className="btn btn-secondary btn-small" disabled={processandoDep} onClick={cancelarEdicaoDep}>
                            Cancelar
                          </button>
                        </div>
                      </form>
                    )
                  }

                  return (
                    <div key={p.publicId} className="list-item perfil-paciente-item">
                      <div>
                        <strong>{p.nome}</strong>
                        <p>
                          {ROTULOS_PARENTESCO[p.parentesco] ?? p.parentesco}
                          {' · '}Nascimento {formatarDataISO(p.dataNascimento)}
                          {p.cpf ? ` · CPF ${formatarCpf(p.cpf)}` : ''}
                        </p>

                        {confirmandoRemocao === p.publicId && (
                          <div className="perfil-confirmar-remocao" role="alertdialog" aria-label={`Remover ${p.nome}`}>
                            <span>Remover {p.nome} da sua conta? Os exames dele deixam de aparecer para você.</span>
                            <div className="perfil-acoes-form">
                              <button type="button" className="btn btn-danger btn-small" disabled={processandoDep} onClick={() => removerDependente(p)}>
                                {processandoDep ? 'Removendo...' : 'Sim, remover'}
                              </button>
                              <button type="button" className="btn btn-secondary btn-small" disabled={processandoDep} onClick={() => setConfirmandoRemocao(null)}>
                                Não
                              </button>
                            </div>
                          </div>
                        )}
                      </div>

                      <div className="perfil-paciente-acoes">
                        <span className="status-badge status-atendimento">{p.convenio}</span>
                        {dependente && confirmandoRemocao !== p.publicId && (
                          <>
                            <button type="button" className="btn btn-secondary btn-small" onClick={() => iniciarEdicaoDep(p)}>
                              Editar
                            </button>
                            <button
                              type="button"
                              className="btn btn-danger btn-small"
                              onClick={() => { setErroDep(''); setSucessoDep(''); setConfirmandoRemocao(p.publicId) }}
                            >
                              Remover
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  )
                })}
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
