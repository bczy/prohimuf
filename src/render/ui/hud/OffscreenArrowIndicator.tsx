import type { JSX } from "react";
import type { HudTargetIndicator } from "@render/ui/HUD";
import { INK, ACID } from "@render/ui/print";
import styles from "./OffscreenArrowIndicator.module.css";

function ArrowIndicator({
  direction,
  active,
}: {
  direction: "up" | "down" | "left" | "right";
  active: boolean;
}): JSX.Element {
  const rotation = {
    right: "rotate(0deg)",
    down: "rotate(90deg)",
    left: "rotate(180deg)",
    up: "rotate(270deg)",
  }[direction];

  // Single inline SVG (not the old shaft-span + CSS-border-triangle pair): a CSS
  // triangle can't take an outline, and these arrows need a black keyline to read
  // over the scene. Acid-yellow fill, black keyline — flat, NO blur/glow/shadow.
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
      {/* display:block — an inline svg sits on the text baseline and drifts off
          the span's geometric centre, which is also the rotation origin. */}
      <svg
        width={34}
        height={34}
        viewBox="0 0 34 34"
        aria-hidden="true"
        style={{ display: "block" }}
      >
        <polygon
          points="3,13 18,13 18,7 31,17 18,27 18,21 3,21"
          fill={ACID.yellow}
          stroke={INK.black}
          strokeWidth={2}
          strokeLinejoin="round"
        />
      </svg>
    </span>
  );
}

/**
 * Off-screen target indicator ring: four edge arrows pointing at the current target
 * when it drifts out of frame. Anchor coords + rotation stay inline (state-driven).
 */
export function OffscreenArrowIndicator({
  targetIndicator,
}: {
  targetIndicator: HudTargetIndicator | undefined;
}): JSX.Element {
  const indicator = targetIndicator ?? { up: false, down: false, left: false, right: false };

  return (
    <div className={styles.targetRing}>
      <span
        className={styles.arrowWrap}
        style={{ top: 52, left: "50%", transform: "translateX(-50%)" }}
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
