import { useEffect, useRef, useState } from "react";
import type { JSX } from "react";
import { LEVELS } from "@game/levels/levels";
import {
  STOCK,
  FLYER_STOCK_BY_PLAYABLE_INDEX,
  FLYER_REST_ROTATION_DEG,
  FLYER_JITTER_PX,
  MAX_TILT_DEG,
  MOTION,
  useRovingIndex,
  useMediaQuery,
  SHORT_LANDSCAPE_MEDIA,
} from "@render/ui/print";
import { LevelFlyer } from "./LevelFlyer";
import styles from "./FlyerWall.module.css";
import { cx } from "../controls";

/**
 * NIVEAUX — the flyer wall (UX §2.3). A deterministically jittered vertical stack
 * (never a data-hiding fan). Each level is its own flyer on its own fluo stock;
 * the tutorial is a manila "mode d'emploi" (§2bis.1). Roving keyboard focus with an
 * always-visible marker circle; Enter plays an unlocked flyer, Enter on a locked one
 * shakes its stamp (no state change, UX §2.3).
 */

interface FlyerWallProps {
  unlockedLevels: ReadonlySet<string>;
  onPlay: (levelId: string) => void;
}

interface FlyerMeta {
  unlocked: boolean;
  stock: string;
}

export function FlyerWall({ unlockedLevels, onPlay }: FlyerWallProps): JSX.Element {
  const [focusWithin, setFocusWithin] = useState(false);
  const [shakeIndex, setShakeIndex] = useState<number | null>(null);
  // Click-through guard: the title→menu transition can land a stray pointer/keydown
  // on a freshly mounted flyer. Arm activations only after MOTION.titleToMenu ms.
  // Deterministic (a plain mount timer), no Date.now in render.
  const [armed, setArmed] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const itemRefs = useRef<(HTMLDivElement | null)[]>([]);

  useEffect(() => {
    const t = window.setTimeout(() => {
      setArmed(true);
    }, MOTION.titleToMenu);
    return () => {
      window.clearTimeout(t);
    };
  }, []);

  // Per-level derived presentation. Stock rotates rose/vert/orange by *playable*
  // index; the tutorial uses manila. Unlock predicate byte-identical to the shipped
  // LevelCard: `kind === 'tutorial' || unlockedLevels.has(id)`.
  let playableIdx = 0;
  const meta: FlyerMeta[] = LEVELS.map((level) => {
    const isTutorial = level.kind === "tutorial";
    const unlocked = isTutorial || unlockedLevels.has(level.id);
    let stock: string;
    if (isTutorial) {
      stock = STOCK.manila;
    } else {
      stock = FLYER_STOCK_BY_PLAYABLE_INDEX[playableIdx] ?? STOCK.rose;
      playableIdx += 1;
    }
    return { unlocked, stock };
  });

  function activate(i: number): void {
    // Ignore pointer + Enter/Space until the mount lockout elapses (click-through guard).
    if (!armed) return;
    const entry = meta[i];
    const level = LEVELS[i];
    if (entry === undefined || level === undefined) return;
    if (entry.unlocked) {
      onPlay(level.id);
    } else {
      setShakeIndex(i);
      window.setTimeout(() => {
        setShakeIndex(null);
      }, MOTION.lockedShakeMs);
    }
  }

  // At the desktop wrap-grid the flyers sit in rows, so Left/Right cycle them in list order;
  // below it (narrow column AND the short-landscape rack) they stack, so Up/Down navigate.
  // The query MUST match the CSS wrap-grid guard exactly — including the min-height that
  // excludes the pointer:coarse rack — or the horizontal axis leaks into a vertical layout.
  const wide = useMediaQuery("(min-width: 640px) and (min-height: 481px)");
  const roving = useRovingIndex(LEVELS.length, {
    axis: wide ? "horizontal" : "vertical",
    wrap: false,
    onActivate: activate,
  });

  // Move DOM focus with the roving index — but only while the wall already holds
  // focus, so we never steal focus on mount or on a rubrique switch. In short-landscape
  // the rack scrolls horizontally; the browser scrolls the newly-focused flyer into
  // view by default, so no manual scroll wiring is needed.
  useEffect(() => {
    if (containerRef.current?.contains(document.activeElement)) {
      itemRefs.current[roving.index]?.focus();
    }
  }, [roving.index]);

  return (
    <div
      ref={containerRef}
      className={cx("muf-flyerwall", styles.wall)}
      // Deterministic "the click-through lockout has elapsed" signal: reflects the
      // `armed` state so automation can wait for a real actionable state instead of
      // racing MOTION.titleToMenu (used by the e2e/screenshot flows before a flyer click).
      data-flyers-armed={armed ? "true" : "false"}
      onFocus={() => {
        setFocusWithin(true);
      }}
      onBlur={(e) => {
        if (!containerRef.current?.contains(e.relatedTarget as Node | null)) {
          setFocusWithin(false);
        }
      }}
      // In short-landscape (ADR-0024) the class rules below flip this to a horizontal
      // scroll-snap rack. The roving axis stays VERTICAL here: the `wide` query carries a
      // `min-height: 481px` guard (SHORT_LANDSCAPE_MAX_H + 1) that this ≤480px-tall rack
      // fails, so Up/Down still moves focus across all flyers, scrolling each into view.
    >
      <style>{`
        @media ${SHORT_LANDSCAPE_MEDIA}{
          .muf-flyerwall{
            --muf-flyerwall-dir: row;
            /* A5 ratio waived in the rack (flyer-wall-format.md §4): the ~300px
               content band cannot fit a 397px-tall A5 sheet. */
            --muf-flyer-aspect: auto;
            gap: 16px;
            align-items: flex-start;
            overflow-x: auto;
            overflow-y: hidden;
            scroll-snap-type: x mandatory;
          }
          .muf-flyerwall > .muf-flyer-slot{
            flex: 0 0 var(--flyer-max-width);
            width: var(--flyer-max-width);
            scroll-snap-align: start;
          }
        }
      `}</style>
      {LEVELS.map((level, i) => {
        const entry = meta[i];
        if (entry === undefined) return null;
        // Clamp the deterministic rest angle to the ±3° spec ceiling (§3.2,
        // MAX_TILT_DEG) so the effective rendered tilt can never exceed it.
        const restRotationDeg = Math.max(
          -MAX_TILT_DEG,
          Math.min(MAX_TILT_DEG, FLYER_REST_ROTATION_DEG[i % FLYER_REST_ROTATION_DEG.length] ?? 0),
        );
        // Slot wrapper: `display:flex` so the inline-block flyer stretches to the slot
        // width in both the portrait column (full width) and the landscape rack (fixed
        // card width, set by the `.muf-flyer-slot` class rule above).
        return (
          <div key={level.id} className={cx("muf-flyer-slot", styles.slot)}>
            <LevelFlyer
              level={level}
              flyerIndex={i}
              unlocked={entry.unlocked}
              stock={entry.stock}
              restRotationDeg={restRotationDeg}
              jitterPx={FLYER_JITTER_PX[i % FLYER_JITTER_PX.length] ?? 0}
              focused={focusWithin && roving.index === i}
              shaking={shakeIndex === i}
              tabIndex={roving.index === i ? 0 : -1}
              onSelect={() => {
                activate(i);
              }}
              onKeyDown={roving.onKeyDown}
              onFocus={() => {
                roving.setIndex(i);
              }}
              registerRef={(el) => {
                itemRefs.current[i] = el;
              }}
            />
          </div>
        );
      })}
    </div>
  );
}
