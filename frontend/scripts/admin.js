/**
 * WAU Piura - Panel Administrativo de Usuarios
 * Específico para admin.html. Consume la API REST del backend Java (/api).
 */

// fetch con cookies de sesión (funciona en mismo origen y con Live Server + CORS)
function api(url, options = {}) {
  return fetch(url, { credentials: 'include', ...options });
}

document.addEventListener('DOMContentLoaded', () => {
  const tabla = document.getElementById('tablaUsuarios');
  if (!tabla) return; // No estamos en el panel admin

  protegerRuta().then(esAdmin => {
    if (!esAdmin) return;
    initTabs();
    cargarUsuarios();
    initFormularioCrear();
    cargarMascotasAdmin();
    initFormularioMascota();
  });
});

// ==========================================
// 0. PESTAÑAS
// ==========================================
function initTabs() {
  const tabs = document.querySelectorAll('.admin-tab');
  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      tabs.forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      document.querySelectorAll('.tab-panel').forEach(p => p.hidden = true);
      document.getElementById(tab.dataset.tab).hidden = false;
    });
  });
}

// ==========================================
// 1. PROTECCIÓN DE RUTA (solo ADMIN)
// ==========================================
function protegerRuta() {
  return api('/api/me')
    .then(res => res.json())
    .then(data => {
      if (!data.ok || !data.usuario) {
        alert('Debes iniciar sesión para acceder al panel administrativo.');
        window.location.href = 'iniciar-sesion.html';
        return false;
      }
      if (data.usuario.rol !== 'ADMIN') {
        alert('Acceso restringido: solo administradores.');
        window.location.href = 'index.html';
        return false;
      }
      return true;
    })
    .catch(() => {
      alert('No se pudo verificar la sesión. Inicia sesión nuevamente.');
      window.location.href = 'iniciar-sesion.html';
      return false;
    });
}

// ==========================================
// 2. CARGAR Y RENDERIZAR USUARIOS
// ==========================================
function cargarUsuarios() {
  const tabla = document.getElementById('tablaUsuarios');

  api('/api/usuarios')
    .then(res => res.json())
    .then(data => {
      if (!data.ok) {
        tabla.innerHTML = `<tr><td colspan="7" class="table-empty">${escapeHTML(data.error || 'No se pudieron cargar los usuarios.')}</td></tr>`;
        return;
      }

      const usuarios = data.usuarios || [];
      actualizarEstadisticas(usuarios);

      if (usuarios.length === 0) {
        tabla.innerHTML = `<tr><td colspan="7" class="table-empty">No hay usuarios registrados.</td></tr>`;
        return;
      }

      tabla.innerHTML = '';
      usuarios.forEach(u => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
          <td>${u.id}</td>
          <td>${escapeHTML(u.nombre)}</td>
          <td>${escapeHTML(u.email)}</td>
          <td><span class="badge badge-${(u.rol || '').toLowerCase()}">${escapeHTML(u.rol || '')}</span></td>
          <td><span class="badge ${u.activo ? 'badge-activo' : 'badge-inactivo'}">${u.activo ? 'Activo' : 'Inactivo'}</span></td>
          <td>${formatDate((u.fechaRegistro || '').slice(0, 10))}</td>
          <td><button class="btn-delete" data-id="${u.id}" data-nombre="${escapeHTML(u.nombre)}">Eliminar</button></td>
        `;
        tabla.appendChild(tr);
      });

      tabla.querySelectorAll('.btn-delete').forEach(btn => {
        btn.addEventListener('click', () => eliminarUsuario(btn.dataset.id, btn.dataset.nombre));
      });
    })
    .catch(err => {
      console.error('Error al cargar usuarios:', err);
      tabla.innerHTML = `<tr><td colspan="7" class="table-empty">Error de conexión con el servidor.</td></tr>`;
    });
}

function actualizarEstadisticas(usuarios) {
  document.getElementById('statTotal').textContent = usuarios.length;
  document.getElementById('statAdmins').textContent = usuarios.filter(u => u.rol === 'ADMIN').length;
  document.getElementById('statActivos').textContent = usuarios.filter(u => u.activo).length;
}

// ==========================================
// 3. ELIMINAR USUARIO
// ==========================================
function eliminarUsuario(id, nombre) {
  if (!confirm(`¿Seguro que deseas eliminar a "${nombre}"? Esta acción no se puede deshacer.`)) return;

  api(`/api/usuarios/${id}`, { method: 'DELETE' })
    .then(res => res.json())
    .then(data => {
      if (data.ok) {
        cargarUsuarios();
      } else {
        alert(data.error || 'No se pudo eliminar el usuario.');
      }
    })
    .catch(err => {
      console.error('Error al eliminar usuario:', err);
      alert('Error de conexión al eliminar.');
    });
}

// ==========================================
// 4. CREAR USUARIO
// ==========================================
function initFormularioCrear() {
  const form = document.getElementById('formCrear');
  if (!form) return;

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const fd = new FormData(form);
    const body = {
      nombre: fd.get('nombre'),
      email: fd.get('email'),
      password: fd.get('password'),
      telefono: fd.get('telefono'),
      direccion: fd.get('direccion'),
      rol: fd.get('rol')
    };

    api('/api/usuarios', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    })
      .then(res => res.json())
      .then(data => {
        if (data.ok) {
          alert('Usuario creado correctamente.');
          form.reset();
          cargarUsuarios();
        } else {
          alert(data.error || 'No se pudo crear el usuario.');
        }
      })
      .catch(err => {
        console.error('Error al crear usuario:', err);
        alert('Error de conexión al crear el usuario.');
      });
  });
}

// ==========================================
// 5. MASCOTAS (admin: ve y gestiona TODAS)
// ==========================================
function cargarMascotasAdmin() {
  const tabla = document.getElementById('tablaMascotasAdmin');
  if (!tabla) return;

  api('/api/mascotas')
    .then(res => res.json())
    .then(data => {
      if (!data.ok) {
        tabla.innerHTML = `<tr><td colspan="7" class="table-empty">${escapeHTML(data.error || 'No se pudieron cargar las mascotas.')}</td></tr>`;
        return;
      }
      const mascotas = data.mascotas || [];
      if (mascotas.length === 0) {
        tabla.innerHTML = `<tr><td colspan="7" class="table-empty">No hay mascotas registradas.</td></tr>`;
        return;
      }

      window._mascotasAdmin = mascotas;
      tabla.innerHTML = '';
      mascotas.forEach(m => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
          <td>${m.id}</td>
          <td>${escapeHTML(m.nombre)}</td>
          <td>${escapeHTML(m.especie)}</td>
          <td><span class="badge badge-usuario">${escapeHTML(m.estado || '')}</span></td>
          <td>${escapeHTML(m.propietario || 'Sistema')}</td>
          <td>${m.disponible ? 'Sí' : 'No'}</td>
          <td>
            <button class="btn-secondary btn-editar-m" data-id="${m.id}" style="padding:0.4rem 0.8rem; font-size:0.8rem;">Editar</button>
            <button class="btn-delete btn-eliminar-m" data-id="${m.id}" data-nombre="${escapeHTML(m.nombre)}">Eliminar</button>
          </td>
        `;
        tabla.appendChild(tr);
      });

      tabla.querySelectorAll('.btn-editar-m').forEach(btn => {
        btn.addEventListener('click', () => cargarMascotaEnForm(btn.dataset.id));
      });
      tabla.querySelectorAll('.btn-eliminar-m').forEach(btn => {
        btn.addEventListener('click', () => eliminarMascotaAdmin(btn.dataset.id, btn.dataset.nombre));
      });
    })
    .catch(err => {
      console.error('Error al cargar mascotas:', err);
      tabla.innerHTML = `<tr><td colspan="7" class="table-empty">Error de conexión con el servidor.</td></tr>`;
    });
}

function initFormularioMascota() {
  const form = document.getElementById('formMascotaAdmin');
  const btnCancelar = document.getElementById('btnCancelarMascota');
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
      estado: fd.get('estado'),
      disponible: fd.get('disponible')
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
          resetFormularioMascota();
          cargarMascotasAdmin();
        } else {
          alert(data.error || 'No se pudo guardar la mascota.');
        }
      })
      .catch(err => {
        console.error('Error al guardar mascota:', err);
        alert('Error de conexión al guardar.');
      });
  });

  btnCancelar.addEventListener('click', resetFormularioMascota);
}

function cargarMascotaEnForm(id) {
  const mascota = (window._mascotasAdmin || []).find(m => String(m.id) === String(id));
  if (!mascota) return;

  const form = document.getElementById('formMascotaAdmin');
  form.id.value = mascota.id;
  form.nombre.value = mascota.nombre || '';
  form.especie.value = mascota.especie || 'perro';
  form.genero.value = mascota.genero || 'macho';
  form.raza.value = mascota.raza || '';
  form.edadMeses.value = mascota.edadMeses != null ? mascota.edadMeses : '';
  form.lugarRescate.value = mascota.lugarRescate || '';
  form.fotoUrl.value = mascota.fotoUrl || '';
  form.estado.value = mascota.estado || 'evaluacion';
  form.disponible.value = mascota.disponible ? 'true' : 'false';

  document.getElementById('formMascotaTitulo').textContent = `Editando: ${mascota.nombre}`;
  document.getElementById('btnGuardarMascota').textContent = 'Guardar cambios';
  document.getElementById('btnCancelarMascota').style.display = 'inline-block';
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function resetFormularioMascota() {
  const form = document.getElementById('formMascotaAdmin');
  form.reset();
  form.id.value = '';
  document.getElementById('formMascotaTitulo').textContent = 'Registrar nueva mascota';
  document.getElementById('btnGuardarMascota').textContent = 'Registrar mascota';
  document.getElementById('btnCancelarMascota').style.display = 'none';
}

function eliminarMascotaAdmin(id, nombre) {
  if (!confirm(`¿Seguro que deseas eliminar a "${nombre}"?`)) return;

  api(`/api/mascotas/${id}`, { method: 'DELETE' })
    .then(res => res.json())
    .then(data => {
      if (data.ok) {
        cargarMascotasAdmin();
      } else {
        alert(data.error || 'No se pudo eliminar la mascota.');
      }
    })
    .catch(err => {
      console.error('Error al eliminar mascota:', err);
      alert('Error de conexión al eliminar.');
    });
}
