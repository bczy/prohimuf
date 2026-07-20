import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

/**
 * Union-signal reach (ADR-0052 §3, UX spec §3 "every motion consumer, not just a
 * subset"): the three scene-layer JS consumers that used to poll their OWN
 * `matchMedia("(prefers-reduced-motion: reduce)")` must now take the shared derived
 * signal via a `reducedMotion` prop (App `useReducedMotionRoot` → GameScene → here),
 * so the in-app MOUVEMENT RÉDUIT toggle reaches them too. A source assertion (comments
 * stripped so the "no private matchMedia poll" prose doesn't self-trip) pins that no
 * private poll remains and the prop is consumed — the light-weight house pattern
 * (mirrors bossQteSystem's determinism-law source check), no DOM harness.
 */
const FILES = ["NearForeground.tsx", "HostageQteSprite.tsx", "BossQteSprite.tsx"] as const;

describe("reduced-motion union reaches every scene consumer", () => {
  for (const file of FILES) {
    it(`${file} takes the reducedMotion prop and no longer polls matchMedia`, () => {
      const src = readFileSync(resolve(process.cwd(), "src/render/scene", file), "utf8")
        .replace(/\/\*[\s\S]*?\*\//g, "")
        .replace(/\/\/.*$/gm, "");
      // No private OS poll: the shared union signal is the ONE authority.
      expect(src).not.toMatch(/matchMedia\s*\(/);
      expect(src).not.toContain("prefers-reduced-motion");
      // The shared signal arrives as a prop and is consumed.
      expect(src).toMatch(/reducedMotion/);
    });
  }
});
