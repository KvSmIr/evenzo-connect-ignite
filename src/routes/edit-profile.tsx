import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ArrowLeft } from "lucide-react";
import { MobileFrame } from "@/components/MobileFrame";
import { useAuth } from "@/lib/auth-store";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export const Route = createFileRoute("/edit-profile")({
  head: () => ({ meta: [{ title: "Modifier le profil — EVENZO" }] }),
  component: EditProfilePage,
});

function EditProfilePage() {
  const navigate = useNavigate();
  const { user, profile, loading, refresh } = useAuth();
  const [displayName, setDisplayName] = useState("");
  const [username, setUsername] = useState("");
  const [bio, setBio] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [city, setCity] = useState("Lomé");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (profile) {
      setDisplayName(profile.display_name ?? "");
      setUsername(profile.username ?? "");
      setBio(profile.bio ?? "");
      setWhatsapp(profile.whatsapp ?? "");
      setCity(profile.city ?? "Lomé");
    }
  }, [profile]);

  useEffect(() => {
    if (!loading && !user) navigate({ to: "/auth" });
  }, [loading, user, navigate]);

  const save = async () => {
    if (!user) return;
    setBusy(true);
    const { error } = await supabase
      .from("profiles")
      .update({ display_name: displayName, username, bio, whatsapp, city })
      .eq("user_id", user.id);
    setBusy(false);
    if (error) {
      toast.error(error.message);
    } else {
      toast.success("Profil mis à jour");
      await refresh();
      navigate({ to: "/profile" });
    }
  };

  return (
    <MobileFrame hideNav>
      <header className="sticky top-0 z-30 flex items-center justify-between gap-3 border-b border-border bg-background/95 px-4 py-3 pt-safe backdrop-blur-xl">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate({ to: "/settings" })} aria-label="Retour" className="flex h-10 w-10 items-center justify-center rounded-full bg-secondary">
            <ArrowLeft className="h-5 w-5" />
          </button>
          <h1 className="text-base font-bold">Modifier le profil</h1>
        </div>
        <button
          onClick={save}
          disabled={busy}
          className="rounded-lg bg-gradient-flame px-4 py-2 text-xs font-bold text-primary-foreground shadow-flame disabled:opacity-50"
        >
          {busy ? "..." : "Enregistrer"}
        </button>
      </header>

      <div className="space-y-4 p-4">
        <Field label="Nom affiché">
          <input value={displayName} onChange={(e) => setDisplayName(e.target.value)} className="input" />
        </Field>
        <Field label="Nom d'utilisateur">
          <input value={username} onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/\s/g, ""))} className="input" />
        </Field>
        <Field label="Bio">
          <textarea value={bio} onChange={(e) => setBio(e.target.value.slice(0, 160))} rows={3} className="input resize-none" />
          <span className="text-[11px] text-muted-foreground">{bio.length}/160</span>
        </Field>
        <Field label="WhatsApp">
          <input value={whatsapp} onChange={(e) => setWhatsapp(e.target.value)} placeholder="+228 ..." className="input" />
        </Field>
        <Field label="Ville">
          <input value={city} onChange={(e) => setCity(e.target.value)} className="input" />
        </Field>
      </div>

      <style>{`
        .input {
          width: 100%;
          background: var(--card);
          border: 1px solid var(--border);
          border-radius: 0.75rem;
          padding: 0.75rem 0.875rem;
          color: var(--foreground);
          font-size: 0.875rem;
          outline: none;
        }
        .input::placeholder { color: var(--muted-foreground); }
        .input:focus { border-color: var(--primary); }
      `}</style>
    </MobileFrame>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block space-y-1.5">
      <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{label}</span>
      {children}
    </label>
  );
}
