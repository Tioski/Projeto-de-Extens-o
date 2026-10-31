import { useCallback, useEffect, useState } from 'react'
import { recepcaoApi } from '../services/api'

const INTERVALO_MS = 60000

// Roda `buscar` ao abrir a tela, a cada minuto e quando a aba volta a ficar visível,
// para a recepção não olhar números velhos (outra pessoa pode ter alterado agendamentos).
function useAtualizacaoAutomatica(buscar) {
  useEffect(() => {
    buscar()
    const intervalo = setInterval(buscar, INTERVALO_MS)
    const aoVoltar = () => {
      if (document.visibilityState === 'visible') buscar()
    }
    document.addEventListener('visibilitychange', aoVoltar)
    return () => {
      clearInterval(intervalo)
      document.removeEventListener('visibilitychange', aoVoltar)
    }
  }, [buscar])
}

// Todos os agendamentos para a área da recepção (o backend já devolve nomes e dados do paciente).
export function useAdminAgendamentos() {
  const [estado, setEstado] = useState({ agendamentos: [], carregando: true, erro: '' })

  const recarregar = useCallback(async () => {
    try {
      const agendamentos = await recepcaoApi.listar()
      setEstado({ agendamentos, carregando: false, erro: '' })
    } catch (e) {
      setEstado((atual) => ({ ...atual, carregando: false, erro: e.message }))
    }
  }, [])

  useAtualizacaoAutomatica(recarregar)

  return { ...estado, recarregar }
}

// Todos os pacientes (titulares e dependentes) com contato, última consulta e próximo exame.
export function useAdminPacientes() {
  const [estado, setEstado] = useState({ pacientes: [], carregando: true, erro: '' })

  const recarregar = useCallback(async () => {
    try {
      const pacientes = await recepcaoApi.listarPacientes()
      setEstado({ pacientes, carregando: false, erro: '' })
    } catch (e) {
      setEstado((atual) => ({ ...atual, carregando: false, erro: e.message }))
    }
  }, [])

  useAtualizacaoAutomatica(recarregar)

  return { ...estado, recarregar }
}
