let tecnicoSeleccionado = null;

document.addEventListener("DOMContentLoaded", () => {
  const volverBtn = document.querySelector('[data-action="volver"]');
  const btnEditar = document.getElementById("btnEditar");
  const btnEliminar = document.getElementById("btnEliminar");

  if (volverBtn) {
    volverBtn.addEventListener("click", () => {
      window.location.href = "/tecnicos/buscar";
    });
  }

  if (btnEditar) {
    btnEditar.addEventListener("click", () => {
      sessionStorage.setItem('tecnicoAEditar', JSON.stringify(tecnicoSeleccionado));
      window.location.href = '/tecnicos/editar';
    });
  }

  if (btnEliminar) {
    btnEliminar.addEventListener("click", () => {
      sessionStorage.setItem('tecnicoAEliminar', JSON.stringify(tecnicoSeleccionado));
      window.location.href = '/tecnicos/eliminar';
    });
  }

  // Cargar técnico desde sessionStorage
  const tecnicoJSON = sessionStorage.getItem('tecnicoEncontrado');
  if (tecnicoJSON) {
    try {
      tecnicoSeleccionado = JSON.parse(tecnicoJSON);
      mostrarDetallesTecnico();
      // sessionStorage.removeItem('tecnicoEncontrado'); // NO remover para mantener persistencia
    } catch (err) {
      window.location.href = "/tecnicos/buscar";
    }
  } else {
    window.location.href = "/tecnicos/buscar";
  }
});

function mostrarDetallesTecnico() {
  if (!tecnicoSeleccionado) return;

  const estadoMap = {
    1: 'Activo',
    2: 'Baja',
    3: 'Ausente',
    4: 'Dictamen'
  };

  document.getElementById("nombreTecnico").textContent =
    `${tecnicoSeleccionado.usr_nombre} ${tecnicoSeleccionado.usr_ap} ${tecnicoSeleccionado.usr_am}`;

  document.getElementById("idTecnico").textContent = tecnicoSeleccionado.id;
  document.getElementById("correoTecnico").textContent = tecnicoSeleccionado.usr_correo;
  document.getElementById("estadoTecnico").textContent = estadoMap[tecnicoSeleccionado.est_tipo] || 'Desconocido';
}

