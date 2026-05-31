import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";

export type MealType = "breakfast" | "lunch" | "dinner" | "snacks";

export interface FoodEntry {
  id: string;
  foodName: string;
  emoji: string;
  calories: number;
  protein_g: number;
  carbs_g: number;
  fat_g: number;
  serving_size: string;
  meal: MealType;
  loggedAt: number; // epoch ms
}

export interface Goals {
  calories: number;
  protein_pct: number;
  carbs_pct: number;
  fat_pct: number;
  name: string;
  weight_kg: number;
  weight_goal_kg: number;
}

interface StoreState {
  entries: FoodEntry[];
  goals: Goals;
  addEntry: (e: Omit<FoodEntry, "id" | "loggedAt"> & { loggedAt?: number }) => void;
  deleteEntry: (id: string) => void;
  setGoals: (g: Partial<Goals>) => void;
  streak: number;
  loggedDays: Set<string>; // yyyy-mm-dd
}

const StoreCtx = createContext<StoreState | null>(null);

const STORAGE_KEY = "nutrilens.v1";

const defaultGoals: Goals = {
  calories: 2500,
  protein_pct: 30,
  carbs_pct: 45,
  fat_pct: 25,
  name: "Alex",
  weight_kg: 78,
  weight_goal_kg: 72,
};

export function dayKey(ts: number): string {
  const d = new Date(ts);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function computeStreak(days: Set<string>): number {
  let streak = 0;
  const now = new Date();
  for (let i = 0; i < 400; i++) {
    const d = new Date(now);
    d.setDate(now.getDate() - i);
    const key = dayKey(d.getTime());
    if (days.has(key)) {
      streak++;
    } else if (i === 0) {
      // today not logged yet — keep checking yesterday onward
      continue;
    } else {
      break;
    }
  }
  return streak;
}

export function StoreProvider({ children }: { children: ReactNode }) {
  const [entries, setEntries] = useState<FoodEntry[]>([]);
  const [goals, setGoalsState] = useState<Goals>(defaultGoals);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed.entries)) setEntries(parsed.entries);
        if (parsed.goals) setGoalsState({ ...defaultGoals, ...parsed.goals });
      }
    } catch {}
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ entries, goals }));
    } catch {}
  }, [entries, goals, hydrated]);

  const value = useMemo<StoreState>(() => {
    const loggedDays = new Set(entries.map((e) => dayKey(e.loggedAt)));
    return {
      entries,
      goals,
      addEntry: (e) =>
        setEntries((prev) => [
          ...prev,
          {
            ...e,
            id: crypto.randomUUID(),
            loggedAt: e.loggedAt ?? Date.now(),
          },
        ]),
      deleteEntry: (id) => setEntries((prev) => prev.filter((x) => x.id !== id)),
      setGoals: (g) => setGoalsState((prev) => ({ ...prev, ...g })),
      streak: computeStreak(loggedDays),
      loggedDays,
    };
  }, [entries, goals]);

  return <StoreCtx.Provider value={value}>{children}</StoreCtx.Provider>;
}

export function useStore() {
  const ctx = useContext(StoreCtx);
  if (!ctx) throw new Error("useStore must be used within StoreProvider");
  return ctx;
}

export function todayTotals(entries: FoodEntry[]) {
  const key = dayKey(Date.now());
  const today = entries.filter((e) => dayKey(e.loggedAt) === key);
  return today.reduce(
    (acc, e) => ({
      calories: acc.calories + e.calories,
      protein_g: acc.protein_g + e.protein_g,
      carbs_g: acc.carbs_g + e.carbs_g,
      fat_g: acc.fat_g + e.fat_g,
      count: acc.count + 1,
    }),
    { calories: 0, protein_g: 0, carbs_g: 0, fat_g: 0, count: 0 },
  );
}
