import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { Bell, Plus } from "lucide-react";
import { MobileFrame } from "@/components/MobileFrame";
import { Logo } from "@/components/Logo";
import { EventCard } from "@/components/EventCard";
import { CATEGORIES, EVENTS, FRIENDS } from "@/lib/mock-data";
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

function HomePage() {
  const [filter, setFilter] = useState<string>("Tous");

  const filtered = EVENTS.filter((e) => {
    if (filter === "Tous") return true;
    if (filter === "Gratuit") return e.isFree;
    if (filter === "Ce soir") return e.dayLabel === "Ce soir";
    return e.category === filter;
  });

  return (
    <MobileFrame>
      {/* Header */}
      <header className="sticky top-0 z-30 border-b border-border bg-background/85 backdrop-blur-xl">
        <div className="flex items-center justify-between px-4 pt-safe pb-3 pt-4">
          <Logo />
          <button
            aria-label="Notifications"
            className="relative flex h-10 w-10 items-center justify-center rounded-full bg-secondary"
          >
            <Bell className="h-5 w-5 text-foreground" />
            <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-primary ring-2 ring-background" />
          </button>
        </div>

        {/* Filter chips */}
        <div className="no-scrollbar flex gap-2 overflow-x-auto px-4 pb-3">
          {CATEGORIES.map(({ label, value }) => {
            const active = filter === value;
            return (
              <button
                key={label}
                onClick={() => setFilter(value)}
                className={cn(
                  "shrink-0 rounded-full px-4 py-1.5 text-xs font-semibold transition-all",
                  active
                    ? "bg-primary text-primary-foreground shadow-flame"
                    : "bg-secondary text-muted-foreground hover:text-foreground"
                )}
              >
                {label}
              </button>
            );
          })}
        </div>
      </header>

      {/* Stories row */}
      <section className="border-b border-border px-4 py-4">
        <div className="no-scrollbar flex gap-3 overflow-x-auto">
          {/* "Add" story */}
          <Link
            to="/create"
            className="flex shrink-0 flex-col items-center gap-1.5"
            aria-label="Créer une story"
          >
            <div className="relative flex h-16 w-16 items-center justify-center rounded-full border-2 border-dashed border-muted-foreground/40 bg-secondary">
              <Plus className="h-6 w-6 text-muted-foreground" />
            </div>
            <span className="text-[10px] font-medium text-muted-foreground">Créer</span>
          </Link>

          {FRIENDS.map((f) => (
            <button
              key={f.id}
              className="flex shrink-0 flex-col items-center gap-1.5"
              aria-label={`Story de ${f.name}`}
            >
              <div className="rounded-full bg-gradient-flame p-[2px]">
                <div className="rounded-full border-2 border-background bg-background">
                  <img
                    src={f.avatar}
                    alt={f.name}
                    className="h-14 w-14 rounded-full bg-secondary object-cover"
                  />
                </div>
              </div>
              <span className="max-w-[64px] truncate text-[10px] font-medium text-foreground">
                {f.name}
              </span>
            </button>
          ))}
        </div>
      </section>

      {/* Feed */}
      <section className="space-y-4 px-4 py-4">
        <div className="flex items-baseline justify-between">
          <h2 className="text-xl font-bold text-foreground">À ne pas manquer</h2>
          <span className="text-xs text-muted-foreground">{filtered.length} événements</span>
        </div>

        {filtered.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border bg-card p-10 text-center">
            <p className="text-4xl">🌚</p>
            <p className="mt-3 text-sm font-semibold text-foreground">
              Rien de chaud par ici
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              Essaie un autre filtre ou crée ton propre événement.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {filtered.map((e, i) => (
              <EventCard key={e.id} event={e} index={i} />
            ))}
          </div>
        )}
      </section>
    </MobileFrame>
  );
}
