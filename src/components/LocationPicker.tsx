import { useEffect, useRef, useState } from "react";
import { MapPin, Search, Loader2, Check } from "lucide-react";
import { cn } from "@/lib/utils";

export type PickedLocation = {
  name: string;
  address: string;
  lat: number;
  lng: number;
};

const POPULAR: PickedLocation[] = [
  { name: "Palais de la Mer", address: "Lomé, Togo", lat: 6.1234, lng: 1.2156 },
  { name: "Palais des Congrès", address: "Lomé, Togo", lat: 6.1375, lng: 1.2123 },
  { name: "Stade de Kégué", address: "Lomé, Togo", lat: 6.1456, lng: 1.2234 },
  { name: "Bar Byblos", address: "Lomé, Togo", lat: 6.1289, lng: 1.2167 },
  { name: "Café Nuances", address: "Lomé, Togo", lat: 6.1312, lng: 1.2145 },
  { name: "Place de l'Indépendance", address: "Lomé, Togo", lat: 6.1318, lng: 1.2132 },
];

type NominatimResult = {
  display_name: string;
  lat: string;
  lon: string;
  name?: string;
  address?: { [k: string]: string };
};

type Props = {
  value: PickedLocation | null;
  onChange: (loc: PickedLocation | null) => void;
};

export function LocationPicker({ value, onChange }: Props) {
  const [query, setQuery] = useState(value?.name ?? "");
  const [results, setResults] = useState<NominatimResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const mapRef = useRef<HTMLDivElement>(null);
  const leafletMapRef = useRef<unknown>(null);
  const markerRef = useRef<unknown>(null);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (query.length < 2 || (value && query === value.name)) {
      setResults([]);
      return;
    }
    debounceRef.current = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await fetch(
          `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&limit=5&countrycodes=tg&addressdetails=1`,
          { headers: { "Accept-Language": "fr" } }
        );
        const json = (await res.json()) as NominatimResult[];
        setResults(json);
        setShowDropdown(true);
      } catch {
        setResults([]);
      } finally {
        setLoading(false);
      }
    }, 350);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query, value]);

  // Init / update Leaflet map when a location is picked
  useEffect(() => {
    if (!value || !mapRef.current) return;
    let cancelled = false;
    (async () => {
      const L = (await import("leaflet")).default;
      await import("leaflet/dist/leaflet.css");
      if (cancelled || !mapRef.current) return;

      const icon = L.divIcon({
        className: "",
        html: `<div style="width:30px;height:38px;display:flex;align-items:center;justify-content:center;">
          <svg width="30" height="38" viewBox="0 0 30 38" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M15 0C6.7 0 0 6.7 0 15c0 11 15 23 15 23s15-12 15-23C30 6.7 23.3 0 15 0z" fill="#E8593C"/>
            <circle cx="15" cy="15" r="6" fill="#fff"/>
          </svg>
        </div>`,
        iconSize: [30, 38],
        iconAnchor: [15, 38],
      });

      if (!leafletMapRef.current) {
        const map = L.map(mapRef.current, {
          center: [value.lat, value.lng],
          zoom: 15,
          zoomControl: false,
          attributionControl: false,
        });
        L.tileLayer("https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png", {
          subdomains: "abcd",
          maxZoom: 19,
        }).addTo(map);
        const marker = L.marker([value.lat, value.lng], { icon, draggable: true }).addTo(map);
        marker.on("dragend", () => {
          const ll = marker.getLatLng();
          onChange({ ...value, lat: ll.lat, lng: ll.lng });
        });
        leafletMapRef.current = map;
        markerRef.current = marker;
      } else {
        const map = leafletMapRef.current as L.Map;
        const marker = markerRef.current as L.Marker;
        map.setView([value.lat, value.lng], 15);
        marker.setLatLng([value.lat, value.lng]);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [value, onChange]);

  // Cleanup map on unmount
  useEffect(() => {
    return () => {
      try {
        const map = leafletMapRef.current as { remove: () => void } | null;
        if (map) map.remove();
      } catch {
        /* noop */
      }
      leafletMapRef.current = null;
      markerRef.current = null;
    };
  }, []);

  const pick = (loc: PickedLocation) => {
    onChange(loc);
    setQuery(loc.name);
    setResults([]);
    setShowDropdown(false);
  };

  const pickFromNominatim = (r: NominatimResult) => {
    const name =
      r.name ??
      r.address?.amenity ??
      r.address?.shop ??
      r.address?.building ??
      r.display_name.split(",")[0];
    pick({
      name,
      address: r.display_name,
      lat: parseFloat(r.lat),
      lng: parseFloat(r.lon),
    });
  };

  return (
    <div className="space-y-2">
      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-primary" />
        <input
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            if (value && e.target.value !== value.name) onChange(null);
          }}
          onFocus={() => results.length > 0 && setShowDropdown(true)}
          onBlur={() => setTimeout(() => setShowDropdown(false), 150)}
          placeholder="Rechercher un lieu à Lomé…"
          className="input pl-9 pr-9"
        />
        {loading && (
          <Loader2 className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-muted-foreground" />
        )}
        {showDropdown && results.length > 0 && (
          <div className="absolute left-0 right-0 top-full z-20 mt-1 max-h-64 overflow-y-auto rounded-xl border border-border bg-card shadow-elevated">
            {results.map((r, i) => (
              <button
                key={i}
                type="button"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => pickFromNominatim(r)}
                className="flex w-full items-start gap-2 border-b border-border/50 px-3 py-2.5 text-left last:border-0 hover:bg-secondary"
              >
                <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-foreground">
                    {r.name ?? r.display_name.split(",")[0]}
                  </p>
                  <p className="truncate text-xs text-muted-foreground">{r.display_name}</p>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Quick chips */}
      <div className="no-scrollbar -mx-1 flex gap-1.5 overflow-x-auto px-1">
        {POPULAR.map((p) => {
          const active = value?.name === p.name;
          return (
            <button
              key={p.name}
              type="button"
              onClick={() => pick(p)}
              className={cn(
                "shrink-0 rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors",
                active
                  ? "border-primary bg-primary/15 text-primary"
                  : "border-border bg-secondary text-muted-foreground hover:text-foreground"
              )}
            >
              📍 {p.name}
            </button>
          );
        })}
      </div>

      {/* Mini map preview */}
      {value && (
        <div className="space-y-2">
          <div
            ref={mapRef}
            className="relative h-[150px] w-full overflow-hidden rounded-xl border border-border"
            style={{ background: "#1a1a1a" }}
          />
          <p className="text-[11px] text-muted-foreground">
            Glisse l'épingle pour ajuster l'emplacement exact.
          </p>
          <div className="flex items-center gap-2 rounded-lg bg-success/10 px-3 py-2 text-xs text-[#1D9E75]">
            <Check className="h-4 w-4" strokeWidth={3} />
            <span className="truncate font-semibold">{value.name}</span>
            <span className="ml-auto shrink-0 font-mono text-[10px] text-muted-foreground">
              {value.lat.toFixed(4)}, {value.lng.toFixed(4)}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
