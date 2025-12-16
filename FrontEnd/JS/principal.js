// Verificar sesión al cargar la página
async function verificarSesion() {
  try {
    const response = await fetch("/verificar-sesion", {
      method: "GET",
      headers: { "Content-Type": "application/json" },
    });

    const result = await response.json();

    if (!response.ok || !result.success) {
      // Si no hay sesión activa, redirigir a página de sesión expirada
      window.location.href = "/sesion-expirada";
    }
  } catch (error) {
    console.error("Error al verificar sesión:", error);
    window.location.href = "/sesion-expirada";
  }
}

// Prevenir caché del navegador - verificar sesión cuando se vuelve a la página
window.addEventListener("pageshow", (event) => {
  if (event.persisted) {
    // La página se cargó desde el caché (botón retroceder)
    verificarSesion();
  }
});

// Detectar cierre de ventana/pestaña para cerrar sesión
// Solo usar pagehide para eventos reales de cierre, no para navegación interna
window.addEventListener("pagehide", (event) => {
  // event.persisted es true si la página va al caché (puede volver)
  // es false si realmente se cierra/navega a otro sitio
  if (!event.persisted) {
    // Solo cerrar sesión si realmente se cierra, no por navegación interna
    const currentPage = window.location.pathname;
    // Evitar cerrar sesión al navegar internamente
    if (!currentPage.includes('/main') && !currentPage.includes('/reporte') &&
        !currentPage.includes('/consulta') && !currentPage.includes('/Alumnos') &&
        !currentPage.includes('/Tecnicos') && !currentPage.includes('/Dispositivos') &&
        !currentPage.includes('/Reportes')) {
      navigator.sendBeacon("/cerrar-sesion-silenciosa");
    }
  }
});

document.addEventListener("DOMContentLoaded", async () => {
  // Verificar sesión al cargar
  await verificarSesion();

  // Obtener perfil y mostrar botones correspondientes
  const perfil = await obtenerPerfil();
  if (perfil) {
    mostrarBotonesPorPerfil(perfil);
  }

  const acciones = {
    reporte: "/reporte",
    consulta: "/consulta",
    visreportes: "/FrontEnd/Views/Reportes/reportes.html",
    "informe-tecnico": "/informe-tecnico",
    alumnos: "/FrontEnd/Views/Alumnos/alumnos.html",
    tecnicos: "/FrontEnd/Views/Tecnicos/tecnicos.html",
    dispositivos: "/FrontEnd/Views/Dispositivos/dispositivos.html"
  };

  document.querySelectorAll(".btn-action").forEach((btn) => {
    btn.addEventListener("click", async () => {
      const action = btn.dataset.action;

      if (action === "logout") {
        // Llamar a la función de logout
        await logout();
      } else if (acciones[action]) {
        window.location.href = acciones[action];
      }
    });
  });
});

// Obtener perfil del usuario
async function obtenerPerfil() {
  try {
    const response = await fetch("/obtener-perfil", {
      method: "GET",
      headers: { "Content-Type": "application/json" },
    });

    const result = await response.json();

    if (response.ok && result.success) {
      return result.perfil;
    }
    return null;
  } catch (error) {
    console.error("Error al obtener perfil:", error);
    return null;
  }
}

// Mostrar solo los botones permitidos para el perfil actual
function mostrarBotonesPorPerfil(perfil) {
  document.querySelectorAll(".btn-action").forEach((btn) => {
    const accion = btn.dataset.action;
    const perfilesPermitidos = btn.dataset.perfil;

    // El botón de logout siempre se muestra
    if (accion === "logout") {
      btn.style.display = "flex";
      return;
    }

    // Si el botón tiene data-perfil, verificar si el perfil actual está permitido
    if (perfilesPermitidos) {
      const perfiles = perfilesPermitidos.split(",").map(p => parseInt(p.trim()));
      if (perfiles.includes(perfil)) {
        btn.style.display = "flex";
      } else {
        btn.style.display = "none";
      }
    }
  });
}
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
