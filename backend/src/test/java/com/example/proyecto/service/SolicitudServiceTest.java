package com.example.proyecto.service;

import com.example.proyecto.model.Solicitud;
import com.example.proyecto.repository.SolicitudRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class SolicitudServiceTest {

    @Mock
    private SolicitudRepository solicitudRepository;

    @InjectMocks
    private SolicitudServiceImpl solicitudService;

    // ── crear ────────────────────────────────────────────────────────────────

    @Test
    void crear_guardaYRetornaSolicitud() {
        Solicitud sol = buildSolicitud(1L, 2L, "Quiero adoptarla");
        when(solicitudRepository.save(sol)).thenReturn(sol);

        Solicitud resultado = solicitudService.crear(sol);

        assertThat(resultado.getMensaje()).isEqualTo("Quiero adoptarla");
        verify(solicitudRepository).save(sol);
    }

    // ── cambiarEstado ────────────────────────────────────────────────────────

    @Test
    void cambiarEstado_idExiste_actualizaEstado() {
        Solicitud sol = buildSolicitud(1L, 2L, "msg");
        sol.setId(10L);

        when(solicitudRepository.findById(10L)).thenReturn(Optional.of(sol));
        when(solicitudRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));

        Solicitud resultado = solicitudService.cambiarEstado(10L, "aprobada");

        assertThat(resultado.getEstado()).isEqualTo("aprobada");
        verify(solicitudRepository).save(sol);
    }

    @Test
    void cambiarEstado_idNoExiste_retornaNull() {
        when(solicitudRepository.findById(99L)).thenReturn(Optional.empty());

        Solicitud resultado = solicitudService.cambiarEstado(99L, "aprobada");

        assertThat(resultado).isNull();
        verify(solicitudRepository, never()).save(any());
    }

    // ── listar ───────────────────────────────────────────────────────────────

    @Test
    void listarTodas_retornaTodasLasSolicitudes() {
        List<Solicitud> lista = List.of(
            buildSolicitud(1L, 1L, "msg1"),
            buildSolicitud(2L, 2L, "msg2")
        );
        when(solicitudRepository.findAllByOrderByIdDesc()).thenReturn(lista);

        List<Solicitud> resultado = solicitudService.listarTodas();

        assertThat(resultado).hasSize(2);
    }

    @Test
    void listarPorUsuario_retornaSoloLasDelUsuario() {
        List<Solicitud> lista = List.of(buildSolicitud(1L, 5L, "adoptar a Firulais"));
        when(solicitudRepository.findByUsuarioIdOrderByIdDesc(5L)).thenReturn(lista);

        List<Solicitud> resultado = solicitudService.listarPorUsuario(5L);

        assertThat(resultado).hasSize(1);
        assertThat(resultado.get(0).getUsuarioId()).isEqualTo(5L);
    }

    // ── helper ───────────────────────────────────────────────────────────────

    private Solicitud buildSolicitud(Long mascotaId, Long usuarioId, String mensaje) {
        Solicitud s = new Solicitud();
        s.setMascotaId(mascotaId);
        s.setUsuarioId(usuarioId);
        s.setMensaje(mensaje);
        return s;
    }
}
