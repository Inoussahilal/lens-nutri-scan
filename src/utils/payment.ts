// KkiaPay (Benin mobile money) — PUBLIC key only. Never put a private/secret key here.
// sandbox: true = TEST mode. Switch to false + live public key for real payments.

export const KKIAPAY_PUBLIC_KEY = "307d54dc77962eaede90b3ecd8adf86be3d00aef";
export const KKIAPAY_AMOUNT_FCFA = 6000;
export const KKIAPAY_SANDBOX = true;

export interface KkiapaySuccess {
  transactionId?: string;
  [key: string]: unknown;
}

declare global {
  interface Window {
    openKkiapay?: (options: Record<string, unknown>) => void;
  }
}

export function isKkiapayReady(): boolean {
  return typeof window !== "undefined" && typeof window.openKkiapay === "function";
}

export const openKkiapayPayment = (
  userFirstName?: string,
  userPhone?: string,
  onSuccess?: (response: KkiapaySuccess) => void,
  onFailed?: (error: unknown) => void,
  amount: number = KKIAPAY_AMOUNT_FCFA,
) => {
  if (!isKkiapayReady()) {
    onFailed?.(new Error("KkiaPay SDK not loaded"));
    return;
  }

  window.openKkiapay!({
    amount,
    apikey: KKIAPAY_PUBLIC_KEY,
    sandbox: KKIAPAY_SANDBOX,
    phone: userPhone || "",
    name: userFirstName || "NutriSnap User",
    data: `NUTRISNAP-${userFirstName || "USER"}`,
    callback: typeof window !== "undefined" ? window.location.href : "",
    containerId: "kkiapay-container",
    theme: "#A8FF3E",
    onSuccess,
    onFailed,
  });
};

export function isBenin(country?: string): boolean {
  if (!country) return false;
  const c = country.trim().toLowerCase();
  return c === "bénin" || c === "benin";
}
