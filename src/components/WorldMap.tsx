import { useEffect, useRef } from "react";
import L from "leaflet";

const WORLD_CENTER: L.LatLngExpression = [20, 0];
const WORLD_ZOOM = 2;

export default function WorldMap() {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);

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
    mapRef.current = map;
    const ro = new ResizeObserver(() => map.invalidateSize());
    ro.observe(containerRef.current);
    return () => {
      ro.disconnect();
      map.remove();
      mapRef.current = null;
    };
  }, []);

  return (
    <div className="relative h-full w-full">
      <div ref={containerRef} data-world-map className="h-full w-full" />
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
