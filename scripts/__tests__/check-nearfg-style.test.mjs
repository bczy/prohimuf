import { describe, it, expect, afterEach } from "vitest";
import fs from "fs";
import os from "os";
import path from "path";
import { fileURLToPath } from "url";
import { spawnSync } from "child_process";
import { measure, evaluate } from "../check-nearfg-style.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, "..", "..");
const SCRIPT = path.join(REPO_ROOT, "scripts", "check-nearfg-style.mjs");

// A plain object of the same shape as a Canvas ImageData ({width,height,data}
// over a Uint8ClampedArray-like array) — pure, no @napi-rs/canvas round trip
// needed to exercise measure()/evaluate() (same style as
// scripts/lib/__tests__/cutout.test.mjs).
function makeImage(width, height, fill) {
  const data = new Uint8ClampedArray(width * height * 4);
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const [r, g, b, a] = fill(x, y);
      const o = (y * width + x) * 4;
      data[o] = r;
      data[o + 1] = g;
      data[o + 2] = b;
      data[o + 3] = a;
    }
  }
  return { W: width, H: height, d: data };
}

describe("measure", () => {
  it("reports zero content / zero saturation on a fully transparent image", () => {
    const img = makeImage(4, 4, () => [0, 0, 0, 0]);
    const m = measure(img);
    expect(m.content).toBe(0);
    expect(m.contentPct).toBe(0);
    expect(m.meanSat).toBe(0);
  });

  it("reports near-zero mean saturation on a solid grey (R=G=B) opaque image", () => {
    const img = makeImage(4, 4, () => [120, 120, 120, 255]);
    const m = measure(img);
    expect(m.content).toBe(16);
    expect(m.contentPct).toBe(100);
    expect(m.meanSat).toBe(0);
  });

  it("reports high mean saturation on a fully saturated colour", () => {
    const img = makeImage(2, 2, () => [255, 0, 0, 255]); // pure red, sat=1
    const m = measure(img);
    expect(m.meanSat).toBeCloseTo(1, 5);
  });

  it("ignores below-threshold-alpha pixels as non-content", () => {
    const img = makeImage(2, 2, () => [255, 0, 0, 10]); // alpha below ALPHA_CONTENT
    const m = measure(img);
    expect(m.content).toBe(0);
    expect(m.meanSat).toBe(0);
  });
});

describe("evaluate", () => {
  it("PASSes a grey, non-empty silhouette", () => {
    const { pass, checks } = evaluate({ W: 4, H: 4, content: 16, contentPct: 100, meanSat: 0.01 });
    expect(pass).toBe(true);
    expect(checks.every((c) => c.ok)).toBe(true);
  });

  it("FAILs an empty silhouette", () => {
    const { pass, checks } = evaluate({ W: 4, H: 4, content: 0, contentPct: 0, meanSat: 0 });
    expect(pass).toBe(false);
    expect(checks.find((c) => c.name.startsWith("SILHOUETTE")).ok).toBe(false);
  });

  it("FAILs a colour-cast sprite (mean saturation over the C1 ceiling)", () => {
    const { pass, checks } = evaluate({ W: 4, H: 4, content: 16, contentPct: 100, meanSat: 0.4 });
    expect(pass).toBe(false);
    expect(checks.find((c) => c.name.startsWith("MEAN-SAT")).ok).toBe(false);
  });
});

// Black-box, subprocess-driven exercise of the real CLI's arg-validation and
// fail-list handling — mirrors check-art-prompts.test.mjs's subprocess pattern.
describe("check-nearfg-style.mjs CLI", () => {
  const tmpDirs = [];

  afterEach(() => {
    for (const d of tmpDirs.splice(0)) {
      fs.rmSync(d, { recursive: true, force: true });
    }
  });

  function tmpDir() {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), "check-nearfg-style-"));
    tmpDirs.push(dir);
    return dir;
  }

  it("--file with NO value emits a clean usage error, not a raw TypeError", () => {
    const res = spawnSync(process.execPath, [SCRIPT, "--kind", "bollard", "--file"], {
      encoding: "utf8",
    });
    expect(res.status).toBe(2);
    expect(res.stderr).toMatch(/--file requires a path/);
    expect(res.stderr).not.toMatch(/TypeError/);
  });

  it("--file followed by another flag (no value) emits a clean usage error", () => {
    const res = spawnSync(
      process.execPath,
      [SCRIPT, "--kind", "bollard", "--file", "--fail-list", "/tmp/x"],
      { encoding: "utf8" },
    );
    expect(res.status).toBe(2);
    expect(res.stderr).toMatch(/--file requires a path/);
  });

  it("--file --kind with a missing PNG reports MISSING and fails cleanly (no throw)", () => {
    const dir = tmpDir();
    const res = spawnSync(
      process.execPath,
      [SCRIPT, "--file", path.join(dir, "nope.png"), "--kind", "bollard"],
      { encoding: "utf8" },
    );
    expect(res.status).toBe(1);
    expect(res.stdout).toMatch(/MISSING/);
  });

  it("resets --fail-list to EMPTY at the start of the run, even before a stale file is overwritten by a real result", () => {
    const dir = tmpDir();
    const failList = path.join(dir, "fail-list.txt");
    // Pre-seed a STALE fail-list from an imagined earlier run — a crash on
    // THIS run must not leave this stale content behind for the CI retry
    // loop to misread.
    fs.writeFileSync(failList, "someOtherKind\n");
    const res = spawnSync(
      process.execPath,
      [SCRIPT, "--file", path.join(dir, "nope.png"), "--kind", "bollard", "--fail-list", failList],
      { encoding: "utf8" },
    );
    expect(res.status).toBe(1);
    // The real (post-check) write reflects only THIS run's failing kind.
    expect(fs.readFileSync(failList, "utf8").trim()).toBe("bollard");
  });
});
