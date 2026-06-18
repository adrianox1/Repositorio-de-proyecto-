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
    cargarUsuarios();
    initFormularioCrear();
  });
});

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
