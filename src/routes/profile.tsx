import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Settings, Calendar, Image as ImageIcon, Flame } from "lucide-react";
import { MobileFrame } from "@/components/MobileFrame";
import { EVENTS, ME } from "@/lib/mock-data";
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
  { key: "photos", label: "Photos", icon: ImageIcon },
  { key: "flames", label: "Flammes", icon: Flame },
] as const;

function ProfilePage() {
  const [tab, setTab] = useState<(typeof TABS)[number]["key"]>("events");
  const myEvents = EVENTS.slice(0, 4);

  return (
    <MobileFrame>
      {/* Cover gradient */}
      <div
        className="relative h-[140px]"
        style={{ background: "linear-gradient(180deg, #E8593C 0%, #0A0A0A 100%)" }}
      >
        <button
          aria-label="Paramètres"
          className="absolute right-4 top-4 flex h-10 w-10 items-center justify-center rounded-full bg-background/40 text-foreground backdrop-blur-md pt-safe"
        >
          <Settings className="h-[22px] w-[22px]" strokeWidth={1.75} />
        </button>
      </div>

      {/* Avatar overlapping cover */}
      <div className="relative px-4">
        <div
          className="absolute -top-10 left-4 rounded-full"
          style={{ background: "#E8593C", padding: "3px" }}
        >
          <img
            src={ME.avatar}
            alt="Mon avatar"
            className="h-20 w-20 rounded-full border-2 border-background bg-secondary object-cover"
          />
        </div>

        {/* Name + bio */}
        <div className="pt-12">
          <h1 className="text-xl font-bold text-foreground">Kvsmir</h1>
          <p className="text-sm text-muted-foreground">@kvsmir</p>
          <p className="mt-2 text-[13px] text-muted-foreground">
            Amateur de soirées 🔥 Lomé, Togo
          </p>
        </div>

        {/* Stats row */}
        <div className="mt-5 flex items-center justify-around rounded-2xl border border-border bg-card py-3">
          <Stat value="24" label="Amis" />
          <div className="h-10 w-px bg-border" />
          <Stat value="12" label="Événements" />
          <div className="h-10 w-px bg-border" />
          <Stat value="3" label="Organisés" />
        </div>

        {/* Edit profile */}
        <button
          className="mt-3 h-10 w-full rounded-lg border text-[13px] font-semibold text-foreground transition-colors hover:bg-surface-elevated"
          style={{ borderColor: "#333" }}
        >
          Modifier le profil
        </button>
      </div>

      {/* Tabs */}
      <div className="mt-6 border-b border-border px-4">
        <div className="flex">
          {TABS.map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              onClick={() => setTab(key)}
              className={cn(
                "relative flex flex-1 items-center justify-center gap-1.5 py-3 text-sm font-semibold transition-colors",
                tab === key ? "text-accent" : "text-muted-foreground hover:text-foreground",
              )}
            >
              <Icon className="h-4 w-4" />
              {label}
              {tab === key && (
                <span
                  className="absolute -bottom-px left-2 right-2 h-[3px] rounded-t-full"
                  style={{ background: "#E8593C" }}
                />
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
              <div key={e.id} className="overflow-hidden">
                <div className="relative aspect-square overflow-hidden rounded-lg">
                  <img src={e.cover} alt={e.title} className="h-full w-full object-cover" />
                </div>
                <p className="mt-2 line-clamp-2 text-xs font-semibold text-foreground">{e.title}</p>
                <p className="text-[11px] text-muted-foreground">{e.dayLabel} · {e.time}</p>
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
              <div
                key={e.id}
                className="flex items-center gap-3 rounded-xl border border-border bg-card p-3"
              >
                <img src={e.cover} alt="" className="h-12 w-12 rounded-lg object-cover" />
                <div className="min-w-0 flex-1">
                  <p className="line-clamp-1 text-sm font-semibold text-foreground">{e.title}</p>
                  <p className="text-xs text-muted-foreground">
                    {e.dayLabel} · {e.time}
                  </p>
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
    <div className="flex flex-1 flex-col items-center">
      <p className="text-lg font-bold text-foreground">{value}</p>
      <p className="text-[11px] text-muted-foreground">{label}</p>
    </div>
  );
}
