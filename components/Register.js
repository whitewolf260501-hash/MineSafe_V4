// components/Register.js
import { auth, firestore, db as realtimeDB } from "../firebaseConfig.js";
import { 
  createUserWithEmailAndPassword,
  sendEmailVerification
} from "https://www.gstatic.com/firebasejs/11.0.1/firebase-auth.js";
import { doc, setDoc } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-firestore.js";
import { ref, set } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-database.js";
import { navigate } from "../app.js";

export function showRegister() {
  const root = document.getElementById("root");

  root.innerHTML = `
    <div class="card glass animate-fade" style="max-width:380px;margin:auto;margin-top:40px;padding:25px;">
      <h2 class="text-primary">Registro de usuario</h2>

      <input id="nombre" placeholder="Nombre completo" type="text" class="form-control mt-2" />
      <input id="telefono" placeholder="Teléfono" type="text" class="form-control mt-2" />
      <input id="email" placeholder="Correo electrónico" type="email" class="form-control mt-2" />
      <input id="password" placeholder="Contraseña" type="password" class="form-control mt-2" />

      <button id="btnRegister" class="btn btn-primary w-100 mt-3">Registrar</button>
      <p id="message" class="mt-2"></p>

      <p class="mt-3">¿Ya tienes cuenta?
        <a id="goLogin" class="text-link">Iniciar sesión</a>
      </p>
    </div>
  `;

  const messageEl = document.getElementById("message");
  const emailInput = document.getElementById("email");
  const passwordInput = document.getElementById("password");

  // Navegar a Login
  document.getElementById("goLogin").onclick = () => navigate("login");

  // Validar formato de email
  function validarEmail(email) {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email.toLowerCase());
  }

  document.getElementById("btnRegister").onclick = async () => {
    const nombre = document.getElementById("nombre")?.value.trim() || "";
    const telefono = document.getElementById("telefono")?.value.trim() || "";
    const email = emailInput.value.trim();
    const password = passwordInput.value;

    // Validaciones
    if (!email || !validarEmail(email)) {
      messageEl.textContent = "Debe ingresar un correo válido.";
      messageEl.style.color = "red";
      return;
    }
    if (!password) {
      messageEl.textContent = "Debe ingresar una contraseña.";
      messageEl.style.color = "red";
      return;
    }

    let uid;
    try {
      const cred = await createUserWithEmailAndPassword(auth, email, password);
      uid = cred.user.uid;
      console.log("Usuario Auth creado:", uid);

      // Enviar correo de verificación
      await sendEmailVerification(cred.user);
      messageEl.textContent = "Se ha enviado un correo de verificación ✔ Confirma tu correo antes de iniciar sesión.";
      messageEl.style.color = "green";

    } catch (error) {
      console.error("Error Auth:", error);
      if (error.code === "auth/email-already-in-use") {
        messageEl.textContent = "Este correo ya está registrado. Intenta iniciar sesión o recuperar tu contraseña.";
        messageEl.style.color = "red";
      } else {
        messageEl.textContent = "Error al crear usuario: " + error.message;
        messageEl.style.color = "red";
      }
      return;
    }

    // Crear documento en Firestore
    try {
      const firestorePayload = {
        uid,
        email,
        nombre,
        telefono,
        empresa: "",
        cargo: "",
        isActive: true,
        isAdmin: false,
        isSuperUser: false,
        tipoUsuario: "usuario",
        createdAt: new Date().toISOString(),
      };
      await setDoc(doc(firestore, "users", uid), firestorePayload);
      console.log("Firestore OK");
    } catch (error) {
      console.error("Error Firestore:", error);
      messageEl.textContent += " ⚠ No se pudo guardar en Firestore.";
      messageEl.style.color = "orange";
    }

    // Guardar datos en Realtime Database
    try {
      const realtimePayload = {
        email,
        nombre,
        telefono,
        empresa: "",
        cargo: "",
        tipoUsuario: "usuario",
        isActive: true,
        createdAt: Date.now(),
      };
      await set(ref(realtimeDB, `usuarios/${uid}`), realtimePayload);
      console.log("RealtimeDB OK en 'usuarios'");
    } catch (error) {
      console.error("Error RealtimeDB:", error);
      messageEl.textContent += " ⚠ No se pudo guardar en Realtime Database.";
      messageEl.style.color = "orange";
    }

    // Limpiar inputs
    emailInput.value = "";
    passwordInput.value = "";
    document.getElementById("nombre").value = "";
    document.getElementById("telefono").value = "";
  };
}
