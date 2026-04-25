import { createContext, useContext, useEffect, useState, useCallback, ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./auth-store";

export type FlameStatus = "none" | "chaud" | "going";
type FlameMap = Record<string, FlameStatus>;
type CountMap = Record<string, { chaud: number; going: number }>;

type Ctx = {
  flames: FlameMap;
  counts: CountMap;
  totalFor: (eventId: string) => number;
  setFlame: (eventId: string, next: FlameStatus) => Promise<FlameStatus>;
  cycleFlame: (eventId: string) => Promise<FlameStatus>;
  toggleChaud: (eventId: string) => Promise<FlameStatus>;
  toggleGoing: (eventId: string) => Promise<FlameStatus>;
};

const FlameContext = createContext<Ctx | null>(null);

export function FlameProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [flames, setFlames] = useState<FlameMap>({});
  const [counts, setCounts] = useState<CountMap>({});

  // Load all flames once + per-user state
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
        if (user && r.user_id === user.id) mine[r.event_id] = r.status;
      }
      setCounts(c);
      setFlames(mine);
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
            if (status === "chaud") next[eid] = { ...next[eid], chaud: Math.max(0, next[eid].chaud + delta) };
            if (status === "going") next[eid] = { ...next[eid], going: Math.max(0, next[eid].going + delta) };
          };
          if (payload.eventType === "INSERT") {
            const n = payload.new as { event_id: string; status: FlameStatus };
            apply(n.event_id, n.status, +1);
          } else if (payload.eventType === "DELETE") {
            const o = payload.old as { event_id: string; status: FlameStatus };
            apply(o.event_id, o.status, -1);
          } else if (payload.eventType === "UPDATE") {
            const o = payload.old as { event_id: string; status: FlameStatus };
            const n = payload.new as { event_id: string; status: FlameStatus };
            apply(o.event_id, o.status, -1);
            apply(n.event_id, n.status, +1);
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

  const setFlame = useCallback(
    async (eventId: string, next: FlameStatus): Promise<FlameStatus> => {
      if (!user) return "none";
      const prev = flames[eventId] ?? "none";
      // optimistic
      setFlames((f) => ({ ...f, [eventId]: next }));
      setCounts((c) => {
        const cur = c[eventId] ?? { chaud: 0, going: 0 };
        const updated = { ...cur };
        if (prev === "chaud") updated.chaud = Math.max(0, updated.chaud - 1);
        if (prev === "going") updated.going = Math.max(0, updated.going - 1);
        if (next === "chaud") updated.chaud += 1;
        if (next === "going") updated.going += 1;
        return { ...c, [eventId]: updated };
      });

      try {
        if (next === "none") {
          await supabase.from("flames").delete().eq("user_id", user.id).eq("event_id", eventId);
        } else {
          // upsert by deleting then inserting (no unique constraint guaranteed)
          await supabase.from("flames").delete().eq("user_id", user.id).eq("event_id", eventId);
          await supabase.from("flames").insert({ user_id: user.id, event_id: eventId, status: next });
        }
      } catch {
        // revert on error
        setFlames((f) => ({ ...f, [eventId]: prev }));
      }
      return next;
    },
    [user, flames]
  );

  const toggleChaud = useCallback(
    (eventId: string) => {
      const cur = flames[eventId] ?? "none";
      return setFlame(eventId, cur === "chaud" ? "none" : "chaud");
    },
    [flames, setFlame]
  );

  const toggleGoing = useCallback(
    (eventId: string) => {
      const cur = flames[eventId] ?? "none";
      return setFlame(eventId, cur === "going" ? "none" : "going");
    },
    [flames, setFlame]
  );

  const cycleFlame = useCallback(
    (eventId: string) => {
      const cur = flames[eventId] ?? "none";
      const next: FlameStatus = cur === "none" ? "chaud" : cur === "chaud" ? "going" : "none";
      return setFlame(eventId, next);
    },
    [flames, setFlame]
  );

  const totalFor = useCallback(
    (eventId: string) => {
      const c = counts[eventId];
      return c ? c.chaud + c.going : 0;
    },
    [counts]
  );

  return (
    <FlameContext.Provider value={{ flames, counts, totalFor, setFlame, cycleFlame, toggleChaud, toggleGoing }}>
      {children}
    </FlameContext.Provider>
  );
}

export function useFlames() {
  const ctx = useContext(FlameContext);
  if (!ctx) throw new Error("useFlames must be used within FlameProvider");
  return ctx;
}
