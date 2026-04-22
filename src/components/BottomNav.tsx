import { Link, useLocation } from "@tanstack/react-router";
import { Home, Compass, Plus, Users, User } from "lucide-react";
import { cn } from "@/lib/utils";

const items = [
  { to: "/", label: "Accueil", icon: Home },
  { to: "/explore", label: "Explorer", icon: Compass },
  { to: "/create", label: "Créer", icon: Plus, primary: true },
  { to: "/social", label: "Social", icon: Users },
  { to: "/profile", label: "Profil", icon: User },
] as const;

export function BottomNav() {
  const { pathname } = useLocation();

  return (
    <nav
      className="fixed bottom-0 left-1/2 z-40 w-full max-w-[430px] -translate-x-1/2 border-t border-border bg-background/95 backdrop-blur-xl pb-safe"
      aria-label="Navigation principale"
    >
      <ul className="flex items-end justify-around px-2 pt-2 pb-2">
        {items.map(({ to, label, icon: Icon, primary }) => {
          const isActive = pathname === to;
          if (primary) {
            return (
              <li key={to} className="-mt-6">
                <Link
                  to={to}
                  aria-label={label}
                  className="flex h-14 w-14 items-center justify-center rounded-full bg-gradient-flame shadow-flame transition-transform active:scale-95"
                >
                  <Icon className="h-7 w-7 text-primary-foreground" strokeWidth={2.5} />
                </Link>
              </li>
            );
          }
          return (
            <li key={to}>
              <Link
                to={to}
                className={cn(
                  "flex flex-col items-center gap-0.5 rounded-lg px-3 py-1.5 transition-colors",
                  isActive ? "text-primary" : "text-muted-foreground hover:text-foreground"
                )}
              >
                <Icon className="h-6 w-6" strokeWidth={isActive ? 2.4 : 2} />
                <span className="text-[10px] font-medium">{label}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
