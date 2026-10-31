import { useEffect, useRef, useState } from 'react'
import AgendarExameForm from './AgendarExameForm'
import Icone from '../../components/Icone'
import { dataDeReferencia, formatarData, formatarDataHora, infoStatus } from '../../utils/agendamento'
import { formatarCep, formatarCpf, formatarDataISO, formatarTelefone } from '../../utils/mascaras'
import { idadeEmAnos } from '../../utils/admin'

function Dado({ rotulo, valor, largo = false }) {
  return (
    <div className={largo ? 'largo' : undefined}>
      <dt>{rotulo}</dt>
      <dd>{valor || '—'}</dd>
    </div>
  )
}

const ROTULOS_PARENTESCO = {
  TITULAR: 'Titular',
  FILHO: 'Dependente (filho/a)',
  CONJUGE: 'Dependente (cônjuge)',
  PAI_MAE: 'Dependente (pai/mãe)',
  OUTRO: 'Dependente',
}

// Ficha completa do paciente + histórico de exames dele.
function AdminPacienteModal({ paciente, agendamentos, modoInicial = 'ficha', onFechar, onAgendado }) {
  const p = paciente
  const [modo, setModo] = useState(modoInicial) // 'ficha' | 'agendar'
  const dialogo = useRef(null)
  const e = p.endereco
  const idade = idadeEmAnos(p.dataNascimento)
  const dependente = p.parentesco !== 'TITULAR'

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

  const historico = agendamentos
    .filter((a) => a.pacientePublicId === p.publicId)
    .sort((x, y) => dataDeReferencia(y) - dataDeReferencia(x))

  const enderecoLinha = e
    ? `${e.logradouro}, ${e.numero}${e.complemento ? ` - ${e.complemento}` : ''} • ${e.bairro} • ${e.cidade}/${e.estado} • CEP ${formatarCep(e.cep)}`
    : ''

  return (
    <div className="adm-overlay" onMouseDown={(ev) => ev.target === ev.currentTarget && onFechar()}>
      <div
        ref={dialogo}
        className="adm-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="adm-paciente-titulo"
        tabIndex={-1}
      >
        <div className="adm-modal-topo">
          <div>
            <h2 id="adm-paciente-titulo">{modo === 'agendar' ? 'Agendar exame' : p.nome}</h2>
            <p>{modo === 'agendar' ? `Paciente: ${p.nome}` : (ROTULOS_PARENTESCO[p.parentesco] ?? p.parentesco)}</p>
          </div>
          <button type="button" className="adm-fechar" onClick={onFechar} aria-label="Fechar">
            <Icone nome="fechar" />
          </button>
        </div>

        {modo === 'agendar' ? (
          <AgendarExameForm
            pacientePublicId={p.publicId}
            onAgendado={onAgendado}
            onVoltar={() => setModo('ficha')}
          />
        ) : (
          <>
        <section className="adm-secao" aria-label="Dados pessoais">
          <h3>Dados pessoais</h3>
          <dl className="adm-dl">
            <Dado rotulo="Nome completo" valor={p.nome} />
            <Dado rotulo="CPF" valor={formatarCpf(p.cpf)} />
            <Dado
              rotulo="Data de nascimento"
              valor={`${formatarDataISO(p.dataNascimento)}${idade !== null ? ` (${idade} anos)` : ''}`}
            />
            <Dado rotulo="Convênio" valor={p.convenio} />
          </dl>
        </section>

        <section className="adm-secao" aria-label="Contato">
          <h3>{dependente ? 'Contato do responsável' : 'Contato'}</h3>
          <dl className="adm-dl">
            <Dado rotulo="Telefone" valor={formatarTelefone(p.telefone)} />
            <Dado rotulo="E-mail" valor={p.email} />
            {dependente && <Dado rotulo="Responsável" valor={p.responsavelNome} />}
            <Dado rotulo="Endereço" valor={enderecoLinha} largo />
          </dl>
        </section>

        <section className="adm-secao" aria-label="Histórico de exames">
          <h3>Exames ({historico.length})</h3>
          {historico.length === 0 && <p className="adm-vazio">Este paciente ainda não tem exames.</p>}
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
          <button type="button" className="btn btn-secondary" onClick={onFechar}>Fechar</button>
        </div>
          </>
        )}
      </div>
    </div>
  )
}

export default AdminPacienteModal
