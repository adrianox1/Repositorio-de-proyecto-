/**
 * WAU Piura - Formulario de Inicio de Sesión
 * Específico para iniciar-sesion.html.
 */

document.addEventListener('DOMContentLoaded', () => {
  const loginForm = document.querySelector('.auth-form');
  if (loginForm) {
    loginForm.addEventListener('submit', (e) => {
      e.preventDefault();
      
      const emailInput = loginForm.querySelector('input[type="email"]');
      const passInput = loginForm.querySelector('input[type="password"]');

      if (!emailInput || !passInput) return;

      const correo = emailInput.value.trim();
      const contrasena = passInput.value;

      if (!correo || !contrasena) {
        alert("Completa todos los campos.");
        return;
      }

      fetch('../backend/api/login.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          correo: correo,
          contrasena: contrasena
        })
      })
      .then(res => res.json())
      .then(data => {
        if (data.ok) {
          alert(`¡Ingreso correcto! Bienvenido(a) ${data.usuario.nombre}.`);
          window.location.href = 'index.html';
        } else {
          console.error("Error de credenciales al iniciar sesión:", data.error);
          alert("Correo o contraseña incorrectos.");
        }
      })
      .catch(err => {
        console.error("Error técnico al ingresar:", err);
        alert("Correo o contraseña incorrectos.");
      });
    });
  }
});
