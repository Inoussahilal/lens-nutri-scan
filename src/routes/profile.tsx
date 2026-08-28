import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";
import { LangToggle } from "@/components/LangToggle";
import { useStore } from "@/lib/store";
import { useLanguage } from "@/lib/i18n";
import { useEffect, useMemo, useState } from "react";
import { Minus, Plus } from "lucide-react";
import { toast } from "sonner";


export const Route = createFileRoute("/profile")({
  head: () => ({
    meta: [
      { title: "NutriLens — Profile" },
      { name: "description", content: "Manage your daily calorie goal and macro split." },
    ],
  }),
  component: ProfilePage,
});

function ProfilePage() {
  const { goals, setGoals, entries, bestStreak, startDate, profile, setProfile, isAdmin } = useStore();
  const { t, lang } = useLanguage();

  const [firstName, setFirstName] = useState(profile.firstName || goals.name);
  const [lastName, setLastName] = useState(profile.lastName);
  const [calories, setCalories] = useState(goals.calories);
  const [p, setP] = useState(goals.protein_pct);
  const [c, setC] = useState(goals.carbs_pct);
  const [f, setF] = useState(goals.fat_pct);
  const [resetOpen, setResetOpen] = useState(false);
  const navigate = useNavigate();
  const [taps, setTaps] = useState<number[]>([]);

  // Easter egg: 5 rapid taps on the avatar opens the admin page
  function handleAvatarTap() {
    const now = Date.now();
    const next = [...taps, now].filter((t0) => now - t0 < 2000);
    setTaps(next);
    if (next.length >= 5) {
      setTaps([]);
      navigate({ to: "/admin" });
    }
  }


  // Sync local state when the store hydrates / changes elsewhere
  useEffect(() => {
    setFirstName(profile.firstName || goals.name);
    setLastName(profile.lastName);
  }, [profile.firstName, profile.lastName, goals.name]);

  useEffect(() => {
    setCalories(goals.calories);
    setP(goals.protein_pct); setC(goals.carbs_pct); setF(goals.fat_pct);
  }, [goals.calories, goals.protein_pct, goals.carbs_pct, goals.fat_pct]);

  // Distribute remainder when one slider changes, keeping sum = 100
  function changeP(v: number) {
    const nv = Math.max(0, Math.min(80, v));
    const rest = 100 - nv;
    const ratio = c + f > 0 ? c / (c + f) : 0.5;
    const nc = Math.round(rest * ratio);
    const nf = rest - nc;
    setP(nv); setC(nc); setF(nf);
  }
  function changeC(v: number) {
    const nv = Math.max(0, Math.min(80, v));
    const rest = 100 - nv;
    const ratio = p + f > 0 ? p / (p + f) : 0.5;
    const np = Math.round(rest * ratio);
    const nf = rest - np;
    setP(np); setC(nv); setF(nf);
  }
  function changeF(v: number) {
    const nv = Math.max(0, Math.min(80, v));
    const rest = 100 - nv;
    const ratio = p + c > 0 ? p / (p + c) : 0.5;
    const np = Math.round(rest * ratio);
    const nc = rest - np;
    setP(np); setC(nc); setF(nv);
  }

  function save() {
    const fn = firstName.trim() || "You";
    setProfile({ firstName: fn, lastName: lastName.trim(), calorieGoal: calories });
    setGoals({ name: fn, calories, protein_pct: p, carbs_pct: c, fat_pct: f });
    toast.success(t("profile_saved"));
  }

  const stats = useMemo(() => {
    return { total: entries.length };
  }, [entries]);

  const startStr = startDate
    ? new Date(startDate).toLocaleDateString(lang === "fr" ? "fr-FR" : "en-US", { month: "short", day: "numeric" })
    : "—";

  const initials = `${firstName[0] ?? "A"}${lastName[0] ?? ""}`.toUpperCase();

  // grams from %
  const pG = Math.round((calories * (p / 100)) / 4);
  const cG = Math.round((calories * (c / 100)) / 4);
  const fG = Math.round((calories * (f / 100)) / 9);

  return (
    <AppShell>
      <header className="flex items-center gap-4 pt-2">
        <div
          onClick={handleAvatarTap}
          className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full text-xl font-bold text-foreground"
          style={{ border: "2px solid #A8FF3E", background: "var(--color-card)" }}
        >
          {initials}
        </div>
        <div className="min-w-0 flex-1">
          <input
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
            placeholder={t("first_name")}
            className="w-full bg-transparent font-display text-2xl font-bold outline-none"
          />
          <input
            value={lastName}
            onChange={(e) => setLastName(e.target.value)}
            placeholder={t("last_name")}
            className="w-full bg-transparent text-sm text-muted-foreground outline-none"
          />
          <p className="text-[10px] text-muted-foreground">{t("tap_to_edit")}</p>
        </div>
        <LangToggle />
      </header>

      {/* Stats row */}
      <section className="mt-5 grid grid-cols-3 gap-2 text-center">
        <Stat label={t("start")} value={startStr} />
        <Stat label={t("meals")} value={`${stats.total}`} />
        <Stat label={`${t("best")} 🔥`} value={`${bestStreak}d`} />
      </section>

      {/* Calorie goal */}
      <section className="mt-5 rounded-2xl border border-white/7 bg-white/[0.04] p-5 backdrop-blur">
        <h2 className="font-display text-base font-semibold">{t("daily_calorie_goal")}</h2>
        <div className="mt-3 flex items-center gap-3">
          <button onClick={() => setCalories((v) => Math.max(500, v - 50))} className="tap flex h-11 w-11 items-center justify-center rounded-xl bg-surface">
            <Minus className="h-4 w-4" />
          </button>
          <div className="flex-1 text-center">
            <input
              type="number"
              inputMode="numeric"
              value={calories}
              onChange={(e) => setCalories(Math.max(500, Math.min(8000, Number(e.target.value) || 0)))}
              className="w-full bg-transparent text-center font-display text-3xl font-bold tabular-nums outline-none"
            />
            <div className="text-[10px] uppercase tracking-wider text-muted-foreground">{t("per_day")}</div>
          </div>
          <button onClick={() => setCalories((v) => Math.min(8000, v + 50))} className="tap flex h-11 w-11 items-center justify-center rounded-xl bg-primary text-primary-foreground">
            <Plus className="h-4 w-4" strokeWidth={2.5} />
          </button>
        </div>
      </section>

      {/* Macro split */}
      <section className="mt-4 rounded-2xl border border-white/7 bg-white/[0.04] p-5 backdrop-blur">
        <div className="flex items-center justify-between">
          <h2 className="font-display text-base font-semibold">{t("macro_split")}</h2>
          <span className="text-xs font-semibold text-primary tabular-nums">{p + c + f}%</span>
        </div>
        <div className="mt-4 flex flex-col gap-5">
          <MacroSlider label={t("protein")} color="#3E9BFF" value={p} grams={pG} onChange={changeP} />
          <MacroSlider label={t("carbs")} color="#FFD93D" value={c} grams={cG} onChange={changeC} />
          <MacroSlider label={t("fat")} color="#FF6B6B" value={f} grams={fG} onChange={changeF} />
        </div>
      </section>

      <button onClick={save} className="glow-lime tap mt-5 h-[52px] w-full rounded-2xl bg-primary font-bold text-primary-foreground">
        {t("save_changes")}
      </button>

      {isAdmin && (
        <button
          onClick={() => navigate({ to: "/admin" })}
          className="tap mt-3 flex h-[52px] w-full items-center justify-center rounded-2xl bg-card text-sm font-bold text-primary"
          style={{ border: "1.5px solid #A8FF3E" }}
        >
          {t("admin_dashboard_btn")}
        </button>
      )}


      <button
        onClick={() => setResetOpen(true)}
        className="tap mt-4 w-full text-center text-xs font-semibold"
        style={{ color: "#FF6B6B" }}
      >
        {t("reset_app_data")}
      </button>

      {resetOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-6" onClick={() => setResetOpen(false)}>
          <div
            className="w-full max-w-xs rounded-2xl border border-white/10 bg-card p-5 text-center"
            onClick={(e) => e.stopPropagation()}
          >
            <p className="text-sm text-foreground">{t("reset_confirm_msg")}</p>
            <div className="mt-5 flex gap-2">
              <button
                onClick={() => setResetOpen(false)}
                className="tap h-11 flex-1 rounded-xl bg-surface text-sm font-semibold"
              >
                {t("cancel")}
              </button>
              <button
                onClick={() => {
                  const handleReset = () => {
                    // Save subscription data before clearing
                    const isSubscribed = localStorage.getItem("nutrilens_is_subscribed");
                    const subscriptionDate = localStorage.getItem("nutrilens_subscription_date");
                    const userPhone = localStorage.getItem("nutrilens_user_phone");

                    localStorage.clear();
                    sessionStorage.clear();

                    if (isSubscribed) localStorage.setItem("nutrilens_is_subscribed", isSubscribed);
                    if (subscriptionDate) localStorage.setItem("nutrilens_subscription_date", subscriptionDate);
                    if (userPhone) localStorage.setItem("nutrilens_user_phone", userPhone);

                    // Force complete page reload to reset ALL React state
                    window.location.replace(window.location.origin);
                  };
                  handleReset();
                }}

                className="tap h-11 flex-1 rounded-xl text-sm font-bold text-white"
                style={{ background: "#FF6B6B" }}
              >
                {t("confirm")}
              </button>
            </div>
          </div>
        </div>
      )}

      <p className="mt-6 text-center text-xs text-muted-foreground">NutriLens · Built with care</p>

    </AppShell>
  );
}


function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-white/7 bg-white/[0.04] p-3 backdrop-blur">
      <div className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</div>
      <div className="mt-1 font-display text-base font-bold tabular-nums">{value}</div>
    </div>
  );
}

function MacroSlider({ label, color, value, grams, onChange }: { label: string; color: string; value: number; grams: number; onChange: (v: number) => void }) {
  return (
    <div>
      <div className="flex items-baseline justify-between">
        <span className="text-xs font-semibold uppercase tracking-wider" style={{ color }}>{label}</span>
        <span className="text-sm font-semibold tabular-nums">{value}%</span>
      </div>
      <input
        type="range"
        min={0}
        max={80}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="mt-2 h-2 w-full appearance-none rounded-full outline-none"
        style={{
          background: `linear-gradient(to right, ${color} 0%, ${color} ${(value / 80) * 100}%, var(--color-surface) ${(value / 80) * 100}%)`,
        }}
      />
      <p className="mt-1 text-[11px] text-muted-foreground">{label} {value}% = <span className="tabular-nums text-foreground">{grams}g</span> / day</p>
    </div>
  );
}
