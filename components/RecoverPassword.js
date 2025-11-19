// ================================================
// RecoverPassword.js — Recuperar contraseña Minesafe
// ================================================
import { auth } from "../firebaseConfig.js";
import { sendPasswordResetEmail, RecaptchaVerifier } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-auth.js";
import { navigate } from "../app.js";

export function showRecoverPassword() {
  const root = document.getElementById("root");
  root.innerHTML = `
    <div class="card">
      <h2>Recuperar contraseña</h2>
      <p>Ingresa tu correo electrónico y te enviaremos un enlace para restablecer tu contraseña.</p>
      <input id="emailRecover" placeholder="Correo electrónico" type="email" class="form-control mt-2" />
      
      <!-- reCAPTCHA visible -->
      <div id="recaptcha-container" class="mt-2 mb-2"></div>
      
      <button id="btnRecover" class="btn-primary mt-2">Enviar enlace</button>
      <p><a id="goLogin" href="#">Volver al inicio de sesión</a></p>
    </div>
  `;

  document.getElementById("goLogin").onclick = () => navigate("login");

  // Inicializar reCAPTCHA visible
  window.recaptchaVerifier = new RecaptchaVerifier(
    "recaptcha-container",
    {
      size: "normal", // checkbox visible
      callback: (response) => {
        console.log("reCAPTCHA verificado:", response);
      },
      "expired-callback": () => {
        console.warn("reCAPTCHA expirado, por favor verifica nuevamente.");
      }
    },
    auth
  );

  document.getElementById("btnRecover").onclick = async () => {
    const email = document.getElementById("emailRecover").value.trim();

    if (!email) {
      alert("Por favor, ingresa tu correo electrónico");
      return;
    }

    try {
      // Llamar a sendPasswordResetEmail con reCAPTCHA ya inicializado
      await sendPasswordResetEmail(auth, email, {
        // Pass the recaptchaVerifier here
        recaptchaVerifier: window.recaptchaVerifier
      });
      alert("Se ha enviado un enlace de recuperación a tu correo.");
      navigate("login");
    } catch (error) {
      console.error("Error al enviar correo:", error);
      alert("Error al enviar el correo: " + error.message);
    }
  };
}
