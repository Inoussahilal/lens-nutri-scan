import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";
import { LangToggle } from "@/components/LangToggle";
import { useStore, dayKey } from "@/lib/store";
import { useLanguage } from "@/lib/i18n";
import { useMemo } from "react";
import { Bar, BarChart, CartesianGrid, Cell, Pie, PieChart, ReferenceLine, ResponsiveContainer, Tooltip, XAxis } from "recharts";
import { Flame, BarChart3, Utensils } from "lucide-react";


export const Route = createFileRoute("/progress")({
  head: () => ({
    meta: [
      { title: "NutriLens — Stats" },
      { name: "description", content: "Weekly calories, macro split, streak and stats." },
    ],
  }),
  component: ProgressPage,
});

// Deterministic pseudo-random so it's stable across days (and SSR-safe enough since rendered client only via AppShell motion)
function seedRandom(seed: number) {
  let s = seed;
  return () => {
    s = (s * 9301 + 49297) % 233280;
    return s / 233280;
  };
}

function ProgressPage() {
  const { entries, goals, loggedDays, bestStreak, streak } = useStore();
  const { t } = useLanguage();


  const weekly = useMemo(() => {
    const today = new Date();
    const todayKey = dayKey(today.getTime());
    const rand = seedRandom(Number(todayKey.replace(/-/g, "")));
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(today);
      d.setDate(today.getDate() - (6 - i));
      const key = dayKey(d.getTime());
      const real = entries.filter((e) => dayKey(e.loggedAt) === key).reduce((s, e) => s + e.calories, 0);
      // Seed past 6 days with realistic demo values when no real data
      const kcal = real > 0 || key === todayKey ? real : Math.round(1400 + rand() * 800);
      return {
        day: ["S", "M", "T", "W", "T", "F", "S"][d.getDay()],
        fullDay: d.toLocaleDateString(undefined, { weekday: "short" }),
        kcal,
        isToday: key === todayKey,
      };
    });
  }, [entries]);

  const todayKey = dayKey(Date.now());
  const today = entries.filter((e) => dayKey(e.loggedAt) === todayKey);
  const totalP = today.reduce((s, e) => s + e.protein_g, 0);
  const totalC = today.reduce((s, e) => s + e.carbs_g, 0);
  const totalF = today.reduce((s, e) => s + e.fat_g, 0);
  const totalG = totalP + totalC + totalF;
  const pieData = [
    { name: t("protein"), value: totalP, color: "#3E9BFF" },
    { name: t("carbs"), value: totalC, color: "#FFD93D" },
    { name: t("fat"), value: totalF, color: "#FF6B6B" },
  ];


  // 30-day calendar (6 rows × 5 cols)
  const calendar = Array.from({ length: 30 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (29 - i));
    return { key: dayKey(d.getTime()), logged: loggedDays.has(dayKey(d.getTime())) };
  });

  const avg7 = Math.round(weekly.reduce((s, w) => s + w.kcal, 0) / 7);

  return (
    <AppShell>
      <header className="flex items-start justify-between pt-2">
        <div>
          <h1 className="font-display text-3xl font-bold">{t("your_stats")}</h1>
          <p className="text-xs text-muted-foreground">{t("last_7_days")}</p>
        </div>
        <LangToggle />
      </header>

      {/* Weekly chart */}
      <section className="mt-5 rounded-2xl border border-white/7 bg-white/[0.04] p-4 backdrop-blur">
        <div className="flex items-baseline justify-between px-1">
          <h2 className="font-display text-base font-semibold">{t("calories_this_week")}</h2>
          <span className="text-[10px] text-muted-foreground">{t("goal")} {goals.calories}</span>
        </div>

        <div className="mt-3 h-44">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={weekly} margin={{ top: 8, right: 4, left: 4, bottom: 0 }}>
              <CartesianGrid stroke="rgba(255,255,255,0.04)" vertical={false} />
              <XAxis dataKey="day" stroke="var(--color-muted-foreground)" tickLine={false} axisLine={false} fontSize={11} />
              <Tooltip
                cursor={{ fill: "rgba(255,255,255,0.04)" }}
                contentStyle={{ background: "var(--color-surface)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 12, fontSize: 12 }}
                labelStyle={{ color: "var(--color-muted-foreground)" }}
                formatter={(v: number) => [`${v} kcal`, "Calories"]}
              />
              <ReferenceLine y={goals.calories} stroke="#FF6B6B" strokeDasharray="4 4" />
              <Bar dataKey="kcal" radius={[8, 8, 0, 0]} isAnimationActive>
                {weekly.map((w, i) => (
                  <Cell key={i} fill={w.isToday ? "#A8FF3E" : "rgba(168,255,62,0.4)"} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </section>

      {/* Macro donut */}
      <section className="mt-4 rounded-2xl border border-white/7 bg-white/[0.04] p-4 backdrop-blur">
        <h2 className="px-1 font-display text-base font-semibold">Macro split today</h2>
        <div className="relative mt-2 h-44">
          {totalG > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={pieData} dataKey="value" innerRadius={55} outerRadius={85} stroke="none" startAngle={90} endAngle={-270}>
                  {pieData.map((p, i) => <Cell key={i} fill={p.color} />)}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex h-full items-center justify-center text-xs text-muted-foreground">No data today</div>
          )}
          {totalG > 0 && (
            <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
              <div className="font-display text-2xl font-bold tabular-nums">{totalG}g</div>
              <div className="text-[10px] uppercase tracking-wider text-muted-foreground">total</div>
            </div>
          )}
        </div>
        <div className="mt-3 grid grid-cols-3 gap-2">
          {pieData.map((p) => {
            const pct = totalG > 0 ? Math.round((p.value / totalG) * 100) : 0;
            return (
              <div key={p.name} className="rounded-xl bg-white/[0.04] p-2 text-center">
                <div className="flex items-center justify-center gap-1">
                  <span className="h-2 w-2 rounded-full" style={{ background: p.color }} />
                  <span className="text-[10px] uppercase tracking-wider text-muted-foreground">{p.name}</span>
                </div>
                <div className="mt-0.5 font-display text-sm font-bold tabular-nums" style={{ color: p.color }}>{p.value}g</div>
                <div className="text-[10px] text-muted-foreground tabular-nums">{pct}%</div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Streak calendar */}
      <section className="mt-4 rounded-2xl border border-white/7 bg-white/[0.04] p-4 backdrop-blur">
        <div className="flex items-center justify-between px-1">
          <h2 className="font-display text-base font-semibold">Streak calendar</h2>
          <span className="text-xs text-muted-foreground">Last 30 days</span>
        </div>
        <div className="mt-3 grid grid-cols-5 gap-2">
          {calendar.map((c) => (
            <div
              key={c.key}
              title={c.key}
              className={`aspect-square rounded-full ${c.logged ? "bg-primary glow-lime" : "bg-surface"}`}
              style={{ width: 32, height: 32 }}
            />
          ))}
        </div>
        <p className="mt-3 text-center text-sm">
          🔥 Current streak: <span className="font-semibold text-primary tabular-nums">{streak} days</span>
        </p>
      </section>

      {/* Stat cards */}
      <section className="mt-4 grid grid-cols-3 gap-2">
        <StatCard icon={<Flame className="h-4 w-4 text-streak" />} label="Best" value={`${bestStreak}d`} />
        <StatCard icon={<BarChart3 className="h-4 w-4 text-primary" />} label="Avg" value={`${avg7}`} sub="kcal" />
        <StatCard icon={<Utensils className="h-4 w-4 text-primary" />} label="Meals" value={`${entries.length}`} />
      </section>
    </AppShell>
  );
}

function StatCard({ icon, label, value, sub }: { icon: React.ReactNode; label: string; value: string; sub?: string }) {
  return (
    <div className="rounded-2xl border border-white/7 bg-white/[0.04] p-3 backdrop-blur">
      <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-wider text-muted-foreground">
        {icon}{label}
      </div>
      <div className="mt-1 font-display text-xl font-bold tabular-nums">
        {value}
        {sub && <span className="ml-1 text-[10px] font-medium text-muted-foreground">{sub}</span>}
      </div>
    </div>
  );
}
