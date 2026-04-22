import { createContext, useContext, useState, useCallback, ReactNode } from "react";
import type { FlameStatus } from "./mock-data";
import { EVENTS } from "./mock-data";

type FlameMap = Record<string, FlameStatus>;
type CountMap = Record<string, number>;

type Ctx = {
  flames: FlameMap;
  counts: CountMap;
  toggleFlame: (eventId: string) => FlameStatus; // returns new status
  cycleFlame: (eventId: string) => FlameStatus;
};

const FlameContext = createContext<Ctx | null>(null);

const initialCounts: CountMap = EVENTS.reduce((acc, e) => {
  acc[e.id] = e.flameCount;
  return acc;
}, {} as CountMap);

export function FlameProvider({ children }: { children: ReactNode }) {
  const [flames, setFlames] = useState<FlameMap>({});
  const [counts, setCounts] = useState<CountMap>(initialCounts);

  const cycleFlame = useCallback((eventId: string): FlameStatus => {
    const current = flames[eventId] ?? "none";
    const next: FlameStatus =
      current === "none" ? "chaud" : current === "chaud" ? "going" : "none";

    setFlames((f) => ({ ...f, [eventId]: next }));
    setCounts((c) => {
      const base = initialCounts[eventId] ?? 0;
      const delta = next === "none" ? 0 : 1;
      return { ...c, [eventId]: base + delta };
    });
    return next;
  }, [flames]);

  const toggleFlame = cycleFlame;

  return (
    <FlameContext.Provider value={{ flames, counts, toggleFlame, cycleFlame }}>
      {children}
    </FlameContext.Provider>
  );
}

export function useFlames() {
  const ctx = useContext(FlameContext);
  if (!ctx) throw new Error("useFlames must be used within FlameProvider");
  return ctx;
}
