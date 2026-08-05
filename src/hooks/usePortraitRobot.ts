import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { FACE_CATALOGUE } from "@game/portraits";
import { createPortraitScene, stepPortraitScene } from "@game/systems/portraitRobotSystem";
import type {
  FaceCatalogue,
  PortraitBandId,
  PortraitIntent,
  PortraitScene,
} from "@game/types/portraitRobot";
import type { PortraitBandView } from "@render/ui/portrait";

/** Frame clamp, mirroring `useGameLoop`'s: a backgrounded tab must not eat the chrono. */
const MAX_DELTA = 0.1;

export interface PortraitRobotOptions {
  /** Frozen at phase entry by the shell (`?portraitSeed=` overrides it). */
  readonly seed: number;
  /** Chrono for this run's difficulty — the shell reads gate §3's table, never this hook. */
  readonly timerSeconds: number;
  /** `true` under `RotateOverlay`: the fold simply stops being called (ADR-0081 D5). */
  readonly paused: boolean;
  /** Catalogue override for tests / a future second plate. */
  readonly catalogue?: FaceCatalogue;
}

export interface PortraitRobotState {
  readonly scene: PortraitScene;
  /** The four bands as the screen draws them — assets resolved through the puzzle's order. */
  readonly bands: readonly PortraitBandView[];
  /** The reference face: the same four bands on their truth slots. */
  readonly targetBands: readonly string[];
  /** Queue a player request. It is DRAINED by the frame fold, never applied here. */
  readonly pushIntent: (intent: PortraitIntent) => void;
  /** Current slot of a band — what `usePortraitGestures` turns crans into a `SET` with. */
  readonly indexOf: (band: PortraitBandId) => number;
}

/**
 * The scene bridge (ADR-0079 D8.3).
 *
 * It holds three things and no rule: a `PortraitScene` in React state, an inbox of
 * intents in a ref, and a `requestAnimationFrame` loop. Once per frame it calls
 * **`stepPortraitScene(scene, inbox, dt)` — its single call site** — which drains
 * the inputs before advancing time.
 *
 * That single call site is the whole architecture. `applyPortraitIntent` and
 * `tickPortraitScene` are never called from here: two call sites would restore the
 * buzzer race (a `pointerup` landing between the tick and the resolution), silently,
 * with a green suite — which is why it is a standing blocking finding at stage 6
 * regardless of test colour (ADR-0079 C2bis, hand-off §3.4).
 *
 * On pause the inbox is **cleared, never buffered**: a swipe made behind the rotate
 * overlay is not a swipe the player took, and replaying a queue on resume would land
 * crans the player cannot see coming.
 */
export function usePortraitRobot({
  seed,
  timerSeconds,
  paused,
  catalogue = FACE_CATALOGUE,
}: PortraitRobotOptions): PortraitRobotState {
  const [scene, setScene] = useState<PortraitScene>(() =>
    createPortraitScene(catalogue, seed, timerSeconds),
  );
  const inboxRef = useRef<PortraitIntent[]>([]);
  // Read at push time, not at effect time: an event fired WHILE paused (a stray touch
  // through the overlay, a key press) must be dropped on arrival. Emptying the inbox
  // only when the pause starts would let those events queue up and land, all at once,
  // on the frame the player comes back — crans they never saw coming.
  const pausedRef = useRef(paused);
  pausedRef.current = paused;

  const pushIntent = useCallback((intent: PortraitIntent): void => {
    if (pausedRef.current) return;
    inboxRef.current.push(intent);
  }, []);

  useEffect(() => {
    if (paused) {
      inboxRef.current = [];
      return;
    }
    let raf = 0;
    let last = performance.now();
    const frame = (now: number): void => {
      const dt = Math.min((now - last) / 1000, MAX_DELTA);
      last = now;
      const intents = inboxRef.current;
      inboxRef.current = [];
      setScene((current) => stepPortraitScene(current, intents, dt));
      raf = requestAnimationFrame(frame);
    };
    raf = requestAnimationFrame(frame);
    return () => {
      cancelAnimationFrame(raf);
    };
  }, [paused]);

  const bands = useMemo<readonly PortraitBandView[]>(
    () =>
      catalogue.bands.map((band, bandIndex) => {
        const order = scene.puzzle.order[bandIndex] ?? [];
        const slot = scene.selection[bandIndex] ?? 0;
        const variant = band.variants[order[slot] ?? 0];
        return {
          id: band.id,
          label: band.label,
          src: variant?.asset ?? "",
          ordinal: slot + 1,
          total: order.length,
        };
      }),
    [catalogue, scene.puzzle.order, scene.selection],
  );

  const targetBands = useMemo<readonly string[]>(
    () =>
      catalogue.bands.map((band, bandIndex) => {
        const order = scene.puzzle.order[bandIndex] ?? [];
        const truthSlot = scene.puzzle.truth[bandIndex] ?? 0;
        return band.variants[order[truthSlot] ?? 0]?.asset ?? "";
      }),
    [catalogue, scene.puzzle.order, scene.puzzle.truth],
  );

  const indexOf = useCallback(
    (band: PortraitBandId): number => {
      const bandIndex = catalogue.bands.findIndex((b) => b.id === band);
      return scene.selection[bandIndex] ?? 0;
    },
    [catalogue, scene.selection],
  );

  return { scene, bands, targetBands, pushIntent, indexOf };
}
