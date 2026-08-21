import { useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Check, X } from "lucide-react";
import { useNavigate } from "@tanstack/react-router";
import { useStore } from "@/lib/store";
import { useLanguage } from "@/lib/i18n";
import { LangToggle } from "./LangToggle";
import { toast } from "sonner";
import { openKkiapayPayment, isBenin, type KkiapaySuccess } from "@/utils/payment";

const WHATSAPP_NUMBER = "22900000000"; // replace with the real support number
const WHATSAPP_DISPLAY = "+229 XX XX XX XX";

export function Paywall() {
  const { t } = useLanguage();
  const { profile, setProfile } = useStore();
  const navigate = useNavigate();
  const [intlOpen, setIntlOpen] = useState(false);
  const [paying, setPaying] = useState(false);

  const benin = useMemo(() => isBenin(profile.country), [profile.country]);

  function handleKkiapay() {
    const phone = (typeof window !== "undefined" && localStorage.getItem("nutrilens_user_phone")) || "";
    setPaying(true);
    openKkiapayPayment(
      profile.firstName,
      phone,
      (response: KkiapaySuccess) => {
        try {
          localStorage.setItem("nutrilens_is_subscribed", "true");
          localStorage.setItem("nutrilens_subscription_date", new Date().toISOString());
          if (response?.transactionId) {
            localStorage.setItem("nutrilens_transaction_id", String(response.transactionId));
          }
        } catch {}
        setPaying(false);
        setProfile({ isSubscribed: true });
        toast.success(t("kkiapay_success"));
        navigate({ to: "/" });
      },
      () => {
        setPaying(false);
        toast.error(t("kkiapay_failed"));
      },
    );
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
              <span className="font-display text-5xl font-bold text-primary">
                {benin ? "6 000 F" : "$9.99"}
              </span>
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
            {benin ? (
              <button
                onClick={handleKkiapay}
                disabled={paying}
                className="glow-lime tap w-full font-bold disabled:opacity-60"
                style={{
                  height: 56,
                  borderRadius: 14,
                  background: "#A8FF3E",
                  color: "#0A0A0F",
                }}
              >
                {paying ? t("verifying") : t("pay_kkiapay")}
              </button>
            ) : (
              <button
                onClick={() => setIntlOpen(true)}
                className="tap w-full rounded-2xl border border-primary/50 bg-card font-bold text-foreground"
                style={{ height: 56, borderRadius: 14 }}
              >
                {t("pay_intl")}
              </button>
            )}
          </div>

          <div id="kkiapay-container" className="hidden" />

          <p className="mt-4 text-xs text-muted-foreground">{t("activation_note")}</p>
        </div>
      </div>

      <AnimatePresence>
        {intlOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm"
              onClick={() => setIntlOpen(false)}
            />
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 26, stiffness: 260 }}
              className="fixed inset-x-0 bottom-0 z-50 mx-auto max-w-md rounded-t-3xl border-t border-white/10 bg-card p-6 safe-bottom"
            >
              <div className="flex items-start justify-between">
                <h2 className="font-display text-xl font-bold">{t("intl_modal_title")}</h2>
                <button onClick={() => setIntlOpen(false)} aria-label="Close" className="tap rounded-full bg-white/8 p-2">
                  <X className="h-4 w-4" />
                </button>
              </div>
              <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
                {t("intl_modal_msg")}
              </p>
              <div className="mt-3 text-center font-display text-lg font-bold tracking-wide text-primary">
                {WHATSAPP_DISPLAY}
              </div>
              <a
                href={`https://wa.me/${WHATSAPP_NUMBER}`}
                target="_blank"
                rel="noopener noreferrer"
                className="glow-lime tap mt-5 flex h-[54px] w-full items-center justify-center rounded-2xl bg-primary font-bold text-primary-foreground"
              >
                {t("whatsapp_btn")}
              </a>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
