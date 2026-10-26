import { useCallback, useEffect, useState } from 'react'
import { agendamentoApi, exameApi } from '../services/api'

// Carrega os agendamentos do usuário logado e os exames (para trocar examePublicId por nome).
export function useAgendamentos() {
  const [estado, setEstado] = useState({ agendamentos: [], exames: [], carregando: true, erro: '' })

  const carregar = useCallback(async () => {
    try {
      const [agendamentos, exames] = await Promise.all([agendamentoApi.listarMeus(), exameApi.listar()])
      setEstado({ agendamentos, exames, carregando: false, erro: '' })
    } catch (e) {
      setEstado((atual) => ({ ...atual, carregando: false, erro: e.message }))
    }
  }, [])

  useEffect(() => {
    carregar()
  }, [carregar])

  const nomeDoExame = (examePublicId) =>
    estado.exames.find((e) => e.publicId === examePublicId)?.nome ?? 'Exame'

  return { ...estado, nomeDoExame, recarregar: carregar }
}
