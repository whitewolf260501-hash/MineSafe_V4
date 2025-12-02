// ============================================================
// UserContracts.js — Mis Contratos (USUARIO)
// ============================================================

import { navigate } from "../app.js";

export function showUserContracts() {
  const root = document.getElementById("root");

  root.innerHTML = `
  <div class="ms-dashboard">
    
    <!-- SIDEBAR -->
    <aside class="ms-sidebar">
      <div class="ms-brand">
        <img src="assets/images/Logo2.png" class="ms-logo"/>
        <h1>Minesafe 2</h1>
      </div>

      <nav class="ms-nav">
        <button data-view="userform">👤 Datos</button>
        <button data-view="devices">💡 Dispositivos</button>
        <button class="active" data-view="contratos">📄 Mis Contratos</button>
        <button data-view="alerts">🚨 Alertas</button>
        <button data-view="history">📜 Historial</button>
      </nav>

      <div class="ms-footer">
        <button id="themeToggle" class="btn btn-ghost">🌓 Tema</button>
        <button class="logout">🔒 Cerrar Sesión</button>
      </div>
    </aside>

    <!-- MAIN -->
    <main class="ms-main">
      <header class="ms-header">
        <h2>Mis Contratos</h2>
        <p class="ms-sub">Información de arriendos de dispositivos</p>
      </header>

      <section class="ms-panel">

        <div class="panel-card p-3 mb-4">
          <h3>Contrato Actual</h3>
          <div id="currentContract">
            <p class="text-muted">Cargando...</p>
          </div>
        </div>

        <div class="panel-card p-3">
          <h3>Historial</h3>

          <div class="table-responsive mt-3">
            <table class="table table-striped table-bordered">
              <thead class="table-dark">
                <tr>
                  <th>Dispositivo</th>
                  <th>Inicio</th>
                  <th>Fin</th>
                  <th>Estado</th>
                </tr>
              </thead>
              <tbody id="contractHistoryBody"></tbody>
            </table>
          </div>
        </div>

      </section>
    </main>

  </div>
  `;

  // NAVBAR FUNCIONAL
  document.querySelectorAll("button[data-view]").forEach(btn => {
    btn.addEventListener("click", () => navigate(btn.dataset.view));
  });
}
