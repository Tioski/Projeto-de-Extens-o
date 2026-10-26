const CHAVE = 'agendamento.session'

export function getSession() {
  try {
    const bruto = localStorage.getItem(CHAVE)
    return bruto ? JSON.parse(bruto) : null
  } catch {
    return null
  }
}

// Recebe o TokenResponseDTO do backend: { token, tipo, usuarioPublicId, nome, cargo }
export function saveSession(dados) {
  const session = {
    token: dados.token,
    tipo: dados.tipo,
    usuarioPublicId: dados.usuarioPublicId,
    nome: dados.nome,
    cargo: dados.cargo,
  }
  localStorage.setItem(CHAVE, JSON.stringify(session))
  return session
}

export function clearSession() {
  localStorage.removeItem(CHAVE)
}
