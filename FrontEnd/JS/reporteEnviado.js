
document.addEventListener("DOMContentLoaded", () => {
  const volverBtn = document.querySelector(".btn-enviar");
  if (volverBtn) {
    volverBtn.addEventListener("click", () => {
      window.location.href = "main.html";
    });
  }
});