package com.hospital.agendamento_api.service;

import com.hospital.agendamento_api.dto.DiaAgendaRequestDTO;
import com.hospital.agendamento_api.dto.DiaAgendaResponseDTO;
import com.hospital.agendamento_api.dto.HorarioAgendaDTO;
import com.hospital.agendamento_api.dto.HorariosDiaResponseDTO;
import com.hospital.agendamento_api.dto.PadraoAgendaRequestDTO;
import com.hospital.agendamento_api.dto.PadraoAgendaResponseDTO;
import com.hospital.agendamento_api.entity.ConfiguracaoAgenda;
import com.hospital.agendamento_api.entity.DiaAgenda;
import com.hospital.agendamento_api.entity.Usuario;
import com.hospital.agendamento_api.exception.BusinessException;
import com.hospital.agendamento_api.exception.ResourceNotFoundException;
import com.hospital.agendamento_api.repository.AgendamentoRepository;
import com.hospital.agendamento_api.repository.ConfiguracaoAgendaRepository;
import com.hospital.agendamento_api.repository.DiaAgendaRepository;
import com.hospital.agendamento_api.repository.UsuarioRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.time.LocalDate;
import java.time.LocalTime;
import java.time.OffsetDateTime;
import java.time.ZonedDateTime;
import java.time.format.TextStyle;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Optional;
import java.util.Set;
import java.util.stream.Collectors;

import static com.hospital.agendamento_api.service.RegrasAgenda.ZONA;

/**
 * Disponibilidade da agenda:
 * - o PADRÃO de funcionamento (horário de abertura/encerramento + duração de cada horário), aplicado a todos os dias;
 * - AJUSTES por dia (fechar um dia ou dar a ele um horário próprio);
 * - a GRADE de horários de cada dia e a validação de que um horário está livre.
 *
 * Um horário com agendamento CONFIRMADO (ou CONCLUIDO) fica bloqueado para qualquer outro paciente.
 */
@Service
public class AgendaService {

    private static final Set<String> STATUS_QUE_BLOQUEIAM = Set.of("CONFIRMADO", "CONCLUIDO");
    private static final Set<String> STATUS_CONFIRMADO = Set.of("CONFIRMADO");
    private static final int LIMITE_DIAS_LISTAGEM = 93;
    private static final Locale PT_BR = Locale.of("pt", "BR");

    private static final String LIVRE = "LIVRE";
    private static final String OCUPADO = "OCUPADO";
    private static final String PASSADO = "PASSADO";

    private final ConfiguracaoAgendaRepository configuracaoRepository;
    private final DiaAgendaRepository diaAgendaRepository;
    private final AgendamentoRepository agendamentoRepository;
    private final UsuarioRepository usuarioRepository;

    public AgendaService(ConfiguracaoAgendaRepository configuracaoRepository,
                         DiaAgendaRepository diaAgendaRepository,
                         AgendamentoRepository agendamentoRepository,
                         UsuarioRepository usuarioRepository) {
        this.configuracaoRepository = configuracaoRepository;
        this.diaAgendaRepository = diaAgendaRepository;
        this.agendamentoRepository = agendamentoRepository;
        this.usuarioRepository = usuarioRepository;
    }

    // =====================================================================================
    // Padrão de funcionamento (vale para todos os dias)
    // =====================================================================================

    @Transactional(readOnly = true)
    public PadraoAgendaResponseDTO obterPadrao() {
        return paraDTO(obterConfiguracao());
    }

    /**
     * Define o padrão de horário de funcionamento para todos os dias. Recusa a mudança se ela deixaria
     * agendamentos já confirmados fora do horário (a recepção precisa remarcá-los/cancelá-los antes).
     */
    @Transactional
    public PadraoAgendaResponseDTO atualizarPadrao(PadraoAgendaRequestDTO dto, String emailRecepcionista) {
        Usuario usuario = buscarUsuario(emailRecepcionista);
        ConfiguracaoAgenda config = travarConfiguracao();

        LocalTime inicio = truncar(dto.horarioInicio());
        LocalTime fim = truncar(dto.horarioFim());
        int duracao = dto.duracaoSlotMinutos();
        validarJanela(inicio, fim, duracao, "O horário de funcionamento");

        RegrasAgenda.Padrao proposto = new RegrasAgenda.Padrao(inicio, fim, duracao);
        Map<LocalDate, RegrasAgenda.Excecao> excecoes = excecoesPorDia(
                diaAgendaRepository.findByDataGreaterThanEqual(LocalDate.now(ZONA)));
        List<OffsetDateTime> confirmadosFuturos = agendamentoRepository
                .findDatasConfirmadasAPartirDe(STATUS_CONFIRMADO, OffsetDateTime.now());
        garantirSemConflitos(RegrasAgenda.conflitantes(confirmadosFuturos, proposto, excecoes));

        config.setHorarioInicio(inicio);
        config.setHorarioFim(fim);
        config.setDuracaoSlotMinutos(duracao);
        config.setAtualizadoEm(OffsetDateTime.now());
        config.setAtualizadoPor(usuario);

        return paraDTO(config);
    }

    // =====================================================================================
    // Dias (consulta aberta a qualquer usuário logado; alteração só pela recepção)
    // =====================================================================================

    /** Situação de cada dia do intervalo (aberto/fechado, janela efetiva e quantos horários ainda estão livres). */
    @Transactional(readOnly = true)
    public List<DiaAgendaResponseDTO> listarDias(LocalDate inicio, LocalDate fim) {
        if (fim.isBefore(inicio)) {
            throw new BusinessException("A data final não pode ser anterior à data inicial.");
        }
        if (ChronoUnit.DAYS.between(inicio, fim) + 1 > LIMITE_DIAS_LISTAGEM) {
            throw new BusinessException("Consulte no máximo " + LIMITE_DIAS_LISTAGEM + " dias por vez.");
        }

        RegrasAgenda.Padrao padrao = padraoDe(obterConfiguracao());
        Map<LocalDate, DiaAgenda> ajustes = diaAgendaRepository.findByDataBetween(inicio, fim).stream()
                .collect(Collectors.toMap(DiaAgenda::getData, d -> d));
        Map<LocalDate, Set<Instant>> ocupados = ocupadosPorDia(inicio, fim);
        OffsetDateTime agora = OffsetDateTime.now();

        List<DiaAgendaResponseDTO> dias = new ArrayList<>();
        for (LocalDate dia = inicio; !dia.isAfter(fim); dia = dia.plusDays(1)) {
            dias.add(montarDia(dia, padrao, ajustes.get(dia), ocupados.getOrDefault(dia, Set.of()), agora));
        }
        return dias;
    }

    /** Grade de horários de um dia, cada um LIVRE, OCUPADO (confirmado para outro paciente) ou PASSADO. */
    @Transactional(readOnly = true)
    public HorariosDiaResponseDTO listarHorarios(LocalDate data) {
        RegrasAgenda.Padrao padrao = padraoDe(obterConfiguracao());
        DiaAgenda ajuste = diaAgendaRepository.findByData(data).orElse(null);
        RegrasAgenda.Janela janela = RegrasAgenda.janelaDoDia(padrao, excecaoDe(ajuste));
        Set<Instant> ocupados = ocupadosPorDia(data, data).getOrDefault(data, Set.of());
        OffsetDateTime agora = OffsetDateTime.now();

        List<HorarioAgendaDTO> horarios = RegrasAgenda.iniciosDaGrade(janela).stream()
                .map(inicio -> new HorarioAgendaDTO(
                        inicio,
                        inicio.plusMinutes(janela.duracaoMinutos()),
                        ZonedDateTime.of(data, inicio, ZONA).toOffsetDateTime(),
                        situacao(data, inicio, ocupados, agora)))
                .toList();

        return new HorariosDiaResponseDTO(
                data,
                janela.disponivel(),
                ajuste != null ? ajuste.getMotivo() : null,
                janela.duracaoMinutos(),
                horarios);
    }

    /** Fecha o dia, dá a ele um horário próprio, ou (sem horários e disponivel = true) volta ao padrão. */
    @Transactional
    public DiaAgendaResponseDTO definirDia(LocalDate data, DiaAgendaRequestDTO dto, String emailRecepcionista) {
        Usuario usuario = buscarUsuario(emailRecepcionista);
        ConfiguracaoAgenda config = travarConfiguracao();
        garantirQueODiaNaoPassou(data);

        boolean disponivel = Boolean.TRUE.equals(dto.disponivel());
        LocalTime inicio = disponivel ? truncar(dto.horarioInicio()) : null;
        LocalTime fim = disponivel ? truncar(dto.horarioFim()) : null;

        if (disponivel) {
            if ((inicio == null) != (fim == null)) {
                throw new BusinessException(
                        "Informe o início e o fim do horário do dia, ou nenhum dos dois para seguir o padrão.");
            }
            if (inicio != null) {
                validarJanela(inicio, fim, config.getDuracaoSlotMinutos(), "O horário do dia");
            }
        }

        String motivo = dto.motivo() == null || dto.motivo().isBlank() ? null : dto.motivo().trim();
        // Dia aberto sem horário próprio = dia normal: não precisa de ajuste
        RegrasAgenda.Excecao nova = disponivel && inicio == null
                ? null
                : new RegrasAgenda.Excecao(disponivel, inicio, fim);

        return aplicarAjuste(data, nova, motivo, usuario, config);
    }

    /** Remove o ajuste do dia: ele volta a seguir o padrão de funcionamento. */
    @Transactional
    public DiaAgendaResponseDTO restaurarPadraoDoDia(LocalDate data, String emailRecepcionista) {
        Usuario usuario = buscarUsuario(emailRecepcionista);
        ConfiguracaoAgenda config = travarConfiguracao();
        garantirQueODiaNaoPassou(data);
        return aplicarAjuste(data, null, null, usuario, config);
    }

    // =====================================================================================
    // Validação de horários (usada ao solicitar, confirmar, criar e remarcar agendamentos)
    // =====================================================================================

    /**
     * Valida uma das datas sugeridas pelo paciente: o dia precisa estar aberto, o horário ser da grade e
     * ainda estar livre (não confirmado para outro paciente). Não trava nada: é só uma checagem de leitura,
     * a garantia definitiva acontece na confirmação ({@link #garantirHorarioLivre}).
     */
    @Transactional(readOnly = true)
    public void validarOpcaoDoPaciente(int numeroOpcao, OffsetDateTime dataHora) {
        String motivo = motivoIndisponivel(dataHora, null);
        if (motivo != null) {
            throw new BusinessException("Opção " + numeroOpcao + ": " + motivo);
        }
    }

    /**
     * Garante que o horário pode ser ocupado por um agendamento CONFIRMADO. Deve ser chamado dentro da
     * transação que confirma/cria/remarca: o lock no padrão da agenda faz com que, se duas recepcionistas
     * tentarem o mesmo horário ao mesmo tempo, a segunda espere a primeira terminar e então seja recusada.
     *
     * @param ignorarAgendamentoId o próprio agendamento, que não conta como conflito consigo mesmo (pode ser null)
     */
    @Transactional
    public void garantirHorarioLivre(OffsetDateTime dataHora, Long ignorarAgendamentoId) {
        travarConfiguracao();
        String motivo = motivoIndisponivel(dataHora, ignorarAgendamentoId);
        if (motivo != null) {
            throw new BusinessException(motivo);
        }
    }

    // =====================================================================================
    // Internos
    // =====================================================================================

    private String motivoIndisponivel(OffsetDateTime dataHora, Long ignorarAgendamentoId) {
        if (!dataHora.isAfter(OffsetDateTime.now())) {
            return "A data e o horário devem estar no futuro.";
        }

        LocalDate dia = dataHora.atZoneSameInstant(ZONA).toLocalDate();
        DiaAgenda ajuste = diaAgendaRepository.findByData(dia).orElse(null);
        RegrasAgenda.Janela janela = RegrasAgenda.janelaDoDia(padraoDe(obterConfiguracao()), excecaoDe(ajuste));

        String invalido = RegrasAgenda.motivoInvalido(janela, dataHora);
        if (invalido != null) {
            return invalido;
        }

        boolean ocupado = ignorarAgendamentoId == null
                ? agendamentoRepository.existsByDataConfirmadaAndStatusIn(dataHora, STATUS_QUE_BLOQUEIAM)
                : agendamentoRepository.existsByDataConfirmadaAndStatusInAndIdNot(
                        dataHora, STATUS_QUE_BLOQUEIAM, ignorarAgendamentoId);
        if (ocupado) {
            return "O horário " + RegrasAgenda.formatarDataHora(dataHora)
                    + " já foi reservado para outro paciente. Escolha outro horário.";
        }
        return null;
    }

    private DiaAgendaResponseDTO aplicarAjuste(LocalDate data,
                                               RegrasAgenda.Excecao nova,
                                               String motivo,
                                               Usuario usuario,
                                               ConfiguracaoAgenda config) {
        RegrasAgenda.Padrao padrao = padraoDe(config);
        OffsetDateTime agora = OffsetDateTime.now();

        // Os agendamentos confirmados que ainda vão acontecer nesse dia continuam válidos com o ajuste?
        List<OffsetDateTime> confirmadosDoDia = agendamentoRepository.findDatasConfirmadasEntre(
                        STATUS_CONFIRMADO,
                        data.atStartOfDay(ZONA).toOffsetDateTime(),
                        data.plusDays(1).atStartOfDay(ZONA).toOffsetDateTime())
                .stream()
                .filter(d -> d.isAfter(agora))
                .toList();
        Map<LocalDate, RegrasAgenda.Excecao> excecoes = nova == null ? Map.of() : Map.of(data, nova);
        garantirSemConflitos(RegrasAgenda.conflitantes(confirmadosDoDia, padrao, excecoes));

        Optional<DiaAgenda> existente = diaAgendaRepository.findByData(data);
        DiaAgenda ajuste = null;
        if (nova == null) {
            existente.ifPresent(diaAgendaRepository::delete);
        } else {
            ajuste = existente.orElseGet(DiaAgenda::new);
            ajuste.setData(data);
            ajuste.setDisponivel(nova.disponivel());
            ajuste.setHorarioInicio(nova.inicio());
            ajuste.setHorarioFim(nova.fim());
            ajuste.setMotivo(motivo);
            ajuste.setAtualizadoEm(agora);
            ajuste.setAtualizadoPor(usuario);
            diaAgendaRepository.save(ajuste);
        }

        Set<Instant> ocupados = ocupadosPorDia(data, data).getOrDefault(data, Set.of());
        return montarDia(data, padrao, ajuste, ocupados, agora);
    }

    private DiaAgendaResponseDTO montarDia(LocalDate dia,
                                           RegrasAgenda.Padrao padrao,
                                           DiaAgenda ajuste,
                                           Set<Instant> ocupados,
                                           OffsetDateTime agora) {
        RegrasAgenda.Janela janela = RegrasAgenda.janelaDoDia(padrao, excecaoDe(ajuste));
        List<LocalTime> grade = RegrasAgenda.iniciosDaGrade(janela);
        long livres = grade.stream().filter(h -> LIVRE.equals(situacao(dia, h, ocupados, agora))).count();

        return new DiaAgendaResponseDTO(
                dia,
                dia.getDayOfWeek().getDisplayName(TextStyle.FULL, PT_BR),
                janela.disponivel(),
                janela.disponivel() ? janela.inicio() : null,
                janela.disponivel() ? janela.fim() : null,
                ajuste != null,
                ajuste != null ? ajuste.getMotivo() : null,
                grade.size(),
                (int) livres);
    }

    private String situacao(LocalDate dia, LocalTime hora, Set<Instant> ocupados, OffsetDateTime agora) {
        Instant instante = ZonedDateTime.of(dia, hora, ZONA).toInstant();
        if (!instante.isAfter(agora.toInstant())) {
            return PASSADO;
        }
        return ocupados.contains(instante) ? OCUPADO : LIVRE;
    }

    /** Instantes ocupados (CONFIRMADO/CONCLUIDO) agrupados pelo dia (no fuso do hospital), entre duas datas inclusive. */
    private Map<LocalDate, Set<Instant>> ocupadosPorDia(LocalDate inicio, LocalDate fim) {
        OffsetDateTime de = inicio.atStartOfDay(ZONA).toOffsetDateTime();
        OffsetDateTime ate = fim.plusDays(1).atStartOfDay(ZONA).toOffsetDateTime();
        return agendamentoRepository.findDatasConfirmadasEntre(STATUS_QUE_BLOQUEIAM, de, ate).stream()
                .collect(Collectors.groupingBy(
                        d -> d.atZoneSameInstant(ZONA).toLocalDate(),
                        Collectors.mapping(OffsetDateTime::toInstant, Collectors.toSet())));
    }

    private void validarJanela(LocalTime inicio, LocalTime fim, int duracaoMinutos, String quem) {
        if (!fim.isAfter(inicio)) {
            throw new BusinessException(quem + ": o encerramento deve ser depois da abertura.");
        }
        long janelaMinutos = ChronoUnit.MINUTES.between(inicio, fim);
        if (janelaMinutos < duracaoMinutos) {
            throw new BusinessException(quem + " precisa comportar ao menos um horário de " + duracaoMinutos + " minutos.");
        }
    }

    private void garantirSemConflitos(List<OffsetDateTime> conflitos) {
        if (conflitos.isEmpty()) {
            return;
        }
        String exemplos = conflitos.stream().limit(3)
                .map(RegrasAgenda::formatarDataHora)
                .collect(Collectors.joining(", "));
        throw new BusinessException("Esta alteração deixaria " + conflitos.size()
                + " agendamento(s) já confirmado(s) fora do horário de atendimento (ex.: " + exemplos
                + "). Remarque ou cancele esses agendamentos antes de continuar.");
    }

    private void garantirQueODiaNaoPassou(LocalDate data) {
        if (data.isBefore(LocalDate.now(ZONA))) {
            throw new BusinessException("Não é possível alterar a disponibilidade de um dia que já passou.");
        }
    }

    private Map<LocalDate, RegrasAgenda.Excecao> excecoesPorDia(List<DiaAgenda> ajustes) {
        return ajustes.stream().collect(Collectors.toMap(DiaAgenda::getData, this::excecaoDe));
    }

    private RegrasAgenda.Excecao excecaoDe(DiaAgenda ajuste) {
        return ajuste == null
                ? null
                : new RegrasAgenda.Excecao(Boolean.TRUE.equals(ajuste.getDisponivel()),
                        ajuste.getHorarioInicio(), ajuste.getHorarioFim());
    }

    private RegrasAgenda.Padrao padraoDe(ConfiguracaoAgenda config) {
        return new RegrasAgenda.Padrao(config.getHorarioInicio(), config.getHorarioFim(), config.getDuracaoSlotMinutos());
    }

    private PadraoAgendaResponseDTO paraDTO(ConfiguracaoAgenda config) {
        RegrasAgenda.Padrao padrao = padraoDe(config);
        int horariosPorDia = RegrasAgenda.iniciosDaGrade(RegrasAgenda.janelaDoDia(padrao, null)).size();
        return new PadraoAgendaResponseDTO(
                config.getHorarioInicio(),
                config.getHorarioFim(),
                config.getDuracaoSlotMinutos(),
                horariosPorDia,
                config.getAtualizadoEm());
    }

    private ConfiguracaoAgenda obterConfiguracao() {
        return configuracaoRepository.findById(ConfiguracaoAgenda.ID_UNICO)
                .orElseThrow(() -> new IllegalStateException("Configuração da agenda não encontrada (migration V8)"));
    }

    private ConfiguracaoAgenda travarConfiguracao() {
        return configuracaoRepository.buscarComTrava()
                .orElseThrow(() -> new IllegalStateException("Configuração da agenda não encontrada (migration V8)"));
    }

    private Usuario buscarUsuario(String email) {
        return usuarioRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("Usuário não encontrado"));
    }

    private static LocalTime truncar(LocalTime hora) {
        return hora == null ? null : hora.truncatedTo(ChronoUnit.MINUTES);
    }
}
