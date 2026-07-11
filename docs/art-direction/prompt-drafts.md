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

---

## Graphiste notes (Serge) — batch 3 technical pass

Metered the landed PNGs (commit a20a2c5) at real in-game scale. Full metrics + per-sprite
verdicts are in `docs/agent-handoffs.md` (batch-3 TECHNICAL PASS). Summary for the art record:

- **Alpha is hard-binary** (0.00% semi-transparent) on all three — no soft fringe to harden.
- **Keyed edge halo** (boundary-ring dark+saturated glow remnant): truck 54% dark-orange,
  car 74% dark green-cyan, moto 9% (clean). This is the [S4] halo, confirmed: an OPAQUE
  dark-colored ring where the rim glow bled into black and beat the near-black key — not an
  alpha artifact, so "crisp cutout edges" cannot touch it.
- **Blockers are direction, not edge:** truck + moto bodies FLOOD with the accent (§1/§2.1 —
  the batch-3 "body staying pure black-and-white xerox" clause did not hold against FLUX);
  car body is correctly black + cyan rim but carries a large CONNECTED cyan cabin/cityscape
  ([S7] glasshouse over-read / §2.1 decorative glow) that cannot be keyed or removed without
  repainting. All three must be regenerated.

**Retouch DEFERRED (no PNG changes this pass).** Cleaning a sub-2px colored fringe on sprites
that must be regenerated for the flood/cabin is throwaway work. The halo clamp applies to the
CORRECTED batch, once bodies are B&W and the edge actually reads.

### Deferred retouch spec (for `scripts/retouch-sprites.mjs`, next pass)

Deterministic, re-runnable, halo/fringe/alpha ONLY — no artistic alteration. Per-sprite,
in place, same params across the set (§2.2):

1. **Hot-pixel strays:** drop any 8-connected opaque component < 12px that is not the largest
   component (the vehicle). Removes the 6/18/26px islands.
2. **Colored-halo clamp:** for opaque pixels on the boundary ring (opaque with ≥1 transparent
   4-neighbour), set alpha 0 iff luminance L<90 AND saturation S>0.22. This targets ONLY the
   dark-saturated glow remnant — it spares the bright neon rim (L>120) and the neutral black
   ink contour (S≤0.22). Run 2 passes max (re-evaluate boundary each pass) to peel a ~2px
   halo; 2px on a 256-384px canvas is <1% erosion, negligible on silhouette.
3. **Alpha harden:** snap alpha <128→0, ≥128→255 (idempotent safety; current art already
   binary, so a no-op — kept so the op is self-contained on future soft-keyed rolls).

Validation gate after running: `node scripts/check-sprite-style.mjs` must stay PASS 3/3.
The clamp only removes dark (L<90) pixels, which are never in the NEON hue band (needs
v≥0.65), so NEON% is preserved; clearing colored border pixels only raises GROUND clean%.
Expected post-op edge metric: boundary-ring dark-saturated remnant → near 0% on all three.

— Serge, TECHNICAL PASS

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

---

## Decoupled B&W prompts — ADR 0011

**Date:** 2026-07-11
**Scope:** retire the baked neon from the vehicle prompt system entirely. Trigger:
`docs/adr/0011-render-side-neon-rim.md` (Accepted) + the `story-render-side-neon-rim`
lane sign-off in `docs/agent-handoffs.md`. Branch `claude/art-pipeline-graphist`.

### Why decouple (the rationale for the gate)

Three FLUX batches (2, 3, 3b) fought the same failure: FLUX (Pollinations `flux`,
schnell-class — no negative prompt, no mask, no weight syntax) reads a **neon token on a
monochrome vehicle as an instruction to paint the whole vehicle neon**. The batch-3 body
flood was 44% orange on the truck, magenta panels on the moto; the car smuggled a
connected glowing cyan cabin/skyline. Every positive anti-flood clause ("only the outer
edge", "body staying pure black-and-white xerox") spent attention budget in the weak tail
zone (§3.3) without confining the colour — because the model has **no mechanism** to
confine it. Nico's asset gate (batch 3) named the root cause as the neon token itself and
recommended decouple as the real fix; Bertrand approved; Winston recorded ADR 0011.

The loi du glow is **not abandoned** — it moves to `src/render` as a runtime emissive rim
(CPU-baked silhouette behind the sprite, `AdditiveBlending`, hue from a render-side table
anchored to bible §2.1). This is **more** on-direction, not a compromise: §2.1 "what glows
is interactive" is better served by a live rim that can respond to `DeliveryPhase` than by
a baked one. The `neon` NAME per type STAYS in `levelArt.json` as render metadata (the
hue→asset assignment is still authored here); only the prompt TOKEN is retired.

### What changed in `levelArt.json` (string fields only — sole writer this story)

| Field                             | Was                                                                                                                                                                         | Now                                                                                              | Why                                                                                                                                                                                                                                                                                                           |
| --------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `vehicles.neonPhrase`             | `, a bright, crisp {neon} ({hex}) acid neon rim light, a clean band a few pixels thick tracing only the outer edge and wheel rims, body staying pure black-and-white xerox` | `""` (empty)                                                                                     | The neon token WAS the flood trigger — removing it removes the trigger. Slot kept structurally (four-slot assembly tolerates empty); retired from the prompt.                                                                                                                                                 |
| `vehicles.style`                  | `… coarse halftone dots, black and white except the neon, on a uniform matte black background (#000000) …`                                                                  | `… coarse halftone dots, fully black and white, on a uniform matte black background (#000000) …` | "except the neon" carved an exception that no longer exists. "fully black and white" is the positive, unambiguous monochrome constraint. All KEEP-clauses (fanzine, ink linework, xerox toner, coarse halftone, matte-black #000000 key ground, flat ambient lighting, crisp cutout edges) retained verbatim. |
| `vehicles.types.*.prompt`         | (batch-3b silhouette language)                                                                                                                                              | unchanged                                                                                        | Checked all three — clean of any glow/neon/acid token (the flood came from `neonPhrase`, never the subjects). Silhouette language survives untouched. Serge's [S5] truck-roofline concern stays a WATCH-ITEM — NOT reworked this pass (outside authorised scope).                                             |
| `vehicles.types.*.neon` / `.seed` | —                                                                                                                                                                           | unchanged                                                                                        | `neon` is now render metadata (ADR 0011); seeds pinned (1337 / 42 / 8128).                                                                                                                                                                                                                                    |
| `vehicles.$comment`               | "house style: photocopied fanzine B&W + acid neon …"                                                                                                                        | "pure photocopied fanzine B&W (the neon rim is render-side per ADR 0011 …)"                      | Accuracy fix (flagged in handoff report): the generation SSoT comment described the retired baked-neon mechanism; corrected so a downstream reader of `gen-vehicle-sprites.mjs` does not reintroduce the flood. Not a prompt/style string per se — flagged for session reconciliation.                        |

Zero negations added anywhere. Word budgets **dropped naturally** with `neonPhrase` gone
(no compensating verbiage added):

| type  | neon (metadata) | seed | assembled words | was (3b) |
| ----- | --------------- | ---- | --------------- | -------- |
| truck | orange          | 1337 | **71**          | 102      |
| car   | cyan            | 42   | **82**          | 113      |
| moto  | magenta         | 8128 | **71**          | 102      |

All three land inside the §3.3 30–90 target band (no WARN band overrun) — the four-slot
assembly is now `opening` + subject + `""` + `style`.

### Lint status (see report caveat)

`scripts/check-art-prompts.mjs` is being updated IN PARALLEL by `dev-tooling-assets` to the
B&W contract (ADR 0011: neonPhrase becomes optional, and the vehicles set must contain NO
neon/glow token). The version on disk when these edits landed still enforces the OLD
pre-decouple rules — it hard-errors an empty `neonPhrase` and demands a neon-glow concept
in every assembled prompt. Running it against the decoupled data therefore reports the
EXPECTED mismatch (empty-neonPhrase error + one missing-neon-glow-concept error per type),
NOT a defect in this data. Per the brief, this is reported, not fought — the session
reconciles once the tooling lane lands. When the new lint is in place the decoupled prompts
pass by construction (no neon token to flag, all three within word band, zero negations).

**Status:** edits landed in `levelArt.json`; awaiting the parallel tooling-lane lint update
and `lead-art` PROMPT re-gate on the decoupled B&W set before dispatch. NO commits.

---

## Graphiste notes (Serge) — decoupled B&W pre-prod (ADR 0011)

Fast pass on the keying soundness of the decouple. Read ADR 0011 and Maud's rationale. The
decouple itself is the right move — you cannot confine a FLUX neon token, so retiring it is
correct. But it opens ONE production hole, and it is the big one.

**[S1] BLOCKER — "fully black and white" on a "matte black background (#000000)" is NOT
safe for the near-black chroma-key. The vehicle's own black ink is indistinguishable from
the ground, so the key EATS the silhouette.**
The cutout (`cutout-enemies.mjs`, reused by `gen-vehicle-sprites.mjs`) is an edge flood-fill
that clears every border-connected pixel within distance ~24 of the corner colour — here pure
black. With the old baked neon rim, the outer contour was BRIGHT (distance ≫ 24), so the flood
stopped at the rim: the rim WAS the separator. Remove it and go monochrome-on-black and the
flood eats inward through the black outer contour until it hits the first bright toner pixel.
Concretely at game size:

- The crisp black keyline (the §1 cut-and-paste identity) is eaten, and the silhouette
  shrinks 1–3px to the first white pixel.
- **Thin black appendages on black ground are eaten whole** — moto side mirror, headlamp
  stalk, exhaust, and worst of all the moto's "exposed tube frame" (its DEFINING silhouette,
  §5): thin black tubes with black ground showing through the gaps → the flood floods through
  the frame and removes it. Same hazard for the top-box straps and steel-wheel detail.
- **Catastrophic mode:** high-contrast xerox can just as easily render a BLACK-DOMINANT body
  (heavy ink van). A large connected black region touching the border gets flood-eaten inward
  → big chunks or the whole vehicle vanish. We cannot steer FLUX away from this (schnell, no
  negative prompt — the exact reason we decoupled), so the key must be safe for a dark render,
  not just a lucky white-dominant one. A consistent SET (§2.2) cannot rest on that luck.
  Fix (Maud rewrites): **change the generation GROUND off black to a bright chroma-key colour
  that cannot occur in a B&W vehicle** — reuse the repo's own proven pattern from the foreground
  rails (`levels[*].prompts.foreground`): "isolated on a solid flat uniform bright magenta
  (#FF3CDC) chroma-key background, sharp silhouette edges" (green `#78FF3C` is the equally-valid
  unused hue if the magenta/ moto-neon overlap reads confusing). On a key-colour ground, BOTH
  black ink AND white toner survive; only the key colour is removed → the full silhouette
  (outline, thin frame tubes, appendages) is preserved, and therefore the render-side rim bakes
  from a CORRECT alpha. This is a COORDINATED change, not Maud-only: `dev-tooling-assets` must
  confirm `gen-vehicle-sprites.mjs`'s corner-adaptive cutout keys the new ground (it averages
  corners, so likely yes, but the distance-24 threshold and any FLUX ground-gradient/anti-alias
  need a quick verify; the foreground rails already key magenta, so the path exists). Flagging
  for the tooling lane.
  Lighter fallback if the ground change is out of scope this cycle (I judge it weaker, present
  for completeness): keep black ground, add "**bright white paper-tone body fill**" so the MASS
  survives the key — but this does NOT save thin black appendages on black ground (the moto
  frame still goes), so it is a partial mitigation, not a fix.

**[S2] The rim now bakes from the sprite's alpha (ADR 0011) → keying integrity is doubly
load-bearing.** A nibbled key does not just chip the sprite; it feeds a nibbled silhouette to
`buildNeonSilhouette`, so the runtime rim traces the eaten shape too. ADR gotcha (1) already
flags under-rimmed chassis concavities; if [S1] also eats the moto frame, the moto loses
silhouette AND rim in the same place. This is why [S1] is a blocker, not a polish item — it
is upstream of both deliverables.

**[S3] "coarse halftone dots" — good, my batch-3 [S3] ask landed; and it reinforces the
ground change.** Coarse (≥2px) dots survive the in-game downscale as intended texture rather
than mushing to grey, and coarse edge dots key cleaner than a fine screen. Note on black
ground, dark toner/halftone bleeding into the near-black margin gives BOTH a ragged eaten edge
AND surviving mid-grey specks (mid-grey is >24 from black, so it is NOT keyed → a grey fringe).
A key-colour ground ([S1]) removes the eaten-edge half of that; the residual toner specks are a
routine fringe-cleanup for my TECHNICAL pass, not a gate issue.

**[S4] Non-blocking:** word budgets 71/82/71 all sit inside the §3.3 band — no readability
concern from length; the decouple bought that headroom cleanly. Subjects unchanged, so my
[S5] truck-roofline watch (low/generic-van proportion) still stands as a watch-item for the
asset gate — not this pass.

### Call — NEEDS MAUD ITERATION (the ground clause), everything else bon

The decouple is sound and the style edits ("fully black and white", coarse halftone, retired
neonPhrase) are correct. But shipping generation on a MATTE BLACK ground for a now-monochrome
vehicle walks straight into the near-black key eating the silhouette — the single production
risk the decouple introduces, and it is severe (moto frame loss; catastrophic on a dark
render; and it corrupts the render-side rim bake too). One coordinated edit fixes it: move the
ground to a bright chroma-key colour (magenta/green, per the existing foreground-rail pattern),
with `dev-tooling-assets` confirming the cutout keys it. Hold the PROMPT gate until the ground
clause changes.

— Serge, PRE-PROD PASS (decouple)

## 2026-07-11 — [S1] keying blocker: generation ground black → magenta chroma-key

Serge's decouple pre-prod [S1] BLOCKER + Nico's PROMPT gate pre-authorization of the fix
path (switch the generation ground to a bright chroma-key, mirroring the repo's proven
foreground-rail pattern). One clause moved in `vehicles.style`; everything else stays.
Seeds unchanged (1337 / 42 / 8128); subjects unchanged; `neonPhrase` stays retired (empty).

### The blocker (Serge [S1])

Pure B&W on `#000000` is unsafe for the near-black edge flood-fill key (`cutout-enemies.mjs`,
reused by `gen-vehicle-sprites.mjs`): it clears every border-connected pixel within ~24 of
the corner colour (pure black). With the baked rim gone, the black outer contour is no longer
a bright separator, so the flood eats inward through the black keyline — shrinking the
silhouette, eating thin black appendages whole (the moto's DEFINING "exposed tube frame" §5,
mirror, headlamp stalk, exhaust, straps), and in the catastrophic dark-render case eating big
chunks of a heavy-ink body. Since FLUX-schnell has no lever to steer away from a dark render
(the very reason we decoupled), the key must be safe for ANY B&W render, not a lucky
white-dominant one. [S2]: the render-side rim bakes from the sprite alpha, so a nibbled key
also nibbles the rim — the blocker is upstream of BOTH deliverables.

### The fix (one clause, `vehicles.style`)

- **was:** `… coarse halftone dots, fully black and white, on a uniform matte black background
(#000000), flat ambient lighting, crisp cutout edges`
- **now:** `… coarse halftone dots, fully black and white, isolated on a solid flat uniform
bright magenta (#FF3CDC) chroma-key background, fully magenta empty surroundings, flat
ambient lighting, crisp cutout edges`

| Decision                                                                                 | Why                                                                                                                                                                                                                                                                                                                                                                                                                                                                  |
| ---------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| ground `matte black (#000000)` → `bright magenta (#FF3CDC) chroma-key`                   | A key colour that CANNOT occur in a pure-B&W vehicle: both black ink AND white toner now survive the cutout, only the magenta ground is removed → full silhouette (outline, thin frame tubes, appendages) preserved, so the render-side rim bakes from a CORRECT alpha ([S1]/[S2]).                                                                                                                                                                                  |
| lifted verbatim from the proven foreground-rail pattern (`levels[*].prompts.foreground`) | Not a novel ground — the repo already generates + keys magenta chroma-key for the balcony silhouettes, so the cutout path exists and is verified. Nico pre-authorized mirroring it.                                                                                                                                                                                                                                                                                  |
| **magenta, not Serge's green alt**                                                       | Serge offered green `#78FF3C` "if the magenta/moto-neon overlap reads confusing" — but the neon is now RENDER-SIDE, so the sprite body is pure B&W with zero magenta in it; there is no overlap in the generated PNG. Magenta is the proven/verified key path; green is unproven. Went magenta.                                                                                                                                                                      |
| kept `crisp cutout edges` tail, did NOT add the foreground's `sharp silhouette edges`    | Merge-clean per the brief — one edge clause, no duplication.                                                                                                                                                                                                                                                                                                                                                                                                         |
| `fully black and white` untouched                                                        | Describes the VEHICLE body (still pure monochrome); scope was the ground clause only. Mild watch-item: "fully black and white" near a bright-magenta ground could tempt FLUX to desaturate the ground — but the proven foreground rails carry the same black-subject + magenta-ground structure and key fine; the doubled "bright magenta … chroma-key background, fully magenta empty surroundings" pins the ground colour. Flagging, not reworking (out of scope). |

Zero negations added. Word counts (assembled, neonPhrase empty): truck **79**, car **90**,
moto **79** — all inside the §3.3 30–90 band (lint reports no word-band warning).

### Lint status — REPORTED MISMATCH, not fought (per brief + Serge [S1] tooling-lane flag)

`node scripts/check-art-prompts.mjs` → **6 errors** (2 per type). Both classes are the
lint-vs-data mismatch of the ADR-0011 / [S1] transition, NOT a defect in this data:

1. **`missing required house concept: dark/black background term`** (×3) — the brief
   explicitly anticipated this: the lint's `STYLE_TOKENS` "dark/black background" concept
   still only accepts `black`/`matte black`/`#000000`; the [S1] chroma-key ground migration
   needs it to also accept a bright chroma-key ground token (mirroring the foreground pattern).
2. **`contains forbidden neon token(s) "magenta (hue)"`** (×3) — the tooling lane already
   landed the ADR-0011 inverse rule (`FORBIDDEN_NEON`), which bans hue words anywhere in a
   vehicle prompt to stop baked-neon flood. It does not yet EXEMPT the ground KEY colour —
   here `magenta` names the chroma-key ground, not a baked accent, exactly as
   `checkLevels` REQUIRES `magenta chroma-key` on the foreground rails. (Switching to green
   would not help — `green` is also in `NEON_HUES`, so any key hue trips the same rule.)

Both are for `dev-tooling-assets` to reconcile as the lint finishes its ADR-0011 / [S1]
update: (a) accept a bright chroma-key ground in the background concept, and (b) exempt the
ground key-colour hue from `FORBIDDEN_NEON` (a "magenta/green chroma-key background" ground
token, the vehicle analogue of the foreground `MAGENTA_KEY_RE` allowance). Per the brief I
report the mismatch rather than fighting it — I did NOT revert to a black ground or drop the
key colour, since either would undo the [S1] fix. NO commits.

**Status:** [S1] ground fix landed in `levelArt.json`; lint mismatch reported to the tooling
lane; awaiting the parallel lint update + `lead-art` PROMPT re-gate on the chroma-key ground.
