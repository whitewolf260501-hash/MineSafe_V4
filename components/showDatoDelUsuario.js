import { auth, firestore } from "../firebaseConfig.js";
import {
  doc,
  getDoc,
  setDoc,
  deleteDoc,
  collection,
  onSnapshot,
  updateDoc,
} from "https://www.gstatic.com/firebasejs/11.0.1/firebase-firestore.js";
import {
  onAuthStateChanged,
  signOut,
} from "https://www.gstatic.com/firebasejs/11.0.1/firebase-auth.js";
import { navigate } from "../app.js";

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
                <option value="superAdmin">Superusuario</option>
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

  // ==============================
  // VARIABLES
  // ==============================
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

  let userActual = null;
  let currentUserRole = "usuario";
  let currentUserEmail = "";

  // ==============================
  // DETECTAR USUARIO ACTUAL
  // ==============================
  onAuthStateChanged(auth, async (user) => {
    if (!user) return navigate("login");

    currentUserEmail = user.email;

    // 🔹 Superusuario permanente
    if (user.email === "white.wolf260501@gmail.com") {
      currentUserRole = "superAdmin";
    } else {
      const ref = doc(firestore, "users", user.uid);
      const snap = await getDoc(ref);
      if (snap.exists()) {
        const data = snap.data();
        currentUserRole = data.tipoUsuario || "usuario";
      }
    }

    // Solo admin o superAdmin pueden ver el formulario
    if (currentUserRole === "admin" || currentUserRole === "superAdmin") {
      userFormContainer.style.display = "block";
      roleRow.style.display = "block";
    }
  });

  // ==============================
  // LISTAR USUARIOS
  // ==============================
  onSnapshot(collection(firestore, "users"), (snapshot) => {
    usersList.innerHTML = "";
    snapshot.forEach((docu) => {
      const data = docu.data();
      const rol = data.tipoUsuario || "usuario";
      const div = document.createElement("div");
      div.className = "user-card glass animate-fade";

      // 🔹 Acciones de cambio de rol (solo visibles para superAdmin)
      const roleActions =
        currentUserRole === "superAdmin"
          ? `
        <div class="role-actions mt-2">
          <button class="btn-mini btn-role" data-id="${docu.id}" data-role="usuario">👤 Usuario</button>
          <button class="btn-mini btn-role" data-id="${docu.id}" data-role="admin">⭐ Admin</button>
          <button class="btn-mini btn-role" data-id="${docu.id}" data-role="superAdmin">👑 Super</button>
        </div>`
          : "";

      div.innerHTML = `
        <h4 class="text-primary">👤 ${data.nombre || "—"}</h4>
        <div class="row"><strong>Email:</strong> ${data.email || "—"}</div>
        <div class="row"><strong>Teléfono:</strong> ${data.telefono || "—"}</div>
        <div class="row"><strong>Empresa:</strong> ${data.empresa || "—"}</div>
        <div class="row"><strong>Rol:</strong> <span class="badge badge-${rol}">${rol}</span></div>
        <div class="row actions mt-2">
          <button class="btn-mini btn-edit" data-id="${docu.id}">✏️ Editar</button>
          <button class="btn-mini btn-del" data-id="${docu.id}">🗑 Eliminar</button>
        </div>
        ${roleActions}
      `;
      usersList.appendChild(div);
    });

    // Editar usuario
    document.querySelectorAll(".btn-edit").forEach((b) =>
      b.addEventListener("click", async () => {
        const id = b.dataset.id;
        const ref = doc(firestore, "users", id);
        const snapshot = await getDoc(ref);
        if (snapshot.exists()) {
          const data = snapshot.data();
          uid.value = id;
          nombre.value = data.nombre || "";
          email.value = data.email || "";
          telefono.value = data.telefono || "";
          cargo.value = data.cargo || "";
          empresa.value = data.empresa || "";
          tipoUsuario.value = data.tipoUsuario || "usuario";
          userActual = id;
        }
      })
    );

    // Eliminar usuario
    document.querySelectorAll(".btn-del").forEach((b) =>
      b.addEventListener("click", async () => {
        const id = b.dataset.id;
        if (currentUserRole !== "superAdmin") {
          alert("❌ Solo el superusuario puede eliminar usuarios.");
          return;
        }
        if (confirm("¿Eliminar este usuario definitivamente?")) {
          await deleteDoc(doc(firestore, "users", id));
        }
      })
    );

    // Cambiar rol (solo superAdmin)
    document.querySelectorAll(".btn-role").forEach((btn) =>
      btn.addEventListener("click", async () => {
        if (currentUserRole !== "superAdmin") return alert("❌ Solo el superusuario puede cambiar roles.");
        const id = btn.dataset.id;
        const newRole = btn.dataset.role;
        await updateDoc(doc(firestore, "users", id), { tipoUsuario: newRole });
        alert(`✅ Rol actualizado a ${newRole}`);
      })
    );
  });

  // ==============================
  // GUARDAR / ACTUALIZAR
  // ==============================
  form.onsubmit = async (e) => {
    e.preventDefault();

    if (currentUserRole !== "admin" && currentUserRole !== "superAdmin") {
      alert("❌ No tienes permiso para crear o modificar usuarios.");
      return;
    }

    const ref = userActual
      ? doc(firestore, "users", userActual)
      : doc(firestore, "users", email.value.toLowerCase().replace(/[^a-z0-9]/g, "_"));

    const data = {
      nombre: nombre.value.trim(),
      email: email.value.trim(),
      telefono: telefono.value.trim(),
      cargo: cargo.value.trim(),
      empresa: empresa.value.trim(),
      tipoUsuario: tipoUsuario.value,
      updatedAt: new Date().toISOString(),
    };

    await setDoc(ref, data, { merge: true });
    alert("✅ Usuario guardado / actualizado correctamente.");
    form.reset();
    uid.value = "";
    userActual = null;
    tipoUsuario.value = "usuario";
  };

  // ==============================
  // NUEVO FORM
  // ==============================
  document.getElementById("btnNuevo").onclick = () => {
    form.reset();
    uid.value = "";
    userActual = null;
    tipoUsuario.value = "usuario";
  };

  // ==============================
  // NAVEGACIÓN
  // ==============================
  document.querySelectorAll(".ms-nav button").forEach((btn) => {
    btn.onclick = () => navigate(btn.dataset.view);
  });

  document.getElementById("toggleTheme").onclick = () =>
    document.body.classList.toggle("dark-mode");

  document.getElementById("logoutBtn").onclick = async () => {
    await signOut(auth);
    navigate("login");
  };

  document.getElementById("backBtn").onclick = () => navigate("user");
}
