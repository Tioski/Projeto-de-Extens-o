import { useState } from 'react'
import { pacienteApi } from '../../../services/api'
import { formatarDataISO, mascararCpf } from '../../../utils/mascaras'
import {
  PARENTESCOS,
  ROTULOS_PARENTESCO,
  hojeParaInput,
  somenteDigitos,
  validarDependente,
} from '../../../utils/agendamento'

const DEPENDENTE_VAZIO = { nome: '', cpf: '', dataNascimento: '', parentesco: 'FILHO', convenio: '' }

// Etapa 2 — quem fará o exame (titular ou dependente). Ao tocar em um paciente, avança para a etapa 3.
// Também permite cadastrar um dependente; depois de salvo, ele já fica selecionado e o assistente avança.
function EtapaPaciente({ pacientes, pacienteId, carregando, onEscolher, onDependenteSalvo, onVoltar, onContinuar }) {
  const [mostrarForm, setMostrarForm] = useState(false)
  const [dependente, setDependente] = useState(DEPENDENTE_VAZIO)
  const [salvando, setSalvando] = useState(false)
  const [erro, setErro] = useState('')

  const alterar = (campo, valor) => setDependente((atual) => ({ ...atual, [campo]: valor }))

  const salvar = async () => {
    setErro('')

    const problema = validarDependente(dependente)
    if (problema) {
      setErro(problema)
      return
    }

    setSalvando(true)
    try {
      const novo = await pacienteApi.cadastrarDependente({
        nome: dependente.nome.trim(),
        cpf: somenteDigitos(dependente.cpf) || null,
        dataNascimento: dependente.dataNascimento,
        parentesco: dependente.parentesco,
        convenio: dependente.convenio.trim() || null,
      })
      onDependenteSalvo(novo)
    } catch (e) {
      setErro(e.message)
      setSalvando(false)
    }
  }

  return (
    <>
      <div className="etapa-cabecalho">
        <h2 id="etapa-titulo" tabIndex={-1}>2. Quem fará o exame?</h2>
        <p className="muted-text">Toque em quem vai realizar o exame ou cadastre um dependente.</p>
      </div>

      {carregando && <p className="muted-text">Carregando pacientes...</p>}

      <div className="option-grid">
        {pacientes.map((p) => {
          const selecionado = p.publicId === pacienteId
          return (
            <button
              key={p.publicId}
              type="button"
              className={`option-button option-card ${selecionado ? 'selected' : ''}`}
              aria-pressed={selecionado}
              onClick={() => onEscolher(p.publicId)}
            >
              <strong>{p.nome}</strong>
              <small>
                {ROTULOS_PARENTESCO[p.parentesco] ?? p.parentesco}
                {p.dataNascimento ? ` · Nascimento ${formatarDataISO(p.dataNascimento)}` : ''}
              </small>
            </button>
          )
        })}
      </div>

      <div>
        <button
          type="button"
          className="btn btn-secondary btn-small"
          aria-expanded={mostrarForm}
          onClick={() => setMostrarForm((v) => !v)}
        >
          {mostrarForm ? 'Fechar cadastro de dependente' : 'Adicionar dependente'}
        </button>
      </div>

      {mostrarForm && (
        <div className="dependente-form">
          <div className="field">
            <label htmlFor="dep-nome">Nome completo</label>
            <input id="dep-nome" type="text" value={dependente.nome} onChange={(e) => alterar('nome', e.target.value)} />
          </div>
          <div className="field">
            <label htmlFor="dep-cpf">CPF (opcional)</label>
            <input
              id="dep-cpf"
              type="text"
              inputMode="numeric"
              maxLength={14}
              placeholder="000.000.000-00"
              value={dependente.cpf}
              onChange={(e) => alterar('cpf', mascararCpf(e.target.value))}
            />
          </div>
          <div className="field">
            <label htmlFor="dep-nascimento">Data de nascimento</label>
            <input
              id="dep-nascimento"
              type="date"
              min="1900-01-01"
              max={hojeParaInput()}
              value={dependente.dataNascimento}
              onChange={(e) => alterar('dataNascimento', e.target.value)}
            />
          </div>
          <div className="field">
            <label htmlFor="dep-parentesco">Parentesco</label>
            <select id="dep-parentesco" value={dependente.parentesco} onChange={(e) => alterar('parentesco', e.target.value)}>
              {PARENTESCOS.map((p) => (
                <option key={p.value} value={p.value}>{p.label}</option>
              ))}
            </select>
          </div>
          <div className="field">
            <label htmlFor="dep-convenio">Convênio (opcional)</label>
            <input id="dep-convenio" type="text" value={dependente.convenio} onChange={(e) => alterar('convenio', e.target.value)} />
          </div>

          <div className="dependente-form-acoes">
            {erro && <div className="alert alert-error" role="alert">{erro}</div>}
            <button type="button" className="btn btn-primary btn-small" disabled={salvando} onClick={salvar}>
              {salvando ? 'Salvando...' : 'Salvar e continuar'}
            </button>
          </div>
        </div>
      )}

      <div className="etapa-acoes">
        <button type="button" className="btn btn-secondary" onClick={onVoltar}>Voltar</button>
        <button type="button" className="btn btn-primary" disabled={!pacienteId} onClick={onContinuar}>
          Continuar
        </button>
      </div>
    </>
  )
}

export default EtapaPaciente
