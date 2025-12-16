document.addEventListener("DOMContentLoaded", () => {
  const acciones = {
    pendientes: "visreportesad.ejs",
    completados: "visreportescompad.ejs",
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
