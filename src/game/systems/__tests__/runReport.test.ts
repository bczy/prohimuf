import { describe, it, expect } from "vitest";
import { buildRunReport, serializeRunReport } from "@game/systems/runReport";
import { EMPTY_FUNNEL } from "@game/systems/runFunnelSystem";
import type { FunnelState, RunSummary } from "@game/types/runStats";
import { RUN_REPORT_SCHEMA, RUN_REPORT_VERSION } from "@game/types/runStats";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const SUMMARY: RunSummary = {
  score: 4200,
  durationSeconds: 68.4,
  wave: 3,
  endCause: "SANTE",
  pickups: { collected: 3, spawned: 4 },
  delivery: { issue: "INTERROMPUE", integrityPct: 78 },
  heartsLost: { total: 1.5, damage: 0.5, faults: 1, max: 3 },
};

const FUNNEL: FunnelState = {
  titleSeen: true,
  tutorialCleared: true,
  firstDeliveryDone: false,
  belliardCleared: false,
};

describe("buildRunReport (ADR-0076 D5)", () => {
  it("stamps the schema discriminator and the version", () => {
    const r = buildRunReport(SUMMARY, FUNNEL, "belliard");
    expect(r.schema).toBe(RUN_REPORT_SCHEMA);
    expect(r.version).toBe(RUN_REPORT_VERSION);
  });

  it("attaches the level identity — the summary itself carries none", () => {
    expect(buildRunReport(SUMMARY, FUNNEL, "stalingrad").level).toBe("stalingrad");
  });

  it("carries the end block and the five counters in the spec's units", () => {
    const r = buildRunReport(SUMMARY, FUNNEL, "belliard");
    expect(r.end).toEqual({ cause: "SANTE", wave: 3 });
    expect(r.counters).toEqual({
      score: 4200,
      durationSeconds: 68.4,
      pickups: { collected: 3, spawned: 4 },
      delivery: { issue: "INTERROMPUE", integrityPct: 78 },
      heartsLost: { total: 1.5, damage: 0.5, faults: 1, max: 3 },
    });
  });

  it("carries the funnel state, not a diff (gate T1)", () => {
    expect(buildRunReport(SUMMARY, FUNNEL, "belliard").funnel).toEqual(FUNNEL);
    expect(buildRunReport(SUMMARY, EMPTY_FUNNEL, "belliard").funnel).toEqual(EMPTY_FUNNEL);
  });

  it("keeps `null` for the inapplicable — never 0 (spec §2.1.3)", () => {
    const r = buildRunReport({ ...SUMMARY, pickups: null, delivery: null }, FUNNEL, "vitry");
    expect(r.counters.pickups).toBeNull();
    expect(r.counters.delivery).toBeNull();
  });
});

describe("serializeRunReport", () => {
  it("round-trips to the exact report", () => {
    const r = buildRunReport(SUMMARY, FUNNEL, "belliard");
    expect(JSON.parse(serializeRunReport(r))).toEqual(r);
  });

  it("emits a stable key order for two identical reports", () => {
    const a = serializeRunReport(buildRunReport(SUMMARY, FUNNEL, "belliard"));
    const b = serializeRunReport(buildRunReport(SUMMARY, FUNNEL, "belliard"));
    expect(a).toBe(b);
  });

  it("writes `null`, not `0`, for the inapplicable", () => {
    const json = serializeRunReport(
      buildRunReport({ ...SUMMARY, pickups: null, delivery: null }, FUNNEL, "vitry"),
    );
    expect(json).toContain('"pickups":null');
    expect(json).toContain('"delivery":null');
  });

  it("carries no timestamp, no device identifier and no player byline (gate A1)", () => {
    const json = serializeRunReport(buildRunReport(SUMMARY, FUNNEL, "belliard"));
    expect(json).not.toContain("muf_player_name");
    expect(json).not.toMatch(/name|player|pseudo|timestamp|date|userAgent|device/i);
    // No epoch-sized integer anywhere either (a bare Date.now() would show up here).
    expect(json).not.toMatch(/\d{12,}/);
  });
});

describe("the pure report path is structurally identity-free and network-free", () => {
  const src = (f: string): string =>
    readFileSync(resolve(__dirname, "..", f), "utf8").replace(/^\s*(\/\/|\*|\/\*).*$/gm, "");

  it("never imports the high-score module that owns `muf_player_name`", () => {
    for (const f of ["runReport.ts", "runStatsSystem.ts", "runFunnelSystem.ts"]) {
      expect(src(f)).not.toContain("highScoreSystem");
    }
  });

  it("contains no browser I/O and no network call (story AC4, ADR-0076 D4)", () => {
    for (const f of ["runReport.ts", "runStatsSystem.ts", "runFunnelSystem.ts"]) {
      expect(src(f)).not.toMatch(/localStorage|navigator|fetch\(|XMLHttpRequest|WebSocket/);
    }
  });

  it("reads no clock and no randomness (ADR-0076 C2)", () => {
    for (const f of ["runReport.ts", "runStatsSystem.ts", "runFunnelSystem.ts"]) {
      expect(src(f)).not.toMatch(/Date\.now|Math\.random|performance\.now/);
    }
  });
});
