
document.addEventListener("DOMContentLoaded", async () => {
  const volverBtn = document.querySelector('[data-action="volver"]');
  if (volverBtn) {
    volverBtn.addEventListener("click", () => {
      window.location.href = "/main";
    });
  }

  // Cargar reportes reales del alumno
  await cargarReportes();
});

// Estados de reportes
const estadosReportes = {
  0: { estado: 'Sin asignar', clase: 'red' },
  1: { estado: 'Pendiente', clase: 'yellow' },
  2: { estado: 'Completado', clase: 'green' }
};

const filtros = {
  todos: () => true,
  pendientes: (status) => status.classList.contains("red") || status.classList.contains("yellow"),
  resueltos: (status) => status.classList.contains("green"),
};

async function cargarReportes() {
  try {
    const response = await fetch('/api/mis-reportes', {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' }
    });

    const result = await response.json();

    if (response.ok && result.success) {
      renderizarReportes(result.reportes);
    } else {
      console.error('Error al cargar reportes:', result.message);
    }
  } catch (error) {
    console.error('Error al cargar reportes:', error);
  }
}

function renderizarReportes(reportes) {
  const listaReportes = document.querySelector('.lista-reportes');

  if (!reportes || reportes.length === 0) {
    listaReportes.innerHTML = '<p style="text-align: center; padding: 20px;">No tienes reportes registrados</p>';
    return;
  }

  // Ordenar: primero pendientes (0 y 1), luego completados (2), y dentro de cada grupo por fecha
  reportes.sort((a, b) => {
    // Definir prioridad de estados: pendientes antes que completados
    const prioridad = { 0: 0, 1: 1, 2: 2 };
    const priA = prioridad[a.rep_estado] ?? 3;
    const priB = prioridad[b.rep_estado] ?? 3;

    if (priA !== priB) {
      return priA - priB;
    }

    // Dentro del mismo estado, ordenar por fecha descendente (más recientes primero)
    return new Date(b.rep_fecha_lev) - new Date(a.rep_fecha_lev);
  });

  listaReportes.innerHTML = reportes.map(reporte => {
    const estadoInfo = estadosReportes[reporte.rep_estado] || { estado: 'Desconocido', clase: 'gray' };
    const fecha = new Date(reporte.rep_fecha_lev).toLocaleDateString('es-ES');

    return `
      <div class="reporte" data-id="${reporte.id}" style="cursor: pointer;">
        <div class="info">
          <div class="fecha">${fecha}</div>
          <div class="numero">Reporte #${reporte.id}</div>
        </div>
        <div class="status ${estadoInfo.clase}">${estadoInfo.estado}</div>
      </div>
    `;
  }).join('');

  // Agregar event listeners para ver detalles
  document.querySelectorAll('.reporte').forEach(reporte => {
    reporte.addEventListener('click', () => {
      const id = reporte.dataset.id;
      mostrarDetalleReporte(id);
    });
  });
}

async function mostrarDetalleReporte(id) {
  try {
    const response = await fetch(`/api/reporte/${id}`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' }
    });

    const result = await response.json();

    if (response.ok && result.success) {
      const reporte = result.reporte;
      const estadoInfo = estadosReportes[reporte.rep_estado];
      const fechaLev = new Date(reporte.rep_fecha_lev).toLocaleString('es-ES');
      const fechaRes = reporte.rep_fecha_res ? new Date(reporte.rep_fecha_res).toLocaleString('es-ES') : 'No resuelto';

      const detalles = `
        Reporte #${reporte.id}

Estado: ${estadoInfo.estado}
Fecha de levantamiento: ${fechaLev}
Fecha de resolución: ${fechaRes}
Salón: ${reporte.sal_id}
Dispositivo: ${reporte.disp_id}
Técnico asignado: ${reporte.tec_id || 'Sin asignar'}
      `;

      alert(detalles);
    } else {
      alert('Error al cargar los detalles del reporte');
    }
  } catch (error) {
    console.error('Error al obtener detalles:', error);
    alert('Error al cargar los detalles');
  }
}

function aplicarFiltro(tipo) {
  document.querySelectorAll(".reporte").forEach((reporte) => {
    const status = reporte.querySelector(".status");
    if (filtros[tipo](status)) {
      reporte.style.display = "flex";
    } else {
      reporte.style.display = "none";
    }
  });
}
