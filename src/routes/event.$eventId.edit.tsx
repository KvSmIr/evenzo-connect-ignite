import { createFileRoute, useNavigate, useParams, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ArrowLeft, Save, Trash2 } from "lucide-react";
import { MobileFrame } from "@/components/MobileFrame";
import { LocationPicker, type PickedLocation } from "@/components/LocationPicker";
import { Skeleton } from "@/components/ui/skeleton";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-store";
import { useEvent } from "@/lib/events-query";
import { useQueryClient } from "@tanstack/react-query";
import { EVENTS_QUERY_KEY } from "@/lib/events-query";
import { toast } from "sonner";

export const Route = createFileRoute("/event/$eventId/edit")({
  head: () => ({ meta: [{ title: "Modifier l'événement — EVENZO" }] }),
  component: EditEventPage,
});

const CATEGORIES = ["Soirée", "Concert", "Sport", "Culture", "Gastronomie", "Networking", "Autre"];

function EditEventPage() {
  const { eventId } = useParams({ from: "/event/$eventId/edit" });
  const { user, role } = useAuth();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const { data: event, isLoading } = useEvent(eventId);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("Soirée");
  const [eventDate, setEventDate] = useState("");
  const [eventTime, setEventTime] = useState("");
  const [picked, setPicked] = useState<PickedLocation | null>(null);
  const [isFree, setIsFree] = useState(true);
  const [price, setPrice] = useState<string>("0");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!event) return;
    setTitle(event.title);
    setDescription(event.description ?? "");
    setCategory(event.category);
    setEventDate(event.event_date);
    setEventTime(event.event_time?.slice(0, 5) ?? "");
    setPicked({
      name: event.location_name,
      address: (event as { location_address?: string | null }).location_address ?? event.location_name,
      lat: Number(event.lat ?? 6.1375),
      lng: Number(event.lng ?? 1.2123),
    });
    setIsFree(event.is_free);
    setPrice(String(event.price ?? 0));
  }, [event]);

  if (isLoading) {
    return (
      <MobileFrame>
        <div className="space-y-4 p-5">
          <Skeleton className="h-8 w-2/3" />
          <Skeleton className="h-32 w-full" />
        </div>
      </MobileFrame>
    );
  }

  if (!event) {
    return (
      <MobileFrame>
        <div className="p-10 text-center">Événement introuvable.</div>
      </MobileFrame>
    );
  }

  const canEdit = !!user && (user.id === event.organizer_id || role === "admin");

  if (!canEdit) {
    return (
      <MobileFrame>
        <div className="flex min-h-screen flex-col items-center justify-center px-6 text-center">
          <p className="text-5xl">🔒</p>
          <h1 className="mt-3 text-xl font-bold">Accès refusé</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Seul l'organisateur peut modifier cet événement.
          </p>
          <Link
            to="/event/$eventId"
            params={{ eventId }}
            className="mt-5 rounded-lg bg-primary px-4 py-2 text-sm font-bold text-primary-foreground"
          >
            Retour
          </Link>
        </div>
      </MobileFrame>
    );
  }

  const handleSave = async () => {
    setSaving(true);
    const { error } = await supabase
      .from("events")
      .update({
        title: title.trim(),
        description: description.trim() || null,
        category: category as never,
        event_date: eventDate,
        event_time: `${eventTime}:00`,
        location_name: picked?.name ?? "",
        location_address: picked?.address ?? null,
        lat: picked?.lat ?? null,
        lng: picked?.lng ?? null,
        is_free: isFree,
        price: isFree ? 0 : Number(price) || 0,
      })
      .eq("id", eventId);
    setSaving(false);
    if (error) {
      toast.error("Impossible de sauvegarder", { description: error.message });
      return;
    }
    toast.success("Événement mis à jour 🔥");
    qc.invalidateQueries({ queryKey: EVENTS_QUERY_KEY });
    qc.invalidateQueries({ queryKey: ["event", eventId] });
    navigate({ to: "/event/$eventId", params: { eventId } });
  };

  const handleDelete = async () => {
    if (!confirm("Supprimer définitivement cet événement ?")) return;
    const { error } = await supabase.from("events").delete().eq("id", eventId);
    if (error) {
      toast.error("Suppression impossible", { description: error.message });
      return;
    }
    toast.success("Événement supprimé");
    qc.invalidateQueries({ queryKey: EVENTS_QUERY_KEY });
    navigate({ to: "/" });
  };

  return (
    <MobileFrame>
      <header className="sticky top-0 z-30 flex items-center gap-3 border-b border-border bg-background/85 px-4 py-3 backdrop-blur-xl">
        <Link
          to="/event/$eventId"
          params={{ eventId }}
          aria-label="Retour"
          className="flex h-10 w-10 items-center justify-center rounded-full bg-secondary"
        >
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <h1 className="text-lg font-bold">Modifier l'événement</h1>
      </header>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleSave();
        }}
        className="space-y-5 p-5"
      >
        <Field label="Titre">
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
            maxLength={100}
            className="input"
          />
        </Field>

        <Field label="Description">
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={4}
            className="input resize-none"
          />
        </Field>

        <Field label="Catégorie">
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="input"
          >
            {CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </Field>

        <div className="grid grid-cols-2 gap-3">
          <Field label="Date">
            <input
              type="date"
              value={eventDate}
              onChange={(e) => setEventDate(e.target.value)}
              required
              className="input"
            />
          </Field>
          <Field label="Heure">
            <input
              type="time"
              value={eventTime}
              onChange={(e) => setEventTime(e.target.value)}
              required
              className="input"
            />
          </Field>
        </div>

        <Field label="Lieu">
          <LocationPicker value={picked} onChange={setPicked} />
        </Field>

        <div className="flex items-center justify-between rounded-xl border border-border bg-card px-4 py-3">
          <span className="text-sm font-medium">Événement gratuit</span>
          <button
            type="button"
            onClick={() => setIsFree((v) => !v)}
            className={`flex h-6 w-11 items-center rounded-full p-0.5 transition-colors ${
              isFree ? "bg-primary justify-end" : "bg-muted justify-start"
            }`}
          >
            <span className="h-5 w-5 rounded-full bg-white" />
          </button>
        </div>

        {!isFree && (
          <Field label="Prix (FCFA)">
            <input
              type="number"
              min={0}
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              className="input"
            />
          </Field>
        )}

        <div className="flex gap-2 pt-2">
          <button
            type="button"
            onClick={handleDelete}
            className="flex h-12 items-center justify-center gap-2 rounded-lg border border-destructive/40 bg-destructive/10 px-4 text-sm font-bold text-destructive"
          >
            <Trash2 className="h-4 w-4" />
            Supprimer
          </button>
          <button
            type="submit"
            disabled={saving}
            className="flex h-12 flex-1 items-center justify-center gap-2 rounded-lg bg-gradient-flame text-sm font-bold text-primary-foreground shadow-flame disabled:opacity-60"
          >
            <Save className="h-4 w-4" />
            {saving ? "Enregistrement…" : "Enregistrer"}
          </button>
        </div>
      </form>

      <style>{`
        .input {
          width: 100%;
          height: 44px;
          padding: 0 14px;
          border-radius: 12px;
          background: hsl(var(--card));
          border: 1px solid hsl(var(--border));
          color: hsl(var(--foreground));
          font-size: 14px;
          outline: none;
        }
        textarea.input { height: auto; padding: 12px 14px; }
        .input:focus { border-color: #E8593C; }
      `}</style>
    </MobileFrame>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        {label}
      </span>
      {children}
    </label>
  );
}
