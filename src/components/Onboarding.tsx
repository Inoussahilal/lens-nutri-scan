import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Camera, Sparkles, TrendingUp } from "lucide-react";
import { useStore, type ActivityLevel } from "@/lib/store";
import { useLanguage } from "@/lib/i18n";
import { LangToggle } from "./LangToggle";
import { validatePromoCode, saveAppliedPromo, type PromoCode } from "@/utils/promoCodes";

export function Onboarding() {
  const { t } = useLanguage();
  const { completeOnboarding } = useStore();
  const [step, setStep] = useState(0);

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [calorieGoal, setCalorieGoal] = useState("2000");
  const [activity, setActivity] = useState<ActivityLevel>("moderate");
  const [country, setCountry] = useState("");
  const [otherCountry, setOtherCountry] = useState("");
  const [showOther, setShowOther] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [promoInput, setPromoInput] = useState("");
  const [promoError, setPromoError] = useState(false);
  const [appliedPromo, setAppliedPromo] = useState<PromoCode | null>(null);

  function applyPromo() {
    const found = validatePromoCode(promoInput);
    if (found) {
      setAppliedPromo(found);
      setPromoError(false);
      saveAppliedPromo(found);
    } else {
      setAppliedPromo(null);
      setPromoError(true);
    }
  }

  const levels: { key: ActivityLevel; labelKey: "sedentary" | "moderate" | "active" | "very_active"; emoji: string }[] = [
    { key: "sedentary", labelKey: "sedentary", emoji: "🪑" },
    { key: "moderate", labelKey: "moderate", emoji: "🚶" },
    { key: "active", labelKey: "active", emoji: "🏃" },
    { key: "very_active", labelKey: "very_active", emoji: "🔥" },
  ];

  const countries = [
    { flag: "🇧🇯", name: "Bénin" },
    { flag: "🇸🇳", name: "Sénégal" },
    { flag: "🇨🇮", name: "Côte d'Ivoire" },
    { flag: "🇹🇬", name: "Togo" },
    { flag: "🇨🇲", name: "Cameroun" },
    { flag: "🇫🇷", name: "France" },
    { flag: "🇺🇸", name: "USA" },
  ];

  const resolvedCountry = showOther ? otherCountry.trim() : country;

  function next() {
    if (step === 2) {
      if (!resolvedCountry) {
        setError(t("country_required"));
        return;
      }
      setError(null);
    }
    if (step === 1) {
      if (!firstName.trim() || !lastName.trim() || !Number(calorieGoal)) {
        setError(t("required"));
        return;
      }
      setError(null);
    }
    setStep((s) => s + 1);
  }

  function finish() {
    completeOnboarding({
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      calorieGoal: Math.max(800, Math.min(8000, Number(calorieGoal) || 2000)),
      activityLevel: activity,
      country: resolvedCountry,
    });
  }

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-background">
      <div className="mx-auto flex min-h-dvh max-w-md flex-col px-6 pb-10 safe-top">
        <div className="flex items-center justify-between pt-2">
          <div className="flex gap-1.5">
            {[0, 1, 2, 3].map((i) => (
              <span
                key={i}
                className="h-1.5 rounded-full transition-all"
                style={{ width: i === step ? 24 : 8, background: i <= step ? "#A8FF3E" : "rgba(255,255,255,0.15)" }}
              />
            ))}
          </div>
          <LangToggle />
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            initial={{ opacity: 0, x: 24 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -24 }}
            transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
            className="flex flex-1 flex-col"
          >
            {step === 0 && (
              <div className="flex flex-1 flex-col items-center justify-center text-center">
                <div className="glow-lime flex h-24 w-24 items-center justify-center rounded-[28px] bg-primary text-5xl">
                  📷
                </div>
                <h1 className="mt-8 font-display text-3xl font-bold leading-tight">{t("ob_title")}</h1>
                <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{t("ob_sub")}</p>
                <div className="mt-8 flex w-full flex-col gap-3">
                  <Feature icon={<Camera className="h-4 w-4 text-primary" />} text={t("incl_scans")} />
                  <Feature icon={<Sparkles className="h-4 w-4 text-primary" />} text={t("incl_macros")} />
                  <Feature icon={<TrendingUp className="h-4 w-4 text-primary" />} text={t("incl_progress")} />
                </div>
              </div>
            )}

            {step === 1 && (
              <div className="flex flex-1 flex-col justify-center">
                <h1 className="font-display text-3xl font-bold">{t("tell_us")}</h1>
                <div className="mt-6 flex flex-col gap-3">
                  <Field value={firstName} onChange={setFirstName} placeholder={t("first_name")} />
                  <Field value={lastName} onChange={setLastName} placeholder={t("last_name")} />
                  <Field
                    value={calorieGoal}
                    onChange={(v) => setCalorieGoal(v.replace(/[^0-9]/g, ""))}
                    placeholder={t("calorie_goal_ph")}
                    numeric
                  />
                </div>
                <p className="mt-6 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  {t("activity_level")}
                </p>
                <div className="mt-3 grid grid-cols-2 gap-2">
                  {levels.map((l) => {
                    const active = activity === l.key;
                    return (
                      <button
                        key={l.key}
                        onClick={() => setActivity(l.key)}
                        className={`tap rounded-2xl border p-4 text-left text-sm font-semibold ${
                          active ? "border-primary bg-primary/10 text-primary" : "border-white/10 bg-white/[0.04]"
                        }`}
                      >
                        <span className="mr-1.5">{l.emoji}</span>
                        {t(l.labelKey)}
                      </button>
                    );
                  })}
                </div>
                {error && <p className="mt-4 text-xs font-medium text-destructive">{error}</p>}
              </div>
            )}

            {step === 2 && (
              <div className="flex flex-1 flex-col justify-center">
                <div className="text-5xl">🌍</div>
                <h1 className="mt-5 font-display text-2xl font-bold leading-snug">{t("country_q")}</h1>
                <div className="mt-6 flex flex-wrap gap-2">
                  {countries.map((c) => {
                    const active = !showOther && country === c.name;
                    return (
                      <button
                        key={c.name}
                        onClick={() => { setShowOther(false); setCountry(c.name); setError(null); }}
                        className={`tap rounded-full border px-4 py-2.5 text-sm font-semibold ${
                          active ? "border-primary bg-primary/10 text-primary" : "border-white/10 bg-white/[0.04]"
                        }`}
                      >
                        <span className="mr-1.5">{c.flag}</span>
                        {c.name}
                      </button>
                    );
                  })}
                  <button
                    onClick={() => { setShowOther(true); setCountry(""); setError(null); }}
                    className={`tap rounded-full border px-4 py-2.5 text-sm font-semibold ${
                      showOther ? "border-primary bg-primary/10 text-primary" : "border-white/10 bg-white/[0.04]"
                    }`}
                  >
                    {t("country_other")}
                  </button>
                </div>
                {showOther && (
                  <div className="mt-4">
                    <Field value={otherCountry} onChange={setOtherCountry} placeholder={t("country_other_ph")} />
                  </div>
                )}
                {error && <p className="mt-4 text-xs font-medium text-destructive">{error}</p>}
              </div>
            )}

            {step === 3 && (
              <div className="flex flex-1 flex-col items-center justify-center text-center">
                <div className="text-6xl">🎉</div>
                <h1 className="mt-6 font-display text-3xl font-bold leading-tight">{t("trial_starts")}</h1>
                <p className="mt-3 text-sm text-muted-foreground">{t("after_3_days")}</p>
                <div className="mt-8 w-full rounded-3xl border border-white/8 bg-white/[0.04] p-5 text-left">
                  <Feature icon={<Sparkles className="h-4 w-4 text-primary" />} text={t("incl_scans")} />
                  <div className="h-3" />
                  <Feature icon={<Camera className="h-4 w-4 text-primary" />} text={t("incl_diary")} />
                  <div className="h-3" />
                  <Feature icon={<TrendingUp className="h-4 w-4 text-primary" />} text={t("incl_progress")} />
                </div>
              </div>
            )}
          </motion.div>
        </AnimatePresence>

        <div className="mt-8">
          <button
            onClick={step === 3 ? finish : next}
            className="glow-lime tap h-[54px] w-full rounded-2xl bg-primary font-bold text-primary-foreground"
          >
            {step === 0 ? t("get_started") : step < 3 ? t("continue") : t("start_trial")}
          </button>
          {step === 1 && (
            <div className="mt-4">
              <p className="text-xs text-muted-foreground">{t("promo_hint")}</p>
              <div className="mt-2 flex gap-2">
                <input
                  value={promoInput}
                  onChange={(e) => { setPromoInput(e.target.value); setPromoError(false); }}
                  placeholder={t("promo_ph")}
                  maxLength={40}
                  className="h-10 min-w-0 flex-1 rounded-xl border border-white/10 bg-white/[0.04] px-3 text-sm uppercase outline-none placeholder:normal-case placeholder:text-muted-foreground focus:border-primary"
                />
                <button
                  onClick={applyPromo}
                  className="tap h-10 shrink-0 rounded-xl bg-primary px-4 text-xs font-bold text-primary-foreground"
                >
                  {t("promo_apply")}
                </button>
              </div>
              {appliedPromo && (
                <p className="mt-2 text-xs font-semibold text-primary">
                  {t("promo_applied_short", { code: appliedPromo.code })}
                </p>
              )}
              {promoError && (
                <p className="mt-2 text-xs font-semibold" style={{ color: "#FF6B6B" }}>
                  {t("promo_invalid_short")}
                </p>
              )}
            </div>
          )}
          {step === 3 && <p className="mt-3 text-center text-xs text-muted-foreground">{t("no_payment")}</p>}
        </div>
      </div>
    </div>
  );
}

function Feature({ icon, text }: { icon: React.ReactNode; text: string }) {
  return (
    <div className="flex items-center gap-3 rounded-2xl bg-white/[0.04] px-4 py-3 text-left">
      {icon}
      <span className="text-sm">{text}</span>
    </div>
  );
}

function Field({
  value, onChange, placeholder, numeric,
}: { value: string; onChange: (v: string) => void; placeholder: string; numeric?: boolean }) {
  return (
    <input
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      inputMode={numeric ? "numeric" : "text"}
      className="h-[52px] w-full rounded-2xl border border-white/10 bg-white/[0.04] px-4 text-base outline-none placeholder:text-muted-foreground focus:border-primary"
    />
  );
}
