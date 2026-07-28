import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";
import { useStore, type MealType, type FoodEntry, dayKey } from "@/lib/store";
import { useLanguage, type TKey } from "@/lib/i18n";
import { useRef } from "react";
import { motion, AnimatePresence, type PanInfo } from "framer-motion";
import { Trash2, Plus } from "lucide-react";
import { MacroChips } from "@/components/MacroChips";
import { LangToggle } from "@/components/LangToggle";
import { toast } from "sonner";

export const Route = createFileRoute("/diary")({
  head: () => ({
    meta: [
      { title: "NutriLens — Diary" },
      { name: "description", content: "Today's food log grouped by meal." },
    ],
  }),
  component: DiaryPage,
});

const MEAL_ORDER: { key: MealType; labelKey: TKey; emoji: string }[] = [
  { key: "breakfast", labelKey: "breakfast", emoji: "🌅" },
  { key: "lunch", labelKey: "lunch", emoji: "☀️" },
  { key: "dinner", labelKey: "dinner", emoji: "🌙" },
  { key: "snacks", labelKey: "snacks", emoji: "🍿" },
];

function DiaryPage() {
  const { entries, goals, deleteEntry } = useStore();
  const { t, lang } = useLanguage();
  const navigate = useNavigate();
  const today = entries.filter((e) => dayKey(e.loggedAt) === dayKey(Date.now()));
  const totalKcal = today.reduce((s, e) => s + e.calories, 0);
  const totalP = today.reduce((s, e) => s + e.protein_g, 0);
  const totalC = today.reduce((s, e) => s + e.carbs_g, 0);
  const totalF = today.reduce((s, e) => s + e.fat_g, 0);
  const overBy = totalKcal - goals.calories;
  const onTrack = overBy <= 0;

  return (
    <AppShell>
      <header className="flex items-start justify-between pt-2">
        <div>
          <h1 className="font-display text-3xl font-bold">{t("today")}</h1>
          <p className="text-xs text-muted-foreground">
            {new Date().toLocaleDateString(lang === "fr" ? "fr-FR" : "en-US", { weekday: "long", month: "long", day: "numeric" })}
          </p>
        </div>
        <LangToggle />
      </header>

      <div className="sticky top-2 z-10 mt-4 flex items-center justify-between rounded-2xl border border-white/7 bg-card/85 px-4 py-3 backdrop-blur">
        <div>
          <div className="text-[10px] uppercase tracking-wider text-muted-foreground">{t("daily_total")}</div>
          <div className="font-display text-xl font-bold tabular-nums">
            {totalKcal}
            <span className="text-xs font-medium text-muted-foreground"> / {goals.calories} kcal</span>
          </div>
        </div>
        <span
          className="rounded-full px-3 py-1 text-xs font-semibold"
          style={{
            background: onTrack ? "rgba(168,255,62,0.15)" : "rgba(255,107,107,0.15)",
            color: onTrack ? "#A8FF3E" : "#FF6B6B",
            border: `1px solid ${onTrack ? "#A8FF3E" : "#FF6B6B"}`,
          }}
        >
          {onTrack ? t("on_track") : t("over_by", { n: overBy })}
        </span>
      </div>


      <div className="mt-5 flex flex-col gap-5">
        {MEAL_ORDER.map(({ key, labelKey, emoji }) => {
          const label = t(labelKey);
          const items = today.filter((e) => e.meal === key);
          const sub = items.reduce((s, e) => s + e.calories, 0);
          return (
            <section key={key}>
              <div className="mb-2 flex items-center justify-between px-1">
                <div className="flex items-center gap-2">
                  <span className="text-base">{emoji}</span>
                  <h2 className="font-display text-base font-semibold">{label}</h2>
                  <span className="text-xs text-muted-foreground tabular-nums">{sub} kcal</span>
                </div>
                <button
                  onClick={() => navigate({ to: "/scan" })}
                  aria-label={`+ ${label}`}
                  className="tap flex h-8 w-8 items-center justify-center rounded-full bg-primary/15 text-primary"
                >
                  <Plus className="h-4 w-4" strokeWidth={2.5} />
                </button>
              </div>
              {items.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-white/10 bg-white/[0.03] p-4 text-center text-xs text-muted-foreground">
                  {t("tap_to_log")} {label.toLowerCase()}
                </div>
              ) : (
                <ul className="flex flex-col gap-2">
                  <AnimatePresence initial={false}>
                    {items.map((e) => (
                      <SwipeRow key={e.id} entry={e} onDelete={() => { deleteEntry(e.id); toast(t("removed")); }} />
                    ))}
                  </AnimatePresence>
                </ul>
              )}
            </section>
          );
        })}
      </div>

      {today.length > 0 && (
        <section className="mt-6 glass rounded-2xl p-4">
          <h3 className="mb-3 font-display text-sm font-semibold">{t("todays_macros")}</h3>
          <div className="grid grid-cols-3 gap-2 text-center">
            <MacroSum label={t("protein")} value={totalP} color="#3E9BFF" />
            <MacroSum label={t("carbs")} value={totalC} color="#FFD93D" />
            <MacroSum label={t("fat")} value={totalF} color="#FF6B6B" />
          </div>
        </section>

      )}
    </AppShell>
  );
}

function MacroSum({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div className="rounded-xl bg-white/[0.04] py-2">
      <div className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</div>
      <div className="font-display text-lg font-bold tabular-nums" style={{ color }}>{value}g</div>
    </div>
  );
}

function SwipeRow({ entry, onDelete }: { entry: FoodEntry; onDelete: () => void }) {
  const ref = useRef<HTMLLIElement>(null);
  function onEnd(_: unknown, info: PanInfo) {
    if (info.offset.x < -100) onDelete();
  }
  return (
    <motion.li ref={ref} layout exit={{ opacity: 0, x: -200, transition: { duration: 0.2 } }} className="relative">
      <div className="pointer-events-none absolute inset-y-0 right-0 flex w-24 items-center justify-end rounded-2xl bg-destructive/20 pr-5">
        <Trash2 className="h-5 w-5 text-destructive" />
      </div>
      <motion.div
        drag="x"
        dragConstraints={{ left: -120, right: 0 }}
        dragElastic={0.15}
        onDragEnd={onEnd}
        className="relative flex items-center gap-3 rounded-2xl border border-white/7 bg-white/[0.04] p-3 backdrop-blur"
      >
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-surface text-xl">{entry.emoji}</div>
        <div className="min-w-0 flex-1">
          <div className="flex items-baseline justify-between gap-2">
            <span className="truncate text-sm font-medium">{entry.foodName}</span>
            <span className="shrink-0 text-xs font-semibold tabular-nums text-primary">{entry.calories} kcal</span>
          </div>
          <MacroChips p={entry.protein_g} c={entry.carbs_g} f={entry.fat_g} />
        </div>
      </motion.div>
    </motion.li>
  );
}
