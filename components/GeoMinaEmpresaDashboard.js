// ================================================
// GeoMinaEmpresaDashboard.js — Formulario dividido + mapa dentro de vista previa
// ================================================
import { auth, db, firestore } from "../firebaseConfig.js";
import { doc, setDoc, onSnapshot } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-firestore.js";
import { ref, update } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-database.js";
import { onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-auth.js";
import { navigate } from "../app.js";

export function showGeoMinaEmpresaDashboard() {
  const root = document.getElementById("root");
  root.innerHTML = `
  <div class="ms-dashboard">
    <!-- SIDEBAR -->
    <aside class="ms-sidebar glass">
      <div class="ms-brand">
        <img src="assets/images/logo.svg" alt="Minesafe Logo" class="ms-logo"/>
        <h1>Minesafe</h1>
      </div>
      
      <!-- ✅ NAVIGATION COMPLETA -->
      <nav class="ms-nav">
        <button data-view="user" class="btn-home">🏠 Inicio</button>
        <button data-view="userform">👤 Datos</button>
        <button data-view="datosdelusuario">🧾 Mis Datos</button>
        <button data-view="tipomina">⛏️ Mina</button>
        <button data-view="geoempresa">🌍 Empresa</button>
        <button data-view="geominaempresa" class="active">🏭 Empresa & Mina</button>
        <button data-view="devices">💡 Dispositivos</button>
        <button data-view="alerts">🚨 Alertas</button>
        <button data-view="history">📜 Historial</button>
        <button data-view="manager">🗂️ Manage</button>
        <button data-view="usuarios">👥 Usuarios</button>
        <button data-view="graficos">📊 Gráficos</button>
        <button data-view="geolocalizacion">📍 Mapa</button>
      </nav>

      <footer class="ms-footer">
        <button id="logoutBtn" class="btn-logout">🚪 Cerrar sesión</button>
        <small>© 2025 Minesafe</small>
      </footer>
    </aside>

    <!-- MAIN -->
    <main class="ms-main">
      <header class="ms-header">
        <div class="ms-header-left">
          <button id="backBtn" class="btn-back">⬅ Volver</button>
          <h2>Geo Mina Empresa</h2>
        </div>
        <div class="ms-header-right">
          <button id="toggleTheme" class="btn-theme">🌓</button>
        </div>
      </header>

      <!-- CONTENIDO -->
      <section class="ms-grid py-4 container">
        <div class="row">
          <!-- CARD 1: DATOS EMPRESA Y MINA -->
          <div class="col-lg-6 mt-3">
            <div class="card shadow-lg border-0 rounded-4">
              <div class="card-body">
                <h4 class="card-title text-primary mb-3">🏭 Datos de Empresa y Mina</h4>
                <form id="geoMinaForm">
                  <div class="mb-3">
                    <label>Nombre Empresa:</label>
                    <input id="empresa" class="form-control" placeholder="Nombre de la empresa" />
                  </div>

                  <div class="row">
                    <div class="col-md-6 mb-3">
                      <label>País</label>
                      <input id="pais" class="form-control" placeholder="País" />
                    </div>
                    <div class="col-md-6 mb-3">
                      <label>Región</label>
                      <input id="region" class="form-control" placeholder="Región / Estado" />
                    </div>
                  </div>

                  <div class="row">
                    <div class="col-md-6 mb-3">
                      <label>Comuna</label>
                      <input id="comuna" class="form-control" placeholder="Comuna / Municipio" />
                    </div>
                    <div class="col-md-6 mb-3">
                      <label>Nombre Mina</label>
                      <input id="mina" class="form-control" placeholder="Nombre de la mina" />
                    </div>
                  </div>

                  <div class="mb-3">
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

                  <div id="camposExtras" class="mb-3"></div>
                </form>
              </div>
            </div>
          </div>

          <!-- CARD 2: LOCALIZACIÓN -->
          <div class="col-lg-6 mt-3">
            <div class="card shadow-lg border-0 rounded-4">
              <div class="card-body">
                <h4 class="card-title text-primary mb-3">📍 Localización</h4>

                <div class="row">
                  <div class="col-md-6 mb-3">
                    <label>Localidad</label>
                    <input id="localidad" class="form-control" placeholder="Localidad o referencia cercana" />
                  </div>
                  <div class="col-md-6 mb-3">
                    <label>Dirección</label>
                    <input id="direccion" class="form-control" placeholder="Dirección o ruta de acceso" />
                  </div>
                </div>

                <div class="mb-3 text-center">
                  <button type="button" id="getLocationBtn" class="btn btn-outline-primary btn-sm">
                    📡 Obtener ubicación actual
                  </button>
                  <small class="text-muted d-block mt-1">Uso de geolocalización (OSM)</small>
                </div>

                <div class="row">
                  <div class="col-md-6 mb-3">
                    <label>Latitud</label>
                    <input id="latitud" type="number" step="any" class="form-control" placeholder="Latitud" />
                  </div>
                  <div class="col-md-6 mb-3">
                    <label>Longitud</label>
                    <input id="longitud" type="number" step="any" class="form-control" placeholder="Longitud" />
                  </div>
                </div>

                <div class="row">
                  <div class="col-md-6 mb-3">
                    <label>UTM Zona</label>
                    <input id="utmZona" class="form-control" placeholder="Zona UTM" />
                  </div>
                  <div class="col-md-6 mb-3">
                    <label>Altitud (m)</label>
                    <input id="altitud" type="number" step="any" class="form-control" placeholder="Altitud" />
                  </div>
                </div>

                <div class="mb-3">
                  <label>Referencia</label>
                  <input id="referencia" class="form-control" placeholder="Punto notable u observaciones..." />
                </div>

                <div class="mt-4">
                  <button class="btn btn-primary w-100" id="saveGeoMina">💾 Guardar</button>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- PANEL DE VISTA PREVIA -->
        <div class="row mt-4">
          <div class="col-12">
            <div class="card glass border-0 rounded-4 shadow">
              <div class="card-body">
                <h4 class="card-title mb-3">Vista Previa</h4>
                <p><strong>Empresa:</strong> <span id="p_empresa">—</span></p>
                <p><strong>Mina:</strong> <span id="p_mina">—</span></p>
                <p><strong>Tipo:</strong> <span id="p_tipo">—</span></p>
                <p><strong>Coordenadas:</strong> <span id="p_coord">—</span></p>
                <div id="previewMap" style="height: 350px; border-radius: 10px; margin-top: 10px;"></div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  </div>
  `;

  // ======== NAVEGACIÓN ENTRE VISTAS ========
  document.querySelectorAll(".ms-nav button").forEach(btn => {
    btn.addEventListener("click", () => {
      document.querySelectorAll(".ms-nav button").forEach(b => b.classList.remove("active"));
      btn.classList.add("active");
      navigate(btn.dataset.view);
    });
  });

  document.getElementById("backBtn").onclick = () => navigate("userform");
  document.getElementById("logoutBtn").onclick = () => signOut(auth).then(() => navigate("login"));
  document.getElementById("toggleTheme").onclick = () => document.body.classList.toggle("dark-mode");

  // ======== FORMULARIO ========
  const tipoMina = document.getElementById("tipoMina");
  const extras = document.getElementById("camposExtras");
  const getLocationBtn = document.getElementById("getLocationBtn");
  const saveBtn = document.getElementById("saveGeoMina");

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

  function renderExtras(tipo) {
    extras.innerHTML = plantillas[tipo] || "";
  }

  tipoMina.onchange = (e) => {
    renderExtras(e.target.value);
    p_tipo.textContent = e.target.options[e.target.selectedIndex]?.text || "—";
  };

  // ======== MAPA ========
  const previewMap = L.map("previewMap").setView([-33.45, -70.65], 4);
  L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", { maxZoom: 19 }).addTo(previewMap);
  let previewMarker = null;

  function actualizarPreview() {
    p_empresa.textContent = document.getElementById("empresa").value || "—";
    p_mina.textContent = document.getElementById("mina").value || "—";
    p_tipo.textContent = tipoMina.selectedOptions[0]?.text || "—";

    const lat = parseFloat(document.getElementById("latitud").value);
    const lon = parseFloat(document.getElementById("longitud").value);
    p_coord.textContent = lat && lon ? `${lat}, ${lon}` : "—";

    if (!isNaN(lat) && !isNaN(lon)) {
      if (previewMarker) previewMap.removeLayer(previewMarker);
      previewMarker = L.marker([lat, lon]).addTo(previewMap).bindPopup("📍 Ubicación Mina").openPopup();
      previewMap.setView([lat, lon], 12);
    }
  }

  document.getElementById("latitud").addEventListener("input", actualizarPreview);
  document.getElementById("longitud").addEventListener("input", actualizarPreview);

  getLocationBtn.onclick = async () => {
    if (!navigator.geolocation) return alert("Tu navegador no soporta geolocalización.");
    getLocationBtn.disabled = true;
    getLocationBtn.textContent = "Obteniendo...";
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        document.getElementById("latitud").value = pos.coords.latitude.toFixed(6);
        document.getElementById("longitud").value = pos.coords.longitude.toFixed(6);
        getLocationBtn.disabled = false;
        getLocationBtn.textContent = "📡 Obtener ubicación actual";
        actualizarPreview();
      },
      (err) => {
        alert("No se pudo obtener la ubicación: " + err.message);
        getLocationBtn.disabled = false;
        getLocationBtn.textContent = "📡 Obtener ubicación actual";
      }
    );
  };

  // ======== FIREBASE ========
  onAuthStateChanged(auth, (user) => {
    if (!user) return navigate("login");
    const refDoc = doc(firestore, "users", user.uid);
    onSnapshot(refDoc, (snap) => {
      const d = snap.data() || {};
      document.getElementById("empresa").value = d.nombreEmpresa || "";
      document.getElementById("mina").value = d.nombreMina || "";
      document.getElementById("tipoMina").value = d.tipoMina || "";
      renderExtras(d.tipoMina);
      actualizarPreview();
    });

    saveBtn.onclick = async (e) => {
      e.preventDefault();
      const dataGuardar = {
        nombreEmpresa: document.getElementById("empresa").value.trim(),
        nombreMina: document.getElementById("mina").value.trim(),
        tipoMina: document.getElementById("tipoMina").value,
        fechaRegistro: new Date().toISOString(),
      };
      await setDoc(refDoc, dataGuardar, { merge: true });
      await update(ref(db, `usuarios/${user.uid}`), dataGuardar);
      alert("✅ Datos guardados correctamente");
      actualizarPreview();
    };
  });
}
