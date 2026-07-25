import { describe, it, expect } from "vitest";
import { decide, degradedJobs } from "../panelVerdict.mjs";

/**
 * The verdict ladder (ADR-0063) and its DEGRADED rung (ADR-0067).
 *
 * Regression under test: on PR #130 all four reviewers died on an exhausted
 * Anthropic balance, wrote zero findings, and triage published
 * "PASS — no blocking or major finding". These tests lock the distinction
 * between "reviewed and clean" and "never reviewed".
 */

const none = { BLOQUANT: 0, MAJEUR: 0, MINEUR: 0 };

describe("decide", () => {
  it("PASSes a clean tally", () => {
    expect(decide(none).conclusion).toBe("success");
  });

  it("still PASSes with minor findings only", () => {
    const v = decide({ ...none, MINEUR: 3 });
    expect(v.conclusion).toBe("success");
    expect(v.summary).toBe("3 MINEUR");
  });

  it("is CONDITIONAL on a major finding", () => {
    expect(decide({ ...none, MAJEUR: 1 }).conclusion).toBe("neutral");
  });

  it("FAILs on a blocking finding", () => {
    expect(decide({ ...none, BLOQUANT: 1 }).conclusion).toBe("failure");
  });

  it("does NOT pass when a reviewer never ran, even with zero findings", () => {
    // The exact PR #130 shape: empty tally because nothing was reviewed.
    const v = decide(none, ["code-review", "bmad-review"]);
    expect(v.conclusion).not.toBe("success");
    expect(v.title).toContain("DEGRADED");
    expect(v.summary).toContain("code-review");
    expect(v.summary).toContain("2 panel job(s) failed");
  });

  it("reports DEGRADED ahead of a blocking finding (the tally is untrustworthy)", () => {
    const v = decide({ ...none, BLOQUANT: 1 }, ["skeptic"]);
    expect(v.title).toContain("DEGRADED");
    expect(v.conclusion).toBe("failure");
  });

  it("exposes the failed job names so the PR comment can list them", () => {
    expect(decide(none, ["security-review"]).degraded).toEqual(["security-review"]);
  });

  it("leaves a healthy verdict free of the degraded marker", () => {
    expect(decide(none).degraded).toBeUndefined();
  });
});

describe("degradedJobs", () => {
  it("counts failed and cancelled jobs", () => {
    expect(degradedJobs({ a: "failure", b: "cancelled" })).toEqual(["a", "b"]);
  });

  it("does NOT count a skipped job — edge-case-hunter is skipped on the fix lane", () => {
    expect(degradedJobs({ "edge-case-hunter": "skipped", "code-review": "success" })).toEqual([]);
  });

  it("is empty on a fully healthy panel", () => {
    expect(degradedJobs({ a: "success", b: "success" })).toEqual([]);
  });

  it("is empty for no jobs at all", () => {
    expect(degradedJobs()).toEqual([]);
  });
});
