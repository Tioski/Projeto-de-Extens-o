# Disponibilidade da agenda

Controla **quais dias e horários** podem receber agendamentos e **bloqueia** os horários já confirmados.

## Como funciona

- **Padrão de funcionamento** (`configuracao_agenda`, linha única): abertura, encerramento e duração de cada horário.
  Vale para **todos os dias**. Valor inicial: 06:30 às 21:00, horários de 30 em 30 min (o último começa às 20:30).
- **Ajuste de um dia** (`dias_agenda`): exceção para uma data (fechar o dia, ou dar a ele um horário próprio).
  Dia sem ajuste = segue o padrão. Não é preciso "abrir" dias: todos já nascem abertos.
- **Bloqueio de horário**: um agendamento `CONFIRMADO` (ou `CONCLUIDO`) ocupa o horário para **qualquer** outro paciente.
  Cancelar/recusar/remarcar libera o horário automaticamente.
- Dia e hora são sempre interpretados no fuso `America/Sao_Paulo`.

Um horário só é válido se: o dia está aberto, está dentro da janela do dia, é um início da grade
(ex.: 09:00 e 09:30 sim, 09:10 não), está no futuro e não está ocupado.

## Endpoints

### Recepção/Admin — `/api/recepcao/agenda`

| Método | Rota | O que faz |
| --- | --- | --- |
| GET | `/padrao` | Lê o padrão de funcionamento |
| PUT | `/padrao` | Define o padrão (vale para todos os dias) |
| PUT | `/dias/{data}` | Fecha o dia, define horário próprio, ou volta ao padrão |
| DELETE | `/dias/{data}` | Remove o ajuste do dia (volta ao padrão) |

`PUT /padrao`
```json
{ "horarioInicio": "07:00", "horarioFim": "19:00", "duracaoSlotMinutos": 30 }
```

`PUT /dias/2026-12-25` — fechar o dia
```json
{ "disponivel": false, "motivo": "Natal" }
```

`PUT /dias/2026-12-24` — horário próprio
```json
{ "disponivel": true, "horarioInicio": "08:00", "horarioFim": "12:00", "motivo": "Meio expediente" }
```

`PUT /dias/2026-12-25` com `{ "disponivel": true }` (sem horários) reabre o dia no padrão.

### Consulta (qualquer usuário logado) — `/api/agenda`

| Método | Rota | O que devolve |
| --- | --- | --- |
| GET | `/dias?inicio=2026-11-01&fim=2026-11-30` | Cada dia: aberto/fechado, janela, `totalHorarios`, `horariosLivres` (máx. 93 dias) |
| GET | `/dias/{data}/horarios` | Grade do dia; cada horário vem `LIVRE`, `OCUPADO` ou `PASSADO`, com `dataHora` pronto para enviar |

## Onde o bloqueio é aplicado

| Fluxo | Regra |
| --- | --- |
| Paciente solicita (`POST /api/agendamentos`) e reagenda | As 3 opções precisam ser horários livres de dias abertos (erro indica qual opção: `Opção 2: ...`) |
| Recepção confirma (`PATCH .../confirmar`) | A opção escolhida precisa continuar livre |
| Recepção cria (`POST /api/recepcao/agendamentos`) e remarca (`PATCH .../remarcar`) | O novo horário precisa estar livre (remarcar para o próprio horário é permitido) |

Confirmar/criar/remarcar e qualquer alteração de disponibilidade passam por um `SELECT ... FOR UPDATE` na linha do
padrão, então duas recepcionistas tentando o mesmo horário ao mesmo tempo são serializadas: a segunda recebe
"já foi reservado para outro paciente".

## Proteção contra "derrubar" agendamentos

Alterar o padrão, fechar um dia ou mudar o horário de um dia é **recusado** se deixar algum agendamento
`CONFIRMADO` futuro fora do horário de atendimento. A mensagem informa quantos são e dá exemplos; a recepção
precisa remarcar/cancelar esses antes. Dias que já passaram não podem ser alterados.

## Migration

`V8__Cria_Agenda_Disponibilidade.sql` cria `configuracao_agenda` (já com o padrão 06:30–21:00) e `dias_agenda`.
