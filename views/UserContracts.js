// ============================================================
// UserContracts.js — Mis Contratos (USUARIO)
// ============================================================

import { auth, firestore, onAuthStateChanged } from "../firebaseConfig.js";
import {
  collection, query, where, orderBy, getDocs, doc, getDoc
} from "https://www.gstatic.com/firebasejs/11.0.1/firebase-firestore.js";
import { navigate } from "../app.js";

export function showUserContracts() {
  const root = document.getElementById("root");

  root.innerHTML = `
  <div class="ms-dashboard">
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

    <main class="ms-main">
      <header class="ms-header">
        <h2>Mis Contratos</h2>
        <p class="ms-sub">Tus arriendos y pagos</p>
      </header>

      <section class="ms-panel">
        <div class="panel-card p-3 mb-3">
          <h3>Contrato Actual</h3>
          <div id="currentContract">Cargando...</div>
        </div>

        <div class="panel-card p-3">
          <h3>Historial</h3>
          <div class="table-responsive mt-2">
            <table class="table table-striped">
              <thead class="table-dark">
                <tr>
                  <th>Dispositivo</th>
                  <th>Inicio Contrato</th>
                  <th>Fin Contrato</th>
                  <th>Inicio Arriendo</th>
                  <th>Fin Arriendo</th>
                  <th>Estado</th>
                </tr>
              </thead>
              <tbody id="historyBody"></tbody>
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

  onAuthStateChanged(auth, async (user) => {
    if (!user) return navigate("login");
    await renderUserContracts(user.uid);
  });

  function badgeForEstado(estado) {
    if (estado === "activo") return '<span class="badge bg-success">activo</span>';
    if (estado === "por_vencer") return '<span class="badge bg-warning text-dark">por_vencer</span>';
    if (estado === "vencido") return '<span class="badge bg-danger">vencido</span>';
    return '<span class="badge bg-secondary">-</span>';
  }

  async function renderUserContracts(uid) {
    const currentDiv = document.getElementById("currentContract");
    currentDiv.innerHTML = "Cargando...";

    // query active or por_vencer
    const q = query(collection(firestore, "contracts"), where("userId", "==", uid));
    const snap = await getDocs(q);

    const docs = snap.docs.map(d => ({ id: d.id, ...d.data() }));

    // determine current and history
    const now = new Date();
    let current = null;
    const past = [];

    for (const c of docs) {
      const finContrato = c.fechaFinContrato ? (c.fechaFinContrato.toDate ? c.fechaFinContrato.toDate() : new Date(c.fechaFinContrato)) : null;
      // compute state
      if (finContrato) {
        const diffDays = Math.ceil((finContrato - now) / (1000*60*60*24));
        if (diffDays < 0) c.estado = "vencido";
        else if (diffDays <= 7) c.estado = c.estado === "vencido" ? "vencido" : "por_vencer";
        else if (!c.estado) c.estado = "activo";
      }

      // current if activo or por_vencer
      if (c.estado === "activo" || c.estado === "por_vencer") {
        // choose the most recent one as active
        if (!current || (c.fechaInicioContrato && c.fechaInicioContrato.toDate && c.fechaInicioContrato.toDate() > current.fechaInicioContrato.toDate())) {
          current = c;
        } else {
          past.push(c);
        }
      } else {
        past.push(c);
      }
    }

    if (!current) {
      currentDiv.innerHTML = "<p>No tienes contrato activo.</p>";
    } else {
      // render current contract
      let deviceLabel = current.deviceId;
      try {
        const ddoc = await getDoc(doc(firestore, "dispositivos", current.deviceId));
        if (ddoc.exists()) deviceLabel = ddoc.data().name || deviceLabel;
      } catch {}
      const inicioAr = current.fechaInicioArriendo ? current.fechaInicioArriendo.toDate().toLocaleDateString() : "-";
      const finAr = current.fechaFinArriendo ? current.fechaFinArriendo.toDate().toLocaleDateString() : "-";
      const inicioC = current.fechaInicioContrato ? current.fechaInicioContrato.toDate().toLocaleDateString() : "-";
      const finC = current.fechaFinContrato ? current.fechaFinContrato.toDate().toLocaleDateString() : "-";
      const daysLeft = current.fechaFinContrato ? Math.ceil((current.fechaFinContrato.toDate() - new Date())/(1000*60*60*24)) : "-";

      currentDiv.innerHTML = `
        <div>
          <h5>${deviceLabel}</h5>
          <p>Inicio Arriendo: <strong>${inicioAr}</strong></p>
          <p>Fin Arriendo: <strong>${finAr}</strong></p>
          <p>Inicio Contrato: <strong>${inicioC}</strong></p>
          <p>Fin Contrato: <strong>${finC}</strong></p>
          <p>Estado: ${badgeForEstado(current.estado)} — Vence en: <strong>${daysLeft} días</strong></p>
          <p>Observaciones: ${current.observaciones || "-"}</p>
        </div>
      `;
    }

    // render history
    const tbody = document.getElementById("historyBody");
    if (!past.length) {
      tbody.innerHTML = "<tr><td colspan='6'>Sin historial</td></tr>";
      return;
    }
    let html = "";
    for (const p of past.sort((a,b) => (b.fechaInicioContrato?.toDate?.()||0) - (a.fechaInicioContrato?.toDate?.()||0))) {
      let deviceLabel = p.deviceId;
      try {
        const ddoc = await getDoc(doc(firestore, "dispositivos", p.deviceId));
        if (ddoc.exists()) deviceLabel = ddoc.data().name || deviceLabel;
      } catch {}
      const inicioC = p.fechaInicioContrato ? p.fechaInicioContrato.toDate().toLocaleDateString() : "-";
      const finC = p.fechaFinContrato ? p.fechaFinContrato.toDate().toLocaleDateString() : "-";
      const inicioAr = p.fechaInicioArriendo ? p.fechaInicioArriendo.toDate().toLocaleDateString() : "-";
      const finAr = p.fechaFinArriendo ? p.fechaFinArriendo.toDate().toLocaleDateString() : "-";
      html += `<tr>
        <td>${deviceLabel}</td>
        <td>${inicioC}</td>
        <td>${finC}</td>
        <td>${inicioAr}</td>
        <td>${finAr}</td>
        <td>${p.estado || "-"}</td>
      </tr>`;
    }
    tbody.innerHTML = html;
  }
}
