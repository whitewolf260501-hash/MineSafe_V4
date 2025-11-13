// ================================================
// RecoverPassword.js — Recuperar contraseña Minesafe
// ================================================
import { auth } from "../firebaseConfig.js";
import { sendPasswordResetEmail } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-auth.js";
import { navigate } from "../app.js";

export function showRecoverPassword() {
  const root = document.getElementById("root");
  root.innerHTML = `
    <div class="card">
      <h2>Recuperar contraseña</h2>
      <p>Ingresa tu correo electrónico y te enviaremos un enlace para restablecer tu contraseña.</p>
      <input id="emailRecover" placeholder="Correo electrónico" type="email" />
      <button id="btnRecover" class="btn-primary">Enviar enlace</button>
      <p><a id="goLogin" href="#">Volver al inicio de sesión</a></p>
    </div>
  `;

  document.getElementById("goLogin").onclick = () => navigate("login");

  document.getElementById("btnRecover").onclick = async () => {
    const email = document.getElementById("emailRecover").value.trim();

    if (!email) {
      alert("Por favor, ingresa tu correo electrónico");
      return;
    }

    try {
      await sendPasswordResetEmail(auth, email);
      alert("Se ha enviado un enlace de recuperación a tu correo.");
      navigate("login");
    } catch (error) {
      alert("Error al enviar el correo: " + error.message);
    }
  };
}
