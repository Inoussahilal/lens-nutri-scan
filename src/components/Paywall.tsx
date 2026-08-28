import { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Check, X } from "lucide-react";
import { useNavigate } from "@tanstack/react-router";
import { useStore } from "@/lib/store";
import { useLanguage } from "@/lib/i18n";
import { LangToggle } from "./LangToggle";
import { toast } from "sonner";
import { openKkiapayPayment, isBenin, type KkiapaySuccess } from "@/utils/payment";
import {
  PRICING,
  validatePromoCode,
  registerPromoUse,
  logSubscription,
  getAdminSettings,
  DEFAULT_WHATSAPP,
  getAppliedPromo,
  saveAppliedPromo,
  type PromoCode,
} from "@/utils/promoCodes";

export function Paywall() {
  const { t } = useLanguage();
  const { profile, setProfile } = useStore();
  const navigate = useNavigate();
  const [intlOpen, setIntlOpen] = useState(false);
  const [paying, setPaying] = useState(false);
  const [codeInput, setCodeInput] = useState("");
  const [promo, setPromo] = useState<PromoCode | null>(null);
  const [preApplied, setPreApplied] = useState(false);
  const [skipped, setSkipped] = useState(false);
  const [codeError, setCodeError] = useState(false);
  const [whatsapp, setWhatsapp] = useState(DEFAULT_WHATSAPP);

  useEffect(() => {
    setWhatsapp(getAdminSettings().whatsapp || DEFAULT_WHATSAPP);
    const saved = getAppliedPromo();
    if (saved) {
      setPromo(saved);
      setPreApplied(true);
    }
  }, []);

  const benin = useMemo(() => isBenin(profile.country), [profile.country]);

  const amountFcfa = promo ? PRICING.fcfa.regular : PRICING.fcfa.first;
  const amountUsd = promo ? PRICING.usd.regular : PRICING.usd.first;
  const priceLabel = benin ? `${amountFcfa.toLocaleString("fr-FR")} F` : `$${amountUsd.toFixed(2)}`;

  const whatsappDisplay = `+${whatsapp}`;

  function applyCode() {
    const found = validatePromoCode(codeInput);
    if (found) {
      setPromo(found);
      setCodeError(false);
      saveAppliedPromo(found);
    } else {
      setPromo(null);
      setCodeError(true);
    }
  }

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
        if (promo) registerPromoUse(promo);
        logSubscription({
          amount: amountFcfa,
          currency: "FCFA",
          promoCode: promo?.code ?? null,
          influencer: promo?.influencer ?? null,
          country: profile.country,
          firstName: profile.firstName,
        });
        setPaying(false);
        setProfile({ isSubscribed: true });
        toast.success(t("kkiapay_success"));
        navigate({ to: "/" });
      },
      () => {
        setPaying(false);
        toast.error(t("kkiapay_failed"));
      },
      amountFcfa,
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
              <span className="font-display text-5xl font-bold text-primary">{priceLabel}</span>
              <span className="text-sm text-muted-foreground">{t("per_month")}</span>
            </div>
            <p className="mt-1 text-[11px] text-muted-foreground">
              {promo ? t("promo_with") : t("promo_first_month")}
            </p>
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

          {/* Promo code */}
          <div className="mt-5 rounded-2xl border border-white/8 bg-white/[0.04] p-4 text-left">
            <p className="text-sm font-semibold">{t("promo_title")}</p>
            <div className="mt-2.5 flex gap-2">
              <input
                value={codeInput}
                onChange={(e) => {
                  setCodeInput(e.target.value);
                  setCodeError(false);
                }}
                placeholder={t("promo_ph")}
                className="h-11 min-w-0 flex-1 rounded-xl border border-white/10 bg-surface px-3 text-sm uppercase outline-none placeholder:normal-case placeholder:text-muted-foreground"
              />
              <button
                onClick={applyCode}
                className="tap h-11 shrink-0 rounded-xl bg-primary px-4 text-sm font-bold text-primary-foreground"
              >
                {t("promo_apply")}
              </button>
            </div>
            {promo && <p className="mt-2 text-xs font-semibold text-primary">{t("promo_success")}</p>}
            {codeError && (
              <p className="mt-2 text-xs font-semibold" style={{ color: "#FF6B6B" }}>
                {t("promo_invalid")}
              </p>
            )}
          </div>

          <div className="mt-5 flex flex-col gap-3">
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
                {paying
                  ? t("verifying")
                  : `📱 ${amountFcfa.toLocaleString("fr-FR")} FCFA — Mobile Money`}
              </button>
            ) : (
              <button
                onClick={() => setIntlOpen(true)}
                className="tap w-full rounded-2xl border border-primary/50 bg-card font-bold text-foreground"
                style={{ height: 56, borderRadius: 14 }}
              >
                💳 ${amountUsd.toFixed(2)} / {t("per_month")}
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
                {whatsappDisplay}
              </div>
              <a
                href={`https://wa.me/${whatsapp}`}
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
