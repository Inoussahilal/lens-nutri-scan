import { useEffect, useState, type ReactNode } from "react";
import { useRouterState } from "@tanstack/react-router";
import { useStore } from "@/lib/store";
import { useLanguage } from "@/lib/i18n";
import { Onboarding } from "./Onboarding";
import { Paywall } from "./Paywall";
import { getAdminSettings } from "@/utils/promoCodes";

export function AppGate({ children }: { children: ReactNode }) {
  const { hydrated, profile, isPaywalled, isAdmin } = useStore();
  const { t } = useLanguage();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const [maintenance, setMaintenance] = useState(false);

  useEffect(() => {
    const sync = () => setMaintenance(getAdminSettings().maintenance);
    sync();
    window.addEventListener("nutrilens-admin-change", sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener("nutrilens-admin-change", sync);
      window.removeEventListener("storage", sync);
    };
  }, []);

  // The admin page is never gated
  if (pathname.startsWith("/admin")) return <>{children}</>;

  if (!hydrated) {
    return (
      <div className="flex min-h-dvh items-center justify-center bg-background">
        <div className="text-4xl">🥗</div>
      </div>
    );
  }

  if (maintenance && !isAdmin) {
    return (
      <div className="flex min-h-dvh flex-col items-center justify-center gap-3 bg-background px-8 text-center">
        <div className="text-5xl">🛠️</div>
        <h1 className="font-display text-2xl font-bold">{t("maintenance_title")}</h1>
        <p className="text-sm text-muted-foreground">{t("maintenance_msg")}</p>
      </div>
    );
  }

  // Admins skip onboarding and paywall entirely — straight to the app
  if (isAdmin) return <>{children}</>;

  if (!profile.onboarded) return <Onboarding />;
  if (isPaywalled) return <Paywall />;
  return <>{children}</>;
}
