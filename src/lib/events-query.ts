import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";

export type DbEvent = Database["public"]["Tables"]["events"]["Row"];
export type EventWithOrganizer = DbEvent & {
  organizer?: { display_name: string | null; username: string | null; avatar_url: string | null } | null;
};

export const EVENTS_QUERY_KEY = ["events", "feed"] as const;

async function fetchEvents(): Promise<EventWithOrganizer[]> {
  const { data, error } = await supabase
    .from("events")
    .select("*")
    .eq("status", "published")
    .eq("privacy", "public")
    .order("created_at", { ascending: false })
    .limit(200);
  if (error) throw error;

  // Fetch organizer profiles in a second query (no FK to auth.users)
  const orgIds = Array.from(new Set((data ?? []).map((e) => e.organizer_id)));
  if (orgIds.length === 0) return [];
  const { data: profiles } = await supabase
    .from("profiles")
    .select("user_id,display_name,username,avatar_url")
    .in("user_id", orgIds);
  const byId = new Map((profiles ?? []).map((p) => [p.user_id, p]));
  return (data ?? []).map((e) => ({
    ...e,
    organizer: byId.get(e.organizer_id) ?? null,
  }));
}

export function useEventsFeed() {
  const qc = useQueryClient();
  const query = useQuery({
    queryKey: EVENTS_QUERY_KEY,
    queryFn: fetchEvents,
    staleTime: 30_000,
  });

  // Realtime subscription
  useEffect(() => {
    const channel = supabase
      .channel("events-feed")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "events" },
        () => {
          qc.invalidateQueries({ queryKey: EVENTS_QUERY_KEY });
        }
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [qc]);

  return query;
}

export function useEvent(eventId: string) {
  return useQuery({
    queryKey: ["event", eventId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("events")
        .select("*")
        .eq("id", eventId)
        .maybeSingle();
      if (error) throw error;
      if (!data) return null;
      const { data: org } = await supabase
        .from("profiles")
        .select("user_id,display_name,username,avatar_url")
        .eq("user_id", data.organizer_id)
        .maybeSingle();
      return { ...data, organizer: org ?? null } as EventWithOrganizer;
    },
    enabled: !!eventId,
  });
}

// Helpers to format a DB event for the existing EventCard / map UI shape.
export function dayLabelFromDate(dateStr: string, timeStr: string): string {
  const d = new Date(`${dateStr}T${timeStr}`);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(today.getDate() + 1);
  const target = new Date(d);
  target.setHours(0, 0, 0, 0);

  if (target.getTime() === today.getTime()) return "Ce soir";
  if (target.getTime() === tomorrow.getTime()) return "Demain";
  const diff = (target.getTime() - today.getTime()) / 86400000;
  if (diff > 0 && diff < 7) {
    return d.toLocaleDateString("fr-FR", { weekday: "long" }).replace(/^./, (c) => c.toUpperCase());
  }
  return d.toLocaleDateString("fr-FR", { day: "numeric", month: "short" });
}

export function formatTime(timeStr: string): string {
  // "20:00:00" -> "20h00"
  const [h, m] = timeStr.split(":");
  return `${h}h${m}`;
}

export function priceLabel(e: Pick<DbEvent, "is_free" | "price">): string {
  if (e.is_free || !e.price) return "Gratuit";
  return `${Number(e.price).toLocaleString("fr-FR")} FCFA`;
}
