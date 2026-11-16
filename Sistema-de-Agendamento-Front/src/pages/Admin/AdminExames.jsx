import { useCallback, useEffect, useRef, useState } from 'react'
import './Admin.css'
import AdminLayout from '../../components/AdminLayout'
import Icone from '../../components/Icone'
import { adminExameApi } from '../../services/api'
import { normalizar } from '../../utils/admin'

// Janela para adicionar um exame novo ou editar nome/descrição de um existente.
function ExameModal({ exame = null, onFechar, onSalvo }) {
  const editando = Boolean(exame)
  const [nome, setNome] = useState(exame?.nome ?? '')
  const [descricao, setDescricao] = useState(exame?.descricao ?? '')
  const [erro, setErro] = useState('')
  const [enviando, setEnviando] = useState(false)
  const dialogo = useRef(null)

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

  const enviar = async (evento) => {
    evento.preventDefault()
    setErro('')

    if (!nome.trim()) return setErro('Informe o nome do exame.')

    const dados = { nome: nome.trim(), descricao: descricao.trim() || null }
    setEnviando(true)
    try {
      const salvo = editando
        ? await adminExameApi.atualizar(exame.publicId, dados)
        : await adminExameApi.cadastrar(dados)
      await onSalvo(salvo, editando)
    } catch (e) {
      setErro(e.message)
      setEnviando(false)
    }
  }

  return (
    <div className="adm-overlay" onMouseDown={(ev) => ev.target === ev.currentTarget && onFechar()}>
      <div ref={dialogo} className="adm-modal" role="dialog" aria-modal="true" aria-labelledby="adm-exame-titulo" tabIndex={-1}>
        <div className="adm-modal-topo">
          <div>
            <h2 id="adm-exame-titulo">{editando ? 'Editar exame' : 'Adicionar exame'}</h2>
            <p>
              {editando
                ? 'Altere o nome ou a descrição que os pacientes veem.'
                : 'O novo exame já fica disponível para os pacientes agendarem.'}
            </p>
          </div>
          <button type="button" className="adm-fechar" onClick={onFechar} aria-label="Fechar">
            <Icone nome="fechar" />
          </button>
        </div>

        <form onSubmit={enviar} noValidate>
          <div className="adm-form-grid">
            <div className="field largo">
              <label htmlFor="exame-nome">Nome do exame *</label>
              <input
                id="exame-nome"
                type="text"
                maxLength={100}
                placeholder="Ex.: Hemograma completo"
                value={nome}
                onChange={(e) => setNome(e.target.value)}
                disabled={enviando}
                autoFocus
              />
            </div>
            <div className="field largo">
              <label htmlFor="exame-descricao">Descrição (opcional)</label>
              <textarea
                id="exame-descricao"
                rows={4}
                maxLength={1000}
                placeholder="Ex.: Avalia as células do sangue. Jejum de 8 horas."
                value={descricao}
                onChange={(e) => setDescricao(e.target.value)}
                disabled={enviando}
              />
            </div>
          </div>

          {erro && <div className="alert alert-error" role="alert" style={{ marginTop: '1rem' }}>{erro}</div>}

          <div className="adm-modal-acoes">
            <button type="submit" className="btn btn-primary" disabled={enviando}>
              {enviando ? 'Salvando...' : editando ? 'Salvar alterações' : 'Adicionar exame'}
            </button>
            <button type="button" className="btn btn-secondary" disabled={enviando} onClick={onFechar}>
              Cancelar
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

function AdminExames({ session = null, currentPage = 'admin-exames', onNavigate = () => {}, onLogout = () => {} }) {
  const [estado, setEstado] = useState({ exames: [], carregando: true, erro: '' })
  const [busca, setBusca] = useState('')
  const [situacao, setSituacao] = useState('') // '' | 'ATIVO' | 'INATIVO'
  const [janela, setJanela] = useState(null) // null | { exame } (exame null = novo)
  const [mensagem, setMensagem] = useState('')
  const [erroAcao, setErroAcao] = useState('')
  const [emAcao, setEmAcao] = useState(null) // publicId do exame com ação em andamento

  const recarregar = useCallback(async () => {
    try {
      const lista = await adminExameApi.listar()
      setEstado({ exames: lista, carregando: false, erro: '' })
    } catch (e) {
      setEstado((atual) => ({ ...atual, carregando: false, erro: e.message }))
    }
  }, [])

  useEffect(() => {
    recarregar()
  }, [recarregar])

  const { exames, carregando, erro } = estado
  const termo = normalizar(busca.trim())

  const filtrados = exames.filter((e) => {
    if (situacao === 'ATIVO' && !e.ativo) return false
    if (situacao === 'INATIVO' && e.ativo) return false
    if (!termo) return true
    return normalizar(e.nome).includes(termo) || normalizar(e.descricao).includes(termo)
  })

  const totalAtivos = exames.filter((e) => e.ativo).length

  const aoSalvar = async (salvo, editando) => {
    await recarregar()
    setJanela(null)
    setErroAcao('')
    setMensagem(
      editando ? `Exame “${salvo.nome}” atualizado.` : `Exame “${salvo.nome}” adicionado. Os pacientes já podem agendá-lo.`,
    )
  }

  const alternarStatus = async (exame) => {
    setMensagem('')
    setErroAcao('')
    setEmAcao(exame.publicId)
    try {
      await adminExameApi.alterarStatus(exame.publicId, !exame.ativo)
      await recarregar()
      setMensagem(
        exame.ativo
          ? `“${exame.nome}” foi retirado da lista: os pacientes não o veem mais para agendar. Os agendamentos antigos continuam salvos.`
          : `“${exame.nome}” voltou para a lista e os pacientes já podem agendá-lo.`,
      )
    } catch (e) {
      setErroAcao(e.message)
    } finally {
      setEmAcao(null)
    }
  }

  const excluir = async (exame) => {
    if (!window.confirm(`Excluir definitivamente o exame “${exame.nome}”? Essa ação não pode ser desfeita.`)) return

    setMensagem('')
    setErroAcao('')
    setEmAcao(exame.publicId)
    try {
      await adminExameApi.excluir(exame.publicId)
      await recarregar()
      setMensagem(`Exame “${exame.nome}” excluído.`)
    } catch (e) {
      // Exame com histórico de agendamentos não pode ser apagado: o backend orienta a retirá-lo da lista.
      setErroAcao(e.message)
    } finally {
      setEmAcao(null)
    }
  }

  return (
    <AdminLayout
      currentPage={currentPage}
      onNavigate={onNavigate}
      onLogout={onLogout}
      session={session}
      titulo="Exames"
      subtitulo="Defina quais exames o hospital oferece e aparecem para o paciente escolher."
    >
      <div className="adm-titulo-acao">
        <button type="button" className="btn btn-primary" onClick={() => setJanela({ exame: null })}>
          <Icone nome="mais" /> Adicionar Exame
        </button>
      </div>

      <div className="card adm-painel adm-tabela-card">
        <div className="adm-toolbar">
          <div className="adm-busca">
            <Icone nome="busca" />
            <label htmlFor="adm-busca-exame" className="adm-oculto">Buscar exame</label>
            <input
              id="adm-busca-exame"
              className="search-input"
              type="search"
              placeholder="Buscar exame pelo nome ou descrição..."
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
            />
          </div>
          <label className="adm-filtro">
            <span className="adm-oculto">Situação</span>
            <select className="adm-select" value={situacao} onChange={(e) => setSituacao(e.target.value)}>
              <option value="">Todos os exames</option>
              <option value="ATIVO">Disponíveis para agendar</option>
              <option value="INATIVO">Retirados da lista</option>
            </select>
          </label>
        </div>

        {mensagem && <div className="alert alert-success" role="status">{mensagem}</div>}
        {erro && <div className="alert alert-error" role="alert">{erro}</div>}
        {erroAcao && <div className="alert alert-error" role="alert">{erroAcao}</div>}
        {carregando && <p className="adm-vazio">Carregando exames...</p>}
        {!carregando && !erro && filtrados.length === 0 && <p className="adm-vazio">Nenhum exame encontrado.</p>}

        {filtrados.length > 0 && (
          <div className="adm-tabela-rolagem">
            <table className="adm-tabela">
              <thead>
                <tr>
                  <th scope="col">Exame</th>
                  <th scope="col">Situação</th>
                  <th scope="col" className="adm-col-acoes">Ações</th>
                </tr>
              </thead>
              <tbody>
                {filtrados.map((e) => (
                  <tr key={e.publicId}>
                    <td>
                      <strong>{e.nome}</strong>
                      {e.descricao && <small className="adm-exame-descricao">{e.descricao}</small>}
                    </td>
                    <td>
                      <span className={`status-badge ${e.ativo ? 'status-confirmado' : 'status-cancelado'}`}>
                        {e.ativo ? 'Disponível' : 'Retirado'}
                      </span>
                    </td>
                    <td className="adm-col-acoes">
                      <div className="adm-acoes-linha">
                        <button
                          type="button"
                          className="adm-icone-botao"
                          onClick={() => { setMensagem(''); setErroAcao(''); setJanela({ exame: e }) }}
                          disabled={emAcao === e.publicId}
                          aria-label={`Editar ${e.nome}`}
                          title="Editar"
                        >
                          <Icone nome="lapis" tamanho={16} />
                        </button>
                        <button
                          type="button"
                          className="btn btn-secondary btn-small"
                          onClick={() => alternarStatus(e)}
                          disabled={emAcao === e.publicId}
                        >
                          {e.ativo ? 'Retirar da lista' : 'Disponibilizar'}
                        </button>
                        <button
                          type="button"
                          className="adm-icone-botao perigo"
                          onClick={() => excluir(e)}
                          disabled={emAcao === e.publicId}
                          aria-label={`Excluir ${e.nome}`}
                          title="Excluir definitivamente"
                        >
                          <Icone nome="lixo" tamanho={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {exames.length > 0 && (
          <div className="adm-tabela-rodape">
            <span>
              {totalAtivos} de {exames.length} exames disponíveis para os pacientes
            </span>
          </div>
        )}
      </div>

      {janela && (
        <ExameModal
          key={janela.exame?.publicId ?? 'novo'}
          exame={janela.exame}
          onFechar={() => setJanela(null)}
          onSalvo={aoSalvar}
        />
      )}
    </AdminLayout>
  )
}

export default AdminExames
