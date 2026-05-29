/**
 * WAU Piura - Scripts Dinámicos e Interactivos
 * Conectado con el Backend PHP + MySQL de forma robusta vía fetch (AJAX).
 */

document.addEventListener('DOMContentLoaded', () => {
  initNavbarAuth();
  initCatalog();
  initTracking();
  initAuthForms();
  initScrollAnimations();
  initScrollTopButton();
});

// ==========================================
// 1. CONTROL DE AUTENTICACIÓN Y NAVBAR
// ==========================================
function initNavbarAuth() {
  const navAuth = document.querySelector('.nav-auth');
  if (!navAuth) return;

  // Consultar sesión activa en me.php
  fetch('../backend/api/me.php')
    .then(res => res.json())
    .then(data => {
      if (data.ok && data.usuario) {
        // Usuario logueado: Reemplazar botones de login/registro
        navAuth.innerHTML = `
          <div style="display: flex; align-items: center; gap: 1.2rem;">
            <span style="font-weight: 700; color: var(--azul-oscuro); font-size: 0.95rem;">
              👤 Hola, <strong>${escapeHTML(data.usuario.nombre)}</strong>
            </span>
            <a href="#" class="btn-secondary btn-logout" style="padding: 0.5rem 1rem; border-radius: 50px; font-size: 0.85rem; font-weight: 800;">
              Cerrar Sesión
            </a>
          </div>
        `;

        // Evento de cierre de sesión
        const btnLogout = navAuth.querySelector('.btn-logout');
        btnLogout.addEventListener('click', (e) => {
          e.preventDefault();
          fetch('../backend/api/logout.php')
            .then(res => res.json())
            .then(logoutData => {
              if (logoutData.ok) {
                window.location.href = 'index.html';
              }
            });
        });
      }
    })
    .catch(err => console.error("Error al consultar sesión:", err));
}

// ==========================================
// 2. CATÁLOGO DINÁMICO (catalogo.html)
// ==========================================
function initCatalog() {
  const petGrid = document.querySelector('.pet-grid');
  if (!petGrid) return; // No estamos en la página del catálogo

  const searchInput = document.getElementById('pet-search');
  const visibleCountEl = document.getElementById('visible-count');
  const noResultsEl = document.getElementById('no-results');
  const filterBtns = document.querySelectorAll('.filter-btn');

  let allPets = [];
  let currentFilter = 'todos';
  let searchTerm = '';

  // 2.1 Fetch de las mascotas desde backend/api/mascotas.php
  fetch('../backend/api/mascotas.php')
    .then(res => {
      // Leer primero como texto plano para validar si es JSON válido
      return res.text().then(text => {
        try {
          const parsed = JSON.parse(text);
          if (!res.ok) {
            throw new Error(parsed.message || `HTTP error! status: ${res.status}`);
          }
          return parsed;
        } catch (jsonErr) {
          // Si JSON.parse falla, registramos el texto crudo recibido en consola
          console.error("Error de análisis JSON en el frontend. Texto crudo recibido del servidor:", text);
          throw new Error("La respuesta del servidor no es un JSON válido. Revisa la consola para más detalles.");
        }
      });
    })
    .then(data => {
      if (data.success && Array.isArray(data.data)) {
        allPets = data.data;
        renderCatalog();
        updateCounters();
      } else {
        throw new Error(data.message || "Respuesta del servidor no exitosa");
      }
    })
    .catch(err => {
      console.error("Error detallado al cargar las mascotas desde la base de datos:", err);
      if (visibleCountEl) visibleCountEl.textContent = '0';
      
      // Mostrar mensaje de error amigable en la pantalla
      petGrid.innerHTML = `
        <div class="no-results" style="grid-column: 1/-1; padding: 3rem 2rem; border: 2px dashed #FECDCA; background: #FEF3F2; border-radius: 16px; text-align: center;">
          <h3 style="color: #B42318; margin-bottom: 0.8rem; font-weight: 800; font-size: 1.3rem;">
            🐾 Error al cargar las mascotas del refugio
          </h3>
          <p style="color: #667085; font-size: 0.95rem; line-height: 1.6; max-width: 650px; margin: 0 auto; font-weight: 500;">
            No se pudieron cargar las mascotas. Verifica que estés abriendo el proyecto desde Apache/Laragon/XAMPP usando <code style="background: #FFE4E6; padding: 0.2rem 0.4rem; border-radius: 4px; color: #9F1239; font-size: 0.85rem; font-family: monospace;">http://localhost</code> y no directamente como archivo.
          </p>
          <small style="display: block; margin-top: 1rem; color: #98A2B3; font-style: italic;">
            Detalle técnico del error: ${escapeHTML(err.message)}
          </small>
        </div>
      `;
    });

  // 2.2 Renderizado dinámico de tarjetas
  const renderCatalog = () => {
    petGrid.innerHTML = '';
    let visibleCards = 0;

    allPets.forEach(pet => {
      // Filtrar localmente
      const matchesFilter = (currentFilter === 'todos') || (pet.estado === currentFilter);
      const textToSearch = `${pet.nombre} ${pet.raza} ${pet.especie} ${pet.descripcion} ${pet.condicion}`.toLowerCase();
      const matchesSearch = textToSearch.includes(searchTerm);

      if (matchesFilter && matchesSearch) {
        visibleCards++;

        // Crear tarjeta
        const card = document.createElement('article');
        card.className = 'pet-card';
        card.setAttribute('data-status', pet.estado);

        // Icono según especie
        const petEmoji = pet.especie === 'perro' ? '🐶' : (pet.especie === 'gato' ? '🐱' : '🐾');
        const bgClass = pet.especie === 'perro' ? 'pet-dog' : 'pet-cat';

        card.innerHTML = `
          <div class="pet-image ${bgClass}">
            ${pet.foto_url ? `<img src="${escapeHTML(pet.foto_url)}" alt="${escapeHTML(pet.nombre)}" style="width:100%; height:100%; object-fit:cover;">` : petEmoji}
          </div>
          <div class="pet-content">
            <div class="pet-header">
              <h3>${escapeHTML(pet.nombre)}</h3>
              <span class="status-badge ${getStatusBadgeClass(pet.estado)}">${getStatusText(pet.estado)}</span>
            </div>
            <p class="pet-meta">${escapeHTML(pet.raza)} · ${pet.edad_meses} meses · ${pet.genero === 'macho' ? 'Macho' : 'Hembra'}</p>
            <p style="color: #64748B; font-size: 0.95rem; line-height: 1.5; margin-bottom: 1rem;">
              ${escapeHTML(pet.descripcion)}
            </p>
            <ul class="pet-details">
              <li><strong>Condición:</strong> ${escapeHTML(pet.condicion || 'Saludable')}</li>
              <li><strong>Responsable:</strong> ${escapeHTML(pet.responsable || 'Equipo WauPiura')}</li>
              <li><strong>Rescatado en:</strong> ${escapeHTML(pet.lugar_rescate || 'Región Piura')}</li>
            </ul>
            <div class="pet-actions">
              <a href="seguimiento.html?id=${pet.id}" class="btn-primary">Ver seguimiento</a>
              ${pet.estado === 'disponible' 
                ? `<button class="btn-secondary btn-adopt-trigger" data-id="${pet.id}" data-name="${escapeHTML(pet.nombre)}">Adoptar</button>`
                : `<button class="btn-secondary btn-help-trigger" data-id="${pet.id}" data-name="${escapeHTML(pet.nombre)}">Quiero ayudar</button>`
              }
            </div>
          </div>
        `;
        petGrid.appendChild(card);
      }
    });

    if (visibleCountEl) visibleCountEl.textContent = visibleCards;
    if (noResultsEl) {
      noResultsEl.style.display = (visibleCards === 0) ? 'block' : 'none';
    }

    // Volver a activar los eventos de interacción (Adopciones)
    initAdoptionTriggers();
  };

  // 2.3 Actualización de contadores del Toolbar
  const updateCounters = () => {
    const counts = {
      todos: allPets.length,
      evaluacion: 0,
      tratamiento: 0,
      recuperacion: 0,
      disponible: 0
    };

    allPets.forEach(pet => {
      if (counts[pet.estado] !== undefined) {
        counts[pet.estado]++;
      }
    });

    Object.keys(counts).forEach(key => {
      const el = document.getElementById(`count-${key}`);
      if (el) el.textContent = counts[key];
    });
  };

  // 2.4 Eventos de filtros
  filterBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      filterBtns.forEach(b => b.classList.remove('active-filter'));
      btn.classList.add('active-filter');
      currentFilter = btn.getAttribute('data-filter');
      renderCatalog();
    });
  });

  // 2.5 Evento de búsqueda
  if (searchInput) {
    searchInput.addEventListener('input', (e) => {
      searchTerm = e.target.value.toLowerCase();
      renderCatalog();
    });
  }

  // 2.6 Formulario de Reporte de Mascotas
  const reportForm = document.querySelector('.report-form');
  if (reportForm) {
    reportForm.addEventListener('submit', (e) => {
      e.preventDefault();

      // Primero, validar si el usuario está logueado en la sesión
      fetch('../backend/api/me.php')
        .then(res => res.json())
        .then(sessionData => {
          if (!sessionData.ok || !sessionData.usuario) {
            if (confirm("Debes iniciar sesión para reportar una mascota.\n\n¿Deseas iniciar sesión ahora?")) {
              window.location.href = 'iniciar-sesion.html';
            }
            return;
          }

          // Si hay sesión activa, proceder con el envío
          const nombreInput = document.getElementById('report-nombre');
          const especieSelect = document.getElementById('report-especie');
          const generoSelect = document.getElementById('report-genero');
          const razaInput = document.getElementById('report-raza');
          const edadInput = document.getElementById('report-edad');
          const lugarInput = document.getElementById('report-lugar');
          const estadoSelect = document.getElementById('report-estado');
          const condicionInput = document.getElementById('report-condicion');
          const fotoInput = document.getElementById('report-foto');
          const descTextarea = document.getElementById('report-descripcion');

          const requiredFields = [nombreInput, especieSelect, generoSelect, lugarInput, estadoSelect, condicionInput, descTextarea];
          let isValid = true;
          
          requiredFields.forEach(field => {
            if (field) field.classList.remove('input-error');
          });

          requiredFields.forEach(field => {
            if (field && !field.value.trim()) {
              isValid = false;
              field.classList.add('input-error');
            }
          });

          if (!isValid) {
            alert("Por favor, completa los campos requeridos marcados en rojo.");
            return;
          }

          // Preparar payload para insertar, usando los campos del formulario
          const payload = {
            nombre: nombreInput.value.trim(),
            especie: especieSelect.value.toLowerCase(),
            genero: generoSelect.value.toLowerCase(),
            raza: razaInput.value.trim() || 'Mestizo',
            edad_meses: edadInput.value ? parseInt(edadInput.value) : 0,
            descripcion: descTextarea.value.trim(),
            condicion: condicionInput.value.trim(),
            lugar_rescate: lugarInput.value.trim(),
            foto_url: fotoInput.value.trim() || '', // Dejar en blanco si está vacío para que el backend use el fallback
            estado: estadoSelect.value.toLowerCase()
          };

          // Realizar la petición POST a backend/api/mascotas.php
          fetch('../backend/api/mascotas.php', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
          })
          .then(res => res.json())
          .then(result => {
            if (result.success) {
              alert(`¡Caso registrado exitosamente! La mascota ha sido ingresada en el sistema. ID: ${result.mascota_id}`);
              reportForm.reset();
              window.location.reload();
            } else {
              alert("Error al registrar: " + result.message);
            }
          })
          .catch(err => {
            console.error("Error al reportar mascota:", err);
            alert("Ocurrió un error en la conexión al reportar la mascota.");
          });
        })
        .catch(err => {
          console.error("Error al validar sesión:", err);
          alert("No se pudo verificar tu sesión. Por favor, inicia sesión e inténtalo de nuevo.");
        });
    });
  }
}

// Helper de clases de insignias
function getStatusBadgeClass(status) {
  switch(status) {
    case 'evaluacion': return 'status-review';
    case 'tratamiento': return 'status-treatment';
    case 'recuperacion': return 'status-recovery';
    case 'disponible': return 'status-available';
    default: return 'status-review';
  }
}

function getStatusText(status) {
  switch(status) {
    case 'evaluacion': return 'En evaluación';
    case 'tratamiento': return 'En tratamiento';
    case 'recuperacion': return 'En recuperación';
    case 'disponible': return 'Disponible';
    default: return status;
  }
}

// ==========================================
// 3. INTERACCIÓN DE SOLICITUD DE ADOPCIÓN
// ==========================================
function initAdoptionTriggers() {
  // Disparar solicitudes de adopción
  const adoptBtns = document.querySelectorAll('.btn-adopt-trigger');
  adoptBtns.forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      const petId = btn.getAttribute('data-id');
      const petName = btn.getAttribute('data-name');
      processAdoptionRequest(petId, petName, "Adopción");
    });
  });

  const helpBtns = document.querySelectorAll('.btn-help-trigger');
  helpBtns.forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      const petId = btn.getAttribute('data-id');
      const petName = btn.getAttribute('data-name');
      processAdoptionRequest(petId, petName, "Apoyo/Hogar temporal");
    });
  });
}

function processAdoptionRequest(petId, petName, tipo) {
  // Primero validar sesión activa
  fetch('../backend/api/me.php')
    .then(res => res.json())
    .then(data => {
      if (!data.ok || !data.usuario) {
        alert("Debes iniciar sesión para solicitar una adopción.");
        window.location.href = 'iniciar-sesion.html';
        return;
      }

      // Si el modal está disponible en el HTML actual (catalogo.html)
      const adoptionModal = document.getElementById('adoption-modal');
      if (adoptionModal) {
        // Rellenar datos en el modal
        document.getElementById('modal-pet-name').textContent = petName;
        document.getElementById('modal-pet-id').value = petId;
        document.getElementById('modal-message').value = '';
        
        // Mostrar modal
        adoptionModal.style.display = 'flex';

        // Manejar cierre del modal con el botón de Cancelar
        const cancelBtn = document.getElementById('modal-cancel-btn');
        cancelBtn.onclick = () => {
          adoptionModal.style.display = 'none';
        };

        // Cerrar modal al dar clic fuera del contenido
        adoptionModal.onclick = (e) => {
          if (e.target === adoptionModal) {
            adoptionModal.style.display = 'none';
          }
        };

        // Manejar submit del formulario de adopción del modal
        const modalForm = document.getElementById('modal-adoption-form');
        modalForm.onsubmit = (e) => {
          e.preventDefault();
          const mensajeText = document.getElementById('modal-message').value.trim();

          if (!mensajeText) {
            alert("El mensaje de motivación no puede estar vacío.");
            return;
          }

          // Enviar solicitud a backend/api/solicitudes.php
          fetch('../backend/api/solicitudes.php', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              mascota_id: parseInt(petId),
              mensaje: mensajeText
            })
          })
          .then(res => res.json())
          .then(result => {
            if (result.success) {
              alert(`¡Excelente! Solicitud de adopción enviada con éxito para ${result.mascota_nombre}. Nuestro equipo revisará tu perfil.`);
              adoptionModal.style.display = 'none';
            } else {
              alert("No se pudo enviar la solicitud: " + result.message);
            }
          })
          .catch(err => {
            console.error("Error al procesar solicitud:", err);
            alert("Ocurrió un error en la conexión al enviar la solicitud.");
          });
        };
      } else {
        // Fallback por si se llama desde otra vista donde no exista el modal (ej: seguimiento.html)
        const mensaje = prompt(`Escribe un breve mensaje explicando por qué deseas postular para ${petName}:`, `Hola, me gustaría mucho poder brindar un hogar responsable a ${petName} y ser de apoyo.`);
        
        if (mensaje === null) return; // Canceló
        if (!mensaje.trim()) {
          alert("El mensaje no puede estar vacío.");
          return;
        }

        fetch('../backend/api/solicitudes.php', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            mascota_id: parseInt(petId),
            mensaje: mensaje.trim()
          })
        })
        .then(res => res.json())
        .then(result => {
          if (result.success) {
            alert(`¡Excelente! Solicitud de adopción enviada con éxito para ${result.mascota_nombre}. Nuestro equipo revisará tu perfil.`);
          } else {
            alert("No se pudo enviar la solicitud: " + result.message);
          }
        })
        .catch(err => {
          console.error("Error al procesar solicitud:", err);
          alert("Ocurrió un error en la conexión al enviar la solicitud.");
        });
      }
    });
}

// ==========================================
// 4. MÓDULO DE SEGUIMIENTO DINÁMICO (seguimiento.html)
// ==========================================
function initTracking() {
  const stepper = document.querySelector('.progress-stepper');
  if (!stepper) return; // No estamos en la página de seguimiento

  const urlParams = new URLSearchParams(window.location.search);
  const petId = urlParams.get('id');

  if (!petId) {
    alert("ID de mascota no especificado. Redirigiendo al catálogo.");
    window.location.href = 'catalogo.html';
    return;
  }

  const petAvatar = document.querySelector('.pet-avatar');
  const petNameEl = document.querySelector('.tracking-summary h2');
  const petMetaEl = document.querySelector('.tracking-summary p');
  const badgeContainer = document.querySelector('.tracking-summary');
  
  const generalList = document.querySelector('.info-card:nth-of-type(1) .info-list');
  const healthList = document.querySelector('.info-card:nth-of-type(2) .info-list');
  const timelineContainer = document.querySelector('.timeline');
  const notesContainer = document.querySelector('.notes-card p');

  // Fetch a backend/api/seguimiento.php?id=X
  fetch(`../backend/api/seguimiento.php?id=${petId}`)
    .then(res => res.json())
    .then(data => {
      if (!data.ok) {
        alert("Error: " + data.error);
        window.location.href = 'catalogo.html';
        return;
      }

      const pet = data.mascota;
      const history = data.seguimientos;

      // 4.1 Actualizar Tarjeta Resumen
      if (petAvatar) {
        petAvatar.textContent = pet.especie === 'perro' ? '🐶' : '🐱';
        petAvatar.className = `pet-avatar ${pet.especie === 'perro' ? 'pet-dog' : 'pet-cat'}`;
        if (pet.foto_url) {
          petAvatar.innerHTML = `<img src="${escapeHTML(pet.foto_url)}" alt="${escapeHTML(pet.nombre)}" style="width:100%; height:100%; border-radius:50%; object-fit:cover;">`;
        }
      }
      if (petNameEl) petNameEl.textContent = pet.nombre;
      if (petMetaEl) {
        petMetaEl.textContent = `${escapeHTML(pet.raza)} · ${pet.genero === 'macho' ? 'Macho' : 'Hembra'} · ${pet.edad_meses} meses aprox.`;
      }

      // Agregar Distintivo de Estado
      const oldBadge = badgeContainer.querySelector('.status-badge');
      if (oldBadge) oldBadge.remove();
      const badge = document.createElement('span');
      badge.className = `status-badge ${getStatusBadgeClass(pet.estado)}`;
      badge.textContent = getStatusText(pet.estado);
      badgeContainer.appendChild(badge);

      // 4.2 Actualizar Datos Generales
      if (generalList) {
        generalList.innerHTML = `
          <li><strong>Fecha de Registro:</strong> ${formatDate(pet.creado_en)}</li>
          <li><strong>Lugar de Rescate:</strong> ${escapeHTML(pet.lugar_rescate || 'Región Piura')}</li>
          <li><strong>Responsable:</strong> ${escapeHTML(pet.responsable || 'Equipo WauPiura')}</li>
          <li><strong>Estado Actual:</strong> ${getStatusText(pet.estado)}</li>
          <li><strong>Última Actualización:</strong> ${formatDate(pet.ultima_actualizacion)}</li>
        `;
      }

      // 4.3 Actualizar Condición de Salud
      if (healthList) {
        healthList.innerHTML = `
          <li><strong>Diagnóstico de Entrada:</strong> ${escapeHTML(pet.condicion || 'En evaluación inicial')}</li>
          <li><strong>Esterilización:</strong> Conforme con protocolo</li>
          <li><strong>Vacunas:</strong> Registradas en expediente</li>
          <li><strong>Control de conducta:</strong> Apto para convivencia familiar</li>
        `;
      }

      // 4.4 Actualizar Observaciones
      if (notesContainer) {
        notesContainer.textContent = pet.descripcion || "No se registran notas complejas adicionales para esta mascota.";
      }

      // 4.5 Actualizar Stepper de Progreso
      updateStepper(pet.estado);

      // 4.6 Renderizar Línea de Tiempo de Hitos (Tabla seguimientos)
      if (timelineContainer) {
        timelineContainer.innerHTML = '';
        if (history.length === 0) {
          timelineContainer.innerHTML = `
            <div class="timeline-item active">
              <span class="timeline-dot"></span>
              <div>
                <h4>Ingreso al Refugio</h4>
                <p>Se inicializó el caso en base de datos. Pendiente de hitos clínicos adicionales.</p>
                <small>${formatDate(pet.creado_en)}</small>
              </div>
            </div>
          `;
        } else {
          history.forEach((h, index) => {
            const hCard = document.createElement('div');
            // El primer elemento (más reciente) se marca como activo, los demás completados
            const statusClass = index === 0 ? 'active' : 'completed';
            hCard.className = `timeline-item ${statusClass}`;
            hCard.innerHTML = `
              <span class="timeline-dot"></span>
              <div>
                <h4>${escapeHTML(h.titulo)}</h4>
                <p>${escapeHTML(h.descripcion)}</p>
                <span class="status-badge ${getStatusBadgeClass(h.estado)}" style="font-size:0.7rem; padding:0.1rem 0.5rem; margin-top:0.25rem;">
                  ${getStatusText(h.estado)}
                </span>
                <br>
                <small>${formatDate(h.fecha)}</small>
              </div>
            `;
            timelineContainer.appendChild(hCard);
          });
        }
      }
    })
    .catch(err => {
      console.error("Error al cargar seguimiento:", err);
      alert("Error al cargar el seguimiento clínico.");
    });
}

function updateStepper(estado) {
  const steps = ['evaluacion', 'tratamiento', 'recuperacion', 'disponible'];
  const stepElements = {
    evaluacion: document.querySelector('.progress-stepper .step:nth-of-type(1)'),
    line1: document.querySelector('.progress-stepper .step-line:nth-of-type(2)'),
    tratamiento: document.querySelector('.progress-stepper .step:nth-of-type(3)'),
    line2: document.querySelector('.progress-stepper .step-line:nth-of-type(4)'),
    recuperacion: document.querySelector('.progress-stepper .step:nth-of-type(5)'),
    line3: document.querySelector('.progress-stepper .step-line:nth-of-type(6)'),
    disponible: document.querySelector('.progress-stepper .step:nth-of-type(7)')
  };

  if (!stepElements.evaluacion) return; // No existen o difieren

  // Limpiar estados previos
  Object.keys(stepElements).forEach(k => {
    if (stepElements[k]) {
      stepElements[k].classList.remove('completed', 'active');
    }
  });

  const currentIndex = steps.indexOf(estado);

  // Paso 1: Rescate / Evaluación
  if (currentIndex >= 0) {
    stepElements.evaluacion.classList.add('completed');
  }
  // Línea 1 y Tratamiento
  if (currentIndex >= 1) {
    if (stepElements.line1) stepElements.line1.classList.add('completed');
    stepElements.tratamiento.classList.add(currentIndex === 1 ? 'active' : 'completed');
  }
  // Línea 2 y Recuperación
  if (currentIndex >= 2) {
    if (stepElements.line2) stepElements.line2.classList.add('completed');
    stepElements.recuperacion.classList.add(currentIndex === 2 ? 'active' : 'completed');
  }
  // Línea 3 y Disponible
  if (currentIndex >= 3) {
    if (stepElements.line3) stepElements.line3.classList.add('completed');
    stepElements.disponible.classList.add('active');
  }

  // Marcar el paso actual como "active" si no es "disponible" (que ya lo es arriba)
  if (currentIndex < 3 && currentIndex >= 0) {
    const activeStep = steps[currentIndex];
    if (stepElements[activeStep]) {
      stepElements[activeStep].classList.remove('completed');
      stepElements[activeStep].classList.add('active');
    }
  }
}

// ==========================================
// 5. VALIDACIÓN Y ENVÍO DE AUTENTICACIÓN (AJAX)
// ==========================================
function initAuthForms() {
  // Formulario Login
  const loginForm = document.querySelector('.auth-form');
  if (loginForm && window.location.pathname.includes('iniciar-sesion')) {
    loginForm.addEventListener('submit', (e) => {
      e.preventDefault();
      
      const emailInput = loginForm.querySelector('input[type="email"]');
      const passInput = loginForm.querySelector('input[type="password"]');

      if (!emailInput.value.trim() || !passInput.value) {
        alert("Completa todos los campos.");
        return;
      }

      fetch('../backend/api/login.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          correo: emailInput.value.trim(),
          contrasena: passInput.value
        })
      })
      .then(res => res.json())
      .then(data => {
        if (data.ok) {
          alert(`¡Ingreso correcto! Bienvenido(a) ${data.usuario.nombre}.`);
          window.location.href = 'index.html';
        } else {
          alert("Error: " + data.error);
        }
      })
      .catch(err => console.error("Error al ingresar:", err));
    });
  }

  // Formulario Registro
  const registerForm = document.querySelector('.auth-form');
  if (registerForm && window.location.pathname.includes('registro')) {
    registerForm.addEventListener('submit', (e) => {
      e.preventDefault();
      
      const nameInput = registerForm.querySelector('input[placeholder*="Nombre"]');
      const emailInput = registerForm.querySelector('input[placeholder*="Correo"]');
      const passInput = registerForm.querySelector('input[placeholder*="Contraseña"]');

      if (!nameInput.value.trim() || !emailInput.value.trim() || !passInput.value) {
        alert("Completa todos los campos.");
        return;
      }

      fetch('../backend/api/register.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nombre: nameInput.value.trim(),
          correo: emailInput.value.trim(),
          contrasena: passInput.value
        })
      })
      .then(res => res.json())
      .then(data => {
        if (data.ok) {
          alert(`¡Cuenta creada con éxito! Bienvenido(a) ${data.usuario.nombre}.`);
          window.location.href = 'index.html';
        } else {
          alert("Error: " + data.error);
        }
      })
      .catch(err => console.error("Error al registrarse:", err));
    });
  }
}

// ==========================================
// 6. EFECTOS E INTERFACES DE SCROLL
// ==========================================
function initScrollAnimations() {
  const observerOptions = {
    root: null,
    rootMargin: '0px',
    threshold: 0.1
  };

  const observer = new IntersectionObserver((entries, observer) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('is-visible');
        observer.unobserve(entry.target);
      }
    });
  }, observerOptions);

  const animateElements = document.querySelectorAll('.workflow-step, .support-card, .testimonial-card, .pet-card, .tracking-summary, .timeline-card, .info-card, .notes-card, .urgent-card');
  
  animateElements.forEach((el, index) => {
    el.classList.add('fade-in-section');
    el.style.transitionDelay = `${(index % 3) * 0.1}s`;
    observer.observe(el);
  });
}

function initScrollTopButton() {
  const scrollTopBtn = document.createElement('button');
  scrollTopBtn.innerHTML = '↑';
  scrollTopBtn.className = 'scroll-top-btn';
  scrollTopBtn.setAttribute('aria-label', 'Volver arriba');
  document.body.appendChild(scrollTopBtn);

  window.addEventListener('scroll', () => {
    if (window.scrollY > 300) {
      scrollTopBtn.classList.add('visible');
    } else {
      scrollTopBtn.classList.remove('visible');
    }
  });

  scrollTopBtn.addEventListener('click', () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });
}

// ==========================================
// UTILERÍAS COMPLEMENTARIAS
// ==========================================
function escapeHTML(str) {
  if (!str) return '';
  return str.replace(/[&<>'"]/g, 
    tag => ({
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      "'": '&#39;',
      '"': '&quot;'
    }[tag] || tag)
  );
}

function formatDate(dateStr) {
  if (!dateStr) return 'No registrada';
  try {
    const parts = dateStr.split(' ')[0].split('-');
    if (parts.length === 3) {
      return `${parts[2]}/${parts[1]}/${parts[0]}`;
    }
    return dateStr;
  } catch(e) {
    return dateStr;
  }
}
