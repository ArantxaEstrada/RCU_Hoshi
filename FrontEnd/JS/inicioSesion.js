
document.addEventListener("DOMContentLoaded", () => {
  const loginBtn = document.querySelector(".btn-login");

  if (loginBtn) {
    loginBtn.addEventListener("click", () => {
      window.location.href = "login.html";
    });
  }
});