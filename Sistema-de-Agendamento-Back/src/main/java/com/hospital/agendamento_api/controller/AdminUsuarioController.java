package com.hospital.agendamento_api.controller;

import com.hospital.agendamento_api.dto.AdminAlterarSenhaRequestDTO;
import com.hospital.agendamento_api.dto.AlterarCargoRequestDTO;
import com.hospital.agendamento_api.dto.AlterarStatusUsuarioRequestDTO;
import com.hospital.agendamento_api.dto.PacienteResponseDTO;
import com.hospital.agendamento_api.dto.PerfilAtualizadoResponseDTO;
import com.hospital.agendamento_api.dto.PerfilUpdateRequestDTO;
import com.hospital.agendamento_api.dto.UsuarioCadastroRequestDTO;
import com.hospital.agendamento_api.dto.UsuarioResponseDTO;
import com.hospital.agendamento_api.service.UsuarioService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

/** Gerenciamento de usuários pelo administrador. O acesso (ROLE_ADMIN) é garantido no SecurityConfig. */
@RestController
@RequestMapping("/api/admin/usuarios")
public class AdminUsuarioController {

    private final UsuarioService usuarioService;

    public AdminUsuarioController(UsuarioService usuarioService) {
        this.usuarioService = usuarioService;
    }

    @GetMapping
    public ResponseEntity<List<UsuarioResponseDTO>> listarTodos() {
        return ResponseEntity.ok(usuarioService.listarTodos());
    }

    @GetMapping("/{publicId}")
    public ResponseEntity<UsuarioResponseDTO> buscarPorPublicId(@PathVariable UUID publicId) {
        return ResponseEntity.ok(usuarioService.buscarPorPublicId(publicId));
    }

    // Cadastra um usuário com o cargo RECEPCIONISTA (o cadastro público só cria pacientes)
    @PostMapping("/recepcionistas")
    public ResponseEntity<UsuarioResponseDTO> cadastrarRecepcionista(@Valid @RequestBody UsuarioCadastroRequestDTO dto) {
        return ResponseEntity.status(HttpStatus.CREATED).body(usuarioService.cadastrarRecepcionistaAdmin(dto));
    }

    // Altera nome, e-mail, telefone, nascimento e endereço de qualquer usuário (CPF e cargo não mudam)
    @PutMapping("/{publicId}")
    public ResponseEntity<PerfilAtualizadoResponseDTO> atualizarDados(
            @PathVariable UUID publicId,
            @Valid @RequestBody PerfilUpdateRequestDTO dto,
            Authentication authentication) {
        return ResponseEntity.ok(usuarioService.atualizarDadosAdmin(publicId, dto, authentication.getName()));
    }

    // Devolve (criando se preciso) o paciente titular do usuário, para poder agendar exame para ele
    @PostMapping("/{publicId}/paciente-titular")
    public ResponseEntity<PacienteResponseDTO> garantirPacienteTitular(@PathVariable UUID publicId) {
        return ResponseEntity.ok(usuarioService.garantirTitularAdmin(publicId));
    }

    @PatchMapping("/{publicId}/senha")
    public ResponseEntity<Void> redefinirSenha(
            @PathVariable UUID publicId,
            @Valid @RequestBody AdminAlterarSenhaRequestDTO dto) {
        usuarioService.redefinirSenhaAdmin(publicId, dto);
        return ResponseEntity.noContent().build();
    }

    @PatchMapping("/{publicId}/cargo")
    public ResponseEntity<UsuarioResponseDTO> alterarCargo(
            @PathVariable UUID publicId,
            @Valid @RequestBody AlterarCargoRequestDTO dto,
            Authentication authentication) {
        return ResponseEntity.ok(usuarioService.alterarCargoAdmin(publicId, dto, authentication.getName()));
    }

    @PatchMapping("/{publicId}/status")
    public ResponseEntity<UsuarioResponseDTO> alterarStatus(
            @PathVariable UUID publicId,
            @Valid @RequestBody AlterarStatusUsuarioRequestDTO dto,
            Authentication authentication) {
        return ResponseEntity.ok(usuarioService.alterarStatusAdmin(publicId, dto, authentication.getName()));
    }
}
