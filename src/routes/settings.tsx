import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ArrowLeft, ChevronRight, LogOut, Trash2 } from "lucide-react";
import { MobileFrame } from "@/components/MobileFrame";
import { useAuth } from "@/lib/auth-store";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

export const Route = createFileRoute("/settings")({
  head: () => ({ meta: [{ title: "Paramètres — EVENZO" }] }),
  component: SettingsPage,
});

function SettingsPage() {
  const navigate = useNavigate();
  const { user, signOut, loading } = useAuth();
  const [friendsActivity, setFriendsActivity] = useState(true);
  const [eventReminders, setEventReminders] = useState(true);
  const [nearbyEvents, setNearbyEvents] = useState(false);

  useEffect(() => {
    if (!user) return;
    supabase
      .from("user_settings")
      .select("*")
      .eq("user_id", user.id)
      .maybeSingle()
      .then(({ data }) => {
        if (data) {
          setFriendsActivity(data.notif_friends_activity);
          setEventReminders(data.notif_event_reminders);
          setNearbyEvents(data.notif_nearby_events);
        }
      });
  }, [user]);

  const updateSetting = async (patch: Record<string, boolean>) => {
    if (!user) return;
    await supabase.from("user_settings").upsert({ user_id: user.id, ...patch }, { onConflict: "user_id" });
  };

  useEffect(() => {
    if (!loading && !user) navigate({ to: "/auth" });
  }, [loading, user, navigate]);

  const deleteAccount = async () => {
    if (!confirm("Supprimer définitivement ton compte ? Cette action est irréversible.")) return;
    toast.info("Demande de suppression enregistrée. Contacte le support pour finaliser.");
  };

  return (
    <MobileFrame hideNav>
      <header className="sticky top-0 z-30 flex items-center gap-3 border-b border-border bg-background/95 px-4 py-3 pt-safe backdrop-blur-xl">
        <button onClick={() => navigate({ to: "/profile" })} aria-label="Retour" className="flex h-10 w-10 items-center justify-center rounded-full bg-secondary">
          <ArrowLeft className="h-5 w-5" />
        </button>
        <h1 className="text-base font-bold">Paramètres</h1>
      </header>

      <div className="space-y-6 p-4 pb-12">
        <Section title="Mon compte">
          <Row label="Modifier le profil" onClick={() => navigate({ to: "/edit-profile" })} />
          <Row label="Changer le mot de passe" onClick={async () => {
            if (!user?.email) return;
            const { error } = await supabase.auth.resetPasswordForEmail(user.email);
            if (error) toast.error(error.message);
            else toast.success("Email de réinitialisation envoyé");
          }} />
          <Row label="Numéro de téléphone" onClick={() => navigate({ to: "/edit-profile" })} />
        </Section>

        <Section title="Notifications">
          <ToggleRow
            label="Activité des amis"
            value={friendsActivity}
            onChange={(v) => { setFriendsActivity(v); updateSetting({ notif_friends_activity: v }); }}
          />
          <ToggleRow
            label="Rappels d'événements"
            value={eventReminders}
            onChange={(v) => { setEventReminders(v); updateSetting({ notif_event_reminders: v }); }}
          />
          <ToggleRow
            label="Nouveaux événements près de moi"
            value={nearbyEvents}
            onChange={(v) => { setNearbyEvents(v); updateSetting({ notif_nearby_events: v }); }}
          />
        </Section>

        <Section title="Application">
          <StaticRow label="Langue" value="Français" />
          <StaticRow label="Version" value="1.0.0" />
        </Section>

        <Section title="Compte">
          <button
            onClick={signOut}
            className="flex w-full items-center justify-between rounded-xl bg-card border border-border px-4 py-3.5 text-left text-sm font-semibold text-destructive"
          >
            <span className="flex items-center gap-2"><LogOut className="h-4 w-4" /> Se déconnecter</span>
          </button>
          <button
            onClick={deleteAccount}
            className="mt-2 flex w-full items-center justify-between rounded-xl bg-card border border-border px-4 py-3.5 text-left text-sm font-semibold text-muted-foreground"
          >
            <span className="flex items-center gap-2"><Trash2 className="h-4 w-4" /> Supprimer mon compte</span>
          </button>
        </Section>
      </div>
    </MobileFrame>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h2 className="mb-2 px-1 text-xs font-bold uppercase tracking-wider text-muted-foreground">{title}</h2>
      <div className="space-y-px overflow-hidden rounded-xl">
        {children}
      </div>
    </div>
  );
}

function Row({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button onClick={onClick} className="flex w-full items-center justify-between border border-border bg-card px-4 py-3.5 text-left text-sm font-medium text-foreground first:rounded-t-xl last:rounded-b-xl">
      <span>{label}</span>
      <ChevronRight className="h-4 w-4 text-muted-foreground" />
    </button>
  );
}

function StaticRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between border border-border bg-card px-4 py-3.5 text-sm first:rounded-t-xl last:rounded-b-xl">
      <span className="text-foreground">{label}</span>
      <span className="text-muted-foreground">{value}</span>
    </div>
  );
}

function ToggleRow({ label, value, onChange }: { label: string; value: boolean; onChange: (v: boolean) => void }) {
  return (
    <div className="flex items-center justify-between border border-border bg-card px-4 py-3.5 text-sm first:rounded-t-xl last:rounded-b-xl">
      <span className="text-foreground">{label}</span>
      <button
        onClick={() => onChange(!value)}
        className={cn(
          "flex h-6 w-11 items-center rounded-full p-0.5 transition-colors",
          value ? "bg-primary justify-end" : "bg-muted justify-start"
        )}
      >
        <span className="h-5 w-5 rounded-full bg-white" />
      </button>
    </div>
  );
}
