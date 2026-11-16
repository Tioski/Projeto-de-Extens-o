import { useEffect, useState } from 'react'
import './Admin.css'
import '../../components/Agenda.css'
import AdminLayout from '../../components/AdminLayout'
import CalendarioAgenda from '../../components/CalendarioAgenda'
import { useAgendaMes, useHorariosDia } from '../../hooks/useAgenda'
import { recepcaoAgendaApi } from '../../services/api'
import { dataPorExtensoIso, horaCurta, hojeIso, mesAtual } from '../../utils/agenda'

const MODOS = {
  PADRAO: 'padrao',
  PROPRIO: 'proprio',
  FECHADO: 'fechado',
}

// Modo inicial do formulário de ajuste, a partir do que o backend diz sobre o dia.
function modoDoDia(info) {
  if (!info?.personalizado) return MODOS.PADRAO
  return info.disponivel ? MODOS.PROPRIO : MODOS.FECHADO
}

/** Horário de funcionamento que vale para todos os dias. */
function CartaoPadrao({ onAlterado }) {
  const [padrao, setPadrao] = useState(null)
  const [form, setForm] = useState({ horarioInicio: '', horarioFim: '', duracaoSlotMinutos: '' })
  const [erro, setErro] = useState('')
  const [enviando, setEnviando] = useState(false)

  useEffect(() => {
    let ativo = true
    recepcaoAgendaApi
      .obterPadrao()
      .then((dados) => {
        if (!ativo) return
        setPadrao(dados)
        setForm(formDoPadrao(dados))
      })
      .catch((e) => {
        if (ativo) setErro(e.message)
      })
    return () => {
      ativo = false
    }
  }, [])

  const alterar = (evento) => {
    const { name, value } = evento.target
    setForm((atual) => ({ ...atual, [name]: value }))
  }

  const salvar = async (evento) => {
    evento.preventDefault()
    setErro('')

    const duracao = Number(form.duracaoSlotMinutos)
    if (!form.horarioInicio || !form.horarioFim) return setErro('Informe a abertura e o encerramento.')
    if (!Number.isInteger(duracao) || duracao < 5 || duracao > 480) {
      return setErro('A duração de cada horário deve estar entre 5 e 480 minutos.')
    }

    setEnviando(true)
    try {
      const salvo = await recepcaoAgendaApi.atualizarPadrao({
        horarioInicio: form.horarioInicio,
        horarioFim: form.horarioFim,
        duracaoSlotMinutos: duracao,
      })
      setPadrao(salvo)
      setForm(formDoPadrao(salvo))
      onAlterado()
    } catch (e) {
      setErro(e.message)
    } finally {
      setEnviando(false)
    }
  }

  return (
    <section className="card adm-painel" aria-labelledby="agd-padrao-titulo">
      <div className="adm-painel-topo">
        <h2 id="agd-padrao-titulo">Horário de funcionamento</h2>
      </div>
      <p className="agd-resumo">
        Vale para todos os dias que não têm ajuste próprio.
        {padrao && ` Hoje a grade tem ${padrao.horariosPorDia} horários por dia.`}
      </p>

      <form onSubmit={salvar} noValidate>
        <div className="adm-form-grid">
          <div className="field">
            <label htmlFor="agd-padrao-inicio">Abertura</label>
            <input id="agd-padrao-inicio" name="horarioInicio" type="time" value={form.horarioInicio} onChange={alterar} disabled={enviando || !padrao} />
          </div>
          <div className="field">
            <label htmlFor="agd-padrao-fim">Encerramento</label>
            <input id="agd-padrao-fim" name="horarioFim" type="time" value={form.horarioFim} onChange={alterar} disabled={enviando || !padrao} />
          </div>
          <div className="field largo">
            <label htmlFor="agd-padrao-duracao">Duração de cada horário (minutos)</label>
            <input
              id="agd-padrao-duracao"
              name="duracaoSlotMinutos"
              type="number"
              min={5}
              max={480}
              step={5}
              value={form.duracaoSlotMinutos}
              onChange={alterar}
              disabled={enviando || !padrao}
            />
            <small className="adm-dica">O último horário começa de modo a terminar até o encerramento.</small>
          </div>
        </div>

        {erro && <div className="alert alert-error" role="alert" style={{ marginTop: '1rem' }}>{erro}</div>}

        <div className="adm-modal-acoes">
          <button type="submit" className="btn btn-primary" disabled={enviando || !padrao}>
            {enviando ? 'Salvando...' : 'Salvar horário padrão'}
          </button>
        </div>
      </form>
    </section>
  )
}

function formDoPadrao(p) {
  return {
    horarioInicio: horaCurta(p.horarioInicio),
    horarioFim: horaCurta(p.horarioFim),
    duracaoSlotMinutos: String(p.duracaoSlotMinutos),
  }
}

/** Detalhe de um dia: grade de horários + ajuste (fechar, horário próprio ou voltar ao padrão). */
function DetalheDia({ data, info, versao, onAlterado }) {
  const { horarios, erro: erroGrade, carregando } = useHorariosDia(data, versao)
  const passado = data < hojeIso()

  const [modo, setModo] = useState(() => modoDoDia(info))
  const [inicio, setInicio] = useState(() => horaCurta(info?.horarioInicio) || '08:00')
  const [fim, setFim] = useState(() => horaCurta(info?.horarioFim) || '12:00')
  const [motivo, setMotivo] = useState(() => info?.motivo ?? '')
  const [erro, setErro] = useState('')
  const [enviando, setEnviando] = useState(false)

  const salvar = async (evento) => {
    evento.preventDefault()
    setErro('')

    if (modo === MODOS.PROPRIO && (!inicio || !fim)) return setErro('Informe a abertura e o encerramento do dia.')

    setEnviando(true)
    try {
      if (modo === MODOS.PADRAO) {
        // Sem ajuste: apenas remove o que existia. Se já seguia o padrão, não há o que salvar.
        if (info?.personalizado) await recepcaoAgendaApi.restaurarDia(data)
      } else if (modo === MODOS.FECHADO) {
        await recepcaoAgendaApi.definirDia(data, { disponivel: false, motivo: motivo.trim() || null })
      } else {
        await recepcaoAgendaApi.definirDia(data, {
          disponivel: true,
          horarioInicio: inicio,
          horarioFim: fim,
          motivo: motivo.trim() || null,
        })
      }
      onAlterado('Dia atualizado.')
    } catch (e) {
      // Ex.: "Esta alteração deixaria 2 agendamentos confirmados fora do horário..."
      setErro(e.message)
    } finally {
      setEnviando(false)
    }
  }

  const resumoGrade = horarios?.disponivel
    ? `${horarios.horarios.filter((h) => h.situacao === 'LIVRE').length} livres de ${horarios.horarios.length} horários`
    : null

  return (
    <section className="card adm-painel" aria-labelledby="agd-dia-titulo">
      <div className="adm-painel-topo">
        <h2 id="agd-dia-titulo">{dataPorExtensoIso(data)}</h2>
      </div>

      {erroGrade && <div className="alert alert-error" role="alert">{erroGrade}</div>}
      {carregando && <p className="agd-vazio">Carregando horários...</p>}
      {horarios && !horarios.disponivel && (
        <p className="agd-resumo">Dia fechado{horarios.motivo ? `: ${horarios.motivo}` : '.'}</p>
      )}
      {resumoGrade && <p className="agd-resumo">{resumoGrade}. Horários riscados já estão reservados.</p>}

      {horarios?.disponivel && (
        <div className="agd-slots" role="list" aria-label="Horários do dia" style={{ marginBottom: '1.25rem' }}>
          {horarios.horarios.map((h) => (
            <span
              key={h.dataHora}
              role="listitem"
              className={`agd-slot${h.situacao === 'OCUPADO' ? ' ocupado' : ''}${h.situacao === 'PASSADO' ? ' passado' : ''}`}
              style={{ textAlign: 'center', cursor: 'default', opacity: h.situacao === 'LIVRE' ? 1 : 0.65 }}
              title={{ LIVRE: 'Livre', OCUPADO: 'Reservado', PASSADO: 'Já passou' }[h.situacao]}
            >
              {horaCurta(h.inicio)}
            </span>
          ))}
        </div>
      )}

      {passado ? (
        <p className="adm-dica">Este dia já passou e não pode ser alterado.</p>
      ) : (
        <form onSubmit={salvar} noValidate>
          <fieldset className="agd-modos" disabled={enviando}>
            <legend className="adm-oculto">Como este dia funciona</legend>
            <label><input type="radio" name="agd-modo" checked={modo === MODOS.PADRAO} onChange={() => setModo(MODOS.PADRAO)} /> Seguir o padrão</label>
            <label><input type="radio" name="agd-modo" checked={modo === MODOS.PROPRIO} onChange={() => setModo(MODOS.PROPRIO)} /> Horário próprio</label>
            <label><input type="radio" name="agd-modo" checked={modo === MODOS.FECHADO} onChange={() => setModo(MODOS.FECHADO)} /> Fechar o dia</label>
          </fieldset>

          <div className="adm-form-grid">
            {modo === MODOS.PROPRIO && (
              <>
                <div className="field">
                  <label htmlFor="agd-dia-inicio">Abertura</label>
                  <input id="agd-dia-inicio" type="time" value={inicio} onChange={(e) => setInicio(e.target.value)} disabled={enviando} />
                </div>
                <div className="field">
                  <label htmlFor="agd-dia-fim">Encerramento</label>
                  <input id="agd-dia-fim" type="time" value={fim} onChange={(e) => setFim(e.target.value)} disabled={enviando} />
                </div>
              </>
            )}
            {modo !== MODOS.PADRAO && (
              <div className="field largo">
                <label htmlFor="agd-dia-motivo">Motivo (opcional)</label>
                <input
                  id="agd-dia-motivo"
                  type="text"
                  maxLength={200}
                  placeholder={modo === MODOS.FECHADO ? 'Ex.: Feriado' : 'Ex.: Meio expediente'}
                  value={motivo}
                  onChange={(e) => setMotivo(e.target.value)}
                  disabled={enviando}
                />
              </div>
            )}
          </div>

          {erro && <div className="alert alert-error" role="alert" style={{ marginTop: '1rem' }}>{erro}</div>}
          <div className="adm-modal-acoes">
            <button type="submit" className="btn btn-primary" disabled={enviando || (modo === MODOS.PADRAO && !info?.personalizado)}>
              {enviando ? 'Salvando...' : modo === MODOS.PADRAO ? 'Voltar ao padrão' : 'Salvar ajuste do dia'}
            </button>
          </div>
        </form>
      )}
    </section>
  )
}

function AdminAgenda({ session = null, currentPage = 'recepcao-agenda', onNavigate = () => {}, onLogout = () => {} }) {
  const [mes, setMes] = useState(() => mesAtual())
  const [dia, setDia] = useState('')
  const [versao, setVersao] = useState(0)
  const [aviso, setAviso] = useState('')

  const { dias, erro, carregando } = useAgendaMes(mes.ano, mes.mes, versao)
  const recarregar = (mensagem = '') => {
    setAviso(mensagem)
    setVersao((v) => v + 1)
  }
  const escolherDia = (data) => {
    setAviso('')
    setDia(data)
  }
  const info = dias[dia]

  return (
    <AdminLayout
      session={session}
      currentPage={currentPage}
      onNavigate={onNavigate}
      onLogout={onLogout}
      titulo="Agenda"
      subtitulo="Defina o horário de atendimento, feche dias e acompanhe os horários livres."
    >
      <div className="agd-admin">
        <CartaoPadrao onAlterado={() => recarregar('Horário de funcionamento atualizado.')} />
        {aviso && <div className="alert alert-success" role="status">{aviso}</div>}

        <div className="agd-admin-cols">
          <section className="card adm-painel" aria-label="Calendário">
            {erro && <div className="alert alert-error" role="alert" style={{ marginBottom: '1rem' }}>{erro}</div>}
            <CalendarioAgenda
              mes={mes}
              onMudarMes={setMes}
              dias={dias}
              selecionado={dia}
              onSelecionar={escolherDia}
              carregando={carregando}
              mostrarAjustes
            />
          </section>

          {dia ? (
            // `key` recria o formulário ao trocar de dia ou quando o backend devolve o ajuste atualizado.
            <DetalheDia
              key={[dia, info?.personalizado, info?.disponivel, info?.horarioInicio, info?.horarioFim, info?.motivo].join('|')}
              data={dia}
              info={info}
              versao={versao}
              onAlterado={recarregar}
            />
          ) : (
            <section className="card adm-painel">
              <p className="agd-vazio">Escolha um dia no calendário para ver os horários e ajustar a agenda.</p>
            </section>
          )}
        </div>
      </div>
    </AdminLayout>
  )
}

export default AdminAgenda
