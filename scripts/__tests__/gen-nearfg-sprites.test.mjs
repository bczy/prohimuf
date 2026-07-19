import { describe, it, expect, afterEach, vi } from "vitest";
import fs from "fs";
import os from "os";
import path from "path";
import { fileURLToPath } from "url";
import { spawnSync } from "child_process";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, "..", "..");
const SCRIPT = path.join(REPO_ROOT, "scripts", "gen-nearfg-sprites.mjs");

// loadNearForegroundArt() reads LEVEL_ART at import-time via a module-level
// `path.resolve(ROOT, process.env.LEVEL_ART ?? ...)` — set the env var BEFORE
// each (re-)import so the pure reader resolves to a disposable fixture, same
// pattern as check-art-prompts.mjs/check-sprite-style.mjs's LEVEL_ART override.
// `vi.resetModules()` forces a fresh module evaluation per test (Vite's SSR
// module cache would otherwise keep the first test's LEVEL_ART baked in — and
// dynamic `import()` needs a static, analyzable specifier, so a cache-busting
// query string is not an option here).
const tmpFiles = [];

afterEach(() => {
  for (const f of tmpFiles.splice(0)) {
    fs.rmSync(f, { force: true });
  }
  delete process.env.LEVEL_ART;
});

function writeFixture(nearForegroundArt) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "gen-nearfg-"));
  const file = path.join(dir, "levelArt.json");
  fs.writeFileSync(file, JSON.stringify({ nearForegroundArt }, null, 2));
  tmpFiles.push(file);
  return file;
}

async function importFresh() {
  vi.resetModules();
  return import("../gen-nearfg-sprites.mjs");
}

describe("loadNearForegroundArt", () => {
  it("assembles opening + prompt + style, and reads the JSON-provided non-square size verbatim", async () => {
    process.env.LEVEL_ART = writeFixture({
      opening: "OPEN ",
      style: " STYLE",
      types: {
        bollard: {
          asset: "assets/nearfg/bollard.png",
          size: { width: 307, height: 512 },
          seed: 6105,
          prompt: "a cast-iron bollard",
        },
      },
    });
    const { loadNearForegroundArt } = await importFresh();
    const props = loadNearForegroundArt();
    expect(props).toHaveLength(1);
    const [p] = props;
    expect(p.kind).toBe("bollard");
    expect(p.assembled).toBe("OPEN a cast-iron bollard STYLE");
    expect(p.width).toBe(307);
    expect(p.height).toBe(512);
    expect(p.seed).toBe(6105);
    expect(p.asset).toBe("assets/nearfg/bollard.png");
  });

  it("carries an empty prompt through as-is (pre-gate placeholder, not defaulted to a subject)", async () => {
    process.env.LEVEL_ART = writeFixture({
      opening: "OPEN ",
      style: " STYLE",
      types: {
        lamppost: {
          asset: "assets/nearfg/lamppost.png",
          size: { width: 256, height: 512 },
          seed: 6102,
          prompt: "",
        },
      },
    });
    const { loadNearForegroundArt } = await importFresh();
    const [p] = loadNearForegroundArt();
    expect(p.prompt).toBe("");
    expect(p.assembled).toBe("OPEN  STYLE");
  });

  it("resolves every kind's non-square width from the size field, not a recomputed aspect", async () => {
    // The 8 road-prop widths from tech-plan-road-props.md decision 1
    // (round(512 * aspect)) — the loader must pass these straight through.
    const sizes = {
      parkingMeter: 256,
      lamppost: 256,
      wallaceFountain: 282,
      trafficLight: 225, // round(512*0.44)=225
      bollard: 307,
      scooter: 768,
      bench: 870,
      streetSign: 384,
    };
    const types = Object.fromEntries(
      Object.entries(sizes).map(([kind, width], i) => [
        kind,
        {
          asset: `assets/nearfg/${kind}.png`,
          size: { width, height: 512 },
          seed: 6100 + i,
          prompt: "",
        },
      ]),
    );
    process.env.LEVEL_ART = writeFixture({ opening: "O ", style: " S", types });
    const { loadNearForegroundArt } = await importFresh();
    const props = loadNearForegroundArt();
    for (const p of props) {
      expect(p.width).toBe(sizes[p.kind]);
      expect(p.height).toBe(512);
    }
  });

  it("throws when the nearForegroundArt.types block is absent", async () => {
    process.env.LEVEL_ART = writeFixture(undefined);
    const { loadNearForegroundArt } = await importFresh();
    expect(() => loadNearForegroundArt()).toThrow(/nearForegroundArt\.types/);
  });

  it("throws (fatal, not a silent 256x512 default) when a kind's size is absent", async () => {
    process.env.LEVEL_ART = writeFixture({
      opening: "O ",
      style: " S",
      types: {
        bollard: { asset: "assets/nearfg/bollard.png", seed: 6105, prompt: "x" },
      },
    });
    const { loadNearForegroundArt } = await importFresh();
    expect(() => loadNearForegroundArt()).toThrow(/bollard\.size/);
  });

  it("throws (fatal) when a kind's size has a non-integer or non-positive dimension", async () => {
    process.env.LEVEL_ART = writeFixture({
      opening: "O ",
      style: " S",
      types: {
        bollard: {
          asset: "assets/nearfg/bollard.png",
          size: { width: 0, height: 512 },
          seed: 6105,
          prompt: "x",
        },
      },
    });
    const { loadNearForegroundArt } = await importFresh();
    expect(() => loadNearForegroundArt()).toThrow(/bollard\.size/);
  });
});

// Black-box, subprocess-driven exercise of main()'s fail-fast token behaviour
// (main() is not exported — it is the CLI entry point) — mirrors
// check-art-prompts.test.mjs's subprocess pattern.
describe("main() — fail-fast token resolution", () => {
  const tmpDirs = [];

  afterEach(() => {
    for (const d of tmpDirs.splice(0)) {
      fs.rmSync(d, { recursive: true, force: true });
    }
  });

  function fixtureDir(nearForegroundArt) {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), "gen-nearfg-main-"));
    tmpDirs.push(dir);
    fs.writeFileSync(
      path.join(dir, "levelArt.json"),
      JSON.stringify({ nearForegroundArt }, null, 2),
    );
    return dir;
  }

  function run(dir, extraEnv = {}) {
    return spawnSync(process.execPath, [SCRIPT], {
      env: {
        ...process.env,
        POLLINATIONS_TOKEN: "",
        LEVEL_ART: path.join(dir, "levelArt.json"),
        OUT_DIR: path.join(dir, "out"),
        ...extraEnv,
      },
      encoding: "utf8",
    });
  }

  it("fails fast (non-zero, clear message) when a kind needs generating and no token is available", () => {
    const dir = fixtureDir({
      opening: "O ",
      style: " S",
      types: {
        bollard: {
          asset: "assets/nearfg/bollard.png",
          size: { width: 307, height: 512 },
          seed: 6105,
          prompt: "a cast-iron bollard",
        },
      },
    });
    const res = run(dir);
    expect(res.status).not.toBe(0);
    expect(res.stderr).toMatch(/POLLINATIONS_TOKEN/);
  });

  it("does NOT require a token when every kind is skip-eligible (empty prompt)", () => {
    const dir = fixtureDir({
      opening: "O ",
      style: " S",
      types: {
        lamppost: {
          asset: "assets/nearfg/lamppost.png",
          size: { width: 256, height: 512 },
          seed: 6102,
          prompt: "",
        },
      },
    });
    const res = run(dir);
    expect(res.status).toBe(0);
    expect(res.stderr).toMatch(/WARN/); // console.warn writes to stderr
  });

  it("does NOT require a token when the target file already exists (no FORCE)", () => {
    const dir = fixtureDir({
      opening: "O ",
      style: " S",
      types: {
        bollard: {
          asset: "assets/nearfg/bollard.png",
          size: { width: 307, height: 512 },
          seed: 6105,
          prompt: "a cast-iron bollard",
        },
      },
    });
    fs.mkdirSync(path.join(dir, "out"), { recursive: true });
    fs.writeFileSync(path.join(dir, "out", "bollard.png"), "not a real png, just present");
    const res = run(dir);
    expect(res.status).toBe(0);
    expect(res.stdout).toMatch(/\[skip\]/);
  });
});
