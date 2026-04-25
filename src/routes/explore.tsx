import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { Search, SlidersHorizontal, X, MapPin, Flame, LocateFixed, Check } from "lucide-react";
import L from "leaflet";
import { MobileFrame } from "@/components/MobileFrame";
import { CategoryBadge } from "@/components/CategoryBadge";
import { FlameButton } from "@/components/FlameButton";
import { useEventsFeed, dayLabelFromDate, formatTime, type EventWithOrganizer } from "@/lib/events-query";
import { useFlames } from "@/lib/flame-store";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/explore")({
  head: () => ({
    meta: [
      { title: "Explorer — EVENZO" },
      { name: "description", content: "Explore les événements de Lomé sur la carte." },
    ],
  }),
  component: ExplorePage,
});

const LOME_CENTER: [number, number] = [6.1375, 1.2123];

const ALL_CATS = ["Soirée", "Concert", "Sport", "Culture", "Gastronomie", "Networking", "Autre"];

function ExplorePage() {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<L.Map | null>(null);
  const markersLayer = useRef<L.LayerGroup | null>(null);
  const userMarker = useRef<L.Marker | null>(null);

  const [selected, setSelected] = useState<EventWithOrganizer | null>(null);
  const [query, setQuery] = useState("");
  const [filterOpen, setFilterOpen] = useState(false);
  const [activeCats, setActiveCats] = useState<string[]>([]);
  const [freeOnly, setFreeOnly] = useState(false);
  const [weekendOnly, setWeekendOnly] = useState(false);

  const { counts } = useFlames();
  const { data: events } = useEventsFeed();
  const navigate = useNavigate();

  // Filters
  const filtered = useMemo(() => {
    return (events ?? []).filter((e) => {
      if (e.lat == null || e.lng == null) return false;
      if (activeCats.length && !activeCats.includes(e.category)) return false;
      if (freeOnly && !e.is_free) return false;
      if (weekendOnly) {
        const d = new Date(e.event_date);
        const day = d.getDay();
        if (day !== 0 && day !== 6) return false;
      }
      if (query.trim()) {
        const q = query.toLowerCase();
        if (!(e.title + " " + e.location_name + " " + e.category).toLowerCase().includes(q)) return false;
      }
      return true;
    });
  }, [events, activeCats, freeOnly, weekendOnly, query]);

  // Init map once
  useEffect(() => {
    if (!mapRef.current || mapInstance.current) return;
    const map = L.map(mapRef.current, {
      center: LOME_CENTER,
      zoom: 13,
      zoomControl: false,
      attributionControl: true,
      fadeAnimation: false,
      zoomAnimation: false,
    });
    L.tileLayer("https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png", {
      attribution: "© OpenStreetMap © CARTO",
      subdomains: "abcd",
      maxZoom: 19,
    }).addTo(map);
    markersLayer.current = L.layerGroup().addTo(map);
    mapInstance.current = map;

    return () => {
      try {
        map.stop();
        markersLayer.current?.clearLayers();
        markersLayer.current = null;
        userMarker.current = null;
        map.off();
        map.remove();
      } catch {
        // ignore — leaflet sometimes throws during teardown after a zoom transition
      }
      mapInstance.current = null;
    };
  }, []);

  // Update markers when data/filters change
  useEffect(() => {
    if (!mapInstance.current || !markersLayer.current) return;
    markersLayer.current.clearLayers();
    for (const e of filtered) {
      const total = (counts[e.id]?.chaud ?? 0) + (counts[e.id]?.going ?? 0);
      const size = total > 150 ? 56 : total > 50 ? 44 : 32;
      const html = `
        <div style="display:flex;flex-direction:column;align-items:center;pointer-events:auto">
          <div style="
            width:${size}px;height:${size}px;
            display:flex;align-items:center;justify-content:center;
            background:linear-gradient(135deg,#E8593C,#F97316);
            border-radius:50%;
            box-shadow:0 0 16px rgba(232,89,60,0.55), 0 4px 12px rgba(0,0,0,0.5);
            font-size:${Math.round(size * 0.45)}px;
          ">🔥</div>
          <div style="
            margin-top:4px;
            background:rgba(10,10,10,0.85);
            color:#fff;font-weight:700;font-size:10px;
            padding:1px 6px;border-radius:9999px;
            border:1px solid rgba(255,255,255,0.1);
          ">${total}</div>
        </div>`;
      const icon = L.divIcon({
        html,
        className: "evenzo-marker",
        iconSize: [size, size + 18],
        iconAnchor: [size / 2, size / 2],
      });
      const marker = L.marker([Number(e.lat), Number(e.lng)], { icon });
      marker.on("click", () => {
        setSelected(e);
        mapInstance.current!.flyTo([Number(e.lat), Number(e.lng)], 15, { duration: 0.6 });
      });
      marker.addTo(markersLayer.current!);
    }
  }, [filtered, counts]);

  const locateMe = () => {
    if (!navigator.geolocation || !mapInstance.current) return;
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const ll: [number, number] = [pos.coords.latitude, pos.coords.longitude];
        mapInstance.current!.flyTo(ll, 14, { duration: 0.7 });
        if (userMarker.current) userMarker.current.remove();
        const icon = L.divIcon({
          html: `<div style="width:18px;height:18px;background:#3B82F6;border-radius:50%;border:3px solid white;box-shadow:0 0 0 8px rgba(59,130,246,0.25)"></div>`,
          className: "user-marker",
          iconSize: [18, 18],
          iconAnchor: [9, 9],
        });
        userMarker.current = L.marker(ll, { icon }).addTo(mapInstance.current!);
      },
      () => alert("Impossible d'accéder à la position"),
      { enableHighAccuracy: true }
    );
  };

  const searchResults = query.trim()
    ? filtered.slice(0, 5)
    : [];

  return (
    <MobileFrame>
      <div className="relative h-screen w-full overflow-hidden">
        <div ref={mapRef} className="absolute inset-0 z-0 bg-[#0a1018]" />

        {/* Search */}
        <div className="absolute left-0 right-0 top-0 z-[400] px-4 pt-safe pt-4">
          <div className="flex items-center gap-2 rounded-2xl border border-border bg-background/90 p-2 shadow-elevated backdrop-blur-xl">
            <Search className="ml-2 h-4 w-4 text-muted-foreground" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Chercher un événement, un lieu…"
              className="flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground focus:outline-none"
            />
            {query && (
              <button onClick={() => setQuery("")} aria-label="Effacer">
                <X className="h-4 w-4 text-muted-foreground" />
              </button>
            )}
          </div>
          {searchResults.length > 0 && (
            <div className="mt-2 overflow-hidden rounded-2xl border border-border bg-background/95 shadow-elevated backdrop-blur-xl">
              {searchResults.map((e) => (
                <button
                  key={e.id}
                  onClick={() => {
                    setSelected(e);
                    mapInstance.current?.flyTo([Number(e.lat), Number(e.lng)], 15, { duration: 0.6 });
                    setQuery("");
                  }}
                  className="flex w-full items-center gap-3 px-3 py-2.5 text-left transition-colors hover:bg-secondary/60"
                >
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gradient-flame text-sm">🔥</div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-foreground">{e.title}</p>
                    <p className="truncate text-xs text-muted-foreground">{e.location_name}</p>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Locate */}
        <button
          onClick={locateMe}
          aria-label="Ma position"
          className="absolute bottom-44 left-4 z-[400] flex h-12 w-12 items-center justify-center rounded-full bg-card shadow-elevated border border-border"
        >
          <LocateFixed className="h-5 w-5 text-primary" />
        </button>

        {/* Filter */}
        <button
          onClick={() => setFilterOpen(true)}
          aria-label="Filtres"
          className="absolute bottom-32 right-4 z-[400] flex h-12 w-12 items-center justify-center rounded-full bg-card shadow-elevated border border-border"
        >
          <SlidersHorizontal className="h-5 w-5 text-foreground" />
          {(activeCats.length > 0 || freeOnly || weekendOnly) && (
            <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground">
              {activeCats.length + (freeOnly ? 1 : 0) + (weekendOnly ? 1 : 0)}
            </span>
          )}
        </button>

        {/* Selected event sheet */}
        {selected && (
          <div
            className="absolute bottom-20 left-3 right-3 z-[400] animate-slide-up rounded-2xl border border-border bg-card shadow-elevated"
            key={selected.id}
          >
            <div className="mx-auto mt-2 h-1 w-10 rounded-full bg-border" />
            <button
              onClick={() => setSelected(null)}
              className="absolute right-2 top-2 rounded-full bg-secondary p-1.5"
              aria-label="Fermer"
            >
              <X className="h-3.5 w-3.5 text-muted-foreground" />
            </button>
            {selected.cover_url && (
              <img
                src={selected.cover_url}
                alt={selected.title}
                className="mt-3 h-[120px] w-full object-cover"
              />
            )}
            <div className="space-y-1 p-3">
              <CategoryBadge category={selected.category as never} />
              <h3 className="line-clamp-1 text-base font-bold text-foreground">{selected.title}</h3>
              <p className="flex items-center gap-1 text-[13px] text-muted-foreground">
                <MapPin className="h-3 w-3" /> {selected.location_name}
              </p>
              <p className="flex items-center gap-1 text-[13px] font-semibold text-accent">
                <Flame className="h-3 w-3" fill="currentColor" />
                {(counts[selected.id]?.chaud ?? 0)} chauds · {dayLabelFromDate(selected.event_date, selected.event_time)} {formatTime(selected.event_time)}
              </p>
              <div className="flex gap-2 pt-2">
                <div className="flex-1">
                  <FlameButton eventId={selected.id} fullWidth pill />
                </div>
                <button
                  onClick={() => navigate({ to: "/event/$eventId", params: { eventId: selected.id } })}
                  className="rounded-[20px] bg-secondary px-4 text-[13px] font-bold text-foreground"
                >
                  Voir →
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Filter sheet */}
        {filterOpen && (
          <div className="fixed inset-0 z-[500]">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-fade-in" onClick={() => setFilterOpen(false)} />
            <div className="absolute bottom-0 left-1/2 w-full max-w-[430px] -translate-x-1/2 rounded-t-3xl border-t border-border bg-card animate-slide-up">
              <div className="mx-auto mt-3 h-1 w-10 rounded-full bg-border" />
              <div className="p-5">
                <h2 className="text-lg font-bold text-foreground">Filtres</h2>
                <p className="mt-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Catégorie</p>
                <div className="mt-2 flex flex-wrap gap-2">
                  {ALL_CATS.map((c) => {
                    const on = activeCats.includes(c);
                    return (
                      <button
                        key={c}
                        onClick={() =>
                          setActiveCats((prev) => (on ? prev.filter((x) => x !== c) : [...prev, c]))
                        }
                        className={cn(
                          "rounded-full px-3 py-1.5 text-xs font-semibold transition-colors",
                          on ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground"
                        )}
                      >
                        {c}
                      </button>
                    );
                  })}
                </div>

                <div className="mt-5 space-y-3">
                  <Toggle label="Événements gratuits seulement" value={freeOnly} onChange={setFreeOnly} />
                  <Toggle label="Ce weekend seulement" value={weekendOnly} onChange={setWeekendOnly} />
                </div>

                <div className="mt-5 flex gap-2">
                  <button
                    onClick={() => {
                      setActiveCats([]);
                      setFreeOnly(false);
                      setWeekendOnly(false);
                    }}
                    className="h-11 flex-1 rounded-lg border border-border text-sm font-semibold text-foreground"
                  >
                    Réinitialiser
                  </button>
                  <button
                    onClick={() => setFilterOpen(false)}
                    className="h-11 flex-1 rounded-lg bg-gradient-flame text-sm font-bold text-primary-foreground shadow-flame"
                  >
                    Appliquer
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </MobileFrame>
  );
}

function Toggle({ label, value, onChange }: { label: string; value: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      onClick={() => onChange(!value)}
      className="flex w-full items-center justify-between rounded-xl border border-border bg-secondary px-4 py-3 text-left"
    >
      <span className="text-sm text-foreground">{label}</span>
      <span
        className={cn(
          "flex h-6 w-11 items-center rounded-full p-0.5 transition-colors",
          value ? "bg-primary justify-end" : "bg-muted justify-start"
        )}
      >
        <span className="flex h-5 w-5 items-center justify-center rounded-full bg-white">
          {value && <Check className="h-3 w-3 text-primary" strokeWidth={3} />}
        </span>
      </span>
    </button>
  );
}
