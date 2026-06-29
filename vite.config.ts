// @lovable.dev/vite-tanstack-config already includes the following — do NOT add them manually
// or the app will break with duplicate plugins:
//   - tanstackStart, viteReact, tailwindcss, tsConfigPaths, cloudflare (build-only),
//     componentTagger (dev-only), VITE_* env injection, @ path alias, React/TanStack dedupe,
//     error logger plugins, and sandbox detection (port/host/strictPort).
// You can pass additional config via defineConfig({ vite: { ... } }) if needed.
import { defineConfig } from "@lovable.dev/vite-tanstack-config";

export default defineConfig({
  vite: {
    server: {
      proxy: {
        "/api": {
          target: "http://localhost:3001",
          changeOrigin: true,
          timeout: 120_000,
          proxyTimeout: 120_000,
          /** When nothing listens on :3001, http-proxy would surface as an opaque 500 — make it explicit. */
          configure(proxy) {
            proxy.on("error", (err, req, res) => {
              const out = res as import("http").ServerResponse | undefined;
              if (!out || typeof out.writeHead !== "function" || out.headersSent) return;
              const code =
                err && typeof err === "object" && "code" in err
                  ? (err as NodeJS.ErrnoException).code
                  : undefined;
              const refused = code === "ECONNREFUSED";
              const reset = code === "ECONNRESET" || code === "EPIPE";
              const msg =
                refused || reset
                  ? "שרת ה-API מתעדכן (הפעלה מחדש). המתינו 2–3 שניות ונסו שוב — אם זה חוזר, הריצו מהשורש npm run dev."
                  : `שגיאת רשת מול שרת ה-API: ${err instanceof Error ? err.message : String(err)}`;
              out.writeHead(503, { "Content-Type": "application/json; charset=utf-8" });
              out.end(JSON.stringify({ error: msg }));
            });
          },
        },
      },
    },
  },
});
