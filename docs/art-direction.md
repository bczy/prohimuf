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
  `_2`/`_3` variant suffix (ADR 0015).
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
