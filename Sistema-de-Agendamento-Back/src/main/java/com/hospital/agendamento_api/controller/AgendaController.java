package com.hospital.agendamento_api.controller;

import com.hospital.agendamento_api.dto.DiaAgendaResponseDTO;
import com.hospital.agendamento_api.dto.HorariosDiaResponseDTO;
import com.hospital.agendamento_api.service.AgendaService;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDate;
import java.util.List;

/**
 * Consulta de disponibilidade: usada pelo paciente para escolher datas e pela recepção para ver o calendário.
 * Qualquer usuário autenticado pode consultar (não expõe dados de pacientes, só se o horário está livre).
 */
@RestController
@RequestMapping("/api/agenda")
public class AgendaController {

    private final AgendaService agendaService;

    public AgendaController(AgendaService agendaService) {
        this.agendaService = agendaService;
    }

    // Ex.: GET /api/agenda/dias?inicio=2026-11-01&fim=2026-11-30
    @GetMapping("/dias")
    public ResponseEntity<List<DiaAgendaResponseDTO>> listarDias(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate inicio,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate fim) {
        return ResponseEntity.ok(agendaService.listarDias(inicio, fim));
    }

    // Ex.: GET /api/agenda/dias/2026-11-20/horarios
    @GetMapping("/dias/{data}/horarios")
    public ResponseEntity<HorariosDiaResponseDTO> listarHorarios(
            @PathVariable @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate data) {
        return ResponseEntity.ok(agendaService.listarHorarios(data));
    }
}
