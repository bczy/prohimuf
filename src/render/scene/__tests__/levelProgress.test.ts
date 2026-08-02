import { describe, it, expect } from "vitest";
import { isPhotoQteUnlocked, nextLevelToUnlock } from "../levelProgress";
import { LEVELS, BOSS_QTE_DEV_HARNESS_LEVEL } from "@game/levels/levels";

// The next-level unlock decision App.tsx runs on a terminal phase (ADR-0059 §D4). These
// lock the failable-shipped-level contract for a boss-gated Belliard: a boss WON routes
// to LEVEL_COMPLETE (unlock), a boss LOST routes to GAME_OVER (NO unlock). The state
// machine already proves boss DONE→WON/LOST (stateMachine.test.ts); here we prove the
// PERSISTENCE consequence — the piece newly exposed now a SHIPPED level can end in failure.

describe("levelProgress.nextLevelToUnlock — failable shipped level unlock routing (ADR-0059)", () => {
  // Fixture sanity: Belliard is a shipped level with a next level to unlock. If this ever
  // changes the contract tests below would silently pass on a vacuous null, so pin it.
  const belliardIdx = LEVELS.findIndex((l) => l.id === "belliard");
  const nextAfterBelliard = LEVELS[belliardIdx + 1];

  it("Belliard is a shipped level (isShippedLevel === true) with a next level after it", () => {
    expect(belliardIdx).toBeGreaterThanOrEqual(0);
    expect(nextAfterBelliard).toBeDefined();
    expect(nextAfterBelliard?.id).toBe("stalingrad");
  });

  it("AC3 — boss WON → LEVEL_COMPLETE unlocks the next level, exactly as a clean clear", () => {
    // A boss WON resolves to LEVEL_COMPLETE (stateMachine.ts:191); the persistence effect
    // then unlocks LEVELS[idx+1] — byte-identical to today's quota clear on Belliard.
    expect(nextLevelToUnlock("LEVEL_COMPLETE", "belliard")).toBe("stalingrad");
  });

  it("AC3/AC4 — boss LOST → GAME_OVER unlocks NOTHING (the failable shipped ending)", () => {
    // A boss LOST resolves to GAME_OVER (stateMachine.ts:191). No next level may unlock —
    // this is the first time a shipped level can fail on its ENDING; retry stays available.
    expect(nextLevelToUnlock("GAME_OVER", "belliard")).toBeNull();
  });

  it("AC4 — a shipped GAME_OVER never unlocks, regardless of which shipped level died", () => {
    // Death (lives/timer today, or a boss LOST once flipped on) is uniform: no unlock write.
    for (const level of LEVELS) {
      expect(nextLevelToUnlock("GAME_OVER", level.id)).toBeNull();
    }
  });

  it("the last shipped level completing unlocks nothing (no level after it)", () => {
    const last = LEVELS[LEVELS.length - 1];
    expect(last).toBeDefined();
    if (last === undefined) return;
    expect(nextLevelToUnlock("LEVEL_COMPLETE", last.id)).toBeNull();
  });

  it("AC5 — a NON-shipped level id (the ?preview=boss dev-harness) is inert on both phases", () => {
    // BOSS_QTE_DEV_HARNESS_LEVEL is excluded from LEVELS (ADR-0051 D4), so its id is not
    // found → null. The harness can reach LEVEL_COMPLETE/GAME_OVER but never writes progress.
    const harnessId = BOSS_QTE_DEV_HARNESS_LEVEL.id;
    expect(LEVELS.some((l) => l.id === harnessId)).toBe(false);
    expect(nextLevelToUnlock("LEVEL_COMPLETE", harnessId)).toBeNull();
    expect(nextLevelToUnlock("GAME_OVER", harnessId)).toBeNull();
    // An id that simply does not exist is equally inert.
    expect(nextLevelToUnlock("LEVEL_COMPLETE", "no-such-level")).toBeNull();
  });

  it("the mid-play phase never unlocks (only a terminal LEVEL_COMPLETE does)", () => {
    expect(nextLevelToUnlock("PLAYING", "belliard")).toBeNull();
  });
});

// The photo set-piece's progression gate (pm ruling Q-3): never on a first Belliard. The
// predicate stands on the progression `muf_progress` ALREADY holds — no new key, no new
// write — and it is pure, so a harness seeds the state from an addInitScript.
describe("isPhotoQteUnlocked", () => {
  const host = LEVELS[0]?.id ?? ""; // belliard, the host level
  const nextId = LEVELS[1]?.id ?? "";

  it("is false on a fresh save — a first Belliard never opens the set-piece", () => {
    expect(isPhotoQteUnlocked(host, new Set())).toBe(false);
    expect(isPhotoQteUnlocked(host, new Set([host]))).toBe(false);
  });

  it("is true once the level after the host is unlocked (i.e. the host was cleared)", () => {
    expect(isPhotoQteUnlocked(host, new Set([nextId]))).toBe(true);
  });

  it("reads the level asked for, not the campaign's head", () => {
    // The last shipped level has nothing after it to stand on.
    const last = LEVELS[LEVELS.length - 1]?.id ?? "";
    expect(isPhotoQteUnlocked(last, new Set(LEVELS.map((l) => l.id)))).toBe(false);
  });

  it("is false for a level outside the shipped campaign (dev harness)", () => {
    expect(
      isPhotoQteUnlocked(BOSS_QTE_DEV_HARNESS_LEVEL.id, new Set(LEVELS.map((l) => l.id))),
    ).toBe(false);
  });
});
