document.addEventListener("DOMContentLoaded", () => {
  const acciones = {
    ver: "/gestion-reportes",
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
