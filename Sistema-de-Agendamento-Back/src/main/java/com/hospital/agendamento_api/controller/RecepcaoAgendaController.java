package com.hospital.agendamento_api.controller;

import com.hospital.agendamento_api.dto.DiaAgendaRequestDTO;
import com.hospital.agendamento_api.dto.DiaAgendaResponseDTO;
import com.hospital.agendamento_api.dto.PadraoAgendaRequestDTO;
import com.hospital.agendamento_api.dto.PadraoAgendaResponseDTO;
import com.hospital.agendamento_api.service.AgendaService;
import jakarta.validation.Valid;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDate;

/** Gestão da disponibilidade pela recepção (o SecurityConfig já restringe /api/recepcao/** a RECEPCIONISTA e ADMIN). */
@RestController
@RequestMapping("/api/recepcao/agenda")
public class RecepcaoAgendaController {

    private final AgendaService agendaService;

    public RecepcaoAgendaController(AgendaService agendaService) {
        this.agendaService = agendaService;
    }

    // Padrão de horário de funcionamento, aplicado a todos os dias
    @GetMapping("/padrao")
    public ResponseEntity<PadraoAgendaResponseDTO> obterPadrao() {
        return ResponseEntity.ok(agendaService.obterPadrao());
    }

    @PutMapping("/padrao")
    public ResponseEntity<PadraoAgendaResponseDTO> atualizarPadrao(
            @Valid @RequestBody PadraoAgendaRequestDTO dto,
            Authentication authentication) {
        return ResponseEntity.ok(agendaService.atualizarPadrao(dto, authentication.getName()));
    }

    // Fecha o dia, define horário próprio para ele, ou (disponivel=true sem horários) volta ao padrão
    @PutMapping("/dias/{data}")
    public ResponseEntity<DiaAgendaResponseDTO> definirDia(
            @PathVariable @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate data,
            @Valid @RequestBody DiaAgendaRequestDTO dto,
            Authentication authentication) {
        return ResponseEntity.ok(agendaService.definirDia(data, dto, authentication.getName()));
    }

    // Remove o ajuste do dia: volta a seguir o padrão
    @DeleteMapping("/dias/{data}")
    public ResponseEntity<DiaAgendaResponseDTO> restaurarPadraoDoDia(
            @PathVariable @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate data,
            Authentication authentication) {
        return ResponseEntity.ok(agendaService.restaurarPadraoDoDia(data, authentication.getName()));
    }
}
