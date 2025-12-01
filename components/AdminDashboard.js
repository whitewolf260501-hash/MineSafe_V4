import { db, ref, onValue } from "../firebaseConfig.js";
import { navigate } from "../app.js";

export function showAdminDashboard() {
  const root = document.getElementById("root");

  root.innerHTML = `
    <div class="dashboard">
      <h2>Panel de Administradores</h2>

      <div id="users"></div>
      <div id="arriendos"></div>

      <button id="logout">Cerrar Sesión</button>
    </div>
  `;

  document.getElementById("logout").onclick = () => navigate("login");

  // ===============================
  // 🔹 1. Mostrar usuarios
  // ===============================
  const usersRef = ref(db, "usuarios");
  onValue(usersRef, (snapshot) => {
    const data = snapshot.val();
    const container = document.getElementById("users");

    container.innerHTML = `
      <h3>Usuarios Registrados:</h3>
      <div class="card-list"></div>
    `;

    const list = container.querySelector(".card-list");

    for (let id in data) {
      const user = data[id];

      list.innerHTML += `
        <div class="card user-card">
          <p><strong>👤 ${user.nombre}</strong></p>
          <p>${user.email}</p>
        </div>
      `;
    }
  });

  // ===============================
  // 🔹 2. Mostrar arriendos
  // ===============================
  const arriendosRef = ref(db, "arriendos");

  onValue(arriendosRef, (snapshot) => {
    const data = snapshot.val();
    const container = document.getElementById("arriendos");

    container.innerHTML = `
      <h3>Arriendos Registrados:</h3>
      <div class="card-list"></div>
    `;

    const list = container.querySelector(".card-list");

    if (!data) {
      list.innerHTML = `<p>No hay arriendos registrados.</p>`;
      return;
    }

    for (let deviceId in data) {
      const arriendo = data[deviceId];

      // Calcular estado del arriendo
      const inicio = new Date(arriendo.fechaInicio);
      const termino = new Date(arriendo.fechaTermino);
      const hoy = new Date();

      const diasRestantes = Math.ceil(
        (termino - hoy) / (1000 * 60 * 60 * 24)
      );

      let estado = "Activo";
      if (diasRestantes <= 10 && diasRestantes > 0) estado = "Por vencer";
      if (diasRestantes <= 0) estado = "Vencido";

      list.innerHTML += `
        <div class="card arriendo-card">
          <p><strong>📟 Dispositivo:</strong> ${deviceId}</p>
          <p><strong>🔑 Usuario:</strong> ${arriendo.userId}</p>

          <p><strong>📅 Inicio:</strong> ${inicio.toLocaleDateString()}</p>
          <p><strong>📅 Término:</strong> ${termino.toLocaleDateString()}</p>

          <p><strong>⏳ Días restantes:</strong> ${diasRestantes}</p>

          <p><strong>Estado:</strong> 
            <span class="estado ${estado.toLowerCase().replace(" ", "-")}">
              ${estado}
            </span>
          </p>
        </div>
      `;
    }
  });
}
