import { createFileRoute, Link, useParams } from "@tanstack/react-router";
import { ArrowLeft, MapPin, Calendar, Navigation, Flame, Users, Pencil } from "lucide-react";
import { MobileFrame } from "@/components/MobileFrame";
import { CategoryBadge } from "@/components/CategoryBadge";
import { FlameButton } from "@/components/FlameButton";
import { FollowButton } from "@/components/FollowButton";
import { ShareButton } from "@/components/ShareButton";
import { Skeleton } from "@/components/ui/skeleton";
import { useEvent, dayLabelFromDate, formatTime, priceLabel } from "@/lib/events-query";
import { useFlames } from "@/lib/flame-store";
import { useAuth } from "@/lib/auth-store";

export const Route = createFileRoute("/event/$eventId")({
  head: () => ({
    meta: [{ title: "Événement — EVENZO" }],
  }),
  component: EventDetailPage,
});

function EventDetailPage() {
  const { eventId } = useParams({ from: "/event/$eventId" });
  const { data: event, isLoading, isError } = useEvent(eventId);
  const { counts } = useFlames();
  const { user, role } = useAuth();

  if (isLoading) {
    return (
      <MobileFrame>
        <Skeleton className="aspect-[4/5] w-full rounded-none" />
        <div className="space-y-4 p-4">
          <Skeleton className="h-6 w-3/4" />
          <Skeleton className="h-4 w-1/2" />
          <Skeleton className="h-20 w-full" />
        </div>
      </MobileFrame>
    );
  }

  if (isError || !event) {
    return (
      <MobileFrame>
        <div className="flex min-h-screen flex-col items-center justify-center px-6 text-center">
          <p className="text-5xl">🤔</p>
          <h1 className="mt-4 text-xl font-bold">Événement introuvable</h1>
          <Link to="/" className="mt-6 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground">
            Retour à l'accueil
          </Link>
        </div>
      </MobileFrame>
    );
  }

  const c = counts[event.id] ?? { chaud: 0, going: 0 };
  const total = c.chaud + c.going;
  const cover = event.cover_url ?? "";
  const orgName = event.organizer?.display_name ?? event.organizer?.username ?? "Organisateur";
  const orgAvatar =
    event.organizer?.avatar_url ??
    `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(orgName)}&backgroundColor=E8593C`;
  const canEdit = !!user && (user.id === event.organizer_id || role === "admin");

  return (
    <MobileFrame>
      <div className="relative aspect-[4/5] w-full overflow-hidden bg-secondary">
        {cover ? (
          <img src={cover} alt={event.title} className="h-full w-full object-cover" />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-gradient-flame text-7xl">🔥</div>
        )}
        <div className="absolute inset-0 bg-gradient-to-b from-background/40 via-transparent to-background" />

        <Link
          to="/"
          aria-label="Retour"
          className="absolute left-4 top-4 flex h-10 w-10 items-center justify-center rounded-full bg-background/60 backdrop-blur-md pt-safe"
        >
          <ArrowLeft className="h-5 w-5 text-foreground" />
        </Link>

        {canEdit && (
          <Link
            to="/event/$eventId/edit"
            params={{ eventId: event.id }}
            aria-label="Modifier"
            className="absolute right-4 top-4 flex h-10 items-center gap-1.5 rounded-full bg-background/70 px-3 text-xs font-bold text-foreground backdrop-blur-md pt-safe"
          >
            <Pencil className="h-3.5 w-3.5" />
            Modifier
          </Link>
        )}

        <div className="absolute bottom-0 left-0 right-0 space-y-2 p-5">
          <CategoryBadge category={event.category as never} />
          <h1 className="text-2xl font-black leading-tight text-foreground">{event.title}</h1>
          <div className="flex items-center gap-2 text-sm text-foreground/90">
            <Calendar className="h-4 w-4" /> {dayLabelFromDate(event.event_date, event.event_time)} · {formatTime(event.event_time)}
          </div>
          <div className="flex items-center gap-2 text-sm text-foreground/90">
            <MapPin className="h-4 w-4" /> {event.location_name}
          </div>
        </div>
      </div>

      <div className="space-y-6 px-4 py-5">
        <div className="flex items-center gap-3 rounded-2xl border border-border bg-card p-3">
          <img src={orgAvatar} alt={orgName} className="h-11 w-11 rounded-full bg-secondary object-cover" />
          <div className="flex-1">
            <p className="text-xs uppercase tracking-wide text-muted-foreground">Organisateur</p>
            <p className="text-sm font-bold text-foreground">{orgName}</p>
          </div>
          <FollowButton organizerId={event.organizer_id} />
        </div>

        <div className="flex items-center gap-2">
          <div className="flex-1">
            <FlameButton eventId={event.id} size="lg" fullWidth />
          </div>
          <div>
            <FlameButton eventId={event.id} size="lg" variant="going" />
          </div>
        </div>

        <button
          onClick={() => {
            if (event.lat != null && event.lng != null) {
              window.open(`https://www.google.com/maps/dir/?api=1&destination=${event.lat},${event.lng}`, "_blank");
            } else {
              window.open(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(event.location_name)}`, "_blank");
            }
          }}
          className="flex w-full items-center justify-center gap-2 rounded-lg border border-border bg-secondary px-4 py-3 text-sm font-semibold text-foreground"
        >
          <Navigation className="h-4 w-4" />
          M'y conduire
        </button>

        <div className="flex items-center justify-between rounded-xl border border-border bg-card px-4 py-3">
          <span className="text-sm text-muted-foreground">Entrée</span>
          <span className="text-base font-bold text-foreground">{priceLabel(event)}</span>
        </div>

        {event.description && (
          <div>
            <h2 className="mb-2 text-sm font-bold uppercase tracking-wide text-muted-foreground">À propos</h2>
            <p className="whitespace-pre-line text-sm leading-relaxed text-foreground/90">{event.description}</p>
          </div>
        )}

        <div>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="flex items-center gap-1.5 text-sm font-bold uppercase tracking-wide text-muted-foreground">
              <Users className="h-4 w-4" /> Intéressés
            </h2>
            <span className="text-xs font-bold text-accent">
              <Flame className="mr-0.5 inline h-3 w-3" fill="currentColor" />
              {total}
            </span>
          </div>
          <p className="text-xs text-muted-foreground">
            🔥 {c.chaud} chaud{c.chaud > 1 ? "s" : ""} · ✅ {c.going} y va{c.going > 1 ? "ient" : ""}
          </p>
        </div>
      </div>

      <ShareButton
        title={event.title}
        date={dayLabelFromDate(event.event_date, event.event_time)}
        locationName={event.location_name}
      />
    </MobileFrame>
  );
}
