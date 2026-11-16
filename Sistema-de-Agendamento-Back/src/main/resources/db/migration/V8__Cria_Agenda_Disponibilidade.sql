-- =========================================================
-- Disponibilidade da agenda
--   configuracao_agenda: padrão de horário de funcionamento, aplicado a TODOS os dias
--                        (linha única, id = 1)
--   dias_agenda:         exceções por data (dia fechado ou com horário próprio).
--                        Dia sem linha aqui = dia normal, segue o padrão.
-- =========================================================

CREATE TABLE configuracao_agenda (
    id                    BIGINT PRIMARY KEY DEFAULT 1,
    horario_inicio        TIME    NOT NULL,
    horario_fim           TIME    NOT NULL,
    -- duração de cada horário da grade (ex.: 30 => 06:30, 07:00, 07:30...)
    duracao_slot_minutos  INTEGER NOT NULL,
    atualizado_em         TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    atualizado_por        BIGINT REFERENCES usuarios(id) ON DELETE SET NULL,
    CONSTRAINT chk_configuracao_agenda_unica   CHECK (id = 1),
    CONSTRAINT chk_configuracao_agenda_janela  CHECK (horario_fim > horario_inicio),
    CONSTRAINT chk_configuracao_agenda_duracao CHECK (duracao_slot_minutos BETWEEN 5 AND 480)
);

-- Padrão inicial = horário oficial do hospital (06:30 às 21:00), horários de 30 em 30 minutos
INSERT INTO configuracao_agenda (id, horario_inicio, horario_fim, duracao_slot_minutos)
VALUES (1, '06:30', '21:00', 30);

CREATE TABLE dias_agenda (
    id              BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    data            DATE    NOT NULL UNIQUE,
    -- FALSE = dia fechado (sem horários); TRUE = aberto com horário próprio
    disponivel      BOOLEAN NOT NULL,
    -- só preenchidos quando disponivel = TRUE e o dia foge do padrão
    horario_inicio  TIME,
    horario_fim     TIME,
    motivo          VARCHAR(200),
    atualizado_em   TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    atualizado_por  BIGINT REFERENCES usuarios(id) ON DELETE SET NULL,
    CONSTRAINT chk_dias_agenda_janela CHECK (
        (horario_inicio IS NULL AND horario_fim IS NULL)
        OR (horario_inicio IS NOT NULL AND horario_fim IS NOT NULL AND horario_fim > horario_inicio)
    )
);

-- Consulta da grade/ocupação: busca por intervalo de datas confirmadas
CREATE INDEX idx_agendamentos_data_confirmada ON agendamentos (data_confirmada) WHERE status IN ('CONFIRMADO', 'CONCLUIDO');
