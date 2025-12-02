// ============================================================
// ContractPayments.js — Pagos (Admin y Usuario)
// ============================================================

import { auth, firestore, onAuthStateChanged } from "../firebaseConfig.js";
import {
  collection, query, where, orderBy, getDocs, addDoc, updateDoc, doc, getDoc, serverTimestamp, deleteDoc
} from "https://www.gstatic.com/firebasejs/11.0.1/firebase-firestore.js";
import { navigate } from "../app.js";

export function showContractPayments() {
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
        <button data-view="contratos">📄 Mis Contratos</button>
        <button class="active" data-view="payments">💳 Pagos</button>
        <button data-view="history">📜 Historial</button>
      </nav>

      <div class="ms-footer">
        <button id="themeToggle" class="btn btn-ghost">🌓 Tema</button>
        <button class="logout">🔒 Cerrar Sesión</button>
      </div>
    </aside>

    <main class="ms-main">
      <header class="ms-header">
        <h2>Pagos de Contratos</h2>
        <p class="ms-sub">Registrar y revisar pagos por contrato</p>
      </header>

      <section class="ms-panel">
        <div class="panel-card mb-3">
          <div class="d-flex gap-2">
            <select id="paymentFilter" class="form-select w-auto">
              <option value="mine">Mis pagos</option>
              <option value="all">Todos (admin)</option>
            </select>
            <button id="btnRefreshPayments" class="btn btn-outline-secondary">🔄 Refrescar</button>
          </div>
        </div>

        <div class="panel-card p-3 mb-3">
          <h3>Registrar Pago (admin)</h3>
          <div class="row g-2">
            <div class="col-md-4">
              <label>Contrato ID</label>
              <input id="payContractId" class="form-control" placeholder="contractId"/>
            </div>
            <div class="col-md-3">
              <label>Monto</label>
              <input id="payAmount" type="number" class="form-control" placeholder="10000"/>
            </div>
            <div class="col-md-3">
              <label>Referencia</label>
              <input id="payRef" class="form-control" placeholder="REF123"/>
            </div>
            <div class="col-md-2 d-flex align-items-end">
              <button id="btnRegisterPayment" class="btn btn-primary w-100">Registrar</button>
            </div>
          </div>
        </div>

        <div class="panel-card">
          <h3>Listado de Pagos</h3>
          <div class="table-responsive mt-2">
            <table class="table table-striped">
              <thead class="table-dark">
                <tr>
                  <th>ID</th>
                  <th>Contrato</th>
                  <th>Usuario</th>
                  <th>Monto</th>
                  <th>Fecha</th>
                  <th>Ref</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody id="paymentsBody"></tbody>
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

  document.getElementById("btnRegisterPayment").onclick = registerPayment;
  document.getElementById("btnRefreshPayments").onclick = renderPayments;

  onAuthStateChanged(auth, async (user) => {
    if (!user) return navigate("login");
    // no role-block: functionality adapts per role
    await renderPayments();
  });

  async function registerPayment() {
    const contractId = document.getElementById("payContractId").value.trim();
    const amount = Number(document.getElementById("payAmount").value);
    const ref = document.getElementById("payRef").value.trim();

    if (!contractId || !amount) return alert("Contrato y monto son obligatorios.");

    // try get contract userId to link payment
    let userId = null;
    try {
      const cSnap = await getDoc(doc(firestore, "contracts", contractId));
      if (cSnap.exists()) userId = cSnap.data().userId;
    } catch (e) { console.warn(e); }

    try {
      const payload = {
        contractId,
        userId,
        amount,
        ref,
        createdAt: serverTimestamp()
      };
      await addDoc(collection(firestore, "payments"), payload);
      alert("Pago registrado.");
      document.getElementById("payContractId").value = "";
      document.getElementById("payAmount").value = "";
      document.getElementById("payRef").value = "";
      await renderPayments();
    } catch (err) {
      console.error(err);
      alert("Error registrando pago.");
    }
  }

  async function renderPayments() {
    const tbody = document.getElementById("paymentsBody");
    tbody.innerHTML = "<tr><td colspan='7'>Cargando...</td></tr>";

    const filter = document.getElementById("paymentFilter").value;
    const user = auth.currentUser;

    // If admin and selected 'all', fetch all, else only user's payments
    let q;
    if (filter === "all") {
      q = collection(firestore, "payments");
    } else {
      q = query(collection(firestore, "payments"), where("userId", "==", user.uid));
    }
    const snap = await getDocs(q);
    if (snap.empty) {
      tbody.innerHTML = "<tr><td colspan='7'>Sin pagos</td></tr>";
      return;
    }

    let html = "";
    for (const p of snap.docs) {
      const d = p.data();
      // try fetch contract -> user label
      let contractLabel = d.contractId || "-";
      let userLabel = d.userId || "-";
      if (d.contractId) {
        try {
          const cSnap = await getDoc(doc(firestore, "contracts", d.contractId));
          if (cSnap.exists()) contractLabel = d.contractId;
          if (!d.userId && cSnap.exists()) userLabel = cSnap.data().userId;
        } catch {}
      }
      if (userLabel && userLabel !== "-" ) {
        try {
          const uSnap = await getDoc(doc(firestore, "users", userLabel));
          if (uSnap.exists()) userLabel = uSnap.data().nombre || uSnap.data().email || userLabel;
        } catch {}
      }

      const fecha = d.createdAt && d.createdAt.toDate ? d.createdAt.toDate().toLocaleString() : "-";
      html += `<tr>
        <td>${p.id}</td>
        <td>${contractLabel}</td>
        <td>${userLabel}</td>
        <td>${d.amount}</td>
        <td>${fecha}</td>
        <td>${d.ref || "-"}</td>
        <td>
          <button class="btn btn-sm btn-danger" data-id="${p.id}" data-action="del">Eliminar</button>
        </td>
      </tr>`;
    }

    tbody.innerHTML = html;

    tbody.querySelectorAll("button[data-action='del']").forEach(btn => {
      btn.addEventListener("click", async () => {
        const id = btn.dataset.id;
        if (!confirm("Eliminar pago?")) return;
        try {
          await deleteDoc(doc(firestore, "payments", id));
          alert("Pago eliminado.");
          await renderPayments();
        } catch (e) {
          console.error(e);
          alert("Error eliminando pago.");
        }
      });
    });
  }
}
