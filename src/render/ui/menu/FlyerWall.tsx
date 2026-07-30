import { useEffect, useRef, useState } from "react";
import type { JSX } from "react";
import { LEVELS } from "@game/levels/levels";
import type { Prefs } from "@game/systems/prefsSystem";
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
import { BallotRow, cx } from "../controls";
import type { BallotChoice } from "../controls";

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
  /** The global-difficulty source of truth (also written from the OPTIONS colophon). */
  prefs: Prefs;
  /** Persist a prefs change; the App-owned store is the single source of truth. */
  onSavePrefs: (prefs: Prefs) => void;
}

interface FlyerMeta {
  unlocked: boolean;
  stock: string;
}

/**
 * Delay between two consecutive flyers' entrances, ms. EXPORTED so the test asserts the
 * real step rather than re-typing the number: a test that only pinned "delays increase"
 * stayed green when the step shrank to a couple of ms, which silently destroys the
 * cascade this feature exists to produce.
 */
export const FLOAT_IN_STAGGER_MS = 180;

/**
 * Float-in fall paths (drop height, drift amplitude/direction, rotation) for the
 * `--fio-*` custom properties consumed by FlyerWall.module.css's `mufFlyerFloatIn`
 * keyframe. Three deterministic variants cycled by flyer index — same doctrine as the
 * imported FLYER_REST_ROTATION_DEG/FLYER_JITTER_PX print tokens, no Math.random — so
 * consecutive flyers don't drift the same distance in the same direction.
 */
const FLYER_FLOAT_IN_VARIANTS: readonly Record<string, string>[] = [
  {
    "--fio-y0": "-190px",
    "--fio-x0": "-36px",
    "--fio-r0": "-22deg",
    "--fio-y1": "-105px",
    "--fio-x1": "28px",
    "--fio-r1": "14deg",
    "--fio-y2": "-43px",
    "--fio-x2": "-20px",
    "--fio-r2": "-10deg",
    "--fio-y3": "-8px",
    "--fio-x3": "10px",
    "--fio-r3": "5deg",
  },
  {
    "--fio-y0": "-230px",
    "--fio-x0": "44px",
    "--fio-r0": "19deg",
    "--fio-y1": "-116px",
    "--fio-x1": "-32px",
    "--fio-r1": "-14deg",
    "--fio-y2": "-40px",
    "--fio-x2": "14px",
    "--fio-r2": "7deg",
    "--fio-y3": "-4px",
    "--fio-x3": "-6px",
    "--fio-r3": "-3deg",
  },
  {
    "--fio-y0": "-142px",
    "--fio-x0": "-20px",
    "--fio-r0": "-12deg",
    "--fio-y1": "-78px",
    "--fio-x1": "24px",
    "--fio-r1": "11deg",
    "--fio-y2": "-30px",
    "--fio-x2": "-13px",
    "--fio-r2": "-6deg",
    "--fio-y3": "-5px",
    "--fio-x3": "6px",
    "--fio-r3": "3deg",
  },
];

/**
 * PRESSION choices — labels identical to `OptionsControls`' `DIFFICULTIES` (one
 * `Prefs.difficulty` field surfaced on two surfaces). Defined locally from the
 * `Prefs["difficulty"]` union rather than imported, since `OptionsControls` does not
 * export them and M2 leaves that file untouched.
 */
const DIFFICULTIES: readonly { value: Prefs["difficulty"]; label: string }[] = [
  { value: "easy", label: "FACILE" },
  { value: "normal", label: "NORMAL" },
  { value: "hard", label: "DIFFICILE" },
];

/**
 * Map the single `Prefs.difficulty` field to the PRESSION ballot choices — `selected`
 * reads straight from `prefs` (no local copy, so this header and the OPTIONS colophon
 * can never diverge) and each `onSelect` writes the whole prefs back through the shared
 * `onSavePrefs`. Exported pure so the write-through contract is unit-testable DOM-free.
 */
export function buildPressionChoices(
  prefs: Prefs,
  onSavePrefs: (prefs: Prefs) => void,
): BallotChoice[] {
  return DIFFICULTIES.map((d) => ({
    key: d.value,
    label: d.label,
    selected: prefs.difficulty === d.value,
    onSelect: () => {
      onSavePrefs({ ...prefs, difficulty: d.value });
    },
  }));
}

/**
 * First-run discoverability flag (spec-menus-ui-completion §4, gate ruling Q7 /
 * ADR-0054 §1). One dedicated render-side `localStorage` key — deliberately NOT a
 * `Prefs` field (it records that a UI *visit* happened, not a game setting), read with
 * the same private-mode/SSR-safe guard as `loadPrefs`. Absent ⇒ first-ever NIVEAUX
 * visit; the same flag gates BOTH the tutorial-flyer auto-focus and the one-time
 * visual nudge.
 */
const SEEN_TUTORIAL_NUDGE_KEY = "muf_seen_tutorial_nudge";

/** True once the first-run tutorial nudge has been shown (or storage is unavailable — a
 *  guarded read that treats absence-of-storage as "already seen", so it never nags nor
 *  throws). Exported pure so the first-run decision is unit-testable DOM-free. */
export function hasSeenTutorialNudge(): boolean {
  try {
    return localStorage.getItem(SEEN_TUTORIAL_NUDGE_KEY) !== null;
  } catch {
    return true;
  }
}

/** Mark the first-run nudge seen so it never shows again (spec §4: set on first NIVEAUX
 *  mount). Guarded like `savePrefs` — a storage failure just lets the nudge reappear
 *  next mount, which is harmless. */
export function markTutorialNudgeSeen(): void {
  try {
    localStorage.setItem(SEEN_TUTORIAL_NUDGE_KEY, "1");
  } catch {
    // storage unavailable — silently ignore (nudge may show again; no crash)
  }
}

export function FlyerWall({
  unlockedLevels,
  onPlay,
  prefs,
  onSavePrefs,
}: FlyerWallProps): JSX.Element {
  const [focusWithin, setFocusWithin] = useState(false);
  const [shakeIndex, setShakeIndex] = useState<number | null>(null);
  // First-ever NIVEAUX visit (spec §4). Captured ONCE at mount so writing the "seen"
  // flag below never retroactively hides the nudge or drops the focus steal during this
  // same visit. Absent flag ⇒ first-timer: auto-focus the tutorial flyer + show the nudge.
  const [firstVisit] = useState(() => !hasSeenTutorialNudge());
  // The tutorial is its own flyer, first in the pile (LEVELS order); resolve its index
  // rather than hard-coding 0 so the focus target + nudge slot stay correct if order shifts.
  const tutorialIndex = LEVELS.findIndex((level) => level.kind === "tutorial");
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

  // First-ever visit only (spec §4): set the one-time flag on mount, and land keyboard
  // focus on the tutorial flyer instead of leaving it on the NIVEAUX tab. This is
  // auto-FOCUS, not auto-navigate — nothing plays, nothing advances, the player still
  // chooses. Every return visit keeps today's behaviour (no steal). `firstVisit` and
  // `tutorialIndex` are mount-stable, so this runs exactly once.
  useEffect(() => {
    if (!firstVisit) return;
    markTutorialNudgeSeen();
    if (tutorialIndex >= 0) {
      itemRefs.current[tutorialIndex]?.focus();
    }
  }, [firstVisit, tutorialIndex]);

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

  // PRESSION — the global difficulty dial, same single `Prefs.difficulty` field the
  // OPTIONS colophon writes.
  const difficultyOptions = buildPressionChoices(prefs, onSavePrefs);

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
    <>
      {/* PRESSION — the global difficulty dial promoted to a glanceable header above the
          flyer grid (spec-menus-ui-completion §5), reusing the OPTIONS ballot vocabulary
          and the single `Prefs.difficulty` field. Hidden on the short-landscape rack
          (Option A) to protect the gated pregame-landscape chrome budget — there PRESSION
          stays reachable via OPTIONS. The gating mirrors the masthead's: a global class the
          SHORT_LANDSCAPE_MEDIA block below flips to `display:none`. */}
      <div className={cx("muf-pression-header", styles.pressionHeader)}>
        <BallotRow
          label="PRESSION"
          hint="à quel point les flics te collent"
          options={difficultyOptions}
        />
      </div>
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
          if (!containerRef.current?.contains(e.relatedTarget)) {
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
          /* Option A (spec-menus-ui-completion §5): drop the PRESSION header on the
             short-landscape rack so the flyers keep their gated height budget. */
          .muf-pression-header{
            display: none;
          }
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
            Math.min(
              MAX_TILT_DEG,
              FLYER_REST_ROTATION_DEG[i % FLYER_REST_ROTATION_DEG.length] ?? 0,
            ),
          );
          // Slot wrapper: `display:flex` so the inline-block flyer stretches to the slot
          // width in both the portrait column (full width) and the landscape rack (fixed
          // card width, set by the `.muf-flyer-slot` class rule above).
          return (
            <div
              key={level.id}
              className={cx("muf-flyer-slot", styles.slot)}
              // Staggers the float-in entrance (FlyerWall.module.css) so flyers appear
              // one sheet at a time instead of all at once, each on its own fall path.
              style={
                {
                  "--slot-delay": `${String(i * FLOAT_IN_STAGGER_MS)}ms`,
                  ...FLYER_FLOAT_IN_VARIANTS[i % FLYER_FLOAT_IN_VARIANTS.length],
                } as React.CSSProperties
              }
            >
              {/* First-run nudge (spec §4): a modest felt-tip "start here" scrawl above
                  the tutorial flyer, shown only on the first-ever NIVEAUX visit and never
                  again (same `firstVisit`/`muf_seen_tutorial_nudge` gate as the auto-focus).
                  Static by construction — no animation to gate under reduced motion. */}
              {firstVisit && i === tutorialIndex && (
                <div className={cx("muf-tutorial-nudge", styles.nudge)}>
                  COMMENCE ICI
                  <span aria-hidden="true" className={styles.nudgeArrow}>
                    ↓
                  </span>
                </div>
              )}
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
    </>
  );
}
