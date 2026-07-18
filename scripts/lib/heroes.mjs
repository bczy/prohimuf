/**
 * Shared hero-registry helpers (ADR-0043 — validated-reference promotion loop).
 *
 * The reigning hero for a family/slot is resolved from the machine registry
 * `references/approved/heroes.json` (`family → slot → { slug, approved }`), the
 * ONLY file the generators consume for this — `references/approved/HEROES.md`
 * is the human trace, cross-validated against this registry by
 * `scripts/check-hero-wiring.mjs`, never parsed by a generator. Absent or empty
 * `heroes.json` ⇒ no heroes ⇒ every generator behaves exactly as it does today
 * (ADR-0043 AC4).
 *
 * `heroRawUrl` generalizes `frame1RawUrl` (previously private to
 * gen-enemy-types.mjs) to any frozen `references/approved/**` path, so the
 * enemy generator, the vehicle generator and the CI guard all resolve a raw
 * URL through the exact same builder and cannot silently diverge.
 *
 * `parseHeroesMd` / `formatHeroEntry` / `flipHeroStatus` are the shared
 * read/write contract for the human registry `HEROES.md`, so
 * `scripts/promote-hero.mjs` (writer) and `scripts/check-hero-wiring.mjs`
 * (reader) can never disagree on what the markdown means.
 */
import fs from "fs";
import path from "path";

export const HEROES_JSON_REL = "references/approved/heroes.json";
export const HEROES_MD_REL = "references/approved/HEROES.md";

// Families v1 actually wires generation for (ADR-0043 §2).
export const WIRED_FAMILIES = ["vehicles", "enemies"];
// Families a machine `heroes.json` entry is a HARD ERROR for (ADR-0043 §2) — a
// human HEROES.md record is still fine, just no machine registry entry.
export const DEFERRED_FAMILIES = ["levels", "courier"];

/** Read references/approved/heroes.json under `root`; `{}` when absent/empty. */
export function loadHeroRegistry(root) {
  const file = path.join(root, HEROES_JSON_REL);
  if (!fs.existsSync(file)) return {};
  const raw = fs.readFileSync(file, "utf8").trim();
  if (!raw) return {};
  let parsed;
  try {
    parsed = JSON.parse(raw);
  } catch (err) {
    throw new Error(`${HEROES_JSON_REL} is not valid JSON: ${err.message}`);
  }
  if (parsed === null || typeof parsed !== "object" || Array.isArray(parsed)) {
    throw new Error(`${HEROES_JSON_REL} must contain a JSON object, got ${JSON.stringify(parsed)}`);
  }
  return parsed;
}

/** The reigning hero `{ slug, approved }` for family/slot, or null when none declared. */
export function heroForSlot(registry, family, slot) {
  return registry?.[family]?.[slot] ?? null;
}

/**
 * Raw githubusercontent URL for a committed file at `{ repo, sha }` — the
 * kontext `image=` source Pollinations fetches server-side. Generalizes the
 * enemy generator's `frame1RawUrl(key)` (which now calls this with
 * `public/assets/<key>.png`) to any repo-relative path, in particular a frozen
 * `references/approved/<family>/<slug>.png` hero.
 */
export function heroRawUrl(approvedPath, { repo, sha }) {
  return `https://raw.githubusercontent.com/${repo}/${sha}/${approvedPath}`;
}

/** The canonical frozen-copy path for a promoted hero (ADR-0043 §1 invariant). */
export function canonicalApprovedPath(family, slug) {
  return `references/approved/${family}/${slug}.png`;
}

/**
 * Resolve `{ repo, sha }` the same way every wired generator and the CI guard
 * do: explicit override wins, else GITHUB_REPOSITORY/GITHUB_SHA (set in CI),
 * else the local-sandbox fallback (harmless — no network there anyway). One
 * function so the generators and the guard can never resolve differently.
 */
export function resolveRepoSha({ repo, sha } = {}) {
  return {
    // `||` (not `??`) on the env var: a set-but-EMPTY GITHUB_REPOSITORY/
    // GITHUB_SHA (e.g. a misconfigured runner) must still fall through to the
    // default, not resolve to "".
    repo: repo ?? (process.env.GITHUB_REPOSITORY || "bczy/prohimuf"),
    sha: sha ?? (process.env.GITHUB_SHA || "main"),
  };
}

// ── HEROES.md (human registry) — shared parse/format contract ────────────────
// Entry block:
//   ### <family>/<slot> — <slug>
//
//   - Path: `references/approved/<family>/<slug>.png`
//   - Family / slot: `<family>` / `<slot>`
//   - Source trace: `levelArt.json` `<family>.<slot>`, pinned seed `<seed>`; commit/PR `<pr>`
//   - Verdict: PROMOTE — lead-art, <date>
//   - Rationale: <rationale>
//   - Status: REIGNING | SUPERSEDED-by-<slug>
const ENTRY_HEADING_RE = /^### (\S+)\/(\S+) — (\S+)\s*$/;
const STATUS_RE = /^- Status: (REIGNING|SUPERSEDED-by-\S+)\s*$/;

/** Parse every hero entry heading + its Status field out of HEROES.md text. */
export function parseHeroesMd(text) {
  const lines = text.split("\n");
  const entries = [];
  let current = null;
  for (const line of lines) {
    const h = ENTRY_HEADING_RE.exec(line);
    if (h) {
      current = { family: h[1], slot: h[2], slug: h[3], status: null };
      entries.push(current);
      continue;
    }
    if (current) {
      const s = STATUS_RE.exec(line);
      if (s) current.status = s[1];
    }
  }
  return entries;
}

/** Render one new REIGNING hero entry block (trailing blank line included). */
export function formatHeroEntry({ family, slot, slug, seed, pr, date, rationale }) {
  const seedStr = seed == null ? "n/a" : String(seed);
  return [
    `### ${family}/${slot} — ${slug}`,
    "",
    `- Path: \`${canonicalApprovedPath(family, slug)}\``,
    `- Family / slot: \`${family}\` / \`${slot}\``,
    `- Source trace: \`levelArt.json\` \`${family}.${slot}\`, pinned seed \`${seedStr}\`; commit/PR \`${pr}\``,
    `- Verdict: PROMOTE — lead-art, ${date}`,
    `- Rationale: ${rationale}`,
    `- Status: REIGNING`,
    "",
  ].join("\n");
}

/** Flip an existing entry's Status line in place (used to mark it superseded). */
export function flipHeroStatus(text, family, slot, oldSlug, newStatus) {
  const heading = `### ${family}/${slot} — ${oldSlug}`;
  const lines = text.split("\n");
  let inBlock = false;
  let flipped = false;
  for (let i = 0; i < lines.length; i++) {
    if (lines[i] === heading) {
      inBlock = true;
      continue;
    }
    if (inBlock && lines[i].startsWith("### ")) break;
    if (inBlock && STATUS_RE.test(lines[i])) {
      lines[i] = `- Status: ${newStatus}`;
      flipped = true;
      break;
    }
  }
  if (!flipped) {
    throw new Error(`flipHeroStatus: no entry found for "${heading}" in HEROES.md`);
  }
  return lines.join("\n");
}
