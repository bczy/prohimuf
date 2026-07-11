import { useCallback, useEffect, useMemo, useState } from "react";
import { detectMobile } from "@utils/platform";

// lib.dom types the standard Fullscreen members as always-present and lacks the
// -webkit- prefixed ones (still needed for older/iOS Safari in 2026); it also
// dropped ScreenOrientation.lock. To keep the runtime webkit fallbacks without
// `any`/`as any`, these are structural views whose members are all optional —
// `document`/`documentElement` are assignable to them, so the `as` casts below
// are plain widenings, and every runtime guard stays type-honest under
// @typescript-eslint/strict (no-unnecessary-condition). (Deviation from the
// `extends Document`/`HTMLElement` shapes in ADR-0008's plan: extending would
// re-inherit the members as non-optional and make each guard lint as
// always-truthy — structural optional views are the cast-free way to guard.)
interface WebkitDoc {
  fullscreenEnabled?: boolean;
  fullscreenElement?: Element | null;
  exitFullscreen?: () => Promise<void>;
  webkitFullscreenEnabled?: boolean;
  webkitFullscreenElement?: Element | null;
  webkitExitFullscreen?: () => void;
}
interface WebkitEl {
  requestFullscreen?: (options?: FullscreenOptions) => Promise<void>;
  webkitRequestFullscreen?: () => void;
}
interface LockableOrientation extends ScreenOrientation {
  lock?: (o: "landscape") => Promise<void>;
}

export interface FullscreenApi {
  isSupported: boolean;
  isFullscreen: boolean;
  toggle: () => void;
}

function readFullscreenElement(): Element | null {
  const doc = document as WebkitDoc;
  return doc.fullscreenElement ?? doc.webkitFullscreenElement ?? null;
}

/**
 * Element-fullscreen affordance (ADR-0008). Support-gated: on iPhone Safari
 * (no element fullscreen API — still true in 2026) `isSupported` is false and
 * the button hides. `isFullscreen` reflects the real document, updated only
 * via fullscreenchange events (F11/Esc/system exits don't reach the page as
 * keydown), so the button stays correct even though it remounts across phases.
 */
export function useFullscreen(): FullscreenApi {
  const isSupported = useMemo<boolean>(() => {
    if (typeof document === "undefined") return false;
    const doc = document as WebkitDoc;
    return doc.fullscreenEnabled ?? doc.webkitFullscreenEnabled ?? false;
  }, []);

  const [isFullscreen, setIsFullscreen] = useState<boolean>(
    () => typeof document !== "undefined" && readFullscreenElement() !== null,
  );

  useEffect(() => {
    const onChange = (): void => {
      setIsFullscreen(readFullscreenElement() !== null);
    };
    document.addEventListener("fullscreenchange", onChange);
    document.addEventListener("webkitfullscreenchange", onChange);
    onChange();
    return () => {
      document.removeEventListener("fullscreenchange", onChange);
      document.removeEventListener("webkitfullscreenchange", onChange);
    };
  }, []);

  const toggle = useCallback((): void => {
    const doc = document as WebkitDoc;
    if (readFullscreenElement() === null) {
      const el = document.documentElement as WebkitEl;
      if (el.requestFullscreen) {
        el.requestFullscreen({ navigationUI: "hide" })
          .then(() => {
            // Landscape lock is mobile-only; desktop Chrome throws
            // NotSupportedError and Safari lacks `lock` entirely.
            if (detectMobile()) {
              const orientation = screen.orientation as LockableOrientation;
              orientation.lock?.("landscape").catch(() => undefined);
            }
          })
          .catch(() => undefined);
      } else if (el.webkitRequestFullscreen) {
        el.webkitRequestFullscreen();
      }
    } else if (doc.exitFullscreen) {
      doc.exitFullscreen().catch(() => undefined);
    } else if (doc.webkitExitFullscreen) {
      doc.webkitExitFullscreen();
    }
  }, []);

  return { isSupported, isFullscreen, toggle };
}
