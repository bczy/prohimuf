# Reference board — near-foreground traffic light (carrefour signal, PROP/SET-DRESSING family)

Hunt run by `graphic-references` (Ray), relayed by the orchestrator. Family = **near-
foreground prop / set dressing** for the side-scroller shooting-gallery world; this board
covers **the single traffic-light mast** only (vehicle head + pedestrian head), replacing
the current code-drawn prop with a reference-conditioned generated asset.

**Status: DRAFT — awaiting Bertrand's KEEP / DROP / DIG per axis.** Not yet curated into
`docs/references/art-culture.md` (that step is `lead-art`'s, post-validation, per
`docs/references/README.md`).

## Hunt context (brief supplied by the orchestrator on Bertrand's behalf)

- **What it's for:** the near-side-kerb traffic-light mast standing in the foreground of
  the carrefour, in the side-scroller shooting-gallery world (camera looks at the street
  from the sidewalk, the roadway runs left↔right across the screen).
- **Era / place:** Paris, 18e, 1998 — pre-LED-slimline French street furniture.
- **The load-bearing constraint (Bertrand, verbatim geometry):** the **vehicle head**
  (feu tricolore, 3 round hooded lenses stacked vertical) faces the roadway (left-right) →
  seen **in profile/edge-on** (the side of the housing, hooded-lens stack foreshortened,
  never the front face of the 3 lenses). The **pedestrian head** (feu piéton, red
  static-man / green walking-man pictograms) is mounted at **90°** to the vehicle head,
  facing the crossing that runs toward the camera → seen **face-on**, pictograms
  readable. One mast, two heads, two different readings — the actual physical geometry
  of a real carrefour viewed from the side.
- **Mood / technique:** crade-documentaire house style (`docs/art-direction.md` §1) —
  photocopied B&W silhouette + toner grain; neon is the accent layer for the _lit_ lenses
  only (§2 law 1, "la loi du glow"), never the housing.
- **Avoid:** modern flat-LED slimline heads (2000s–2020s French retrofit look), non-French
  signal shapes (US traffic-light aesthetic, UK box signals), any named-artist mimicry.
- **Scope guard:** cahier des charges test passed already at brief stage — the carrefour
  and its traffic light are existing set dressing in the current prototype; this hunt is a
  faithful-fidelity regen of an already-scoped prop, not new scope.

## Axis 1 — Period-correct Paris vehicle signal head (casquette, mast, era)

- [Feu Routier — French traffic-signal history archive, `historique_en.html` / `evolution.html` / `srtc_en.html`](http://feu.routier.free.fr/historique_en.html) —
  specialist French amateur-historian site cataloguing French signal-head models
  generation by generation: 1980s Paris experiments (Garbarini "Design 2000", Thery
  Hindrick "Ville Nouvelle", Silec "Astron"), the 1992–94 Champs-Élysées "Feux de
  France" model (Jean-Michel Wilmotte design, Garbarini manufacture: a totem
  integrating a hooded main light + LED repeater + pedestrian signal) and the early-90s
  arrival of LED alongside still-dominant incandescent/fluorescent hooded heads —
  confirms the **hooded ("casquette") 3-lens vertical head is the correct 1998 silhouette**,
  LED-slimline is a 2000s+ retrofit. _Availability note: the site returned intermittent
  503s during this hunt (small personal server) — content above is corroborated by two
  independent search passes; re-verify reachability before an asset build leans on it._
- [Wikipédia FR — Feu de circulation](https://fr.wikipedia.org/wiki/Feu_de_circulation) —
  baseline terminology (feu tricolore, potence, "toujours placé avant le carrefour") and
  confirms the pedestrian head is a distinct, bicolour, pictogram-bearing unit — the
  general reference to check any period-vocabulary claim against.
- [kbrhorse.net — "History of Traffic Signal Visors"](https://www.kbrhorse.net/signals/visors01.html) —
  technical/historical grounding for **why** the hood/visor exists at all: it is a
  directional shield (tunnel visor) that limits the signal's visibility to the traffic
  stream it is built for, not a decorative cap — the exact engineering fact that makes
  "profile read for the vehicle head, face read for the pedestrian head" physically true
  rather than a game convention. US terminology/hardware, but the shielding principle is
  universal and applies to the French casquette equally.
- [Wikimedia Commons — Category:Traffic lights in Paris](https://commons.wikimedia.org/wiki/Category:Traffic_lights_in_Paris) —
  browsable photo corpus for silhouette study. **Anachronism flag:** most indexed files
  are dated 2023–24 and likely show already-retrofitted flat-LED heads; a curation pass
  (art-advisor / lead-art) is needed to pick genuinely older hooded installations
  (still standing on secondary streets) rather than take the category at face value.

_Why it serves muf:_ anchors the housing silhouette (hooded 3-lens stack, simple round
mast) to a documented, dated French lineage instead of a generic "traffic light" stock
image, and explains structurally why the profile view is correct.
_Risk:_ anachronism drift toward the modern flat-LED French retrofit if source photos
aren't pre-filtered by installation age; the specialist archive site's flakiness.
_Licence:_ feu.routier.free.fr and kbrhorse.net are reference/study pages, not asset
sources — describe, never scrape their photos into a prompt or asset. Wikimedia Commons
files are free-licensed per file page — verify the exact licence before any direct
texture use; not needed here since we're building silhouette guidance, not compositing.

## Axis 2 — French feu piéton, face-on

- [Wikipédia FR — Feu de circulation](https://fr.wikipedia.org/wiki/Feu_de_circulation) —
  confirms the pedestrian signal is bicolour and reads via a pedestrian silhouette
  pictogram (standing figure / walking figure), distinguishing it structurally from the
  vehicle head — the textual anchor for "readable bonhomme, face-on."
- [Wikimedia Commons — File:Pedestrian_signal_in_Paris.JPG](https://commons.wikimedia.org/wiki/File:Pedestrian_signal_in_Paris.JPG) —
  a Paris pedestrian-signal head, categorized face-on; usable as a silhouette/proportion
  study for the red-man/green-man box relative to the vehicle head.
- [Wikimedia Commons — Category:Pedestrian signals in Paris](https://commons.wikimedia.org/wiki/Category:Pedestrian_signals_in_Paris) —
  browsable corpus for pictogram shape and box proportions.
- [Alamy — "Pedestrian traffic light" search corpus](https://www.alamy.com/stock-photo/pedestrian-traffic-light.html) —
  commercial stock library, broad corpus of face-on French/European pedestrian heads;
  mood/shape reference only, same licence regime as the Belliard board's Alamy/Getty use.

_Why it serves muf:_ the readable red-man/green-man pictogram is the whole point of the
"face-on" half of the constraint — it must be legible at game size, so the silhouette
needs to be simple and iconic, matching what these sources show.
_Risk:_ the pre-2000s French pictogram is the plain international bonhomme (no local
variant like Germany's Ampelmännchen) — low anachronism risk on the pictogram itself, but
verify the box/housing shape (rounded vs square edges) isn't a later redesign.
_Licence:_ Wikipedia/Commons per above; Alamy is commercial stock, reference/mood only,
never traced or composited directly into a shipped asset.

## Axis 3 — Carrefour geometry: one mast, two heads at 90°

- [Maison de la Sécurité Routière du Doubs — "Fiche 20, Les carrefours à feux"](https://www.msr25.doubs.developpement-durable.gouv.fr/fiche-20-les-carrefours-a-feux-a726.html) —
  the strongest find of this hunt: official regulatory text stating signals (R11v
  vehicle / R12 pedestrian) are placed so that "les signaux ne sont visibles que des
  seuls usagers auxquels ils sont destinés" (each signal is visible only to the traffic
  stream it's built for). This is the **regulatory backbone of Bertrand's geometry
  claim** — the vehicle head is engineered to broadcast down the roadway axis (hence
  profile from the sidewalk) and the pedestrian head down the crossing axis (hence
  face-on from the sidewalk), independently of any single photo.
- [Wikimedia Commons — File:Feux*Tricolores_Piétons_Cyclistes_Rue*Étienne*Marcel*-_Paris_II_(FR75)_-\_2023-05-11_-\_1.jpg](<https://commons.wikimedia.org/wiki/File:Feux_Tricolores_Piétons_Cyclistes_Rue_Étienne_Marcel_-_Paris_II_(FR75)_-_2023-05-11_-_1.jpg>) —
  a real Paris mast carrying a vehicle head, a pedestrian head and a cyclist head
  together — usable purely for the **physical arrangement** (heads stacked/offset at
  different angles on one support), not for housing style (modern LED hardware).
- [kbrhorse.net — visor history (cross-ref from Axis 1)](https://www.kbrhorse.net/signals/visors01.html) —
  reinforces the same "directional visibility" principle from the hardware-design side.
- Getty Images — ["Traffic light pole" search corpus](https://www.gettyimages.com/photos/traffic-light-pole) —
  browsable corpus of full-mast photos (side-view poles, both heads visible); commercial
  stock, mood/geometry reference only.

_Why it serves muf:_ this is the one claim in the brief that most needs sourcing beyond
"trust the art director" — it's now backed by an actual regulatory principle plus a
real photographed mast showing the arrangement, not just an assertion.
_Risk:_ the Étienne-Marcel photo is 2023 hardware (flat LED, cyclist head added) — pull
the _arrangement_, discard the _housing_ from it.
_Licence:_ msr25.doubs.gouv.fr is a public administrative page (reference only, no asset
use needed — it's a textual/regulatory citation); Commons file per its own licence tag;
Getty is commercial stock, mood-only, no redistribution.

## Proposed direction (for regen)

One mast, one clean round pole, near-side kerb, in the crade-documentaire B&W silhouette
register: an **unlit black housing** — a hooded 3-lens vertical box (casquette-style,
pre-LED-slimline, per Axis 1) mounted mid-height facing the roadway and seen **strictly
in profile** (the side of the box, the stacked hood shadows read as a foreshortened
silhouette, no lens faces visible) — with a **second, smaller box mounted at 90° lower
on the same pole**, facing the crossing and seen **face-on**, carrying the red-man /
green-man pictogram pair (Axis 2) at a size that stays legible at game scale. The
housing is drawn pure B&W per the vehicle-set precedent (ADR 0011): no baked neon.

**Note for `concept-artist` (not a web reference, an authoring note):** the colour cycle
(rouge/orange/vert) is the one thing that _does_ animate on this prop, and unlike the
vehicle set's silhouette-only neon rim, here the "light" is diegetic — an actual lit
lens on the housing, not an ambient glow. Two ways to author it, worth deciding before
the prompt is written: (a) generate the housing once, unlit, pure B&W, and add each lit
lens as a tiny separate render-side emissive dot per §2 law 1 (matches the vehicle-set
render-side-rim precedent, cheapest to keep in sync with game state); or (b) bake 3
frame variants (red-lit / orange-lit / green-lit) as a flipbook, closer to the enemy
flipbook pattern (§4.1) but tripling the asset count for a background prop. (a) is
probably the better fit for a **profile-view** housing since the lit lens is a small
foreshortened ellipse of colour on the edge of the box, easy to place render-side; the
face-on pedestrian head's red-man/green-man swap is a two-state toggle either way and
cheap as (b) regardless of the vehicle-head decision.

## Hand-off

Ready for `lead-art` to curate into the reference library
(`docs/references/art-culture.md` / `docs/art-direction/references/`) once Bertrand
returns a KEEP/DROP/DIG per axis — this board is not self-curating. `art-advisor` should
confirm the period-casquette silhouette isn't drifting anachronistic before `concept-artist`
writes the prompt.
