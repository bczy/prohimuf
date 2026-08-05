import type { PortraitOutcome } from "@game/types/portraitRobot";

/**
 * `LevelModifier` — the inter-level currency (ADR-0079 D4).
 *
 * An interstitial scene (today: the portrait-robot) resolves into an opaque,
 * closed value that the shell CARRIES but never interprets: `App.tsx` holds it
 * as `pendingModifier`, and it is spent exactly once, at the NEXT
 * `createInitialState`, through the optional `LevelParams.modifier`. Absent or
 * `null` ⇒ the build is byte-identical to a run without any interstitial scene
 * (ADR-0051 D4 identity property).
 *
 * The rule that produces one lives in `portraitRobotSystem.ts`
 * (`levelModifierFromPortrait`) — the single place the gate §3 payoff table is
 * written down. `src/render` never maps an outcome to a number (ADR-0079 A5).
 * Types only: zero React/Three, zero functions, zero tuning value.
 *
 * ---
 *
 * ## THIS TYPE CANNOT EXPRESS A LIFE LOSS — AND THAT IS THE POINT
 *
 * Design gate A1 / story AC5: **an interstitial scene never costs a life.** The
 * sanction is energy on the next level, nothing else. That prohibition is
 * enforced HERE, structurally, by the absence of a field — not by a review
 * promise that someone remembers to keep (ADR-0079 D10).
 *
 * So: **do not add `livesDelta`, `lifeLost`, `healthDelta` or any sibling
 * "for symmetry" with `energyDelta`.** There is no symmetry to restore; the
 * asymmetry IS the decision. A diff that adds such a field is a gate failure,
 * not a tuning call — and it would silently re-open a mechanic three design
 * rounds closed.
 *
 * Same posture on the other side (A1c): there is no reward field either. A
 * bonus would be clamped away by `applyEnergy` anyway, which is precisely why
 * the reward was deleted rather than made ineffective.
 */
export interface LevelModifier {
  /**
   * Points the finished scene owes the run — the `PORTRAIT_SCORE` barème
   * (1500 / 400 / 0), applied ONCE at the exit of the interstitial phase.
   *
   * ## THIS FIELD IS THE ONE THAT SETTLES THE PAST
   *
   * `LevelModifier` carries TWO temporalities and this is the asymmetry
   * (architect's arbitration, hand-off §6.2): `scoreDelta` **règle la scène qui
   * vient de se jouer**, while `energyDelta` and `firstWaveDelaySeconds` **arm
   * the level that follows**. It travels in this type because the scene has ONE
   * output channel and a second return channel was refused — not because it has
   * the same schedule as its neighbours.
   *
   * So: `createInitialState` deliberately IGNORES it (a test pins that). Do not
   * move it into the next level's build "par symétrie" — deferring it would drop
   * the points of the last scene of a run from the final score, which is a
   * high-score bug, the most expensive kind in player trust.
   */
  readonly scoreDelta: number;
  /**
   * Signed delta applied to the NEXT level's initial energy capital, via the
   * existing `applyEnergy(ENERGY_INITIAL, delta)` clamp — so a malus can never
   * produce a negative or out-of-range capital.
   *
   * Never applied to the energy of the level just finished: a scene modifies
   * the capital of the level that FOLLOWS it (project rule A1c,
   * PROJECT_GUIDELINES). The value itself is gate §3's, and lives in the system.
   */
  readonly energyDelta: number;
  /**
   * Seconds the next level holds its first wave for — the payoff, made
   * mechanical and mandatory (gate A6/A11). Read once into
   * `GameState.waveHoldRemaining`, which gates the single wave-spawn branch of
   * `tickGameState`; `0` means "no hold", i.e. today's behaviour.
   */
  readonly firstWaveDelaySeconds: number;
  /**
   * Which obligatory pre-level narrative beat the next level must play
   * (ADR-0079 D5, gate A1b/A10). The render lane picks *a scene by key* from
   * `narrativeSystem`; it never branches on what the verdict means. `null` ⇒
   * no beat is owed (no scene was played).
   */
  readonly narrativeBeat: PortraitOutcome | null;
}
