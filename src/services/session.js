const CHAVE = 'agendamento.session'

// Lê o campo "exp" (segundos desde 1970) do payload do JWT. Retorna null se não conseguir decodificar.
function expiracaoDoToken(token) {
  try {
    const payload = token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/')
    const json = decodeURIComponent(
      atob(payload)
        .split('')
        .map((c) => '%' + c.charCodeAt(0).toString(16).padStart(2, '0'))
        .join(''),
    )
    return JSON.parse(json).exp ?? null
  } catch {
    return null
  }
}

export function tokenExpirado(token) {
  const exp = expiracaoDoToken(token)
  // Se não deu para ler a expiração, deixa o backend decidir (ele responde 401).
  return exp !== null && exp * 1000 <= Date.now()
}

export function getSession() {
  try {
    const bruto = localStorage.getItem(CHAVE)
    const session = bruto ? JSON.parse(bruto) : null
    if (!session?.token) return null
    // Token vencido (o backend emite tokens de 24h): descarta antes de chamar a API.
    if (tokenExpirado(session.token)) {
      localStorage.removeItem(CHAVE)
      return null
    }
    return session
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
  try {
    localStorage.setItem(CHAVE, JSON.stringify(session))
  } catch {
    // Armazenamento indisponível (modo privado, etc.): a sessão vale só até recarregar a página.
  }
  return session
}

export function clearSession() {
  try {
    localStorage.removeItem(CHAVE)
  } catch {
    // ignora
  }
}

// Cargos que acessam a área da recepção (mesma regra do SecurityConfig: /api/recepcao/**).
export function ehCargoRecepcao(cargo) {
  return cargo === 'RECEPCIONISTA' || cargo === 'ADMIN'
}
