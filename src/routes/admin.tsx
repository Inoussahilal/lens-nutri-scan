import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { useStore } from "@/lib/store";
import {
  ADMIN_PASSWORD,
  createPromoCode,
  getAdminSettings,
  getPromoCodes,
  getSubscriptionsLog,
  isAdminLogged,
  saveAdminSettings,
  setAdminLogged,
  setCodeActive,
  scansToday,
  DEFAULT_WHATSAPP,
  type PromoCode,
  type SubscriptionLogEntry,
} from "@/utils/promoCodes";

export const Route = createFileRoute("/admin")({
  head: () => ({
    meta: [
      { title: "Administration — NutriSnap" },
      { name: "description", content: "Private NutriSnap administration dashboard." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: AdminPage,
});

function AdminPage() {
  const [logged, setLogged] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setLogged(isAdminLogged());
    setReady(true);
  }, []);

  if (!ready) return <div className="min-h-dvh bg-background" />;
  return logged ? <Dashboard onLogout={() => setLogged(false)} /> : <Login onSuccess={() => setLogged(true)} />;
}

function Login({ onSuccess }: { onSuccess: () => void }) {
  const [pw, setPw] = useState("");
  const [lockUntil, setLockUntil] = useState(0);
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    if (!lockUntil) return;
    const id = setInterval(() => setNow(Date.now()), 500);
    return () => clearInterval(id);
  }, [lockUntil]);

  const locked = lockUntil > now;
  const secondsLeft = Math.max(0, Math.ceil((lockUntil - now) / 1000));

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (locked) return;
    if (pw === ADMIN_PASSWORD) {
      setAdminLogged(true);
      onSuccess();
    } else {
      setPw("");
      setLockUntil(Date.now() + 30_000);
      setNow(Date.now());
      toast.error("Mot de passe incorrect — réessaie dans 30 secondes");
    }
  }

  return (
    <div className="flex min-h-dvh flex-col items-center justify-center bg-background px-6">
      <div className="w-full max-w-sm text-center">
        <div className="text-5xl">🥗</div>
        <h1 className="mt-4 font-display text-2xl font-bold">Administration NutriSnap</h1>
        <form onSubmit={submit} className="mt-6 flex flex-col gap-3">
          <input
            type="password"
            value={pw}
            onChange={(e) => setPw(e.target.value)}
            disabled={locked}
            placeholder="Mot de passe"
            className="h-12 rounded-xl border border-white/10 bg-surface px-4 text-sm outline-none disabled:opacity-50"
          />
          <button
            type="submit"
            disabled={locked}
            className="glow-lime tap h-12 rounded-xl bg-primary font-bold text-primary-foreground disabled:opacity-50"
          >
            {locked ? `Bloqué — ${secondsLeft}s` : "Se connecter"}
          </button>
          {locked && (
            <p className="text-xs" style={{ color: "#FF6B6B" }}>
              Trop de tentatives. Réessaie dans {secondsLeft} secondes.
            </p>
          )}
        </form>
      </div>
    </div>
  );
}

function Dashboard({ onLogout }: { onLogout: () => void }) {
  const { entries } = useStore();
  const [codes, setCodes] = useState<PromoCode[]>([]);
  const [log, setLog] = useState<SubscriptionLogEntry[]>([]);
  const [newCode, setNewCode] = useState("");
  const [newInfluencer, setNewInfluencer] = useState("");
  const [maintenance, setMaintenance] = useState(false);
  const [whatsapp, setWhatsapp] = useState(DEFAULT_WHATSAPP);

  useEffect(() => {
    setCodes(getPromoCodes());
    setLog(getSubscriptionsLog());
    const s = getAdminSettings();
    setMaintenance(s.maintenance);
    setWhatsapp(s.whatsapp || DEFAULT_WHATSAPP);
  }, []);

  const stats = useMemo(() => {
    const totalUses = codes.reduce((a, c) => a + (c.uses || 0), 0);
    const top = [...codes].sort((a, b) => (b.uses || 0) - (a.uses || 0))[0];
    return {
      scans: scansToday(entries),
      subs: log.length,
      promoUses: totalUses,
      top: top && top.uses ? `${top.code} (${top.uses})` : "—",
    };
  }, [codes, log, entries]);

  function toggle(code: string, active: boolean) {
    setCodeActive(code, active);
    setCodes(getPromoCodes());
  }

  function create() {
    if (!newCode.trim()) return;
    if (!createPromoCode(newCode, newInfluencer)) {
      toast.error("Ce code existe déjà");
      return;
    }
    setNewCode("");
    setNewInfluencer("");
    setCodes(getPromoCodes());
    toast.success("Code créé");
  }

  function saveSettings() {
    saveAdminSettings({ maintenance, whatsapp: whatsapp.replace(/\D/g, "") || DEFAULT_WHATSAPP });
    toast.success("Paramètres sauvegardés");
  }

  return (
    <div className="min-h-dvh bg-background px-5 pb-16 pt-6">
      <div className="mx-auto flex w-full max-w-3xl flex-col gap-5">
        {/* Header */}
        <header className="flex items-start justify-between gap-3">
          <div>
            <h1 className="font-display text-2xl font-bold">🛡️ Admin Dashboard — NutriSnap</h1>
            <p className="mt-1 text-xs text-muted-foreground">Connecté en tant que : Hilal INOUSSA</p>
            <span className="mt-2 inline-block rounded-full bg-primary/15 px-2.5 py-1 text-[10px] font-bold text-primary">
              ✨ NutriSnap Pro
            </span>
          </div>
          <button
            onClick={() => {
              setAdminLogged(false);
              onLogout();
            }}
            className="tap shrink-0 rounded-xl px-4 py-2 text-xs font-bold text-white"
            style={{ background: "#FF6B6B" }}
          >
            Se déconnecter
          </button>
        </header>

        {/* Stats */}
        <section className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <Card label="📱 Scans aujourd'hui" value={String(stats.scans)} />
          <Card label="💰 Abonnements" value={String(stats.subs)} />
          <Card label="🎟️ Codes utilisés" value={String(stats.promoUses)} />
          <Card label="📊 Code le + utilisé" value={stats.top} />
        </section>

        {/* Promo table */}
        <section className="rounded-2xl border border-white/7 bg-white/[0.04] p-4">
          <h2 className="font-display text-base font-semibold">Performance des codes promo</h2>
          <div className="mt-3 overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="text-muted-foreground">
                <tr>
                  <th className="py-2 pr-3">Code</th>
                  <th className="py-2 pr-3">Influenceur</th>
                  <th className="py-2 pr-3">Utilisations</th>
                  <th className="py-2 pr-3">Dernière utilisation</th>
                  <th className="py-2 pr-3">Statut</th>
                  <th className="py-2" />
                </tr>
              </thead>
              <tbody>
                {codes.map((c) => (
                  <tr key={c.code} className="border-t border-white/5">
                    <td className="py-2 pr-3 font-semibold">{c.code}</td>
                    <td className="py-2 pr-3 text-muted-foreground">{c.influencer}</td>
                    <td className="py-2 pr-3 tabular-nums">{c.uses || 0}</td>
                    <td className="py-2 pr-3 text-muted-foreground">
                      {c.lastUsed ? new Date(c.lastUsed).toLocaleDateString("fr-FR") : "—"}
                    </td>
                    <td className="py-2 pr-3">
                      <span
                        className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                          c.active !== false ? "bg-primary/20 text-primary" : "bg-white/10 text-muted-foreground"
                        }`}
                      >
                        {c.active !== false ? "Actif" : "Inactif"}
                      </span>
                    </td>
                    <td className="py-2">
                      <button
                        onClick={() => toggle(c.code, c.active === false)}
                        className="tap rounded-lg bg-surface px-2.5 py-1 text-[10px] font-semibold"
                      >
                        {c.active !== false ? "Désactiver" : "Activer"}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* Create code */}
        <section className="rounded-2xl border border-white/7 bg-white/[0.04] p-4">
          <h2 className="font-display text-base font-semibold">Créer un code promo</h2>
          <div className="mt-3 flex flex-col gap-2 sm:flex-row">
            <input
              value={newCode}
              onChange={(e) => setNewCode(e.target.value)}
              placeholder="Nom du code (ex : KOFI2024)"
              className="h-11 flex-1 rounded-xl border border-white/10 bg-surface px-3 text-sm uppercase outline-none placeholder:normal-case"
            />
            <input
              value={newInfluencer}
              onChange={(e) => setNewInfluencer(e.target.value)}
              placeholder="Nom de l'influenceur"
              className="h-11 flex-1 rounded-xl border border-white/10 bg-surface px-3 text-sm outline-none"
            />
            <button onClick={create} className="tap h-11 rounded-xl bg-primary px-4 text-sm font-bold text-primary-foreground">
              Créer le code
            </button>
          </div>
        </section>

        {/* Subscriptions */}
        <section className="rounded-2xl border border-white/7 bg-white/[0.04] p-4">
          <h2 className="font-display text-base font-semibold">Derniers abonnements</h2>
          {log.length === 0 ? (
            <p className="mt-3 text-xs text-muted-foreground">Aucun abonnement pour le moment.</p>
          ) : (
            <ul className="mt-3 flex flex-col gap-2">
              {log.slice(0, 10).map((s) => (
                <li key={s.id} className="flex items-center justify-between rounded-xl bg-surface px-3 py-2 text-xs">
                  <span className="text-muted-foreground">
                    {new Date(s.date).toLocaleString("fr-FR")} · {s.firstName || "—"}
                  </span>
                  <span className="text-muted-foreground">{s.promoCode ?? "Aucun"}</span>
                  <span className="font-semibold tabular-nums">
                    {s.amount} {s.currency}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>

        {/* Settings */}
        <section className="rounded-2xl border border-white/7 bg-white/[0.04] p-4">
          <h2 className="font-display text-base font-semibold">Paramètres</h2>
          <label className="mt-3 flex items-center justify-between text-sm">
            Mode maintenance
            <input
              type="checkbox"
              checked={maintenance}
              onChange={(e) => setMaintenance(e.target.checked)}
              className="h-5 w-5 accent-[#A8FF3E]"
            />
          </label>
          <div className="mt-3">
            <p className="text-xs text-muted-foreground">Numéro WhatsApp (paiements internationaux)</p>
            <input
              value={whatsapp}
              onChange={(e) => setWhatsapp(e.target.value)}
              className="mt-1.5 h-11 w-full rounded-xl border border-white/10 bg-surface px-3 text-sm outline-none"
            />
          </div>
          <button
            onClick={saveSettings}
            className="glow-lime tap mt-4 h-11 w-full rounded-xl bg-primary text-sm font-bold text-primary-foreground"
          >
            Sauvegarder
          </button>
        </section>

        {/* Access the app */}
        <Link
          to="/"
          className="glow-lime tap flex h-[52px] w-full items-center justify-center rounded-2xl bg-primary font-bold text-primary-foreground"
        >
          Accéder à l'app →
        </Link>
      </div>
    </div>
  );
}

function Card({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-white/7 bg-white/[0.04] p-4">
      <div className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</div>
      <div className="mt-1 font-display text-xl font-bold tabular-nums">{value}</div>
    </div>
  );
}
