document.addEventListener("DOMContentLoaded", () => {
  const volverBtn = document.querySelector('[data-action="volver"]');
  const form = document.getElementById("formTecnico");
  const errorContainer = document.getElementById("errorContainer");

  if (volverBtn) {
    volverBtn.addEventListener("click", () => {
      window.location.href = "/tecnicos";
    });
  }

  if (form) {
    form.addEventListener("submit", async (e) => {
      e.preventDefault();
      await crearTecnico();
    });
  }
});

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

async function crearTecnico() {
  try {
    const btnAgregar = document.getElementById("btnAgregar");
    btnAgregar.disabled = true;
    btnAgregar.innerHTML = '<span class="material-symbols-outlined">hourglass_empty</span> Creando...';

    const nombre = document.getElementById("nombre").value;
    const apellido_paterno = document.getElementById("apellido_paterno").value;
    const apellido_materno = document.getElementById("apellido_materno").value;
    const id_tecnico = document.getElementById("id_tecnico").value;
    const correo = document.getElementById("correo").value;
    const password = document.getElementById("password").value;

    // Validaciones frontend
    const regexNombre = /^[A-Za-zÁÉÍÓÚáéíóúÑñ ]+$/;
    const regexId = /^[0-9]{10}$/;
    const regexEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const regexPasswordLength = /^.{8,25}$/;
    const regexPasswordHasLetter = /[A-Za-z]/;
    const regexPasswordHasNumber = /[0-9]/;

    const nombreTrim = nombre.trim();
    const apTrim = apellido_paterno.trim();
    const amTrim = apellido_materno.trim();
    const idTrim = id_tecnico.trim();
    const correoTrim = correo.trim();
    const passwordTrim = password.trim();

    if (!nombreTrim || !apTrim || !amTrim || !idTrim || !correoTrim || !passwordTrim) {
      mostrarError('Todos los campos son obligatorios');
      btnAgregar.disabled = false;
      btnAgregar.innerHTML = '<span class="material-symbols-outlined">person_add</span> Agregar técnico';
      return;
    }

    if (!regexNombre.test(nombreTrim)) {
      mostrarError('El nombre solo puede contener letras y espacios');
      btnAgregar.disabled = false;
      btnAgregar.innerHTML = '<span class="material-symbols-outlined">person_add</span> Agregar técnico';
      return;
    }

    if (!regexNombre.test(apTrim)) {
      mostrarError('El apellido paterno solo puede contener letras y espacios');
      btnAgregar.disabled = false;
      btnAgregar.innerHTML = '<span class="material-symbols-outlined">person_add</span> Agregar técnico';
      return;
    }

    if (!regexNombre.test(amTrim)) {
      mostrarError('El apellido materno solo puede contener letras y espacios');
      btnAgregar.disabled = false;
      btnAgregar.innerHTML = '<span class="material-symbols-outlined">person_add</span> Agregar técnico';
      return;
    }

    if (!regexId.test(idTrim)) {
      mostrarError('El ID debe contener exactamente 10 dígitos');
      btnAgregar.disabled = false;
      btnAgregar.innerHTML = '<span class="material-symbols-outlined">person_add</span> Agregar técnico';
      return;
    }

    if (!regexEmail.test(correoTrim)) {
      mostrarError('El correo no es válido');
      btnAgregar.disabled = false;
      btnAgregar.innerHTML = '<span class="material-symbols-outlined">person_add</span> Agregar técnico';
      return;
    }

    if (!regexPasswordLength.test(passwordTrim)) {
      mostrarError('La contraseña debe tener entre 8 y 25 caracteres');
      btnAgregar.disabled = false;
      btnAgregar.innerHTML = '<span class="material-symbols-outlined">person_add</span> Agregar técnico';
      return;
    }

    if (!regexPasswordHasLetter.test(passwordTrim)) {
      mostrarError('La contraseña debe contener al menos una letra');
      btnAgregar.disabled = false;
      btnAgregar.innerHTML = '<span class="material-symbols-outlined">person_add</span> Agregar técnico';
      return;
    }

    if (!regexPasswordHasNumber.test(passwordTrim)) {
      mostrarError('La contraseña debe contener al menos un número');
      btnAgregar.disabled = false;
      btnAgregar.innerHTML = '<span class="material-symbols-outlined">person_add</span> Agregar técnico';
      return;
    }

    const response = await fetch('/tecnicos/crear', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        nombre: nombreTrim,
        apellido_paterno: apTrim,
        apellido_materno: amTrim,
        id_tecnico: idTrim,
        correo: correoTrim,
        password: passwordTrim
      })
    });

    const data = await response.json();

    if (!response.ok || !data.success) {
      mostrarError(data.message || 'Error al crear el técnico');
      btnAgregar.disabled = false;
      btnAgregar.innerHTML = '<span class="material-symbols-outlined">person_add</span> Agregar técnico';
      return;
    }

    // Éxito - mostrar alerta y redirigir
    alert('Técnico creado exitosamente');
    window.location.href = '/tecnicos';

  } catch (error) {
    mostrarError('Error al crear el técnico');
    const btnAgregar = document.getElementById("btnAgregar");
    btnAgregar.disabled = false;
    btnAgregar.innerHTML = '<span class="material-symbols-outlined">person_add</span> Agregar técnico';
  }
}
