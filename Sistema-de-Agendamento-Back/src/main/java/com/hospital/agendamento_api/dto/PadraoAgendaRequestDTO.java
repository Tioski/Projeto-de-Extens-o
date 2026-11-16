package com.hospital.agendamento_api.dto;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;

import java.time.LocalTime;

/** Padrão de funcionamento aplicado a todos os dias (ex.: 06:30 às 21:00, horários de 30 em 30 minutos). */
public record PadraoAgendaRequestDTO(
    @NotNull(message = "Informe o horário de abertura (HH:mm)")
    LocalTime horarioInicio,

    @NotNull(message = "Informe o horário de encerramento (HH:mm)")
    LocalTime horarioFim,

    @NotNull(message = "Informe a duração de cada horário, em minutos")
    @Min(value = 5, message = "A duração de cada horário deve ser de no mínimo 5 minutos")
    @Max(value = 480, message = "A duração de cada horário deve ser de no máximo 480 minutos")
    Integer duracaoSlotMinutos
) {}
