import { clearSession, getSession } from './session'

export const API_URL = (import.meta.env.VITE_API_URL ?? 'http://localhost:8080').replace(/\/$/, '')

const TIMEOUT_MS = 15000

export class ApiError extends Error {
  constructor(message, status) {
    super(message)
    this.name = 'ApiError'
    this.status = status
  }
}

const MENSAGENS_PADRAO = {
  401: 'Sessão expirada ou inválida. Faça login novamente.',
  403: 'Você não tem permissão para acessar este recurso.',
  404: 'Recurso não encontrado.',
  500: 'Erro interno do servidor. Tente novamente em instantes.',
}

async function lerCorpo(response) {
  const texto = await response.text()
  if (!texto) return null
  try {
    return JSON.parse(texto)
  } catch {
    return null
  }
}

/**
 * Wrapper do fetch para a API.
 * - Envia o JWT no header Authorization quando `auth` é true (padrão).
 * - Erros do backend chegam como { timestamp, status, error, message }; o `message` vira o ApiError.message.
 * - Um 401 em rota autenticada limpa a sessão e dispara o evento global "auth:expired".
 */
export async function request(path, { method = 'GET', body, auth = true } = {}) {
  const headers = { Accept: 'application/json' }
  if (body !== undefined) headers['Content-Type'] = 'application/json'

  if (auth) {
    const session = getSession()
    if (session?.token) headers.Authorization = `Bearer ${session.token}`
  }

  // Evita ficar pendurado para sempre se o servidor não responder.
  const controlador = new AbortController()
  const temporizador = setTimeout(() => controlador.abort(), TIMEOUT_MS)

  let response
  try {
    response = await fetch(`${API_URL}${path}`, {
      method,
      headers,
      body: body !== undefined ? JSON.stringify(body) : undefined,
      signal: controlador.signal,
    })
  } catch (e) {
    if (e?.name === 'AbortError') {
      throw new ApiError('O servidor demorou demais para responder. Tente novamente.', 0)
    }
    throw new ApiError('Não foi possível conectar ao servidor. Verifique se o backend está rodando.', 0)
  } finally {
    clearTimeout(temporizador)
  }

  const dados = await lerCorpo(response)

  if (!response.ok) {
    if (response.status === 401 && auth) {
      clearSession()
      window.dispatchEvent(new Event('auth:expired'))
    }
    throw new ApiError(
      dados?.message || MENSAGENS_PADRAO[response.status] || 'Não foi possível concluir a operação.',
      response.status,
    )
  }

  return dados
}
