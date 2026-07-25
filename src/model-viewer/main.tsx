import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { ModelViewer } from "./ModelViewer";

// Standalone entry for the 3D model viewer (dev tool, ADR-0065). Deliberately its
// own Vite entry (model-viewer.html) — the game bundle (src/main.tsx) never
// imports this graph, same idiom as the catalog (src/catalog/main.tsx).

const rootElement = document.getElementById("root");
if (rootElement === null) {
  throw new Error("Root element #root not found in DOM");
}

createRoot(rootElement).render(
  <StrictMode>
    <ModelViewer />
  </StrictMode>,
);
