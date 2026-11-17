import { useCallback, useEffect, useState } from 'react'
import { adminUsuarioApi } from '../services/api'

// Todos os usuários do sistema (pacientes, recepcionistas e administradores), em ordem alfabética.
export function useAdminUsuarios() {
  const [estado, setEstado] = useState({ usuarios: [], carregando: true, erro: '' })

  const recarregar = useCallback(async () => {
    try {
      const lista = await adminUsuarioApi.listar()
      const usuarios = [...lista].sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR', { sensitivity: 'base' }))
      setEstado({ usuarios, carregando: false, erro: '' })
    } catch (e) {
      setEstado((atual) => ({ ...atual, carregando: false, erro: e.message }))
    }
  }, [])

  useEffect(() => {
    recarregar()
  }, [recarregar])

  return { ...estado, recarregar }
}
