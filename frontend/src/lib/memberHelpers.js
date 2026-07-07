export const formatDate = (dateStr) => {
  if (!dateStr) return "N/A";
  return new Date(dateStr).toLocaleDateString("en-US", {
    year: "numeric", month: "short", day: "numeric",
  });
};

export const calculateAge = (dobStr) => {
  if (!dobStr) return "N/A";
  const birthDate = new Date(dobStr);
  const today = new Date();
  let age = today.getFullYear() - birthDate.getFullYear();
  const m = today.getMonth() - birthDate.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) age--;
  return age;
};

export const calcMembership = (user) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const startDate = user.feeStartDate ? new Date(user.feeStartDate) : new Date();
  const endDate = user.feeEndDate ? new Date(user.feeEndDate) : new Date();
  endDate.setHours(0, 0, 0, 0);
  startDate.setHours(0, 0, 0, 0);

  const totalDays = Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24)) || 30;
  const remainingDays = Math.ceil((endDate - today) / (1000 * 60 * 60 * 24));
  const elapsedDays = totalDays - (remainingDays > 0 ? remainingDays : 0);
  const elapsedClamped = Math.max(0, Math.min(totalDays, elapsedDays));
  const percentRemaining = totalDays > 0
    ? Math.max(0, Math.min(100, Math.round(((totalDays - elapsedClamped) / totalDays) * 100)))
    : 0;

  const isOverdue = remainingDays < 0
    || user.status?.toLowerCase() === "expired"
    || user.status?.toLowerCase() === "overdue";
  const isInactive = user.status?.toLowerCase() === "inactive";
  const isDisabled = isOverdue || isInactive;

  return { remainingDays, percentRemaining, isOverdue, isInactive, isDisabled };
};
