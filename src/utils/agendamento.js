// Status que o backend devolve (constraint chk_agendamentos_status) -> texto e classe CSS já existentes.
const STATUS = {
  PENDENTE: { label: 'Pendente', classe: 'status-pendente' },
  CONFIRMADO: { label: 'Confirmado', classe: 'status-confirmado' },
  RECUSADO: { label: 'Recusado', classe: 'status-cancelado' },
  CONCLUIDO: { label: 'Concluído', classe: 'status-concluido' },
  CANCELADO: { label: 'Cancelado', classe: 'status-cancelado' },
}

export function infoStatus(status) {
  return STATUS[status] ?? { label: status, classe: 'status-atendimento' }
}

export function formatarData(iso) {
  return iso ? new Date(iso).toLocaleDateString('pt-BR') : '—'
}

export function formatarHora(iso) {
  return iso ? new Date(iso).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }) : '—'
}

export function formatarDataHora(iso) {
  return iso ? `${formatarData(iso)} às ${formatarHora(iso)}` : '—'
}

export function somenteDigitos(valor = '') {
  return valor.replace(/\D/g, '')
}

// Timestamp usado para ordenar: data confirmada ou, se ainda pendente, a mais próxima das 3 opções.
export function dataDeReferencia(agendamento) {
  if (agendamento.dataConfirmada) return new Date(agendamento.dataConfirmada).getTime()
  return Math.min(
    ...[agendamento.dataOpcao1, agendamento.dataOpcao2, agendamento.dataOpcao3].map((d) => new Date(d).getTime()),
  )
}

// Valor mínimo para <input type="datetime-local"> (agora, no fuso do navegador).
export function agoraParaInput() {
  const agora = new Date()
  agora.setMinutes(agora.getMinutes() - agora.getTimezoneOffset())
  return agora.toISOString().slice(0, 16)
}

// "2026-10-20T09:00" (datetime-local) -> ISO-8601 que o OffsetDateTime do backend aceita.
export function inputParaIso(valor) {
  return new Date(valor).toISOString()
}
