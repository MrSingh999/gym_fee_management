export default function ProfileDetailCard({ icon: Icon, label, value, capitalize }) {
  return (
    <div className="bg-(--bg-card) border border-(--border-color) p-3 sm:p-4 rounded-[8px] flex items-center space-x-3.5 shadow-sm">
      <div className="p-2 sm:p-2.5 bg-gym-orange/10 text-gym-orange rounded-[6px] shrink-0">
        <Icon className="h-4 w-4 sm:h-5 sm:w-5" />
      </div>
      <div className="min-w-0">
        <p className="text-[10px] text-(--text-muted) font-bold uppercase tracking-wider font-mono">{label}</p>
        <h4 className={`font-bold text-xs sm:text-sm text-(--text-primary) mt-0.5 truncate ${capitalize ? "capitalize" : ""}`}>
          {value}
        </h4>
      </div>
    </div>
  );
}
