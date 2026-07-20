# Reference board — phone booth (cabine téléphonique France Télécom, PROP/SET-DRESSING family, roster-EXTENSION candidate)

Hunt run by `graphic-references` (Ray), relayed by the orchestrator (Bertrand away — no
interview, no verdict rounds this pass; board built ready for his KEEP/DROP). Family =
**near-foreground prop / set dressing**, same register as the 8 shipped `NearForegroundKind`
props (ADR-0047/0049) and same hunt protocol precedent as `board-traffic-light.md`.

**Status: PROPOSED — relayed hunt, awaiting Bertrand's KEEP/DROP verdict; roster-extension
candidate (kind not yet in ADR-0047/0049 roster).**

**Roster-extension caveat (record, not a decision made here):** `phoneBooth` is a NEW
`NearForegroundKind`, not one of the shipped 8 (parkingMeter, lamppost, wallaceFountain,
trafficLight, bollard, scooter, bench, streetSign). Adding it needs its own `pm` +
`senior-architect` pass — a cahier-des-charges call (Prohibition 1987 had no street
furniture of this kind; this would be a conscious, documented extension, per
`CLAUDE.md` "Scope guard"), a `NEAR_KIND_SPECS` entry, a `levelArt.json`
`nearForegroundArt` block, and a placement/density decision alongside the other 8. This
hunt builds only the reference board so the art side is ready if/when that pass happens —
it decides nothing about the roster itself.

Not yet curated into `docs/references/art-culture.md` (that step is `lead-art`'s,
post-validation, per `docs/references/README.md`), and doubly not applicable yet since the
kind isn't in the roster.

## Hunt context (brief supplied by the orchestrator on Bertrand's behalf)

- **What it's for:** a candidate near-foreground prop standing on the facade-side kerb of
  the side-scroller shooting-gallery street, in the same register as the 8 shipped
  road-prop kinds — a public phone booth as period Paris street furniture.
- **Era / place:** Paris, 1998 — France Télécom (pre-Orange-rebrand: the France Télécom →
  Orange brand transition happened in the 2000s, outside this game's window) public
  payphone infrastructure at its historical peak.
- **The load-bearing camera constraint (Bertrand, verbatim, binding on every road prop —
  `docs/handoffs/story-road-props-reference-revision.md`):** « et fais attention au sens
  de la caméra, la rue est vue de profil. la caméra regarde du trottoir vers la batiment » —
  the street is seen in strict profile; the camera looks from the opposite pavement toward
  the facade. Props stand on the facade-side kerb (renderOrder: props 5 < courier 6 <
  delivery van 7 — behind the street traffic) and are seen from their **road-facing side**,
  street axis in profile. For a booth this means: the cabin's glass face that looks out
  onto the roadway is what the camera sees; the interior payphone unit reads as a mass
  glimpsed through/against that glass panel, not face-on into the booth's door side.
- **Mood / technique:** crade-documentaire house style (`docs/art-direction.md` §1) —
  photocopied B&W silhouette + toner grain, family-consistent with the 8 shipped props'
  shared `opening`/`style` tail (`docs/art/prompts-road-props.md`). Art law **C1**: décor
  is grey — no lit neon baked onto the housing (only interactive game objects glow, §2 law
  1); a phone booth is set dressing, not interactive, so it carries zero neon token, same
  as parkingMeter/lamppost/wallaceFountain/bollard/bench/streetSign.
- **Avoid:** post-2000s France Télécom→Orange rebrand hardware, non-enclosed "half-booth"
  kiosk redesigns, foreign booth silhouettes (UK red K2/K6 box, US phone booth), Minitel
  terminals (a different, indoor object), any named-artist mimicry.
- **Scope guard:** cahier-des-charges test NOT yet run — flagged above as the
  roster-extension caveat; this board does not presuppose a yes.

## Axis 1 — The 1998-correct model: glass-and-aluminium "Paris"-type cabin, Télécarte era

- [Publiphonie — "Habitacles voie publique" (specialist collector/historian site,
  cabine-model catalogue)](https://www.publiphonie.fr/page-562f584bb7200.html) — the
  primary technical source found: the France Télécom "Type Paris" booth (delivered new
  through 1987) was followed by an aluminium-and-glass successor carrying **double-leaf
  doors in glass-and-aluminium profile, later pure glass doors** (production running to
  the early 2000s); walls are **smoked brown-tinted glass, 6.5 mm thick, stopping ~40 cm
  above ground** (an open gap at the base, not a glass-to-pavement panel). This
  glass-and-aluminium generation, still in production/deployment into the early 2000s, is
  the model standing on Paris streets in 1998. _Site returned 403 to direct fetch during
  this hunt; content corroborated via two independent WebSearch passes over the same
  page's indexed text — re-verify reachability before an asset build leans on it._
- [Wikipédia FR — Cabine téléphonique](https://fr.wikipedia.org/wiki/Cabine_t%C3%A9l%C3%A9phonique) —
  baseline definition/terminology and the "Publiphone" naming (the French PTT/France
  Télécom brand for the public-phone service, in use through the card era). Direct fetch
  403'd through the proxy for this hunt; treat as a to-reverify secondary source, cross-
  checked against WebSearch summaries only.
- [LeJDD — "En 2017, il n'y aura plus aucune cabine téléphonique"](https://www.lejdd.fr/Economie/En-2017-il-n-y-aura-plus-aucune-cabine-telephonique-728980) —
  count corroboration: **"over 250,000 booths at the end of the 1990s"**, declining to
  40,000 (2015) and 28,000 (2016); a separate WebSearch pass independently returned **"at
  its peak, around 1997-98, 241,000 booths in France and overseas territories"** — the two
  figures (~241k vs ~250k+) are close enough to be treated as corroborating rather than
  contradicting, both anchoring **1997-98 as the historical peak of the network**, which is
  exactly the game's year.
- [Sénat — question écrite n°10634 (2001), "Suppression de cabines téléphoniques par
  France Télécom"](https://www.senat.fr/questions/base/2001/qSEQ010634058.html) and
  [IREDIC — "Le démantèlement des cabines téléphoniques"](https://iredic.fr/2015/10/26/le-demantelement-des-cabines-telephoniques-une-adaptation-du-service-universel-des-telecommunications-motivee-par-une-evolution-des-usages/) —
  corroborate the removal timeline from the regulatory side: France Télécom already
  reflecting on redeploying underused booths from 1998 onward, formal legal
  de-obligation (loi Macron) 2015, Télécarte production stopped 2014 / validity ended
  2016, **last Paris booth dismounted June 2017**. Confirms the booth is squarely a
  **1998-valid, pre-decline** object — the game's year sits right at the network's peak,
  two decades before the object disappears from Paris streets entirely.
- [Wikipédia FR — Télécarte](https://fr.wikipedia.org/wiki/T%C3%A9l%C3%A9carte) (via
  WebSearch summary; direct fetch not attempted) — France Télécom had already phased out
  coin-operated public phones in favour of the **smart-card Télécarte** by the 1980s/90s;
  by 1998 the payment interface is card-only (a card slot, not a coin slot) — the inverse
  of the parkingMeter's coin-slot trait, worth flagging so the two props don't get
  cross-contaminated at prompt-writing time.

_Why it serves muf:_ anchors both the **housing generation** (glass-and-aluminium,
double-leaf door, smoked glass panels floating above a base gap) and the **year** (1998 is
the documented historical peak of the network, not a fringe or declining-era booth) to a
named, dated, cross-corroborated lineage rather than a generic "old phone booth" stock
image.
_Risk:_ the "Type Paris" naming is model-specific to Paris but the successor
glass-and-aluminium generation described by publiphonie.fr is described in general French
terms, not confirmed street-by-street for 1998 Paris specifically — treat the model ID as
strong-but-not-photo-pinned, same caution class as the lamppost board's Claim 3. Both
primary web pages (publiphonie.fr, Wikipédia FR) 403'd to direct WebFetch through the
proxy this pass; everything above rests on WebSearch-returned summaries of those pages,
not a first-hand read — re-fetch and re-verify before an asset build leans hard on exact
figures (6.5 mm, 40 cm, 241k vs 250k).
_Licence:_ publiphonie.fr and Wikipédia are reference/study pages, not asset sources —
describe, never scrape their photos into a prompt or asset.

## Axis 2 — Silhouette anatomy: what reads at game size, road-facing side

- [Publiphonie — "Habitacles voie publique"](https://www.publiphonie.fr/page-562f584bb7200.html) —
  (cross-ref Axis 1) the structural anatomy: full-height smoked-glass panels set in an
  aluminium frame, walls stopping short of the ground (open base gap), a double-leaf door,
  a flat or very shallow-pitched roof/signage band typically carrying the operator
  branding panel. This is the anatomy that has to survive a silhouette read.
- [Musée de La Poste collections — "Cabine téléphonique / Matériel téléphonique"](https://collections.museedelaposte.fr/fr/notice/2006-0-52-cabine-telephonique-d04698c7-c6a8-4da6-827c-e82a86e5bb66) —
  an institutional museum catalogue entry for a preserved period cabin; useful as a
  neutral, non-commercial anchor for the object class (silhouette/proportion study), not
  fetched in full detail this pass but indexed and citable.
- [Getty Images — "cabine téléphonique" search corpus](https://www.gettyimages.fr/photos/cabine-t%C3%A9l%C3%A9phonique) /
  [Alamy — "France Telecom public telephone booth, phone box, France"](https://www.alamy.com/france-telecom-public-telephone-booth-phone-box-france-image9813120.html) —
  commercial stock corpora, browsable for silhouette/proportion study; mood reference
  only, same licence regime as the traffic-light/Belliard boards' Alamy/Getty use.

**Anatomy breakdown for a road-facing-side silhouette (synthesis, not a single source):**
a tall glazed box roughly person-height-plus (~2.3–2.5 m), narrower and shallower in plan
than it is tall — full-height smoked/tinted glass panels in a slim aluminium frame,
**panels stopping short of ground level** (an open gap at the foot, not a floor-to-ceiling
sheet — a real silhouette tell, distinct from a plain glass cube), a double-leaf door on
one face (may or may not be the road-facing face depending on street-furniture placement
convention — flag for concept-artist to decide against the actual kerb orientation), a
flat or shallow roof band (the natural place for an operator badge, kept blank per the
no-text law), and, glimpsed through the glass as an interior mass rather than a separate
silhouette element, a **payphone unit** — a small wall-mounted console (keypad + handset
on a cradle + a slot, card not coin per Axis 1) on an internal shelf, roughly waist-to-
chest height.

_Why it serves muf:_ gives `concept-artist` the actual structural vocabulary (glazed box,
aluminium frame, open base gap, interior console mass) instead of a generic "phone booth"
noun, and flags the one geometry question (which face carries the door vs which faces the
road) that needs an explicit call before a prompt is written.
_Risk:_ no single photographed 1998 Paris installation was pinned down this pass — the
anatomy above is a synthesis of the collector-site description plus general stock-photo
corpora, not one dated reference image; a follow-up hunt or Bertrand-supplied photo (as
happened on the traffic-light board) would tighten this considerably.
_Licence:_ Getty/Alamy commercial stock, mood/shape reference only, never traced or
composited directly into a shipped asset; Musée de La Poste is an institutional catalogue,
citation-only.

## Axis 3 — Cultural fit: the cabine in 1998 Paris street/rave life

- [Red Bull Music Academy Daily — "A Brief Republic of Partying" (French early-rave
  feature)](https://daily.redbullmusicacademy.com/2016/04/french-early-rave-feature/) and
  the INA feature [Histoire secrète des raves parties](http://jeannoel.roueste.free.fr/techno/dossiers/histoire/histoire.html) —
  both independently describe the period **infoline** mechanic: a phone line revealing the
  night's location only shortly before the event, participants dialling in for the address;
  the Spiral Tribe-led 1993 Teknival at Beauvais is cited as having "an infoline that was
  quickly saturated." This is a documented, period-correct mechanic — calling a répondeur/
  infoline from a public payphone to get the rave location — that lines up directly with
  muf's own fiction (raveline / coursier logistics).
- General historical context (not independently pinned to an exact 1998 percentage this
  pass, flagged as such): mobile-phone ownership in France in 1998 was still a minority
  behaviour — the CREDOC "Baromètre du numérique" series tracks mobile equipment from 1997
  onward but this hunt's searches did not surface the exact 1998 figure. **Flag, not a
  claim:** treat "payphones still load-bearing for coordination in 1998" as directionally
  correct and well-supported by the infoline sourcing above, but do not bake a specific
  mobile-penetration percentage into a prompt or board without a dedicated follow-up
  source.

_Why it serves muf:_ this is the axis that most directly answers "why does this prop
belong in muf's fiction" — a payphone is not just period wallpaper, it is the plausible
physical object a courier or reveller would actually use to call the infoline for tonight's
location, tying the prop to the core loop's logistics fiction rather than being inspiration
for its own sake (the cahier-des-charges test the roster-extension pass will need to run
formally).
_Risk:_ the infoline sourcing is solid (two independent write-ups of the same
well-documented Beauvais-93 Teknival), but the broader "pre-mobile-ubiquity" framing is
under-sourced this pass — treat as reasonable period colour, not a hard-cited fact, until
someone pulls the actual CREDOC 1998 figure.
_Licence:_ RBMA and the INA/free.fr fan-history page are editorial context, citation-only,
never a source of imagery.

## Axis 4 — Anachronism traps

- **Pre-1970s wood/metal cabins** (the earliest PTT cabin generations, pre-glass-and-
  aluminium) — too early, wrong material register; ruled out by the Axis 1 "Type Paris
  delivered new through 1987, glass-and-aluminium successor into early 2000s" lineage.
- **Post-2000s France Télécom → Orange rebrand hardware and the 2010 Champs-Élysées
  "new-generation" web-browser/VoIP prototype booth** (surfaced incidentally in Axis 1
  searches) — both post-1998, out of scope; the rebrand alone (France Télécom's brand
  survived into the 2000s before "Orange" took over) is a soft but real tell against any
  reference photo showing Orange branding.
- **The post-2015 non-enclosed "kiosk" replacements and the 2015–2017 dismantling era
  hardware** (per Axis 1's Sénat/IREDIC/LeJDD sourcing) — the network was already in
  active decline and being physically removed by the mid-2010s; any photo of a battered,
  vandalised, half-stripped, or ad-panel-converted booth almost certainly documents the
  decline era, not 1998 peak-network condition. **Note:** an early web pass surfaced a
  general claim that "from the 1990s, many booths were replaced by non-enclosed kiosks" —
  this is a separate, later-decade wave (per the Axis 1 removal timeline, the bulk of that
  shift is 2000s+) and should not be read back into 1998; flagged as a single-sourced claim
  not independently corroborated this pass, treat cautiously.
- **Foreign booth silhouettes** — UK red K2/K6 cast-iron box (domed roof, crown motif,
  glazed windows in a grid of small panes) and the US wood-and-glass or later ADA-kiosk
  phone booth are both visually distinct families; explicitly out of scope per the
  hunt-context brief.
- **Minitel terminal** — a distinct indoor French object (videotex terminal, often in
  homes/post offices), not street furniture; do not conflate with the payphone unit
  glimpsed inside the booth.

_Why it serves muf:_ gives `concept-artist` a positive-phrasing checklist (per
`docs/art-direction.md` §3's "state what IS there" prompt discipline) of exactly which
later/earlier/foreign silhouettes a prompt needs to write _away from_.
_Risk:_ the "non-enclosed kiosk from the 1990s" claim is single-sourced and slightly at
odds with the Axis 1 removal timeline (which puts the network at its historical peak
count in 1997-98, implying enclosed booths were still the dominant form) — flagged above,
not resolved; a careful reading is that non-enclosed "point-phone" kiosks existed
_alongside_ enclosed booths as a cheaper variant in some locations, not that they replaced
them by 1998.
_Licence:_ n/a — this axis is negative/exclusionary guidance, no asset-bearing links.

## Proposed direction (for a future prompt, IF the roster-extension pass proceeds)

A single glazed public-phone booth, road-facing side toward the camera, crade-documentaire
B&W silhouette register, family-consistent with the 8 shipped road-prop kinds' shared
`opening`/`style` tail: a tall narrow glazed box on a slim aluminium frame, full-height
smoked-glass panels **stopping short of the ground** (an open base gap, not a floor-length
sheet — the load-bearing silhouette tell that separates this from a generic glass cube), a
flat or shallow roof band, and — read through the glass as an interior mass, not a
separate cut-out shape — a small payphone console (keypad + handset on a cradle) mounted
on an internal shelf at roughly waist-to-chest height. No neon token (C1: décor is grey,
not interactive). No legible signage/branding on the roof band (hard no-text, same six-way
kill as the other 8 props' shared tail — a booth is exactly the kind of object gptimage
will happily letter "TELEPHONE" or "FRANCE TELECOM" onto if unchecked).

**Keying risk to flag for `game-graphist` before this is ever prompted — the textbook
enclosed-magenta trap:** a booth is _by definition_ mostly transparent glass, which is the
single worst-case shape for the flood-fill chroma keyer (`keyAndDown` in
`gen-gptimage-asset.mjs`, per the game-graphist preprod annotations in
`docs/art/prompts-road-props.md`): a literal "see-through glass panel showing the street
behind it" instruction would either (a) get filled with magenta-adjacent colour that reads
as "background" and gets punched out — leaving the booth's own silhouette full of holes,
or (b) render whatever the model imagines "behind the glass" (street, sky, figures),
which is neither controllable nor in the flat B&W silhouette register at all. The board
already has an in-house precedent for exactly this problem: the **lamppost lantern**
(`board-lamppost.md`) was originally going to be glazed/openwork and was rewritten to
**"solid opaque panels with no open lattice or see-through gaps"** specifically to avoid
this failure (accepted by the lead-art gate, `docs/art/prompts-road-props.md` [S2]). A
future phoneBooth prompt should follow the same fix: describe the glass panels as **solid,
opaque, uniformly toned grey panes** (i.e. draw the glazing as a flat mid-grey fill, not as
a transparent window with content behind it), matching the "translucent-grey glass" read
the vehicle windshield precedent already uses (`art-direction.md` §5 truck/car anchors:
"windshield" rendered as an opaque panel within the cel-shaded silhouette, never as a
literal see-through hole). The interior payphone console then needs to be described as
sitting in front of / silhouetted against that opaque grey pane (a slightly darker or
outlined mass on the grey field), not glimpsed "through" it. This single clause is the
highest-risk item in any future phoneBooth prompt and should be gate-checked before
generation, not after.

**Plausible aspect-ratio guess (for a 512 px-height texture, unconfirmed, pending
game-graphist tuning at a future gate):** ~0.55–0.6 (roughly 282–307 × 512) — a tall,
narrow box, similar order to `wallaceFountain` (0.55) or a touch wider than `parkingMeter`
(0.5); real cabins run close to a 1:1 to 1:1.2 footprint-to-height ratio in plan but read
narrower in profile once the door leaf and frame are drawn as thin verticals. This is a
first guess only, not sourced to a measured photo, flagged as an open item like the
`streetSign` aspect note on the shipped board.

## Hand-off

Bertrand's KEEP/DROP/DIG verdict on this board first (same protocol as the 7-kind relay
in `docs/handoffs/story-road-props-reference-revision.md`) → **then**, separately, a
`pm`/`senior-architect` roster-extension pass (cahier-des-charges call, `NEAR_KIND_SPECS`
entry, `levelArt.json` block, placement/density decision) — this board does not itself
authorize adding `phoneBooth` to the roster → only once both of those clear does
`concept-artist` write a gate-final prompt from this board → `lead-art` PROMPT GATE (and
later composite gate, if any render-side element is added) → `game-graphist` gen. Ready
for `lead-art` to curate into the reference library once Bertrand returns a verdict — this
board is not self-curating.
