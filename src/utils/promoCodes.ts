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
  lastUsed: string | null;
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
  entries: SubscriptionLogEntry[];
}

export const COMMISSION_RATE = 0.1;
/** 10% of $9.99, rounded down to the cent. */
export const COMMISSION_PER_SUB = 0.99;
const ARCHIVE_PREFIX = "nutrilens_monthly_archive_";
const LAST_MONTH_KEY = "nutrilens_last_recap_month";
const RECAP_DISMISS_KEY = "nutrilens_recap_banner_dismissed";

export function monthLabel(m: string, locale = "fr-FR"): string {
  const [y, mm] = m.split("-");
  return new Date(Number(y), Number(mm) - 1, 1).toLocaleDateString(locale, {
    month: "long",
    year: "numeric",
  });
}

/** Months present in the log or archives, newest first, always including the current month. */
export function availableMonths(): string[] {
  const set = new Set<string>([monthKey(new Date())]);
  for (const s of getSubscriptionsLog()) set.add(monthKey(s.date));
  if (typeof window !== "undefined") {
    try {
      for (let i = 0; i < localStorage.length; i++) {
        const k = localStorage.key(i);
        if (k?.startsWith(ARCHIVE_PREFIX)) set.add(k.slice(ARCHIVE_PREFIX.length));
      }
    } catch {}
  }
  return [...set].sort().reverse();
}

export function buildMonthlyRecap(month: string): MonthlyRecap {
  const archived = read<MonthlyRecap | null>(ARCHIVE_PREFIX + month, null);
  if (archived && month !== monthKey(new Date())) return archived;

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
      lastUsed: null as string | null,
    };
    // Only first-time payments with this code earn the influencer a commission.
    if (s.isFirstPayment !== false) row.subscribers += 1;
    row.revenue = row.subscribers * PRICING.usd.regular;
    row.commission = row.subscribers * COMMISSION_PER_SUB;
    if (!row.lastUsed || new Date(s.date) > new Date(row.lastUsed)) row.lastUsed = s.date;
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
    entries: log,
  };
}

const SEP = "═══════════════════════════════════════";

export function recapToText(r: MonthlyRecap): string {
  const fmtDate = (d: string) => new Date(d).toLocaleDateString("fr-FR");
  const lines: string[] = [
    `NUTRISNAP — RÉCAPITULATIF ${monthLabel(r.month).toUpperCase()}`,
    `Généré le: ${new Date().toLocaleDateString("fr-FR")}`,
    SEP,
    "RÉSUMÉ GLOBAL",
    `Total abonnés: ${r.subscribers}`,
    `Revenus totaux: ${r.revenueFcfa.toLocaleString("fr-FR")} FCFA / ${r.revenueUsd.toFixed(2)}$`,
    `Codes promo utilisés: ${r.promoUses}`,
    SEP,
    "PERFORMANCE PAR INFLUENCEUR",
  ];
  if (r.rows.length === 0) lines.push("Aucun code promo utilisé ce mois-ci.");
  for (const row of r.rows) {
    lines.push(
      `${row.influencer} — Code: ${row.code}`,
      `Nouveaux abonnés: ${row.subscribers}`,
      `Revenus générés: ${row.revenue.toFixed(2)}$`,
      `Commission due (10%): ${row.commission.toFixed(2)}$`,
      `Dernière utilisation: ${row.lastUsed ? fmtDate(row.lastUsed) : "—"}`,
      "",
    );
  }
  lines.push(SEP, "DÉTAIL DES ABONNEMENTS");
  if (r.entries.length === 0) lines.push("Aucun abonnement ce mois-ci.");
  for (const e of r.entries) {
    lines.push(
      `${fmtDate(e.date)} | ${e.firstName || "—"} | ${e.country || "—"} | ${e.promoCode ?? "Aucun"} | ${
        e.currency === "FCFA" ? `${e.amount.toLocaleString("fr-FR")} FCFA` : `${e.amount.toFixed(2)}$`
      }`,
    );
  }
  lines.push(SEP);
  return lines.join("\n");
}

/**
 * On the first visit of a new month: archive the previous month's recap and
 * reset the live promo `uses` counters. Returns the month that was archived.
 */
export function ensureMonthlyArchive(): string | null {
  if (typeof window === "undefined") return null;
  const current = monthKey(new Date());
  const last = read<string | null>(LAST_MONTH_KEY, null);
  if (!last) {
    write(LAST_MONTH_KEY, current);
    return null;
  }
  if (last === current) return null;

  write(ARCHIVE_PREFIX + last, buildMonthlyRecap(last));
  // Reset monthly counters, keeping last-used dates.
  const stats = read<PromoCode[]>(STATS_KEY, []);
  write(
    STATS_KEY,
    stats.map((s) => ({ ...s, uses: 0 })),
  );
  write(LAST_MONTH_KEY, current);
  try {
    localStorage.removeItem(RECAP_DISMISS_KEY);
  } catch {}
  return last;
}

/** Previous month whose recap banner should show, or null. */
export function pendingRecapMonth(): string | null {
  if (typeof window === "undefined") return null;
  const now = new Date();
  const prev = monthKey(new Date(now.getFullYear(), now.getMonth() - 1, 1));
  const archived = read<MonthlyRecap | null>(ARCHIVE_PREFIX + prev, null);
  if (!archived) return null;
  if (read<string | null>(RECAP_DISMISS_KEY, null) === prev) return null;
  return prev;
}

export function dismissRecapBanner(month: string) {
  write(RECAP_DISMISS_KEY, month);
}
