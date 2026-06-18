/**
 * WAU Piura - Formulario de Registro de Usuarios
 * Específico para registro.html.
 */

document.addEventListener('DOMContentLoaded', () => {
  const registerForm = document.querySelector('.auth-form');
  if (registerForm) {
    registerForm.addEventListener('submit', (e) => {
      e.preventDefault();
      
      const nameInput = registerForm.querySelector('input[placeholder*="Nombre"]');
      const emailInput = registerForm.querySelector('input[placeholder*="Correo"]');
      const phoneInput = registerForm.querySelector('input[placeholder*="Teléfono"]');
      const addressInput = registerForm.querySelector('input[placeholder*="Dirección"]');
      const passInput = registerForm.querySelector('input[placeholder*="Contraseña"]:not([placeholder*="Confirmar"])');
      const confirmPassInput = registerForm.querySelector('input[placeholder*="Confirmar"]');

      const nombre = nameInput ? nameInput.value.trim() : '';
      const correo = emailInput ? emailInput.value.trim() : '';
      const telefono = phoneInput ? phoneInput.value.trim() : '';
      const direccion = addressInput ? addressInput.value.trim() : '';
      const contrasena = passInput ? passInput.value : '';

      // Validaciones frontend obligatorias
      if (!nombre) {
        alert("El nombre es obligatorio.");
        return;
      }
      if (!correo) {
        alert("El correo es obligatorio.");
        return;
      }

      // Validar formato de correo electrónico
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(correo)) {
        alert("El formato del correo no es válido.");
        return;
      }

      if (!telefono) {
        alert("El teléfono es obligatorio.");
        return;
      }
      if (!direccion) {
        alert("La dirección es obligatoria.");
        return;
      }

      if (!contrasena) {
        alert("La contraseña es obligatoria.");
        return;
      }

      // Si existe confirmar contraseña, debe coincidir con la contraseña
      if (confirmPassInput) {
        const confirmarContrasena = confirmPassInput.value;
        if (!confirmarContrasena) {
          alert("Por favor, confirma tu contraseña.");
          return;
        }
        if (confirmarContrasena !== contrasena) {
          alert("Las contraseñas no coinciden.");
          return;
        }
      }

      fetch('/api/registro', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nombre: nombre,
          correo: correo,
          telefono: telefono,
          direccion: direccion,
          contrasena: contrasena
        })
      })
      .then(res => res.json())
      .then(data => {
        if (data.ok) {
          alert("Usuario registrado correctamente. Ahora inicia sesión.");
          window.location.href = 'iniciar-sesion.html';
        } else {
          console.error("Fallo de validación en backend al registrarse:", data.error);
          alert(data.error || "No se pudo registrar el usuario. Verifica los datos ingresados.");
        }
      })
      .catch(err => {
        console.error("Error técnico al registrarse:", err);
        alert("No se pudo registrar el usuario. Verifica los datos ingresados.");
      });
    });
  }
});
