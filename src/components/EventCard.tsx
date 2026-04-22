import { Link } from "@tanstack/react-router";
import { MapPin, Navigation, Flame } from "lucide-react";
import type { EventItem } from "@/lib/mock-data";
import { CategoryBadge } from "./CategoryBadge";
import { FlameButton } from "./FlameButton";
import { useFlames } from "@/lib/flame-store";

type Props = { event: EventItem; index?: number };

export function EventCard({ event, index = 0 }: Props) {
  const { counts } = useFlames();
  const total = counts[event.id] ?? event.flameCount;
  const hot = event.hotFriends.slice(0, 3);

  return (
    <article
      className="animate-fade-up overflow-hidden rounded-xl bg-card shadow-card border border-border"
      style={{ animationDelay: `${index * 70}ms` }}
    >
      <Link to="/event/$eventId" params={{ eventId: event.id }} className="block">
        <div className="relative h-[200px] w-full overflow-hidden rounded-t-xl">
          <img
            src={event.cover}
            alt={event.title}
            loading="lazy"
            className="h-full w-full object-cover"
          />
          {/* Bottom gradient overlay (40% bottom -> heavy black) */}
          <div
            className="pointer-events-none absolute inset-x-0 bottom-0 h-3/5"
            style={{ background: "linear-gradient(to bottom, transparent 30%, rgba(0,0,0,0.85) 100%)" }}
          />

          {/* Top-left: category + special badge */}
          <div className="absolute left-3 top-3 flex items-center gap-1.5">
            <CategoryBadge category={event.category} />
            {event.trending && (
              <span
                className="inline-flex items-center rounded-[10px] px-2 py-[3px] text-[10px] font-semibold"
                style={{
                  background: "rgba(232,89,60,0.2)",
                  border: "0.5px solid #E8593C",
                  color: "#F97316",
                }}
              >
                🔥 Tendance
              </span>
            )}
            {event.tonight && (
              <span
                className="inline-flex items-center rounded-[10px] px-2 py-[3px] text-[10px] font-semibold"
                style={{
                  background: "rgba(251,191,36,0.15)",
                  border: "0.5px solid #F59E0B",
                  color: "#F59E0B",
                }}
              >
                ⚡ Ce soir
              </span>
            )}
          </div>

          {/* Top-right: price */}
          <div className="absolute right-3 top-3 rounded-full bg-background/70 px-2.5 py-1 text-xs font-bold text-foreground backdrop-blur-md">
            {event.isFree ? "Gratuit" : event.price}
          </div>

          {/* Bottom: time + title */}
          <div className="absolute bottom-3 left-3 right-3">
            <p
              className="text-[12px] font-semibold uppercase"
              style={{
                color: "#F97316",
                letterSpacing: "0.05em",
                textShadow: "0 1px 4px rgba(0,0,0,0.8)",
              }}
            >
              {event.dayLabel} · {event.time}
            </p>
            <h3
              className="mt-1 line-clamp-2 text-lg font-bold leading-tight text-foreground"
              style={{ textShadow: "0 1px 4px rgba(0,0,0,0.8)" }}
            >
              {event.title}
            </h3>
          </div>
        </div>
      </Link>

      {/* Body */}
      <div className="space-y-2.5 p-3">
        {/* Location */}
        <div className="flex items-center gap-1.5">
          <MapPin className="h-[14px] w-[14px] shrink-0" style={{ color: "#F97316" }} />
          <span className="truncate text-[13px]" style={{ color: "#9CA3AF" }}>
            {event.location}
          </span>
        </div>

        {/* Friends row + counts (one line) */}
        <div className="flex items-center gap-2">
          {hot.length > 0 && (
            <div className="flex -space-x-2">
              {hot.map((f) => (
                <img
                  key={f.id}
                  src={f.avatar}
                  alt={f.name}
                  className="h-6 w-6 rounded-full border-2 border-card bg-secondary"
                />
              ))}
            </div>
          )}
          <p className="truncate text-xs font-medium">
            {hot.length > 0 ? (
              <>
                <Flame
                  className="mr-0.5 inline h-3 w-3"
                  fill="currentColor"
                  style={{ color: "#F97316" }}
                />
                <span style={{ color: "#F97316" }}>
                  {event.hotFriends.length} ami{event.hotFriends.length > 1 ? "s" : ""} chaud
                  {event.hotFriends.length > 1 ? "s" : ""}
                </span>
                <span className="text-muted-foreground"> · {total} intéressés</span>
              </>
            ) : (
              <span className="text-muted-foreground">
                <Flame className="mr-0.5 inline h-3 w-3" /> {total} intéressés
              </span>
            )}
          </p>
        </div>

        {/* Two buttons side by side */}
        <div className="flex items-center gap-2 pt-0.5">
          <div className="flex-1">
            <FlameButton eventId={event.id} fullWidth pill />
          </div>
          <button
            onClick={(e) => e.preventDefault()}
            className="inline-flex h-10 items-center justify-center gap-1.5 rounded-[20px] border border-border bg-secondary px-4 text-[13px] font-bold text-foreground transition-colors hover:bg-surface-elevated"
            aria-label="M'y rendre"
          >
            <Navigation className="h-4 w-4" />
            Y aller
          </button>
        </div>
      </div>
    </article>
  );
}
