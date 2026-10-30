import { createFileRoute } from "@tanstack/react-router";

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

function Index() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-6 bg-background px-4">
      {/* Map placeholder — replaced with a real map in a later step */}
      <div
        data-map-placeholder
        className="flex h-[70vh] w-full max-w-4xl items-center justify-center rounded-xl border border-dashed border-border bg-muted"
      >
        <p className="text-sm text-muted-foreground">Map goes here</p>
      </div>

      {/* Step two: the one refresh button */}
      <button
        type="button"
        data-refresh-button
        onClick={() => {
          // Placeholder action for now — will refresh map data later.
        }}
        className="inline-flex items-center gap-2 rounded-md border border-border bg-card px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-accent"
      >
        ↻ Refresh
      </button>
    </div>
  );
}
