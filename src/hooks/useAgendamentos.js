import { useCallback, useEffect, useState } from 'react'
import { agendamentoApi, exameApi, pacienteApi } from '../services/api'

// Carrega os agendamentos do usuário logado, os exames e os pacientes (titular + dependentes),
// para trocar os UUIDs (examePublicId / pacientePublicId) por nomes legíveis.
export function useAgendamentos() {
  const [estado, setEstado] = useState({
    agendamentos: [],
    exames: [],
    pacientes: [],
    carregando: true,
    erro: '',
  })

  const carregar = useCallback(async () => {
    try {
      const [agendamentos, exames, pacientes] = await Promise.all([
        agendamentoApi.listarMeus(),
        exameApi.listar(),
        pacienteApi.listarMeus(),
      ])
      setEstado({ agendamentos, exames, pacientes, carregando: false, erro: '' })
    } catch (e) {
      setEstado((atual) => ({ ...atual, carregando: false, erro: e.message }))
    }
  }, [])

  useEffect(() => {
    carregar()
  }, [carregar])

  const nomeDoExame = (examePublicId) =>
    estado.exames.find((e) => e.publicId === examePublicId)?.nome ?? 'Exame'

  const pacienteDoAgendamento = (pacientePublicId) =>
    estado.pacientes.find((p) => p.publicId === pacientePublicId) ?? null

  return { ...estado, nomeDoExame, pacienteDoAgendamento, recarregar: carregar }
}
