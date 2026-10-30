/** Global wind grid from Open-Meteo (real data, coarse grid, bilinear interpolation). */
export const GRID_STEP = 15; // degrees
export const LAT_MIN = -75;
export const LAT_MAX = 75;
export const LON_MIN = -180; // grid wraps at 360

export type WindGrid = {
  nLat: number;
  nLon: number;
  /** u (eastward) and v (northward) in km/h, row-major [latIdx * nLon + lonIdx] */
  u: Float32Array;
  v: Float32Array;
  fetchedAt: number;
};

/** Convert meteorological "wind from" direction + speed into u/v (direction wind blows toward). */
export function toUV(speed: number, fromDeg: number) {
  const r = (fromDeg * Math.PI) / 180;
  return { u: -speed * Math.sin(r), v: -speed * Math.cos(r) };
}

export function gridPoints() {
  const lats: number[] = [];
  const lons: number[] = [];
  for (let la = LAT_MIN; la <= LAT_MAX; la += GRID_STEP) lats.push(la);
  for (let lo = LON_MIN; lo < 180; lo += GRID_STEP) lons.push(lo);
  return { lats, lons };
}

const CHUNK = 100;

export async function fetchWindGrid(signal?: AbortSignal): Promise<WindGrid> {
  const { lats, lons } = gridPoints();
  const pts: { la: number; lo: number }[] = [];
  for (const la of lats) for (const lo of lons) pts.push({ la, lo });
  const u = new Float32Array(pts.length);
  const v = new Float32Array(pts.length);
  const chunks: { la: number; lo: number }[][] = [];
  for (let i = 0; i < pts.length; i += CHUNK) chunks.push(pts.slice(i, i + CHUNK));
  let offset = 0;
  for (const c of chunks) {
    const url =
      `https://api.open-meteo.com/v1/forecast?latitude=${c.map((p) => p.la).join(",")}` +
      `&longitude=${c.map((p) => p.lo).join(",")}&current=wind_speed_10m,wind_direction_10m&wind_speed_unit=kmh`;
    const res = await fetch(url, { signal: signal ?? null });
    if (!res.ok) throw new Error(`Wind service responded ${res.status}`);
    const j = await res.json();
    const arr = Array.isArray(j) ? j : [j];
    if (arr.length !== c.length) throw new Error("Incomplete wind data");
    arr.forEach((r: { current?: { wind_speed_10m?: number; wind_direction_10m?: number } }, i: number) => {
      const s = r.current?.wind_speed_10m;
      const d = r.current?.wind_direction_10m;
      if (typeof s !== "number" || typeof d !== "number") throw new Error("Missing wind values");
      const w = toUV(s, d);
      u[offset + i] = w.u;
      v[offset + i] = w.v;
    });
    offset += c.length;
  }
  return { nLat: lats.length, nLon: lons.length, u, v, fetchedAt: Date.now() };
}

/** Bilinear sample; returns null outside the latitude coverage. */
export function sampleWind(g: WindGrid, lat: number, lon: number): { u: number; v: number } | null {
  if (lat < LAT_MIN || lat > LAT_MAX) return null;
  const y = (lat - LAT_MIN) / GRID_STEP;
  const x = (((((lon - LON_MIN) % 360) + 360) % 360) / GRID_STEP);
  const y0 = Math.min(Math.floor(y), g.nLat - 2);
  const x0 = Math.floor(x) % g.nLon;
  const x1 = (x0 + 1) % g.nLon;
  const fy = y - y0;
  const fx = x - Math.floor(x);
  const i = (yy: number, xx: number) => yy * g.nLon + xx;
  const mix = (a: Float32Array) =>
    a[i(y0, x0)] * (1 - fx) * (1 - fy) +
    a[i(y0, x1)] * fx * (1 - fy) +
    a[i(y0 + 1, x0)] * (1 - fx) * fy +
    a[i(y0 + 1, x1)] * fx * fy;
  return { u: mix(g.u), v: mix(g.v) };
}

export const LEGEND = [
  { max: 10, color: "rgba(147,197,253,0.9)", label: "0–10" },
  { max: 25, color: "rgba(110,231,183,0.9)", label: "10–25" },
  { max: 40, color: "rgba(253,224,71,0.95)", label: "25–40" },
  { max: 60, color: "rgba(251,146,60,0.95)", label: "40–60" },
  { max: Infinity, color: "rgba(244,63,94,0.95)", label: "60+" },
];

export function speedColor(kmh: number) {
  for (const l of LEGEND) if (kmh < l.max) return l.color;
  return LEGEND[LEGEND.length - 1].color;
}
