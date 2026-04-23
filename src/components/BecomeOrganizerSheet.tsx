import { useNavigate } from "@tanstack/react-router";
import { X, Check } from "lucide-react";
import { useAuth } from "@/lib/auth-store";

type Props = { open: boolean; onClose: () => void };

export function BecomeOrganizerSheet({ open, onClose }: Props) {
  const navigate = useNavigate();
  const { organizerRequestStatus } = useAuth();

  if (!open) return null;

  const isPending = organizerRequestStatus === "pending";

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/70 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="mx-auto w-full max-w-[430px] animate-slide-up rounded-t-3xl border-t border-border bg-card p-6 pb-safe"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mx-auto mb-4 h-1 w-12 rounded-full bg-border" />

        <button
          onClick={onClose}
          className="absolute right-5 top-5 flex h-9 w-9 items-center justify-center rounded-full bg-secondary"
          aria-label="Fermer"
        >
          <X className="h-4 w-4 text-foreground" />
        </button>

        {isPending ? (
          <>
            <div className="mb-3 text-5xl">⏳</div>
            <h2 className="text-xl font-bold text-foreground">Demande en cours d'examen</h2>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
              Ton dossier est en cours de vérification par l'équipe EVENZO. Nous te contactons sous
              24-48h sur WhatsApp.
            </p>
            <button
              onClick={onClose}
              className="mt-6 h-12 w-full rounded-lg border border-border text-sm font-semibold text-foreground"
            >
              Fermer
            </button>
          </>
        ) : (
          <>
            <h2 className="pr-10 text-xl font-bold text-foreground">
              Tu veux créer un événement ? 🎯
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
              EVENZO vérifie les organisateurs pour garantir des événements 100% réels à Lomé.
            </p>

            <ul className="mt-5 space-y-3">
              {[
                "Badge Organisateur Vérifié sur ton profil",
                "Création d'événements illimitée",
                "Tableau de bord et analytics",
              ].map((b) => (
                <li key={b} className="flex items-start gap-3">
                  <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-gradient-flame">
                    <Check className="h-3 w-3 text-primary-foreground" strokeWidth={3} />
                  </span>
                  <span className="text-sm text-foreground">{b}</span>
                </li>
              ))}
            </ul>

            <button
              onClick={() => {
                onClose();
                navigate({ to: "/become-organizer" });
              }}
              className="mt-6 h-12 w-full rounded-lg bg-gradient-flame text-base font-bold text-primary-foreground shadow-flame transition-transform active:scale-[0.98]"
            >
              Faire une demande
            </button>
            <button
              className="mt-3 w-full text-center text-xs text-muted-foreground"
              onClick={onClose}
            >
              En savoir plus
            </button>
          </>
        )}
      </div>
    </div>
  );
}
