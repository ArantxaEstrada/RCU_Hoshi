let alumnoSeleccionado = null;

document.addEventListener("DOMContentLoaded", () => {
  const volverBtn = document.querySelector('[data-action="volver"]');
  const form = document.getElementById("formEliminar");
  const btnVolverConfirm = document.getElementById("btnVolverConfirm");
  const errorContainer = document.getElementById("errorContainer");

  if (volverBtn) {
    volverBtn.addEventListener("click", () => {
      window.location.href = "/alumnos";
    });
  }

  if (btnVolverConfirm) {
    btnVolverConfirm.addEventListener("click", () => {
      window.location.href = "/alumnos";
    });
  }

  if (form) {
    form.addEventListener("submit", async (e) => {
      e.preventDefault();
      await eliminarAlumno();
    });
  }

  // Cargar alumno desde sessionStorage si existe
  const alumnoJSON = sessionStorage.getItem('alumnoAEliminar');
  if (alumnoJSON) {
    try {
      alumnoSeleccionado = JSON.parse(alumnoJSON);
      mostrarAlumnoSeleccionado();
      sessionStorage.removeItem('alumnoAEliminar');
    } catch (err) {
    }
  }
});

function mostrarAlumnoSeleccionado() {
  if (!alumnoSeleccionado) {
    return;
  }

  document.getElementById("nombreAlumno").textContent = `${alumnoSeleccionado.usr_nombre} ${alumnoSeleccionado.usr_ap} ${alumnoSeleccionado.usr_am}`;
  document.getElementById("boletaAlumno").textContent = alumnoSeleccionado.id;
  document.getElementById("correoAlumno").textContent = alumnoSeleccionado.usr_correo;
}

function mostrarError(mensaje) {
  const errorContainer = document.getElementById("errorContainer");
  errorContainer.textContent = mensaje;
  errorContainer.classList.add("show");

  setTimeout(() => {
    errorContainer.classList.remove("show");
  }, 5000);
}

function volverAlumnos() {
  window.location.href = "/alumnos";
}

async function eliminarAlumno() {
  try {
    if (!alumnoSeleccionado) {
      mostrarError('No hay alumno seleccionado');
      return;
    }

    const btnEliminar = document.getElementById("btnEliminar");
    btnEliminar.disabled = true;
    btnEliminar.innerHTML = '<span class="material-symbols-outlined">hourglass_empty</span> Eliminando...';

    const identificador = document.getElementById("identificador").value;
    const password = document.getElementById("password").value;

    // Validaciones frontend
    const regexId = /^[0-9]{1,20}$/;
    const regexPassword = /^.{8,25}$/;

    const idTrim = identificador.trim();
    const passwordTrim = password.trim();

    if (!idTrim || !passwordTrim) {
      mostrarError('Todos los campos son obligatorios');
      btnEliminar.disabled = false;
      btnEliminar.innerHTML = '<span class="material-symbols-outlined">delete</span> Eliminar alumno';
      return;
    }

    if (!regexId.test(idTrim)) {
      mostrarError('Identificador inválido');
      btnEliminar.disabled = false;
      btnEliminar.innerHTML = '<span class="material-symbols-outlined">delete</span> Eliminar alumno';
      return;
    }

    if (!regexPassword.test(passwordTrim)) {
      mostrarError('Contraseña inválida');
      btnEliminar.disabled = false;
      btnEliminar.innerHTML = '<span class="material-symbols-outlined">delete</span> Eliminar alumno';
      return;
    }

    const response = await fetch('/alumnos/eliminar', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        boleta: alumnoSeleccionado.id,
        identificador: idTrim,
        password: passwordTrim
      })
    });

    const data = await response.json();

    if (!response.ok || !data.success) {
      mostrarError(data.message || 'Error al eliminar el alumno');
      btnEliminar.disabled = false;
      btnEliminar.innerHTML = '<span class="material-symbols-outlined">delete</span> Eliminar alumno';
      return;
    }

    // Mostrar pantalla de confirmación (como en React Native)
    document.getElementById("mainContainer").style.display = "none";
    document.getElementById("confirmContainer").style.display = "flex";

  } catch (error) {
    mostrarError('Error al eliminar el alumno');
    const btnEliminar = document.getElementById("btnEliminar");
    btnEliminar.disabled = false;
    btnEliminar.innerHTML = '<span class="material-symbols-outlined">delete</span> Eliminar alumno';
  }
}

