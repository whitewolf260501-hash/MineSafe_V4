import { db, ref, onValue } from "../firebaseConfig.js";
import { navigate } from "../app.js";

export function showAdminDashboard() {
  const root = document.getElementById("root");
  root.innerHTML = `
    <div class="dashboard">
      <h2>Panel del Administradores</h2>
      <div id="users"></div>
      <button id="logout">Cerrar Sesión</button>
    </div>
  `;

  document.getElementById("logout").onclick = () => navigate("login");

  const usersRef = ref(db, "usuarios");
  onValue(usersRef, (snapshot) => {
    const data = snapshot.val();
    const container = document.getElementById("users");
    container.innerHTML = "<h3>Usuarios Registrados:</h3>";
    for (let id in data) {
      const user = data[id];
      container.innerHTML += `<p>👤 ${user.nombre} (${user.email})</p>`;
    }
  });
}
