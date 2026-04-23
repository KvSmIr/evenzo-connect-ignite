import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ArrowLeft, Upload, Check } from "lucide-react";
import { MobileFrame } from "@/components/MobileFrame";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-store";
import { toast } from "sonner";

export const Route = createFileRoute("/become-organizer")({
  head: () => ({
    meta: [{ title: "Devenir Organisateur — EVENZO" }],
  }),
  component: BecomeOrganizerPage,
});

const ACTIVITIES = [
  "DJ / Artiste",
  "Bar / Boîte de nuit",
  "Restaurant",
  "Association",
  "Promoteur événementiel",
  "Sport",
  "Culture",
  "Autre",
];

function BecomeOrganizerPage() {
  const navigate = useNavigate();
  const { user, loading, refresh } = useAuth();

  const [fullName, setFullName] = useState("");
  const [activity, setActivity] = useState(ACTIVITIES[0]);
  const [whatsapp, setWhatsapp] = useState("+228 ");
  const [businessName, setBusinessName] = useState("");
  const [description, setDescription] = useState("");
  const [proofFile, setProofFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);

  useEffect(() => {
    if (!loading && !user) navigate({ to: "/auth" });
  }, [loading, user, navigate]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    if (description.length > 200) return toast.error("Description trop longue (200 max)");
    setBusy(true);
    try {
      let proof_url: string | null = null;
      if (proofFile) {
        const ext = proofFile.name.split(".").pop();
        const path = `${user.id}/${Date.now()}.${ext}`;
        const { error: upErr } = await supabase.storage
          .from("organizer-proofs")
          .upload(path, proofFile);
        if (upErr) throw upErr;
        proof_url = path;
      }
      const { error } = await supabase.from("organizer_requests").insert({
        user_id: user.id,
        full_name: fullName,
        activity_type: activity,
        whatsapp,
        business_name: businessName,
        description,
        proof_url,
        status: "pending",
      });
      if (error) throw error;
      await refresh();
      setDone(true);
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Erreur");
    } finally {
      setBusy(false);
    }
  };

  if (done) {
    return (
      <MobileFrame hideNav>
        <div className="flex min-h-screen flex-col items-center justify-center px-6 text-center">
          <div className="flex h-24 w-24 animate-scale-in items-center justify-center rounded-full bg-success/20">
            <Check className="h-12 w-12 text-success" strokeWidth={3} />
          </div>
          <h1 className="mt-6 text-2xl font-bold text-foreground">Demande envoyée ! ✓</h1>
          <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
            L'équipe EVENZO te contacte sous 24-48h sur ton WhatsApp.
          </p>
          <button
            onClick={() => navigate({ to: "/" })}
            className="mt-8 h-12 w-full max-w-xs rounded-lg bg-gradient-flame text-base font-bold text-primary-foreground shadow-flame"
          >
            Retour à l'accueil
          </button>
        </div>
      </MobileFrame>
    );
  }

  return (
    <MobileFrame hideNav>
      <header className="sticky top-0 z-30 flex items-center gap-3 border-b border-border bg-background/95 px-4 py-3 pt-safe backdrop-blur-xl">
        <button
          onClick={() => navigate({ to: "/" })}
          className="flex h-10 w-10 items-center justify-center rounded-full bg-secondary"
          aria-label="Retour"
        >
          <ArrowLeft className="h-5 w-5 text-foreground" />
        </button>
        <h1 className="text-base font-bold text-foreground">Devenir Organisateur</h1>
      </header>

      <form onSubmit={submit} className="space-y-4 px-4 py-5 pb-32">
        <Field label="Prénom et Nom" required>
          <input
            required
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            placeholder="Ex: Kossi Adjovi"
            className="input"
          />
        </Field>

        <Field label="Type d'activité" required>
          <select
            value={activity}
            onChange={(e) => setActivity(e.target.value)}
            className="input"
          >
            {ACTIVITIES.map((a) => (
              <option key={a} value={a}>
                {a}
              </option>
            ))}
          </select>
        </Field>

        <Field label="Numéro WhatsApp" required>
          <input
            required
            type="tel"
            value={whatsapp}
            onChange={(e) => setWhatsapp(e.target.value)}
            placeholder="+228 XX XX XX XX"
            className="input"
          />
        </Field>

        <Field label="Nom de ton établissement ou projet" required>
          <input
            required
            value={businessName}
            onChange={(e) => setBusinessName(e.target.value)}
            placeholder="Ex: Le Palais de la Mer"
            className="input"
          />
        </Field>

        <Field label={`Description courte (${description.length}/200)`}>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value.slice(0, 200))}
            rows={3}
            placeholder="Décris tes événements habituels…"
            className="input resize-none"
          />
        </Field>

        <Field label="Photo preuve (optionnel)">
          <label className="flex cursor-pointer items-center gap-3 rounded-xl border-2 border-dashed border-border bg-card p-4 transition-colors hover:border-primary">
            <Upload className="h-5 w-5 text-muted-foreground" />
            <span className="flex-1 truncate text-sm text-muted-foreground">
              {proofFile?.name ?? "Logo, photo de ton lieu, flyer passé…"}
            </span>
            <input
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => setProofFile(e.target.files?.[0] ?? null)}
            />
          </label>
        </Field>

        <button
          type="submit"
          disabled={busy}
          className="mt-4 h-12 w-full rounded-lg bg-gradient-flame text-base font-bold text-primary-foreground shadow-flame transition-transform active:scale-[0.98] disabled:opacity-60"
        >
          {busy ? "Envoi…" : "Envoyer ma demande"}
        </button>
      </form>

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

function Field({
  label,
  children,
  required,
}: {
  label: string;
  children: React.ReactNode;
  required?: boolean;
}) {
  return (
    <label className="block space-y-1.5">
      <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        {label}
        {required && <span className="ml-1 text-primary">*</span>}
      </span>
      {children}
    </label>
  );
}
