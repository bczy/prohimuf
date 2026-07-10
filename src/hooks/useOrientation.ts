import { useEffect, useState } from "react";

const PORTRAIT_QUERY = "(orientation: portrait)";

/**
 * Tracks the viewport orientation (ADR-0003). This drives React rendering
 * (the rotate overlay), not the per-frame loop, so plain state is correct.
 */
export function useOrientation(): boolean {
  const [isPortrait, setIsPortrait] = useState<boolean>(
    () => typeof window !== "undefined" && window.matchMedia(PORTRAIT_QUERY).matches,
  );

  useEffect(() => {
    const query = window.matchMedia(PORTRAIT_QUERY);
    const onChange = (e: MediaQueryListEvent): void => {
      setIsPortrait(e.matches);
    };
    query.addEventListener("change", onChange);
    setIsPortrait(query.matches);
    return () => {
      query.removeEventListener("change", onChange);
    };
  }, []);

  return isPortrait;
}
