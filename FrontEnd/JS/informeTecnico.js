let reporteSeleccionado = null;
let perfilUsuario = null;
let tecnicoActual = null;

document.addEventListener("DOMContentLoaded", async () => {
  const volverBtn = document.querySelector('[data-action="volver"]');
  const toggleBtn = document.getElementById('toggleSearch');
  const dropdown = document.getElementById('searchDropdown');

  if (volverBtn) {
    volverBtn.addEventListener("click", () => {
      if (perfilUsuario && perfilUsuario.perf_tipo === 1) {
        window.location.href = "/tecnicos";
      } else {
        window.location.href = "/main";
      }
    });
  }

  if (toggleBtn && dropdown) {
    toggleBtn.addEventListener('click', () => {
      dropdown.classList.toggle('show');
    });
  }

  // Obtener perfil del usuario actual
  await obtenerPerfilUsuario();

  // Cargar informe automáticamente
  await cargarInforme();
});

async function obtenerPerfilUsuario() {
  try {
    const response = await fetch('/api/usuario-actual');
    const data = await response.json();
    if (data.success) {
      perfilUsuario = data.usuario;

      // Mostrar sección de búsqueda solo para admin
      if (perfilUsuario.perf_tipo === 1) {
        document.getElementById("searchSection").classList.add("show");
      }
    }
  } catch (error) {
  }
}

function mostrarError(mensaje) {
  const errorContainer = document.getElementById("errorContainer");
  errorContainer.textContent = mensaje;
  errorContainer.classList.add("show");

  setTimeout(() => {
    errorContainer.classList.remove("show");
  }, 5000);
}

async function cargarInforme(tecnicoId = null) {
  try {
    let url = '/api/tecnicos/informe';
    if (tecnicoId) {
      url += `?id=${tecnicoId}`;
    }

    const response = await fetch(url);
    const data = await response.json();

    if (!response.ok || !data.success) {
      mostrarError(data.message || 'Error al cargar el informe');
      return;
    }

    tecnicoActual = data.informe;
    mostrarInforme(data.informe);

  } catch (error) {
    mostrarError('Error al cargar el informe del técnico');
  }
}

async function buscarInforme() {
  const tecnicoId = document.getElementById("buscar_id").value.trim();

  if (!tecnicoId) {
    mostrarError('Por favor, ingrese un ID');
    return;
  }

  const regexId = /^[0-9]{1,20}$/;
  if (!regexId.test(tecnicoId)) {
    mostrarError('El ID solo puede contener números');
    return;
  }

  await cargarInforme(tecnicoId);
}

function mostrarInforme(informe) {
  if (!informe || !informe.tecnico) {
    mostrarError('No se encontró información del técnico');
    return;
  }
  // Información del técnico
  const estadoMap = {
    1: 'Activo',
    2: 'Baja',
    3: 'Ausente',
    4: 'Dictamen'
  };

  document.getElementById("nombreTecnico").textContent =
    `${informe.tecnico.usr_nombre} ${informe.tecnico.usr_ap} ${informe.tecnico.usr_am}`;

  document.getElementById("idTecnico").textContent = informe.tecnico.id;
  document.getElementById("correoTecnico").textContent = informe.tecnico.usr_correo;
  document.getElementById("estadoTecnico").textContent = estadoMap[informe.tecnico.est_tipo] || 'Desconocido';

  // Estadísticas
  document.getElementById("statTotal").textContent = informe.estadisticas.total;
  document.getElementById("statPendientes").textContent = informe.estadisticas.pendientes;
  document.getElementById("statEnProceso").textContent = informe.estadisticas.en_proceso;
  document.getElementById("statCompletados").textContent = informe.estadisticas.completados;

  // Lista de reportes
  mostrarListaReportes(informe.reportes);
}

function mostrarListaReportes(reportes) {
  const reportsList = document.getElementById("reportsList");

  if (!reportes || reportes.length === 0) {
    reportsList.innerHTML = '<div class="empty-message">No hay reportes asignados</div>';
    return;
  }

  reportsList.innerHTML = '';

  reportes.forEach(reporte => {
    const item = document.createElement('div');
    item.className = 'report-item';
    item.onclick = (evt) => seleccionarReporte(reporte, evt);

    const estadoClass = `status-${reporte.rep_estado}`;
    const estadoTexto = getEstadoReporte(reporte.rep_estado);

    item.innerHTML = `
      <div class="report-id">Reporte #${reporte.id}</div>
      <div class="report-date">Levantado: ${formatDate(reporte.rep_fecha_lev)}</div>
      <span class="report-status ${estadoClass}">${estadoTexto}</span>
    `;

    reportsList.appendChild(item);
  });
}

function seleccionarReporte(reporte, evt) {
  reporteSeleccionado = reporte;

  // Actualizar selección visual
  document.querySelectorAll('.report-item').forEach(item => {
    item.classList.remove('selected');
  });
  if (evt && evt.currentTarget) {
    evt.currentTarget.classList.add('selected');
  }

  // Mostrar detalle
  mostrarDetalleReporte(reporte);
}

function mostrarDetalleReporte(reporte) {
  const detailCard = document.getElementById("reportDetailCard");

  document.getElementById("detailId").textContent = reporte.id;
  document.getElementById("detailSalon").textContent = reporte.sal_id || 'N/A';
  document.getElementById("detailDispositivo").textContent = reporte.disp_id || 'N/A';
  document.getElementById("detailAlumno").textContent = reporte.al_boleta || 'N/A';
  document.getElementById("detailFechaLev").textContent = formatDate(reporte.rep_fecha_lev);
  document.getElementById("detailFechaAsig").textContent = reporte.rep_fecha_asig_tec ? formatDate(reporte.rep_fecha_asig_tec) : 'No asignado';
  document.getElementById("detailFechaRes").textContent = reporte.rep_fecha_res ? formatDate(reporte.rep_fecha_res) : 'Pendiente';
  document.getElementById("detailEstado").textContent = getEstadoReporte(reporte.rep_estado);
  document.getElementById("detailDescripcion").textContent = reporte.rep_descripcion || 'Sin descripción';
  document.getElementById("detailSolucion").textContent = reporte.rep_solucion || 'Sin solución';

  detailCard.classList.add('show');
}

function getEstadoReporte(estado) {
  const estados = {
    0: 'Sin asignar',
    1: 'Pendiente',
    2: 'Completado'
  };
  return estados[estado] || 'Desconocido';
}

function formatDate(dateString) {
  if (!dateString) return 'N/A';

  const date = new Date(dateString);
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear();
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');

  return `${day}/${month}/${year} ${hours}:${minutes}`;
}

