
document.addEventListener("DOMContentLoaded", () => {
  const volverBtn = document.querySelector('[data-action="volver"]');
  if (volverBtn) {
    volverBtn.addEventListener("click", () => {
      window.location.href = "/main";
    });
  }
});
