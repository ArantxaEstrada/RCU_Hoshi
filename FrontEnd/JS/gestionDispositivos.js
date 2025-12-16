document.addEventListener("DOMContentLoaded", () => {
  const acciones = {
    agregar: "agregar.ejs",
    eliminar: "eliminar.ejs",
    editar: "editar.ejs",
    informe: "informe.ejs",
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
