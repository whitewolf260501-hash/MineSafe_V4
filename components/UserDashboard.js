// ============================================================
// userDashboard.js — Panel moderno con navegación + gráficos + velocímetro responsive
// ============================================================
import { auth, firestore, onAuthStateChanged } from "../firebaseConfig.js";
import { doc, onSnapshot } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-firestore.js";
import { navigate } from "../app.js";

// Asegúrate de tener Chart.js en tu proyecto:
// <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>

export function showUserDashboard() {
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
        <button data-view="userform" class="active">👤 Datos</button>
        <button data-view="datosdelusuario">🧾 Mis Datos</button>
        <button data-view="tipomina">⛏️ Mina</button>
        <button data-view="geoempresa">🌍 Empresa</button>
        <button data-view="geominaempresa">🏭 Empresa & Mina</button>
        <button data-view="devices">💡 Dispositivos</button>
        <button data-view="alerts">🚨 Alertas</button>
        <button data-view="history">📜 Historial</button>
        <button data-view="manager">🗂️ Manage</button>
        <button data-view="usuarios">👥 Usuarios</button>
        <button data-view="devicelive">📡 Datos del Dispositivo</button>

        <button data-view="graficos">📊 Gráficos</button>
        <button data-view="geolocalizacion">📍 Mapa</button>
      </nav>

      <div class="ms-footer">
        <button id="themeToggle" class="btn btn-ghost">🌓 Tema</button>
        <button class="logout">🔒 Cerrar Sesión</button>
      </div>
    </aside>

    <!-- ================== MAIN CONTENT ================== -->
    <main class="ms-main">
      <header class="ms-header">
        <div class="ms-header-left">
          <h2>Panel de Control</h2>
          <p class="ms-sub">Monitoreo general del sistema</p>
        </div>
        <div class="ms-header-right">
          <input type="search" placeholder="Buscar..." class="ms-search"/>
        </div>
      </header>

      <!-- ==== TARJETAS RESUMEN ==== -->
      <section class="ms-summary">
        <div class="summary-card blue">
          <h4>Ingresos</h4>
          <p class="value">$20,000</p>
        </div>
        <div class="summary-card purple">
          <h4>Uso de Nube</h4>
          <p class="value">50/50 GB</p>
        </div>
        <div class="summary-card teal">
          <h4>Dispositivos Activos</h4>
          <p class="value">8</p>
        </div>
        <div class="summary-card yellow">
          <h4>Alertas Recientes</h4>
          <p class="value">3</p>
        </div>
      </section>

      <!-- ==== BLOQUE DE GRÁFICOS ==== -->
      <section class="ms-grid">
        <div class="panel-card">
          <div class="panel-top"><h3>Actividad de Sensores</h3></div>
          <div class="panel-body"><canvas id="sensorChart"></canvas></div>
        </div>

        <div class="panel-card">
          <div class="panel-top">
            <h3>Nivel de Sensores</h3>
            <p class="subtitulo">Estado</p>
          </div>
          <div class="panel-body">
            <canvas id="sensorGauge" style="width:100%; height:auto;"></canvas>
          </div>
        </div>
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

      if (view === "geominaempresa") {
        const module = await import("./GeoMinaEmpresaDashboard.js");
        module.showGeoMinaEmpresaDashboard();
      } else if (view === "datosdelusuario") {
        navigate("datosdelusuario");
      } else {
        navigate(view);
      }
    });
  });

  // ==================== LOGOUT ====================
  document.querySelector(".logout").onclick = async () => {
    await auth.signOut();
    navigate("login");
  };

  // ==================== TEMA OSCURO / CLARO ====================
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

  // ==================== PERFIL DE USUARIO ====================
  onAuthStateChanged(auth, async (user) => {
    if (!user) return (root.innerHTML = "<p>No hay usuario autenticado.</p>");
    const userDoc = doc(firestore, "users", user.uid);
    onSnapshot(userDoc, (snap) => {
      const data = snap.exists() ? snap.data() : {};
      document.getElementById("username").textContent = data.nombre || "Usuario";
      document.getElementById("useremail").textContent = user.email;
    });
  });

  // ==================== INICIAR GRÁFICOS ====================
  initCharts();
}

// ============================================================
// FUNCIÓN: INICIALIZAR GRÁFICOS
// ============================================================
function initCharts() {
  // === Línea: Actividad de sensores ===
  const ctx1 = document.getElementById("sensorChart");
  new Chart(ctx1, {
    type: "line",
    data: {
      labels: ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"],
      datasets: [{
        label: "CO Detectado",
        data: [12, 19, 13, 15, 22, 18, 25],
        borderColor: "#6c63ff",
        backgroundColor: "rgba(108,99,255,0.2)",
        tension: 0.4,
        fill: true
      }]
    },
    options: {
      responsive: true,
      plugins: { legend: { display: false } },
      scales: {
        y: { beginAtZero: true, grid: { color: "rgba(0,0,0,0.05)" } },
        x: { grid: { display: false } }
      }
    }
  });

  // === Gauge (estado general) ===
  drawGauge("sensorGauge", 65);
}

// ============================================================
// FUNCIÓN: DIBUJAR GAUGE RESPONSIVE
// ============================================================
function drawGauge(canvasId, value) {
  const canvas = document.getElementById(canvasId);
  const ctx = canvas.getContext("2d");

  function render() {
    const width = canvas.clientWidth;
    const height = width * 0.6;
    canvas.width = width;
    canvas.height = height;

    const centerX = width / 2;
    const centerY = height * 0.9;
    const radius = Math.min(width, height) / 3;

    ctx.clearRect(0, 0, width, height);

    // === Zonas de color (verde / amarillo / rojo) ===
    const zones = [
      { color: "#00b894", start: -Math.PI, end: -Math.PI / 3 },
      { color: "#fdcb6e", start: -Math.PI / 3, end: Math.PI / 3 },
      { color: "#d63031", start: Math.PI / 3, end: 0 }
    ];

    zones.forEach(z => {
      ctx.beginPath();
      ctx.arc(centerX, centerY, radius, z.start, z.end, false);
      ctx.lineWidth = 20;
      ctx.strokeStyle = z.color;
      ctx.stroke();
    });

    // === Aguja ===
    const angle = -Math.PI + (value / 100) * Math.PI;
    const needleLength = radius * 0.85;
    ctx.beginPath();
    ctx.moveTo(centerX, centerY);
    ctx.lineTo(centerX + needleLength * Math.cos(angle), centerY + needleLength * Math.sin(angle));
    ctx.lineWidth = 4;
    ctx.strokeStyle = "#2d3436";
    ctx.stroke();

    // === Centro ===
    ctx.beginPath();
    ctx.arc(centerX, centerY, 6, 0, 2 * Math.PI);
    ctx.fillStyle = "#2d3436";
    ctx.fill();

    // === Valor ===
    ctx.font = `${Math.max(14, radius * 0.25)}px Poppins`;
    ctx.fillStyle = "#2d3436";
    ctx.textAlign = "center";
    ctx.fillText(value + "%", centerX, centerY - radius * 1.2);
  }

  render();
  window.addEventListener("resize", render);
}
