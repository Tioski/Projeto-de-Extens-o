// Helpers de data da agenda. O backend interpreta dia e hora em America/Sao_Paulo,
// então o "dia" de um horário e o "hoje" são calculados nesse fuso (e não no do navegador).
const FUSO = 'America/Sao_Paulo'

const formatadorData = new Intl.DateTimeFormat('en-CA', {
  timeZone: FUSO,
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
})

const pad = (n) => String(n).padStart(2, '0')
const capitalizar = (t) => t.charAt(0).toUpperCase() + t.slice(1)

export const DIAS_SEMANA_CURTO = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom']

// Instante (ISO) -> "AAAA-MM-DD" no fuso do hospital.
export const dataIsoDe = (iso) => formatadorData.format(new Date(iso))

// "Hoje" no fuso do hospital. Isolado aqui para os componentes não chamarem new Date() no render.
export const hojeIso = () => formatadorData.format(new Date())

export function mesAtual() {
  const [ano, mes] = hojeIso().split('-').map(Number)
  return { ano, mes: mes - 1 }
}

export const dataIso = (ano, mes, dia) => `${ano}-${pad(mes + 1)}-${pad(dia)}`
export const diasNoMes = (ano, mes) => new Date(ano, mes + 1, 0).getDate()

export function intervaloDoMes(ano, mes) {
  return { inicio: dataIso(ano, mes, 1), fim: dataIso(ano, mes, diasNoMes(ano, mes)) }
}

// Posição do dia 1 na grade (segunda = 0).
export const colunaDoPrimeiroDia = (ano, mes) => (new Date(ano, mes, 1).getDay() + 6) % 7

export function somarMeses({ ano, mes }, delta) {
  const total = ano * 12 + mes + delta
  return { ano: Math.floor(total / 12), mes: total % 12 }
}

export const compararMeses = (a, b) => a.ano * 12 + a.mes - (b.ano * 12 + b.mes)

export const nomeDoMes = (ano, mes) =>
  capitalizar(new Date(ano, mes, 1).toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' }))

// "2026-11-20" -> "Sexta-feira, 20 de novembro"
export const dataPorExtensoIso = (iso) =>
  capitalizar(
    new Date(`${iso}T12:00:00`).toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' }),
  )

// "09:00:00" -> "09:00"
export const horaCurta = (hora) => String(hora ?? '').slice(0, 5)

// Compara dois instantes ISO (um pode vir com offset, outro em UTC).
export const mesmoInstante = (a, b) => Boolean(a) && Boolean(b) && new Date(a).getTime() === new Date(b).getTime()
