export type Coords = { lat: number; lon: number };

export type CurrentWeather = {
  time: string;
  temperature: number;
  windSpeed: number;
  windDirection: number;
  humidity: number;
  precipitation: number;
  pressure: number;
  units: {
    temperature: string;
    windSpeed: string;
    windDirection: string;
    humidity: string;
    precipitation: string;
    pressure: string;
  };
};

const FIELDS = [
  "temperature_2m",
  "relative_humidity_2m",
  "precipitation",
  "surface_pressure",
  "wind_speed_10m",
  "wind_direction_10m",
].join(",");

export function buildWeatherUrl({ lat, lon }: Coords) {
  return `https://api.open-meteo.com/v1/forecast?latitude=${lat.toFixed(4)}&longitude=${lon.toFixed(4)}&current=${FIELDS}&timezone=auto`;
}

/** Wrap longitude into [-180, 180] (map can scroll past the date line). */
export function normalizeLon(lon: number) {
  return ((((lon + 180) % 360) + 360) % 360) - 180;
}

export async function fetchCurrentWeather(c: Coords, signal?: AbortSignal): Promise<CurrentWeather> {
  const res = await fetch(buildWeatherUrl(c), { signal: signal ?? null });
  if (!res.ok) throw new Error(`Weather service responded ${res.status}`);
  const j = await res.json();
  const cur = j.current;
  const u = j.current_units;
  if (!cur || !u) throw new Error("No weather data for this location");
  return {
    time: cur.time,
    temperature: cur.temperature_2m,
    windSpeed: cur.wind_speed_10m,
    windDirection: cur.wind_direction_10m,
    humidity: cur.relative_humidity_2m,
    precipitation: cur.precipitation,
    pressure: cur.surface_pressure,
    units: {
      temperature: u.temperature_2m,
      windSpeed: u.wind_speed_10m,
      windDirection: u.wind_direction_10m,
      humidity: u.relative_humidity_2m,
      precipitation: u.precipitation,
      pressure: u.surface_pressure,
    },
  };
}

const DIRS = ["N", "NE", "E", "SE", "S", "SW", "W", "NW"];
export function compass(deg: number) {
  return DIRS[Math.round((((deg % 360) + 360) % 360) / 45) % 8];
}

export function formatCoords({ lat, lon }: Coords) {
  return `${Math.abs(lat).toFixed(2)}° ${lat >= 0 ? "N" : "S"}, ${Math.abs(lon).toFixed(2)}° ${lon >= 0 ? "E" : "W"}`;
}
