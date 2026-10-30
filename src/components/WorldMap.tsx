import { useEffect, useRef, useState } from "react";
import { WindLayer } from "./WindLayer";
import { fetchWindGrid, LEGEND, type WindGrid } from "@/lib/wind";
import L from "leaflet";
import { normalizeLon, type Coords } from "@/lib/weather";

const WORLD_CENTER: L.LatLngExpression = [20, 0];
const WORLD_ZOOM = 2;

type Props = {
  selected?: Coords | null;
  onSelect?: (c: Coords) => void;
};

export default function WorldMap({ selected, onSelect }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const markerRef = useRef<L.CircleMarker | null>(null);
  const onSelectRef = useRef(onSelect);
  onSelectRef.current = onSelect;
  const [mapInst, setMapInst] = useState<L.Map | null>(null);
  const [windOn, setWindOn] = useState(true);
  const [grid, setGrid] = useState<WindGrid | null>(null);
  const [windState, setWindState] = useState<"idle" | "loading" | "error">("idle");
  const [windTry, setWindTry] = useState(0);

  useEffect(() => {
    if (!windOn || grid) return;
    const ctrl = new AbortController();
    setWindState("loading");
    fetchWindGrid(ctrl.signal)
      .then((g) => {
        setGrid(g);
        setWindState("idle");
      })
      .catch(() => {
        if (!ctrl.signal.aborted) setWindState("error");
      });
    return () => ctrl.abort();
  }, [windOn, grid, windTry]);

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;
    const map = L.map(containerRef.current, {
      center: WORLD_CENTER,
      zoom: WORLD_ZOOM,
      minZoom: 2,
      maxZoom: 18,
      worldCopyJump: true,
      zoomControl: false,
    });
    L.control.zoom({ position: "topright" }).addTo(map);
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      maxZoom: 19,
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    }).addTo(map);
    map.on("click", (e: L.LeafletMouseEvent) => {
      onSelectRef.current?.({ lat: e.latlng.lat, lon: normalizeLon(e.latlng.lng) });
    });
    mapRef.current = map;
    setMapInst(map);
    const ro = new ResizeObserver(() => map.invalidateSize());
    ro.observe(containerRef.current);
    return () => {
      ro.disconnect();
      map.remove();
      mapRef.current = null;
      setMapInst(null);
      markerRef.current = null;
    };
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    if (!selected) {
      markerRef.current?.remove();
      markerRef.current = null;
      return;
    }
    const ll: L.LatLngExpression = [selected.lat, selected.lon];
    if (markerRef.current) markerRef.current.setLatLng(ll);
    else
      markerRef.current = L.circleMarker(ll, {
        radius: 7,
        weight: 2,
        color: "#ffffff",
        fillColor: "#e11d48",
        fillOpacity: 1,
      }).addTo(map);
  }, [selected]);

  return (
    <div className="relative h-full w-full">
      <div ref={containerRef} data-world-map className="h-full w-full cursor-crosshair" />
      {windOn && mapInst && grid && <WindLayer map={mapInst} grid={grid} />}
      <div className="absolute right-[10px] top-[132px] z-[1000] w-[150px] rounded-md border border-border bg-card/95 p-2 text-xs text-card-foreground shadow-md backdrop-blur">
        <label className="flex cursor-pointer items-center justify-between gap-2 font-medium">
          Wind layer
          <input
            type="checkbox"
            aria-label="Wind layer"
            checked={windOn}
            onChange={(e) => setWindOn(e.target.checked)}
            className="h-4 w-4 accent-primary"
          />
        </label>
        {windOn && windState === "loading" && <p className="mt-1 text-muted-foreground">Loading wind…</p>}
        {windOn && windState === "error" && (
          <p className="mt-1 text-destructive">
            Wind data unavailable.{" "}
            <button type="button" className="underline" onClick={() => setWindTry((n) => n + 1)}>
              Retry
            </button>
          </p>
        )}
        {windOn && grid && (
          <div className="mt-2 space-y-1" data-wind-legend>
            <p className="text-[10px] uppercase tracking-wide text-muted-foreground">Wind speed (km/h)</p>
            {LEGEND.map((l) => (
              <div key={l.label} className="flex items-center gap-2">
                <span className="inline-block h-1.5 w-5 rounded-full" style={{ background: l.color }} />
                {l.label}
              </div>
            ))}
          </div>
        )}
      </div>
      <button
        type="button"
        aria-label="Return to world view"
        title="Return to world view"
        onClick={() => mapRef.current?.flyTo(WORLD_CENTER, WORLD_ZOOM, { duration: 1 })}
        className="absolute right-[10px] top-[90px] z-[1000] flex h-[34px] w-[34px] items-center justify-center rounded-md border border-border bg-card text-foreground shadow-md transition-colors hover:bg-accent"
      >
        <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="12" cy="12" r="9" />
          <path d="M3 12h18M12 3a14 14 0 0 1 0 18M12 3a14 14 0 0 0 0 18" />
        </svg>
      </button>
    </div>
  );
}
