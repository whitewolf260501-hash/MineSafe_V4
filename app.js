// =====================================================
// app.js - Enrutador principal Minesafe 2
// =====================================================

import { auth, onAuthStateChanged } from "./firebaseConfig.js";
import { renderNavbar } from "./components/Navbar.js";

// Vistas
import { renderLogin } from "./views/login.js";
import { renderUser } from "./views/user.js";
import { renderEmpresa } from "./views/empresa.js";
import { renderDevices } from "./views/devices.js";

// Root donde se renderiza TODO
const root = document.getElementById("root");

// ====== Sistema de rutas ===================================
const routes = {
  login: renderLogin,
  user: renderUser,
  empresa: renderEmpresa,
  devices: renderDevices,
};

export function navigate(routeName) {
  if (!routes[routeName]) {
    console.error("Ruta no existe:", routeName);
    return;
  }

  // Si la ruta es login → NO Navbar
  if (routeName === "login") {
    document.body.innerHTML = "";
    document.body.appendChild(routes.login());
    return;
  }

  // Para rutas internas → Navbar + contenido
  renderAppLayout();
  routes[routeName](root);
}

// ====== Layout principal (Navbar + Root) ====================
function renderAppLayout() {
  document.body.innerHTML = "";

  // Header
  const header = document.createElement("header");
  header.innerHTML = `
    <div class="text-center py-3 bg-light shadow-sm">
      <h1 class="fw-bold">⚙️ Minesafe 2</h1>
      <div id="userStatus" class="text-muted small"></div>
    </div>
  `;
  document.body.appendChild(header);

  // Navbar
  document.body.appendChild(renderNavbar());

  // Root principal
  const main = document.createElement("main");
  main.id = "root";
  main.className = "mt-3";
  document.body.appendChild(main);

  // Footer
  const footer = document.createElement("footer");
  footer.className = "text-center py-4 text-muted small";
  footer.textContent = "© 2025 Minesafe 2";
  document.body.appendChild(footer);
}

// ========== Autenticación ================================
onAuthStateChanged(auth, (user) => {
  if (!user) {
    console.warn("Usuario NO autenticado. Enviando a login…");
    navigate("login");
    return;
  }

  console.log("Usuario autenticado:", user.email);

  // Una vez logeado → dashboard
  navigate("user");
});
