// datoDelUsuario.js
// ================================================
// DatoDelUsuario.js — Gestión avanzada de usuarios
// ================================================
import { auth, firestore } from "../firebaseConfig.js";
import {
  doc,
  getDoc,
  setDoc,
  deleteDoc,
  collection,
  onSnapshot,
  query,
  where,
  getDocs,
  updateDoc,
} from "https://www.gstatic.com/firebasejs/11.0.1/firebase-firestore.js";

import {
  onAuthStateChanged,
  signOut,
} from "https://www.gstatic.com/firebasejs/11.0.1/firebase-auth.js";

import {
  getDatabase,
  ref as rtdbRef,
  set as rtdbSet,
  update as rtdbUpdate,
  remove as rtdbRemove,
} from "https://www.gstatic.com/firebasejs/11.0.1/firebase-database.js";

import { navigate } from "../app.js";

// =====================================================
// 🔥 UTIL: normalizar email -> id seguro para doc keys
// =====================================================
function sanitizeId(email) {
  return String(email || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "_");
}

// =====================================================
// 🔥 OBTENER ROL REAL
// =====================================================
async function getUserRoleReal(uid) {
  try {
    const ref = doc(firestore, "users", uid);
    const snap = await getDoc(ref);
    if (!snap.exists()) return "usuario";
    const data = snap.data();
    if (data.isSuperUser === true) return "superAdmin";
    if (data.isAdmin === true) return "admin";
    return "usuario";
  } catch (err) {
    console.error("getUserRoleReal error:", err);
    return "usuario";
  }
}

// =====================================================
// 🔥 VERIFICAR SI YA EXISTE UN SUPERADMIN
// =====================================================
async function existeSuperAdmin() {
  try {
    const q = query(collection(firestore, "users"), where("isSuperUser", "==", true));
    const snap = await getDocs(q);
    return snap.size > 0;
  } catch (err) {
    console.error("existeSuperAdmin error:", err);
    return false;
  }
}

// =====================================================
// 🔥 Inicializar RTDB
// =====================================================
const rtdb = getDatabase();

// =====================================================
// VISTA PRINCIPAL
// =====================================================
export function showDatoDelUsuario() {
  const root = document.getElementById("root");

  root.innerHTML = `
  <div class="ms-dashboard">
    <aside class="ms-sidebar glass">
      <div class="ms-brand">
        <img src="assets/images/logo.png" alt="Minesafe Logo" class="ms-logo" />
        <h1>Minesafe</h1>
      </div>

      <nav class="ms-nav">
        <button data-view="user">🏠 Inicio</button>
        <button data-view="userform">👤 Datos</button>
        <button data-view="datosdelusuario" class="active">🧾 Mis Datos</button>
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

      <footer class="ms-footer">
        <button id="logoutBtn" class="btn-logout">🚪 Cerrar sesión</button>
        <small>© 2025 Minesafe</small>
      </footer>
    </aside>

    <main class="ms-main">
      <header class="ms-header">
        <div class="ms-header-left">
          <button id="backBtn" class="btn-back">⬅ Volver</button>
          <h2>Gestión de Usuarios</h2>
        </div>
        <div class="ms-header-right">
          <button id="toggleTheme" class="btn-theme">🌓</button>
        </div>
      </header>

      <section class="ms-grid py-4">
        <article class="ms-card form-card glass animate-fade" id="userFormContainer" style="display:none;">
          <form id="userForm" class="form-inner">
            <h3 class="text-primary">Formulario de Usuario</h3>

            <div class="row">
              <label>UID (solo lectura)</label>
              <input id="uid" class="form-control" disabled />
            </div>

            <div class="row">
              <label>Nombre completo</label>
              <input id="nombre" class="form-control" required />
            </div>

            <div class="row">
              <label>Email</label>
              <input id="email" class="form-control" required />
            </div>

            <div class="row split">
              <div>
                <label>Teléfono</label>
                <input id="telefono" class="form-control" />
              </div>
              <div>
                <label>Cargo / Rol</label>
                <input id="cargo" class="form-control" />
              </div>
            </div>

            <div class="row">
              <label>Empresa</label>
              <input id="empresa" class="form-control" />
            </div>

            <div class="row" id="roleRow" style="display:none;">
              <label>Tipo de Usuario</label>
              <select id="tipoUsuario" class="form-control">
                <option value="usuario">Usuario Normal</option>
                <option value="admin">Administrador</option>
              </select>
            </div>

            <div class="row actions mt-3">
              <button type="submit" class="btn btn-primary w-100">💾 Guardar / Actualizar</button>
              <button type="button" id="btnNuevo" class="btn btn-success w-100 mt-2">➕ Nuevo</button>
            </div>
          </form>
        </article>

        <aside class="ms-card panel-card glass animate-float">
          <div class="panel-top">
            <h3>Usuarios Registrados</h3>
          </div>
          <div class="panel-body">
            <div id="usersList" class="user-cards"></div>
          </div>
        </aside>
      </section>
    </main>
  </div>
  `;

  // ==========================================
  // VARIABLES
  // ==========================================
  const uid = document.getElementById("uid");
  const nombre = document.getElementById("nombre");
  const email = document.getElementById("email");
  const telefono = document.getElementById("telefono");
  const cargo = document.getElementById("cargo");
  const empresa = document.getElementById("empresa");
  const tipoUsuario = document.getElementById("tipoUsuario");
  const roleRow = document.getElementById("roleRow");

  const form = document.getElementById("userForm");
  const usersList = document.getElementById("usersList");
  const userFormContainer = document.getElementById("userFormContainer");

  let userActual = null; // doc id (string) cuando editamos
  let currentUserRole = null;
  let currentUid = null;

  // =====================================================
  // DETECTAR USUARIO LOGEADO
  // =====================================================
  onAuthStateChanged(auth, async (user) => {
    if (!user) return navigate("login");

    currentUid = user.uid;
    currentUserRole = await getUserRoleReal(user.uid);

    // always show the form container (role controls inside)
    userFormContainer.style.display = "block";

    if (currentUserRole === "usuario") {
      roleRow.style.display = "none";
      // Autocompletar datos propios
      const ref = doc(firestore, "users", user.uid);
      const snap = await getDoc(ref);
      const data = snap.exists() ? snap.data() : {};

      uid.value = user.uid;
      nombre.value = data.nombre || "";
      email.value = data.email || "";
      telefono.value = data.telefono || "";
      cargo.value = data.cargo || "";
      empresa.value = data.empresa || "";

      userActual = user.uid;
    } else {
      // admin / superAdmin: show role controls
      roleRow.style.display = "block";
    }
  });

  // =====================================================
  // LISTAR USUARIOS (real-time Firestore)
  // =====================================================
  onSnapshot(collection(firestore, "users"), (snapshot) => {
    if (!currentUserRole) return; // wait until role resolved
    usersList.innerHTML = "";

    snapshot.forEach((docu) => {
      const data = docu.data();
      const id = docu.id;

      // Usuario normal sólo ve su propio registro
      if (currentUserRole === "usuario" && id !== currentUid) return;

      // determinar rol visual
      const rol = data.isSuperUser === true ? "superAdmin" : data.isAdmin === true ? "admin" : "usuario";

      const canEdit = currentUserRole === "superAdmin" || currentUserRole === "admin" || (currentUserRole === "usuario" && id === currentUid);
      const canDelete = currentUserRole === "superAdmin";
      const canToggle = currentUserRole === "superAdmin" || currentUserRole === "admin";

     const isActive = data.isActive !== false; // default true
const estadoTexto = isActive ? "Activo" : "Inactivo";
const estadoColor = isActive ? "#22bb33" : "#ff8800"; // verde si activo, naranja/rojo si inactivo
const botonColorStyle = isActive ? "background:#ff8800;" : "background:#22bb33;"; // rojo si activo (para desactivar), verde si inactivo (para activar)
const botonTexto = isActive ? "⛔ Desactivar" : "✔ Activar";

      const div = document.createElement("div");
      div.className = "user-card glass animate-fade";

      div.innerHTML = `
        <h4 class="text-primary">👤 ${data.nombre || "—"}</h4>
        <div><strong>Email:</strong> ${data.email || "—"}</div>
        <div><strong>Teléfono:</strong> ${data.telefono || "—"}</div>
        <div><strong>Empresa:</strong> ${data.empresa || "—"}</div>
        <div><strong>Rol:</strong> <span class="badge badge-${rol}">${rol}</span></div>
        <div><strong>Estado:</strong> <span style="color:${estadoColor}; font-weight:bold">${estadoTexto}</span></div>

        <div class="row actions">
          ${canEdit ? `<button class="btn-mini btn-edit" data-id="${id}">✏️ Editar</button>` : ""}
          ${canToggle ? `<button class="btn-mini btn-toggle" data-id="${id}" style="${botonColorStyle} color:white; border:none; border-radius:6px; font-weight:bold;">${botonTexto}</button>` : ""}
          ${canDelete ? `<button class="btn-mini btn-del" data-id="${id}">🗑 Eliminar</button>` : ""}
        </div>
      `;

      usersList.appendChild(div);
    });

    // -----------------------
    // EDIT
    // -----------------------
    document.querySelectorAll(".btn-edit").forEach((btn) =>
      btn.addEventListener("click", async () => {
        const id = btn.dataset.id;
        const ref = doc(firestore, "users", id);
        const snap = await getDoc(ref);
        if (!snap.exists()) return;
        const data = snap.data();

        uid.value = id;
        nombre.value = data.nombre || "";
        email.value = data.email || "";
        telefono.value = data.telefono || "";
        cargo.value = data.cargo || "";
        empresa.value = data.empresa || "";

        // si currentUserRole es superAdmin permitimos cambiar entre admin/usuario
        if (currentUserRole === "superAdmin") {
          tipoUsuario.value = data.isSuperUser === true ? "superAdmin" : data.isAdmin === true ? "admin" : "usuario";
        } else if (currentUserRole === "admin") {
          tipoUsuario.value = "usuario"; // admin no puede ascender a administradores
        }

        userActual = id;
      })
    );

    // -----------------------
    // TOGGLE (activar/desactivar)
    // -----------------------
    document.querySelectorAll(".btn-toggle").forEach((btn) =>
      btn.addEventListener("click", async () => {
        const id = btn.dataset.id;
        const ref = doc(firestore, "users", id);
        const snap = await getDoc(ref);
        if (!snap.exists()) return;
        const data = snap.data();

        const nuevoEstado = data.isActive === false; // si era falso -> true, si era true/undefined -> false

        // Firestore
        await updateDoc(ref, {
          isActive: nuevoEstado,
          updatedAt: new Date().toISOString(),
        });

        // Realtime DB
        try {
          const rtdbPath = `/usuarios/${id}`;
          await rtdbUpdate(rtdbRef(rtdb, rtdbPath), {
            isActive: nuevoEstado,
            updatedAt: Date.now(),
          });
        } catch (err) {
          // si no existe en RTDB, crear con mínimos
          try {
            const rtdbPath = `/usuarios/${id}`;
            await rtdbSet(rtdbRef(rtdb, rtdbPath), {
              email: data.email || "",
              nombre: data.nombre || "",
              telefono: data.telefono || "",
              empresa: data.empresa || "",
              isActive: nuevoEstado,
              updatedAt: Date.now(),
            });
          } catch (e) {
            console.error("RTDB update/create error:", e);
          }
        }

        alert(`✔ Usuario ${nuevoEstado ? "activado" : "desactivado"} correctamente.`);
      })
    );

    // -----------------------
    // DELETE (Firestore + RTDB)
    // -----------------------
    document.querySelectorAll(".btn-del").forEach((btn) =>
      btn.addEventListener("click", async () => {
        if (currentUserRole !== "superAdmin") {
          alert("❌ Solo el SuperAdmin puede eliminar usuarios.");
          return;
        }

        if (!confirm("¿Eliminar este usuario definitivamente? (Se eliminará de Firestore y Realtime DB)")) return;

        const id = btn.dataset.id;
        try {
          await deleteDoc(doc(firestore, "users", id));
        } catch (err) {
          console.error("Firestore delete error:", err);
        }

        try {
          await rtdbRemove(rtdbRef(rtdb, `/usuarios/${id}`));
        } catch (err) {
          console.error("RTDB remove error:", err);
        }

        alert("✅ Usuario eliminado de Firestore y Realtime DB (Auth no puede borrarse desde cliente).");
      })
    );
  });

  // =====================================================
  // GUARDAR / ACTUALIZAR (Firestore + Realtime DB)
  // =====================================================
  form.onsubmit = async (e) => {
    e.preventDefault();

    const allowed =
      currentUserRole === "superAdmin" ||
      currentUserRole === "admin" ||
      (currentUserRole === "usuario" && userActual === currentUid);

    if (!allowed) return alert("❌ No tienes permiso para editar.");

    // Roles
    let roleToSave = "usuario";
    if (currentUserRole === "superAdmin") roleToSave = tipoUsuario.value || "usuario";
    if (currentUserRole === "admin") roleToSave = "usuario"; // admin solo crea usuarios normales

    // evitar crear 2do superAdmin
    const superAdminExists = await existeSuperAdmin();
    if (roleToSave === "superAdmin" && superAdminExists) {
      alert("❌ Ya existe un SuperAdmin. No se puede crear otro.");
      return;
    }

    const rolePayload = {
      isSuperUser: roleToSave === "superAdmin",
      isAdmin: roleToSave === "admin",
      tipoUsuario: roleToSave,
    };

    // decidir id: si editando usamos userActual (doc id); si creando, usamos sanitize del email
    const docId = userActual ? userActual : sanitizeId(email.value);

    const docRef = doc(firestore, "users", docId);

    const payload = {
      nombre: nombre.value.trim(),
      email: email.value.trim(),
      telefono: telefono.value.trim(),
      cargo: cargo.value.trim(),
      empresa: empresa.value.trim(),
      updatedAt: new Date().toISOString(),
      isActive: true,
      ...rolePayload,
    };

    // Firestore: guardar/merge
    await setDoc(docRef, payload, { merge: true });

    // Realtime DB: sincronizar '/usuarios/{docId}'
    try {
      const rtdbPath = `/usuarios/${docId}`;
      await rtdbSet(rtdbRef(rtdb, rtdbPath), {
        id: docId,
        nombre: payload.nombre,
        email: payload.email,
        telefono: payload.telefono,
        cargo: payload.cargo,
        empresa: payload.empresa,
        tipoUsuario: payload.tipoUsuario,
        isAdmin: payload.isAdmin || false,
        isSuperUser: payload.isSuperUser || false,
        isActive: payload.isActive,
        updatedAt: Date.now(),
      });
    } catch (err) {
      console.error("Error escribiendo en RTDB:", err);
      alert("⚠️ Usuario guardado en Firestore, pero hubo problema al sincronizar con Realtime DB.");
      return;
    }

    alert("✅ Datos guardados correctamente (Firestore + Realtime DB).");

    // reset form UI
    form.reset();
    uid.value = "";
    userActual = null;
    tipoUsuario.value = "usuario";
  };

  // =====================================================
  // NUEVO
  // =====================================================
  document.getElementById("btnNuevo").onclick = () => {
    if (currentUserRole === "usuario") return alert("❌ No puedes crear usuarios.");
    form.reset();
    uid.value = "";
    userActual = null;
    tipoUsuario.value = "usuario";
  };

  // =====================================================
  // NAVEGACIÓN / UI
  // =====================================================
  document.querySelectorAll(".ms-nav button").forEach((btn) => {
    btn.onclick = () => navigate(btn.dataset.view);
  });

  document.getElementById("toggleTheme").onclick = () => document.body.classList.toggle("dark-mode");

  document.getElementById("logoutBtn").onclick = async () => {
    await signOut(auth);
    navigate("login");
  };

  document.getElementById("backBtn").onclick = () => navigate("user");
}

/*
  NOTAS IMPORTANTES SOBRE AUTH (crear usuarios en Firebase Auth)
  ------------------------------------------------------------
  - Por seguridad la eliminación de usuarios en Firebase Auth NO se puede
    ejecutar desde cliente (solo Admin SDK o Cloud Function con credenciales).
  - También crear usuarios en Auth desde cliente con createUserWithEmailAndPassword
    "inicia sesión" como ese nuevo usuario (rompe sesión del admin), por eso NO
    es recomendable hacerlo directamente desde la app principal.
  - Recomendación: implementar una Cloud Function o endpoint protegido (Admin SDK)
    que el SuperAdmin pueda invocar (por ejemplo con un token de servidor) para:
      * crear usuario en Auth
      * eliminar usuario en Auth (si es necesario)
    Ejemplo de payload que tu función admin esperaría:
      { email, password, displayName, phoneNumber, customClaims }

  EJEMPLO (pseudo) de llamada a tu Cloud Function (debes implementar la función):
  async function createAuthUserServer(payload) {
    // fetch('https://us-central1-TU_PROYECTO.cloudfunctions.net/createUser', { method: 'POST', body: JSON.stringify(payload), headers: { 'Authorization': 'Bearer ...' }})
  }

  - Si quieres que implemente el código del endpoint (Cloud Function) para crear usuarios
    en Auth de forma segura, dímelo y preparo el ejemplo (Node.js Admin SDK).
*/
