package com.hospital.agendamento_api.dto;

import java.time.LocalTime;
import java.time.OffsetDateTime;

public record HorarioAgendaDTO(
    LocalTime inicio,
    LocalTime fim,
    // Instante exato (com fuso) para enviar como dataOpcao/dataAgendada
    OffsetDateTime dataHora,
    // LIVRE | OCUPADO (já confirmado para outro paciente) | PASSADO
    String situacao
) {}
