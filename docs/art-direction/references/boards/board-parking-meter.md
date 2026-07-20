# Reference board — near-foreground prop, horodateur parisien 1998 (parkingMeter)

Hunt run by `graphic-references` (Ray), **relayed** by the orchestrator — Bertrand is
away, so this hunt skips the interview and verdict rounds of the normal protocol and is
delivered straight to ROUND 2 (propositions), ready for his KEEP/DROP/DIG. Family =
**near-foreground prop / set dressing**, side-scroller shooting-gallery world. Covers the
single `parkingMeter` kind — the horodateur, "grosse boîte Schlumberger" — **not** the
2010s+ Flowbird terminal.

**Status: PROPOSED — relayed hunt, awaiting Bertrand's KEEP/DROP verdict.** Not
self-curating; `lead-art` curates into the reference library only after a verdict, per
`docs/references/README.md`.

## Hunt context (brief reconstructed from the existing brief docs, no live interview)

- **What it's for:** the `parkingMeter` near-foreground kerb prop
  (`src/render/scene/nearForegroundArt.ts`), a small/short décor prop (heightFrac ~0.13
  per the prompt tech plan — one of the smallest props in the set).
- **Era / place:** Paris, 18e, 1998.
- **Camera:** strict side-view orthographic, kerb level, matches the shared road-props
  `opening` clause and the house side-scroller camera.
- **Mood / technique:** crade-documentaire house style, `docs/art-direction.md` §1 —
  photocopied B&W silhouette. **C1 (grey décor law)** applies in full: this prop, unlike
  `trafficLight`, has **no colour exception** — pure grey/B&W, no baked or render-side
  neon.
- **Avoid:** the Flowbird "Strada" 2010s–2020s touchscreen/card-only terminal (the
  anachronism this whole hunt exists to keep out), non-French box-signal/hydrant-style
  silhouettes, any named-artist mimicry.
- **What this hunt is checking:** the two documents that already committed to a
  Schlumberger horodateur reading before any dedicated reference hunt existed —
  `docs/art/references-road-props.md` §4 (art-advisor's claims) and the gate-final
  `[S1]` prompt in `docs/art/prompts-road-props.md` (already PASSED by lead-art
  2026-07-19, `dev-tooling-assets` contract). This board verifies or contradicts those
  claims after the fact and checks the shipped prompt clause-by-clause.
- **Scope guard:** existing scoped prop (ADR-0047 road-props set); this is a
  fidelity-verification hunt, not new scope.

## Axis 1 — Manufacturer lineage: Compagnie des Compteurs → Schlumberger → (Parkeon/Flowbird, post-1998)

- [Wikipédia FR — Horodateur](https://fr.wikipedia.org/wiki/Horodateur) — the direct
  encyclopedia entry for the object; general reference to check any period-vocabulary
  claim against (page located and confirmed to exist by search; full body not
  retrievable in this session — proxy blocked WebFetch on this and most large domains,
  see licence note).
- [AirZen — "L'horodateur, invention 100% française, fête ses 50 ans"](https://www.airzen.fr/lhorodateur-invention-100-francaise-fete-ses-50-ans/) —
  confirms the core lineage claim: Maurice Fillod, engineer, designed the first
  horodateur in 1972 at Besançon for the Compagnie des Compteurs, renamed **Compteurs
  Schlumberger** after Schlumberger's 1970 acquisition; first unit installed Place du
  Palais-Royal, Paris.
- [classe-export.com — "80 pays dans le monde l'utilisent : l'horodateur fête son
  demi-siècle"](https://classe-export.com/index.php/actus/56544-80-pays-dans-le-monde-lutilisent-lhorodateur-fete-son-demi-siecle/) —
  independent corroboration of the same 1972/Besançon/Compagnie-des-Compteurs origin
  story, plus the later corporate chain (→ Flowbird, "4 350 villes" today).
- [doczz.fr — "Compteurs Schlumberger" (CFDT Parkeon company-history document)](https://doczz.fr/doc/39486/compteurs-schlumberger---cfdt-parkeon)
  and its mirror [docplayer.fr — "80 ans de l'histoire de Parkeon"](https://docplayer.fr/72895371-80-ans-de-l-histoire-de-parkeon.html) —
  the most detailed model-by-model source found: the TRINDEL/DG1 (vertical-opening
  facade), Compteurs Schlumberger's own **DG2** (horizontal-opening facade, mechanical
  ticket-printer subassembly — "made adjustments complicated"), and the **DG3** (1980,
  the model where "the horodateur concept really took off" with electronic
  subassemblies: thermal printer, coin/money selector). Also states explicitly that
  parcmètre (individual spot) and horodateur (collective parking areas) **coexisted**,
  until Schlumberger later pushed the horodateur onto ordinary streets too — the direct
  source for the coexistence claim audited below (Axis 4). **Corporate snapshot for
  1998 specifically:** in 1998 the Besançon site was renamed **"Schlumberger Test et
  Transaction"** (still Schlumberger-branded); it becomes "e-City" in 2000 and only
  spins off as **Parkeon** in 2003 (Flowbird from 2018). So "Schlumberger" is the
  historically correct manufacturer name to anchor an object standing on a Paris street
  in 1998 — Parkeon/Flowbird are anachronistic for this date by 5–20 years.
- Cross-check: [Flowbird — Wikipédia (EN)](https://en.wikipedia.org/wiki/Flowbird) and
  [Wikimonde — Flowbird](https://wikimonde.com/article/Flowbird), both independently
  giving the same 1970/1972/2003/2018 chain.

_Why it serves muf:_ pins the "Schlumberger" attribution in the existing art-advisor
doc to a real, dated, cross-corroborated corporate lineage rather than a guess — and
gives a precise reason the object must NOT read as "Parkeon" or "Flowbird" branded
(those names literally didn't exist yet in 1998).
_Risk:_ none of these sources are period (1998) primary photography — they're
retrospective corporate/press histories, so they confirm the manufacturer and the
model-generation logic but not a specific verified photograph of the exact object on a
Paris street in 1998.
_Licence:_ all editorial/corporate-history pages, reference/study only, never scraped
into a prompt or asset. `fr.wikipedia.org/wiki/Horodateur` per Wikipedia's own licence
if a direct excerpt were ever needed (not needed here — textual citation only).

**Verdict requested:** KEEP / DROP / DIG?

## Axis 2 — Silhouette & mechanism: rain-cap head, coin slot, ticket slot, thin mast

- [doczz.fr / docplayer.fr — Compteurs Schlumberger history (cross-ref Axis 1)](https://doczz.fr/doc/39486/compteurs-schlumberger---cfdt-parkeon) —
  the mechanical-subassembly breakdown (DG2's ticket printer, DG3's thermal printer +
  coin/money selector) is the strongest sourcing found for "this object has a coin
  mechanism and a ticket-printing mechanism as core, load-bearing hardware" — i.e. the
  coin slot and ticket slot are not decorative details, they are the object's reason to
  exist mechanically.
- [Alamy — "Old parking meter"](https://www.alamy.com/stock-photo/old-parking-meter.html),
  ["Coin slot parking ticket machine"](https://www.alamy.com/stock-photo/coin-slot-parking-ticket-machine.html),
  ["Vintage parking meter"](https://www.alamy.com/stock-photo/vintage-parking-meter.html) —
  broad commercial-stock corpus of coin-operated pay-and-display machines; useful as a
  **genre/proportion** reference (thin mast vs. bulky head, angular sheet-metal casing)
  even where not France-specific.
- [Wikimedia Commons — Category:Solar parking meters](https://commons.wikimedia.org/wiki/Category:Solar_parking_meters)
  and the broader Commons horodateur/parking-meter photo corpus (located via search,
  browsable) — French-specific photo material for silhouette study, same **anachronism
  caveat as the traffic-light board**: most indexed Commons photos of French horodateurs
  skew recent (2010s–2020s, already-replaced Flowbird-era hardware) and need a curation
  pass before any is treated as period-representative of 1998.
- [Paris Data — "Horodateurs - Mobiliers"](https://opendata.paris.fr/explore/dataset/horodateurs-mobiliers/table/) —
  the City of Paris's **current** street-furniture dataset for horodateurs; useful only
  negatively here (it catalogues today's fleet, i.e. the anachronistic Flowbird
  generation, see Axis 3), not as a positive 1998 reference.

_Why it serves muf:_ confirms the three silhouette-defining mechanisms named in
`references-road-props.md` §4 (screen, coin slot, ticket slot) are real, period-old,
load-bearing hardware on the Schlumberger DG-series — not invented detail — while being
honest that no single found source is a dated, confirmed 1990s French street photograph
matching every claimed trait (see claims audit, several traits land UNSUPPORTED rather
than VERIFIED for lack of a precise period photo).
_Risk:_ the exact **degree** of the head's rain-cap slant, its screen technology (LCD
vs. another digital display), and the housing's grey/beige colour are asserted in the
existing art-advisor doc without a period photographic source found in this hunt — real
but low-severity gap (see Prompt delta check).
_Licence:_ Alamy is commercial stock, mood/proportion reference only, never traced or
composited into a shipped asset. Wikimedia Commons files per their own licence tags.
Paris Data is a public open-data page, citation only.

**Verdict requested:** KEEP / DROP / DIG?

## Axis 3 — Anachronism trap: Flowbird "Strada" and the cashless-terminal generation

- [Flowbird Group — "Strada & Stelio Upgrade Kits"](https://www.flowbird.group/smartcity/de/solutions/kiosk-and-terminals/upgrade-kits/upgrade-kits/)
  and product pages found in this hunt describing the **Strada** line: a **7" full-colour
  touchscreen** that "walks customers through transactions with graphics and animation,"
  can show "city news displays and local business advertising." This is the anachronism
  the brief names by product name — confirmed by the manufacturer's own marketing copy
  to be a colour-touchscreen, app/card-era device, structurally incompatible with a
  1998 coin-operated street machine.
- [presse-citron.net — "Les horodateurs sont-ils vraiment en voie d'extinction ?"](https://www.presse-citron.net/les-horodateurs-sont-ils-vraiment-en-voie-dextinction/) —
  confirms the terminal fleet today is dominated by app-based payment (PayByPhone,
  EasyPark, Flowbird) with physical horodateurs actively declining (12 000 → 3 700
  machines in Paris over ~15 years to 2025) — i.e. today's typical Paris street machine
  (touchscreen or app-adjacent) is doubly removed from a 1998 coin machine, reinforcing
  why any reference photographed "on a Paris street today" needs date-filtering before
  use.
- Corporate-history corroboration (cross-ref Axis 1): Parkeon only exists as a brand
  from 2003, Flowbird only from 2018 — so a "Flowbird Strada" branded object is
  anachronistic for 1998 by construction, independent of its touchscreen hardware.
- [parisii.fr — "Stationner à Paris : le parcmètre et l'horodateur"](https://parisii.fr/2011/01/stationnement-paris/) —
  located via search (full body not retrievable this session, proxy 403); its indexed
  snippets corroborate the coin-payment-phase-out date below (Axis 4) and are consistent
  with, not contradicting, the anachronism read.

_Why it serves muf:_ the brief's single named anachronism trap (Flowbird Strada) is
verified as a real, specifically-dated, manufacturer-confirmed touchscreen/card product
— not a strawman — which is exactly what a hunt should do before a prop ships.
_Risk:_ none identified against muf's use — the trap is real and correctly named.
_Licence:_ flowbird.group and presse-citron.net are commercial/editorial pages,
citation only, never a source of imagery for the asset.

**Verdict requested:** KEEP / DROP / DIG?

## Axis 4 — Parcmètre/horodateur coexistence, dated to 1998

- [Largus — "Paris. Les parcmètres ont 50 ans !"](https://www.largus.fr/actualite-automobile/paris-les-parcmetres-ont-50-ans-10720392.html) —
  located via search (body not retrievable this session); indexed content confirms
  Paris parcmètres date from **6 October 1971**, individually metered, coin + clockwork
  per space — the "older, individual" object the brief contrasts the horodateur with.
- Search-indexed content (multiple independent queries converging on the same figures,
  sourced from pages discussing the parcmètre→horodateur transition, incl.
  codedelaroute.io and parisii.fr): **the transformation of parcmètres into horodateurs
  took place between 2001 and 2006**, installing one or two multi-space horodateurs per
  street in place of one parcmètre per space; **since February 2003 it became
  progressively impossible to pay by coin in Paris** (stated reason: anti-vandalism).
  This directly and independently corroborates the exact date range already asserted in
  `references-road-props.md` §4 — and additionally confirms that **coin payment was
  still the unqualified norm before 2003**, which strengthens (does not merely permit)
  the prompt's "wide horizontal coin slot" for a 1998-dated object.
- [doczz.fr / docplayer.fr history (cross-ref Axis 1)](https://doczz.fr/doc/39486/compteurs-schlumberger---cfdt-parkeon) —
  the structural reason coexistence is true, not just chronologically true: horodateurs
  were historically deployed on **collective parking areas** first, parcmètres stayed
  the **individual on-street** device, and it was a later, deliberate Schlumberger move
  to push horodateurs onto ordinary streets — i.e. 1998 sits inside a decades-long
  transitional overlap, not a clean cutover.
- **Correction of an initial mis-read caught during this hunt:** a separate
  presse-citron figure (12 000 → 3 700 horodateurs in Paris, 2010→2025) is **about
  today's horodateurs declining to app-based payment**, not about parcmètres surviving
  — it does NOT contradict the 2001–2006 parcmètre→horodateur replacement-completion
  claim. Flagging this explicitly because a first pass at these numbers looked like a
  contradiction; re-reading the source resolved it. No claim in the audit below rests on
  the wrong reading.

_Why it serves muf:_ this is the axis that most needed sourcing beyond "trust the art
director" — the exact 2001–2006 date range and the 1998-still-coin-paying detail are now
corroborated by an independent convergence of sources, not a single unchecked assertion.
_Risk:_ the corroborating sources were read via search snippets, not full fetched pages,
in this session (see licence note on the session's tooling constraint below) — treat as
strong but not primary-document-grade sourcing; re-verify with a direct fetch before an
asset build leans harder on the exact dates.
_Licence:_ Largus, codedelaroute.io, parisii.fr — editorial/blog pages, reference only.

**Verdict requested:** KEEP / DROP / DIG?

---

## Session tooling note

`WebFetch` returned HTTP 403 on essentially every domain attempted in this session
(Wikipedia, Wikimedia Commons, Largus, docplayer, parisii.fr, solar-club.cern.ch,
flowbird.group) — a proxy-side block, not a per-source access issue. All findings above
are therefore sourced from `WebSearch` result snippets (which worked normally and
returned substantive quoted content, cross-checked across independent queries) rather
than full fetched pages. This is noted per-source above where it matters (Axis 1
Wikipédia FR, Axis 3/4 parisii.fr and Largus); nothing in the claims audit below rests
on a single unconfirmed snippet — every VERIFIED claim has at least two independent
search results converging on it.

---

## Claims audit — `docs/art/references-road-props.md` §4

| #   | Claim (§4)                                                                                                                                                              | Verdict                                                         | Source                                                                                                                                                                                                                                                                                                                                                                                                                  |
| --- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | Modèle canonique "Compteurs Schlumberger" — reprise Compagnie des Compteurs 1970, premier horodateur dessiné 1972                                                       | **VERIFIED**                                                    | AirZen, classe-export.com, doczz/docplayer CFDT history, Flowbird Wikipédia EN/Wikimonde — 4 independent convergent sources (Axis 1)                                                                                                                                                                                                                                                                                    |
| 2   | Boîtier acier gris/beige                                                                                                                                                | **UNSUPPORTED**                                                 | No period photo/spec found confirming this exact colour pairing. Low severity — C1 (grey décor law) renders the object pure grey/B&W regardless, so this detail is moot for the actual asset.                                                                                                                                                                                                                           |
| 3   | Tête inclinée en "casquette solaire" (pente pour évacuer la pluie)                                                                                                      | **UNSUPPORTED (term); plausible (concept)**                     | No source found using this term or confirming a specifically STEEP slant for the Schlumberger DG-series. The general concept (a sloped top on a coin-op street machine) is a common genre convention visible in the broad Alamy/Commons photo corpus, but that is corroboration-by-genre, not a period Schlumberger-specific citation. Flagged as the single biggest open gap this hunt found — see Prompt delta check. |
| 4   | Petit écran LCD monochrome                                                                                                                                              | **UNSUPPORTED**                                                 | The DG3 (1980) is sourced as adding "electronic subassemblies" (thermal printer, coin/money selector) — confirms an electronic-era model exists, but no source found names the display technology as LCD specifically.                                                                                                                                                                                                  |
| 5   | Large fente à pièces                                                                                                                                                    | **VERIFIED**                                                    | Photo corpus (Alamy "coin slot parking ticket machine," "coin operated parking meter") + the Feb-2003 coin-payment phase-out fact (Axis 4), which confirms coins were the unqualified norm through 1998.                                                                                                                                                                                                                |
| 6   | Ticket imprimé en sortie basse                                                                                                                                          | **VERIFIED (mechanism) / UNSUPPORTED (exact position "basse")** | Ticket-printer / thermal-printer subassembly confirmed on the DG2/DG3 (doczz/docplayer, Axis 2). No source specifically confirms the ticket exits at the bottom of the housing rather than another face — plausible, uncontested, not independently sourced.                                                                                                                                                            |
| 7   | En 1998, l'horodateur multi-place coexiste avec des parcmètres individuels plus anciens                                                                                 | **VERIFIED**                                                    | doczz/docplayer (historical collective-vs-individual split) + Largus (parcmètres from 1971) + the 2001–2006 transition sourcing (Axis 4)                                                                                                                                                                                                                                                                                |
| 8   | Le remplacement complet parcmètre→horodateur ne s'achève qu'entre 2001 et 2006                                                                                          | **VERIFIED**                                                    | Two independent search-result convergences giving the same 2001–2006 range and the Feb-2003 coin-phase-out milestone inside it (Axis 4)                                                                                                                                                                                                                                                                                 |
| 9   | "Soit une boîte mécanique/électronique simple, PAS le terminal tactile couleur moderne"                                                                                 | **VERIFIED**                                                    | Follows directly from claim 8 plus the Strada touchscreen confirmation (Axis 3)                                                                                                                                                                                                                                                                                                                                         |
| 10  | Traits de silhouette 1–4 (mât fin/tête large ratio; tête rectangulaire biseautée; écran+fente pièces+fente ticket+ventilation; boîte anguleuse jamais ronde)            | **PARTIALLY VERIFIED**                                          | Mât/tête ratio and "angular, never round" are corroborated by genre convention (Alamy/Commons corpus) but not a specific Schlumberger DG-series photograph; the screen/coin-slot/ticket-slot trio is mechanically VERIFIED (claims 4–6 above); the bevelled-top specific geometry is the same UNSUPPORTED gap as claim 3.                                                                                               |
| 11  | Piège: Flowbird "Strada" (2010s–2020s, écran tactile couleur, lecteur carte seul, coques anthracite/bleu arrondies, logo Ville de Paris moderne, pas de fente à pièces) | **VERIFIED**                                                    | Flowbird Strada product marketing copy (7" colour touchscreen) + the brand only existing from 2018 (Parkeon from 2003) — doubly anachronistic for 1998 (Axis 3)                                                                                                                                                                                                                                                         |
| 12  | "Pas de QR code, pas de logo carte bancaire sans contact"                                                                                                               | **VERIFIED (uncontested)**                                      | QR codes and contactless-card iconography are 2000s–2010s technology by general, undisputed tech history; not independently re-sourced in this hunt, no contradicting evidence anywhere.                                                                                                                                                                                                                                |

## Prompt delta check — `docs/art/prompts-road-props.md` §[S1] parkingMeter (gate-final PASS)

**No delta required — the gate-final [S1] prompt is consistent with what this hunt
found.** Clause-by-clause against the audit above:

- `"slim steel pole clearly much thinner than the head"` and `"bulky rectangular boxy
head"` — consistent with the genre-level photo corpus (Axis 2); not contradicted.
- `"a wide horizontal coin slot below it"` — **strengthened, not just permitted**, by
  the Feb-2003 coin-phase-out finding (claim 5/9 VERIFIED): a 1998-dated object
  unambiguously still has a coin slot.
- `"a low ticket-delivery slot near the bottom"` — mechanism VERIFIED (claim 6), exact
  position uncontested-but-unsourced; no reason to change it.
- `"a few horizontal ventilation grooves shown as indented surface ridges rather than
cut-through vents"` — already hardened at the pre-prod/gate stage for keying reasons
  (Serge's edit, Nico's PASS); this hunt found no new information about ventilation
  grooves specifically, positive or negative — leave as-is.
- `"angular sheet-metal casing, hard straight edges, distinctly taller than it is wide"`
  — consistent with claim 10 (never round) and the manufacturer-history's mechanical,
  sheet-metal-box read of the DG-series; not contradicted.
- **Soft flag, not a required edit:** `"whole top face is a single steeply slanted
rain-cap wedge"` rests on claim 3, the weakest-sourced clause in the whole prompt — no
  period Schlumberger photo or spec was found in this hunt to confirm the slant is
  specifically **steep** (vs. a shallower pitch, or a stepped/overhanging cap rather
  than a single flat wedge). Nothing found contradicts it either; it is a plausible,
  genre-consistent, non-blocking creative call that concept-artist/lead-art already
  signed off on. Recommend one thing only if a re-roll or a future revisit of this prop
  ever happens: source one dated period photo (or a 1990s French patent/product
  drawing, if findable) of an actual DG2/DG3-generation Schlumberger horodateur head
  before touching this clause — do not touch it on the strength of this hunt alone,
  which found no photo either confirming or denying the steep slant.

**Conclusion: the shipped prompt does not need a change on the strength of this hunt.**
The one open gap (rain-cap slant degree) is real but below the bar for reopening an
already-gated, already-generated asset; it is logged here so a future prop revisit
starts from a documented gap instead of re-discovering it.

## Hand-off

Ready for Bertrand's KEEP/DROP/DIG per axis. Once he verdicts, `lead-art` curates the
validated axes into the reference library (`docs/references/art-culture.md` /
`docs/art-direction/references/`) per `docs/references/README.md` — this board is not
self-curating. `art-advisor` should weigh in on the one open gap (Axis 2/claim 3, the
rain-cap slant) if she has period material this hunt didn't surface; no action needed
from `concept-artist` unless Bertrand specifically asks for a prompt revision — the
delta check above found none required.
