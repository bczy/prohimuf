import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { mkdtemp, mkdir, writeFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { collectFindings, findingKey, mergeConfirmations } from "../panelFindings.mjs";

/**
 * Transport-agnostic findings plumbing, extracted from the retired
 * scripts/panel-invoke-skeptic.mjs (ADR-0070). collectFindings() reads the
 * same on-disk artifact layout
 * `actions/download-artifact` produces for `pattern: findings-*`; the
 * merge safety net is what stops the skeptic from rewriting or dropping a
 * finding.
 */

describe("collectFindings", () => {
  let dir;

  beforeEach(async () => {
    dir = await mkdtemp(join(tmpdir(), "panel-findings-"));
  });

  afterEach(async () => {
    await rm(dir, { recursive: true, force: true });
  });

  it("returns [] when the directory does not exist", async () => {
    expect(await collectFindings(join(dir, "missing"))).toEqual([]);
  });

  it("tags every finding with the reviewer artifact it came from", async () => {
    await mkdir(join(dir, "findings-code-review"), { recursive: true });
    await writeFile(
      join(dir, "findings-code-review", "findings-code-review.json"),
      JSON.stringify([{ severity: "MAJEUR", file: "a.ts", line: 1, title: "t1" }]),
    );
    const findings = await collectFindings(dir);
    expect(findings).toEqual([
      { severity: "MAJEUR", file: "a.ts", line: 1, title: "t1", _reviewer: "findings-code-review" },
    ]);
  });

  it("merges findings from multiple reviewer directories", async () => {
    await mkdir(join(dir, "findings-code-review"), { recursive: true });
    await mkdir(join(dir, "findings-security-review"), { recursive: true });
    await writeFile(
      join(dir, "findings-code-review", "f.json"),
      JSON.stringify([{ severity: "MINEUR", file: "a.ts", title: "t1" }]),
    );
    await writeFile(
      join(dir, "findings-security-review", "f.json"),
      JSON.stringify([{ severity: "BLOQUANT", file: "b.ts", title: "t2" }]),
    );
    const findings = await collectFindings(dir);
    expect(findings).toHaveLength(2);
    expect(findings.map((f) => f._reviewer).sort()).toEqual([
      "findings-code-review",
      "findings-security-review",
    ]);
  });

  it("drops exact duplicates within the same reviewer (same file/line/title)", async () => {
    await mkdir(join(dir, "findings-code-review"), { recursive: true });
    await writeFile(
      join(dir, "findings-code-review", "a.json"),
      JSON.stringify([{ severity: "MAJEUR", file: "a.ts", line: 1, title: "dup" }]),
    );
    await writeFile(
      join(dir, "findings-code-review", "b.json"),
      JSON.stringify([{ severity: "MAJEUR", file: "a.ts", line: 1, title: "dup" }]),
    );
    const findings = await collectFindings(dir);
    expect(findings).toHaveLength(1);
  });

  it("skips a JSON file that isn't an array without throwing", async () => {
    await mkdir(join(dir, "findings-code-review"), { recursive: true });
    await writeFile(join(dir, "findings-code-review", "bad.json"), JSON.stringify({ oops: true }));
    expect(await collectFindings(dir)).toEqual([]);
  });

  it("skips a file that isn't valid JSON without throwing", async () => {
    await mkdir(join(dir, "findings-code-review"), { recursive: true });
    await writeFile(join(dir, "findings-code-review", "bad.json"), "not json");
    expect(await collectFindings(dir)).toEqual([]);
  });

  it("ignores stray non-directory entries next to the reviewer folders", async () => {
    await mkdir(join(dir, "findings-code-review"), { recursive: true });
    await writeFile(join(dir, "README.txt"), "not a reviewer artifact");
    expect(await collectFindings(dir)).toEqual([]);
  });
});

describe("findingKey", () => {
  it("is stable for the same reviewer/file/line/title", () => {
    const f = { _reviewer: "r", file: "a.ts", line: 1, title: "t" };
    expect(findingKey(f)).toBe(findingKey({ ...f }));
  });

  it("differs when the reviewer differs (a legitimate cross-reviewer overlap, not a dup)", () => {
    const a = { _reviewer: "code-review", file: "a.ts", line: 1, title: "t" };
    const b = { _reviewer: "security-review", file: "a.ts", line: 1, title: "t" };
    expect(findingKey(a)).not.toBe(findingKey(b));
  });

  it("tolerates missing fields", () => {
    expect(() => findingKey({})).not.toThrow();
  });
});

describe("mergeConfirmations", () => {
  it("merges a confirmed verdict onto the original finding, stripping id", () => {
    const findings = [{ id: 0, severity: "MAJEUR", file: "a.ts", title: "t" }];
    const verified = new Map([[0, { confirmed: true }]]);
    expect(mergeConfirmations(findings, verified)).toEqual([
      { severity: "MAJEUR", file: "a.ts", title: "t", confirmed: true },
    ]);
  });

  it("attaches a refutation only when the skeptic provided one", () => {
    const findings = [{ id: 0, severity: "MINEUR", file: "a.ts", title: "t" }];
    const verified = new Map([[0, { confirmed: false, refutation: "already guarded" }]]);
    const [merged] = mergeConfirmations(findings, verified);
    expect(merged.confirmed).toBe(false);
    expect(merged.refutation).toBe("already guarded");
  });

  it("confirms by default a finding the skeptic never answered (silent-drop safety net)", () => {
    const findings = [
      { id: 0, severity: "MAJEUR", file: "a.ts", title: "answered" },
      { id: 1, severity: "MAJEUR", file: "b.ts", title: "dropped" },
    ];
    const verified = new Map([[0, { confirmed: false, refutation: "fine" }]]);
    const merged = mergeConfirmations(findings, verified);
    expect(merged[1].confirmed).toBe(true);
    expect(merged[1].refutation).toBeUndefined();
  });

  it("cannot let the skeptic rewrite severity/file/title — only confirmed/refutation flow from its answer", () => {
    const findings = [{ id: 0, severity: "BLOQUANT", file: "a.ts", title: "original" }];
    // Even if a verdict object smuggled other fields, mergeConfirmations
    // only ever reads `confirmed`/`refutation` off it.
    const verified = new Map([
      [0, { confirmed: true, severity: "MINEUR", file: "elsewhere.ts", title: "rewritten" }],
    ]);
    const [merged] = mergeConfirmations(findings, verified);
    expect(merged.severity).toBe("BLOQUANT");
    expect(merged.file).toBe("a.ts");
    expect(merged.title).toBe("original");
  });
});
