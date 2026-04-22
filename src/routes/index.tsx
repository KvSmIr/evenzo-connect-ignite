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
                  "shrink-0 rounded-[17px] text-[13px] font-semibold transition-all",
                  active
                    ? "text-white"
                    : "text-muted-foreground hover:text-foreground"
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

      {/* Stories row */}
      <section className="border-b border-border px-4 py-4">
        <div className="no-scrollbar flex gap-3 overflow-x-auto">
          {/* "Add" story */}
          <Link
            to="/create"
            className="flex shrink-0 flex-col items-center gap-1.5"
            aria-label="Créer une story"
          >
            <div
              className="flex items-center justify-center rounded-full bg-secondary"
              style={{ width: "56px", height: "56px", border: "2px dashed #444" }}
            >
              <Plus className="h-6 w-6 text-muted-foreground" />
            </div>
            <span
              className="block max-w-[64px] overflow-hidden text-center text-[11px] font-medium text-muted-foreground"
              style={{ whiteSpace: "nowrap", textOverflow: "ellipsis" }}
            >
              Créer
            </span>
          </Link>

          {FRIENDS.map((f) => (
            <button
              key={f.id}
              className="flex shrink-0 flex-col items-center gap-1.5"
              aria-label={`Story de ${f.name}`}
            >
              <div
                className="flex items-center justify-center rounded-full"
                style={{ width: "56px", height: "56px", border: "2.5px solid #F97316" }}
              >
                <img
                  src={f.avatar}
                  alt={f.name}
                  className="rounded-full bg-secondary object-cover"
                  style={{ width: "48px", height: "48px" }}
                />
              </div>
              <span
                className="block max-w-[64px] overflow-hidden text-center text-[11px] font-medium text-foreground"
                style={{ whiteSpace: "nowrap", textOverflow: "ellipsis" }}
              >
                {f.name}
              </span>
            </button>
          ))}
        </div>
      </section>

      {/* Feed */}
      <section className="px-4 py-4" style={{ paddingLeft: "16px", paddingRight: "16px" }}>
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
            {filtered.length} événements
          </span>
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
          <div className="flex flex-col gap-4">
            {filtered.map((e, i) => (
              <EventCard key={e.id} event={e} index={i} />
            ))}
          </div>
        )}
      </section>
    </MobileFrame>
  );
}
