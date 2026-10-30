import { ClientOnly, createFileRoute } from "@tanstack/react-router";
import { lazy, Suspense, useCallback, useEffect, useRef, useState } from "react";
import { WeatherPanel } from "@/components/WeatherPanel";
import { fetchCurrentWeather, type Coords, type CurrentWeather } from "@/lib/weather";

export const Route = createFileRoute("/")({
  component: Index,
  head: () => ({
    meta: [
      { title: "Bharat Pampana — Live Weather Map" },
      { name: "description", content: "Click anywhere on the world map to see live weather from Open-Meteo." },
      { property: "og:title", content: "Bharat Pampana — Live Weather Map" },
      { property: "og:description", content: "Interactive world map with live temperature, wind, humidity, rain and pressure." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
});

const WorldMap = lazy(() => import("@/components/WorldMap"));

function MapFallback() {
  return (
    <div className="flex h-full w-full items-center justify-center bg-muted">
      <p className="text-sm text-muted-foreground">Loading map…</p>
    </div>
  );
}

type Status = "idle" | "loading" | "error" | "success";

function Index() {
  const [coords, setCoords] = useState<Coords | null>(null);
  const [status, setStatus] = useState<Status>("idle");
  const [data, setData] = useState<CurrentWeather | null>(null);
  const [error, setError] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  const load = useCallback(async (c: Coords) => {
    abortRef.current?.abort(); // cancel any in-flight request
    const ctrl = new AbortController();
    abortRef.current = ctrl;
    setStatus("loading");
    setError(null);
    try {
      const w = await fetchCurrentWeather(c, ctrl.signal);
      if (ctrl.signal.aborted) return;
      setData(w);
      setStatus("success");
    } catch (e) {
      if (ctrl.signal.aborted) return;
      setError(e instanceof Error ? e.message : "Unknown error");
      setStatus("error");
    }
  }, []);

  useEffect(() => () => abortRef.current?.abort(), []);

  const handleSelect = useCallback(
    (c: Coords) => {
      setCoords(c);
      setData(null);
      void load(c);
    },
    [load],
  );

  const loading = status === "loading";

  return (
    <div className="relative h-dvh w-full overflow-hidden bg-background">
      <ClientOnly fallback={<MapFallback />}>
        <Suspense fallback={<MapFallback />}>
          <WorldMap selected={coords} onSelect={handleSelect} />
        </Suspense>
      </ClientOnly>

      <button
        type="button"
        data-refresh-button
        disabled={!coords || loading}
        title={coords ? "Fetch latest weather" : "Click the map first"}
        onClick={() => coords && load(coords)}
        className="absolute left-1/2 top-3 z-[1000] inline-flex -translate-x-1/2 items-center gap-2 rounded-full border border-border bg-card/90 px-4 py-2 text-sm font-medium text-foreground shadow-md backdrop-blur transition-colors hover:bg-accent disabled:cursor-not-allowed disabled:opacity-60"
      >
        <span className={loading ? "inline-block animate-spin" : "inline-block"}>↻</span> Refresh
      </button>

      <WeatherPanel coords={coords} status={status} data={data} error={error} onRetry={() => coords && load(coords)} />
    </div>
  );
}
