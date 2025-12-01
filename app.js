// ================================================ 
// app.js — Navegación principal con navbar global estilizada
// ================================================
import { showLogin } from "./components/Login.js";
import { showRegister } from "./components/Register.js";
import { showUserDashboard } from "./components/UserDashboard.js";
import { showAdminDashboard } from "./components/AdminDashboard.js";
import { showAlerts } from "./components/AlertsView.js";
import { showDevices } from "./components/DeviceView.js";
import { showUserForm } from "./components/UserForm.js";
import { showTipoMinaForm } from "./components/TipoMinaForm.js";
import { showGeoEmpresaForm } from "./components/GeoEmpresaForm.js";
import { showPagina1 } from "./components/Pagina1.js";
import { showPagina2 } from "./components/Pagina2.js";
import { showUsuarios } from "./components/Usuarios.js";
import { showGraficos } from "./components/Graficos.js";
import { showGeolocalizacion } from "./components/Geolocalizacion.js";
import { showHistoryManagerPage } from "./components/historyManager.js";
import { showRecoverPassword } from "./components/RecoverPassword.js";
import { renderNavbar } from "./components/navbar.js";
import { auth } from "./firebaseConfig.js";

import { showDatoDelUsuario } from "./components/DatoDelUsuario.js";

// ==== carga opcional ====
let showAllDevicesFunc = null;

try {
  const module = await import("./components/deviceHistory.js");
  showAllDevicesFunc = module.showAllDevices;
} catch (error) {
  console.warn("⚠️ No se pudo cargar deviceHistory.js:", error);
}

const root = document.getElementById("root");

// =============================================
// Función principal de navegación
// =============================================
export function navigate(view) {

  const header = document.querySelector("header");
  const footer = document.querySelector("footer");

  root.innerHTML = "";

  // ===== VISTAS SIN NAVBAR =====
  if (["login", "register", "recoverPassword"].includes(view)) {

    header.classList.remove("hidden");
    footer.classList.add("hidden");

    if (view === "login") showLogin();
    if (view === "register") showRegister();
    if (view === "recoverPassword") showRecoverPassword();

    return;
  }

  // ===== VISTAS CON NAVBAR =====
  header.classList.add("hidden");
  footer.classList.remove("hidden");

  const navbar = renderNavbar();
  root.appendChild(navbar);

  const content = document.createElement("div");
  content.className = "page-content";
  root.appendChild(content);

  switch (view) {
    case "user":
      showUserDashboard();
      break;

    case "admin":
      showAdminDashboard();
      break;

    case "alerts":
      showAlerts();
      break;

    case "devices":
      showDevices();
      break;

    case "userform":
      showUserForm();
      break;

    case "tipomina":
      showTipoMinaForm();
      break;

    case "geoempresa":
      showGeoEmpresaForm();
      break;

    case "geominaempresa":
      import("./components/GeoMinaEmpresaDashboard.js")
        .then(m => m.showGeoMinaEmpresaDashboard())
        .catch(err => console.error(err));
      break;

    case "datosdelusuario":
      showDatoDelUsuario();
      break;

    case "usuarios":
      showUsuarios();
      break;

    case "graficos":
      showGraficos();
      break;

    case "geolocalizacion":
      showGeolocalizacion();
      break;

    case "pagina1":
      showPagina1();
      break;

    case "pagina2":
      showPagina2();
      break;

    case "history":
      if (showAllDevicesFunc) showAllDevicesFunc();
      else content.innerHTML = "<p>⚠️ Historial no disponible.</p>";
      break;

    case "manager":
      showHistoryManagerPage();
      break;

    default:
      showLogin();
  }
}

// =============================================
// Arranque
// =============================================
navigate("login");
