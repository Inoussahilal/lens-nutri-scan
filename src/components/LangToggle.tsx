import { useLanguage, type Lang } from "@/lib/i18n";

export function LangToggle({ className = "" }: { className?: string }) {
  const { lang, setLang } = useLanguage();
  const opts: { code: Lang; label: string }[] = [
    { code: "fr", label: "🇫🇷 FR" },
    { code: "en", label: "🇬🇧 EN" },
  ];
  return (
    <div
      className={`inline-flex shrink-0 items-center gap-0.5 rounded-full p-0.5 ${className}`}
      style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.08)" }}
    >
      {opts.map((o) => {
        const active = lang === o.code;
        return (
          <button
            key={o.code}
            onClick={() => setLang(o.code)}
            aria-pressed={active}
            className={`tap rounded-full px-2.5 py-1 text-[11px] font-semibold ${
              active ? "bg-primary text-primary-foreground" : "text-muted-foreground"
            }`}
          >
            {o.label}
          </button>
        );
      })}
    </div>
  );
}
