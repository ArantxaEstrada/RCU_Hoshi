

document.addEventListener("DOMContentLoaded", () => {
  const acciones = {
    agregar: "agregar.html",
    eliminar: "eliminar.html",
    editar: "editar.html",
    buscar: "buscar.html",
    volver: "../main.html"
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