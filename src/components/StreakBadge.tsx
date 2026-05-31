export function StreakBadge({ days }: { days: number }) {
  return (
    <div
      className="glow-streak inline-flex items-center gap-1.5 tabular-nums"
      style={{
        background: "rgba(168,255,62,0.15)",
        border: "1px solid #A8FF3E",
        borderRadius: 20,
        padding: "4px 12px",
      }}
    >
      <span className="text-sm leading-none">🔥</span>
      <span className="text-xs font-semibold text-primary">{days} {days === 1 ? "day" : "days"}</span>
    </div>
  );
}
