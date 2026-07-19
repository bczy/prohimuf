import type { JSX } from "react";
import { useFullscreen } from "@hooks/useFullscreen";
import styles from "./FullscreenButton.module.css";
import { cx } from "./controls";

// Inked glyph on a light halo — reads on the grey pre-game grounds (STOCK.shell)
// and keeps presence over the darker in-game canvas via the halo.
const GLYPH_STROKE = "#141210";
const GLYPH_SHADOW = "drop-shadow(0 0 4px rgba(255,255,255,0.9))";

/**
 * Fullscreen toggle affordance (ADR-0008). Support-gated: renders nothing when
 * element fullscreen is unavailable (e.g. iPhone Safari). Fixed to the
 * bottom-right, above every overlay. Carries `data-muf-ui` so the mobile touch
 * gesture layer exempts it from preventDefault (frozen cross-lane contract).
 */
export function FullscreenButton(): JSX.Element | null {
  const { isSupported, isFullscreen, toggle } = useFullscreen();

  if (!isSupported) return null;

  const label = isFullscreen ? "Quitter le plein écran" : "Plein écran";

  return (
    <>
      <style>{`.muf-fs-btn{opacity:0.55;transition:opacity 0.15s ease}.muf-fs-btn:hover,.muf-fs-btn:focus{opacity:1}`}</style>
      <button
        type="button"
        className={cx("muf-fs-btn", styles.button)}
        data-muf-ui
        onClick={toggle}
        aria-label={label}
        title={label}
      >
        <svg
          width="22"
          height="22"
          viewBox="0 0 22 22"
          fill="none"
          stroke={GLYPH_STROKE}
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
          style={{ filter: GLYPH_SHADOW }}
        >
          {isFullscreen ? (
            // Brackets pointing INWARD (exit fullscreen).
            <>
              <path d="M8 2 V6 A2 2 0 0 1 6 8 H2" />
              <path d="M14 2 V6 A2 2 0 0 0 16 8 H20" />
              <path d="M8 20 V16 A2 2 0 0 0 6 14 H2" />
              <path d="M14 20 V16 A2 2 0 0 1 16 14 H20" />
            </>
          ) : (
            // Brackets pointing OUTWARD (enter fullscreen).
            <>
              <path d="M2 8 V4 A2 2 0 0 1 4 2 H8" />
              <path d="M20 8 V4 A2 2 0 0 0 18 2 H14" />
              <path d="M2 14 V18 A2 2 0 0 0 4 20 H8" />
              <path d="M20 14 V18 A2 2 0 0 1 18 20 H14" />
            </>
          )}
        </svg>
      </button>
    </>
  );
}
