# Reference hunt — Flyer PHYSICAL OBJECT materiality (NIVEAUX menu)

Hunt run by `graphic-references` (Ray), relayed by the orchestrator, in **ADAPTED
mode**: Bertrand intermittently available this session, so Round 1 (live interview)
was skipped in favor of assumed answers, flagged below for correction. Topic is
strictly the **physical object** — paper stock, cut, tape, wall pile — never the
graphic/typographic content of flyers (already banked,
`docs/art-direction/references/LICENSES.md` §2 and `docs/references/art-culture.md`).

This board feeds `docs/art-direction.md` §2bis.2 "Matérialité du flyer" directly —
it is a **grounding/refinement pass** on an already-implemented spec, not a
from-scratch brief.

## Round 1 — questions I would have asked, and assumed answers (mark for correction)

1. **Scope check** — is this purely the CSS/inline-SVG NIVEAUX flyer-wall treatment
   (§2bis.2), no new generated PNG asset? _Assumed: yes, materiality-only, extends
   the existing spec's toner/cut/tape/shadow ingredients — no new asset family._
2. **Geography flex** — is "Paris 1996–1999 free-party/teknival" a hard anchor, or
   is UK/European free-party material acceptable for **object physics** (paper,
   toner, tape don't vary much by nationality) while graphic/typographic content
   stays French-only? _Assumed: French-first when available, UK/Euro free-party
   acceptable as materiality-only reference, never for type/iconography._
3. **Technique-portability** — is a non-rave xerox/DIY-flyer materiality reference
   (different scene/decade, e.g. NYC 1970s-80s downtown xerox ephemera) admissible
   as a **medium-level** analog, given the house style's own anchor is "generational
   xerox degradation IS the texture" (§1, medium-first) rather than scene-first?
   _Assumed: yes, admissible as technique reference, flagged per-direction as a
   named risk, never presented as the scene's identity anchor._

## Round 2 — propositions

### D1 — The stock itself: fluo copier paper + toner grain

- [Rave Preservation Project archive](https://www.ravepreservationproject.com/) —
  ~1000 digitized flyers; already banked (`LICENSES.md` §2). Re-flagged here for a
  **different read**: most entries are flatbed scans, auto-levelled for legibility —
  useful for colour/stock identification, weak for toner-grain/wear (scanning
  erases exactly what this hunt wants).
- [metek.free.fr — Story 1997/1998](http://metek.free.fr/Story/1997/METEK-1997.htm)
  and [1998](http://metek.free.fr/Story/1998/METEK-1998.htm) — French teknival flyer
  pages, period-exact (1997–1998); same scan-vs-photograph caveat as above, but the
  strongest date/place match found.
- [Gallery 98 — "Xerox and Photocopies" category](https://gallery98.org/category/xerox-ephemera/) —
  dealer inventory of 1970s–80s NYC DIY xerox flyers/zines, hand-lettered,
  cheaply printed; **technique analog, not scene match** (see Round 1 Q3) — useful
  for how black toner sits IN cheap paper fibre rather than on top of it.
- _Why it serves muf:_ grounds §2bis.2 ingredient 1 ("toner grain, not TV snow")
  against real stock — confirms the `multiply`-only, darken-only approach is
  technically correct, and gives clump/streak character to tune the existing
  6–10% opacity budget.
- _Risk:_ **scan-vs-photograph gap** — nearly every accessible online flyer archive
  is a cleaned scan; treat all of D1 as colour/stock reference, not toner-texture
  ground truth, and prefer D2 for the latter.
- _Licence:_ Rave Preservation Project / metek.free.fr — reference pages only, no
  scans to commit (same restriction as `LICENSES.md` §2). Gallery 98 — dealer site,
  images copyrighted per-item, reference/mood only.

**Actionable takeaways:**

- Toner reads **clumpy, not uniform** — lower `feTurbulence` `numOctaves` (fewer,
  bigger clumps) rather than fine even snow; keep the 6–10% opacity budget but
  split it: a fine even speckle layer + an occasional faint (~3–5%) horizontal
  streak band (bad-drum artifact), not one uniform noise pass.
- Confirms `mix-blend-mode: multiply`-only is period-correct: xerox toner sits in
  the fibre and can only darken, never lighten — no change needed, just validated.

### D2 — Photographed (not scanned) ephemera: Seana Gavin's *Spiralled*

- [Seana Gavin — *Spiralled* (IDEA, artist page)](https://www.seanagavin.com/newblog/2020/7/13/spiralled-1) —
  a decade of photography (1993–2003) across UK/European free-party sound systems
  including Spiral Tribe, interspersed with **saved flyers, diary entries and
  ephemera photographed as physical objects**, not re-scanned clean.
- [The Vinyl Factory — coverage of *Spiralled*](https://www.thevinylfactory.com/news/nineties-rave-scene-new-book-seana-gavin-spiralled) —
  secondary write-up confirming the book's ephemera/diary/flyer-object mix.
- [Gallery 98 — "Flyers" category](https://gallery98.org/category/flyers/) —
  photographed dealer-inventory shots of individual worn flyers (corners, creases,
  fold lines visible as physical wear), same technique-analog caveat as D1.
- _Why it serves muf:_ this is the closest match to what §2bis.2 ingredients 2 and
  4 (hand-cut edge, dog-ear, fold crease) are trying to fake in CSS — an actual
  photographed, handled, worn paper object rather than a graphic-design scan.
- _Risk:_ *Spiralled* is a UK/pan-European scene, not Paris-specific (Round 1 Q2)
  — use for **wear/cut/fold physics only**, never for iconography or place-naming.
  It's also a paid photobook, not a freely reproducible archive — study/mood only.
- _Licence:_ copyrighted photobook (IDEA) and dealer-owned photography (Gallery 98)
  — reference/study only, never reproduce or trace a page.

**Actionable takeaways:**

- Cut edges show a **slightly compressed, darker line** where the blade/guillotine
  crushed the fibre — an optional 1px darker edge stroke along the `clip-path`
  outline (distinct from, and in addition to, the tape's own edge treatment) would
  sell this; currently unaddressed in §2bis.2 ingredient 2.
- Worn-corner rounding is **asymmetric per corner** (2–4px varying radius), not a
  uniform corner-radius — confirms the existing "same amplitude budget, different
  vertices" deterministic approach is right; no change needed.
- Creases fan from a **handling point** (often a corner or mid-edge grip), not
  purely diagonal corner-to-corner — the current single diagonal streak
  (§2bis.1) is an acceptable simplification, but if budget allows, an occasional
  mid-edge crease variant would read as more handled than the diagonal-only set.
- Reserve **multiple stacked creases** for a "well-worn" subset only (not every
  flyer) — a fresh vs. weathered contrast within the same wall reads truer than
  uniform wear across all sheets.

### D3 — Tape physics: masking tape / cellotape over saturated stock

- [Indieground — "Glued Paper Textures" (40 hi-res JPGs)](https://indieground.net/product/glued-paper-textures/) —
  photographed (not rendered) posters pasted/taped on real walls while adhesive
  was fresh; useful for wrinkle/translucency behaviour, though this is a
  **wheatpaste glue** technique, not tape — see risk.
- [Abposters — "Ripped Masking Tape" photograph](https://www.abposters.com/ripped-masking-tape-f75472623) —
  a single studio photograph of torn masking-tape strips; useful for the torn-end
  silhouette and matte-vs-gloss read at close range.
- _Why it serves muf:_ directly grounds §2bis.2 ingredient 6 (real scotch, not
  crossed strokes) — confirms the translucency-via-multiply approach and gives a
  concrete torn-end silhouette to base the `clip-path` on.
- _Risk:_ **anachronism via material choice** — most contemporary "tape texture"
  stock leans toward patterned/coloured craft ("washi") tape, a 2010s aesthetic;
  1998 reality is dull beige paper masking tape or clear cellotape only. Flag any
  tape reference that reads patterned or brightly coloured as off-period. Also:
  the Indieground pack is wheatpaste-glue, a different adhesive language than a
  pinned/taped fanzine flyer (intimate, DIY, reversible vs. glued/permanent
  street-poster) — use for wrinkle physics only, not for the adhesive method.
- _Licence:_ both are commercial texture/stock products — reference/mood only,
  do not composite the purchased texture files directly into the game asset.

**Actionable takeaways:**

- Pick **one tape material and hold it system-wide** — matte beige masking tape
  (current spec) — and explicitly reject mixing in a glossy/clear-tape look
  elsewhere; a mixed-material wall reads over-designed rather than found-object.
- Torn ends aren't uniformly serrated along their whole length — the fray
  concentrates at the very tip (1–2px extra jag), with straighter edges along the
  strip's sides; a light irregularity concentrated at the end reads truer than an
  even sawtooth border.
- Wrinkle lines should run **parallel to the pull direction** (perpendicular to
  the tape's length), not diagonal/random — if more than one wrinkle line is used,
  keep them parallel to each other.
- Explicit anachronism flag for the implementer: no patterned/coloured "washi"
  tape, ever — dull beige or clear only.

### D4 — The wall: flyer piles, squat & teknival interiors (place/era anchor)

- [Molly Macindoe — *Out of Order*, Vice profile](https://www.vice.com/en/article/molly-macindoes-out-of-order-rave-photos-659/) —
  400+ photographs of UK/European free parties and squats, 1997–2006; documentary
  interiors likely to show flyer/notice walls in situ (venue and squat spaces).
- [metek.free.fr — Story 1997/1998 pages](http://metek.free.fr/Story/1998/METEK-1998.htm) —
  same French teknival archive as D1, re-flagged here for **place/date anchor**
  rather than stock colour (Paris-adjacent French free-party scene, exact years).
- [Tom Hunter — "The Ghetto" series (1993–94, Hackney squats)](http://www.tomhunter.org/the-ghetto-series/) —
  documentary interiors of squatted houses; **technique/place analog, not Paris**
  (Round 1 Q2/Q3) — useful for how notices/paper accumulate on a lived-in squat
  wall, distinct from a curated gallery flyer-wall shot.
- _Why it serves muf:_ grounds §2bis.2 ingredient 5 ("pinned pile") in a real
  documented wall rather than an abstracted corkboard — density, overlap ratio,
  rotation spread, and light-source consistency.
- _Risk:_ UK-scene bias (Macindoe, Hunter) against the Paris 1996–99 brief — hold
  strictly to **density/overlap/rotation physics**, never let UK flyer graphics or
  venue signage slip into the visual target. metek.free.fr is the one Paris-exact
  anchor among these three; lean on it for place, the UK sources for wall physics
  where French photographic documentation is thin.
- _Licence:_ Macindoe's book and Hunter's series are both copyrighted photography
  — reference/study only, never reproduce. metek.free.fr — reference page only, no
  scan download, matches `LICENSES.md` §2 handling.

**Actionable takeaways:**

- Real flyer walls are **denser than an evenly-spaced grid**: 20–40% overlap
  between neighbours, several sharing a shared corner/tape point — worth checking
  the current pile's overlap ratio against this if the wall still reads too
  gridded.
- Rotation spread in a real pile is **wider than a subtle tilt**: mostly
  small-angle, but with occasional 10–15° outliers — check
  `FLYER_REST_ROTATION_DEG`'s distribution skews toward small tilts with rare
  large ones, rather than a uniform narrow band.
- **One light source for the whole wall** — every contact shadow falls the same
  direction — confirms the current single-angle `box-shadow` approach; do not
  vary shadow angle per flyer even as a "randomization" pass.
- (Stretch, flag as future idea, not current scope) real piles show an occasional
  **torn scrap or bare tape square** where a flyer was ripped down — a rare
  "ghost" mark among the pile would sell wall history, but is new surface area
  beyond §2bis.2's current ingredients — do not build without a separate go-ahead.

## Hand-off

Ready for `lead-art` to curate into the reference library (`docs/references/art-culture.md`
/ `docs/art-direction/references/`) if validated — this board does not self-curate.
`art-advisor` and the implementing dev lane (`dev-r3f-render`, per §2bis.2's CSS/SVG-only
constraint) can consume it directly for the NIVEAUX flyer-wall materiality pass once a
verdict is given per direction.

**Status: awaiting Bertrand's verdict — KEEP / DROP / DIG per direction (D1–D4), plus
correction on the three Round 1 assumed answers above.**
