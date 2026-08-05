import { describe, it, expect } from "vitest";
import type { PortraitIntent, PortraitScene } from "@game/types/portraitRobot";
import {
  applyPortraitIntent,
  correctCount,
  createPortraitScene,
  stepPortraitScene,
  tickPortraitScene,
  PORTRAIT_BAND_ORDER,
} from "@game/systems/portraitRobotSystem";
import { TEST_CATALOGUE, at } from "@game/systems/__tests__/portraitFixtures";

/**
 * ADR-0079 D8.3 — the four ordering tests. The first three prove today's code; the
 * fourth prevents tomorrow's. A determinism property with no regression guard is a
 * comment.
 *
 * What they collectively assert is that "4/4 pile au buzzer ⇒ IDENTIFIED" is a property
 * of the reducer and NOT a race between `pointerup` and rAF.
 */

const TIMER = 35;

/** A scene whose first `n` bands sit on their truth slot, with `remaining` on the clock. */
function sceneAt(n: number, remaining: number, seed = 7): PortraitScene {
  const base = createPortraitScene(TEST_CATALOGUE, seed, TIMER);
  const selection = base.puzzle.truth.map((slot, i) =>
    i < n ? slot : at(base.puzzle.initialSelection, i),
  );
  return { ...base, selection, remainingSeconds: remaining };
}

/** The intent that completes the board: address the last band's truth slot directly. */
function winningIntent(scene: PortraitScene): PortraitIntent {
  return {
    kind: "SET",
    band: PORTRAIT_BAND_ORDER[3],
    index: at(scene.puzzle.truth, 3),
  };
}

describe("ADR-0079 D8.2 — time cannot run on a resolved scene", () => {
  it("tick is the identity on a RESOLVED scene, for any dt", () => {
    const resolved = applyPortraitIntent(sceneAt(3, 12), winningIntent(sceneAt(3, 12)));
    expect(resolved.phase).toBe("RESOLVED");

    for (const dt of [0, -0, 1 / 60, -1, -1e9, 1e9, Number.MAX_VALUE, NaN, Infinity, -Infinity]) {
      expect(tickPortraitScene(resolved, dt)).toBe(resolved);
    }
  });

  it("a late tick cannot overwrite a verdict", () => {
    const resolved = applyPortraitIntent(sceneAt(3, 1e-6), winningIntent(sceneAt(3, 1e-6)));
    const late = tickPortraitScene(resolved, 999);
    expect(late.result?.outcome).toBe("IDENTIFIED");
    expect(late.remainingSeconds).toBe(1e-6);
  });
});

describe("ADR-0079 D8.1 — the lock-in is a post-condition of applyPortraitIntent", () => {
  it("an entry completing 4/4 at remainingSeconds = 1e-6 yields IDENTIFIED", () => {
    const scene = sceneAt(3, 1e-6);
    expect(correctCount(scene.selection, scene.puzzle.truth)).toBe(3);

    const after = applyPortraitIntent(scene, winningIntent(scene));
    expect(after.phase).toBe("RESOLVED");
    expect(after.result).toEqual({ outcome: "IDENTIFIED", correctCount: 4, scoreDelta: 1500 });
  });

  it("resolution derives from the board alone — an expiry on a 4/4 board is IDENTIFIED too", () => {
    // Cannot be reached in play (the entry producing 4/4 would already have resolved),
    // which is exactly why it is asserted: the outcome is "what 4/4 means", never
    // "which path we took" (gate A12bis / A17).
    const scene = sceneAt(4, 0.5);
    expect(tickPortraitScene(scene, 10).result?.outcome).toBe("IDENTIFIED");
  });
});

describe("ADR-0079 D8.3 — the frame fold settles the buzzer race", () => {
  it("winning entry and expiry in the SAME frame ⇒ IDENTIFIED", () => {
    const scene = sceneAt(3, 0.016);
    const after = stepPortraitScene(scene, [winningIntent(scene)], 0.016);
    expect(after.result?.outcome).toBe("IDENTIFIED");
  });

  it("holds at every frame rate — dt far beyond the remaining time still locks in", () => {
    const scene = sceneAt(3, 0.016);
    for (const dt of [0.016, 0.033, 0.5, 5, 1e6]) {
      expect(stepPortraitScene(scene, [winningIntent(scene)], dt).result?.outcome).toBe(
        "IDENTIFIED",
      );
    }
  });

  it("the same intents split across two frames ⇒ PARTIAL (the player WAS late)", () => {
    const scene = sceneAt(3, 0.016);
    const expired = stepPortraitScene(scene, [], 0.016);
    expect(expired.result?.outcome).toBe("PARTIAL");

    const after = stepPortraitScene(expired, [winningIntent(scene)], 0.016);
    expect(after).toBe(expired);
    expect(after.result?.outcome).toBe("PARTIAL");
  });

  it("permutation test — every fold the hook could produce, with the entry before the tick", () => {
    const scene = sceneAt(2, 0.016);
    const truth = scene.puzzle.truth;
    // Two entries are needed to reach 4/4; the hook may deliver them in either order,
    // batched or one per frame, and may interleave irrelevant entries.
    const entries: readonly PortraitIntent[] = [
      { kind: "SET", band: "nose", index: at(truth, 2) },
      { kind: "SET", band: "mouth", index: at(truth, 3) },
      { kind: "FOCUS", band: "eyes" },
    ];

    for (const perm of permutations(entries)) {
      const folded = stepPortraitScene(scene, perm, 0.016);
      expect(folded.result?.outcome).toBe("IDENTIFIED");
    }

    // …and the ONE ordering the fold forbids the hook from producing — time first — is
    // the one that would have lost the race. It is unreachable through the fold, so it
    // has to be spelled out by hand to be shown to differ.
    const timeFirst = stepPortraitScene(tickPortraitScene(scene, 0.016), entries, 0.016);
    expect(timeFirst.result?.outcome).toBe("FAILED");
  });
});

function permutations<T>(items: readonly T[]): T[][] {
  if (items.length <= 1) return [[...items]];
  const out: T[][] = [];
  items.forEach((item, i) => {
    const rest = [...items.slice(0, i), ...items.slice(i + 1)];
    for (const p of permutations(rest)) out.push([item, ...p]);
  });
  return out;
}
