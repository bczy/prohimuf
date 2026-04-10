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
    },
  },
  base: "/muf/",
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
