package com.hospital.agendamento_api.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalTime;
import java.time.OffsetDateTime;

/** Padrão de funcionamento da agenda, aplicado a todos os dias. Existe uma única linha (id = 1). */
@Entity
@Table(name = "configuracao_agenda")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class ConfiguracaoAgenda {

    public static final Long ID_UNICO = 1L;

    @Id
    private Long id = ID_UNICO;

    @Column(name = "horario_inicio", nullable = false)
    private LocalTime horarioInicio;

    @Column(name = "horario_fim", nullable = false)
    private LocalTime horarioFim;

    @Column(name = "duracao_slot_minutos", nullable = false)
    private Integer duracaoSlotMinutos;

    @Column(name = "atualizado_em", nullable = false)
    private OffsetDateTime atualizadoEm = OffsetDateTime.now();

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "atualizado_por")
    private Usuario atualizadoPor;
}
