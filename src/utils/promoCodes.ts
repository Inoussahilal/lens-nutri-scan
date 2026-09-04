// Promo codes, subscription log and admin settings — localStorage MVP.
// Not synced across devices; Supabase can replace this later.

export interface PromoCode {
  code: string;
  influencer: string;
  uses: number;
  lastUsed?: string | null;
  active?: boolean;
}

export const PROMO_CODES: PromoCode[] = [
  { code: "INFLUENCEUR1", influencer: "Influenceur 1", uses: 0 },
  { code: "INFLUENCEUR2", influencer: "Influenceur 2", uses: 0 },
  { code: "INFLUENCEUR3", influencer: "Influenceur 3", uses: 0 },
  { code: "NUTRI2024", influencer: "General", uses: 0 },
];

export const PRICING = {
  usd: { first: 10.99, regular: 9.99 },
  fcfa: { first: 6600, regular: 6000 },
};

const CODES_KEY = "nutrilens_admin_promo_codes";
const STATS_KEY = "nutrilens_promo_stats";
const LOG_KEY = "nutrilens_subscriptions_log";
const SETTINGS_KEY = "nutrilens_admin_settings";

export const ADMIN_LOGGED_KEY = "nutrilens_admin_logged";
export const ADMIN_SESSION_KEY = "nutrilens_admin_session";
export const ADMIN_SESSION_MAX_AGE = 24 * 60 * 60 * 1000;
export const ADMIN_PASSWORD = "NutriSnapAdmin2004#";
export const DEFAULT_WHATSAPP = "22967354848";

function read<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function write(key: string, value: unknown) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {}
}

/** All codes: defaults merged with admin-created ones + stats. */
export function getPromoCodes(): PromoCode[] {
  const custom = read<PromoCode[]>(CODES_KEY, []);
  const stats = read<PromoCode[]>(STATS_KEY, []);
  const byCode = new Map<string, PromoCode>();
  for (const c of [...PROMO_CODES, ...custom]) {
    const key = c.code.toUpperCase();
    const prev = byCode.get(key);
    byCode.set(key, { ...(prev ?? {}), ...c });
  }
  return [...byCode.values()].map((c) => {
    const s = stats.find((x) => x.code.toUpperCase() === c.code.toUpperCase());
    return {
      ...c,
      uses: s?.uses ?? 0,
      lastUsed: s?.lastUsed ?? null,
      active: c.active !== false,
    };
  });
}

export function savePromoCodes(codes: PromoCode[]) {
  const defaults = new Set(PROMO_CODES.map((c) => c.code.toUpperCase()));
  // Persist custom codes plus any activation overrides on defaults.
  const custom = codes.filter((c) => !defaults.has(c.code.toUpperCase()));
  const overrides = codes
    .filter((c) => defaults.has(c.code.toUpperCase()) && c.active === false)
    .map((c) => ({ ...c, active: false }));
  write(CODES_KEY, [...custom, ...overrides.filter((o) => !custom.some((c) => c.code === o.code))]);
}

export function setCodeActive(code: string, active: boolean) {
  const all = getPromoCodes().map((c) =>
    c.code.toUpperCase() === code.toUpperCase() ? { ...c, active } : c,
  );
  write(
    CODES_KEY,
    all.map((c) => ({
      code: c.code,
      influencer: c.influencer,
      uses: 0,
      active: c.active !== false,
    })),
  );
  if (typeof window !== "undefined") window.dispatchEvent(new Event("nutrilens-admin-change"));
}

export function createPromoCode(code: string, influencer: string): boolean {
  const clean = code.trim().toUpperCase();
  if (!clean) return false;
  if (getPromoCodes().some((c) => c.code.toUpperCase() === clean)) return false;
  const custom = read<PromoCode[]>(CODES_KEY, []);
  write(CODES_KEY, [...custom, { code: clean, influencer: influencer.trim() || "—", uses: 0, active: true }]);
  return true;
}

export type PromoCheck =
  | { status: "valid"; promo: PromoCode }
  | { status: "inactive" }
  | { status: "invalid" };

/** Distinguishes unknown codes from deactivated ones. */
export function checkPromoCode(input: string): PromoCheck {
  const clean = input.trim().toUpperCase();
  if (!clean) return { status: "invalid" };
  const found = getPromoCodes().find((c) => c.code.toUpperCase() === clean);
  if (!found) return { status: "invalid" };
  if (found.active === false) return { status: "inactive" };
  return { status: "valid", promo: found };
}

export function validatePromoCode(input: string): PromoCode | null {
  const res = checkPromoCode(input);
  return res.status === "valid" ? res.promo : null;
}


export function registerPromoUse(promo: PromoCode) {
  const now = new Date().toISOString();
  const stats = read<PromoCode[]>(STATS_KEY, []);
  const idx = stats.findIndex((s) => s.code.toUpperCase() === promo.code.toUpperCase());
  if (idx >= 0) {
    stats[idx] = { ...stats[idx], uses: (stats[idx].uses || 0) + 1, lastUsed: now };
  } else {
    stats.push({ code: promo.code, influencer: promo.influencer, uses: 1, lastUsed: now });
  }
  write(STATS_KEY, stats);
  try {
    localStorage.setItem("nutrilens_promo_used", "true");
    localStorage.setItem("nutrilens_promo_code", promo.code);
    localStorage.setItem("nutrilens_promo_influencer", promo.influencer);
    localStorage.setItem("nutrilens_promo_date", now);
  } catch {}
}

export interface SubscriptionLogEntry {
  id: string;
  date: string;
  amount: number;
  currency: "FCFA" | "USD";
  promoCode: string | null;
  influencer: string | null;
  country: string;
  firstName: string;
  /** Stable per-device/user key, used to detect renewals. */
  userKey?: string;
  /** True only for a user's very first paid month with that promo code. */
  isFirstPayment?: boolean;
}

export function getSubscriptionsLog(): SubscriptionLogEntry[] {
  return read<SubscriptionLogEntry[]>(LOG_KEY, []);
}

function currentUserKey(fallback: string): string {
  if (typeof window === "undefined") return fallback;
  try {
    let k = localStorage.getItem("nutrilens_user_key");
    if (!k) {
      k =
        (typeof crypto !== "undefined" && crypto.randomUUID ? crypto.randomUUID() : String(Date.now())) +
        "-" +
        fallback;
      localStorage.setItem("nutrilens_user_key", k);
    }
    return k;
  } catch {
    return fallback;
  }
}

export function logSubscription(entry: Omit<SubscriptionLogEntry, "id" | "date">) {
  const log = getSubscriptionsLog();
  const userKey = entry.userKey || currentUserKey(entry.firstName || "user");
  const code = entry.promoCode?.toUpperCase() ?? null;
  const alreadyPaidWithCode =
    !!code &&
    log.some((s) => s.userKey === userKey && (s.promoCode?.toUpperCase() ?? null) === code);
  const next: SubscriptionLogEntry[] = [
    {
      ...entry,
      userKey,
      isFirstPayment: !alreadyPaidWithCode,
      id: typeof crypto !== "undefined" && crypto.randomUUID ? crypto.randomUUID() : String(Date.now()),
      date: new Date().toISOString(),
    },
    ...log,
  ].slice(0, 500);
  write(LOG_KEY, next);
}


export interface AdminSettings {
  maintenance: boolean;
  whatsapp: string;
}

export function getAdminSettings(): AdminSettings {
  return read<AdminSettings>(SETTINGS_KEY, { maintenance: false, whatsapp: DEFAULT_WHATSAPP });
}

export function saveAdminSettings(s: AdminSettings) {
  write(SETTINGS_KEY, s);
  if (typeof window !== "undefined") window.dispatchEvent(new Event("nutrilens-admin-change"));
}

/** Admin sessions expire automatically after 24 hours. */
export function isAdminLogged(): boolean {
  if (typeof window === "undefined") return false;
  try {
    if (localStorage.getItem(ADMIN_LOGGED_KEY) !== "true") return false;
    const started = Number(localStorage.getItem(ADMIN_SESSION_KEY) || 0);
    if (!started || Date.now() - started > ADMIN_SESSION_MAX_AGE) {
      localStorage.removeItem(ADMIN_LOGGED_KEY);
      localStorage.removeItem(ADMIN_SESSION_KEY);
      return false;
    }
    return true;
  } catch {
    return false;
  }
}

export function setAdminLogged(v: boolean) {
  try {
    if (v) {
      localStorage.setItem(ADMIN_LOGGED_KEY, "true");
      localStorage.setItem(ADMIN_SESSION_KEY, String(Date.now()));
    } else {
      localStorage.removeItem(ADMIN_LOGGED_KEY);
      localStorage.removeItem(ADMIN_SESSION_KEY);
    }
  } catch {}
  if (typeof window !== "undefined") window.dispatchEvent(new Event("nutrilens-admin-change"));
}

export function scansToday(entries: { loggedAt: number }[]): number {
  const d = new Date();
  const key = `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
  return entries.filter((e) => {
    const x = new Date(e.loggedAt);
    return `${x.getFullYear()}-${x.getMonth()}-${x.getDate()}` === key;
  }).length;
}

/* ---------- Promo saved at onboarding ---------- */

export const APPLIED_CODE_KEY = "nutrilens_promo_code";
export const APPLIED_INFLUENCER_KEY = "nutrilens_promo_influencer";
export const APPLIED_FLAG_KEY = "nutrilens_promo_applied";

export function saveAppliedPromo(promo: PromoCode) {
  try {
    localStorage.setItem(APPLIED_CODE_KEY, promo.code);
    localStorage.setItem(APPLIED_INFLUENCER_KEY, promo.influencer);
    localStorage.setItem(APPLIED_FLAG_KEY, "true");
  } catch {}
  if (typeof window !== "undefined") window.dispatchEvent(new Event("nutrilens-admin-change"));
}

/** Returns the promo saved at onboarding if it is still valid & active. */
export function getAppliedPromo(): PromoCode | null {
  if (typeof window === "undefined") return null;
  try {
    if (localStorage.getItem(APPLIED_FLAG_KEY) !== "true") return null;
    const code = localStorage.getItem(APPLIED_CODE_KEY);
    if (!code) return null;
    return validatePromoCode(code);
  } catch {
    return null;
  }
}

export function clearAppliedPromo() {
  try {
    localStorage.removeItem(APPLIED_CODE_KEY);
    localStorage.removeItem(APPLIED_INFLUENCER_KEY);
    localStorage.removeItem(APPLIED_FLAG_KEY);
  } catch {}
}

/* ---------- Users counter & monthly recap ---------- */

const USERS_KEY = "nutrilens_total_users";

export function registerUserSignup() {
  const n = Number(read<number>(USERS_KEY, 0)) || 0;
  write(USERS_KEY, n + 1);
}

export function getTotalUsers(): number {
  const stored = Number(read<number>(USERS_KEY, 0)) || 0;
  return Math.max(stored, getSubscriptionsLog().length);
}

export function monthKey(d: Date | string): string {
  const x = typeof d === "string" ? new Date(d) : d;
  return `${x.getFullYear()}-${String(x.getMonth() + 1).padStart(2, "0")}`;
}

export interface RecapRow {
  influencer: string;
  code: string;
  subscribers: number;
  revenue: number;
  commission: number;
}

export interface MonthlyRecap {
  month: string;
  subscribers: number;
  revenueFcfa: number;
  revenueUsd: number;
  promoUses: number;
  totalUsers: number;
  conversion: number;
  rows: RecapRow[];
  totals: { subscribers: number; revenue: number; commission: number };
}

/** Months present in the log, newest first, always including the current month. */
export function availableMonths(): string[] {
  const set = new Set<string>([monthKey(new Date())]);
  for (const s of getSubscriptionsLog()) set.add(monthKey(s.date));
  return [...set].sort().reverse();
}

export function buildMonthlyRecap(month: string): MonthlyRecap {
  const log = getSubscriptionsLog().filter((s) => monthKey(s.date) === month);
  const totalUsers = getTotalUsers();
  const byCode = new Map<string, RecapRow>();

  for (const s of log) {
    if (!s.promoCode) continue;
    const key = s.promoCode.toUpperCase();
    const row = byCode.get(key) ?? {
      influencer: s.influencer || "—",
      code: s.promoCode,
      subscribers: 0,
      revenue: 0,
      commission: 0,
    };
    row.subscribers += 1;
    row.revenue = row.subscribers * PRICING.usd.regular;
    row.commission = row.revenue * 0.1;
    byCode.set(key, row);
  }

  const rows = [...byCode.values()].sort((a, b) => b.subscribers - a.subscribers);

  return {
    month,
    subscribers: log.length,
    revenueFcfa: log.filter((s) => s.currency === "FCFA").reduce((a, s) => a + s.amount, 0),
    revenueUsd: log.filter((s) => s.currency === "USD").reduce((a, s) => a + s.amount, 0),
    promoUses: log.filter((s) => !!s.promoCode).length,
    totalUsers,
    conversion: totalUsers ? (log.length / totalUsers) * 100 : 0,
    rows,
    totals: {
      subscribers: rows.reduce((a, r) => a + r.subscribers, 0),
      revenue: rows.reduce((a, r) => a + r.revenue, 0),
      commission: rows.reduce((a, r) => a + r.commission, 0),
    },
  };
}

export function recapToText(r: MonthlyRecap): string {
  const lines = [
    "NutriSnap — Récapitulatif mensuel",
    `Mois : ${r.month}`,
    "",
    "STATISTIQUES GLOBALES",
    `Nouveaux abonnés : ${r.subscribers}`,
    `Revenus : ${r.revenueFcfa.toLocaleString("fr-FR")} FCFA + $${r.revenueUsd.toFixed(2)}`,
    `Codes promo utilisés : ${r.promoUses}`,
    `Taux de conversion : ${r.conversion.toFixed(1)}% (${r.subscribers}/${r.totalUsers})`,
    "",
    "PAR INFLUENCEUR",
    "Influenceur | Code | Nouveaux abonnés | Revenus générés | Commission (10%)",
  ];
  for (const row of r.rows) {
    lines.push(
      `${row.influencer} | ${row.code} | ${row.subscribers} | $${row.revenue.toFixed(2)} | $${row.commission.toFixed(2)}`,
    );
  }
  lines.push(
    `TOTAL | — | ${r.totals.subscribers} | $${r.totals.revenue.toFixed(2)} | $${r.totals.commission.toFixed(2)}`,
  );
  return lines.join("\n");
}
