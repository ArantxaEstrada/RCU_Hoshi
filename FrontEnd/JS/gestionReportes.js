document.addEventListener("DOMContentLoaded", () => {
  const acciones = {
    pendientes: "/reportes-pendientes",
    completados: "/reportes-completados",
    volver: "/main"
  };

  document.querySelectorAll(".btn-action").forEach((btn) => {
    btn.addEventListener("click", () => {
      const action = btn.dataset.action;
      if (acciones[action]) {
        window.location.href = acciones[action];
      }
    });
  });
});

