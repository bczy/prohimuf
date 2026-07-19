# 0049 — Near-foreground props: generated gptimage sprites with procedural fallback

- **Status:** Proposed
- **Date:** 2026-07-19
- **Number:** 0049, self-allocated via the adr-new check (local + index + origin/main max
  = 0048) because no `producer` lane allocated one at story opening; recorded in
  `docs/handoffs/story-road-props-gptimage.md`. Re-check at merge.

## Context

ADR-0047 shipped the near-foreground décor layer with its eight Parisian street-furniture
props (horodateur, réverbère, fontaine Wallace, feu tricolore, potelet, scooter, banc,
panneau) **code-drawn** in Canvas2D (`src/render/scene/nearForegroundArt.ts`), under the
C1 law (décor is grey; the feu tricolore's lit lens is the one directed colour exception,
animated by the `trafficSignal.ts` phase clock). Since then the whole character/vehicle
sprite family migrated to the gptimage pipeline (gptimage-large via Pollinations, flat
magenta #FF3CDC chroma ground, comic-ink three-tone treatment, chroma-key + luma
desaturation) and Bertrand directed the props to follow: same pipeline, reference-grounded
1998 Paris models (`docs/art/references-road-props.md`), prompts gated by lead-art
(`docs/art/prompts-road-props.md`, 8/8 PASS, seeds 6101–6108).

Forces: generation is CI-only (premium token, `POLLINATIONS_TOKEN` secret; no token in
local sandboxes), so committed art can lag the code; the feu tricolore must keep its
render-side animation (a baked lit lens would freeze it); the loading gate must never
stall on a missing PNG; and the game/render boundary law still applies.

## Decision

1. **New top-level `nearForegroundArt` block in `src/game/levels/levelArt.json`** (sibling
   of `vehicles`/`enemies`; distinct from the `levels[].nearForeground` placement layer):
   block-level `opening`/`style` + per-kind `prompt`/`seed`/`asset`
   (`assets/nearfg/<kind>.png`)/`size` (height 512, width = round(512 × aspect) from
   `NEAR_KIND_SPECS`). World sizing and placement stay in code — the block only feeds
   generation and asset lookup.
2. **Generated-with-procedural-fallback textures.** `nearForegroundTextures.ts` builds the
   ADR-0047 procedural CanvasTexture synchronously (the guaranteed fallback), then
   async-loads the generated PNG and swaps the cache entry once on success; 404/absent
   block/non-DOM keep the procedural drawing. The `nearfg:<kind>` manifest scheme and the
   loading-gate contract are unchanged. The procedural drawing code is therefore KEPT, not
   deleted.
3. **Feu tricolore split: dead housing + live overlay.** The generated (and procedural)
   housing is fully grey with dead lenses; the animated coloured lit lens + halo moved to
   a render-side transparent overlay texture repainted per signal phase
   (`drawSignalLenses`), drawn on a co-located mesh. Lens positions come from normalized
   `lenses` anchors in the JSON block (enemy-`muzzle` pattern), null-safe with fixed-
   fraction fallbacks; `trafficSignal.ts` is untouched.
4. **Generation lane.** `scripts/lib/gptimage.mjs` (extracted from
   `gen-gptimage-asset.mjs`): token = `POLLINATIONS_TOKEN` env first, legacy scratchpad
   file fallback, clear throw; non-square targets via square generation + centre-crop.
   `scripts/gen-nearfg-sprites.mjs` reads the block; `.github/workflows/
gen-nearfg-sprites.yml` (dispatch-marker pattern, ADR-0009) generates in CI, runs the
   grey/C1 pixel gate (`check-nearfg-style.mjs`), and commits `public/assets/nearfg/`.
   `check-art-prompts.mjs` gained a `nearForeground` set (no FLUX word budget — gptimage
   is instruction-adherent; negation budget scoped to opening+prompt).

## Consequences

- The eight props inherit the shipped comic-ink family look; art direction consistency
  moves from code to the gated prompt set, iterable per-kind by seed without touching code.
- Two sources of truth per prop (procedural drawing + generated PNG) until the art lands:
  acceptable because the procedural path is the explicit, tested fallback; deleting it
  would re-couple the loading gate to network-generated assets.
- The overlay mesh adds one draw per traffic-light instance (shared texture, negligible);
  housing textures no longer repaint per phase — strictly cheaper than ADR-0047.
- Lens anchors are registration knobs tuned at the art gate after each regeneration (same
  ritual as vehicle `facing` and enemy `muzzle`); a regenerated feu tricolore REQUIRES
  re-tuning them before merge.
- CI-only generation means branches can carry the code with no PNGs; the composite gates
  (lead-art asset pass + lit-lens overlay check) run on the CI-generated commits.
