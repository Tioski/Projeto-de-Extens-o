// Datas do agendamento: leitura segura do <input type="datetime-local">, validação das opções e
// montagem do que é enviado ao back-end.
//
// Por que existe: o campo nativo devolve strings como "20275-11-10T09:30" (ano com 5 ou 6 dígitos)
// quando a pessoa digita um dígito a mais. `new Date(...)` dessa string é uma data inválida e
// `.toISOString()` lança "Invalid time value" — se isso acontece durante a renderização, o React
// desmonta tudo e a tela fica branca. Aqui NADA lança exceção: data inválida vira `null`.

import { BACKEND_ACEITA_DATAS_OPCIONAIS } from '../config/agendamento'

const FORMATO = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})$/

const pad = (n) => String(n).padStart(2, '0')

// "2027-11-10T09:30" (hora local) -> Date. Devolve null para qualquer valor que não seja uma data real.
export function lerDataHoraLocal(valor) {
  const m = typeof valor === 'string' ? FORMATO.exec(valor) : null
  if (!m) return null

  const [ano, mes, dia, hora, minuto] = m.slice(1).map(Number)
  const data = new Date(ano, mes - 1, dia, hora, minuto)
  if (Number.isNaN(data.getTime())) return null

  // O JavaScript "corrige" datas impossíveis (31/02 vira 03/03, ano 27 vira 1927). Aqui elas são rejeitadas.
  const confere =
    data.getFullYear() === ano &&
    data.getMonth() === mes - 1 &&
    data.getDate() === dia &&
    data.getHours() === hora &&
    data.getMinutes() === minuto
  return confere ? data : null
}

// "2027-11-10T09:30" -> ISO-8601 em UTC (o que o OffsetDateTime do back-end aceita), ou null se inválida.
export function dataHoraParaIso(valor) {
  return lerDataHoraLocal(valor)?.toISOString() ?? null
}

// "2027-11-10T09:30" -> "10/11/2027 às 09:30". Para valor vazio ou inválido devolve "—".
export function formatarDataHoraLocal(valor) {
  const d = lerDataHoraLocal(valor)
  if (!d) return '—'
  return `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()} às ${pad(d.getHours())}:${pad(d.getMinutes())}`
}

/**
 * Valida as três opções de data e horário da tela.
 *  - a 1ª é obrigatória; a 2ª e a 3ª são opcionais;
 *  - cada data informada precisa ser real (ano com 4 dígitos) e estar no futuro;
 *  - as datas informadas não podem se repetir.
 *
 * `incompletos[i]` indica que o campo foi preenchido só em parte (o navegador devolve "" nesse caso;
 * quem chama lê `input.validity.badInput`).
 *
 * Retorna um objeto { indice: mensagem } — vazio quando está tudo certo.
 */
export function validarOpcoesDeData(datas, incompletos = []) {
  const erros = {}
  const vistos = new Map() // instante (ms) -> índice da primeira ocorrência

  datas.forEach((valor, i) => {
    const rotulo = `${i + 1}ª opção`

    if (!valor) {
      if (incompletos[i]) {
        erros[i] = `A ${rotulo} está incompleta. Preencha dia, mês, ano e horário, ou limpe o campo.`
      }
      return
    }

    const data = lerDataHoraLocal(valor)
    if (!data) {
      erros[i] = `A ${rotulo} tem uma data inválida. Confira o ano (4 dígitos) e o horário.`
      return
    }
    if (data.getTime() <= Date.now()) {
      erros[i] = `A ${rotulo} precisa estar no futuro.`
      return
    }
    if (vistos.has(data.getTime())) {
      erros[i] = `A ${rotulo} repete a ${vistos.get(data.getTime()) + 1}ª opção. Escolha outro horário ou limpe o campo.`
      return
    }
    vistos.set(data.getTime(), i)
  })

  if (!datas[0] && erros[0] === undefined) {
    erros[0] = datas.some(Boolean)
      ? 'Informe a 1ª opção de data e horário. Ela é obrigatória.'
      : 'Informe pelo menos uma data e horário (1ª opção).'
  }

  return erros
}

// Datas preenchidas e válidas, em ISO, na ordem em que aparecem (pula as opções em branco).
export function opcoesPreenchidas(datas) {
  return datas.map(dataHoraParaIso).filter(Boolean)
}

/**
 * Monta { dataOpcao1, dataOpcao2, dataOpcao3 } a partir das datas informadas (1 a 3, em ISO).
 *
 * Back-end que ainda exige as três datas: as que faltam repetem a última informada
 *   1 data  -> [a, a, a]      2 datas -> [a, b, b]
 * Back-end ajustado (VITE_BACKEND_DATAS_OPCIONAIS=true): as que faltam vão como null.
 */
export function montarOpcoesParaApi(isos) {
  const [a, b, c] = isos
  if (BACKEND_ACEITA_DATAS_OPCIONAIS) {
    return { dataOpcao1: a, dataOpcao2: b ?? null, dataOpcao3: c ?? null }
  }
  return { dataOpcao1: a, dataOpcao2: b ?? a, dataOpcao3: c ?? b ?? a }
}

// Datas sugeridas de um agendamento, sem repetições e sem vazios (para exibir ao paciente).
export function datasSugeridas(agendamento) {
  const unicas = new Map()
  for (const iso of [agendamento.dataOpcao1, agendamento.dataOpcao2, agendamento.dataOpcao3]) {
    const t = iso ? new Date(iso).getTime() : NaN
    if (!Number.isNaN(t) && !unicas.has(t)) unicas.set(t, iso)
  }
  return [...unicas.values()]
}
