import { useEffect, useState } from 'react'
import { exameApi, recepcaoApi } from '../../services/api'
import { agoraParaInput, inputParaIso } from '../../utils/agendamento'

const FORM_INICIAL = { exame: '', dataHora: '', consultorio: '', observacao: '' }

/**
 * Formulário para a recepção agendar um exame para um paciente já cadastrado.
 * O agendamento nasce CONFIRMADO, com data, horário e consultório definidos.
 */
function AgendarExameForm({ pacientePublicId, onAgendado, onVoltar }) {
  const [exames, setExames] = useState([])
  const [erroExames, setErroExames] = useState('')
  const [form, setForm] = useState(FORM_INICIAL)
  const [erro, setErro] = useState('')
  const [enviando, setEnviando] = useState(false)

  useEffect(() => {
    let ativo = true
    exameApi
      .listar()
      .then((lista) => ativo && setExames(lista))
      .catch((e) => ativo && setErroExames(e.message))
    return () => {
      ativo = false
    }
  }, [])

  const alterar = (evento) => {
    const { name, value } = evento.target
    setForm((atual) => ({ ...atual, [name]: value }))
  }

  const enviar = async (evento) => {
    evento.preventDefault()
    setErro('')

    if (!form.exame) return setErro('Selecione o exame.')
    if (!form.dataHora || new Date(form.dataHora).getTime() <= Date.now()) {
      return setErro('Informe uma data e um horário no futuro.')
    }
    if (!form.consultorio.trim()) return setErro('Informe o consultório onde o exame será realizado.')

    setEnviando(true)
    try {
      const criado = await recepcaoApi.agendar({
        pacientePublicId,
        examePublicId: form.exame,
        dataAgendada: inputParaIso(form.dataHora),
        consultorio: form.consultorio.trim(),
        observacao: form.observacao.trim() || null,
      })
      await onAgendado(criado)
    } catch (e) {
      setErro(e.message)
      setEnviando(false)
    }
  }

  return (
    <form onSubmit={enviar} noValidate>
      {erroExames && <div className="alert alert-error" role="alert" style={{ marginBottom: '1rem' }}>{erroExames}</div>}

      <div className="adm-form-grid">
        <div className="field largo">
          <label htmlFor="agendar-exame">Exame *</label>
          <select id="agendar-exame" name="exame" value={form.exame} onChange={alterar} disabled={enviando} autoFocus>
            <option value="">Selecione o exame</option>
            {exames.map((e) => (
              <option key={e.publicId} value={e.publicId}>{e.nome}</option>
            ))}
          </select>
        </div>
        <div className="field">
          <label htmlFor="agendar-data">Data e horário *</label>
          <input
            id="agendar-data"
            name="dataHora"
            type="datetime-local"
            min={agoraParaInput()}
            value={form.dataHora}
            onChange={alterar}
            disabled={enviando}
          />
        </div>
        <div className="field">
          <label htmlFor="agendar-consultorio">Consultório *</label>
          <input
            id="agendar-consultorio"
            name="consultorio"
            type="text"
            maxLength={100}
            placeholder="Ex.: Sala 204 - Bloco B"
            value={form.consultorio}
            onChange={alterar}
            disabled={enviando}
          />
        </div>
        <div className="field largo">
          <label htmlFor="agendar-observacao">Observação (opcional)</label>
          <input
            id="agendar-observacao"
            name="observacao"
            type="text"
            placeholder="Ex.: chegar em jejum de 8 horas"
            value={form.observacao}
            onChange={alterar}
            disabled={enviando}
          />
        </div>
      </div>

      {erro && <div className="alert alert-error" role="alert" style={{ marginTop: '1rem' }}>{erro}</div>}

      <div className="adm-modal-acoes">
        <button type="submit" className="btn btn-primary" disabled={enviando}>
          {enviando ? 'Agendando...' : 'Agendar exame'}
        </button>
        <button type="button" className="btn btn-secondary" disabled={enviando} onClick={onVoltar}>
          Voltar
        </button>
      </div>
    </form>
  )
}

export default AgendarExameForm
