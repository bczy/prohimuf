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
} from "@render/ui/print";
import { LevelFlyer } from "./LevelFlyer";

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

  const roving = useRovingIndex(LEVELS.length, {
    axis: "vertical",
    wrap: false,
    onActivate: activate,
  });

  // Move DOM focus with the roving index — but only while the wall already holds
  // focus, so we never steal focus on mount or on a rubrique switch.
  useEffect(() => {
    if (containerRef.current?.contains(document.activeElement)) {
      itemRefs.current[roving.index]?.focus();
    }
  }, [roving.index]);

  return (
    <div
      ref={containerRef}
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
      style={{ padding: "16px", display: "flex", flexDirection: "column" }}
    >
      {LEVELS.map((level, i) => {
        const entry = meta[i];
        if (entry === undefined) return null;
        // Clamp the deterministic rest angle to the ±3° spec ceiling (§3.2,
        // MAX_TILT_DEG) so the effective rendered tilt can never exceed it.
        const restRotationDeg = Math.max(
          -MAX_TILT_DEG,
          Math.min(MAX_TILT_DEG, FLYER_REST_ROTATION_DEG[i % FLYER_REST_ROTATION_DEG.length] ?? 0),
        );
        return (
          <LevelFlyer
            key={level.id}
            level={level}
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
        );
      })}
    </div>
  );
}
