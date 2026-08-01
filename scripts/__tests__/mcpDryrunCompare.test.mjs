import { describe, expect, it } from "vitest";

import { compareDryrunReport } from "../mcp-level-editor/core.mjs";

/**
 * Fast, browser-free coverage of the §6 acceptance criterion's comparison
 * logic — runs on every default `yarn vitest run scripts` pass. The actual
 * headless-Chromium `dryrun("fixture")` run is a separate, heavier acceptance
 * script (`scripts/mcp-level-editor/dryrun-fixture.mjs`, documented there and
 * run by qa-lead at VERIFY — same precedent as scripts/e2e-*.mjs, which also
 * do not run under vitest).
 */

const committed = {
  url: "http://localhost:5174/prohimuf/?preview=level&level=fixture",
  pageErrors: [],
  tempsFirstRead: 57,
  tempsSecondRead: 54,
  timerTicking: true,
  hudSnippet: "SCORE 0000 NIVEAU Fixture VAGUE 1 TEMPS 48s VIES ♥ ♥ ÉNERGIE ⚡100 ARME A ∞",
};

/** A fresh, structurally-equivalent report — different port, different volatile values. */
const freshMatching = {
  url: "http://localhost:5173/prohimuf/?preview=level&level=fixture",
  pageErrors: [],
  tempsFirstRead: 60,
  tempsSecondRead: 57,
  timerTicking: true,
  hudSnippet: "SCORE 0000 NIVEAU Fixture VAGUE 1 TEMPS 57s VIES ♥ ♥ ♥ ÉNERGIE ⚡100 ARME A ∞",
};

describe("compareDryrunReport", () => {
  it("accepts a fresh report differing only on the volatile fields (port, timer, hud digits)", () => {
    expect(compareDryrunReport(freshMatching, committed)).toEqual({ ok: true, mismatches: [] });
  });

  it("accepts the committed report against itself", () => {
    expect(compareDryrunReport(committed, committed)).toEqual({ ok: true, mismatches: [] });
  });

  it("rejects a non-empty pageErrors (deterministic field, exact match required)", () => {
    const actual = { ...freshMatching, pageErrors: ["TypeError: boom"] };
    const { ok, mismatches } = compareDryrunReport(actual, committed);
    expect(ok).toBe(false);
    expect(mismatches.some((m) => m.startsWith("pageErrors:"))).toBe(true);
  });

  it("rejects timerTicking: false (deterministic behavioural claim, exact match required)", () => {
    const actual = { ...freshMatching, timerTicking: false, tempsFirstRead: 50, tempsSecondRead: 50 };
    const { ok, mismatches } = compareDryrunReport(actual, committed);
    expect(ok).toBe(false);
    expect(mismatches.some((m) => m.startsWith("timerTicking:"))).toBe(true);
  });

  it("rejects a report whose own timerTicking disagrees with its own temps readings", () => {
    const actual = { ...freshMatching, timerTicking: true, tempsFirstRead: 40, tempsSecondRead: 50 };
    const { ok, mismatches } = compareDryrunReport(actual, committed);
    expect(ok).toBe(false);
    expect(mismatches.some((m) => m.includes("disagrees with the actual report's own"))).toBe(true);
  });

  it("accepts any localhost port in url — only the preview-seam query is pinned", () => {
    const actual = { ...freshMatching, url: "http://localhost:41999/prohimuf/?preview=level&level=fixture" };
    expect(compareDryrunReport(actual, committed).ok).toBe(true);
  });

  it("rejects a url pointing at the wrong level id", () => {
    const actual = { ...freshMatching, url: "http://localhost:5173/prohimuf/?preview=level&level=other" };
    const { ok, mismatches } = compareDryrunReport(actual, committed);
    expect(ok).toBe(false);
    expect(mismatches.some((m) => m.startsWith("url:"))).toBe(true);
  });

  it("rejects a hudSnippet missing one of the expected labels", () => {
    const actual = { ...freshMatching, hudSnippet: "SCORE 0000 NIVEAU Fixture VAGUE 1 VIES ♥ ♥" };
    const { ok, mismatches } = compareDryrunReport(actual, committed);
    expect(ok).toBe(false);
    expect(mismatches.some((m) => m.startsWith("hudSnippet labels:"))).toBe(true);
  });

  it("rejects a hudSnippet for the wrong level name", () => {
    const actual = { ...freshMatching, hudSnippet: freshMatching.hudSnippet.replace("Fixture", "Belliard") };
    const { ok, mismatches } = compareDryrunReport(actual, committed);
    expect(ok).toBe(false);
    expect(mismatches.some((m) => m.includes('contain the level name "Fixture"'))).toBe(true);
  });
});
