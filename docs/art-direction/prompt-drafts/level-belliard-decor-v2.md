# Prompt drafts — Rue Belliard décor **v2** (three validated axes)

Craft rules per [`flux-prompt`](../../../.claude/skills/flux-prompt/SKILL.md); nothing
reaches `levelArt.json` without the `lead-art` PROMPT GATE.

Consumes the two VALIDATED boards (do not reopen them):
[`board-belliard-decor.md`](../references/boards/board-belliard-decor.md) (D1–D5,
crade-documentaire) and
[`board-belliard-decor-v2.md`](../references/boards/board-belliard-decor-v2.md) (the
three axes + Bertrand's nuances, 2026-07-18). Style spine = the register the **7 accepted
facades** already shipped (kept verbatim below).

---

## 0. Composition strategy — DECISION: **per-tronçon** (not per-single-building)

**Recommendation:** regenerate the row as **3 distinct wide _tronçon_ images** — each 2–3
faubourg buildings + the gaps between them, tiled gap-to-gap — instead of per-single-building
cutouts assembled on a road band.

**One-line rationale:** axes 2 (gaps between buildings) and 3 (both-side street cross-section)
are relationships that live **between and around** buildings, not inside one — FLUX must
compose the sky-sliver / mur-pignon / narrow passage and the continuous kerb+trottoir line
*within a single frame*; butting single-building cutouts can only fake those relationships and
produces the hard-seam, wide-isolated-gap look Bertrand is moving away from.

**How they tile.** Each tronçon **begins and ends on a thin sky-sliver gap** between buildings,
so the panel seam is always a gap (never a cut mid-facade) — it rides the existing
`facadeLayout.ts` `BLEND = 0.08` seam-crossfade cleanly, and every join reads as one more
axis-2 gap. Generate **3 different** tronçons (2 buildings / 3 buildings + mur-pignon / narrow
passage) and shuffle them so the street reads **irregular**, not a repeating module (board
axis-2 risk).

**Cross-section split (axis 3).** Bake **only the far-side trottoir + granite kerb** into each
tronçon — the buildings visibly *stand on a pavement band*, which is unambiguous as flat-frontal
elevation, supports the existing `nearForeground` "far" prop row (bollard/bench/Wallace), and
keeps the FLUX load per image sane. The **chaussée + near-side trottoir** stay the
`street`/foreground layers' job; §4 gives the companion `street`-layer tweak that adds the
near-side trottoir band the current bitumen-only prompt lacks. Full-cross-section-in-one-image
was considered and rejected (§5): it overloads FLUX-schnell and duplicates the existing road
layer.

> **Baked sky in the slivers.** The tronçon is a full-bleed opaque image (like the current
> `facade.png`; only the `foreground` layer chroma-keys). The gaps therefore carry **baked dark
> night sky** in the sliver, value-matched to the `sky` layer that shows above the rooflines —
> not transparency. Flagged so `lead-art` judges the sliver as painted sky.

**Seeds & size guidance** (Pollinations flux, 1024-tall working res, variable width):

| Tronçon | Buildings | Gap beat | Suggested size (W×H) | Pinned seed |
| ------- | --------- | -------- | -------------------- | ----------- |
| A | 2 | one thin sky sliver | `1536×1024` (~3:2) | `7101` |
| B | 3 | one bare **mur-pignon** gable + slivers | `1920×1024` (~15:8) | `7102` |
| C | 2–3 | one narrow **passage** alley + slivers | `1792×1024` (~7:4) | `7103` |

- **Pin the seed per image** (bible §3.10). `gen-level-art.mjs` currently picks a *random*
  seed (`Math.floor(Math.random()*99999)`) — same reroll hazard the `street` layer hit
  (seed 6601 PIN). These décor tronçons MUST be generated on the pinned seeds above and the
  winners committed; re-roll a seed **only** if the composition (gap rhythm, taper falloff) is
  wrong, never for a small tweak.
- Height fixed at **1024**; width varies with building count so the world shows the art at
  native proportions (`world.heightUnits = 12`, facade plane width derived from image aspect).
  The bottom **~20–25 %** of the height is the baked far-trottoir + kerb band; the upper ~75 %
  is buildings + sky slivers.

**Generation path — flux text-to-image, NOT the stock `gen-level-art.mjs` facade path.**
Two clauses in that script are off-register for this family and must be bypassed by
`dev-tooling-assets`:

1. the manifest shared `style` (`"16-bit pixel art…"`) — contradicts the crade-documentaire
   register; these prompts carry their **own** self-contained style block (§1) and must be sent
   **without** the pixel-art suffix.
2. the hard-coded facade `continuity` suffix (`"one section of a single long continuous
   parisian haussmann terrace… the left and right edges continue seamlessly into the
   neighbouring buildings"`) — that forces a **fused mitoyen wall**, the direct opposite of
   axis 2. Must **not** be appended for this family.

**kontext vs flux.** PRIMARY = **flux text-to-image** with the §1 style block (the composition
is new — gaps + baked trottoir must compose freely; conditioning on the old single-building
`facade.png`, which has neither, would fight the new layout). FALLBACK = **kontext style-lock**
(§3.12) off **one lead-art-nominated accepted crade-documentaire facade PNG** — used ONLY to
re-anchor line weight / toner / muted palette if the text-only rolls drift off the validated
register, never for layout. Do not kontext off `facade.png` for layout.

---

## 1. Base style block (shared, verbatim — the validated spine)

Appended verbatim to every tronçon subject (family consistency, bible §2 law 2 — the 3
tronçons are one printing run). Self-contained; does **not** rely on the manifest `style`.

```
, rendered as a bold flat two-dimensional graphic-novel comic-book illustration, thick black ink outlines, cel-shaded flat posterized tones, muted desaturated palette, deep night, grimy weathered dirty stained walls with soot marks water streaks peeling render and hairline cracks, grey zinc mansard roofs, flat frontal orthographic elevation seen perfectly straight on with no perspective, painterly cartoon register, high-contrast fanzine grain
```

Per-clause rationale:

- `bold flat two-dimensional graphic-novel comic-book illustration` → the proven register of
  the 7 accepted facades; positively states the non-photoreal medium (bible §3.1 — no "not
  photoreal" negation needed).
- `thick black ink outlines, cel-shaded flat posterized tones, muted desaturated palette` →
  the exact cel-shade / posterize / muted look Bertrand validated; keeps it painterly-cartoon,
  not photoreal.
- `deep night` + `grimy weathered dirty stained walls with soot marks water streaks peeling
  render and hairline cracks` → the D1 crade-documentaire texture ceiling (soot/water/peel/crack)
  — dirty/real, the register these boards live in.
- `grey zinc mansard roofs` → period-true Paris faubourg roofline (D4 ordinary 18e fabric).
- `flat frontal orthographic elevation seen perfectly straight on with no perspective` →
  Prohibition "poster, not a diorama" geometry (bible §1/§5); the sole negation ("no
  perspective"), within the ≤2 budget.
- `painterly cartoon register, high-contrast fanzine grain` → locks the fanzine/xerox medium
  (house §1) so the PNG ships pure crade ink — décor never glows (lead-art guardrail, §2 law 1).

> **Optional gate-hardening (lead-art's call).** To force the 3 tronçons to read as one
> printing run, a shared hex anchor can be added to the block — e.g. `muted desaturated
> palette of cool greys around #3A3E44`, and `worn granite-kerbed stone trottoir in dirty
> pale grey #6B6E72` in the subjects. Offered, not baked: the accepted facades passed without
> hex, and adding it is one variable to change deliberately, not silently.

---

## 2. Per-tronçon subject prompts (subject + silhouette; style block from §1 appended)

Front-loads `flat frontal night elevation of…` so the poster geometry lands in the
highest-attention tokens (bible §3.2), even though the medium also lives in the §1 tail.

### Tronçon A — two buildings, one thin sliver (seed `7101`)

```
flat frontal night elevation of two distinct ordinary Paris 18e faubourg apartment buildings of different widths and storey-heights standing close together, separated by one thin vertical sliver of dark night sky, four to five storeys each, the clean upper floors carrying regular rows of tall shuttered french windows with plain wrought-iron railings, the ground floor and its metal roll-down shop shutters densely layered with hand-painted graffiti tags throw-ups stickers stencils and a couple of stapled photocopied flyers, the tags rarefying fast with height so the upper floors and roofs stay clean, the buildings standing on a worn granite-kerbed stone trottoir, the image beginning and ending on a thin sky-sliver gap
```

### Tronçon B — three buildings, one bare mur-pignon (seed `7102`)

```
flat frontal night elevation of three distinct ordinary Paris 18e faubourg apartment buildings of different widths and storey-heights in a tight irregular row, two of them separated by a thin sky sliver and one slightly wider gap revealing a bare untreated masonry mur-pignon gable end wall with no windows, the clean upper floors carrying regular rows of tall shuttered french windows with plain wrought-iron railings, the ground floor and its metal roll-down shop shutters densely layered with hand-painted graffiti tags throw-ups stickers stencils and stapled photocopied flyers, the tags rarefying fast with height so the upper floors and roofs stay clean, the buildings standing on a worn granite-kerbed stone trottoir, the image beginning and ending on a thin sky-sliver gap
```

### Tronçon C — two–three buildings, one narrow passage (seed `7103`)

```
flat frontal night elevation of a tight row of ordinary Paris 18e faubourg apartment buildings of different widths and storey-heights, separated by thin slivers of dark sky and one narrow shadowed passage alley running back between two of them, the clean upper floors carrying regular rows of tall shuttered french windows with plain wrought-iron railings, the ground floor and its metal roll-down shop shutters densely layered with hand-painted graffiti tags throw-ups stickers stencils and stapled photocopied flyers, the tags rarefying fast with height so the upper floors and roofs stay clean, the buildings standing on a worn granite-kerbed stone trottoir, the image beginning and ending on a thin sky-sliver gap
```

Per-clause rationale (shared across A/B/C; deltas noted):

- `two/three distinct ordinary Paris 18e faubourg apartment buildings of different widths and
  storey-heights standing close together` → **axis 2**: distinct volumes set tight, ordinary
  18e fabric (D4), varied so the row reads irregular, not a Haussmann cornice line.
- `separated by one thin vertical sliver of dark night sky` (A/C) · `one slightly wider gap
  revealing a bare untreated masonry mur-pignon gable end wall with no windows` (B) · `one
  narrow shadowed passage alley running back between two of them` (C) → **axis 2** gap beats,
  each grounded in a real faubourg form (sliver / mur-pignon / passage) so the three tronçons
  differ; B's gable is the "residual wall" beat (board axis-2 refs).
- `the clean upper floors carrying regular rows of tall shuttered french windows with plain
  wrought-iron railings` → **axis 1 taper (top)**: upper facade stays clean so architecture
  reads; keeps the period french-window rhythm and demoted-to-plain ironwork (ordinary 18e, no
  Deneux likeness).
- `the ground floor and its metal roll-down shop shutters densely layered with hand-painted
  graffiti tags throw-ups stickers stencils and a couple of stapled photocopied flyers` →
  **axis 1 (bottom band)**: D1 competition-wall density concentrated at street/shutter level
  (Petite-Ceinture/Stalingrad register), the on-façade free-party tell as print.
- `the tags rarefying fast with height so the upper floors and roofs stay clean` → **axis 1's
  critical nuance**: density falls off fast with height, essentially none up top — the
  street-level band, *not* a full-facade wash (Bertrand's explicit "do not overload").
- `the buildings standing on a worn granite-kerbed stone trottoir` → **axis 3 (far side)**:
  buildings sit on a pavement band with a granite kerb, worn D1 palette; the near-side trottoir
  + chaussée come from the `street` layer (§4).
- `the image beginning and ending on a thin sky-sliver gap` → the **tiling contract**: every
  panel seam is a gap, so tronçons shuffle/tile gap-to-gap without a mid-facade cut.

Negation count (assembled = subject + §1 block): A/C = 1 (`no perspective`), B = 2
(`no perspective`, `no windows`) — within the ≤2 budget. `checkLevels` imposes no word ceiling
on level prompts, but these run long by necessity (multi-building scene); the real gate is
**in-scene validation at the play camera** (screenshot), since gap width and taper falloff are
composition calls FLUX only approximates (board axis-2 risk).

---

## 3. `sky` layer — unchanged

The `sky` layer (`"parisian night sky with stars and distant haussmann rooftops silhouette,
full moon haze"`) is untouched: it still reads above the tronçon rooflines. Confirm the baked
sliver-sky value (§0) matches it at the composite gate.

---

## 4. Companion `street`-layer tweak — add the near-side trottoir (axis 3, near side)

The far-side trottoir is baked into the tronçon (§2); the **near-side** trottoir belongs to the
`street` layer, whose current prompt
([`level-street.md`](level-street.md), committed seed 6601) is **bitumen + zebra crossing only**
— no sidewalk. Axis 3 wants a near-side pavement band added at the foreground edge, kept
**narrower than the roadway** so it doesn't read as a second lane.

Proposed single-clause addition to the committed `street` prompt (one variable — the marking
and overhead-road spine stay verbatim; seed re-pin required after the change):

```
… flat level ground plane, no horizon, a narrow worn granite-kerbed stone pavement strip running along the bottom foreground edge, clearly narrower than the roadway above it
```

Rationale: `narrow … pavement strip along the bottom foreground edge` gives the near-side
trottoir; `clearly narrower than the roadway above it` is the load-bearing clause that stops it
reading as a second lane (board axis-3 risk). This is a **separate iteration** on `level-street.md`
— flagged here for continuity, to be gated + seed-re-pinned in that draft, not folded silently.

---

## 5. Rejected variants

- **Per-single-building cutouts (the current pass) — REJECTED for the regen.** Cannot render
  the axis-2 relationships (sliver / mur-pignon / passage) or a continuous kerb+trottoir line
  between buildings; produces the wide-isolated-gap + hard-seam look Bertrand is leaving.
- **Full both-side cross-section baked into the tronçon — REJECTED (leaning).** Asking
  FLUX-schnell for multiple buildings + taper + gaps + a 5-band road cross-section in one
  flat-frontal frame overloads it and muddles the road bands; it also duplicates the existing
  `street`/foreground layers. Split instead: far trottoir in the tronçon, near trottoir on the
  `street` layer (§0, §4). *Reversible if lead-art prefers one baked image — then the `street`
  layer's main-view role is retired (a world-space call for `dev-r3f-render`).*
- **kontext off the old single-building `facade.png` for layout — REJECTED.** It carries no
  gaps and no trottoir; kontext would replicate its single-building layout and fight the new
  composition. Kontext is reserved as a **style-lock fallback** off an accepted facade (§0).
- **Reusing `gen-level-art.mjs`'s facade path as-is — REJECTED.** Its manifest `style`
  (pixel-art) and `continuity` suffix (fused terrace) contradict the register and axis 2 (§0).

---

## 6. Open questions for `lead-art` / `dev-r3f-render` (flagged, not resolved here)

These sit outside prompt authorship (structure/sizes/world-space belong to
`dev-tooling-assets` / `dev-r3f-render`); I'm noting them so nothing ships on a silent
assumption:

1. **World-space footprint.** Baking a far-trottoir band + gaps shifts the building ground line
   and changes each tronçon's derived facade-plane width — a layout call for `facadeLayout.ts` /
   `LevelBackdrop` + lead-art. The tronçons tile at variable widths, unlike the single fixed
   panel today.
2. **Window-alignment harness (ADR-0028) / `windowGrid` / enemy pop slots** are tuned to the
   single tileable 7-window `facade.png`. Distinct varied buildings per tronçon retire the fixed
   "exactly 7 identical windows per floor" spine — window zones must be **re-derived from the new
   art** (`gen-window-zones.mjs` snaps to art per the `windowGrid` `$comment`). A
   `dev-tooling-assets` / harness follow-up, not a prompt clause.
3. **QTE `street` reconciliation.** The ×2.4 hostage-QTE zoom currently reads the overhead
   `street` patch; with a baked far-trottoir + a near-trottoir on the `street` layer, confirm the
   QTE band still reads as a real cross-section (lead-art / `dev-r3f-render`).

---

## 7. Hand-off

`node scripts/check-art-prompts.mjs --set levels` → PASS (level prompts are lint-checked for
non-emptiness only; craft is lead-art's gate). Once landed in `levelArt.json` by
`dev-tooling-assets`, re-run the full lint. **Nothing generates before the `lead-art` PROMPT
GATE PASS**, then in-scene validation at the play camera (screenshot) per the axis-2 gap-width /
axis-1 taper risks.
