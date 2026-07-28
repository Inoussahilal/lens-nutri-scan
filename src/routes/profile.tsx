import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";
import { LangToggle } from "@/components/LangToggle";
import { useStore } from "@/lib/store";
import { useLanguage } from "@/lib/i18n";
import { useEffect, useMemo, useState } from "react";
import { Minus, Plus } from "lucide-react";
import { toast } from "sonner";


export const Route = createFileRoute("/profile")({
  head: () => ({
    meta: [
      { title: "NutriLens — Profile" },
      { name: "description", content: "Manage your daily calorie goal and macro split." },
    ],
  }),
  component: ProfilePage,
});

function ProfilePage() {
  const { goals, setGoals, entries, bestStreak, startDate } = useStore();

  const [name, setName] = useState(goals.name);
  const [calories, setCalories] = useState(goals.calories);
  const [p, setP] = useState(goals.protein_pct);
  const [c, setC] = useState(goals.carbs_pct);
  const [f, setF] = useState(goals.fat_pct);

  // Sync local state when store hydrates
  useEffect(() => {
    setName(goals.name); setCalories(goals.calories);
    setP(goals.protein_pct); setC(goals.carbs_pct); setF(goals.fat_pct);
  }, [goals.name, goals.calories, goals.protein_pct, goals.carbs_pct, goals.fat_pct]);

  // Distribute remainder when one slider changes, keeping sum = 100
  function changeP(v: number) {
    const nv = Math.max(0, Math.min(80, v));
    const rest = 100 - nv;
    const ratio = c + f > 0 ? c / (c + f) : 0.5;
    const nc = Math.round(rest * ratio);
    const nf = rest - nc;
    setP(nv); setC(nc); setF(nf);
  }
  function changeC(v: number) {
    const nv = Math.max(0, Math.min(80, v));
    const rest = 100 - nv;
    const ratio = p + f > 0 ? p / (p + f) : 0.5;
    const np = Math.round(rest * ratio);
    const nf = rest - np;
    setP(np); setC(nv); setF(nf);
  }
  function changeF(v: number) {
    const nv = Math.max(0, Math.min(80, v));
    const rest = 100 - nv;
    const ratio = p + c > 0 ? p / (p + c) : 0.5;
    const np = Math.round(rest * ratio);
    const nc = rest - np;
    setP(np); setC(nc); setF(nv);
  }

  function save() {
    setGoals({ name: name.trim() || "You", calories, protein_pct: p, carbs_pct: c, fat_pct: f });
    toast.success("✅ Profile saved");
  }

  const stats = useMemo(() => {
    return { total: entries.length };
  }, [entries]);

  const startStr = startDate
    ? new Date(startDate).toLocaleDateString(undefined, { month: "short", day: "numeric" })
    : "—";

  const initials = (name || "A").split(" ").map((s) => s[0]).join("").slice(0, 2).toUpperCase();

  // grams from %
  const pG = Math.round((calories * (p / 100)) / 4);
  const cG = Math.round((calories * (c / 100)) / 4);
  const fG = Math.round((calories * (f / 100)) / 9);

  return (
    <AppShell>
      <header className="flex items-center gap-4 pt-2">
        <div
          className="flex h-16 w-16 items-center justify-center rounded-full text-xl font-bold text-foreground"
          style={{ border: "2px solid #A8FF3E", background: "var(--color-card)" }}
        >
          {initials}
        </div>
        <div className="min-w-0 flex-1">
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full bg-transparent font-display text-2xl font-bold outline-none"
          />
          <p className="text-xs text-muted-foreground">Tap to edit name</p>
        </div>
      </header>

      {/* Stats row */}
      <section className="mt-5 grid grid-cols-3 gap-2 text-center">
        <Stat label="Start" value={startStr} />
        <Stat label="Meals" value={`${stats.total}`} />
        <Stat label="Best 🔥" value={`${bestStreak}d`} />
      </section>

      {/* Calorie goal */}
      <section className="mt-5 rounded-2xl border border-white/7 bg-white/[0.04] p-5 backdrop-blur">
        <h2 className="font-display text-base font-semibold">Daily calorie goal</h2>
        <div className="mt-3 flex items-center gap-3">
          <button onClick={() => setCalories((v) => Math.max(500, v - 50))} className="tap flex h-11 w-11 items-center justify-center rounded-xl bg-surface">
            <Minus className="h-4 w-4" />
          </button>
          <div className="flex-1 text-center">
            <input
              type="number"
              inputMode="numeric"
              value={calories}
              onChange={(e) => setCalories(Math.max(500, Math.min(8000, Number(e.target.value) || 0)))}
              className="w-full bg-transparent text-center font-display text-3xl font-bold tabular-nums outline-none"
            />
            <div className="text-[10px] uppercase tracking-wider text-muted-foreground">kcal / day</div>
          </div>
          <button onClick={() => setCalories((v) => Math.min(8000, v + 50))} className="tap flex h-11 w-11 items-center justify-center rounded-xl bg-primary text-primary-foreground">
            <Plus className="h-4 w-4" strokeWidth={2.5} />
          </button>
        </div>
      </section>

      {/* Macro split */}
      <section className="mt-4 rounded-2xl border border-white/7 bg-white/[0.04] p-5 backdrop-blur">
        <div className="flex items-center justify-between">
          <h2 className="font-display text-base font-semibold">Macro split</h2>
          <span className="text-xs font-semibold text-primary tabular-nums">{p + c + f}%</span>
        </div>
        <div className="mt-4 flex flex-col gap-5">
          <MacroSlider label="Protein" color="#3E9BFF" value={p} grams={pG} onChange={changeP} />
          <MacroSlider label="Carbs" color="#FFD93D" value={c} grams={cG} onChange={changeC} />
          <MacroSlider label="Fat" color="#FF6B6B" value={f} grams={fG} onChange={changeF} />
        </div>
      </section>

      <button onClick={save} className="glow-lime tap mt-5 h-[52px] w-full rounded-2xl bg-primary font-bold text-primary-foreground">
        Save changes
      </button>

      <p className="mt-6 text-center text-xs text-muted-foreground">NutriLens · Built with care</p>
    </AppShell>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-white/7 bg-white/[0.04] p-3 backdrop-blur">
      <div className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</div>
      <div className="mt-1 font-display text-base font-bold tabular-nums">{value}</div>
    </div>
  );
}

function MacroSlider({ label, color, value, grams, onChange }: { label: string; color: string; value: number; grams: number; onChange: (v: number) => void }) {
  return (
    <div>
      <div className="flex items-baseline justify-between">
        <span className="text-xs font-semibold uppercase tracking-wider" style={{ color }}>{label}</span>
        <span className="text-sm font-semibold tabular-nums">{value}%</span>
      </div>
      <input
        type="range"
        min={0}
        max={80}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="mt-2 h-2 w-full appearance-none rounded-full outline-none"
        style={{
          background: `linear-gradient(to right, ${color} 0%, ${color} ${(value / 80) * 100}%, var(--color-surface) ${(value / 80) * 100}%)`,
        }}
      />
      <p className="mt-1 text-[11px] text-muted-foreground">{label} {value}% = <span className="tabular-nums text-foreground">{grams}g</span> / day</p>
    </div>
  );
}
