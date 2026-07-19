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
5. **AC5 — zero gameplay change.** No change to prop placement/count/density,
   scale, parallax factor, the non-occlusion band calculation (`nearForegroundBandTop`), the
   mobile density halving, or the traffic light's deliberate non-occlusion exception
   (`TRAFFIC_LIGHT_H_FRAC`). The one sanctioned `src/game` touch (tech plan Decision 5,
   panel finding #7 realignment) is the `nearForegroundArt` DATA block in `levelArt.json`
   plus pure typed accessors in `levelArt.ts` — the same pure-data / pure-accessor pattern
   every other art family uses; no React/Three import enters `src/game`, no rule changes. Silhouette
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
  in `src/game/**` this story only adds the `nearForegroundArt` data block + pure accessors
  (AC5 realignment, panel finding #7); no game rule or placement logic moves.
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

## 2. Panel triage (Winston) — senior-architect — 2026-07-19

Stage-6 gate. The 4-reviewer panel (code-review high · bmad-code-review ·
edge-case-hunter · security-review) ran on `origin/main...HEAD`; findings were
adversarially verified upstream. This is my triage + integration sign-off in one
pass (one read of the diff areas each finding points at). Owners:
**R** = dev-r3f-render, **T** = dev-tooling-assets, **P** = pm, **W** = tech-writer.

### Triage table

| #   | Sev · conv | Verdict          | Prescription → owner                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           |
| --- | ---------- | ---------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | MAJEUR · 3 | **UPHELD**       | `nearForegroundTextures.loadGenerated` swaps the cache entry but `Row` binds `map={getNearForegroundTexture(kind)}` once and the scene never re-renders on that swap → a PNG that resolves after mount is **never shown**; the swap also `dispose()`s the procedural `CanvasTexture` still bound to the live material. Fix: per-frame cache re-read in `Row` à la `EnemySprite.tsx:169-172` (read texture in `useFrame`, assign `material.map` + `needsUpdate` only when it changes) **and drop the in-use `dispose()`** (release nothing still bound). Keep `warm` non-blocking (tech-plan invariant "never stall"). **Latent in the current art-less state** (all PNGs 404 → `failed` → procedural), **fatal the moment art lands**. → **R** |
| 2   | MINEUR · 3 | **UPHELD**       | `trafficLightLenses()` guards only `=== undefined`, so a JSON `"lenses": null` reaches `sanitizeAnchors(null.vehicle,…)` → TypeError; `isFiniteAnchor` accepts negative `rx/ry` → `ellipse`/`createRadialGradient` `IndexSizeError` inside the `useFrame` repaint. Fix: guard `lenses == null` (both), and require `rx > 0 && ry > 0` in `isFiniteAnchor`. Contract = malformed ⇒ null/fallback. Latent (committed lenses are well-formed). → **R**                                                                                                                                                                                                                                                                                            |
| 3   | MINEUR · 2 | **UPHELD**       | `levelArt.json` `trafficLight.size.width` = **226**, but `round(512×0.44)=225` (`NEAR_KIND_SPECS.trafficLight.aspect`). Slip originated in my tech-plan line 71 — my error, corrected here. Housing PNG (226) vs overlay canvas (225, sized from `NEAR_KIND_SPECS`) → sub-pixel lens misalignment + 0.3% housing distortion. Fix: 226 → 225. → **T**                                                                                                                                                                                                                                                                                                                                                                                           |
| 4   | MINEUR · 2 | **UPHELD**       | The `nearForegroundArt.consistency` test my tech plan promised (and the JSON `$comment` claims as the pin) **does not exist** — proven by #3 slipping through. `levelArt.consistency.test.ts` covers only `enemies`/`courier`. Add: for every `NEAR_KIND_SPECS` kind, `types[kind]` exists, `asset === assets/nearfg/<kind>.png`, `size.height === 512`, `size.width === round(512×aspect)`. Land **after** #3 (else it red-flags 226). → **R**                                                                                                                                                                                                                                                                                                |
| 5   | MINEUR · 2 | **UPHELD**       | Workflow L104-106 `git add -f public/assets/nearfg/*.png` also commits the 8 `<kind>_cyan.png` review previews into `public/` → shipped in the bundle. Fix: write previews outside the committed dir (`$RUNNER_TEMP`) **or** enumerate the 8 final basenames **or** `git reset -q public/assets/nearfg/*_cyan.png` before commit. Must land **before** the token-enabled dispatch. → **T**                                                                                                                                                                                                                                                                                                                                                     |
| 6   | MINEUR · 2 | **UPHELD**       | `gen-nearfg-sprites.mjs`: `readToken()` throws **inside** `generateOne`, caught by the per-kind `try/catch` (exit 0) → the missing token is misdiagnosed 2 steps later as a style-gate failure; with sprites already committed, `FORCE=1` re-dispatch without a token is a **silent green no-op** (old art re-passes). Fix: call `readToken()` **once at the top of `main()`** (fail fast, non-zero, clear message) before the loop; keep per-kind catch for transient network only. Before dispatch. → **T**                                                                                                                                                                                                                                  |
| 7   | MINEUR · 1 | **UPHELD (doc)** | Story AC5 / non-goals "no change to `src/game/**`" contradicts the architect-sanctioned `levelArt.ts`/`levelArt.json` additions (Decision 5 seam). Reword to the real law: _no gameplay/placement change; the sanctioned exception is the `nearForegroundArt` data block + typed accessors — the same pure-data / pure-accessor pattern every other art family already uses, with `src/game` importing no React/Three._ Boundary law is **intact** (see integration review). → **P**                                                                                                                                                                                                                                                           |
| 8   | MINEUR · 1 | **UPHELD (doc)** | `docs/art/prompts-road-props.md` ends with leaked `</content></invoke>` tool-call markup after the 8/8 PASS. Strip the two trailing lines. → **W**                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             |
| 9a  | NIT · 1    | **UPHELD**       | `loadGenerated` lacks the non-DOM guard `ensureProcedural` has → `loader.load` touches `document` in a non-DOM context. Add `if (typeof document === "undefined") return;` at the top. Fold into #1. → **R**                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   |
| 9b  | NIT · 1    | **UPHELD**       | `updateTrafficLightSignal` docstring "No-op if unchanged" is false (it repaints every call; the change-gate is in `NearForeground`). Fix the docstring (or add the unchanged guard). → **R**                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   |
| 9c  | NIT · 1    | **UPHELD**       | `check-nearfg-style.mjs:145` `args[fi+1]` undefined when `--file` is the last arg → `path.resolve(…, undefined)` TypeError. Guard the missing value. Operator-only; optional. → **T**                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          |
| 9d  | NIT · 1    | **UPHELD (low)** | `gptimage.fetchImg` re-sends `Authorization: Bearer` across cross-host redirects (L74-76). Upstream (Pollinations) controlled, low exposure; one-line same-host check before forwarding the header. → **T**                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    |
| 9e  | —          | **ACCEPT-AS-IS** | `MIN_CONTENT_PCT=1` — a 1% floor guards the empty-key failure; no committed prop silhouette lands near it. Retune at the art gate if a legit thin prop trips it. → monitor **T**                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                               |
| 9f  | —          | **ACCEPT-AS-IS** | Same-seed style-gate retry "burning" premium generations — bounded to 2, then the job fails and uploads artifacts for lead-art. Varying the seed would change reviewed art. Acceptable as bounded.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             |
| 9g  | —          | **ACCEPT-AS-IS** | Missing-`size` default 256×512 distortion is local-run-only on malformed JSON; the committed block is complete and #4's consistency test now pins presence.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    |

No finding **rejected** outright. Every UPHELD item is small and single-lane;
render vs tooling vs docs paths do **not** overlap → the fixes fan out in parallel
(#1/2/4/9a/9b to **R**, #3/5/6/9c/9d to **T**, #7 to **P**, #8 to **W**), no
serialisation needed except #4 landing after #3.

### Integration review

**Boundary law — INTACT.** The seam I sanctioned in the tech plan (Decision 5)
holds as built: `levelArt.ts` (in `src/game/`) gains only pure types + pure
accessors (`nearForegroundArtAsset`, `trafficLightLenses`) reading untyped JSON —
no React, no Three. `levelArt.json` is pure data. The render side
(`nearForegroundTextures.ts`) imports **from** `@game/levels/levelArt` — render
depending on game is the allowed direction; game imports nothing render/Three.
The traffic-light overlay split kept all rules (`trafficSignal` clock, placement,
non-occlusion caps, parallax) in code, byte-for-byte — confirmed unchanged. So
AC5's wording (#7) is over-strict, not a real breach: the law is "game never
imports React/Three", and it does not.

**Seams.** The two-lane split ran clean on non-overlapping files (tooling wrote
`levelArt.json` + `scripts/**`; render wrote `levelArt.ts` + `scene/**`). The one
frozen-contract slip (#3, the 226/225 aspect) is exactly what the promised
consistency test (#4) existed to catch — its absence is the root cause, so #4 is
the durable fix, #3 the immediate one. The `nearfg:<kind>` manifest scheme was
retained as designed (Decision 2) — the guaranteed synchronous procedural
fallback is real and VERIFY-confirmed.

**Deps / deploy.** No new runtime dependency. New CI lane
(`gen-nearfg-sprites.yml`) is premium-Pollen and correctly main-guarded
(`branches-ignore: [main]` + `ci(dispatch):` head-commit gate + `ref_name != main`).
Two deploy defects gate the FIRST real generation: #5 (ships `_cyan` previews into
the bundle) and #6 (token failure misdiagnosed / silent no-op). Both must land
before the token-enabled re-dispatch.

**ADR.** ADR-0049 (generated-with-procedural-fallback, amends ADR-0047) is present
and referenced consistently across `levelArt.ts`/`textures`/JSON. Number was
allocated via the proper channel — good.

**Merge-hygiene BLOCKER (scope).** The branch top commit
`9f8ae13 refactor(render): extract inline styles to CSS modules` is a broad
`src/render/ui/**` + `src/catalog/**` CSS-Modules migration (hud-css / ADR-0046
territory) with **no relationship to road-props** and **not covered by this
panel** — every finding above is road-props. Merging this branch as-is would push
an un-panel-reviewed migration to `main` under the road-props gate. It must be
**split to its own branch + its own review panel** (or, if already reviewed
elsewhere, that review recorded) before this branch merges. This is not a
road-props defect; it is a gate-integrity blocker. → **producer** to split /
sequence.

### Verdict

**(a) Current code-ahead-of-art state — NO-MERGE, on hygiene + docs only.**
The road-props code itself is sound in the art-less state: every PNG 404s →
`failed` → procedural, VERIFY confirmed zero console errors and a working feu
composite. No CONFIRMED blocking/major finding manifests in the running current
state (the MAJEUR #1 is latent until art lands). Blockers to clear before this
branch may merge:

1. Split out the unrelated CSS-Modules migration commit `9f8ae13` (producer).
2. Strip leaked markup (#8, W) and realign AC5/non-goals wording (#7, P).
3. Recommended in the same pass (all small, single-lane, non-overlapping): fold
   the render fixes #1/#2/#9a/#9b (R) and the tooling fixes #3/#6/#9c/#9d + test
   #4 (R, after #3) so the branch merges already-correct rather than trailing a
   fix lane.

**(b) Before the CI art dispatch (token-enabled re-dispatch that generates +
commits real PNGs) — HARD GATE, must all be true:**

1. **#1 fixed** (per-frame re-read + no in-use dispose) — else generated art
   never displays and the story fails silently. Non-negotiable.
2. **#3 + #4** landed (aspect 225 + consistency test) so housing/overlay align
   and the pin can't regress.
3. **#5 + #6** fixed (no `_cyan` previews shipped; fail-fast on missing token) —
   else the first real dispatch ships previews and/or greens silently.
4. **#2** fixed (defensive lens hardening) — cheap, prevents a hand-edit crash.
5. Re-run **VERIFY on both device classes with real art**, plus the lead-art
   **asset gate** (magenta-spill sweep) and the **composite gate** on the
   trafficLight lit-lens overlay — both explicitly still owed (§1), neither
   covered by the prompt-gate PASS.

Once (a)'s blockers clear, the code-ahead-of-art branch is mergeable; the art
itself does not merge until every (b) condition is met and re-verified.

— Winston, panel triage + integration sign-off

## 3. Fix lane — dev-tooling-assets (Amelia) — 2026-07-19

- claim: my share of the panel triage — #3, #5, #6, #9c, #9d, #9f (7 items in
  the coordinator's numbered list). Non-overlapping with the concurrent
  render-lane fixes (#1/#2/#4/#9a/#9b, `src/render/**` + `levelArt.ts`).
- release: **DONE, `tsc`/`vitest` (771 tests)/`lint`/prettier all green,
  `check-art-prompts.mjs` PASSED.**
  - **#3** `trafficLight.size.width` 226→**225** (`round(512×0.44)`) in
    `levelArt.json`, `tech-plan-road-props.md` (schema block + prose, with a
    correction note), `scripts/lib/__tests__/gptimage.test.mjs`,
    `scripts/__tests__/gen-nearfg-sprites.test.mjs`.
  - **#5** `gen-nearfg-sprites.yml`: after `git add -f`, `git reset -q` the
    `*_cyan.png` review previews so they never land in `public/` (the Vite
    bundle) — they stay on disk untracked, still caught by the existing
    failure-path `actions/upload-artifact` step for lead-art review.
  - **#6** `gen-nearfg-sprites.mjs`: `readToken()` now called ONCE in `main()`
    before the loop — but ONLY when at least one kind in this run will
    actually attempt generation (not skip-eligible, not empty-prompt) — and
    left to throw uncaught (fatal, non-zero exit, clear message) instead of
    being swallowed per-kind by the try/catch two steps later as a misleading
    "will be generated in CI" / silent-green `FORCE=1` no-op. The per-kind
    catch now guards transient network failures only.
  - **#9c** `check-nearfg-style.mjs`: `--file` with a missing/flag-shaped
    value now emits `--file requires a path` (exit 2) instead of a raw
    `path.resolve(…, undefined)` TypeError. Also hardened the fail-list
    contract both sides: the checker resets `--fail-list` to EMPTY as the
    very first statement in `main()` (never leaves a STALE list from an
    earlier run if this run crashes before finishing), and the workflow's
    retry loop now aborts with a clear `::error::` (instead of a raw bash
    redirection failure) if the fail-list is somehow still missing after a
    failed check.
  - **#9d** `gptimage.mjs` `fetchImg`: the `Authorization: Bearer` header is
    now dropped on any redirect whose host differs from the ORIGINAL
    request's host (mirrors `lib/pollinations.mjs`'s `authHeaders` same-host
    guard) — same-host redirects keep the header.
  - **#9f** (NIT, accepted trade-off — no code change): added a comment in
    the workflow acknowledging that the pinned-seed retry only repairs
    missing-file network flakes, not deterministic style-gate failures (which
    would just re-roll the same result and burn Pollen twice before the
    bounded retry gives up) — a seed bump on retry was rejected as it would
    silently swap in un-reviewed art instead of surfacing the failure.
  - **Bonus (not in the coordinator's list, same file/root cause as #6):**
    `gen-nearfg-sprites.mjs`'s `loadNearForegroundArt()` now throws fatally on
    a missing/invalid per-kind `size` instead of silently defaulting to
    256×512 — matches the coordinator's item 5 (the prompt gate already
    errors on this in CI; the generator is now honest standalone too).
  - New/extended tests: same-host vs cross-host redirect Authorization
    (`gptimage.test.mjs`), fatal-size and fail-fast-token subprocess tests
    (`gen-nearfg-sprites.test.mjs`), `--file` usage-error + fail-list-reset
    subprocess tests (`check-nearfg-style.test.mjs`).
  - Did NOT touch `src/render/**` or `src/game/levels/levelArt.ts` (render
    lane concurrent on the same working tree — confirmed via `git diff --stat`
    scoped to my paths only).
- next: once the render lane's #1/#2/#4/#9a/#9b land, re-run VERIFY + the
  lead-art asset/composite gates per Winston's (b) hard gate before the
  token-enabled CI dispatch.
