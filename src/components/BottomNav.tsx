import { Link, useRouterState } from "@tanstack/react-router";
import { Home, Camera, BookOpen, BarChart3, User } from "lucide-react";

type NavItem = { to: "/" | "/diary" | "/scan" | "/progress" | "/profile"; icon: typeof Home; label: string; primary?: boolean };

const items: NavItem[] = [
  { to: "/", icon: Home, label: "Home" },
  { to: "/diary", icon: BookOpen, label: "Diary" },
  { to: "/scan", icon: Camera, label: "Scan", primary: true },
  { to: "/progress", icon: BarChart3, label: "Stats" },
  { to: "/profile", icon: User, label: "Profile" },
];

export function BottomNav() {
  const { location } = useRouterState();
  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 safe-bottom pointer-events-none">
      <div className="mx-auto max-w-md px-4 pointer-events-auto">
        <div className="glass mb-1 flex items-center justify-around rounded-3xl px-2 py-2 shadow-2xl">
          {items.map((it) => {
            const active = location.pathname === it.to;
            const Icon = it.icon;
            if (it.primary) {
              return (
                <Link
                  key={it.to}
                  to={it.to}
                  className="tap -mt-7 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary text-primary-foreground glow-lime"
                  aria-label={it.label}
                >
                  <Icon className="h-6 w-6" strokeWidth={2.5} />
                </Link>
              );
            }
            return (
              <Link
                key={it.to}
                to={it.to}
                className={`tap flex min-w-[56px] flex-col items-center gap-0.5 rounded-xl px-3 py-2 transition-colors ${
                  active ? "text-primary" : "text-muted-foreground"
                }`}
              >
                <Icon className="h-5 w-5" strokeWidth={active ? 2.5 : 2} />
                <span className="text-[10px] font-medium">{it.label}</span>
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
