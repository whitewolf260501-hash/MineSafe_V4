// components/Login.js
import { auth, firestore } from "../firebaseConfig.js";
import { signInWithEmailAndPassword, signOut } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-auth.js";
import { doc, getDoc } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-firestore.js";
import { navigate } from "../app.js";

export function showLogin() {
  const root = document.getElementById("root");
  root.innerHTML = `
    <div class="login-page">
      <div class="login-container">
        <h1>Iniciar Sesión</h1>
        <p class="subtitle">Bienvenido a <strong>Minesafe 2</strong></p>

        <input id="email" type="email" placeholder="Correo electrónico" />
        <input id="password" type="password" placeholder="Contraseña" />

        <button id="btnLogin" class="btn-primary">Entrar</button>

        <div class="links">
          <a id="forgotPassword" href="#">¿Olvidaste tu contraseña?</a>
          <p>¿No tienes cuenta? <a id="goRegister" href="#">Regístrate</a></p>
        </div>

        <footer class="login-footer">© 2025 Minesafe 2</footer>
      </div>
    </div>
  `;

  // Navegación
  document.getElementById("goRegister").onclick = () => navigate("register");
  document.getElementById("forgotPassword").onclick = () => navigate("recoverPassword");

  // Login
  document.getElementById("btnLogin").onclick = async () => {
    const email = document.getElementById("email").value.trim();
    const password = document.getElementById("password").value.trim();

    if (!email || !password) {
      alert("Por favor completa ambos campos");
      return;
    }

    try {
      // Iniciar sesión
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const uid = userCredential.user.uid;

      // Verificar si el usuario está activo en Firestore
      const snap = await getDoc(doc(firestore, "users", uid));
      if (!snap.exists()) {
        alert("❌ Usuario no registrado en la base de datos.");
        await signOut(auth);
        return;
      }

      const data = snap.data();

      if (data.isActive === false) {
        alert("❌ Tu cuenta está desactivada. Contacta a un administrador.");
        await signOut(auth);
        return;
      }

      // Redirección según rol
      if (data.isSuperUser || data.isAdmin) navigate("admin");
      else navigate("user");

    } catch (error) {
      alert("Error al iniciar sesión: " + error.message);
    }
  };
}
