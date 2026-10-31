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
  // GET /api/usuarios/{publicId} (somente RECEPCIONISTA/ADMIN)
  buscarPorPublicId: (publicId) => request(`/api/usuarios/${publicId}`),
  // GET /api/usuarios/me -> dados do próprio usuário logado (qualquer cargo)
  me: () => request('/api/usuarios/me'),
  // PUT /api/usuarios/me -> { usuario, token }  (token só vem quando o e-mail mudou)
  atualizarMe: (dados) => request('/api/usuarios/me', { method: 'PUT', body: dados }),
  // PATCH /api/usuarios/me/senha -> 204
  alterarSenha: (dados) => request('/api/usuarios/me/senha', { method: 'PATCH', body: dados }),
}

export const exameApi = {
  // GET /api/exames -> [{ publicId, nome, descricao }]
  listar: () => request('/api/exames'),
}

export const pacienteApi = {
  // PUT /api/pacientes/dependentes/{publicId} -> PacienteResponseDTO (só dependentes da própria conta)
  atualizarDependente: (publicId, dados) =>
    request(`/api/pacientes/dependentes/${publicId}`, { method: 'PUT', body: dados }),
  // DELETE /api/pacientes/dependentes/{publicId} -> 204 (falha se houver exame pendente/confirmado)
  removerDependente: (publicId) => request(`/api/pacientes/dependentes/${publicId}`, { method: 'DELETE' }),
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
  // POST /api/agendamentos/{publicId}/reagendar -> cria a nova solicitação e apaga a anterior
  // body: { dataOpcao1, dataOpcao2, dataOpcao3, observacao? }
  reagendar: (publicId, dados) =>
    request(`/api/agendamentos/${publicId}/reagendar`, { method: 'POST', body: dados }),
  // PATCH /api/agendamentos/{publicId}/cancelar
  cancelar: (publicId) => request(`/api/agendamentos/${publicId}/cancelar`, { method: 'PATCH' }),
}

// Área da recepção (cargos RECEPCIONISTA e ADMIN).
export const recepcaoApi = {
  // GET /api/recepcao/agendamentos[?status=PENDENTE] -> [AgendamentoResponseDTO]
  listar: (status) =>
    request(`/api/recepcao/agendamentos${status ? `?status=${encodeURIComponent(status)}` : ''}`),
  // POST /api/recepcao/agendamentos -> agenda direto (nasce CONFIRMADO)
  agendar: (dados) => request('/api/recepcao/agendamentos', { method: 'POST', body: dados }),
  // PATCH .../confirmar -> { opcaoEscolhida (1-3), consultorio, medicoPublicId?, observacao? }
  confirmar: (publicId, dados) =>
    request(`/api/recepcao/agendamentos/${publicId}/confirmar`, { method: 'PATCH', body: dados }),
  // PATCH .../remarcar -> { dataAgendada, consultorio?, motivo? }  (PENDENTE ou CONFIRMADO; fica CONFIRMADO na nova data)
  remarcar: (publicId, dados) =>
    request(`/api/recepcao/agendamentos/${publicId}/remarcar`, { method: 'PATCH', body: dados }),
  // PATCH .../recusar -> { motivo }   (só PENDENTE)
  recusar: (publicId, motivo) =>
    request(`/api/recepcao/agendamentos/${publicId}/recusar`, { method: 'PATCH', body: { motivo } }),
  // PATCH .../concluir   (só CONFIRMADO)
  concluir: (publicId) => request(`/api/recepcao/agendamentos/${publicId}/concluir`, { method: 'PATCH' }),
  // PATCH .../cancelar -> { motivo }   (PENDENTE ou CONFIRMADO)
  cancelar: (publicId, motivo) =>
    request(`/api/recepcao/agendamentos/${publicId}/cancelar`, { method: 'PATCH', body: { motivo } }),
  // GET /api/recepcao/pacientes -> [PacienteRecepcaoResponseDTO] (titulares e dependentes)
  listarPacientes: () => request('/api/recepcao/pacientes'),
  // POST /api/recepcao/pacientes -> PacienteResponseDTO do titular recém-criado
  cadastrarPaciente: (dados) => request('/api/recepcao/pacientes', { method: 'POST', body: dados }),
}
