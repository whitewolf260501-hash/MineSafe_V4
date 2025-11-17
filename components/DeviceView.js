// ================================================
// DeviceView.js — Dispositivos, GeoMinaEmpresa, Geolocalización + Historial
// ================================================
import { db, ref, onValue, set } from "../firebaseConfig.js";
import { navigate } from "../app.js";
import { showHistoryManagerPage } from "./historyManager.js";

const DEVICE_ID_DEFAULT = "device_A4CB2F124B00";

// ================================================
// NAVBAR
// ================================================
export function renderNavbar() {
  const nav = document.createElement("nav");
  nav.className = "main-navbar";
  nav.innerHTML = `
    <div class="navbar-links">
      <button data-view="home">🏠 Inicio</button>
      <button data-view="userform">👤 Usuario</button>
      <button data-view="tipomina">⛏️ Tipo Mina</button>
      <button data-view="geoempresa">🌍 Geo / Empresa</button>
      <button data-view="usuarios">👥 Usuarios</button>
      <button data-view="graficos">📊 Gráficos</button>
      <button data-view="geolocalizacion">📍 Mapa</button>
    </div>
  `;
  nav.querySelectorAll("button").forEach(btn => {
    btn.onclick = () => {
      if (btn.dataset.view === "home") showDevices();
      else navigate(btn.dataset.view);
    };
  });
  return nav;
}

// ================================================
// DASHBOARD COMPLETO
// ================================================
export function showDevices() {
  const root = document.getElementById("root");
  root.innerHTML = "";

  const container = document.createElement("div");
  container.appendChild(renderNavbar());

  const dashboardDiv = document.createElement("div");
  dashboardDiv.className = "dashboard container mt-4";

  dashboardDiv.innerHTML = `
    <h2 class="mb-4">Dispositivo Asignado</h2>
    <div class="row mb-4">
      <div class="col-12 d-flex flex-wrap gap-2">
        <button id="backBtn" class="btn btn-secondary">⬅️ Volver</button>
        <button id="refreshBtn" class="btn btn-info">🔄 Actualizar datos</button>
        <button id="historyBtn" class="btn btn-warning">📜 Ver historial completo</button>
        <button id="saveBtn" class="btn btn-success">💾 Guardar medición</button>
      </div>
    </div>

    <div class="row">

      <!-- CARD DATOS DISPOSITIVO -->
      <div class="col-lg-4 col-md-6 mb-4">
        <div class="card shadow-sm">
          <div class="card-body">
            <h5 class="card-title">Datos del Dispositivo</h5>
            <div id="deviceData">Cargando dispositivo...</div>
          </div>
        </div>
      </div>

      <!-- CARD FORM GEO EMPRESA -->
      <div class="col-lg-4 col-md-6 mb-4">
        <div class="card shadow-sm">
          <div class="card-body">
            <h5 class="card-title">Registro Empresa & Mina</h5>
            <form id="geoMinaForm">
              <div class="mb-2">
                <label>Nombre Empresa:</label>
                <input id="empresa" class="form-control" placeholder="Nombre de la empresa" />
              </div>
              <div class="row mb-2">
                <div class="col"><label>País</label><input id="pais" class="form-control" placeholder="País" readonly /></div>
                <div class="col"><label>Región</label><input id="region" class="form-control" placeholder="Región / Estado" readonly /></div>
              </div>
              <div class="row mb-2">
                <div class="col"><label>Comuna</label><input id="comuna" class="form-control" placeholder="Comuna / Municipio" readonly /></div>
                <div class="col"><label>Nombre Mina</label><input id="mina" class="form-control" placeholder="Nombre de la mina" /></div>
              </div>
              <div class="mb-2">
                <label>Tipo de mina</label>
                <select id="tipoMina" class="form-select">
                  <option value="">Seleccione...</option>
                  <option value="subterranea">Subterránea</option>
                  <option value="tajo_abierto">Tajo Abierto</option>
                  <option value="aluvial">Aluvial</option>
                  <option value="cantera">Cantera</option>
                  <option value="pirquen">Pirquén / Artesanal</option>
                </select>
              </div>
              <div id="camposExtras"></div>
              <div class="mb-2">
                <label>Latitud</label><input id="latitud" type="number" step="any" class="form-control" placeholder="Latitud" readonly />
              </div>
              <div class="mb-2">
                <label>Longitud</label><input id="longitud" type="number" step="any" class="form-control" placeholder="Longitud" readonly />
              </div>
              <div class="mb-2">
                <button type="button" id="btnGetLocation" class="btn btn-outline-primary w-100">📡 Obtener ubicación actual</button>
              </div>
              <div id="mapPreview" style="height:250px; border-radius:10px;"></div>
              <button class="btn btn-primary w-100 mt-2">💾 Guardar</button>
            </form>
          </div>
        </div>
      </div>

      <!-- CARD VISTA PREVIA MAPA -->
      <div class="col-lg-4 col-md-12 mb-4">
        <div class="card shadow-sm">
          <div class="card-body">
            <h5 class="card-title">Vista previa & Mapa</h5>
            <p><strong>Empresa:</strong> <span id="p_empresa">—</span></p>
            <p><strong>Mina:</strong> <span id="p_mina">—</span></p>
            <p><strong>Tipo:</strong> <span id="p_tipo">—</span></p>
            <p><strong>Coordenadas:</strong> <span id="p_coord">—</span></p>
            <div id="mapPreviewCard" style="height:250px; border-radius:10px;"></div>
            <button id="btnMapCard" class="btn btn-outline-success w-100 mt-2">📍 Mostrar mapa</button>
          </div>
        </div>
      </div>

    </div>
  `;

  container.appendChild(dashboardDiv);
  root.appendChild(container);

  // ================= FUNCIONALIDAD BOTONES =================
  document.getElementById("backBtn").onclick = () => navigate("user");
  document.getElementById("refreshBtn").onclick = () =>
    mostrarDatosDispositivo(DEVICE_ID_DEFAULT, document.getElementById("deviceData"));
  document.getElementById("historyBtn").onclick = () =>
    showHistoricalPage(DEVICE_ID_DEFAULT);
  document.getElementById("saveBtn").onclick = () =>
    guardarMedicionActual(DEVICE_ID_DEFAULT);

  // ================= FORMULARIO + VISTA PREVIA =================
  const tipoMina = document.getElementById("tipoMina");
  const extras = document.getElementById("camposExtras");
  const geoMinaForm = document.getElementById("geoMinaForm");

  const p_empresa = document.getElementById("p_empresa");
  const p_mina = document.getElementById("p_mina");
  const p_tipo = document.getElementById("p_tipo");
  const p_coord = document.getElementById("p_coord");

  const plantillas = {
    subterranea: `<h5>Datos subterráneos</h5><input id="nivel" class="form-control mb-2" placeholder="Nivel o piso" /><input id="galeria" class="form-control mb-2" placeholder="Galería / rampa" /><input id="frente" class="form-control mb-2" placeholder="Frente o cámara" />`,
    tajo_abierto: `<h5>Tajo Abierto</h5><input id="tajo" class="form-control mb-2" placeholder="Tajo o sector" /><input id="banco" class="form-control mb-2" placeholder="Banco" /><input id="frente" class="form-control mb-2" placeholder="Frente activo" />`,
    aluvial: `<h5>Aluvial</h5><input id="rio" class="form-control mb-2" placeholder="Río o quebrada" /><input id="tramo" class="form-control mb-2" placeholder="Tramo (km)" /><input id="poza" class="form-control mb-2" placeholder="Poza / frente" />`,
    cantera: `<h5>Cantera</h5><input id="material" class="form-control mb-2" placeholder="Material extraído" /><input id="banco" class="form-control mb-2" placeholder="Banco / zona" /><input id="frente" class="form-control mb-2" placeholder="Frente activo" />`,
    pirquen: `<h5>Pirquén / Artesanal</h5><input id="faena" class="form-control mb-2" placeholder="Nombre faena" /><input id="nivel" class="form-control mb-2" placeholder="Nivel principal" /><input id="frente" class="form-control mb-2" placeholder="Frente de trabajo" />`
  };

  function renderExtras(tipo) { extras.innerHTML = plantillas[tipo] || ""; }
  tipoMina.onchange = (e) => {
    renderExtras(e.target.value);
    p_tipo.textContent = e.target.options[e.target.selectedIndex]?.text || "—";
  };

  function actualizarPreview() {
    p_empresa.textContent = document.getElementById("empresa").value || "—";
    p_mina.textContent = document.getElementById("mina").value || "—";
    p_tipo.textContent = document.getElementById("tipoMina").selectedOptions[0]?.text || "—";
    const lat = document.getElementById("latitud").value;
    const lon = document.getElementById("longitud").value;
    p_coord.textContent = lat && lon ? `${lat}, ${lon}` : "—";
  }

  geoMinaForm.onsubmit = (e) => {
    e.preventDefault();
    actualizarPreview();
    alert("✅ Formulario actualizado y datos listos para guardar.");
  };

  ["empresa","mina","tipoMina","latitud","longitud"].forEach(id =>
    document.getElementById(id).addEventListener("input", actualizarPreview)
  );

  // ================= INICIALIZAR DISPOSITIVO =================
  mostrarDatosDispositivo(DEVICE_ID_DEFAULT, document.getElementById("deviceData"));

  // ================= MAPA EN CARD =================
  let mapCard = null;
  let markerCard = null;
  const btnMapCard = document.getElementById("btnMapCard");
  btnMapCard.onclick = async () => {
    const lat = parseFloat(document.getElementById("latitud").value) || -33.45;
    const lon = parseFloat(document.getElementById("longitud").value) || -70.65;

    if (!mapCard) {
      mapCard = L.map("mapPreviewCard").setView([lat, lon], 13);
      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", { maxZoom: 19 }).addTo(mapCard);
      markerCard = L.marker([lat, lon]).addTo(mapCard);
    } else {
      mapCard.setView([lat, lon], 13);
      markerCard.setLatLng([lat, lon]);
    }

    alert("📍 Mapa actualizado con la ubicación actual.");
  };

  const btnGetLocation = document.getElementById("btnGetLocation");
  btnGetLocation.onclick = () => {
    if (!navigator.geolocation) { alert("Tu navegador no soporta geolocalización."); return; }
    btnGetLocation.disabled = true; btnGetLocation.textContent = "Obteniendo...";

    navigator.geolocation.getCurrentPosition(async (pos) => {
      const lat = pos.coords.latitude.toFixed(6);
      const lon = pos.coords.longitude.toFixed(6);
      document.getElementById("latitud").value = lat;
      document.getElementById("longitud").value = lon;

      // Reverse geocoding
      try {
        const res = await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json&addressdetails=1`);
        const data = await res.json();
        const address = data.address || {};
        document.getElementById("pais").value = address.country || "Desconocido";
        document.getElementById("region").value = address.state || address.region || "Desconocido";
        document.getElementById("comuna").value = address.city || address.town || address.village || address.municipality || "Desconocido";
      } catch (err) {
        console.error(err);
      }

      actualizarPreview();
      btnGetLocation.disabled = false;
      btnGetLocation.textContent = "📡 Obtener ubicación actual";
      alert("✅ Ubicación obtenida y mapa listo.");
    }, (err) => {
      alert("No se pudo obtener la ubicación: " + err.message);
      btnGetLocation.disabled = false;
      btnGetLocation.textContent = "📡 Obtener ubicación actual";
    }, { enableHighAccuracy: true, timeout: 10000 });
  };
}

// ================================================
// FUNCIONES EXISTENTES
// ================================================
function mostrarDatosDispositivo(deviceId, container) {
  const deviceRef = ref(db, `dispositivos/${deviceId}`);
  onValue(deviceRef, (snapshot) => {
    const d = snapshot.val();
    if (!d) { container.innerHTML = `<p>No se encontró dispositivo ${deviceId}</p>`; return; }
    container.dataset.CO = d.CO ?? 0;
    container.dataset.CO2 = d.CO2 ?? 0;
    container.dataset.PM10 = d.PM10 ?? 0;
    container.dataset.PM2_5 = d.PM2_5 ?? 0;
    container.dataset.humedad = d.humedad ?? 0;
    container.dataset.temperatura = d.temperatura ?? 0;

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
    `;
  });
}

function guardarMedicionActual(deviceId) {
  const container = document.getElementById("deviceData");
  if (!container) return;
  const timestamp = Date.now();
  const newData = {
    CO: Number(container.dataset.CO),
    CO2: Number(container.dataset.CO2),
    PM10: Number(container.dataset.PM10),
    PM2_5: Number(container.dataset.PM2_5),
    humedad: Number(container.dataset.humedad),
    temperatura: Number(container.dataset.temperatura)
  };
  set(ref(db, `dispositivos/${deviceId}/historial_global/${timestamp}`), newData)
    .then(() => alert("Medición guardada correctamente!"))
    .catch(err => console.error(err));
}

// Aquí puedes añadir tus funciones de historial PDF/Excel como antes

// ================================================
// HISTORIAL, PDF, EXCEL y demás funciones existentes
// ================================================
// ... Aquí puedes pegar todas tus funciones de historial como en tu código anterior.

// Aquí puedes añadir tus funciones de historial PDF/Excel según tu código anterior

// ================================================
// HISTORIAL COMPLETO
// ================================================
function showHistoricalPage(deviceId) {
  const root = document.getElementById("root");
  root.innerHTML = "";

  const container = document.createElement("div");
  container.appendChild(renderNavbar());

  const dashboardDiv = document.createElement("div");
  dashboardDiv.className = "dashboard";
  dashboardDiv.innerHTML = `
    <h2>Historial Completo del Dispositivo</h2>
    <p><strong>ID:</strong> ${deviceId}</p>
    <div class="actions">
      <button id="backHistBtn">⬅️ Volver</button>
      <button id="refreshHistBtn">🔄 Actualizar historial</button>
      <button id="savePdfBtn" disabled>💾 Guardar PDF</button>
      <button id="saveExcelBtn" disabled>📊 Guardar Excel</button>
      <button id="page1Btn">📄 Página 1</button>
      <button id="manualPageBtn">📋 Abrir Historial Manager</button>
      <button id="page2Btn">📄 Página 2</button>
      <button id="userFormHistBtn">👤 Datos Personales</button>
      <button id="geoEmpresaHistBtn">🌍 Geo / Empresa</button>
    </div>
    <div id="fullHistorialContainer" class="historialDetails">Cargando historial...</div>
  `;

  container.appendChild(dashboardDiv);
  root.appendChild(container);

  const fullHistorialDiv = document.getElementById("fullHistorialContainer");
  const savePdfBtn = document.getElementById("savePdfBtn");
  const saveExcelBtn = document.getElementById("saveExcelBtn");

  document.getElementById("backHistBtn").onclick = () => showDevices();
  document.getElementById("refreshHistBtn").onclick = () =>
    cargarHistorialGlobal(deviceId, fullHistorialDiv, savePdfBtn, saveExcelBtn);
  document.getElementById("page1Btn").onclick = () => showPage1(deviceId);
  document.getElementById("page2Btn").onclick = () => showPage2(deviceId);
  document.getElementById("manualPageBtn").onclick = () => showHistoryManagerPage();
  document.getElementById("userFormHistBtn").onclick = () => navigate("userform");
  document.getElementById("geoEmpresaHistBtn").onclick = () => navigate("geoempresa");

  cargarHistorialGlobal(deviceId, fullHistorialDiv, savePdfBtn, saveExcelBtn);
}

// ================================================
// FUNCIONES AUXILIARES HISTORIAL (Páginas, PDF, Excel)
// ================================================
function showPage1(deviceId) {
  const root = document.getElementById("root");
  root.innerHTML = "";

  const container = document.createElement("div");
  container.appendChild(renderNavbar());

  const dashboardDiv = document.createElement("div");
  dashboardDiv.className = "dashboard";
  dashboardDiv.innerHTML = `<h2>Página 1 del Historial - ${deviceId}</h2>
    <button id="backToHistBtn">⬅️ Volver</button>
    <p>Aquí puedes mostrar gráficos o estadísticas.</p>`;

  container.appendChild(dashboardDiv);
  root.appendChild(container);

  document.getElementById("backToHistBtn").onclick = () => showHistoricalPage(deviceId);
}

function showPage2(deviceId) {
  const root = document.getElementById("root");
  root.innerHTML = "";

  const container = document.createElement("div");
  container.appendChild(renderNavbar());

  const dashboardDiv = document.createElement("div");
  dashboardDiv.className = "dashboard";
  dashboardDiv.innerHTML = `<h2>Página 2 del Historial - ${deviceId}</h2>
    <button id="backToHistBtn2">⬅️ Volver</button>
    <p>Aquí puedes mostrar comparativas o resúmenes del sensor.</p>`;

  container.appendChild(dashboardDiv);
  root.appendChild(container);

  document.getElementById("backToHistBtn2").onclick = () => showHistoricalPage(deviceId);
}

function cargarHistorialGlobal(deviceId, container, btnPDF, btnExcel) {
  const histRef = ref(db, `dispositivos/${deviceId}/historial_global`);
  onValue(histRef, (snapshot) => {
    const data = snapshot.val();
    if (!data) {
      container.innerHTML = "<p>No hay datos históricos.</p>";
      btnPDF.disabled = true;
      btnExcel.disabled = true;
      return;
    }

    const registros = Object.entries(data).reverse();
    container.innerHTML = "<h4>Registros del historial global:</h4>";
    registros.forEach(([id, valores]) => {
      container.innerHTML += `
        <div class="historialItem">
          <p><b>ID Registro:</b> ${id}</p>
          <p>CO: ${valores.CO ?? "—"} ppm</p>
          <p>CO₂: ${valores.CO2 ?? "—"} ppm</p>
          <p>PM10: ${valores.PM10 ?? "—"} µg/m³</p>
          <p>PM2.5: ${valores.PM2_5 ?? "—"} µg/m³</p>
          <p>Humedad: ${valores.humedad ?? "—"}%</p>
          <p>Temperatura: ${valores.temperatura ?? "—"} °C</p>
          <hr>
        </div>
      `;
    });

    btnPDF.disabled = false;
    btnExcel.disabled = false;
    btnPDF.onclick = () => guardarHistorialComoPDF(deviceId, registros);
    btnExcel.onclick = () => guardarHistorialComoExcel(deviceId, registros);
  });
}

function guardarHistorialComoPDF(deviceId, registros) {
  if (typeof window.jspdf === "undefined") {
    alert("Error: La librería jsPDF no está disponible.");
    return;
  }
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF();
  doc.setFontSize(18);
  doc.text(`Historial Global - ${deviceId}`, 14, 22);
  doc.setFontSize(10);
  doc.text(`Generado el: ${new Date().toLocaleString("es-CL")}`, 14, 30);

  let y = 40;
  registros.forEach(([id, valores]) => {
    if (y > 280) { doc.addPage(); y = 20; }
    doc.text(`ID: ${id}`, 14, y); y += 7;
    doc.text(`CO: ${valores.CO ?? "—"} | CO₂: ${valores.CO2 ?? "—"} | PM10: ${valores.PM10 ?? "—"} | PM2.5: ${valores.PM2_5 ?? "—"}`, 14, y);
    y += 6;
    doc.text(`Humedad: ${valores.humedad ?? "—"}% | Temperatura: ${valores.temperatura ?? "—"} °C`, 14, y);
    y += 10;
  });

  doc.save(`historial-global-${deviceId}.pdf`);
}

function guardarHistorialComoExcel(deviceId, registros) {
  let csv = "ID,CO,CO2,PM10,PM2_5,Humedad,Temperatura\n";
  registros.forEach(([id, valores]) => {
    csv += `${id},${valores.CO ?? ""},${valores.CO2 ?? ""},${valores.PM10 ?? ""},${valores.PM2_5 ?? ""},${valores.humedad ?? ""},${valores.temperatura ?? ""}\n`;
  });

  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = `historial-global-${deviceId}.csv`;
  link.click();
}
function cargarHistorialGlobal(deviceId, container, btnPDF, btnExcel) {
  const histRef = ref(db, `dispositivos/${deviceId}/historial_global`);
  
  console.log("📡 Escuchando historial en Firebase para:", deviceId);

  onValue(histRef, (snapshot) => {
    const data = snapshot.val();

    if (!data) {
      container.innerHTML = "<p>No hay historial almacenado.</p>";
      btnPDF.disabled = true;
      btnExcel.disabled = true;
      return;
    }

    // Activar exportaciones
    btnPDF.disabled = false;
    btnExcel.disabled = false;

    const entries = Object.entries(data).sort((a, b) => b[0] - a[0]);

    let html = `
      <table class="table table-striped">
        <thead>
          <tr>
            <th>Fecha</th>
            <th>CO</th>
            <th>CO₂</th>
            <th>PM10</th>
            <th>PM2.5</th>
            <th>Humedad</th>
            <th>Temp</th>
          </tr>
        </thead>
        <tbody>
    `;

    entries.forEach(([timestamp, v]) => {
      const fecha = new Date(Number(timestamp)).toLocaleString();

      html += `
        <tr>
          <td>${fecha}</td>
          <td>${v.CO}</td>
          <td>${v.CO2}</td>
          <td>${v.PM10}</td>
          <td>${v.PM2_5}</td>
          <td>${v.humedad}</td>
          <td>${v.temperatura}</td>
        </tr>
      `;
    });

    html += `</tbody></table>`;
    container.innerHTML = html;

    console.log("📥 Historial recibido:", entries.length, "registros.");
  });
}
