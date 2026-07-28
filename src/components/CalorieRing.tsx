import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import { useLanguage } from "@/lib/i18n";

interface Props { eaten: number; goal: number; }

export function CalorieRing({ eaten, goal }: Props) {
  const { t } = useLanguage();

  const stroke = 14;
  const radius = 86;
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
    <div className="relative mx-auto" style={{ width: 220, height: 220 }}>
      <svg viewBox="0 0 200 200" width="100%" height="100%" className="-rotate-90">
        <circle cx={100} cy={100} r={radius} stroke="var(--color-surface)" strokeWidth={stroke} fill="none" />
        <motion.circle
          cx={100}
          cy={100}
          r={radius}
          stroke="var(--color-primary)"
          strokeWidth={stroke}
          strokeLinecap="round"
          fill="none"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 1.2, ease: [0.22, 1, 0.36, 1] }}
          style={{ filter: "drop-shadow(0 0 6px color-mix(in oklch, var(--color-primary) 70%, transparent))" }}
        />
      </svg>
      <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
        <div className="text-[10px] font-medium uppercase tracking-[0.18em] text-muted-foreground">Eaten</div>
        <div className="font-display text-[44px] font-bold leading-none tabular-nums text-foreground">{display}</div>
        <div className="text-[10px] font-medium uppercase tracking-[0.18em] text-muted-foreground">{t("eaten")}</div>
        <div className="font-display text-[44px] font-bold leading-none tabular-nums text-foreground">{display}</div>
        <div className="mt-1 text-xs text-muted-foreground">
          {t("of_kcal", { goal }).split(String(goal))[0]}
          <span className="text-foreground">{goal}</span>
          {t("of_kcal", { goal }).split(String(goal))[1]}
        </div>
        <div className="mt-2 rounded-full bg-surface px-2.5 py-0.5 text-[10px] font-medium text-muted-foreground">
          {remaining > 0 ? `${remaining} ${t("left")}` : `${eaten - goal} ${t("over")}`}
        </div>

      </div>
    </div>
  );
}
