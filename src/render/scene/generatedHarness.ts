import type { LevelConfig } from "@game/levels/levels";
import { GENERATED_LEVEL_CONFIGS } from "@game/levels/generated";

/**
 * Generated-level reachability seam (spec-level-harness-sp1 §8) — the sibling of
 * `resolveBossPreviewLevel` for harness-generated levels: `?preview=level&level=<id>`
 * boots straight into PLAYING on that level so a headless run (or Bertrand, on a
 * branch preview) can verify a generated candidate that is DELIBERATELY absent from
 * the menu (`LEVELS` is the shipped campaign — ADR-0073 §6).
 *
 * Reachability discipline, same as the boss seam (ADR-0051 D4 / E9): the lookup is
 * restricted to `GENERATED_LEVEL_CONFIGS`, so a SHIPPED level id yields null and the
 * campaign is never URL-bootable through this path. Persistence stays inert via
 * App's existing `PREVIEW_SCREEN !== null` guard, plus the LEVELS-membership guard
 * (a generated level is not in `LEVELS`, so score/unlock writes skip it anyway).
 * Intentionally NOT `import.meta.env.DEV`-gated, like `?preview=boss`, so branch
 * previews can exercise it. Pure — takes the search string, touches no `window`.
 */
export function resolveGeneratedPreviewLevel(search: string): LevelConfig | null {
  const id = new URLSearchParams(search).get("level");
  if (id === null) return null;
  return GENERATED_LEVEL_CONFIGS.find((l) => l.id === id) ?? null;
}
