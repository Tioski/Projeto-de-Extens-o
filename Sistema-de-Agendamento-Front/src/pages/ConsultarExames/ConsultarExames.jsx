import { useState } from 'react'
import './ConsultarExames.css'
import { agendamentoApi } from '../../services/api'
import { useAgendamentos } from '../../hooks/useAgendamentos'
import {
  ROTULOS_PARENTESCO,
  formatarData,
  formatarDataHora,
  formatarHora,
  infoStatus,
} from '../../utils/agendamento'
import { datasSugeridas } from '../../utils/datas'

function ConsultarExamesPage({ onNavigate = () => {} }) {
  const { agendamentos, nomeDoExame, pacienteDoAgendamento, carregando, erro, recarregar } = useAgendamentos()
  const [busca, setBusca] = useState('')
  const [cancelando, setCancelando] = useState(null)
  const [erroAcao, setErroAcao] = useState('')

  const termo = busca.trim().toLowerCase()
  const lista = agendamentos
    .filter((a) => nomeDoExame(a.examePublicId).toLowerCase().includes(termo))
    .sort((a, b) => new Date(b.dataCriacao) - new Date(a.dataCriacao))

  const handleCancelar = async (publicId) => {
    if (!window.confirm('Deseja realmente cancelar este agendamento?')) return

    setErroAcao('')
    setCancelando(publicId)
    try {
      await agendamentoApi.cancelar(publicId)
      await recarregar()
    } catch (e) {
      setErroAcao(e.message)
    } finally {
      setCancelando(null)
    }
  }

  return (
    <div className="page-shell">
      <div className="container page-section consult-section">
        <div className="page-header">
          <h1>Consultar exames</h1>
          <p>Visualize os exames disponíveis e agendados, acompanhando status e informações importantes do seu atendimento.</p>
        </div>

        <div className="search-panel card">
          <label className="field search-wrap" htmlFor="buscar-exame">
            <span>Buscar exame</span>
            <input
              id="buscar-exame"
              className="search-input"
              type="text"
              placeholder="Digite o nome do exame"
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
            />
          </label>
        </div>

        {erro && <div className="alert alert-error" role="alert">{erro}</div>}
        {erroAcao && <div className="alert alert-error" role="alert">{erroAcao}</div>}
        {carregando && <p className="muted-text">Carregando agendamentos...</p>}
        {!carregando && !erro && lista.length === 0 && (
          <p className="muted-text">Nenhum agendamento encontrado.</p>
        )}

        <div className="exam-list">
          {lista.map((a) => {
            const status = infoStatus(a.status)
            const paciente = pacienteDoAgendamento(a.pacientePublicId)
            const podeCancelar = a.status === 'PENDENTE' || a.status === 'CONFIRMADO'

            return (
              <article key={a.publicId} className="card exam-card">
                <div className="exam-header">
                  <div>
                    <h3>{nomeDoExame(a.examePublicId)}</h3>
                    {paciente && (
                      <p>
                        Paciente: {paciente.nome} ({ROTULOS_PARENTESCO[paciente.parentesco] ?? paciente.parentesco})
                      </p>
                    )}
                    <p>Solicitado em {formatarDataHora(a.dataCriacao)}</p>
                  </div>
                  <span className={`status-badge ${status.classe}`}>{status.label}</span>
                </div>

                <div className="exam-meta">
                  <div><span>Data</span><strong>{a.dataConfirmada ? formatarData(a.dataConfirmada) : 'A definir'}</strong></div>
                  <div><span>Horário</span><strong>{a.dataConfirmada ? formatarHora(a.dataConfirmada) : '—'}</strong></div>
                  <div><span>Consultório</span><strong>{a.consultorio || (a.status === 'PENDENTE' ? 'A definir' : '—')}</strong></div>
                </div>

                {a.status === 'PENDENTE' && (
                  <p className="muted-text">
                    {datasSugeridas(a).length > 1 ? 'Datas sugeridas' : 'Data sugerida'}: {datasSugeridas(a).map(formatarDataHora).join(' • ')}
                  </p>
                )}
                {a.observacao && <p className="muted-text">Observação: {a.observacao}</p>}

                <div className="exam-actions">
                  {a.status === 'CONCLUIDO' ? (
                    // Exame já feito fica no histórico; a nova solicitação sai com exame e paciente já escolhidos.
                    <button
                      type="button"
                      className="btn btn-secondary"
                      onClick={() => onNavigate('novo-exame', { modo: 'novo', agendamento: a })}
                    >
                      Agendar novamente
                    </button>
                  ) : (
                    // Reagendar troca este agendamento por um novo, com as datas que o paciente escolher.
                    <button
                      type="button"
                      className="btn btn-secondary"
                      onClick={() => onNavigate('novo-exame', { modo: 'reagendar', agendamento: a })}
                    >
                      Reagendar
                    </button>
                  )}
                  {podeCancelar && (
                    <button
                      type="button"
                      className="btn btn-danger"
                      disabled={cancelando === a.publicId}
                      onClick={() => handleCancelar(a.publicId)}
                    >
                      {cancelando === a.publicId ? 'Cancelando...' : 'Cancelar'}
                    </button>
                  )}
                </div>
              </article>
            )
          })}
        </div>
      </div>
    </div>
  )
}

export default ConsultarExamesPage
