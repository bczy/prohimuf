#!/usr/bin/env node
/**
 * scripts/promote-hero.mjs — promotion mechanics (ADR-0043 §3).
 *
 * Idempotent, reviewable, NETWORK-FREE. Run this ONLY on a recorded `lead-art`
 * `PROMOTE` verdict — NEVER on generation, NEVER on a `FAIL`. It freezes a copy
 * of an already-gated PNG into `references/approved/<family>/<slug>.png`,
 * flips the machine registry (`references/approved/heroes.json`) so the slug
 * becomes the reigning hero for `<family>/<slot>`, and appends/flips the human
 * registry (`references/approved/HEROES.md`). It never generates anything and
 * never triggers a regeneration of the rest of the family (ADR-0043 AC6).
 *
 * Re-running with the SAME slug and the SAME source bytes is a no-op (already
 * promoted). A DIFFERENT source for an EXISTING slug is refused — a new hero
 * always gets a NEW slug; the superseded copy is kept forever (never deleted).
 *
 * Usage:
 *   node scripts/promote-hero.mjs --from <public/assets/…png> \
 *     --family <vehicles|enemies|…> --slot <slot> --slug <slug> \
 *     [--rationale "<one line>"] [--pr "#84"] [--date 2026-07-18]
 *
 * `--pr` defaults to the current commit's short SHA (`git rev-parse --short
 * HEAD`, local — no network); `--date` defaults to today (system clock);
 * `--rationale` defaults to a generic placeholder — fill it in with the actual
 * lead-art reasoning when you can.
 */
import fs from "fs";
import path from "path";
import { spawnSync } from "child_process";
import { fileURLToPath, pathToFileURL } from "url";
import {
  loadHeroRegistry,
  canonicalApprovedPath,
  formatHeroEntry,
  flipHeroStatus,
  HEROES_JSON_REL,
  HEROES_MD_REL,
  WIRED_FAMILIES,
  DEFERRED_FAMILIES,
} from "./lib/heroes.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const LEVEL_ART = path.resolve(ROOT, "src/game/levels/levelArt.json");

// --family and --slug become PATH segments (references/approved/<family>/<slug>.png),
// so they stay strictly alnum/hyphen (no `_`, `/`, `.`, `..`) — path-safe.
export const SLUG_RE = /^[a-z0-9][a-z0-9-]*$/i;
// --slot is a REGISTRY KEY (heroes.json[family][slot], mirroring a levelArt.json key
// like `enemy_shooting_2`), never a path segment — so it must allow underscores.
export const SLOT_RE = /^[a-z0-9][a-z0-9_-]*$/i;

function parseArgs(argv) {
  const args = argv.slice(2);
  const get = (flag) => {
    const i = args.indexOf(flag);
    if (i === -1) return null;
    const next = args[i + 1];
    if (next === undefined || next.startsWith("--")) return null;
    return next;
  };

  const from = get("--from");
  const family = get("--family");
  const slot = get("--slot");
  const slug = get("--slug");
  if (!from || !family || !slot || !slug) {
    console.error(
      "usage: node scripts/promote-hero.mjs --from <public/assets/…png> " +
        "--family <family> --slot <slot> --slug <slug> " +
        '[--rationale "<text>"] [--pr "<ref>"] [--date YYYY-MM-DD]',
    );
    process.exit(2);
  }
  for (const [flag, value, re, shape] of [
    ["--family", family, SLUG_RE, "alnum/hyphen only"],
    ["--slot", slot, SLOT_RE, "alnum/underscore/hyphen only"],
    ["--slug", slug, SLUG_RE, "alnum/hyphen only"],
  ]) {
    if (!re.test(value)) {
      console.error(`${flag} must be ${shape}, got "${value}"`);
      process.exit(2);
    }
  }
  // Reject a DEFERRED/non-WIRED family EARLY — before any write — so we never
  // create a heroes.json entry (or a frozen copy) the guard would hard-fail on
  // (ADR-0043 §2, MINEUR-4).
  if (DEFERRED_FAMILIES.includes(family) || !WIRED_FAMILIES.includes(family)) {
    console.error(
      `--family "${family}" is not wired for generation (wired: ${WIRED_FAMILIES.join(", ")}) — ` +
        `promoting here would create a heroes.json entry check-hero-wiring.mjs hard-fails on.`,
    );
    process.exit(2);
  }

  // Contain --from under the repo root (no path escaping via ../..).
  const resolvedFrom = path.resolve(ROOT, from);
  const relFrom = path.relative(ROOT, resolvedFrom);
  if (relFrom.startsWith("..") || path.isAbsolute(relFrom)) {
    console.error(`--from must resolve inside the repo, got "${from}" → ${resolvedFrom}`);
    process.exit(2);
  }

  const rationale =
    get("--rationale") ?? "(promoted — see the lead-art gate review for the full rationale)";
  const pr = get("--pr") ?? defaultCommitRef();
  const date = get("--date") ?? new Date().toISOString().slice(0, 10);

  return { from, family, slot, slug, rationale, pr, date };
}

/** `git rev-parse --short HEAD`, local-only (no network); "unknown" if git is unavailable. */
function defaultCommitRef() {
  const res = spawnSync("git", ["rev-parse", "--short", "HEAD"], { cwd: ROOT, encoding: "utf8" });
  if (res.status === 0 && res.stdout) return res.stdout.trim();
  return "unknown";
}

/** The pinned seed recorded in levelArt.json for this family/slot, or null. */
function seedForSlot(family, slot) {
  const json = JSON.parse(fs.readFileSync(LEVEL_ART, "utf8"));
  const block = json[family];
  const seed = block?.types?.[slot]?.seed ?? block?.layers?.[slot]?.seed;
  return Number.isInteger(seed) ? seed : null;
}

function main() {
  const { from, family, slot, slug, rationale, pr, date } = parseArgs(process.argv);

  // Parses levelArt.json and can throw — call before any write so a malformed
  // source file fails fast, before anything on disk is touched (MINEUR-5).
  const seed = seedForSlot(family, slot);

  const srcFile = path.resolve(ROOT, from);
  if (!fs.existsSync(srcFile)) {
    console.error(`--from file does not exist: ${from}`);
    process.exit(1);
  }
  const srcBuf = fs.readFileSync(srcFile);

  const approved = canonicalApprovedPath(family, slug);
  const destFile = path.join(ROOT, approved);

  if (fs.existsSync(destFile)) {
    const destBuf = fs.readFileSync(destFile);
    const registry = loadHeroRegistry(ROOT);
    const alreadyReigning = registry?.[family]?.[slot]?.slug === slug;
    if (destBuf.equals(srcBuf) && alreadyReigning) {
      console.log(`[no-op] ${family}/${slot} — "${slug}" already promoted and reigning.`);
      return;
    }
    console.error(
      `refusing to overwrite existing slug "${slug}" at ${approved} — ` +
        `a new hero must get a NEW slug (superseded copies are never deleted, ADR-0043 §3).`,
    );
    process.exit(1);
  }

  // 1. Freeze a copy — never regenerates, never touches the --from source.
  fs.mkdirSync(path.dirname(destFile), { recursive: true });
  fs.writeFileSync(destFile, srcBuf);
  console.log(`[copy] ${from} → ${approved} (${srcBuf.length} bytes)`);

  // 2. Append/flip the human registry BEFORE the machine registry (step 3) —
  // if a throw happens between here and step 3, heroes.json (what generators
  // and the guard actually trust) is left un-flipped rather than pointing at
  // a hero HEROES.md never recorded (MINEUR-5).
  const registry = loadHeroRegistry(ROOT);
  const priorSlug = registry?.[family]?.[slot]?.slug ?? null;
  const mdFile = path.join(ROOT, HEROES_MD_REL);
  let md = fs.readFileSync(mdFile, "utf8");
  if (priorSlug && priorSlug !== slug) {
    md = flipHeroStatus(md, family, slot, priorSlug, `SUPERSEDED-by-${slug}`);
    console.log(`[flip]  HEROES.md — ${family}/${slot} "${priorSlug}" → SUPERSEDED-by-${slug}`);
  }
  const entry = formatHeroEntry({ family, slot, slug, seed, pr, date, rationale });
  // Replace the trailing "## Entries" placeholder note (may span lines) if
  // present, else append after the last entry.
  const placeholderRe = /_\(none yet[\s\S]*?\)_\n?/;
  md = placeholderRe.test(md) ? md.replace(placeholderRe, entry) : `${md.trimEnd()}\n\n${entry}`;
  fs.writeFileSync(mdFile, md.endsWith("\n") ? md : `${md}\n`);
  console.log(`[append] HEROES.md — new REIGNING entry ${family}/${slot} — "${slug}"`);

  // 3. Write/flip the machine registry LAST.
  registry[family] = registry[family] ?? {};
  registry[family][slot] = { slug, approved };
  const registryFile = path.join(ROOT, HEROES_JSON_REL);
  fs.writeFileSync(registryFile, `${JSON.stringify(registry, null, 2)}\n`);
  console.log(`[write] ${HEROES_JSON_REL} — ${family}.${slot} → "${slug}"`);

  console.log(`\nDone. "${slug}" is now the reigning hero for ${family}/${slot}.`);
}

const isMain = process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href;
if (isMain) main();
