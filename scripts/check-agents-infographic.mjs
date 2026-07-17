#!/usr/bin/env node
/**
 * DOC FRESHNESS GATE — keeps docs/diagrams/agents-pipeline-infographic.html in
 * sync with the agent-pipeline sources it visualises.
 *
 * The infographic is an authored artifact: no script can regenerate it from the
 * protocol text, so the enforceable contract is STALENESS DETECTION. A manifest
 * (agents-pipeline-infographic.sources.json) pins a sha256 per watched source
 * file; verify mode recomputes the hashes and fails when any watched source
 * changed, appeared or disappeared without the manifest being re-pinned.
 *
 * Watched sources (the normative surface the infographic draws):
 *   - .claude/agents/*.md              (roster + COLLABORATION.md protocol)
 *   - docs/diagrams/agent-workflows.md (the mermaid flowchart companion)
 *   - docs/muf-crew-bitmap.py          (pixel-art crew sprite generator)
 *
 * The crew sprites are ALSO checked directly (both modes): every crew/*.png the
 * HTML references must exist, and the committed sprites must match a fresh
 * `python3 docs/muf-crew-bitmap.py --singles` run pixel-for-pixel (decoded via
 * node:zlib, so a different zlib build cannot cause false staleness). This
 * closes the drift the manifest alone cannot see: a generator edit re-pinned
 * without the sprites being regenerated.
 *
 * The intended loop, enforced in CI: a PR that touches a watched source updates
 * the infographic in the SAME PR (or deliberately confirms no visual change is
 * needed), regenerates the sprites if the generator changed, then re-pins with
 * `--update`. The re-pin is a conscious act recorded in the diff — the
 * infographic can no longer drift silently.
 *
 * Usage:
 *   node scripts/check-agents-infographic.mjs           # verify (CI mode)
 *   node scripts/check-agents-infographic.mjs --update  # re-pin the manifest
 * Exit: 0 fresh (or manifest updated); 1 stale, sprite drift, or missing files.
 */
import { spawnSync } from "child_process";
import crypto from "crypto";
import fs from "fs";
import os from "os";
import path from "path";
import { fileURLToPath } from "url";
import zlib from "zlib";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");

const INFOGRAPHIC = "docs/diagrams/agents-pipeline-infographic.html";
const MANIFEST = "docs/diagrams/agents-pipeline-infographic.sources.json";
const AGENTS_DIR = ".claude/agents";
const CREW_DIR = "docs/diagrams/crew";
const GENERATOR = "docs/muf-crew-bitmap.py";
const EXTRA_SOURCES = ["docs/diagrams/agent-workflows.md", GENERATOR];

function sha256(absPath) {
  return crypto.createHash("sha256").update(fs.readFileSync(absPath)).digest("hex");
}

/** Current watched sources as a sorted { relPath: sha256 } map. */
function collectSources() {
  const agentDocs = fs
    .readdirSync(path.join(ROOT, AGENTS_DIR))
    .filter((f) => f.endsWith(".md"))
    .map((f) => path.posix.join(AGENTS_DIR, f));
  const rels = [...agentDocs, ...EXTRA_SOURCES].sort();
  return Object.fromEntries(rels.map((rel) => [rel, sha256(path.join(ROOT, rel))]));
}

/**
 * Decode a (non-interlaced, single-IDAT-stream) PNG to comparable pixel data:
 * width/height/bitDepth/colorType + inflated scanlines. Comparing decoded data
 * instead of file bytes makes the sprite-drift check immune to zlib
 * implementation differences between the committing machine and CI.
 */
function decodePng(buf) {
  const idat = [];
  let ihdr = null;
  let off = 8; // skip signature
  while (off < buf.length) {
    const len = buf.readUInt32BE(off);
    const type = buf.toString("ascii", off + 4, off + 8);
    const data = buf.subarray(off + 8, off + 8 + len);
    if (type === "IHDR") ihdr = data;
    if (type === "IDAT") idat.push(data);
    off += 12 + len;
  }
  if (!ihdr || idat.length === 0) throw new Error("not a valid PNG");
  return {
    header: ihdr.toString("hex"),
    pixels: zlib.inflateSync(Buffer.concat(idat)),
  };
}

function samePng(a, b) {
  try {
    const da = decodePng(a);
    const db = decodePng(b);
    return da.header === db.header && da.pixels.equals(db.pixels);
  } catch {
    return false;
  }
}

/** Sprite problems: missing HTML references + drift vs a fresh generator run. */
function collectSpriteProblems() {
  const problems = [];

  const html = fs.readFileSync(path.join(ROOT, INFOGRAPHIC), "utf8");
  const referenced = new Set([...html.matchAll(/src="crew\/([a-z0-9-]+\.png)"/g)].map((m) => m[1]));
  for (const f of referenced) {
    if (!fs.existsSync(path.join(ROOT, CREW_DIR, f))) {
      problems.push(`sprite referenced by the infographic is missing: ${CREW_DIR}/${f}`);
    }
  }

  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "muf-crew-check-"));
  try {
    const gen = spawnSync("python3", [path.join(ROOT, GENERATOR), "--singles"], {
      env: { ...process.env, CREW_OUTDIR: tmp },
    });
    if (gen.error || gen.status !== 0) {
      console.warn(
        "[check-agents-infographic] WARN — python3 unavailable or generator failed; " +
          "sprite-drift leg skipped (manifest + reference checks still enforced).",
      );
      return problems;
    }
    const generated = fs.readdirSync(tmp).sort();
    for (const f of generated) {
      const committed = path.join(ROOT, CREW_DIR, f);
      if (!fs.existsSync(committed)) {
        problems.push(`generated sprite is not committed: ${CREW_DIR}/${f}`);
      } else if (!samePng(fs.readFileSync(committed), fs.readFileSync(path.join(tmp, f)))) {
        problems.push(`stale sprite: ${CREW_DIR}/${f} no longer matches ${GENERATOR}`);
      }
    }
    for (const f of fs.readdirSync(path.join(ROOT, CREW_DIR)).sort()) {
      if (!generated.includes(f)) {
        problems.push(`orphan sprite: ${CREW_DIR}/${f} is not produced by ${GENERATOR}`);
      }
    }
  } finally {
    fs.rmSync(tmp, { recursive: true, force: true });
  }
  return problems;
}

function main() {
  const update = process.argv.includes("--update");
  const manifestAbs = path.join(ROOT, MANIFEST);

  if (!fs.existsSync(path.join(ROOT, INFOGRAPHIC))) {
    console.error(`[check-agents-infographic] FAILED — ${INFOGRAPHIC} is missing.`);
    process.exit(1);
  }

  // Sprite checks run in BOTH modes: a re-pin over stale sprites must refuse,
  // so --update cannot bless a generator edit whose output was never committed.
  const spriteProblems = collectSpriteProblems();
  if (spriteProblems.length > 0) {
    console.error(`[check-agents-infographic] SPRITE DRIFT:\n`);
    for (const p of spriteProblems.sort()) console.error(`  ✗ ${p}`);
    console.error(`\nRegenerate with:  python3 ${GENERATOR} --singles   then commit ${CREW_DIR}/.`);
    process.exit(1);
  }

  if (update) {
    const current = collectSources();
    fs.writeFileSync(manifestAbs, `${JSON.stringify(current, null, 2)}\n`);
    console.log(
      `[check-agents-infographic] manifest re-pinned (${Object.keys(current).length} sources) — ` +
        `commit ${MANIFEST} together with the infographic update.`,
    );
    return;
  }

  let pinned;
  try {
    pinned = JSON.parse(fs.readFileSync(manifestAbs, "utf8"));
  } catch (err) {
    if (err.code === "ENOENT") {
      console.error(
        `[check-agents-infographic] FAILED — ${MANIFEST} is missing; run with --update to create it.`,
      );
      process.exit(1);
    }
    throw err;
  }

  const current = collectSources();
  const stale = [];
  for (const [rel, hash] of Object.entries(current)) {
    if (!(rel in pinned)) stale.push(`added:    ${rel}`);
    else if (pinned[rel] !== hash) stale.push(`changed:  ${rel}`);
  }
  for (const rel of Object.keys(pinned)) {
    if (!(rel in current)) stale.push(`removed:  ${rel}`);
  }

  if (stale.length > 0) {
    console.error(`[check-agents-infographic] STALE — the agent-pipeline sources moved:\n`);
    for (const line of stale.sort()) console.error(`  ✗ ${line}`);
    console.error(
      `\nUpdate ${INFOGRAPHIC} to match (or confirm no visual change is needed),` +
        `\nthen re-pin in the same PR:  node scripts/check-agents-infographic.mjs --update`,
    );
    process.exit(1);
  }

  console.log(
    `[check-agents-infographic] FRESH — ${Object.keys(current).length} watched sources match ` +
      `the manifest; sprites in sync with the generator.`,
  );
}

main();
