import { compass, formatCoords, type Coords, type CurrentWeather } from "@/lib/weather";

type Props = {
  coords: Coords | null;
  status: "idle" | "loading" | "error" | "success";
  data: CurrentWeather | null;
  error: string | null;
  onRetry: () => void;
};

export function WeatherPanel({ coords, status, data, error, onRetry }: Props) {
  return (
    <aside
      data-weather-panel
      aria-live="polite"
      className="absolute bottom-6 left-3 z-[1000] w-[260px] rounded-xl border border-border bg-card/95 p-4 text-card-foreground shadow-lg backdrop-blur"
    >
      {!coords ? (
        <p className="text-sm text-muted-foreground">Click anywhere on the map to see the current weather there.</p>
      ) : (
        <>
          <p className="mb-2 text-xs font-medium text-muted-foreground">{formatCoords(coords)}</p>
          {status === "loading" && !data && <p className="text-sm text-muted-foreground">Loading weather…</p>}
          {status === "error" && (
            <div className="space-y-2">
              <p className="text-sm text-destructive">Couldn't load weather. {error}</p>
              <button
                type="button"
                onClick={onRetry}
                className="rounded-md border border-border px-3 py-1 text-xs font-medium hover:bg-accent"
              >
                Try again
              </button>
            </div>
          )}
          {data && status !== "error" && (
            <div className={status === "loading" ? "opacity-60 transition-opacity" : "transition-opacity"}>
              <p className="text-3xl font-semibold">
                {data.temperature}
                <span className="text-lg">{data.units.temperature}</span>
              </p>
              <dl className="mt-3 grid grid-cols-2 gap-x-3 gap-y-2 text-sm">
                <Row label="Wind" value={`${data.windSpeed} ${data.units.windSpeed}`} />
                <Row
                  label="Direction"
                  value={
                    <span className="inline-flex items-center gap-1">
                      <span
                        aria-hidden
                        className="inline-block"
                        style={{ transform: `rotate(${data.windDirection + 180}deg)` }}
                      >
                        ↑
                      </span>
                      {data.windDirection}° {compass(data.windDirection)}
                    </span>
                  }
                />
                <Row label="Humidity" value={`${data.humidity} ${data.units.humidity}`} />
                <Row label="Precipitation" value={`${data.precipitation} ${data.units.precipitation}`} />
                <Row label="Pressure" value={`${data.pressure} ${data.units.pressure}`} />
              </dl>
              <p className="mt-3 text-[11px] text-muted-foreground">Local time {data.time.replace("T", " ")} · Open-Meteo</p>
            </div>
          )}
        </>
      )}
    </aside>
  );
}

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <dt className="text-[11px] uppercase tracking-wide text-muted-foreground">{label}</dt>
      <dd className="font-medium">{value}</dd>
    </div>
  );
}
