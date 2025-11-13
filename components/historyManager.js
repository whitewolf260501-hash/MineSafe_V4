// ============================================================
// historyManager.js — MineSafe V4 (Diseño Moderno)
// ============================================================

import { db, ref, onValue } from "../firebaseConfig.js";
import { navigate } from "../app.js";
import { auth, firestore } from "../firebaseConfig.js";
import { doc, onSnapshot } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-firestore.js";

let savedData = [];
let currentDeviceData = {};

// ============================================================
// FUNCIÓN PRINCIPAL
// ============================================================
export function showHistoryManagerPage() {
  const root = document.getElementById("root");
  root.innerHTML = `
  <div class="ms-dashboard">
    <!-- ================== SIDEBAR ================== -->
    <aside class="ms-sidebar">
      <div class="ms-brand">
        <img src="assets/images/Logo2.png" alt="Minesafe" class="ms-logo"/>
        <h1>Minesafe 2</h1>
      </div>

      <div class="ms-profile">
        <div class="avatar">👤</div>
        <h3 id="username">Usuario</h3>
        <p class="email" id="useremail">correo@ejemplo.com</p>
      </div>

      <nav class="ms-nav">
        <button data-view="userform">👤 Datos</button>
        <button data-view="datosdelusuario">🧾 Mis Datos</button>
        <button data-view="tipomina">⛏️ Mina</button>
        <button data-view="geoempresa">🌍 Empresa</button>
        <button data-view="geominaempresa">🏭 Empresa & Mina</button>
        <button data-view="devices">💡 Dispositivos</button>
        <button data-view="alerts">🚨 Alertas</button>
        <button data-view="history">📜 Historial</button>
        <button data-view="manager" class="active">🗂️ Manage</button>
        <button data-view="usuarios">👥 Usuarios</button>
        <button data-view="graficos">📊 Gráficos</button>
        <button data-view="geolocalizacion">📍 Mapa</button>
      </nav>

      <div class="ms-footer">
        <button id="themeToggle" class="btn btn-ghost">🌓 Tema</button>
        <button class="logout">🔒 Cerrar Sesión</button>
      </div>
    </aside>

    <!-- ================== MAIN ================== -->
    <main class="ms-main">
      <header class="ms-header">
        <div class="ms-header-left">
          <h2>📜 Historial del Dispositivo</h2>
          <p class="ms-sub">Lecturas, registros y exportación de datos</p>
        </div>
        <div class="ms-header-right">
          <button id="refreshBtn" class="btn-mini btn-edit">🔄 Actualizar</button>
          <button id="saveManualBtn" class="btn-mini btn-del">💾 Guardar</button>
          <button id="exportPDF" class="btn-mini btn-export">📄 PDF</button>
          <button id="exportExcel" class="btn-mini btn-export">📊 Excel</button>
        </div>
      </header>

      <!-- === TARJETAS RESUMEN === -->
      <section class="ms-summary">
        <div class="summary-card blue">
          <h4>Última lectura</h4>
          <p class="value" id="lastUpdate">—</p>
        </div>
        <div class="summary-card purple">
          <h4>Temperatura</h4>
          <p class="value" id="tempValue">— °C</p>
        </div>
        <div class="summary-card teal">
          <h4>CO₂</h4>
          <p class="value" id="co2Value">— ppm</p>
        </div>
        <div class="summary-card yellow">
          <h4>Humedad</h4>
          <p class="value" id="humidityValue">— %</p>
        </div>
      </section>

      <!-- === PANEL DE DATOS === -->
      <section class="panel-card">
        <div class="panel-top"><h3>📟 Datos del Dispositivo</h3></div>
        <div class="panel-body" id="managerData">Cargando datos...</div>
      </section>

      <!-- === HISTORIAL GUARDADO === -->
      <section class="panel-card">
        <div class="panel-top"><h3>💾 Registros Guardados</h3></div>
        <div class="panel-body" id="savedDataContainer">No hay datos guardados aún.</div>
      </section>
    </main>
  </div>
  `;

  // ==================== NAVBAR FUNCIONAL ====================
  document.querySelectorAll("button[data-view]").forEach(btn => {
    btn.addEventListener("click", async () => {
      const view = btn.dataset.view;
      document.querySelectorAll(".ms-nav button").forEach(b => b.classList.remove("active"));
      btn.classList.add("active");
      navigate(view);
    });
  });

  // ==================== PERFIL ====================
  importUserProfile();

  // ==================== TEMA ====================
  const themeBtn = document.getElementById("themeToggle");
  themeBtn.onclick = () => {
    document.body.classList.toggle("ms-dark");
    themeBtn.textContent = document.body.classList.contains("ms-dark") ? "🌞" : "🌓";
    localStorage.setItem("theme", document.body.classList.contains("ms-dark") ? "dark" : "light");
  };
  if (localStorage.getItem("theme") === "dark") {
    document.body.classList.add("ms-dark");
    themeBtn.textContent = "🌞";
  }

  // ==================== LOGOUT ====================
  document.querySelector(".logout").onclick = async () => {
    await auth.signOut();
    navigate("login");
  };

  // ==================== BOTONES ====================
  document.getElementById("refreshBtn").onclick = () => loadManagerData();
  document.getElementById("saveManualBtn").onclick = () => saveCurrentData();
  document.getElementById("exportPDF").onclick = () => exportToPDF();
  document.getElementById("exportExcel").onclick = () => exportToExcel();

  loadManagerData();
}

// ============================================================
// PERFIL DE USUARIO
// ============================================================
function importUserProfile() {
  import("https://www.gstatic.com/firebasejs/11.0.1/firebase-firestore.js").then(({ doc, onSnapshot }) => {
    onSnapshot(doc(firestore, "users", auth.currentUser?.uid || "anon"), (snap) => {
      const data = snap.exists() ? snap.data() : {};
      document.getElementById("username").textContent = data.nombre || "Usuario";
      document.getElementById("useremail").textContent = auth.currentUser?.email || "Sin sesión";
    });
  });
}

// ============================================================
// CARGAR DATOS DEL DISPOSITIVO
// ============================================================
function loadManagerData() {
  const container = document.getElementById("managerData");
  const DEVICE_ID = "device_A4CB2F124B00";
  const deviceRef = ref(db, `dispositivos/${DEVICE_ID}`);

  onValue(deviceRef, (snapshot) => {
    const data = snapshot.val();
    if (!data) return (container.innerHTML = "<p>No se encontraron datos del dispositivo.</p>");

    currentDeviceData = {
      id: DEVICE_ID,
      name: data.name || "Desconocido",
      user: data.userEmail || "Sin asignar",
      CO: data.CO ?? 0,
      CO2: data.CO2 ?? 0,
      PM10: data.PM10 ?? 0,
      PM2_5: data.PM2_5 ?? 0,
      humedad: data.humedad ?? 0,
      temperatura: data.temperatura ?? 0,
      fecha: new Date().toLocaleString("es-CL"),
    };

    document.getElementById("lastUpdate").textContent = currentDeviceData.fecha;
    document.getElementById("tempValue").textContent = `${currentDeviceData.temperatura} °C`;
    document.getElementById("co2Value").textContent = `${currentDeviceData.CO2} ppm`;
    document.getElementById("humidityValue").textContent = `${currentDeviceData.humedad}%`;

    container.innerHTML = `
      <div class="user-card">
        <h4>📟 ${currentDeviceData.name}</h4>
        <p><b>ID:</b> ${currentDeviceData.id}</p>
        <p><b>Usuario:</b> ${currentDeviceData.user}</p>
        <p>CO: ${currentDeviceData.CO} ppm | CO₂: ${currentDeviceData.CO2} ppm</p>
        <p>PM10: ${currentDeviceData.PM10} µg/m³ | PM2.5: ${currentDeviceData.PM2_5} µg/m³</p>
        <p>Humedad: ${currentDeviceData.humedad}% | Temperatura: ${currentDeviceData.temperatura} °C</p>
        <p><i>Última actualización: ${currentDeviceData.fecha}</i></p>
      </div>`;
  });
}

// ============================================================
// GUARDAR DATOS LOCALMENTE
// ============================================================
function saveCurrentData() {
  if (!currentDeviceData.id) return;
  savedData.push({ ...currentDeviceData });
  const savedContainer = document.getElementById("savedDataContainer");

  savedContainer.innerHTML = savedData.map((d, i) => `
    <div class="user-card">
      <h4>Registro #${i + 1}</h4>
      <p><b>Fecha:</b> ${d.fecha}</p>
      <p>CO: ${d.CO} ppm | CO₂: ${d.CO2} ppm</p>
      <p>PM10: ${d.PM10} µg/m³ | PM2.5: ${d.PM2_5} µg/m³</p>
      <p>Humedad: ${d.humedad}% | Temperatura: ${d.temperatura} °C</p>
    </div>
  `).join("");
}

// ============================================================
// EXPORTAR PDF Y EXCEL
// ============================================================
function exportToPDF() {
  const content = document.getElementById("savedDataContainer").innerText;
  const blob = new Blob([content], { type: "application/pdf" });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = "historial_dispositivo.pdf";
  link.click();
}

function exportToExcel() {
  let csv = "Registro,Fecha,CO,CO2,PM10,PM2.5,Humedad,Temperatura\n";
  savedData.forEach((d, i) => {
    csv += `${i + 1},${d.fecha},${d.CO},${d.CO2},${d.PM10},${d.PM2_5},${d.humedad},${d.temperatura}\n`;
  });
  const blob = new Blob([csv], { type: "text/csv" });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = "historial_dispositivo.csv";
  link.click();
}
