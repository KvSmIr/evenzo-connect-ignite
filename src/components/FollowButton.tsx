import { useEffect, useState } from "react";
import { Check, UserPlus } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-store";
import { useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

type Props = { organizerId: string };

export function FollowButton({ organizerId }: Props) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [following, setFollowing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!user || user.id === organizerId) {
      setLoading(false);
      return;
    }
    let active = true;
    (async () => {
      const { data } = await supabase
        .from("follows")
        .select("id")
        .eq("follower_id", user.id)
        .eq("following_id", organizerId)
        .maybeSingle();
      if (active) {
        setFollowing(!!data);
        setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, [user, organizerId]);

  if (!user || user.id === organizerId) return null;

  const toggle = async () => {
    if (busy) return;
    setBusy(true);
    const wasFollowing = following;
    setFollowing(!wasFollowing); // optimistic
    try {
      if (wasFollowing) {
        const { error } = await supabase
          .from("follows")
          .delete()
          .eq("follower_id", user.id)
          .eq("following_id", organizerId);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("follows")
          .insert({ follower_id: user.id, following_id: organizerId });
        if (error) throw error;
      }
    } catch (e) {
      setFollowing(wasFollowing);
      toast.error("Action impossible", {
        description: e instanceof Error ? e.message : "Réessaie",
      });
    } finally {
      setBusy(false);
    }
  };

  if (loading) {
    return (
      <button disabled className="rounded-lg border border-border bg-secondary px-3 py-1.5 text-xs font-semibold text-muted-foreground">
        ...
      </button>
    );
  }

  if (following) {
    return (
      <button
        onClick={toggle}
        disabled={busy}
        className={cn(
          "flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-bold transition-colors",
          "border-[#1D9E75] bg-[#1D9E75]/10 text-[#1D9E75] hover:bg-[#1D9E75]/20"
        )}
      >
        <Check className="h-3.5 w-3.5" strokeWidth={3} />
        Abonné
      </button>
    );
  }

  return (
    <button
      onClick={toggle}
      disabled={busy}
      className="flex items-center gap-1.5 rounded-lg border border-border bg-secondary px-3 py-1.5 text-xs font-semibold text-foreground hover:bg-surface-elevated"
    >
      <UserPlus className="h-3.5 w-3.5" />
      Suivre
    </button>
  );
}

void useNavigate; // keep import for future inline auth nav
