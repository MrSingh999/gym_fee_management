import { AlertTriangle, CheckCircle } from "lucide-react";

export default function ExpiryAlert({ isDisabled, remainingDays }) {
  if (isDisabled) {
    return (
      <div className="flex items-start space-x-3 p-3 sm:p-4 bg-red-500/[0.06] border border-red-500/15 text-red-400 rounded-[6px]">
        <AlertTriangle className="h-5 w-5 shrink-0 mt-0.5 text-red-400" />
        <div className="text-xs">
          <strong className="font-bold text-red-400">Membership has Expired!</strong>
          <p className="mt-1 leading-relaxed text-red-400/90">Your gym entry credentials might be suspended. Please reach out to the gym administrator to renew your plan.</p>
        </div>
      </div>
    );
  }
  if (remainingDays <= 7) {
    return (
      <div className="flex items-start space-x-3 p-3 sm:p-4 bg-amber-500/[0.06] border border-amber-500/15 text-amber-400 rounded-[6px] animate-pulse-glow">
        <AlertTriangle className="h-5 w-5 shrink-0 mt-0.5 text-amber-400" />
        <div className="text-xs">
          <strong className="font-bold text-amber-400">Membership Expires Soon!</strong>
          <p className="mt-1 leading-relaxed text-amber-400/90">Your plan will expire in {remainingDays} days. Contact the reception desk to prevent any disruption in gym access.</p>
        </div>
      </div>
    );
  }
  return (
    <div className="flex items-start space-x-3 p-3 sm:p-4 bg-emerald-500/[0.04] border border-emerald-500/10 text-emerald-400 rounded-[6px]">
      <CheckCircle className="h-5 w-5 shrink-0 mt-0.5 text-emerald-400" />
      <div className="text-xs">
        <strong className="font-bold text-emerald-400">Everything Looks Great!</strong>
        <p className="mt-1 leading-relaxed text-emerald-400/95">Your membership status is fully active. Follow your daily training split in the Workouts tab!</p>
      </div>
    </div>
  );
}
