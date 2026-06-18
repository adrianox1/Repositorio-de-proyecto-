package com.example.proyecto.controller;

import com.example.proyecto.model.Usuario;
import com.example.proyecto.service.UsuarioService;
import jakarta.servlet.http.HttpSession;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.*;

import java.util.Optional;

@Controller
@RequestMapping("/usuarios")
public class UsuarioController {
    
    @Autowired
    private UsuarioService usuarioService;
    
    @GetMapping("/registro")
    public String mostrarRegistro(Model model) {
        model.addAttribute("usuario", new Usuario());
        return "registro";
    }
    
    @PostMapping("/registro")
    public String registrar(@ModelAttribute Usuario usuario, Model model) {
        if (usuarioService.existeEmail(usuario.getEmail())) {
            model.addAttribute("error", "El email ya está registrado");
            return "registro";
        }
        usuarioService.registrarUsuario(usuario);
        model.addAttribute("mensaje", "Registro exitoso. Inicia sesión");
        return "iniciar-sesion";
    }
    
    @GetMapping("/iniciar-sesion")
    public String mostrarLogin(Model model) {
        model.addAttribute("usuario", new Usuario());
        return "iniciar-sesion";
    }
    
    @PostMapping("/login")
    public String login(@RequestParam String email, @RequestParam String password, 
                        HttpSession session, Model model) {
        if (usuarioService.validarCredenciales(email, password)) {
            Optional<Usuario> usuario = usuarioService.buscarPorEmail(email);
            if (usuario.isPresent()) {
                session.setAttribute("usuarioId", usuario.get().getId());
                session.setAttribute("usuarioNombre", usuario.get().getNombre());
                return "redirect:/";
            }
        }
        model.addAttribute("error", "Email o contraseña incorrectos");
        return "iniciar-sesion";
    }
    
    @GetMapping("/logout")
    public String logout(HttpSession session) {
        session.invalidate();
        return "redirect:/";
    }
}
