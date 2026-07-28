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
  loggedAt: number;
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

export type ActivityLevel = "sedentary" | "moderate" | "active" | "very_active";

export interface Profile {
  onboarded: boolean;
  firstName: string;
  lastName: string;
  calorieGoal: number;
  activityLevel: ActivityLevel;
  trialStartDate: number;
  isSubscribed: boolean;
}

interface StoreState {
  entries: FoodEntry[];
  goals: Goals;
  addEntry: (e: Omit<FoodEntry, "id" | "loggedAt"> & { loggedAt?: number }) => void;
  deleteEntry: (id: string) => void;
  setGoals: (g: Partial<Goals>) => void;
  streak: number;
  bestStreak: number;
  loggedDays: Set<string>;
  startDate: number;
  hydrated: boolean;
  profile: Profile;
  setProfile: (p: Partial<Profile>) => void;
  completeOnboarding: (p: { firstName: string; lastName: string; calorieGoal: number; activityLevel: ActivityLevel }) => void;
  trialDaysLeft: number;
  isPaywalled: boolean;
}

const StoreCtx = createContext<StoreState | null>(null);

const STORAGE_KEY = "nutrilens.v2";
const PROFILE_KEY = "nutrilens.profile.v1";

export const TRIAL_DAYS = 3;

const defaultProfile: Profile = {
  onboarded: false,
  firstName: "",
  lastName: "",
  calorieGoal: 2500,
  activityLevel: "moderate",
  trialStartDate: 0,
  isSubscribed: false,
};

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
  const todayKey = dayKey(now.getTime());
  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  const startedToday = days.has(todayKey);
  // start from today if logged today, else yesterday
  const startOffset = startedToday ? 0 : 1;
  for (let i = startOffset; i < 400; i++) {
    const d = new Date(now);
    d.setDate(now.getDate() - i);
    if (days.has(dayKey(d.getTime()))) streak++;
    else break;
  }
  return streak;
}

function seedDemoEntries(): FoodEntry[] {
  const now = new Date();
  const at = (h: number, m = 0) => {
    const d = new Date(now);
    d.setHours(h, m, 0, 0);
    return d.getTime();
  };
  return [
    {
      id: crypto.randomUUID(),
      foodName: "Oatmeal with Banana",
      emoji: "🥣",
      calories: 380, protein_g: 12, carbs_g: 68, fat_g: 7,
      serving_size: "1 bowl ~300g",
      meal: "breakfast", loggedAt: at(8, 15),
    },
    {
      id: crypto.randomUUID(),
      foodName: "Grilled Chicken & Rice",
      emoji: "🍗",
      calories: 520, protein_g: 45, carbs_g: 52, fat_g: 8,
      serving_size: "1 plate ~400g",
      meal: "lunch", loggedAt: at(13, 5),
    },
    {
      id: crypto.randomUUID(),
      foodName: "Greek Yogurt",
      emoji: "🥛",
      calories: 150, protein_g: 15, carbs_g: 12, fat_g: 3,
      serving_size: "1 cup ~170g",
      meal: "snacks", loggedAt: at(16, 30),
    },
  ];
}

function daysBetween(a: number, b: number) {
  const d1 = new Date(a); d1.setHours(0, 0, 0, 0);
  const d2 = new Date(b); d2.setHours(0, 0, 0, 0);
  return Math.floor((d2.getTime() - d1.getTime()) / 86400000);
}

export function StoreProvider({ children }: { children: ReactNode }) {
  const [entries, setEntries] = useState<FoodEntry[]>([]);
  const [goals, setGoalsState] = useState<Goals>(defaultGoals);
  const [bestStreak, setBestStreakState] = useState(0);
  const [startDate, setStartDate] = useState<number>(0);
  const [hydrated, setHydrated] = useState(false);
  const [profile, setProfileState] = useState<Profile>(defaultProfile);

  useEffect(() => {
    let loaded = false;
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed.entries)) setEntries(parsed.entries);
        if (parsed.goals) setGoalsState({ ...defaultGoals, ...parsed.goals });
        if (typeof parsed.bestStreak === "number") setBestStreakState(parsed.bestStreak);
        if (typeof parsed.startDate === "number") setStartDate(parsed.startDate);
        loaded = true;
      }
    } catch {}
    try {
      const rawP = localStorage.getItem(PROFILE_KEY);
      if (rawP) setProfileState({ ...defaultProfile, ...JSON.parse(rawP) });
    } catch {}
    if (!loaded) {
      const seeded = seedDemoEntries();
      setEntries(seeded);
      setStartDate(Date.now());
      setBestStreakState(1);
    }
    setHydrated(true);
  }, []);

  // Recompute best streak whenever entries change
  useEffect(() => {
    if (!hydrated) return;
    const days = new Set(entries.map((e) => dayKey(e.loggedAt)));
    const current = computeStreak(days);
    setBestStreakState((prev) => Math.max(prev, current));
  }, [entries, hydrated]);

  useEffect(() => {
    if (!hydrated) return;
    try {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({ entries, goals, bestStreak, startDate: startDate || Date.now() }),
      );
    } catch {}
  }, [entries, goals, bestStreak, startDate, hydrated]);

  useEffect(() => {
    if (!hydrated) return;
    try { localStorage.setItem(PROFILE_KEY, JSON.stringify(profile)); } catch {}
  }, [profile, hydrated]);

  const value = useMemo<StoreState>(() => {
    const loggedDays = new Set(entries.map((e) => dayKey(e.loggedAt)));
    const elapsed = profile.trialStartDate ? daysBetween(profile.trialStartDate, Date.now()) : 0;
    const trialDaysLeft = Math.max(0, TRIAL_DAYS - elapsed);
    const isPaywalled = profile.onboarded && !profile.isSubscribed && trialDaysLeft <= 0;

    // Profile is the source of truth for the user's name and calorie goal
    const mergedGoals: Goals = profile.onboarded
      ? { ...goals, name: profile.firstName || goals.name, calories: profile.calorieGoal }
      : goals;

    return {
      entries,
      goals: mergedGoals,
      addEntry: (e) =>
        setEntries((prev) => [
          ...prev,
          { ...e, id: crypto.randomUUID(), loggedAt: e.loggedAt ?? Date.now() },
        ]),
      deleteEntry: (id) => setEntries((prev) => prev.filter((x) => x.id !== id)),
      setGoals: (g) => {
        setGoalsState((prev) => ({ ...prev, ...g }));
        setProfileState((prev) => ({
          ...prev,
          ...(g.name !== undefined ? { firstName: g.name } : {}),
          ...(g.calories !== undefined ? { calorieGoal: g.calories } : {}),
        }));
      },
      streak: computeStreak(loggedDays),
      bestStreak,
      loggedDays,
      startDate: startDate || Date.now(),
      hydrated,
      profile,
      setProfile: (p) => setProfileState((prev) => ({ ...prev, ...p })),
      completeOnboarding: (p) => {
        setProfileState((prev) => ({
          ...prev,
          ...p,
          onboarded: true,
          trialStartDate: prev.trialStartDate || Date.now(),
        }));
        setGoalsState((prev) => ({ ...prev, name: p.firstName, calories: p.calorieGoal }));
        setStartDate((prev) => prev || Date.now());
      },
      trialDaysLeft,
      isPaywalled,
    };
  }, [entries, goals, bestStreak, startDate, hydrated, profile]);


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
