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

| #      | Line                                           | `desktop`                                       | `mobile`                     | Verifiable  |
| ------ | ---------------------------------------------- | ----------------------------------------------- | ---------------------------- | ----------- |
| **B1** | Frame time, gameplay steady state              | ≤ 16.6 ms p50, ≤ 20 ms p95                      | ≤ 16.6 ms p50, ≤ 33 ms p95   | on-target   |
| **B2** | Draw calls per frame, gameplay steady state    | ≤ 150 total (world pass ≤ 140)                  | ≤ 90 total (world pass ≤ 80) | here        |
| **B3** | Fullscreen passes per frame                    | ≤ 5 (CRT: world, bright, blur H, blur V, comp.) | ≤ 5 (same)                   | here        |
| **B4** | Render-target memory (colour + depth)          | ≤ 16 MB                                         | ≤ 14 MB                      | here        |
| **B5** | Added alpha-blended coverage per frame         | ≤ 1.5× screen area                              | ≤ 0.75× screen area          | here (est.) |
| **B6** | Shader programs compiled after the first frame | 0                                               | 0                            | here        |
| **B7** | Ambient particle/décor quads (non-gameplay)    | ≤ 24 particles + ≤ 16 sprites                   | ≤ 12 particles + ≤ 8 sprites | here        |
| **B8** | Texture allocation for an effect               | shared singletons only; procedural ≤ 128×128    | same                         | here        |
| **B9** | Object allocations inside `useFrame`           | ≤ 32 short-lived objects/frame across all lanes | ≤ 16                         | here        |

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
