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

// Disponibilidade da agenda (qualquer usuário logado). Dia/hora são sempre no fuso America/Sao_Paulo.
export const agendaApi = {
  // GET /api/agenda/dias?inicio=AAAA-MM-DD&fim=AAAA-MM-DD (máx. 93 dias)
  // -> [{ data, diaSemana, disponivel, horarioInicio, horarioFim, personalizado, motivo, totalHorarios, horariosLivres }]
  listarDias: (inicio, fim) => request(`/api/agenda/dias?inicio=${inicio}&fim=${fim}`),
  // GET /api/agenda/dias/{data}/horarios
  // -> { data, disponivel, motivo, duracaoSlotMinutos, horarios: [{ inicio, fim, dataHora, situacao: LIVRE|OCUPADO|PASSADO }] }
  listarHorarios: (data) => request(`/api/agenda/dias/${data}/horarios`),
}

// Gestão da disponibilidade (RECEPCIONISTA e ADMIN).
export const recepcaoAgendaApi = {
  // GET /api/recepcao/agenda/padrao -> { horarioInicio, horarioFim, duracaoSlotMinutos, horariosPorDia, atualizadoEm }
  obterPadrao: () => request('/api/recepcao/agenda/padrao'),
  // PUT /api/recepcao/agenda/padrao -> { horarioInicio: "HH:mm", horarioFim: "HH:mm", duracaoSlotMinutos }
  atualizarPadrao: (dados) => request('/api/recepcao/agenda/padrao', { method: 'PUT', body: dados }),
  // PUT /api/recepcao/agenda/dias/{data} -> { disponivel, horarioInicio?, horarioFim?, motivo? }
  definirDia: (data, dados) => request(`/api/recepcao/agenda/dias/${data}`, { method: 'PUT', body: dados }),
  // DELETE /api/recepcao/agenda/dias/{data} -> remove o ajuste (volta ao padrão)
  restaurarDia: (data) => request(`/api/recepcao/agenda/dias/${data}`, { method: 'DELETE' }),
}

// Área do administrador (cargo ADMIN): usuários e catálogo de exames.
export const adminUsuarioApi = {
  // GET /api/admin/usuarios -> [UsuarioResponseDTO] (pacientes, recepcionistas e administradores)
  listar: () => request('/api/admin/usuarios'),
  // POST /api/admin/usuarios/recepcionistas -> 201 UsuarioResponseDTO (mesmo corpo do cadastro público)
  cadastrarRecepcionista: (dados) =>
    request('/api/admin/usuarios/recepcionistas', { method: 'POST', body: dados }),
  // PUT /api/admin/usuarios/{publicId} -> { usuario, token }  (token só vem se o admin trocou o próprio e-mail)
  atualizar: (publicId, dados) => request(`/api/admin/usuarios/${publicId}`, { method: 'PUT', body: dados }),
  // PATCH /api/admin/usuarios/{publicId}/senha -> 204  body: { novaSenha }
  alterarSenha: (publicId, novaSenha) =>
    request(`/api/admin/usuarios/${publicId}/senha`, { method: 'PATCH', body: { novaSenha } }),
  // POST /api/admin/usuarios/{publicId}/paciente-titular -> PacienteResponseDTO (cria o titular se não existir)
  garantirPacienteTitular: (publicId) =>
    request(`/api/admin/usuarios/${publicId}/paciente-titular`, { method: 'POST' }),
}

export const adminExameApi = {
  // GET /api/admin/exames -> [{ publicId, nome, descricao, ativo }] (inclui os retirados da lista)
  listar: () => request('/api/admin/exames'),
  // POST /api/admin/exames -> 201  body: { nome, descricao? }
  cadastrar: (dados) => request('/api/admin/exames', { method: 'POST', body: dados }),
  // PUT /api/admin/exames/{publicId}  body: { nome, descricao? }
  atualizar: (publicId, dados) => request(`/api/admin/exames/${publicId}`, { method: 'PUT', body: dados }),
  // PATCH /api/admin/exames/{publicId}/status  body: { ativo }  (inativo some da tela de agendamento)
  alterarStatus: (publicId, ativo) =>
    request(`/api/admin/exames/${publicId}/status`, { method: 'PATCH', body: { ativo } }),
  // DELETE /api/admin/exames/{publicId} -> 204 (falha se o exame já tem histórico de agendamentos)
  excluir: (publicId) => request(`/api/admin/exames/${publicId}`, { method: 'DELETE' }),
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
