import { request } from './http'

// Somente endpoints que existem hoje no backend (Sistema-de-Agendamento).

export const authApi = {
  // POST /api/auth/login -> { token, tipo, usuarioPublicId, nome, cargo }
  login: (login, senha) =>
    request('/api/auth/login', { method: 'POST', auth: false, body: { login, senha } }),
}

export const usuarioApi = {
  // POST /api/usuarios (pública) -> 201 UsuarioResponseDTO
  cadastrar: (dados) => request('/api/usuarios', { method: 'POST', auth: false, body: dados }),
  // GET /api/usuarios
  listarTodos: () => request('/api/usuarios'),
  // GET /api/usuarios/{publicId}
  buscarPorPublicId: (publicId) => request(`/api/usuarios/${publicId}`),
}

export const exameApi = {
  // GET /api/exames -> [{ publicId, nome, descricao }]
  listar: () => request('/api/exames'),
}

export const pacienteApi = {
  // GET /api/pacientes/meus-pacientes -> titular + dependentes
  listarMeus: () => request('/api/pacientes/meus-pacientes'),
  // POST /api/pacientes/dependentes -> 201 PacienteResponseDTO
  cadastrarDependente: (dados) =>
    request('/api/pacientes/dependentes', { method: 'POST', body: dados }),
}

export const agendamentoApi = {
  // POST /api/agendamentos -> 201 AgendamentoResponseDTO
  criar: (dados) => request('/api/agendamentos', { method: 'POST', body: dados }),
  // GET /api/agendamentos/meus-agendamentos
  listarMeus: () => request('/api/agendamentos/meus-agendamentos'),
  // GET /api/agendamentos/{publicId}
  buscarPorPublicId: (publicId) => request(`/api/agendamentos/${publicId}`),
  // PATCH /api/agendamentos/{publicId}/cancelar
  cancelar: (publicId) => request(`/api/agendamentos/${publicId}/cancelar`, { method: 'PATCH' }),
}
