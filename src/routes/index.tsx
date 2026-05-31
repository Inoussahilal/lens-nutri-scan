import { createFileRoute, Link } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";
import { CalorieRing } from "@/components/CalorieRing";
import { MacroBar } from "@/components/MacroBar";
import { StreakBadge } from "@/components/StreakBadge";
import { useStore, todayTotals, dayKey } from "@/lib/store";
import { Camera, ChevronRight } from "lucide-react";
import { motion } from "framer-motion";

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
  const { goals, streak, entries } = useStore();
  const totals = todayTotals(entries);

  const proteinGoal = Math.round((goals.calories * (goals.protein_pct / 100)) / 4);
  const carbsGoal = Math.round((goals.calories * (goals.carbs_pct / 100)) / 4);
  const fatGoal = Math.round((goals.calories * (goals.fat_pct / 100)) / 9);

  const today = entries
    .filter((e) => dayKey(e.loggedAt) === dayKey(Date.now()))
    .sort((a, b) => b.loggedAt - a.loggedAt)
    .slice(0, 4);

  const greeting = (() => {
    const h = new Date().getHours();
    if (h < 12) return "Good morning";
    if (h < 18) return "Good afternoon";
    return "Good evening";
  })();

  return (
    <AppShell>
      <header className="flex items-start justify-between pt-2">
        <div>
          <p className="text-sm text-muted-foreground">{greeting},</p>
          <h1 className="font-display text-3xl font-bold">{goals.name} 👋</h1>
        </div>
        <StreakBadge days={streak} />
      </header>

      <section className="mt-8 flex justify-center">
        <CalorieRing eaten={totals.calories} goal={goals.calories} />
      </section>

      <section className="mt-8 grid grid-cols-1 gap-4 rounded-3xl border border-white/5 bg-card p-5">
        <MacroBar label="Protein" value={totals.protein_g} goal={proteinGoal} color="protein" />
        <MacroBar label="Carbs" value={totals.carbs_g} goal={carbsGoal} color="carbs" />
        <MacroBar label="Fat" value={totals.fat_g} goal={fatGoal} color="fat" />
      </section>

      <motion.div whileTap={{ scale: 0.97 }} className="mt-6">
        <Link
          to="/scan"
          className="glow-lime tap flex items-center justify-center gap-2 rounded-2xl bg-primary px-6 py-4 font-semibold text-primary-foreground"
        >
          <Camera className="h-5 w-5" strokeWidth={2.5} />
          Log Food
        </Link>
      </motion.div>

      <section className="mt-8">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="font-display text-lg font-semibold">Recent meals</h2>
          <Link to="/diary" className="flex items-center text-xs text-muted-foreground">
            View all <ChevronRight className="h-3 w-3" />
          </Link>
        </div>
        {today.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-white/10 bg-card/50 p-6 text-center">
            <div className="text-3xl">🥗</div>
            <p className="mt-2 text-sm text-muted-foreground">No meals yet today. Tap Log Food to start.</p>
          </div>
        ) : (
          <ul className="flex flex-col gap-2">
            {today.map((e) => (
              <li key={e.id} className="flex items-center gap-3 rounded-2xl border border-white/5 bg-card p-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-surface text-xl">{e.emoji}</div>
                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm font-medium">{e.foodName}</div>
                  <div className="text-xs text-muted-foreground">{e.serving_size}</div>
                </div>
                <div className="rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary tabular-nums">
                  {e.calories} kcal
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </AppShell>
  );
}
