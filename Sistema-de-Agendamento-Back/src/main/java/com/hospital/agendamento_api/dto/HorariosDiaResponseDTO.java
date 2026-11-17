package com.hospital.agendamento_api.dto;

import java.time.LocalDate;
import java.util.List;

public record HorariosDiaResponseDTO(
    LocalDate data,
    boolean disponivel,
    String motivo,
    int duracaoSlotMinutos,
    List<HorarioAgendaDTO> horarios
) {}
