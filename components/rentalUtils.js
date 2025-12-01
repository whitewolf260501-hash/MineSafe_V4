export const getDaysRemaining = (startDate, endDate) => {
  const start = new Date(startDate);
  const end = new Date(endDate);
  const today = new Date();

  const diff = end - today;
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
};

export const getRentalStatus = (endDate) => {
  const remaining = getDaysRemaining(null, endDate);

  if (remaining <= 0) return "Vencido";
  if (remaining <= 7) return "Por vencer";
  return "Activo";
};
