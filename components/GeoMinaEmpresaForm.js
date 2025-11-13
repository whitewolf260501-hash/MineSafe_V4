// ================================================
// GeoMinaEmpresaDashboard.js
// Vista: Panel / Dashboard con formulario unificado (Empresa + Mina + Geolocalización)
// Reemplaza a GeoEmpresaForm.js y TipoMinaForm.js
// ================================================
import { auth, db, firestore } from "./firebaseConfig.js";
import { doc, setDoc, onSnapshot } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-firestore.js";
import { ref, update } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-database.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-auth.js";
import { navigate } from "./app.js";

export function showGeoMinaEmpresaDashboard() {
  const root = document.getElementById("root");
  root.innerHTML = `
    <div class="ms-dashboard">
      <aside class="ms-sidebar">
        <div class="ms-brand">
          <img src="assets/images/logo.svg" alt="Minesafe" class="ms-logo"/>
          <h1>Minesafe</h1>
        </div>
        <nav class="ms-nav">
          <button data-view="dashboard" class="active">Dashboard</button>
          <button data-view="devices">Dispositivos</button>
          <button data-view="reports">Reportes</button>
          <button data-view="settings">Ajustes</button>
        </nav>
        <div class="ms-attrib">
          <small>Ilustración: Freepik (atribución en /assets/)</small>
        </div>
      </aside>

      <main class="ms-main">
        <header class="ms-header">
          <div class="ms-header-left">
            <h2>🏭 Empresa & ⛏️ Mina — Registro</h2>
            <p class="ms-sub">Completa la información para guardar la ubicación y tipo de mina</p>
          </div>
          <div class="ms-header-right">
            <button id="toggleTheme" class="btn btn-ghost">🌓 Tema</button>
            <button id="logoutBtn" class="btn btn-ghost">Salir</button>
          </div>
        </header>

        <section class="ms-grid">
          <article class="ms-card form-card glass">
            <form id="geoMinaForm" class="form-inner">
              <div class="row">
                <label>Empresa</label>
                <input id="empresa" class="form-control" placeholder="Nombre de la empresa" />
              </div>

              <div class="row split">
                <div>
                  <label>País</label>
                  <input id="pais" class="form-control" placeholder="País" />
                </div>
                <div>
                  <label>Región</label>
                  <input id="region" class="form-control" placeholder="Región / Estado" />
                </div>
              </div>

              <div class="row split">
                <div>
                  <label>Comuna</label>
                  <input id="comuna" class="form-control" placeholder="Comuna / Municipio" />
                </div>
                <div>
                  <label>Nombre mina</label>
                  <input id="mina" class="form-control" placeholder="Nombre de la mina" />
                </div>
              </div>

              <div class="row">
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

              <div id="camposExtras" class="row extras"></div>

              <h4 class="section-title">Localización</h4>

              <div class="row split">
                <div>
                  <label>Localidad</label>
                  <input id="localidad" class="form-control" placeholder="Localidad o referencia cercana" />
                </div>
                <div>
                  <label>Dirección</label>
                  <input id="direccion" class="form-control" placeholder="Dirección o ruta de acceso (opcional)" />
                </div>
              </div>

              <div class="row geo-actions">
                <button type="button" id="getLocationBtn" class="btn btn-outline">📡 Obtener ubicación actual</button>
                <small class="muted">Uso de geolocalización y reverse geocoding (OSM)</small>
              </div>

              <div class="row split">
                <div><label>Latitud</label><input id="latitud" type="number" step="any" class="form-control" placeholder="Latitud" /></div>
                <div><label>Longitud</label><input id="longitud" type="number" step="any" class="form-control" placeholder="Longitud" /></div>
              </div>

              <div class="row split">
                <div><label>UTM Zona</label><input id="utmZona" class="form-control" placeholder="Zona UTM" /></div>
                <div><label>Altitud (m)</label><input id="altitud" type="number" step="any" class="form-control" placeholder="Altitud" /></div>
              </div>

              <div class="row">
                <label>Referencia</label>
                <input id="referencia" class="form-control" placeholder="Punto notable, observaciones..." />
              </div>

              <div class="row actions">
                <button class="btn btn-primary w100">💾 Guardar</button>
                <button type="button" id="backBtn" class="btn btn-secondary">⬅️ Volver</button>
              </div>
            </form>
          </article>

          <aside class="ms-card panel-card glass">
            <div class="panel-top">
              <img src="assets/images/dashboard-illustration.svg" alt="Ilustración" class="illustration"/>
              <h3>Resumen / Vista previa</h3>
            </div>

            <div class="panel-body" id="previewPanel">
              <p><strong>Empresa:</strong> <span id="p_empresa">—</span></p>
              <p><strong>Mina:</strong> <span id="p_mina">—</span></p>
              <p><strong>Tipo:</strong> <span id="p_tipo">—</span></p>
              <p><strong>Coordenadas:</strong> <span id="p_coord">—</span></p>
              <div id="mapPlaceholder" class="map-placeholder">Mapa / Mini-map</div>
            </div>
          </aside>
        </section>
      </main>
    </div>
  `;

  // Element refs
  const tipoMina = document.getElementById("tipoMina");
  const extras = document.getElementById("camposExtras");
  const getLocationBtn = document.getElementById("getLocationBtn");
  const backBtn = document.getElementById("backBtn");
  const geoMinaForm = document.getElementById("geoMinaForm");

  const p_empresa = document.getElementById("p_empresa");
  const p_mina = document.getElementById("p_mina");
  const p_tipo = document.getElementById("p_tipo");
  const p_coord = document.getElementById("p_coord");

  // Plantillas dinámicas por tipo de mina
  const plantillas = {
    subterranea: `
      <h5>Datos subterráneos</h5>
      <input id="nivel" class="form-control mb-2" placeholder="Nivel o piso" />
      <input id="galeria" class="form-control mb-2" placeholder="Galería / rampa" />
      <input id="frente" class="form-control mb-2" placeholder="Frente o cámara" />
    `,
    tajo_abierto: `
      <h5>Tajo Abierto</h5>
      <input id="tajo" class="form-control mb-2" placeholder="Tajo o sector" />
      <input id="banco" class="form-control mb-2" placeholder="Banco" />
      <input id="frente" class="form-control mb-2" placeholder="Frente activo" />
    `,
    aluvial: `
      <h5>Aluvial</h5>
      <input id="rio" class="form-control mb-2" placeholder="Río o quebrada" />
      <input id="tramo" class="form-control mb-2" placeholder="Tramo (km)" />
      <input id="poza" class="form-control mb-2" placeholder="Poza / frente" />
    `,
    cantera: `
      <h5>Cantera</h5>
      <input id="material" class="form-control mb-2" placeholder="Material extraído" />
      <input id="banco" class="form-control mb-2" placeholder="Banco / zona" />
      <input id="frente" class="form-control mb-2" placeholder="Frente activo" />
    `,
    pirquen: `
      <h5>Pirquén / Artesanal</h5>
      <input id="faena" class="form-control mb-2" placeholder="Nombre faena" />
      <input id="nivel" class="form-control mb-2" placeholder="Nivel principal" />
      <input id="frente" class="form-control mb-2" placeholder="Frente de trabajo" />
    `
  };

  function renderExtras(tipo) {
    extras.innerHTML = plantillas[tipo] || "";
  }

  tipoMina.onchange = (e) => {
    renderExtras(e.target.value);
    p_tipo.textContent = e.target.options[e.target.selectedIndex]?.text || "—";
  };

  backBtn.onclick = () => navigate("user");

  // Obtener y rellenar ubicación (geolocalización + reverse geocoding OSM)
  getLocationBtn.onclick = async () => {
    if (!navigator.geolocation) return alert("Tu navegador no soporta geolocalización.");

    getLocationBtn.disabled = true;
    getLocationBtn.textContent = "Obteniendo...";

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const lat = pos.coords.latitude;
        const lon = pos.coords.longitude;
        const alt = pos.coords.altitude ?? null;

        document.getElementById("latitud").value = lat.toFixed(6);
        document.getElementById("longitud").value = lon.toFixed(6);
        if (alt !== null) document.getElementById("altitud").value = alt.toFixed(2);

        // reverse geocoding (Nominatim OSM)
        try {
          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json&accept-language=es`
          );
          const data = await res.json();
          const addr = data?.address || {};
          document.getElementById("pais").value = addr.country || "";
          document.getElementById("region").value = addr.state || addr.region || "";
          document.getElementById("comuna").value = addr.city || addr.town || addr.village || "";
          document.getElementById("localidad").value = addr.suburb || addr.neighbourhood || "";
          document.getElementById("direccion").value = data.display_name || "";
        } catch (err) {
          console.warn("Reverse geocoding falló:", err);
        }

        getLocationBtn.disabled = false;
        getLocationBtn.textContent = "📡 Obtener ubicación actual";
        actualizarPreview();
        alert("Ubicación obtenida.");
      },
      (err) => {
        alert("No se pudo obtener la ubicación: " + err.message);
        getLocationBtn.disabled = false;
        getLocationBtn.textContent = "📡 Obtener ubicación actual";
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  // Cargar datos de Firestore si existen y manejar guardado
  onAuthStateChanged(auth, (user) => {
    if (!user) return navigate("login");
    const refDoc = doc(firestore, "users", user.uid);

    onSnapshot(refDoc, (snap) => {
      const d = snap.data() || {};
      document.getElementById("empresa").value = d.nombreEmpresa || "";
      document.getElementById("pais").value = d.pais || "";
      document.getElementById("region").value = d.region || "";
      document.getElementById("comuna").value = d.comuna || "";
      document.getElementById("mina").value = d.nombreMina || "";
      document.getElementById("tipoMina").value = d.tipoMina || "";
      renderExtras(d.tipoMina);
      // rellenar coordenadas si existen
      if (d.localizacion?.coordenadas) {
        const c = d.localizacion.coordenadas;
        document.getElementById("latitud").value = c.latitud ?? "";
        document.getElementById("longitud").value = c.longitud ?? "";
        document.getElementById("utmZona").value = c.utm?.zona ?? "";
        document.getElementById("altitud").value = c.altitud ?? "";
      }
      actualizarPreview();
    });

    geoMinaForm.onsubmit = async (e) => {
      e.preventDefault();
      const extrasInputs = {};
      extras.querySelectorAll("input").forEach((i) => (extrasInputs[i.id] = i.value));

      const dataGuardar = {
        nombreEmpresa: document.getElementById("empresa").value.trim(),
        nombreMina: document.getElementById("mina").value.trim(),
        tipoMina: document.getElementById("tipoMina").value,
        pais: document.getElementById("pais").value.trim(),
        region: document.getElementById("region").value.trim(),
        comuna: document.getElementById("comuna").value.trim(),
        localizacion: {
          localidad: document.getElementById("localidad").value.trim(),
          direccion: document.getElementById("direccion").value.trim(),
          coordenadas: {
            latitud: parseFloat(document.getElementById("latitud").value) || null,
            longitud: parseFloat(document.getElementById("longitud").value) || null,
            utm: {
              zona: document.getElementById("utmZona").value,
            },
            altitud: parseFloat(document.getElementById("altitud").value) || null,
          },
          referencia: document.getElementById("referencia").value.trim(),
          fechaRegistro: new Date().toISOString(),
        },
        detalle: extrasInputs,
      };

      await setDoc(refDoc, dataGuardar, { merge: true });
      await update(ref(db, `usuarios/${user.uid}`), dataGuardar);
      alert("✅ Datos guardados correctamente");
      actualizarPreview();
    };
  });

  // mini preview live
  function actualizarPreview() {
    p_empresa.textContent = document.getElementById("empresa").value || "—";
    p_mina.textContent = document.getElementById("mina").value || "—";
    p_tipo.textContent = document.getElementById("tipoMina").selectedOptions[0]?.text || "—";
    const lat = document.getElementById("latitud").value;
    const lon = document.getElementById("longitud").value;
    p_coord.textContent = lat && lon ? `${lat}, ${lon}` : "—";
  }

  // actualizar preview en inputs (delegación simple)
  root.addEventListener("input", (e) => {
    if (["empresa","mina","latitud","longitud","tipoMina"].includes(e.target.id)) actualizarPreview();
  });

  // Tema toggle (clase en body)
  document.getElementById("toggleTheme").onclick = () => document.body.classList.toggle("ms-dark");

  // Logout (si quieres, añade signOut)
  document.getElementById("logoutBtn").onclick = () => {
    // opcional: firebase signOut
    // signOut(auth).then(() => navigate('login'));
    alert("Cerrar sesión (implementa signOut si lo deseas).");
  };
}
