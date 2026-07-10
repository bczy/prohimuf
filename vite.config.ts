import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { resolve } from "path";

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

    outDir: "dist",

    sourcemap: true,
  },

  server: {
    port: 5173,

    open: true,
  },
});
