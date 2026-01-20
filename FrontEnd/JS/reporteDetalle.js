let dispositivos = [];
let inventario = [];
let salones = [];
let areas = [];
let alumnos = [];
let reporteActual = null;

document.addEventListener("DOMContentLoaded", async () => {
  const volverBtn = document.querySelector('[data-action="volver"]');
  const resolverBtn = document.getElementById('btn-resolver');

  if (volverBtn) {
    volverBtn.addEventListener("click", () => {
      const urlParams = new URLSearchParams(window.location.search);
      const from = urlParams.get('from');

      if (from === 'completados') {
        window.location.href = "/reportes-completados";
      } else {
        window.location.href = "/reportes-pendientes";
      }
    });
  }

  if (resolverBtn) {
    resolverBtn.addEventListener("click", resolverReporte);
  }

  // Obtener ID del reporte desde la URL
  const reporteId = obtenerReporteIdDeURL();

  if (!reporteId) {
    mostrarError('ID de reporte no válido');
    return;
  }

  // Cargar datos
  await cargarDetalle(reporteId);
});

function obtenerReporteIdDeURL() {
  const path = window.location.pathname;
  const parts = path.split('/');
  return parts[parts.length - 1];
}

async function cargarDetalle(reporteId) {
  try {
    const [resReporte, resDisp, resInv, resSalon, resArea] = await Promise.all([
      fetch(`/api/reporte-detalle/${reporteId}`),
      fetch('/api/dispositivos'),
      fetch('/api/inventario'),
      fetch('/api/salones'),
      fetch('/api/areas')
    ]);

    const [dataReporte, dataDisp, dataInv, dataSalon, dataArea] = await Promise.all([
      resReporte.json(),
      resDisp.json(),
      resInv.json(),
      resSalon.json(),
      resArea.json()
    ]);

    if (!resReporte.ok || !dataReporte.success) {
      mostrarError('No se pudo cargar el reporte');
      return;
    }

    dispositivos = dataDisp.dispositivos || [];
    inventario = dataInv.inventario || [];
    salones = dataSalon.salones || [];
    areas = dataArea.areas || [];

    reporteActual = dataReporte.reporte;
    mostrarReporte(dataReporte.reporte);
  } catch (err) {
    mostrarError('Error al cargar los detalles');
  }
}

function mostrarError(mensaje) {
  const errorContainer = document.getElementById('error-container');
  const detalleContainer = document.getElementById('detalle-container');

  errorContainer.innerHTML = `<div class="error-message">${mensaje}</div>`;
  detalleContainer.innerHTML = '';
}

function mostrarReporte(reporte) {
  const detalleContainer = document.getElementById('detalle-container');

  // Obtener información relacionada
  const disp = dispositivos.find(d => d.id === reporte.disp_id);
  const inv = disp ? inventario.find(i => i.id === disp.tipo_id) : null;
  const salon = salones.find(s => s.id === reporte.sal_id);
  const area = salon ? areas.find(a => a.id === salon.area_id) : null;

  const nombreDisp = inv?.inv_nombre || 'Desconocido';
  const serialDisp = disp?.disp_serial || 'N/A';
  const nombreSalon = salon?.sal_nombre || `Salón ${reporte.sal_id}`;
  const nombreArea = area?.area_nombre || 'N/A';

  const fechaLev = formatDate(reporte.rep_fecha_lev);
  const fechaAsig = reporte.rep_fecha_asig_tec ? formatDate(reporte.rep_fecha_asig_tec) : 'No asignado';
  const fechaRes = reporte.rep_fecha_res ? formatDate(reporte.rep_fecha_res) : 'No resuelto';

  const estadoTexto = reporte.rep_estado === 1 ? 'Pendiente' :
                      reporte.rep_estado === 2 ? 'Completado' : 'Sin asignar';
  const estadoClase = reporte.rep_estado === 1 ? 'status-pendiente' : 'status-completado';

  let html = `
    <div class="detalle-item">
      <div class="detalle-label">Reporte ID</div>
      <div class="detalle-valor">#${reporte.id}</div>
    </div>

    <div class="detalle-item">
      <div class="detalle-label">Estado</div>
      <div class="detalle-valor">
        <span class="status-badge ${estadoClase}">${estadoTexto}</span>
      </div>
    </div>

    <div class="detalle-item">
      <div class="detalle-label">Dispositivo</div>
      <div class="detalle-valor">${nombreDisp} (${serialDisp})</div>
    </div>

    <div class="detalle-item">
      <div class="detalle-label">Ubicación</div>
      <div class="detalle-valor">${nombreSalon} - ${nombreArea}</div>
    </div>

    <div class="detalle-item">
      <div class="detalle-label">Alumno (Boleta)</div>
      <div class="detalle-valor">${reporte.al_boleta}</div>
    </div>

    <div class="detalle-item">
      <div class="detalle-label">Descripción del Problema</div>
      <div class="detalle-valor">${reporte.rep_descripcion || 'Sin descripción'}</div>
    </div>

    <div class="detalle-item">
      <div class="detalle-label">Fecha de Levantamiento</div>
      <div class="detalle-valor">${fechaLev}</div>
    </div>

    <div class="detalle-item">
      <div class="detalle-label">Fecha de Asignación</div>
      <div class="detalle-valor">${fechaAsig}</div>
    </div>

    <div class="detalle-item">
      <div class="detalle-label">Fecha de Resolución</div>
      <div class="detalle-valor">${fechaRes}</div>
    </div>
  `;

  if (reporte.rep_solucion) {
    html += `
      <div class="detalle-item">
        <div class="detalle-label">Solución Aplicada</div>
        <div class="detalle-valor">${reporte.rep_solucion}</div>
      </div>
    `;
  }

  detalleContainer.innerHTML = html;

  // Mostrar botón de resolver solo si el reporte está pendiente
  const formResolver = document.getElementById('form-resolver');
  const btnResolver = document.getElementById('btn-resolver');

  if (reporte.rep_estado === 1) { // Pendiente
    formResolver.style.display = 'block';
    btnResolver.style.display = 'inline-block';
  } else {
    formResolver.style.display = 'none';
    btnResolver.style.display = 'none';
  }
}

async function resolverReporte() {
  const solucion = document.getElementById('solucion').value.trim();
  const fechaResolucion = document.getElementById('fechaResolucion').value;

  if (!solucion || solucion.length < 10) {
    alert('La solución debe tener al menos 10 caracteres.');
    return;
  }

  if (!fechaResolucion) {
    alert('La fecha de resolución es requerida.');
    return;
  }

  if (!reporteActual || !reporteActual.id) {
    alert('Error: No se pudo identificar el reporte.');
    return;
  }

  if (!confirm('¿Estás seguro de que deseas marcar este reporte como resuelto?')) {
    return;
  }

  try {
    const res = await fetch(`/api/reportes/${reporteActual.id}/resolver`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ solucion, fechaResolucion })
    });

    const data = await res.json();

    if (res.ok && data.success) {
      alert('Reporte resuelto exitosamente');
      window.location.href = '/reportes-pendientes';
    } else {
      alert(data.message || 'Error al resolver el reporte');
    }
  } catch (err) {
    alert('Error de conexión al resolver el reporte');
  }
}

function formatDate(fechaString) {
  const fecha = new Date(fechaString);
  const dia = fecha.getDate().toString().padStart(2, '0');
  const mes = (fecha.getMonth() + 1).toString().padStart(2, '0');
  const año = fecha.getFullYear();
  const horas = fecha.getHours().toString().padStart(2, '0');
  const minutos = fecha.getMinutes().toString().padStart(2, '0');
  return `${dia}/${mes}/${año} ${horas}:${minutos}`;
}

