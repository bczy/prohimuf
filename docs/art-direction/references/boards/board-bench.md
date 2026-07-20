# Reference board — near-foreground bench (banc Davioud, PROP/SET-DRESSING family)

Hunt run by `graphic-references` (Ray), **relayed hunt — Bertrand away**. No interview,
no interim verdict rounds: this board is produced ready for his KEEP/DROP verdict per the
relayed precedent set by `board-traffic-light.md`. Family = **near-foreground prop / set
dressing**; this board covers the `bench` `NearForegroundKind` only (the Davioud public
bench, `src/render/scene/nearForegroundArt.ts`).

**Status: PROPOSED — relayed hunt, awaiting Bertrand's KEEP/DROP verdict.**

Not yet curated into `docs/references/art-culture.md` (that step is `lead-art`'s,
post-validation, per `docs/references/README.md`).

## Hunt context (brief inferred from the existing gate artefacts, no live interview)

- **What it's for:** the near-side-kerb public bench standing in the foreground of the
  street scene, in the side-scroller shooting-gallery world — same layer/camera as the
  traffic light, lamppost, Wallace fountain, parking meter, bollard, scooter and street
  sign (ADR-0047/0049).
- **Era / place:** Paris, 18e, 1998.
- **Camera:** strict side view from the kerb (`opening`: "strict side-view orthographic
  projection"), widest aspect in the whole prop set (1.7, 870×512) — the bench reads as a
  long low horizontal silhouette.
- **Style:** crade-documentaire house style, pure grey/B&W silhouette (`docs/art-
direction.md` §1–§2, law C1) — no neon, no colour, this prop carries no glow exception.
- **Existing claims to verify/contradict:** `docs/art/references-road-props.md` §6 (art-
  advisor, 2026-07-19) — Davioud 1860s / 8,428 bancs by 1869, slats + ornate cast-iron end
  frames, reclined back, no anti-SDF dividers in 1998.
- **Existing gate-final prompt to check clause-by-clause:** `docs/art/prompts-road-
props.md` [S7] bench, PASS 2026-07-19 (seed 6107) — including the flush-slats keying
  rewrite and the "three or four slats" readability cap (a deliberate production
  simplification for ~60–90 px legibility, not a claimed reference error — assessed below
  on its own terms).
- **Avoid:** the 2000s+ prefab concrete "banc à la parisienne" (solid blocks, no slats),
  post-mid-2000s anti-SDF armrest dividers, US A-frame picnic bench.
- **Scope guard:** cahier des charges test passed already at brief stage — the bench is
  existing scoped set dressing (ADR-0047), this hunt is a faithful-fidelity verification of
  an already-gated prop, not new scope.

_(Tooling note: `WebFetch` returned HTTP 403 on every domain attempted this session —
Wikipedia, Wikimonde, jardinsdefrance.org, votrebanc.louvre.fr, mobilier-urbain-
collectivite.com, citazine.fr, paris.fr — a proxy-side block affecting this hunt, not a
source-quality problem. All findings below are sourced through `WebSearch`, which fetches
and synthesizes server-side; every link is a real, stable page, but none were independently
re-fetched and re-read in full by this agent. Flagged per-axis below where that matters.)_

## Axis 1 — The Davioud/Alphand programme: two typologies, not one

- [Banc Davioud — Wikipédia](https://fr.wikipedia.org/wiki/Banc_Davioud) — the base
  reference: Gabriel Davioud, under Haussmann/Alphand, designed the bench in the 1860s;
  8,428 installed by 1869; cast-iron frame (grey in streets, bottle-green in green
  spaces); oak seating; length 2.25 m, width 0.75 m, height 1 m, ~120–124 kg; two lateral
  supports carry the arms of the City of Paris.
- [Amoureux des bancs publics — Jardins de France](https://www.jardinsdefrance.org/amoureux-des-bancs-publics/) —
  the key structural finding of this hunt: Davioud actually drew **two distinct
  typologies**, not one silhouette — (a) a **straight-backed bench, single OR double
  seating, for boulevards and promenades**, and (b) a **"gondola" bench, deeper seat,
  slightly inclined SEAT, for gardens**. This splits the "one Davioud bench" mental model
  the reference doc uses into two real variants with different backrests.
- [Le mobilier urbain ou l'image de Paris — Votre banc (Musée du Louvre)](https://votrebanc.louvre.fr/en/urban-furniture-or-the-image-of-paris/) —
  independently corroborates the split and adds the placement mapping: the **one-sided,
  gondola-shaped** bench was installed in **gardens**; the **double-sided** bench,
  displaying the city's coat of arms, was made for **pavements** (trottoirs/streets).
- [Le banc public Davioud — Omnilogie.fr](https://omnilogie.fr/O/Le_banc_public_Davioud) —
  corroborates placement: installed on sidewalks, malls, squares and small plazas,
  positioned along the axis of trees on planted sidewalks, or 1 m from the kerb edge on
  non-planted sidewalks — i.e. genuinely a **street-level, kerb-adjacent** object, not
  square/promenade-exclusive.

_Why it serves muf:_ pins down which Davioud variant belongs on a street kerb (the
straight-backed pavement type carrying the city arms) versus which belongs in a garden
(the curved gondola type) — directly relevant since our prop sits on a street, not in a
square.
_Risk:_ three of the four sources above trace back to the same underlying FR-Wikipedia-
style text (visible in near-identical phrasing across independent domains) — treat as
**one well-corroborated lineage**, not four independent confirmations; the Louvre
`votrebanc.louvre.fr` page is the one clearly independent secondary corroboration of the
street/garden split.
_Licence:_ all four are museum/encyclopaedic/amateur-history reference pages — study only,
never scrape as an asset source.

## Axis 2 — Silhouette anatomy: slats, ironwork, single vs double-face

- [Banc Davioud — Wikipédia](https://fr.wikipedia.org/wiki/Banc_Davioud) — technical
  description returned consistently across three independent search passes: **"l'assise
  double est constituée de quatre lattes et le dossier d'une latte"** — the double seat is
  made of four slats total (two per side), and **each backrest is a single broad board**,
  not a multi-slat assembly. Also: the original ornate frame carries a palm leaf at the
  base surrounded by full volutes with "drops," and the top of the frame bears a
  three-masted ship (the 1853 City of Paris arms) — confirms floral/scrollwork ironwork
  richer than plain volutes.
- [Amoureux des bancs publics — Jardins de France](https://www.jardinsdefrance.org/amoureux-des-bancs-publics/) —
  confirms **both** typologies (boulevard/pavement straight-back AND garden gondola) carry
  a **"dossier droit"** (straight backrest); the gondola's only inclination is in the seat
  pan, not the back.
- [Le mobilier urbain ou l'image de Paris — Votre banc (Musée du Louvre)](https://votrebanc.louvre.fr/en/urban-furniture-or-the-image-of-paris/) —
  "the gondole bench features a comfortable and slightly inclined seat with a straight
  backrest" — same finding, second source, and again ties the double-sided/coat-of-arms
  bench specifically to pavements.
- [Banc type DAVIOUD Ville de Paris — Simple / Double — Urban Services](https://www.urban-services.fr/bancs-acier-bois/banc-type-davidoud-ville-de-paris---simple) —
  a contemporary manufacturer catalogue selling both a "Simple" (single-face) and "Double"
  (dos-à-dos) reproduction under the same Davioud name, confirming both silhouettes remain
  in active civic circulation with no era gap between them — mood/silhouette reference for
  the general proportions only, not a period photo.

_Why it serves muf:_ the two most load-bearing silhouette clauses in the gate-final prompt
— "reclined backrest" and "several/three-or-four horizontal slats forming... the
backrest" — are exactly the two details this axis puts pressure on; worth resolving before
the next asset cycle even though the prop already gated PASS.
_Risk:_ the "quatre lattes / une latte" figure is textual, repeated near-verbatim across
sources that likely share a common origin (see Axis 1 risk note), and could not be
cross-checked against a photograph this session (`WebFetch` unavailable — see tooling
note above). Common depictions of Davioud benches in circulation (auction/restoration
photos referenced by title in searches, e.g. Selency listings) suggest more visible
board-lines than "one slat" reads as — this is flagged as a **DIG**, not a confirmed
CONTRADICTED, pending a photo-level check by `art-advisor`/`lead-art`.
_Licence:_ Wikipédia/Wikimonde/franco.wiki content is reference-only; the Urban Services
catalogue page is a commercial product listing, silhouette/mood reference only, never a
direct asset source.

## Axis 3 — 1998 street presence: still standard on secondary streets, or already receding?

- [Le retour des bancs Davioud Place de la République — Association Marais-Louvre](https://marais-louvre.fr/les-bancs-davioud-de-retour-place-de-la-republique) —
  documents the _disappearance_ of Davioud benches as a **recent** (2010s–2020s)
  phenomenon, replaced first by "Mikado" benches and other less generous designs — the
  timeline this hunt needed to place 1998 on: the reference doc's "toujours la référence
  visuelle en 1998" claim sits comfortably before this decline.
- [Banc public — Wikipédia](https://fr.wikipedia.org/wiki/Banc_public) — general context
  page: notes that benches discouraging lying down/prolonged occupation start appearing in
  France from the **end of the 1990s** onward — i.e. the anti-comfort redesign wave is
  contemporaneous with or just after 1998, not before it; in 1998 itself the classic
  Davioud was still the unmodified default.
- [Des bancs Davioud miniatures rue Pierre Foncin — Mairie du 20ᵉ](https://mairie20.paris.fr/pages/des-bancs-davioud-miniatures-rue-pierre-foncin-31501) —
  a scaled-down ("miniature") Davioud variant on an ordinary residential street (20e, a
  secondary-street register comparable to the 18e brief), supporting the "ordinary street,
  not just grand boulevard/square" placement claim.
- [Le banc public Davioud — Omnilogie.fr](https://omnilogie.fr/O/Le_banc_public_Davioud) —
  cross-ref from Axis 1: explicit placement on sidewalks/trottoirs generally, corroborating
  street (not square-exclusive) presence.

_Why it serves muf:_ directly answers the open question — yes, a Davioud bench on an
ordinary 18e street in 1998 is period-correct, sitting just before the documented decline/
replacement wave began.
_Risk:_ no source dates a specific 18e street installation to exactly 1998 — this is an
inference from the decline timeline (post-2000s/2010s), not a period photograph; treat as
well-supported but not photographically proven for this hunt.
_Licence:_ all reference/study pages, no asset use.

## Axis 4 — Anachronism traps: concrete block, anti-SDF divider, picnic table

- [Mobilier urbain anti-sdf : quand les villes repoussent les sans-abri — Aide Sociale](https://www.aide-sociale.fr/dispositif-anti-sdf/) —
  general documentation of the "hostile design" bench-divider trend as a distinct,
  identifiable movement (central armrests preventing lying down) — corroborates it as a
  describable, named phenomenon separate from any pre-2000s bench.
- [Top 16 des dispositifs anti-SDF les plus scandaleux — Topito](https://www.topito.com/top-dispositifs-anti-sdf-scandaleux-repousser-clodos-classe) —
  a broad, dated corpus of French anti-homeless furniture examples, useful to confirm the
  register (armrest dividers, sloped/segmented seating) is a recognizable, later design
  language distinct from the plain-slat Davioud continuous seat.
- [Mobilier urbain : Bancs et banquettes en béton préfabriqué — Pierre Alentour](https://www.pierre-alentour.fr/categorie-produit/mobilier-urbain/) —
  a current commercial catalogue of prefab-concrete street furniture (solid blocks, no
  slats, standardized industrial dimensions) — confirms the "banc béton à la parisienne"
  trap is a real, generic, still-dominant-today register, useful as the thing to
  positively avoid rather than as a period source.
- No dedicated source needed for the US A-frame picnic table: it is not a French street-
  furniture register at any period and is excluded on cultural-geography grounds alone
  (same footing as the streetSign board's exclusion of the American double-post crossing
  sign in `references-road-props.md` §7).

_Why it serves muf:_ confirms the three traps in the reference doc are real, distinct,
identifiable registers to actively steer the prompt away from, not straw-man risks.
_Risk:_ none of these sources are period (1998) — they document _today's_ anti-SDF/
concrete-catalogue landscape, used here only to characterize what must NOT appear, which
doesn't require a period source.
_Licence:_ reference-only, mood/negative-space guidance, no asset use.

## Claims audit — `references-road-props.md` §6

| #   | Claim                                                                                                    | Verdict                                                                  | Source                                                                                                                                                                                                                                                                                                                                                      |
| --- | -------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | Banc Davioud, Gabriel Davioud, sous Haussmann/Alphand, années 1860                                       | **VERIFIED**                                                             | Axis 1, all four sources                                                                                                                                                                                                                                                                                                                                    |
| 2   | 8 428 bancs posés dès 1869                                                                               | **VERIFIED**                                                             | Axis 1 (Wikipédia, Omnilogie)                                                                                                                                                                                                                                                                                                                               |
| 3   | "toujours la référence visuelle du banc public parisien en 1998"                                         | **VERIFIED** (with nuance)                                               | Axis 3 — decline/replacement documented as starting end-1990s/2010s+, so 1998 sits just before it; not photographically dated to 1998 itself                                                                                                                                                                                                                |
| 4   | Lattes de bois horizontales sur piètement en fonte ornée (motifs floraux)                                | **VERIFIED** (ironwork) / **PARTIALLY CONTRADICTED** (slat multiplicity) | Axis 2 — ornate floral/volute/coat-of-arms ironwork confirmed; but sourced technical description gives only 2 seat slats per side + a single-board backrest per side, not a multi-slat assembly on either seat or back                                                                                                                                      |
| 5   | "forme double-assise dos-à-dos dans sa version square/promenade, ou simple-face en version rue courante" | **CONTRADICTED**                                                         | Axis 1 — sourced mapping is the reverse: the double-sided/coat-of-arms bench was made for pavements/streets; the single-face **gondola** bench (curved, deeper seat) was the garden type. Boulevards/promenades could carry either single or double straight-back benches; the street-vs-square split isn't single-vs-double, it's straight-back-vs-gondola |
| 6   | Trait 1 — lattes horizontales bien marquées (assise + dossier), le trait le plus identifiant             | **UNSUPPORTED / DIG**                                                    | Axis 2 — the "most identifying feature" framing is plausible visually but the specific "assise + dossier both multi-slat" description conflicts with the sourced "1 backrest board" figure; flagged for a photo-level check, not confirmed wrong                                                                                                            |
| 7   | Trait 2 — piètement en fonte massif, volutes/ornement floral                                             | **VERIFIED**                                                             | Axis 1/2 (Wikipédia: palm leaf, volutes, ship/city-arms motif)                                                                                                                                                                                                                                                                                              |
| 8   | Trait 3 — "dossier légèrement incliné (confort), pas un dossier vertical droit"                          | **CONTRADICTED**                                                         | Axis 2 — both documented Davioud typologies (boulevard/pavement AND garden gondola) carry a **straight** backrest ("dossier droit"); only the gondola's _seat_ is slightly inclined, never the back                                                                                                                                                         |
| 9   | Trait 4 — posé au sol/trottoir, pas sur un socle surélevé                                                | **VERIFIED**                                                             | Axis 1 (Omnilogie: installed directly on the pavement, 1 m from the kerb)                                                                                                                                                                                                                                                                                   |
| 10  | Piège — banc béton préfabriqué "à la parisienne" 2000s+ à éviter                                         | **VERIFIED**                                                             | Axis 4                                                                                                                                                                                                                                                                                                                                                      |
| 11  | Piège — séparateur médian anti-SDF généralisé après le milieu des années 2000, absent en 1998            | **VERIFIED**                                                             | Axis 4                                                                                                                                                                                                                                                                                                                                                      |
| 12  | Piège — pas de banc pique-nique américain en A                                                           | **VERIFIED** (trivially, no dedicated source needed)                     | —                                                                                                                                                                                                                                                                                                                                                           |

## Prompt delta check — `docs/art/prompts-road-props.md` [S7] bench (gate-final PASS)

**One concrete, well-corroborated delta recommended; one flagged for a visual check
before touching the prompt; everything else holds.**

1. **"the gently reclined backrest" / "backrest gently reclined for comfort" (appears
   twice in the gate-final subject string) — recommend delta.** Both sourced Davioud
   typologies (straight-back boulevard/pavement bench AND garden gondola) carry a
   **straight** backrest; reclination, where it exists at all, is in the gondola's _seat_,
   and the gondola is the **garden**, not street, type. A kerb-side bench should read as
   upright-backed. Suggested clause-level fix (for `concept-artist`/`lead-art` to weigh,
   not authored here): replace `the gently reclined backrest` → `the upright straight
backrest`, and `the backrest gently reclined for comfort` → `the backrest standing
straight, not curved or angled`. This changes silhouette guidance only — it does not
   touch the accepted keying-safety rewrite (flush slats) or the accepted edge-inset fix.
2. **Slat count on the backrest — flag for a photo check, not an authored delta.** The
   prompt bakes "three or four bold horizontal wooden slats forming the seat **and** the...
   backrest" into both seat and back. Sourced technical text (Axis 2) describes the
   backrest as a single broad board per side, not a multi-slat assembly — if a photo check
   confirms this, the backrest clause may need to drop from "slats" to "a single broad
   board" while keeping the seat's multi-slat read (the already-accepted "three or four"
   readability cap would then apply to the seat only). Not resolved here — the underlying
   textual source could not be cross-checked against an image this session (`WebFetch`
   unavailable, see tooling note); escalate to `art-advisor`/`lead-art` for a one-photo
   sanity check before editing a prompt that already gated PASS.
3. **Everything else — no delta, prompt is consistent with references:**
   - "a heavy ornate cast-iron end frame at each end with floral scrollwork legs...
     visibly bulkier and heavier than the thin slats" — matches Axis 1/2 ironwork findings.
   - "the scrollwork read as bold solid shapes rather than fine see-through openwork" —
     Axis 2's Urban Services corroboration and the general Davioud literature do describe
     the real ironwork as openwork/à-jour; this is confirmed as the **same deliberate
     keying-safety trade-off** already applied to the lamppost lantern and traffic-light
     visor in the same gate (a production decision, not a reference error) — no change
     recommended.
   - "the whole bench resting directly on the pavement" — VERIFIED, no delta.
   - "a long low bench, much wider than it is tall, one continuous seat with no armrest
     dividers" — correctly keeps the anti-SDF divider anachronism off the sprite. No
     delta.
   - "three or four bold horizontal wooden slats forming the seat" (seat only) —
     acknowledged deliberate readability reduction from a higher real slat count for
     ~60–90 px legibility; this is a sound production call given trait 1 is confirmed as
     the primary identifier, and it doesn't hurt recognizability. No delta.
   - The prompt does not commit to single-face vs double dos-à-dos, so claim #5's
     correction (street = double/coat-of-arms is equally or more period-plausible than
     single-face) doesn't force a prompt change either way — flagged only as a correction
     to the reference doc's framing, not a silhouette gap in the shipped asset.

## Hand-off

Ready for Bertrand's KEEP/DROP/DIG per axis. On validation: `lead-art` curates into the
reference library (`docs/references/art-culture.md` / `docs/art-direction/references/`) —
this board is not self-curating. Recommend `art-advisor` do a one-photo visual check on
the backrest-slat-count question (delta #2 above) before any prompt edit is authored;
if confirmed, `concept-artist` owns the actual clause rewrite and any re-gate. The
backrest-straightness correction (delta #1) is strong enough on its own to act on without
further photo confirmation, at `lead-art`'s discretion.
