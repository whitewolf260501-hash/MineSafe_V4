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
import { auth, onAuthStateChanged } from "./firebaseConfig.js";

// Nuevas vistas
import { showContractManager } from "./views/ContractManager.js";
import { showUserContracts } from "./views/UserContracts.js";
import { showContractPayments } from "./views/ContractPayments.js";
import { showDeviceRentStatus } from "./views/DeviceRentStatus.js";
import { showDatoDelUsuario } from "./components/DatoDelUsuario.js";

let showAllDevicesFunc = null;

async function loadDeviceHistory() {
  if (!showAllDevicesFunc) {
    try {
      const module = await import("./components/deviceHistory.js");
      showAllDevicesFunc = module.showAllDevices;
    } catch (err) {
      console.warn("⚠️ No se pudo cargar deviceHistory.js:", err);
    }
  }
}

const root = document.getElementById("root");

export async function navigate(view) {
  root.innerHTML = "";

  const header = document.querySelector("header");

  // Login, Registro y Recuperar → sin navbar
  if (["login", "register", "recoverPassword"].includes(view)) {
    if (header) header.style.display = "flex";
    if (view === "login") showLogin();
    if (view === "register") showRegister();
    if (view === "recoverPassword") showRecoverPassword();
    return;
  }

  // Oculta header y muestra navbar
  if (header) header.style.display = "none";
  const navbar = renderNavbar();
  root.appendChild(navbar);

  const content = document.createElement("div");
  content.className = "page-content";
  root.appendChild(content);

  switch (view) {
    case "user": showUserDashboard(); break;
    case "admin": showAdminDashboard(); break;
    case "alerts": showAlerts(); break;
    case "devices": showDevices(); break;
    case "userform": showUserForm(); break;
    case "tipomina": showTipoMinaForm(); break;
    case "geoempresa": showGeoEmpresaForm(); break;

    case "contractsAdmin": showContractManager(); break;
    case "myContracts": showUserContracts(); break;
    case "contractPayments": showContractPayments(); break;
    case "deviceRentStatus": showDeviceRentStatus(); break;

    case "geominaempresa":
      import("./components/GeoMinaEmpresaDashboard.js")
        .then(module => module.showGeoMinaEmpresaDashboard())
        .catch(err => console.error("Error cargando GeoMinaEmpresaDashboard:", err));
      break;
    case "datosdelusuario": showDatoDelUsuario(); break;
    case "usuarios": showUsuarios(); break;
    case "graficos": showGraficos(); break;
    case "geolocalizacion": showGeolocalizacion(); break;
    case "pagina1": showPagina1(); break;
    case "pagina2": showPagina2(); break;
    case "history":
      await loadDeviceHistory();
      showAllDevicesFunc
        ? showAllDevicesFunc()
        : (content.innerHTML = "<p>⚠️ Historial no disponible.</p>");
      break;
    case "manager": showHistoryManagerPage(); break;
    default: showLogin();
  }
}

// ===================
// Inicializar app según auth
// ===================
onAuthStateChanged(auth, (user) => {
  if (user) {
    // Usuario logueado → mostrar dashboard
    navigate("user");
  } else {
    // No logueado → mostrar login
    navigate("login");
  }
});
