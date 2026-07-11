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

## 2026-07-11 — batch 3, two coordinated prompt edits (lead-art ASSET GATE 3/3 FAIL)

Authorized by Bertrand after Nico's ASSET GATE verdict (end of `docs/agent-handoffs.md`):
3/3 FAIL, set fails family §2.2, over the 2-batch cap → option (1) taken. Seeds STAY
(1337 / 42 / 8128) so the only moving variable is the prompt. Two root causes, two edits;
truck & moto subject prompts untouched (their failure was the SHARED `neonPhrase`, not
their silhouettes). Lint: `node scripts/check-art-prompts.mjs` → **0 errors**, 3 word-band
WARNs (truck 93, moto 93, car 104 — non-gating; every added clause load-bearing, see below).

### Root cause A — `neonPhrase` flooded the truck & moto bodies (§1 identity + §2.1)

Nico: truck body a solid ORANGE fill (mechanical neon 37.3% confirms the flood), moto the
same in magenta — not B&W xerox with a rim, but full colour. FLUX read the old clause
"glowing along the **whole silhouette including the wheels**" as an instruction to _fill
the body_ with the accent.

- **was:** `, one luminous {neon} ({hex}) acid neon rim light glowing along the whole
silhouette including the wheels`
- **now:** `, a thin {neon} ({hex}) acid neon rim light tracing only the outer edge and
wheel rims, body staying pure black-and-white xerox`

| Change                                                                             | Why                                                                                                                                                                                                                                                                         |
| ---------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| "whole silhouette including the wheels" → "**only the outer edge and wheel rims**" | Kills the fill instruction; the glow is confined to the contour. "thin" + "only … outer edge" is the positive anti-flood signal (no negation — "only" is a limiter, not a "not"). Wheel _rims_ keep the law-of-glow §3 (the rim still traces the whole outline, edge-only). |
| appended "**body staying pure black-and-white xerox**"                             | States the B&W body positively INSIDE the neon phrase — the strong attention zone right where FLUX was choosing the fill colour, so B&W wins that decision. Reinforced downstream by the shared `style` ("black and white except the neon").                                |
| kept `{neon}` / `{hex}` placeholders, kept "acid neon rim light"                   | Hue still bound to each type's `neon` field (§2.1 single source of truth); "rim light" carries the neon-glow house concept for the lint; "acid neon" keeps the house accent identity.                                                                                       |

One clause, zero negations, {neon}/{hex} intact. Resolved length 21 words (was 16); +5 on
each assembled prompt → truck/moto land at 93 (WARN band >90, non-gating). The 5 extra
words buy the two fixes (edge-only + positive B&W body) that address the exact FAIL, so
they earn their place over shaving back to 90.

### Root cause B — car (seed 42) smuggled a glowing skyline + read low/long fastback

Nico: a neon-cyan skyscraper SKYLINE glows behind the car (decorative glow breaks §2.1 and
the flat matte-black chroma-key ground §3.5); and the body reads low/long fastback, not the
tall one-box glasshouse city-car of §5. Two sub-fixes, all positive:

- **was:** `one-box monospace city car, hood and windshield in one continuous slope, tall
glasshouse, corner-mounted wheels, vertical tail flush behind the rear wheel`
- **now:** `one-box monospace city car completely alone, empty surroundings, hood and
windshield in one continuous slope, tall upright phone-booth-shaped glasshouse cabin,
wheels pushed to the corners, vertical tail flush behind the rear wheel`

| Change                                                                                                                        | Why                                                                                                                                                                                                                                                            |
| ----------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| added "**completely alone, empty surroundings**"                                                                              | Total isolation said positively (§1) — the direct antidote to the smuggled skyline. Naming the background at all risks summoning it; "alone / empty" starves it. (Neither word trips the lint's scenery guard.)                                                |
| "tall glasshouse" → "**tall upright phone-booth-shaped glasshouse cabin**"                                                    | Proportion language, no class noun (§5): tall/upright + phone-booth-shape forces roofline-high, body-tall-and-short — a low fastback cannot satisfy "phone booth on wheels". Keeps "glasshouse" (§5 tall-glass read) so the greenhouse sits over a short body. |
| "corner-mounted wheels" → "**wheels pushed to the corners**"                                                                  | §5 verbatim, clearing Nico's earlier reservation on the old phrasing.                                                                                                                                                                                          |
| kept "one-box monospace city car", "hood and windshield in one continuous slope", "vertical tail flush behind the rear wheel" | The three anchors Nico endorsed at the PROMPT GATE stay verbatim.                                                                                                                                                                                              |

Zero negations, zero hard-coded hue (cyan stays in the `neon` field). Assembled 104 words:
over the ~95 target because the two required fixes (isolation + proportion) sit on top of
the three mandated verbatim clauses (22 words of anchors alone). Every clause is
load-bearing; well under the §3.3 hard ceiling (120). WARN only, non-gating.

### Assembled (as `gen-vehicle-sprites.mjs` sends them, seeds unchanged)

- truck — orange `#FF8C14` — seed **1337** — **93 words**
- car — cyan `#28F0FF` — seed **42** — **104 words**
- moto — magenta `#FF3CDC` — seed **8128** — **93 words**

**Status:** edits landed in `levelArt.json`; lint 0 errors. Awaiting `lead-art` PROMPT
re-gate before dispatch (per Nico's option (1): re-gate the prompts first).

---

## Graphiste notes (Serge) — batch 3 pre-prod

Production readability + keying soundness of the two NEW edits (`neonPhrase` edge-rim
rewrite + `car.prompt` isolation/proportion). I judge at real in-game scale: canvases are
truck 384×192, car 320×160, moto 256×160, and they display SMALLER than that in the lane.
I read the rejected batch first (the flood output) and metered it — numbers below are from
those PNGs, cited where they change my verdict. I annotate; Maud rewrites, Nico gates.

**[S1] "thin ... rim light" is an over-correction — at game size a hairline rim vanishes,
and with it the loi du glow (§2.1: what glows is interactive).**
Risk: the batch-2 failure was a FLOOD (too much accent). The fix swings the tiller hard the
other way: "**thin** ... tracing **only** the outer edge." That kills the flood correctly,
but "thin" reads to FLUX as _hairline_ — a 1px stroke at 384px generation. Vehicles are
displayed downscaled in-lane; a 1px rim on a sprite shown at, say, half size lands at
sub-pixel and drops out on the first bilinear resample. When the rim goes, the vehicle stops
reading as interactive — that is the core game signal, not a decoration. What survives a
downscale is **value/brightness contrast against the black**, not stroke area. So the rim
needs to be _bright_, not _thin_.
Fix (Maud's wording): drive it on brightness + a thickness floor, not thinness — e.g.
"a **bright, crisp** {neon} ({hex}) acid neon rim light, a clean band **a few pixels thick**,
tracing only the outer edge and wheel rims, body staying pure black-and-white xerox." Keep
the "only the outer edge" limiter (that is the real anti-flood token); just stop asking for
_thin_.

**[S2] "thin" is an ABSOLUTE term applied to three different canvas sizes → inconsistent
relative rim weight across the set (§2.2 family = one printing run).**
Risk: the byte-identical `neonPhrase` renders a similar _absolute_ pixel width on all three,
but the moto canvas (256) is 2/3 the truck's (384). A "thin" rim is therefore a noticeably
larger _fraction_ of the moto sprite than of the truck — and survives its downscale better.
Same treatment, three visibly different rim weights. That is exactly the set-inconsistency
§2.2 forbids, only now in the rim rather than the body.
Fix: the [S1] wording ("a clean band a few pixels thick", brightness-led) also solves this —
it pins an absolute-ish floor and leans on value, so the read is consistent regardless of
canvas. Avoid size-relative words ("proportionally thin") — they compound the problem.

**[S3] "halftone dots" (shared `style`, unchanged) — mush at display size, and a dotty/dirty
key at the silhouette edge.**
Risk (two heads): (a) _interior_ — fine halftone on the body will mush to flat grey noise
once the sprite is displayed smaller; per the bible §1 that is acceptable (silhouette + rim
carry the read, interior texture is allowed to degrade), so I do NOT block on it. (b) _edge_
— halftone dots that fall ON the contour are isolated near-black clusters sitting against the
matte-black key ground; the near-black→transparent key either nibbles them (ragged outline)
or leaves a dotty fringe. That fights "crisp cutout edges."
Fix (prompt-side, optional): specify "**coarse** halftone dots" so the toner reads as
deliberate ≥2px texture that survives downscale, instead of a fine screen that becomes grey
mush + a ragged edge. The contour hygiene itself I clean in my TECHNICAL pass (edge
quantize / dot clamp on the boundary ring) — not a gate blocker.

**[S4] The glow-halo keyed fringe is NOT fixable by "crisp cutout edges" — it is a
key-threshold artifact, and mostly my TECHNICAL pass. Metered.**
This answers the brief's keying question directly. I metered the rejected PNGs: alpha came
out **hard-binary — 0% semi-transparent pixels** on all three. So "crisp cutout edges" is
already doing its job on the _alpha_ channel; there is no soft feathered fringe to harden.
The halo you can see is a different animal: it is **opaque, dark-but-saturated** pixels where
the neon rim's outward _glow_ bled into the surrounding black, lifting it just above the
near-black key threshold so it survived the cutout. On the boundary ring (opaque pixels
touching transparency) I measured dark-colored glow-remnant at **truck 39% / car 64% /
moto 29%**, with ~0% bright neon at the very outermost edge — i.e. the true silhouette edge
is a dark colored halo, the bright rim sits one step inboard.
Verdict on the brief's question: "crisp cutout edges" is **not enough and cannot be** — it
addresses alpha, not the key threshold. Two levers:

- _Prompt-side (optional, reconcile with tooling):_ "rim **light**" and "glowing" invite an
  emissive outward bloom that is exactly what beats the key. Describing the rim as a **flat
  neon outline stroke with no outer glow/bloom** would keep the accent on-silhouette and
  starve the halo at the source. CAUTION: the rationale (§ above) says "rim light" is the
  token the lint keys on for the law-of-glow — so swapping to "outline stroke" may trip
  `check-art-prompts.mjs`. That is a Maud + `dev-tooling-assets` reconciliation, not a
  silent edit.
- _Post-gen (mine):_ the residual dark-colored boundary halo is a deterministic
  fringe/halo clamp in my TECHNICAL pass (`scripts/retouch-sprites.mjs`: identify
  dark-saturated boundary-ring pixels, key them out / snap to pure black then re-key). I
  OWN this; it does not block the prompt gate.
  So: the halo is **primarily a technical-pass retouch**, with one optional prompt lever that
  carries a lint tradeoff. Not a reason to hold the gate by itself.

**[S5] Latent truck silhouette weakness — the color flood was masking it; with the rim
confined it becomes visible. Observation, not mine to fix.**
The truck subject prompt + seed 1337 are unchanged, so the silhouette regenerates identically.
In the reject it fills only **36% of canvas height** and the cargo roof reads roughly level
with the cab — a long, LOW van, not the "boxy cargo body **taller than the cab line**" of §5.
The orange flood was drawing the eye off that. Once the body is B&W with an edge rim, the
low/generic-van proportion is what the player sees at game size. Flagging for Maud/Nico: not a
keying/readability defect I can retouch, and outside my remit to reword — but if the truck is
meant to read "delivery van" by silhouette alone (§2.3), the step-up roofline may need a
stronger clause. Nico's call at the gate.

**[S6] Car at 104 words pushes the anti-flood + cutout clauses deep into the weak-attention
tail — lower risk here than it looks, but a named asset-gate watch.**
"body staying pure black-and-white xerox" and "crisp cutout edges" now sit at ~word 85–104 on
the car (§3.3 weakest zone). Normally that is where B&W discipline washes out — BUT the car
was the ONE vehicle that did NOT flood (Nico: its black-body + cyan-rim was the only
on-direction treatment), so the tail's anti-flood clause matters least exactly where it sits
deepest. Net: watch, don't block. If anything regresses it will show at my technical pass.

**[S7] "phone-booth-shaped glasshouse cabin" — strong silhouette lever, small over-read
risk. Taste, not keying.**
Good news for §2.3: a phone-booth shape is a crisp, readable silhouette and directly fights
the low-fastback FAIL. Risk: FLUX may over-index and box the greenhouse up so tall/upright the
sprite reads as a small van/box rather than a city car at game size. That is a proportion/taste
judgement for Nico's gate and my real-size check post-gen, not a pre-prod blocker. Noting so
it is watched, not fixed.

### Overall call — NEEDS ONE MAUD ITERATION (rim wording), rest bon pour gate

The two edits attack the exact batch-2 FAILs correctly: "only the outer edge" is the right
anti-flood limiter, and "completely alone / empty surroundings" + "phone-booth glasshouse" are
sound positive antidotes to the smuggled skyline and the fastback proportion. Directionally
this is the right batch 3.

But I will not wave it through on "thin." [S1]/[S2] are a real over-correction: swapping a
flood for a hairline risks the _opposite_ failure — a rim that vanishes at display size and
takes the loi du glow with it — and the fix is a single clause (brightness-led + a few-pixel
floor). Given we are already past the 2-batch cap and this roll is Bertrand-authorized, it is
cheaper to tighten one clause now than to spend the whole generation discovering the rim
disappeared. So: **needs Maud iteration on the `neonPhrase` rim wording ([S1]/[S2]) before the
PROMPT re-gate.** [S3] coarse-halftone is an optional prompt nicety; [S4] halo is mine to clean
post-gen (not a blocker); [S5]/[S6]/[S7] are watch-items for Nico's gate and my technical pass.
Everything except the rim clause is bon pour gate.

— Serge, PRE-PROD PASS

## 2026-07-11 — batch 3b, `neonPhrase` rim wording ([S1]/[S2] integration) + optional [S3]

Serge's PRE-PROD flagged ONE clause: my `neonPhrase` over-corrected the flood into a
hairline. One variable moved — the rim wording — plus his optional [S3] taken (flagged
below). Car subject + truck/moto subjects untouched; seeds unchanged (1337 / 42 / 8128).
Lint: `node scripts/check-art-prompts.mjs` → **0 errors**, 3 word-band WARNs (truck 102,
moto 102, car 113 — non-gating, all under the §3.3 hard ceiling of 120).

### [S1]/[S2] — rim was "thin" (hairline risk) → "bright, crisp, a few pixels thick"

Serge [S1]: batch-2 was a FLOOD; my fix ("**thin** … tracing **only** the outer edge")
killed the flood but swung to the opposite failure — FLUX reads "thin" as a ~1px hairline
that drops to sub-pixel on the in-lane downscale and vanishes, and the loi du glow (§2.1:
what glows is interactive) goes with it. What survives a downscale is brightness/value
contrast against the black, not stroke area. [S2]: "thin" is ABSOLUTE across three canvas
sizes (truck 384 / car 320 / moto 256) → the same pixel width is a different _fraction_ of
each sprite → inconsistent rim weight, the §2.2 family break moved from the body into the rim.

- **was:** `, a thin {neon} ({hex}) acid neon rim light tracing only the outer edge and
wheel rims, body staying pure black-and-white xerox`
- **now:** `, a bright, crisp {neon} ({hex}) acid neon rim light, a clean band a few pixels
thick tracing only the outer edge and wheel rims, body staying pure black-and-white xerox`

| Change                                                                                  | Why                                                                                                                                                                                                                                                                                                  |
| --------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| dropped "**thin**"                                                                      | It was the hairline trigger ([S1]) and the absolute-width family-break ([S2]). Removing it is the core fix.                                                                                                                                                                                          |
| added "**bright, crisp**"                                                               | Brightness is the lever that survives the downscale ([S1]) — value contrast, not stroke area, is what keeps the rim readable at game size. "crisp" also leans the rim toward a clean flat stroke, mildly starving the emissive outward bloom that beats the key ([S4]) without dropping "rim light". |
| added "**a clean band a few pixels thick**"                                             | A thickness FLOOR, not thinness — pins an absolute-ish minimum so the rim holds at display size and reads at a consistent weight across all three canvases ([S2]). No size-relative words (Serge warned "proportionally thin" compounds the problem).                                                |
| kept "**only the outer edge and wheel rims**"                                           | The REAL anti-flood limiter (Serge's words) — untouched, so the batch-2 body-flood fix stands. Wheel rims keep the law-of-glow §3.                                                                                                                                                                   |
| kept "{neon}"/"{hex}", "acid neon rim light", "body staying pure black-and-white xerox" | Hue still bound to the `neon` field (§2.1); "rim light"+"neon" keep the neon-glow house concept for the lint; the positive B&W body stays in the phrase's strong zone.                                                                                                                               |

One clause, zero negations ("only" / "a few" are limiters, not "not"/"no"), {neon}/{hex}
intact. Resolved length 29 words (was 21); +8 on each assembled prompt.

### [S3] — TAKEN: shared `style` "halftone dots" → "coarse halftone dots" (flagged: touches shared style)

Serge [S3] is optional; I judge it **strictly better** and took it. It touches the shared
`style` block (affects all three vehicles + is the family style — flagging explicitly per
the brief). Rationale: (a) _downscale_ — a fine screen mushes to flat grey noise in-lane;
"coarse" (≥2px) reads as deliberate toner texture that survives. (b) _edge keying_ — coarse
dots on the contour are less prone to the dotty/ragged near-black→transparent fringe a fine
screen leaves, so it serves "crisp cutout edges" rather than fighting it. (c) it is _more_
period-true to the coarse xerox/fanzine medium (§3.4), not less. Cost: one word on each
assembled prompt; no new failure mode; "halftone" token still satisfied for the lint. Serge
still owns final contour hygiene in his technical pass regardless.

### Not taken / not mine (this iteration)

- **[S4] glow-halo keyed fringe** — Serge metered it as opaque dark-saturated glow-remnant
  on the boundary ring (truck 39% / car 64% / moto 29%), alpha already hard-binary. He owns
  it in `scripts/retouch-sprites.mjs` (fringe clamp). The one prompt lever ("flat outline
  stroke, no outer glow/bloom") would trip the lint's neon-glow/`rim light` token — a
  Maud + `dev-tooling-assets` reconciliation, not a silent edit — so NOT taken here. "crisp"
  gives a partial, lint-safe nudge in that direction.
- **[S5] truck low/generic-van silhouette** (fills 36% canvas height, roof ~level with cab,
  vs §5 "cargo body taller than the cab line") — a subject-clause + seed matter, Nico's call
  at the gate; not moved this iteration (one-variable discipline, and the brief scoped me to
  `neonPhrase` only).
- **[S6] car tail depth** / **[S7] phone-booth over-read** — watch-items for Nico's gate and
  Serge's real-size pass; no action.

### Assembled (as `gen-vehicle-sprites.mjs` sends them, seeds unchanged)

- truck — orange `#FF8C14` — seed **1337** — **102 words**
- car — cyan `#28F0FF` — seed **42** — **113 words**
- moto — magenta `#FF3CDC` — seed **8128** — **102 words**

**Status:** edits landed in `levelArt.json` (`neonPhrase` rim wording + shared `style`
coarse-halftone); lint 0 errors. Bon pour gate per Serge on everything but the rim clause,
which this iteration addresses. Awaiting `lead-art` PROMPT re-gate before dispatch.
