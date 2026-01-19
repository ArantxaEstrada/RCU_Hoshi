document.addEventListener("DOMContentLoaded", () => {
  const volverBtn = document.querySelector('[data-action="volver"]');
  const form = document.getElementById("formAlumno");
  const errorContainer = document.getElementById("errorContainer");

  if (volverBtn) {
    volverBtn.addEventListener("click", () => {
      window.location.href = "/alumnos";
    });
  }

  if (form) {
    form.addEventListener("submit", async (e) => {
      e.preventDefault();
      await crearAlumno();
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

function volverAlumnos() {
  window.location.href = "/alumnos";
}

async function crearAlumno() {
  try {
    const btnAgregar = document.getElementById("btnAgregar");
    btnAgregar.disabled = true;
    btnAgregar.innerHTML = '<span class="material-symbols-outlined">hourglass_empty</span> Creando...';

    const nombre = document.getElementById("nombre").value;
    const apellido_paterno = document.getElementById("apellidoPaterno").value;
    const apellido_materno = document.getElementById("apellidoMaterno").value;
    const boleta = document.getElementById("boleta").value;
    const correo = document.getElementById("correo").value;
    const password = document.getElementById("password").value;

    // Validaciones frontend
    const regexNombre = /^[A-Za-zÁÉÍÓÚáéíóúÑñ ]+$/;
    const regexBoleta = /^[0-9]{10}$/;
    const regexEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const regexPasswordLength = /^.{8,25}$/;
    const regexPasswordHasLetter = /[A-Za-z]/;
    const regexPasswordHasNumber = /[0-9]/;

    const nombreTrim = nombre.trim();
    const apTrim = apellido_paterno.trim();
    const amTrim = apellido_materno.trim();
    const boletaTrim = boleta.trim();
    const correoTrim = correo.trim();
    const passwordTrim = password.trim();

    if (!nombreTrim || !apTrim || !amTrim || !boletaTrim || !correoTrim || !passwordTrim) {
      mostrarError('Todos los campos son obligatorios');
      btnAgregar.disabled = false;
      btnAgregar.innerHTML = '<span class="material-symbols-outlined">person_add</span> Agregar alumno';
      return;
    }

    if (!regexNombre.test(nombreTrim)) {
      mostrarError('El nombre solo puede contener letras y espacios');
      btnAgregar.disabled = false;
      btnAgregar.innerHTML = '<span class="material-symbols-outlined">person_add</span> Agregar alumno';
      return;
    }

    if (!regexNombre.test(apTrim)) {
      mostrarError('El apellido paterno solo puede contener letras y espacios');
      btnAgregar.disabled = false;
      btnAgregar.innerHTML = '<span class="material-symbols-outlined">person_add</span> Agregar alumno';
      return;
    }

    if (!regexNombre.test(amTrim)) {
      mostrarError('El apellido materno solo puede contener letras y espacios');
      btnAgregar.disabled = false;
      btnAgregar.innerHTML = '<span class="material-symbols-outlined">person_add</span> Agregar alumno';
      return;
    }

    if (!regexBoleta.test(boletaTrim)) {
      mostrarError('La boleta debe contener exactamente 10 dígitos');
      btnAgregar.disabled = false;
      btnAgregar.innerHTML = '<span class="material-symbols-outlined">person_add</span> Agregar alumno';
      return;
    }

    if (!regexEmail.test(correoTrim)) {
      mostrarError('El correo no es válido');
      btnAgregar.disabled = false;
      btnAgregar.innerHTML = '<span class="material-symbols-outlined">person_add</span> Agregar alumno';
      return;
    }

    if (!regexPasswordLength.test(passwordTrim)) {
      mostrarError('La contraseña debe tener entre 8 y 25 caracteres');
      btnAgregar.disabled = false;
      btnAgregar.innerHTML = '<span class="material-symbols-outlined">person_add</span> Agregar alumno';
      return;
    }

    if (!regexPasswordHasLetter.test(passwordTrim)) {
      mostrarError('La contraseña debe contener al menos una letra');
      btnAgregar.disabled = false;
      btnAgregar.innerHTML = '<span class="material-symbols-outlined">person_add</span> Agregar alumno';
      return;
    }

    if (!regexPasswordHasNumber.test(passwordTrim)) {
      mostrarError('La contraseña debe contener al menos un número');
      btnAgregar.disabled = false;
      btnAgregar.innerHTML = '<span class="material-symbols-outlined">person_add</span> Agregar alumno';
      return;
    }

    const response = await fetch('/alumnos/crear', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        nombre: nombreTrim,
        apellido_paterno: apTrim,
        apellido_materno: amTrim,
        boleta: boletaTrim,
        correo: correoTrim,
        password: passwordTrim
      })
    });

    const data = await response.json();

    if (!response.ok || !data.success) {
      mostrarError(data.message || 'Error al crear el alumno');
      btnAgregar.disabled = false;
      btnAgregar.innerHTML = '<span class="material-symbols-outlined">person_add</span> Agregar alumno';
      return;
    }

    // Éxito - mostrar alerta y redirigir
    alert('Alumno creado exitosamente');
    window.location.href = '/alumnos';

  } catch (error) {
    mostrarError('Error al crear el alumno');
    const btnAgregar = document.getElementById("btnAgregar");
    btnAgregar.disabled = false;
    btnAgregar.innerHTML = '<span class="material-symbols-outlined">person_add</span> Agregar alumno';
  }
}

