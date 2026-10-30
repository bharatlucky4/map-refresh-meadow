import { useEffect, useRef } from "react";
import type L from "leaflet";
import { sampleWind, speedColor, type WindGrid } from "@/lib/wind";

type Props = { map: L.Map; grid: WindGrid };

const MAX_AGE = 90;

/** Canvas 2D particle layer drawn over the Leaflet map, in screen space, re-seeded on move/zoom. */
export function WindLayer({ map, grid }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    let w = 0;
    let h = 0;
    let raf = 0;
    let moving = false;
    type P = { x: number; y: number; age: number };
    let parts: P[] = [];

    const count = () => Math.round(Math.min(2500, Math.max(400, (w * h) / 900)) * (window.innerWidth < 640 ? 0.6 : 1));
    const seed = (p: P) => {
      p.x = Math.random() * w;
      p.y = Math.random() * h;
      p.age = Math.floor(Math.random() * MAX_AGE);
    };
    const resize = () => {
      const s = map.getSize();
      w = s.x;
      h = s.y;
      canvas.width = w * dpr;
      canvas.height = h * dpr;
      canvas.style.width = `${w}px`;
      canvas.style.height = `${h}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      parts = Array.from({ length: count() }, () => {
        const p = { x: 0, y: 0, age: 0 };
        seed(p);
        return p;
      });
      ctx.clearRect(0, 0, w, h);
    };

    const frame = () => {
      raf = requestAnimationFrame(frame);
      if (moving) return;
      // fade previous trails
      ctx.globalCompositeOperation = "destination-in";
      ctx.fillStyle = "rgba(0,0,0,0.92)";
      ctx.fillRect(0, 0, w, h);
      ctx.globalCompositeOperation = "source-over";
      ctx.lineWidth = 1.4;
      // pixel-per-km/h-per-frame scale grows mildly with zoom so motion stays readable
      const k = 0.035 * Math.pow(1.35, map.getZoom() - 2);
      for (const p of parts) {
        if (++p.age > MAX_AGE) {
          seed(p);
          p.age = 0;
          continue;
        }
        const ll = map.containerPointToLatLng([p.x, p.y]);
        const wv = sampleWind(grid, ll.lat, ll.lng);
        if (!wv) {
          seed(p);
          continue;
        }
        const spd = Math.hypot(wv.u, wv.v);
        const nx = p.x + wv.u * k;
        const ny = p.y - wv.v * k;
        ctx.strokeStyle = speedColor(spd);
        ctx.beginPath();
        ctx.moveTo(p.x, p.y);
        ctx.lineTo(nx, ny);
        ctx.stroke();
        p.x = nx;
        p.y = ny;
        if (nx < 0 || ny < 0 || nx > w || ny > h) seed(p);
      }
    };

    const onStart = () => {
      moving = true;
      ctx.clearRect(0, 0, w, h);
    };
    const onEnd = () => {
      moving = false;
      parts.forEach(seed);
    };

    resize();
    map.on("movestart zoomstart", onStart);
    map.on("moveend zoomend", onEnd);
    map.on("resize", resize);
    raf = requestAnimationFrame(frame);
    return () => {
      cancelAnimationFrame(raf);
      map.off("movestart zoomstart", onStart);
      map.off("moveend zoomend", onEnd);
      map.off("resize", resize);
    };
  }, [map, grid]);

  return <canvas ref={canvasRef} data-wind-canvas className="pointer-events-none absolute inset-0 z-[450]" />;
}
