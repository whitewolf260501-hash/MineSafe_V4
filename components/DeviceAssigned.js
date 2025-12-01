// ============================================================
// DeviceAssigned.js — Dispositivo asignado + Información de Arriendo
// ============================================================

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

  // 🔹 Dispositivo temporal (modificar después con el asignado real)
  const DEFAULT_ID = "device_A4CB2F124B00";
  mostrarDatosDispositivo(DEFAULT_ID, document.getElementById("deviceData"));
}

// ============================================================
// FUNCIÓN PRINCIPAL: Mostrar datos del dispositivo + contrato
// ============================================================
export function mostrarDatosDispositivo(deviceId, container) {
  const deviceRef = ref(db, `dispositivos/${deviceId}`);

  onValue(deviceRef, (snapshot) => {
    const d = snapshot.val();
    if (!d) {
      container.innerHTML = `<p>No se encontró el dispositivo <b>${deviceId}</b></p>`;
      return;
    }

    // -----------------------------
    // MANEJO DEL ARRIENDO
    // -----------------------------
    const inicio = d.arriendoInicio ? new Date(d.arriendoInicio) : null;
    const fin = d.arriendoFin ? new Date(d.arriendoFin) : null;

    let estado = "Sin contrato";
    let diasRestantes = "-";

    if (inicio && fin) {
      const hoy = new Date();
      const diff = fin - hoy;
      diasRestantes = Math.ceil(diff / (1000 * 60 * 60 * 24));

      if (diasRestantes > 10) estado = "Activo";
      else if (diasRestantes > 0) estado = "Por vencer";
      else estado = "Vencido";
    }

    // Color según estado
    const estadoColor = {
      "Activo": "green",
      "Por vencer": "orange",
      "Vencido": "red",
      "Sin contrato": "gray"
    }[estado];

    container.innerHTML = `
      <p><b>ID:</b> ${deviceId}</p>
      <p><b>Nombre:</b> ${d.name || "Desconocido"}</p>
      <p><b>Asignado a:</b> ${d.userEmail || "Sin asignar"}</p>

      <hr>

      <h3>📄 Información del Arriendo</h3>
      <p><b>Estado del contrato:</b> <span style="color:${estadoColor}; font-weight:bold;">${estado}</span></p>
      <p><b>Inicio:</b> ${inicio ? inicio.toLocaleDateString() : "No definido"}</p>
      <p><b>Fin:</b> ${fin ? fin.toLocaleDateString() : "No definido"}</p>
      <p><b>Días restantes:</b> ${diasRestantes}</p>

      ${estado === "Por vencer" ? `<p style="color:orange"><b>⚠ El contrato está por vencer.</b></p>` : ""}
      ${estado === "Vencido" ? `<p style="color:red"><b>⛔ El contrato ha expirado.</b></p>` : ""}

      <hr>

      <h3>📡 Ubicación</h3>
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
