// @lovable.dev/vite-tanstack-config already includes the following — do NOT add them manually
// or the app will break with duplicate plugins:
//   - tanstackStart, viteReact, tailwindcss, tsConfigPaths, nitro (build-only using cloudflare as a default target),
//     componentTagger (dev-only), VITE_* env injection, @ path alias, React/TanStack dedupe,
//     error logger plugins, and sandbox detection (port/host/strictPort).
// You can pass additional config via defineConfig({ vite: { ... }, etc... }) if needed.
import { defineConfig } from "@lovable.dev/vite-tanstack-config";

const API_PROXY_TARGET = process.env.VITE_API_PROXY_TARGET ?? "https://odsilvernet-001-site1.itempurl.com";

export default defineConfig({
  tanstackStart: {
    // Redirect TanStack Start's bundled server entry to src/server.ts (our SSR error wrapper).
    // nitro/vite builds from this
    server: { entry: "server" },
  },
  // Build the Nitro SSR server for Vercel (Build Output API -> .vercel/output).
  // Without this, self-deploys get a Vite-only build with no SSR, so "/" 404s.
  nitro: { preset: "vercel" },
  vite: {
    server: {
      // Dev-only: proxy /api to the backend so the browser stays same-origin
      // (the backend does not send CORS headers / handle OPTIONS preflight).
      proxy: {
        "/api": {
          target: API_PROXY_TARGET,
          changeOrigin: true,
          ws: true,
        },
      },
    },
  },
});
