import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { X, Calendar, Clock, MapPin, ImagePlus, Users } from "lucide-react";
import { MobileFrame } from "@/components/MobileFrame";
import type { Category } from "@/lib/mock-data";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/create")({
  head: () => ({
    meta: [
      { title: "Créer un événement — EVENZO" },
      { name: "description", content: "Crée et publie ton événement sur EVENZO en quelques secondes." },
      { property: "og:title", content: "Créer un événement — EVENZO" },
      { property: "og:description", content: "Publie ton événement et invite tes amis." },
    ],
  }),
  component: CreatePage,
});

const CATS: Category[] = ["Soirée", "Concert", "Sport", "Culture", "Networking"];
const PRIVACY = ["Public", "Amis", "Sur invitation"] as const;

function CreatePage() {
  const navigate = useNavigate();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [location, setLocation] = useState("");
  const [category, setCategory] = useState<Category>("Soirée");
  const [isFree, setIsFree] = useState(true);
  const [price, setPrice] = useState("");
  const [privacy, setPrivacy] = useState<(typeof PRIVACY)[number]>("Public");
  const [capacity, setCapacity] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
    setTimeout(() => navigate({ to: "/" }), 1400);
  };

  return (
    <MobileFrame hideNav>
      <header className="sticky top-0 z-30 flex items-center justify-between border-b border-border bg-background/95 px-4 py-3 pt-safe backdrop-blur-xl">
        <button
          onClick={() => navigate({ to: "/" })}
          aria-label="Fermer"
          className="flex h-10 w-10 items-center justify-center rounded-full bg-secondary"
        >
          <X className="h-5 w-5 text-foreground" />
        </button>
        <h1 className="text-base font-bold text-foreground">Nouvel événement</h1>
        <div className="w-10" />
      </header>

      {submitted ? (
        <div className="flex min-h-[70vh] flex-col items-center justify-center px-6 text-center">
          <div className="text-6xl animate-flame-flicker">🔥</div>
          <h2 className="mt-4 text-xl font-bold text-foreground">Événement publié !</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Tes amis vont être notifiés. Préparez-vous, ça va chauffer.
          </p>
        </div>
      ) : (
        <form onSubmit={submit} className="space-y-5 px-4 py-5 pb-32">
          {/* Cover */}
          <button
            type="button"
            className="flex aspect-[16/10] w-full flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-border bg-card text-muted-foreground transition-colors hover:border-primary hover:text-primary"
          >
            <ImagePlus className="h-8 w-8" />
            <span className="text-sm font-semibold">Ajouter une photo de couverture</span>
            <span className="text-xs">JPG ou PNG, 16:9 conseillé</span>
          </button>

          <Field label="Titre de l'événement" required>
            <input
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Ex : Soirée Afrobeats au Palais"
              className="input"
            />
          </Field>

          <Field label="Description">
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={4}
              placeholder="Raconte ton événement, l'ambiance, ce qui attend les invités…"
              className="input resize-none"
            />
          </Field>

          <div className="grid grid-cols-2 gap-3">
            <Field label="Date" icon={<Calendar className="h-4 w-4" />}>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="input"
              />
            </Field>
            <Field label="Heure" icon={<Clock className="h-4 w-4" />}>
              <input
                type="time"
                value={time}
                onChange={(e) => setTime(e.target.value)}
                className="input"
              />
            </Field>
          </div>

          <Field label="Lieu" icon={<MapPin className="h-4 w-4" />}>
            <input
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="Adresse ou nom du lieu"
              className="input"
            />
          </Field>

          <Field label="Catégorie">
            <div className="no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4">
              {CATS.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setCategory(c)}
                  className={cn(
                    "shrink-0 rounded-full px-4 py-2 text-xs font-semibold transition-all",
                    category === c
                      ? "bg-primary text-primary-foreground shadow-flame"
                      : "bg-secondary text-muted-foreground"
                  )}
                >
                  {c}
                </button>
              ))}
            </div>
          </Field>

          <Field label="Tarif">
            <div className="flex items-center justify-between rounded-xl border border-border bg-card p-3">
              <span className="text-sm font-medium text-foreground">Événement gratuit</span>
              <button
                type="button"
                onClick={() => setIsFree((v) => !v)}
                className={cn(
                  "relative h-6 w-11 rounded-full transition-colors",
                  isFree ? "bg-primary" : "bg-border"
                )}
                aria-pressed={isFree}
              >
                <span
                  className={cn(
                    "absolute top-0.5 h-5 w-5 rounded-full bg-foreground transition-transform",
                    isFree ? "translate-x-5" : "translate-x-0.5"
                  )}
                />
              </button>
            </div>
            {!isFree && (
              <input
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                placeholder="Prix d'entrée (FCFA)"
                inputMode="numeric"
                className="input mt-2"
              />
            )}
          </Field>

          <Field label="Confidentialité">
            <div className="grid grid-cols-3 gap-1 rounded-xl bg-secondary p-1">
              {PRIVACY.map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => setPrivacy(p)}
                  className={cn(
                    "rounded-lg py-2 text-xs font-semibold transition-all",
                    privacy === p ? "bg-card text-foreground shadow-card" : "text-muted-foreground"
                  )}
                >
                  {p}
                </button>
              ))}
            </div>
          </Field>

          <Field label="Capacité maximale (optionnel)" icon={<Users className="h-4 w-4" />}>
            <input
              value={capacity}
              onChange={(e) => setCapacity(e.target.value)}
              placeholder="Ex : 200"
              inputMode="numeric"
              className="input"
            />
          </Field>

          <div className="fixed bottom-0 left-1/2 z-30 w-full max-w-[430px] -translate-x-1/2 border-t border-border bg-background/95 p-4 pb-safe backdrop-blur-xl">
            <button
              type="submit"
              className="h-12 w-full rounded-lg bg-gradient-flame text-base font-bold text-primary-foreground shadow-flame transition-transform active:scale-[0.98]"
            >
              🔥 Publier l'événement
            </button>
          </div>
        </form>
      )}

      <style>{`
        .input {
          width: 100%;
          background: var(--surface);
          border: 1px solid var(--border);
          border-radius: 0.75rem;
          padding: 0.75rem 0.875rem;
          color: var(--foreground);
          font-size: 0.875rem;
          outline: none;
          transition: border-color 0.15s;
        }
        .input::placeholder { color: var(--muted-foreground); }
        .input:focus { border-color: var(--primary); }
        .input[type="date"], .input[type="time"] { color-scheme: dark; }
      `}</style>
    </MobileFrame>
  );
}

function Field({
  label,
  children,
  required,
  icon,
}: {
  label: string;
  children: React.ReactNode;
  required?: boolean;
  icon?: React.ReactNode;
}) {
  return (
    <label className="block space-y-1.5">
      <span className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        {icon}
        {label}
        {required && <span className="text-primary">*</span>}
      </span>
      {children}
    </label>
  );
}
