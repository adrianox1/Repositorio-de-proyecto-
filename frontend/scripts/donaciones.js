/**
 * Formulario de donaciones generales.
 * Envía un multipart/form-data con el comprobante y los datos de la donación.
 */

document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('formDonacion');
  if (!form) return;

  form.addEventListener('submit', async (event) => {
    event.preventDefault();

    const usuarioId = sessionStorage.getItem('usuarioId');
    if (!usuarioId) {
      toast('Debes iniciar sesión para poder donar.', 'warning');
      setTimeout(() => { window.location.href = 'iniciar-sesion.html'; }, 1200);
      return;
    }

    const monto = form.monto.value.trim();
    const numeroOperacion = form.numeroOperacion.value.trim();
    const fotoBoucher = form.fotoBoucher.files[0];

    limpiarValidacion(form);
    const errores = [];
    if (!Validar.requerido(monto) || isNaN(Number(monto)) || Number(monto) <= 0) {
      errores.push({ input: form.monto, mensaje: 'Ingrese un monto válido mayor que cero.' });
    }
    if (!Validar.requerido(numeroOperacion)) {
      errores.push({ input: form.numeroOperacion, mensaje: 'El código de operación es obligatorio.' });
    }
    if (!fotoBoucher) {
      errores.push({ input: form.fotoBoucher, mensaje: 'Debes subir la foto del boucher.' });
    }
    if (errores.length > 0) {
      mostrarErrores(form, errores);
      return;
    }

    const data = new FormData();
    data.append('monto', monto);
    data.append('numeroOperacion', numeroOperacion);
    data.append('usuarioId', usuarioId);
    data.append('fotoBoucher', fotoBoucher);

    try {
      const respuesta = await fetch('/api/donaciones', {
        method: 'POST',
        credentials: 'include',
        body: data
      });
      const resultado = await respuesta.json();

      if (resultado.ok) {
        toast('Donación enviada. Nuestro equipo revisará el comprobante.', 'success', 4000, true);
        form.reset();
      } else {
        toast(resultado.error || 'No se pudo registrar la donación.', 'error');
      }
    } catch (error) {
      console.error('Error al enviar donación:', error);
      toast('No se pudo enviar la donación. Intenta nuevamente más tarde.', 'error');
    }
  });
});
