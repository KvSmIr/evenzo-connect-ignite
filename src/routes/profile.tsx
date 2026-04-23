import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Settings, Calendar, Image as ImageIcon, Flame, BadgeCheck, Shield, LogOut, Eye, X } from "lucide-react";
import { MobileFrame } from "@/components/MobileFrame";
import { EVENTS, ME } from "@/lib/mock-data";
import { useAuth } from "@/lib/auth-store";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/profile")({
  head: () => ({
    meta: [
      { title: "Profil — EVENZO" },
      { name: "description", content: "Ton profil EVENZO." },
    ],
  }),
  component: ProfilePage,
});

type MyEvent = {
  id: string;
  title: string;
  event_date: string;
  cover_url: string | null;
  status: string;
  view_count: number;
};

function ProfilePage() {
  const { user, profile, role, signOut } = useAuth();
  const isOrg = role === "organizer" || role === "admin";

  const tabs = [
    ...(isOrg ? [{ key: "mine", label: "Mes Événements", icon: BadgeCheck }] : []),
    { key: "events", label: "Événements", icon: Calendar },
    { key: "photos", label: "Photos", icon: ImageIcon },
    { key: "flames", label: "Flammes", icon: Flame },
  ] as const;

  const [tab, setTab] = useState<string>(isOrg ? "mine" : "events");
  const [myEvents, setMyEvents] = useState<MyEvent[]>([]);

  useEffect(() => {
    if (!isOrg || !user) return;
    supabase
      .from("events")
      .select("id,title,event_date,cover_url,status,view_count")
      .eq("organizer_id", user.id)
      .order("created_at", { ascending: false })
      .then(({ data }) => setMyEvents((data as MyEvent[]) ?? []));
  }, [isOrg, user]);

  const cancelEvent = async (id: string) => {
    if (!confirm("Annuler cet événement ?")) return;
    await supabase.from("events").update({ status: "cancelled" }).eq("id", id);
    setMyEvents((prev) => prev.map((e) => (e.id === id ? { ...e, status: "cancelled" } : e)));
  };

  const displayName = profile?.display_name ?? "Kvsmir";
  const username = profile?.username ?? "kvsmir";

  return (
    <MobileFrame>
      <div
        className="relative h-[140px]"
        style={{ background: "linear-gradient(180deg, #E8593C 0%, #0A0A0A 100%)" }}
      >
        <div className="absolute right-4 top-4 flex gap-2 pt-safe">
          {role === "admin" && (
            <Link
              to="/admin"
              aria-label="Admin"
              className="flex h-10 w-10 items-center justify-center rounded-full bg-background/40 text-foreground backdrop-blur-md"
            >
              <Shield className="h-5 w-5" />
            </Link>
          )}
          {user ? (
            <button
              onClick={signOut}
              aria-label="Déconnexion"
              className="flex h-10 w-10 items-center justify-center rounded-full bg-background/40 text-foreground backdrop-blur-md"
            >
              <LogOut className="h-5 w-5" />
            </button>
          ) : (
            <Link
              to="/auth"
              className="flex h-10 items-center justify-center rounded-full bg-background/40 px-3 text-xs font-semibold text-foreground backdrop-blur-md"
            >
              Connexion
            </Link>
          )}
          <button
            aria-label="Paramètres"
            className="flex h-10 w-10 items-center justify-center rounded-full bg-background/40 text-foreground backdrop-blur-md"
          >
            <Settings className="h-[22px] w-[22px]" strokeWidth={1.75} />
          </button>
        </div>
      </div>

      <div className="relative px-4">
        <div
          className="absolute -top-10 left-4 rounded-full"
          style={{ background: "#E8593C", padding: "3px" }}
        >
          <img
            src={profile?.avatar_url ?? ME.avatar}
            alt="Avatar"
            className="h-20 w-20 rounded-full border-2 border-background bg-secondary object-cover"
          />
        </div>

        <div className="pt-12">
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-foreground">{displayName}</h1>
            {isOrg && (
              <span className="flex items-center gap-1 rounded-full bg-primary/15 px-2 py-0.5 text-[10px] font-bold text-primary">
                <BadgeCheck className="h-3 w-3" /> {role === "admin" ? "ADMIN" : "ORGANISATEUR"}
              </span>
            )}
          </div>
          <p className="text-sm text-muted-foreground">@{username}</p>
          <p className="mt-2 text-[13px] text-muted-foreground">
            {profile?.bio ?? "Amateur de soirées 🔥 Lomé, Togo"}
          </p>
        </div>

        <div className="mt-5 flex items-center justify-around rounded-2xl border border-border bg-card py-3">
          <Stat value="24" label="Amis" />
          <div className="h-10 w-px bg-border" />
          <Stat value="12" label="Événements" />
          <div className="h-10 w-px bg-border" />
          <Stat value={String(myEvents.length || 3)} label="Organisés" />
        </div>

        <button
          className="mt-3 h-10 w-full rounded-lg border text-[13px] font-semibold text-foreground"
          style={{ borderColor: "#333" }}
        >
          Modifier le profil
        </button>
      </div>

      <div className="no-scrollbar mt-6 overflow-x-auto border-b border-border px-4">
        <div className="flex min-w-max">
          {tabs.map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              onClick={() => setTab(key)}
              className={cn(
                "relative flex items-center justify-center gap-1.5 px-4 py-3 text-sm font-semibold transition-colors",
                tab === key ? "text-accent" : "text-muted-foreground"
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

      <section className="px-4 py-4">
        {tab === "mine" && (
          <div className="space-y-3 animate-fade-in">
            {myEvents.length === 0 && (
              <div className="rounded-xl border border-border bg-card p-6 text-center">
                <p className="text-3xl">🎯</p>
                <p className="mt-2 text-sm text-muted-foreground">
                  Aucun événement créé pour l'instant.
                </p>
                <Link
                  to="/create-event"
                  className="mt-4 inline-flex h-10 items-center rounded-lg bg-gradient-flame px-4 text-sm font-bold text-primary-foreground shadow-flame"
                >
                  Créer mon premier événement
                </Link>
              </div>
            )}
            {myEvents.map((e) => (
              <article key={e.id} className="overflow-hidden rounded-xl border border-border bg-card">
                <div className="flex gap-3 p-3">
                  {e.cover_url ? (
                    <img src={e.cover_url} alt="" className="h-16 w-16 rounded-lg object-cover" />
                  ) : (
                    <div className="flex h-16 w-16 items-center justify-center rounded-lg bg-secondary text-2xl">
                      🔥
                    </div>
                  )}
                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="line-clamp-1 text-sm font-bold text-foreground">{e.title}</h3>
                      <StatusBadge status={e.status} />
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {new Date(e.event_date).toLocaleDateString("fr-FR")}
                    </p>
                    <p className="mt-1 flex items-center gap-3 text-[11px] text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Eye className="h-3 w-3" /> {e.view_count}
                      </span>
                      <span>🔥 0</span>
                      <span>✅ 0</span>
                    </p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-px bg-border">
                  <button className="bg-card py-2 text-xs font-semibold text-foreground">
                    Modifier
                  </button>
                  <button
                    onClick={() => cancelEvent(e.id)}
                    className="flex items-center justify-center gap-1 bg-card py-2 text-xs font-semibold text-destructive"
                  >
                    <X className="h-3 w-3" /> Annuler
                  </button>
                </div>
              </article>
            ))}
          </div>
        )}

        {tab === "events" && (
          <div className="grid grid-cols-2 gap-3 animate-fade-in">
            {EVENTS.slice(0, 4).map((e) => (
              <div key={e.id}>
                <div className="relative aspect-square overflow-hidden rounded-lg">
                  <img src={e.cover} alt={e.title} className="h-full w-full object-cover" />
                </div>
                <p className="mt-2 line-clamp-2 text-xs font-semibold text-foreground">{e.title}</p>
                <p className="text-[11px] text-muted-foreground">
                  {e.dayLabel} · {e.time}
                </p>
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

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { label: string; className: string }> = {
    published: { label: "Publié", className: "bg-success/20 text-success" },
    draft: { label: "Brouillon", className: "bg-secondary text-muted-foreground" },
    cancelled: { label: "Annulé", className: "bg-destructive/20 text-destructive" },
  };
  const s = map[status] ?? map.draft;
  return (
    <span className={cn("shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold", s.className)}>
      {s.label}
    </span>
  );
}
