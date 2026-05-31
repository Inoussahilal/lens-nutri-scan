import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";
import { useStore, dayKey } from "@/lib/store";
import { Bar, BarChart, CartesianGrid, Cell, Pie, PieChart, ReferenceLine, ResponsiveContainer, Tooltip, XAxis } from "recharts";
import { TrendingDown } from "lucide-react";

export const Route = createFileRoute("/progress")({
  head: () => ({
    meta: [
      { title: "NutriLens — Progress" },
      { name: "description", content: "Weekly calories, macro split, weight and streak." },
    ],
  }),
  component: ProgressPage,
});

function ProgressPage() {
  const { entries, goals, loggedDays } = useStore();

  // Weekly bar data
  const weekly = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    const key = dayKey(d.getTime());
    const kcal = entries.filter((e) => dayKey(e.loggedAt) === key).reduce((s, e) => s + e.calories, 0);
    return { day: d.toLocaleDateString(undefined, { weekday: "short" }).slice(0, 1), kcal, key };
  });

  // Today macros pie
  const todayKey = dayKey(Date.now());
  const today = entries.filter((e) => dayKey(e.loggedAt) === todayKey);
  const macroKcal = {
    Protein: today.reduce((s, e) => s + e.protein_g, 0) * 4,
    Carbs: today.reduce((s, e) => s + e.carbs_g, 0) * 4,
    Fat: today.reduce((s, e) => s + e.fat_g, 0) * 9,
  };
  const pieData = [
    { name: "Protein", value: macroKcal.Protein, color: "var(--color-protein)" },
    { name: "Carbs", value: macroKcal.Carbs, color: "var(--color-carbs)" },
    { name: "Fat", value: macroKcal.Fat, color: "var(--color-fat)" },
  ];
  const hasMacros = pieData.some((p) => p.value > 0);

  // Streak calendar (30 days)
  const calendar = Array.from({ length: 30 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (29 - i));
    return { key: dayKey(d.getTime()), logged: loggedDays.has(dayKey(d.getTime())) };
  });

  const weightDelta = goals.weight_kg - goals.weight_goal_kg;

  return (
    <AppShell>
      <header className="pt-2">
        <h1 className="font-display text-3xl font-bold">Your progress</h1>
        <p className="text-sm text-muted-foreground">Last 7 days</p>
      </header>

      <section className="mt-6 rounded-3xl border border-white/5 bg-card p-4">
        <h2 className="px-1 font-display text-base font-semibold">Calories this week</h2>
        <div className="mt-3 h-44">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={weekly} margin={{ top: 8, right: 4, left: 4, bottom: 0 }}>
              <CartesianGrid stroke="rgba(255,255,255,0.04)" vertical={false} />
              <XAxis dataKey="day" stroke="var(--color-muted-foreground)" tickLine={false} axisLine={false} fontSize={11} />
              <Tooltip
                cursor={{ fill: "rgba(255,255,255,0.04)" }}
                contentStyle={{ background: "var(--color-surface)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 12, fontSize: 12 }}
                labelStyle={{ color: "var(--color-muted-foreground)" }}
              />
              <ReferenceLine y={goals.calories} stroke="var(--color-fat)" strokeDasharray="4 4" />
              <Bar dataKey="kcal" radius={[8, 8, 0, 0]} fill="var(--color-primary)" />
            </BarChart>
          </ResponsiveContainer>
        </div>
        <p className="mt-2 px-1 text-[11px] text-muted-foreground">
          <span className="mr-1 inline-block h-0.5 w-3 align-middle bg-fat" /> goal {goals.calories} kcal
        </p>
      </section>

      <section className="mt-4 grid grid-cols-2 gap-3">
        <div className="rounded-3xl border border-white/5 bg-card p-4">
          <h3 className="font-display text-sm font-semibold">Macro split</h3>
          <div className="mt-2 h-32">
            {hasMacros ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={pieData} dataKey="value" innerRadius={28} outerRadius={50} stroke="none">
                    {pieData.map((p, i) => <Cell key={i} fill={p.color} />)}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex h-full items-center justify-center text-xs text-muted-foreground">No data today</div>
            )}
          </div>
          <div className="mt-1 flex justify-around text-[10px]">
            {pieData.map((p) => (
              <div key={p.name} className="flex items-center gap-1">
                <span className="h-2 w-2 rounded-full" style={{ background: p.color }} />
                <span className="text-muted-foreground">{p.name}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-3xl border border-white/5 bg-card p-4">
          <h3 className="font-display text-sm font-semibold">Weight</h3>
          <div className="mt-3 font-display text-3xl font-bold tabular-nums">
            {goals.weight_kg}
            <span className="ml-1 text-sm font-medium text-muted-foreground">kg</span>
          </div>
          <div className="mt-1 text-xs text-muted-foreground">Goal {goals.weight_goal_kg} kg</div>
          <div className="mt-3 inline-flex items-center gap-1 rounded-full bg-primary/10 px-2 py-1 text-[11px] font-semibold text-primary">
            <TrendingDown className="h-3 w-3" />
            {weightDelta > 0 ? `${weightDelta.toFixed(1)} kg to go` : "On target"}
          </div>
        </div>
      </section>

      <section className="mt-4 rounded-3xl border border-white/5 bg-card p-4">
        <div className="flex items-center justify-between px-1">
          <h2 className="font-display text-base font-semibold">Streak calendar</h2>
          <span className="text-xs text-muted-foreground">Last 30 days</span>
        </div>
        <div className="mt-3 grid grid-cols-10 gap-1.5">
          {calendar.map((c) => (
            <div
              key={c.key}
              title={c.key}
              className={`aspect-square rounded-full ${c.logged ? "bg-primary glow-lime" : "bg-surface"}`}
            />
          ))}
        </div>
      </section>
    </AppShell>
  );
}
