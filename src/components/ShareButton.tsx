import { useState } from "react";
import { Share2, Copy, MessageCircle, X, Check } from "lucide-react";
import { toast } from "sonner";

type Props = {
  title: string;
  date?: string;
  locationName?: string;
  url?: string;
};

export function ShareButton({ title, date, locationName, url }: Props) {
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const shareUrl = url ?? (typeof window !== "undefined" ? window.location.href : "");
  const text = `Rejoins-moi pour ${title} sur EVENZO 🔥`;
  const waText = `🔥 ${title}${date ? ` - ${date}` : ""}${locationName ? ` à ${locationName}` : ""} | Rejoins-moi sur EVENZO: ${shareUrl}`;

  const onShare = async () => {
    if (typeof navigator !== "undefined" && navigator.share) {
      try {
        await navigator.share({ title, text, url: shareUrl });
        return;
      } catch {
        // user cancelled or unsupported — fall back to popup
      }
    }
    setOpen(true);
  };

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      toast.success("Lien copié !");
      setTimeout(() => setCopied(false), 1500);
    } catch {
      toast.error("Impossible de copier");
    }
  };

  return (
    <>
      <button
        aria-label="Partager"
        onClick={onShare}
        className="fixed bottom-24 right-4 z-30 flex h-12 w-12 items-center justify-center rounded-full bg-card shadow-elevated border border-border md:right-[max(1rem,calc(50%-215px+1rem))]"
      >
        <Share2 className="h-5 w-5 text-foreground" />
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 backdrop-blur-sm md:items-center"
          onClick={() => setOpen(false)}
        >
          <div
            className="w-full max-w-[430px] space-y-3 rounded-t-2xl border border-border bg-card p-5 pb-safe md:rounded-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-foreground">Partager l'événement</h3>
              <button
                onClick={() => setOpen(false)}
                aria-label="Fermer"
                className="flex h-8 w-8 items-center justify-center rounded-full bg-secondary"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <a
              href={`https://wa.me/?text=${encodeURIComponent(waText)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex w-full items-center gap-3 rounded-xl bg-[#25D366] px-4 py-3 text-sm font-bold text-white transition-transform active:scale-[0.98]"
            >
              <MessageCircle className="h-5 w-5" />
              Partager sur WhatsApp
            </a>

            <button
              onClick={copyLink}
              className="flex w-full items-center gap-3 rounded-xl border border-border bg-secondary px-4 py-3 text-sm font-bold text-foreground"
            >
              {copied ? <Check className="h-5 w-5 text-[#1D9E75]" /> : <Copy className="h-5 w-5" />}
              {copied ? "Lien copié !" : "Copier le lien"}
            </button>

            <p className="truncate rounded-lg bg-background px-3 py-2 text-xs text-muted-foreground">
              {shareUrl}
            </p>
          </div>
        </div>
      )}
    </>
  );
}
