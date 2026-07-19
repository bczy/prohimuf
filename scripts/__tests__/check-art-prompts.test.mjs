import { describe, it, expect, afterEach } from "vitest";
import fs from "fs";
import os from "os";
import path from "path";
import { fileURLToPath } from "url";
import { spawnSync } from "child_process";

// Black-box, subprocess-driven exercise of the REAL, unmodified
// scripts/check-art-prompts.mjs's nearForeground set (tech-plan-road-props.md
// decision 4) over disposable fixture levelArt.json files. The `LEVEL_ART` env
// override exists precisely for this ("handy for fixtures/tests", see the
// script's own header comment) — main() runs unconditionally at import time
// (no isMain guard, unlike the gen-*.mjs generators), so the CLI itself is
// exercised as a real child process rather than importing the module.
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, "..", "..");
const SCRIPT = path.join(REPO_ROOT, "scripts", "check-art-prompts.mjs");

const VALID_OPENING =
  "Flat 2D video game sprite, strict side view in orthographic projection, single object centered and fully visible, ";
const VALID_STYLE =
  ", clean bold comic book ink illustration, three-tone cel shading grey black and white, thick clean black outline, flat evenly filled shapes, strictly monochrome greyscale, no colour, isolated on a perfectly flat solid uniform bright magenta #FF3CDC background, empty flat magenta backdrop, no ground, no cast shadow, no text, no logo, no writing, no signature";

const tmpFiles = [];

afterEach(() => {
  for (const f of tmpFiles.splice(0)) {
    fs.rmSync(f, { force: true });
  }
});

function writeFixture(nearForegroundArt) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "check-art-prompts-"));
  const file = path.join(dir, "levelArt.json");
  fs.writeFileSync(file, JSON.stringify({ nearForegroundArt }, null, 2));
  tmpFiles.push(file);
  return file;
}

function run(nearForegroundArt) {
  const file = writeFixture(nearForegroundArt);
  return spawnSync(process.execPath, [SCRIPT, "--set", "nearForeground"], {
    env: { ...process.env, LEVEL_ART: file },
    encoding: "utf8",
  });
}

function makeType(overrides = {}) {
  return {
    asset: "assets/nearfg/bollard.png",
    size: { width: 307, height: 512 },
    seed: 6105,
    prompt: "",
    ...overrides,
  };
}

describe("check-art-prompts.mjs --set nearForeground", () => {
  it("PASSES (exit 0) with a WARN when every kind's prompt is the empty pre-gate placeholder", () => {
    const res = run({
      opening: VALID_OPENING,
      style: VALID_STYLE,
      types: { bollard: makeType() },
    });
    expect(res.status).toBe(0);
    expect(res.stdout).toMatch(/WARN/);
    expect(res.stdout).toMatch(/empty prompt/i);
    expect(res.stdout).toMatch(/PASSED/);
  });

  it("ERRORs when the whole nearForegroundArt block is missing", () => {
    const file = writeFixture(undefined);
    fs.writeFileSync(file, JSON.stringify({}, null, 2));
    const res = spawnSync(process.execPath, [SCRIPT, "--set", "nearForeground"], {
      env: { ...process.env, LEVEL_ART: file },
      encoding: "utf8",
    });
    expect(res.status).toBe(1);
    expect(res.stderr).toMatch(/missing `nearForegroundArt` block/);
  });

  it("ERRORs when opening/style are missing", () => {
    const res = run({ types: { bollard: makeType() } });
    expect(res.status).toBe(1);
    expect(res.stderr).toMatch(/nearForegroundArt\.opening/);
    expect(res.stderr).toMatch(/nearForegroundArt\.style/);
  });

  it("ERRORs when the shared style tail is missing a required house concept", () => {
    const res = run({
      opening: VALID_OPENING,
      style: ", some style with no grey term, no chroma key, no text clause, no medium word",
      types: { bollard: makeType() },
    });
    expect(res.status).toBe(1);
    expect(res.stderr).toMatch(/missing required token/);
  });

  it("ERRORs on a wrong asset path", () => {
    const res = run({
      opening: VALID_OPENING,
      style: VALID_STYLE,
      types: { bollard: makeType({ asset: "assets/nearfg/wrong.png" }) },
    });
    expect(res.status).toBe(1);
    expect(res.stderr).toMatch(/bollard\.asset/);
  });

  it("ERRORs on a non-positive-integer seed", () => {
    const res = run({
      opening: VALID_OPENING,
      style: VALID_STYLE,
      types: { bollard: makeType({ seed: 0 }) },
    });
    expect(res.status).toBe(1);
    expect(res.stderr).toMatch(/bollard\.seed/);
  });

  it("PASSES on a filled-in, positively-phrased prompt within budget", () => {
    const res = run({
      opening: VALID_OPENING,
      style: VALID_STYLE,
      types: {
        bollard: makeType({
          prompt: "a short cast-iron traffic bollard with a rounded cap and a wide flared base",
        }),
      },
    });
    expect(res.status).toBe(0);
    expect(res.stdout).toMatch(/PASSED/);
  });

  it("ERRORs when a filled-in prompt blows the negation hard ceiling (>4)", () => {
    const res = run({
      opening: VALID_OPENING,
      style: VALID_STYLE,
      types: {
        bollard: makeType({
          prompt:
            "not tall, not thin, not modern, not glass, no rust, without a chain, no writing anywhere",
        }),
      },
    });
    expect(res.status).toBe(1);
    expect(res.stderr).toMatch(/negations/);
  });
});
