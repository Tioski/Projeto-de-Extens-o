package com.hospital.agendamento_api.dto;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.time.LocalTime;

/**
 * Ajuste de um dia específico.
 * - disponivel = false: o dia fica fechado (nenhum horário);
 * - disponivel = true com horarioInicio/horarioFim: dia aberto com horário próprio;
 * - disponivel = true sem horários: o dia volta a seguir o padrão.
 */
public record DiaAgendaRequestDTO(
    @NotNull(message = "Informe se o dia está disponível")
    Boolean disponivel,

    LocalTime horarioInicio,

    LocalTime horarioFim,

    @Size(max = 200, message = "O motivo não pode passar de 200 caracteres")
    String motivo
) {}
