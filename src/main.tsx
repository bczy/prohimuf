import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { App } from "@render/scene/App";
import "@assets/fonts/fonts.css";
import "@render/ui/base.css";
import { applyPrintTokens } from "@render/ui/applyPrintTokens";
import { registerGeneratedLevels } from "@game/levels/generated";

// Bridge tokens.ts → CSS custom properties on :root before first paint (ADR-0046 D2).
applyPrintTokens();

// The generated-levels fail-fast (ADR-0079 D6, amending ADR-0075 §6): a duplicate id
// crashes here, on the app's first frame, instead of silently splitting the level
// tables. Module body on purpose — never a React effect, StrictMode double-mounts
// those. This ONE call site is guarded by bootstrapRegistration.test.ts.
registerGeneratedLevels();

const rootElement = document.getElementById("root");
if (rootElement === null) {
  throw new Error("Root element #root not found in DOM");
}

createRoot(rootElement).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
