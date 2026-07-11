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
   magenta `#FF3CDC`, green `#78FF3C`.
2. **Family consistency** — assets in a set are one printing run: byte-identical
   shared style block in prompts, same ground, same line weight, same treatment.
   One off-family asset fails the whole set.
3. **Silhouette first** — every sprite identifiable by silhouette alone at game size.
   Wrong vehicle class / wrong archetype = automatic FAIL regardless of rendering
   quality.

## 3. FLUX prompt rules (the contract `scripts/check-art-prompts.mjs` enforces)

Pollinations' `flux` is a FLUX.1 [schnell]-class distilled model: **no negative
prompts, no LoRA** — everything is carried by prompt text + pinned seed.

1. **Never negate.** FLUX reads "not photorealistic" as _photorealistic_. Describe the
   positive opposite: "flat 2D hand-printed illustration", "on a solid matte black
   background". Negation budget in prompts: ≤2 occurrences tolerated, >4 is a lint error.
2. **Front-load medium + view.** Early tokens weigh most: the prompt opens with
   "Flat 2D video game sprite, strict side view in orthographic projection…" before
   any subject word.
3. **Prose, 30-90 assembled words.** Natural language, no tag soup, no SD weight
   syntax. The ceiling is the ASSEMBLED prompt (`opening` + subject + `neonPhrase` +
   `style`, §4); the four-slot split runs longer than a single block, so every added
   clause must be load-bearing silhouette/process detail, never filler. Medium, view
   and silhouette must all land in the first ~40 words; the tail (style block) is the
   weakest attention zone, so family-critical treatment there is watched at the asset gate.
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
      → scripts/check-sprite-style.mjs (mechanical: dark ground, neon hue ≥ threshold,
        silhouette aspect bounds) — bad rolls auto-retried, bounded
  → game-graphist TECHNICAL PASS (real-size inspection; documented scripted retouches)
  → lead-art ASSET GATE (taste; mechanical pass does not bind)
  → pm/product acceptance
```

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
