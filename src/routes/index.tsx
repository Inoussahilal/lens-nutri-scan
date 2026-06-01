import { createFileRoute, Link } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";
import { CalorieRing } from "@/components/CalorieRing";
import { MacroCard } from "@/components/MacroCard";
import { StreakBadge } from "@/components/StreakBadge";
import { useStore, todayTotals, dayKey } from "@/lib/store";
import { Camera, ChevronRight } from "lucide-react";
import { MacroChips } from "@/components/MacroChips";
import { motion } from "framer-motion";
import { useEffect, useState } from "react";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "NutriLens — Today" },
      { name: "description", content: "Today's calories, macros and meals at a glance." },
    ],
  }),
  component: HomePage,
});

function HomePage() {
  const { goals, streak, entries, hydrated } = useStore();
  const totals = todayTotals(entries);

  const proteinGoal = Math.round((goals.calories * (goals.protein_pct / 100)) / 4);
  const carbsGoal = Math.round((goals.calories * (goals.carbs_pct / 100)) / 4);
  const fatGoal = Math.round((goals.calories * (goals.fat_pct / 100)) / 9);

  const today = entries
    .filter((e) => dayKey(e.loggedAt) === dayKey(Date.now()))
    .sort((a, b) => b.loggedAt - a.loggedAt)
    .slice(0, 4);

  // Render greeting client-side only to avoid SSR/CSR mismatch
  const [greeting, setGreeting] = useState<{ text: string; date: string } | null>(null);
  useEffect(() => {
    const h = new Date().getHours();
    const text = h < 12 ? "Good morning" : h < 18 ? "Good afternoon" : "Good evening";
    setGreeting({
      text,
      date: new Date().toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric" }),
    });
  }, []);

  return (
    <AppShell>
      <header className="flex items-start justify-between pt-2">
        <div className="min-w-0">
          <h1 className="font-display text-[22px] font-bold leading-tight text-foreground">
            {greeting ? `${greeting.text}, ${goals.name}` : `Hello, ${goals.name}`} 👋
          </h1>
          <p className="mt-0.5 text-xs text-muted-foreground">{greeting?.date ?? "\u00A0"}</p>
        </div>
        <StreakBadge days={hydrated ? streak : 0} />
      </header>

      <section className="mt-7 flex justify-center">
        <CalorieRing eaten={totals.calories} goal={goals.calories} />
      </section>

      <section className="mt-6 grid grid-cols-3 gap-2.5">
        <MacroCard label="Protein" value={totals.protein_g} goal={proteinGoal} color="protein" delay={0} />
        <MacroCard label="Carbs" value={totals.carbs_g} goal={carbsGoal} color="carbs" delay={150} />
        <MacroCard label="Fat" value={totals.fat_g} goal={fatGoal} color="fat" delay={300} />
      </section>

      <motion.div whileTap={{ scale: 0.97 }} className="mt-6">
        <Link
          to="/scan"
          className="glow-lime flex h-[52px] items-center justify-center gap-2 rounded-2xl bg-primary px-6 font-bold text-primary-foreground"
        >
          <Camera className="h-5 w-5" strokeWidth={2.5} />
          Log Food
        </Link>
      </motion.div>

      <section className="mt-7">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="font-display text-lg font-semibold">Recent meals</h2>
          <Link to="/diary" className="flex items-center text-xs text-muted-foreground">
            View all <ChevronRight className="h-3 w-3" />
          </Link>
        </div>
        {today.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-white/10 bg-white/[0.03] p-6 text-center">
            <div className="text-3xl">🥗</div>
            <p className="mt-2 text-sm text-muted-foreground">No meals yet today. Tap Log Food to start.</p>
          </div>
        ) : (
          <ul className="flex flex-col gap-2">
            {today.map((e) => (
              <li key={e.id} className="glass flex items-center gap-3 rounded-2xl p-3">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-surface text-xl">{e.emoji}</div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-baseline justify-between gap-2">
                    <span className="truncate text-sm font-medium">{e.foodName}</span>
                    <span className="shrink-0 rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-semibold tabular-nums text-primary">
                      {e.calories} kcal
                    </span>
                  </div>
                  <MacroChips p={e.protein_g} c={e.carbs_g} f={e.fat_g} />
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </AppShell>
  );
}
