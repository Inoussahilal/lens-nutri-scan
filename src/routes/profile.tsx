import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";
import { useStore } from "@/lib/store";
import { useMemo, useState } from "react";
import { Flame, Trophy, Utensils } from "lucide-react";

export const Route = createFileRoute("/profile")({
  head: () => ({
    meta: [
      { title: "NutriLens — Profile" },
      { name: "description", content: "Manage your daily goals, macros and weight target." },
    ],
  }),
  component: ProfilePage,
});

function ProfilePage() {
  const { goals, setGoals, entries, streak } = useStore();

  const initials = goals.name.split(" ").map((s) => s[0]).join("").slice(0, 2).toUpperCase() || "U";

  const stats = useMemo(() => {
    const total = entries.length;
    const days = new Set(entries.map((e) => new Date(e.loggedAt).toDateString())).size;
    const avg = days > 0 ? Math.round(entries.reduce((s, e) => s + e.calories, 0) / days) : 0;
    return { total, avg };
  }, [entries]);

  // Local controlled state for macro sliders to keep sum = 100
  const [p, setP] = useState(goals.protein_pct);
  const [c, setC] = useState(goals.carbs_pct);
  const f = Math.max(0, 100 - p - c);

  function commit() {
    setGoals({ protein_pct: p, carbs_pct: c, fat_pct: f });
  }

  return (
    <AppShell>
      <header className="flex items-center gap-4 pt-2">
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary text-2xl font-bold text-primary-foreground glow-lime">
          {initials}
        </div>
        <div className="min-w-0 flex-1">
          <input
            value={goals.name}
            onChange={(e) => setGoals({ name: e.target.value })}
            className="w-full bg-transparent font-display text-2xl font-bold outline-none"
          />
          <p className="text-xs text-muted-foreground">Tap to edit name</p>
        </div>
      </header>

      <section className="mt-6 grid grid-cols-3 gap-2">
        <StatCard icon={<Flame className="h-4 w-4 text-streak" />} label="Streak" value={`${streak}d`} />
        <StatCard icon={<Utensils className="h-4 w-4 text-primary" />} label="Logs" value={`${stats.total}`} />
        <StatCard icon={<Trophy className="h-4 w-4 text-streak" />} label="Avg" value={`${stats.avg}`} sub="kcal" />
      </section>

      <section className="mt-6 rounded-3xl border border-white/5 bg-card p-5">
        <h2 className="font-display text-base font-semibold">Daily calorie goal</h2>
        <div className="mt-3 flex items-center gap-3">
          <input
            type="number"
            inputMode="numeric"
            value={goals.calories}
            onChange={(e) => setGoals({ calories: Math.max(500, Math.min(8000, Number(e.target.value) || 0)) })}
            className="flex-1 rounded-2xl border border-white/10 bg-surface px-4 py-3 font-display text-2xl font-bold tabular-nums outline-none focus:border-primary/50"
          />
          <span className="text-sm text-muted-foreground">kcal</span>
        </div>
      </section>

      <section className="mt-4 rounded-3xl border border-white/5 bg-card p-5">
        <div className="flex items-center justify-between">
          <h2 className="font-display text-base font-semibold">Macro split</h2>
          <span className="text-xs text-muted-foreground">{p + c + f}%</span>
        </div>
        <div className="mt-4 flex flex-col gap-5">
          <Slider label="Protein" color="protein" value={p} onChange={(v) => { const nv = Math.min(v, 100 - c); setP(nv); }} onCommit={commit} />
          <Slider label="Carbs" color="carbs" value={c} onChange={(v) => { const nv = Math.min(v, 100 - p); setC(nv); }} onCommit={commit} />
          <div>
            <div className="flex items-baseline justify-between">
              <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Fat</span>
              <span className="text-sm font-semibold tabular-nums">{f}%</span>
            </div>
            <div className="mt-2 h-2 rounded-full bg-surface">
              <div className="h-full rounded-full bg-fat" style={{ width: `${f}%` }} />
            </div>
            <p className="mt-1 text-[10px] text-muted-foreground">Auto-balanced</p>
          </div>
        </div>
      </section>

      <section className="mt-4 rounded-3xl border border-white/5 bg-card p-5">
        <h2 className="font-display text-base font-semibold">Weight</h2>
        <div className="mt-3 grid grid-cols-2 gap-3">
          <NumberField
            label="Current"
            value={goals.weight_kg}
            onChange={(v) => setGoals({ weight_kg: v })}
            unit="kg"
          />
          <NumberField
            label="Goal"
            value={goals.weight_goal_kg}
            onChange={(v) => setGoals({ weight_goal_kg: v })}
            unit="kg"
          />
        </div>
      </section>

      <p className="mt-6 text-center text-xs text-muted-foreground">NutriLens · Built with care</p>
    </AppShell>
  );
}

function StatCard({ icon, label, value, sub }: { icon: React.ReactNode; label: string; value: string; sub?: string }) {
  return (
    <div className="rounded-2xl border border-white/5 bg-card p-3">
      <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-wider text-muted-foreground">
        {icon} {label}
      </div>
      <div className="mt-1 font-display text-xl font-bold tabular-nums">
        {value}
        {sub && <span className="ml-1 text-[10px] font-medium text-muted-foreground">{sub}</span>}
      </div>
    </div>
  );
}

function Slider({ label, color, value, onChange, onCommit }: { label: string; color: "protein" | "carbs"; value: number; onChange: (v: number) => void; onCommit: () => void }) {
  const bg = color === "protein" ? "var(--color-protein)" : "var(--color-carbs)";
  return (
    <div>
      <div className="flex items-baseline justify-between">
        <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">{label}</span>
        <span className="text-sm font-semibold tabular-nums">{value}%</span>
      </div>
      <input
        type="range"
        min={0}
        max={80}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        onMouseUp={onCommit}
        onTouchEnd={onCommit}
        className="mt-2 w-full appearance-none rounded-full bg-surface h-2 outline-none accent-primary"
        style={{ background: `linear-gradient(to right, ${bg} 0%, ${bg} ${(value / 80) * 100}%, var(--color-surface) ${(value / 80) * 100}%)` }}
      />
    </div>
  );
}

function NumberField({ label, value, onChange, unit }: { label: string; value: number; onChange: (v: number) => void; unit: string }) {
  return (
    <label className="rounded-2xl border border-white/10 bg-surface px-4 py-3">
      <span className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</span>
      <div className="flex items-baseline gap-1">
        <input
          type="number"
          inputMode="decimal"
          step={0.1}
          value={value}
          onChange={(e) => onChange(Math.max(0, Number(e.target.value) || 0))}
          className="w-full bg-transparent font-display text-xl font-bold tabular-nums outline-none"
        />
        <span className="text-xs text-muted-foreground">{unit}</span>
      </div>
    </label>
  );
}
