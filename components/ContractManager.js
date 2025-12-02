// ============================================================
// ContractManager.js — Gestión de Arriendos (ADMIN)
// ============================================================

import { navigate } from "../app.js";

export function showContractManager() {
  const root = document.getElementById("root");

  root.innerHTML = `
  <div class="ms-dashboard">
    <!-- ================== SIDEBAR ================== -->
    <aside class="ms-sidebar">
      <div class="ms-brand">
        <img src="assets/images/Logo2.png" class="ms-logo"/>
        <h1>Minesafe 2</h1>
      </div>

      <nav class="ms-nav">

        <button data-view="dashboard">📊 Dashboard</button>
        <button data-view="usuarios">👥 Usuarios</button>
        <button data-view="devices">💡 Dispositivos</button>

        <button class="active" data-view="contracts">📄 Arriendos</button>

        <button data-view="alerts">🚨 Alertas</button>
        <button data-view="history">📜 Historial</button>
      </nav>

      <div class="ms-footer">
        <button id="themeToggle" class="btn btn-ghost">🌓 Tema</button>
        <button class="logout">🔒 Cerrar Sesión</button>
      </div>
    </aside>

    <!-- ================== MAIN CONTENT ================== -->
    <main class="ms-main">
      <header class="ms-header">
        <h2>Gestión de Arriendos</h2>
        <p class="ms-sub">Administración de contratos y asignación de dispositivos</p>
      </header>

      <section class="ms-panel">

        <button id="btnNewContract" class="btn btn-success mb-3">
          + Crear Nuevo Contrato
        </button>

        <!-- FORMULARIO -->
        <div id="contractForm" class="panel-card p-3 mb-4" style="display:none;">
          <h3>Nuevo Contrato</h3>

          <div class="row g-3 mt-2">
            <div class="col-md-6">
              <label>Usuario</label>
              <select id="userSelect" class="form-select"></select>
            </div>

            <div class="col-md-6">
              <label>Dispositivo</label>
              <select id="deviceSelect" class="form-select"></select>
            </div>

            <div class="col-md-6">
              <label>Inicio Arriendo</label>
              <input type="date" id="fechaInicioArriendo" class="form-control"/>
            </div>

            <div class="col-md-6">
              <label>Fin Arriendo</label>
              <input type="date" id="fechaFinArriendo" class="form-control"/>
            </div>

            <div class="col-12">
              <label>Observaciones</label>
              <textarea id="observaciones" rows="2" class="form-control"></textarea>
            </div>

            <div class="col-12 mt-3">
              <button id="btnSaveContract" class="btn btn-primary w-100">
                Guardar Contrato
              </button>
            </div>
          </div>
        </div>

        <!-- TABLA -->
        <div class="panel-card">
          <h3>Contratos Registrados</h3>

          <div class="table-responsive mt-3">
            <table class="table table-striped table-bordered">
              <thead class="table-dark">
                <tr>
                  <th>Usuario</th>
                  <th>Dispositivo</th>
                  <th>Inicio</th>
                  <th>Fin</th>
                  <th>Estado</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody id="contractsTableBody">
                <!-- filas se cargarán luego -->
              </tbody>
            </table>
          </div>
        </div>
      </section>
    </main>
  </div>
  `;

  // SHOW/HIDE formulario
  document.getElementById("btnNewContract").onclick = () => {
    const form = document.getElementById("contractForm");
    form.style.display = form.style.display === "none" ? "block" : "none";
  };

  // NAVBAR FUNCIONAL
  document.querySelectorAll("button[data-view]").forEach(btn => {
    btn.addEventListener("click", () => navigate(btn.dataset.view));
  });
}
