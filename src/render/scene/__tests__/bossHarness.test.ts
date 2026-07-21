import { describe, expect, it } from "vitest";
import {
  fastForwardBossQte,
  isBossSeamShippedLevel,
  parseBossHarnessTarget,
  resolveBossPreviewLevel,
} from "../bossHarness";
import { BOSS_QTE_DEV_HARNESS_LEVEL, LEVELS } from "@game/levels/levels";

// The boss capture seam is view-side + harness-only. These pure helpers pick which level
// `?preview=boss` boots and flag whether that level is a SHIPPED one (C-QA3) — the flag App folds
// into its persistence guard so a seam-booted shipped level (niveau-final) never writes a save.

describe("resolveBossPreviewLevel (C-QA3 level pick)", () => {
  it("defaults to the non-shipped dev harness when no level= param", () => {
    expect(resolveBossPreviewLevel("")).toBe(BOSS_QTE_DEV_HARNESS_LEVEL);
    expect(resolveBossPreviewLevel("?preview=boss&at=phase2")).toBe(BOSS_QTE_DEV_HARNESS_LEVEL);
  });

  it("boots the named SHIPPED level when it authors a bossQteSpec", () => {
    const lvl = resolveBossPreviewLevel("?preview=boss&level=niveau-final&at=phase2");
    expect(lvl.id).toBe("niveau-final");
    expect(lvl.bossQteSpec).toBeDefined();
    // Confirm it is the real in-LEVELS config (real backdrop + anchor + seed flow from here).
    expect(lvl).toBe(LEVELS.find((l) => l.id === "niveau-final"));
  });

  it("falls back to the harness for an unknown or boss-less level id", () => {
    expect(resolveBossPreviewLevel("?level=does-not-exist")).toBe(BOSS_QTE_DEV_HARNESS_LEVEL);
    // The tutorial ships but authors no bossQteSpec ⇒ harness fallback (never a leaky boot).
    expect(resolveBossPreviewLevel("?level=tutorial")).toBe(BOSS_QTE_DEV_HARNESS_LEVEL);
  });
});

describe("isBossSeamShippedLevel (persistence-inertness flag)", () => {
  it("is true only for a preview=boss seam targeting a shipped boss level", () => {
    expect(isBossSeamShippedLevel("?preview=boss&level=niveau-final")).toBe(true);
  });

  it("is false for the non-shipped harness (no level=)", () => {
    expect(isBossSeamShippedLevel("?preview=boss&at=phase3")).toBe(false);
  });

  it("is false off the ?preview=boss path (reachability discipline)", () => {
    // Even naming a shipped level, without preview=boss the seam never installs ⇒ not flagged.
    expect(isBossSeamShippedLevel("?level=niveau-final")).toBe(false);
    expect(isBossSeamShippedLevel("")).toBe(false);
  });
});

describe("parseBossHarnessTarget", () => {
  it("accepts the four targets (incl. phase1, C-QA3) and rejects anything else", () => {
    expect(parseBossHarnessTarget("phase1")).toBe("phase1");
    expect(parseBossHarnessTarget("phase2")).toBe("phase2");
    expect(parseBossHarnessTarget("phase3")).toBe("phase3");
    expect(parseBossHarnessTarget("finisher")).toBe("finisher");
    expect(parseBossHarnessTarget("phase9")).toBeNull();
    expect(parseBossHarnessTarget(null)).toBeNull();
  });
});

describe("fastForwardBossQte boots niveau-final to each capture beat (C-QA3)", () => {
  const spec = LEVELS.find((l) => l.id === "niveau-final")?.bossQteSpec;
  it("has the real niveau-final spec (seed + chandelier décor)", () => {
    expect(spec).toBeDefined();
    expect(spec?.targetSeed).toBe(19991231);
    expect(spec?.decorProp?.position).toEqual({ x: 0.2, y: 1.5 });
  });

  it("lands phase1/phase2/phase3 on a real EXPOSED window of the wanted phase", () => {
    if (spec === undefined) throw new Error("no spec");
    const p1 = fastForwardBossQte(spec, "phase1");
    expect(p1.phase).toBe("ACTIVE");
    expect(p1.stance).toBe("EXPOSED");
    expect(p1.phaseIndex).toBe(0);
    expect(p1.targetSeed).toBe(19991231); // identity carried through the boot

    const p2 = fastForwardBossQte(spec, "phase2");
    expect(p2.phase).toBe("ACTIVE");
    expect(p2.stance).toBe("EXPOSED");
    expect(p2.phaseIndex).toBe(1);

    const p3 = fastForwardBossQte(spec, "phase3");
    expect(p3.phase).toBe("ACTIVE");
    expect(p3.phaseIndex).toBe(2);
  });

  it("reaches the FINISHER beat", () => {
    if (spec === undefined) throw new Error("no spec");
    expect(fastForwardBossQte(spec, "finisher").phase).toBe("FINISHER");
  });
});
