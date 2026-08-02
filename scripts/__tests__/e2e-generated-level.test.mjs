import { describe, it, expect } from "vitest";
import path from "path";
import { fileURLToPath } from "url";
import { spawnSync } from "child_process";

// Black-box, subprocess-driven exercise of main()'s argv validation (same
// pattern as check-art-prompts.test.mjs / gen-nearfg-sprites.test.mjs's
// main()-level tests) — this is the ONE assertion this driver can make
// without a real browser + a served build (SP2 T6): it fails FAST (before
// ever launching Chromium) on a missing level id, rather than crashing deep
// inside Playwright with a confusing stack.

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SCRIPT = path.join(__dirname, "..", "e2e-generated-level.mjs");

describe("e2e-generated-level.mjs — argv validation (no browser launched)", () => {
  it("fails fast with a usage message when no level id is given", () => {
    const res = spawnSync(process.execPath, [SCRIPT], { encoding: "utf8" });
    expect(res.status).toBe(2);
    expect(res.stderr).toMatch(/Usage: node scripts\/e2e-generated-level\.mjs <levelId>/);
  });
});

/**
 * Les branches AU-DELÀ du garde "pas d'id" (panel #156 run 5, BLOQUANT ×2) : le
 * test d'origine ne franchissait jamais `if (!id)`, si bien qu'un
 * `LEVEL_ID_SHAPE` jamais importé — donc un ReferenceError à CHAQUE invocation
 * réelle, y compris celle que gen-plan-verify.yml dispatche — passait au vert.
 */
describe("e2e-generated-level.mjs — la validation de forme est réellement atteinte", () => {
  it("refuse un id malformé avec le message de forme (jamais un ReferenceError)", () => {
    const res = spawnSync(process.execPath, [SCRIPT, "../evil"], { encoding: "utf8" });
    expect(res.status).toBe(2);
    expect(res.stderr).toMatch(/invalid level id/);
    expect(res.stderr).not.toMatch(/is not defined/);
  });

  it("un id BIEN formé franchit la validation (échoue plus loin, jamais sur une référence manquante)", () => {
    // Pas de serveur ni de build ici : le script doit dépasser la validation puis
    // échouer sur le navigateur/la connexion — ce qui prouve que la ligne
    // LEVEL_ID_SHAPE s'exécute sans exploser.
    const res = spawnSync(process.execPath, [SCRIPT, "fixture"], {
      encoding: "utf8",
      timeout: 60_000,
      env: { ...process.env, PREVIEW_URL: "http://127.0.0.1:1/prohimuf/" },
    });
    expect(res.stderr ?? "").not.toMatch(/is not defined/);
    expect(res.stderr ?? "").not.toMatch(/invalid level id/);
  });
});
