let tecnicoSeleccionado = null;

document.addEventListener("DOMContentLoaded", async () => {
  const volverBtn = document.querySelector('[data-action="volver"]');
  const form = document.getElementById("formActualizar");

  if (volverBtn) {
    volverBtn.addEventListener("click", () => {
      window.location.href = "/tecnicos/detalles";
    });
  }

  if (form) {
    form.addEventListener("submit", async (e) => {
      e.preventDefault();
      await actualizarTecnico();
    });
  }

  // Cargar técnico desde sessionStorage
  const tecnicoJSON = sessionStorage.getItem('tecnicoAEditar');
  if (tecnicoJSON) {
    try {
      tecnicoSeleccionado = JSON.parse(tecnicoJSON);
      cargarDatosTecnico();
      // NO remover aquí - mantener para poder volver a detalles
    } catch (err) {
      window.location.href = "/tecnicos/detalles";
    }
  } else {
    window.location.href = "/tecnicos/detalles";
  }
});

function cargarDatosTecnico() {
  if (!tecnicoSeleccionado) return;

  document.getElementById("idTecnicoValue").textContent = tecnicoSeleccionado.id;
  document.getElementById("nombre").value = tecnicoSeleccionado.usr_nombre || '';
  document.getElementById("apellido_paterno").value = tecnicoSeleccionado.usr_ap || '';
  document.getElementById("apellido_materno").value = tecnicoSeleccionado.usr_am || '';
  document.getElementById("correo").value = tecnicoSeleccionado.usr_correo || '';
  document.getElementById("password").value = tecnicoSeleccionado.usr_pass || '';
  document.getElementById("estado").value = tecnicoSeleccionado.est_tipo || 1;
}

function mostrarError(mensaje) {
  const errorContainer = document.getElementById("errorContainer");
  errorContainer.textContent = mensaje;
  errorContainer.classList.add("show");

  setTimeout(() => {
    errorContainer.classList.remove("show");
  }, 5000);
}

function volverTecnicos() {
  window.location.href = "/tecnicos";
}

async function actualizarTecnico() {
  try {
    if (!tecnicoSeleccionado) {
      mostrarError('No hay técnico seleccionado');
      return;
    }

    const btnActualizar = document.getElementById("btnActualizar");
    btnActualizar.disabled = true;
    btnActualizar.innerHTML = '<span class="material-symbols-outlined">hourglass_empty</span> Actualizando...';

    const nombre = document.getElementById("nombre").value;
    const apellido_paterno = document.getElementById("apellido_paterno").value;
    const apellido_materno = document.getElementById("apellido_materno").value;
    const correo = document.getElementById("correo").value;
    const password = document.getElementById("password").value;
    const estado = document.getElementById("estado").value;

    // Validaciones frontend
    const regexNombre = /^[A-Za-zÁÉÍÓÚáéíóúÑñ ]+$/;
    const regexEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const regexPasswordLength = /^.{8,25}$/;
    const regexPasswordHasLetter = /[A-Za-z]/;
    const regexPasswordHasNumber = /[0-9]/;

    const nombreTrim = nombre.trim();
    const apTrim = apellido_paterno.trim();
    const amTrim = apellido_materno.trim();
    const correoTrim = correo.trim();
    const passwordTrim = password.trim();

    if (!nombreTrim || !apTrim || !amTrim || !correoTrim || !passwordTrim) {
      mostrarError('Todos los campos son obligatorios');
      btnActualizar.disabled = false;
      btnActualizar.innerHTML = '<span class="material-symbols-outlined">save</span> Actualizar técnico';
      return;
    }

    if (!regexNombre.test(nombreTrim)) {
      mostrarError('El nombre solo puede contener letras y espacios');
      btnActualizar.disabled = false;
      btnActualizar.innerHTML = '<span class="material-symbols-outlined">save</span> Actualizar técnico';
      return;
    }

    if (!regexNombre.test(apTrim)) {
      mostrarError('El apellido paterno solo puede contener letras y espacios');
      btnActualizar.disabled = false;
      btnActualizar.innerHTML = '<span class="material-symbols-outlined">save</span> Actualizar técnico';
      return;
    }

    if (!regexNombre.test(amTrim)) {
      mostrarError('El apellido materno solo puede contener letras y espacios');
      btnActualizar.disabled = false;
      btnActualizar.innerHTML = '<span class="material-symbols-outlined">save</span> Actualizar técnico';
      return;
    }

    if (!regexEmail.test(correoTrim)) {
      mostrarError('El correo no es válido');
      btnActualizar.disabled = false;
      btnActualizar.innerHTML = '<span class="material-symbols-outlined">save</span> Actualizar técnico';
      return;
    }

    if (!regexPasswordLength.test(passwordTrim)) {
      mostrarError('La contraseña debe tener entre 8 y 25 caracteres');
      btnActualizar.disabled = false;
      btnActualizar.innerHTML = '<span class="material-symbols-outlined">save</span> Actualizar técnico';
      return;
    }

    if (!regexPasswordHasLetter.test(passwordTrim)) {
      mostrarError('La contraseña debe contener al menos una letra');
      btnActualizar.disabled = false;
      btnActualizar.innerHTML = '<span class="material-symbols-outlined">save</span> Actualizar técnico';
      return;
    }

    if (!regexPasswordHasNumber.test(passwordTrim)) {
      mostrarError('La contraseña debe contener al menos un número');
      btnActualizar.disabled = false;
      btnActualizar.innerHTML = '<span class="material-symbols-outlined">save</span> Actualizar técnico';
      return;
    }

    const response = await fetch('/tecnicos/actualizar', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        id_tecnico: tecnicoSeleccionado.id,
        nombre: nombreTrim,
        apellido_paterno: apTrim,
        apellido_materno: amTrim,
        correo: correoTrim,
        password: passwordTrim,
        estado: parseInt(estado)
      })
    });

    const data = await response.json();

    if (!response.ok || !data.success) {
      mostrarError(data.message || 'Error al actualizar el técnico');
      btnActualizar.disabled = false;
      btnActualizar.innerHTML = '<span class="material-symbols-outlined">save</span> Actualizar técnico';
      return;
    }

    // Guardar el técnico actualizado en ambos lugares
    sessionStorage.setItem('tecnicoEncontrado', JSON.stringify(data.tecnico));
    sessionStorage.setItem('tecnicoAEditar', JSON.stringify(data.tecnico));
    alert('Técnico actualizado exitosamente');
    window.location.href = '/tecnicos/detalles';

  } catch (error) {
    mostrarError('Error al actualizar el técnico');
    const btnActualizar = document.getElementById("btnActualizar");
    btnActualizar.disabled = false;
    btnActualizar.innerHTML = '<span class="material-symbols-outlined">save</span> Actualizar técnico';
  }
}
