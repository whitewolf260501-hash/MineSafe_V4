// components/DeviceLiveView.js

import { db, ref, onValue } from "../firebaseConfig.js";

export function DeviceLiveView() {
    const container = document.createElement("div");
    container.className = "device-live-card";

    container.innerHTML = `
        <h2>📡 Datos en Vivo – Dispositivo ESP32</h2>

        <div class="dato">🌡️ Temperatura: <span class="dlv_temp">...</span></div>
        <div class="dato">💧 Humedad: <span class="dlv_hum">...</span></div>
        <div class="dato">🟩 MQ135 (Gases): <span class="dlv_mq">...</span></div>
        <div class="dato">🌫️ PM2.5: <span class="dlv_pm25">...</span></div>

        <p style="font-size:12px; opacity:0.7">Actualización en tiempo real desde Firebase</p>
    `;

    // Selección segura de elementos dentro de la tarjeta
    const tempEl = container.querySelector(".dlv_temp");
    const humEl = container.querySelector(".dlv_hum");
    const mqEl = container.querySelector(".dlv_mq");
    const pmEl = container.querySelector(".dlv_pm25");

    // Ruta donde el ESP32 sube datos
    const deviceRef = ref(db, "dispositivo1");

    // Suscripción a cambios en Firebase
    onValue(deviceRef, (snapshot) => {
        if (!snapshot.exists()) {
            tempEl.textContent = "Sin datos";
            humEl.textContent = "Sin datos";
            mqEl.textContent = "Sin datos";
            pmEl.textContent = "Sin datos";
            return;
        }

        const data = snapshot.val();
        console.log("Datos recibidos desde Firebase:", data);

        tempEl.textContent = data.temperatura ?? "---";
        humEl.textContent = data.humedad ?? "---";
        mqEl.textContent = data.mq135 ?? "---";
        pmEl.textContent = data.pm25 ?? "---";
    });

    return container;
}
