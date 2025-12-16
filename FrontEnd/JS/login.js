// Manejar el envío del formulario de login
document.addEventListener("DOMContentLoaded", () => {
  const loginForm = document.querySelector(".login-form");
  const boletaInput = document.getElementById("boleta");
  const correoInput = document.getElementById("correo");
  const contrasenaInput = document.getElementById("contrasena");

  // Validar que solo se ingresen números en la boleta
  if (boletaInput) {
    boletaInput.addEventListener("input", (e) => {
      e.target.value = e.target.value.replace(/[^0-9]/g, "");
      if (e.target.value.length > 10) {
        e.target.value = e.target.value.slice(0, 10);
      }
    });

    // Prevenir pegado de caracteres no numéricos
    boletaInput.addEventListener("paste", (e) => {
      e.preventDefault();
      const pastedText = (e.clipboardData || window.clipboardData).getData("text");
      const numericOnly = pastedText.replace(/[^0-9]/g, "").slice(0, 10);
      e.target.value = numericOnly;
    });
  }

  // Validar formato de correo mientras se escribe
  if (correoInput) {
    correoInput.addEventListener("blur", (e) => {
      const email = e.target.value.trim();
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (email && !emailRegex.test(email)) {
        e.target.setCustomValidity("Por favor ingresa un correo válido");
        e.target.reportValidity();
      } else {
        e.target.setCustomValidity("");
      }
    });
  }

  // Validar longitud de contraseña
  if (contrasenaInput) {
    contrasenaInput.addEventListener("blur", (e) => {
      if (e.target.value.length > 0 && e.target.value.length < 6) {
        e.target.setCustomValidity("La contraseña debe tener al menos 6 caracteres");
        e.target.reportValidity();
      } else {
        e.target.setCustomValidity("");
      }
    });
  }

  if (loginForm) {
    loginForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      await login();
    });
  }
});

async function login() {
  const boleta = document.getElementById("boleta").value.trim();
  const correo = document.getElementById("correo").value.trim().toLowerCase();
  const contrasena = document.getElementById("contrasena").value;

  // Validaciones estrictas en el cliente
  if (!boleta) {
    alert("Por favor ingresa tu número de boleta.");
    document.getElementById("boleta").focus();
    return;
  }

  if (!/^\d{10}$/.test(boleta)) {
    alert("La boleta debe contener exactamente 10 dígitos numéricos.");
    document.getElementById("boleta").focus();
    return;
  }

  if (!correo) {
    alert("Por favor ingresa tu correo electrónico.");
    document.getElementById("correo").focus();
    return;
  }

  if (!/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(correo)) {
    alert("Por favor ingresa un correo electrónico válido (ejemplo: usuario@dominio.com).");
    document.getElementById("correo").focus();
    return;
  }

  if (!contrasena) {
    alert("Por favor ingresa tu contraseña.");
    document.getElementById("contrasena").focus();
    return;
  }

  if (contrasena.length < 6) {
    alert("La contraseña debe tener al menos 6 caracteres.");
    document.getElementById("contrasena").focus();
    return;
  }

  try {
    const response = await fetch("/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ boleta, correo, contrasena }),
    });

    const result = await response.json();

    if (response.ok && result.success) {
      // Redirigir a la página principal
      window.location.href = "/main";
    } else {
      alert(result.message || "Credenciales incorrectas.");
    }
  } catch (error) {
    console.error("Error en login:", error);
    alert("Hubo un problema al iniciar sesión. Intenta más tarde.");
  }
}

// Función para cerrar sesión (puede usarse en otras páginas)
async function logout() {
  try {
    const response = await fetch("/logout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
    });

    const result = await response.json();

    if (response.ok && result.success) {
      window.location.href = "/";
    } else {
      alert(result.message || "Error al cerrar sesión.");
    }
  } catch (error) {
    console.error("Error en logout:", error);
    alert("Hubo un problema al cerrar sesión.");
  }
}

// Función para verificar sesión activa
async function verificarSesion() {
  try {
    const response = await fetch("/verificar-sesion", {
      method: "GET",
      headers: { "Content-Type": "application/json" },
    });

    const result = await response.json();
    return result.success;
  } catch (error) {
    console.error("Error al verificar sesión:", error);
    return false;
  }
}
