import { useEffect, useRef } from "react";
import type { RefObject } from "react";
import { PORTRAIT_BAND_ORDER } from "@game/systems/portraitRobotSystem";
import {
  DRAG_CRAN_DISTANCE,
  accumulateDrag,
  classifySwipe,
} from "@game/systems/swipeGestureSystem";
import type { PortraitBandId, PortraitIntent } from "@game/types/portraitRobot";

/** Vertical drift tolerated BEFORE engagement, as a share of the band's height (UX §2.3.4.2). */
const PRE_ENGAGE_DRIFT_RATIO = 0.5;

interface PointerGesture {
  readonly pointerId: number;
  readonly band: PortraitBandId;
  /** Normalised (0..1 of viewport) start point — the pure classifier takes no pixels. */
  readonly startX: number;
  readonly startY: number;
  readonly startMs: number;
  /** Height of the band the gesture started on, normalised — the drift budget. */
  readonly bandHeight: number;
  lastX: number;
  carried: number;
  crans: number;
  engaged: boolean;
  cancelled: boolean;
}

export interface PortraitGestureOptions {
  /** The joined band surface. The hook needs the element itself for pointer capture. */
  readonly stackRef: RefObject<HTMLDivElement | null>;
  /** `false` freezes every path at once — resolution, `RotateOverlay` pause. */
  readonly enabled: boolean;
  /** Keyboard / screen-reader cursor, read off the scene. */
  readonly focusedBand: PortraitBandId;
  /** Where every intent goes: the fold's inbox, never a reducer call. */
  readonly onIntent: (intent: PortraitIntent) => void;
}

/**
 * The BINDING half of the input layer (ADR-0083 D2/D2bis). It owns pointer and key
 * listeners and holds the mapping table — and nothing else. Every decision about
 * what a gesture *is* comes from `swipeGestureSystem` (pure); every decision about
 * what it *does to a board* comes from the fold in `portraitRobotSystem` (pure).
 *
 * **It never calls `applyPortraitIntent` or `tickPortraitScene`.** It emits intents
 * into `usePortraitRobot`'s inbox, which the frame fold drains — the hook owns no
 * ordering, which is the only reason « 4/4 pile au buzzer ⇒ IDENTIFIED » is a
 * property of the reducer instead of a race between `pointerup` and rAF
 * (ADR-0079 D8.3, standing blocking finding at stage 6).
 *
 * ## The mapping table
 *
 * | Input | Intent |
 * | --- | --- |
 * | horizontal swipe on band `i` (mobile primary) | `CYCLE(i, ±1)` |
 * | horizontal drag on band `i` (desktop primary) | `CYCLE(i, ±crans)` |
 * | `↑` / `↓` | `FOCUS(prev/next)` |
 * | `←` / `→` | `CYCLE(focused, ∓1)` |
 * | `1`…`6` | `SET(focused, n-1)` |
 * | `Escape` | `ABANDON` |
 *
 * There is no `Enter` row and no `SUBMIT`: B1 deleted the validation ACT, and a
 * keyboard binding that re-created it would be that CTA under another name.
 *
 * ## Anti-drift, without a gap to lean on
 *
 * The bands are joined (no 8px gutter any more), so the guard is a property of the
 * TRAJECTORY, not of the screen: the band is resolved at `pointerdown` and frozen
 * for the whole gesture; a vertical drift over half a band height CANCELS the
 * gesture while it is pre-engagement; once engaged (past the cran distance) the
 * band is immune to drift, because a finger that has already travelled horizontally
 * has shown its intent and human swipes arc at the end. No cran can ever land on a
 * band other than the one touched first.
 *
 * ## Why crans are banked and spent at release
 *
 * A drag crossing three crans emits **one** `CYCLE(±3)`, not three `CYCLE(±1)`s: the
 * lock-in post-condition then runs once, on the board the player aimed at, instead of
 * three times on intermediate boards they never chose (ADR-0083 D2bis).
 *
 * It is RELATIVE, and that is the ordering fix of panel run-1: the hook used to bank
 * crans and emit an absolute `SET(indexOf(band) + crans)`, computed from the selection
 * REACT had rendered rather than the one the fold holds. Anything else already in the
 * inbox that frame silently moved the target. A relative entry cannot be stale, and it
 * also stops the hook wrapping on `VARIANTS_PER_BAND` — the fold wraps on the band's
 * real length, which is what a plate with a short band would have needed.
 */
export function usePortraitGestures({
  stackRef,
  enabled,
  focusedBand,
  onIntent,
}: PortraitGestureOptions): void {
  // Live values behind refs so the listeners are bound ONCE per element: rebinding
  // them on every scene tick would drop a gesture mid-travel every frame.
  const enabledRef = useRef(enabled);
  const focusedRef = useRef(focusedBand);
  const onIntentRef = useRef(onIntent);
  enabledRef.current = enabled;
  focusedRef.current = focusedBand;
  onIntentRef.current = onIntent;

  useEffect(() => {
    const stack = stackRef.current;
    if (stack === null) return;
    let gesture: PointerGesture | null = null;

    const bandAt = (target: EventTarget | null): { id: PortraitBandId; height: number } | null => {
      if (!(target instanceof Element)) return null;
      // A pointerdown on a chevron is that button's click, never a drag (UX §2.6).
      if (target.closest("button") !== null) return null;
      const el = target.closest("[data-band]");
      if (el === null) return null;
      const id = el.getAttribute("data-band");
      const known = PORTRAIT_BAND_ORDER.find((b) => b === id);
      if (known === undefined) return null;
      return { id: known, height: el.getBoundingClientRect().height / window.innerHeight };
    };

    const onPointerDown = (event: PointerEvent): void => {
      if (!enabledRef.current || gesture !== null) return;
      const band = bandAt(event.target);
      if (band === null) return;
      const x = event.clientX / window.innerWidth;
      const y = event.clientY / window.innerHeight;
      gesture = {
        pointerId: event.pointerId,
        band: band.id,
        startX: x,
        startY: y,
        startMs: event.timeStamp,
        bandHeight: band.height,
        lastX: x,
        carried: 0,
        crans: 0,
        engaged: false,
        cancelled: false,
      };
      stack.setPointerCapture(event.pointerId);
    };

    const onPointerMove = (event: PointerEvent): void => {
      const g = gesture;
      if (g?.pointerId !== event.pointerId || g.cancelled) return;
      const x = event.clientX / window.innerWidth;
      const y = event.clientY / window.innerHeight;
      if (!g.engaged && Math.abs(y - g.startY) > g.bandHeight * PRE_ENGAGE_DRIFT_RATIO) {
        g.cancelled = true;
        return;
      }
      const { crans, carriedPx } = accumulateDrag(g.carried, x - g.lastX);
      g.carried = carriedPx;
      g.crans += crans;
      g.lastX = x;
      if (Math.abs(x - g.startX) >= DRAG_CRAN_DISTANCE) g.engaged = true;
    };

    const endGesture = (event: PointerEvent): void => {
      const g = gesture;
      if (g?.pointerId !== event.pointerId) return;
      gesture = null;
      if (stack.hasPointerCapture(event.pointerId)) stack.releasePointerCapture(event.pointerId);
      if (g.cancelled || !enabledRef.current) return;
      if (event.type === "pointercancel") return;

      if (g.crans !== 0) {
        // ONE entry for the whole travel, and a RELATIVE one — see the header note.
        onIntentRef.current({ kind: "CYCLE", band: g.band, delta: g.crans });
        return;
      }
      // Nothing banked: a quick flick can still be a swipe, judged as a finished
      // gesture by the pure classifier (a drag and a swipe are not the same act).
      const direction = classifySwipe(
        event.clientX / window.innerWidth - g.startX,
        event.clientY / window.innerHeight - g.startY,
        event.timeStamp - g.startMs,
      );
      if (direction === "none") return;
      onIntentRef.current({ kind: "CYCLE", band: g.band, delta: direction === "right" ? 1 : -1 });
    };

    stack.addEventListener("pointerdown", onPointerDown);
    stack.addEventListener("pointermove", onPointerMove);
    stack.addEventListener("pointerup", endGesture);
    stack.addEventListener("pointercancel", endGesture);
    return () => {
      stack.removeEventListener("pointerdown", onPointerDown);
      stack.removeEventListener("pointermove", onPointerMove);
      stack.removeEventListener("pointerup", endGesture);
      stack.removeEventListener("pointercancel", endGesture);
    };
  }, [stackRef]);

  useEffect(() => {
    const onKey = (event: KeyboardEvent): void => {
      if (!enabledRef.current) return;
      // A chord is a BROWSER command, never a scene entry: `Ctrl+A` used to cycle a
      // variant and `Cmd+→` used to jump one, because the handler only looked at
      // `event.key` (panel run-1 minor). `Escape` never carries a modifier either.
      if (event.ctrlKey || event.metaKey || event.altKey) return;
      const band = focusedRef.current;
      const bandIndex = PORTRAIT_BAND_ORDER.indexOf(band);
      // Total by construction: `bandIndex` comes from the union itself, so the modulo
      // always lands on a member — the fallback exists for the type, not for a case.
      const neighbour = (offset: number): PortraitBandId =>
        PORTRAIT_BAND_ORDER[(bandIndex + offset) % PORTRAIT_BAND_ORDER.length] ?? band;
      const emit = (intent: PortraitIntent): void => {
        event.preventDefault();
        onIntentRef.current(intent);
      };
      switch (event.key) {
        case "ArrowUp":
        case "w":
          emit({ kind: "FOCUS", band: neighbour(PORTRAIT_BAND_ORDER.length - 1) });
          return;
        case "ArrowDown":
        case "s":
          emit({ kind: "FOCUS", band: neighbour(1) });
          return;
        case "ArrowLeft":
        case "a":
          emit({ kind: "CYCLE", band, delta: -1 });
          return;
        case "ArrowRight":
        case "d":
          emit({ kind: "CYCLE", band, delta: 1 });
          return;
        // A deliberate keyboard action is its own confirmation (UX §2.8.4): `Escape`
        // resolves in ONE press. Stacking the pointer's 2 s arming on top would add
        // temporal precision to spatial precision — hostile to screen readers and to
        // motor impairment, for a mistap risk the keyboard does not have.
        case "Escape":
          emit({ kind: "ABANDON" });
          return;
        default:
          break;
      }
      if (/^[1-6]$/.test(event.key)) {
        emit({ kind: "SET", band, index: Number(event.key) - 1 });
      }
    };
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("keydown", onKey);
    };
  }, []);
}
