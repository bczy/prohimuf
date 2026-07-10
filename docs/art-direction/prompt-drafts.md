# Prompt drafts — vehicle set (Maud, concept-artist)

**Date:** 2026-07-10
**Scope:** full rewrite of the `vehicles` prompt system in `src/game/levels/levelArt.json`
onto the four-slot assembly (`opening` + `types.<t>.prompt` + `neonPhrase` + `style`),
per `docs/art-direction.md` §3-§5. Trigger: follow-up story 7 in `docs/agent-handoffs.md`
(batch failed the acceptance floor — neon inconsistent across the set, car reads as a
hatchback).

---

## Assembled prompts (as `scripts/gen-vehicle-sprites.mjs` sends them)

### truck — neon orange `#FF8C14` — seed **1337** — 88 words

> Flat 2D video game sprite, strict side view in orthographic projection, single vehicle
> centered and fully visible, flat-fronted forward-control 1980s French panel van,
> near-vertical windshield, boxy cargo body taller than the cab line, single flank
> crease, steel wheels, one luminous orange (#FF8C14) acid neon rim light glowing along
> the whole silhouette including the wheels, photocopied 1990s punk fanzine illustration,
> rough black ink linework, high-contrast xerox toner texture, halftone dots, black and
> white except the neon, on a uniform matte black background (#000000), flat ambient
> lighting, crisp cutout edges

### car — neon cyan `#28F0FF` — seed **2077** — 89 words

> Flat 2D video game sprite, strict side view in orthographic projection, single vehicle
> centered and fully visible, one-box monospace city car, hood and windshield in one
> continuous slope, tall glasshouse, corner-mounted wheels, vertical tail flush behind
> the rear wheel, one luminous cyan (#28F0FF) acid neon rim light glowing along the
> whole silhouette including the wheels, photocopied 1990s punk fanzine illustration,
> rough black ink linework, high-contrast xerox toner texture, halftone dots, black and
> white except the neon, on a uniform matte black background (#000000), flat ambient
> lighting, crisp cutout edges

### moto — neon magenta `#FF3CDC` — seed **8128** — 88 words

> Flat 2D video game sprite, strict side view in orthographic projection, single vehicle
> centered and fully visible, 1990s delivery moped, fat small-diameter wheels, exposed
> tube frame, single round headlamp, top-box crate strapped over the rear rack, empty
> saddle, one luminous magenta (#FF3CDC) acid neon rim light glowing along the whole
> silhouette including the wheels, photocopied 1990s punk fanzine illustration, rough
> black ink linework, high-contrast xerox toner texture, halftone dots, black and white
> except the neon, on a uniform matte black background (#000000), flat ambient lighting,
> crisp cutout edges

---

## Rationale, clause by clause

### `opening` (shared, 17 words)

| Clause                                        | Why it earns its place                                                                                                                                          |
| --------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| "Flat 2D video game sprite"                   | Medium first — FLUX weighs early tokens most (§3.2); "sprite" + "flat 2D" kills photoreal/3D-render drift positively, replacing three "not a render" negations. |
| "strict side view in orthographic projection" | Drafting vocabulary locks the camera (§3.6); "strict" fights the three-quarter drift FLUX defaults to for vehicles.                                             |
| "single vehicle centered and fully visible"   | Composition guard: one subject, uncropped — chroma-key cutout needs the whole silhouette in frame.                                                              |

### `types.<t>.prompt` (subject/silhouette ONLY — §5 anchors, zero color/style words)

**truck (21 words)** — Trafic mk1 / C25 language without brand names (§3.7):

| Clause                                                | Why                                                                                                                         |
| ----------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------- |
| "flat-fronted forward-control 1980s French panel van" | The class in automotive-design terms; "forward-control" is the load-bearing token — cab over the front axle, hoodless nose. |
| "near-vertical windshield"                            | Kills the aerodynamic modern-van slope.                                                                                     |
| "boxy cargo body taller than the cab line"            | The step-up roofline that makes the silhouette read "delivery" at game size.                                                |
| "single flank crease, steel wheels"                   | Period utilitarian detail; steel wheels veto alloy-wheel product-shot styling.                                              |

**car (22 words)** — Twingo mk1 language; direct fix for the hatchback FAIL:

| Clause                                        | Why                                                                                          |
| --------------------------------------------- | -------------------------------------------------------------------------------------------- |
| "one-box monospace city car"                  | Names the volume class, never the failure mode (naming "hatchback"/"sedan" summons them).    |
| "hood and windshield in one continuous slope" | The Twingo's defining profile line — a two-box car cannot satisfy this clause.               |
| "tall glasshouse"                             | Roof-heavy proportion, §5 verbatim.                                                          |
| "corner-mounted wheels"                       | Minimal overhangs — the monospace stance.                                                    |
| "vertical tail flush behind the rear wheel"   | Positive replacement for "no protruding boot": the tail cliff is described as what IS there. |

**moto (21 words)** — MBK Booster / 103 language:

| Clause                                          | Why                                                                                                      |
| ----------------------------------------------- | -------------------------------------------------------------------------------------------------------- |
| "1990s delivery moped"                          | "Moped" (not "motorbike scooter") pulls the small skeletal class.                                        |
| "fat small-diameter wheels, exposed tube frame" | Booster silhouette signature, §5 verbatim.                                                               |
| "single round headlamp"                         | Period front-end anchor.                                                                                 |
| "top-box crate strapped over the rear rack"     | The delivery read — the gameplay-critical prop.                                                          |
| "empty saddle"                                  | Positive phrasing of "rider absent": describes the seat that IS visible instead of the rider that isn't. |

### `neonPhrase` (shared template, 16 words resolved)

| Clause                                                    | Why                                                                                                                                                      |
| --------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------- |
| "one luminous {neon} ({hex}) acid neon rim light"         | La loi du glow, hex-bound to a surface (§3.5); "one" enforces a single accent hue; hue comes from the type's `neon` field, never hard-coded in subjects. |
| "glowing along the whole silhouette including the wheels" | The rim must trace everything — wheels were the glow dropout in the failed batch.                                                                        |

### `style` (shared verbatim block, 34 words)

| Clause                                                                       | Why                                                                                                                                                    |
| ---------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------ |
| "photocopied 1990s punk fanzine illustration"                                | One primary style as medium + era + process (§3.4); "illustration" (a picture _in_ a zine) instead of "zine cover" which summons type (§3.8).          |
| "rough black ink linework, high-contrast xerox toner texture, halftone dots" | The xerox law, stated as process.                                                                                                                      |
| "black and white except the neon"                                            | Positive monochrome constraint — replaces the "not a flat orange-filled drawing" chain.                                                                |
| "on a uniform matte black background (#000000)"                              | Hex-bound ground (§3.5): replaces "no white background, no light background, no background scenery" — the black IS the ground, so scenery has no room. |
| "flat ambient lighting"                                                      | Kills cast shadows positively (§3.8).                                                                                                                  |
| "crisp cutout edges"                                                         | Chroma-key needs hard edges; also part of the cut-and-paste fanzine identity.                                                                          |

### Seeds

| type  | seed | note                                            |
| ----- | ---- | ----------------------------------------------- |
| truck | 1337 | pinned; iterate one clause at a time against it |
| car   | 2077 | pinned                                          |
| moto  | 8128 | pinned                                          |

Reproducible batch; `REROLL=1` bypasses pins only when composition itself is wrong (§3.10).

---

## What was removed, and why

The previous prompts carried **negation chains** — FLUX (schnell-class, no negative
prompt channel) reads each of these as an invocation of the named thing (§3.1):

- truck: "not a photoreal render, not a glossy magazine product shot, not a shiny 3D
  model, not a flat orange-filled drawing on white, no white background, no light
  background" — **6 negations**, each planting the failure mode it named. Replaced by
  "flat 2D video game sprite" + "photocopied fanzine illustration" + hex-bound black
  background.
- old shared `style`: "not photoreal, not glossy, not a 3D product render, no text, no
  watermark, no people, no background scenery" — **7 negations**. Replaced by the
  positive medium/ground/lighting block; "single vehicle centered" + solid #000000
  ground leaves no room for people or scenery; "fanzine illustration" (not
  "cover/poster") starves text of a reason to appear.
- car: "like a renault twingo" — brand hope, §3.7 violation (FLUX doesn't know the
  car well enough; the shape must be described, not named); "no protruding boot" —
  negation, now "vertical tail flush behind the rear wheel".
- moto: "low crouched rider" — contradicted the delivery-beat read (driverless prop
  vehicle) and fought the cutout; now "empty saddle".
- Style words that lived inside subjects (truck carried its own duplicate fanzine/neon
  description) — moved to the shared slots so the set is one printing run (§2 law 2).

**Status:** drafts delivered — awaiting `lead-art` PROMPT GATE before any dispatch.

## 2026-07-10 — car seed reroll 2077 → 42

Mechanical gate result (run 29127398174): truck seed 1337 PASS (neon 37.3%),
moto seed 8128 PASS (neon 3.2%), car seed 2077 deterministic FAIL — cyan rim
0.325% < 0.75% threshold (rim too faint on that roll). Prompt unchanged (one
variable per iteration); seed rerolled to 42. Batch 2 of this cycle.
