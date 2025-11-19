// ================================================
// Usuarios.js — Lista de usuarios en Firebase con control de roles
// ================================================
import { db, ref, onValue, auth } from "../firebaseConfig.js";
import { navigate } from "../app.js";

// Variable global para recordar la última vista
let lastView = "user";

// ================================================
// FUNCIÓN PRINCIPAL
// ================================================
export function showUsuarios(previousView = "user") {
  lastView = previousView;

  const root = document.getElementById("root");

  root.innerHTML = `
  <nav class="navbar navbar-expand-lg navbar-dark bg-dark shadow-sm sticky-top">
    <div class="container-fluid">
      <a class="navbar-brand fw-bold text-warning" href="#">👥 Usuarios</a>

      <button class="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#navUsuarios"
        aria-controls="navUsuarios" aria-expanded="false" aria-label="Toggle navigation">
        <span class="navbar-toggler-icon"></span>
      </button>

      <div class="collapse navbar-collapse" id="navUsuarios">
        <ul class="navbar-nav me-auto mb-2 mb-lg-0">
          <li class="nav-item"><button class="nav-link btn-link" data-view="user">🏠 Inicio</button></li>
          <li class="nav-item"><button class="nav-link btn-link" data-view="devices">💡 Dispositivos</button></li>
          <li class="nav-item"><button class="nav-link btn-link" data-view="graficos">📊 Gráficos</button></li>
          <li class="nav-item"><button class="nav-link btn-link" data-view="geolocalizacion">📍 Mapa</button></li>
        </ul>

        <div class="d-flex">
          <button id="back" class="btn btn-secondary btn-sm me-2">⬅️ Volver</button>
          <button id="themeToggle" class="btn btn-warning btn-sm me-2">🌙</button>
          <button class="btn btn-danger btn-sm logout">🚪 Cerrar Sesión</button>
        </div>
      </div>
    </div>
  </nav>

  <div class="container py-3">
    <h2>👥 Usuarios Registrados</h2>
    <div id="usuariosList" class="card p-3">Cargando usuarios...</div>
  </div>
  `;

  // ================================
  // 🔹 Navegación del Navbar
  // ================================
  document.querySelectorAll("button[data-view]").forEach(btn => {
    btn.addEventListener("click", () => navigate(btn.dataset.view));
  });

  // Botón volver
  document.getElementById("back").onclick = () => navigate(lastView);

  // Logout
  document.querySelector(".logout").onclick = async () => {
    await auth.signOut();
    navigate("login");
  };

  // ================================
  // 🔹 Manejo de tema claro/oscuro
  // ================================
  const themeBtn = document.getElementById("themeToggle");
  themeBtn.onclick = () => {
    document.body.classList.toggle("dark-mode");
    themeBtn.textContent =
      document.body.classList.contains("dark-mode") ? "🌞" : "🌙";
    localStorage.setItem(
      "theme",
      document.body.classList.contains("dark-mode") ? "dark" : "light"
    );
  };

  // Restaurar tema guardado
  if (localStorage.getItem("theme") === "dark") {
    document.body.classList.add("dark-mode");
    themeBtn.textContent = "🌞";
  }

  // ================================
  // 🔹 Obtener usuario autenticado
  // ================================
  let currentUser = null;

  auth.onAuthStateChanged((user) => {
    if (!user) return;

    const currentUserRef = ref(db, "usuarios/" + user.uid);
    onValue(currentUserRef, (snapshot) => {
      currentUser = snapshot.val();
      cargarUsuarios(currentUser);
    });
  });
}

// ================================================
// 🔹 FUNCIÓN PARA CARGAR USUARIOS DESDE FIREBASE
// ================================================
function cargarUsuarios(currentUser) {
  const usuariosRef = ref(db, "usuarios");

  onValue(usuariosRef, (snapshot) => {
    const data = snapshot.val();
    const cont = document.getElementById("usuariosList");

    if (!data) {
      cont.innerHTML = "<p>No hay usuarios registrados.</p>";
      return;
    }

    // Verificar permisos
    const esSuperUser = currentUser?.isSuperUser === true;

    cont.innerHTML = Object.entries(data)
      .map(([id, u]) => {
        const botonEliminar = esSuperUser
          ? `<button class="btn btn-danger btn-sm" data-id="${id}">🗑 Eliminar</button>`
          : `<button class="btn btn-danger btn-sm" disabled>🔒 Solo Superuser</button>`;

        return `
          <div class="border-bottom py-2 d-flex justify-content-between">
            <div>
              <p class="m-0"><b>👤 ${u.nombre}</b></p>
              <small>${u.email}</small>
              <br>
              <small>Tipo: ${u.tipoUsuario || "usuario"}</small>
            </div>
            <div>
              ${botonEliminar}
            </div>
          </div>
        `;
      })
      .join("");

    // ================================
    // 🔹 Acción eliminar usuario (solo superuser)
    // ================================
    if (esSuperUser) {
      document.querySelectorAll("button[data-id]").forEach(btn => {
        btn.onclick = () => eliminarUsuario(btn.dataset.id);
      });
    }
  });
}

// ================================================
// 🔹 FUNCIÓN ELIMINAR USUARIO (solo superuser)
// ================================================
function eliminarUsuario(uid) {
  if (!confirm("¿Seguro que deseas eliminar este usuario permanentemente?")) return;

  const userRef = ref(db, "usuarios/" + uid);

  import("https://www.gstatic.com/firebasejs/10.4.0/firebase-database.js")
    .then(({ remove }) => remove(userRef))
    .then(() => alert("Usuario eliminado correctamente"))
    .catch((err) => alert("Error al eliminar: " + err.message));
}
