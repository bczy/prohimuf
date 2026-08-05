import { useEffect, useRef } from "react";
import type { JSX } from "react";
import { levelModifierFromPortrait } from "@game/systems/portraitRobotSystem";
import type { LevelModifier } from "@game/types/levelModifier";
import { usePortraitGestures } from "@hooks/usePortraitGestures";
import { usePortraitRobot } from "@hooks/usePortraitRobot";
import { PortraitRobotScreen } from "./PortraitRobotScreen";

export interface PortraitRobotPhaseProps {
  /** Frozen by the shell at phase entry; `?portraitSeed=` makes a board replayable. */
  readonly seed: number;
  /** Gate §3's chrono for the run's difficulty — chosen by the shell, not by this screen. */
  readonly timerSeconds: number;
  readonly isMobile: boolean;
  /** `true` behind `RotateOverlay`: the fold stops being called, the chrono stops (gate A7). */
  readonly paused: boolean;
  /** Cuts the reveal's sequence to a single frame, never its content (ADR-0054 §3). */
  readonly reducedMotion: boolean;
  /** Handed the scene's only residue — an opaque `LevelModifier` the shell carries. */
  readonly onDone: (modifier: LevelModifier) => void;
}

/**
 * The `PORTRAIT_ROBOT` phase, assembled (ADR-0079 D1).
 *
 * It wires the scene bridge to the screen and owns exactly one thing of its own:
 * WHEN the phase hands over — and even that is now a value it READS
 * (`revealDone`), not a duration it counts.
 *
 * It used to hold a wall-clock `window.setTimeout(revealSeconds + 2.2)`, which was
 * two defects in one line (panel M7/M8): a second clock that kept running behind
 * `RotateOverlay`, so a rotation during the verdict committed the modifier and the
 * player never saw the result; and `RESULT_HOLD_SECONDS = 2.2`, a gate number
 * re-declared in `src/render` (ADR-0079 A5). Both are gone by construction: the
 * reveal is accumulated by the SAME rAF loop as the chrono, and the timeline it
 * follows is `revealSeconds` — a scene field, written in `src/game`.
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
  reducedMotion,
  onDone,
}: PortraitRobotPhaseProps): JSX.Element {
  const stackRef = useRef<HTMLDivElement>(null);
  const { scene, bands, targetBands, pushIntent, revealDone } = usePortraitRobot({
    seed,
    timerSeconds,
    paused,
    reducedMotion,
  });

  usePortraitGestures({
    stackRef,
    enabled: scene.phase === "ACTIVE" && !paused,
    focusedBand: scene.focusedBand,
    onIntent: pushIntent,
  });

  const result = scene.result;
  const onDoneRef = useRef(onDone);
  onDoneRef.current = onDone;
  const handedOverRef = useRef(false);
  useEffect(() => {
    if (result === null || !revealDone || handedOverRef.current) return;
    handedOverRef.current = true;
    onDoneRef.current(levelModifierFromPortrait(result));
  }, [result, revealDone]);

  return (
    <PortraitRobotScreen
      scene={scene}
      bands={bands}
      targetBands={targetBands}
      isMobile={isMobile}
      paused={paused}
      onIntent={pushIntent}
      bandStackRef={stackRef}
    />
  );
}
