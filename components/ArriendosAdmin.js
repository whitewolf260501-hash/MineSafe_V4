import React, { useState } from "react";
import { createArriendo } from "../firebase/arriendos";

export default function ArriendosAdmin() {
  const [deviceId, setDeviceId] = useState("");
  const [userId, setUserId] = useState("");
  const [inicio, setInicio] = useState("");
  const [termino, setTermino] = useState("");

  const crear = async () => {
    await createArriendo(deviceId, userId, inicio, termino);
    alert("Arriendo registrado correctamente");
  };

  return (
    <div>
      <h2>Registrar Arriendo</h2>

      <input placeholder="ID Dispositivo"
        value={deviceId} onChange={e => setDeviceId(e.target.value)} />

      <input placeholder="ID Usuario"
        value={userId} onChange={e => setUserId(e.target.value)} />

      <label>Inicio:</label>
      <input type="date"
        value={inicio} onChange={e => setInicio(e.target.value)} />

      <label>Término:</label>
      <input type="date"
        value={termino} onChange={e => setTermino(e.target.value)} />

      <button onClick={crear}>Guardar Arriendo</button>
    </div>
  );
}
