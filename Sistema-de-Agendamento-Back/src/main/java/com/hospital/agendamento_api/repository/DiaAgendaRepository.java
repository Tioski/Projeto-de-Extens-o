package com.hospital.agendamento_api.repository;

import com.hospital.agendamento_api.entity.DiaAgenda;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

@Repository
public interface DiaAgendaRepository extends JpaRepository<DiaAgenda, Long> {

    Optional<DiaAgenda> findByData(LocalDate data);

    List<DiaAgenda> findByDataBetween(LocalDate inicio, LocalDate fim);

    List<DiaAgenda> findByDataGreaterThanEqual(LocalDate data);
}
