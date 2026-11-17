import { useEffect, useState } from 'react'
import { agendaApi } from '../services/api'
import { intervaloDoMes } from '../utils/agenda'

/**
 * Dias de um mês com a disponibilidade de cada um: { 'AAAA-MM-DD': DiaAgendaResponseDTO }.
 * `versao` serve para forçar nova consulta depois de uma alteração.
 */
export function useAgendaMes(ano, mes, versao = 0) {
  const { inicio, fim } = intervaloDoMes(ano, mes)
  const chave = `${inicio}|${fim}|${versao}`
  const [resultado, setResultado] = useState({ chave: '', dias: {}, erro: '' })

  useEffect(() => {
    let ativo = true
    agendaApi
      .listarDias(inicio, fim)
      .then((lista) => {
        if (ativo) setResultado({ chave, dias: Object.fromEntries(lista.map((d) => [d.data, d])), erro: '' })
      })
      .catch((e) => {
        if (ativo) setResultado({ chave, dias: {}, erro: e.message })
      })
    return () => {
      ativo = false
    }
  }, [chave, inicio, fim])

  const atual = resultado.chave === chave
  return { dias: resultado.dias, erro: atual ? resultado.erro : '', carregando: !atual }
}

/** Grade de horários de um dia (LIVRE / OCUPADO / PASSADO). `data` vazio = nada a carregar. */
export function useHorariosDia(data, versao = 0) {
  const chave = data ? `${data}|${versao}` : ''
  const [resultado, setResultado] = useState({ chave: '', dados: null, erro: '' })

  useEffect(() => {
    if (!data) return undefined
    let ativo = true
    agendaApi
      .listarHorarios(data)
      .then((dados) => {
        if (ativo) setResultado({ chave, dados, erro: '' })
      })
      .catch((e) => {
        if (ativo) setResultado({ chave, dados: null, erro: e.message })
      })
    return () => {
      ativo = false
    }
  }, [chave, data])

  const atual = Boolean(chave) && resultado.chave === chave
  return {
    horarios: atual ? resultado.dados : null,
    erro: atual ? resultado.erro : '',
    carregando: Boolean(chave) && !atual,
  }
}
