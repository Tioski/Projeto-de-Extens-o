// Regras do agendamento que dependem de como o back-end está implementado hoje.

// O back-end atual EXIGE as três datas (dataOpcao1/2/3 com @NotNull e colunas NOT NULL no banco).
// Na tela, só a 1ª data é obrigatória; enquanto o back não mudar, as opções que a pessoa deixar em
// branco são repetidas na hora de enviar (veja montarOpcoesParaApi em utils/datas.js).
//
// Quando o back-end passar a aceitar dataOpcao2/dataOpcao3 nulas, basta definir no .env:
//   VITE_BACKEND_DATAS_OPCIONAIS=true
// e o front passa a enviar somente as datas informadas (as demais vão como null).
export const BACKEND_ACEITA_DATAS_OPCIONAIS = import.meta.env.VITE_BACKEND_DATAS_OPCIONAIS === 'true'
