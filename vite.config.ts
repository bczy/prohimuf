import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { resolve } from "path";

// The component catalog (design-system living doc) is its own Vite entry, at
// `catalog.html`. It is DELIBERATELY excluded from the default build input, so the
// game bundle never imports catalog code. Build it on demand with BUILD_CATALOG=1
// (→ dist-catalog); the dev server serves it directly at /catalog.html either way.
const buildCatalog = process.env.BUILD_CATALOG === "1";

export default defineConfig({
  plugins: [react()],

  resolve: {
    alias: {
      "@game": resolve(__dirname, "src/game"),

      "@render": resolve(__dirname, "src/render"),

      "@assets": resolve(__dirname, "src/assets"),

      "@hooks": resolve(__dirname, "src/hooks"),

      "@utils": resolve(__dirname, "src/utils"),
    },
  },

  // Pages serves the app under /prohimuf/. Branch previews are deployed to a
  // sub-path (/prohimuf/preview/<branch>/), so the base is overridable via env
  // at build time without touching this default for local dev or the main site.
  base: process.env.VITE_BASE ?? "/prohimuf/",

  build: {
    target: "es2022",

    outDir: buildCatalog ? "dist-catalog" : "dist",

    sourcemap: true,

    // Default (undefined) → Vite builds index.html only: the catalog never lands in
    // the game bundle. BUILD_CATALOG=1 → build the catalog entry in isolation.
    rollupOptions: buildCatalog ? { input: { catalog: resolve(__dirname, "catalog.html") } } : {},
  },

  server: {
    port: 5173,

    open: true,
  },
});
