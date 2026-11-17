package com.hospital.agendamento_api.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDate;
import java.time.LocalTime;
import java.time.OffsetDateTime;

/**
 * Exceção ao padrão de funcionamento para uma data específica: dia fechado (disponivel = false)
 * ou dia aberto com horário próprio. Datas sem registro seguem o padrão de {@link ConfiguracaoAgenda}.
 */
@Entity
@Table(name = "dias_agenda")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class DiaAgenda {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true)
    private LocalDate data;

    @Column(nullable = false)
    private Boolean disponivel;

    @Column(name = "horario_inicio")
    private LocalTime horarioInicio;

    @Column(name = "horario_fim")
    private LocalTime horarioFim;

    @Column(length = 200)
    private String motivo;

    @Column(name = "atualizado_em", nullable = false)
    private OffsetDateTime atualizadoEm = OffsetDateTime.now();

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "atualizado_por")
    private Usuario atualizadoPor;
}
