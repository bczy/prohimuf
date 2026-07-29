import type { GameState } from "@game/types/gameState";
import type { CourierField } from "@game/systems/courierSystem";
import { tickGameState } from "@game/systems/stateMachine";
import type { FacadeMap } from "@game/types/map";
import { LEVELS } from "@game/levels/levels";
import type { LevelConfig, LevelRoster } from "@game/levels/levels";

/**
 * Delivery-assault capture seam (harness-only, NON-shipped) — mirrors `bossHarness.ts`
 * for the scripted vehicle delivery (`docs/game-design/spec-delivery-van-assault.md`,
 * `deliveryAssault.ts`).
 *
 * Unlike the boss QTE, the delivery has no isolated pure sub-tick: it is woven directly
 * into `tickGameState`'s own 7c step, gated on `courierField !== undefined` (see
 * `stateMachine.ts` — omitting it silently no-ops the whole delivery, it never leaves
 * IDLE). So this harness cannot precompute a state the way `fastForwardBossQte` does;
 * it drives the SAME `tickGameState` the render loop calls every frame, with the SAME
 * `facade`/`courierField`/`roster` context `useGameLoop` already has in scope — the
 * house-proven pattern already used by `deliveryAssaultTick.test.ts`'s `driveIgnoreCase`
 * (seed `elapsedSeconds` just before the scripted trigger, tick forward for real,
 * `lives` raised out of the way so ambient wave fire can't GAME_OVER the fast-forward
 * before the target state is reached).
 *
 * Reachability: exactly like `?preview=boss`, only installed under `?preview=delivery`,
 * so no shipped player (no `?preview=delivery`) can ever reach it. Persistence stays
 * inert via `App.tsx`'s generic `PREVIEW_SCREEN !== null` guard — no extra guard
 * needed here (unlike the boss seam, EVERY delivery-bearing level is already SHIPPED;
 * there is no non-shipped delivery-only harness level to distinguish).
 */

/** `incoming` = roll-in just seated the two assailants (test the telegraph / arrow
 *  indicator, before the gauge starts draining). `delivering` = the damage window is
 *  open (test the HUD integrity banner + the assault itself). */
export type DeliveryHarnessTarget = "incoming" | "delivering";

interface DeliveryHarnessWindow extends Window {
  /** Render-installed target, read once by `useGameLoop` at boot. */
  __MUF_DELIVERY_TARGET__?: DeliveryHarnessTarget;
}

const FF_DT = 1 / 60;
// Generous but bounded: the roll-in + window-open transition lands within a handful of
// simulated seconds of the scripted trigger, never near this ceiling in practice.
const FF_MAX_TICKS = 1800;

/** Parse the `at=` capture param to a target, or `null` for any other/absent value. */
export function parseDeliveryHarnessTarget(raw: string | null): DeliveryHarnessTarget | null {
  return raw === "incoming" || raw === "delivering" ? raw : null;
}

/**
 * Which level `?preview=delivery` boots. `&level=<id>` names a LEVELS entry that
 * authors a delivery (belliard, stalingrad today); default = belliard, the level this
 * harness has been exercised against. Falls back to belliard for an unknown/undated id
 * too, rather than silently booting a level with nothing to capture.
 */
export function resolveDeliveryPreviewLevel(search: string): LevelConfig {
  const params = new URLSearchParams(search);
  const id = params.get("level");
  const named = id !== null ? LEVELS.find((l) => l.id === id) : undefined;
  const level =
    named?.deliveries[0] !== undefined ? named : LEVELS.find((l) => l.id === "belliard");
  if (level === undefined) throw new Error("delivery harness: no level authors a delivery");
  return level;
}

/** True once the fast-forward has driven the delivery to its target phase. */
function targetReached(state: GameState, target: DeliveryHarnessTarget): boolean {
  const phase = state.deliveryVehicle?.phase;
  return target === "incoming" ? phase === "INCOMING" : phase === "DELIVERING";
}

/**
 * Drive `initial` forward with the REAL `tickGameState`, no player input, until the
 * delivery reaches `target` or the tick budget runs out (returned as-is either way —
 * a target that can never be reached, e.g. a level authoring no delivery, is a config
 * error the caller's own no-op guard on `deliverySpec !== null` already prevents).
 *
 * `elapsedSeconds` is seeded to just before the scripted trigger (the
 * `deliveryAssaultTick.test.ts` idiom) rather than ticked up from zero — reaching the
 * target this way costs a handful of ticks instead of ~1500, and skips the minutes of
 * simulated ambient wave fire a from-zero fast-forward would otherwise expose the
 * player-less loop to. `lives` is raised out of the way for the SAME reason the test
 * does it (D2.7 — the assailants shoot back for real): a GAME_OVER mid-fast-forward
 * would strand the loop before the target state is ever reached. Both are harness-only
 * mutations of the state handed to `tickGameState`, never of shipped gameplay rules.
 */
export function fastForwardDeliveryState(
  initial: GameState,
  facade: FacadeMap,
  courierField: CourierField,
  enemiesToWin: number | undefined,
  roster: LevelRoster | undefined,
  target: DeliveryHarnessTarget,
): GameState {
  const spec = initial.deliverySpec;
  if (spec === null) return initial;
  let state: GameState = {
    ...initial,
    elapsedSeconds: Math.max(0, spec.triggerAtElapsedSeconds - FF_DT),
    lives: 99,
  };
  for (let i = 0; i < FF_MAX_TICKS && !targetReached(state, target); i++) {
    state = tickGameState(
      state,
      false,
      0.5,
      0.5,
      FF_DT,
      facade,
      0,
      0,
      18,
      12,
      enemiesToWin,
      courierField,
      roster,
    );
    // Ambient wave fire can still chip a fresh state before `lives: 99` above ever
    // ticks through once; re-rescue rather than let the loop strand on GAME_OVER.
    if (state.phase === "GAME_OVER") state = { ...state, phase: "PLAYING", lives: 99 };
  }
  return state;
}

/**
 * Install the capture seam from the URL query, gated on `?preview=delivery` AND a
 * valid `at=` target — same reachability discipline as `installBossCaptureSeam`.
 * Called once at `App` module load; never runs on a shipped path.
 */
export function installDeliveryCaptureSeam(): void {
  if (typeof window === "undefined") return;
  const params = new URLSearchParams(window.location.search);
  if (params.get("preview") !== "delivery") return;
  const target = parseDeliveryHarnessTarget(params.get("at"));
  if (target === null) return;
  (window as DeliveryHarnessWindow).__MUF_DELIVERY_TARGET__ = target;
}
