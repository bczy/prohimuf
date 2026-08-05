import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { FACE_CATALOGUE, validatePortrait } from "@game/portraits";
import {
  createPortraitScene,
  portraitRevealProgress,
  stepPortraitScene,
} from "@game/systems/portraitRobotSystem";
import type { FaceCatalogue, PortraitIntent, PortraitScene } from "@game/types/portraitRobot";
import type { PortraitBandView } from "@render/ui/portrait";

/** Frame clamp, mirroring `useGameLoop`'s: a backgrounded tab must not eat the chrono. */
const MAX_DELTA = 0.1;

export interface PortraitRobotOptions {
  /** Frozen at phase entry by the shell (`?portraitSeed=` overrides it). */
  readonly seed: number;
  /** Chrono for this run's difficulty — the shell reads gate §3's table, never this hook. */
  readonly timerSeconds: number;
  /** `true` under `RotateOverlay`: the fold simply stops being called (ADR-0082 D5). */
  readonly paused: boolean;
  /**
   * `true` cuts the reveal's band-by-band walk to a single frame
   * (`prefers-reduced-motion`). The CONTENT is never removed — the corrections are
   * all shown, at once instead of in sequence — because they are the scene's only
   * teaching moment, not decoration (ADR-0054 §3).
   */
  readonly reducedMotion?: boolean;
}

export interface PortraitRobotState {
  readonly scene: PortraitScene;
  /** The four bands as the screen draws them — assets resolved through the puzzle's order. */
  readonly bands: readonly PortraitBandView[];
  /** The reference face: the same four bands on their truth slots. */
  readonly targetBands: readonly string[];
  /** Queue a player request. It is DRAINED by the frame fold, never applied here. */
  readonly pushIntent: (intent: PortraitIntent) => void;
  /**
   * `true` once the reveal has walked its last band AND the complete face has been
   * held for `resultHoldSeconds` — the phase's single hand-over signal, READ from
   * `portraitRevealProgress` rather than computed here. It is driven by the SAME
   * rAF loop as the chrono, so it stops behind `RotateOverlay` by construction
   * rather than by a guard (panel M7: a wall-clock `setTimeout` used to commit the
   * modifier behind the rotate overlay, and the player never saw the verdict).
   */
  readonly revealDone: boolean;
}

/** Resolve one band's currently-drawn asset, BASE_URL-prefixed. */
function assetAt(
  catalogue: FaceCatalogue,
  bandIndex: number,
  order: readonly number[],
  slot: number,
): string {
  const variantIndex = order[slot];
  if (variantIndex === undefined) return "";
  const asset = catalogue.bands[bandIndex]?.variants[variantIndex]?.asset;
  // Every asset path in `src/render` is BASE_URL-prefixed (panel M10): the catalogue
  // stores a BASE-relative path, and a sub-path deployment — which is exactly what a
  // branch preview is — serves nothing without the prefix.
  return asset === undefined ? "" : `${import.meta.env.BASE_URL}${asset}`;
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
 *
 * ## The reveal (story AC4)
 *
 * The reveal's clock is `scene.revealElapsed`, folded by the same
 * `stepPortraitScene` call as the chrono, and the ONLY reader of it is
 * `portraitRevealProgress`. This hook holds no accumulator and no threshold of its
 * own: it used to keep a rising `sinceResolved` and compare it to a `revealSeconds`
 * that the pure tick was DECREMENTING, so the two met halfway and every published
 * duration was played at half length (panel run-2 blocking). A comparison the hook
 * cannot express is a comparison it cannot get wrong.
 *
 * ## The catalogue
 *
 * There is one, `FACE_CATALOGUE`, and the shell validates it once at phase entry
 * (`portraitCatalogueIsPlayable`, ADR-0080 D3). The `catalogue` option this hook
 * used to take had no caller at all and bypassed that validation entirely — an
 * unvalidated plate re-opens `NO_TRUTH_SLOT`, which draws `src=""` (the browser
 * re-requests the document) and announces « variante 1 sur 0 ». The door is gone
 * rather than guarded: a second plate arrives with its own validated entry point
 * (panel run-2 minor 4).
 */
export function usePortraitRobot({
  seed,
  timerSeconds,
  paused,
  reducedMotion = false,
}: PortraitRobotOptions): PortraitRobotState {
  const catalogue = FACE_CATALOGUE;
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

  // How many bands the reveal has walked, top to bottom, and whether the phase may
  // hand over. Both are READ from the pure timeline — no step, no threshold and no
  // clock is derived on this side (ADR-0079 A5). `reducedMotion` travels in as an
  // argument because it is a render-layer signal, and it cuts the WALK only.
  const { revealedBands, handoverReady } = portraitRevealProgress(scene, reducedMotion);

  const bands = useMemo<readonly PortraitBandView[]>(
    () =>
      catalogue.bands.map((band, bandIndex) => {
        const order = scene.puzzle.order[bandIndex] ?? [];
        const slot = scene.selection[bandIndex] ?? 0;
        const truthSlot = scene.puzzle.truth[bandIndex] ?? -1;
        // Once the reveal has reached this band, it shows the TRUTH — that is the whole
        // point of the sequence: a player who failed must SEE the answer they missed,
        // band by band, instead of staring 4,8 s at a face they already know is wrong
        // (story AC4, panel M6).
        const corrected = bandIndex < revealedBands && truthSlot >= 0;
        return {
          id: band.id,
          label: band.label,
          src: assetAt(catalogue, bandIndex, order, corrected ? truthSlot : slot),
          corrected,
          ordinal: slot + 1,
          total: order.length,
        };
      }),
    [catalogue, scene.puzzle.order, scene.puzzle.truth, scene.selection, revealedBands],
  );

  const targetBands = useMemo<readonly string[]>(
    () =>
      catalogue.bands.map((band, bandIndex) =>
        assetAt(
          catalogue,
          bandIndex,
          scene.puzzle.order[bandIndex] ?? [],
          scene.puzzle.truth[bandIndex] ?? 0,
        ),
      ),
    [catalogue, scene.puzzle.order, scene.puzzle.truth],
  );

  return {
    scene,
    bands,
    targetBands,
    pushIntent,
    revealDone: handoverReady,
  };
}

/**
 * Is this catalogue fit to open a scene on? (ADR-0080 D3, panel B4a.)
 *
 * `validatePortrait` had no production caller at all, so the "skip the phase on an
 * invalid catalogue" decision existed only on paper — and the degradations it was
 * supposed to catch were reaching the player instead. The shell asks this ONCE, at
 * phase entry.
 */
export function portraitCatalogueIsPlayable(catalogue: FaceCatalogue = FACE_CATALOGUE): boolean {
  return !validatePortrait(catalogue).some((i) => i.severity === "error");
}
