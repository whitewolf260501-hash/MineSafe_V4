import React, { useEffect, useState } from "react";
import { getArriendo } from "../firebase/arriendos";

export default function BusinessInfo({ deviceId }) {
  const [data, setData] = useState(null);

  useEffect(() => {
    async function fetchData() {
      const arriendo = await getArriendo(deviceId);
      if (arriendo) setData(arriendo);
    }
    fetchData();
  }, [deviceId]);

  if (!data)
    return (
      <div className="business-card">
        <p>No hay datos de arriendo registrados para este dispositivo.</p>
      </div>
    );

  const inicio = new Date(data.fechaInicio);
  const termino = new Date(data.fechaTermino);
  const hoy = new Date();
  const diasRestantes = Math.ceil((termino - hoy) / (1000 * 60 * 60 * 24));

  let estado = "Activo";
  if (diasRestantes <= 10 && diasRestantes > 0) estado = "Por vencer";
  if (diasRestantes <= 0) estado = "Vencido";

  return (
    <div className="business-card">
      <h3>Información de Arriendo</h3>
      <p><strong>Inicio:</strong> {inicio.toLocaleDateString()}</p>
      <p><strong>Término:</strong> {termino.toLocaleDateString()}</p>
      <p><strong>Días restantes:</strong> {diasRestantes}</p>

      <p><strong>Estado:</strong> 
        <span className={`estado ${estado.toLowerCase()}`}>
          {estado}
        </span>
      </p>
    </div>
  );
}
