package com.hospital.agendamento_api.dto;

import java.time.LocalDate;
import java.time.LocalTime;

public record DiaAgendaResponseDTO(
    LocalDate data,
    String diaSemana,
    boolean disponivel,
    // Janela efetiva do dia (nulos quando o dia está fechado)
    LocalTime horarioInicio,
    LocalTime horarioFim,
    // true = o dia tem ajuste próprio; false = segue o padrão
    boolean personalizado,
    String motivo,
    int totalHorarios,
    int horariosLivres
) {}
