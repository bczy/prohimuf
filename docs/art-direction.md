# Art direction — muf

The single source of truth for every visual in muf. Owned by **lead-art** (Nico);
changes go through him. Prompts are authored by **concept-artist** (Maud), grounded by
**art-advisor** (Estelle). Reference URLs + licenses: `docs/art-direction/references/LICENSES.md`.

---

## 1. Identity

**Photocopied fanzine B&W + acid neon.** 1998, Paris, clandestine rave logistics.
The game reads like a free-party flyer that came alive: degraded xerox halftone,
high-contrast black & white, cut-and-paste energy — with acid neon as the only color,
reserved for what matters.

Historical anchors (see LICENSES.md for sources):

- **Prohibition (Atari ST, 1987)**: fixed shooting gallery, crosshair driven in 8
  directions over a facade several screens wide, enemies popping from windows /
  rooftops / manholes, countdown pressure, a depletable hide meter. The game reads
  as a **poster, not a diorama** — flat frontal facades, one hostile at a time.
- **French free-party flyers 1991-2000**: photocopied, information-minimal,
  deliberately enigmatic; Spiral Tribe vocabulary (centered iconography, rounded
  type, spirals, early-3D geometry). Generational xerox degradation IS the texture.

## 2. The three laws

1. **La loi du glow** — _ce qui brille est interactif._ Every interactive object
   (vehicles, enemies, crosshair, pickups, HUD alerts) carries a luminous neon rim in
   its assigned accent hue. Nothing decorative glows. Assigned hues live in data
   (`levelArt.json` `neon` fields), hex-anchored: orange `#FF8C14`, cyan `#28F0FF`,
   magenta `#FF3CDC`, green `#78FF3C`. The law governs the on-screen **result**, not the
   production method: the rim may be **baked** into the sprite OR **applied at render
   time**. For the delivery **vehicles** the rim is render-side (ADR 0011) — an additive
   emissive silhouette drawn in `src/render`, hue from the `neon` data field. Their
   sprites are therefore generated **pure black-and-white with no neon token in the
   prompt** (three baked-rim batches flooded the body; the runtime rim makes that
   structurally impossible and lets the glow go live, responding to delivery phase). For
   the vehicle set the loi du glow is satisfied by the renderer, and the asset gate judges
   the sprite as pure B&W — a baked neon rim on a vehicle sprite is now itself off-spec.
   **Un halo est un dégradé, jamais un aplat.** A glow is light, and light falls off:
   every glow or halo — baked or render-side — MUST carry an alpha falloff that decreases
   from the sprite edge outward, reaching zero at the outer margin. A flat, binary-alpha
   glow (a hard-edged solid neon plate, opacity constant then cut to nothing) is not a
   glow, it is a decal — **automatic FAIL**. Measurable: sample the rim from the sprite
   edge to the outer margin; alpha must be monotonically non-increasing and terminate at 0,
   never a single opaque step. This governs the on-screen composite, so it is checked on
   real in-game screenshots at the composite gate (Gate 4), not on the delivered PNG alone.
2. **Family consistency** — assets in a set are one printing run: byte-identical
   shared style block in prompts, same ground, same line weight, same treatment.
   One off-family asset fails the whole set.
3. **Silhouette first** — every sprite identifiable by silhouette alone at game size.
   Wrong vehicle class / wrong archetype = automatic FAIL regardless of rendering
   quality. **AI-generation defects are an automatic set FAIL**: FLUX is a fill tool,
   not a draughtsman, and it will hand you detached, duplicated, fused or
   perspective-incoherent anatomy (a leg not joined to the hip, a hand webbed into the
   handlebar, a third pedal, melted texture). These read as broken at game size, so they
   fail on the same footing as wrong archetype. Such a defect often only surfaces after
   the keyer punches the background out: **an enclosed light region falling over the body
   (hips, armpits, crotch, between fingers) is a suspected generation hole, not
   background** — flag it, do not accept the auto-key. The sweep runs on every new
   generated asset AND every scripted retouch, on a contrasting background at game size;
   `scripts/check-sprite-integrity.mjs` is its mechanical floor, non-binding on taste.

## 2bis. La loi de l'imprimé — surfaces UI / menus (menu-side complement of the loi du glow)

Inserted (not a restructure) as the print-side pair of §2 law 1. Every **pre-game / menu
surface** (title, flyer wall, scores UNE, options colophon, rotate overlay, narrative /
briefing frame) is an **artifact of the fanzine world, printed on paper** — bright stock,
black ink, xerox texture. **Zero glow in menus.** Glow is colored light with alpha falloff
and it means _interactive_ — it is reserved for the in-game world (§2 law 1). A menu surface
carries **no** colored luminous rim, **no** `text-shadow`/`box-shadow`-as-glow, **no**
`backdrop-filter: blur`, **no** CRT scanline, **no** RGB-split. **If a menu screen glows on a
dark ground it has drifted — automatic FAIL, not a taste note.**

- **One fluo stock per surface** (guidelines §5). Stocks are **paper**, not glow: they are
  the desaturated/lightened cousins of the in-game neon palette, chosen so **black ink clears
  WCAG AA (≥ 4.5:1) on every stock** — the fluo cards sit at AA, not AAA (rose 6.14:1, orange
  6.68:1), while ≥ 7:1 (AAA) holds only on newsprint/manila. Do not reuse the §2 glow hexes as
  a menu ground.
- **The facade photo on a menu is allowed only rephotocopied to pure B&W** —
  `filter: grayscale(1) contrast(~2.2) brightness(~1.1)` on the existing PNG, over a dot-
  screen overlay. Any surviving warm window-**glow** (partial desaturation) reintroduces glow
  on a menu = **FAIL**. `grayscale(1)` is mandatory, not `grayscale(.9)`.
- **A sprite shown over a location décor is printed with it** — when a briefing illustration
  slot sits on a halftone facade backdrop (ADR-0023), the sprite carries `filter: grayscale(1)`
  (+ mild `contrast`) so it reads as **one printing** with that facade: stray sprite colour
  (badge, uniform) is killed, no colour island floats over the B&W wash. Always the **bare** PNG,
  never a neon-rimmed composite (the in-game rim is render-side, §2 law 1 — a menu has zero glow).
  **No** heavy halftone dot-screen on the sprite: it would eat the silhouette (§2 law 3); the
  `pixelated` raster already reads xerox-adjacent. Décor-less slots (the tutorial bestiary) keep
  their own already-accepted treatment — the grayscale is the facade-coherence tell, not a blanket
  rule. (ADR-0012 / ADR-0023.)
- **State is hand-work, not light.** Hover = flyer pull / marker ring; focus = inked marker
  ellipse (always visible); selected = X-stamp / tick / tape corners. The only allowed
  "pulse" is the typewriter cursor blink (a répondeur/typewriter cursor, not a glow).
- **Semantic colour survives as ink, never glow.** The three difficulty tells stay green /
  orange / pink as **felt-tip marker/stamp inks**, reinforced by a **distinct stamp shape**
  and a **toner-black keyline** so the mark reads even when its hue nears the flyer's own
  stock. The old "interactive yellow" does **not** become a yellow ink (invisible on light
  stock): interactivity/selection reads as **black selection marks** (X-stamp, marker circle,
  tape) plus the **jaune cover stock**.

### 2bis.1 Print token anchors (source of truth for `dev-r3f-render`)

Paper stocks — fluo copier card, black-ink grounds:

| Token             | Hex       | Surface                                                        |
| ----------------- | --------- | -------------------------------------------------------------- |
| `stock-jaune`     | `#F1EC1F` | TITLE cover **only** (brightest = the hook; not in rotation)   |
| `stock-rose`      | `#FF4FA3` | flyer — Belliard (playable idx 0); UNE masthead accent         |
| `stock-vert`      | `#B7F32B` | flyer — Stalingrad (playable idx 1)                            |
| `stock-orange`    | `#F5762A` | flyer — Vitry (playable idx 2); OPTIONS colophon               |
| `stock-manila`    | `#ECE7DA` | tutorial "mode d'emploi" sheet (not a fluo — a marked-up copy) |
| `paper-newsprint` | `#E9E3D2` | SCORES _UNE_ ground; narrative/briefing transcript ground      |
| `paper-shell`     | `#D7D2C6` | NIVEAUX flyer-wall backing (cool grey, so flyers pop)          |

Ink:

| Token       | Hex       | Use                                        |
| ----------- | --------- | ------------------------------------------ |
| `ink-black` | `#141210` | body, Courier info blocks, rules, keylines |
| `ink-full`  | `#000000` | display / ransom headlines + stamp fills   |

Marker / stamp inks (semantic — always with `ink-black` keyline + distinct shape):

| Token         | Hex       | Meaning                         |
| ------------- | --------- | ------------------------------- |
| `mark-green`  | `#2FA84F` | FACILE · record / rank-1 circle |
| `mark-orange` | `#E8641E` | NORMAL                          |
| `mark-pink`   | `#D62A7A` | DIFFICILE                       |

Texture (all CSS/inline-SVG — **no generated PNG**): uniform dot-screen overlay
(`radial-gradient` tile, 3–4 px body / 8–12 px hero) stands in for value-modulated halftone;
toner speckle via inline-SVG `feTurbulence` data-URI; fold streaks via diagonal
`linear-gradient`; marker-ellipse / rubber-stamp distress via inline-SVG
`feTurbulence`+`feDisplacementMap` (a plain geometric CSS border is an accepted-but-weaker
fallback). Ransom/Letraset display type = per-letter jitter over the embedded **Rubik Mono
One** display webfont (techno-flyer block); Courier info blocks use embedded **Courier
Prime** (typewriter face) and
handwriting annotations the embedded **Caveat** marker hand. All three are self-hosted
OFL 1.1 woff2 in `src/assets/fonts/` (no CDN, offline-safe), registered by `fonts.css`
and single-sourced via the `FONT` token in `src/render/ui/print/tokens.ts` (ADR-0045);
the former system stacks (Impact / Courier New / cursive) remain as fallbacks. This closes
the display-webfont and handwriting-webfont fast-follows.

## 3. FLUX prompt rules (the contract `scripts/check-art-prompts.mjs` enforces)

Pollinations' `flux` is a FLUX.1 [schnell]-class distilled model: **no negative
prompts, no LoRA** — everything is carried by prompt text + pinned seed.

1. **Never negate.** FLUX reads "not photorealistic" as _photorealistic_. Describe the
   positive opposite: "flat 2D hand-printed illustration", "on a solid matte black
   background". Negation budget in prompts: ≤2 occurrences tolerated, >4 is a lint error.
2. **Front-load medium + view.** Early tokens weigh most: the prompt opens with
   "Flat 2D video game sprite, strict side view in orthographic projection…" before
   any subject word.
3. **Prose, 30-90 assembled words target; 120 hard ceiling** (`check-art-prompts.mjs`
   errors above 120, warns above 90). Natural language, no tag soup, no SD weight
   syntax. The count is the ASSEMBLED prompt (`opening` + subject + `neonPhrase` +
   `style`, §4); the four-slot split runs longer than a single block, and per-asset
   FAIL-fix clauses can push a prompt into the 90-120 warn band — tolerated ONLY when
   every word past 90 is a load-bearing silhouette/process/fix clause justified in
   `prompt-drafts.md`, never filler. The further past 90, the harder the asset gate
   scrutinises the tail. Medium, view and silhouette must all land in the first ~40
   words; the tail (style block + late fix-clauses) is the weakest attention zone, so
   family-critical treatment there is watched at the asset gate.
4. **One primary style**, stated as medium + era + process: "photocopied 1990s punk
   fanzine style: rough black ink linework, high-contrast xerox toner texture,
   halftone dots". Xerox is the law (not risograph, not grunge, not synthwave).
5. **Bind colors to surfaces with hex**: "uniform matte black background (#000000)",
   "acid orange (#FF8C14) neon rim light". "Dark" alone does nothing.
6. **Lock the camera with drafting vocabulary**: "strict profile", "orthographic
   projection", "wheels on baseline", "centered, fully visible".
7. **Steer silhouettes with automotive-design vocabulary**, never brand hopes or the
   failure-mode's name (naming "sedan" summons sedans): "one-box silhouette",
   "steep vertical tailgate instead of a trunk", "tall glasshouse", "flat-fronted
   forward-control van".
8. **Kill shadows/text positively**: "flat ambient lighting" (no cast shadow),
   "fanzine illustration" (a picture _in_ a zine — "zine cover/poster" summons type).
9. **Shared style block, verbatim** across the set; only the subject clause varies.
10. **Pin the seed.** `levelArt.json` carries a `seed` per asset; iterate one phrase
    at a time against the frozen seed; re-roll seeds only when composition is wrong;
    commit the winning seed. (`REROLL=1` env bypasses pins.)
11. **`enhance=false` always** — Pollinations' enhancer rewrites prompts through an
    LLM and destroys the verbatim style block. `nologo=true`, `private=true`.
12. **Style-lock stragglers via `kontext`** (image-to-image from an approved hero
    sprite) when prompt-only consistency plateaus — follow-up capability.

## 4. Prompt assembly (implemented in `scripts/gen-vehicle-sprites.mjs`)

```
[vehicles.opening]  →  [types.<t>.prompt]  →  [vehicles.neonPhrase{neon}/{hex}]  →  [vehicles.style]
   medium + view          subject/silhouette        law of glow, hex-anchored          shared set style
```

`opening`, `neonPhrase`, `style`, `prompt` strings are concept-artist territory;
structure/sizes/ids belong to `dev-tooling-assets`.

### 4.1 Enemy sprite flipbook family (`enemies` block)

The enemy sprites carry a minimal period flip — 2 frames at **6 fps**, the
Prohibition-1987 register (a hostile that shifts weight or recoils after firing),
never smooth animation. Data lives in the `enemies` block of `levelArt.json`
(`style`, `fps`, `size`, and `types` keyed by the exact base filename), read by
`scripts/gen-enemy-types.mjs`.

- **Frame files:** each extra frame is a **separate PNG** named `_f<N>` **after**
  the legacy variant suffix — `enemy_shooting_2_f2.png` = normal cop variant 2,
  shooting, frame 2. The `_f` prefix keeps the frame index distinct from the
  `_2`/`_3` variant suffix (ADR 0016).
- **Frame 1 is accepted art, never regenerated.** `frames[0]` is always `""`: the
  committed unsuffixed PNG is frame 1 and stays byte-stable (only `FORCE=1` or the
  matched-pair fallback ever touches it). `frames[i>0]` is a short **pose-delta
  clause** for that frame file — only the pose varies; the `style` block is
  appended **verbatim** to every frame (Family consistency, §2 law 2).
- **kontext img2img is the primary consistency strategy.** The extra frame is
  generated by `kontext` (§3.12) from the committed frame 1 as the `image=` source,
  so it is the SAME character in a new pose rather than an independent roll;
  a matched flux pair under the pinned seed is the fallback when kontext is
  unavailable.

### 4.2 Courier layered flipbook family (`courier` block)

The street courier (livreur) is a **2-layer composite** — a delivery **bike**
(wheel rotation) drawn UNDER a **rider** (pedaling stride), stacked as two planes
render-side (bike below rider, ADR 0017). Data lives in the `courier` block of
`levelArt.json` (`opening`, `style`, `fps`, `size`, and `layers` keyed
`bike` / `rider`), read by `scripts/gen-courier-sprites.mjs`.

- **Strip-and-slice, not per-frame.** Unlike the enemy flip, the courier has **no
  protected frame 1** to `kontext`-lock onto — every cell is a distinct pose in one
  continuous cycle. So each layer is generated as **one FLUX image**: a horizontal
  strip of `frames.length` identical square cells (strip width = `size.width * N`,
  always **derived**, never a manifest field), sliced on a fixed grid into the
  per-frame PNGs and chroma-keyed per file. A layer is **atomic** — two cells only
  match if they came from the same generation, so a single missing frame
  regenerates the whole strip.
- **Strip assembly.** The generator sends FLUX, per layer:
  `opening` (medium + "a single horizontal row of identical square cells") +
  `exactly ${N} cells, ` (derived from `frames.length`) + the layer `prompt`
  (subject/silhouette) + the per-cell clauses `cell 1: …; cell 2: …; …` + the
  shared `style` tail (verbatim, Family consistency §2 law 2).
- **Per-cell pose-clause contract.** Every `frames[i]` is a **non-empty** pose
  clause describing cell `i+1` — there is no `""` sentinel. Keep the clauses short
  and phase-ordered (the bike's 3-phase spoke rotation, the rider's 6-phase pedal
  stride).
- **Positive rider phrasing rule (§3.1 restated for this family).** The rider layer
  is described **positively** as a figure _in cycling posture_ — leaning torso,
  arms reaching to grip height, legs in pedaling stride — **never** by negating the
  bike (never "rider without a bike"; FLUX reads the negation as the thing). The
  bike is a _separate layer_; the rider prompt simply describes riding posture.

## 5. Silhouette anchors (period truth — 1998 Paris)

- **truck** — Renault Trafic mk1 / Citroën C25: "flat-fronted forward-control 80s
  panel van, near-vertical windshield, boxy cargo body taller than the cab line,
  single crease along the flank, steel wheels".
- **car** — Renault Twingo mk1 / Citroën AX: "one-box monospace city car, hood and
  windshield in one continuous slope, tail cut vertically flush behind the rear
  wheel, wheels pushed to the corners, tall glasshouse".
- **moto** — MBK Booster / Peugeot 103: "skeletal 90s moped, fat small-diameter
  wheels, exposed tube frame, single round headlamp, top-box crate strapped over the
  rear rack".
- **Facades/levels** — Prohibition grammar: flat frontal facade, grid of window
  openings where hostiles pop, everything interactive neon-marked.

## 6. Pipeline & gates

```
art-advisor (references) → concept-artist (prompts)
  → game-graphist PRE-PROD PASS (readability at game size, keying soundness)
  → lead-art PROMPT GATE
  → generation (marker dispatch; seeds pinned; enhance=false)
      → scripts/check-sprite-style.mjs (mechanical: dark ground, silhouette aspect bounds,
        + neon hue band: LOWER bound where the rim is baked; for the render-side-rim
        VEHICLE set (ADR 0011) an UPPER-bound flood-kill instead — ≤~18% saturated hue,
        near-zero expected, catches a FLUX colour flood) — bad rolls auto-retried, bounded
  → game-graphist TECHNICAL PASS (real-size inspection; documented scripted retouches)
  → lead-art ASSET GATE (taste; mechanical pass does not bind)
  → pm/product acceptance
```

- Vehicles run a **B&W-only prompt** (ADR 0011): `check-art-prompts.mjs` FORBIDS any
  neon/glow token in the assembled vehicle prompt; the neon rim is added render-side.

- `scripts/check-art-prompts.mjs` runs in `ci.yml` on every PR (prompt contract lint).
- `scripts/check-sprite-style.mjs` runs inside the gen workflows (auto-reject bad rolls).
- Iteration budget: **2 batches per set per cycle**, then options go to Bertrand.
- Every gate verdict is logged in `docs/agent-handoffs.md`.

## 7. Follow-ups

- Download the LICENSES.md reference images in CI (sandbox proxy blocks the hosts)
  into `references/` with attributions.
- `kontext` hero-sprite derivation pass for hard style-locking.
- Enemy-sprite thresholds for `check-sprite-style.mjs` (only vehicles calibrated).
- Sample CC0 neon-on-dark packs (Kenney Space Shooter Redux, OGA Neon Node/Town)
  as mood references.

## 8. Le grain cathodique — CRT post-process (in-game world ONLY)

A CRT-monitor post-process over the **in-game shooting-gallery world**. Direction, not
implementation: the effect must sell "1998, a broadcast/VHS twin of the fanzine, watched
on a squat's TV in the dark" **without adding a second colour to a B&W world and without
touching aim precision.** The fanzine is a xerox; the CRT is its degraded broadcast — same
generational-decay identity as §1, one medium further down the dub chain. It is a runtime
composite, so it lives under the composite gate (Gate 4) and the §2.1 falloff law.

**Hard scope: the CRT is the in-game world's skin. It is BANNED on every pre-game / menu
surface** — §2bis already forbids CRT scanlines, RGB-split, glow and blur on menus. Menus
stay flat print (paper, not a screen). No exceptions. A scanline on the title = FAIL.

### 8.1 Ingredients — IN / OUT

**IN (these serve the style):**

- **Phosphor bloom on the neon — the headline ingredient.** Acid neon must **BLOOM, not
  shift hue.** Threshold-gated **above paper-white luminance** so only the saturated accent
  hues (§2.1 rims, pickups, HUD alerts) bloom; **paper and B&W linework never bloom.**
  Hue-preserving: the halo keeps the rim's hue and saturation, no rainbow separation. This
  amplifies « ce qui brille est interactif » — the bloom is colored light, the one legal
  colour. Its halo obeys §2.1: a dégradé to zero, jamais un aplat.
- **Scanlines** — horizontal luminance darkening, **barely there.** They read as the CRT
  tell and echo the xerox line-screen, but must not comb the linework. Roll off / disappear
  at small-sprite scale so they never alias against sprite detail.
- **Vignette** — gentle corner darkening. Sells the night-time, clandestine, dark-room read
  (§1). Feathered deep, no hard ring, corners only. Must not crush the HUD-bearing corners.
- **Analog grain + sub-perceptual flicker** — fine animated toner-speckle grain (the
  in-motion cousin of the menu `feTurbulence` speckle, §2bis.1) and a slow luminance
  _breathe_. On-identity generational decay. **No strobe** (see constraints).

**OUT (these fight the style):**

- **Slot / aperture-grille RGB shadow-mask — OUT.** A shadow mask tints white paper into
  RGB triads → rainbow fringing on the pure B&W linework → introduces colour where §1/§2.1
  reserve colour for neon alone. The scanline already gives the CRT read; the mask only
  muddies it. (Automatic FAIL if white pixels sample non-neutral.)
- **Global chromatic aberration / colour bleed — OUT.** RGB-split fringes the B&W linework
  red/cyan and softens the crosshair → breaks « la seule couleur c'est le néon » AND
  precision aiming. The _only_ colour bleed permitted is the neon bloom halo (colored light,
  already legal). No global split, none on the crosshair/HUD.
- **Barrel curvature — OUT as anything that warps aim, at most a cosmetic whisper.** Heavy
  curvature moves screen-space positions so the crosshair no longer maps 1:1 to world aim —
  fatal for precision aiming. Either ≤~2 % overscan-corner cue with the crosshair/HUD drawn
  **flat, above** the warp, or off entirely. Default recommendation: **off** — a flat frame
  is honest to the "poster, not a diorama" identity (§1).

### 8.2 Intensity — owner-tuned to a legible CRT identity

The world must stay readable: small sprites silhouette-identifiable (§2 law 3), crosshair
pixel-precise. Target intensities in plain words:

- **Scanlines — the load-bearing CRT tell, tuned _up_ to be legible.** Shipped values:
  **0.55 darkening on the comb trough**, **4 CSS-px pitch (× devicePixelRatio)**, a **crisp,
  squared comb** (hard on/off lines, not a soft sine roll). This is deliberately far past the
  old "barely there / ~10–15 %" target. **Amendment (2026-07-16, Bertrand's explicit call,
  three playtest rounds):** the original "vibe, not a filter" subtlety doctrine _lost_ to the
  readability of the CRT identity on modern hidpi displays — at ~45 % / soft comb the tell
  was invisible on a Retina panel and the whole ingredient stopped earning its place. Owner
  override on record (architect-ratified: docs realign to the code, not the reverse). The
  comb is squared and pitched wide precisely so it survives dpr scaling and stays a
  television, not a moiré haze. It does still roll off at small-sprite scale (§8.1) so it
  reads as a screen, not a grille stamped onto the linework.
- **Bloom** — neon / lit-window cores gain a soft halo one to two sprite-pixels wide, gated
  on saturation × brightness (§8.4.3). Paper never blooms. If the linework glows, the gate is
  too low — pull it up. Halo obeys §2.1: a dégradé to zero, jamais un aplat.
- **Vignette** — corners maybe 10–15 % darker, feathered far into frame. You should not be
  able to point to where it starts.
- **Flicker** — a slow breathe, not a per-frame stutter. Amplitude tiny (single-digit %),
  never rhythmic enough to read as a strobe.
- **Grain** — fine toner speckle, opacity ~0.03 (the tuned ceiling: above it the speckle
  perceptually drowns the scanline comb even when both are measurably present). Like the
  xerox speckle already on the menus; texture you feel, edging toward snow you watch, held at
  the line where the comb still reads.

Rule of thumb (**revised by the same amendment**): **the CRT is now meant to be legible in a
still — this is deliberate.** The old "kill the effect and the frame looks almost the same"
test is retired: at the owner-tuned 0.55 trough / 4-px squared comb, a CRT-on still is
unmistakably a television and a CRT-off still is crisp print, and that gap is the point. The
effect is still _felt_ hardest in motion and in the dark, but it must also **read as a CRT
frozen on screen** — if a static screenshot could pass for the raw pipeline, the scanlines
have regressed below spec. What must NOT change: aim precision (§8.4.2/P4), zero added hue on
the B&W layer (§8.4.4/P2), and small-sprite silhouette legibility (§2 law 3 / P5) — the
intensity went up, the readability floor did not move.

### 8.3 References (period truth)

Late-90s consumer **Sony Trinitron** in a squat; a **third-generation dubbed VHS** of a
free-party / rave documentary projected on a wall; the flyer's broadcast twin. Decay from
dubbing, not from a fancy emulator preset.

### 8.4 Hard constraints for the dev

1. **In-game world layer ONLY.** Zero CRT on any pre-game / menu surface (§2bis). Screenshot
   both to prove the boundary.
2. **Crosshair + HUD render flat, in a layer ABOVE the CRT pass** — never curved, never
   split, never bloomed into illegibility. Aim maps 1:1 to screen space at every position,
   corners included.
3. **Bloom is hue-preserving and threshold-gated above paper-white.** Paper/linework do NOT
   bloom; only saturated neon does. No hue shift on the accent.
4. **No hue added to the B&W layer.** No RGB mask, no global chromatic aberration. White
   pixels stay neutral. The only colour the effect adds is the neon bloom halo.
5. **No strobe.** Flicker amplitude/rate respects photosensitivity. Ship a
   reduced-motion / effect-off path (accessibility + mobile/low-end perf); the game must be
   fully playable with the CRT disabled.
6. **Runtime composite ⇒ Gate 4.** Judged on real in-game screenshots (verify skill) before
   merge; the bloom halo is checked against §2.1 (dégradé, jamais un aplat).

### 8.5 Gate — CRT post-process (lead-art PASS conditions)

The implementation earns PASS only when, on **real in-game screenshots**:

- **P1** CRT present in-game, absent on every menu/pre-game surface.
- **P2** B&W layer carries zero added hue — sampled white/paper pixels stay neutral, no
  rainbow mask, no RGB-split fringe on linework or crosshair.
- **P3** Only saturated neon blooms; the halo shows monotonic alpha falloff to zero (§2.1),
  no aplat; paper does not bloom.
- **P4** Crosshair + HUD undistorted; aim 1:1 at all screen positions including corners.
- **P5** At game size, small enemy sprites stay silhouette-identifiable (§2 law 3) and the
  crosshair stays pixel-precise — scanlines / grain / vignette obscure neither.
- **P6** No strobe; a reduced-motion / effect-off path exists and the game is playable with
  it off.
- **P7** Verdict recorded in `docs/agent-handoffs.md` against the screenshots.

Any of P1–P4 failing is an **automatic FAIL**, same footing as a menu that glows (§2bis) or
a halo that is an aplat (§2.1). P5–P6 failing is FAIL-with-rework.
