import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { App } from "@render/scene/App";
import "@assets/fonts/fonts.css";
import "@render/ui/base.css";
import { applyPrintTokens } from "@render/ui/applyPrintTokens";

// Bridge tokens.ts → CSS custom properties on :root before first paint (ADR-0046 D2).
applyPrintTokens();

const rootElement = document.getElementById("root");
if (rootElement === null) {
  throw new Error("Root element #root not found in DOM");
}

createRoot(rootElement).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
