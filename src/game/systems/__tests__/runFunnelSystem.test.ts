import { describe, it, expect } from "vitest";
import {
  EMPTY_FUNNEL,
  parseFunnel,
  withMilestones,
  milestonesFromRun,
} from "@game/systems/runFunnelSystem";
import type { FunnelState, RunSummary } from "@game/types/runStats";

const summary = (over: Partial<RunSummary> = {}): RunSummary => ({
  score: 1000,
  durationSeconds: 42,
  wave: 2,
  endCause: "SANTE",
  pickups: null,
  delivery: null,
  heartsLost: { total: 3, damage: 3, faults: 0, max: 3 },
  ...over,
});

describe("parseFunnel — total, never throws (ADR-0076 D4)", () => {
  it("reads a missing blob as all-false", () => {
    expect(parseFunnel(null)).toEqual(EMPTY_FUNNEL);
  });

  it("reads a corrupt blob as all-false instead of throwing", () => {
    expect(parseFunnel("{not json")).toEqual(EMPTY_FUNNEL);
    expect(parseFunnel("")).toEqual(EMPTY_FUNNEL);
  });

  it("reads a non-object JSON value as all-false", () => {
    expect(parseFunnel("null")).toEqual(EMPTY_FUNNEL);
    expect(parseFunnel("42")).toEqual(EMPTY_FUNNEL);
    expect(parseFunnel('"titleSeen"')).toEqual(EMPTY_FUNNEL);
    expect(parseFunnel('["titleSeen"]')).toEqual(EMPTY_FUNNEL);
  });

  it("reads the four flags it knows", () => {
    const raw = JSON.stringify({
      v: 1,
      titleSeen: true,
      tutorialCleared: true,
      firstDeliveryDone: false,
      belliardCleared: false,
    });
    expect(parseFunnel(raw)).toEqual({
      titleSeen: true,
      tutorialCleared: true,
      firstDeliveryDone: false,
      belliardCleared: false,
    } satisfies FunnelState);
  });

  it("reads a missing field as false and ignores unknown fields", () => {
    const raw = JSON.stringify({ titleSeen: true, somethingFromV2: true });
    expect(parseFunnel(raw)).toEqual({ ...EMPTY_FUNNEL, titleSeen: true });
  });

  it("reads a non-boolean flag as false — only `true` unlocks", () => {
    const raw = JSON.stringify({ titleSeen: "yes", tutorialCleared: 1, belliardCleared: null });
    expect(parseFunnel(raw)).toEqual(EMPTY_FUNNEL);
  });
});

describe("withMilestones — independent OR-merge (gate ruling D4.3)", () => {
  it("flips only the named locks", () => {
    expect(withMilestones(EMPTY_FUNNEL, ["titleSeen"])).toEqual({
      ...EMPTY_FUNNEL,
      titleSeen: true,
    });
  });

  it("is idempotent — re-applying a milestone changes nothing", () => {
    const once = withMilestones(EMPTY_FUNNEL, ["tutorialCleared"]);
    expect(withMilestones(once, ["tutorialCleared"])).toEqual(once);
  });

  it("never flips a lock back to false", () => {
    const full: FunnelState = {
      titleSeen: true,
      tutorialCleared: true,
      firstDeliveryDone: true,
      belliardCleared: true,
    };
    expect(withMilestones(full, [])).toEqual(full);
  });

  it("locks milestone 4 without milestone 3 — the locks are NOT chained", () => {
    // Real case: belliard's quota (10) can be met before the delivery triggers (20 s).
    const f = withMilestones(EMPTY_FUNNEL, ["belliardCleared"]);
    expect(f.belliardCleared).toBe(true);
    expect(f.firstDeliveryDone).toBe(false);
  });

  it("keeps an earlier lock when a later one arrives (order-independent)", () => {
    const a = withMilestones(withMilestones(EMPTY_FUNNEL, ["belliardCleared"]), [
      "firstDeliveryDone",
    ]);
    const b = withMilestones(withMilestones(EMPTY_FUNNEL, ["firstDeliveryDone"]), [
      "belliardCleared",
    ]);
    expect(a).toEqual(b);
    expect(a).toMatchObject({ firstDeliveryDone: true, belliardCleared: true });
  });
});

describe("milestonesFromRun", () => {
  it("locks the first delivery on a SUCCESS latch only (D4.1)", () => {
    const s = summary({ delivery: { issue: "REUSSIE", integrityPct: 80 } });
    expect(milestonesFromRun(s, "belliard")).toContain("firstDeliveryDone");
  });

  it("does not lock it on PERDUE, INTERROMPUE or NON_DECLENCHEE", () => {
    for (const issue of ["PERDUE", "INTERROMPUE", "NON_DECLENCHEE"] as const) {
      const s = summary({ delivery: { issue, integrityPct: null } });
      expect(milestonesFromRun(s, "belliard")).not.toContain("firstDeliveryDone");
    }
  });

  it("locks `belliardCleared` when belliard completes on quota (gate Q3)", () => {
    const s = summary({ endCause: "QUOTA" });
    expect(milestonesFromRun(s, "belliard")).toContain("belliardCleared");
  });

  it("locks `belliardCleared` when belliard completes on a boss win", () => {
    const s = summary({ endCause: "BOSS_GAGNE" });
    expect(milestonesFromRun(s, "belliard")).toContain("belliardCleared");
  });

  it("does not lock it on a belliard run that was lost", () => {
    for (const endCause of ["SANTE", "TEMPS", "BOSS_PERDU"] as const) {
      expect(milestonesFromRun(summary({ endCause }), "belliard")).not.toContain("belliardCleared");
    }
  });

  it("does not lock it when another level completes", () => {
    const s = summary({ endCause: "QUOTA" });
    expect(milestonesFromRun(s, "stalingrad")).not.toContain("belliardCleared");
  });

  it("never emits the two navigation milestones — they are not run outcomes", () => {
    const s = summary({ endCause: "QUOTA", delivery: { issue: "REUSSIE", integrityPct: 100 } });
    const ms = milestonesFromRun(s, "belliard");
    expect(ms).not.toContain("titleSeen");
    expect(ms).not.toContain("tutorialCleared");
  });

  it("emits nothing for a lost run on a level with no delivery", () => {
    expect(milestonesFromRun(summary(), "vitry")).toEqual([]);
  });
});
