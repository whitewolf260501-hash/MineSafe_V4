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
      <p class="mt-3">¿Ya tienes cuenta?
        <a id="goLogin" class="text-link">Iniciar sesión</a>
      </p>
    </div>
  `;

  // Navegar a Login
  document.getElementById("goLogin").onclick = () => navigate("login");

  // Función para validar formato de email
  function validarEmail(email) {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email.toLowerCase());
  }

  document.getElementById("btnRegister").onclick = async () => {
    const nombre = document.getElementById("nombre")?.value.trim() || "";
    const telefono = document.getElementById("telefono")?.value.trim() || "";
    const email = document.getElementById("email")?.value.trim() || "";
    const password = document.getElementById("password")?.value || "";

    // Validaciones
    if (!email || !validarEmail(email)) {
      return alert("Debe ingresar un correo válido.");
    }
    if (!password) {
      return alert("Debe ingresar una contraseña.");
    }

    let uid;
    try {
      // Crear usuario en Firebase Auth
      const cred = await createUserWithEmailAndPassword(auth, email, password);
      uid = cred.user.uid;
      console.log("Usuario Auth creado:", uid);

      // Enviar correo de verificación
      await sendEmailVerification(cred.user);
      alert("Se ha enviado un correo de verificación. Confirma tu correo antes de iniciar sesión.");

    } catch (error) {
      console.error("Error Auth:", error);
      return alert("Error al crear usuario: " + error.message);
    }

    // Crear documento en Firestore (/users/{uid})
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
      alert("Usuario creado en Auth, pero no se pudo guardar en Firestore.");
    }

    // Guardar datos en Realtime Database (/usuarios/{uid})
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
      alert("Usuario creado en Auth, pero no se pudo guardar en Realtime Database.");
    }

    // Registro terminado
    navigate("login");
  };
}
