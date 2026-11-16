package com.hospital.agendamento_api.service;

import com.hospital.agendamento_api.service.RegrasAgenda.Excecao;
import com.hospital.agendamento_api.service.RegrasAgenda.Janela;
import com.hospital.agendamento_api.service.RegrasAgenda.Padrao;
import org.junit.jupiter.api.Test;

import java.time.LocalDate;
import java.time.LocalTime;
import java.time.OffsetDateTime;
import java.time.ZonedDateTime;
import java.util.List;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.*;

class RegrasAgendaTest {

    // Padrão oficial do hospital: 06:30 às 21:00, horários de 30 em 30 minutos
    private static final Padrao PADRAO = new Padrao(LocalTime.of(6, 30), LocalTime.of(21, 0), 30);
    private static final LocalDate DIA = LocalDate.of(2026, 11, 20);

    private static OffsetDateTime em(LocalDate dia, int hora, int minuto) {
        return ZonedDateTime.of(dia, LocalTime.of(hora, minuto), RegrasAgenda.ZONA).toOffsetDateTime();
    }

    @Test
    void semExcecaoDiaSegueOPadrao() {
        Janela j = RegrasAgenda.janelaDoDia(PADRAO, null);
        assertTrue(j.disponivel());
        assertEquals(LocalTime.of(6, 30), j.inicio());
        assertEquals(LocalTime.of(21, 0), j.fim());
    }

    @Test
    void gradePadraoTem29HorariosDe0630Ate2030() {
        List<LocalTime> grade = RegrasAgenda.iniciosDaGrade(RegrasAgenda.janelaDoDia(PADRAO, null));
        assertEquals(29, grade.size());
        assertEquals(LocalTime.of(6, 30), grade.getFirst());
        assertEquals(LocalTime.of(20, 30), grade.getLast()); // o último horário termina às 21:00
    }

    @Test
    void diaFechadoNaoTemHorarios() {
        Janela j = RegrasAgenda.janelaDoDia(PADRAO, new Excecao(false, null, null));
        assertFalse(j.disponivel());
        assertTrue(RegrasAgenda.iniciosDaGrade(j).isEmpty());
        assertNotNull(RegrasAgenda.motivoInvalido(j, em(DIA, 9, 0)));
    }

    @Test
    void diaComHorarioProprioSubstituiOPadrao() {
        Janela j = RegrasAgenda.janelaDoDia(PADRAO, new Excecao(true, LocalTime.of(8, 0), LocalTime.of(12, 0)));
        assertEquals(8, RegrasAgenda.iniciosDaGrade(j).size());
        assertNull(RegrasAgenda.motivoInvalido(j, em(DIA, 8, 0)));
        assertNotNull(RegrasAgenda.motivoInvalido(j, em(DIA, 12, 0)));
        assertNotNull(RegrasAgenda.motivoInvalido(j, em(DIA, 7, 0)));
    }

    @Test
    void validaHorariosDaGrade() {
        Janela j = RegrasAgenda.janelaDoDia(PADRAO, null);
        assertNull(RegrasAgenda.motivoInvalido(j, em(DIA, 6, 30)));
        assertNull(RegrasAgenda.motivoInvalido(j, em(DIA, 20, 30)));
        assertNotNull(RegrasAgenda.motivoInvalido(j, em(DIA, 6, 0)), "antes da abertura");
        assertNotNull(RegrasAgenda.motivoInvalido(j, em(DIA, 21, 0)), "o horário de 21:00 já estouraria o encerramento");
        assertNotNull(RegrasAgenda.motivoInvalido(j, em(DIA, 9, 10)), "fora da grade de 30 em 30");
    }

    @Test
    void validaNoFusoDoHospitalEmQualquerOffset() {
        Janela j = RegrasAgenda.janelaDoDia(PADRAO, null);
        // 09:00 em Brasília (UTC-3) enviado como 12:00Z continua sendo o horário das 09:00
        assertNull(RegrasAgenda.motivoInvalido(j, OffsetDateTime.parse("2026-11-20T12:00:00Z")));
        assertNotNull(RegrasAgenda.motivoInvalido(j, OffsetDateTime.parse("2026-11-20T06:00:00Z"))); // 03:00 local
    }

    @Test
    void janelaTerminandoPertoDaMeiaNoiteNaoEntraEmLoopInfinito() {
        Padrao noturno = new Padrao(LocalTime.of(22, 0), LocalTime.of(23, 59), 30);
        List<LocalTime> grade = RegrasAgenda.iniciosDaGrade(RegrasAgenda.janelaDoDia(noturno, null));
        assertEquals(List.of(LocalTime.of(22, 0), LocalTime.of(22, 30), LocalTime.of(23, 0)), grade);
    }

    @Test
    void mudancaDePadraoDetectaConfirmadosQueFicariamForaDoHorario() {
        OffsetDateTime cedo = em(DIA, 7, 0);
        OffsetDateTime tarde = em(DIA, 15, 0);
        Padrao novo = new Padrao(LocalTime.of(8, 0), LocalTime.of(18, 0), 30);

        assertEquals(List.of(cedo), RegrasAgenda.conflitantes(List.of(tarde, cedo), novo, Map.of()));
    }

    @Test
    void fecharODiaDetectaConfirmadosNele() {
        OffsetDateTime confirmado = em(DIA, 9, 0);
        OffsetDateTime outroDia = em(DIA.plusDays(1), 9, 0);
        Map<LocalDate, Excecao> fechado = Map.of(DIA, new Excecao(false, null, null));

        assertEquals(List.of(confirmado), RegrasAgenda.conflitantes(List.of(confirmado, outroDia), PADRAO, fechado));
    }

    @Test
    void mudarADuracaoDetectaConfirmadosForaDaNovaGrade() {
        OffsetDateTime as0900 = em(DIA, 9, 0); // válido de 30 em 30 a partir de 06:30, mas não de 60 em 60 (06:30, 07:30, 08:30, 09:30...)
        Padrao de60 = new Padrao(LocalTime.of(6, 30), LocalTime.of(21, 0), 60);
        assertEquals(List.of(as0900), RegrasAgenda.conflitantes(List.of(as0900), de60, Map.of()));
    }
}
