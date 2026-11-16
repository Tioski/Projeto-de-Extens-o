import { dataDeReferencia, formatarData, formatarHora } from './agendamento'

export const STATUS_LISTA = ['PENDENTE', 'CONFIRMADO', 'CONCLUIDO', 'RECUSADO', 'CANCELADO']

export function contarPorStatus(lista) {
  const contagem = Object.fromEntries(STATUS_LISTA.map((s) => [s, 0]))
  lista.forEach((a) => {
    if (a.status in contagem) contagem[a.status] += 1
  })
  return contagem
}

export function mesmoDia(iso, referencia = new Date()) {
  if (!iso) return false
  return new Date(iso).toDateString() === referencia.toDateString()
}

export function iniciais(nome = '') {
  return (
    nome
      .trim()
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((parte) => parte[0].toUpperCase())
      .join('') || '?'
  )
}

export const primeiroNome = (nome = '') => nome.trim().split(/\s+/)[0] || ''

export function saudacao(agora = new Date()) {
  const hora = agora.getHours()
  if (hora < 12) return 'Bom dia'
  if (hora < 18) return 'Boa tarde'
  return 'Boa noite'
}

// "Segunda-feira, 15 de setembro de 2026"
export function dataPorExtenso(data = new Date()) {
  const texto = data.toLocaleDateString('pt-BR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
  return texto.charAt(0).toUpperCase() + texto.slice(1)
}

// Data/hora que melhor representa o agendamento na lista:
// a confirmada; senão a primeira das opções sugeridas pelo paciente.
export function dataExibida(a) {
  if (a.dataConfirmada) return { iso: a.dataConfirmada, sugerida: false }
  return { iso: a.dataOpcao1, sugerida: true }
}

export function textoDataHora(iso) {
  return `${formatarData(iso)} • ${formatarHora(iso)}`
}

// "Próximos": pedidos aguardando decisão e exames confirmados que ainda vão acontecer.
// Todo o resto (concluídos, cancelados, recusados e confirmados com data vencida) é histórico.
export function ehProximo(a, agora = Date.now()) {
  if (a.status === 'PENDENTE') return true
  if (a.status !== 'CONFIRMADO') return false
  return dataDeReferencia(a) >= agora
}

// Pendente não se cancela: a recepção decide entre confirmar ou recusar. Só o confirmado pode ser cancelado.
export function podeCancelar(a) {
  return a.status === 'CONFIRMADO'
}

export function podeRecusar(a) {
  return a.status === 'PENDENTE'
}

export const ROTULO_STATUS_FILTRO = {
  PENDENTE: 'Pendentes',
  CONFIRMADO: 'Confirmados',
  CONCLUIDO: 'Concluídos',
  RECUSADO: 'Recusados',
  CANCELADO: 'Cancelados',
}

// Relógio isolado em funções: os componentes não chamam Date.now()/new Date() direto no render.
export const agoraMs = () => Date.now()
export const agoraData = () => new Date()
export const dataIsoHoje = () => new Date().toISOString().slice(0, 10)
export const dataPassou = (iso) => new Date(iso).getTime() < Date.now()

// ---- Pacientes ----
export const soDigitos = (valor = '') => String(valor ?? '').replace(/\D/g, '')

// minúsculas e sem acento, para a busca achar "João" digitando "joao"
export const normalizar = (valor = '') =>
  String(valor ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()

// "1988-08-24" -> idade em anos (sem passar por Date no fuso, para não errar o dia)
export function idadeEmAnos(iso) {
  const m = String(iso ?? '').match(/^(\d{4})-(\d{2})-(\d{2})/)
  if (!m) return null
  const hoje = new Date()
  let anos = hoje.getFullYear() - Number(m[1])
  const aindaNaoFez = hoje.getMonth() + 1 < Number(m[2]) || (hoje.getMonth() + 1 === Number(m[2]) && hoje.getDate() < Number(m[3]))
  if (aindaNaoFez) anos -= 1
  return anos
}

// ---- Usuários (área do administrador) ----
export const ROTULOS_CARGO = {
  PACIENTE: 'Paciente',
  RECEPCIONISTA: 'Recepcionista',
  ADMIN: 'Administrador',
}
