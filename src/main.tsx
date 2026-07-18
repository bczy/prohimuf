import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { App } from "@render/scene/App";
import "@assets/fonts/fonts.css";

const rootElement = document.getElementById("root");
if (rootElement === null) {
  throw new Error("Root element #root not found in DOM");
}

createRoot(rootElement).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
