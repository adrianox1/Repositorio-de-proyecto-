/**
 * WAU Piura - Panel Administrativo de Usuarios
 * Específico para admin.html. Consume la API REST del backend Java (/api).
 */

// Usa el interceptor de sesión global (redirige a login si la sesión expira)
function api(url, options = {}) {
  return apiFetch(url, options);
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
    cargarSolicitudes();
    cargarDonacionesPendientes();
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
        toast('Debes iniciar sesión para acceder al panel administrativo.', 'warning');
        setTimeout(() => { window.location.href = 'iniciar-sesion.html'; }, 1200);
        return false;
      }
      if (data.usuario.rol !== 'ADMIN') {
        toast('Acceso restringido: solo administradores.', 'error');
        setTimeout(() => { window.location.href = 'index.html'; }, 1500);
        return false;
      }
      return true;
    })
    .catch(() => {
      toast('No se pudo verificar la sesión. Inicia sesión nuevamente.', 'error');
      setTimeout(() => { window.location.href = 'iniciar-sesion.html'; }, 1500);
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
        tabla.innerHTML = tablaVacia('🔧', 'No se pudieron cargar los usuarios', 'El servidor devolvió un error. Intenta recargar la página.', 7);
        return;
      }

      const usuarios = data.usuarios || [];
      actualizarEstadisticas(usuarios);

      if (usuarios.length === 0) {
        tabla.innerHTML = tablaVacia('👥', 'Todavía no hay usuarios registrados', 'Los nuevos registros aparecerán aquí automáticamente.', 7);
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
      tabla.innerHTML = tablaVacia('🔌', 'Sin conexión con el servidor', 'Comprueba que el backend esté activo e intenta recargar la página.', 7);
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
  confirmar({
    titulo: `Eliminar a "${nombre}"`,
    mensaje: 'Esta acción no se puede deshacer.',
    textoAceptar: 'Sí, eliminar'
  }).then(ok => {
    if (!ok) return;
    api(`/api/usuarios/${id}`, { method: 'DELETE' })
      .then(res => res.json())
      .then(data => {
        if (data.ok) {
          toast('Usuario eliminado.', 'success');
          cargarUsuarios();
        } else {
          toast(data.error || 'No se pudo eliminar el usuario.', 'error');
        }
      })
      .catch(err => {
        console.error('Error al eliminar usuario:', err);
        toast('No se pudo eliminar. Comprueba tu conexión e inténtalo de nuevo.', 'error');
      });
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

    limpiarValidacion(form);
    const errores = [];
    if (!Validar.requerido(body.nombre)) {
      errores.push({ input: form.nombre, mensaje: 'El nombre es obligatorio.' });
    }
    if (!Validar.requerido(body.email)) {
      errores.push({ input: form.email, mensaje: 'El correo es obligatorio.' });
    } else if (!Validar.email(body.email)) {
      errores.push({ input: form.email, mensaje: 'El correo no tiene un formato válido.' });
    }
    if (!Validar.requerido(body.password)) {
      errores.push({ input: form.password, mensaje: 'La contraseña es obligatoria.' });
    } else if (!Validar.min(body.password, 6)) {
      errores.push({ input: form.password, mensaje: 'La contraseña debe tener al menos 6 caracteres.' });
    }
    if (Validar.requerido(body.telefono) && !Validar.telefono(body.telefono)) {
      errores.push({ input: form.telefono, mensaje: 'El teléfono debe tener entre 6 y 20 dígitos.' });
    }
    if (errores.length > 0) {
      mostrarErrores(form, errores);
      return;
    }

    api('/api/usuarios', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    })
      .then(res => res.json())
      .then(data => {
        if (data.ok) {
          toast('Usuario creado correctamente.', 'success');
          form.reset();
          cargarUsuarios();
        } else {
          toast(data.error || 'No se pudo crear el usuario.', 'error');
        }
      })
      .catch(err => {
        console.error('Error al crear usuario:', err);
        toast('No se pudo crear el usuario. Comprueba tu conexión e inténtalo de nuevo.', 'error');
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
        tabla.innerHTML = tablaVacia('🔧', 'No se pudieron cargar las mascotas', 'El servidor devolvió un error. Intenta recargar la página.', 7);
        return;
      }
      const mascotas = data.mascotas || [];
      if (mascotas.length === 0) {
        tabla.innerHTML = tablaVacia('🐾', 'Aún no hay mascotas registradas', 'Usa el formulario de arriba para añadir la primera mascota en adopción.', 7);
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
      tabla.innerHTML = tablaVacia('🔌', 'Sin conexión con el servidor', 'Comprueba que el backend esté activo e intenta recargar la página.', 7);
    });
}

function initFormularioMascota() {
  const form = document.getElementById('formMascotaAdmin');
  const btnCancelar = document.getElementById('btnCancelarMascota');
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
      estado: fd.get('estado'),
      disponible: fd.get('disponible')
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
          resetFormularioMascota();
          cargarMascotasAdmin();
        } else {
          toast(data.error || 'No se pudo guardar la mascota.', 'error');
        }
      })
      .catch(err => {
        console.error('Error al guardar mascota:', err);
        toast('No se pudieron guardar los cambios. Comprueba tu conexión e inténtalo de nuevo.', 'error');
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
  // Si es ruta de subida interna, ocultarla y guardarla como fallback
  form.fotoUrl.dataset.original = mascota.fotoUrl || '';
  if ((mascota.fotoUrl || '').startsWith('/uploads/')) {
    form.fotoUrl.value = '';
    form.fotoUrl.placeholder = 'La foto actual se mantiene si no subes una nueva';
  } else {
    form.fotoUrl.value = mascota.fotoUrl || '';
  }
  form.estado.value = mascota.estado || 'evaluacion';
  form.disponible.value = mascota.disponible ? 'true' : 'false';
  mostrarPreviewImagen(form.foto, mascota.fotoUrl);

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
          cargarMascotasAdmin();
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

// ==========================================
// 6. SOLICITUDES DE ADOPCIÓN (admin)
// ==========================================
function cargarSolicitudes() {
  const tabla = document.getElementById('tablaSolicitudes');
  if (!tabla) return;

  api('/api/solicitudes')
    .then(res => res.json())
    .then(data => {
      if (!data.ok) {
        tabla.innerHTML = tablaVacia('🔧', 'No se pudieron cargar las solicitudes', 'El servidor devolvió un error. Intenta recargar la página.', 8);
        return;
      }
      const solicitudes = data.solicitudes || [];
      window._todasSolicitudes = solicitudes;
      actualizarStatsSolicitudes(solicitudes);
      initFiltrosSolicitudes();
      renderSolicitudes(solicitudes);
    })
    .catch(err => {
      console.error('Error al cargar solicitudes:', err);
      tabla.innerHTML = tablaVacia('🔌', 'Sin conexión con el servidor', 'Comprueba que el backend esté activo e intenta recargar la página.', 8);
    });
}

function initFiltrosSolicitudes() {
  const btns = document.querySelectorAll('.sol-filtro');
  if (!btns.length) return;

  btns.forEach(btn => {
    btn.onclick = () => {
      btns.forEach(b => {
        b.className = 'sol-filtro';
      });
      const filtro = btn.dataset.filtro;
      btn.classList.add(filtro === 'todas' ? 'activo'
        : filtro === 'pendiente'  ? 'activo-pendiente'
        : filtro === 'aprobada'   ? 'activo-aprobada'
        : 'activo-rechazada');

      const lista = filtro === 'todas'
        ? window._todasSolicitudes
        : (window._todasSolicitudes || []).filter(s => s.estado === filtro);

      renderSolicitudes(lista);
    };
  });
}

function renderSolicitudes(solicitudes) {
  const tabla = document.getElementById('tablaSolicitudes');
  const conteo = document.getElementById('solConteo');
  if (!tabla) return;

  if (conteo) {
    conteo.textContent = solicitudes.length === 1
      ? '1 resultado'
      : `${solicitudes.length} resultados`;
  }

  if (solicitudes.length === 0) {
    tabla.innerHTML = tablaVacia('🔍', 'No hay solicitudes con este filtro', 'Prueba con otro estado o selecciona "Todas".', 8);
    return;
  }

  tabla.innerHTML = '';
  solicitudes.forEach(s => {
    const tel = s.usuario.telefono
      ? `<a href="tel:${escapeHTML(s.usuario.telefono)}">${escapeHTML(s.usuario.telefono)}</a>`
      : '<span style="color:#8a97a6;">Sin teléfono</span>';

    const acciones = s.estado === 'pendiente'
      ? `<button class="btn-secondary btn-aprobar" data-id="${s.id}" style="padding:0.4rem 0.7rem; font-size:0.78rem;">Aprobar</button>
         <button class="btn-delete btn-rechazar" data-id="${s.id}">Rechazar</button>`
      : `<span style="color:#8a97a6; font-size:0.8rem;">Resuelta</span>`;

    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>${s.id}</td>
      <td>${escapeHTML(s.mascota.nombre)}</td>
      <td>${escapeHTML(s.usuario.nombre)}<br><small style="color:#8a97a6;">${escapeHTML(s.usuario.email || '')}</small></td>
      <td>${tel}</td>
      <td style="max-width:240px;">${escapeHTML(s.mensaje)}</td>
      <td><span class="badge badge-${escapeHTML(s.estado)}">${escapeHTML(s.estado)}</span></td>
      <td>${formatDate((s.creadoEn || '').slice(0, 10))}</td>
      <td>${acciones}</td>
    `;
    tabla.appendChild(tr);
  });

  tabla.querySelectorAll('.btn-aprobar').forEach(btn => {
    btn.addEventListener('click', () => cambiarEstadoSolicitud(btn.dataset.id, 'aprobada'));
  });
  tabla.querySelectorAll('.btn-rechazar').forEach(btn => {
    btn.addEventListener('click', () => cambiarEstadoSolicitud(btn.dataset.id, 'rechazada'));
  });
}

function actualizarStatsSolicitudes(solicitudes) {
  document.getElementById('statSolTotal').textContent = solicitudes.length;
  document.getElementById('statSolPendientes').textContent = solicitudes.filter(s => s.estado === 'pendiente').length;
  document.getElementById('statSolAprobadas').textContent = solicitudes.filter(s => s.estado === 'aprobada').length;
}

function cambiarEstadoSolicitud(id, estado) {
  const esAprobar = estado === 'aprobada';
  confirmar({
    titulo: esAprobar ? 'Aprobar solicitud' : 'Rechazar solicitud',
    mensaje: esAprobar
      ? '¿Confirmas que deseas aprobar esta solicitud de adopción?'
      : '¿Confirmas que deseas rechazar esta solicitud de adopción?',
    textoAceptar: esAprobar ? 'Sí, aprobar' : 'Sí, rechazar',
    variante: esAprobar ? 'ok' : 'peligro'
  }).then(ok => {
    if (!ok) return;
    api(`/api/solicitudes/${id}/estado`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ estado: estado })
    })
      .then(res => res.json())
      .then(data => {
        if (data.ok) {
          toast(`Solicitud ${esAprobar ? 'aprobada' : 'rechazada'}.`, 'success');
          cargarSolicitudes();
        } else {
          toast(data.error || 'No se pudo actualizar la solicitud.', 'error');
        }
      })
      .catch(err => {
        console.error('Error al actualizar solicitud:', err);
        toast('No se pudo actualizar el estado. Comprueba tu conexión e inténtalo de nuevo.', 'error');
      });
  });
}
