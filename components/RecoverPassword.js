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

        <input id="emailRecover" type="email" placeholder="Correo electrónico" class="form-control mt-2" />

        <button id="btnRecover" class="btn-primary mt-3 w-100">Enviar enlace</button>

        <p id="message" class="mt-2 text-center"></p>

        <div class="links text-center mt-3">
          <p><a id="goLogin" href="#">Volver al inicio de sesión</a></p>
        </div>

        <footer class="login-footer text-center mt-4">© 2025 Minesafe 2</footer>
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
      await sendPasswordResetEmail(auth, email);
      messageEl.textContent = "Se ha enviado un enlace de recuperación a tu correo ✔";
      messageEl.style.color = "green";
      emailInput.value = "";
    } catch (error) {
      console.error("Error al enviar correo:", error);

      // Mostrar mensajes claros según el tipo de error
      switch (error.code) {
        case "auth/invalid-email":
          messageEl.textContent = "El correo ingresado no es válido.";
          break;
        case "auth/user-not-found":
          messageEl.textContent = "No se encontró una cuenta con ese correo.";
          break;
        case "auth/too-many-requests":
          messageEl.textContent = "Has enviado demasiadas solicitudes. Intenta más tarde.";
          break;
        default:
          messageEl.textContent = "Ocurrió un error al enviar el correo. Intenta nuevamente.";
      }

      messageEl.style.color = "red";
    }
  };
}
