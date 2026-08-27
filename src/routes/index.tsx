import { createFileRoute, Link } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";
import { CalorieRing } from "@/components/CalorieRing";
import { MacroCard } from "@/components/MacroCard";
import { StreakBadge } from "@/components/StreakBadge";
import { LangToggle } from "@/components/LangToggle";
import { useStore, todayTotals, dayKey } from "@/lib/store";
import { useLanguage } from "@/lib/i18n";
import { ChevronRight } from "lucide-react";
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
  const { goals, streak, entries, hydrated, profile, freeScansLeft, isAdmin } = useStore();
  const { t, lang } = useLanguage();
  const totals = todayTotals(entries);

  const proteinGoal = Math.round((goals.calories * (goals.protein_pct / 100)) / 4);
  const carbsGoal = Math.round((goals.calories * (goals.carbs_pct / 100)) / 4);
  const fatGoal = Math.round((goals.calories * (goals.fat_pct / 100)) / 9);

  const today = entries
    .filter((e) => dayKey(e.loggedAt) === dayKey(Date.now()))
    .sort((a, b) => b.loggedAt - a.loggedAt)
    .slice(0, 4);

  // Render greeting client-side only to avoid SSR/CSR mismatch
  const [now, setNow] = useState<Date | null>(null);
  useEffect(() => { setNow(new Date()); }, []);

  const greetingKey = now
    ? now.getHours() < 12
      ? "greeting_morning"
      : now.getHours() < 18
        ? "greeting_afternoon"
        : "greeting_evening"
    : null;
  const displayName = profile.firstName || goals.name;

  return (
    <AppShell>
      <header className="flex items-start justify-between gap-2 pt-2">
        <div className="min-w-0">
          <h1 className="font-display text-[22px] font-bold leading-tight text-foreground">
            {greetingKey ? `${t(greetingKey)}, ${displayName}` : displayName} 👋
          </h1>
          <p className="mt-0.5 text-xs text-muted-foreground">
            {now ? now.toLocaleDateString(lang === "fr" ? "fr-FR" : "en-US", { weekday: "long", month: "long", day: "numeric" }) : "\u00A0"}
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          {hydrated && isAdmin && (
            <span className="rounded-full bg-primary/15 px-2.5 py-1 text-[10px] font-bold text-primary">
              {t("admin_badge")}
            </span>
          )}
          {hydrated && profile.isSubscribed && !isAdmin && (
            <span className="rounded-full bg-primary/15 px-2.5 py-1 text-[10px] font-bold text-primary">
              {t("pro_active")}
            </span>
          )}
          <LangToggle />
          <StreakBadge days={hydrated ? streak : 0} />
        </div>
      </header>

      {hydrated && !profile.isSubscribed && !isAdmin && activePromo && (
        <div
          className="mt-4 rounded-xl px-4 py-2.5 text-center text-xs font-semibold text-primary"
          style={{ background: "rgba(168,255,62,0.15)", border: "1px solid #A8FF3E" }}
        >
          {t("promo_banner", { code: activePromo })}
        </div>
      )}

      {hydrated && !profile.isSubscribed && !isAdmin && (
        <div
          className={`mt-4 rounded-2xl border px-4 py-2.5 text-center text-xs font-semibold ${
            freeScansLeft <= 3
              ? "border-[#FF6B6B]/40 bg-[#FF6B6B]/10 text-[#FF6B6B]"
              : "border-primary/30 bg-primary/10 text-primary"
          }`}
        >
          {freeScansLeft <= 3
            ? t("scans_warning", { n: freeScansLeft })
            : t("scans_remaining", { n: freeScansLeft })}
        </div>
      )}

      <section className="mt-7 flex justify-center">
        <CalorieRing eaten={totals.calories} goal={goals.calories} />
      </section>

      <section className="mt-6 grid grid-cols-3 gap-2.5">
        <MacroCard label={t("protein")} value={totals.protein_g} goal={proteinGoal} color="protein" delay={0} />
        <MacroCard label={t("carbs")} value={totals.carbs_g} goal={carbsGoal} color="carbs" delay={150} />
        <MacroCard label={t("fat")} value={totals.fat_g} goal={fatGoal} color="fat" delay={300} />
      </section>

      <motion.div whileTap={{ scale: 0.97 }} className="mt-6">
        <Link
          to="/scan"
          className="glow-lime flex h-[52px] items-center justify-center gap-2 rounded-2xl bg-primary px-6 font-bold text-primary-foreground"
        >
          {t("log_food")}
        </Link>
      </motion.div>

      <section className="mt-7">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="font-display text-lg font-semibold">{t("recent_meals")}</h2>
          <Link to="/diary" className="flex items-center text-xs text-muted-foreground">
            {t("view_all")} <ChevronRight className="h-3 w-3" />
          </Link>
        </div>
        {today.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-white/10 bg-white/[0.03] p-6 text-center">
            <div className="text-3xl">🥗</div>
            <p className="mt-2 text-sm text-muted-foreground">{t("no_meals_today")}</p>
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
