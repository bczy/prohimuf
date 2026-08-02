# Perf budget — muf

Owner: `gpu-specialist` (Ben). Status: **PROPOSED — awaiting Bertrand's ratification.**

This is the frame budget muf renders against, and the reference every PERF VERDICT
cites. A verdict against no budget line is an opinion, so the lines come first and the
verdicts sit at the bottom.

Two rules govern this file:

1. **Every line is a number with a rationale.** No "should be fine".
2. **Every line names the tier it binds and where it can be verified.** A desktop PASS
   says nothing about mobile; a SwiftShader PASS says nothing about either.

---

## 1. Tiers and device classes

| Tier      | Binds to                                                                               | Viewport / dpr                      | CRT tier (`crtParams.ts`) | Frame target                      |
| --------- | -------------------------------------------------------------------------------------- | ----------------------------------- | ------------------------- | --------------------------------- |
| `desktop` | Laptop/desktop, integrated GPU (Intel Iris Xe / Apple M-series / AMD Vega 8) and up    | 1280×720 → 1920×1080 CSS, dpr 1–2   | `full` (resScale 0.50)    | 16.6 ms (60 fps), floor 20 ms     |
| `mobile`  | Mid-range phone, landscape only (ADR-0003), 2020-era SoC and up (Snapdragon 7xx / A12) | 844×390 → 926×428 CSS, dpr capped 2 | `lite` (resScale 0.25)    | 16.6 ms (60 fps), **floor 33 ms** |
| `lite`    | The `mobile` tier with `prefs.crt` OFF — the escape hatch below lite                   | as `mobile`                         | none (pass not mounted)   | 16.6 ms, floor 33 ms              |

dpr is clamped by R3F's default `dpr={[1, 2]}` (no `dpr` prop on `<Canvas>` in
`PlayingCanvas.tsx`), so a dpr-3 phone still renders a 2× drawing buffer. That clamp is
load-bearing for §4 and §5 — **removing it doubles the CRT's bandwidth bill and requires
a new PERF verdict.**

### `ci-swiftshader` is NOT a perf tier

CI renders through SwiftShader (`SWIFTSHADER_ARGS`, `scripts/e2e-lib.mjs`) — a CPU
rasteriser. It is a **correctness** gate (does the graph compile, does the frame draw)
and it can measure everything that is device-independent: draw calls, passes, render
targets and their formats, programs, GL object counts. It **cannot** measure GPU frame
time, mobile memory bandwidth, tiler behaviour, or shader ALU cost on real silicon. No
budget line below is ever closed on a SwiftShader number alone.

---

## 2. Budget lines

Verifiable **here** = measurable in the sandbox/CI (device-independent).
Verifiable **on-target** = needs real silicon; see §6.

| #       | Line                                                        | `desktop`                                       | `mobile`                     | Verifiable  |
| ------- | ----------------------------------------------------------- | ----------------------------------------------- | ---------------------------- | ----------- |
| **B1**  | Frame time, gameplay steady state                           | ≤ 16.6 ms p50, ≤ 20 ms p95                      | ≤ 16.6 ms p50, ≤ 33 ms p95   | on-target   |
| **B2**  | Draw calls per frame, gameplay steady state                 | ≤ 150 total (world pass ≤ 140)                  | ≤ 90 total (world pass ≤ 80) | here        |
| **B3**  | Fullscreen passes per frame                                 | ≤ 5 (CRT: world, bright, blur H, blur V, comp.) | ≤ 5 (same)                   | here        |
| **B4**  | Render-target memory (colour + depth)                       | ≤ 16 MB                                         | ≤ 14 MB                      | here        |
| **B5**  | Added alpha-blended coverage per frame                      | ≤ 1.5× screen area                              | ≤ 0.75× screen area          | here (est.) |
| **B6**  | Shader programs compiled after the first frame              | 0                                               | 0                            | here        |
| **B7**  | Ambient particle/décor quads (non-gameplay)                 | ≤ 24 particles + ≤ 16 sprites                   | ≤ 12 particles + ≤ 8 sprites | here        |
| **B8**  | Texture allocation for an effect                            | shared singletons only; procedural ≤ 128×128    | same                         | here        |
| **B9**  | Object allocations inside `useFrame`                        | ≤ 32 short-lived objects/frame across all lanes | ≤ 16                         | here        |
| **B10** | Added resident texture VRAM for ONE set-piece               | ≤ 24 MB                                         | ≤ 16 MB                      | here        |
| **B11** | Max dimension of any texture added after 2026-08            | ≤ 4096 px on either axis                        | ≤ 4096 px                    | here        |
| **B12** | Per-frame texture UPLOAD (re-upload of an existing texture) | 0 bytes                                         | 0 bytes                      | here        |
| **B13** | Draw calls issued for fully-occluded geometry               | ≤ 10                                            | ≤ 10                         | here        |

### Rationale, line by line

- **B1** — 60 fps is the target because this is a shooting gallery: aim latency is the
  whole 3C. The mobile p95 floor is 33 ms (30 fps) rather than 20 ms because a phone
  that drops one frame under a thermal blip must not be called a regression; a phone
  that sits at 33 ms is already a FAIL of the p50 line.
- **B2** — a WebGL draw call costs roughly 20–60 µs of CPU on a mid-range mobile browser
  (validation + state + uniform upload). 90 calls ≈ 1.8–5.4 ms, i.e. up to a third of
  the mobile frame spent before a single fragment is shaded. Desktop's 150 is the same
  reasoning at ~10 µs/call. These are CPU-side ceilings, not GPU ones — a scene of flat
  unbatched sprite quads is a draw-call-bound scene by construction.
- **B3** — the CRT composite (ADR-0031) is the frame's fixed cost and it is already
  5 passes. A 6th fullscreen pass is a ~20 % bandwidth increase on mobile and needs an
  ADR plus a TECH-PLAN cost review, never a silent addition.
- **B4** — measured today (§4): desktop 8.9 MB, mobile 12.2 MB at dpr 2. The mobile
  ceiling is deliberately just above the current figure: there is no room for a second
  full-res target on a phone. **A HalfFloat intermediate (the ADR-0031 pre-authorised
  follow-up) doubles the bright/blur chain and must be re-verdicted against this line.**
- **B5** — mobile at 844×390 dpr 2 = 1.32 Mpx. 0.75× = 0.99 Mpx of extra blended
  fragments; at 8 bytes/px of read+write traffic that is ~7.9 MB/frame ≈ 475 MB/s at
  60 fps, on top of the ~1.4 GB/s the CRT composite already costs. Mid-range LPDDR4X
  gives 15–25 GB/s **shared with the CPU and the display**; ~10 % of it for post + décor
  is the comfortable limit. Alpha-blend overdraw is the classic tiler cliff and this is
  the line that guards it.
- **B6** — a shader compiled mid-game is a multi-frame stall on mobile drivers. All
  programs must exist by the end of the loading gate.
- **B7** — ambient décor is the first thing to cut and the last thing to defend: it
  drives nothing and is never a target. Halving on mobile is the established pattern
  (`NearForeground` row split, `UrbanMotion` counts, `smokeParticles` active count).
- **B8** — one shared texture per effect family, tinted through `material.color`, not one
  canvas per instance. 128×128 is generous for a radial falloff sampled at ≤ 130 device px.
- **B9** — young-generation churn is cheap but not free; a per-frame allocation in every
  lane at once is how a smooth build acquires a 10-minutes-in GC stutter on low-end
  Android. The number is a total across lanes, not per lane.
- **B10** _(new, 2026-08-02, opened by the photo set-piece)_ — measured anchor: Belliard's
  own backdrop `street-wide.png` is 6418×1248, `NearestFilter`, `generateMipmaps = false`
  ⇒ **30.55 MB** resident RGBA8, and it stays resident while a frozen-scene set-piece
  holds the screen (the world is frozen, not unloaded). A set-piece that adds more than
  ~half the level's largest single texture doubles the level's peak texture footprint at
  the worst possible moment. The mobile ceiling (16 MB) is deliberately set just above the
  render-target budget **B4** (14 MB): **one set-piece may not cost more resident texture
  memory than the entire post-processing chain.** Counted as decoded RGBA8
  (`w × h × 4`, ×1.33 if mipmaps are ever enabled), not as PNG bytes on disk.
- **B11** _(new)_ — `GL_MAX_TEXTURE_SIZE` is 4096 on a real share of 2020-era Android
  drivers. Above the cap the upload does not degrade, it **fails**: three.js binds a 1×1
  placeholder and the surface draws black or white — a total-loss failure mode, on the
  device class we can least afford it. `street-wide.png` (6418 px) predates this line; it
  is **grandfathered, not a precedent**, and its own on-target status is an open item
  (§8). Anything new is capped, or is tiled into ≤ 4096 px tiles.
- **B12** _(new)_ — a texture is uploaded once and then sampled. Re-uploading one every
  frame (the classic "re-draw the crop into a `CanvasTexture` each frame" implementation of
  a moving viewfinder) costs `w × h × 4 × 60` bytes/s of bus traffic: a 1280×768 plate is
  **236 MB/s**, i.e. ~30× the entire **B5** overdraw allowance, spent invisibly and
  attributed to nothing in a profile. Zero is the only defensible number. Moving crops are
  a `Texture.offset`/`repeat` or UV-uniform write — free.
- **B13** _(new)_ — a full-screen opaque surface that replaces the world does not make the
  world free: the draw calls, the vertex work and the CPU-side state changes are all paid
  before the depth test can reject anything, and a tiler pays them in full. Ten is a
  tolerance for stragglers (an overlay layer, a crosshair), not an allowance.

---

## 3. Measurement protocol (in-sandbox)

Reproducible today, no GPU required. Reference procedure for any future PERF verdict:

1. `yarn build`, then `npx vite preview --port 4173 --strictPort`.
2. Build `origin/main` in a `git worktree` and serve it on a second port — **a delta is
   the only meaningful draw-call number**; absolute counts drift with level content.
3. Drive both with headless Chromium + `SWIFTSHADER_ARGS`, seeded via
   `seedDeterminism(page, levelIds, { crt: true })` so cops are frozen and the CRT path
   is exercised.
4. Instrument at the **GL level**, not the R3F level (the R3F store is not exposed on the
   canvas element in this build): wrap `useProgram` / `bindFramebuffer` / `viewport` /
   `blendFunc` / `draw*` on `WebGL2RenderingContext.prototype` in an `addInitScript`, and
   bucket every draw call by `(framebuffer, viewport, program, blend mode)`, snapshotting
   at `requestAnimationFrame` boundaries. This yields a per-pass census that is engine-
   agnostic and survives minification.
5. **Sweep the pointer across the viewport during the sample.** The scene is frustum-
   culled, so a static camera measures only the initially visible subset — the first
   pass of this audit under-reported the delta by half.

The probe used for the audit below is throwaway (it lives in the session scratchpad, not
in `scripts/`). If this becomes routine, see the harness spec in §7.

---

## 4. Baseline — 2026-07-25

Headless Chromium 1194 + SwiftShader, level `belliard`, cops frozen, `crt: true`, dpr 1.
`main` = `c6404e4`; `branch` = `6830792` (`claude/street-graphics-effects-q8p59k`).

| Metric                                         | main            | branch           | Δ                     |
| ---------------------------------------------- | --------------- | ---------------- | --------------------- |
| Desktop 1280×720, draw calls (static camera)   | 71              | 85               | **+14**               |
| Desktop 1280×720, draw calls (full street pan) | 73 p50 / 86 max | 99 p50 / 108 max | **+26 p50 / +22 max** |
| Mobile UA 844×390, draw calls (pan)            | 57 p50 / 58 max | 58 p50 / 62 max  | **+1 p50 / +4 max**   |
| Fullscreen passes / frame                      | 5               | 5                | 0                     |
| Framebuffers created                           | 7               | 7                | **0**                 |
| Shader programs created                        | 7               | 7                | **0**                 |
| GL textures created                            | 39              | 44               | +5                    |
| GL buffers created                             | 274             | 330              | +56 (≈ 14 geometries) |
| SwiftShader p50 frame, static camera (2 runs)  | 90.6 / 91.0 ms  | 88.4 / 89.7 ms   | within noise          |

Per-pass census, branch, desktop, panning (median calls):

```
72  sceneRT 1280x720   normal-alpha   world pass, opaque + alpha sprites
18  sceneRT 1280x720   additive       pre-existing additive (window cores, rims)
 4  sceneRT 1280x720   additive       NEW — acid neon signage emitters
 1  brightRT 640x360                  saturation × brightness bright-pass
 1  blurTmpRT 640x360                 separable blur, H
 1  blurRT 640x360                    separable blur, V
 1  screen 1280x720                   composite
 1  screen 1280x720                   crosshair overlay layer (P4)
```

Render-target inventory (unchanged by the branch):

| Tier    | Targets                                                       | Memory             |
| ------- | ------------------------------------------------------------- | ------------------ |
| desktop | 1280×720 RGBA8 + D24, 3 × 640×360 RGBA8                       | ≈ 8.9 MB           |
| mobile  | 844×390 RGBA8 + D24, 3 × 211×97 RGBA8 (dpr 1 in sandbox)      | ≈ 3.1 MB           |
| mobile  | same at dpr 2 (real phone, R3F clamp) — 1688×780, 3 × 422×195 | ≈ 12.2 MB (**B4**) |

The SwiftShader frame time is reported **only** to exclude a gross fill-rate blunder: a
CPU rasteriser is hypersensitive to overdraw, so a hidden fullscreen additive quad would
show up here. It did not. That is the entire claim — it is not a frame-rate result.

---

## 5. PERF VERDICTS — story `street-graphics-effects` (PR #142)

Verdict vocabulary:

- **APPROVE** — within every budget line verifiable in the sandbox; no change required.
- **OPTIMIZE** — within budget today, but carrying a named cost that should be paid down.
  Non-blocking unless marked BLOCKING; the remedy is named and routed to an owning lane.
- **REJECT** — over budget, or a named cliff risk. Must change before merge.

### 5.1 Acid neon glow (`fccbb96`) — **APPROVE** · tiers: desktop + mobile

One additive quad per emitting near-foreground prop (9 emitters on `belliard`, 11 on
`stalingrad`; halved on mobile by the existing row split). Measured cost: **+4 to +6
draw calls** on a full street pan; **+0 passes, +0 render targets, +0 programs**.

What makes it cheap, and what must stay true:

- The glow does **not** implement a halo. It rides layer 0 into the CRT world pass and
  clears the existing saturation × brightness bright-pass gate; the blur chain is a
  **fixed 3-call cost regardless of how many pixels pass the gate** (confirmed: bright and
  blur stay at exactly 1 call each, at unchanged RT sizes, on both builds). Adding
  emitters therefore has **zero marginal post-processing cost**. This is the right shape
  for an effect on this pipeline and should be the template for future emissive work.
- Overdraw: the largest emitter is `lamppost` at `size 0.32 × planeH`, `planeH` capped at
  7.0 world units (`KIND_MAX_WORLD_H`) → a 2.24-unit disc ≈ 85 device px at the desktop
  zoom ≈ 0.6 % of the frame. All 9 emitters together ≈ 5 % of frame area of additive
  coverage — **3 % of the B5 desktop allowance**, and the props are spread along the
  street so they never stack.
- `radialGlowTexture` is a **module-level singleton**, 64×64, white, tinted per instance
  through `material.color`. One texture for every hue and every consumer. Correct per
  **B8**; explicitly checked because "one canvas per prop" is the usual failure here.

Carried into the OPTIMIZE item in §5.4: each emitter allocates its own
`<planeGeometry args={[1,1]}/>` rather than sharing one unit quad.

### 5.2 VHS travel (`ad09155`) — **APPROVE** · tiers: desktop + mobile

The cheapest possible way to have shipped this. One `float` uniform and one subtraction
inside the existing composite fragment:

```glsl
float phase = 0.5 - 0.5 * cos((gl_FragCoord.y - uScanlineScroll) * (6.28318531 / uScanlinePeriod));
```

- **No branch.** There is no `if` on the toggle; OFF feeds `uScanlineScroll = 0`, which
  is arithmetically the previous static comb. No divergence, no second variant.
- **No second program.** Programs created: 7 on both builds — a `#define`-style variant
  would have cost a mid-session compile and broken **B6**.
- ALU delta: +1 subtraction per fragment on one fullscreen pass. Below the noise floor of
  any instrument that exists.
- No change to passes, RT count, RT format or size.

Nothing to measure on target beyond the global frame check.

### 5.3 Energy aura (`1e2d2a4`) — **APPROVE**, with a DEFERRED-ON-TARGET item · tiers: desktop + mobile

Two quads (soft shadow + additive glow at 1.55× the sprite) per active entity, driven
from the host's existing `useFrame`.

- Draw calls: **≤ 6 added**, and only while a QTE or a loot crate is live — hostage QTE
  (captor + hostage = 4) plus a crate (2). Not observable in the ambient baseline above
  because auras are hidden (`AURA_HIDDEN`) until activation. Well inside **B2**.
- Overdraw: the boss aura is the largest at `2.2 × 1.55 = 3.41` world units ≈ 129 px ≈
  **1.4 % of the frame**. The glow is deliberately drawn _behind_ the opaque sprite so the
  core is occluded — the visible cost is the rim only.
- Texture: shares the same `radialGlowTexture` singleton. `dispose()` releases geometry
  and both materials and correctly does **not** dispose the shared map.
- `LootCrate` calls `aura.update({ visible: true, … })` unconditionally, but the aura is a
  child of the crate `<group visible={false}>`; the parent gates it. No hidden draw.

**Deferred to on-target (§6, scenario S3):** the only frame I could not exercise here is
the boss QTE peak, where this aura (additive, high-saturation `#00FF64` at full energy —
i.e. deliberately above the bloom gate) coexists with the boss smoke field, the rings,
the parry halo and the glyph. Each element is individually small; the concurrency is the
part no static analysis settles. Credit where due: `UrbanMotion` **suppresses itself
entirely during the boss fight**, which is exactly the right instinct and removes the
worst of the overlap.

### 5.4 Urban motion (`9c792a7`) — **OPTIMIZE** (non-blocking) · tiers: desktop + mobile

The largest single addition on the branch: **+20 draw calls** on a desktop pan (14 debris
sprites, 2 pooled vent fields of 10 puffs). Mobile halves both (7 + 2×5) and measured
**+1 p50 / +4 max** — the mobile viewport simply shows less street.

Against budget: **B7** allows 24 particles + 16 sprites on desktop; this uses 20 + 14.
That is 83 % and 88 % of the ambient allowance **consumed by one feature**. It is
in-budget, so this is not a merge blocker — but the ambient lane is now effectively full,
and that is the fact that needs recording before the next ambient idea arrives.

Three named costs, ranked by what they actually cost, each with a remedy for
`dev-r3f-render` (Amelia) to weigh — I price, the owning lane implements, the architect
arbitrates:

1. **Unbounded puff growth (bandwidth, the top-ranked item).** `createSmokeField` was
   authored for the ~2.2-unit boss tableau; `UrbanMotion` reuses it verbatim on an ambient
   street layer where nothing bounds the result. A puff spawns at `scale 0.5–0.95` and
   grows at `0.14–0.4/s` for a `2.6–5.2 s` life, so a worst-case puff reaches
   ≈ 3.0 world units ≈ 113 px, with up to 10 of them overlapping in one vent cluster —
   a local overdraw factor near 10× over ~1.5 % of the frame. That is well inside **B5**
   today; it is on the list because it is the one number in this feature with **no
   ceiling in the code**, and a future tuning pass on `growth` or `maxLife` moves it with
   nothing to catch it. _Remedy: clamp max scale in the field, or pass a per-field size
   cap alongside the existing `renderOrder` argument._
2. **Both vent fields step every frame regardless of visibility.** `field.update()`
   early-returns only on `!ready || envelope <= 0.02`; `VENT_ENVELOPE` is a constant 0.45,
   so the full 10-particle loop plus 10 `position/rotation/scale` writes runs for both
   vents even when neither is on screen. CPU-side, small, but it is per-frame work with no
   off-screen path. _Remedy: skip the update when the vent's world X is outside the camera
   frustum — the same cull the GPU is already doing for the draws._
3. **Per-frame allocation in the debris loop.** `stepDebris` returns a fresh object per
   item per frame by design (pure step function) — 14 objects/frame ≈ 50 k/min. Combined
   with `energyGlowColor`'s fresh triple per aura per frame, the branch adds ~20
   objects/frame against the **B9** allowance of 32. Purity is worth paying for and this
   is not a FAIL; it is now the largest contributor to that line and the next lane to want
   an allocation should know the budget is mostly spent. _Remedy: none required today;
   mutate-in-place only if B9 comes under pressure._

Cross-cutting with §5.1: every debris quad and every neon quad allocates its own
`PlaneGeometry(1,1)` — measured **+56 GL buffers ≈ 14 extra geometries**. This does not
reduce draw calls (three does not batch these regardless), so it is a memory/upload item,
not a frame-time one — ranked last on purpose. _Remedy: one shared module-level unit-quad
geometry across `UrbanMotion`, the neon emitters and `createEntityAura`._

### 5.5 Spray title (`f3b4d35`) — **APPROVE** · tier: all, outside the GL budget

Pure DOM/CSS on the TITLE surface. **Zero GL cost: the R3F canvas is not mounted on this
screen** (`PlayingCanvas` is lazy, ADR-0068), so nothing here competes with a frame budget.

One honest note rather than a clean bill: `mufSprayIn` animates `filter: blur()` from
`0.16em` to `0`. `opacity` and `transform` are free on the compositor; an **animated blur
radius is not** — it re-runs the blur on the composited layer every frame, on a text layer
that is up to 160 px per glyph. It is bounded to 3 letters × 620 ms with a 700 ms stagger
(≈ 2.0 s total), one-shot, on a screen doing nothing else, and both reduced-motion
triggers kill it outright with `animation: none` (not a 0 ms duration — which would still
run the blur frames; that distinction was got right). Nothing to change. If a very weak
Android ever stutters on the cover, this is the line to look at first.

### 5.6 Overall

**VERDICT: PASS — GPU / frame budget (gpu-specialist), with one DEFERRED-ON-TARGET item.**

- No new pass, no new render target, no new render-target format, no new shader program.
  Confirmed by measurement, not by reading the code.
- Draw calls: desktop 99 p50 / 108 max vs a **B2** ceiling of 150; mobile 58 p50 / 62 max
  vs 90. Both in budget with headroom.
- **B4**, **B3**, **B6**, **B8** untouched. **B5** at ~3 % of allowance. **B7** now 83–88 %
  consumed — the ambient lane is full.
- **B1 is not verified and cannot be here.** See §6.

---

## 6. On-target protocol — ready to run

Owner of the run: Bertrand. Chased by `producer`. On completion: under budget → record the
PASS and close the deferral; over budget with the PR open → my DEFERRED pass is **REVOKED**
and becomes a stage-5 FAIL routed to `dev-r3f-render` via the architect; over budget after
merge → a fix-lane cycle only a PERF re-verdict (this protocol, re-run) can close.

**Build:** `https://bczy.github.io/prohimuf/preview/claude-street-graphics-effects-q8p59k/`
(branch `claude/street-graphics-effects-q8p59k`).
**Baseline for comparison:** `https://bczy.github.io/prohimuf/` (main).
Run the **same scenario on both**, back to back, same device, same session — an absolute
fps number on an unknown thermal state is worth nothing; the A/B is the measurement.

### Devices

| #   | Class                           | Binds tier | Priority                                               |
| --- | ------------------------------- | ---------- | ------------------------------------------------------ |
| D1  | Any desktop/laptop browser      | `desktop`  | required                                               |
| D2  | Mid-range Android, 2020-era SoC | `mobile`   | **required — this is the cliff device**                |
| D3  | Any iPhone (A12+)               | `mobile`   | nice to have (different tiler, different failure mode) |

### Scenarios

| Id  | Scenario                                                                                    | Targets             |
| --- | ------------------------------------------------------------------------------------------- | ------------------- |
| S1  | `belliard`, ambient street, sweep the aim slowly left↔right across the full street for 30 s | §5.1, §5.4          |
| S2  | Trigger a hostage QTE; hold through the full tableau                                        | §5.3                |
| S3  | **Boss fight, full duration** — smoke field + rings + parry halo + aura together            | §5.3 (the deferral) |
| S4  | Loot crate appear + settle                                                                  | §5.3                |
| S5  | Options → toggle **BALAYAGE VHS** on/off mid-game, twice                                    | §5.2                |
| S6  | Cold load onto the TITLE cover, watch the wordmark spray                                    | §5.5                |
| S7  | Rotate/resize (desktop: drag the window across a dpr boundary if you have two displays)     | RT resize path      |

### How to read the numbers

- **Desktop (D1):** DevTools → ⋮ → More tools → **Rendering** → tick **Frame Rendering
  Stats**. Read the FPS/frame-time overlay live during each scenario. For a real number,
  record a 20 s **Performance** profile and read the frame track's long-frame count.
- **Android (D2):** connect by USB, `chrome://inspect` on the laptop, inspect the tab,
  then the same Rendering overlay + Performance profile **remotely** — the overlay renders
  on the phone, the profile is captured on the laptop. Read: p50 frame time, count of
  frames > 33 ms, and the GPU track if the device exposes it.
- **iPhone (D3):** Safari → Develop → device → Timelines → Rendering Frames.
- **Every scenario, both builds, note the delta.** Also note battery/thermal state; a
  second run after 10 minutes of play is worth more than a cold one.

### Pass thresholds

| Line   | Scenario   | D1 (`desktop`)                                 | D2/D3 (`mobile`)                                  |
| ------ | ---------- | ---------------------------------------------- | ------------------------------------------------- |
| **B1** | S1         | p50 ≤ 16.6 ms, p95 ≤ 20 ms                     | p50 ≤ 16.6 ms, p95 ≤ 33 ms                        |
| **B1** | S2, S4     | p50 ≤ 16.6 ms                                  | p50 ≤ 20 ms (a QTE is a held tableau, not aiming) |
| **B1** | S3         | p50 ≤ 16.6 ms, p95 ≤ 25 ms                     | p50 ≤ 20 ms, p95 ≤ 33 ms                          |
| **Δ**  | S1 vs main | branch − main ≤ **+1.5 ms** p50                | branch − main ≤ **+2.0 ms** p50                   |
| **B6** | S5         | no hitch on toggle (0 dropped frames > 100 ms) | same                                              |
| —      | S6         | spray completes without a visible stutter      | same                                              |
| —      | S7         | no black frame / leak; RT resize clean         | n/a                                               |

**The Δ line is the real gate.** If the absolute p50 fails on D2 but Δ is under +2.0 ms,
the branch is not the cause — that is a pre-existing `mobile` finding against the CRT
composite and it opens its own item, not a FAIL of this PR.

---

## 7. Harness spec — for `dev-tooling-assets`

Not built. Specced here so the next verdict is not another bespoke probe. Owner lane:
`dev-tooling-assets`; this is a spec, not an implementation, and I do not write it.

1. **`?perf=1` overlay** — a DOM overlay (never in the Canvas) showing rolling p50/p95
   frame time over a 120-frame window, `renderer.info.render.calls`, `.triangles`,
   `renderer.info.memory.geometries/textures`, and `renderer.info.programs.length`. This is
   what makes the §6 protocol runnable by anyone on any device without USB tooling.
2. **`window.__MUF_PERF__()` seam** — mirroring `__MUF_STATE__`: returns the same figures
   as a JSON snapshot so an e2e script can assert **B2**/**B3**/**B6** in CI as a
   regression gate against a committed baseline.
3. **Draw-call budget gate in CI** — run the §3 procedure on `belliard` with the pointer
   sweep, fail the build if total calls/frame exceeds **B2** for the tier. Device-
   independent, so SwiftShader is a legitimate host for exactly this check.

---

## 8. Open items

| Item                                                                 | Owner                | State                                                             |
| -------------------------------------------------------------------- | -------------------- | ----------------------------------------------------------------- |
| B1 on-target measurement for PR #142 (§6)                            | Bertrand             | **DEFERRED-ON-TARGET**                                            |
| Boss-QTE concurrency peak (S3)                                       | Bertrand             | **DEFERRED-ON-TARGET**                                            |
| Ambient allowance (B7) at 83–88 % after `UrbanMotion`                | `senior-architect`   | recorded — next ambient feature needs a budget conversation first |
| §5.4 remedies 1–2 + shared unit-quad geometry                        | `dev-r3f-render`     | OPTIMIZE, non-blocking                                            |
| ADR-0031 HalfFloat intermediate follow-up must be re-verdicted vs B4 | `gpu-specialist`     | pending, not scheduled                                            |
| Perf harness (§7)                                                    | `dev-tooling-assets` | specced, not built                                                |
| Ratification of every budget number in §2                            | Bertrand             | **PROPOSED**                                                      |
| B10–B13 proposed (opened by the photo set-piece, §9)                 | Bertrand             | **PROPOSED**                                                      |
| `street-wide.png` at 6418 px vs **B11** — does it upload on D2/D3?   | Bertrand             | **DEFERRED-ON-TARGET** (protocol §10, scenario P0)                |
| G-1 occluded world during frozen-scene set-pieces (§9.5)             | `dev-r3f-render`     | **BLOCKING** at stage 5 unless measured under **B13**             |
| G-2 shader compile at set-piece open (§9.6)                          | `dev-r3f-render`     | **BLOCKING** at stage 5 — **B6** breach unless warmed             |
| Plate pixel resolution is unspecified (§9.2)                         | `senior-architect`   | routed — needs an art/design trade, not a perf call               |

---

## 9. COST REVIEW (a priori) — story `qte-photo-paparazzi`

**Stage 4 appui-perf, 2026-08-02.** This is a **cost review of the specs, not a verdict on a
build** — Lane B is writing `src/render/scene/PhotoQteView.tsx` as I write this. The verdict
proper comes at stage 5 against the lines below. Sources read:
`docs/game-design/techplan-photo-qte.md` (§6 Lane B/C, D-J, D-K), `docs/game-design/ux/photo-qte-controls.md`
(Rev. 2), `docs/game-design/spec-photo-qte-paparazzi.md` §8.

Everything numbered here was **measured in this worktree**, not estimated from reading:

| Measurement                                             | Value                                   | How                                                            |
| ------------------------------------------------------- | --------------------------------------- | -------------------------------------------------------------- |
| Cold-boot roster (`manifestFor("menu")`)                | **1 asset, 0.10 MB**                    | `manifestFor` executed under vitest, `statSync` over `public/` |
| Belliard level-entry roster (`manifestFor("belliard")`) | **54 assets, 30.42 MB** (+8 procedural) | idem                                                           |
| `street-wide.png` (Belliard's whole backdrop)           | 6418×1248 ⇒ **30.55 MB** resident RGBA8 | `sips`, ×4 B/px, `NearestFilter`, no mipmaps (`pixelArt.ts`)   |
| Belliard draw calls today                               | 73 p50 / 86 max desktop, 57 p50 mobile  | §4 baseline of this document                                   |
| Fullscreen passes today                                 | 5 (at the **B3** ceiling)               | §4                                                             |
| Shader programs today                                   | 7                                       | §4                                                             |

### 9.1 Where the cost actually is — ranked

| #   | Item                                          | Verdict                                                               | Line     |
| --- | --------------------------------------------- | --------------------------------------------------------------------- | -------- |
| 1   | The occluded world behind the plate           | **REAL, unnamed, blocking-shaped**                                    | B13, B2  |
| 2   | Shader compile at the set-piece's first open  | **REAL, unnamed, blocking-shaped**                                    | B6       |
| 3   | Plate pixel resolution (unspecified anywhere) | **REAL — an art/design trade I price, not decide**                    | B10, B11 |
| 4   | Contact-sheet thumbnails, if drawn in-canvas  | **REAL cliff, cheaply avoided**                                       | B10      |
| 5   | Sway, if implemented as a per-frame re-crop   | **REAL cliff, cheaply avoided**                                       | B12      |
| 6   | Preload placement of the plate                | **REAL but small, and the techplan diagnosed it wrong**               | §9.7     |
| 7   | Sway as a UV/uniform write                    | **FALSE problem**                                                     | —        |
| 8   | The AF brackets                               | **FALSE problem GPU-side; a DOM/CPU question**                        | B9       |
| 9   | Reduced motion                                | **FALSE problem — zero GPU cost**                                     | —        |
| 10  | The full-screen plate quad itself             | **FALSE problem** — 1 opaque draw, 1× screen, replaces what it covers | B5       |

### 9.2 The plate — the sizing question nobody asked

The specs fix the plate's **world** size (`100 × 56.25 su`, spec §8) and never fix its **pixel**
size. The techplan says "a 1280×768-class plate". Those are two different decisions and only one
of them has been made.

The magnification follows from gated tuning, not from taste. `FILL_MIN 0.45` / `FILL_MAX 0.92`
force the subject box to occupy 45–92 % of the viewfinder, so with a subject ~6 su wide the
**usable** viewfinder is ≈ 6.5–13.3 su out of 100 su of plate — a **7.5× to 15× linear
magnification** of the plate onto the frame, with `NearestFilter` and no mipmaps
(`pixelArt.ts:20-22`). At 1280 px of plate width, the tightest legal framing samples ≈ 83 source
pixels and blows them across the whole screen: one source pixel per 15×15 screen block. The
`SUBJECT_BOX_TOLERANCE` of 0.40 su — the tolerance `check-photo-subject-boxes.mjs` will enforce —
is then **5 plate pixels ≈ 77 screen pixels**. Whether that reads as house style or as a broken
image is `lead-art`'s and `game-designer`'s call. **I price the options; I do not pick.**

| Option                                                    | Resident VRAM                     | Max magnification          | **B10** mobile (16 MB) | **B11**  |
| --------------------------------------------------------- | --------------------------------- | -------------------------- | ---------------------- | -------- |
| A. 1280×768 plate + 6 poses @512²                         | 3.9 + 6.0 = **9.9 MB**            | 15×                        | PASS                   | PASS     |
| B. 2048×1152 plate + 6 poses @512²                        | 9.4 + 6.0 = **15.4 MB**           | 9.4×                       | PASS (96 % consumed)   | PASS     |
| C. 4096×2304 plate + 6 poses @512²                        | 37.7 + 6.0 = **43.7 MB**          | 4.7×                       | **FAIL (2.7×)**        | PASS     |
| D. "1:1 at 300 mm" (≈ 19 700 px wide)                     | ≈ **870 MB**                      | 1×                         | **FAIL**               | **FAIL** |
| E. B, poses @1024² (the subject sharp, the backdrop soft) | 9.4 + 24.0 = **33.4 MB**          | 9.4× / 2.3× on the subject | **FAIL (2.1×)**        | PASS     |
| F. **B, poses @1024², mobile poses @512²** (tier-forked)  | desktop 33.4 / mobile **15.4 MB** | as E / as B                | PASS                   | PASS     |

**Recommendation (priced, not decided): B or F.** The plan already splits the surface into a
plate **plus key-pose sprites** — that split is the lever, and it has not been used. The thing the
player scrutinises for 60 s is the subject, not the wall behind it; poses carried at their own
native density are 4× sharper on the only pixels that matter, for a fraction of what the same
density would cost baked into the plate. Option D is not a serious option and is listed only so
nobody rediscovers it at stage 5: it fails **B11** on every device and would draw **black** on a
4096-capped Android. Option C is the trap — it clears B11, reads as "just one texture", and blows
B10 by 2.7× on the tier that cannot absorb it.

**Open for `senior-architect` to route:** the plate's pixel resolution and the pose resolution are
one coupled decision, they bind `lead-art`'s brief and Lane C's `levelArt.json` entries, and they
are currently unwritten. Whatever is chosen must be **written into the art brief as a pixel
number**, because `check-photo-subject-boxes.mjs` compares opaque AABBs in plate pixels and its
tolerance silently changes meaning with the plate's resolution.

### 9.3 Sway — free, or 30× the overdraw budget, depending on one implementation choice

Sway moves the viewfinder rect continuously. Two implementations, three orders of magnitude apart:

- **Free (correct):** the plate is one static texture; the crop is `Texture.offset` / `Texture.repeat`
  (which `photoFraming.ts:plateUvRect` is already written to produce) or a UV uniform. Cost per
  frame: two `vec2` uniform writes. **Zero** GPU cost, **B12** PASS. `photoFraming.ts` returning
  a UV rect is strong evidence Lane B is on this path — good.
- **Catastrophic:** re-render the crop into a `CanvasTexture` each frame. 1280×768 RGBA8 × 60 Hz =
  **236 MB/s** of upload — ~30× the whole **B5** allowance, and on a mobile tiler it is bus traffic
  contending with the CRT composite's own ~1.4 GB/s. This is not hypothetical: it is the shape
  `pixelArt.ts`'s `CanvasTexture` helper makes easy, and it profiles as "the browser is slow".

**One caveat on the free path, and it is a real one.** `Texture.offset`/`repeat` live on the
**Texture**, not on the Material. If the plate texture comes from a shared module cache (the
`bossTextures.ts` pattern `photoTextures.ts` is told to mirror), then _any_ second consumer wanting
a different crop of the same plate mutates the same object. That is exactly what the contact sheet
wants (§9.4). Pin it in the Lane B brief: **one crop per plate texture instance, at any instant.**

### 9.4 Contact sheet — free as DOM, a B10 blow-out as canvas

Six thumbnails, each a different crop of the plate. In-canvas that is six simultaneous different
`Texture.offset` values on one image ⇒ six `texture.clone()`s ⇒ **6 × 3.9 = 23.6 MB** at a
1280×768 plate (**B10 mobile FAIL on its own**, before the plate itself is counted), plus 6 draw
calls and 6 material instances.

As DOM — which is what the techplan already specifies (`ContactSheet.tsx` + `.module.css`) — it is
**one** `<img>`/`background-image` referencing an already-decoded, already-cached bitmap, cropped
six ways by `background-position` / `background-size`. **Zero added VRAM, zero draw calls**, and
the browser's image cache is already warm from the plate's own preload. Keep it there. The failure
mode to guard is the innocent-looking "let's render the thumbnails from the actual scene so they
match" — that is a canvas readback (`toDataURL`/`readPixels`), which stalls the GL pipeline
for a full frame each. Six of them at scene end is a visible hitch on the beat where the player
is reading their reward.

### 9.5 G-1 — the world behind the plate (my #1 finding, and the specs are silent on it)

The set-piece is a **frozen-scene block**: `tickGameState` returns `...state` with
`elapsedSeconds` frozen. The game state survives — **and so does the entire R3F scene graph.**
Unless Lane B does something about it, every frame of the set-piece still issues Belliard's
world pass: **73 p50 / 86 max draw calls on desktop, 57 p50 on mobile** (§4 baseline), the
backdrop's 30.55 MB texture, the facade slots, the enemy sprites, `NearForeground`, the window
grilles — all of it fully occluded by an opaque full-screen plate, all of it rasterised and
depth-tested before anything can reject it, all of it followed by the unchanged 5-pass CRT chain.

Duration matters here and it is large: `briefingMaxSeconds 25` + `sceneDuration 60` +
`CONTACT_SHEET_READ_BUDGET 30` ≈ **115 s per attempt**, and `maxAttempts 2` ⇒ up to **~4 minutes**
of fully-occluded world rendering per Belliard mission. On a phone that is 4 minutes of pure
thermal debt paid for pixels no one sees — and it lands right before the level's own boss finale.

**This is not the hostage duel.** The hostage QTE zooms the camera _into_ the world and must keep
it (`qteCamera.ts`). The photo set-piece _replaces_ the world. It is the one set-piece where
skipping the world is not just legal, it is the obvious reading of the design.

**Candidate remedies, ranked cheap-first (owner: `dev-r3f-render`, arbitration: `senior-architect`):**

1. **`visible={false}` on the world group while `isPhotoQteActive`.** One prop. three.js skips the
   subtree at cull time — no draw calls, no state changes, scene graph and every material/texture
   left intact, so resuming is a single boolean and cannot hitch. **This is what I would build.**
2. Conditional unmount of the world subtree. Cheaper still per frame (R3F stops traversing), but
   R3F rebuilds the graph on remount at the exact moment the level resumes — a hitch risk on the
   _return_, which is a gameplay moment. Only if (1) measures short.
3. Do nothing and rely on early-Z. **Rejected:** early-Z rejects fragments, not draw calls, not
   vertex work, and not the CPU-side validation that **B2**'s whole rationale is about. On a tiler
   it also does not save the binning pass.

**Stage-5 position:** I will measure `renderer.info.render.calls` during `ACTIVE` and verdict it
against **B13** (≤ 10). A set-piece frame at 60+ calls is a **FAIL**, not an OPTIMIZE.

### 9.6 G-2 — the shader compile at the set-piece's first open (**B6** breach as specified)

**B6 is `0` programs compiled after the first frame, and this feature breaks it as written.**
Baseline is 7 programs, all built during the loading gate. `PhotoQteView` introduces at minimum a
new plate material, and every material the eyepiece vignette / brackets / grain dress needs. Those
programs compile the **first time the surface mounts** — which is at `triggerAtElapsedSeconds =
2.5 s` into Belliard, mid-mission, on a driver that may take 50–300 ms to link a program. On
mobile that is a multi-frame freeze on the exact frame the beat opens, on level 1, on the path
every player takes.

`warmAssets.ts` warms **textures and audio only** — there is no shader-warm path in this codebase
(I checked: `warm()` dispatches to texture caches, `Howl`, and `warmImage`). So the loading gate
cannot currently cover this, and nothing else will.

**Candidate remedies (owner: `dev-r3f-render`; the manifest half, if any, is `dev-tooling-assets`):**

1. `renderer.compile(scene, camera)` over an off-screen instance of the set-piece's materials
   during the `LoadingScreen` — the standard three.js answer, one call, no new architecture.
2. Mount `PhotoQteView` once at zero scale / `visible={false}` for one frame behind the loader.
   Cruder, but it also warms the _texture_ binding, not just the program.
3. Reuse existing materials wherever the dress allows (a tinted instance of an already-compiled
   material compiles nothing). Cheapest of all where it applies; it will not cover everything.

**Stage-5 position:** `renderer.info.programs.length` before and after the first set-piece open.
Any delta is a **B6 FAIL**. This one is measurable in the sandbox, including under SwiftShader.

### 9.6bis Two render-side composites the art gate has already ruled in — and they land on B5/B6

The art-lane hand-off (`docs/handoffs/story-qte-photo-paparazzi.md`) rules that **the registration
plate's characters** and **the headlight sweep** are composited **render-side**, over the plate.
Both are Lane B surfaces that did not exist when §9.1 was ranked, and both touch a budget line:

- **The plate characters** — glyphs over a blanked panel (the LOOT-crate precedent). Cost: a few
  small quads or a DOM/canvas text layer. Negligible against **B5**. The one constraint that is
  mine: _it must not be a per-frame `CanvasTexture` regeneration_ — the glyphs are static for the
  whole scene, so build the texture **once** at set-piece open (or, better, at the loading gate,
  which also serves **B6**), never in `useFrame`. **B12** applies verbatim.
- **The headlight sweep** — this one is the live one. It is the **only** element permitted to
  project `inCover` (D-J / R3-2), so it animates continuously for 60 s, and a "sweep" of light is
  almost certainly an **additive blend**. If it is authored as a full-screen additive quad it is
  **1.0× screen of added blended coverage against a mobile B5 allowance of 0.75×** — a breach on
  its own. Remedies, cheapest first: (a) scope the quad to the passage mouth's rect rather than the
  frame (the fiction only lights the passage mouth — the sweep has no business covering the sky);
  (b) bake the lit/unlit states into the plate's own texture and cross-fade UV layers (zero added
  blended coverage, but it costs a second plate ⇒ re-price against **B10**); (c) keep it
  full-screen but multiply into the base pass instead of adding a second blended layer.
  It is also a **new material ⇒ a new program ⇒ a B6 compile** unless warmed with the rest (§9.6).

**Both are inside the C1/C2 conditions of §9.9; neither changes the verdict.** Recorded here so
the sweep is not discovered at stage 5 as "a small art detail" — it is the one continuously
animated blended surface in the whole set-piece.

### 9.7 The preload question — the techplan's premise is wrong, its conclusion is right by accident

The techplan (§6 Lane C, Rev.3) says the relocation makes the plate "more expensive" because
"Belliard's manifest is what a brand-new player downloads before their first frame
(`FIRST_PLAYABLE_LEVEL`)", taxing **time-to-first-play**, and resolves it with "a named preload
GROUP, not a core roster entry — the shape `assetManifest.ts` already uses for `edge-scroll` and
`boss-finale-switch`, warmed on level entry rather than at first paint."

**Three factual corrections, all measured or read in this worktree:**

1. **Time-to-first-frame is not on this path.** The cold-boot roster is `manifestFor("menu")` —
   **1 asset, 0.10 MB** (measured). `App.tsx:509-528` gates on `"menu"` at `TITLE`/`MENU` and only
   switches the target to `selectedLevel.id` at level selection; the TITLE cover itself is
   explicitly ungated. The Belliard roster (**54 assets, 30.42 MB**, measured) is warmed behind a
   `LoadingScreen` **after the menu**. Nothing the plate does can tax the first frame.
   `FIRST_PLAYABLE_LEVEL` appears in `assetManifest.ts:130-133` as the **fallback for an unknown
   level id**, not as a boot roster.
2. **There is no "named preload group" mechanism in this codebase.** `GESTURE_EMBEDDED_ASSETS` /
   `DIAGRAM_EMBEDDED_ASSETS` (`assetManifest.ts:365-385`) are **branch-conditioned inclusions into
   the same eager list**, selected at manifest-build time by which tutorial scene the device fork
   picked. `manifestFor` returns one flat array and `useAssetPreloader` blocks the gate on all of
   it. There is no deferred warm-on-entry tier to reuse.
3. **"Warmed on level entry rather than at first paint" is a description of what already happens.**
   The guarantee the plan wants — warm before the trigger, never a blank plate — is delivered by
   the existing roster at zero new architecture, and is unit-testable today
   (`assetManifest.test.ts` asserts membership of a path in the list).

**My call: put the plate and the poses in `manifestFor("belliard")` as plain roster entries.
Do not build a preload-group mechanism.** Reasons, in order:

- **Lazy cannot win this race.** `triggerAtElapsedSeconds = 2.5 s` (spec §8, frozen). A lazy fetch
  would have 2.5 s to pull and decode ~2–4 MB on a phone on cellular. It loses, and the failure
  mode is precisely the "set-piece pops open on a blank plate" the plan set out to prevent.
- **The honest cost is small and lands in the right place.** Option B of §9.2 is ≈ +2.5 MB on the
  wire against a **30.42 MB** gate: **+8 %** of a progress bar the player already sits through,
  once per session. That is the number worth arguing about, and it is not a big one.
- **The comparison that settles it:** the plate at 9.4 MB resident is **31 %** of the single
  `street-wide.png` texture Belliard already keeps resident at all times. This feature does not
  change the shape of Belliard's memory profile; it adds a third of one existing texture.

**One real waste, and the techplan did not name it.** `enabledOnFirstRun: false` (spec §8, ruling
R3-5) means that on a player's **first** Belliard run the plate and poses are downloaded, decoded
and **never drawn**. That is the run where load time matters most. The instrument is not a preload
group: it is `photoAssetPaths(levelId)` returning `[]` when the set-piece is off, driven by the
**same** progression predicate `App.tsx handlePlay` already computes for `photoQteEnabled`. One
argument threaded into the manifest target; the first run stays byte-identical.
**This needs a `senior-architect` ruling**, because it puts a progression-derived value into a
manifest call that today takes a bare level id — and `assetManifest.ts` is deliberately free of
storage reads. I price it; I do not decide the boundary.

### 9.8 The false problems, stated so nobody spends a sprint on them

- **The full-screen plate quad.** One opaque draw call, 1× screen coverage, and it _replaces_
  world coverage rather than adding to it. Against **B5** it is a net **reduction** once §9.5 is
  fixed. It is the cheapest thing in the whole set-piece.
- **Sway, done as UVs.** Two uniform writes per frame. Not measurable.
- **Reduced motion.** It lives entirely in the pure tick (linear easing, `SWAY_LEG_DURATION_RM`,
  **identical amplitudes** — spec §3.4). Same geometry, same shader, same draw count, both modes.
  **Zero GPU cost, and the two modes are byte-identical to the renderer.** The only perf-relevant
  thing to say about reduced motion is a prohibition the techplan already issues: no second
  render-side reduced-motion branch. A render fork would double the material permutations and
  hand **B6** a second compile.
- **The AF brackets.** Four corner marks. GPU-side, nothing. The real question is DOM: they move
  every frame with sway, so drive them with `transform: translate3d()` fed by CSS custom
  properties (the ADR-0046 dynamic-value path), never `top`/`left` (layout thrash on every frame
  of a 60 s scene), and never by remounting nodes. **B9** also applies: `photoFraming.projectBox`
  allocates a fresh `FrameRect` per call, and at 1 viewfinder + 1 subject box + 4 brackets that is
  ~6 objects/frame against a mobile allowance of 16 shared with every other lane. Fine as
  specified; it has no room for a per-bracket allocation loop on top.
- **The traffic-signal / cover concern (D-J).** Correctly resolved for determinism reasons, and it
  is perf-neutral either way — one decorative sprite, off-screen while the set-piece holds the
  frame.

### 9.9 Verdict (a priori)

**VERDICT: CONDITIONAL — GPU / frame budget (`gpu-specialist`), tiers `desktop` + `mobile`.**
This is a design-cost review; it binds no build. Two conditions must be met by Lane B before I can
issue a stage-5 PASS, and both are verifiable **in the sandbox**:

- **C1 (B13) — the occluded world must not be drawn during `ACTIVE`.** §9.5. Verified by
  `renderer.info.render.calls` during the set-piece.
- **C2 (B6) — zero shader programs compiled at the set-piece's first open.** §9.6. Verified by
  `renderer.info.programs.length` before/after.

And two decisions must land before stage 5, neither of them mine:

- **D1 — the plate/pose pixel resolutions** (§9.2), routed to `senior-architect` for an art
  (`lead-art`) + design (`game-designer`) trade. Priced above; option **B** or **F** is inside
  every line, **C** and **D** are not.
- **D2 — the first-run manifest skip** (§9.7), routed to `senior-architect` as a boundary call.
  Non-blocking: the feature is inside budget without it.

Everything else in the specs is either free or cheaply guarded, and the memory story is
comfortable: the whole set-piece at option B costs less than a third of one texture Belliard
already keeps resident.

**Not verified and not verifiable here: B1 (frame time) on any real device.** SwiftShader gives me
draw calls, programs, targets and formats — it gives me nothing about a mobile tiler holding a
30 MB backdrop resident behind a full-screen plate for four minutes. **DEFERRED-ON-TARGET**,
protocol §10, ready to run.

---

## 10. On-target protocol — story `qte-photo-paparazzi` (ready to run)

Owner of the run: Bertrand. Chased by `producer`. Same closure rules as §6: under budget ⇒ record
the PASS and close the deferral; over budget with the PR open ⇒ the DEFERRED pass is **REVOKED**
and becomes a stage-5 FAIL routed to `dev-r3f-render` via the architect; over budget after merge ⇒
a fix-lane cycle that only a PERF re-verdict (this protocol, re-run) can close.

**Build:** the branch preview for `design/qte-photo-paparazzi`
(`https://bczy.github.io/prohimuf/preview/design-qte-photo-paparazzi/` — confirm the slug against
the PR body before running; a wrong slug silently measures `main`).
**Baseline:** `https://bczy.github.io/prohimuf/` (main).
**Run both, back to back, same device, same session, same thermal state.** An absolute fps number
on an unknown thermal state is worth nothing; the A/B is the measurement.

**Setup, on every device, before P1:** the set-piece does **not** fire on a first Belliard run
(`enabledOnFirstRun: false`). Play one Belliard mission to completion first, or the whole protocol
measures a level with no set-piece in it. Note in the report which state you were in.

### Devices

| #   | Class                                            | Binds tier | Priority                                                                             |
| --- | ------------------------------------------------ | ---------- | ------------------------------------------------------------------------------------ |
| D1  | Any desktop/laptop browser                       | `desktop`  | required                                                                             |
| D2  | Mid-range Android, 2020-era SoC (Snapdragon 7xx) | `mobile`   | **required — this is the cliff device**                                              |
| D3  | Any iPhone (A12+)                                | `mobile`   | strongly wanted: different tiler, and the **B11** question (P0) is a driver question |

### Scenarios

| Id  | Scenario                                                                                                                     | Reads                                                                                        |
| --- | ---------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------- |
| P0  | **Belliard, ordinary play, no set-piece.** Does the backdrop draw at all? Look for a black/white/1×1 street.                 | **B11** (the grandfathered 6418 px texture)                                                  |
| P1  | Enter Belliard, let the set-piece trigger, sit through `BRIEFING` → `ESTABLISHING` → the full 60 s `ACTIVE` without shooting | **B1**, §9.5                                                                                 |
| P2  | `ACTIVE`, camera **RAISED**, at `FOCAL_MAX` (300 mm), panning the viewfinder continuously for 20 s                           | **B1**, **B12**, §9.3 — the worst-case sampling frame                                        |
| P3  | Raise/lower the camera 10× in 20 s (desktop: Space; mobile: the toggle button)                                               | **B6** — a per-posture material would compile here                                           |
| P4  | Shoot all 6 frames, reach `DEVELOPING` → `CONTACT_SHEET`, read the sheet for 30 s                                            | §9.4 — thumbnail cost, and any hitch on the transition                                       |
| P5  | `[ RECOMMENCER ]` → second attempt, full 60 s again; then `[ LAISSER TOMBER ]` and **play the rest of Belliard to the boss** | **B1** on the resume, and the thermal tail — the finale is downstream of ~4 min of set-piece |
| P6  | Enter the set-piece with **reduced motion** on (OS-level), repeat P2 for 20 s                                                | Confirms §9.8 — should be indistinguishable from P2                                          |
| P7  | Mid-`ACTIVE`, rotate the device / resize the window across a dpr boundary; then pause and resume                             | RT resize + T-5 posture reset, no black frame, no leak                                       |

### How to read the numbers

Identical instrumentation to §6 — **Rendering → Frame Rendering Stats** live, plus a 20 s
**Performance** profile per scenario; Android over `chrome://inspect`, iPhone over Safari →
Develop → Timelines. **Additionally, for this story:**

- **The set-piece frame is a HELD TABLEAU.** Read **p50 and the count of frames > 33 ms**, not the
  max: one long frame on the transition into `ACTIVE` is expected (texture bind) and is not the
  finding. A _rising_ p50 across P1's 60 s is.
- **P3 and the P1 entry are the B6 reads.** Watch for a single 100 ms+ frame at the first open that
  does **not** recur on the second attempt (P5). That signature — expensive once, free thereafter —
  is a shader compile, and it is the finding.
- **P5 is the thermal read and it is the one I care most about on D2.** Compare Belliard's boss
  finale frame time in P5 (after ~4 minutes of set-piece) against the same finale reached without
  the set-piece on `main`. A phone that passes P1 and fails the finale afterwards has told you the
  set-piece's real cost.
- **Note battery/thermal state and whether the device was plugged in.** A plugged-in phone will
  pass a protocol a pocket phone fails.

### Pass thresholds

| Line    | Scenario                  | D1 (`desktop`)                                                      | D2 / D3 (`mobile`)                                                                                       |
| ------- | ------------------------- | ------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------- |
| **B1**  | P1, P2                    | p50 ≤ 16.6 ms, p95 ≤ 20 ms                                          | p50 ≤ 20 ms, p95 ≤ 33 ms (a held tableau, not aiming)                                                    |
| **B1**  | P4                        | p50 ≤ 16.6 ms                                                       | p50 ≤ 20 ms                                                                                              |
| **B1**  | P5 finale                 | p50 ≤ 16.6 ms, p95 ≤ 25 ms                                          | p50 ≤ 20 ms, p95 ≤ 33 ms                                                                                 |
| **Δ**   | P5 finale, branch vs main | ≤ **+1.5 ms** p50                                                   | ≤ **+2.0 ms** p50 — **the thermal-debt gate**                                                            |
| **B6**  | P1 entry, P3              | no frame > 100 ms after the loading gate                            | no frame > 100 ms after the loading gate                                                                 |
| **B11** | P0                        | backdrop draws normally                                             | backdrop draws normally (a black/blank street is a **hard FAIL** and re-opens B11 for the shipped asset) |
| —       | P6 vs P2                  | frame times indistinguishable (Δ p50 ≤ 0.5 ms)                      | same — reduced motion must cost nothing GPU-side                                                         |
| —       | P7                        | no black frame, no leak, RT resize clean; posture resumes `LOWERED` | same                                                                                                     |
| —       | P4                        | contact sheet appears without a visible hitch                       | same — a hitch here is the canvas-readback failure mode of §9.4                                          |

**The Δ line on P5 is the real gate**, for the same reason as §6: if the absolute p50 fails on D2
but Δ is under +2.0 ms, the branch is not the cause and that is a pre-existing `mobile` finding,
not a FAIL of this story.

### If the harness (§7) exists by then

`?perf=1` collapses P1–P6 into "read the overlay on the phone" with no USB, and
`window.__MUF_PERF__()` makes **C1** (B13) and **C2** (B6) assertable in CI as a regression gate
rather than a one-off measurement. Both conditions in §9.9 are device-independent — SwiftShader is
a legitimate host for exactly those two checks. **That is the strongest argument yet for building
§7**, and it is now the second story to need it.
