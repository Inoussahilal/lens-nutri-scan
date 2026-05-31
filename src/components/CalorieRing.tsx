import { motion } from "framer-motion";
import { useEffect, useState } from "react";

interface Props {
  eaten: number;
  goal: number;
}

export function CalorieRing({ eaten, goal }: Props) {
  const size = 240;
  const stroke = 16;
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const pct = Math.min(1, goal > 0 ? eaten / goal : 0);
  const offset = circumference * (1 - pct);
  const remaining = Math.max(0, goal - eaten);

  const [display, setDisplay] = useState(0);
  useEffect(() => {
    const start = display;
    const t0 = performance.now();
    const dur = 900;
    let raf = 0;
    const tick = (t: number) => {
      const p = Math.min(1, (t - t0) / dur);
      const ease = 1 - Math.pow(1 - p, 3);
      setDisplay(Math.round(start + (eaten - start) * ease));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [eaten]);

  return (
    <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="var(--color-surface)"
          strokeWidth={stroke}
          fill="none"
        />
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="var(--color-primary)"
          strokeWidth={stroke}
          strokeLinecap="round"
          fill="none"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 1.1, ease: [0.22, 1, 0.36, 1] }}
          style={{ filter: "drop-shadow(0 0 8px color-mix(in oklch, var(--color-primary) 60%, transparent))" }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <div className="text-xs uppercase tracking-widest text-muted-foreground">Eaten</div>
        <div className="font-display text-5xl font-bold tabular-nums text-foreground">{display}</div>
        <div className="mt-1 text-sm text-muted-foreground">
          of <span className="text-foreground">{goal}</span> kcal
        </div>
        <div className="mt-2 rounded-full bg-surface px-3 py-1 text-xs text-muted-foreground">
          {remaining > 0 ? `${remaining} left` : `${eaten - goal} over`}
        </div>
      </div>
    </div>
  );
}
