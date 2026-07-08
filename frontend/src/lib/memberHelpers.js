export const formatDate = (dateStr) => {
  if (!dateStr) return "N/A";
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) return "N/A";
  return date.toLocaleDateString("en-US", {
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
  const MS_PER_DAY = 1000 * 60 * 60 * 24;
  const IST_OFFSET = 5.5 * 60 * 60 * 1000;

  const now = new Date();
  const istDate = new Date(now.getTime() + IST_OFFSET);
  const today = new Date(Date.UTC(istDate.getUTCFullYear(), istDate.getUTCMonth(), istDate.getUTCDate()) - IST_OFFSET);

  if (!user.feeStartDate || !user.feeEndDate) {
    return { remainingDays: 0, percentRemaining: 0, isOverdue: false, isInactive: false, isDisabled: false };
  }

  const start = new Date(new Date(user.feeStartDate).getTime() - IST_OFFSET);
  const end = new Date(new Date(user.feeEndDate).getTime() - IST_OFFSET);
  const planDurationDays = user.plan?.durationDays || 30;
  const totalMs = Math.max(end - start, planDurationDays * MS_PER_DAY);
  const remainingMs = end - today;

  if (totalMs <= 0) {
    return { remainingDays: 0, percentRemaining: 0, isOverdue: true, isInactive: false, isDisabled: true };
  }

  const remainingDays = remainingMs > 0 ? Math.ceil(remainingMs / MS_PER_DAY) : Math.floor(remainingMs / MS_PER_DAY);
  const percentRemaining = Math.round(Math.max(0, Math.min(100, (remainingMs / totalMs) * 100)));

  const isOverdue = remainingDays <= 0
    || user.status?.toLowerCase() === "expired"
    || user.status?.toLowerCase() === "overdue";
  const isInactive = user.status?.toLowerCase() === "inactive";
  const isDisabled = isOverdue || isInactive;

  return { remainingDays, percentRemaining, isOverdue, isInactive, isDisabled };
};
