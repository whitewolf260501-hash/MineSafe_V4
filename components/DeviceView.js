// ================================================
// DeviceView.js — Dispositivos, GeoMinaEmpresa, Geolocalización + Historial + Negocio/Arriendos
// ================================================
import { db, ref, onValue, set, update } from "../firebaseConfig.js"; // asumes que exportas set/update para RTDB
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
      <button data-view="arriendos">📄 Arriendos</button>
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
            <div id="arriendoCard" style="margin-top:12px;"></div>
          </div>
        </div>
      </div>

      <!-- CARD FORM GEO EMPRESA + BUSINESS -->
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

              <!-- Coordenadas -->
              <div class="mb-2">
                <label>Latitud</label><input id="latitud" type="number" step="any" class="form-control" placeholder="Latitud" readonly />
              </div>
              <div class="mb-2">
                <label>Longitud</label><input id="longitud" type="number" step="any" class="form-control" placeholder="Longitud" readonly />
              </div>
              <div class="mb-2">
                <button type="button" id="btnGetLocation" class="btn btn-outline-primary w-100">📡 Obtener ubicación actual</button>
              </div>

              <hr>

              <!-- BUSINESS / FAENA -->
              <div id="businessSection">
                <h6>Información del Negocio / Faena</h6>
                <div class="mb-2">
                  <label>Actividad Económica (Giro)</label>
                  <input id="giroEmpresa" class="form-control" placeholder="Ej: Extracción de cobre, servicios mineros..." />
                </div>
                <div class="mb-2">
                  <label>RUT Empresa</label>
                  <input id="rutEmpresa" class="form-control" placeholder="AXXXXXXX-X" />
                </div>
                <div class="mb-2">
                  <label>Responsable de Seguridad</label>
                  <input id="responsableSeguridad" class="form-control" placeholder="Nombre completo" />
                </div>
                <div class="row mb-2">
                  <div class="col">
                    <label>N° Trabajadores en Faena</label>
                    <input id="numTrabajadores" type="number" class="form-control" placeholder="Ej: 25" />
                  </div>
                  <div class="col">
                    <label>Turnos</label>
                    <input id="turnos" class="form-control" placeholder="Ej: Día / Noche" />
                  </div>
                </div>
                <div class="mb-2">
                  <label>Estado de Cumplimiento Normativo</label>
                  <select id="cumplimiento" class="form-select">
                    <option value="">Seleccione...</option>
                    <option value="cumple">Cumple</option>
                    <option value="parcial">Cumplimiento Parcial</option>
                    <option value="no_cumple">No Cumple</option>
                  </select>
                </div>
                <div class="mb-2">
                  <label>Riesgos Asociados</label>
                  <textarea id="riesgos" rows="3" class="form-control" placeholder="Ej: Acumulación de CO, material particulado, derrumbes..."></textarea>
                </div>
                <div class="mb-2">
                  <label>Capacidad Productiva</label>
                  <input id="produccion" class="form-control" placeholder="Ej: 120 toneladas/mes" />
                </div>
              </div>

              <div class="mb-2">
                <button type="submit" id="btnSaveGeoBusiness" class="btn btn-primary w-100 mt-2">💾 Guardar Empresa & Faena</button>
              </div>
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
            <hr>
            <p><strong>Giro:</strong> <span id="p_giro">—</span></p>
            <p><strong>Responsable:</strong> <span id="p_responsable">—</span></p>
            <p><strong>Trabajadores:</strong> <span id="p_trabajadores">—</span></p>
            <p><strong>Cumplimiento:</strong> <span id="p_cumple">—</span></p>

            <div id="mapPreviewCard" style="height:250px; border-radius:10px; margin-top:8px;"></div>
            <button id="btnMapCard" class="btn btn-outline-success w-100 mt-2">📍 Mostrar mapa</button>

            <hr>

            <!-- ARRIENDO RÁPIDO -->
            <div style="margin-top:8px;">
              <h6>Arriendo / Contrato</h6>
              <div class="mb-2">
                <label>Inicio arriendo</label>
                <input id="arriendoInicio" type="date" class="form-control" />
              </div>
              <div class="mb-2">
                <label>Término arriendo</label>
                <input id="arriendoFin" type="date" class="form-control" />
              </div>
              <div class="d-flex gap-2">
                <button id="btnCrearArriendo" class="btn btn-outline-primary flex-1">📝 Crear / Actualizar Arriendo</button>
                <button id="btnCargarArriendo" class="btn btn-outline-secondary">🔁 Cargar Arriendo</button>
              </div>
              <div id="arriendoPreview" style="margin-top:8px;"></div>
            </div>

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
  const p_giro = document.getElementById("p_giro");
  const p_responsable = document.getElementById("p_responsable");
  const p_trabajadores = document.getElementById("p_trabajadores");
  const p_cumple = document.getElementById("p_cumple");

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

    // Business preview
    p_giro.textContent = document.getElementById("giroEmpresa").value || "—";
    p_responsable.textContent = document.getElementById("responsableSeguridad").value || "—";
    p_trabajadores.textContent = document.getElementById("numTrabajadores").value || "—";
    p_cumple.textContent = document.getElementById("cumplimiento").selectedOptions[0]?.text || "—";
  }

  geoMinaForm.onsubmit = async (e) => {
    e.preventDefault();
    actualizarPreview();
    // Guardar datos de empresa/faena en RTDB en la ruta dispositvos/{deviceId}/business
    const deviceId = DEVICE_ID_DEFAULT;
    const businessData = {
      empresa: document.getElementById("empresa").value || null,
      pais: document.getElementById("pais").value || null,
      region: document.getElementById("region").value || null,
      comuna: document.getElementById("comuna").value || null,
      mina: document.getElementById("mina").value || null,
      tipoMina: document.getElementById("tipoMina").value || null,
      // extras (si existen)
      extras: (() => {
        try {
          const extrasObj = {};
          Array.from(extras.querySelectorAll("input")).forEach(inp => { extrasObj[inp.id || Math.random()] = inp.value; });
          return extrasObj;
        } catch (err) { return {}; }
      })(),
      latitud: document.getElementById("latitud").value || null,
      longitud: document.getElementById("longitud").value || null,
      giro: document.getElementById("giroEmpresa").value || null,
      rut: document.getElementById("rutEmpresa").value || null,
      responsableSeguridad: document.getElementById("responsableSeguridad").value || null,
      numTrabajadores: document.getElementById("numTrabajadores").value || null,
      turnos: document.getElementById("turnos").value || null,
      cumplimiento: document.getElementById("cumplimiento").value || null,
      riesgos: document.getElementById("riesgos").value || null,
      produccion: document.getElementById("produccion").value || null,
      actualizadoEn: Date.now()
    };

    try {
      await set(ref(db, `dispositivos/${deviceId}/business`), businessData);
      alert("✅ Datos de empresa y faena guardados correctamente.");
    } catch (err) {
      console.error(err);
      alert("Error al guardar los datos de negocio. Revisa la consola.");
    }
  };

  ["empresa","mina","tipoMina","latitud","longitud","giroEmpresa","responsableSeguridad","numTrabajadores","cumplimiento"]
    .forEach(id => {
      const el = document.getElementById(id);
      if (el) el.addEventListener("input", actualizarPreview);
    });

  // ================= INICIALIZAR DISPOSITIVO =================
  mostrarDatosDispositivo(DEVICE_ID_DEFAULT, document.getElementById("deviceData"));
  cargarBusinessPreview(DEVICE_ID_DEFAULT);

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

      // Reverse geocoding (Nominatim)
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

  // ================= ARRIENDO (create / load) =================
  const btnCrearArriendo = document.getElementById("btnCrearArriendo");
  const btnCargarArriendo = document.getElementById("btnCargarArriendo");

  btnCrearArriendo.onclick = async () => {
    const deviceId = DEVICE_ID_DEFAULT;
    const inicio = document.getElementById("arriendoInicio").value;
    const fin = document.getElementById("arriendoFin").value;
    if (!inicio || !fin) { alert("Ingresa fecha de inicio y término."); return; }
    // guardamos en /arriendos/{deviceId}
    const arriendoObj = {
      deviceId,
      fechaInicio: new Date(inicio).toISOString(),
      fechaTermino: new Date(fin).toISOString(),
      creadoEn: Date.now()
    };
    try {
      await set(ref(db, `arriendos/${deviceId}`), arriendoObj);
      alert("✅ Arriendo creado/actualizado.");
      renderArriendoPreview(deviceId);
      renderArriendoCard(deviceId);
    } catch (err) {
      console.error(err);
      alert("Error al crear arriendo.");
    }
  };

  btnCargarArriendo.onclick = () => {
    renderArriendoPreview(DEVICE_ID_DEFAULT);
    renderArriendoCard(DEVICE_ID_DEFAULT);
  };

  // Si hay arriendo, cargar preview en el área de dispositivo
  renderArriendoCard(DEVICE_ID_DEFAULT);
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

  // También mostrar arriendo en card (si existe)
  renderArriendoCard(deviceId);
}

// Guarda medición actual en historial_global
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

// ================================================
// BUSINESS — cargar preview inicial si existe
// ================================================
function cargarBusinessPreview(deviceId) {
  const businessRef = ref(db, `dispositivos/${deviceId}/business`);
  onValue(businessRef, (snap) => {
    const data = snap.val();
    if (!data) return;
    // rellenar form y preview
    if (data.empresa) document.getElementById("empresa").value = data.empresa;
    if (data.mina) document.getElementById("mina").value = data.mina;
    if (data.tipoMina) document.getElementById("tipoMina").value = data.tipoMina;
    if (data.latitud) document.getElementById("latitud").value = data.latitud;
    if (data.longitud) document.getElementById("longitud").value = data.longitud;
    if (data.giro) document.getElementById("giroEmpresa").value = data.giro;
    if (data.rut) document.getElementById("rutEmpresa").value = data.rut;
    if (data.responsableSeguridad) document.getElementById("responsableSeguridad").value = data.responsableSeguridad;
    if (data.numTrabajadores) document.getElementById("numTrabajadores").value = data.numTrabajadores;
    if (data.cumplimiento) document.getElementById("cumplimiento").value = data.cumplimiento;
    if (data.riesgos) document.getElementById("riesgos").value = data.riesgos;
    if (data.produccion) document.getElementById("produccion").value = data.produccion;

    // actualizar preview
    const ev = new Event('input');
    ["empresa","mina","tipoMina","latitud","longitud","giroEmpresa","responsableSeguridad","numTrabajadores","cumplimiento"].forEach(id => {
      const el = document.getElementById(id);
      if (el) el.dispatchEvent(ev);
    });
  });
}

// ================================================
// ARRIENDOS — funciones utilitarias
// ================================================
function computeDaysLeft(isoEnd) {
  try {
    const end = new Date(isoEnd);
    const now = new Date();
    const diffMs = end - now;
    return Math.ceil(diffMs / (1000 * 60 * 60 * 24));
  } catch (err) { return null; }
}

function computeArriendoStatus(isoStart, isoEnd) {
  try {
    const start = new Date(isoStart);
    const end = new Date(isoEnd);
    const now = new Date();
    if (now < start) return "Pendiente";
    if (now > end) return "Vencido";
    const daysLeft = computeDaysLeft(isoEnd);
    if (daysLeft <= 10) return "Por vencer";
    return "Activo";
  } catch (err) { return "Desconocido"; }
}

// Render pequeño resumen del arriendo en la tarjeta de vista previa
function renderArriendoPreview(deviceId) {
  const preview = document.getElementById("arriendoPreview");
  if (!preview) return;
  preview.innerHTML = "Cargando arriendo...";
  const arriendoRef = ref(db, `arriendos/${deviceId}`);
  onValue(arriendoRef, (snap) => {
    const a = snap.val();
    if (!a) { preview.innerHTML = "<small>No hay arriendo registrado.</small>"; return; }
    const daysLeft = computeDaysLeft(a.fechaTermino);
    const status = computeArriendoStatus(a.fechaInicio, a.fechaTermino);
    preview.innerHTML = `
      <div><strong>Inicio:</strong> ${new Date(a.fechaInicio).toLocaleDateString()}</div>
      <div><strong>Termino:</strong> ${new Date(a.fechaTermino).toLocaleDateString()}</div>
      <div><strong>Días restantes:</strong> ${daysLeft}</div>
      <div><strong>Estado:</strong> <span class="badge badge-${status === 'Vencido' ? 'danger' : (status === 'Por vencer' ? 'warning' : 'success')}">${status}</span></div>
    `;
  });
}

// Render arriendo dentro del card de datos del dispositivo (alertas incluidas)
function renderArriendoCard(deviceId) {
  const card = document.getElementById("arriendoCard");
  if (!card) return;
  card.innerHTML = "Cargando arriendo...";
  const arriendoRef = ref(db, `arriendos/${deviceId}`);
  onValue(arriendoRef, (snap) => {
    const a = snap.val();
    if (!a) { card.innerHTML = ""; return; }
    const daysLeft = computeDaysLeft(a.fechaTermino);
    const status = computeArriendoStatus(a.fechaInicio, a.fechaTermino);

    // Barra de progreso simple
    let pct = 0;
    try {
      const s = new Date(a.fechaInicio).getTime();
      const e = new Date(a.fechaTermino).getTime();
      const now = Date.now();
      if (now <= s) pct = 0;
      else if (now >= e) pct = 100;
      else pct = Math.round(((now - s) / (e - s)) * 100);
    } catch (err) { pct = 0; }

    card.innerHTML = `
      <div style="padding:8px;">
        <h6>Arriendo</h6>
        <div><small>Inicio: ${new Date(a.fechaInicio).toLocaleString()}</small></div>
        <div><small>Fin: ${new Date(a.fechaTermino).toLocaleString()}</small></div>
        <div style="margin-top:6px;">
          <div style="height:10px;background:#eee;border-radius:6px;overflow:hidden;">
            <div style="width:${pct}%;height:100%;background:${status === 'Vencido' ? '#e74c3c' : (status === 'Por vencer' ? '#f39c12' : '#2ecc71')};"></div>
          </div>
          <small>${pct}% transcurrido — ${daysLeft} días restantes</small>
        </div>
        <div style="margin-top:6px;">
          <strong>Estado:</strong> <span style="font-weight:bold;color:${status === 'Vencido' ? '#e74c3c' : (status === 'Por vencer' ? '#f39c12' : '#2ecc71')}">${status}</span>
        </div>
      </div>
    `;

    // Alertas visuales (puedes mejorar con sonido o notificaciones)
    if (status === "Por vencer") {
      // simple DOM alert
      const existing = document.getElementById("arriendoAlert");
      if (!existing) {
        const aEl = document.createElement("div");
        aEl.id = "arriendoAlert";
        aEl.className = "alert alert-warning";
        aEl.innerHTML = `⚠️ Arriendo por vencer en ${daysLeft} días. <button id="btnRenovar" class="btn btn-sm btn-outline-primary">Renovar</button>`;
        card.appendChild(aEl);
        document.getElementById("btnRenovar").onclick = () => {
          // abrir modal o prellenar fecha para renovar (simplificado: abre la caja de fecha)
          const finInput = document.getElementById("arriendoFin");
          if (finInput) finInput.focus();
          alert("Ingresa nueva fecha de término y presiona 'Crear / Actualizar Arriendo' para renovar.");
        };
      } else {
        existing.innerHTML = `⚠️ Arriendo por vencer en ${daysLeft} días. <button id="btnRenovar" class="btn btn-sm btn-outline-primary">Renovar</button>`;
      }
    } else {
      const existing = document.getElementById("arriendoAlert");
      if (existing) existing.remove();
    }
  });
}

// ================================================
// HISTORIAL COMPLETO (mantengo tu estructura)
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

// ================================================
// FIN
// ================================================

