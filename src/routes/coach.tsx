import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { motion, AnimatePresence } from "framer-motion";
import { Send, RotateCcw, ChevronDown } from "lucide-react";
import { toast } from "sonner";
import { BottomNav } from "@/components/BottomNav";
import { LangToggle } from "@/components/LangToggle";
import { useLanguage } from "@/lib/i18n";
import { useStore, type MealType } from "@/lib/store";
import { generateMealPlan, type MealPlan, type PlanMeal } from "@/lib/mealplan.functions";

export const Route = createFileRoute("/coach")({
  head: () => ({
    meta: [
      { title: "NutriLens — AI Nutrition Coach" },
      { name: "description", content: "Chat with your AI nutrition coach and get a personalized 30-day meal plan." },
      { property: "og:title", content: "NutriLens — AI Nutrition Coach" },
      { property: "og:description", content: "Get a personalized 30-day meal plan from your AI nutrition coach." },
    ],
  }),
  component: CoachPage,
});

const PLAN_KEY = "nutrilens_meal_plan";

type Chip = { label: string; value: string };
type Msg = {
  id: string;
  role: "agent" | "user";
  text?: string;
  chips?: Chip[];
  plan?: MealPlan;
};

type Step = "calories" | "country" | "meals" | "diet" | "ingredients" | "done";

const COUNTRIES = [
  "🇧🇯 Bénin",
  "🇸🇳 Sénégal",
  "🇨🇮 Côte d'Ivoire",
  "🇹🇬 Togo",
  "🇨🇲 Cameroun",
  "🇫🇷 France",
  "🇺🇸 USA",
];

const uid = () => Math.random().toString(36).slice(2);

function TypingBubble() {
  return (
    <div className="flex items-end gap-2">
      <span className="text-lg">🤖</span>
      <div
        className="flex items-center gap-1 px-4 py-3"
        style={{
          background: "#1C1C26",
          border: "1px solid rgba(255,255,255,0.07)",
          borderRadius: "18px 18px 18px 4px",
        }}
      >
        {[0, 1, 2].map((i) => (
          <motion.span
            key={i}
            animate={{ scale: [0.6, 1, 0.6], opacity: [0.4, 1, 0.4] }}
            transition={{ duration: 1, repeat: Infinity, delay: i * 0.18 }}
            className="block h-2 w-2 rounded-full"
            style={{ background: "rgba(168,255,62,0.6)" }}
          />
        ))}
      </div>
    </div>
  );
}

function MacroChipsSmall({ p, c, f }: { p: number; c: number; f: number }) {
  const s = { fontSize: 11, padding: "2px 8px", borderRadius: 20, fontWeight: 600, whiteSpace: "nowrap" as const };
  return (
    <div className="mt-1 flex flex-wrap items-center gap-1.5">
      <span style={{ ...s, background: "rgba(62,155,255,0.15)", color: "#3E9BFF" }}>P: {p}g 🔵</span>
      <span style={{ ...s, background: "rgba(255,217,61,0.15)", color: "#FFD93D" }}>C: {c}g 🟡</span>
      <span style={{ ...s, background: "rgba(255,107,107,0.15)", color: "#FF6B6B" }}>F: {f}g 🔴</span>
    </div>
  );
}

function mealTypeFor(index: number, total: number): MealType {
  if (index === 0) return "breakfast";
  if (index === total - 1 && total > 2) return "dinner";
  if (index === 1) return "lunch";
  return "snacks";
}

function PlanCard({ plan, onCantMake }: { plan: MealPlan; onCantMake: () => void }) {
  const { t } = useLanguage();
  const { addEntry } = useStore();
  const [dayIdx, setDayIdx] = useState(0);
  const [openIng, setOpenIng] = useState<number | null>(null);
  const day = plan.days[Math.min(dayIdx, plan.days.length - 1)];
  if (!day) return null;

  function add(meal: PlanMeal, i: number) {
    addEntry({
      foodName: meal.dish,
      emoji: "🍽️",
      calories: meal.calories,
      protein_g: meal.protein_g,
      carbs_g: meal.carbs_g,
      fat_g: meal.fat_g,
      serving_size: meal.mealName,
      meal: mealTypeFor(i, day!.meals.length),
    });
    toast.success(`${meal.dish} ${t("coach_added")}`);
  }

  return (
    <div className="mt-2 w-full overflow-hidden rounded-2xl" style={{ background: "#12121A", border: "1px solid rgba(255,255,255,0.07)" }}>
      <div className="px-4 py-3" style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
        <p className="text-sm font-bold text-foreground">
          📅 {t("coach_plan_title")} — {plan.calorieGoal} kcal/{t("per_day").split(" ").pop()}
        </p>
      </div>

      <div className="flex gap-2 overflow-x-auto px-3 py-3" style={{ scrollbarWidth: "none" }}>
        {plan.days.map((d, i) => (
          <button
            key={d.day}
            onClick={() => { setDayIdx(i); setOpenIng(null); }}
            className={`tap shrink-0 rounded-full px-3 py-1.5 text-xs font-semibold ${
              i === dayIdx ? "bg-primary text-primary-foreground" : "text-muted-foreground"
            }`}
            style={i === dayIdx ? undefined : { background: "rgba(255,255,255,0.05)" }}
          >
            {t("coach_day")} {d.day}
          </button>
        ))}
      </div>

      <div className="px-3 pb-4">
        <div className="mb-2 flex items-center justify-between gap-2">
          <p className="text-sm font-semibold text-foreground">{day.dayName}</p>
          <span className="rounded-full bg-primary px-2.5 py-1 text-[11px] font-bold text-primary-foreground">
            {day.totalCalories} kcal
          </span>
        </div>

        <div className="flex flex-col gap-2">
          {day.meals.map((m, i) => (
            <div key={i} className="rounded-xl p-3" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}>
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">{m.mealName}</p>
                  <p className="truncate text-sm font-bold text-foreground">{m.dish}</p>
                  <p className="text-xs text-muted-foreground">{m.description}</p>
                </div>
                <span className="shrink-0 rounded-full px-2 py-1 text-[11px] font-bold text-primary" style={{ background: "rgba(168,255,62,0.12)" }}>
                  {m.calories}
                </span>
              </div>

              <MacroChipsSmall p={m.protein_g} c={m.carbs_g} f={m.fat_g} />

              {m.ingredients.length > 0 && (
                <div className="mt-2">
                  <button
                    onClick={() => setOpenIng(openIng === i ? null : i)}
                    className="tap flex items-center gap-1 text-[11px] font-medium text-muted-foreground"
                  >
                    {t("coach_ingredients")}
                    <ChevronDown className={`h-3 w-3 transition-transform ${openIng === i ? "rotate-180" : ""}`} />
                  </button>
                  {openIng === i && (
                    <div className="mt-1.5 flex flex-wrap gap-1.5">
                      {m.ingredients.map((ing, k) => (
                        <span key={k} className="rounded-full px-2 py-0.5 text-[10px] text-muted-foreground" style={{ background: "rgba(255,255,255,0.06)" }}>
                          {ing}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              )}

              <div className="mt-2.5 flex flex-wrap gap-2">
                <button
                  onClick={() => add(m, i)}
                  className="tap rounded-full bg-primary px-3 py-1.5 text-[11px] font-bold text-primary-foreground"
                >
                  {t("coach_add_to_diary")}
                </button>
                <button
                  onClick={onCantMake}
                  className="tap rounded-full px-3 py-1.5 text-[11px] font-semibold"
                  style={{ background: "rgba(255,107,107,0.12)", color: "#FF6B6B" }}
                >
                  {t("coach_cant_make")}
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function CoachPage() {
  const { t, lang } = useLanguage();
  const { profile } = useStore();
  const gen = useServerFn(generateMealPlan);

  const [messages, setMessages] = useState<Msg[]>([]);
  const [chips, setChips] = useState<Chip[]>([]);
  const [step, setStep] = useState<Step>("calories");
  const [typing, setTyping] = useState(false);
  const [input, setInput] = useState("");
  const [answers, setAnswers] = useState<{ calories: number; country: string; meals: number; diet: string }>({
    calories: profile.calorieGoal || 2500,
    country: profile.country || "",
    meals: 3,
    diet: "all",
  });
  const bootedRef = useRef(false);
  const scrollRef = useRef<HTMLDivElement | null>(null);

  const name = profile.firstName || "👋";

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, typing, chips]);

  function push(m: Omit<Msg, "id">) {
    setMessages((prev) => [...prev, { ...m, id: uid() }]);
  }

  function startFlow() {
    setMessages([]);
    setChips([]);
    setStep("calories");
    push({ role: "agent", text: t("coach_intro", { name }) });
    setTyping(true);
    window.setTimeout(() => {
      setTyping(false);
      push({ role: "agent", text: t("coach_q_calories") });
      setChips([1500, 2000, 2500, 3000].map((n) => ({ label: `${n} kcal`, value: String(n) })));
    }, 800);
  }

  // boot: restore saved plan or start conversation
  useEffect(() => {
    if (bootedRef.current) return;
    bootedRef.current = true;
    let saved: MealPlan | null = null;
    try {
      const raw = localStorage.getItem(PLAN_KEY);
      if (raw) saved = JSON.parse(raw) as MealPlan;
    } catch {}
    if (saved?.days?.length) {
      setStep("done");
      setMessages([
        { id: uid(), role: "agent", text: t("coach_welcome_back", { name }) },
        { id: uid(), role: "agent", plan: saved },
      ]);
    } else {
      startFlow();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function runGeneration(next: typeof answers, mode: "plan" | "alternative", ingredients?: string) {
    setChips([]);
    setTyping(true);
    try {
      const plan = await gen({
        data: {
          mode,
          calorieGoal: next.calories,
          mealsPerDay: next.meals,
          dietType: next.diet,
          language: lang,
          country: next.country || undefined,
          ingredients,
        },
      });
      try { localStorage.setItem(PLAN_KEY, JSON.stringify(plan)); } catch {}
      setTyping(false);
      push({ role: "agent", text: mode === "plan" ? t("coach_plan_ready") : t("coach_alt_ready") });
      push({ role: "agent", plan });
      setStep("done");
    } catch {
      setTyping(false);
      push({ role: "agent", text: t("coach_error") });
      setStep("done");
    }
  }

  function handleAnswer(value: string) {
    push({ role: "user", text: value });
    setChips([]);

    if (step === "calories") {
      const n = parseInt(value.replace(/\D/g, ""), 10);
      const calories = Number.isFinite(n) && n >= 800 && n <= 6000 ? n : answers.calories;
      setAnswers((a) => ({ ...a, calories }));
      setTyping(true);
      window.setTimeout(() => {
        setTyping(false);
        push({ role: "agent", text: t("coach_q_country") });
        setChips([...COUNTRIES.map((c) => ({ label: c, value: c })), { label: t("country_other"), value: "__other__" }]);
        setStep("country");
      }, 800);
      return;
    }

    if (step === "country") {
      if (value === "__other__") {
        push({ role: "agent", text: t("country_other_ph") });
        return;
      }
      const country = value.replace(/^[^\p{L}]+/u, "").trim() || value;
      setAnswers((a) => ({ ...a, country }));
      setTyping(true);
      window.setTimeout(() => {
        setTyping(false);
        push({ role: "agent", text: t("coach_q_meals") });
        setChips([2, 3, 4, 5].map((n) => ({ label: t("coach_meals_n", { n }), value: String(n) })));
        setStep("meals");
      }, 800);
      return;
    }

    if (step === "meals") {
      const n = parseInt(value.replace(/\D/g, ""), 10);
      const meals = Number.isFinite(n) && n >= 1 && n <= 8 ? n : 3;
      setAnswers((a) => ({ ...a, meals }));
      setTyping(true);
      window.setTimeout(() => {
        setTyping(false);
        push({ role: "agent", text: t("coach_q_diet") });
        setChips([
          { label: t("coach_diet_all"), value: t("coach_diet_all") },
          { label: t("coach_diet_nopork"), value: t("coach_diet_nopork") },
          { label: t("coach_diet_veg"), value: t("coach_diet_veg") },
          { label: t("coach_diet_gluten"), value: t("coach_diet_gluten") },
        ]);
        setStep("diet");
      }, 800);
      return;
    }

    if (step === "diet") {
      const next = { ...answers, diet: value };
      setAnswers(next);
      setStep("done");
      setTyping(true);
      window.setTimeout(() => { void runGeneration(next, "plan"); }, 2000);
      return;
    }

    if (step === "ingredients") {
      setStep("done");
      void runGeneration(answers, "alternative", value);
      return;
    }
  }

  function askIngredients() {
    push({ role: "agent", text: t("coach_ingredients_q") });
    setStep("ingredients");
    setChips([]);
  }

  function send() {
    const v = input.trim();
    if (!v) return;
    setInput("");
    handleAnswer(v);
  }

  return (
    <div className="relative mx-auto flex h-dvh max-w-md flex-col" style={{ background: "#08080F" }}>
      <header
        className="sticky top-0 z-30 flex items-center gap-2 px-4 py-3 safe-top"
        style={{ background: "rgba(8,8,15,0.92)", backdropFilter: "blur(12px)", borderBottom: "1px solid rgba(255,255,255,0.06)" }}
      >
        <h1 className="min-w-0 flex-1 truncate text-base font-bold text-foreground">{t("coach_header")}</h1>
        <button
          onClick={() => { try { localStorage.removeItem(PLAN_KEY); } catch {}; startFlow(); }}
          className="tap flex shrink-0 items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-semibold text-primary"
          style={{ background: "rgba(168,255,62,0.12)" }}
        >
          <RotateCcw className="h-3 w-3" />
          {t("coach_new_plan").replace("🔄 ", "")}
        </button>
        <LangToggle />
      </header>

      <div ref={scrollRef} className="flex-1 space-y-3 overflow-y-auto px-4 pb-40 pt-4">
        <AnimatePresence initial={false}>
          {messages.map((m) => (
            <motion.div
              key={m.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}
            >
              {m.role === "agent" ? (
                <div className="flex w-full items-end gap-2">
                  <span className="shrink-0 text-lg">🤖</span>
                  <div className="min-w-0 max-w-[88%]">
                    {m.text && (
                      <div
                        className="px-3.5 py-2.5 text-sm text-foreground"
                        style={{
                          background: "#1C1C26",
                          border: "1px solid rgba(255,255,255,0.07)",
                          borderRadius: "18px 18px 18px 4px",
                          whiteSpace: "pre-line",
                        }}
                      >
                        {m.text}
                      </div>
                    )}
                    {m.plan && <PlanCard plan={m.plan} onCantMake={askIngredients} />}
                  </div>
                </div>
              ) : (
                <div
                  className="max-w-[80%] px-3.5 py-2.5 text-sm font-medium"
                  style={{ background: "#A8FF3E", color: "#0A0A0F", borderRadius: "18px 18px 4px 18px" }}
                >
                  {m.text}
                </div>
              )}
            </motion.div>
          ))}
        </AnimatePresence>

        {typing && <TypingBubble />}

        {chips.length > 0 && !typing && (
          <div className="flex flex-wrap gap-2 pl-8">
            {chips.map((c) => (
              <button
                key={c.value}
                onClick={() => handleAnswer(c.value)}
                className="tap rounded-full px-3 py-1.5 text-xs font-semibold text-primary"
                style={{ background: "rgba(168,255,62,0.1)", border: "1px solid rgba(168,255,62,0.3)" }}
              >
                {c.label}
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="fixed inset-x-0 bottom-0 z-40 mx-auto max-w-md px-4 pb-[104px] safe-bottom">
        <div
          className="flex items-center gap-2 rounded-full p-1.5"
          style={{ background: "#14141C", border: "1px solid rgba(255,255,255,0.08)" }}
        >
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") send(); }}
            placeholder={t("coach_input_ph")}
            className="min-w-0 flex-1 bg-transparent px-3 text-sm text-foreground outline-none placeholder:text-muted-foreground"
          />
          <button
            onClick={send}
            aria-label="Send"
            className="tap flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground"
          >
            <Send className="h-4 w-4" />
          </button>
        </div>
      </div>

      <BottomNav />
    </div>
  );
}
