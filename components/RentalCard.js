import React from "react";
import { getDaysRemaining, getRentalStatus } from "../utils/rentalUtils";

export default function RentalCard({ rental }) {
  const daysLeft = getDaysRemaining(rental.startDate, rental.endDate);
  const status = getRentalStatus(rental.endDate);

  return (
    <div className="rental-card">
      <h3>Contrato de Arriendo</h3>
      <p><strong>Inicio:</strong> {rental.startDate}</p>
      <p><strong>Término:</strong> {rental.endDate}</p>
      <p><strong>Días restantes:</strong> {daysLeft}</p>
      <p><strong>Estado:</strong> {status}</p>
    </div>
  );
}
