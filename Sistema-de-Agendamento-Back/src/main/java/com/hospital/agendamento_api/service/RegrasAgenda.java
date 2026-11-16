package com.hospital.agendamento_api.service;

import java.time.LocalDate;
import java.time.LocalTime;
import java.time.OffsetDateTime;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;

/**
 * Regras puras da agenda (sem Spring/JPA): dado o padrão de funcionamento e a exceção de um dia,
 * calcula a janela do dia, a grade de horários e se um horário é válido.
 */
final class RegrasAgenda {

    /** Fuso do hospital: "dia" e "hora" da agenda são sempre no horário de Brasília. */
    static final ZoneId ZONA = ZoneId.of("America/Sao_Paulo");

    private static final DateTimeFormatter HORA = DateTimeFormatter.ofPattern("HH:mm");
    private static final DateTimeFormatter DATA = DateTimeFormatter.ofPattern("dd/MM/yyyy");

    private RegrasAgenda() {
    }

    /** Padrão de funcionamento que vale para todos os dias. */
    record Padrao(LocalTime inicio, LocalTime fim, int duracaoMinutos) {
    }

    /** Exceção de um dia: fechado, ou aberto com horário próprio (inicio/fim nulos = usa o padrão). */
    record Excecao(boolean disponivel, LocalTime inicio, LocalTime fim) {
    }

    /** Janela efetiva de um dia depois de aplicar a exceção (se houver) sobre o padrão. */
    record Janela(boolean disponivel, LocalTime inicio, LocalTime fim, int duracaoMinutos) {
    }

    static Janela janelaDoDia(Padrao padrao, Excecao excecao) {
        if (excecao == null) {
            return new Janela(true, padrao.inicio(), padrao.fim(), padrao.duracaoMinutos());
        }
        if (!excecao.disponivel()) {
            return new Janela(false, padrao.inicio(), padrao.fim(), padrao.duracaoMinutos());
        }
        LocalTime inicio = excecao.inicio() != null ? excecao.inicio() : padrao.inicio();
        LocalTime fim = excecao.fim() != null ? excecao.fim() : padrao.fim();
        return new Janela(true, inicio, fim, padrao.duracaoMinutos());
    }

    /** Horários de início da grade do dia: do início da janela, de {duração} em {duração}, sem estourar o fim. */
    static List<LocalTime> iniciosDaGrade(Janela janela) {
        List<LocalTime> inicios = new ArrayList<>();
        if (!janela.disponivel()) {
            return inicios;
        }
        int duracao = janela.duracaoMinutos();
        int fim = minutos(janela.fim());
        // Aritmética em minutos do dia (e não LocalTime.plusMinutes) para não "dar a volta" à meia-noite
        for (int m = minutos(janela.inicio()); m + duracao <= fim; m += duracao) {
            inicios.add(LocalTime.of(m / 60, m % 60));
        }
        return inicios;
    }

    /** Retorna null se o horário é um início válido da grade do dia; senão, o motivo (para mostrar ao usuário). */
    static String motivoInvalido(Janela janela, OffsetDateTime dataHora) {
        var local = dataHora.atZoneSameInstant(ZONA);
        LocalDate dia = local.toLocalDate();
        LocalTime hora = local.toLocalTime();

        if (!janela.disponivel()) {
            return "O dia " + dia.format(DATA) + " não está disponível para agendamentos.";
        }
        if (hora.getSecond() != 0 || hora.getNano() != 0) {
            return "O horário deve ser informado em minutos cheios (ex.: 09:30).";
        }
        int min = minutos(hora);
        int inicio = minutos(janela.inicio());
        int fim = minutos(janela.fim());
        int duracao = janela.duracaoMinutos();

        if (min < inicio || min + duracao > fim) {
            return "O horário " + hora.format(HORA) + " está fora do atendimento do dia " + dia.format(DATA)
                    + " (" + janela.inicio().format(HORA) + " às " + janela.fim().format(HORA) + ").";
        }
        if ((min - inicio) % duracao != 0) {
            return "O horário " + hora.format(HORA) + " não faz parte da grade de atendimento (a cada "
                    + duracao + " minutos a partir das " + janela.inicio().format(HORA) + ").";
        }
        return null;
    }

    /**
     * Dentre as datas já confirmadas, quais deixariam de ser válidas com o padrão/exceções informados.
     * Usado para impedir mudanças de disponibilidade que "derrubariam" agendamentos já confirmados.
     */
    static List<OffsetDateTime> conflitantes(List<OffsetDateTime> datasConfirmadas,
                                             Padrao padrao,
                                             Map<LocalDate, Excecao> excecoesPorDia) {
        return datasConfirmadas.stream()
                .filter(data -> {
                    LocalDate dia = data.atZoneSameInstant(ZONA).toLocalDate();
                    Janela janela = janelaDoDia(padrao, excecoesPorDia.get(dia));
                    return motivoInvalido(janela, data) != null;
                })
                .sorted()
                .toList();
    }

    static String formatarDataHora(OffsetDateTime dataHora) {
        return dataHora.atZoneSameInstant(ZONA).format(DateTimeFormatter.ofPattern("dd/MM/yyyy 'às' HH:mm"));
    }

    private static int minutos(LocalTime t) {
        return t.toSecondOfDay() / 60;
    }
}
