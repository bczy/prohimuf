import type { JSX } from "react";
import type { HudTargetIndicator } from "./types";
import { SHORT_LANDSCAPE_MEDIA } from "@render/ui/print";
import { ARROW_ROTATION, ArrowGlyphSvg } from "./arrowGlyph";
import { cx } from "./cx";
import styles from "./OffscreenArrowIndicator.module.css";

function ArrowIndicator({
  direction,
  active,
}: {
  direction: "up" | "down" | "left" | "right";
  active: boolean;
}): JSX.Element {
  const rotation = ARROW_ROTATION[direction];

  // The glyph shape itself is the shared token (`arrowGlyph.tsx`); this ring owns
  // the anchoring, the active scale/opacity and their 120 ms fade.
  return (
    <span
      className={styles.arrowCore}
      style={{
        // Raised opacity from 0.28: off-screen arrows overlay the 3D scene and
        // visibility was the complaint. Acid-yellow fill + black keyline reads on
        // dark and light facades.
        transform: `${rotation}${active ? " scale(1.12)" : ""}`,
        opacity: active ? 1 : 0.35,
        transition: "opacity 120ms ease, transform 120ms ease",
      }}
    >
      {/* .arrowCore (CSS module) is the single owner of the rendered size — the
          keyline still holds the HUD's 2px ink-rule weight at both the desktop
          (102px) and short-landscape (51px) sizes (Bertrand: don't scale it). */}
      <ArrowGlyphSvg />
    </span>
  );
}

/**
 * Off-screen target indicator ring: four edge arrows pointing at the current target
 * when it drifts out of frame. Anchor coords + rotation stay inline (state-driven).
 *
 * `topCentreOccupied` — an opaque HUD chip (today: the delivery call-out) holds the
 * top-centre band, so the UP glyph steps aside into the left gutter for as long as it
 * does. See `.arrowWrapUpAside` for why the dodge is horizontal and static.
 */
export function OffscreenArrowIndicator({
  targetIndicator,
  topCentreOccupied,
}: {
  targetIndicator: HudTargetIndicator | undefined;
  topCentreOccupied: boolean;
}): JSX.Element {
  const indicator = targetIndicator ?? { up: false, down: false, left: false, right: false };

  return (
    <div className={styles.targetRing}>
      {/* ADR-0024 pattern (TitleScreen/MainMenu): the short-landscape device class
          drops the arrows to a smaller glyph than the desktop size; unmatched
          viewports keep the CSS-module var() fallbacks. Both device classes carry
          Bertrand's ×0.75 trim of the original 4x/2x enlargement (#103). */}
      <style>{`
        @media ${SHORT_LANDSCAPE_MEDIA}{
          .${styles.targetRing ?? ""}{
            --muf-arrow-wrap-size: 60px;
            --muf-arrow-core-size: 51px;
          }
        }
      `}</style>
      <span
        className={cx(
          styles.arrowWrap,
          styles.arrowWrapUp,
          topCentreOccupied ? styles.arrowWrapUpAside : undefined,
        )}
      >
        <ArrowIndicator direction="up" active={indicator.up} />
      </span>
      <span
        className={styles.arrowWrap}
        style={{ bottom: 8, left: "50%", transform: "translateX(-50%)" }}
      >
        <ArrowIndicator direction="down" active={indicator.down} />
      </span>
      <span
        className={styles.arrowWrap}
        style={{ top: "50%", left: 8, transform: "translateY(-50%)" }}
      >
        <ArrowIndicator direction="left" active={indicator.left} />
      </span>
      <span
        className={styles.arrowWrap}
        style={{ top: "50%", right: 8, transform: "translateY(-50%)" }}
      >
        <ArrowIndicator direction="right" active={indicator.right} />
      </span>
    </div>
  );
}
