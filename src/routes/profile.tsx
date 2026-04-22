import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Settings, Edit3, Calendar, Image, Flame } from "lucide-react";
import { MobileFrame } from "@/components/MobileFrame";
import { EVENTS, ME } from "@/lib/mock-data";
import { CategoryBadge } from "@/components/CategoryBadge";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/profile")({
  head: () => ({
    meta: [
      { title: "Profil — EVENZO" },
      { name: "description", content: "Ton profil EVENZO : tes événements, tes amis, tes flammes." },
      { property: "og:title", content: "Mon profil — EVENZO" },
      { property: "og:description", content: "Mes événements et mes flammes." },
    ],
  }),
  component: ProfilePage,
});

const TABS = [
  { key: "events", label: "Événements", icon: Calendar },
  { key: "photos", label: "Photos", icon: Image },
  { key: "flames", label: "Flammes", icon: Flame },
] as const;

function ProfilePage() {
  const [tab, setTab] = useState<(typeof TABS)[number]["key"]>("events");
  const myEvents = EVENTS.slice(0, 4);

  return (
    <MobileFrame>
      {/* Cover */}
      <div className="relative h-44 bg-gradient-flame">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent to-background" />
        <button
          aria-label="Paramètres"
          className="absolute right-4 top-4 flex h-10 w-10 items-center justify-center rounded-full bg-background/40 backdrop-blur-md pt-safe"
        >
          <Settings className="h-5 w-5 text-foreground" />
        </button>
      </div>

      {/* Avatar + Name */}
      <div className="relative -mt-12 px-4">
        <div className="rounded-full border-[3px] border-primary inline-block">
          <img
            src={ME.avatar}
            alt="Mon avatar"
            className="h-20 w-20 rounded-full border-2 border-background bg-secondary object-cover"
          />
        </div>
        <div className="mt-3">
          <h1 className="text-xl font-black text-foreground">Aïssa K.</h1>
          <p className="text-sm text-muted-foreground">@aissa_lome</p>
          <p className="mt-2 text-sm text-foreground/90">
            Événementielle 🔥 · Lomé · Toujours là où ça bouge.
          </p>
        </div>

        {/* Stats */}
        <div className="mt-4 grid grid-cols-3 divide-x divide-border rounded-2xl border border-border bg-card py-3 text-center">
          <Stat value="142" label="Amis" />
          <Stat value="38" label="Événements" />
          <Stat value="7" label="Organisés" />
        </div>

        <button className="mt-3 flex h-10 w-full items-center justify-center gap-2 rounded-lg border border-border bg-secondary text-sm font-semibold text-foreground transition-colors hover:bg-surface-elevated">
          <Edit3 className="h-4 w-4" />
          Modifier le profil
        </button>
      </div>

      {/* Tabs */}
      <div className="mt-6 border-b border-border px-4">
        <div className="flex gap-1">
          {TABS.map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              onClick={() => setTab(key)}
              className={cn(
                "relative flex flex-1 items-center justify-center gap-1.5 py-3 text-sm font-semibold transition-colors",
                tab === key ? "text-primary" : "text-muted-foreground hover:text-foreground"
              )}
            >
              <Icon className="h-4 w-4" />
              {label}
              {tab === key && (
                <span className="absolute bottom-0 left-2 right-2 h-0.5 rounded-full bg-primary" />
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Tab content */}
      <section className="px-4 py-4">
        {tab === "events" && (
          <div className="grid grid-cols-2 gap-3 animate-fade-in">
            {myEvents.map((e) => (
              <div key={e.id} className="overflow-hidden rounded-xl border border-border bg-card">
                <div className="relative aspect-square">
                  <img src={e.cover} alt={e.title} className="h-full w-full object-cover" />
                  <div className="absolute inset-0 bg-card-overlay" />
                  <div className="absolute left-2 top-2">
                    <CategoryBadge category={e.category} />
                  </div>
                  <div className="absolute bottom-2 left-2 right-2">
                    <p className="line-clamp-2 text-xs font-bold text-foreground">{e.title}</p>
                    <p className="text-[10px] text-accent">{e.dayLabel}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
        {tab === "photos" && (
          <div className="grid grid-cols-3 gap-1 animate-fade-in">
            {EVENTS.map((e) => (
              <img
                key={e.id}
                src={e.cover}
                alt=""
                className="aspect-square w-full rounded-md object-cover"
              />
            ))}
          </div>
        )}
        {tab === "flames" && (
          <div className="space-y-2 animate-fade-in">
            {EVENTS.slice(0, 3).map((e) => (
              <div key={e.id} className="flex items-center gap-3 rounded-xl border border-border bg-card p-3">
                <img src={e.cover} alt="" className="h-12 w-12 rounded-lg object-cover" />
                <div className="flex-1">
                  <p className="text-sm font-semibold text-foreground line-clamp-1">{e.title}</p>
                  <p className="text-xs text-muted-foreground">{e.dayLabel} · {e.time}</p>
                </div>
                <span className="rounded-full bg-gradient-flame px-2.5 py-1 text-[11px] font-bold text-primary-foreground">
                  🔥 Chaud
                </span>
              </div>
            ))}
          </div>
        )}
      </section>
    </MobileFrame>
  );
}

function Stat({ value, label }: { value: string; label: string }) {
  return (
    <div>
      <p className="text-lg font-black text-foreground">{value}</p>
      <p className="text-[11px] uppercase tracking-wide text-muted-foreground">{label}</p>
    </div>
  );
}
