# Prompt draft — near-foreground traffic-light mast (Maud, concept-artist)

Craft rules per [`flux-prompt`](../../../.claude/skills/flux-prompt/SKILL.md); nothing
reaches `levelArt.json` without the `lead-art` PROMPT GATE.

Family: **near-foreground parallax props** (`levels[*].nearForeground`, ADR-0047) —
first _generated_ asset in this family (bollard/bench/Wallace/lamppost/streetSign/
parkingMeter are still code-drawn). Replaces the code-drawn `kind: "trafficLight"` prop.

Consumes the CURATED board
[`board-traffic-light.md`](../references/boards/board-traffic-light.md) (Bertrand,
2026-07-18: KEEP face-on feu piéton; ADD the feu-routier.fr profile reference — one mast,
vehicle 3-lens hooded head in **strict profile**, pedestrian head **face-on**). Style
spine = the validated **crade-documentaire graphic-novel** register the 7 accepted Belliard
facades + the 3 tronçons ship in (bold flat, thick ink outlines, cel-shaded, muted, deep
night, flat frontal orthographic) — reused here, minus the facade-only tokens (grimy walls,
mansard roofs), plus single-prop isolation + a keyable ground + cutout edges.

---

## 0. Composition note (one read to hold)

One thin round vertical **mast** on the near kerb carries TWO heads at 90°: mid-height a
narrow **black vehicle box seen strictly edge-on / in profile** — three round lens
openings stacked vertically, each under a curved _casquette_ hood that juts out **sideways**
(the lens faces turned away, essentially not seen from this side) — and, lower and rotated
90°, a smaller **pedestrian box seen face-on**, its flat front carrying the standing-figure
pictogram. Housing ships **pure unlit B&W**; the coloured lit lens is added **render-side**.

---

## 1. CRITICAL — unlit housing, render-side lit lens (ADR-0011 precedent)

The housing is authored **unlit, pure black-and-white silhouette, with NO baked coloured
light or glow on any lens** — same B&W-only precedent as the vehicle sprite set (ADR-0011:
the interactive colour lives render-side, never in the FLUX pixels). The lit lens — feu
vehicle vert/orange/rouge, feu piéton red-man/green-man — is drawn **render-side** as a
small emissive dot that colour-cycles with game state (board §"Note for concept-artist",
option (a): the profile vehicle lens is a small foreshortened ellipse on the box edge, cheap
to place render-side; the pedestrian pictogram is a 2-state toggle). The art must therefore
leave the **lens area readable but unlit** — hence the subject says the lens openings are
**"empty recessed lamps"** in **"unlit dark"** boxes: recessed dark holes the renderer can
light, never a painted-on colour. This keeps « ce qui brille est interactif » (§2 law 1)
diegetically live and prevents a baked hue from freezing the animation.

## 2. FLUX-reliability flag for lead-art — read before you PASS

**The single highest generation risk is the strict-profile vehicle head.** "Traffic light"
in FLUX's training is overwhelmingly the **face-on three-circle** icon, so the model will
fight the edge-on read — exactly the failure the board's DROPPED MSR25 fiche showed. I have
**not** relied on the word "profile" alone; the edge-on read is carried **positively as
shape** ("turned edge-on", "hoods jutting sideways along the front edge", "lens faces turned
away") so the unwanted face-on reading has less room. Even so, this is the clause most
likely to miss on the first roll. **Hedge / fallback ladder if the roll comes back face-on**
(one variable at a time, seed kept until composition itself is wrong):

1. Strengthen the profile shape clause only (e.g. add "the box much deeper front-to-back
   than it is wide, the three hoods reading as a vertical row of curved shells in
   silhouette") — one-variable iteration.
2. If FLUX still refuses both-heads-on-one-mast, **split the generation**: mast+pedestrian
   head face-on in one roll, vehicle head profile in a second, composite render-side (the
   heads are separate render layers anyway — the lit lens is already render-side). Flag to
   `dev-tooling-assets`.
3. Last resort: accept a shallow 3/4-back view of the vehicle head where the hoods still
   read as sideways shells and the lens faces stay mostly hidden — a graceful degrade of the
   pure-profile ideal, subject to Bertrand's call.

The **pedestrian head face-on is low-risk** (it is the icon's default orientation).

## 3. Keying flag for dev-tooling-assets

Ground = **bright magenta (#FF3CDC) chroma-key**, matching the proven generated-asset key
(vehicles, ADR-0011 / `cutout-enemies.mjs` corner-adaptive flood-fill), **deliberately NOT
the black key**: this prop's housing is near-black, and the board explicitly flags the
near-black-key hazard ("dark walls eaten by a near-black key", sprite-hole-audit risk) — a
black ground would flood-eat the black box. Magenta keys cleanly against both the black
housing and the pale-grey highlights and never appears inside a B&W prop. Edge highlights
are specified **pale grey, not white**, so the keyer cannot punch an enclosed white region
inside the silhouette as a false hole (§2 law 3 integrity sweep). Final key colour/threshold
is `dev-tooling-assets`' call; this is the recommended, pipeline-consistent default.

## 4. Seed & size

- **Pinned seed: `9301`** (new near-fg-prop lineage; pin per bible §3.10 — iterate one
  clause against the frozen seed, re-roll the seed ONLY if the composition/framing is wrong,
  never for a small tweak; commit the winner).
- **Size: 512 × 1024 px, aspect ~0.5** — a tall thin vertical mast; the prop stands full-
  height with even top/bottom margin so the cutout is whole.
- Pollinations flags (bible §3.11): **`enhance=false`** (verbatim style block preserved),
  `nologo=true`, `private=true`.

## 5. Base style block (shared near-fg-prop family spine — verbatim)

Adapted from the validated crade-documentaire spine; carries medium + texture + palette +
ground. To be appended verbatim to every near-fg prop subject (family consistency, §2 law 2).

```
, thick black ink outlines, cel-shaded posterized tones, muted desaturated night palette, pale grey edge highlights, flat ambient lighting, sharp cutout edges on a flat solid bright magenta (#FF3CDC) chroma-key background, high-contrast fanzine grain
```

Front-loaded shared **opening** (medium + view + isolation, highest-attention tokens, §3.2):

```
Flat two-dimensional graphic-novel illustration, one single prop in strict flat frontal orthographic elevation with no perspective, centered, fully visible,
```

## 6. Subject prompt (subject + silhouette only)

```
a tall slender 1990s Paris carrefour signal on one thin round vertical steel mast on a kerb; mid-height a narrow black box turned edge-on, three round lamp openings stacked vertically each under a protruding curved hood jutting sideways along the front edge, lamp faces turned away; lower, at a right angle, a smaller box facing forward with a simple standing-figure pedestrian pictogram; both boxes unlit dark with empty recessed lamps
```

## 7. Full assembled prompt (opening + subject + style — what Pollinations receives)

```
Flat two-dimensional graphic-novel illustration, one single prop in strict flat frontal orthographic elevation with no perspective, centered, fully visible, a tall slender 1990s Paris carrefour signal on one thin round vertical steel mast on a kerb; mid-height a narrow black box turned edge-on, three round lamp openings stacked vertically each under a protruding curved hood jutting sideways along the front edge, lamp faces turned away; lower, at a right angle, a smaller box facing forward with a simple standing-figure pedestrian pictogram; both boxes unlit dark with empty recessed lamps, thick black ink outlines, cel-shaded posterized tones, muted desaturated night palette, pale grey edge highlights, flat ambient lighting, sharp cutout edges on a flat solid bright magenta (#FF3CDC) chroma-key background, high-contrast fanzine grain
```

Assembled ≈ **120 words**, **1 negation** ("no perspective", within the ≤2 budget).
NB: this near-fg-prop family is **not** covered by `scripts/check-art-prompts.mjs` (it lints
only vehicles/enemies/courier/levels), so the word budget is advisory here, not gated —
`node scripts/check-art-prompts.mjs` PASSES because it does not touch this family. 120 words
is at the vehicle hard-ceiling and justified: every word past the 90 target is load-bearing
silhouette or the dual-orientation read (§3.3 "load-bearing tail" clause). If `lead-art`
wants it under 90, the cheapest cut is the pedestrian pictogram detail or "on a kerb".

---

## Per-clause rationale (clause → the shape/failure it locks down)

**Opening (shared):**

- `Flat two-dimensional graphic-novel illustration` → the validated non-photoreal medium
  (§3.1 positive statement, no "not photoreal" negation); anti-photoreal token.
- `one single prop … centered, fully visible` → isolation for a clean cutout (§ isolation);
  one mast, whole silhouette in frame.
- `strict flat frontal orthographic elevation with no perspective` → Prohibition "poster,
  not a diorama" geometry (§1/§5); the sole negation, front-loaded so the poster read lands
  in the high-attention tokens (§3.2).

**Subject:**

- `a tall slender 1990s Paris carrefour signal on one thin round vertical steel mast on a
kerb` → period-true 1998 Paris street furniture, near-side kerb (board Axis 1); "tall
  slender … thin round mast" sets the 0.5-aspect vertical silhouette.
- `mid-height a narrow black box turned edge-on` → the vehicle head, positioned + the
  load-bearing **profile** read stated as orientation of a _narrow_ box (edge-on = we see the
  thin side).
- `three round lamp openings stacked vertically each under a protruding curved hood jutting
sideways along the front edge` → the pre-LED French _casquette_ silhouette (board Axis 1:
  Nixea/Alumix/Aluxe/Géronimo family) AND the profile tell — hoods jut **sideways**, so the
  head can only be edge-on; "openings", not lenses-with-colour (unlit, §1).
- `lamp faces turned away` → completes the profile positively (the round faces point down the
  roadway, away from us) — **"turned away" not "not visible"**, so FLUX reads presence-of-
  turned-away, not a negation it would ignore (§3.1).
- `lower, at a right angle, a smaller box facing forward with a simple standing-figure
pedestrian pictogram` → the feu piéton, mounted at 90° and **face-on** (board Axis 2/3
  regulatory geometry); "standing-figure pictogram" = the legible bonhomme, unlit.
- `both boxes unlit dark with empty recessed lamps` → the ADR-0011 unlit-housing rule made
  explicit: recessed dark holes the renderer lights, never a baked hue (§1).

**Style (shared):**

- `thick black ink outlines, cel-shaded posterized tones, muted desaturated night palette` →
  the exact crade-documentaire register Bertrand validated on the facades/tronçons (§2 law 2
  family consistency); deep-night mood lives in the palette, not a dark background.
- `pale grey edge highlights` → gives the black box cel-shade form AND keeps highlights off
  pure white so the magenta keyer cannot punch a false interior hole (§2 law 3; §3 above).
- `flat ambient lighting` → kills cast shadows positively (§3.8), no negation spent.
- `sharp cutout edges on a flat solid bright magenta (#FF3CDC) chroma-key background` → the
  proven generated-asset key ground (§3 above), phrased in the whitelisted
  `bright magenta (#hex) chroma-key background` form; magenta never appears in a B&W prop and
  won't eat the black housing (unlike a black key).
- `high-contrast fanzine grain` → locks the fanzine/xerox medium (house §1); the fanzine
  token. The prop ships pure crade ink — a near-fg prop never glows (only the render-side lit
  lens does, §1).

---

## Rejected / considered variants (traceability)

- **Black chroma-key ground (vehicle-legacy #000000 mental default)** — REJECTED: the
  housing is near-black, a black key flood-eats it (board's explicit near-black-key hazard;
  sprite-hole-audit risk). → magenta key.
- **White chroma-key ground** — considered (dark subject cuts cleanly on white) but REJECTED
  for pipeline consistency: cel-shade specular could leave an enclosed white highlight = false
  hole, and magenta is the already-wired generated-asset key. → magenta + pale-grey (not
  white) highlights.
- **Naming the failure mode ("three lit lenses", "red yellow green")** — REJECTED on two
  counts: it bakes colour (breaks §1 / ADR-0011) and it summons the face-on icon (the profile
  failure). → "empty recessed lamps", "lamp faces turned away".
- **Both heads face-on (the MSR25 fiche the board DROPPED)** — REJECTED by the board itself;
  the whole point is profile vehicle + face pedestrian on one mast.
- **"strict profile view" as the only profile cue** — REJECTED as insufficient (FLUX ignores
  orientation words, §flux-craft); the profile is carried by shape (edge-on narrow box, hoods
  jutting sideways, faces turned away). See §2 fallback ladder.

## Hand-off

- `lead-art` **PROMPT GATE PASS required** before any generation (§2 FLUX-reliability flag is
  the key thing to weigh).
- `dev-tooling-assets` owns the `levelArt.json` wiring: a new near-fg-prop prompt family
  (shared `opening` + `style`, per-prop `prompt` + pinned `seed` + `size`), the magenta
  keying threshold, and — if the lint should cover this family — extending
  `check-art-prompts.mjs`. Concept-artist edits prompt/style strings only.
- Lint today: `node scripts/check-art-prompts.mjs` → PASS (family not yet linted).
  </content>
