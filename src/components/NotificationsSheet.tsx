import { useEffect } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { Bell, X, Flame, CheckCircle2, PartyPopper, UserPlus, Calendar } from "lucide-react";
import { useNotifications } from "@/lib/notifications";
import type { Database } from "@/integrations/supabase/types";
import { cn } from "@/lib/utils";

type Notification = Database["public"]["Tables"]["notifications"]["Row"];

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return "à l'instant";
  if (m < 60) return `il y a ${m} min`;
  const h = Math.floor(m / 60);
  if (h < 24) return `il y a ${h}h`;
  const d = Math.floor(h / 24);
  return `il y a ${d}j`;
}

const ICONS: Record<Notification["type"], { icon: React.ElementType; color: string; emoji: string }> = {
  flame: { icon: Flame, color: "#E8593C", emoji: "🔥" },
  event_published: { icon: CheckCircle2, color: "#1D9E75", emoji: "✅" },
  welcome: { icon: PartyPopper, color: "#F97316", emoji: "🎉" },
  friend_joined: { icon: UserPlus, color: "#3B82F6", emoji: "👤" },
  event_reminder: { icon: Calendar, color: "#F59E0B", emoji: "⏰" },
};

export function NotificationsSheet({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { data, markAllRead, markRead, unreadCount } = useNotifications();
  const navigate = useNavigate();

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  const handleClick = (n: Notification) => {
    if (!n.is_read) markRead(n.id);
    if (n.event_id) {
      navigate({ to: "/event/$eventId", params: { eventId: n.event_id } });
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-fade-in" onClick={onClose} />
      <div className="absolute bottom-0 left-1/2 w-full max-w-[430px] -translate-x-1/2 rounded-t-3xl bg-card border-t border-border max-h-[85vh] flex flex-col animate-slide-up">
        <div className="mx-auto mt-3 h-1 w-10 rounded-full bg-border" />
        <header className="flex items-center justify-between px-5 pt-3 pb-2">
          <div className="flex items-center gap-2">
            <Bell className="h-5 w-5 text-primary" />
            <h2 className="text-lg font-bold text-foreground">Notifications</h2>
            {unreadCount > 0 && (
              <span className="rounded-full bg-primary px-2 py-0.5 text-[10px] font-bold text-primary-foreground">
                {unreadCount}
              </span>
            )}
          </div>
          <button onClick={onClose} aria-label="Fermer" className="rounded-full bg-secondary p-2">
            <X className="h-4 w-4" />
          </button>
        </header>

        {unreadCount > 0 && (
          <button
            onClick={markAllRead}
            className="mx-5 mb-2 self-start rounded-full bg-secondary px-3 py-1 text-xs font-semibold text-primary"
          >
            Tout marquer comme lu
          </button>
        )}

        <div className="flex-1 overflow-y-auto px-2 pb-6">
          {(!data || data.length === 0) && (
            <div className="px-4 py-12 text-center">
              <p className="text-4xl">🔕</p>
              <p className="mt-3 text-sm font-semibold text-foreground">Aucune notification</p>
              <p className="mt-1 text-xs text-muted-foreground">
                Tu seras notifié quand il se passe quelque chose 🔥
              </p>
            </div>
          )}
          <ul>
            {(data ?? []).map((n) => {
              const meta = ICONS[n.type];
              return (
                <li key={n.id}>
                  <button
                    onClick={() => handleClick(n)}
                    className={cn(
                      "flex w-full items-start gap-3 rounded-xl px-3 py-3 text-left transition-colors hover:bg-secondary/60",
                      !n.is_read && "bg-secondary/40"
                    )}
                  >
                    <div
                      className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-base"
                      style={{ background: `${meta.color}26`, color: meta.color }}
                    >
                      {meta.emoji}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold text-foreground">{n.title}</p>
                      {n.body && (
                        <p className="line-clamp-2 text-xs text-muted-foreground">{n.body}</p>
                      )}
                      <p className="mt-1 text-[10px] text-muted-foreground">{timeAgo(n.created_at)}</p>
                    </div>
                    {!n.is_read && (
                      <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-primary" />
                    )}
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
      </div>
      <Link to="/" className="hidden" />
    </div>
  );
}
