import { useEffect, useState } from "react";

/**
 * Progress of a batch preload. `done` is true the instant `total === 0`
 * (nothing to warm) and once every path has settled otherwise.
 */
export interface PreloadState {
  readonly loaded: number;
  readonly total: number;
  readonly done: boolean;
}

/**
 * Warm a batch of asset paths and report progress so a screen can gate behind a
 * loading bar until the batch is 100% settled.
 *
 * `warm` must ALWAYS resolve (success and failure both count as settled), so a
 * missing/still-generating asset can never stall the gate. The run restarts
 * whenever the `paths` array identity changes — callers must memoise `paths`
 * (e.g. `useMemo` keyed on the target) so it is stable across renders, otherwise
 * the count would reset every render and never reach `done`.
 *
 * A per-run token (the effect-scoped `cancelled` flag) guards against both
 * setState-after-unmount and a stale run's late `warm` resolutions landing after
 * a newer `paths` batch has taken over.
 */
export function useAssetPreloader(
  paths: readonly string[],
  warm: (path: string) => Promise<void>,
): PreloadState {
  const total = paths.length;
  const [loaded, setLoaded] = useState(0);

  useEffect(() => {
    setLoaded(0);
    if (paths.length === 0) return;

    let cancelled = false;
    let settled = 0;
    const bump = (): void => {
      if (cancelled) return;
      settled += 1;
      setLoaded(settled);
    };
    for (const path of paths) {
      // warm always resolves; the rejection handler is defensive belt-and-braces.
      warm(path).then(bump, bump);
    }

    return () => {
      cancelled = true;
    };
  }, [paths, warm]);

  return { loaded, total, done: total === 0 || loaded >= total };
}
