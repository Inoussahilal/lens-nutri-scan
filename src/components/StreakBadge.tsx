import { Flame } from "lucide-react";

export function StreakBadge({ days }: { days: number }) {
  return (
    <div className="glow-streak flex items-center gap-1.5 rounded-full border border-white/10 bg-surface px-3 py-1.5">
      <Flame className="h-4 w-4 fill-streak text-streak" />
      <span className="text-sm font-semibold tabular-nums">{days}</span>
    </div>
  );
}
