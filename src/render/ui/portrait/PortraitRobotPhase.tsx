import { useEffect, useRef } from "react";
import type { JSX } from "react";
import { levelModifierFromPortrait } from "@game/systems/portraitRobotSystem";
import type { LevelModifier } from "@game/types/levelModifier";
import { usePortraitGestures } from "@hooks/usePortraitGestures";
import { usePortraitRobot } from "@hooks/usePortraitRobot";
import { PortraitRobotScreen } from "./PortraitRobotScreen";

/** How long the verdict stamp is held after the reveal (UX §6, `resultHoldSeconds`). */
const RESULT_HOLD_SECONDS = 2.2;

export interface PortraitRobotPhaseProps {
  /** Frozen by the shell at phase entry; `?portraitSeed=` makes a board replayable. */
  readonly seed: number;
  /** Gate §3's chrono for the run's difficulty — chosen by the shell, not by this screen. */
  readonly timerSeconds: number;
  readonly isMobile: boolean;
  /** `true` behind `RotateOverlay`: the fold stops being called, the chrono stops (gate A7). */
  readonly paused: boolean;
  /** Handed the scene's only residue — an opaque `LevelModifier` the shell carries. */
  readonly onDone: (modifier: LevelModifier) => void;
}

/**
 * The `PORTRAIT_ROBOT` phase, assembled (ADR-0079 D1).
 *
 * It wires the scene bridge to the screen and owns exactly one thing of its own:
 * WHEN the phase hands over. Both durations come from the scene
 * (`scene.revealSeconds`, asymmetric by outcome per gate A15) plus the hold — a
 * `switch` on the outcome here would put two gate numbers in the render layer.
 *
 * It maps the result to a `LevelModifier` through `levelModifierFromPortrait` and
 * hands the value up. It never computes −20 energy or +20 s itself: that table is
 * written once, in `src/game` (ADR-0079 A5, the story's most-likely breach).
 */
export function PortraitRobotPhase({
  seed,
  timerSeconds,
  isMobile,
  paused,
  onDone,
}: PortraitRobotPhaseProps): JSX.Element {
  const stackRef = useRef<HTMLDivElement>(null);
  const { scene, bands, targetBands, pushIntent, indexOf } = usePortraitRobot({
    seed,
    timerSeconds,
    paused,
  });

  usePortraitGestures({
    stackRef,
    enabled: scene.phase === "ACTIVE" && !paused,
    focusedBand: scene.focusedBand,
    indexOf,
    onIntent: pushIntent,
  });

  const result = scene.result;
  const onDoneRef = useRef(onDone);
  onDoneRef.current = onDone;
  useEffect(() => {
    if (result === null) return;
    const timer = window.setTimeout(
      () => {
        onDoneRef.current(levelModifierFromPortrait(result));
      },
      (scene.revealSeconds + RESULT_HOLD_SECONDS) * 1000,
    );
    return () => {
      clearTimeout(timer);
    };
  }, [result, scene.revealSeconds]);

  return (
    <PortraitRobotScreen
      scene={scene}
      bands={bands}
      targetBands={targetBands}
      isMobile={isMobile}
      onIntent={pushIntent}
      bandStackRef={stackRef}
    />
  );
}
