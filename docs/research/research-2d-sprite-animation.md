# Research — Generating coherent 2D sprite animation by AI, for muf's pipeline

- **Asked by:** Bertrand → tech-scout (Nadia 🔭)
- **Date:** 2026-07-18
- **Harness:** `deep-research` — 5 angles, 19 sources, 95 claims, 25 adversarially
  verified (14 confirmed 3-vote, 2 refuted, 9 cut short by a spend limit). The
  automatic synthesis step was interrupted; this report is the hand synthesis of the
  verified claims. Confidence is flagged per section.

## Question

Proven (2024–2026) ways to generate **coherent 2D sprite animation** by AI that fit
muf's constraints: FLUX via Pollinations.ai (free, no key, CI GitHub Actions),
chroma-keyed flat sprites in a fanzine B&W + acid-neon style, short 2–8 frame flipbooks
declared in JSON (one image per frame, pinned seed), read in an R3F browser game by a
pure frame-selector. Wanted: an honest cost/quality/CI-integrability comparison and a
concrete recommendation for short rigid motions (gun recoil, wheel spin, pedalling) and
idle→action→idle transitions.

## Headline finding

muf's style is **not pixel art**, which rules out the mainstream "AI sprite animation"
products (Retro Diffusion, PixelLab) on aesthetic grounds. The two approaches that fit
are already within reach and free:

1. **Instruction-editing with FLUX Kontext, on Pollinations** — generate coherent frames
   by *editing a base frame*, not by re-rolling a seed. Same platform, no key, free.
2. **Procedural mesh deformation in R3F** — for rigid motion, animate a single static
   sprite by code (no per-frame generation at all).

## Evidence (verified claims)

### a) Inter-frame coherence with diffusion — CONFIRMED
- **Pollinations supports seed parameters** for reproducible generations (SDK forwards
  seeds). muf's seed-pinning is a supported platform feature. `3-0`
  — <https://github.com/pollinations/pollinations>
- **Pollinations offers image *editing***, not just text-to-image, including
  gptimage-family and a `kontext` model on dedicated routes — instruction-based editing
  is available on the platform muf already uses. `3-0` — same source
- The "Pollinations now requires an API key / paid Pollen" claim was **REFUTED** by a
  live keyless test on 2026-07-18 (HTTP 200, real image, no key/account). `0-3`
- **FLUX.1 Kontext** unifies generation + instruction editing, using an existing image
  as *context* for edits — directly applicable to coherent frames from a base sprite.
  `3-0` — <https://arxiv.org/html/2506.15742v2>
- **But consistency degrades after ~6 iterative edits** (documented identity drift /
  artifacts). ⇒ edit every frame **from the base frame**, never chain N→N+1; 2–8 frames
  is the safe regime. `3-0` — same source
- The claim that Kontext beats GPT-Image/Gen-4 at multi-turn identity was **REFUTED**
  (`1-2`) — it's good, not a silver bullet. Alternative: **Qwen-Image-Edit v2509** takes
  up to 3 input images and reads OpenPose skeletons natively (no LoRA). *(fetch-extracted,
  verification cut short.)*
- Kontext is also on fal.ai at ~$0.04/image (Kontext pro) if a paid path is ever wanted.

### b) Specialised sprite/pixel-art tools — CONFIRMED, but wrong fit
- **Retro Diffusion `rd-animation`** (Replicate) makes style-consistent animated pixel
  sprites / spritesheets — but the image reference **only guides style/identity, it is
  NOT an img2img init**, so an existing FLUX sprite can't be animated pixel-for-pixel;
  output is a *redrawn pixel-art* interpretation. `3-0`
  — <https://replicate.com/retro-diffusion/rd-animation>
- Retro Diffusion has a cloud REST API (no local GPU) but needs a key (`X-RD-Token`) and
  is paid (~$0.03–0.18/image, $0.14–0.25/animation; free `check_cost` dry-run). `3-0`
  — <https://github.com/Retro-Diffusion/api-examples>
- **PixelLab** offers skeleton animation (≤128px) and text-to-animation v3 (≤16 frames,
  start+end frame conditioning → idle→action→idle) — but it is paid ($0.002–0.185/gen,
  no free tier) and **pixel-art** at small canvas. `3-0`
  — <https://www.pixellab.ai/pixellab-api>
- Verdict: both are pixel-art + paid ⇒ **wrong aesthetic for muf, exclude.**

### c) Frame interpolation / in-betweens — MIXED confidence
- **FILM** (Google, open-source) interpolates between two images with a single unified
  net (no separate optical-flow net) — a candidate for densifying a 2-pose flip.
  *(fetch-extracted; verification cut short.)*
  — <https://github.com/google-research/frame-interpolation>
- **Bitmapflow** (MIT) makes optical-flow in-betweens for sprites, **but it's a Godot GUI
  app, not a CLI** → awkward in CI. *(fetch-extracted.)*
- Practitioner caveat: **chroma-keying AI-*animated* output fails** — the model doesn't
  preserve the exact key colour, leaving residual key pixels. ⇒ interpolate **after**
  cut-out, on alpha, never before. *(blog-sourced, medium confidence.)*

### d) Procedural / hybrid — CONFIRMED, most underrated
- **Free-Form Deformation**: animate one static sprite via a 2D vertex mesh — move vertex
  subsets per frame while UVs stay fixed (squash/stretch, pivoted rotation, easing). No
  per-frame images. Native fit for R3F and for muf's existing `flipbookFrame` (swap "which
  texture" for "which deformation"). `3-0`
  — <https://gamedev.net/forums/topic/679074-a-guide-on-procedural-sprite-animation/>
- A Feb-2026 paper auto-generates Spine2D meshes from a sprite (×300–1200 vs manual),
  confirming "static AI sprite + 2D rig" is an active, viable path.
  — <https://arxiv.org/html/2602.21153v1>

### e) What indie/jam devs actually do — CONFIRMED
- Aug-2024: no AI tool trained on spritesheets; general text-to-image gives "random,
  inconsistent frames." By 2026 specialised models exist — but pixel-art only. For a
  non-pixel style like muf's, the shipped path is **static generation + code/rig
  animation**, not full-AI frames.

## Recommendation for muf

A **two-track hybrid**, keyed by motion type, plugged into the existing `flipbookFrame`:

1. **Rigid motion → procedural mesh deformation (0 generation).** Gun recoil, wheel spin,
   pedalling, idle sway: affine/mesh transforms on one already-generated, cut-out sprite.
   Add a small pure clip system in `src/game` (loop/once + idle→action→idle transitions)
   emitting deformation params; `src/render` applies them to the plane. Free,
   deterministic, Vitest-testable, respects the game/render/hooks boundary.
2. **Genuinely different poses → Kontext edit on Pollinations (0€).** Edit the **base
   frame** via Pollinations' `kontext` model instead of re-seeding. Rule from the paper:
   always edit from frame 1, never chain, ≤6 variants.

**Exclude:** Retro Diffusion / PixelLab (pixel-art + paid); chroma-key *before* animation.

**Residual risks for the architect:** (a) Pollinations `kontext` quality/latency at muf's
style not yet empirically tested here — spike one enemy recoil before committing; (b)
mesh deformation adds a render-side capability (ADR-worthy, touches the render contract);
(c) 9 claims (ToonCrafter, FILM, Bitmapflow, PixelLab tier) are fetch-extracted but not
adversarially verified — treat as leads, not settled.
