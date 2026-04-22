import { createFileRoute, Link, useParams, notFound } from "@tanstack/react-router";
import { ArrowLeft, MapPin, Calendar, Navigation, Share2, Flame, Users } from "lucide-react";
import { MobileFrame } from "@/components/MobileFrame";
import { CategoryBadge } from "@/components/CategoryBadge";
import { FlameButton } from "@/components/FlameButton";
import { EVENTS, FRIENDS } from "@/lib/mock-data";
import { useFlames } from "@/lib/flame-store";

export const Route = createFileRoute("/event/$eventId")({
  loader: ({ params }) => {
    const event = EVENTS.find((e) => e.id === params.eventId);
    if (!event) throw notFound();
    return { event };
  },
  head: ({ loaderData }) => {
    const e = loaderData?.event;
    if (!e) return { meta: [{ title: "Événement — EVENZO" }] };
    return {
      meta: [
        { title: `${e.title} — EVENZO` },
        { name: "description", content: e.description.slice(0, 160) },
        { property: "og:title", content: e.title },
        { property: "og:description", content: e.description.slice(0, 160) },
        { property: "og:image", content: e.cover },
        { name: "twitter:image", content: e.cover },
      ],
    };
  },
  notFoundComponent: () => (
    <MobileFrame>
      <div className="flex min-h-screen flex-col items-center justify-center px-6 text-center">
        <p className="text-5xl">🤔</p>
        <h1 className="mt-4 text-xl font-bold">Événement introuvable</h1>
        <Link to="/" className="mt-6 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground">
          Retour à l'accueil
        </Link>
      </div>
    </MobileFrame>
  ),
  component: EventDetailPage,
});

function EventDetailPage() {
  const { eventId } = useParams({ from: "/event/$eventId" });
  const event = EVENTS.find((e) => e.id === eventId)!;
  const { counts } = useFlames();
  const total = counts[event.id] ?? event.flameCount;

  // Simulate broader interested list = hot friends + extras
  const interested = [...event.hotFriends, ...FRIENDS.filter((f) => !event.hotFriends.find((h) => h.id === f.id))].slice(0, 12);

  return (
    <MobileFrame>
      {/* Hero */}
      <div className="relative aspect-[4/5] w-full overflow-hidden">
        <img src={event.cover} alt={event.title} className="h-full w-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-b from-background/40 via-transparent to-background" />

        <Link
          to="/"
          aria-label="Retour"
          className="absolute left-4 top-4 flex h-10 w-10 items-center justify-center rounded-full bg-background/60 backdrop-blur-md pt-safe"
        >
          <ArrowLeft className="h-5 w-5 text-foreground" />
        </Link>

        <div className="absolute bottom-0 left-0 right-0 space-y-2 p-5">
          <CategoryBadge category={event.category} />
          <h1 className="text-2xl font-black leading-tight text-foreground">{event.title}</h1>
          <div className="flex items-center gap-2 text-sm text-foreground/90">
            <Calendar className="h-4 w-4" /> {event.date} · {event.time}
          </div>
          <div className="flex items-center gap-2 text-sm text-foreground/90">
            <MapPin className="h-4 w-4" /> {event.location}
          </div>
        </div>
      </div>

      <div className="space-y-6 px-4 py-5">
        {/* Organizer */}
        <div className="flex items-center gap-3 rounded-2xl border border-border bg-card p-3">
          <img src={event.organizer.avatar} alt={event.organizer.name} className="h-11 w-11 rounded-full bg-secondary object-cover" />
          <div className="flex-1">
            <p className="text-xs uppercase tracking-wide text-muted-foreground">Organisateur</p>
            <p className="text-sm font-bold text-foreground">{event.organizer.name}</p>
          </div>
          <button className="rounded-lg border border-border bg-secondary px-3 py-1.5 text-xs font-semibold text-foreground">
            Suivre
          </button>
        </div>

        {/* Hot friends */}
        {event.hotFriends.length > 0 && (
          <div className="rounded-2xl bg-gradient-to-br from-primary/15 to-accent/10 border border-primary/30 p-4">
            <div className="flex items-center gap-3">
              <div className="flex -space-x-2">
                {event.hotFriends.slice(0, 4).map((f) => (
                  <img
                    key={f.id}
                    src={f.avatar}
                    alt={f.name}
                    className="h-9 w-9 rounded-full border-2 border-card bg-secondary"
                  />
                ))}
              </div>
              <p className="flex-1 text-sm font-semibold text-foreground">
                <Flame className="mr-1 inline h-4 w-4 text-primary" fill="currentColor" />
                {event.hotFriends.slice(0, 2).map((f) => f.name).join(", ")}
                {event.hotFriends.length > 2 && (
                  <> et <span className="text-primary">{event.hotFriends.length - 2} autres amis</span></>
                )}
                <span className="block text-xs font-normal text-muted-foreground">sont chauds pour cet événement</span>
              </p>
            </div>
          </div>
        )}

        {/* CTAs */}
        <div className="flex items-center gap-2">
          <div className="flex-1">
            <FlameButton eventId={event.id} size="lg" fullWidth />
          </div>
          <button
            className="inline-flex h-14 items-center justify-center gap-1.5 rounded-lg border border-border bg-secondary px-4 text-sm font-semibold text-foreground"
          >
            <Navigation className="h-4 w-4" />
            M'y conduire
          </button>
        </div>

        {/* Price */}
        <div className="flex items-center justify-between rounded-xl border border-border bg-card px-4 py-3">
          <span className="text-sm text-muted-foreground">Entrée</span>
          <span className="text-base font-bold text-foreground">
            {event.isFree ? "Gratuit" : event.price}
          </span>
        </div>

        {/* Description */}
        <div>
          <h2 className="mb-2 text-sm font-bold uppercase tracking-wide text-muted-foreground">À propos</h2>
          <p className="text-sm leading-relaxed text-foreground/90">{event.description}</p>
        </div>

        {/* Interested */}
        <div>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-sm font-bold uppercase tracking-wide text-muted-foreground flex items-center gap-1.5">
              <Users className="h-4 w-4" /> Intéressés
            </h2>
            <span className="text-xs font-bold text-accent">
              <Flame className="mr-0.5 inline h-3 w-3" fill="currentColor" />
              {total}
            </span>
          </div>
          <div className="grid grid-cols-6 gap-2">
            {interested.map((f) => (
              <div key={f.id} className="flex flex-col items-center gap-1">
                <img src={f.avatar} alt={f.name} className="h-12 w-12 rounded-full bg-secondary object-cover" />
                <p className="w-full truncate text-center text-[10px] text-muted-foreground">{f.name}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Comments stub */}
        <div>
          <h2 className="mb-2 text-sm font-bold uppercase tracking-wide text-muted-foreground">Discussion</h2>
          <div className="rounded-2xl border border-dashed border-border bg-card p-6 text-center">
            <p className="text-sm text-muted-foreground">Sois le premier à poser une question 💬</p>
          </div>
        </div>
      </div>

      {/* Floating share */}
      <button
        aria-label="Partager"
        className="fixed bottom-24 right-4 z-30 flex h-12 w-12 items-center justify-center rounded-full bg-card shadow-elevated border border-border md:right-[max(1rem,calc(50%-215px+1rem))]"
      >
        <Share2 className="h-5 w-5 text-foreground" />
      </button>
    </MobileFrame>
  );
}
