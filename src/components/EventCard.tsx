import { Link } from "@tanstack/react-router";
import { MapPin, Navigation, Share2, Flame } from "lucide-react";
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
      className="animate-fade-up overflow-hidden rounded-2xl bg-card shadow-card border border-border"
      style={{ animationDelay: `${index * 70}ms` }}
    >
      <Link to="/event/$eventId" params={{ eventId: event.id }} className="block">
        <div className="relative aspect-[16/10] overflow-hidden">
          <img
            src={event.cover}
            alt={event.title}
            loading="lazy"
            className="h-full w-full object-cover"
          />
          <div className="absolute inset-0 bg-card-overlay" />
          <div className="absolute left-3 top-3">
            <CategoryBadge category={event.category} />
          </div>
          <div className="absolute right-3 top-3 rounded-full bg-background/70 px-2.5 py-1 text-xs font-bold text-foreground backdrop-blur-md">
            {event.isFree ? "Gratuit" : event.price}
          </div>
          <div className="absolute bottom-3 left-3 right-3">
            <p className="text-xs font-semibold uppercase tracking-wider text-accent">
              {event.dayLabel} · {event.time}
            </p>
            <h3 className="mt-1 line-clamp-2 text-lg font-bold leading-tight text-foreground">
              {event.title}
            </h3>
          </div>
        </div>
      </Link>

      <div className="space-y-3 p-4">
        <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
          <MapPin className="h-4 w-4 shrink-0" />
          <span className="truncate">{event.location}</span>
        </div>

        {hot.length > 0 && (
          <div className="flex items-center gap-2">
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
            <p className="text-xs font-medium text-accent">
              <Flame className="mr-0.5 inline h-3 w-3" fill="currentColor" />
              {event.hotFriends.length} ami{event.hotFriends.length > 1 ? "s" : ""} chaud{event.hotFriends.length > 1 ? "s" : ""}
              <span className="text-muted-foreground"> · {total} intéressés</span>
            </p>
          </div>
        )}

        {hot.length === 0 && (
          <p className="text-xs font-medium text-muted-foreground">
            <Flame className="mr-0.5 inline h-3 w-3" /> {total} intéressés
          </p>
        )}

        <div className="flex items-center gap-2 pt-1">
          <div className="flex-1">
            <FlameButton eventId={event.id} fullWidth />
          </div>
          <button
            onClick={(e) => e.preventDefault()}
            className="inline-flex h-11 items-center justify-center gap-1.5 rounded-lg border border-border bg-secondary px-3 text-sm font-semibold text-foreground transition-colors hover:bg-surface-elevated"
            aria-label="M'y rendre"
          >
            <Navigation className="h-4 w-4" />
            <span className="hidden xs:inline">Y aller</span>
          </button>
          <button
            onClick={(e) => e.preventDefault()}
            className="inline-flex h-11 w-11 items-center justify-center rounded-lg border border-border bg-secondary text-foreground transition-colors hover:bg-surface-elevated"
            aria-label="Partager"
          >
            <Share2 className="h-4 w-4" />
          </button>
        </div>
      </div>
    </article>
  );
}
