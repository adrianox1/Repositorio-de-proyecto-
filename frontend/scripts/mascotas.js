/**
 * WAU Piura - Mis Mascotas (vista de usuario)
 * Permite al usuario registrar, editar y eliminar SUS propias mascotas.
 * Consume la API REST del backend Java (/api/mascotas).
 */

function api(url, options = {}) {
  return fetch(url, { credentials: 'include', ...options });
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
        alert('Debes iniciar sesión para administrar tus mascotas.');
        window.location.href = 'iniciar-sesion.html';
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
        tabla.innerHTML = `<tr><td colspan="7" class="table-empty">${escapeHTML(data.error || 'No se pudieron cargar las mascotas.')}</td></tr>`;
        return;
      }
      const mascotas = data.mascotas || [];
      if (mascotas.length === 0) {
        tabla.innerHTML = `<tr><td colspan="7" class="table-empty">Aún no has registrado mascotas.</td></tr>`;
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
      tabla.innerHTML = `<tr><td colspan="7" class="table-empty">Error de conexión con el servidor.</td></tr>`;
    });
}

// ==========================================
// 3. FORMULARIO: crear / editar
// ==========================================
function initFormulario() {
  const form = document.getElementById('formMascota');
  const btnCancelar = document.getElementById('btnCancelar');
  if (!form) return;

  form.addEventListener('submit', (e) => {
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
      fotoUrl: fd.get('fotoUrl'),
      descripcion: fd.get('descripcion')
    };

    if (!body.nombre.trim()) {
      alert('El nombre de la mascota es obligatorio.');
      return;
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
          alert(esEdicion ? 'Mascota actualizada.' : 'Mascota registrada.');
          resetFormulario();
          cargarMisMascotas();
        } else {
          alert(data.error || 'No se pudo guardar la mascota.');
        }
      })
      .catch(err => {
        console.error('Error al guardar mascota:', err);
        alert('Error de conexión al guardar.');
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
  form.fotoUrl.value = mascota.fotoUrl || '';
  form.descripcion.value = mascota.descripcion || '';

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
  if (!confirm(`¿Seguro que deseas eliminar a "${nombre}"?`)) return;

  api(`/api/mascotas/${id}`, { method: 'DELETE' })
    .then(res => res.json())
    .then(data => {
      if (data.ok) {
        cargarMisMascotas();
      } else {
        alert(data.error || 'No se pudo eliminar la mascota.');
      }
    })
    .catch(err => {
      console.error('Error al eliminar mascota:', err);
      alert('Error de conexión al eliminar.');
    });
}
