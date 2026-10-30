import { describe, it, expect } from "vitest";
import { toUV, sampleWind, gridPoints, speedColor, LEGEND } from "@/lib/wind";

describe("wind", () => {
  it("wind from north blows south", () => {
    const { u, v } = toUV(10, 0);
    expect(u).toBeCloseTo(0);
    expect(v).toBeCloseTo(-10);
  });
  it("wind from west blows east", () => {
    expect(toUV(20, 270).u).toBeCloseTo(20);
  });
  it("samples uniform grid and wraps longitude", () => {
    const { lats, lons } = gridPoints();
    const n = lats.length * lons.length;
    const g = { nLat: lats.length, nLon: lons.length, u: new Float32Array(n).fill(5), v: new Float32Array(n).fill(-3), fetchedAt: 0 };
    expect(sampleWind(g, 10, 179)!.u).toBeCloseTo(5);
    expect(sampleWind(g, 10, 540)!.v).toBeCloseTo(-3);
    expect(sampleWind(g, 85, 0)).toBeNull();
  });
  it("60+ km/h uses top legend color", () => {
    expect(speedColor(75)).toBe(LEGEND[4].color);
  });
});
