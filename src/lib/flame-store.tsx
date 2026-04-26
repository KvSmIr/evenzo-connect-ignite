import { createContext, useContext, useEffect, useRef, useState, useCallback, ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./auth-store";

export type FlameStatus = "chaud" | "going";
// Per user, per event, an independent boolean for each status
type StatusSet = { chaud: boolean; going: boolean };
type FlameMap = Record<string, StatusSet>;
type CountMap = Record<string, { chaud: number; going: number }>;

type Ctx = {
  // Backwards-compatible single value used by FlameButton: returns "chaud" if chaud is set, else "going" if going is set, else "none"
  flames: Record<string, "none" | "chaud" | "going">;
  flagsFor: (eventId: string) => StatusSet;
  counts: CountMap;
  totalFor: (eventId: string) => number;
  setFlame: (eventId: string, next: "none" | "chaud" | "going") => Promise<"none" | "chaud" | "going">;
  toggleChaud: (eventId: string) => Promise<"none" | "chaud" | "going">;
  toggleGoing: (eventId: string) => Promise<"none" | "chaud" | "going">;
};

const FlameContext = createContext<Ctx | null>(null);

const empty: StatusSet = { chaud: false, going: false };

export function FlameProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [flagsMap, setFlagsMap] = useState<FlameMap>({});
  const [counts, setCounts] = useState<CountMap>({});
  // Track in-flight writes to prevent double-clicks and to ignore our own realtime echoes
  const inFlightRef = useRef<Set<string>>(new Set());
  const userIdRef = useRef<string | null>(null);
  userIdRef.current = user?.id ?? null;

  useEffect(() => {
    let active = true;
    (async () => {
      const { data } = await supabase.from("flames").select("event_id,status,user_id");
      if (!active || !data) return;
      const c: CountMap = {};
      const mine: FlameMap = {};
      for (const r of data as Array<{ event_id: string; status: FlameStatus; user_id: string }>) {
        if (!c[r.event_id]) c[r.event_id] = { chaud: 0, going: 0 };
        if (r.status === "chaud") c[r.event_id].chaud += 1;
        if (r.status === "going") c[r.event_id].going += 1;
        if (user && r.user_id === user.id) {
          if (!mine[r.event_id]) mine[r.event_id] = { chaud: false, going: false };
          mine[r.event_id][r.status] = true;
        }
      }
      setCounts(c);
      setFlagsMap(mine);
    })();

    const channelName = `flames-realtime-${Math.random().toString(36).slice(2, 10)}`;
    const channel = supabase.channel(channelName);
    channel.on(
      "postgres_changes",
      { event: "*", schema: "public", table: "flames" },
      (payload) => {
        setCounts((prev) => {
          const next = { ...prev };
          const apply = (eid: string, status: FlameStatus, delta: number) => {
            if (!next[eid]) next[eid] = { chaud: 0, going: 0 };
            next[eid] = {
              ...next[eid],
              [status]: Math.max(0, next[eid][status] + delta),
            };
          };
          if (payload.eventType === "INSERT") {
            const n = payload.new as { event_id: string; status: FlameStatus; user_id: string };
            // Skip our own changes — they were already applied optimistically
            if (n.user_id === userIdRef.current) return prev;
            apply(n.event_id, n.status, +1);
          } else if (payload.eventType === "DELETE") {
            const o = payload.old as { event_id: string; status: FlameStatus; user_id: string };
            if (o.user_id === userIdRef.current) return prev;
            apply(o.event_id, o.status, -1);
          }
          return next;
        });
      }
    );
    channel.subscribe();

    return () => {
      active = false;
      supabase.removeChannel(channel);
    };
  }, [user]);

  const flagsFor = useCallback((eventId: string) => flagsMap[eventId] ?? empty, [flagsMap]);

  const writeStatus = useCallback(
    async (eventId: string, status: FlameStatus, on: boolean) => {
      if (!user) return;
      const key = `${eventId}:${status}`;
      // Prevent rapid double-clicks while a write is in flight
      if (inFlightRef.current.has(key)) return;
      const prev = flagsFor(eventId);
      // No-op if already in desired state (avoids extra increments)
      if (prev[status] === on) return;
      inFlightRef.current.add(key);
      // optimistic
      setFlagsMap((m) => ({ ...m, [eventId]: { ...(m[eventId] ?? empty), [status]: on } }));
      setCounts((c) => {
        const cur = c[eventId] ?? { chaud: 0, going: 0 };
        return {
          ...c,
          [eventId]: { ...cur, [status]: Math.max(0, cur[status] + (on ? 1 : -1)) },
        };
      });
      try {
        if (on) {
          const { error } = await supabase
            .from("flames")
            .upsert(
              { user_id: user.id, event_id: eventId, status },
              { onConflict: "user_id,event_id,status", ignoreDuplicates: true }
            );
          if (error) throw error;
        } else {
          const { error } = await supabase
            .from("flames")
            .delete()
            .eq("user_id", user.id)
            .eq("event_id", eventId)
            .eq("status", status);
          if (error) throw error;
        }
      } catch {
        // revert state and counts
        setFlagsMap((m) => ({ ...m, [eventId]: prev }));
        setCounts((c) => {
          const cur = c[eventId] ?? { chaud: 0, going: 0 };
          return {
            ...c,
            [eventId]: { ...cur, [status]: Math.max(0, cur[status] + (on ? -1 : +1)) },
          };
        });
      } finally {
        inFlightRef.current.delete(key);
      }
    },
    [user, flagsFor]
  );

  const toggleChaud = useCallback(
    async (eventId: string) => {
      const cur = flagsFor(eventId);
      await writeStatus(eventId, "chaud", !cur.chaud);
      const nextChaud = !cur.chaud;
      return nextChaud ? "chaud" : cur.going ? "going" : "none";
    },
    [flagsFor, writeStatus]
  );

  const toggleGoing = useCallback(
    async (eventId: string) => {
      const cur = flagsFor(eventId);
      await writeStatus(eventId, "going", !cur.going);
      const nextGoing = !cur.going;
      return nextGoing ? "going" : cur.chaud ? "chaud" : "none";
    },
    [flagsFor, writeStatus]
  );

  const setFlame = useCallback(
    async (eventId: string, next: "none" | "chaud" | "going") => {
      // Compatibility helper used by FlameButton; treat as toggle on the requested status
      if (next === "none") {
        const cur = flagsFor(eventId);
        if (cur.chaud) await writeStatus(eventId, "chaud", false);
        if (cur.going) await writeStatus(eventId, "going", false);
        return "none" as const;
      }
      if (next === "chaud") {
        await writeStatus(eventId, "chaud", true);
        return "chaud" as const;
      }
      await writeStatus(eventId, "going", true);
      return "going" as const;
    },
    [flagsFor, writeStatus]
  );

  // Backwards-compatible flat map
  const flames: Record<string, "none" | "chaud" | "going"> = {};
  for (const [eid, s] of Object.entries(flagsMap)) {
    flames[eid] = s.chaud ? "chaud" : s.going ? "going" : "none";
  }

  const totalFor = useCallback(
    (eventId: string) => {
      const c = counts[eventId];
      return c ? c.chaud + c.going : 0;
    },
    [counts]
  );

  return (
    <FlameContext.Provider value={{ flames, flagsFor, counts, totalFor, setFlame, toggleChaud, toggleGoing }}>
      {children}
    </FlameContext.Provider>
  );
}

export function useFlames() {
  const ctx = useContext(FlameContext);
  if (!ctx) throw new Error("useFlames must be used within FlameProvider");
  return ctx;
}
