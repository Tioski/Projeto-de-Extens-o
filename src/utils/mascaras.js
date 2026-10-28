// Máscaras de digitação (usadas nos onChange dos inputs) e formatadores de exibição.
// Regra geral: a máscara só acrescenta pontuação quando já existe um dígito depois dela,
// então apagar com Backspace nunca "trava" em cima de um ponto, hífen ou parêntese.

const digitos = (valor = '') => String(valor).replace(/\D/g, '')

// 33333333333 -> 333.333.333-33
export function mascararCpf(valor = '') {
  const d = digitos(valor).slice(0, 11)
  if (d.length <= 3) return d
  if (d.length <= 6) return `${d.slice(0, 3)}.${d.slice(3)}`
  if (d.length <= 9) return `${d.slice(0, 3)}.${d.slice(3, 6)}.${d.slice(6)}`
  return `${d.slice(0, 3)}.${d.slice(3, 6)}.${d.slice(6, 9)}-${d.slice(9)}`
}

// 47999999999 -> (47) 99999-9999   |   4733334444 -> (47) 3333-4444
export function mascararTelefone(valor = '') {
  const d = digitos(valor).slice(0, 11)
  if (d.length === 0) return ''
  if (d.length <= 2) return `(${d}`
  if (d.length <= 6) return `(${d.slice(0, 2)}) ${d.slice(2)}`
  if (d.length <= 10) return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`
  return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`
}

// 89460000 -> 89460-000
export function mascararCep(valor = '') {
  const d = digitos(valor).slice(0, 8)
  return d.length <= 5 ? d : `${d.slice(0, 5)}-${d.slice(5)}`
}

// ---- Exibição (dados vindos da API) ----
// Devolvem o valor original quando ele não tem o tamanho esperado, para nunca esconder dados.

export function formatarCpf(valor) {
  if (!valor) return '—'
  return digitos(valor).length === 11 ? mascararCpf(valor) : valor
}

export function formatarTelefone(valor) {
  if (!valor) return '—'
  const n = digitos(valor).length
  return n === 10 || n === 11 ? mascararTelefone(valor) : valor
}

export function formatarCep(valor) {
  if (!valor) return '—'
  return digitos(valor).length === 8 ? mascararCep(valor) : valor
}

// "2000-01-31" (LocalDate do backend) -> "31/01/2000", sem passar por Date (evita erro de fuso).
export function formatarDataISO(valor) {
  if (!valor) return '—'
  const m = String(valor).match(/^(\d{4})-(\d{2})-(\d{2})/)
  return m ? `${m[3]}/${m[2]}/${m[1]}` : valor
}
