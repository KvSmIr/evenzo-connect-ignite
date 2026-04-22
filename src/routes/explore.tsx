import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Search, SlidersHorizontal, X, MapPin, Flame } from "lucide-react";
import { MobileFrame } from "@/components/MobileFrame";
import { EVENTS, type EventItem } from "@/lib/mock-data";
import { CategoryBadge } from "@/components/CategoryBadge";
import { useFlames } from "@/lib/flame-store";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/explore")({
  head: () => ({
    meta: [
      { title: "Explorer — EVENZO" },
      {
        name: "description",
        content: "Explore les événements de Lomé sur la carte. Repère les soirées qui chauffent près de toi.",
      },
      { property: "og:title", content: "Explorer la carte — EVENZO" },
      { property: "og:description", content: "Trouve les événements près de toi à Lomé." },
    ],
  }),
  component: ExplorePage,
});

/**
 * Lightweight stylised map (no external lib needed for v1).
 * Coordinates are projected onto the box using Lomé bounds.
 */
const BOUNDS = { minLat: 6.115, maxLat: 6.195, minLng: 1.205, maxLng: 1.245 };
function project(lat: number, lng: number) {
  const x = ((lng - BOUNDS.minLng) / (BOUNDS.maxLng - BOUNDS.minLng)) * 100;
  const y = (1 - (lat - BOUNDS.minLat) / (BOUNDS.maxLat - BOUNDS.minLat)) * 100;
  return { x: Math.max(6, Math.min(94, x)), y: Math.max(8, Math.min(92, y)) };
}

function ExplorePage() {
  const [selected, setSelected] = useState<EventItem | null>(null);
  const [query, setQuery] = useState("");
  const { counts } = useFlames();

  const filtered = useMemo(
    () =>
      EVENTS.filter((e) =>
        query.trim()
          ? (e.title + e.location + e.category).toLowerCase().includes(query.toLowerCase())
          : true
      ),
    [query]
  );

  const maxFlame = Math.max(...EVENTS.map((e) => counts[e.id] ?? e.flameCount));

  return (
    <MobileFrame>
      <div className="relative h-screen w-full overflow-hidden">
        {/* Stylised dark "map" surface */}
        <div className="absolute inset-0 bg-[#0a1018]">
          <div
            className="absolute inset-0 opacity-60"
            style={{
              backgroundImage: `
                linear-gradient(oklch(0.18 0.02 240 / 0.4) 1px, transparent 1px),
                linear-gradient(90deg, oklch(0.18 0.02 240 / 0.4) 1px, transparent 1px)
              `,
              backgroundSize: "40px 40px",
            }}
          />
          {/* Fake "roads" */}
          <svg className="absolute inset-0 h-full w-full" viewBox="0 0 100 100" preserveAspectRatio="none">
            <path d="M0,30 Q40,40 70,20 T100,35" stroke="oklch(0.25 0.03 240)" strokeWidth="0.6" fill="none" />
            <path d="M10,80 Q30,60 60,70 T100,55" stroke="oklch(0.25 0.03 240)" strokeWidth="0.6" fill="none" />
            <path d="M20,0 L25,100" stroke="oklch(0.22 0.03 240)" strokeWidth="0.4" fill="none" />
            <path d="M70,0 L75,100" stroke="oklch(0.22 0.03 240)" strokeWidth="0.4" fill="none" />
            <path d="M0,50 L100,52" stroke="oklch(0.22 0.03 240)" strokeWidth="0.4" fill="none" />
            {/* "Coast" */}
            <path d="M0,95 Q50,85 100,92 L100,100 L0,100 Z" fill="oklch(0.12 0.05 240)" />
          </svg>
          <div className="absolute bottom-2 left-3 text-[9px] font-medium uppercase tracking-wider text-muted-foreground/70">
            Lomé · Togo
          </div>
        </div>

        {/* Markers */}
        {filtered.map((e) => {
          const { x, y } = project(e.lat, e.lng);
          const flame = counts[e.id] ?? e.flameCount;
          const scale = 0.7 + (flame / maxFlame) * 0.6;
          const isSelected = selected?.id === e.id;
          return (
            <button
              key={e.id}
              onClick={() => setSelected(e)}
              className="absolute -translate-x-1/2 -translate-y-1/2 transition-transform"
              style={{ left: `${x}%`, top: `${y}%`, transform: `translate(-50%,-50%) scale(${isSelected ? scale * 1.2 : scale})` }}
              aria-label={e.title}
            >
              <div className="relative flex flex-col items-center">
                <div className={cn(
                  "flex h-11 w-11 items-center justify-center rounded-full bg-gradient-flame text-2xl shadow-flame",
                  isSelected && "ring-4 ring-primary/50"
                )}>
                  🔥
                </div>
                <div className="mt-1 rounded-full bg-background/85 px-2 py-0.5 text-[10px] font-bold text-foreground backdrop-blur">
                  {flame}
                </div>
              </div>
            </button>
          );
        })}

        {/* Search overlay */}
        <div className="absolute left-0 right-0 top-0 z-10 px-4 pt-safe pt-4">
          <div className="flex items-center gap-2 rounded-2xl border border-border bg-background/85 p-2 shadow-elevated backdrop-blur-xl">
            <Search className="ml-2 h-4 w-4 text-muted-foreground" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Chercher un événement, un lieu…"
              className="flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground focus:outline-none"
            />
            {query && (
              <button onClick={() => setQuery("")} aria-label="Effacer">
                <X className="h-4 w-4 text-muted-foreground" />
              </button>
            )}
          </div>
        </div>

        {/* Filter button */}
        <button
          aria-label="Filtres"
          className="absolute bottom-32 right-4 flex h-12 w-12 items-center justify-center rounded-full bg-card shadow-elevated border border-border"
        >
          <SlidersHorizontal className="h-5 w-5 text-foreground" />
        </button>

        {/* Bottom sheet */}
        {selected && (
          <div
            className="absolute bottom-20 left-3 right-3 z-20 animate-slide-up rounded-2xl border border-border bg-card shadow-elevated"
            key={selected.id}
          >
            <div className="mx-auto mt-2 h-1 w-10 rounded-full bg-border" />
            <Link
              to="/event/$eventId"
              params={{ eventId: selected.id }}
              className="flex gap-3 p-3"
            >
              <img
                src={selected.cover}
                alt={selected.title}
                className="h-20 w-20 shrink-0 rounded-xl object-cover"
              />
              <div className="min-w-0 flex-1 space-y-1">
                <CategoryBadge category={selected.category} />
                <h3 className="line-clamp-1 text-sm font-bold text-foreground">{selected.title}</h3>
                <p className="flex items-center gap-1 text-xs text-muted-foreground">
                  <MapPin className="h-3 w-3" /> {selected.location}
                </p>
                <p className="flex items-center gap-1 text-xs font-semibold text-accent">
                  <Flame className="h-3 w-3" fill="currentColor" />
                  {counts[selected.id] ?? selected.flameCount} chauds · {selected.dayLabel} {selected.time}
                </p>
              </div>
            </Link>
            <button
              onClick={() => setSelected(null)}
              className="absolute right-2 top-2 rounded-full bg-secondary p-1.5"
              aria-label="Fermer"
            >
              <X className="h-3.5 w-3.5 text-muted-foreground" />
            </button>
          </div>
        )}
      </div>
    </MobileFrame>
  );
}
