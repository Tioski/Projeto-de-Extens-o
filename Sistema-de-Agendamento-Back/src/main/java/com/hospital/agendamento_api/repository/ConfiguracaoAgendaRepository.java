package com.hospital.agendamento_api.repository;

import com.hospital.agendamento_api.entity.ConfiguracaoAgenda;
import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface ConfiguracaoAgendaRepository extends JpaRepository<ConfiguracaoAgenda, Long> {

    /**
     * Lê o padrão com lock de escrita (SELECT ... FOR UPDATE) até o fim da transação. Serve de "catraca":
     * quem confirma/remarca um horário ou altera a disponibilidade passa por aqui, então duas operações
     * não verificam e reservam o mesmo horário ao mesmo tempo. Precisa de transação ativa.
     */
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT c FROM ConfiguracaoAgenda c WHERE c.id = 1")
    Optional<ConfiguracaoAgenda> buscarComTrava();
}
