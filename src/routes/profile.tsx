import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Settings, Calendar, Image as ImageIcon, Flame, BadgeCheck, Shield, X, Eye } from "lucide-react";
import { MobileFrame } from "@/components/MobileFrame";
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
  const { user, profile, role, loading } = useAuth();
  const navigate = useNavigate();
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

  if (loading) {
    return (
      <MobileFrame>
        <div className="flex min-h-[50vh] items-center justify-center">
          <div className="text-3xl animate-flame-flicker">🔥</div>
        </div>
      </MobileFrame>
    );
  }

  if (!user) {
    return (
      <MobileFrame>
        <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 px-6 text-center">
          <p className="text-5xl">👋</p>
          <h1 className="text-xl font-bold text-foreground">Connecte-toi</h1>
          <p className="text-sm text-muted-foreground">Crée ton profil pour suivre les événements et tes amis.</p>
          <Link to="/auth" className="rounded-lg bg-gradient-flame px-5 py-2.5 text-sm font-bold text-primary-foreground shadow-flame">
            Se connecter
          </Link>
        </div>
      </MobileFrame>
    );
  }

  const displayName = profile?.display_name ?? profile?.username ?? "Profil";
  const username = profile?.username ?? "";
  const avatarUrl =
    profile?.avatar_url ??
    `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(user.id)}&backgroundColor=E8593C`;

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
          <button
            onClick={() => navigate({ to: "/settings" })}
            aria-label="Paramètres"
            className="flex h-10 w-10 items-center justify-center rounded-full bg-background/40 text-foreground backdrop-blur-md"
          >
            <Settings className="h-[22px] w-[22px]" strokeWidth={1.75} />
          </button>
        </div>
      </div>

      <div className="relative px-4">
        <div className="absolute -top-10 left-4 rounded-full" style={{ background: "#E8593C", padding: "3px" }}>
          <img
            src={avatarUrl}
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
          {username && <p className="text-sm text-muted-foreground">@{username}</p>}
          <p className="mt-2 text-[13px] text-muted-foreground">
            {profile?.bio ?? "Amateur de soirées 🔥 Lomé, Togo"}
          </p>
        </div>

        <div className="mt-5 flex items-center justify-around rounded-2xl border border-border bg-card py-3">
          <Stat value="0" label="Amis" />
          <div className="h-10 w-px bg-border" />
          <Stat value="0" label="Événements" />
          <div className="h-10 w-px bg-border" />
          <Stat value={String(myEvents.length)} label="Organisés" />
        </div>

        <button
          onClick={() => navigate({ to: "/edit-profile" })}
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
                <span className="absolute -bottom-px left-2 right-2 h-[3px] rounded-t-full" style={{ background: "#E8593C" }} />
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
                <p className="mt-2 text-sm text-muted-foreground">Aucun événement créé pour l'instant.</p>
                <Link to="/create-event" className="mt-4 inline-flex h-10 items-center rounded-lg bg-gradient-flame px-4 text-sm font-bold text-primary-foreground shadow-flame">
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
                    <div className="flex h-16 w-16 items-center justify-center rounded-lg bg-secondary text-2xl">🔥</div>
                  )}
                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="line-clamp-1 text-sm font-bold text-foreground">{e.title}</h3>
                      <StatusBadge status={e.status} />
                    </div>
                    <p className="text-xs text-muted-foreground">{new Date(e.event_date).toLocaleDateString("fr-FR")}</p>
                    <p className="mt-1 flex items-center gap-3 text-[11px] text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Eye className="h-3 w-3" /> {e.view_count}
                      </span>
                    </p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-px bg-border">
                  <Link to="/event/$eventId" params={{ eventId: e.id }} className="bg-card py-2 text-center text-xs font-semibold text-foreground">
                    Voir
                  </Link>
                  <button onClick={() => cancelEvent(e.id)} className="flex items-center justify-center gap-1 bg-card py-2 text-xs font-semibold text-destructive">
                    <X className="h-3 w-3" /> Annuler
                  </button>
                </div>
              </article>
            ))}
          </div>
        )}

        {tab === "events" && (
          <div className="rounded-xl border border-dashed border-border bg-card p-8 text-center text-sm text-muted-foreground animate-fade-in">
            Tu n'as pas encore rejoint d'événement.
          </div>
        )}
        {tab === "photos" && (
          <div className="rounded-xl border border-dashed border-border bg-card p-8 text-center text-sm text-muted-foreground animate-fade-in">
            Aucune photo pour l'instant.
          </div>
        )}
        {tab === "flames" && (
          <div className="rounded-xl border border-dashed border-border bg-card p-8 text-center text-sm text-muted-foreground animate-fade-in">
            Tes flammes apparaîtront ici.
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
