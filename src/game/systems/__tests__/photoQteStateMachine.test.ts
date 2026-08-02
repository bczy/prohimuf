import { describe, expect, it } from "vitest";
import {
  DEFAULT_LEVEL_PARAMS,
  NEUTRAL_PHOTO_INPUT,
  createInitialState,
  tickGameState,
} from "@game/systems/stateMachine";
import { PHOTO_MAX_ATTEMPTS, PHOTO_ESTABLISH_SECONDS } from "@game/systems/photoQteSystem";
import { BELLIARD_PHOTO_QTE } from "@game/levels/photoQteBelliard";
import { LEVELS } from "@game/levels/levels";
import { photoSetpieceOrderingIssue, hostageBossMarginIssue } from "@game/levels/validateLevel";
import { FACADE_01 } from "@game/maps/facade01";
import type { GameState } from "@game/types/gameState";
import type { LevelParams } from "@game/systems/stateMachine";
import type { PhotoInput } from "@game/types/photoQte";

const FACADE = FACADE_01;
const BELLIARD = LEVELS.find((l) => l.id === "belliard");

function paramsOf(patch: Partial<LevelParams> = {}): LevelParams {
  return {
    ...DEFAULT_LEVEL_PARAMS,
    timeSeconds: BELLIARD?.timeSeconds ?? 90,
    enemiesToWin: BELLIARD?.enemiesToWin ?? 10,
    ...(BELLIARD?.hostageQte ? { hostageQte: BELLIARD.hostageQte } : {}),
    ...(BELLIARD?.deliveries[0] ? { delivery: BELLIARD.deliveries[0] } : {}),
    ...patch,
  };
}

const input = (patch: Partial<PhotoInput> = {}): PhotoInput => ({
  ...NEUTRAL_PHOTO_INPUT,
  ...patch,
});

/** Advance the level `n` ticks with a neutral mouse and no fire. */
function tick(state: GameState, n: number, photo: PhotoInput = NEUTRAL_PHOTO_INPUT): GameState {
  let cur = state;
  for (let i = 0; i < n; i++) {
    cur = tickGameState(
      cur,
      false,
      0.5,
      0.5,
      1 / 60,
      FACADE,
      0,
      0,
      18,
      12,
      cur.qteSpec ? 10 : 10,
      undefined,
      undefined,
      photo,
    );
  }
  return cur;
}

/** Every field of `GameState` the set-piece must not move (F8 / A-T7). */
const ZERO_DELTA_FIELDS = [
  "score",
  "lives",
  "kills",
  "energy",
  "wave",
  "timeRemaining",
  "elapsedSeconds",
  "couriersSpawned",
  "playerInvulnRemaining",
] as const;

describe("A-T7 / E-4(c) — the spec is the ONLY thing Belliard gains", () => {
  it("part 1: a level authoring NO photoQte never enters the block", () => {
    const withFeature = tick(createInitialState(FACADE, paramsOf()), 600);
    expect(withFeature.photoQteSpec).toBeNull();
    expect(withFeature.photoQte).toBeNull();
    expect(withFeature.photoQteAttempts).toBe(0);
  });

  it("part 2: Belliard MINUS its photoQte field is tick-identical to Belliard-with-it-disabled", () => {
    // `photoQteEnabled: false` (ruling R3-5, a first run) must collapse EXACTLY onto the
    // already-tested null-spec path — one code path, not a second branch.
    const stripped = tick(createInitialState(FACADE, paramsOf()), 900);
    const disabled = tick(
      createInitialState(
        FACADE,
        paramsOf({ photoQte: BELLIARD_PHOTO_QTE, photoQteEnabled: false }),
      ),
      900,
    );
    expect(JSON.stringify(disabled)).toBe(JSON.stringify(stripped));
  });

  it("part 3: across the whole set-piece, every other field matches at equal level clock", () => {
    const params = paramsOf({ photoQte: BELLIARD_PHOTO_QTE });
    let withPhoto = createInitialState(FACADE, params);
    let without = createInitialState(FACADE, paramsOf());

    // Run both to 5 s of PLAYED time. The photo run freezes for the whole set-piece, so it
    // needs however many extra frames the frozen block eats — that is the point.
    const untilPlayed = (s: GameState, seconds: number, photo: PhotoInput): GameState => {
      let cur = s;
      let guard = 0;
      while (cur.elapsedSeconds < seconds && guard < 200000) {
        cur = tick(cur, 1, photo);
        guard++;
      }
      return cur;
    };
    // Leave the set-piece as soon as the sheet is up: `decline` is one press.
    withPhoto = untilPlayed(withPhoto, 3.0, NEUTRAL_PHOTO_INPUT);
    expect(withPhoto.photoQte).not.toBeNull();
    withPhoto = tick(withPhoto, 1, input({ skipBriefing: true }));
    let guard = 0;
    while (withPhoto.photoQte !== null && guard < 200000) {
      withPhoto = tick(withPhoto, 1, input({ cta: "decline" }));
      guard++;
    }
    expect(withPhoto.photoQte).toBeNull();
    withPhoto = untilPlayed(withPhoto, 5.0, NEUTRAL_PHOTO_INPUT);
    without = untilPlayed(without, 5.0, NEUTRAL_PHOTO_INPUT);

    for (const field of ZERO_DELTA_FIELDS) {
      expect(`${field}=${String(withPhoto[field])}`).toBe(`${field}=${String(without[field])}`);
    }
    expect(withPhoto.phase).toBe(without.phase);
  });

  it("F8: the frozen block moves no energy, no score, no lives, no kills, no quota", () => {
    const params = paramsOf({ photoQte: BELLIARD_PHOTO_QTE });
    let state = tick(createInitialState(FACADE, params), Math.round(2.5 * 60) + 2);
    expect(state.photoQte).not.toBeNull();
    const before = ZERO_DELTA_FIELDS.map((f) => String(state[f]));
    // 20 s of frozen ticks, firing every frame — nothing may move.
    for (let i = 0; i < 20 * 60; i++) {
      state = tickGameState(
        state,
        true,
        0.5,
        0.5,
        1 / 60,
        FACADE,
        0,
        0,
        18,
        12,
        10,
        undefined,
        undefined,
        input({ raiseIntent: true, shutter: true }),
      );
    }
    expect(state.photoQte).not.toBeNull();
    expect(ZERO_DELTA_FIELDS.map((f) => String(state[f]))).toEqual(before);
  });
});

describe("A-T12 (D-K) — the Belliard coexistence suite", () => {
  it("(a) the photo QTE never triggers while the hostage duel holds the scene", () => {
    // Adversarial, and it has to be: with the shipped 2.5 s trigger the guard is never even
    // reached. So run to the duel, then INJECT a spec whose threshold is already exceeded —
    // exactly the row a future author could write — and check the guard, not the arithmetic.
    let state = createInitialState(FACADE, paramsOf());
    let guard = 0;
    while (state.qte === null && guard < 100000) {
      state = tick(state, 1);
      guard++;
    }
    expect(state.qte).not.toBeNull();
    state = {
      ...state,
      photoQteSpec: { ...BELLIARD_PHOTO_QTE, triggerAtElapsedSeconds: 1.0 },
    };
    // While the duel holds the scene, the photo block must stay shut, whatever the threshold.
    for (let i = 0; i < 600 && state.qte !== null && state.qte.phase !== "DONE"; i++) {
      state = tick(state, 1);
      expect(state.photoQte).toBeNull();
    }
  });

  it("(b) after the set-piece exits, the hostage still triggers at 12 s of PLAYED time", () => {
    const params = paramsOf({ photoQte: BELLIARD_PHOTO_QTE });
    let state = createInitialState(FACADE, params);
    // Open the set-piece, skip the briefing, and leave it on the first available CTA.
    let guard = 0;
    while (state.photoQte === null && guard < 100000) {
      state = tick(state, 1);
      guard++;
    }
    state = tick(state, 1, input({ skipBriefing: true }));
    guard = 0;
    while (state.photoQte !== null && guard < 400000) {
      state = tick(state, 1, input({ cta: "decline" }));
      guard++;
    }
    expect(state.photoQte).toBeNull();
    // The level clock never moved during the block.
    expect(state.elapsedSeconds).toBeLessThan(3.0);
    // …so the duel still lands at 12 s of played time.
    guard = 0;
    while (state.qte === null && guard < 200000) {
      state = tick(state, 1);
      guard++;
    }
    // The reference is the SAME level without the set-piece: the duel must land at the same
    // played time, tick for tick. (The duel block itself freezes `elapsedSeconds` on its
    // trigger tick, which is why the absolute value sits one frame under 12 s — the claim is
    // the EQUALITY, not the constant.)
    let reference = createInitialState(FACADE, paramsOf());
    guard = 0;
    while (reference.qte === null && guard < 200000) {
      reference = tick(reference, 1);
      guard++;
    }
    expect(state.elapsedSeconds).toBe(reference.elapsedSeconds);
    expect(state.elapsedSeconds).toBeGreaterThan(11.9);
  });

  it("(c) hostageBossMarginIssue returns the SAME verdict with and without the photo field", () => {
    const row = BELLIARD;
    expect(row).toBeDefined();
    if (!row) return;
    const { photoQte: _photo, ...withoutPhoto } = row;
    expect(hostageBossMarginIssue(row)).toEqual(hostageBossMarginIssue(withoutPhoto));
  });

  it("(d) validateLevel rejects a photo trigger authored after the hostage's, or past the clock", () => {
    const base = { timeSeconds: 90, hostageQte: BELLIARD?.hostageQte };
    expect(photoSetpieceOrderingIssue({ ...base, photoQte: BELLIARD_PHOTO_QTE })).toBeNull();
    expect(
      photoSetpieceOrderingIssue({
        ...base,
        photoQte: { ...BELLIARD_PHOTO_QTE, triggerAtElapsedSeconds: 12 },
      })?.code,
    ).toBe("photo-setpiece-ordering");
    expect(
      photoSetpieceOrderingIssue({
        timeSeconds: 90,
        photoQte: { ...BELLIARD_PHOTO_QTE, triggerAtElapsedSeconds: 95 },
      })?.code,
    ).toBe("photo-setpiece-ordering");
    // A level that authors no set-piece is never an issue.
    expect(photoSetpieceOrderingIssue({ timeSeconds: 90 })).toBeNull();
  });

  it("F15: the shipped trigger leaves 9.5 s of played separation before the duel", () => {
    const trigger = BELLIARD_PHOTO_QTE.triggerAtElapsedSeconds;
    const hostage = BELLIARD?.hostageQte?.triggerAtElapsedSeconds ?? 12;
    expect(hostage - trigger).toBeGreaterThanOrEqual(8.0);
  });
});

describe("the retry loop is bounded by the LEVEL state, not by the record (T-2, D-1)", () => {
  it("a retry re-enters at attemptIndex + 1 and the budget is spent after two", () => {
    const params = paramsOf({ photoQte: BELLIARD_PHOTO_QTE });
    let state = createInitialState(FACADE, params);
    let guard = 0;
    while (state.photoQte === null && guard < 100000) {
      state = tick(state, 1);
      guard++;
    }
    expect(state.photoQte?.attemptIndex).toBe(0);
    expect(state.photoQteAttempts).toBe(1);

    // Skip to the sheet and press RECOMMENCER.
    state = tick(state, 1, input({ skipBriefing: true }));
    guard = 0;
    while (state.photoQte?.phase !== "CONTACT_SHEET" && guard < 400000) {
      state = tick(state, 1);
      guard++;
    }
    state = tick(state, 1, input({ cta: "retry" }));
    expect(state.photoQte?.attemptIndex).toBe(1);
    expect(state.photoQteAttempts).toBe(PHOTO_MAX_ATTEMPTS);
    // A retry re-enters at ESTABLISHING — the briefing is played once per ENTRY, not per
    // attempt (spec §1.1): replaying a climb Muf has not undone is the fattest frozen block.
    expect(state.photoQte?.phase).toBe("ESTABLISHING");
    expect(state.photoQte?.phaseRemaining).toBeCloseTo(PHOTO_ESTABLISH_SECONDS, 1);
  });
});

describe("ADR-0080 — the carry is banked on the EXIT, monotonically, in the pure state", () => {
  it("declining banks `none` and never downgrades a carry loaded from a previous run", () => {
    const params = paramsOf({ photoQte: BELLIARD_PHOTO_QTE, photoLeverage: "master-bonus" });
    let state = createInitialState(FACADE, params);
    expect(state.photoLeverage).toBe("master-bonus");
    let guard = 0;
    while (state.photoQte === null && guard < 100000) {
      state = tick(state, 1);
      guard++;
    }
    state = tick(state, 1, input({ skipBriefing: true }));
    guard = 0;
    while (state.photoQte !== null && guard < 400000) {
      state = tick(state, 1, input({ cta: "decline" }));
      guard++;
    }
    // A blank roll on a replay is the NORMAL case on level 1 — it must cost nothing.
    expect(state.photoLeverage).toBe("master-bonus");
  });

  it("a level with no set-piece carries the loaded value untouched", () => {
    const state = tick(createInitialState(FACADE, paramsOf({ photoLeverage: "master" })), 600);
    expect(state.photoLeverage).toBe("master");
  });
});
