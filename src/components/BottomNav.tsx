import { Link, useRouterState } from "@tanstack/react-router";
import { Home, Camera, BookOpen, BarChart3, User } from "lucide-react";
import { useLanguage, type TKey } from "@/lib/i18n";

type NavItem = { to: "/" | "/diary" | "/scan" | "/progress" | "/profile"; icon: typeof Home; label: TKey; primary?: boolean };

const items: NavItem[] = [
  { to: "/", icon: Home, label: "nav_home" },
  { to: "/diary", icon: BookOpen, label: "nav_diary" },
  { to: "/scan", icon: Camera, label: "nav_scan", primary: true },
  { to: "/progress", icon: BarChart3, label: "nav_stats" },
  { to: "/profile", icon: User, label: "nav_profile" },
];

export function BottomNav() {
  const { location } = useRouterState();
  const { t } = useLanguage();
  return (

    <nav className="pointer-events-none fixed inset-x-0 bottom-0 z-40 safe-bottom">
      <div className="pointer-events-auto mx-auto max-w-md px-4">
        <div className="glass mb-1 flex items-end justify-around rounded-3xl px-2 py-2 shadow-2xl">
          {items.map((it) => {
            const active = location.pathname === it.to;
            const Icon = it.icon;
            if (it.primary) {
              return (
                <Link
                  key={it.to}
                  to={it.to}
                  aria-label={it.label}
                  className="tap glow-lime -mt-7 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary text-primary-foreground"
                >
                  <Icon className="h-6 w-6" strokeWidth={2.5} />
                </Link>
              );
            }
            return (
              <Link
                key={it.to}
                to={it.to}
                className="tap relative flex min-h-[44px] min-w-[56px] flex-col items-center gap-0.5 rounded-xl px-3 py-2"
              >
                <Icon
                  className={`h-5 w-5 transition-all ${active ? "text-primary scale-110" : "text-muted-foreground opacity-60"}`}
                  strokeWidth={active ? 2.5 : 2}
                />
                <span className={`text-[10px] font-medium ${active ? "text-primary" : "text-muted-foreground opacity-60"}`}>
                  {it.label}
                </span>
                {active && <span className="absolute -bottom-0.5 h-[3px] w-6 rounded-full bg-primary" />}
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
