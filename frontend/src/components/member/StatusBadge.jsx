export default function StatusBadge({ isOverdue, isInactive, remainingDays }) {
  if (isOverdue || isInactive) {
    return (
      <span className="inline-flex items-center space-x-1 bg-red-500/10 border border-red-500/20 dark:border-red-500/25 text-red-600 dark:text-red-400 text-xs font-bold tracking-wider px-3 py-1 rounded-full animate-pulse-glow">
        <span className="status-dot status-dot-overdue"></span>
        <span>INACTIVE</span>
      </span>
    );
  }
  if (remainingDays <= 7) {
    return (
      <span className="inline-flex items-center space-x-1 bg-amber-500/10 border border-amber-500/20 dark:border-amber-500/25 text-amber-600 dark:text-amber-400 text-xs font-bold tracking-wider px-3 py-1 rounded-full animate-pulse-glow">
        <span className="status-dot status-dot-due"></span>
        <span>RENEWAL DUE</span>
      </span>
    );
  }
  return (
    <span className="inline-flex items-center space-x-1 bg-emerald-500/10 border border-emerald-500/20 dark:border-emerald-500/25 text-emerald-600 dark:text-emerald-400 text-xs font-bold tracking-wider px-3 py-1 rounded-full">
      <span className="status-dot status-dot-active"></span>
      <span>ACTIVE</span>
    </span>
  );
}
