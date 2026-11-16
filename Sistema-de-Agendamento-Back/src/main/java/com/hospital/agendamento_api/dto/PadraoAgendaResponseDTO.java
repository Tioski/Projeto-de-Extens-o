package com.hospital.agendamento_api.dto;

import java.time.LocalTime;
import java.time.OffsetDateTime;

public record PadraoAgendaResponseDTO(
    LocalTime horarioInicio,
    LocalTime horarioFim,
    int duracaoSlotMinutos,
    // Quantos horários a grade tem em um dia que segue o padrão
    int horariosPorDia,
    OffsetDateTime atualizadoEm
) {}
