import type { ReactNode } from "react";
import { useStore } from "@/lib/store";
import { Onboarding } from "./Onboarding";
import { Paywall } from "./Paywall";

export function AppGate({ children }: { children: ReactNode }) {
  const { hydrated, profile, isPaywalled } = useStore();

  if (!hydrated) {
    return (
      <div className="flex min-h-dvh items-center justify-center bg-background">
        <div className="text-4xl">🥗</div>
      </div>
    );
  }
  if (!profile.onboarded) return <Onboarding />;
  if (isPaywalled) return <Paywall />;
  return <>{children}</>;
}
