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

// Nuevas vistas (contratos / arriendos)
import { showContractManager } from "./views/ContractManager.js";
import { showUserContracts } from "./views/UserContracts.js";
import { showContractPayments } from "./views/ContractPayments.js";
import { showDeviceRentStatus } from "./views/DeviceRentStatus.js";
import { showDatoDelUsuario } from "./components/DatoDelUsuario.js";

let showAllDevicesFunc = null;
try {
  const module = await import("./components/deviceHistory.js");
  showAllDevicesFunc = module.showAllDevices;
} catch (error) {
  console.warn("⚠️ No se pudo cargar deviceHistory.js:", error);
}

const root = document.getElementById("root");
const header = document.querySelector("header");

// ==================== FUNCIÓN DE NAVEGACIÓN ====================
export function navigate(view) {
  root.innerHTML = "";

  // Login, Registro y Recuperar → sin navbar
  if (["login", "register", "recoverPassword"].includes(view)) {
    if (header) header.style.display = "flex";
    if (view === "login") showLogin();
    if (view === "register") showRegister();
    if (view === "recoverPassword") showRecoverPassword();
    return;
  }

  // Dashboard y demás vistas → ocultar header y renderizar navbar
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

    // Nuevas vistas de arriendos/contratos
    case "contractManager": showContractManager(); break;
    case "userContracts": showUserContracts(); break;
    case "contractPayments": showContractPayments(); break;
    case "deviceRentStatus": showDeviceRentStatus(); break;

    // Otras vistas existentes
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
      showAllDevicesFunc
        ? showAllDevicesFunc()
        : (content.innerHTML = "<p>⚠️ Historial no disponible.</p>");
      break;
    case "manager": showHistoryManagerPage(); break;
    default: showLogin();
  }
}

// ==================== AUTENTICACIÓN ====================
onAuthStateChanged(auth, (user) => {
  const status = document.getElementById("userStatus");

  if (user) {
    if (status) status.textContent = `Bienvenido, ${user.email}`;
    navigate("user"); // Muestra dashboard si está autenticado
  } else {
    if (status) status.textContent = "Usuario no autenticado";
    navigate("login"); // Muestra login si no hay usuario
  }
});
