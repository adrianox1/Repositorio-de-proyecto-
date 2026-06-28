package com.example.proyecto.service;

import com.example.proyecto.model.Mascota;
import com.example.proyecto.repository.MascotaRepository;
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
class MascotaServiceTest {

    @Mock
    private MascotaRepository mascotaRepository;

    @InjectMocks
    private MascotaServiceImpl mascotaService;

    // ── crear ────────────────────────────────────────────────────────────────

    @Test
    void crear_guardaYRetornaMascota() {
        Mascota mascota = buildMascota("Max", "perro");
        when(mascotaRepository.save(mascota)).thenReturn(mascota);

        Mascota resultado = mascotaService.crear(mascota);

        assertThat(resultado.getNombre()).isEqualTo("Max");
        verify(mascotaRepository).save(mascota);
    }

    // ── actualizar ───────────────────────────────────────────────────────────

    @Test
    void actualizar_idExiste_actualizaCampos() {
        Mascota existente = buildMascota("Rex", "perro");
        existente.setId(1L);

        Mascota datos = buildMascota("Tobi", "gato");
        datos.setRaza("Siames");
        datos.setEdadMeses(6);

        when(mascotaRepository.findById(1L)).thenReturn(Optional.of(existente));
        when(mascotaRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));

        Mascota resultado = mascotaService.actualizar(1L, datos);

        assertThat(resultado.getNombre()).isEqualTo("Tobi");
        assertThat(resultado.getEspecie()).isEqualTo("gato");
        assertThat(resultado.getRaza()).isEqualTo("Siames");
        assertThat(resultado.getEdadMeses()).isEqualTo(6);
    }

    @Test
    void actualizar_idNoExiste_retornaNull() {
        when(mascotaRepository.findById(99L)).thenReturn(Optional.empty());

        Mascota resultado = mascotaService.actualizar(99L, buildMascota("X", "perro"));

        assertThat(resultado).isNull();
        verify(mascotaRepository, never()).save(any());
    }

    // ── eliminar ─────────────────────────────────────────────────────────────

    @Test
    void eliminar_llamaDeleteById() {
        mascotaService.eliminar(3L);
        verify(mascotaRepository).deleteById(3L);
    }

    // ── listar ───────────────────────────────────────────────────────────────

    @Test
    void listarTodas_retornaListaDelRepositorio() {
        List<Mascota> lista = List.of(buildMascota("A", "perro"), buildMascota("B", "gato"));
        when(mascotaRepository.findAllByOrderByIdDesc()).thenReturn(lista);

        List<Mascota> resultado = mascotaService.listarTodas();

        assertThat(resultado).hasSize(2);
    }

    @Test
    void listarPorUsuario_retornaListaFiltrada() {
        List<Mascota> lista = List.of(buildMascota("Michi", "gato"));
        when(mascotaRepository.findByUsuarioId(7L)).thenReturn(lista);

        List<Mascota> resultado = mascotaService.listarPorUsuario(7L);

        assertThat(resultado).hasSize(1);
        assertThat(resultado.get(0).getNombre()).isEqualTo("Michi");
    }

    // ── helper ───────────────────────────────────────────────────────────────

    private Mascota buildMascota(String nombre, String especie) {
        Mascota m = new Mascota();
        m.setNombre(nombre);
        m.setEspecie(especie);
        m.setGenero("macho");
        m.setEdadMeses(12);
        return m;
    }
}
