// ============================================================
// ContractManager.js — Gestión de Contratos (ADMIN)
// ============================================================

import { auth, firestore, onAuthStateChanged } from "../firebaseConfig.js";
import {
  collection, query, where, orderBy, getDocs, doc, getDoc,
  addDoc, updateDoc, deleteDoc, serverTimestamp, Timestamp
} from "https://www.gstatic.com/firebasejs/11.0.1/firebase-firestore.js";
import { navigate } from "../app.js";

export async function showContractManager() {
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

    <main class="ms-main">
      <header class="ms-header">
        <h2>Gestión de Arriendos</h2>
        <p class="ms-sub">Crear, editar y controlar contratos de arriendo</p>
      </header>

      <section class="ms-panel">
        <div class="panel-card mb-3 d-flex gap-2">
          <button id="btnNewContract" class="btn btn-success">+ Nuevo Contrato</button>
          <select id="filterContracts" class="form-select w-auto">
            <option value="all">Todos</option>
            <option value="activo">Activos</option>
            <option value="por_vencer">Por vencer</option>
            <option value="vencido">Vencidos</option>
          </select>
          <button id="btnRefresh" class="btn btn-outline-secondary">🔄 Refrescar</button>
        </div>

        <div id="contractForm" class="panel-card p-3 mb-4" style="display:none;">
          <h3 id="formTitle">Nuevo Contrato</h3>
          <input type="hidden" id="contractId" />
          <div class="row g-3">
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
              <input type="date" id="fechaInicioArriendo" class="form-control" />
            </div>
            <div class="col-md-6">
              <label>Fin Arriendo</label>
              <input type="date" id="fechaFinArriendo" class="form-control" />
            </div>

            <div class="col-md-6">
              <label>Inicio Contrato</label>
              <input type="date" id="fechaInicioContrato" class="form-control" />
            </div>
            <div class="col-md-6">
              <label>Fin Contrato</label>
              <input type="date" id="fechaFinContrato" class="form-control" />
            </div>

            <div class="col-12">
              <label>Observaciones</label>
              <textarea id="observaciones" rows="2" class="form-control"></textarea>
            </div>

            <div class="col-12 d-flex gap-2">
              <button id="btnSaveContract" class="btn btn-primary">Guardar</button>
              <button id="btnCancelContract" class="btn btn-secondary">Cancelar</button>
            </div>
          </div>
        </div>

        <div class="panel-card">
          <h3>Contratos</h3>
          <div class="table-responsive mt-3">
            <table class="table table-striped" id="contractsTable">
              <thead class="table-dark">
                <tr>
                  <th>ID</th>
                  <th>Usuario</th>
                  <th>Dispositivo</th>
                  <th>Inicio Arriendo</th>
                  <th>Fin Arriendo</th>
                  <th>Inicio Contrato</th>
                  <th>Fin Contrato</th>
                  <th>Estado</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody id="contractsTableBody"></tbody>
            </table>
          </div>
        </div>

      </section>
    </main>
  </div>
  `;

  // --- Event bindings ---
  document.getElementById("btnNewContract").onclick = openNewForm;
  document.getElementById("btnCancelContract").onclick = () => closeForm();
  document.getElementById("btnSaveContract").onclick = saveContract;
  document.getElementById("btnRefresh").onclick = renderContracts;
  document.getElementById("filterContracts").onchange = renderContracts;

  document.querySelectorAll("button[data-view]").forEach(btn => {
    btn.addEventListener("click", () => navigate(btn.dataset.view));
  });

  document.querySelector(".logout").onclick = async () => {
    await auth.signOut();
    navigate("login");
  };

  // check auth + admin
  onAuthStateChanged(auth, async (user) => {
    if (!user) return navigate("login");
    const userDoc = await getDoc(doc(firestore, "users", user.uid));
    const data = userDoc.exists() ? userDoc.data() : {};
    if (!data.isAdmin && !data.isSuperUser) {
      alert("Acceso denegado: se requiere permiso de administrador.");
      return navigate("user");
    }
    // initial load
    await populateSelects();
    await renderContracts();
  });

  // ---------------- Firestore helpers ----------------

  async function populateSelects() {
    // usuarios
    const userSel = document.getElementById("userSelect");
    userSel.innerHTML = "<option value=''>Cargando...</option>";
    const usersSnap = await getDocs(collection(firestore, "users"));
    userSel.innerHTML = "<option value=''>-- Selecciona usuario --</option>";
    usersSnap.forEach(u => {
      const d = u.data();
      userSel.innerHTML += `<option value="${u.id}">${d.nombre || d.email || u.id}</option>`;
    });

    // dispositivos
    const deviceSel = document.getElementById("deviceSelect");
    deviceSel.innerHTML = "<option value=''>Cargando...</option>";
    const devicesSnap = await getDocs(collection(firestore, "dispositivos"));
    deviceSel.innerHTML = "<option value=''>-- Selecciona dispositivo --</option>";
    devicesSnap.forEach(dev => {
      const d = dev.data();
      const label = `${d.name || dev.id}${d.serial ? " • " + d.serial : ""}${d.rented ? " (ocupado)" : ""}`;
      deviceSel.innerHTML += `<option value="${dev.id}">${label}</option>`;
    });
  }

  function openNewForm() {
    document.getElementById("formTitle").textContent = "Nuevo Contrato";
    document.getElementById("contractId").value = "";
    document.getElementById("contractForm").style.display = "block";
  }

  function closeForm() {
    document.getElementById("contractForm").style.display = "none";
  }

  function toDateInput(ts) {
    if (!ts) return "";
    const d = ts.toDate ? ts.toDate() : new Date(ts);
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const dd = String(d.getDate()).padStart(2, "0");
    return `${yyyy}-${mm}-${dd}`;
  }

  function badgeForEstado(estado) {
    if (estado === "activo") return 'badge bg-success';
    if (estado === "por_vencer") return 'badge bg-warning text-dark';
    if (estado === "vencido") return 'badge bg-danger';
    return 'badge bg-secondary';
  }

  async function renderContracts() {
    const tbody = document.getElementById("contractsTableBody");
    tbody.innerHTML = "<tr><td colspan='9'>Cargando...</td></tr>";

    const filter = document.getElementById("filterContracts").value;
    let q = collection(firestore, "contracts");
    // orderBy fechaInicioContrato desc if possible
    const qSnap = await getDocs(q);
    const docs = qSnap.docs;

    // convert & filter in-memory to keep code simple and avoid complex queries with comparisons on timestamps
    const items = [];
    for (const d of docs) {
      const data = d.data();
      // normalize timestamps
      const entrada = {
        id: d.id,
        ...data
      };
      items.push(entrada);
    }

    // compute estado dynamically (safety: updates via functions should also exist)
    const now = new Date();
    items.forEach(it => {
      const finContrato = it.fechaFinContrato && it.fechaFinContrato.toDate ? it.fechaFinContrato.toDate() : (it.fechaFinContrato ? new Date(it.fechaFinContrato) : null);
      if (!finContrato) return;
      const diffDays = Math.ceil((finContrato - now) / (1000*60*60*24));
      if (diffDays < 0) it.estado = "vencido";
      else if (diffDays <= 7) it.estado = it.estado === "vencido" ? "vencido" : "por_vencer";
      else if (!it.estado) it.estado = "activo";
    });

    const filtered = filter === "all" ? items : items.filter(i => i.estado === filter);

    if (!filtered.length) {
      tbody.innerHTML = "<tr><td colspan='9'>Sin contratos</td></tr>";
      return;
    }

    let html = "";
    for (const c of filtered) {
      // get user & device labels
      let userLabel = c.userId;
      try {
        const udoc = await getDoc(doc(firestore, "users", c.userId));
        if (udoc.exists()) userLabel = udoc.data().nombre || udoc.data().email || c.userId;
      } catch(e){}

      let deviceLabel = c.deviceId;
      try {
        const ddoc = await getDoc(doc(firestore, "dispositivos", c.deviceId));
        if (ddoc.exists()) deviceLabel = ddoc.data().name || c.deviceId;
      } catch(e){}

      const inicioAr = c.fechaInicioArriendo ? toDateInput(c.fechaInicioArriendo) : "-";
      const finAr = c.fechaFinArriendo ? toDateInput(c.fechaFinArriendo) : "-";
      const inicioC = c.fechaInicioContrato ? toDateInput(c.fechaInicioContrato) : "-";
      const finC = c.fechaFinContrato ? toDateInput(c.fechaFinContrato) : "-";

      html += `<tr>
        <td>${c.id}</td>
        <td>${userLabel}</td>
        <td>${deviceLabel}</td>
        <td>${inicioAr}</td>
        <td>${finAr}</td>
        <td>${inicioC}</td>
        <td>${finC}</td>
        <td><span class="${badgeForEstado(c.estado)}">${c.estado}</span></td>
        <td>
          <button class="btn btn-sm btn-info" data-action="view" data-id="${c.id}">Ver</button>
          <button class="btn btn-sm btn-warning" data-action="edit" data-id="${c.id}">Editar</button>
          <button class="btn btn-sm btn-danger" data-action="finalize" data-id="${c.id}">Finalizar</button>
        </td>
      </tr>`;
    }

    tbody.innerHTML = html;

    // bind buttons
    tbody.querySelectorAll("button").forEach(btn => {
      const id = btn.dataset.id;
      const action = btn.dataset.action;
      btn.addEventListener("click", () => {
        if (action === "view") viewContract(id);
        if (action === "edit") editContract(id);
        if (action === "finalize") finalizeContract(id);
      });
    });
  }

  async function saveContract() {
    const contractId = document.getElementById("contractId").value || null;
    const userId = document.getElementById("userSelect").value;
    const deviceId = document.getElementById("deviceSelect").value;
    const fInicioAr = document.getElementById("fechaInicioArriendo").value;
    const fFinAr = document.getElementById("fechaFinArriendo").value;
    const fInicioC = document.getElementById("fechaInicioContrato").value;
    const fFinC = document.getElementById("fechaFinContrato").value;
    const observaciones = document.getElementById("observaciones").value || "";

    if (!userId || !deviceId || !fInicioAr || !fFinAr || !fInicioC || !fFinC) {
      alert("Completa todos los campos obligatorios.");
      return;
    }

    if (new Date(fFinAr) < new Date(fInicioAr) || new Date(fFinC) < new Date(fInicioC)) {
      alert("Fechas inválidas: la fecha de fin no puede ser anterior a la de inicio.");
      return;
    }

    // Check device not in active contract
    const q = query(collection(firestore, "contracts"), where("deviceId", "==", deviceId), where("estado", "==", "activo"));
    const existing = await getDocs(q);
    if (!contractId && !existing.empty) {
      alert("El dispositivo ya tiene un contrato activo.");
      return;
    }

    const payload = {
      userId,
      deviceId,
      fechaInicioArriendo: Timestamp.fromDate(new Date(fInicioAr)),
      fechaFinArriendo: Timestamp.fromDate(new Date(fFinAr)),
      fechaInicioContrato: Timestamp.fromDate(new Date(fInicioC)),
      fechaFinContrato: Timestamp.fromDate(new Date(fFinC)),
      estado: "activo",
      observaciones,
      createdAt: serverTimestamp()
    };

    try {
      if (contractId) {
        await updateDoc(doc(firestore, "contracts", contractId), payload);
        alert("Contrato actualizado.");
      } else {
        const docRef = await addDoc(collection(firestore, "contracts"), payload);
        // mark device as rented
        await updateDoc(doc(firestore, "dispositivos", deviceId), {
          rented: true,
          rentedTo: userId,
          rentedUntil: Timestamp.fromDate(new Date(fFinAr))
        });
        alert("Contrato creado: " + docRef.id);
      }
      closeForm();
      await renderContracts();
    } catch (err) {
      console.error(err);
      alert("Error guardando contrato.");
    }
  }

  async function viewContract(id) {
    const docSnap = await getDoc(doc(firestore, "contracts", id));
    if (!docSnap.exists()) return alert("Contrato no encontrado.");
    const c = docSnap.data();
    let userLabel = c.userId;
    let deviceLabel = c.deviceId;
    try {
      const udoc = await getDoc(doc(firestore, "users", c.userId));
      if (udoc.exists()) userLabel = udoc.data().nombre || udoc.data().email;
    } catch {}
    try {
      const ddoc = await getDoc(doc(firestore, "dispositivos", c.deviceId));
      if (ddoc.exists()) deviceLabel = ddoc.data().name;
    } catch {}
    alert(
      `Contrato: ${id}\nUsuario: ${userLabel}\nDispositivo: ${deviceLabel}\nInicio arriendo: ${toDateInput(c.fechaInicioArriendo)}\nFin arriendo: ${toDateInput(c.fechaFinArriendo)}\nInicio contrato: ${toDateInput(c.fechaInicioContrato)}\nFin contrato: ${toDateInput(c.fechaFinContrato)}\nEstado: ${c.estado}\nObservaciones: ${c.observaciones || "-"}`
    );
  }

  async function editContract(id) {
    const docSnap = await getDoc(doc(firestore, "contracts", id));
    if (!docSnap.exists()) return alert("Contrato no encontrado.");
    const c = docSnap.data();
    document.getElementById("contractId").value = id;
    document.getElementById("formTitle").textContent = "Editar Contrato";
    // ensure selects are populated
    await populateSelects();
    document.getElementById("userSelect").value = c.userId;
    document.getElementById("deviceSelect").value = c.deviceId;
    document.getElementById("fechaInicioArriendo").value = toDateInput(c.fechaInicioArriendo);
    document.getElementById("fechaFinArriendo").value = toDateInput(c.fechaFinArriendo);
    document.getElementById("fechaInicioContrato").value = toDateInput(c.fechaInicioContrato);
    document.getElementById("fechaFinContrato").value = toDateInput(c.fechaFinContrato);
    document.getElementById("observaciones").value = c.observaciones || "";
    document.getElementById("contractForm").style.display = "block";
  }

  async function finalizeContract(id) {
    if (!confirm("Finalizar contrato? Esto marcará el dispositivo como disponible.")) return;
    const cSnap = await getDoc(doc(firestore, "contracts", id));
    if (!cSnap.exists()) return alert("Contrato no encontrado.");
    const c = cSnap.data();
    try {
      await updateDoc(doc(firestore, "contracts", id), { estado: "vencido", finalizedAt: serverTimestamp() });
      // liberar dispositivo
      await updateDoc(doc(firestore, "dispositivos", c.deviceId), {
        rented: false,
        rentedTo: null,
        rentedUntil: null
      });
      alert("Contrato finalizado.");
      await renderContracts();
    } catch (err) {
      console.error(err);
      alert("Error finalizando contrato.");
    }
  }
}
