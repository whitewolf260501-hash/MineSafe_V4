// ================================================
// RecoverPassword.js — Recuperar contraseña Minesafe
// ================================================
import { auth } from "../firebaseConfig.js";
import { sendPasswordResetEmail } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-auth.js";
import { navigate } from "../app.js";

export function showRecoverPassword() {
  const root = document.getElementById("root");

  root.innerHTML = `
    <div class="login-page">
      <div class="login-container">
        <h1>Recuperar contraseña</h1>
        <p class="subtitle">Ingresa tu correo electrónico y te enviaremos un enlace para restablecer tu contraseña.</p>

        <input id="emailRecover" type="email" placeholder="Correo electrónico" class="form-control" />

        <button id="btnRecover" class="btn-primary mt-3">Enviar enlace</button>
        <p id="message" class="mt-2"></p>

        <div class="links">
          <p><a id="goLogin" href="#">Volver al inicio de sesión</a></p>
        </div>

        <footer class="login-footer">© 2025 Minesafe 2</footer>
      </div>
    </div>
  `;

  const messageEl = document.getElementById("message");
  const emailInput = document.getElementById("emailRecover");

  // Navegar a login
  document.getElementById("goLogin").onclick = () => navigate("login");

  // Enviar enlace de recuperación
  document.getElementById("btnRecover").onclick = async () => {
    const email = emailInput.value.trim();

    if (!email) {
      messageEl.textContent = "Por favor, ingresa tu correo electrónico";
      messageEl.style.color = "red";
      return;
    }

    try {
      // Enviar correo sin reCAPTCHA
      await sendPasswordResetEmail(auth, email);

      messageEl.textContent = "Se ha enviado un enlace de recuperación a tu correo ✔";
      messageEl.style.color = "green";
      emailInput.value = "";
    } catch (error) {
      console.error("Error al enviar correo:", error);
      messageEl.textContent = "Error al enviar el correo: " + error.message;
      messageEl.style.color = "red";
    }
  };
}
