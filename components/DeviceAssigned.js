// /components/DeviceAssigned.js
import { db, ref, onValue } from "../firebaseConfig.js";
import { showHistoricalPage } from "./deviceHistory.js";
import { navigate } from "../app.js";

export function showDeviceAssigned() {
  const root = document.getElementById("root");
  root.innerHTML = `
    <div class="dashboard">
      <h2>Dispositivo Asignado</h2>
      <div id="deviceData" class="card">Cargando dispositivo...</div>
      <button id="backBtn">⬅️ Volver al Panel</button>
    </div>
  `;

  document.getElementById("backBtn").onclick = () => navigate("user");

  // Dispositivo temporal para ejemplo
  const DEFAULT_ID = "device_A4CB2F124B00";
  mostrarDatosDispositivo(DEFAULT_ID, document.getElementById("deviceData"));
}

export function mostrarDatosDispositivo(deviceId, container) {
  const deviceRef = ref(db, `dispositivos/${deviceId}`);
  onValue(deviceRef, (snapshot) => {
    const d = snapshot.val();
    if (!d) {
      container.innerHTML = `<p>No se encontró el dispositivo <b>${deviceId}</b></p>`;
      return;
    }

    container.innerHTML = `
      <p><b>ID:</b> ${deviceId}</p>
      <p><b>Nombre:</b> ${d.name || "Desconocido"}</p>
      <p><b>Usuario:</b> ${d.userEmail || "Sin asignar"}</p>
      <p><b>Latitud:</b> ${d.latitude ?? 0}</p>
      <p><b>Longitud:</b> ${d.longitude ?? 0}</p>
      <p><b>Altitud (m):</b> ${d.altitude ?? 0}</p>
      <p><b>Precisión (m):</b> ${d.precision ?? 0}</p>
      <button id="verHistorialBtn">📜 Ver historial completo</button>
    `;
    document.getElementById("verHistorialBtn").onclick = () =>
      showHistoricalPage(deviceId);
  });
}
