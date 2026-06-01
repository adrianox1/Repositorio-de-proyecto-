/**
 * WAU Piura - Catálogo de Mascotas, Reportes e Interacción
 * Específico para catalogo.html.
 */

document.addEventListener('DOMContentLoaded', () => {
  initCatalog();
});

// ==========================================
// 1. CATÁLOGO DINÁMICO
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

  // 1.1 Fetch de las mascotas desde backend/api/mascotas.php
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
            No se pudieron cargar las mascotas. Verifica que el servidor PHP y MySQL estén activos.
          </p>
          <small style="display: block; margin-top: 1rem; color: #98A2B3; font-style: italic;">
            Detalle técnico del error: ${escapeHTML(err.message)}
          </small>
        </div>
      `;
    });

  // 1.2 Renderizado dinámico de tarjetas
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

  // 1.3 Actualización de contadores del Toolbar
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

  // 1.4 Eventos de filtros
  filterBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      filterBtns.forEach(b => b.classList.remove('active-filter'));
      btn.classList.add('active-filter');
      currentFilter = btn.getAttribute('data-filter');
      renderCatalog();
    });
  });

  // 1.5 Evento de búsqueda
  if (searchInput) {
    searchInput.addEventListener('input', (e) => {
      searchTerm = e.target.value.toLowerCase();
      renderCatalog();
    });
  }

  // 1.6 Formulario de Reporte de Mascotas (Convalidación de sesión proactiva y panel bloqueado)
  const reportCard = document.querySelector('.report-card');
  const reportForm = document.querySelector('.report-form');
  
  if (reportCard && reportForm) {
    // Consultar sesión activa de forma proactiva
    fetch('../backend/api/me.php')
      .then(res => res.json())
      .then(sessionData => {
        if (!sessionData.ok || !sessionData.usuario) {
          // Reemplazar el formulario por un panel premium de bloqueo
          reportCard.innerHTML = `
            <div style="text-align: center; padding: 3rem 1.5rem;">
              <span style="font-size: 4rem; display: block; margin-bottom: 1.5rem;">🔒</span>
              <h2 style="color: var(--azul-oscuro); margin-bottom: 1rem; font-weight: 800;">Debes iniciar sesión para reportar una mascota</h2>
              <p style="color: #64748B; font-size: 1.05rem; line-height: 1.6; max-width: 500px; margin: 0 auto 2.5rem; font-weight: 500;">
                Para garantizar la seriedad de los reportes y permitirte hacer seguimiento de tus casos rescatados, es necesario que accedas a tu cuenta.
              </p>
              <a href="iniciar-sesion.html" class="btn-primary" style="display: inline-block; padding: 1rem 2.5rem; font-size: 1.05rem; border-radius: 50px; font-weight: 800; text-decoration: none; box-shadow: 0 10px 15px -3px rgba(119,201,167,0.3);">
                Iniciar sesión
              </a>
            </div>
          `;
          return;
        }

        // Si hay sesión activa, habilitar el listener de submit del formulario
        reportForm.addEventListener('submit', (e) => {
          e.preventDefault();

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

          const nombre = nombreInput ? nombreInput.value.trim() : '';
          const especie = especieSelect ? especieSelect.value.trim().toLowerCase() : '';
          const genero = generoSelect ? generoSelect.value.trim().toLowerCase() : '';
          const lugar = lugarInput ? lugarInput.value.trim() : '';
          const estado = estadoSelect ? estadoSelect.value.trim().toLowerCase() : '';
          const condicion = condicionInput ? condicionInput.value.trim() : '';
          const descripcion = descTextarea ? descTextarea.value.trim() : '';

          // Campos obligatorios: nombre, especie, genero, lugar, estado, condicion, descripcion
          if (!nombre || !especie || !genero || !lugar || !estado || !condicion || !descripcion) {
            alert("Completa los campos obligatorios.");
            
            // Marcar en rojo los campos vacíos de forma visual
            const requiredInputs = [
              { el: nombreInput, val: nombre },
              { el: especieSelect, val: especie },
              { el: generoSelect, val: genero },
              { el: lugarInput, val: lugar },
              { el: estadoSelect, val: estado },
              { el: condicionInput, val: condicion },
              { el: descTextarea, val: descripcion }
            ];
            requiredInputs.forEach(item => {
              if (item.el) {
                if (!item.val) {
                  item.el.classList.add('input-error');
                } else {
                  item.el.classList.remove('input-error');
                }
              }
            });
            return;
          }

          // Limpiar clases de error previas
          const allInputs = [nombreInput, especieSelect, generoSelect, razaInput, edadInput, lugarInput, estadoSelect, condicionInput, fotoInput, descTextarea];
          allInputs.forEach(el => el && el.classList.remove('input-error'));

          // Preparar payload para insertar
          const payload = {
            nombre: nombre,
            especie: especie,
            genero: genero,
            raza: razaInput ? razaInput.value.trim() : '',
            edad_meses: edadInput && edadInput.value.trim() !== '' ? parseInt(edadInput.value) : '',
            lugar_rescate: lugar,
            estado: estado,
            condicion: condicion,
            foto_url: fotoInput ? fotoInput.value.trim() : '',
            descripcion: descripcion
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
              alert("Mascota registrada correctamente");
              reportForm.reset();
              window.location.reload();
            } else {
              console.error("Error al registrar reporte de mascota:", result.message);
              alert(result.message || "No se pudo registrar el caso. Verifica que hayas iniciado sesión.");
            }
          })
          .catch(err => {
            console.error("Error técnico al reportar mascota:", err);
            alert("No se pudo registrar el caso. Verifica que hayas iniciado sesión.");
          });
        });
      })
      .catch(err => {
        console.error("Error al validar sesión proactivamente:", err);
      });
  }
}

// ==========================================
// 2. INTERACCIÓN DE SOLICITUD DE ADOPCIÓN (MODAL)
// ==========================================
function initAdoptionTriggers() {
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
        // Fallback por si se llama desde otra vista donde no exista el modal
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
