let alumnoSeleccionado = null;

document.addEventListener("DOMContentLoaded", () => {
  const volverBtn = document.querySelector('[data-action="volver"]');
  const btnEditar = document.getElementById("btnEditar");
  const btnEliminar = document.getElementById("btnEliminar");

  if (volverBtn) {
    volverBtn.addEventListener("click", () => {
      window.location.href = "/alumnos/buscar";
    });
  }

  if (btnEditar) {
    btnEditar.addEventListener("click", () => {
      sessionStorage.setItem('alumnoAEditar', JSON.stringify(alumnoSeleccionado));
      window.location.href = '/alumnos/editar';
    });
  }

  if (btnEliminar) {
    btnEliminar.addEventListener("click", () => {
      sessionStorage.setItem('alumnoAEliminar', JSON.stringify(alumnoSeleccionado));
      window.location.href = '/alumnos/eliminar';
    });
  }

  // Cargar alumno desde sessionStorage
  const alumnoJSON = sessionStorage.getItem('alumnoEncontrado');
  if (alumnoJSON) {
    try {
      alumnoSeleccionado = JSON.parse(alumnoJSON);
      mostrarDetallesAlumno();
      // NO remover aquí - mantener en sessionStorage para poder editar/eliminar
    } catch (err) {
      window.location.href = "/alumnos/buscar";
    }
  } else {
    window.location.href = "/alumnos/buscar";
  }
});

function mostrarDetallesAlumno() {
  if (!alumnoSeleccionado) return;

  const estadoMap = {
    1: 'Activo',
    2: 'Baja',
    3: 'Ausente',
    4: 'Dictamen'
  };

  document.getElementById("nombreAlumno").textContent =
    `${alumnoSeleccionado.usr_nombre} ${alumnoSeleccionado.usr_ap} ${alumnoSeleccionado.usr_am}`;

  document.getElementById("boletaAlumno").textContent = alumnoSeleccionado.id;
  document.getElementById("correoAlumno").textContent = alumnoSeleccionado.usr_correo;
  document.getElementById("estadoAlumno").textContent = estadoMap[alumnoSeleccionado.est_tipo] || 'Desconocido';
}

