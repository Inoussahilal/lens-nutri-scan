import { useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Check, X } from "lucide-react";
import { useStore } from "@/lib/store";
import { useLanguage } from "@/lib/i18n";
import { LangToggle } from "./LangToggle";
import { toast } from "sonner";

type Method = { id: string; labelKey: "pay_mtn" | "pay_moov" | "pay_celtiis"; emoji: string };

const METHODS: Method[] = [
  { id: "mtn", labelKey: "pay_mtn", emoji: "🟡" },
  { id: "moov", labelKey: "pay_moov", emoji: "🔵" },
  { id: "celtiis", labelKey: "pay_celtiis", emoji: "🟢" },
];

export function Paywall() {
  const { t } = useLanguage();
  const { profile, setProfile } = useStore();
  const [method, setMethod] = useState<Method | null>(null);
  const [verifying, setVerifying] = useState(false);

  const reference = useMemo(
    () => `NL-${(profile.firstName || "USER").slice(0, 4).toUpperCase()}-${String(Date.now()).slice(-5)}`,
    [profile.firstName],
  );

  function confirmPaid() {
    setVerifying(true);
    toast.success(t("payment_received"));
    setTimeout(() => {
      setProfile({ isSubscribed: true });
      setVerifying(false);
      setMethod(null);
      toast.success(t("sub_activated"));
    }, 2500);
  }

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-background">
      <div className="mx-auto flex min-h-dvh max-w-md flex-col px-6 pb-10 safe-top">
        <div className="flex justify-end pt-2">
          <LangToggle />
        </div>

        <div className="flex flex-1 flex-col justify-center py-6 text-center">
          <div className="text-6xl">🔒</div>
          <h1 className="mt-5 font-display text-3xl font-bold leading-tight">{t("trial_ended")}</h1>
          <p className="mt-2 text-sm text-muted-foreground">{t("subscribe_sub")}</p>

          <div className="mt-7 rounded-3xl border border-primary/40 bg-primary/[0.07] p-6">
            <div className="flex items-baseline justify-center gap-1">
              <span className="font-display text-5xl font-bold text-primary">$10</span>
              <span className="text-sm text-muted-foreground">{t("per_month")}</span>
            </div>
            <ul className="mt-5 flex flex-col gap-3 text-left">
              {(["incl_scans", "incl_diary", "incl_macros", "incl_progress"] as const).map((k) => (
                <li key={k} className="flex items-center gap-2.5 text-sm">
                  <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary/20">
                    <Check className="h-3 w-3 text-primary" strokeWidth={3} />
                  </span>
                  {t(k)}
                </li>
              ))}
            </ul>
          </div>

          <div className="mt-6 flex flex-col gap-3">
            {METHODS.map((m) => (
              <button
                key={m.id}
                onClick={() => setMethod(m)}
                className="tap flex h-[54px] items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/[0.05] font-semibold"
              >
                <span>{m.emoji}</span> {t(m.labelKey)}
              </button>
            ))}
          </div>

          <p className="mt-4 text-xs text-muted-foreground">{t("activation_note")}</p>
        </div>
      </div>

      <AnimatePresence>
        {method && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm"
              onClick={() => !verifying && setMethod(null)}
            />
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 26, stiffness: 260 }}
              className="fixed inset-x-0 bottom-0 z-50 mx-auto max-w-md rounded-t-3xl border-t border-white/10 bg-card p-6 safe-bottom"
            >
              <div className="flex items-start justify-between">
                <h2 className="font-display text-xl font-bold">
                  {method.emoji} {t(method.labelKey)}
                </h2>
                <button onClick={() => !verifying && setMethod(null)} aria-label="Close" className="tap rounded-full bg-white/8 p-2">
                  <X className="h-4 w-4" />
                </button>
              </div>
              <p className="mt-4 whitespace-pre-line text-sm leading-relaxed text-muted-foreground">
                {t("pay_instructions", { ref: reference })}
              </p>
              <div className="mt-4 rounded-2xl bg-white/[0.05] p-4 text-center">
                <div className="text-[10px] uppercase tracking-wider text-muted-foreground">REF</div>
                <div className="mt-1 font-display text-lg font-bold tracking-wide text-primary">{reference}</div>
              </div>
              <button
                onClick={confirmPaid}
                disabled={verifying}
                className="glow-lime tap mt-5 h-[54px] w-full rounded-2xl bg-primary font-bold text-primary-foreground disabled:opacity-60"
              >
                {verifying ? t("verifying") : t("i_have_paid")}
              </button>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
