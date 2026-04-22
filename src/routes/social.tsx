import { createFileRoute } from "@tanstack/react-router";
import { Search, UserPlus, Flame } from "lucide-react";
import { MobileFrame } from "@/components/MobileFrame";
import { EVENTS, FRIENDS } from "@/lib/mock-data";

export const Route = createFileRoute("/social")({
  head: () => ({
    meta: [
      { title: "Social — EVENZO" },
      { name: "description", content: "Suis l'activité de tes amis et découvre où ils vont ce soir." },
      { property: "og:title", content: "Social — EVENZO" },
      { property: "og:description", content: "Vois où vont tes amis ce soir." },
    ],
  }),
  component: SocialPage,
});

type Activity = {
  id: string;
  friendId: string;
  type: "hot" | "organize" | "arrived";
  eventId: string;
  time: string;
};

const ACTIVITY: Activity[] = [
  { id: "a1", friendId: "f1", type: "hot", eventId: "e1", time: "il y a 5 min" },
  { id: "a2", friendId: "f2", type: "organize", eventId: "e6", time: "il y a 12 min" },
  { id: "a3", friendId: "f4", type: "arrived", eventId: "e3", time: "il y a 32 min" },
  { id: "a4", friendId: "f3", type: "hot", eventId: "e2", time: "il y a 1 h" },
  { id: "a5", friendId: "f6", type: "hot", eventId: "e1", time: "il y a 2 h" },
  { id: "a6", friendId: "f7", type: "organize", eventId: "e4", time: "il y a 3 h" },
];

const SUGGESTIONS = [
  { id: "s1", name: "Ama Bénédicte", avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Ama&backgroundColor=8b5cf6", mutuals: 5 },
  { id: "s2", name: "Edem Kossi", avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Edem&backgroundColor=10b981", mutuals: 3 },
  { id: "s3", name: "Mensah Lucia", avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Lucia&backgroundColor=f59e0b", mutuals: 8 },
];

function activityText(a: Activity) {
  const friend = FRIENDS.find((f) => f.id === a.friendId)!;
  const event = EVENTS.find((e) => e.id === a.eventId)!;
  switch (a.type) {
    case "hot":
      return (
        <>
          <span className="font-bold text-foreground">{friend.name}</span>{" "}
          <span className="text-muted-foreground">est </span>
          <span className="font-semibold text-accent">🔥 chaud</span>{" "}
          <span className="text-muted-foreground">pour</span>{" "}
          <span className="font-semibold text-foreground">{event.title}</span>
        </>
      );
    case "organize":
      return (
        <>
          <span className="font-bold text-foreground">{friend.name}</span>{" "}
          <span className="text-muted-foreground">organise</span>{" "}
          <span className="font-semibold text-foreground">{event.title}</span>
        </>
      );
    case "arrived":
      return (
        <>
          <span className="font-bold text-foreground">{friend.name}</span>{" "}
          <span className="text-muted-foreground">vient d'arriver à</span>{" "}
          <span className="font-semibold text-foreground">{event.title}</span>
        </>
      );
  }
}

function SocialPage() {
  return (
    <MobileFrame>
      <header className="sticky top-0 z-30 border-b border-border bg-background/85 px-4 pt-safe pt-4 pb-3 backdrop-blur-xl">
        <h1 className="mb-3 text-2xl font-black text-foreground">Social</h1>
        <div className="flex items-center gap-2 rounded-xl border border-border bg-secondary px-3 py-2">
          <Search className="h-4 w-4 text-muted-foreground" />
          <input
            placeholder="Chercher des amis…"
            className="flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground focus:outline-none"
          />
        </div>
      </header>

      {/* Friends row */}
      <section className="px-4 py-4">
        <h2 className="mb-3 text-sm font-bold uppercase tracking-wide text-muted-foreground">
          Mes amis
        </h2>
        <div className="no-scrollbar flex gap-3 overflow-x-auto">
          {FRIENDS.map((f) => (
            <button key={f.id} className="flex shrink-0 flex-col items-center gap-1.5">
              <div className="relative">
                <img
                  src={f.avatar}
                  alt={f.name}
                  className="h-14 w-14 rounded-full border-2 border-border bg-secondary object-cover"
                />
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
                <div className="relative">
                  <img
                    src={friend.avatar}
                    alt={friend.name}
                    className="h-11 w-11 rounded-full bg-secondary object-cover"
                  />
                  {a.type === "hot" && (
                    <span className="absolute -bottom-0.5 -right-0.5 flex h-5 w-5 items-center justify-center rounded-full bg-gradient-flame text-[10px]">
                      🔥
                    </span>
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm leading-snug">{activityText(a)}</p>
                  <p className="mt-0.5 text-[11px] text-muted-foreground">{a.time}</p>
                </div>
                <img
                  src={event.cover}
                  alt={event.title}
                  className="h-12 w-12 shrink-0 rounded-lg object-cover"
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
              <img src={s.avatar} alt={s.name} className="h-12 w-12 rounded-full bg-secondary object-cover" />
              <div className="flex-1">
                <p className="text-sm font-semibold text-foreground">{s.name}</p>
                <p className="text-xs text-muted-foreground">
                  <Flame className="mr-0.5 inline h-3 w-3 text-accent" />
                  {s.mutuals} amis en commun
                </p>
              </div>
              <button className="inline-flex items-center gap-1 rounded-lg bg-primary px-3 py-2 text-xs font-bold text-primary-foreground transition-all hover:brightness-110">
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
