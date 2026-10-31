// Consulta de endereço por CEP no ViaCEP (https://viacep.com.br) — serviço público e gratuito,
// independente do backend do projeto. Resposta de sucesso:
//   { cep, logradouro, complemento, bairro, localidade, uf, ... }
// CEP inexistente (mas com formato válido) responde 200 com { "erro": true }.

const TIMEOUT_MS = 8000

export class CepError extends Error {
  constructor(message) {
    super(message)
    this.name = 'CepError'
  }
}

/**
 * Busca o endereço de um CEP de 8 dígitos.
 * - Devolve { logradouro, bairro, cidade, estado } quando encontra (campos podem vir vazios em CEPs
 *   genéricos de cidade pequena).
 * - Devolve null quando o CEP não existe.
 * - Lança CepError em falha de rede/timeout/resposta inesperada.
 * - Se o `signal` externo for abortado, a promessa rejeita com AbortError (o chamador ignora).
 */
export async function buscarCep(cep, { signal } = {}) {
  const digitos = String(cep).replace(/\D/g, '')
  if (digitos.length !== 8) return null

  const controlador = new AbortController()
  const aoAbortarFora = () => controlador.abort()
  signal?.addEventListener('abort', aoAbortarFora)
  let estourouTempo = false
  const temporizador = setTimeout(() => {
    estourouTempo = true
    controlador.abort()
  }, TIMEOUT_MS)

  try {
    const response = await fetch(`https://viacep.com.br/ws/${digitos}/json/`, { signal: controlador.signal })
    if (!response.ok) throw new CepError('Serviço de CEP indisponível.')
    const dados = await response.json()
    if (dados?.erro) return null

    return {
      logradouro: dados.logradouro ?? '',
      bairro: dados.bairro ?? '',
      cidade: dados.localidade ?? '',
      estado: (dados.uf ?? '').toUpperCase(),
    }
  } catch (e) {
    if (e instanceof CepError) throw e
    if (e?.name === 'AbortError' && !estourouTempo) throw e // cancelado por quem chamou
    throw new CepError('Não foi possível consultar o CEP.')
  } finally {
    clearTimeout(temporizador)
    signal?.removeEventListener('abort', aoAbortarFora)
  }
}
