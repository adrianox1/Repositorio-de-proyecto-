package com.example.proyecto.service;

import com.example.proyecto.model.Usuario;
import com.example.proyecto.repository.UsuarioRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class UsuarioServiceTest {

    @Mock
    private UsuarioRepository usuarioRepository;

    @Mock
    private PasswordEncoder passwordEncoder;

    @InjectMocks
    private UsuarioServiceImpl usuarioService;

    private PasswordEncoder realEncoder;

    @BeforeEach
    void setUp() {
        realEncoder = new BCryptPasswordEncoder();
    }

    // ── registrarUsuario ────────────────────────────────────────────────────

    @Test
    void registrarUsuario_guardaConPasswordCifrado() {
        Usuario usuario = new Usuario("Ana", "ana@test.com", "secreto123");
        String hashFalso = "$2a$10$hash";

        when(passwordEncoder.encode("secreto123")).thenReturn(hashFalso);
        when(usuarioRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));

        Usuario resultado = usuarioService.registrarUsuario(usuario);

        assertThat(resultado.getPassword()).isEqualTo(hashFalso);
        verify(passwordEncoder).encode("secreto123");
        verify(usuarioRepository).save(usuario);
    }

    // ── validarCredenciales ─────────────────────────────────────────────────

    @Test
    void validarCredenciales_usuarioNoExiste_retornaFalse() {
        when(usuarioRepository.findByEmail("noexiste@test.com")).thenReturn(Optional.empty());

        boolean resultado = usuarioService.validarCredenciales("noexiste@test.com", "clave");

        assertThat(resultado).isFalse();
    }

    @Test
    void validarCredenciales_passwordBcrypt_correcta_retornaTrue() {
        String hash = realEncoder.encode("miClave");
        Usuario usuario = new Usuario("Luis", "luis@test.com", hash);

        when(usuarioRepository.findByEmail("luis@test.com")).thenReturn(Optional.of(usuario));
        when(passwordEncoder.matches("miClave", hash)).thenReturn(true);

        boolean resultado = usuarioService.validarCredenciales("luis@test.com", "miClave");

        assertThat(resultado).isTrue();
    }

    @Test
    void validarCredenciales_passwordBcrypt_incorrecta_retornaFalse() {
        String hash = realEncoder.encode("miClave");
        Usuario usuario = new Usuario("Luis", "luis@test.com", hash);

        when(usuarioRepository.findByEmail("luis@test.com")).thenReturn(Optional.of(usuario));
        when(passwordEncoder.matches("otraClave", hash)).thenReturn(false);

        boolean resultado = usuarioService.validarCredenciales("luis@test.com", "otraClave");

        assertThat(resultado).isFalse();
    }

    @Test
    void validarCredenciales_passwordPlanaCorrecta_migraABcrypt() {
        // Simula contraseña en texto plano (datos del seed anterior)
        Usuario usuario = new Usuario("Rosa", "rosa@test.com", "rosa123");
        String nuevoHash = "$2a$10$nuevo";

        when(usuarioRepository.findByEmail("rosa@test.com")).thenReturn(Optional.of(usuario));
        when(passwordEncoder.encode("rosa123")).thenReturn(nuevoHash);
        when(usuarioRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));

        boolean resultado = usuarioService.validarCredenciales("rosa@test.com", "rosa123");

        assertThat(resultado).isTrue();
        assertThat(usuario.getPassword()).isEqualTo(nuevoHash);   // migró a BCrypt
        verify(usuarioRepository).save(usuario);
    }

    @Test
    void validarCredenciales_passwordPlanaIncorrecta_retornaFalse() {
        Usuario usuario = new Usuario("Rosa", "rosa@test.com", "rosa123");

        when(usuarioRepository.findByEmail("rosa@test.com")).thenReturn(Optional.of(usuario));

        boolean resultado = usuarioService.validarCredenciales("rosa@test.com", "otraClave");

        assertThat(resultado).isFalse();
        verify(usuarioRepository, never()).save(any());   // no debe migrar nada
    }

    // ── existeEmail ─────────────────────────────────────────────────────────

    @Test
    void existeEmail_delegaAlRepositorio() {
        when(usuarioRepository.existsByEmail("x@test.com")).thenReturn(true);

        assertThat(usuarioService.existeEmail("x@test.com")).isTrue();
        verify(usuarioRepository).existsByEmail("x@test.com");
    }

    // ── eliminarUsuario ─────────────────────────────────────────────────────

    @Test
    void eliminarUsuario_llamaDeleteById() {
        usuarioService.eliminarUsuario(5L);
        verify(usuarioRepository).deleteById(5L);
    }
}
