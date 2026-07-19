import { useEffect, useState } from "react";

/**
 * Subscribe to a CSS media query (ADR-0049). SSR/jsdom-safe: guards `window.matchMedia`
 * so it degrades to `false` where the API is absent, and re-reads on the `change` event.
 * Render-layer view interaction only — NOT a game↔R3F bridge, so it lives in
 * `src/render/ui/print/`, not `src/hooks/` (mirrors useRovingIndex, ADR-0021 D4).
 */
export function useMediaQuery(query: string): boolean {
  const read = (): boolean =>
    typeof window !== "undefined" &&
    typeof window.matchMedia === "function" &&
    window.matchMedia(query).matches;

  const [matches, setMatches] = useState(read);

  useEffect(() => {
    if (typeof window === "undefined" || typeof window.matchMedia !== "function") return;
    const mql = window.matchMedia(query);
    const onChange = (): void => {
      setMatches(mql.matches);
    };
    setMatches(mql.matches);
    mql.addEventListener("change", onChange);
    return () => {
      mql.removeEventListener("change", onChange);
    };
  }, [query]);

  return matches;
}
