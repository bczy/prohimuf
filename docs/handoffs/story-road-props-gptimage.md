# Story — road-prop art remake via the gptimage pipeline

Re-skin the 8 near-foreground road-prop kinds (ADR-0047/0048, PR #76) — currently drawn
PROCEDURALLY in Canvas2D (`src/render/scene/nearForegroundArt.ts`) — as generated raster art
via the gptimage asset harness (`scripts/gen-gptimage-asset.mjs`), the same pipeline already
used for the enemy family, vehicles, courier and the hostage girl (commits `8ca0975`, `df8144d`,
`3a76277`, `a3dcc37`). Branch `claude/road-props-gptimage-remake` (from `origin/main`).

## 0. PM — pm (John) — 2026-07-19

- claim: scope + author the story for Bertrand's request to remake all road props (feu,
  poteau, etc.) with the new pipeline, referenced properly.
- release: **DRAFT story written.** Scope guard verdict = **faithful décor re-skin of
  already-gated behaviour, not a new extension** (see cahier-des-charges note below) — pre-authorized
  by Bertrand, not a scope question. The 8 kinds in play: `parkingMeter` (horodateur), `lamppost`
  (réverbère), `wallaceFountain` (fontaine Wallace), `trafficLight` (feu tricolore — animated,
  carries the sole art exception to the C1 grey-only décor law: coloured lit lens + halo),
  `bollard` (potelet), `scooter` (mobylette parked — DECOR, not the interactive delivery vehicle),
  `bench` (banc), `streetSign` (panneau).

### Story statement

As a player moving through the Parisian street levels, I want the near-foreground road props
(feu tricolore, horodateur, réverbère, fontaine Wallace, potelet, scooter, banc, panneau) to
carry the same "clean bold comic book ink illustration, three-tone cel shading" house look
already shipped for enemies/vehicles/courier/hostage, instead of the current procedurally-drawn
grey silhouettes, so the near-foreground layer reads as one coherent asset family rather than a
visibly different production technique.

### Acceptance criteria

1. **AC1 — all 8 kinds replaced.** Every `NearForegroundKind` (`parkingMeter`, `lamppost`,
   `wallaceFountain`, `trafficLight`, `bollard`, `scooter`, `bench`, `streetSign`) is drawn from
   a gptimage-generated, chroma-keyed transparent PNG (house tail: comic-book ink illustration,
   three-tone cel shading, `#FF3CDC` magenta chroma ground) instead of the current Canvas2D
   procedural draw, at the texture sizes the render layer already uses (512px height, per-kind
   aspect from `NEAR_KIND_SPECS`).
2. **AC2 — grey-décor law upheld (C1).** Every non-`trafficLight` prop stays monochrome/grey —
   "ce qui brille est interactif, ce qui est gris est décor" (guidelines §5) and ADR-0047's C1
   condition. The gptimage harness already desaturates non-chroma pixels to luma by default
   (`keyAndDown`, `gen-gptimage-asset.mjs`) unless `--keepcolor` is passed — do **not** pass it
   for these props. No baked-in neon rim/glow on any of the 7 grey kinds.
3. **AC3 — traffic-light animation preserved.** The `trafficLight` interlock (vehicle/pedestrian
   phase clock, `src/render/scene/trafficSignal.ts`, fully unit-tested, zero gameplay hook) is
   untouched. Its generated art covers the STATIC housing/mast/unlit-lens geometry; the coloured
   lit lens + halo (the one Bertrand-directed colour exception) stays a **render-side overlay**
   drawn/composited on top of the generated base per phase change — it must NOT be baked into a
   single static generated frame, or the signal can no longer animate. In-place repaint
   (`updateTrafficLightSignal` in `nearForegroundTextures.ts`) keeps working for whichever layer
   carries the lens.
4. **AC4 — procedural draw kept as fallback.** `nearForegroundArt.ts` / `drawNearForegroundObject`
   is NOT deleted. It remains the fallback render path while a generated texture is
   loading (or if a generated asset is missing/fails to load), the same defensive pattern already
   used elsewhere in the asset pipeline — a prop must never render blank/missing.
5. **AC5 — zero gameplay change.** No change to `src/game/**`, to prop placement/count/density,
   scale, parallax factor, the non-occlusion band calculation (`nearForegroundBandTop`), the
   mobile density halving, or the traffic light's deliberate non-occlusion exception
   (`TRAFFIC_LIGHT_H_FRAC`). This is an asset-source swap in `src/render` only. Silhouette
   footprint (`aspect`/`heightFrac` per kind in `NEAR_KIND_SPECS`) is preserved unless the
   generated art forces a documented retune, coordinated with `senior-architect`.
6. **AC6 — interactive vehicle class untouched.** The decorative `scooter` prop (parked mobylette,
   near-foreground décor) is redone under this story, but the **interactive** delivery-vehicle /
   courier sprites (already gptimage-migrated separately, commits `df8144d`/`3a76277`) are out of
   scope. The decorative scooter must stay visually distinct from the interactive vehicle class —
   no render-side neon rim, no "deliver here" affordance (carries forward condition C2 from the
   near-foreground-parallax design gate).
7. **AC7 — gates passed.** `lead-art` prompt gate PASS on the 8 prompts before generation; asset
   composite/magenta-spill sweep at game size before merge (same blocking gate class used for the
   enemy chroma migration — a colour fringe surviving the key is a hidden defect until keyed).
8. **AC8 — both device classes verified.** `qa-lead`-orchestrated VERIFY confirms the swapped
   props read correctly (recognizable silhouette, correct scale, no clipping into window rows) on
   desktop and mobile, plus `tsc`/`vitest`/`lint` green and no visual/perf regression on the
   near-foreground layer (`gpu-specialist` perf note if texture count/size materially changes).

### Non-goals

- No new prop kinds and no change to the 8-kind roster.
- No gameplay, placement, density, scale, parallax-factor, or non-occlusion-band logic changes —
  this story never touches `src/game/**`.
- No touching the interactive delivery-vehicle / courier sprites — those are a separate,
  already-shipped gptimage migration.
- No re-litigating the traffic light's ADR-0047 non-occlusion exception or its phase-clock
  behaviour — only its art SOURCE changes, not its rules.
- No new interactive/hit-testable objects; all 8 kinds remain plain, non-target décor meshes.

### Cahier-des-charges note

Prohibition (Atari ST, 1987) never had painterly generated street props, but that question was
already settled: the near-foreground road-prop LAYER itself is ADR-0047's conscious, documented,
justified extension (PM-accepted, design-gate PASSED, shipped in PR #76) serving the Paper Mario
depth language. This story does not reopen that gate — it is a **faithful re-skin of already-gated
behaviour**: swapping the production technique (procedural Canvas2D → the gptimage pipeline now
standard for every other character/vehicle asset family) for visual consistency, with zero verb
added and zero rule changed. Bertrand pre-authorized the remake explicitly; scope is not in
question here.

### Lane note

Touches `src/render/scene/{nearForegroundArt.ts,nearForegroundTextures.ts,NearForeground.tsx}`
(asset-loading path for the new textures + the traffic-light overlay split) **and**
`scripts/**` (8 new `gen-gptimage-asset.mjs` invocations + prompts/manifest entries) — crosses
the render/tooling boundary, so per `COLLABORATION.md` this needs `senior-architect` lane
assignment (TECH PLAN) before dev lanes open, likely `dev-r3f-render` ∥ `dev-tooling-assets`
with `concept-artist` (prompts) → `lead-art` (prompt gate) ahead of generation.

- next: hand to `senior-architect` (Winston) for TECH PLAN + lane assignment (and ADR-number
  allocation via `producer` if the traffic-light overlay split is judged boundary-affecting
  enough to warrant one — flagging, not deciding, that call).

## 1. Lead-art PROMPT GATE — lead-art (Nico) — 2026-07-19

- claim: gate the 8 road-prop prompts (concept-artist draft + game-graphist preprod) for AC7.
- release: **PROMPT GATE PASS — 8/8**, verdict written into `docs/art/prompts-road-props.md`
  (§ "Lead-art gate"). Accepted the shared opening + tail (house-style/C1/no-text compliant),
  all 6 OK-with-edits clauses and both RISK rewrites (wallaceFountain caryatids, bench slats);
  two minor lead-art tightenings (wallace "column"→closed silhouette per the single-column
  piège; trafficLight visor-lip highlight promoted for dark-mass family consistency; bench
  scrollwork-solid clause added). Open items decided: scooter top-box **DROP** (distinct from
  interactive moto, AC6/§2 law3), streetSign **KEEP post** (kerb placement fixed), ped lens
  anchors = render-lane tune at Gate 4. The 8 FINAL strings + FINAL opening/tail in that file
  are the verbatim tooling contract for `nearForegroundArt` (replace the tech-plan skeleton
  placeholders). No re-draft requested. **Still owed by lead-art, downstream:** asset gate on
  the keyed PNGs + composite gate on the trafficLight lit-lens overlay (§2.1) — neither
  covered by this prompt-gate PASS.
- next: `dev-tooling-assets` copies the gated strings into `levelArt.json`; generation lane.

## 2. DEV (tooling lane) — dev-tooling-assets (Amelia) — 2026-07-19

- claim: tooling-lane half of the tech plan (dev-tooling-assets brief,
  `docs/handoffs/tech-plan-road-props.md`) — the gptimage lib refactor, the
  `gen-nearfg-sprites.mjs` generator, both art gates, the CI workflow +
  dispatch marker, and the `nearForegroundArt` block in `levelArt.json`.
  Non-overlapping with the concurrent `dev-r3f-render` lane (render/scene +
  `levelArt.ts`), per Decision 5.
- release: **DONE, `tsc`/`vitest` (740 tests)/prettier all green.**
  `scripts/lib/gptimage.mjs` (new — `readToken` env→legacy-file→throw,
  `genUrl`/`fetchImg`/`withRetry`, `cropRectForAspect` + `keyAndDown`
  parameterized for non-square targets, `cyanPreviewCanvas`);
  `scripts/gen-gptimage-asset.mjs` is now a thin CLI over it (same flags,
  behaviour-compatible); `scripts/gen-nearfg-sprites.mjs` (new — reads
  `nearForegroundArt`, only-missing/`FORCE`/`--asset`/`--list`, skips any
  kind whose prompt is still empty with a loud warning, luma-desaturation
  always on); `scripts/check-art-prompts.mjs` `--set nearForeground` (new —
  required-token style-tail check, per-kind asset/seed/size shape,
  negation-only budget scoped to `opening+prompt` — the frozen style tail's
  own required "no X" boilerplate is excluded from the negation count, and no
  FLUX word-count ceiling is applied since gptimage is a different, more
  instruction-adherent model the concept-artist prompts are deliberately
  longer for); `scripts/check-nearfg-style.mjs` (new — mean-saturation +
  non-empty-silhouette pixel gate, standalone rather than a
  `check-sprite-style.mjs` mode since that script's config is vehicle-
  specific); `.github/workflows/gen-nearfg-sprites.yml` + the
  `.github/dispatch/gen-nearfg-sprites` marker (modeled on
  `gen-vehicle-sprites.yml`: prompt gate → `FORCE=1` generation → style gate
  with bounded regen retry → commit). `levelArt.json`'s `nearForegroundArt`
  block carries the lead-art-**gate-FINAL** strings (§1 above) copied
  verbatim — not placeholders (the gate landed mid-session; the `lenses`
  anchors stay the tech-plan Decision-1 seed values, tuned render-side at
  Gate 4). Unit tests: `scripts/lib/__tests__/gptimage.test.mjs`,
  `scripts/__tests__/{check-art-prompts,gen-nearfg-sprites,check-nearfg-style}.test.mjs`.
  Did NOT touch `src/render/**` or `src/game/levels/levelArt.ts`. Did NOT run
  any generation locally (no token in this sandbox) — verified by unit tests
  - `--list`/dry-run only.
- next: `dev-r3f-render`'s half (texture loading/overlay split/accessors);
  once both land, the asset gate on the keyed PNGs + the trafficLight
  composite gate (owed by lead-art, not covered by the prompt-gate PASS) run
  after CI generates real art — dispatch via
  `date > .github/dispatch/gen-nearfg-sprites && git add .github/dispatch/gen-nearfg-sprites && git commit -m "ci(dispatch): gen-nearfg-sprites" && git push`.

## Verify (fallback path, 2026-07-19)

Browser run on the branch (vite dev, Belliard): scene renders with zero console
errors; procedural fallback props on the kerb (lamppost, bench, bollard…); feu
tricolore composite CONFIRMED — dead-lens housing + render-side overlay showing
vehicle green (halo) / ped red, HUD timer ticking. Full phase cycle covered by
trafficSignal.test.ts + overlay repaint tests. CI generation attempt failed:
POLLINATIONS_TOKEN repo secret NOT SET (all 8 kinds [fail] "No Pollinations
token") — blocked on Bertrand; workflow re-runs via the dispatch marker once
the secret exists.
