// Datas do agendamento: validação das opções escolhidas e montagem do que é enviado ao back-end.
//
// Os horários chegam prontos da agenda do hospital (SeletorHorario -> campo `dataHora` do back-end,
// um instante ISO com fuso). Não há mais digitação livre de data, então nada aqui precisa
// interpretar texto digitado pela pessoa.

import { BACKEND_ACEITA_DATAS_OPCIONAIS } from '../config/agendamento'
import { inputParaIso } from './agendamento'

/**
 * Valida as três opções da tela: só a 1ª é obrigatória; a 2ª e a 3ª podem ficar em branco.
 * Retorna a mensagem de erro, ou '' quando está tudo certo.
 */
export function validarOpcoesDeData(datas) {
  if (datas[0]) return ''
  return datas.some(Boolean)
    ? 'Informe a 1ª opção de data e horário. Ela é obrigatória.'
    : 'Escolha um dia e um horário livre para a 1ª opção.'
}

// Instantes escolhidos, em ISO (UTC), na ordem em que aparecem (pula as opções em branco).
export function opcoesPreenchidas(datas) {
  return datas
    .filter(Boolean)
    .map((valor) => {
      try {
        return inputParaIso(valor)
      } catch {
        return null
      }
    })
    .filter(Boolean)
}

/**
 * Monta { dataOpcao1, dataOpcao2, dataOpcao3 } a partir dos horários escolhidos (1 a 3, em ISO).
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
