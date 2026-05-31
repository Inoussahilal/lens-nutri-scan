import { motion } from "framer-motion";

interface Props {
  label: string;
  value: number;
  goal: number;
  color: "protein" | "carbs" | "fat";
  delay?: number;
}

const COLOR = {
  protein: "#3E9BFF",
  carbs: "#FFD93D",
  fat: "#FF6B6B",
};

const EMOJI = { protein: "🔵", carbs: "🟡", fat: "🔴" };

export function MacroCard({ label, value, goal, color, delay = 0 }: Props) {
  const pct = Math.min(100, goal > 0 ? (value / goal) * 100 : 0);
  const hex = COLOR[color];
  return (
    <div
      className="flex flex-1 flex-col gap-2 rounded-2xl p-3"
      style={{
        background: "rgba(255,255,255,0.04)",
        border: "1px solid rgba(255,255,255,0.07)",
        borderTop: `3px solid ${hex}`,
      }}
    >
      <div className="flex items-center justify-between">
        <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">{label}</span>
        <span className="text-[10px]">{EMOJI[color]}</span>
      </div>
      <div className="flex items-baseline gap-1">
        <span className="font-display text-xl font-bold tabular-nums" style={{ color: hex }}>
          {Math.round(value)}
        </span>
        <span className="text-[11px] text-muted-foreground tabular-nums">/{goal}g</span>
      </div>
      <div className="h-1.5 overflow-hidden rounded-full bg-white/5">
        <motion.div
          className="h-full rounded-full"
          style={{ background: hex }}
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1], delay: delay / 1000 }}
        />
      </div>
      <span className="text-[10px] tabular-nums text-muted-foreground">{Math.round(pct)}%</span>
    </div>
  );
}
