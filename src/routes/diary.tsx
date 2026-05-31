import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";
import { useStore, type MealType, type FoodEntry, dayKey } from "@/lib/store";
import { useState, useRef } from "react";
import { motion, AnimatePresence, type PanInfo } from "framer-motion";
import { Trash2, Plus } from "lucide-react";
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

const MEAL_ORDER: { key: MealType; label: string; emoji: string }[] = [
  { key: "breakfast", label: "Breakfast", emoji: "🌅" },
  { key: "lunch", label: "Lunch", emoji: "☀️" },
  { key: "dinner", label: "Dinner", emoji: "🌙" },
  { key: "snacks", label: "Snacks", emoji: "🍿" },
];

function DiaryPage() {
  const { entries, deleteEntry, addEntry } = useStore();
  const today = entries.filter((e) => dayKey(e.loggedAt) === dayKey(Date.now()));
  const totalKcal = today.reduce((s, e) => s + e.calories, 0);

  return (
    <AppShell>
      <header className="pt-2">
        <h1 className="font-display text-3xl font-bold">Today</h1>
        <p className="text-sm text-muted-foreground">{new Date().toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric" })}</p>
      </header>

      <div className="sticky top-2 z-10 mt-4 flex items-center justify-between rounded-2xl border border-white/5 bg-card/80 px-4 py-3 backdrop-blur">
        <span className="text-xs uppercase tracking-wider text-muted-foreground">Daily total</span>
        <span className="font-display text-xl font-bold tabular-nums">{totalKcal} <span className="text-xs font-medium text-muted-foreground">kcal</span></span>
      </div>

      <div className="mt-5 flex flex-col gap-6">
        {MEAL_ORDER.map(({ key, label, emoji }) => {
          const items = today.filter((e) => e.meal === key);
          const sub = items.reduce((s, e) => s + e.calories, 0);
          return (
            <section key={key}>
              <div className="mb-2 flex items-center justify-between px-1">
                <div className="flex items-center gap-2">
                  <span className="text-lg">{emoji}</span>
                  <h2 className="font-display text-base font-semibold">{label}</h2>
                  <span className="text-xs text-muted-foreground tabular-nums">{sub} kcal</span>
                </div>
                <ManualAdd meal={key} onAdd={addEntry} />
              </div>
              {items.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-white/8 bg-card/40 p-4 text-center text-xs text-muted-foreground">
                  Nothing logged
                </div>
              ) : (
                <ul className="flex flex-col gap-2">
                  <AnimatePresence initial={false}>
                    {items.map((e) => (
                      <SwipeRow key={e.id} entry={e} onDelete={() => { deleteEntry(e.id); toast("Removed"); }} />
                    ))}
                  </AnimatePresence>
                </ul>
              )}
            </section>
          );
        })}

        {today.length === 0 && (
          <div className="mt-2 rounded-3xl border border-dashed border-white/10 bg-card/50 p-8 text-center">
            <div className="text-5xl">📸</div>
            <p className="mt-3 font-display text-lg font-semibold">Snap your first meal!</p>
            <p className="text-sm text-muted-foreground">Your day's log will appear here.</p>
          </div>
        )}
      </div>
    </AppShell>
  );
}

function SwipeRow({ entry, onDelete }: { entry: FoodEntry; onDelete: () => void }) {
  const ref = useRef<HTMLLIElement>(null);
  function onEnd(_: any, info: PanInfo) {
    if (info.offset.x < -100) onDelete();
  }
  return (
    <motion.li
      ref={ref}
      layout
      exit={{ opacity: 0, x: -200, transition: { duration: 0.2 } }}
      className="relative"
    >
      <div className="pointer-events-none absolute inset-y-0 right-0 flex w-24 items-center justify-end rounded-2xl bg-destructive/20 pr-5">
        <Trash2 className="h-5 w-5 text-destructive" />
      </div>
      <motion.div
        drag="x"
        dragConstraints={{ left: -120, right: 0 }}
        dragElastic={0.15}
        onDragEnd={onEnd}
        className="relative flex items-center gap-3 rounded-2xl border border-white/5 bg-card p-3"
      >
        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-surface text-xl">{entry.emoji}</div>
        <div className="min-w-0 flex-1">
          <div className="truncate text-sm font-medium">{entry.foodName}</div>
          <div className="mt-0.5 flex items-center gap-1.5 text-[10px] font-medium">
            <span className="rounded-full bg-[color:var(--color-protein)]/15 px-1.5 py-0.5 text-[color:var(--color-protein)]">P {entry.protein_g}g</span>
            <span className="rounded-full bg-[color:var(--color-carbs)]/15 px-1.5 py-0.5 text-[color:var(--color-carbs)]">C {entry.carbs_g}g</span>
            <span className="rounded-full bg-[color:var(--color-fat)]/15 px-1.5 py-0.5 text-[color:var(--color-fat)]">F {entry.fat_g}g</span>
          </div>
        </div>
        <div className="rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary tabular-nums">{entry.calories}</div>
      </motion.div>
    </motion.li>
  );
}

function ManualAdd({ meal, onAdd }: { meal: MealType; onAdd: ReturnType<typeof useStore>["addEntry"] }) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [kcal, setKcal] = useState("");

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const c = Math.max(0, Math.round(Number(kcal) || 0));
    if (!name.trim() || c <= 0) return;
    onAdd({
      foodName: name.trim(),
      emoji: "🍴",
      calories: c,
      protein_g: 0,
      carbs_g: 0,
      fat_g: 0,
      serving_size: "1 serving",
      meal,
    });
    setName(""); setKcal(""); setOpen(false);
    toast.success("Added");
  }

  return (
    <>
      <button onClick={() => setOpen((v) => !v)} className="tap flex items-center gap-1 rounded-full bg-surface px-2.5 py-1 text-xs text-muted-foreground hover:text-foreground">
        <Plus className="h-3 w-3" /> Add
      </button>
      <AnimatePresence>
        {open && (
          <motion.form
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            onSubmit={submit}
            className="mb-2 grid grid-cols-[1fr_90px_auto] gap-2 overflow-hidden"
          >
            <input
              autoFocus
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Food name"
              className="rounded-xl border border-white/10 bg-card px-3 py-2 text-sm outline-none focus:border-primary/50"
            />
            <input
              value={kcal}
              onChange={(e) => setKcal(e.target.value)}
              type="number"
              inputMode="numeric"
              placeholder="kcal"
              className="rounded-xl border border-white/10 bg-card px-3 py-2 text-sm tabular-nums outline-none focus:border-primary/50"
            />
            <button type="submit" className="rounded-xl bg-primary px-3 text-sm font-semibold text-primary-foreground">Save</button>
          </motion.form>
        )}
      </AnimatePresence>
    </>
  );
}
