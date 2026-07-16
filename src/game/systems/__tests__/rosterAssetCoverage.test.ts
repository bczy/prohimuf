import { describe, it, expect } from "vitest";
import { existsSync } from "node:fs";
import { resolve } from "node:path";
import { LEVELS } from "@game/levels/levels";
import { enemyAssetPathsFor } from "@game/systems/assetManifest";

/**
 * Roster → asset coverage gate (ADR-0030 §D3, in the spirit of ADR-0005/ADR-0006).
 *
 * Data/asset coverage only — deliberately DISJOINT from any render test: it never
 * touches Three/R3F, it just asserts that every enemy sprite a PLAYABLE level's
 * roster obliges (via `enemyAssetPathsFor`, the same path builder the preloader and
 * `enemyTextures.fileFor` use) actually ships on disk under `public/assets/`.
 *
 * If a per-kind sprite is missing, `getEnemyTexture` silently serves the plain cop
 * fallback (enemyTextures.ts) — the exact "silent-cop-in-production" trap ADR-0030
 * closes. This test turns that missing file into a red build.
 *
 * Two sanctioned exceptions, and only two:
 *   1. GLOBAL_FALLBACKS — the two committed cop sprites `enemyAssetPathsFor` always
 *      appends. They ship in the repo and are the fallback itself (not a per-kind
 *      sprite), so they are not part of the per-kind coverage claim.
 *   2. PENDING_GENERATION — a DOCUMENTED, TEMPORARY allowlist for a sprite that is
 *      opted into a roster but still being generated in CI (absent from this tree).
 */

// The two global cop fallbacks `enemyAssetPathsFor` unconditionally appends
// (ENEMY_FALLBACKS in assetManifest.ts). Committed, and not a per-kind sprite, so
// excluded from the coverage assertion by design.
const GLOBAL_FALLBACKS: readonly string[] = [
  "assets/enemy_sprite.png",
  "assets/enemy_shooting.png",
];

// ── PENDING-GENERATION ALLOWLIST — TEMPORARY EPIC-DEBT ───────────────────────
// Each entry is a per-kind sprite opted into a level roster whose PNG is generated
// in CI and is not yet committed to this tree, so at runtime it renders as the cop
// fallback. This allowlist keeps the gate green while CI catches up; every skipped
// path is `console.warn`ed below so the debt cannot rot silently.
//
// INVARIANT: this allowlist MUST be empty in steady state. A non-empty entry means
// a rostered kind renders as a plain cop in production. It is now empty: the
// hostage taker is no longer rostered (it drives the cinematic QTE, ADR-0030), so
// `enemy_hostage.png` is a QTE asset checked by the render fallback, not this gate.
const PENDING_GENERATION: ReadonlySet<string> = new Set<string>();

// Coverage applies to shipped, playable levels only — the tutorial stage (kind
// "tutorial") spawns no enemies and carries inert gameplay fields.
const PLAYABLE_LEVELS = LEVELS.filter((l) => l.kind !== "tutorial");

describe("roster asset coverage (ADR-0030 §D3)", () => {
  it("has playable levels to cover (guards against a vacuous suite)", () => {
    expect(PLAYABLE_LEVELS.length).toBeGreaterThan(0);
  });

  for (const level of PLAYABLE_LEVELS) {
    it(`${level.id}: every rostered enemy sprite ships on disk (fallbacks + pending allowlist aside)`, () => {
      const needed = enemyAssetPathsFor(level.id);
      // Sanity: the level actually requires sprites, so the loop below has teeth.
      expect(needed.length).toBeGreaterThan(0);

      for (const path of needed) {
        if (GLOBAL_FALLBACKS.includes(path)) continue;
        if (PENDING_GENERATION.has(path)) {
          console.warn(
            `[roster-asset-coverage] SKIP ${level.id}: ${path} — pending CI generation; ` +
              `renders as cop fallback until committed. This allowlist MUST be empty before the epic closes.`,
          );
          continue;
        }
        // Base-relative ("assets/…") → public/assets/… , mirroring the render lane's
        // BASE_URL prefixing. Missing file ⇒ red build (silent cop fallback averted).
        expect(existsSync(resolve(process.cwd(), "public", path))).toBe(true);
      }
    });
  }
});
