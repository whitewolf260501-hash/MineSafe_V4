// auth.js
import { auth } from "./firebaseConfig.js";
import { signInWithEmailAndPassword, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-auth.js";
import { isSuperUser } from "./roleManager.js";

const loginForm = document.getElementById("login-form");

if (loginForm) {
  loginForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const email = e.target.email.value;
    const password = e.target.password.value;

    try {
      await signInWithEmailAndPassword(auth, email, password);
      window.location.href = "dashboard.html";
    } catch (err) {
      alert("Error al iniciar sesión: " + err.message);
    }
  });
}

onAuthStateChanged(auth, (user) => {
  if (user) {
    console.log("Usuario activo:", user.email);
  } else {
    console.log("No hay usuario activo");
  }
});
