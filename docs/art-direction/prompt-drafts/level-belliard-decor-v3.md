# Prompt drafts — Rue Belliard décor **v3** (reconstruction of the lost, gated draft)

Craft rules per [`flux-prompt`](../../../.claude/skills/flux-prompt/SKILL.md); nothing reaches
`levelArt.json` without the `lead-art` PROMPT GATE. This file **rebuilds** the v3 draft that
was PASS'd by `lead-art` then lost with an ephemeral env, carrying the gated decisions forward
verbatim, with **two intentional changes** (§8): the Deneux homage is dropped, and `foreground`
joins the regeneration lot. (`street` was verified not-rendered in tronçon mode and removed from
the lot after Serge's pre-prod pass — §5, §10.) Belliard regeneration lot: `troncon-a`,
`troncon-b`, `troncon-c`, `sky`, `foreground`.

Supersedes [`level-belliard-decor-v2.md`](level-belliard-decor-v2.md). Structural authority:
[`ADR-0048`](../../adr/0048-troncon-sequence-backdrop-mode.md). Consumes the two validated
boards (do not reopen): `board-belliard-decor.md` (D1–D5), `board-belliard-decor-v2.md`.

---

## 0. Structure — locked by ADR-0048 (the v2 "trottoir baké" clause is OBSOLETE)

The backdrop is a **fixed deterministic tronçon sequence** (`a, c, b, c` in the manifest).
Each tronçon PNG is **buildings only, floating on transparency**:

- **Transparent L/R margins ≥ 1/10 of the image width** — the buildings **never touch the
  frame edge**; the transparent margin _is_ the between-building gap (`TRONCON_GAP = 0`).
- **No baked road, no baked trottoir.** The v2 §0/§2 decision to bake a far-side trottoir
  band into each tronçon is **RETIRED** — the street/ground live in their own layers.
- **`ground.png`** — one continuous strip spanning the whole street, **kept as-is** (§6).
- **Parallax sky** shows through every between-building gap and above the rooflines; the
  sky region of each tronçon is **keyed transparent** (region-mask cut, not a global
  near-black chroma-key — the deep-night walls near `#141210` would be eaten; §5 keying).
- **Barrière / low grille** is kept **only directly under a building**, never spanning a gap.

Target aspects (from the committed manifest tiles; `dev-tooling-assets` owns sizes):
**A = 1.6491**, **B = 1.7857**, **C = 1.9224** (height fixed at `world.heightUnits`).

---

## 1. Shared "printing-run" style block (front-loaded, reused **byte-for-byte** by A/B/C)

The register is the load-bearing fix (v2 shipped **coloured, photographic** tronçons). It is
placed **at the head** of every tronçon prompt because FLUX over-weights the opening tokens,
and the anti-defect + hex-ladder + no-glow clauses are the blocking ones. One block, one
printing run, one shared pinned seed, one line weight (bible §2 law 2; RULING "un seul tirage").

```
Hand-drawn black-and-white comic-book illustration, bold clean black ink outlines and flat cel-shaded grey fills, clear ligne-claire cartoon drawing, not a photograph. Strict flat frontal orthographic elevation: every façade parallel to the picture plane and seen perfectly head-on, flat like an architect's front-elevation drawing and like a comic-book panel viewed dead ahead, no vanishing point. Printed on a 1990s photocopied fanzine page, coarse halftone toner dots and xerox grain over the linework, three-value ladder of near-black #141210, mid-grey #3A3E44 and paper-white #E9E3D2. One to three ordinary weathered Paris 18e faubourg buildings standing alone as an isolated cut-out cluster against open empty night sky, not a continuous street, irregular widths, four-to-five storeys, louvered shutters, simple iron balcony rails, grey zinc mansard roofs, two or three thick blocky chimneys per building, a low iron Petite-Ceinture grille at each base. Deep night, windows dark or shuttered, an occasional lit window a flat paper-white #E9E3D2 rectangle, no glow. Ground floor one value step lighter, its roll-down metal shutters layered with flat inked graffiti tags and a photocopied flyer in illegible lettering, tags thinning fast to bare clean upper walls. The buildings form one compact cluster floating in the centre of the frame, set well in from the sides, a wide band of empty plain night sky running down both the far left and the far right edge, the outermost building clearly ending inside the frame with sky beside it, the cluster never reaching or touching the left or right edge.
```

Per-clause rationale (each clause traces to a gated decision or a Bertrand 2026-07-21 correction;
the three corrections are front-loaded in the strong attention zone):

- `Hand-drawn black-and-white comic-book illustration, bold clean black ink outlines and flat
cel-shaded grey fills, clear ligne-claire cartoon drawing, not a photograph` →
  **CORRECTION 2 (register → DESSIN), at the absolute head.** The real render read the old
  "photocopied xerox / high-contrast B&W" opening as a *photograph*. The register now names
  the medium as a **hand-drawn comic-book illustration** first — ink contour lines + cel-shaded
  flats + ligne claire — stated positively so a drawing is what FLUX paints; the single bounded
  `not a photograph` is the one negation kept for this correction (Bertrand's explicit ask), the
  positive drawing vocabulary does the heavy lifting.
- `Strict flat frontal orthographic elevation: every façade parallel to the picture plane and
seen perfectly head-on, flat like an architect's front-elevation drawing and like a comic-book
panel viewed dead ahead, no vanishing point` → **CORRECTION 1 (frontal strict), promoted to the
  head and stated under two angles.** The real render showed a street in perspective (buildings
  receding to a vanishing point). The fix restates the frontal read positively and redundantly —
  *parallel to the picture plane*, *seen head-on*, *architect's front-elevation drawing*,
  *comic panel viewed dead ahead* — so no depth cue survives; `no vanishing point` is the single
  bounded negation that names the exact defect.
- `Printed on a 1990s photocopied fanzine page, coarse halftone toner dots and xerox grain over
the linework` → **CORRECTION 2 (texture layer).** The xerox/halftone survives — but re-cast as a
  **print texture laid *over the drawing***, not the primary register. This keeps the fanzine B&W
  house look (bible §1/§3.4) while the SUBJECT stays a cartoon, exactly the plein/register split
  Bertrand asked for.
- `three-value ladder of near-black #141210, mid-grey #3A3E44 and paper-white #E9E3D2` →
  **mandatory hex value ladder** (unchanged); binds tones to surfaces (§3.5) and forbids a 4th
  value — the whole décor lives on these three.
- `Ordinary weathered Paris 18e faubourg buildings, irregular widths, four-to-five storeys,
louvered shutters, simple iron balcony rails, grey zinc mansard roofs` → **faubourien 18e
  nord** (unchanged, gated): irregular R+4/R+5 volumes, volets/persiennes, demoted plain
  garde-corps, zinc mansards (D4 period truth).
- `two or three thick blocky chimneys per building` → **anti-defect armour** (unchanged): bounds
  the count _and_ the line weight of the roofline, the FLUX failure zone (RULING).
- `a low iron Petite-Ceinture grille at each base` → signature 18e-nord motif, dosed; kept only
  under buildings (§0). Unchanged.
- `Deep night, windows dark or shuttered, an occasional lit window a flat paper-white #E9E3D2
rectangle, no glow` → **the NIGHT/no-glow RULING** (unchanged): the décor never emits (loi du
  glow); a lit window is paper-white _in the B&W gamut_, never a baked warm halo. Stated
  positively with a single bounded negation.
- `Ground floor one value step lighter … tags thinning fast to bare clean upper walls` →
  the **tagged ground-floor band RULING** (unchanged) + axis-1 taper, stated positively.
- `flat inked graffiti tags and a photocopied flyer in illegible lettering` → Paris-Tonkar
  rideau-de-fer register + flyer/pochoir, **lettering illegible on purpose** (unchanged); the
  "stapled" freebie stays cut (Serge S14).
- `The drawn block sits centered with an empty margin of night sky on both the left and right
side, never touching the left or right frame edge` → **CORRECTION 3 (vide L ET R), reinforced.**
  The real render filled the right edge. The margin is now demanded **explicitly on both sides**
  (left AND right named twice) — the ADR-0048 transparent-margin contract (≥1/10, keyable to the
  parallax gap), still guaranteed mechanically by tooling padding on top of the prompt.

> **Word count:** the shared block now runs ~190 words (up from ~130). The whole growth is the
> three Bertrand 2026-07-21 corrections — the drawing register, the doubled frontal statement and
> the two-sided margin — all front-loaded in FLUX's strong attention zone; every gated RULING
> below them is preserved verbatim in concept (only "buildings centered … frame edge" was rewritten
> to name both margins). `checkLevels` imposes **no** word or negation ceiling on level prompts
> (non-emptiness + the foreground magenta phrase only), so the block clears the lint; the real gate
> is the register/perspective/margin read at the play camera. Negation count = **3** (`not a
> photograph`, `no vanishing point`, `no glow`) — under the house ≤4 hard ceiling, each bounded and
> load-bearing, the positive drawing/frontal vocabulary carrying the corrections (bible §3.1).

---

## 2. Per-tronçon prompts (shared block above + one distinguishing clause; full strings below)

Only the composition differs (building count + gap beat) — the weakest attention zone, and
composition is what FLUX only approximates, so it is validated in-scene, not by tokens.

### Tronçon A — two buildings, one thin sky sliver (aspect 1.6491)

```
Hand-drawn black-and-white comic-book illustration, bold clean black ink outlines and flat cel-shaded grey fills, clear ligne-claire cartoon drawing, not a photograph. Strict flat frontal orthographic elevation: every façade parallel to the picture plane and seen perfectly head-on, flat like an architect's front-elevation drawing and like a comic-book panel viewed dead ahead, no vanishing point. Printed on a 1990s photocopied fanzine page, coarse halftone toner dots and xerox grain over the linework, three-value ladder of near-black #141210, mid-grey #3A3E44 and paper-white #E9E3D2. One to three ordinary weathered Paris 18e faubourg buildings standing alone as an isolated cut-out cluster against open empty night sky, not a continuous street, irregular widths, four-to-five storeys, louvered shutters, simple iron balcony rails, grey zinc mansard roofs, two or three thick blocky chimneys per building, a low iron Petite-Ceinture grille at each base. Deep night, windows dark or shuttered, an occasional lit window a flat paper-white #E9E3D2 rectangle, no glow. Ground floor one value step lighter, its roll-down metal shutters layered with flat inked graffiti tags and a photocopied flyer in illegible lettering, tags thinning fast to bare clean upper walls. The buildings form one compact cluster floating in the centre of the frame, set well in from the sides, a wide band of empty plain night sky running down both the far left and the far right edge, the outermost building clearly ending inside the frame with sky beside it, the cluster never reaching or touching the left or right edge. Here, two such buildings of clearly different width and height stand together as an isolated pair with open night sky all around them, a clear vertical sliver of sky between the two.
```

- `two such buildings of clearly different width and height side by side` → axis-2 distinct
  volumes set tight; irregular so the row never reads as a repeating module.
- `a clear vertical sliver of empty night sky between them at least as wide as one window bay`
  → the gap beat; "empty night sky" keys transparent to the parallax layer; **S10** min-width
  anchor so the sliver keys clean and the two volumes read as distinct (not one fused mass).

### Tronçon B — three buildings, one bare mur-pignon (aspect 1.7857) · **generic, no Deneux**

```
Hand-drawn black-and-white comic-book illustration, bold clean black ink outlines and flat cel-shaded grey fills, clear ligne-claire cartoon drawing, not a photograph. Strict flat frontal orthographic elevation: every façade parallel to the picture plane and seen perfectly head-on, flat like an architect's front-elevation drawing and like a comic-book panel viewed dead ahead, no vanishing point. Printed on a 1990s photocopied fanzine page, coarse halftone toner dots and xerox grain over the linework, three-value ladder of near-black #141210, mid-grey #3A3E44 and paper-white #E9E3D2. One to three ordinary weathered Paris 18e faubourg buildings standing alone as an isolated cut-out cluster against open empty night sky, not a continuous street, irregular widths, four-to-five storeys, louvered shutters, simple iron balcony rails, grey zinc mansard roofs, two or three thick blocky chimneys per building, a low iron Petite-Ceinture grille at each base. Deep night, windows dark or shuttered, an occasional lit window a flat paper-white #E9E3D2 rectangle, no glow. Ground floor one value step lighter, its roll-down metal shutters layered with flat inked graffiti tags and a photocopied flyer in illegible lettering, tags thinning fast to bare clean upper walls. The buildings form one compact cluster floating in the centre of the frame, set well in from the sides, a wide band of empty plain night sky running down both the far left and the far right edge, the outermost building clearly ending inside the frame with sky beside it, the cluster never reaching or touching the left or right edge. Here, three such buildings stand clustered together as an isolated group with open night sky around them, one showing a bare windowless mid-grey #3A3E44 masonry gable end wall.
```

- `three such buildings in a tight irregular row` → axis-2; three distinct generic faubourien
  volumes — **no bespoke façade** (Deneux dropped, §8).
- `one gap opening onto a bare windowless mid-grey #3A3E44 masonry gable end wall` → the
  **mur-pignon** gap beat: opaque building fabric anchored on the mid-grey wall value, the
  transparent gap beside it revealing the near-black sky. The residual-wall variety beat.

### Tronçon C — two–three buildings, one narrow passage (aspect 1.9224)

```
Hand-drawn black-and-white comic-book illustration, bold clean black ink outlines and flat cel-shaded grey fills, clear ligne-claire cartoon drawing, not a photograph. Strict flat frontal orthographic elevation: every façade parallel to the picture plane and seen perfectly head-on, flat like an architect's front-elevation drawing and like a comic-book panel viewed dead ahead, no vanishing point. Printed on a 1990s photocopied fanzine page, coarse halftone toner dots and xerox grain over the linework, three-value ladder of near-black #141210, mid-grey #3A3E44 and paper-white #E9E3D2. One to three ordinary weathered Paris 18e faubourg buildings standing alone as an isolated cut-out cluster against open empty night sky, not a continuous street, irregular widths, four-to-five storeys, louvered shutters, simple iron balcony rails, grey zinc mansard roofs, two or three thick blocky chimneys per building, a low iron Petite-Ceinture grille at each base. Deep night, windows dark or shuttered, an occasional lit window a flat paper-white #E9E3D2 rectangle, no glow. Ground floor one value step lighter, its roll-down metal shutters layered with flat inked graffiti tags and a photocopied flyer in illegible lettering, tags thinning fast to bare clean upper walls. The buildings form one compact cluster floating in the centre of the frame, set well in from the sides, a wide band of empty plain night sky running down both the far left and the far right edge, the outermost building clearly ending inside the frame with sky beside it, the cluster never reaching or touching the left or right edge. Here, two or three such buildings stand together as an isolated cluster with open night sky around them, one narrow dark passage alley set back well within the cluster, away from either edge.
```

- `two or three such buildings` → axis-2 varied count (C is instanced twice in the sequence,
  so it must read as generic, not a signature).
- `one narrow dark passage alley set back well within the row between two of them, away from
  either edge` → the passage gap beat; opaque shadowed recess, distinct from A's sliver and
  B's gable; **S11** "away from either edge" keeps the near-black passage off the L/R margin so
  the region-mask sky key does not swallow it (C is instanced twice, `a, c, b, c`).

**Technical constraints (A/B/C, shared):** transparent PNG; **region-mask key** above
rooflines + inside the sky slivers/margins only (NOT a global near-black chroma-key — flag to
`dev-tooling-assets`, §5); transparent L/R margins ≥1/10 width; buildings never touch edge; no
baked road/trottoir; grille only under buildings; **one shared pinned seed** for A/B/C (propose
`7110`) so the three read as one printing run; committed by `dev-tooling-assets`.

---

## 3. `sky` layer — regenerated (was left colour-ish in v2)

Separate backmost parallax layer showing through every gap and above the rooflines. The old
`"…stars and distant haussmann rooftops silhouette, full moon haze"` is retired (colour-ish,
and its rooftops double the buildings). New fanzine B&W sky, **sodium halo as VALUE not hue**.

```
Photocopied 1990s fanzine xerox night sky, high-contrast black-and-white only, coarse halftone toner dots, a deep near-black #141210 field, a faint sodium glow rendered purely as value, the low horizon band a shade lighter grey grading up to the darkest zenith, only a very few tiny scattered white star specks, everything staying below paper-white, horizontally tileable seamless left to right.
```

- `Photocopied 1990s fanzine xerox night sky, high-contrast black-and-white only` → same
  register as the tronçons (one world).
- `deep near-black #141210 field` → anchors the sky on the darkest ladder value, below the
  lit-window paper-white so a window still reads as the brightest thing.
- `a faint sodium glow rendered purely as value, the low horizon band a shade lighter grey
grading up to the darkest zenith` → the **RULING**: Paris sodium halo as a value gradient,
  horizon lighter than zenith, **no colour**.
- `only a very few tiny scattered white star specks` → "quasi pas d'étoiles", positively.
- `everything staying below paper-white` → keeps the sky darker than a lit window (no glow).
- `horizontally tileable seamless left to right` → the layer scrolls in parallax.

**Technical constraints:** opaque full-bleed (backmost layer, no keying); horizontally
tileable; wide aspect; pinned seed (propose `7120`).

---

## 4. `foreground` layer — **REGENERATED** (the script desaturation was rejected)

Near-parallax ironwork overlay. The v2 approach — desaturate the colour photo by script —
was judged a failure (a desaturated photo is not fanzine, and the interstices stayed as bouché
photographic grey). This is a **full FLUX regeneration** that must **decide plein/vide**: the
iron is solid ink, everything else (background AND every interstice between the bars) is one
flat keyable field so the cutout reads as a hard découpe. The prompt front-loads that plein/vide
clause (it is the load-bearing instruction), restores the two gated guarantees the earlier draft
dropped — the ironwork **floats alone** (no building/wall/sky behind it, stated positively) and
the bars are **evenly spaced** (so FLUX cannot weld them into a solid ink mass) — and drops the
"glazing" wording that implied a real window pane could sit behind the bars (S2).

```
A row of Parisian wrought-iron balcony railings and vertical window guard bars seen up close, the ironwork floating alone and filling the frame edge to edge with nothing else in view, the whole background and every gap between the bars and every space behind them one flat uniform bright magenta chroma-key field #FF3CDC so only the black iron is solid and all the negative space is an empty keyable field, thick solid pure-black inked silhouettes, each bar and scroll evenly spaced and separated by a clear magenta gap, hard crisp cut-out edges, photocopied 1990s fanzine xerox black-and-white, high-contrast.
```

- `Parisian wrought-iron balcony railings and vertical window guard bars seen up close` → the
  subject: garde-corps de balcon + barreaux, close near-parallax scale (S5: dropped the
  ambiguous "near", "seen up close" already sets the scale).
- `the ironwork floating alone and filling the frame edge to edge with nothing else in view`
  → **S2 guarantee, restated positively**: no building, wall or sky behind the bars — the
  overlay is a bare détourage, so FLUX cannot fill "behind" with a real façade fragment.
- `the whole background and every gap between the bars and every space behind them one flat
uniform bright magenta #FF3CDC so only the black iron is solid and all the negative space is
an empty keyable field` → the **plein/vide decision, front-loaded** (S4): interstices are the
  key colour, not photographic grey — the keyer punches them through.
- `thick solid pure-black inked silhouettes` → **franc black ink** silhouette.
- `each bar and scroll evenly spaced and separated by a clear magenta gap` → **S3 guarantee**:
  regular spacing + a guaranteed magenta interstice, so the bars never fuse into a solid mass
  (the plein/vide contract holds at the subject level, not only the background).
- `hard crisp cut-out edges, photocopied 1990s fanzine xerox black-and-white, high-contrast` →
  sharp découpe + the house register.

**Technical constraints:** magenta `#FF3CDC` key on the background **and all interstices** →
keyed to transparency (bright key so the pure-black iron survives — never a near-black key);
near-parallax overlay, no tiling required; sharp cutout edges; pinned seed (propose `7130`).
Décor ironwork does **not** glow (it is keyed to bare B&W, no neon rim — loi du glow).

---

## 5. `street.png` — **NOT regenerated** (not rendered in tronçon mode)

**Removed from the regeneration lot** (scope verification, Bertrand + Serge, 2026-07-21).
`street.png` is **not rendered anywhere for Belliard**: in `troncon-sequence` mode
`LevelBackdrop.tsx` uses `ground.png` for the floor and explicitly excludes `street.png` (its
centred zebra would peek through the between-building gaps); `street.png` only exists in
`single-facade` mode (stalingrad/vitry), and no call composites Belliard's street — not even the
`QTE_ZOOM_FACTOR = 2.4` hostage view, which zooms the scene as-is rather than a dedicated
`street.png` plane. Regenerating it would produce an asset the game never draws.

So, like `ground.png`, `street.png` is **kept as-is — no prompt is written for it**. (If a
future design wires a dedicated top-down `street` plane into the tronçon QTE view, a fanzine-B&W
regen prompt gets authored **then**, against a real compositing point — see Serge S7.)

---

## 6. `ground.png` — **NOT regenerated** (kept as-is)

The committed **v6** ground strip (`assets/levels/belliard/ground.png`, **3760×340**) is
already a neutral, deliberate deep-night bitumen band between two grey kerb/barrière runs. It
is on-register and stays byte-stable — **no prompt is written for it**.

---

## 7. Generation — FLUX text-to-image, pinned seed, **never img2img off a colour photo**

**Every regenerated asset (tronçons A/B/C, sky, foreground) generates as FLUX
text-to-image on a pinned seed** with the fanzine B&W register front-loaded — **never**
`gen-from-reference` / `kontext` img2img conditioned on a colour photo. (`street.png` and
`ground.png` are **not** regenerated — §5, §6.)

- **Root cause of the v2 colour.** The v2 tronçons and the foreground came out coloured
  (blue/sepia toner, pink-blue duotone) because they were derived from colour photo
  references, and the pipeline's `postProcess()` desaturation only runs on the **vehicles**
  family — level backdrops were never desaturated, so the colour survived to the PNG.
- **Fix.** Pure text-to-image with "black-and-white only" + the hex value ladder at the head,
  pinned seeds, `enhance=false` (bible §3.11). Colour cannot enter because no colour source
  is conditioned in and the register forbids it in tokens.
- **kontext is style-lock fallback only** — off a **lead-art-nominated fanzine B&W** result,
  never off a colour photo and never for layout (bible §3.12).
- **Shared seed** for A/B/C (one printing run); own pinned seeds for sky and foreground.
- **Bypass** `gen-level-art.mjs`'s manifest `style` (pixel-art) and `continuity` (fused
  terrace) suffixes for this family — same as v2 §0 (`dev-tooling-assets`).

---

## 8. Changes vs v2 and vs the lost v3

**vs v2:**

- **Structure.** The v2 baked far-side trottoir band (v2 §0/§2) is **OBSOLETE** — ADR-0048
  locks buildings-only transparent tronçons + separate `ground.png` + parallax sky in the
  gaps. Transparent L/R margins ≥1/10, buildings never touch the edge.
- **Register.** v2's "graphic-novel comic-book, cel-shaded, muted desaturated palette"
  appended as a **tail** produced coloured/photographic art. v3 replaces it with explicit
  **photocopied fanzine xerox B&W, front-loaded**, with a mandatory `#141210 / #3A3E44 /
#E9E3D2` value ladder; no colour.
- **Night / glow.** v2 (and the old `facade`) allowed windows "glowing warm orange". v3
  RULING forbids any baked warm halo — windows dark/shuttered, a lit one a flat paper-white
  rectangle; the ground-floor band is one value step lighter, not a 4th value.
- **Sky.** v2 kept the old colour-ish sky; v3 writes a new fanzine B&W sky (sodium halo as
  value, almost no stars, tileable).
- **Seeds.** v2 used per-tronçon seeds (7101/7102/7103); v3 uses **one shared pinned seed**
  for A/B/C (one printing run).

**vs the lost (PASS'd) v3:**

- **Deneux homage DROPPED** (Bertrand). Tronçon B is now a **100% generic** faubourien volume
  — the bare mur-pignon stays, but **no ceramic façade / bow-window / roof-terrace** and **no
  Deneux mention** anywhere.
- **`foreground` ADDED to the regeneration lot.** The script retouch (desaturating the colour
  photo) was judged a failure, so it is now a **full FLUX regeneration** with its own v3 prompt
  (§4), not a retouch.
- **`street` REMOVED from the lot** (scope verification 2026-07-21): it is not rendered in
  tronçon mode, so regenerating it is wasted work (§5).
- **`ground.png` and `street.png` confirmed NOT regenerated** — both kept as-is (§5, §6).
- **The Belliard regeneration lot is therefore: `troncon-a`, `troncon-b`, `troncon-c`, `sky`,
  `foreground`.**

---

## 9. Hand-off

Nothing in `levelArt.json` changes until this draft PASSes the **`lead-art` PROMPT GATE**;
`dev-tooling-assets` then lands the strings, pins the seeds, and re-runs
`node scripts/check-art-prompts.mjs`. Generation follows the gate; then in-scene validation at
the play camera (gap width / axis-1 taper / QTE cross-section), per ADR-0048's risk register.
Keying (region-mask cut for the tronçons; bright-magenta punch for the foreground) is a
`dev-tooling-assets` call, flagged in §2/§4.

---

## 10. Annotations game-graphist (pre-prod) — Serge

Passe PRE-PROD, avant PROMPT GATE. Je n'ai pas touché aux prompts — je note, Maud tranche.
Calibrage : les tronçons/sky rendent GRANDS à l'écran (hauteur monde fixe = `world.heightUnits`
12, ~600-900px selon viewport — pas des vignettes 64px), donc le risque n'est pas "le détail
meurt en réduction" mais plutôt "le détail devient du bruit à taille affichée quasi native".
J'ai vérifié les deux nouveautés (tronçon-b générique, foreground+street régénérés) en priorité,
et comparé au rendu v2 réellement committé (`public/assets/levels/belliard/*.png`) pour voir
concrètement le défaut que chaque clause v3 est censée corriger.

### Tronçon B — résidu Deneux

- **[S1] Deneux : clean, confirmé.** Le prompt §2/B ne contient plus aucune trace d'hommage —
  pas de céramique, pas de bow-window, pas de toit-terrasse, pas de nom. Le mur-pignon est
  générique (« bare windowless mid-grey #3A3E44 masonry gable end wall »). **Nice-to-have** :
  ajouter un mot d'ancrage positif type « plain unornamented brick coursing » après « masonry »
  — la banque d'images d'entraînement FLUX associe volontiers pignon parisien + fer forgé
  ornemental (déjà très présent dans le tronc commun) à un décor de type céramique/mural
  publicitaire ; un mot de plus coupe court à toute dérive de connotation sans reformuler la
  clause. Non bloquant, juste une ceinture de sécurité gratuite.

### `foreground` — régénéré, prompt neuf (§4)

C'est la pièce la plus sensible du lot : la retouche script a été jugée ratée précisément parce
que les interstices restaient un gris photo bouché au lieu d'un vide keyable. Le prompt v3 doit
garantir ce plein/vide à deux niveaux — fond général ET intérieur du sujet (entre les barreaux) —
et le draft ne le fait qu'à moitié.

- **[S2] BLOQUANT — pas de garde anti-bâtiment.** Le prompt décrit des « window guard bars » et
  parle explicitement de « every space behind the glazing » — donc il évoque un vitrage/une
  fenêtre RÉELLE derrière les barreaux, sans jamais dire que le reste (mur, maçonnerie,
  vitre physique) est absent du cadre. L'ancien prompt gated (v1/v2, `levelArt.json` §606) portait
  justement « no building, no wall, no sky » — cette garde a disparu en v3. Sans elle, FLUX peut
  très bien remplir « derrière le vitrage » par un fragment de mur/fenêtre réel au lieu d'un aplat
  magenta, ce qui recrée exactement le problème qu'on regénère pour corriger (du gris/texture
  photo bouché à la place du vide keyable). Fix concret : ajouter une clause positive du type
  « the ironwork floating alone, filling the frame edge to edge, nothing else in view » (ou
  réintroduire une version positive de « no building/no wall » — le budget négation de la maison
  tolère ≤2 occurrences, on n'en a aucune ici, il y a de la marge).
- **[S3] BLOQUANT — le garde-fou « evenly spaced » a sauté.** L'ancien prompt (§606) disait
  « evenly spaced » ; le v3 ne le dit plus nulle part. Le prompt actuel garantit que **le fond**
  est magenta, mais rien n'empêche FLUX de souder les barreaux/volutes entre eux en une masse
  d'encre noire continue — auquel cas il n'y a plus d'interstice à remplir de magenta du tout, et
  le contrat plein/vide échoue au niveau du sujet, pas du fond (c'est exactement le risque
  « intersticies entre barreaux… vide keyable » nommé en tête de mission). Fix concret : rajouter
  quelque chose comme « each bar and scroll evenly spaced, separated by a clear magenta gap » près
  de « hard crisp cut-out ».
- **[S4] Recommandé — la clause plein/vide est en queue de phrase.** Le principe déjà appliqué au
  tronc commun (§1 rationale : « placed at the head… because FLUX over-weights the opening
  tokens ») n'est pas repris ici : la phrase ouvre sur le sujet (« A row of ornate… »), le
  registre xerox arrive au milieu, et la clause magenta/plein-vide — qui est LA clause bloquante
  de ce prompt, l'exacte raison de la régénération — arrive en tout dernier, dans la zone
  d'attention la plus faible (bible §3.2 : le queue de prompt est « the weakest attention zone »).
  Remonter « the whole background… magenta #FF3CDC » juste après « seen up close », avant la
  description du rendu de l'encre, comme on l'a fait pour le tronc commun.
- **[S5] Nice-to-have — « near Parisian » est ambigu.** Probablement un résidu de rédaction
  (« near-parallax Parisian » amputé ?). Ça ne casse rien parce que « seen up close » fait déjà le
  travail de cadrage, mais autant lever l'ambiguïté : soit « near-parallax Parisian… », soit
  simplement « Parisian… » sans « near ».
- **[S6] Nice-to-have — deux motifs de ferronnerie dans une seule silhouette dense.** « balcony
  railings » (rythme horizontal, ferronnerie ouvragée) + « vertical window guard bars » (barreaux
  verticaux droits) cohabitent dans un même plan rapproché scrollant vite en overlay proche. Pas
  bloquant (silhouette-first reste un appel de goût pour Nico), mais si le rendu part en fouillis
  illisible à la vitesse de scroll du near-parallax, la prochaine itération devrait trancher pour
  un seul motif dominant.

### `street` — régénéré, prompt neuf (§5)

- **[S7] Important — vérifier le point d'attache réel avant de sur-raffiner le prompt.**
  `LevelBackdrop.tsx` (mode tronçon, code actuel) affiche `ground.png` tuilé sous les bâtiments et
  exclut explicitement `street.png` (« NOT street.png, whose centred zebra crossing… would peek
  through the gap »). `street.png` n'est référencé nulle part ailleurs dans `src/render` — à ce
  jour il n'est PAS composité dans la vue QTE zoomée (`QTE_ZOOM_FACTOR = 2.4` existe bien dans
  `qteCamera.ts`, mais il zoome sur la scène telle quelle, pas sur un plan `street.png` dédié).
  Le §5 du draft affirme que c'est « read by the ×2.4 hostage-QTE zoom » — c'est un design
  intentionnel, pas un fait déjà câblé. Pas un blocage prompt (le patch bitume xerox est utile
  quel que soit le point d'ancrage final), mais je le signale pour que `dev-tooling-assets`/
  `lead-art` confirment le plan de compositing avant qu'on affine trop précisément le prompt
  autour d'une échelle d'affichage (« lisible à 2.4× ») qui n'est pas encore une vérité de code.
- **[S8] Recommandé — durcir contre la dérive photographique.** Le PNG v2 committé (que j'ai
  regardé) est exactement le défaut à éviter : bitume mouillé avec reflets spéculaires et une
  fuite de lumière chaude en coin — un rendu photo, pas un aplat xerox. Le v3 corrige déjà
  l'essentiel en front-loadant le registre et en ancrant la valeur sur `#141210` (bon calibrage,
  aligné sur l'échelle `ink-black` de la bible), mais rien n'interdit positivement le rendu
  « mouillé/spéculaire » qui a produit ce résultat une fois. Fix concret, sans dépasser le budget
  négation (`no horizon, no perspective` = 2 déjà) : remplacer « flat level ground plane, no
  horizon, no perspective » (redondant : les deux dernières clauses disent la même chose deux
  fois) par « a dry matte flat ground plane, no horizon » — ça introduit « matte » positivement et
  fait baisser le compte de négations au lieu de le monter.
- **[S9] Recommandé — ancrer le nombre de bandes du zébra.** « evenly stacked » ne donne pas de
  compte ; c'est exactement le risque FLUX nommé pour le reste du lot (« grilles régulières →
  dérive de comptage »), et un passage piéton est une grille régulière. Ajouter un ancrage court,
  ex. « six to eight thick stripes », pour éviter un roll à 3 bandes surdimensionnées ou 20 bandes
  microscopiques.
- Points confirmés propres, pas d'action : bitume plein cadre bord à bord (corrige le
  letterboxing bleu du PNG v2), passage clouté explicitement pleine largeur (répété deux fois
  dans la phrase), pas de keying nécessaire (plan opaque plein cadre).

### Le reste (tronçons A/C, sky, tronc commun)

- **[S10] Recommandé — tronçon A, sliver de ciel sans largeur minimale.** « one thin vertical
  sliver of empty night sky between them » ne donne aucune ancre de largeur. Un sliver trop fin
  keye mal (frange à l'anti-aliasing) et surtout risque de lire comme UN seul bâtiment fusionné à
  l'écran plutôt que deux volumes distincts (silhouette-first, loi 3). Ancrer avec quelque chose
  comme « a clear vertical sliver… at least as wide as one window bay ».
- **[S11] Recommandé — tronçon C, le passage doit rester loin du bord.** Le passage alley est
  volontairement opaque/near-black (contrairement au sliver de sky-A qui doit rester transparent)
  — bonne distinction déjà faite par Maud. Mais C est instancié deux fois dans la séquence
  (`a, c, b, c`) et sa valeur near-black est identique à celle des marges de ciel transparentes ;
  si le masque region-mask utilisé au keying (§0 : « above rooflines + inside the sky
  slivers/margins ») n'est pas repositionné avec précision par instance, un passage qui tomberait
  trop près du bord L/R risque de se faire bouffer par la même passe que la marge ciel. Recommandé
  d'ancrer la position dans le prompt : « … set back well within the row, away from either edge ».
- **[S12] Confirmé propre — pas d'action.** Comptage de cheminées borné (« two or three… thick
  blocky »), halftone « coarse » (bon choix pour un rendu grand format — du fin aurait fait du
  bruit/moiré à taille quasi native, pas l'inverse du risque habituel petit-sprite), ciel avec
  quelques étoiles rares + sodium-en-valeur (aucune fine texture à perdre, c'est un dégradé),
  tuileability horizontale du ciel présente, keying du ciel en region-mask explicitement PAS un
  chroma-key global (évite de bouffer les #141210 des murs — bon réflexe déjà pris). Mécanique
  trois-tailles : comme la hauteur est verrouillée à `world.heightUnits` pour A/B/C et que seule
  la largeur varie avec l'aspect, l'échelle apparente d'un bâtiment ne varie PAS entre les trois
  tronçons — le risque « même traitement à 3 tailles » est structurellement neutralisé, pas
  besoin d'une clause dédiée.
- **[S13] Nice-to-have — marge numérique confirmée en texte, mais pas dans le prompt (normal).**
  Le ≥1/10 de largeur (§0/§2) n'est pas — et ne peut pas être — un chiffre que FLUX respecte à la
  lettre depuis le texte seul ; le draft le traite correctement comme une contrainte technique
  post-génération plutôt que de le sur-promettre dans le prompt. Je demande juste confirmation
  que `dev-tooling-assets` a bien un contrôle automatisé de cette marge (mesure de bbox) plutôt
  qu'une vérification à l'œil — sinon la marge peut dériver silencieusement d'une régénération à
  l'autre.

### Tronc de style partagé — ~130 mots vs dérogation ~115

- **[S14] Avis production : dérogation justifiée, ne pas forcer la coupe.** J'ai relu clause par
  clause : quasiment chaque mot au-delà de 90 est déjà tracé à une RULING gated dans le tableau de
  rationale de Maud (registre, ladder hex, no-glow, anti-defect cheminées, bande taguée + taper
  qui protège justement la lisibilité des fenêtres en évitant que les tags débordent sur les
  étages hauts, marges ADR-0048). Couper l'une de ces clauses pour gagner des mots recrée
  précisément le risque que ce draft corrige (dérive couleur, halo, comptage cheminées non
  borné, texte illisible qui part en charabia). Une seule économie gratuite trouvée, sans toucher
  à une RULING citée : « and a stapled photocopied flyer in illegible lettering » → « and a
  photocopied flyer in illegible lettering » (-1 mot, « stapled » n'est cité nulle part comme
  load-bearing). Ça ne comble pas l'écart et ce n'est pas le but — je ne recommande pas de forcer
  le tronc à 115 mots.

### Verdict

**NEEDS REWORK** — pas sur le fond (structure ADR-0048, retrait Deneux, registre xerox : tout est
sain), mais **[S2] et [S3] sont bloquants pour le gate** : le prompt `foreground` tel qu'écrit ne
garantit pas le contrat plein/vide qu'il existe pour livrer — ni contre le bâtiment qui pourrait
réapparaître derrière le vitrage, ni contre des barreaux qui se souderaient en une masse pleine.
Ce sont deux régressions concrètes par rapport au prompt gated précédent (`levelArt.json` §606
avait « no building, no wall, no sky » + « evenly spaced » ; le v3 a perdu les deux en réécrivant
le prompt). Les autres points ([S1], [S4]-[S13]) sont recommandés ou nice-to-have et n'empêchent
pas le gate à eux seuls.

— Serge, PRE-PROD pass

### Résolution — Maud (itération 1/2, 2026-07-21)

Corrective pass applied to my sections; Serge's text above is untouched.

- **[S1]** ⏸️ reporté (nice-to-have) — tronçon B mur-pignon stays clean/generic; the
  "plain brick coursing" safety word is not added this pass to keep the byte-for-byte shared
  block stable. Note for a future roll if the gable drifts toward ornament.
- **[S2]** ✅ appliqué — foreground now states the ironwork **floats alone, nothing else in
  view**; dropped the "behind the glazing" wording that implied a real pane/façade behind the
  bars (§4).
- **[S3]** ✅ appliqué — restored **`each bar and scroll evenly spaced and separated by a clear
  magenta gap`** so the bars cannot weld into a solid ink mass (§4).
- **[S4]** ✅ appliqué — the magenta plein/vide clause is **front-loaded**, right after "seen up
  close", before the ink-rendering description (§4).
- **[S5]** ✅ appliqué — dropped the ambiguous "near"; the subject reads "Parisian … seen up
  close" (§4).
- **[S6]** ⏸️ reporté (nice-to-have) — two ironwork motifs kept for now; if the near-parallax
  scroll reads as clutter in-scene, the next iteration picks one dominant motif.
- **[S7]** ✅ résolu par le retrait — `street` is removed from the lot (not composited in
  tronçon mode); the "read by the ×2.4 QTE zoom" claim is gone with it (§5).
- **[S8]** ✅ sans objet — the "matte / no-reflection" hardening targeted the `street` prompt,
  which is removed (§5).
- **[S9]** ✅ sans objet — the zebra stripe-count anchor targeted the `street` prompt, removed
  (§5).
- **[S10]** ✅ appliqué — tronçon A sliver anchored **`at least as wide as one window bay`** (§2).
- **[S11]** ✅ appliqué — tronçon C passage anchored **`set back well within the row … away from
  either edge`** so the region-mask sky key can't eat it (§2).
- **[S12]** ✅ confirmé propre — no action.
- **[S13]** ✅ noté — the ≥1/10 margin stays a post-gen technical constraint (§0/§2); flagged to
  `dev-tooling-assets` to confirm an **automated bbox check** rather than an eyeball check.
- **[S14]** ✅ dérogation gardée — ~130-word shared trunk kept (every word past 90 traces to a
  gated RULING); the free "stapled" cut is left in place, non-load-bearing either way and not
  worth the 4× byte-for-byte edits across the shared block.

**Bloquants [S2]/[S3] traités + [S4] front-load ⇒ le prompt `foreground` regarantit le contrat
plein/vide au niveau du sujet ET du fond. `street` retiré du lot.** Le lot Belliard est
maintenant : `troncon-a`, `troncon-b`, `troncon-c`, `sky`, `foreground`. Repart au gate prompt
lead-art.

### Retours Bertrand 2026-07-21 appliqués — Maud (tronçons A/B/C uniquement)

Retour d'art direction du propriétaire projet **sur le rendu réel** des tronçons : le PNG livré
sortait en **photo N&B haute-contraste en perspective** — l'inverse du décor voulu. Passe
corrective sur **§1 (bloc partagé)** et **§2 (prompts A/B/C assemblés)** seulement ; le reste du
draft (structure ADR-0048, `sky`, `foreground`, seeds, contraintes techniques) est inchangé. Les
trois corrections sont **front-loadées** dans la zone d'attention forte de FLUX.

- **[B1] FRONTAL STRICT, jamais de perspective — corrigé, remonté en tête absolue.** Le rendu
  montrait une rue en fuyante (bâtiments s'enfonçant vers un point de fuite). L'ancien « Flat
  frontal orthographic elevation, no perspective » (une seule mention, faible) est remplacé par une
  clause **remontée juste après le registre dessin** et **répétée sous deux angles positifs** :
  *every façade parallel to the picture plane and seen perfectly head-on*, *flat like an
  architect's front-elevation drawing*, *and like a comic-book panel viewed dead ahead*, close par
  la seule négation bornée qui nomme le défaut exact — *no vanishing point*. Aucune indice de
  profondeur ne survit à cette description positive.
- **[B2] BD / CARTOON, pas photo — corrigé, c'est la bascule de registre.** L'ouverture « photocopied
  xerox / high-contrast black-and-white » était lue par FLUX comme une **photo N&B**. Le prompt
  ouvre désormais sur le **médium DESSIN** : *hand-drawn black-and-white comic-book illustration,
  bold clean black ink outlines and flat cel-shaded grey fills, clear ligne-claire cartoon drawing*,
  avec l'unique négation *not a photograph*. Le xerox/halftone est **conservé mais requalifié en
  TEXTURE d'impression posée par-dessus le dessin** (*coarse halftone toner dots and xerox grain
  over the linework*), donc le SUJET reste un dessin, le N&B/grain reste la peau d'impression. Rien
  dans le prompt ne tire plus vers le photoréalisme (aucun détail de brique/bitume photographique).
- **[B3] Léger vide transparent à GAUCHE ET À DROITE — corrigé, les deux côtés nommés.** Le rendu
  remplissait le bord droit. « buildings centered with clear night-sky margins so they never touch
  the frame edge » (ambigu sur les côtés) devient **explicitement bilatéral** : *the drawn block
  sits centered with an empty margin of night sky on both the left and right side, never touching
  the left or right frame edge*. La garantie mécanique (padding transparent ≥1/10 côté tooling)
  reste par-dessus le prompt (§0/§2, S13).

Note contrat : `checkLevels` ne pose **ni plafond de mots ni budget de négation** sur les prompts
de niveau (non-vide + phrase magenta du foreground seulement) — le bloc passe le lint mécanique ;
négations = **3** bornées (`not a photograph`, `no vanishing point`, `no glow`), sous le plafond
maison ≤4. Bloc partagé toujours **octet-pour-octet identique** entre A/B/C, un seul tirage seed
`7110`, tronçon-b générique sans Deneux. **Repart au gate prompt lead-art.**
