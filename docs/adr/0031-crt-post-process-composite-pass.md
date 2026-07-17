# 0031 — CRT post-process as a hand-rolled multi-pass composite (no postprocessing dep)

- **Status:** Accepted
- **Date:** 2026-07-16

## Context

Bertrand asked for a CRT-TV post-process over the in-game world
(`story-crt-post-process.md`). `lead-art` §8 ("Le grain cathodique") sets the visual
contract; the design gate resolved the one open conflict (below). The effect ships only on
the in-game `<Canvas>` during PLAYING — menus/HUD are HTML overlays and are explicitly OUT
(§2bis bans CRT on print surfaces).

Forces:

- **No postprocessing today.** Deps are `three ^0.175`, `@react-three/fiber ^9.1.2`,
  `react 19`. There is no `postprocessing`, `@react-three/postprocessing`, or `drei`. Two
  routes: (a) add `@react-three/postprocessing` + `postprocessing` and write a CRT `Effect`;
  (b) hand-roll a fullscreen composite in raw three. Precedent leans hand-rolled and
  minimal-dep: ADR-0011 (baked neon rim) and ADR-0025 (first `ShaderMaterial`, 1-tap) both
  chose stock/hand-rolled three over new deps, and both flag the SwiftShader e2e publish gate
  (`scripts/e2e-ingame.mjs`) as the guard for any custom GLSL.
- **The art brief demanded a _subtle_ look at design time, not a cinematic one.** "Kill the
  effect and the frame should look almost the same in a still" (§8.2, _as originally written_).
  Bloom halo is **1–2 sprite-pixels wide**; scanlines were briefed ≤10–15%; vignette 10–15%;
  grain low-opacity; flicker single-digit %. **This subtlety target was overridden post-ship**
  after three owner playtests — see Amendments below and the revised §8.2. Bloom halo width,
  vignette, and flicker held; **scanlines were tuned up to 0.55 trough / 4-px squared comb** and
  the "almost the same in a still" rule of thumb is retired.
- **Ingredient conflict, resolved at design level.** PM AC1 mentioned barrel curvature;
  `lead-art`'s GATE (§8.1/§8.4/P4) rules curvature **OUT** — nothing may warp aim. Lead-art
  wins on visuals. **IN:** hue-preserving threshold bloom on neon, subtle scanlines, gentle
  vignette, fine grain + slow flicker. **OUT:** RGB/aperture mask, chromatic aberration,
  curvature.
- **Hard constraints (§8.4 / gate P1–P7):** the crosshair + HUD render flat, **above** the
  pass, aim 1:1 at every position (P4); the B&W layer gains **zero** added hue — white pixels
  stay neutral, only saturated neon blooms (P2/P3); the bloom halo obeys §2.1 (a dégradé to
  zero, jamais un aplat); no strobe, and a reduced-motion / effect-off path exists (P6).
- **Boundary law (§4).** The effect lives entirely in `src/render`; `src/game` gains only a
  pure `crt` data field — no Three import, no rule. Hooks remain the only bridge.

## Decision

**Hand-roll a fullscreen CRT composite pass in raw three. Do NOT add `postprocessing` /
`@react-three/postprocessing`.**

Rationale, one line each:

- **Build vs dep → hand-rolled.** Of the five ingredients only bloom is non-trivial, and the
  _required_ bloom is a **1–2px halo** — a bright-pass + one small separable blur, not a
  Kawase mip pyramid — so the library's headline value (a tuned big-bloom pyramid) is not
  needed, while its costs (peer-dep surface, R3F-v9/react-19/three-0.175 version coupling
  under Yarn PnP, a whole `EffectComposer` we would mostly reconfigure) are real; the
  proportionate, boring-tech choice here is our own four-pass graph, consistent with
  ADR-0011/0025 and the zero-postprocessing status quo. Even _with_ the dep we would still
  hand-roll the crosshair overlay pass to satisfy P4 (the composer processes the whole
  framebuffer), which erodes the dep's convenience for our exact constraint.
- **Render graph → RT + two three `Layers`, override R3F auto-render.** A `<CrtPass>`
  component takes over the frame (`useFrame(..., 1)` — a positive priority disables R3F's
  internal render):
  1. Render the **world** (layer 0: facade, enemies, enemy neon rims, couriers, vehicles,
     bullets, impacts, feedback) to `sceneRT`.
  2. **Bright-pass → `brightRT`** (half-res): keep pixels whose **chroma/saturation AND
     brightness** both exceed a threshold, output hue-preserved; everything else black.
     **Discriminate on saturation first, NOT luminance** — the world is B&W + neon, so paper is
     the _highest_-luminance surface and a luminance-only key would bloom the paper (P3 FAIL);
     saturation is the correct neon key and keeps the halo hue-true (P2/P3). **As-shipped
     deviation (see Amendments):** the gate is **saturation × brightness**, not saturation
     alone — the shooting-gallery backdrops are colored night facades (saturated but mid-tone
     brick/shutter), so a saturation-only key hazed the whole facade; ANDing a brightness gate
     keeps only the lit window cores + neon rims, which is what P3 actually wants.
  3. **Separable blur** (small radius, half-res) H then V → `blurRT`.
  4. **Composite → default framebuffer:** fullscreen quad samples `sceneRT` + `blurRT`, adds
     the bloom, then applies scanlines + vignette + grain + flicker (driven by `uTime`).
  5. **Crosshair overlay:** the crosshair mesh lives on `CRT_OVERLAY_LAYER`; the final pass
     renders that layer only with `gl.autoClear = false`, drawing it **flat, above** the CRT,
     pixel-precise (P4). Curvature is OUT, so there is no spatial warp to desync aim; the
     crosshair is excluded from the composited world purely so grain/scanlines/bloom never
     soften the aiming reference.
- **Bypass is total (AC3).** `<CrtPass>` is **conditionally mounted** on the `crt` pref. When
  off it is absent, R3F auto-renders exactly as today, and the crosshair stays on layer 0 —
  the render is byte-equivalent to the pre-CRT pipeline, not a faded pass.
- **Toggle reaches render without crossing the boundary.** `crt` is a pure `boolean` field on
  `Prefs` (`src/game/systems/prefsSystem.ts`, default **true**, parse/clamp, unit-tested,
  no Three import). `App` (render layer) already owns `prefs`; it passes a plain `crt` boolean
  prop down `App → GameScene → CrtPass` and to `CrosshairSprite` (layer assignment). `src/game`
  never learns the pass exists.
- **Mobile / perf policy (AC6).** The pref default is device-agnostic data (`crt: true`); the
  **quality tier is a render-side decision from `IS_MOBILE`** (where the mobile flag already
  lives, ADR-0003): desktop runs the full graph; mobile runs a **lite tier** (bright/blur at
  quarter-res, or bloom dropped to a single blur) to protect the frame budget, measured on the
  target, and the toggle is the escape hatch if even lite regresses.
- **Reduced-motion path (P6).** `prefers-reduced-motion: reduce` is detected render-side while
  keeping the static scanline/vignette/bloom. This is a display concern, so it stays in the
  render layer, not a pref field. The full effect-off escape hatch remains the `crt` toggle.
  **As-shipped deviation (see Amendments):** rather than freezing `uTime` to hold a _static_
  speckle, the reduced-motion path **zeroes grain and flicker amplitude outright**
  (`deriveCrtParams(tier, true)` → `grainOpacity: 0`, `flickerAmplitude: 0`). A frozen speckle
  is still visual noise a motion-sensitive viewer must parse every frame; zeroing it is the
  stronger accessibility answer and is what the pure `crtParams` module (and its vitest spec)
  asserts.
- **What is pure/unit-tested vs screenshot-gated.** Two testable seams: (1) the `crt` pref
  (parse/default/clamp) — pure `src/game`, TDD (dev-gameplay lane); (2) `crtParams` — a pure,
  Three-free module in `src/render/effects` (co-located with a vitest spec, mirroring the
  existing `markRing.ts` + `__tests__` precedent) that derives the per-tier intensity
  constants and applies the reduced-motion gate (assertable: mobile tier ≤ desktop cost,
  reduced-motion zeroes flicker/grain amplitude, thresholds in range). Everything qualitative —
  bloom quality, hue preservation, §2.1 halo falloff, scanline visibility, no-strobe feel,
  crosshair legibility — is `verify`-skill screenshot territory (Gate 4, P1–P7).

## Consequences

- **First multi-pass render graph in muf, and the first time R3F auto-render is overridden.**
  This is the render-contract change the ADR records. Standard three (`WebGLRenderTarget`,
  manual `gl.render`, `Layers`), no new runtime dep.
- **SwiftShader is the guard (as ADR-0025).** Custom GLSL across ~4 passes is a bigger
  software-GL surface than the 1-tap rim. Mitigations, mandated for the render lane:
  **verify the graph compiles+renders on SwiftShader _early_, before tuning**; keep RTs
  `RGBA8`/`UnsignedByte` (a subtle 1–2px bloom needs no HDR float) — escalate to `HalfFloat`
  with a capability check only if halo banding appears; keep passes ≤4 and shaders derivative-
  free. A regression here is a hard publish blocker.
- **Crosshair does not bloom while other neon does.** Intentional: P4 rates the crosshair's
  precision/legibility above its glow. The enemy neon rim (ADR-0025) and pickups/HUD-alerts on
  layer 0 still bloom, satisfying « ce qui brille est interactif ».
- **`flat` canvas preserved.** The composite writes raw (the canvas is `flat`, no tonemapping).
  P2 (white stays white) holds because the passes add no hue, not because the round-trip is
  bit-exact. **Correction to the earlier "byte-identical / RTs in canvas colour space" claim:**
  the intermediate render targets are `RGBA8`/`UnsignedByte` storing **8-bit _linear_** values
  under three r0.175, so the world→RT→composite round-trip is **not** byte-identical — dark
  tones **quantize** (visible as slightly stepped shadow banding, and it amplifies the
  linear-pre-encode grain on darks, finding K). This is acceptable for a subtle-halo bloom, but
  a **`HalfFloat` sceneRT follow-up is planned** (with a WebGL capability check) behind the
  SwiftShader publish gate — deferred to a fast-follow P1, not shipped in this PR. A
  colour-management slip that tints paper is still a Gate-4 check.
- **Cross-cutting sign-off.** Touches `src/game` (pref) + `src/render` (pass, wiring, toggle) —
  the `crt` field on the `Prefs` type is the ordering constraint between the two lanes
  (gameplay lands the field; render consumes it). Files are otherwise non-overlapping.
  Lane partition + parallel-safety recorded in `docs/agent-handoffs.md`.
- **Scope discipline.** Single boolean, no intensity slider, no per-effect toggles, no tube
  theatrics, no CRT audio, no CRT on HTML/menu surfaces — all OUT per the story and §8.

## Amendments

### 2026-07-16 — owner scanline retune + as-shipped deviations (PR #63 doc realign)

Recorded during the code-review-panel triage of PR #63 (branch
`claude/crt-screen-postprocess-9elt6w`). The architect ruling: **owner override stands, docs
realign to the code, not the reverse.** No code/logic change accompanies this amendment — it
brings the written contract into line with what shipped.

1. **Scanline retune (Bertrand's explicit call, three playtest rounds).** Shipped values:
   **`scanlineDarkening` 0.55** trough (was briefed ≤10–15%; 0.28 was invisible, 0.45 still too
   discreet on hidpi), **pitch 4 CSS-px × dpr**, **crisp squared comb**. Companion values:
   `grainOpacity` 0.03 (ceiling — above it the speckle drowns the comb), bloom gated at
   strength ~0.45, vignette 0.12. Rationale: the "vibe, not a filter" subtlety doctrine lost to
   the readability of the CRT _identity_ on modern hidpi displays. §8.2 is revised to match
   (the "still looks almost the same" rule of thumb is retired; the CRT is now deliberately
   legible in a still). Owner override, architect-ratified.

2. **Deviation — bright-pass is saturation × brightness, not saturation-only.** The Decision's
   step-2 "discriminate on saturation, NOT luminance" is preserved as the _primary_ key, but
   the shipped gate **ANDs a brightness threshold** (`bloomThreshold` × `bloomBrightness`). Why:
   the colored night facades are saturated but mid-tone, so a saturation-only key hazed the
   whole backdrop; the brightness AND keeps only lit window cores + neon rims. This _tightens_
   P3 (paper still never blooms), so it is a strengthening deviation.

3. **Deviation — reduced-motion zeroes grain/flicker, it does not freeze `uTime`.** The Decision
   described freezing time for a static speckle; the shipped path **zeroes both animated
   amplitudes** (`deriveCrtParams(tier, true)`). A frozen speckle is still per-frame visual
   noise for a motion-sensitive viewer; zeroing is the stronger accessibility answer (P6) and is
   what the pure `crtParams` module + spec assert.

4. **Correction — intermediate RTs are not byte-identical / not "canvas colour space".** They
   are `RGBA8`/`UnsignedByte` holding 8-bit **linear** values under three r0.175; dark tones
   quantize. A `HalfFloat` sceneRT with a capability check is a planned fast-follow P1 behind the
   SwiftShader publish gate; not in this PR. See the corrected Consequences bullet.

No other §8 ingredient changed; aim precision (P4), zero-hue-on-B&W (P2), and small-sprite
legibility (P5) remain hard floors.
