import { Link, useLocation, useNavigate } from "@tanstack/react-router";
import { Home, Compass, Plus, Users, User } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/lib/auth-store";
import { BecomeOrganizerSheet } from "./BecomeOrganizerSheet";

type NavItem = {
  to: "/" | "/explore" | "/social" | "/profile";
  label: string;
  icon: typeof Home;
};

const items: NavItem[] = [
  { to: "/", label: "Accueil", icon: Home },
  { to: "/explore", label: "Explorer", icon: Compass },
  { to: "/social", label: "Social", icon: Users },
  { to: "/profile", label: "Profil", icon: User },
];

export function BottomNav() {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const { user, role } = useAuth();
  const [sheetOpen, setSheetOpen] = useState(false);

  const onPlus = () => {
    if (!user) {
      navigate({ to: "/auth" });
      return;
    }
    if (role === "organizer" || role === "admin") {
      navigate({ to: "/create-event" });
      return;
    }
    setSheetOpen(true);
  };

  const left = items.slice(0, 2);
  const right = items.slice(2);

  return (
    <>
      <nav
        className="fixed bottom-0 left-1/2 z-40 w-full max-w-[430px] -translate-x-1/2 border-t border-border bg-background/95 backdrop-blur-xl pb-safe"
        aria-label="Navigation principale"
      >
        <ul className="flex items-end justify-around px-2 pt-2 pb-2">
          {left.map(({ to, label, icon: Icon }) => {
            const isActive = pathname === to;
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

          <li className="-mt-6">
            <button
              onClick={onPlus}
              aria-label="Créer"
              className="flex h-14 w-14 items-center justify-center rounded-full bg-gradient-flame shadow-flame transition-transform active:scale-95"
            >
              <Plus className="h-7 w-7 text-primary-foreground" strokeWidth={2.5} />
            </button>
          </li>

          {right.map(({ to, label, icon: Icon }) => {
            const isActive = pathname === to;
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

      <BecomeOrganizerSheet open={sheetOpen} onClose={() => setSheetOpen(false)} />
    </>
  );
}
