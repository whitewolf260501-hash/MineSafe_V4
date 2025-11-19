// ============================================================
// historyManager.js — MineSafe V4 (Corrección total Firebase)
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
        <img src="assets/images/Logo2.png" class="ms-logo"/>
        <h1>Minesafe 2</h1>
      </div>

      <div class="ms-profile">
        <div class="avatar">👤</div>
        <h3 id="username">Usuario</h3>
        <p id="useremail">correo@ejemplo.com</p>
      </div>

      <nav class="ms-nav">
        <button data-view="devices">💡 Dispositivos</button>
        <button data-view="alerts">🚨 Alertas</button>
        <button data-view="history" class="active">📜 Historial</button>
      </nav>

      <div class="ms-footer">
        <button id="themeToggle" class="btn btn-ghost">🌓 Tema</button>
        <button class="logout">🔒 Cerrar Sesión</button>
      </div>
    </aside>

    <!-- ================== MAIN ================== -->
    <main class="ms-main">
      <header class="ms-header">
        <div>
          <h2>📜 Historial del Dispositivo</h2>
          <p class="ms-sub">Lecturas desde Firebase Realtime Database</p>
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
          <p id="lastUpdate">—</p>
        </div>
        <div class="summary-card purple">
          <h4>Temperatura</h4>
          <p id="tempValue">— °C</p>
        </div>
        <div class="summary-card teal">
          <h4>CO</h4>
          <p id="coValue">— ppm</p>
        </div>
        <div class="summary-card yellow">
          <h4>Humedad</h4>
          <p id="humidityValue">— %</p>
        </div>
      </section>

      <!-- === PANEL DE DATOS === -->
      <section class="panel-card">
        <div class="panel-top"><h3>📟 Datos del Dispositivo</h3></div>
        <div id="managerData" class="panel-body">Cargando datos...</div>
      </section>

      <!-- === HISTORIAL GUARDADO === -->
      <section class="panel-card">
        <div class="panel-top"><h3>💾 Registros Guardados</h3></div>
        <div id="savedDataContainer" class="panel-body">No hay datos guardados aún.</div>
      </section>
    </main>
  </div>
  `;

  // NAV
  document.querySelectorAll("button[data-view]").forEach(btn => {
    btn.onclick = () => {
      navigate(btn.dataset.view);
    };
  });

  importUserProfile();

  // TEMA
  const themeBtn = document.getElementById("themeToggle");
  themeBtn.onclick = () => {
    document.body.classList.toggle("ms-dark");
  };

  // LOGOUT
  document.querySelector(".logout").onclick = () => {
    auth.signOut();
    navigate("login");
  };

  // BOTONES
  document.getElementById("refreshBtn").onclick = loadManagerData;
  document.getElementById("saveManualBtn").onclick = saveCurrentData;
  document.getElementById("exportPDF").onclick = exportToPDF;
  document.getElementById("exportExcel").onclick = exportToExcel;

  // PRIMERA CARGA
  loadManagerData();
}

// ============================================================
// PERFIL
// ============================================================
function importUserProfile() {
  onSnapshot(doc(firestore, "users", auth.currentUser.uid), (snap) => {
    if (!snap.exists()) return;
    const data = snap.data();
    document.getElementById("username").textContent = data.nombre;
    document.getElementById("useremail").textContent = data.email;
  });
}

// ============================================================
// CARGAR DATOS DEL DISPOSITIVO (CORREGIDO)
// ============================================================
function loadManagerData() {
  const container = document.getElementById("managerData");

  // Este ID sí existe en tu base REAL
  const DEVICE_ID = "device_A4CB2F124B00";
  const deviceRef = ref(db, `dispositivos/${DEVICE_ID}`);

  onValue(deviceRef, (snap) => {
    const d = snap.val();
    if (!d) {
      container.innerHTML = "<p>No se encontraron datos del dispositivo.</p>";
      return;
    }

    currentDeviceData = {
      id: DEVICE_ID,
      CO: d.CO ?? 0,
      PM2_5: d.PM2_5 ?? 0,
      humedad: d.humedad ?? 0,
      temperatura: d.temperatura ?? 0,
      latitud: d.latitud ?? 0,
      longitud: d.longitud ?? 0,
      fecha: d.last_update_server
        ? new Date(d.last_update_server).toLocaleString("es-CL")
        : "—"
    };

    // Actualizar tarjetas resumen
    document.getElementById("lastUpdate").textContent = currentDeviceData.fecha;
    document.getElementById("tempValue").textContent = `${currentDeviceData.temperatura} °C`;
    document.getElementById("coValue").textContent = `${currentDeviceData.CO} ppm`;
    document.getElementById("humidityValue").textContent = `${currentDeviceData.humedad}%`;

    // Panel principal
    container.innerHTML = `
      <div class="user-card">
        <h4>📟 Dispositivo ${DEVICE_ID}</h4>
        <p><b>CO:</b> ${d.CO} ppm</p>
        <p><b>PM2.5:</b> ${d.PM2_5} µg/m³</p>
        <p><b>Humedad:</b> ${d.humedad}%</p>
        <p><b>Temperatura:</b> ${d.temperatura} °C</p>
        <p><b>GPS:</b> ${d.latitud}, ${d.longitud}</p>
        <p><i>Última actualización:</i> ${currentDeviceData.fecha}</p>
      </div>
    `;
  });
}

// ============================================================
// GUARDADO LOCAL
// ============================================================
function saveCurrentData() {
  savedData.push({ ...currentDeviceData });

  const savedContainer = document.getElementById("savedDataContainer");
  savedContainer.innerHTML = savedData
    .map((d, i) => `
      <div class="user-card">
        <h4>Registro #${i + 1}</h4>
        <p><b>Fecha:</b> ${d.fecha}</p>
        <p>CO: ${d.CO} ppm</p>
        <p>PM2.5: ${d.PM2_5} µg/m³</p>
        <p>Humedad: ${d.humedad}%</p>
        <p>Temperatura: ${d.temperatura} °C</p>
      </div>
    `)
    .join("");
}

// ============================================================
// EXPORTAR
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
  let csv = "Registro,Fecha,CO,PM2.5,Humedad,Temperatura\n";
  savedData.forEach((d, i) => {
    csv += `${i + 1},${d.fecha},${d.CO},${d.PM2_5},${d.humedad},${d.temperatura}\n`;
  });

  const blob = new Blob([csv], { type: "text/csv" });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = "historial_dispositivo.csv";
  link.click();
}
