package com.hospital.agendamento_api.repository;

import com.hospital.agendamento_api.entity.Agendamento;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.OffsetDateTime;
import java.util.Collection;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface AgendamentoRepository extends JpaRepository<Agendamento, Long> {

    // Trava de regra de negócio: verifica se o paciente já tem pendência para o exame
    boolean existsByPacienteIdAndExameIdAndStatus(Long pacienteId, Long exameId, String status);

    // Exames de pacientes removidos pelo responsável não aparecem mais para ele
    @Query("SELECT a FROM Agendamento a WHERE a.solicitante.publicId = :publicId AND a.paciente.ativo = true")
    List<Agendamento> findBySolicitantePublicId(@Param("publicId") UUID publicId);

    @Query("SELECT a FROM Agendamento a WHERE a.paciente.publicId = :publicId")
    List<Agendamento> findByPacientePublicId(@Param("publicId") UUID publicId);

    Optional<Agendamento> findByPublicId(UUID publicId);

    // Admin: um exame com histórico de agendamentos (de qualquer status) não pode ser excluído fisicamente
    boolean existsByExameId(Long exameId);

    // Usado para impedir a remoção de um paciente que ainda tem exames em andamento
    boolean existsByPacienteIdAndStatusIn(Long pacienteId, Collection<String> status);

    @Query("SELECT a FROM Agendamento a WHERE a.publicId = :publicId AND a.solicitante.publicId = :solicitantePublicId")
    Optional<Agendamento> findByPublicIdAndSolicitantePublicId(
            @Param("publicId") UUID publicId, 
            @Param("solicitantePublicId") UUID solicitantePublicId
    );

    // ---- Recepção ----
    // JOIN FETCH evita o problema N+1 ao montar a lista (paciente, solicitante e exame são LAZY)
    @Query("SELECT a FROM Agendamento a JOIN FETCH a.paciente p JOIN FETCH p.usuarioResponsavel JOIN FETCH a.solicitante JOIN FETCH a.exame " +
           "WHERE a.status = :status ORDER BY a.dataCriacao ASC")
    List<Agendamento> listarPorStatus(@Param("status") String status);

    @Query("SELECT a FROM Agendamento a JOIN FETCH a.paciente p JOIN FETCH p.usuarioResponsavel JOIN FETCH a.solicitante JOIN FETCH a.exame " +
           "ORDER BY a.dataCriacao DESC")
    List<Agendamento> listarTodos();

    // Trava de conflito: o mesmo médico não pode ter 2 exames confirmados no mesmo horário
    boolean existsByMedicoIdAndDataConfirmadaAndStatus(Long medicoId, OffsetDateTime dataConfirmada, String status);

    // ---- Disponibilidade da agenda ----
    // Um horário ocupado (CONFIRMADO/CONCLUIDO) fica bloqueado para qualquer outro paciente
    boolean existsByDataConfirmadaAndStatusIn(OffsetDateTime dataConfirmada, Collection<String> status);

    // Mesma checagem ignorando um agendamento (ao remarcar/confirmar, o próprio não conta como conflito)
    boolean existsByDataConfirmadaAndStatusInAndIdNot(OffsetDateTime dataConfirmada, Collection<String> status, Long id);

    // Datas ocupadas num intervalo [inicio, fim) — usado para montar a grade de horários
    @Query("SELECT a.dataConfirmada FROM Agendamento a WHERE a.status IN :status " +
           "AND a.dataConfirmada >= :inicio AND a.dataConfirmada < :fim")
    List<OffsetDateTime> findDatasConfirmadasEntre(@Param("status") Collection<String> status,
                                                   @Param("inicio") OffsetDateTime inicio,
                                                   @Param("fim") OffsetDateTime fim);

    @Query("SELECT a.dataConfirmada FROM Agendamento a WHERE a.status IN :status AND a.dataConfirmada >= :inicio")
    List<OffsetDateTime> findDatasConfirmadasAPartirDe(@Param("status") Collection<String> status,
                                                       @Param("inicio") OffsetDateTime inicio);
}
