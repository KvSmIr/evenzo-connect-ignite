import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Bell } from "lucide-react";
import { MobileFrame } from "@/components/MobileFrame";
import { Logo } from "@/components/Logo";
import { EventCard } from "@/components/EventCard";
import { Skeleton } from "@/components/ui/skeleton";
import { NotificationsSheet } from "@/components/NotificationsSheet";
import { useEventsFeed, dayLabelFromDate } from "@/lib/events-query";
import { useNotifications } from "@/lib/notifications";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "EVENZO — L'app des événements à Lomé" },
      {
        name: "description",
        content:
          "Découvre les soirées, concerts et événements qui chauffent à Lomé. Vois où vont tes amis et rejoins le mouvement.",
      },
      { property: "og:title", content: "EVENZO — Événements à Lomé" },
      {
        property: "og:description",
        content: "L'application qui connecte les gens aux événements — et les gens entre eux.",
      },
    ],
  }),
  component: HomePage,
});

const CATEGORIES: { label: string; value: string }[] = [
  { label: "Tous", value: "Tous" },
  { label: "Soirée", value: "Soirée" },
  { label: "Concert", value: "Concert" },
  { label: "Sport", value: "Sport" },
  { label: "Culture", value: "Culture" },
  { label: "Gratuit", value: "Gratuit" },
  { label: "Ce soir", value: "Ce soir" },
];

function HomePage() {
  const [filter, setFilter] = useState<string>("Tous");
  const [notifOpen, setNotifOpen] = useState(false);
  const { data: events, isLoading, isError, refetch } = useEventsFeed();
  const { unreadCount } = useNotifications();
  const navigate = useNavigate();

  const filtered = (events ?? []).filter((e) => {
    if (filter === "Tous") return true;
    if (filter === "Gratuit") return e.is_free;
    if (filter === "Ce soir") return dayLabelFromDate(e.event_date, e.event_time) === "Ce soir";
    return e.category === filter;
  });

  return (
    <MobileFrame>
      <header className="sticky top-0 z-30 border-b border-border bg-background/85 backdrop-blur-xl">
        <div className="flex items-center justify-between px-4 pt-safe pb-3 pt-4">
          <Logo />
          <button
            onClick={() => setNotifOpen(true)}
            aria-label="Notifications"
            className="relative flex h-10 w-10 items-center justify-center rounded-full bg-secondary"
          >
            <Bell className="h-5 w-5 text-foreground" />
            {unreadCount > 0 && (
              <span className="absolute right-2 top-2 h-2.5 w-2.5 rounded-full bg-primary ring-2 ring-background" />
            )}
          </button>
        </div>

        <div className="no-scrollbar flex gap-2 overflow-x-auto px-4 pb-3">
          {CATEGORIES.map(({ label, value }) => {
            const active = filter === value;
            return (
              <button
                key={label}
                onClick={() => setFilter(value)}
                className={cn(
                  "shrink-0 rounded-[17px] text-[13px] font-semibold transition-all",
                  active ? "text-white" : "text-muted-foreground hover:text-foreground"
                )}
                style={{
                  height: "34px",
                  padding: "8px 16px",
                  background: active ? "#E8593C" : "transparent",
                  border: active ? "0.5px solid #E8593C" : "0.5px solid #333",
                }}
              >
                {label}
              </button>
            );
          })}
        </div>
      </header>

      <section className="px-4 py-4">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-xl font-bold text-foreground">À ne pas manquer</h2>
          <span
            className="inline-flex items-center rounded-[12px] text-[12px] font-semibold"
            style={{
              background: "rgba(249,115,22,0.15)",
              color: "#F97316",
              padding: "3px 10px",
            }}
          >
            {filtered.length} événement{filtered.length > 1 ? "s" : ""}
          </span>
        </div>

        {isLoading && (
          <div className="flex flex-col gap-4">
            {[0, 1, 2].map((i) => (
              <div key={i} className="overflow-hidden rounded-xl border border-border bg-card">
                <Skeleton className="h-[200px] w-full rounded-none" />
                <div className="space-y-2 p-3">
                  <Skeleton className="h-3 w-1/2" />
                  <Skeleton className="h-3 w-2/3" />
                  <div className="flex gap-2 pt-2">
                    <Skeleton className="h-10 flex-1 rounded-full" />
                    <Skeleton className="h-10 flex-1 rounded-full" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {isError && (
          <div className="rounded-2xl border border-destructive/40 bg-destructive/10 p-6 text-center">
            <p className="text-3xl">😕</p>
            <p className="mt-3 text-sm font-semibold text-foreground">
              Impossible de charger les événements.
            </p>
            <p className="mt-1 text-xs text-muted-foreground">Vérifie ta connexion.</p>
            <button
              onClick={() => refetch()}
              className="mt-4 rounded-lg bg-primary px-4 py-2 text-xs font-bold text-primary-foreground"
            >
              Réessayer
            </button>
          </div>
        )}

        {!isLoading && !isError && filtered.length === 0 && (
          <div className="rounded-2xl border border-dashed border-border bg-card p-10 text-center">
            <p className="text-4xl">🌚</p>
            <p className="mt-3 text-sm font-semibold text-foreground">
              Rien de chaud par ici
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              Essaie un autre filtre ou crée ton propre événement.
            </p>
            <button
              onClick={() => navigate({ to: "/create-event" })}
              className="mt-4 rounded-lg bg-gradient-flame px-4 py-2 text-xs font-bold text-primary-foreground shadow-flame"
            >
              Créer un événement
            </button>
          </div>
        )}

        {!isLoading && !isError && filtered.length > 0 && (
          <div className="flex flex-col gap-4">
            {filtered.map((e, i) => (
              <EventCard key={e.id} event={e} index={i} />
            ))}
          </div>
        )}
      </section>

      <NotificationsSheet open={notifOpen} onClose={() => setNotifOpen(false)} />

      <Link to="/" className="hidden">stub</Link>
    </MobileFrame>
  );
}
