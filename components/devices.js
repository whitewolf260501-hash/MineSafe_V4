// ================================================
// Devices.js — Gestión de Usuario y Tipos de Mina
// ================================================

import {
  auth,
  db,
  firestore,
  ref,
  onValue,
  remove,
  get,
  onAuthStateChanged
} from "../firebaseConfig.js";

import {
  doc,
  setDoc,
  deleteDoc,
  onSnapshot
} from "https://www.gstatic.com/firebasejs/11.0.1/firebase-firestore.js";

import { update } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-database.js";
import { navigate } from "../app.js";


// ================================================
// FUNCIÓN PRINCIPAL: DASHBOARD DE USUARIO
// ================================================
export function showUserDashboard() {
  const root = document.getElementById("root");

  root.innerHTML = `
  <!-- ============================================
       BARRA DE NAVEGACIÓN TIPO ACORDEÓN
       ============================================ -->
  <nav class="navbar navbar-dark bg-dark p-2">
    <div class="container-fluid d-flex flex-column">
      <a class="navbar-brand fw-bold mb-2" href="#">Minesafe 2</a>

      <div class="accordion" id="navbarAccordion">
        <!-- Dashboard -->
        <div class="accordion-item bg-dark border-0">
          <h2 class="accordion-header" id="headingDashboard">
            <button class="accordion-button collapsed bg-dark text-white" type="button" data-bs-toggle="collapse" data-bs-target="#collapseDashboard">
              🏠 Dashboard
            </button>
          </h2>
          <div id="collapseDashboard" class="accordion-collapse collapse" data-bs-parent="#navbarAccordion">
            <div class="accordion-body p-1">
              <button class="btn btn-sm btn-outline-primary w-100 mb-1" id="navDashboard">Inicio</button>
            </div>
          </div>
        </div>

        <!-- Dispositivos -->
        <div class="accordion-item bg-dark border-0">
          <h2 class="accordion-header" id="headingDevices">
            <button class="accordion-button collapsed bg-dark text-white" type="button" data-bs-toggle="collapse" data-bs-target="#collapseDevices">
              💡 Dispositivos
            </button>
          </h2>
          <div id="collapseDevices" class="accordion-collapse collapse" data-bs-parent="#navbarAccordion">
            <div class="accordion-body p-1">
              <button class="btn btn-sm btn-outline-primary w-100 mb-1" id="navDevices">Ver Dispositivos</button>
              <button class="btn btn-sm btn-outline-primary w-100 mb-1" id="navHistorialCompleto">Historial Completo</button>
              <button class="btn btn-sm btn-outline-primary w-100 mb-1" id="navHistorialManage">Gestión de Historial</button>
            </div>
          </div>
        </div>

        <!-- Formularios -->
        <div class="accordion-item bg-dark border-0">
          <h2 class="accordion-header" id="headingForms">
            <button class="accordion-button collapsed bg-dark text-white" type="button" data-bs-toggle="collapse" data-bs-target="#collapseForms">
              👤 Formularios
            </button>
          </h2>
          <div id="collapseForms" class="accordion-collapse collapse" data-bs-parent="#navbarAccordion">
            <div class="accordion-body p-1">
              <button class="btn btn-sm btn-outline-success w-100 mb-1" id="navUserForm">Datos Personales</button>
              <button class="btn btn-sm btn-outline-success w-100 mb-1" id="navTipoMina">Tipo de Mina</button>
              <button class="btn btn-sm btn-outline-success w-100 mb-1" id="navGeoEmpresa">Geo / Empresa</button>
            </div>
          </div>
        </div>

        <!-- Admin / Otros -->
        <div class="accordion-item bg-dark border-0">
          <h2 class="accordion-header" id="headingAdmin">
            <button class="accordion-button collapsed bg-dark text-white" type="button" data-bs-toggle="collapse" data-bs-target="#collapseAdmin">
              🛠️ Administración
            </button>
          </h2>
          <div id="collapseAdmin" class="accordion-collapse collapse" data-bs-parent="#navbarAccordion">
            <div class="accordion-body p-1">
              <button class="btn btn-sm btn-outline-warning w-100 mb-1" id="navAdmin">Panel Admin</button>
              <button class="btn btn-sm btn-outline-warning w-100 mb-1" id="navUsuarios">Usuarios</button>
              <button class="btn btn-sm btn-outline-warning w-100 mb-1" id="navGraficos">Gráficos</button>
              <button class="btn btn-sm btn-outline-warning w-100 mb-1" id="navGeolocalizacion">Mapa</button>
            </div>
          </div>
        </div>

      </div>

      <!-- Botón de cierre de sesión -->
      <button class="btn btn-danger mt-2 w-100" id="logout">Cerrar Sesión</button>
  </nav>


    <!-- ============================================
         CONTENIDO PRINCIPAL DEL DASHBOARD
         ============================================ -->
    <div class="dashboard container mt-4">
      <h2>Perfil del Usuario</h2>
      <div id="userProfile" class="card p-3 mb-3"></div>

      <!-- Formulario para editar datos -->
      <h3>Editar Datos del Usuario</h3>
      <form id="editForm" class="card p-3">
        <h4>Datos Personales</h4>
        <label>Nombre:</label><input type="text" id="nombre" placeholder="Nombre completo" class="form-control mb-2" />
        <label>Teléfono:</label><input type="text" id="telefono" placeholder="Teléfono" class="form-control mb-2" />
        <label>Dirección:</label><input type="text" id="direccion" placeholder="Dirección" class="form-control mb-2" />
        <label>ID del Dispositivo:</label><input type="text" id="deviceId" placeholder="Ej: device_38A839E81F84" class="form-control mb-2" />

        <h4>Tipo de Mina</h4>
        <select id="tipoMina" class="form-select mb-3">
          <option value="">Seleccione tipo...</option>
          <option value="subterranea">⛏️ Subterránea</option>
          <option value="tajo_abierto">🪨 Tajo Abierto</option>
          <option value="aluvial">💧 Aluvial</option>
          <option value="cantera">🏗️ Cantera</option>
          <option value="pirquen">🧰 Pirquén</option>
        </select>

        <!-- Campos adicionales según tipo de mina -->
        <div id="camposMina" class="mb-3"></div>

        <h4>Datos Geográficos / Empresariales</h4>
        <label>País:</label><input type="text" id="geoPais" placeholder="País" class="form-control mb-2" />
        <label>Región:</label><input type="text" id="geoRegion" placeholder="Región" class="form-control mb-2" />
        <label>Comuna:</label><input type="text" id="geoComuna" placeholder="Comuna" class="form-control mb-2" />
        <label>Nombre de la mina:</label><input type="text" id="geoMina" placeholder="Nombre de la mina" class="form-control mb-2" />
        <label>Nombre de la empresa:</label><input type="text" id="geoEmpresa" placeholder="Nombre de la empresa" class="form-control mb-2" />

        <!-- Botones del formulario -->
        <div class="d-flex justify-content-between mt-3">
          <button type="submit" class="btn btn-success">💾 Guardar Cambios</button>
          <button type="button" id="deleteUser" class="btn btn-danger">🗑️ Borrar Usuario</button>
        </div>
      </form>

      <!-- Dispositivo asignado -->
      <h3 class="mt-4">Dispositivo Asignado</h3>
      <div id="deviceData" class="card p-3">Cargando dispositivo...</div>
    </div>
  `;


  // ============================================
  // EVENTOS DE LA NAVBAR (RUTAS)
  // ============================================
  // Nuevas ventanas
  document.getElementById("navUsuarios").onclick = () => navigate("usuarios");
  document.getElementById("navGraficos").onclick = () => navigate("graficos");
  document.getElementById("navGeolocalizacion").onclick = () => navigate("geolocalizacion");

  // Dashboard principal
  document.getElementById("navDashboard").onclick = () => navigate("dashboard");

  // Dispositivos
  document.getElementById("navDevices").onclick = () => navigate("devices");

  // 🔹 NUEVO: Ir al historial completo del dispositivo
  document.getElementById("navHistorialCompleto").onclick = async () => {
    try {
      const user = auth.currentUser;
      if (!user) return alert("No hay usuario autenticado.");
      const userSnap = await get(ref(db, `usuarios/${user.uid}`));
      const userData = userSnap.val();
      if (userData && userData.deviceId) {
        showHistoricalPage(userData.deviceId);
      } else {
        alert("Este usuario no tiene un dispositivo asignado.");
      }
    } catch (err) {
      console.error("Error al abrir historial completo:", err);
    }
  };

  // 🔹 NUEVO: Abrir ventana Historial Manage (por ejemplo global)
  document.getElementById("navHistorialManage").onclick = () => {
    if (typeof showHistoryUtilsPage === "function") {
      showHistoryUtilsPage(); // abrir ventana de gestión de historiales
    } else {
      alert("⚠️ La función 'showHistoryUtilsPage()' aún no está implementada.");
    }
  };

  // Formularios
  document.getElementById("navUserForm").onclick = () => navigate("userform");
  document.getElementById("navTipoMina").onclick = () => navigate("tipomina");
  document.getElementById("navGeoEmpresa").onclick = () => navigate("geoempresa");

  // Panel admin
  document.getElementById("navAdmin").onclick = () => navigate("admin");

  // Cerrar sesión
  document.getElementById("logout").onclick = async () => {
    await auth.signOut();
    navigate("login");
  };


  // ============================================
  // EVENTOS DE FORMULARIO (render dinámico por tipo de mina)
  // ============================================

  const tipoSelect = document.getElementById("tipoMina");
  const camposMinaDiv = document.getElementById("camposMina");

  function renderCampos(tipo) {
    let html = "";
    switch (tipo) {
      case "subterranea":
        html = `
          <label>Zona:</label><input id="zona" class="form-control mb-2" placeholder="Zona" />
          <label>Rampa:</label><input id="rampa" class="form-control mb-2" placeholder="Rampa" />
          <label>Galería:</label><input id="galeria" class="form-control mb-2" placeholder="Galería" />
          <label>Sector:</label><input id="sector" class="form-control mb-2" placeholder="Sector" />
        `;
        break;
      case "tajo_abierto":
        html = `
          <label>Banco:</label><input id="banco" class="form-control mb-2" placeholder="Banco" />
          <label>Fase:</label><input id="fase" class="form-control mb-2" placeholder="Fase" />
          <label>Frente:</label><input id="frente" class="form-control mb-2" placeholder="Frente" />
        `;
        break;
      default:
        html = "";
    }
    camposMinaDiv.innerHTML = html;
  }
  tipoSelect.addEventListener("change", (e) => renderCampos(e.target.value));


  // ============================================
  // AUTENTICACIÓN Y DATOS DE USUARIO
  // ============================================
  onAuthStateChanged(auth, async (user) => {
    if (!user) return root.innerHTML = "<p>No hay usuario autenticado.</p>";

    const userId = user.uid;
    const userEmail = user.email;
    const userDocRef = doc(firestore, "users", userId);

    // Escucha los cambios del documento en Firestore en tiempo real
    onSnapshot(userDocRef, (snap) => {
      const data = snap.exists() ? snap.data() : {};
      document.getElementById("userProfile").innerHTML = `
        <p><b>Nombre:</b> ${data.nombre || "-"}</p>
        <p><b>Email:</b> ${userEmail}</p>
        <p><b>Rol:</b> ${data.isAdmin ? "Administrador" : "Usuario"}</p>
      `;
      tipoSelect.value = data.tipoMina || "";
      renderCampos(tipoSelect.value);
    });

    // --- Guardar datos del usuario ---
    document.getElementById("editForm").onsubmit = async (e) => {
      e.preventDefault();
      const tipoMina = tipoSelect.value;
      const updatedData = {
        nombre: document.getElementById("nombre").value.trim(),
        telefono: document.getElementById("telefono").value.trim(),
        direccion: document.getElementById("direccion").value.trim(),
        deviceId: document.getElementById("deviceId").value.trim(),
        tipoMina,
        geoPais: document.getElementById("geoPais").value.trim(),
        geoRegion: document.getElementById("geoRegion").value.trim(),
        geoComuna: document.getElementById("geoComuna").value.trim(),
        geoMina: document.getElementById("geoMina").value.trim(),
        geoEmpresa: document.getElementById("geoEmpresa").value.trim(),
        updatedAt: new Date().toISOString()
      };
      try {
        await setDoc(userDocRef, updatedData, { merge: true });
        await update(ref(db, `usuarios/${userId}`), updatedData);
        alert("✅ Datos guardados correctamente");
      } catch (err) {
        alert("❌ Error al guardar: " + err.message);
      }
    };

    // --- Eliminar usuario ---
    document.getElementById("deleteUser").onclick = async () => {
      if (!confirm("¿Eliminar usuario permanentemente?")) return;
      try {
        await deleteDoc(userDocRef);
        await remove(ref(db, `usuarios/${userId}`));
        alert("🗑️ Usuario eliminado");
        navigate("login");
      } catch (err) {
        alert("❌ Error al eliminar: " + err.message);
      }
    };
  });
}


    // Mostrar datos del dispositivo
    function mostrarDatosDispositivo(deviceId, container = document.getElementById("deviceData")) {
      const deviceRef = ref(db, `dispositivos/${deviceId}`);
      onValue(deviceRef, (snapshot) => {
        const d = snapshot.val();
        if (!d) return (container.innerHTML = `<p>No se encontró el dispositivo <b>${deviceId}</b></p>`);
        container.innerHTML = `
          <p><b>ID:</b> ${deviceId}</p>
          <p><b>Nombre:</b> ${d.name || "Desconocido"}</p>
          <p><b>Usuario:</b> ${d.userEmail || "Sin asignar"}</p>
          <p><b>Latitud:</b> ${d.latitude ?? 0}</p>
          <p><b>Longitud:</b> ${d.longitude ?? 0}</p>
          <p><b>Altitud (m):</b> ${d.altitude ?? 0}</p>
          <p><b>Precisión (m):</b> ${d.precision ?? 0}</p>
          <button id="verHistorialBtn2">📜 Ver historial completo</button>
        `;
        document.getElementById("verHistorialBtn2").onclick = () => showHistoricalPage(deviceId);
      });
    }
 
// ================================================
// Resto de funciones de dispositivos, historial y exportación
// ================================================
// Puedes reutilizar funciones existentes: showHistoricalPage(deviceId), showHistoryUtilsPage(), etc.


// ================================================
// DISPOSITIVOS
// ================================================
export function showDevices() {
  const root = document.getElementById("root");
  root.innerHTML = `y
    <div class="dashboard">
      <h2>Dispositivo Asignado</h2>
      <div id="deviceData" class="deviceDetails">Cargando dispositivo...</div>
      <div class="actions">
        <button id="verTodosBtn">Ver todos los dispositivos</button>
        <button id="nuevoBtnDispositivo">✨ Nuevo Botón</button>
      </div>
    </div>
  `;

  document.getElementById("verTodosBtn").onclick = () => showAllDevices();
  document.getElementById("nuevoBtnDispositivo").onclick = () => showNewHistoryPage();

  onAuthStateChanged(auth, (user) => {
    if (!user) return (document.getElementById("deviceData").innerHTML = "<p>No hay usuario autenticado.</p>");

    const userRef = ref(db, `usuarios/${user.uid}`);
    onValue(userRef, (snapshot) => {
      const userData = snapshot.val();
      if (!userData || !userData.deviceId)
        return (document.getElementById("deviceData").innerHTML = "<p>No tienes dispositivos asignados.</p>");
      mostrarDatosDispositivo(userData.deviceId, document.getElementById("deviceData"));
    });
  });
}

// ================================================
// FUNCIONES DE DISPOSITIVOS E HISTORIALES
// ================================================
function mostrarDatosDispositivo(deviceId, container) {
  const deviceRef = ref(db, `dispositivos/${deviceId}`);
  onValue(deviceRef, (snapshot) => {
    const d = snapshot.val();
    if (!d) return (container.innerHTML = `<p>No se encontró el dispositivo: <b>${deviceId}</b></p>`);

    container.innerHTML = `
      <p><b>ID:</b> ${deviceId}</p>
      <p><b>Nombre:</b> ${d.name || "Desconocido"}</p>
      <p><b>Usuario:</b> ${d.userEmail || "Sin asignar"}</p>
      <p>CO: ${d.CO ?? 0} ppm</p>
      <p>CO₂: ${d.CO2 ?? 0} ppm</p>
      <p>PM10: ${d.PM10 ?? 0} µg/m³</p>
      <p>PM2.5: ${d.PM2_5 ?? 0} µg/m³</p>
      <p>Humedad: ${d.humedad ?? 0}%</p>
      <p>Temperatura: ${d.temperatura ?? 0} °C</p>
      <h4>📜 Últimos registros históricos</h4>
      <div id="historialCarrusel" class="historialCarrusel">Cargando...</div>
      <button id="verHistorialCompletoBtn">📄 Ver historial completo</button>
    `;
    mostrarHistorialCarrusel(deviceId);
    document.getElementById("verHistorialCompletoBtn").onclick = () => showHistoricalPage(deviceId);
  });
}

function mostrarHistorialCarrusel(deviceId) {
  const historialRef = ref(db, `dispositivos/${deviceId}/historial`);
  onValue(historialRef, (snapshot) => {
    const historial = snapshot.val();
    const carrusel = document.getElementById("historialCarrusel");
    carrusel.innerHTML = "";

    if (!historial) return (carrusel.innerHTML = "<p>No hay datos históricos.</p>");

    Object.entries(historial)
      .sort((a, b) => parseInt(b[0]) - parseInt(a[0]))
      .slice(0, 12)
      .forEach(([ts, datos]) => {
        const card = document.createElement("div");
        card.className = "historialCard";
        card.innerHTML = `
          <p><b>${new Date(parseInt(ts)).toLocaleString()}</b></p>
          <p>CO: ${datos.CO ?? "—"} ppm</p>
          <p>CO₂: ${datos.CO2 ?? "—"} ppm</p>
          <p>PM10: ${datos.PM10 ?? "—"} µg/m³</p>
          <p>PM2.5: ${datos.PM2_5 ?? "—"} µg/m³</p>
          <p>Humedad: ${datos.humedad ?? "—"}%</p>
          <p>Temperatura: ${datos.temperatura ?? "—"} °C</p>
        `;
        carrusel.appendChild(card);
      });
  });
}

// ================================================
// TODOS LOS DISPOSITIVOS
// ================================================
export function showAllDevices() {
  const root = document.getElementById("root");
  root.innerHTML = `
    <div class="dashboard">
      <h2>Todos los Dispositivos</h2>
      <div id="deviceList">Cargando dispositivos...</div>
      <button id="backBtn">Volver</button>
    </div>
  `;
  document.getElementById("backBtn").onclick = () => showDevices();

  const devicesRef = ref(db, "dispositivos");
  onValue(devicesRef, (snapshot) => {
    const devices = snapshot.val();
    const listDiv = document.getElementById("deviceList");
    if (!devices) return (listDiv.innerHTML = "<p>No hay dispositivos en la base de datos.</p>");
    listDiv.innerHTML = "<ul>";
    for (const id in devices) {
      const name = devices[id].name || `Dispositivo ${id}`;
      listDiv.innerHTML += `
        <li>${name} (ID: ${id})
          <button onclick="showHistoricalPage('${id}')">📜 Ver historial</button>
        </li>`;
    }
    listDiv.innerHTML += "</ul>";
  });
}

// ================================================
// HISTORIAL COMPLETO Y EXPORTACIÓN EXCEL
// ================================================
// ================================================
// HISTORIAL COMPLETO Y EXPORTACIÓN EXCEL
// ================================================
export function showHistoricalPage(deviceId) {
  const root = document.getElementById("root");
  root.innerHTML = `
    <div class="dashboard">
      <h2>Historial Completo del Dispositivo</h2>
      <p><b>ID:</b> ${deviceId}</p>
      <div class="actions">
        <button id="exportExcelBtn" disabled>💾 Exportar a Excel</button>
        <button id="backToDeviceBtn">Volver</button>
      </div>
      <h3>Historial del dispositivo</h3>
      <div id="historialContainer" class="historialGrid">Cargando historial...</div>
      <h3>Historial global</h3>
      <div id="historialGlobalContainer" class="historialGrid">Cargando historial global...</div>
    </div>
  `;

  const historialDiv = document.getElementById("historialContainer");
  const historialGlobalDiv = document.getElementById("historialGlobalContainer");
  const exportExcelBtn = document.getElementById("exportExcelBtn");

  document.getElementById("backToDeviceBtn").onclick = () => showDevices();

  // --- Historial del dispositivo ---
  const historialRef = ref(db, `dispositivos/${deviceId}/historial`);
  onValue(historialRef, (snapshot) => {
    const data = snapshot.val() || {};
    historialDiv.innerHTML = "";
    const registros = Object.entries(data).sort((a, b) => parseInt(b[0]) - parseInt(a[0]));

    registros.forEach(([ts, valores]) => {
      const fecha = new Date(parseInt(ts)).toLocaleString("es-CL", { dateStyle: "short", timeStyle: "medium" });
      const card = document.createElement("div");
      card.className = "historialCard";
      card.innerHTML = `
        <h4>${fecha}</h4>
        <p>CO: ${valores.CO ?? "—"} ppm</p>
        <p>CO₂: ${valores.CO2 ?? "—"} ppm</p>
        <p>PM10: ${valores.PM10 ?? "—"} µg/m³</p>
        <p>PM2.5: ${valores.PM2_5 ?? "—"} µg/m³</p>
        <p>Humedad: ${valores.humedad ?? "—"}%</p>
        <p>Temperatura: ${valores.temperatura ?? "—"} °C</p>
      `;
      historialDiv.appendChild(card);
    });

    exportExcelBtn.disabled = registros.length === 0;
    exportExcelBtn.onclick = () => exportToExcel(deviceId, registros);
  });

  // --- Historial global ---
  const historialGlobalRef = ref(db, `dispositivos/${deviceId}/historial_global`);
  onValue(historialGlobalRef, (snapshot) => {
    const data = snapshot.val() || {};
    historialGlobalDiv.innerHTML = "";
    const registrosGlobal = Object.entries(data).sort((a, b) => parseInt(b[0]) - parseInt(a[0]));

    registrosGlobal.forEach(([ts, valores]) => {
      const fecha = new Date(parseInt(ts)).toLocaleString("es-CL", { dateStyle: "short", timeStyle: "medium" });
      const card = document.createElement("div");
      card.className = "historialCard";
      card.innerHTML = `
        <h4>${fecha}</h4>
        <p>CO: ${valores.CO ?? "—"} ppm</p>
        <p>CO₂: ${valores.CO2 ?? "—"} ppm</p>
        <p>PM10: ${valores.PM10 ?? "—"} µg/m³</p>
        <p>PM2.5: ${valores.PM2_5 ?? "—"} µg/m³</p>
        <p>Humedad: ${valores.humedad ?? "—"}%</p>
        <p>Temperatura: ${valores.temperatura ?? "—"} °C</p>
      `;
      historialGlobalDiv.appendChild(card);
    });
  });
}

// ================================================
// FUNCIONES AUXILIARES: EXPORTAR HISTORIAL A EXCEL
// ================================================
async function exportToExcel(deviceId, registros) {
  // Obtener email del usuario asignado
  let userEmail = "Sin asignar";
  try {
    const snapshot = await get(ref(db, "usuarios"));
    const usuarios = snapshot.val() || {};
    for (let uid in usuarios) {
      if (usuarios[uid].deviceId === deviceId) {
        userEmail = usuarios[uid].email || userEmail;
        break;
      }
    }
  } catch (err) {
    console.error("Error al obtener usuario:", err);
  }

  // Construir CSV
  let csv = "Fecha,CO,CO2,PM10,PM2.5,Humedad,Temperatura,Usuario,Dispositivo\n";
  registros.forEach(([ts, valores]) => {
    const fecha = new Date(parseInt(ts)).toLocaleString("es-CL");
    csv += `"${fecha}",${valores.CO ?? ""},${valores.CO2 ?? ""},${valores.PM10 ?? ""},${valores.PM2_5 ?? ""},${valores.humedad ?? ""},${valores.temperatura ?? ""},"${userEmail}","${deviceId}"\n`;
  });

  // Descargar CSV
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.setAttribute("href", url);
  link.setAttribute("download", `historial_${deviceId}.csv`);
  link.style.display = "none";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
// ================================================
// HISTORIAL COMPLETO Y EXPORTACIÓN EXCEL CON DOS HOJAS
// ================================================
export function showHistoricalPage(deviceId) {
  const root = document.getElementById("root");
  root.innerHTML = `
    <div class="dashboard">
      <h2>Historial Completo del Dispositivo</h2>
      <p><b>ID:</b> ${deviceId}</p>
      <div class="actions">
        <button id="exportExcelBtn" disabled>💾 Exportar a Excel</button>
        <button id="backToDeviceBtn">Volver</button>
      </div>
      <h3>Historial del dispositivo</h3>
      <div id="historialContainer" class="historialGrid">Cargando historial...</div>
      <h3>Historial global</h3>
      <div id="historialGlobalContainer" class="historialGrid">Cargando historial global...</div>
    </div>
  `;

  const historialDiv = document.getElementById("historialContainer");
  const historialGlobalDiv = document.getElementById("historialGlobalContainer");
  const exportExcelBtn = document.getElementById("exportExcelBtn");

  document.getElementById("backToDeviceBtn").onclick = () => showDevices();

  let registrosLocal = [];
  let registrosGlobal = [];

  // --- Historial del dispositivo ---
  const historialRef = ref(db, `dispositivos/${deviceId}/historial`);
  onValue(historialRef, (snapshot) => {
    const data = snapshot.val() || {};
    historialDiv.innerHTML = "";
    registrosLocal = Object.entries(data).sort((a, b) => parseInt(b[0]) - parseInt(a[0]));

    registrosLocal.forEach(([ts, valores]) => {
      const fecha = new Date(parseInt(ts)).toLocaleString("es-CL", { dateStyle: "short", timeStyle: "medium" });
      const card = document.createElement("div");
      card.className = "historialCard";
      card.innerHTML = `
        <h4>${fecha}</h4>
        <p>CO: ${valores.CO ?? "—"} ppm</p>
        <p>CO₂: ${valores.CO2 ?? "—"} ppm</p>
        <p>PM10: ${valores.PM10 ?? "—"} µg/m³</p>
        <p>PM2.5: ${valores.PM2_5 ?? "—"} µg/m³</p>
        <p>Humedad: ${valores.humedad ?? "—"}%</p>
        <p>Temperatura: ${valores.temperatura ?? "—"} °C</p>
      `;
      historialDiv.appendChild(card);
    });

    exportExcelBtn.disabled = registrosLocal.length === 0 && registrosGlobal.length === 0;
  });

  // --- Historial global ---
  const historialGlobalRef = ref(db, `dispositivos/${deviceId}/historial_global`);
  onValue(historialGlobalRef, (snapshot) => {
    const data = snapshot.val() || {};
    historialGlobalDiv.innerHTML = "";
    registrosGlobal = Object.entries(data).sort((a, b) => parseInt(b[0]) - parseInt(a[0]));

    registrosGlobal.forEach(([ts, valores]) => {
      const fecha = new Date(parseInt(ts)).toLocaleString("es-CL", { dateStyle: "short", timeStyle: "medium" });
      const card = document.createElement("div");
      card.className = "historialCard";
      card.innerHTML = `
        <h4>${fecha}</h4>
        <p>CO: ${valores.CO ?? "—"} ppm</p>
        <p>CO₂: ${valores.CO2 ?? "—"} ppm</p>
        <p>PM10: ${valores.PM10 ?? "—"} µg/m³</p>
        <p>PM2.5: ${valores.PM2_5 ?? "—"} µg/m³</p>
        <p>Humedad: ${valores.humedad ?? "—"}%</p>
        <p>Temperatura: ${valores.temperatura ?? "—"} °C</p>
      `;
      historialGlobalDiv.appendChild(card);
    });

    exportExcelBtn.disabled = registrosLocal.length === 0 && registrosGlobal.length === 0;
  });

  exportExcelBtn.onclick = () => exportToExcelMultiSheet(deviceId, registrosLocal, registrosGlobal);
}

// ================================================
// FUNCIONES AUXILIARES: EXPORTAR HISTORIAL A EXCEL MULTIHOJA
// ================================================
async function exportToExcelMultiSheet(deviceId, registrosLocal, registrosGlobal) {
  // Obtener email del usuario asignado
  let userEmail = "Sin asignar";
  try {
    const snapshot = await get(ref(db, "usuarios"));
    const usuarios = snapshot.val() || {};
    for (let uid in usuarios) {
      if (usuarios[uid].deviceId === deviceId) {
        userEmail = usuarios[uid].email || userEmail;
        break;
      }
    }
  } catch (err) {
    console.error("Error al obtener usuario:", err);
  }

  // Crear arrays de datos para hojas
  const hojaLocal = [["Fecha", "CO", "CO2", "PM10", "PM2.5", "Humedad", "Temperatura", "Usuario", "Dispositivo"]];
  registrosLocal.forEach(([ts, valores]) => {
    hojaLocal.push([
      new Date(parseInt(ts)).toLocaleString("es-CL"),
      valores.CO ?? "",
      valores.CO2 ?? "",
      valores.PM10 ?? "",
      valores.PM2_5 ?? "",
      valores.humedad ?? "",
      valores.temperatura ?? "",
      userEmail,
      deviceId
    ]);
  });

  const hojaGlobal = [["Fecha", "CO", "CO2", "PM10", "PM2.5", "Humedad", "Temperatura", "Usuario", "Dispositivo"]];
  registrosGlobal.forEach(([ts, valores]) => {
    hojaGlobal.push([
      new Date(parseInt(ts)).toLocaleString("es-CL"),
      valores.CO ?? "",
      valores.CO2 ?? "",
      valores.PM10 ?? "",
      valores.PM2_5 ?? "",
      valores.humedad ?? "",
      valores.temperatura ?? "",
      userEmail,
      deviceId
    ]);
  });

  // Crear libro de Excel
  const wb = XLSX.utils.book_new();
  const wsLocal = XLSX.utils.aoa_to_sheet(hojaLocal);
  const wsGlobal = XLSX.utils.aoa_to_sheet(hojaGlobal);
  XLSX.utils.book_append_sheet(wb, wsLocal, "Historial Local");
  XLSX.utils.book_append_sheet(wb, wsGlobal, "Historial Global");

  // Descargar Excel
  XLSX.writeFile(wb, `historial_${deviceId}.xlsx`);
}
