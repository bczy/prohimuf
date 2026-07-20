# Reference board — near-foreground street sign (plaque/panneau sur poteau, PROP/SET-DRESSING family)

Hunt run by `graphic-references` (Ray), **relayed** by the orchestrator — Bertrand is away,
so this hunt skipped the interview and verdict rounds (no round-1 questions, no per-axis
KEEP/DROP round) and goes straight from brief to board, exactly like
`board-traffic-light.md`'s precedent for a relayed hunt.

**Status: PROPOSED — relayed hunt, awaiting Bertrand's KEEP/DROP verdict.** Not yet curated
into `docs/references/art-culture.md` (that step is `lead-art`'s, post-validation, per
`docs/references/README.md`).

## Hunt context (brief, standing in for the interview round)

- **What it's for:** `streetSign`, one of the 8 `NearForegroundKind` road props
  (`src/render/scene/nearForegroundArt.ts`) — the near-side-kerb plaque-on-post standing
  in the foreground of the side-scroller shooting-gallery world.
- **Era / place:** Paris, 18e, 1998.
- **Camera / register:** strict side view from the kerb (house side-scroller camera,
  `Flat 2D video game sprite, strict side-view orthographic projection`), grey/B&W
  silhouette per `docs/art-direction.md` §2 law 3 and §1 identity (C1 — décor is grey, no
  baked neon on this prop).
- **What this hunt must VERIFY or CONTRADICT:** the claims already logged by `art-advisor`
  in `docs/art/references-road-props.md` §7 (1844 Rambuteau enamel plaque genealogy, blue
  field + white caps + double green filet, landscape ~2:1 proportion, and the "almost
  always wall-mounted" cultural caveat) — see the Claims audit below.
- **What this hunt must NOT relitigate:** the gate-final `[S8] streetSign` prompt in
  `docs/art/prompts-road-props.md` already carries two DECIDED calls from the `lead-art`
  PROMPT GATE (Nico, 2026-07-19): (1) **keep the post-mounted version** — placement is
  fixed to the kerb by the `NearForeground` render layer, there is no facade to mount a
  wall plaque to; (2) **soften the historical double-filet border to one bold single
  keyline** — a legibility call for mono downscale at game size, not a factual dispute.
  This board works within those two decisions.
- **Avoid:** the US green double-post crossing-sign silhouette (geographically wrong for
  Paris); any Decaux-era digital/LED info screen (anachronistic for 1998); named-artist
  mimicry; anything that would push the plate toward reading as a French round/triangle/
  lozenge regulatory sign (those shapes are reserved by the highway code for a different
  sign class).

## Axis 1 — The Paris street-name plaque lineage (Rambuteau 1844, enamel, colour, border)

- [Le Tribunal du Net — "Pourquoi les plaques de rue françaises sont bleues"](https://www.letribunaldunet.fr/insolite/pourquoi-plaques-rue-bleues-france-origine-histoire.html) —
  confirms the 1844 Rambuteau prescription (préfet de la Seine): enamelled Volvic-lava
  plates, **white capital letters on a blue field, green liseré border**; also gives the
  functional meaning of the green trim — it distinguishes public streets (green filet)
  from private ways (a rarer blue-on-blue variant), a nuance not in the current
  art-advisor doc but consistent with it.
- [Plaque-émaillée.fr — "Plaque de rue : histoire, styles et choix"](https://www.plaque-emaillee.fr/blog/numeros-de-rue/plaque-de-rue-histoire-styles-et-choix) —
  corroborates the same 1844 origin/palette and adds the load-bearing structural
  distinction for this hunt: **"plaque de rue" (thin, wall-only) vs "panneau de rue"
  (signage-panel thickness, rounded corners, pole-mountable)** — French vocabulary treats
  the wall plate and the post-mounted panel as two different objects, not one object in
  two mounting modes. See Axis 2 / Claims audit for why this matters for `[S8]`.
- [French Moments — "The iconic Street-Name Plaques of Paris"](https://frenchmoments.eu/street-name-plaques-of-paris/) —
  gives the finer-grained material history: iron plates, white-on-black from 1823 → blue
  field from 1844 (Rambuteau) → **enamelled porcelain refinement in 1847**; explicitly
  states Paris plaques are building-mounted at street corners, "rather than pole-mounted
  in open corners."
- [Wikipédia FR — Plaque de rue](https://fr.wikipedia.org/wiki/Plaque_de_rue) —
  the general reference already cited in `references-road-props.md`; kept here as the
  cross-check anchor for the 1844/blue/green-filet claim.
- [Wikimedia Commons — File:Plaque-rue-de-Bourgogne(Paris).jpg](<https://commons.wikimedia.org/wiki/File:Plaque-rue-de-Bourgogne(Paris).jpg>),
  [File:Plaques rue de Belleville, Paris 20e 2.jpg](https://commons.wikimedia.org/wiki/File:Plaques_rue_de_Belleville,_Paris_20e_2.jpg),
  [File:Plaque de nom de rue Paris 21e siècle.JPG](https://commons.wikimedia.org/wiki/File:Plaque_de_nom_de_rue_Paris_21e_si%C3%A8cle.JPG) —
  browsable photo corpus for proportion/border study; all three shown wall-mounted, which
  is the documentary norm, useful as a silhouette/border reference even though this hunt
  works within the post-mounted decision.

_Why it serves muf:_ anchors the plate's silhouette (landscape rectangle, thin flat plane,
bordered edge) and colour-era correctness (moot in B&W but confirms a genuinely
period-correct object, not an invented one) to a well-documented, dated French lineage.
_Risk:_ over-literal colour language leaking into the prompt (none present in the current
`[S8]` string — it stays silhouette-only, correctly).
_Licence:_ Le Tribunal du Net / Plaque-émaillée.fr / French Moments are commercial/editorial
reference pages — describe, never scrape their photos into a prompt. Wikimedia Commons
files are free-licensed per file page; verify the exact tag before any direct texture use
(not needed here — silhouette guidance only).

## Axis 2 — What actually stood post-mounted on a 1998 Paris kerb

- [La Mémoire de la Signalisation — JCDecaux](https://www.memoire-signalisation.fr/jcdecaux.html) —
  specialist French street-furniture historian archive; catalogues JCDecaux's directional/
  information panels: **aluminium boxes (caissons), 150–270 mm thick, arrow or rectangular,
  single- or double-sided, back-lit by fluorescent tubes or covered in retroreflective
  film, fixed on a single "mât traversant" (through-post) that lets the box rotate 360°**
  — the first range on this mounting system, since widely copied. This is the honest
  period reference for "a panel on a single post at a Paris kerb in 1998": a boxy
  aluminium caisson, not a thin flat plate.
- [Wikipédia FR — Panneau de signalisation routière en France](https://fr.wikipedia.org/wiki/Panneau_de_signalisation_routi%C3%A8re_en_France) —
  confirms the code-de-la-route shape grammar: triangle = danger, round = obligation/
  interdiction, **rectangle = "indique une localisation"** (location/place identification)
  — the rectangle is not just "not forbidden," it is the semantically correct shape family
  for a place-name plate, reinforcing `references-road-props.md` §7 trait 1.
- [Wikimedia Commons — Category:Directional road signs in France](https://commons.wikimedia.org/wiki/Category:Directional_road_signs_in_France) /
  [Category:Road signs in France](https://commons.wikimedia.org/wiki/Category:Road_signs_in_France) —
  browsable corpora for panel/post proportion study (post thinner than panel, splayed
  foot); same anachronism-flag discipline as the traffic-light board applies — pre-filter
  for period hardware, not recent retrofits.

_Why it serves muf:_ answers the brief's core question honestly — a French street-level
post-mounted panel in 1998 is real and well documented, it just isn't technically the same
object as the wall "plaque de rue" (Axis 1). This gives `lead-art`'s already-decided
post-mount call solid period grounding rather than leaving it as an assumption.
_Risk:_ the JCDecaux caisson reference is for _directional/information_ panels, not
street-_name_ identification specifically — City of Paris street-name plates are a
different administrative object (DEVE-installed enamel, near-exclusively wall) from
JCDecaux's advertising/directional street furniture; conflating the two would be a category
error. The board treats the JCDecaux hardware as evidence for "what a boxy post-mounted
panel looked like," not as evidence that street names were ever issued this way.
_Licence:_ memoire-signalisation.fr is a specialist reference/study site (describe only,
no scraping); Wikipédia FR and Wikimedia Commons per their standard licence regimes.

## Axis 3 — Anachronism traps

- [Wikipedia — Street name sign](https://en.wikipedia.org/wiki/Street_name_sign) —
  confirms the US convention explicitly: **green rectangular plates, white lettering,
  mounted "especially in the United States, in perpendicularly oriented pairs" on a
  double post at intersections** — this is precisely the silhouette
  `references-road-props.md` §7 and the gate-final `[S8]` prompt both bar ("never the US
  double-post crossing sign"). Confirms the trap is correctly identified and correctly
  excluded (`[S8]`'s "one slender post... never... a boxy double-sided sign" already reads
  as anti-US-sign language).
- [La Mémoire de la Signalisation — JCDecaux (cross-ref from Axis 2)](https://www.memoire-signalisation.fr/jcdecaux.html) —
  notes JCDecaux's variable-message panels (PMV) used **retroreflective/retrodiffusing
  pellets**, not electronic displays, and were only "modernised... from the 2010s onward"
  with LED — hard confirmation that no digital/LED street info screen existed on this
  class of furniture in 1998. Directly backs the existing "no Decaux digital screen"
  trap in `references-road-props.md` §7 with a dated source.
- [Wikipédia FR — Panneau de signalisation routière en France (cross-ref from Axis 2)](https://fr.wikipedia.org/wiki/Panneau_de_signalisation_routi%C3%A8re_en_France) —
  the round/triangle/lozenge shape family is reserved for regulatory signage by the code
  de la route; a landscape rectangle for a place/street plate cannot be mistaken for that
  family, confirming trait 1's shape logic from the opposite direction.

_Why it serves muf:_ every trap already named in `references-road-props.md` §7 and encoded
in the gate-final `[S8]` prompt is now backed by a dated, named source instead of standing
on assumption alone.
_Risk:_ none identified beyond the general anachronism-drift risk already flagged (source
photo corpora skewing toward recent, already-retrofitted installations — mitigated by
sourcing the _shape grammar_ and _hardware generation_, not undated photos, for this axis).
_Licence:_ Wikipedia English/French per standard licence; memoire-signalisation.fr
reference-only.

## Claims audit — `docs/art/references-road-props.md` §7

| Claim (art-advisor, §7)                                                                               | Verdict                                                                                                                                                                                                                                                                                                                                                                  | Source                                                               |
| ----------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | -------------------------------------------------------------------- |
| 1844 Rambuteau prescription, blue field, white capital letters                                        | **VERIFIED**                                                                                                                                                                                                                                                                                                                                                             | Le Tribunal du Net, Plaque-émaillée.fr, French Moments, Wikipédia FR |
| Double green filet border ("double filet vert")                                                       | **VERIFIED** — with a material nuance: the enamelled-porcelain refinement (vs raw enamelled lava) dates to 1847, three years after the 1844 blue-field decree; doesn't contradict the claim, just dates the material more precisely                                                                                                                                      | French Moments                                                       |
| Landscape plate, ratio ~2:1 or more                                                                   | **UNSUPPORTED** — every source confirms "landscape rectangle, wider than tall" qualitatively; none states a numeric ~2:1 ratio. Not contradicted, just not independently sourced. No action needed: the gate-final `[S8]` prompt already uses qualitative language ("clearly wider than tall") rather than a numeric ratio, so this gap doesn't touch the shipped prompt | —                                                                    |
| Fine double-liséré = real silhouette trait, even in grey                                              | **VERIFIED** as a historical fact; already correctly overridden for production reasons — see Prompt delta check below                                                                                                                                                                                                                                                    | Le Tribunal du Net, Plaque-émaillée.fr                               |
| Almost-always wall-mounted; post-mount is a minority/corner case                                      | **VERIFIED, and sharper than stated** — French Moments states Paris plaques are building-mounted "rather than pole-mounted in open corners"; Plaque-émaillée.fr goes further and treats **"plaque de rue" (wall) and "panneau de rue" (post, signage-panel thickness) as two distinct object classes**, not one object in two mounting modes. See Prompt delta check     | French Moments, Plaque-émaillée.fr                                   |
| Piège: US double-post crossing sign to bannir                                                         | **VERIFIED**                                                                                                                                                                                                                                                                                                                                                             | Wikipedia — Street name sign                                         |
| Piège: Decaux digital screen (2010s+) to avoid                                                        | **VERIFIED, dated** — LED modernisation explicitly dated "from the 2010s"                                                                                                                                                                                                                                                                                                | La Mémoire de la Signalisation — JCDecaux                            |
| Round/triangle/lozenge shapes reserved for regulatory signs (so rectangle is the safe/correct choice) | **VERIFIED, and semantically stronger than stated** — rectangle isn't merely "not forbidden," code de la route defines it as the shape for location/place identification                                                                                                                                                                                                 | Wikipédia FR — Panneau de signalisation routière en France           |

No claim from §7 came back **CONTRADICTED**.

## Prompt delta check — gate-final `[S8]` (`docs/art/prompts-road-props.md`)

**No mandatory delta — the gate-final `[S8]` prompt is consistent with these references.**
Both open items already decided at the `lead-art` PROMPT GATE (post-mount kept; double
filet softened to a bold single keyline) are corroborated, not contradicted, by this hunt:
the post-mount is period-plausible once read as a boxy information/directional panel
rather than a literal wall "plaque" (Axis 2), and the single-keyline softening trades a
now-confirmed _historical_ detail for a _production_ necessity (mono downscale legibility)
that the prompt-gate log already reasoned through explicitly.

One **non-blocking observation**, flagged for awareness, not a required edit: Axis 1/2
surface that a genuine post-mounted French panel in this class ("panneau de rue" / JCDecaux
directional caisson) is described in sources as a **boxy aluminium panel with real
thickness** (150–270 mm), whereas the current `[S8]` subject string explicitly asks for
"a single flat plane, not a boxy double-sided sign." This is a deliberate and defensible
choice, not an error: (a) the strict side-view orthographic camera means panel thickness
barely reads regardless, (b) the house silhouette-first law (`docs/art-direction.md` §2
law 3) and the `game-graphist` preprod pass both push toward the simplest legible shape at
game scale, and (c) `lead-art` already weighed realism against legibility once for this
exact prop. Surfacing it here only so Bertrand has the option to ask for a touch of
"boxy panel" thickness language if he wants the post-mount read as more legibly a real
info-panel object — not a recommendation, not an action item.

## Hand-off

Ready for `lead-art` to curate into the reference library
(`docs/references/art-culture.md` / `docs/art-direction/references/`) once Bertrand
returns a KEEP/DROP/DIG per axis — this board is not self-curating. Because this was a
relayed hunt (no interview, no interim verdict rounds), Bertrand's return pass should
cover both the axis verdicts and a read of the Claims audit / Prompt delta check above;
if he flags the boxy-panel observation as worth acting on, that becomes a small, scoped
follow-up edit to `[S8]` for `concept-artist`, not a re-open of the post-mount decision
itself. `art-advisor` should confirm the "plaque" vs "panneau" vocabulary nuance doesn't
need to migrate into `references-road-props.md` §7 before `concept-artist`/`game-graphist`
next touch this prop.
