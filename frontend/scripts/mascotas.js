/**
 * WAU Piura - Mis Mascotas (vista de usuario)
 * Permite al usuario registrar, editar y eliminar SUS propias mascotas.
 * Consume la API REST del backend Java (/api/mascotas).
 */

// Usa el interceptor de sesión global (redirige a login si la sesión expira)
function api(url, options = {}) {
  return apiFetch(url, options);
}

document.addEventListener('DOMContentLoaded', () => {
  const tabla = document.getElementById('tablaMascotas');
  if (!tabla) return; // No estamos en la vista de mascotas

  protegerRuta().then(ok => {
    if (!ok) return;
    cargarMisMascotas();
    initFormulario();
  });
});

// ==========================================
// 1. PROTECCIÓN: requiere sesión iniciada
// ==========================================
function protegerRuta() {
  return api('/api/me')
    .then(res => res.json())
    .then(data => {
      if (!data.ok || !data.usuario) {
        toast('Debes iniciar sesión para administrar tus mascotas.', 'warning');
        setTimeout(() => { window.location.href = 'iniciar-sesion.html'; }, 1200);
        return false;
      }
      return true;
    })
    .catch(() => {
      window.location.href = 'iniciar-sesion.html';
      return false;
    });
}

// ==========================================
// 2. CARGAR MIS MASCOTAS
// ==========================================
function cargarMisMascotas() {
  const tabla = document.getElementById('tablaMascotas');

  api('/api/mascotas/mias')
    .then(res => res.json())
    .then(data => {
      if (!data.ok) {
        tabla.innerHTML = tablaVacia('🔧', 'No se pudieron cargar tus mascotas', 'El servidor devolvió un error. Intenta recargar la página.', 7);
        return;
      }
      const mascotas = data.mascotas || [];
      if (mascotas.length === 0) {
        tabla.innerHTML = tablaVacia('🐶', 'Aún no has registrado mascotas', 'Completa el formulario de arriba para publicar tu primera mascota en adopción.', 7);
        return;
      }

      tabla.innerHTML = '';
      mascotas.forEach(m => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
          <td>${m.id}</td>
          <td>${escapeHTML(m.nombre)}</td>
          <td>${escapeHTML(m.especie)}</td>
          <td>${escapeHTML(m.genero)}</td>
          <td><span class="badge badge-usuario">${escapeHTML(m.estado || '')}</span></td>
          <td>${m.disponible ? 'Sí' : 'No'}</td>
          <td>
            <button class="btn-secondary btn-editar" data-id="${m.id}" style="padding:0.4rem 0.8rem; font-size:0.8rem;">Editar</button>
            <button class="btn-delete btn-eliminar" data-id="${m.id}" data-nombre="${escapeHTML(m.nombre)}">Eliminar</button>
          </td>
        `;
        tabla.appendChild(tr);
      });

      // Guardamos las mascotas para poder editarlas sin pedir de nuevo al backend
      window._misMascotas = mascotas;

      tabla.querySelectorAll('.btn-editar').forEach(btn => {
        btn.addEventListener('click', () => cargarEnFormulario(btn.dataset.id));
      });
      tabla.querySelectorAll('.btn-eliminar').forEach(btn => {
        btn.addEventListener('click', () => eliminarMascota(btn.dataset.id, btn.dataset.nombre));
      });
    })
    .catch(err => {
      console.error('Error al cargar mascotas:', err);
      tabla.innerHTML = tablaVacia('🔌', 'Sin conexión con el servidor', 'Comprueba tu conexión e intenta recargar la página.', 7);
    });
}

// ==========================================
// 3. FORMULARIO: crear / editar
// ==========================================
function initFormulario() {
  const form = document.getElementById('formMascota');
  const btnCancelar = document.getElementById('btnCancelar');
  if (!form) return;

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const fd = new FormData(form);
    const id = fd.get('id');
    const body = {
      nombre: fd.get('nombre'),
      especie: fd.get('especie'),
      genero: fd.get('genero'),
      raza: fd.get('raza'),
      edadMeses: fd.get('edadMeses') || 0,
      lugarRescate: fd.get('lugarRescate'),
      fotoUrl: fd.get('fotoUrl').trim() || form.fotoUrl.dataset.original || '',
      descripcion: fd.get('descripcion')
    };

    limpiarValidacion(form);
    const errores = [];
    if (!Validar.requerido(body.nombre)) {
      errores.push({ input: form.nombre, mensaje: 'El nombre de la mascota es obligatorio.' });
    }
    if (!Validar.noNegativo(body.edadMeses)) {
      errores.push({ input: form.edadMeses, mensaje: 'La edad debe ser un número válido (0 o más).' });
    }
    if (Validar.requerido(body.fotoUrl) && !body.fotoUrl.startsWith('/uploads/') && !Validar.url(body.fotoUrl)) {
      errores.push({ input: form.fotoUrl, mensaje: 'La URL de la foto no es válida.' });
    }
    if (errores.length > 0) {
      mostrarErrores(form, errores);
      return;
    }

    // Si se eligió un archivo, súbelo primero y usa la ruta resultante
    const fileInput = form.foto;
    if (fileInput && fileInput.files.length > 0) {
      try {
        const fdFoto = new FormData();
        fdFoto.append('archivo', fileInput.files[0]);
        const resp = await api('/api/uploads/mascota', { method: 'POST', body: fdFoto });
        const dataFoto = await resp.json();
        if (!dataFoto.ok) {
          toast(dataFoto.error || 'No se pudo subir la imagen.', 'error');
          return;
        }
        body.fotoUrl = dataFoto.url;
      } catch (err) {
        console.error('Error al subir la imagen:', err);
        toast('No se pudo subir la imagen. Comprueba tu conexión e inténtalo de nuevo.', 'error');
        return;
      }
    }

    const esEdicion = id && id.trim() !== '';
    const url = esEdicion ? `/api/mascotas/${id}` : '/api/mascotas';
    const metodo = esEdicion ? 'PUT' : 'POST';

    api(url, {
      method: metodo,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    })
      .then(res => res.json())
      .then(data => {
        if (data.ok) {
          toast(esEdicion ? 'Mascota actualizada.' : 'Mascota registrada.', 'success');
          resetFormulario();
          cargarMisMascotas();
        } else {
          toast(data.error || 'No se pudo guardar la mascota.', 'error');
        }
      })
      .catch(err => {
        console.error('Error al guardar mascota:', err);
        toast('No se pudieron guardar los cambios. Comprueba tu conexión e inténtalo de nuevo.', 'error');
      });
  });

  btnCancelar.addEventListener('click', resetFormulario);
}

function cargarEnFormulario(id) {
  const mascota = (window._misMascotas || []).find(m => String(m.id) === String(id));
  if (!mascota) return;

  const form = document.getElementById('formMascota');
  form.id.value = mascota.id;
  form.nombre.value = mascota.nombre || '';
  form.especie.value = mascota.especie || 'perro';
  form.genero.value = mascota.genero || 'macho';
  form.raza.value = mascota.raza || '';
  form.edadMeses.value = mascota.edadMeses != null ? mascota.edadMeses : '';
  form.lugarRescate.value = mascota.lugarRescate || '';
  // Si es ruta de subida interna, ocultarla y guardarla como fallback
  form.fotoUrl.dataset.original = mascota.fotoUrl || '';
  if ((mascota.fotoUrl || '').startsWith('/uploads/')) {
    form.fotoUrl.value = '';
    form.fotoUrl.placeholder = 'La foto actual se mantiene si no subes una nueva';
  } else {
    form.fotoUrl.value = mascota.fotoUrl || '';
  }
  form.descripcion.value = mascota.descripcion || '';
  mostrarPreviewImagen(form.foto, mascota.fotoUrl);

  document.getElementById('formTitulo').textContent = `Editando: ${mascota.nombre}`;
  document.getElementById('btnGuardar').textContent = 'Guardar cambios';
  document.getElementById('btnCancelar').style.display = 'inline-block';
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function resetFormulario() {
  const form = document.getElementById('formMascota');
  form.reset();
  form.id.value = '';
  document.getElementById('formTitulo').textContent = 'Registrar nueva mascota';
  document.getElementById('btnGuardar').textContent = 'Registrar mascota';
  document.getElementById('btnCancelar').style.display = 'none';
}

// ==========================================
// 4. ELIMINAR
// ==========================================
function eliminarMascota(id, nombre) {
  confirmar({
    titulo: `Eliminar a "${nombre}"`,
    mensaje: 'Esta acción no se puede deshacer.',
    textoAceptar: 'Sí, eliminar'
  }).then(ok => {
    if (!ok) return;
    api(`/api/mascotas/${id}`, { method: 'DELETE' })
      .then(res => res.json())
      .then(data => {
        if (data.ok) {
          toast('Mascota eliminada.', 'success');
          cargarMisMascotas();
        } else {
          toast(data.error || 'No se pudo eliminar la mascota.', 'error');
        }
      })
      .catch(err => {
        console.error('Error al eliminar mascota:', err);
        toast('No se pudo eliminar. Comprueba tu conexión e inténtalo de nuevo.', 'error');
      });
  });
}
