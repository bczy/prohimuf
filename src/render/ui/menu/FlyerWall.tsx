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
import {
  LevelFlyer,
  FLYER_LIFT_PX,
  FLYER_PULL_SCALE_HEADROOM_PX,
  PULLED_SHADOW_DROP_PX,
} from "./LevelFlyer";
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
  /** Derived ONCE by `useReducedMotionRoot` in App and threaded down (ADR-0054 §3), like
   *  CrtPass/NearForeground/the QTE sprites. Calling the hook again here would add a second
   *  matchMedia listener and a second source of truth for the same signal. */
  reducedMotion: boolean;
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
 * The exact 12 custom properties `mufFlyerFloatIn` reads. Spelled out as a key union
 * rather than `Record<string, string>`: a mistyped key (`--fio-yo` for `--fio-y0`) would
 * type-check silently, fall back to the zeroed CSS default and quietly flatten that axis
 * of the fall — with no compiler, lint or test signal. This animation has already been
 * through three tuning passes, so that is a live risk, not a hypothetical one.
 */
type FloatInVars = Record<
  | "--fio-y0"
  | "--fio-x0"
  | "--fio-r0"
  | "--fio-y1"
  | "--fio-x1"
  | "--fio-r1"
  | "--fio-y2"
  | "--fio-x2"
  | "--fio-r2"
  | "--fio-y3"
  | "--fio-x3"
  | "--fio-r3",
  string
>;

/**
 * Float-in fall paths (drop height, drift amplitude/direction, rotation) for the
 * `--fio-*` custom properties consumed by FlyerWall.module.css's `mufFlyerFloatIn`
 * keyframe. Three deterministic variants cycled by flyer index — same doctrine as the
 * imported FLYER_REST_ROTATION_DEG/FLYER_JITTER_PX print tokens, no Math.random — so
 * consecutive flyers don't drift the same distance in the same direction.
 */
const FLYER_FLOAT_IN_VARIANTS: readonly FloatInVars[] = [
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
 * Vertical padding of the short-landscape rack, in px.
 *
 * The rack is the ONE flyer layout that clips (`overflow-y: hidden`, forced by
 * `overflow-x: auto` — `visible` is not available alongside it), and a transform pushes
 * content past the BORDER edge, so this padding IS the headroom budget for the pulled
 * flyer. Derived from the pull rather than hand-tuned: at the old -4px pull the base 16px
 * was enough, at -22px it was not, and nothing caught it. `FlyerWall.test.ts` pins the
 * relation so the next change to `FLYER_LIFT_PX` fails loudly instead of cropping a sheet.
 *
 * Asymmetric on purpose: the top carries the pull plus the `scale(1.02)` growth and is the
 * edge that was cropping; the bottom only has to clear the cast shadow of a sheet that has
 * moved AWAY from it — `PULLED_SHADOW_DROP_PX`, the shadow's full reach less the distance
 * the sheet travelled up.
 *
 * Both edges also carry `FLYER_PULL_SCALE_HEADROOM_PX`, and the bottom needs it for the
 * same reason the top does: `transform-origin: center` means `scale(1.02)` grows the box
 * on BOTH edges, so the pulled sheet pushes down as well as up. Leaving that out of the
 * bottom was survivable only by the accident of a generous literal — the kind of accident
 * a later tightening would quietly cash in.
 *
 * `FlyerWall.test.ts` pins both edges against their requirement, so a future growth of
 * `FLYER_LIFT_PX` or `FLYER_PULLED_SHADOW` fails loudly instead of cropping a sheet.
 */
export const RACK_PAD_TOP_PX = Math.abs(FLYER_LIFT_PX.pulled) + FLYER_PULL_SCALE_HEADROOM_PX;
export const RACK_PAD_BOTTOM_PX = PULLED_SHADOW_DROP_PX + FLYER_PULL_SCALE_HEADROOM_PX;

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

/**
 * Has the entrance cascade already played THIS session? (`ux-designer` review, PR #145.)
 *
 * `sessionStorage`, deliberately NOT the lifetime `muf_seen_tutorial_nudge` key: the two
 * answer different questions and conflating them would either make the nudge reappear or
 * freeze the cascade forever. NIVEAUX is the screen a returning player passes through
 * constantly, and it unmounts on every rubrique switch — so without this, an
 * OPTIONS→NIVEAUX round trip replayed ~2.5s of moving paper and hid the level names and
 * lock badges the player read three seconds earlier. Once per session keeps the
 * first-impression moment and drops the tax on the browse→options→browse→play loop.
 */
const CASCADE_PLAYED_KEY = "muf_flyer_cascade_played";

/** Guarded like `hasSeenTutorialNudge`: no storage ⇒ treat as already played, so a
 *  private-mode session degrades to "no animation" rather than replaying every mount. */
export function hasCascadePlayed(): boolean {
  try {
    return sessionStorage.getItem(CASCADE_PLAYED_KEY) !== null;
  } catch {
    return true;
  }
}

export function markCascadePlayed(): void {
  try {
    sessionStorage.setItem(CASCADE_PLAYED_KEY, "1");
  } catch {
    // storage unavailable — the cascade simply won't be marked; harmless
  }
}

/** Give the session's showing back — used when reduced motion cuts a cascade short. */
export function clearCascadePlayed(): void {
  try {
    sessionStorage.removeItem(CASCADE_PLAYED_KEY);
  } catch {
    // storage unavailable — nothing was stored to begin with
  }
}

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
  reducedMotion,
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
  // The short-landscape rack does not run the entrance at all: it is the one layout that
  // clips, and the fall starts far above the headroom its padding reserves (see the rack
  // media block below, which removes the animation there).
  //
  // Read HERE as well, and not only in CSS, for the same reason reduced motion is latched
  // rather than left live: a media rule stops applying the moment the query stops matching,
  // so a player who rotates a phone from landscape to portrait while on NIVEAUX would have
  // the animation handed back and watch the whole cascade start in the middle of their
  // visit — the replay decision §1 forbids. Measured, not deduced: with the CSS rule alone,
  // rotating 844x390 -> 390x844 after the rack had settled restarted every slot.
  // Declared before `playCascade` so it can be latched into it: hook order is positional.
  const shortLandscape = useMediaQuery(SHORT_LANDSCAPE_MEDIA);
  // LATCHED at mount, reduced motion included — before the effect below marks the session,
  // so this mount still animates while every later one does not. The OS half of that signal is live and can
  // flip without unmounting us; recomputing would then start the cascade in the middle of a
  // visit, long after the entrance moment, and mark the session on an animation nobody
  // asked to see. Deciding once per mount keeps the flag and what was shown in agreement.
  const [playCascade] = useState(() => !hasCascadePlayed() && !reducedMotion && !shortLandscape);
  // A keyboard user who reaches the wall mid-cascade settles it AT ONCE. Two reasons, and
  // the accessibility one is the binding one: the sideways drift (up to ±44px) exceeds the
  // wall's 16px padding, so during the entrance an edge flyer — and its focus ring — pokes
  // past `.rubriquesLevels`' overflow-x clip and gets cut. Settling on arrival removes the
  // window entirely, rather than trimming the drift or weakening the clip. It is also
  // simply right: someone who has started interacting outranks a decorative animation.
  const [interrupted, setInterrupted] = useState(false);
  // The first-visit auto-focus is OURS, not the player's, and must not count as arrival —
  // otherwise a first-time visitor is the one person who never sees the cascade.
  const autoFocusing = useRef(false);
  // What each LIVE pointer gesture pressed, keyed by pointerId and tracked at the WINDOW
  // (a Tab arriving from OUTSIDE the wall fires its keydown on the element being left,
  // never on us). It exists to recognise ONE thing: the focus that belongs to a pointer
  // gesture, which is the only focus we must not act on — it lands on the very element
  // that gesture pressed, so that is what we compare against.
  //
  // Keyed, not a single ref: touches are CONCURRENT. A thumb resting on the wall while the
  // index finger taps a flyer fires a second pointerdown that would clobber the first
  // gesture's target, and the tapping finger's own focus would then match nothing and
  // settle the wall out from under it — the exact regression this guard exists to prevent,
  // reintroduced by the guard itself.
  //
  // Settling is the DEFAULT for every other focus, deliberately: three narrower rules were
  // tried (`:focus-visible`, pointer recency, requiring a keydown) and each shut out a real
  // population — WebKit mouse focus, touch, and assistive tech respectively. Which one
  // broke what is written up once, in decision §5 of
  // docs/game-design/ux/decision-niveaux-entrance-animation.md; repeating it here is how
  // that document and this file drifted apart in the first place.
  const pointerPressed = useRef(new Map<number, { target: EventTarget; ended: boolean }>());

  // Whether the session's one showing has been SPENT — either the cascade ran to its end
  // (the last slot's animationend, below) or the player resolved it themselves by arriving
  // on the wall. Both mean the same thing here: handing the flag back would buy a second
  // cascade later in the session. A ref, not state: nothing renders from it.
  const showingConsumed = useRef(false);
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
    // Only when it actually plays. Under reduced motion the animation is suppressed, so
    // marking it would spend the session's one showing on nothing — and a player who then
    // turns the toggle off and comes back would never see the entrance.
    if (playCascade) markCascadePlayed();
  }, [playCascade]);

  useEffect(() => {
    // The OS half of `reducedMotion` is LIVE and can flip while the wall stays mounted,
    // and the flag was already set at mount — so a flip mid-fall would spend the session's
    // one showing on a cascade the player only half saw. Hand it back, but ONLY then: if
    // the cascade ran to its end, or the player put the wall at rest themselves by arriving
    // on it, the session HAS had its showing and clearing the flag would buy a second one
    // later — decision §1 broken from the other end. The toggle has no deadline; a player
    // can flip it an hour into a visit for reasons unrelated to this wall.
    if (!playCascade || !reducedMotion) return;
    if (!showingConsumed.current) clearCascadePlayed();
    // LATCHED for this mount, finished or not: the OS switch can flip back to OFF while we
    // stay mounted, and `playCascade` is decided once at mount — so without this the CSS
    // kill switch would stop applying, re-applying the animation from the top, and the
    // whole cascade would restart mid-visit. That is the replay the design gate blocked,
    // and it happens whether or not the fall had completed.
    setInterrupted(true);
  }, [playCascade, reducedMotion]);

  useEffect(() => {
    // Release only the gestures that have ENDED, never the whole map. Wholesale clearing
    // was safe while a single marker was tracked; with one per pointer it is not, because
    // pointers overlap: a finger lifting fires the click that would wipe the marker of a
    // finger still down, and that second finger's own focus would then match nothing and
    // settle the wall out from under it — the very yank this guard exists to prevent.
    const releaseEnded = () => {
      for (const [id, entry] of pointerPressed.current) {
        if (entry.ended) pointerPressed.current.delete(id);
      }
    };
    const onDown = (e: PointerEvent) => {
      // A pointerdown with no target has nothing a later focus could be compared against,
      // so recording it would only ever be a stale entry that suppresses nothing.
      if (e.target !== null)
        pointerPressed.current.set(e.pointerId, { target: e.target, ended: false });
    };
    // Lifted, but NOT yet forgotten: on touch the order is pointerdown → pointerup →
    // synthetic mousedown → focus → mouseup → click, so a tap's own focus still arrives
    // after its finger is up. Deleting here would reopen the touch bug this guard was
    // written for; marking it ended lets the click that follows do the deleting.
    const onUp = (e: PointerEvent) => {
      const entry = pointerPressed.current.get(e.pointerId);
      if (entry !== undefined) entry.ended = true;
    };
    // A pointer whose buttons are all up is no longer pressed, whatever we were told. Some
    // releases never reach us at all — letting go outside the window, or the OS taking the
    // pointer during an app switch mid-press, fire neither pointerup nor pointercancel — and
    // an entry stuck at `ended: false` is never collected, so that flyer would be denied its
    // settle for the rest of the mount. The next move over the page repairs it, because a
    // move that reports no buttons is proof the press is over.
    const onMove = (e: PointerEvent) => {
      if (e.buttons === 0) pointerPressed.current.delete(e.pointerId);
    };
    // Losing the window is the other half of that repair, and the one touch needs: a finger
    // does not emit a hover move on the way back. Whatever was in flight when the page went
    // away cannot be the gesture behind the focus that arrives once it returns.
    const onBlur = () => {
      pointerPressed.current.clear();
    };
    // Cancelled gestures produce no focus at all, so theirs can go immediately.
    const onCancel = (e: PointerEvent) => {
      pointerPressed.current.delete(e.pointerId);
    };
    window.addEventListener("pointerdown", onDown, true);
    window.addEventListener("pointerup", onUp, true);
    window.addEventListener("pointercancel", onCancel, true);
    // `click` is the first event guaranteed to come after a tap's own focus, so it is where
    // an ended gesture is finally dropped. `contextmenu` is the way out for the gestures
    // that never reach a click — a right-click dispatches none, and a long-press the OS
    // takes over does not reliably cancel. `keydown` covers the last case: a player who
    // pressed, released, and reached for the keyboard instead of completing the click.
    window.addEventListener("pointermove", onMove, true);
    window.addEventListener("blur", onBlur);
    window.addEventListener("click", releaseEnded, true);
    window.addEventListener("contextmenu", releaseEnded, true);
    window.addEventListener("keydown", releaseEnded, true);
    return () => {
      window.removeEventListener("pointerdown", onDown, true);
      window.removeEventListener("pointerup", onUp, true);
      window.removeEventListener("pointercancel", onCancel, true);
      window.removeEventListener("pointermove", onMove, true);
      window.removeEventListener("blur", onBlur);
      window.removeEventListener("click", releaseEnded, true);
      window.removeEventListener("contextmenu", releaseEnded, true);
      window.removeEventListener("keydown", releaseEnded, true);
    };
  }, []);

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
      // `preventScroll` because this fires while the flyer is mid-entrance: its rect is
      // still translated up to -230px / ±44px, and the browser's implicit scroll-into-view
      // reads that transformed rect — so it would scroll to where the sheet ISN'T. Keeping
      // the focus itself on mount (rather than deferring it until the animation settles)
      // is deliberate: a screen-reader user should not wait ~2s for focus to land.
      autoFocusing.current = true;
      itemRefs.current[tutorialIndex]?.focus({ preventScroll: true });
      autoFocusing.current = false;
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
        onFocus={(e) => {
          setFocusWithin(true);
          if (autoFocusing.current) return;
          // A focus that BELONGS to a pointer gesture lands on the very element that
          // gesture pressed; settling on it would yank the flyer out from under the finger
          // or cursor before the click resolves. Every other focus — a Tab, an arrow, a
          // screen reader's virtual cursor, which reaches us with no key event at all —
          // is a player arriving, and settles the wall so no focus ring gets clipped.
          // ANY live gesture, not just the newest: with two fingers down, the one that
          // produces this focus is not necessarily the one that pressed last.
          for (const [id, entry] of pointerPressed.current) {
            if (!(entry.target instanceof Node) || !e.target.contains(entry.target)) continue;
            // An ENDED gesture exists for exactly ONE focus — its own, which on touch
            // arrives after its pointerup — so swallowing that focus spends it. Dropping
            // it HERE, at the moment of use, is what stops a marker from outliving its
            // gesture: `click`/`contextmenu`/`keydown` are the only other things that
            // collect it, and a gesture can end without any of the three ever firing (a
            // tap whose click is suppressed, a press the page navigates away from). The
            // entry would then sit there and deny the NEXT arrival — a keyboard or
            // screen-reader one — the settle that is the whole accessibility point.
            // Conditioned on `ended` to keep the blast radius at the stale case alone: a
            // finger still DOWN keeps its marker for as long as it is down, exactly as
            // before. Four earlier passes at this rule each reopened a case the previous
            // one had closed, so this changes the ended branch and nothing else.
            if (entry.ended) pointerPressed.current.delete(id);
            return;
          }
          setInterrupted(true);
          showingConsumed.current = true;
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
            /* Vertical headroom for the pulled flyer. NOTE: no backticks in this block —
               it lives inside a JSX template literal. Deliberately carries NO numbers: an
               earlier copy of this comment quoted "28px top/bottom" and went stale the
               moment the top padding was re-derived, contradicting the declarations three
               lines below it. The values and their rationale live in ONE place, the JSDoc
               on RACK_PAD_TOP_PX / RACK_PAD_BOTTOM_PX above; read them there.
               Why the padding matters at all: this rack is the ONE layout that clips
               (overflow-y: hidden, forced by overflow-x: auto — visible is not available
               alongside it), and a transform pushes content past the BORDER edge, so the
               container's own padding is the whole headroom budget for the pulled sheet.
               Costs the rack some of its content band — the flyers are content-sized here
               (--muf-flyer-aspect: auto, align-items: flex-start), not stretched, so this
               shifts them down rather than shrinking them. */
            padding-top: ${String(RACK_PAD_TOP_PX)}px;
            padding-bottom: ${String(RACK_PAD_BOTTOM_PX)}px;
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
            /* No entrance cascade in the rack. The fall starts up to 230px above the
               resting position (FLYER_FLOAT_IN_VARIANTS), and this is the ONE layout that
               clips: the padding above is sized for the PULL, ~32px, so every sheet spends
               its whole fall beheaded at the clip edge — measured at 233px of the tutorial
               flyer cut off, its masthead and stamp with it. Growing the padding to 240px
               is the other way out and the wrong one: it would spend most of a ~300px
               content band on headroom for a decorative fall, on the screen that has the
               least height to give. A 230px vertical drop is also meaningless here — the
               rack is a constrained HORIZONTAL scroller, so the sheets fall in from
               off-layout rather than onto the wall.
               Same end state as the reduced-motion kill switches and .slotSettled, and
               reached the same way: the animation is REMOVED, not replaced by a second
               one. Specificity (0,2,0) beats the .slot rule's (0,1,0), so this wins
               wherever the CSS-module rule lands in source order. */
            animation: none;
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
              className={cx(
                "muf-flyer-slot",
                styles.slot,
                playCascade && !interrupted ? undefined : styles.slotSettled,
              )}
              // The LAST slot is the one that finishes last — every slot runs the same
              // duration and the delay grows with the index — so its animationend IS the
              // end of the cascade. Watching the real event rather than recomputing
              // `(n-1) * stagger + duration` keeps the stagger, the duration and the level
              // count from having to be kept in step in a third place (same reasoning as
              // waitForFlyerWallSettled in scripts/e2e-lib.mjs).
              onAnimationEnd={
                i === LEVELS.length - 1
                  ? (e) => {
                      // Not a child's animation bubbling up through us.
                      if (e.target === e.currentTarget) showingConsumed.current = true;
                    }
                  : undefined
              }
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
