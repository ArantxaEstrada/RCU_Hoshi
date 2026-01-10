let tecnicoSeleccionado = null;

document.addEventListener("DOMContentLoaded", () => {
  const volverBtn = document.querySelector('[data-action="volver"]');
  const form = document.getElementById("formEliminar");
  const btnVolverConfirm = document.getElementById("btnVolverConfirm");
  const errorContainer = document.getElementById("errorContainer");

  if (volverBtn) {
    volverBtn.addEventListener("click", () => {
      window.location.href = "/tecnicos";
    });
  }

  if (btnVolverConfirm) {
    btnVolverConfirm.addEventListener("click", () => {
      window.location.href = "/tecnicos";
    });
  }

  if (form) {
    form.addEventListener("submit", async (e) => {
      e.preventDefault();
      await eliminarTecnico();
    });
  }

  // Cargar técnico desde sessionStorage si existe
  const tecnicoJSON = sessionStorage.getItem('tecnicoAEliminar');
  if (tecnicoJSON) {
    try {
      tecnicoSeleccionado = JSON.parse(tecnicoJSON);
      mostrarTecnicoSeleccionado();
      sessionStorage.removeItem('tecnicoAEliminar');
    } catch (err) {
    }
  }
});

function mostrarTecnicoSeleccionado() {
  if (!tecnicoSeleccionado) {
    return;
  }

  document.getElementById("nombreTecnico").textContent = `${tecnicoSeleccionado.usr_nombre} ${tecnicoSeleccionado.usr_ap} ${tecnicoSeleccionado.usr_am}`;
  document.getElementById("idTecnico").textContent = tecnicoSeleccionado.id;
  document.getElementById("correoTecnico").textContent = tecnicoSeleccionado.usr_correo;
}

function volverTecnicos() {
  window.location.href = "/tecnicos";
}

function mostrarError(mensaje) {
  const errorContainer = document.getElementById("errorContainer");
  errorContainer.textContent = mensaje;
  errorContainer.classList.add("show");

  setTimeout(() => {
    errorContainer.classList.remove("show");
  }, 5000);
}

async function eliminarTecnico() {
  try {
    if (!tecnicoSeleccionado) {
      mostrarError('No hay técnico seleccionado');
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
      btnEliminar.innerHTML = '<span class="material-symbols-outlined">delete</span> Eliminar técnico';
      return;
    }

    if (!regexId.test(idTrim)) {
      mostrarError('Identificador inválido');
      btnEliminar.disabled = false;
      btnEliminar.innerHTML = '<span class="material-symbols-outlined">delete</span> Eliminar técnico';
      return;
    }

    if (!regexPassword.test(passwordTrim)) {
      mostrarError('Contraseña inválida');
      btnEliminar.disabled = false;
      btnEliminar.innerHTML = '<span class="material-symbols-outlined">delete</span> Eliminar técnico';
      return;
    }

    const response = await fetch('/tecnicos/eliminar', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        id_tecnico: tecnicoSeleccionado.id,
        identificador: idTrim,
        password: passwordTrim
      })
    });

    const data = await response.json();

    if (!response.ok || !data.success) {
      mostrarError(data.message || 'Error al eliminar el técnico');
      btnEliminar.disabled = false;
      btnEliminar.innerHTML = '<span class="material-symbols-outlined">delete</span> Eliminar técnico';
      return;
    }

    // Mostrar pantalla de confirmación (como en React Native)
    document.getElementById("mainContainer").style.display = "none";
    document.getElementById("confirmContainer").style.display = "flex";

  } catch (error) {
    mostrarError('Error al eliminar el técnico');
    const btnEliminar = document.getElementById("btnEliminar");
    btnEliminar.disabled = false;
    btnEliminar.innerHTML = '<span class="material-symbols-outlined">delete</span> Eliminar técnico';
  }
}

