import { createFileRoute } from "@tanstack/react-router";
import { Search, UserPlus, Flame } from "lucide-react";
import { MobileFrame } from "@/components/MobileFrame";
import { EVENTS, FRIENDS } from "@/lib/mock-data";

export const Route = createFileRoute("/social")({
  head: () => ({
    meta: [
      { title: "Mes Amis — EVENZO" },
      { name: "description", content: "Suis l'activité de tes amis et découvre où ils vont ce soir." },
      { property: "og:title", content: "Mes Amis — EVENZO" },
      { property: "og:description", content: "Vois où vont tes amis ce soir." },
    ],
  }),
  component: SocialPage,
});

type Activity = {
  id: string;
  friendId: string;
  type: "hot" | "going" | "organize";
  eventId: string;
  time: string;
};

const ACTIVITY: Activity[] = [
  { id: "a1", friendId: "f1", type: "hot", eventId: "e1", time: "il y a 5 min" },
  { id: "a2", friendId: "f2", type: "going", eventId: "e2", time: "il y a 23 min" },
  { id: "a3", friendId: "f3", type: "organize", eventId: "e3", time: "il y a 1h" },
  { id: "a4", friendId: "f4", type: "hot", eventId: "e6", time: "il y a 2h" },
  { id: "a5", friendId: "f5", type: "going", eventId: "e4", time: "il y a 3h" },
];

const SUGGESTIONS = [
  {
    id: "s1",
    name: "Ama Bénédicte",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Ama&backgroundColor=8b5cf6",
    mutuals: 5,
  },
  {
    id: "s2",
    name: "Edem Kossi",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Edem&backgroundColor=10b981",
    mutuals: 3,
  },
  {
    id: "s3",
    name: "Mensah Lucia",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Lucia&backgroundColor=f59e0b",
    mutuals: 8,
  },
];

function activityIcon(type: Activity["type"]) {
  switch (type) {
    case "hot":
      return "🔥";
    case "going":
      return "✅";
    case "organize":
      return "🎉";
  }
}

function activityVerb(type: Activity["type"]) {
  switch (type) {
    case "hot":
      return "est chaud pour";
    case "going":
      return "va à";
    case "organize":
      return "organise";
  }
}

function SocialPage() {
  return (
    <MobileFrame>
      {/* Header */}
      <header className="sticky top-0 z-30 border-b border-border bg-background/85 px-4 pt-safe pb-3 pt-4 backdrop-blur-xl">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-black text-foreground">Mes Amis</h1>
          <button
            aria-label="Rechercher"
            className="flex h-10 w-10 items-center justify-center rounded-full bg-secondary text-foreground transition-colors hover:bg-surface-elevated"
          >
            <Search className="h-5 w-5" />
          </button>
        </div>
      </header>

      {/* Friends online strip */}
      <section className="px-4 py-4">
        <div className="no-scrollbar flex gap-4 overflow-x-auto">
          {FRIENDS.map((f) => (
            <button key={f.id} className="flex shrink-0 flex-col items-center gap-1.5">
              <div className="relative">
                <div
                  className="rounded-full p-[2.5px]"
                  style={{
                    background: f.online ? "#F97316" : "#3F3F46",
                  }}
                >
                  <img
                    src={f.avatar}
                    alt={f.name}
                    className="h-16 w-16 rounded-full border-2 border-background bg-secondary object-cover"
                  />
                </div>
                {f.online && (
                  <span className="absolute bottom-0 right-0 h-3.5 w-3.5 rounded-full bg-online ring-2 ring-background" />
                )}
              </div>
              <span className="max-w-[64px] truncate text-[11px] font-medium text-foreground">
                {f.name}
              </span>
            </button>
          ))}
        </div>
      </section>

      {/* Activity feed */}
      <section className="px-4">
        <h2 className="mb-3 text-sm font-bold uppercase tracking-wide text-muted-foreground">
          Activité récente
        </h2>
        <ul className="space-y-2">
          {ACTIVITY.map((a, i) => {
            const friend = FRIENDS.find((f) => f.id === a.friendId)!;
            const event = EVENTS.find((e) => e.id === a.eventId)!;
            return (
              <li
                key={a.id}
                className="animate-fade-up flex items-center gap-3 rounded-2xl border border-border bg-card p-3"
                style={{ animationDelay: `${i * 60}ms` }}
              >
                <div
                  className="shrink-0 rounded-full p-[2px]"
                  style={{ background: "#F97316" }}
                >
                  <img
                    src={friend.avatar}
                    alt={friend.name}
                    className="h-11 w-11 rounded-full border border-background bg-secondary object-cover"
                  />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-[13px] leading-snug">
                    <span className="mr-1 text-base">{activityIcon(a.type)}</span>
                    <span className="text-sm font-bold text-foreground">{friend.name}</span>{" "}
                    <span className="text-muted-foreground">{activityVerb(a.type)}</span>{" "}
                    <span className="font-semibold text-accent">{event.title}</span>
                  </p>
                  <p className="mt-1 text-[11px] text-muted-foreground">{a.time}</p>
                </div>
                <img
                  src={event.cover}
                  alt={event.title}
                  className="h-14 w-14 shrink-0 rounded-lg object-cover"
                />
              </li>
            );
          })}
        </ul>
      </section>

      {/* Suggestions */}
      <section className="px-4 py-6">
        <h2 className="mb-3 text-sm font-bold uppercase tracking-wide text-muted-foreground">
          Suggestions d'amis
        </h2>
        <div className="space-y-2">
          {SUGGESTIONS.map((s) => (
            <div
              key={s.id}
              className="flex items-center gap-3 rounded-2xl border border-border bg-card p-3"
            >
              <img
                src={s.avatar}
                alt={s.name}
                className="h-12 w-12 rounded-full bg-secondary object-cover"
              />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-bold text-foreground">{s.name}</p>
                <p className="text-xs text-muted-foreground">
                  <Flame className="mr-0.5 inline h-3 w-3 text-accent" />
                  {s.mutuals} amis en commun
                </p>
              </div>
              <button className="inline-flex shrink-0 items-center gap-1 rounded-full border border-primary bg-transparent px-3 py-1.5 text-[13px] font-bold text-accent transition-all hover:bg-primary/10">
                <UserPlus className="h-3.5 w-3.5" />
                Ajouter
              </button>
            </div>
          ))}
        </div>
      </section>
    </MobileFrame>
  );
}
