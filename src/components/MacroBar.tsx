import { motion } from "framer-motion";

interface Props {
  label: string;
  value: number;
  goal: number;
  color: "protein" | "carbs" | "fat";
}

const colorMap = {
  protein: "var(--color-protein)",
  carbs: "var(--color-carbs)",
  fat: "var(--color-fat)",
};

export function MacroBar({ label, value, goal, color }: Props) {
  const pct = Math.min(100, goal > 0 ? (value / goal) * 100 : 0);
  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-baseline justify-between">
        <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">{label}</span>
        <span className="text-sm tabular-nums text-foreground">
          <span className="font-semibold">{Math.round(value)}</span>
          <span className="text-muted-foreground">/{goal}g</span>
        </span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-surface">
        <motion.div
          className="h-full rounded-full"
          style={{ background: colorMap[color] }}
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
        />
      </div>
    </div>
  );
}
