import React, { useEffect, useState } from "react";
import { getRentalByDevice } from "../services/rentalService";
import RentalCard from "./RentalCard";

export default function RentalDashboard({ deviceId }) {
  const [rental, setRental] = useState(null);

  useEffect(() => {
    const fetch = async () => {
      const r = await getRentalByDevice(deviceId);
      setRental(r);
    };
    fetch();
  }, [deviceId]);

  if (!rental) return <p>No hay contrato asociado.</p>;

  return (
    <div>
      <h2>Gestión de Arriendo</h2>
      <RentalCard rental={rental} />
    </div>
  );
}
