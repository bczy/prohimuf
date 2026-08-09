import { describe, it, expect } from "vitest";
import type { PortraitIntent } from "@game/types/portraitRobot";
import {
  applyPortraitIntent,
  correctCount,
  createPortraitScene,
  distanceKey,
  drawPortraitPuzzle,
  isEligibleTruth,
  levelModifierFromPortrait,
  midPalierThreshold,
  palierFor,
  portraitHash,
  resolvePortraitScene,
  stepPortraitScene,
  tickPortraitScene,
  PALIER_DERNIER_SECONDS,
  PALIER_URGENCE_SECONDS,
  PORTRAIT_BAND_ORDER,
  PORTRAIT_TIMER_SECONDS,
  REVEAL_SECONDS_IDENTIFIED,
  REVEAL_SECONDS_UNRESOLVED,
  VARIANTS_PER_BAND,
} from "@game/systems/portraitRobotSystem";
import { TEST_CATALOGUE, at, cyclicDistances, testBand, testCatalogue } from "./portraitFixtures";

const TIMER = PORTRAIT_TIMER_SECONDS.normal;

function fresh(seed = 42, timer = TIMER) {
  return createPortraitScene(TEST_CATALOGUE, seed, timer);
}

describe("gate §3 — the tuning table is written here and nowhere else", () => {
  it("timerSeconds per difficulty", () => {
    expect(PORTRAIT_TIMER_SECONDS).toEqual({ easy: 56, normal: 35, hard: 30 });
  });

  it("the mid palier is the A18 formula, and its three canonical values", () => {
    expect(midPalierThreshold(56)).toBe(28);
    expect(midPalierThreshold(35)).toBe(17.5);
    expect(midPalierThreshold(30)).toBe(17);
  });

  it("the payoff table: score, energy and wave hold per issue", () => {
    expect(
      levelModifierFromPortrait({ outcome: "IDENTIFIED", correctCount: 4, scoreDelta: 1500 }),
    ).toEqual({
      scoreDelta: 1500,
      energyDelta: 0,
      firstWaveDelaySeconds: 20,
      narrativeBeat: "IDENTIFIED",
    });
    expect(
      levelModifierFromPortrait({ outcome: "PARTIAL", correctCount: 3, scoreDelta: 400 }),
    ).toEqual({
      scoreDelta: 400,
      energyDelta: 0,
      firstWaveDelaySeconds: 10,
      narrativeBeat: "PARTIAL",
    });
    expect(
      levelModifierFromPortrait({ outcome: "FAILED", correctCount: 1, scoreDelta: 0 }),
    ).toEqual({
      scoreDelta: 0,
      energyDelta: -20,
      firstWaveDelaySeconds: 0,
      narrativeBeat: "FAILED",
    });
  });

  it("no LevelModifier can express a life loss (gate A1, story AC5)", () => {
    const modifier = levelModifierFromPortrait({
      outcome: "FAILED",
      correctCount: 0,
      scoreDelta: 0,
    });
    expect(Object.keys(modifier).sort()).toEqual([
      "energyDelta",
      "firstWaveDelaySeconds",
      "narrativeBeat",
      "scoreDelta",
    ]);
  });
});

describe("the paliers are scene state, not a predicate (ADR-0079 D9)", () => {
  it("crosses NONE → MID → URGENT → LAST, each exactly once", () => {
    let scene = fresh();
    const seen: string[] = [scene.palier];
    for (let i = 0; i < 3000; i += 1) {
      scene = tickPortraitScene(scene, 1 / 60);
      if (scene.palier !== seen[seen.length - 1]) seen.push(scene.palier);
      if (scene.phase === "RESOLVED") break;
    }
    expect(seen).toEqual(["NONE", "MID", "URGENT", "LAST"]);
  });

  it("fires on the crossing, not every frame — a palier is never re-entered", () => {
    let scene = fresh();
    const changes: number[] = [];
    let previous = scene.palier;
    for (let i = 0; i < 3000 && scene.phase === "ACTIVE"; i += 1) {
      scene = tickPortraitScene(scene, 1 / 60);
      if (scene.palier !== previous) changes.push(i);
      previous = scene.palier;
    }
    expect(changes).toHaveLength(3);
  });

  it("the absolute thresholds are identical in all three difficulties", () => {
    for (const timer of Object.values(PORTRAIT_TIMER_SECONDS)) {
      expect(palierFor(PALIER_URGENCE_SECONDS, timer)).toBe("URGENT");
      expect(palierFor(PALIER_URGENCE_SECONDS + 0.001, timer)).not.toBe("URGENT");
      expect(palierFor(PALIER_DERNIER_SECONDS, timer)).toBe("LAST");
      expect(palierFor(PALIER_DERNIER_SECONDS + 0.001, timer)).toBe("URGENT");
    }
  });

  it("A18 closed edge — a mid palier computed >= timerSeconds is not played at all", () => {
    // A 20 s chrono: max(10 ; 17) = 17 < 20, still played. A 17 s one: max(8,5 ; 17) = 17
    // ⇒ it would fire at t=0, so it is not played.
    expect(palierFor(20, 20)).toBe("NONE");
    expect(palierFor(16.9, 20)).toBe("MID");
    expect(palierFor(17, 17)).toBe("NONE");
    expect(palierFor(16.9, 17)).toBe("NONE");
    expect(palierFor(10, 17)).toBe("URGENT");
  });

  it("no palier is announced at scene entry", () => {
    for (const timer of [...Object.values(PORTRAIT_TIMER_SECONDS), 17, 12]) {
      expect(fresh(1, timer).palier).toBe("NONE");
    }
  });
});

describe("the chrono is a dt accumulator, never a clock (ADR-0079 D2)", () => {
  it("a non-positive or non-finite dt advances nothing", () => {
    const scene = fresh();
    for (const dt of [0, -0, -1, -1e9, NaN, Infinity, -Infinity]) {
      const after = tickPortraitScene(scene, dt);
      expect(after.remainingSeconds).toBe(TIMER);
      expect(after.phase).toBe("ACTIVE");
    }
  });

  it("expiry resolves at the current board — never a dry failure", () => {
    const scene = fresh();
    const after = tickPortraitScene(scene, TIMER);
    expect(after.phase).toBe("RESOLVED");
    expect(after.remainingSeconds).toBe(0);
    expect(after.result?.outcome).toBe("FAILED");
    expect(after.result?.correctCount).toBe(0);
  });

  it("10 small frames and 1 big frame land on the same remaining time", () => {
    let stepped = fresh();
    for (let i = 0; i < 10; i += 1) stepped = tickPortraitScene(stepped, 0.1);
    const once = tickPortraitScene(fresh(), 1);
    expect(stepped.remainingSeconds).toBeCloseTo(once.remainingSeconds, 10);
  });
});

describe("applyPortraitIntent is total (ADR-0083 D1)", () => {
  it("CYCLE wraps in both directions and carries its own band", () => {
    const scene = fresh();
    const start = at(scene.selection, 1);
    let s = scene;
    for (let i = 0; i < VARIANTS_PER_BAND; i += 1) {
      s = applyPortraitIntent(s, { kind: "CYCLE", band: "eyes", delta: 1 });
    }
    expect(s.selection[1]).toBe(start);
    expect(s.selection[0]).toBe(scene.selection[0]);

    let back = scene;
    for (let i = 0; i < VARIANTS_PER_BAND; i += 1) {
      back = applyPortraitIntent(back, { kind: "CYCLE", band: "eyes", delta: -1 });
    }
    expect(back.selection[1]).toBe(start);
  });

  it("CYCLE never implies a cursor — it does not move the focus", () => {
    const scene = fresh();
    const after = applyPortraitIntent(scene, { kind: "CYCLE", band: "mouth", delta: 1 });
    expect(after.focusedBand).toBe(scene.focusedBand);
  });

  it("FOCUS moves the cursor and nothing else", () => {
    const scene = fresh();
    const after = applyPortraitIntent(scene, { kind: "FOCUS", band: "nose" });
    expect(after.focusedBand).toBe("nose");
    expect(after.selection).toEqual(scene.selection);
  });

  it("an out-of-range or non-integer SET index is a no-op, never a throw", () => {
    const scene = fresh();
    // `VARIANTS_PER_BAND` and not a literal: `6` was out of range at six variants and
    // became a VALID index at ten, so the literal quietly stopped testing the guard.
    for (const index of [-1, VARIANTS_PER_BAND, 99, 1.5, NaN, Infinity]) {
      expect(applyPortraitIntent(scene, { kind: "SET", band: "hair", index })).toBe(scene);
    }
  });

  it("every intent kind is a no-op on a RESOLVED scene", () => {
    const resolved = tickPortraitScene(fresh(), 999);
    const intents: readonly PortraitIntent[] = [
      { kind: "CYCLE", band: "hair", delta: 1 },
      { kind: "SET", band: "eyes", index: 0 },
      { kind: "FOCUS", band: "nose" },
      { kind: "ABANDON" },
    ];
    for (const intent of intents) expect(applyPortraitIntent(resolved, intent)).toBe(resolved);
  });
});

describe("resolvePortraitScene is the single exit (ADR-0079 D6/D8.1)", () => {
  it("derives the outcome from correctCount alone", () => {
    const scene = fresh();
    const board = (n: number) => ({
      ...scene,
      selection: scene.puzzle.truth.map((slot, i) =>
        i < n ? slot : at(scene.puzzle.initialSelection, i),
      ),
    });
    expect(resolvePortraitScene(board(4)).result).toEqual({
      outcome: "IDENTIFIED",
      correctCount: 4,
      scoreDelta: 1500,
    });
    expect(resolvePortraitScene(board(3)).result?.outcome).toBe("PARTIAL");
    expect(resolvePortraitScene(board(2)).result?.outcome).toBe("FAILED");
    expect(resolvePortraitScene(board(0)).result?.outcome).toBe("FAILED");
  });

  it("revealSeconds is 1,4 s on IDENTIFIED and 2,6 s otherwise (gate A15)", () => {
    const scene = fresh();
    expect(scene.revealSeconds).toBe(0);
    const identified = resolvePortraitScene({ ...scene, selection: scene.puzzle.truth });
    expect(identified.revealSeconds).toBe(REVEAL_SECONDS_IDENTIFIED);
    expect(resolvePortraitScene(scene).revealSeconds).toBe(REVEAL_SECONDS_UNRESOLVED);
  });

  it("result is non-null exactly when the phase is RESOLVED", () => {
    const scene = fresh();
    expect(scene.result).toBeNull();
    expect(resolvePortraitScene(scene).result).not.toBeNull();
  });

  it("the scene grants no per-band correctness signal (gate A16)", () => {
    const scene = applyPortraitIntent(fresh(), { kind: "CYCLE", band: "hair", delta: 1 });
    expect(Object.keys(scene).sort()).toEqual([
      "focusedBand",
      "palier",
      "phase",
      "puzzle",
      "remainingSeconds",
      "result",
      "resultHoldSeconds",
      "revealElapsed",
      "revealSeconds",
      "selection",
      "timerSeconds",
    ]);
  });
});

describe("the early exit (gate A17)", () => {
  it("resolves at the current board, byte-identically to expiry", () => {
    const scene = fresh();
    const at3 = {
      ...scene,
      selection: scene.puzzle.truth.map((slot, i) =>
        i < 3 ? slot : at(scene.puzzle.initialSelection, i),
      ),
    };
    const abandoned = applyPortraitIntent(at3, { kind: "ABANDON" });
    const expired = tickPortraitScene(at3, 1e9);
    expect(abandoned.result).toEqual(expired.result);
    expect(abandoned.result?.outcome).toBe("PARTIAL");
  });

  it("can never produce IDENTIFIED — regression assertion, not a mechanism (A17a)", () => {
    // There is no instant at which the player is 4/4 and still ACTIVE: entry resolves at
    // 4/4 (D8.1) and the board starts at 0/4 (A14). Reaching a 4/4 ACTIVE scene requires
    // building one by hand, which is what this asserts is unreachable in play.
    let scene = fresh();
    for (const [i, band] of PORTRAIT_BAND_ORDER.entries()) {
      expect(scene.phase).toBe("ACTIVE");
      scene = applyPortraitIntent(scene, {
        kind: "SET",
        band: band,
        index: at(scene.puzzle.truth, i),
      });
    }
    expect(scene.result?.outcome).toBe("IDENTIFIED");
    expect(applyPortraitIntent(scene, { kind: "ABANDON" })).toBe(scene);
  });
});

describe("drawPortraitPuzzle — deterministic, all-wrong, gate-composed (ADR-0080 D4)", () => {
  const SEEDS = [-1, 0, 1, 7, 42, 999, 2 ** 31 - 1, 2 ** 31, 2 ** 53 - 1, NaN];

  it("same seed ⇒ same puzzle, forever", () => {
    for (const seed of SEEDS) {
      expect(drawPortraitPuzzle(TEST_CATALOGUE, seed)).toEqual(
        drawPortraitPuzzle(TEST_CATALOGUE, seed),
      );
    }
  });

  it("different seeds produce different boards (the hash is not a constant)", () => {
    const boards = new Set(
      Array.from({ length: 200 }, (_, s) => JSON.stringify(drawPortraitPuzzle(TEST_CATALOGUE, s))),
    );
    expect(boards.size).toBeGreaterThan(100);
  });

  it("the truth is ONE face: the same variant index in all four bands (gate A19)", () => {
    // The variant index IS the source plate, so a per-band truth built the suspect out of
    // four different people — a chimera the player could solve by spotting the tone break
    // at a seam instead of comparing features. This is the invariant that forbids it.
    for (let seed = 0; seed < 500; seed += 1) {
      const puzzle = drawPortraitPuzzle(TEST_CATALOGUE, seed);
      const indices = puzzle.truth.map((slot, b) => at(at(puzzle.order, b), slot));
      expect(new Set(indices).size).toBe(1);
    }
  });

  it("order is a permutation of every slot, per band", () => {
    for (const seed of SEEDS) {
      for (const bandOrder of drawPortraitPuzzle(TEST_CATALOGUE, seed).order) {
        expect([...bandOrder].sort((a, b) => a - b)).toEqual(
          Array.from({ length: VARIANTS_PER_BAND }, (_, k) => k),
        );
      }
    }
  });

  it("initialStateAllWrong — correctCount(initialSelection) === 0 for a 1000-seed sweep", () => {
    for (let seed = 0; seed < 1000; seed += 1) {
      const puzzle = drawPortraitPuzzle(TEST_CATALOGUE, seed);
      expect(correctCount(puzzle.initialSelection, puzzle.truth)).toBe(0);
    }
    for (const seed of SEEDS) {
      const puzzle = drawPortraitPuzzle(TEST_CATALOGUE, seed);
      expect(correctCount(puzzle.initialSelection, puzzle.truth)).toBe(0);
    }
  });

  it("the initial slot spreads over every non-truth slot (no dead offset)", () => {
    const offsets = new Set<number>();
    for (let seed = 0; seed < 200; seed += 1) {
      const puzzle = drawPortraitPuzzle(TEST_CATALOGUE, seed);
      puzzle.truth.forEach((truthSlot, i) => {
        offsets.add(
          ((at(puzzle.initialSelection, i) - truthSlot + VARIANTS_PER_BAND) % VARIANTS_PER_BAND) - 1,
        );
      });
    }
    expect([...offsets].sort((a, b) => a - b)).toEqual(
      Array.from({ length: VARIANTS_PER_BAND - 1 }, (_, k) => k),
    );
  });

  it("the truth is always an eligible variant — the decoy composition holds per seed", () => {
    for (let seed = 0; seed < 200; seed += 1) {
      const puzzle = drawPortraitPuzzle(TEST_CATALOGUE, seed);
      puzzle.truth.forEach((truthSlot, i) => {
        const band = TEST_CATALOGUE.bands[i];
        if (band === undefined) throw new Error("fixture");
        const variantIndex = at(at(puzzle.order, i), truthSlot);
        expect(isEligibleTruth(band.distances, variantIndex, band.variants.length)).toBe(true);
      });
    }
  });

  it("is total on a catalogue that would fail validation", () => {
    const empty = testCatalogue({ bands: [testBand("hair", { variants: [], distances: {} })] });
    expect(() => drawPortraitPuzzle(empty, 3)).not.toThrow();

    const noEligible = testCatalogue({
      bands: [
        testBand("hair", { distances: { ...cyclicDistances(), [distanceKey(0, 2)]: "fine" } }),
      ],
    });
    const puzzle = drawPortraitPuzzle(noEligible, 3);
    expect(puzzle.truth[0]).toBeGreaterThanOrEqual(0);
    expect(correctCount(puzzle.initialSelection, puzzle.truth)).toBe(0);
  });

  // REGRESSION (panel B4b). A band with no variant used to draw `truth = 0` while the
  // selection also started at `0`, so it counted as CORRECT forever: a catalogue with
  // three bands emptied resolved itself to IDENTIFIED — a broken catalogue was a free
  // 1500 points. The degradation of invalid data must be unfavourable, never a gift.
  describe("a band with no variant is UNRESOLVED, never correct", () => {
    const gutted = (emptyBands: number) =>
      testCatalogue({
        bands: PORTRAIT_BAND_ORDER.map((id, i) =>
          i < emptyBands ? testBand(id, { variants: [], distances: {} }) : testBand(id),
        ),
      });

    it("never credits an empty band, whatever the seed", () => {
      for (let seed = 0; seed < 200; seed += 1) {
        const puzzle = drawPortraitPuzzle(gutted(3), seed);
        expect(correctCount(puzzle.initialSelection, puzzle.truth)).toBe(0);
        // Even a selection that tries every slot cannot land on the empty band's truth.
        for (let slot = 0; slot < VARIANTS_PER_BAND; slot += 1) {
          expect(correctCount([slot, slot, slot, slot], puzzle.truth)).toBeLessThanOrEqual(1);
        }
      }
    });

    it("three empty bands cannot yield IDENTIFIED — the best reachable verdict is FAILED", () => {
      const catalogue = gutted(3);
      let scene = createPortraitScene(catalogue, 7, TIMER);
      expect(scene.phase).toBe("ACTIVE");
      // Play the ONE real band onto its truth: 1/4, and the scene stays open.
      const truthSlot = at(scene.puzzle.truth, 3);
      scene = applyPortraitIntent(scene, { kind: "SET", band: "mouth", index: truthSlot });
      expect(scene.phase).toBe("ACTIVE");
      expect(correctCount(scene.selection, scene.puzzle.truth)).toBe(1);
      expect(resolvePortraitScene(scene).result?.outcome).toBe("FAILED");
    });

    it("an entirely empty catalogue expires to FAILED, not to a free IDENTIFIED", () => {
      const scene = tickPortraitScene(createPortraitScene(gutted(4), 11, TIMER), TIMER + 1);
      expect(scene.result).toEqual({ outcome: "FAILED", correctCount: 0, scoreDelta: 0 });
    });
  });

  it("portraitHash is total and folds a non-finite seed to a finite value", () => {
    for (const seed of [NaN, Infinity, -Infinity, 1.7, -3.2]) {
      const h = portraitHash(seed, 0, 0);
      expect(Number.isInteger(h)).toBe(true);
      expect(h).toBeGreaterThanOrEqual(0);
    }
  });
});

describe("createPortraitScene", () => {
  it("starts ACTIVE, at 0/4, on a full chrono, with no verdict", () => {
    const scene = fresh(123, 56);
    expect(scene.phase).toBe("ACTIVE");
    expect(correctCount(scene.selection, scene.puzzle.truth)).toBe(0);
    expect(scene.selection).toEqual(scene.puzzle.initialSelection);
    expect(scene.remainingSeconds).toBe(56);
    expect(scene.timerSeconds).toBe(56);
    expect(scene.focusedBand).toBe("hair");
    expect(scene.result).toBeNull();
  });

  it("cannot resolve on its first frame — no guard delay needed (ADR-0079 D8.4)", () => {
    for (let seed = 0; seed < 300; seed += 1) {
      expect(
        stepPortraitScene(createPortraitScene(TEST_CATALOGUE, seed, TIMER), [], 1 / 60).phase,
      ).toBe("ACTIVE");
    }
  });
});
