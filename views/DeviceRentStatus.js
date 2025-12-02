// ============================================================
// DeviceRentStatus.js — Estado de arriendo por dispositivo
// ============================================================

import { auth, firestore, onAuthStateChanged } from "../firebaseConfig.js";
import { collection, getDocs, doc, getDoc } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-firestore.js";
import { navigate } from "../app.js";

export function showDeviceRentStatus() {
  const root = document.getElementById("root");

  root.innerHTML = `
  <div class="ms-dashboard">
    <aside class="ms-sidebar">
      <div class="ms-brand">
        <img src="assets/images/Logo2.png" class="ms-logo"/>
        <h1>Minesafe 2</h1>
      </div>

      <nav class="ms-nav">
        <button data-view="admin">📊 Dashboard</button>
        <button data-view="usuarios">👥 Usuarios</button>
        <button class="active" data-view="devices">💡 Dispositivos</button>
        <button data-view="contracts">📄 Arriendos</button>
      </nav>

      <div class="ms-footer">
        <button id="themeToggle" class="btn btn-ghost">🌓 Tema</button>
        <button class="logout">🔒 Cerrar Sesión</button>
      </div>
    </aside>

    <main class="ms-main">
      <header class="ms-header">
        <h2>Estado de Arriendos (Dispositivos)</h2>
        <p class="ms-sub">Ver rápido qué dispositivos están ocupados o disponibles</p>
      </header>

      <section class="ms-panel">
        <div class="panel-card">
          <div class="d-flex justify-content-between mb-2">
            <h3>Dispositivos</h3>
            <button id="btnRefreshDevices" class="btn btn-outline-secondary">🔄 Refrescar</button>
          </div>

          <div class="table-responsive">
            <table class="table table-striped">
              <thead class="table-dark">
                <tr>
                  <th>Dispositivo</th>
                  <th>Serial</th>
                  <th>Estado</th>
                  <th>Usuario</th>
                  <th>Vence</th>
                  <th>Contrato</th>
                </tr>
              </thead>
              <tbody id="devicesBody"></tbody>
            </table>
          </div>

        </div>
      </section>
    </main>
  </div>
  `;

  document.querySelectorAll("button[data-view]").forEach(btn => {
    btn.addEventListener("click", () => navigate(btn.dataset.view));
  });

  document.querySelector(".logout").onclick = async () => {
    await auth.signOut();
    navigate("login");
  };

  document.getElementById("btnRefreshDevices").onclick = renderDevices;

  onAuthStateChanged(auth, async (user) => {
    if (!user) return navigate("login");
    await renderDevices();
  });

  async function renderDevices() {
    const tbody = document.getElementById("devicesBody");
    tbody.innerHTML = "<tr><td colspan='6'>Cargando...</td></tr>";

    const snap = await getDocs(collection(firestore, "dispositivos"));
    if (snap.empty) {
      tbody.innerHTML = "<tr><td colspan='6'>Sin dispositivos</td></tr>";
      return;
    }

    let html = "";
    for (const d of snap.docs) {
      const data = d.data();
      const name = data.name || d.id;
      const serial = data.serial || "-";
      const rented = !!data.rented;
      let userLabel = "-";
      let vence = "-";
      let contratoId = "-";

      if (rented && data.rentedTo) {
        try {
          const userDoc = await getDoc(doc(firestore, "users", data.rentedTo));
          if (userDoc.exists()) userLabel = userDoc.data().nombre || userDoc.data().email || data.rentedTo;
        } catch {}
        if (data.rentedUntil && data.rentedUntil.toDate) vence = data.rentedUntil.toDate().toLocaleDateString();
        // try find contract linking this device and user that is active
        try {
          // quick search: contracts where deviceId == d.id and estado in [activo, por_vencer]
          const contractsSnap = await getDocs(collection(firestore, "contracts"));
          const found = contractsSnap.docs.find(c => {
            const cd = c.data();
            return cd.deviceId === d.id && (cd.estado === "activo" || cd.estado === "por_vencer");
          });
          if (found) contratoId = found.id;
        } catch {}
      }

      const estadoLabel = rented ? '<span class="badge bg-warning text-dark">Arrendado</span>' : '<span class="badge bg-success">Disponible</span>';

      html += `<tr>
        <td>${name}</td>
        <td>${serial}</td>
        <td>${estadoLabel}</td>
        <td>${userLabel}</td>
        <td>${vence}</td>
        <td>${contratoId}</td>
      </tr>`;
    }

    tbody.innerHTML = html;
  }
}
