export default function ProgressRing({ remainingDays, percentRemaining }) {
  const color = remainingDays < 0 ? "#ef4444" : remainingDays <= 7 ? "#eab308" : "#f97316";
  return (
    <div className="relative w-36 h-36 flex items-center justify-center">
      <svg className="w-full h-full transform -rotate-90">
        <circle cx="72" cy="72" r="60" strokeWidth="8" stroke="rgba(255,255,255,0.03)" fill="transparent" className="dark:stroke-white/[0.04] stroke-slate-200" />
        <circle
          cx="72" cy="72" r="60" strokeWidth="8"
          strokeDasharray={376.8}
          strokeDashoffset={376.8 - (376.8 * percentRemaining) / 100}
          strokeLinecap="round" stroke={color}
          fill="transparent" className="transition-all duration-1000 ease-out"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-2xl font-bold text-(--text-primary) font-mono">{remainingDays > 0 ? remainingDays : 0}</span>
        <span className="text-[10px] text-(--text-muted) font-bold uppercase tracking-wider font-mono mt-0.5">Days Left</span>
      </div>
    </div>
  );
}
