// =======================================================
// Graficos.js — Panel de gráficos con navegación lateral
// =======================================================
import { db, ref, onValue } from "../firebaseConfig.js";
import { navigate } from "../app.js";
import { auth } from "../firebaseConfig.js";
import "https://cdn.jsdelivr.net/npm/chartjs-plugin-datalabels@2.2.0";

export function showGraficos() {
  const root = document.getElementById("root");
  root.innerHTML = `
  <div class="dashboard-container">
    <aside class="sidebar">
      <h3 class="sidebar-title">📊 Gráficos</h3>

      <nav class="sidebar-nav">
        <button data-view="user" class="btn-home active">🏠 Inicio</button>
        <button data-view="datosdelusuario">🧾 Mis Datos</button>
        <button data-view="tipomina">⛏️ Mina</button>
        <button data-view="geoempresa">🌍 Empresa</button>
        <button data-view="geominaempresa">🏭 Empresa & Mina</button>
        <button data-view="devices">💡 Dispositivos</button>
        <button data-view="alerts">🚨 Alertas</button>
        <button data-view="history">📜 Historial</button>
        <button data-view="manager">🗂️ Manage</button>
        <button data-view="usuarios">👥 Usuarios</button>
        <button data-view="graficos">📊 Gráficos</button>
        <button data-view="geolocalizacion">📍 Mapa</button>
      </nav>

      <div class="sidebar-footer">
        <button id="themeToggle" class="btn btn-sm btn-light">🌙</button>
        <button class="btn btn-sm btn-danger logout">🚪 Cerrar Sesión</button>
      </div>
    </aside>

    <main class="content-area">
      <div class="header-bar">
        <h2 class="fw-bold text-dark">📈 Gráficos de Sensores</h2>
        <div>
          <button id="exportPDF" class="btn-mini btn-export me-1">📄 PDF</button>
          <button id="exportExcel" class="btn-mini btn-export me-1">📊 Excel</button>
          <button id="exportWord" class="btn-mini btn-export">📝 Word</button>
        </div>
      </div>

      <div class="charts-grid">
        <div class="panel-card">
          <div class="panel-top"><h5>📈 CO, CO₂ y PM2.5 (Tiempo Real)</h5></div>
          <div class="panel-body"><canvas id="chartLine"></canvas></div>
        </div>

        <div class="panel-card">
          <div class="panel-top"><h5>📊 Promedios Semanales</h5></div>
          <div class="panel-body"><canvas id="chartBar"></canvas></div>
        </div>

        <div class="panel-card">
          <div class="panel-top"><h5>🌀 Distribución Actual</h5></div>
          <div class="panel-body"><canvas id="chartDonut"></canvas></div>
        </div>

        <div class="panel-card">
          <div class="panel-top"><h5>🌍 Índice Ambiental</h5></div>
          <div class="panel-body"><canvas id="chartRadar"></canvas></div>
        </div>
      </div>
    </main>
  </div>
  `;

  // =======================
  // 🔹 Navegación lateral
  // =======================
  root.querySelectorAll("button[data-view]").forEach(btn =>
    btn.addEventListener("click", () => navigate(btn.dataset.view))
  );

  // =======================
  // 🔹 Logout
  // =======================
  document.querySelector(".logout").onclick = async () => {
    await auth.signOut();
    navigate("login");
  };

  // =======================
  // 🔹 Tema claro / oscuro
  // =======================
  const themeBtn = document.getElementById("themeToggle");
  themeBtn.onclick = () => {
    document.body.classList.toggle("dark-mode");
    themeBtn.textContent = document.body.classList.contains("dark-mode") ? "🌞" : "🌙";
    localStorage.setItem("theme", document.body.classList.contains("dark-mode") ? "dark" : "light");
  };
  if (localStorage.getItem("theme") === "dark") {
    document.body.classList.add("dark-mode");
    themeBtn.textContent = "🌞";
  }

  // =======================
  // 🔹 Configuración común
  // =======================
  const optionsWithLabels = {
    responsive: true,
    plugins: {
      datalabels: {
        color: "#000",
        anchor: "end",
        align: "top",
        font: { weight: "bold" },
        formatter: value => value
      },
      legend: { position: "bottom" }
    },
    scales: { y: { beginAtZero: true } }
  };

  const lineCtx = document.getElementById("chartLine").getContext("2d");
  const barCtx = document.getElementById("chartBar").getContext("2d");
  const donutCtx = document.getElementById("chartDonut").getContext("2d");
  const radarCtx = document.getElementById("chartRadar").getContext("2d");

  // =======================
  // 🔹 Gráfico de líneas
  // =======================
  const lineChart = new Chart(lineCtx, {
    type: "line",
    plugins: [ChartDataLabels],
    data: {
      labels: [],
      datasets: [
        { label: "CO", data: [], borderColor: "#ff4d4d", backgroundColor: "rgba(255,77,77,0.2)", tension: 0.4 },
        { label: "CO₂", data: [], borderColor: "#00cec9", backgroundColor: "rgba(0,206,201,0.2)", tension: 0.4 },
        { label: "PM2.5", data: [], borderColor: "#fdcb6e", backgroundColor: "rgba(253,203,110,0.2)", tension: 0.4 }
      ]
    },
    options: optionsWithLabels
  });

  // =======================
  // 🔹 Gráfico de barras
  // =======================
  const barChart = new Chart(barCtx, {
    type: "bar",
    plugins: [ChartDataLabels],
    data: {
      labels: ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"],
      datasets: [
        { label: "CO", data: [10, 12, 15, 9, 14, 13, 8], backgroundColor: "#ff7675" },
        { label: "CO₂", data: [20, 22, 19, 18, 25, 21, 23], backgroundColor: "#74b9ff" },
        { label: "PM2.5", data: [8, 9, 11, 10, 12, 8, 7], backgroundColor: "#ffeaa7" }
      ]
    },
    options: optionsWithLabels
  });

  // =======================
  // 🔹 Gráfico de dona
  // =======================
  const donutChart = new Chart(donutCtx, {
    type: "doughnut",
    plugins: [ChartDataLabels],
    data: {
      labels: ["CO", "CO₂", "PM2.5"],
      datasets: [{ data: [30, 45, 25], backgroundColor: ["#ff7675", "#74b9ff", "#ffeaa7"] }]
    },
    options: {
      responsive: true,
      plugins: {
        datalabels: { color: "#000", formatter: v => `${v}%` },
        legend: { position: "bottom" }
      }
    }
  });

  // =======================
  // 🔹 Gráfico radar
  // =======================
  const radarChart = new Chart(radarCtx, {
    type: "radar",
    plugins: [ChartDataLabels],
    data: {
      labels: ["Calidad Aire", "CO₂", "PM2.5", "Temperatura", "Humedad"],
      datasets: [
        {
          label: "Índice Ambiental",
          data: [85, 70, 65, 90, 80],
          borderColor: "#6c5ce7",
          backgroundColor: "rgba(108,92,231,0.2)"
        }
      ]
    },
    options: {
      responsive: true,
      plugins: {
        datalabels: { color: "#000", font: { weight: "bold" } },
        legend: { position: "bottom" }
      }
    }
  });

  // =======================
  // 🔹 Datos en tiempo real
  // =======================
  const deviceRef = ref(db, "dispositivos/device_38A839E81F84");
  onValue(deviceRef, (snap) => {
    const d = snap.val();
    if (!d) return;
    const time = new Date().toLocaleTimeString();

    lineChart.data.labels.push(time);
    lineChart.data.datasets[0].data.push(d.CO || 0);
    lineChart.data.datasets[1].data.push(d.CO2 || 0);
    lineChart.data.datasets[2].data.push(d.PM2_5 || 0);
    if (lineChart.data.labels.length > 10) {
      lineChart.data.labels.shift();
      lineChart.data.datasets.forEach(ds => ds.data.shift());
    }
    lineChart.update();

    donutChart.data.datasets[0].data = [d.CO || 0, d.CO2 || 0, d.PM2_5 || 0];
    donutChart.update();
  });

  // =======================
  // 🔹 Exportar archivos
  // =======================
  document.getElementById("exportPDF").onclick = () => exportData("pdf");
  document.getElementById("exportExcel").onclick = () => exportData("excel");
  document.getElementById("exportWord").onclick = () => exportData("word");

  function exportData(type) {
    const content = `Datos de sensores\n${new Date().toLocaleString()}\nCO, CO₂, PM2.5`;
    let blobType = "text/plain", fileExt = "txt";
    if (type === "pdf") { blobType = "application/pdf"; fileExt = "pdf"; }
    else if (type === "excel") { blobType = "text/csv"; fileExt = "csv"; }
    else if (type === "word") { blobType = "application/msword"; fileExt = "doc"; }

    const blob = new Blob([content], { type: blobType });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `graficos_sensores.${fileExt}`;
    link.click();
  }
}
