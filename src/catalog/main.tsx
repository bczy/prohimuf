import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "@assets/fonts/fonts.css";
import "@render/ui/base.css";
import { applyPrintTokens } from "@render/ui/applyPrintTokens";
import { Catalog } from "./Catalog";

// Standalone entry for the component catalog (design-system living doc). Mirrors the
// game's boot: self-hosted fonts + the tokens.ts → CSS-var bridge, so the widgets'
// var(--…) references resolve exactly as in-game. Deliberately its own Vite entry —
// the game bundle (src/main.tsx) never imports this graph.
applyPrintTokens();

const rootElement = document.getElementById("root");
if (rootElement === null) {
  throw new Error("Root element #root not found in DOM");
}

createRoot(rootElement).render(
  <StrictMode>
    <Catalog />
  </StrictMode>,
);
