import { Link } from "@tanstack/react-router";
import { MapPin, Flame } from "lucide-react";
import { CategoryBadge } from "./CategoryBadge";
import { FlameButton } from "./FlameButton";
import { useFlames } from "@/lib/flame-store";
import { dayLabelFromDate, formatTime, priceLabel, type EventWithOrganizer } from "@/lib/events-query";

type Props = { event: EventWithOrganizer; index?: number };

const PLACEHOLDER_COVER =
  "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 400 200'><defs><linearGradient id='g' x1='0' y1='0' x2='1' y2='1'><stop offset='0' stop-color='%23E8593C'/><stop offset='1' stop-color='%23F97316'/></linearGradient></defs><rect width='400' height='200' fill='url(%23g)'/><text x='200' y='115' font-size='60' text-anchor='middle'>🔥</text></svg>";

export function EventCard({ event, index = 0 }: Props) {
  const { counts } = useFlames();
  const c = counts[event.id] ?? { chaud: 0, going: 0 };
  const total = c.chaud + c.going;
  const dayLabel = dayLabelFromDate(event.event_date, event.event_time);
  const tonight = dayLabel === "Ce soir";

  return (
    <article
      className="animate-fade-up overflow-hidden rounded-xl bg-card shadow-card border border-border"
      style={{ animationDelay: `${index * 70}ms` }}
    >
      <Link to="/event/$eventId" params={{ eventId: event.id }} className="block">
        <div className="relative h-[200px] w-full overflow-hidden rounded-t-xl">
          <img
            src={event.cover_url || PLACEHOLDER_COVER}
            alt={event.title}
            loading="lazy"
            className="h-full w-full object-cover"
          />
          <div
            className="pointer-events-none absolute inset-x-0 bottom-0 h-3/5"
            style={{ background: "linear-gradient(to bottom, transparent 30%, rgba(0,0,0,0.85) 100%)" }}
          />

          <div className="absolute left-3 top-3 flex items-center gap-1.5">
            <CategoryBadge category={event.category as never} />
            {tonight && (
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

          <div className="absolute right-3 top-3 rounded-full bg-background/70 px-2.5 py-1 text-xs font-bold text-foreground backdrop-blur-md">
            {priceLabel(event)}
          </div>

          <div className="absolute bottom-3 left-3 right-3">
            <p
              className="text-[12px] font-semibold uppercase"
              style={{
                color: "#F97316",
                letterSpacing: "0.05em",
                textShadow: "0 1px 4px rgba(0,0,0,0.8)",
              }}
            >
              {dayLabel} · {formatTime(event.event_time)}
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

      <div className="space-y-2.5 p-3">
        <div className="flex items-center gap-1.5">
          <MapPin className="h-[14px] w-[14px] shrink-0" style={{ color: "#F97316" }} />
          <span className="truncate text-[13px]" style={{ color: "#9CA3AF" }}>
            {event.location_name}
          </span>
        </div>

        <p className="truncate text-xs font-medium">
          <Flame
            className="mr-0.5 inline h-3 w-3"
            fill="currentColor"
            style={{ color: "#F97316" }}
          />
          <span style={{ color: "#F97316" }}>{c.chaud} chaud{c.chaud > 1 ? "s" : ""}</span>
          <span className="text-muted-foreground"> · {c.going} y vont · {total} intéressés</span>
        </p>

        <div className="flex items-center gap-2 pt-0.5">
          <div className="flex-1">
            <FlameButton eventId={event.id} fullWidth pill />
          </div>
          <div className="flex-1">
            <FlameButton eventId={event.id} fullWidth pill variant="going" />
          </div>
        </div>
      </div>
    </article>
  );
}
