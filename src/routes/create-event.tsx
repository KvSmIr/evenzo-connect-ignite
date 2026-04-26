import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { X, ArrowLeft, MapPin, Check, AlertTriangle, PartyPopper } from "lucide-react";
import confetti from "canvas-confetti";
import { MobileFrame } from "@/components/MobileFrame";
import { LocationPicker, type PickedLocation } from "@/components/LocationPicker";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-store";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import { EVENTS_QUERY_KEY } from "@/lib/events-query";

export const Route = createFileRoute("/create-event")({
  head: () => ({
    meta: [{ title: "Créer un événement — EVENZO" }],
  }),
  component: CreateEventPage,
});

const CATEGORIES = ["Soirée", "Concert", "Sport", "Culture", "Gastronomie", "Networking", "Autre"] as const;
type Category = (typeof CATEGORIES)[number];

const PRIVACIES = [
  { id: "public" as const, icon: "🌍", label: "Public", desc: "Visible par tous" },
  { id: "friends" as const, icon: "👥", label: "Amis", desc: "Visible par tes amis seulement" },
  { id: "invite" as const, icon: "💌", label: "Invitation", desc: "Sur invitation uniquement" },
];

function CreateEventPage() {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const { user, role, loading } = useAuth();
  const [step, setStep] = useState(1);
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [coverPreview, setCoverPreview] = useState<string | null>(null);
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState<Category>("Soirée");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [picked, setPicked] = useState<PickedLocation | null>(null);
  const [description, setDescription] = useState("");
  const [isFree, setIsFree] = useState(true);
  const [price, setPrice] = useState("");
  const [capacity, setCapacity] = useState("");
  const [privacy, setPrivacy] = useState<"public" | "friends" | "invite">("public");
  const [busy, setBusy] = useState(false);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (loading) return;
    if (!user) navigate({ to: "/auth" });
    else if (role !== "organizer" && role !== "admin") navigate({ to: "/" });
  }, [loading, user, role, navigate]);

  const onCover = (f: File | null) => {
    setCoverFile(f);
    setCoverPreview(f ? URL.createObjectURL(f) : null);
  };

  const canStep1 = !!(title && date && time && picked);
  const canStep2 = description.length > 0 && (isFree || price);

  const publish = async (status: "published" | "draft") => {
    if (!user) return;
    setBusy(true);
    try {
      let cover_url: string | null = null;
      if (coverFile) {
        const ext = coverFile.name.split(".").pop();
        const path = `${user.id}/${Date.now()}.${ext}`;
        const { error: upErr } = await supabase.storage
          .from("event-covers")
          .upload(path, coverFile);
        if (upErr) throw upErr;
        const { data } = supabase.storage.from("event-covers").getPublicUrl(path);
        cover_url = data.publicUrl;
      }
      const { error } = await supabase.from("events").insert({
        organizer_id: user.id,
        title,
        description,
        event_date: date,
        event_time: time,
        location_name: picked!.name,
        location_address: picked!.address,
        category,
        cover_url,
        is_free: isFree,
        price: isFree ? 0 : Number(price) || 0,
        max_capacity: capacity ? Number(capacity) : null,
        privacy,
        status,
        lat: picked!.lat,
        lng: picked!.lng,
      });
      if (error) throw error;

      // Refresh feed cache immediately
      qc.invalidateQueries({ queryKey: EVENTS_QUERY_KEY });

      if (status === "published") {
        setSuccess(true);
        confetti({
          particleCount: 100,
          spread: 80,
          origin: { y: 0.5 },
          colors: ["#E8593C", "#F97316", "#FBBF24", "#1D9E75"],
        });
        setTimeout(() => navigate({ to: "/" }), 2000);
      } else {
        toast.success("Brouillon enregistré");
        navigate({ to: "/profile" });
      }
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Erreur");
      setBusy(false);
    }
  };

  if (success) {
    return (
      <MobileFrame hideNav>
        <div className="flex min-h-screen flex-col items-center justify-center gap-4 px-6 text-center animate-fade-in">
          <div className="flex h-24 w-24 items-center justify-center rounded-full bg-success/20 animate-scale-in">
            <Check className="h-14 w-14 text-success" strokeWidth={3} />
          </div>
          <PartyPopper className="absolute h-10 w-10 text-primary opacity-0" />
          <h1 className="text-2xl font-black text-foreground">Événement publié ! 🔥</h1>
          <p className="text-sm text-muted-foreground">Ton événement est maintenant visible par tous.</p>
        </div>
      </MobileFrame>
    );
  }

  return (
    <MobileFrame hideNav>
      <header className="sticky top-0 z-30 border-b border-border bg-background/95 px-4 py-3 pt-safe backdrop-blur-xl">
        <div className="flex items-center justify-between">
          <button
            onClick={() => (step > 1 ? setStep(step - 1) : navigate({ to: "/" }))}
            className="flex h-10 w-10 items-center justify-center rounded-full bg-secondary"
            aria-label="Retour"
          >
            {step > 1 ? <ArrowLeft className="h-5 w-5 text-foreground" /> : <X className="h-5 w-5 text-foreground" />}
          </button>
          <h1 className="text-base font-bold text-foreground">Créer un événement</h1>
          <span className="w-10 text-right text-xs font-semibold text-muted-foreground">{step}/3</span>
        </div>
        <div className="mt-3 h-1 w-full overflow-hidden rounded-full bg-secondary">
          <div className="h-full bg-gradient-flame transition-all" style={{ width: `${(step / 3) * 100}%` }} />
        </div>
        <p className="mt-2 text-xs font-semibold uppercase tracking-wide text-primary">
          {step === 1 && "Étape 1 · L'essentiel"}
          {step === 2 && "Étape 2 · Les détails"}
          {step === 3 && "Étape 3 · Aperçu & Publication"}
        </p>
      </header>

      <div className="px-4 py-5 pb-32">
        {step === 1 && (
          <div className="space-y-4 animate-fade-in">
            <label className="relative block h-[180px] cursor-pointer overflow-hidden rounded-xl border-2 border-dashed border-border bg-card">
              {coverPreview ? (
                <img src={coverPreview} alt="" className="h-full w-full object-cover" />
              ) : (
                <div className="flex h-full flex-col items-center justify-center gap-2 text-muted-foreground">
                  <span className="text-3xl animate-flame-flicker">🔥</span>
                  <span className="text-sm font-semibold">Ajouter une couverture</span>
                </div>
              )}
              <input type="file" accept="image/*" className="hidden" onChange={(e) => onCover(e.target.files?.[0] ?? null)} />
            </label>

            <Field label="Titre de l'événement" required>
              <input required value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Ex: Soirée Afrobeats…" className="input" />
            </Field>

            <Field label="Catégorie">
              <div className="no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4">
                {CATEGORIES.map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setCategory(c)}
                    className={cn(
                      "shrink-0 rounded-full px-4 py-2 text-xs font-semibold transition-all",
                      category === c ? "bg-primary text-primary-foreground shadow-flame" : "bg-secondary text-muted-foreground"
                    )}
                  >
                    {c}
                  </button>
                ))}
              </div>
            </Field>

            <div className="grid grid-cols-2 gap-3">
              <Field label="Date" required>
                <input required type="date" value={date} onChange={(e) => setDate(e.target.value)} className="input" />
              </Field>
              <Field label="Heure" required>
                <input required type="time" value={time} onChange={(e) => setTime(e.target.value)} className="input" />
              </Field>
            </div>

            <Field label="Lieu" required>
              <LocationPicker value={picked} onChange={setPicked} />
            </Field>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-4 animate-fade-in">
            <Field label={`Description (${description.length}/300)`}>
              <textarea value={description} onChange={(e) => setDescription(e.target.value.slice(0, 300))} rows={5} placeholder="Décris l'ambiance, les artistes…" className="input resize-none" />
            </Field>

            <Field label="Prix d'entrée">
              <div className="grid grid-cols-2 gap-1 rounded-xl bg-secondary p-1">
                <button type="button" onClick={() => setIsFree(true)} className={cn("rounded-lg py-2 text-sm font-semibold", isFree ? "bg-card text-foreground shadow-card" : "text-muted-foreground")}>
                  Gratuit
                </button>
                <button type="button" onClick={() => setIsFree(false)} className={cn("rounded-lg py-2 text-sm font-semibold", !isFree ? "bg-card text-foreground shadow-card" : "text-muted-foreground")}>
                  Payant
                </button>
              </div>
              {!isFree && (
                <div className="mt-2 flex items-center gap-2">
                  <input inputMode="numeric" value={price} onChange={(e) => setPrice(e.target.value.replace(/\D/g, ""))} placeholder="2000" className="input flex-1" />
                  <span className="text-sm font-semibold text-muted-foreground">FCFA</span>
                </div>
              )}
            </Field>

            <Field label="Capacité max">
              <input inputMode="numeric" value={capacity} onChange={(e) => setCapacity(e.target.value.replace(/\D/g, ""))} placeholder="Laisser vide = illimité" className="input" />
            </Field>

            <Field label="Visibilité">
              <div className="space-y-2">
                {PRIVACIES.map((p) => (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => setPrivacy(p.id)}
                    className={cn("flex w-full items-center gap-3 rounded-xl border p-3 text-left transition-colors", privacy === p.id ? "border-primary bg-primary/10" : "border-border bg-card")}
                  >
                    <span className="text-2xl">{p.icon}</span>
                    <div className="flex-1">
                      <p className="text-sm font-semibold text-foreground">{p.label}</p>
                      <p className="text-xs text-muted-foreground">{p.desc}</p>
                    </div>
                    {privacy === p.id && <Check className="h-5 w-5 text-primary" />}
                  </button>
                ))}
              </div>
            </Field>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-5 animate-fade-in">
            <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-card">
              <div className="relative h-[180px] bg-secondary">
                {coverPreview ? (
                  <img src={coverPreview} alt="" className="h-full w-full object-cover" />
                ) : (
                  <div className="flex h-full items-center justify-center text-4xl">🔥</div>
                )}
                <div className="absolute inset-x-0 bottom-0 h-[60%]" style={{ background: "linear-gradient(to bottom, transparent 30%, rgba(0,0,0,0.85) 100%)" }} />
                <div className="absolute bottom-3 left-3 right-3">
                  <p className="text-[12px] font-semibold tracking-wider text-primary" style={{ textShadow: "0 1px 4px rgba(0,0,0,0.8)" }}>
                    {date && new Date(date).toLocaleDateString("fr-FR", { weekday: "long" }).toUpperCase()} · {time}
                  </p>
                  <h3 className="text-lg font-bold leading-tight text-white" style={{ textShadow: "0 1px 4px rgba(0,0,0,0.8)" }}>
                    {title || "Titre de l'événement"}
                  </h3>
                </div>
              </div>
              <div className="p-3">
                <p className="flex items-center gap-1.5 text-[13px] text-muted-foreground">
                  <MapPin className="h-3.5 w-3.5 text-primary" />
                  {location || "Lieu"}
                </p>
              </div>
            </div>

            <div className="space-y-2 rounded-xl border border-border bg-card p-4">
              {[
                { ok: !!coverFile, l: "Photo de couverture ajoutée" },
                { ok: !!title, l: "Titre renseigné" },
                { ok: !!date && !!location, l: "Date et lieu confirmés" },
                { ok: true, l: "Badge Organisateur Vérifié ✓" },
              ].map((c) => (
                <div key={c.l} className="flex items-center gap-2 text-sm">
                  <Check className={cn("h-4 w-4", c.ok ? "text-success" : "text-muted-foreground")} />
                  <span className={cn(c.ok ? "text-foreground" : "text-muted-foreground")}>{c.l}</span>
                </div>
              ))}
            </div>

            <div className="flex gap-3 rounded-xl border border-primary/30 bg-primary/10 p-3">
              <AlertTriangle className="h-5 w-5 shrink-0 text-primary" />
              <p className="text-xs leading-relaxed text-foreground">
                En publiant, tu confirmes que cet événement est réel. Tout faux événement entraîne la suppression définitive du compte.
              </p>
            </div>

            <button onClick={() => publish("published")} disabled={busy} className="h-13 w-full rounded-lg bg-gradient-flame py-3.5 text-base font-bold text-primary-foreground shadow-flame transition-transform active:scale-[0.98] disabled:opacity-60">
              {busy ? "Publication…" : "Publier l'événement 🔥"}
            </button>
            <button onClick={() => publish("draft")} disabled={busy} className="block w-full text-center text-sm text-muted-foreground">
              Enregistrer comme brouillon
            </button>
          </div>
        )}
      </div>

      {step < 3 && (
        <div className="fixed bottom-0 left-1/2 z-30 w-full max-w-[430px] -translate-x-1/2 border-t border-border bg-background/95 p-4 pb-safe backdrop-blur-xl">
          <button onClick={() => setStep(step + 1)} disabled={(step === 1 && !canStep1) || (step === 2 && !canStep2)} className="h-12 w-full rounded-lg bg-gradient-flame text-base font-bold text-primary-foreground shadow-flame transition-opacity disabled:opacity-40">
            Continuer
          </button>
        </div>
      )}

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
        .input[type="date"], .input[type="time"] { color-scheme: dark; }
      `}</style>
      <Link to="/" className="hidden" />
    </MobileFrame>
  );
}

function Field({ label, children, required }: { label: string; children: React.ReactNode; required?: boolean }) {
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
