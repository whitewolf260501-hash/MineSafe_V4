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
  updatePassword,
  reauthenticateWithCredential,
  EmailAuthProvider,
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
  return String(email || "").trim().toLowerCase().replace(/[^a-z0-9]/g, "_");
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
          <form id="userForm" class="form-inner" autocomplete="off">
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

            <!-- NUEVOS CAMPOS: dispositivo, cantidad, fechas -->
            <div class="row">
              <label>Dispositivo actual conectado</label>
              <input id="dispositivoActual" class="form-control" placeholder="Ej: ESP32_01" />
            </div>

            <div class="row">
              <label>Cantidad de dispositivos del usuario</label>
              <input id="cantidadDispositivos" type="number" class="form-control" min="0" />
            </div>

            <div class="row split">
              <div>
                <label>Fecha inicio contrato/servicio</label>
                <input id="fechaInicio" type="date" class="form-control" />
              </div>
              <div>
                <label>Fecha término contrato/servicio</label>
                <input id="fechaTermino" type="date" class="form-control" />
              </div>
            </div>
            <!-- FIN nuevos campos -->

            <div class="row split">
              <div>
                <label>Contraseña Actual</label>
                <input type="password" id="currentPassword" class="form-control" placeholder="********" />
              </div>
              <div>
                <label>Nueva Contraseña</label>
                <input type="password" id="newPassword" class="form-control" placeholder="********" />
              </div>
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
  const currentPassword = document.getElementById("currentPassword");
  const newPassword = document.getElementById("newPassword");

  // NUEVAS VARIABLES
  const dispositivoActual = document.getElementById("dispositivoActual");
  const cantidadDispositivos = document.getElementById("cantidadDispositivos");
  const fechaInicio = document.getElementById("fechaInicio");
  const fechaTermino = document.getElementById("fechaTermino");

  const form = document.getElementById("userForm");
  const usersList = document.getElementById("usersList");
  const userFormContainer = document.getElementById("userFormContainer");

  let userActual = null; // id del doc que se edita (uid real o sanitizeId(email))
  let currentUserRole = null;
  let currentUid = null;

  // =====================================================
  // DETECTAR USUARIO LOGEADO + BLOQUEO SI DESACTIVADO
  // =====================================================
  onAuthStateChanged(auth, async (user) => {
    if (!user) return navigate("login");

    currentUid = user.uid;
    currentUserRole = await getUserRoleReal(user.uid);

    // Obtener info del usuario desde Firestore (intentar con UID real)
    const userRef = doc(firestore, "users", user.uid);
    const snap = await getDoc(userRef);
    const data = snap.exists() ? snap.data() : {};

    // Bloquear si la cuenta está desactivada
    if (data.isActive === false) {
      alert("❌ Tu cuenta está desactivada. Contacta a un administrador.");
      await signOut(auth);
      return navigate("login");
    }

    userFormContainer.style.display = "block";

    // Seguridad UI según rol: usuario normal no puede cambiar email ni rol
    if (currentUserRole === "usuario") {
      roleRow.style.display = "none";
      email.disabled = true; // impedir cambio de email desde UI
    } else {
      roleRow.style.display = "block";
      email.disabled = false;
    }

    // Si es usuario normal, autocompletamos su info (si existe documento con uid)
    if (currentUserRole === "usuario") {
      uid.value = user.uid;
      nombre.value = data.nombre || "";
      email.value = data.email || "";
      telefono.value = data.telefono || "";
      cargo.value = data.cargo || "";
      empresa.value = data.empresa || "";

      dispositivoActual.value = data.dispositivoActual || "";

      // 🔥 CORRECCIÓN: normalizar campo 'cantidadDispositivos' y tolerar campo antiguo si existe
      const cantidadFromDoc = data.cantidadDispositivos ?? data.cantidadDispositos ?? 0;
      cantidadDispositivos.value = Number(cantidadFromDoc) || 0;

      fechaInicio.value = data.fechaInicio || "";
      fechaTermino.value = data.fechaTermino || "";

      userActual = user.uid;
    } else {
      // admin/superAdmin: mostrar formulario en blanco (hasta editar)
      uid.value = "";
      nombre.value = "";
      email.value = "";
      telefono.value = "";
      cargo.value = "";
      empresa.value = "";
      dispositivoActual.value = "";
      cantidadDispositivos.value = 0;
      fechaInicio.value = "";
      fechaTermino.value = "";
      userActual = null;
    }
  });

  // =====================================================
  // LISTAR USUARIOS
  // =====================================================
  onSnapshot(collection(firestore, "users"), (snapshot) => {
    if (!currentUserRole) return;
    usersList.innerHTML = "";

    snapshot.forEach((docu) => {
      const data = docu.data();
      const id = docu.id;

      // Si soy usuario normal solo muestro mi tarjeta
      if (currentUserRole === "usuario" && id !== currentUid) return;

      const rol = data.isSuperUser ? "superAdmin" : data.isAdmin ? "admin" : "usuario";
      const canEdit =
        currentUserRole === "superAdmin" ||
        currentUserRole === "admin" ||
        (currentUserRole === "usuario" && id === currentUid);
      const canDelete = currentUserRole === "superAdmin";
      const canToggle = currentUserRole === "superAdmin" || currentUserRole === "admin";

      const isActive = data.isActive !== false;
      const estadoTexto = isActive ? "Activo" : "Inactivo";
      const estadoColor = isActive ? "#22bb33" : "#ff8800";
      const botonColorStyle = isActive ? "background:#ff8800;" : "background:#22bb33;";
      const botonTexto = isActive ? "⛔ Desactivar" : "✔ Activar";

      // mostrar cantidad tolerando nombre antiguo
      const cantidadMostrar = data.cantidadDispositivos ?? data.cantidadDispositos ?? 0;

      const div = document.createElement("div");
      div.className = "user-card glass animate-fade";

      div.innerHTML = `
        <h4 class="text-primary">👤 ${data.nombre || "—"}</h4>
        <div><strong>Email:</strong> ${data.email || "—"}</div>
        <div><strong>Teléfono:</strong> ${data.telefono || "—"}</div>
        <div><strong>Empresa:</strong> ${data.empresa || "—"}</div>

        <!-- NUEVOS CAMPOS MOSTRADOS -->
        <div><strong>Dispositivo actual:</strong> ${data.dispositivoActual || "—"}</div>
        <div><strong># Dispositivos:</strong> ${cantidadMostrar}</div>
        <div><strong>Inicio contrato:</strong> ${data.fechaInicio || "—"}</div>
        <div><strong>Término contrato:</strong> ${data.fechaTermino || "—"}</div>
        <!-- FIN nuevos campos -->

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

        // seguridad: si soy usuario normal no puedo editar otro usuario
        if (currentUserRole === "usuario" && id !== currentUid) {
          return alert("❌ No tienes permiso para editar a este usuario.");
        }

        const ref = doc(firestore, "users", id);
        try {
          const snap = await getDoc(ref);
          if (!snap.exists()) return alert("❌ Usuario no encontrado.");
          const data = snap.data();

          uid.value = id;
          nombre.value = data.nombre || "";
          email.value = data.email || "";
          telefono.value = data.telefono || "";
          cargo.value = data.cargo || "";
          empresa.value = data.empresa || "";

          dispositivoActual.value = data.dispositivoActual || "";

          // 🔥 CORREGIDO: lectura segura del campo
          const cantidadFromDoc = data.cantidadDispositivos ?? data.cantidadDispositos ?? 0;
          cantidadDispositivos.value = Number(cantidadFromDoc) || 0;

          fechaInicio.value = data.fechaInicio || "";
          fechaTermino.value = data.fechaTermino || "";

          if (currentUserRole === "superAdmin") {
            tipoUsuario.value = data.isSuperUser ? "superAdmin" : data.isAdmin ? "admin" : "usuario";
            roleRow.style.display = "block";
          } else {
            // admin no puede elevar a superAdmin via UI; usuario no puede ver
            tipoUsuario.value = "usuario";
            roleRow.style.display = currentUserRole === "admin" ? "block" : "none";
          }

          // si el formulario muestra el email y eres usuario normal, mantenerlo disabled
          email.disabled = currentUserRole === "usuario";

          userActual = id;
        } catch (err) {
          console.error("Error cargando usuario:", err);
          alert("❌ Error al cargar datos del usuario.");
        }
      })
    );

    // -----------------------
    // TOGGLE (activar/desactivar)
    // -----------------------
    document.querySelectorAll(".btn-toggle").forEach((btn) =>
      btn.addEventListener("click", async () => {
        const id = btn.dataset.id;

        // seguridad: solo admin/superAdmin pueden togglear
        if (currentUserRole !== "superAdmin" && currentUserRole !== "admin") {
          return alert("❌ No tienes permiso para cambiar estado.");
        }

        const ref = doc(firestore, "users", id);
        try {
          const snap = await getDoc(ref);
          if (!snap.exists()) return alert("❌ Usuario no encontrado.");
          const data = snap.data();
          const nuevoEstado = !data.isActive;

          await updateDoc(ref, { isActive: nuevoEstado, updatedAt: new Date().toISOString() });

          try {
            await rtdbUpdate(rtdbRef(rtdb, `/usuarios/${id}`), { isActive: nuevoEstado, updatedAt: Date.now() });
          } catch (e) {
            // Si falla el update, crear/establecer nodo
            await rtdbSet(rtdbRef(rtdb, `/usuarios/${id}`), {
              email: data.email || "",
              nombre: data.nombre || "",
              telefono: data.telefono || "",
              empresa: data.empresa || "",
              isActive: nuevoEstado,
              updatedAt: Date.now(),
            });
          }

          alert(`✔ Usuario ${nuevoEstado ? "activado" : "desactivado"} correctamente.`);
        } catch (err) {
          console.error("Error toggle isActive:", err);
          alert("❌ Error cambiando estado del usuario.");
        }
      })
    );

    // -----------------------
    // DELETE
    // -----------------------
    document.querySelectorAll(".btn-del").forEach((btn) =>
      btn.addEventListener("click", async () => {
        if (currentUserRole !== "superAdmin") return alert("❌ Solo el SuperAdmin puede eliminar usuarios.");
        if (!confirm("¿Eliminar este usuario definitivamente?")) return;

        const id = btn.dataset.id;
        try {
          await deleteDoc(doc(firestore, "users", id));
        } catch (e) {
          console.error(e);
        }
        try {
          await rtdbRemove(rtdbRef(rtdb, `/usuarios/${id}`));
        } catch (e) {
          console.error(e);
        }
        alert("✅ Usuario eliminado de Firestore y Realtime DB (Auth no puede borrarse desde cliente).");
      })
    );
  });

  // =====================================================
  // GUARDAR / ACTUALIZAR + CAMBIO DE CONTRASEÑA
  // =====================================================
  form.onsubmit = async (e) => {
    e.preventDefault();

    // permisos: solo superAdmin/admin o el propio usuario pueden guardar
    const allowed =
      currentUserRole === "superAdmin" ||
      currentUserRole === "admin" ||
      (currentUserRole === "usuario" && userActual === currentUid);

    if (!allowed) return alert("❌ No tienes permiso para guardar/editar.");

    // Roles: solo superAdmin puede asignar superAdmin
    let roleToSave = "usuario";
    if (currentUserRole === "superAdmin") roleToSave = tipoUsuario.value || "usuario";
    else if (currentUserRole === "admin") roleToSave = "usuario";
    else roleToSave = "usuario";

    const superAdminExists = await existeSuperAdmin();
    if (roleToSave === "superAdmin" && superAdminExists) {
      alert("❌ Ya existe un SuperAdmin.");
      return;
    }

    const rolePayload = {
      isSuperUser: roleToSave === "superAdmin",
      isAdmin: roleToSave === "admin",
      tipoUsuario: roleToSave,
    };

    // Opción híbrida (C):
    // - Si se está editando userActual -> usar ese ID (puede ser uid real o sanitizeId previo)
    // - Si es nuevo (solo admin/superAdmin puede crear) -> crear id basado en email (sanitizeId)
    let docId;
    if (userActual) {
      docId = userActual;
    } else {
      // Si un usuario normal intenta crear -> bloquear
      if (currentUserRole === "usuario") {
        return alert("❌ No puedes crear nuevos usuarios.");
      }
      docId = sanitizeId(email.value);
    }
    const docRef = doc(firestore, "users", docId);

    // Si quien edita es usuario normal, forzamos docId = currentUid para evitar crear docs con sanitizeId cuando el usuario se autenticó con Auth
    if (currentUserRole === "usuario") docId = currentUid;

    // Normalizar números
    const cantidadParsed = Number(cantidadDispositivos.value);
    const cantidadToSave = Number.isNaN(cantidadParsed) ? 0 : cantidadParsed;

    // Validación simple de fechas: si ambas existen, fechaInicio <= fechaTermino
    if (fechaInicio.value && fechaTermino.value) {
      const fi = new Date(fechaInicio.value);
      const ft = new Date(fechaTermino.value);
      if (fi > ft) {
        if (!confirm("La fecha de inicio es posterior a la fecha término. ¿Deseas continuar?")) {
          return;
        }
      }
    }

    // Construir payload
    const payload = {
      nombre: nombre.value.trim(),
      // seguridad: si es usuario normal no permitimos cambiar email desde UI (ya disabled),
      // pero por seguridad aquí forzamos email a email actual si usuario normal
      email: currentUserRole === "usuario" ? (auth.currentUser ? auth.currentUser.email : email.value.trim()) : email.value.trim(),
      telefono: telefono.value.trim(),
      cargo: cargo.value.trim(),
      empresa: empresa.value.trim(),

      // Nuevos campos
      dispositivoActual: dispositivoActual.value.trim(),
      cantidadDispositivos: cantidadToSave,
      fechaInicio: fechaInicio.value || "",
      fechaTermino: fechaTermino.value || "",

      updatedAt: new Date().toISOString(),
      isActive: true,
      ...rolePayload,
    };

    // Si currentUserRole no es superAdmin, impedir isSuperUser = true (doble chequeo)
    if (currentUserRole !== "superAdmin") {
      payload.isSuperUser = false;
    }

    try {
      // Guardar en Firestore (merge)
      await setDoc(docRef, payload, { merge: true });

      // Sincronizar con Realtime DB
      const rtdbPath = `/usuarios/${docId}`;
      await rtdbSet(rtdbRef(rtdb, rtdbPath), {
        id: docId,
        nombre: payload.nombre,
        email: payload.email,
        telefono: payload.telefono,
        cargo: payload.cargo,
        empresa: payload.empresa,

        dispositivoActual: payload.dispositivoActual,
        cantidadDispositivos: payload.cantidadDispositivos,
        fechaInicio: payload.fechaInicio,
        fechaTermino: payload.fechaTermino,

        tipoUsuario: payload.tipoUsuario,
        isAdmin: payload.isAdmin || false,
        isSuperUser: payload.isSuperUser || false,
        isActive: payload.isActive,
        updatedAt: Date.now(),
      });

      // Cambio de contraseña (solo si se edita el propio usuario autenticado)
      const currentPass = currentPassword.value;
      const newPass = newPassword.value;

      if (currentPass && newPass && auth.currentUser && auth.currentUser.uid === currentUid) {
        try {
          const credential = EmailAuthProvider.credential(auth.currentUser.email, currentPass);
          await reauthenticateWithCredential(auth.currentUser, credential);
          if (newPass.length < 6) throw new Error("La nueva contraseña debe tener al menos 6 caracteres.");
          await updatePassword(auth.currentUser, newPass);
          alert("🔒 Contraseña actualizada correctamente.");
        } catch (err) {
          console.error("Error cambiando contraseña:", err);
          alert("❌ Error al actualizar contraseña. Verifica la contraseña actual.");
        }
      }

      alert("✅ Datos guardados correctamente (Firestore + Realtime DB).");
    } catch (err) {
      console.error("Error guardando usuario:", err);
      alert("❌ Error al guardar datos. Revisa la consola.");
    }

    // Reset formulario
    form.reset();
    uid.value = "";
    userActual = null;
    tipoUsuario.value = "usuario";
    email.disabled = currentUserRole === "usuario";
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
    email.disabled = false;
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
  NOTAS:
  - En este archivo aplicamos controles en UI y en cliente; recuerda también asegurar
    reglas de seguridad en Firestore (security rules) para evitar que clientes editen lo que no deben.
  - Usuarios creados con sanitizeId no existen en Firebase Auth: para que puedan autenticarse
    debes crearlos usando Admin SDK / Cloud Function (recomendado).
*/
