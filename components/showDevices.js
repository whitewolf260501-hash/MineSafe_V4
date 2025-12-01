// ============================================================
// showDevices.js — Lista de dispositivos + Estado de arriendo
// ============================================================

import { db, ref, onValue } from "../firebaseConfig.js";
import { mostrarDatosDispositivo } from "./DeviceAssigned.js";
import { navigate } from "../app.js";

export function showDevices() {
  const root = document.getElementById("root");

  root.innerHTML = `
    <div class="dashboard">
      <h2>📡 Lista de Dispositivos</h2>
      <div id="deviceList">Cargando dispositivos...</div>
      <button id="backBtn">⬅️ Volver</button>
    </div>
  `;

  document.getElementById("backBtn").onclick = () => navigate("admin");

  const devicesRef = ref(db, "dispositivos");

  onValue(devicesRef, (snapshot) => {
    const data = snapshot.val();
    const list = document.getElementById("deviceList");

    if (!data) {
      list.innerHTML = "<p>No hay dispositivos registrados.</p>";
      return;
    }

    list.innerHTML = "";

    Object.entries(data).forEach(([id, d]) => {
      // ====================================
      //   CÁLCULO DEL ARRIENDO
      // ====================================
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

      const estadoColor = {
        "Activo": "green",
        "Por vencer": "orange",
        "Vencido": "red",
        "Sin contrato": "gray",
      }[estado];

      // ====================================
      //     TARJETA DEL DISPOSITIVO
      // ====================================
      const card = document.createElement("div");
      card.classList.add("card");
      card.style.marginBottom = "10px";

      card.innerHTML = `
        <p><b>ID:</b> ${id}</p>
        <p><b>Nombre:</b> ${d.name || "Desconocido"}</p>
        <p><b>Asignado a:</b> ${d.userEmail || "Sin asignar"}</p>

        <h4>📄 Arriendo</h4>
        <p><b>Estado:</b> <span style="color:${estadoColor}; font-weight:bold;">${estado}</span></p>
        <p><b>Inicio:</b> ${inicio ? inicio.toLocaleDateString() : "No definido"}</p>
        <p><b>Fin:</b> ${fin ? fin.toLocaleDateString() : "No definido"}</p>
        <p><b>Días restantes:</b> ${diasRestantes}</p>

        <button class="btnVer" data-id="${id}">📌 Ver Detalles</button>
      `;

      list.appendChild(card);
    });

    // Evento para ver detalles del dispositivo
    document.querySelectorAll(".btnVer").forEach((btn) => {
      btn.onclick = (e) => {
        const deviceId = e.target.getAttribute("data-id");
        mostrarDatosDispositivo(deviceId, document.getElementById("root"));
      };
    });
  });
}
