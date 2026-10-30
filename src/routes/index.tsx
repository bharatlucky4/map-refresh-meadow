import { ClientOnly, createFileRoute } from "@tanstack/react-router";
import { lazy, Suspense } from "react";

export const Route = createFileRoute("/")({
  component: Index,
  head: () => ({
    meta: [
      { title: "Bharat Pampana — Map" },
      { name: "description", content: "A simple map app. Step one: map placeholder with a refresh button." },
      { property: "og:title", content: "Bharat Pampana — Map" },
      { property: "og:description", content: "A simple map app with a refresh button." },
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

function Index() {
  return (
    <div className="relative h-dvh w-full overflow-hidden bg-background">
      <ClientOnly fallback={<MapFallback />}>
        <Suspense fallback={<MapFallback />}>
          <WorldMap />
        </Suspense>
      </ClientOnly>

      <button
        type="button"
        data-refresh-button
        onClick={() => {
          // Weather data refresh will be wired up in a later step.
        }}
        className="absolute left-1/2 top-3 z-[1000] inline-flex -translate-x-1/2 items-center gap-2 rounded-full border border-border bg-card/90 px-4 py-2 text-sm font-medium text-foreground shadow-md backdrop-blur transition-colors hover:bg-accent"
      >
        ↻ Refresh
      </button>
    </div>
  );
}
