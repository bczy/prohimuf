import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { resolve } from "path";

// The component catalog (design-system living doc) is its own Vite entry, at
// `catalog.html`. It is DELIBERATELY excluded from the default build input, so the
// game bundle never imports catalog code. Build it on demand with BUILD_CATALOG=1
// (→ dist-catalog); the dev server serves it directly at /catalog.html either way.
const buildCatalog = process.env.BUILD_CATALOG === "1";

// Same idiom for the 3D model viewer (ADR-0065 dev tool, `model-viewer.html`): a
// standalone page to inspect generated GLBs before wiring MODEL_SCALE, never part
// of the game bundle. Build on demand with BUILD_MODEL_VIEWER=1.
const buildModelViewer = process.env.BUILD_MODEL_VIEWER === "1";

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

    outDir: buildCatalog ? "dist-catalog" : buildModelViewer ? "dist-model-viewer" : "dist",

    sourcemap: true,

    // Default (undefined) → Vite builds index.html only: neither dev tool lands in
    // the game bundle. BUILD_CATALOG=1 / BUILD_MODEL_VIEWER=1 build that entry alone.
    rollupOptions: buildCatalog
      ? { input: { catalog: resolve(__dirname, "catalog.html") } }
      : buildModelViewer
        ? { input: { "model-viewer": resolve(__dirname, "model-viewer.html") } }
        : {
            // SPIKE BRANCH ONLY (`claude/spike-r3f-flyers`) — MUST NOT MERGE TO MAIN.
            // The two exploration pages are declared as extra entries so the branch
            // preview actually serves them; without this they are absent from `dist`
            // and their preview URLs 404. This deliberately departs from the
            // catalog/model-viewer convention above (dev tools stay out of the game
            // bundle behind an env flag) because a parked spike is only worth keeping
            // if it can be looked at. See spikes/r3f-flyers/README.md.
            input: {
              index: resolve(__dirname, "index.html"),
              "spike-wall": resolve(__dirname, "spikes/r3f-flyers/wall.html"),
              "spike-book": resolve(__dirname, "spikes/r3f-flyers/book.html"),
            },
            output: {
              // Split vendors by stability layer so the browser can cache Three.js,
              // R3F and React independently from app code that changes every deploy.
              manualChunks: (id: string) => {
                if (id.includes("node_modules/three/")) return "vendor-three";
                if (id.includes("node_modules/@react-three/fiber/")) return "vendor-r3f";
                if (
                  id.includes("node_modules/react/") ||
                  id.includes("node_modules/react-dom/") ||
                  id.includes("node_modules/scheduler/")
                )
                  return "vendor-react";
                // All other modules → Rollup default chunking
              },
            },
          },
  },

  server: {
    port: 5173,

    open: true,
  },
});
