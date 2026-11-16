// Status que o backend devolve (constraint chk_agendamentos_status) -> texto e classe CSS já existentes.
const STATUS = {
  PENDENTE: { label: 'Pendente', classe: 'status-pendente' },
  CONFIRMADO: { label: 'Confirmado', classe: 'status-confirmado' },
  RECUSADO: { label: 'Recusado', classe: 'status-cancelado' },
  CONCLUIDO: { label: 'Concluído', classe: 'status-concluido' },
  CANCELADO: { label: 'Cancelado', classe: 'status-cancelado' },
}

export function infoStatus(status) {
  return STATUS[status] ?? { label: status, classe: 'status-atendimento' }
}

export function formatarData(iso) {
  return iso ? new Date(iso).toLocaleDateString('pt-BR') : '—'
}

export function formatarHora(iso) {
  return iso ? new Date(iso).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }) : '—'
}

export function formatarDataHora(iso) {
  return iso ? `${formatarData(iso)} às ${formatarHora(iso)}` : '—'
}

export function somenteDigitos(valor = '') {
  return valor.replace(/\D/g, '')
}

// Timestamp usado para ordenar: data confirmada ou, se ainda pendente, a mais próxima das 3 opções.
export function dataDeReferencia(agendamento) {
  if (agendamento.dataConfirmada) return new Date(agendamento.dataConfirmada).getTime()
  return Math.min(
    ...[agendamento.dataOpcao1, agendamento.dataOpcao2, agendamento.dataOpcao3].map((d) => new Date(d).getTime()),
  )
}

// Instante qualquer (ISO com offset, ou datetime-local) -> ISO-8601 em UTC que o OffsetDateTime do backend aceita.
export function inputParaIso(valor) {
  return new Date(valor).toISOString()
}

// ---- Parentesco (valores aceitos pelo banco: chk_pacientes_parentesco) ----
export const PARENTESCOS = [
  { value: 'FILHO', label: 'Filho(a)' },
  { value: 'CONJUGE', label: 'Cônjuge' },
  { value: 'PAI_MAE', label: 'Pai/Mãe' },
  { value: 'OUTRO', label: 'Outro' },
]

export const ROTULOS_PARENTESCO = {
  TITULAR: 'Titular',
  ...Object.fromEntries(PARENTESCOS.map((p) => [p.value, p.label])),
}

// ---- Validações no cliente (espelham as regras dos DTOs do backend) ----
// Cada função devolve uma mensagem de erro, ou '' quando está tudo certo.

export function hojeParaInput() {
  const hoje = new Date()
  hoje.setMinutes(hoje.getMinutes() - hoje.getTimezoneOffset())
  return hoje.toISOString().slice(0, 10)
}

// UsuarioCadastroRequestDTO / EnderecoRequestDTO
export function validarCadastro(form) {
  if (somenteDigitos(form.cpf).length !== 11) return 'CPF deve conter 11 números.'
  if (somenteDigitos(form.telefone).length < 10) return 'Informe um telefone com DDD.'
  if (!form.dataNascimento || form.dataNascimento >= hojeParaInput()) {
    return 'A data de nascimento deve estar no passado.'
  }
  if (form.senha.length < 6) return 'A senha deve ter no mínimo 6 caracteres.'
  if (form.senha !== form.confirmarSenha) return 'As senhas não conferem.'
  if (somenteDigitos(form.cep).length !== 8) return 'CEP deve conter 8 números.'
  if (!/^[A-Za-z]{2}$/.test(form.estado.trim())) return 'UF deve ter exatamente 2 letras.'
  return ''
}

// DependenteRequestDTO (+ regras do banco: CPF opcional, mas com 11 dígitos quando informado)
export function validarDependente(dep) {
  if (!dep.nome.trim()) return 'Informe o nome do dependente.'
  if (!dep.dataNascimento) return 'Informe a data de nascimento do dependente.'
  if (dep.dataNascimento > hojeParaInput()) return 'A data de nascimento não pode ser futura.'
  const cpf = somenteDigitos(dep.cpf)
  if (cpf && cpf.length !== 11) return 'CPF do dependente deve conter 11 números (ou deixe em branco).'
  return ''
}

// AgendamentoRequestDTO: 3 datas futuras. O backend não exige que sejam distintas, mas faz sentido pedir.
export function validarDatas(datas) {
  if (datas.some((d) => !d)) return 'Informe as três opções de data e horário.'
  const instantes = datas.map((d) => new Date(d).getTime())
  if (instantes.some((t) => Number.isNaN(t) || t <= Date.now())) {
    return 'Todas as opções de data e horário devem estar no futuro.'
  }
  if (new Set(instantes).size !== instantes.length) {
    return 'As três opções devem ser diferentes entre si.'
  }
  return ''
}
