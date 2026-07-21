# Reference board — Rue Belliard street-facade backdrop, v3 (regen from zero: dessiné/BD style + cadrage)

Hunt run by `graphic-references` (Ray). Companion to
[`board-belliard-decor.md`](board-belliard-decor.md) (D1–D5, **VALIDATED by Bertrand
2026-07-18**) and [`board-belliard-decor-v2.md`](board-belliard-decor-v2.md) (three regen
axes, **VALIDATED 2026-07-18**) — read those first, they are not reopened here. This v3
board is the reference base for a **full restart from zero** of the Belliard décor after a
long experimentation phase that converged on two concrete failures:

1. **Cadrage** — text-to-image passes filled the frame and cropped facades at the edge.
   The fix is img2img (kontext) conditioned on a reference that already shows the right
   framing: buildings shown **frontally, self-contained, ending naturally in sky**, never
   cropped.
2. **Style** — photo-desaturation and cartoon filters both failed. The target is a **real
   drawn/BD medium**: ink line, flat fills, ligne claire, engraving, screen-print — not a
   photograph run through a filter.

Per Bertrand's explicit request this run is **async** — no Round-1 interview relay, no
per-direction KEEP/DROP loop. This board proposes a **large, structured set of candidates**
across five directions (asked for: "beaucoup de refs, prends beaucoup de temps") for
Bertrand to validate asynchronously. `lead-art` curates into the library once he does.

**Status: DRAFT — awaiting Bertrand's async validation.** Not yet curated into
`docs/references/art-culture.md`.

## Hunt context (recap, no live interview this round)

- **Asset family / screen:** level décor — the Belliard façade "tronçons" (transparent-cutout
  building blocks that sit side by side over a parallax ground + sky), regenerated from
  zero.
- **Era / place:** 18e arrondissement nord, 1998, deep night. Same setting as v1/v2 — this
  board does not reopen the period/place brief, only the **medium** (drawn vs. photo) and
  the **framing** (self-contained frontal block vs. edge-to-edge fill).
- **Mood:** carried over from v1's "crade-documentaire" register (dirty, real, contrasty)
  but now filtered through an explicit **hand-drawn** medium instead of a photo-doc one —
  see Direction 1 and Direction 4 below for how "documentary grime" translates into ink/
  print language.
- **Technique — the whole point of this hunt:** ink line + flat fill (ligne claire),
  cross-hatched B&W illustration, engraving/gravure, screen-print/riso — **not** photography,
  **not** a cartoon/toon-shader filter on a photo.
- **Constraints already gated (not reopened):** NUIT profonde; N&B fanzine photocopié value
  ladder `#141210` / `#3A3E44` / `#E9E3D2`; **la loi du glow** — le décor ne brille jamais;
  no Deneux-building homage (generic immeubles only, per D4 of v1); no anachronism (no
  smartphones, no modern vehicles/signage, no post-1999 riot gear); the three tronçons —
  **A** = 2 immeubles + a thin sky gap, **B** = 3 immeubles + a bare mur-pignon, **C** = 2-3
  immeubles + a narrow passage.

---

## Direction 1 — Façades parisiennes faubouriennes dessinées de face, N&B, trait d'encre

The style ossature: French BD/illustration artists who draw Paris buildings in ink,
frontally or near-frontally, with genuine linework (not photo-referenced rendering).

- [Le style graphique de Tardi — Cité internationale de la bande dessinée et de l'image](https://www.citebd.org/neuvieme-art/le-style-graphique-de-tardi) —
  the primary style anchor: Tardi privileges wide flat-black masses over contour hatching,
  inks "in reserve" (leaves light areas white rather than filling shadow), and separates
  black sky from black building silhouettes with a single white line — a direct technical
  recipe for a **N&B facade that reads by silhouette alone** at game size. Also documents
  the "Nestor Burma dans Paris" suite: 20 Paris panoramas published in a pure line (B&W)
  version — proof the linework alone, without tone, already carries a full street scene.
- [La géographie parisienne de Jacques Tardi — Autour de Paris](https://autour-de-paris.com/project/bd-sur-les-traces-tardi-paris) —
  maps which real Paris streets/quartiers Tardi actually drew and how, useful to sanity-check
  that our faubourg register (ordinary streetwall, not monuments) matches his own choices.
- [Ted Benoît — Wikipedia (EN)](https://en.wikipedia.org/wiki/Ted_Benoit) /
  [Ray Banana — Wikipédia (FR)](https://fr.wikipedia.org/wiki/Ray_Banana) — Ted Benoît,
  central figure of the ligne-claire revival (with Floc'h and Swarte) from the late 70s,
  built his "Ray Banana" strips against a deliberately flat, graphic, near-frontal urban
  backdrop — a useful counter-example to Tardi's heavy blacks: same medium (ink line),
  lighter register (closer to a flat-fill silhouette read).
- [Floc'h (illustrateur) — Wikipédia](https://fr.wikipedia.org/wiki/Floc'h_(illustrateur)) —
  one of the main living ligne-claire artists, illustration/press background, worked
  directly for Parisian institutions (Musée des Arts Décoratifs commission); a second
  ligne-claire hand to cross-reference against Ted Benoît's for how clean, uniform-weight
  ink line reads on architecture specifically.
- [Baru — "Noir" (Casterman) — Planète BD](https://www.planetebd.com/bd/casterman/noir/-/7083.html) /
  [Noir (bande dessinée) — Wikipédia](https://fr.wikipedia.org/wiki/Noir_(bande_dessin%C3%A9e)) —
  three India-ink B&W suburban stories (1995–98, collected 2009): Baru works in ink wash and
  halftone gradation rather than pure line, built entirely around banlieue/faubourg concrete
  décor as a character in itself — the closest tonal cousin to our "crade-documentaire"
  brief filtered through a genuinely drawn (not photo) hand.
- [Nicolas Presl — Wikipédia](https://fr.wikipedia.org/wiki/Nicolas_Presl) /
  [La Ville — Comixtrip](https://www.comixtrip.fr/bibliotheque/la-ville-presl-atrabile/) /
  [Nicolas Presl — Atrabile (publisher page)](https://atrabile.org/auteur-e-s/nicolas-presl/) —
  wordless, heavily cross-hatched B&W graphic novels built around dystopian urban buildings
  as the main subject (a former stonemason, so his structures read as physically real);
  the best living reference for "a building portrait, entirely hand-hatched, no photo
  underneath."
- [Gustave Doré — "London: A Pilgrimage" — London Museum](https://www.londonmuseum.org.uk/collections/london-stories/gustave-dores-london-pilgrimage/) —
  cross-Channel touchstone, not Paris, but the definitive 19th-c. wood-engraving vocabulary
  for **nocturnal urban ink**: deep contrast, gaslit alleys, dense crowds against building
  silhouette — useful purely for the "engraving handling of night" technique, not for any
  Paris-specific content.
- _Why it serves Belliard:_ these are all genuinely **drawn** hands (ink line, wash, or
  wood-engraving) applied to ordinary urban architecture, in French BD's own visual
  lineage — directly answers the "vrai dessin, pas un filtre" brief.
- _Risk:_ **cloning a hand.** Tardi, Baru, Presl, Floc'h and Ted Benoît/Ray Banana estate are
  all living or recently-deceased named artists with a copyrighted, recognisable style —
  these references inform **medium and shape language** (ink weight, hatching density,
  black/white balance), never a named-artist pastiche in the prompt. Doré is public domain
  but still a specific, recognisable hand — same rule applies.
- _Licence:_ all copyrighted published work (books, in print or recently reissued) —
  reference/study only, never scan-and-paste, never named in a generation prompt. Doré's
  1872 engravings are public domain as images, but the London Museum's own page/curation
  text is not — cite the institution, don't scrape.

---

## Direction 2 — Immeubles isolés / blocs auto-contenus (le cadrage)

The direct fix for the cropping failure: composition-first references where **one or two
buildings sit as a self-contained object on the page**, ending in blank space or sky, never
touching the frame edge. Deliberately **not BD panels** (which usually show a continuous
street) — architectural elevation plates are the purest example of this composition and
happen to also be period ink/engraving work.

- [Bertall — "Coupe d'une maison parisienne" (1845) — HAR1425](https://histoirearchitecture19.uqam.ca/bertall-coupe-maison-parisienne-emyl-ferland/) —
  the single most useful cadrage reference found this hunt: **one building, isolated on the
  page, fully contained top to bottom**, drawn in ink with diagonal hatching for structure
  and vertical strokes for light/shadow (direct image:
  [lediableparispar00balz_0153-610x1024.jpg](https://histoirearchitecture19.uqam.ca/wp-content/uploads/2022/03/lediableparispar00balz_0153-610x1024.jpg)).
  Caveat: it's a **cross-section** (interior visible, five social strata) rather than a
  street-facing elevation — use it for the "one immeuble as a contained object" composition
  lesson, not for the facade content itself.
- [Thierry Groensteen — "Des coupes pleines d'histoires" — Neuvième Art (Cité de la BD)](https://www.citebd.org/neuvieme-art/analyses/des-coupes-pleines-d-histoires) —
  scholarly piece (April 2020) tracing the building-cross-section tradition from Bertall
  through Robida, Eisner and Brecht Evens to today's comics — confirms this "isolated
  building as one legible object" composition is a century-old, still-alive comics
  convention, not an invented ask.
- [Jean-Baptiste Rondelet — "Traité théorique et pratique de l'art de bâtir", planches — Gallica/BnF](https://gallica.bnf.fr/ark:/12148/bpt6k6554203z/f91.image) —
  ([Tome 1, Gallica](https://gallica.bnf.fr/ark:/12148/bpt6k86635c.image);
  [full digitisation, Heidelberg](https://digi.ub.uni-heidelberg.de/diglit/rondelet1828planches)) —
  the foundational 19th-c. French architecture treatise (1802–1817): its engraved plates
  show single building elevations, orthographic, centered on the page with wide margins —
  the exact **frontal, self-contained, ending-in-blank-space** composition we need, in a
  period-correct ink-engraving medium.
- [César Daly — "Revue générale de l'architecture et des travaux publics" — Gallica/BnF](https://gallica.bnf.fr/ark:/12148/bd6t58658757) —
  1839–1890 architecture journal; its plates specifically depict Parisian townhouse/
  apartment-building elevations and sections (not monuments) — closer in scale and subject
  to our faubourg immeubles than Rondelet's more generic building-science plates.
- [BRICOLARCHI — "Immeuble haussmannien" (Cité de l'architecture & du patrimoine, pedagogical PDF)](https://www.citedelarchitecture.fr/sites/default/files/documents/2021-11/bricolarchi_immeuble_haussmannien_v3.pdf) —
  an official teaching document that isolates and diagrams a single Paris apartment
  building's elevation, floor by floor — modern, clean confirmation of the same "isolated
  frontal elevation" composition, useful as a plain-language cross-check against the older
  engravings above.
- _Why it serves Belliard:_ these are literally **the cadrage the brief asks for** —
  orthographic, frontal, one-or-two-building objects surrounded by white space — already
  rendered in ink. They're the strongest single lever for fixing the img2img framing
  failure, independent of Direction 1's style question.
- _Risk:_ these are institutional/monumental or bourgeois-Haussmannian buildings, not
  faubourien artisan fabric — use them **for composition and line technique only**, not for
  the buildings' actual ornament level (too rich/formal for Belliard's plain 18e stock).
  Also: an architectural elevation is flat and un-atmospheric (no night, no grime) — it must
  be crossed with Direction 1's ink-handling and Direction 4's print-grain to reach the
  house style, not used verbatim.
- _Licence:_ Bertall/Rondelet/Daly are 19th-century public-domain engravings hosted by BnF
  Gallica (official, stable) and an academic digitisation library — safe to reference and
  describe freely. The Groensteen article and BRICOLARCHI PDF are institutional/copyrighted
  text — cite, don't reproduce.

---

## Direction 3 — Mur-pignon nu et passage étroit dessinés (les beats B et C)

The specific architectural beats the tronçons need: tronçon B's bare gable wall, tronçon
C's narrow passage.

- [Publicité murale — Wikipédia](https://fr.wikipedia.org/wiki/Publicit%C3%A9_murale) —
  names the **pignoniste** tradition (letter-painters who worked specifically on blind
  gable walls, "pignon" being the etymology of their trade name) — grounds tronçon B's
  bare wall as a period-plausible surface, either truly blank or carrying a faded painted
  ad, rather than an arbitrary flat plane.
- [Murs publicitaires peints — Archéologie du futur / du quotidien](https://archeologue.over-blog.com/tag/murs%20publicitaires%20peints/) —
  photo documentation of surviving painted gable-wall ads (Suze, Cadum, Byrrh-era) —
  reference for what a faded/weathered mur-pignon surface actually looks like if tronçon
  B's wall carries a ghost-ad rather than staying fully bare.
- [Pignon (architecture) — Wikipédia](https://fr.wikipedia.org/wiki/Pignon_%28architecture%29) —
  (already cited in v2 axis 2, re-flagged here as core to this board) — the architectural
  definition and history of the gable-end party wall: no windows, raw masonry, exactly
  tronçon B's beat.
- [Murs pignons et cours intérieures — demainlaville.com](https://www.demainlaville.com/murs-pignons-et-cours-interieures-des-espaces-vitaux-a-reinvestir/) —
  (already cited in v2) — describes the specific "residual" blank gable left when a
  neighbour is demolished/rebuilt: untreated masonry, sometimes old advertising ghosting
  through — the direct texture note for a **drawn**, not photographic, rendition of B.
- [Passages couverts — plaquette Ville de Paris (PDF)](https://passagesetgaleries.fr/wp-content/uploads/2017/02/Passages-couverts-plaquette-ville-de-Paris.pdf) —
  official municipal booklet on Paris's covered-passage typology: proportions, roof glazing,
  paving — a structural reference for tronçon C's narrow passage even though our passage is
  open-air, not glazed (scale/width reference, not literal copy).
- [Passage (architecture) — Wikipédia](https://fr.wikipedia.org/wiki/Passage_%28architecture%29) —
  (already cited in v2) — general typology of the narrow Paris passage/alley between
  buildings, grounding tronçon C in a real urban form.
- _Why it serves Belliard:_ turns B and C from "an arbitrary gap in the regen" into two
  named, period-real Paris urban-fabric accidents, each with its own drawn-reference
  texture (blank pignon vs. narrow passage) rather than one generic empty space repeated
  twice.
- _Risk:_ the ghost-ad option on tronçon B risks reading as a specific historical brand
  (Suze, Byrrh, Dubonnet) if too literal — keep any lettering fragment generic/illegible,
  never a real period brand name (same anachronism-adjacent caution as v1's D4 Deneux
  guard).
- _Licence:_ Wikipedia FR pages and the Ville de Paris PDF are official/reference text, no
  licence concern; archeologue.over-blog.com and demainlaville.com photos are third-party
  documentation — reference/mood only, not source images to composite.

---

## Direction 4 — Fanzine / riso / sérigraphie N&B haute-contraste (le grain d'impression maison)

The house print grain, sourced from the actual underground-print milieu rather than a
generic "grunge texture" — reinforces §1 of `docs/art-direction.md` (photocopied fanzine)
with a **printmaking** register that also happens to be hand-drawn/hand-cut at source.

- [Le Dernier Cri — About us](https://www.lederniercri.org/en/about-us/) —
  Marseille publisher/screen-print workshop founded 1992 by Pakito Bolino and Caroline
  Sury, direct descendants of the punk/"undergraphique" fanzine movement; raw, high-contrast
  screen-printed B&W underground work — the closest living print-culture cousin to the house
  fanzine identity, and unlike a stock "riso texture" pack it's **drawn at source**, not
  photo-filtered.
- [People of Print — "POP Member Showcase: 15 Riso Projects"](https://peopleofprint.com/best-of/pop-member-showcase-15-riso-projects/) —
  a curated set of contemporary risograph work; useful as a visual index of how riso's
  halftone-dot, ink-density behaviour reads at high contrast — a concrete "what does the
  grain actually look like" companion to `docs/art-direction.md` §3's xerox/halftone rule.
- [50 Watts Books — Risograph-printed zines, books and prints](https://50wattsbooks.com/collections/risograph-printed-zines-books-and-prints) —
  a stocked, curated collection of riso-printed underground publications — same purpose as
  the People of Print link, broader sample size, useful for browsing many hands at once
  without fixating the prompt on any single artist.
- [Secret Riso Club — Print Packages / FAQ on riso high-contrast printing](https://secretrisoclub.com/Print-Packages) —
  technical grounding for what "riso-adjacent" actually means mechanically (spot-colour
  layers, halftone screening of greyscale into dot patterns) — useful for `concept-artist`
  to translate the mood correctly into FLUX-legible prompt language (halftone dots, ink
  density) rather than a vague "riso style" tag.
- _Continuity note (not re-curated here):_ the rave-flyer/xerox-fanzine graphic layer
  (Dizonord, Printed Matter/Colpa Press) is already banked in
  `docs/art-direction/references/LICENSES.md` §2 and in v1's D3 — this direction does not
  restate it, it adds the **screen-print/riso printmaking register** as a fresh technical
  layer that v1/v2 didn't cover.
- _Why it serves Belliard:_ gives `concept-artist` a **technique vocabulary** (halftone dot
  density, ink flooding, screen-print registration drift) to write into the prompt instead
  of the vague, previously-failed "photocopied/cartoon" instructions.
- _Risk:_ riso/screen-print colour registration is a colour-separation technique — for a
  strict N&B décor asset, only the **halftone/high-contrast/ink-density** vocabulary
  transfers, not riso's usual multi-spot-colour aesthetic (which would fight the value
  ladder and the loi du glow).
- _Licence:_ Le Dernier Cri's own "about us" page is citable as institutional text; the POP
  and 50 Watts pages are curated third-party showcases — reference/mood only, no
  reproduction, no named-artist pastiche in prompts.

---

## Direction 5 — Détails 18e nord 1998 dessinés (crédibilité de quartier)

Small period-correct details that sell the specific 18e-nord/Petite-Ceinture fabric once
drawn, not photographed.

- [Devanture — Wikipédia](https://fr.wikipedia.org/wiki/Devanture) —
  typology reference for the ordinary Paris shopfront (rideau de fer, painted lettering,
  awning) that anchors ground-floor detail on the tronçons.
- [Victor Bert — peintre en lettres, graveur, calligraphe (Paris)](https://www.victorbert.fr/peinture-en-lettres/) —
  a living hand-lettering/sign-painting craftsman; reference for how hand-painted shopfront
  lettering is actually built (letterform weight, gilding, hand strokes) if a tronçon
  carries readable-but-generic signage.
- [Des fresques contre les tags sauvages sur les rideaux — Ville de Paris (official page)](https://www.paris.fr/pages/des-fresques-pour-faire-face-aux-degradations-des-rideaux-de-commerces-27897) —
  official municipal page on painted/decorated roll-down shutters — a period-adjacent
  (slightly later) confirmation that the rideau de fer is itself a graphic surface worth
  drawing in detail, complementing the tagged-shutter register already banked in v1's D1.
- [Toits de Paris — Wikipédia](https://fr.wikipedia.org/wiki/Toits_de_Paris) —
  the zinc-roof/chimney typology (zinc covering, slate, aligned clay chimney pots,
  established mid-19th c.) that should crown each tronçon's silhouette against the night
  sky.
- [Sylvie Bulcourt — "Dessins Architecture de Paris" — Galerie Marguerite](https://galerie-marguerite.fr/sylvie-bulcourt/) —
  a living illustrator working in fine black felt-pen line specifically on Paris windows,
  zinc roofs and chimneys — a concrete example of "hand-drawn architectural detail, not
  photographed," at exactly the scale (roofline, windows) tronçon crowns need. **Licence
  caveat below — treat as a commercial gallery listing, mood/reference only.**
- _Why it serves Belliard:_ these are the close-in details (shutters, lettering, zinc
  roofline) that make a tronçon read as "this specific corner of the 18e" rather than
  generic Paris — each one confirmed as a genuinely **drawn/painted** surface, not a photo
  texture.
- _Risk:_ over-detailing at game scale — §2 law 3 (silhouette first) means none of this
  detail should compete with the tronçon's readability as a whole shape; these are
  finishing touches for a hero asset or close shot, not a mandate to cram every tronçon
  with signage and lettering.
- _Licence:_ Wikipedia FR and the Ville de Paris page are official/reference text, no
  licence concern. Victor Bert's site documents a living craftsperson's own work —
  reference only, no tracing. Galerie Marguerite/Sylvie Bulcourt is a commercial gallery
  selling an identifiable living artist's originals — **mood/reference only, same
  commercial-gallery caveat as v1's D2 Alamy/Getty entries**, never traced or named in a
  generation prompt.

---

## Short-list — best candidates for img2img (kontext) reference injection

Ranked for what would actually solve **both** open problems (frontal cadrage AND drawn
style) if fed as a `kontext` `image=` source, per `docs/art-direction.md` §3.12:

1. **Rondelet / César Daly elevation plates (D2)** — the single best **cadrage** carrier:
   orthographic, frontal, one building fully contained with margin, already in period ink.
   Weakest on style-warmth (dry, technical, no night/grime) — expect to need a second pass
   or a strong style-clause push toward Direction 1's ink handling on top of it.
2. **Bertall's "Coupe d'une maison parisienne" (D2)** — second-best cadrage carrier, and
   closer to a BD hand than the pure architecture plates (hatching for structure, not just
   line); its cross-section content (interior visible) must be explicitly excluded from the
   prompt, only the "isolated building, contained by margin" composition should transfer.
3. **Nicolas Presl's "La Ville" (D1)** — the best **style** carrier for a heavily hatched,
   fully hand-drawn, dystopian-adjacent urban building portrait; weaker on cadrage (his
   panels are BD compositions, not orthographic elevations) — pair with #1 or #2 for framing.
4. **Tardi's black-mass/white-reserve technique (D1)** — the best **value-ladder** carrier:
   his black-sky/white-line/black-building technique maps almost directly onto the house
   `#141210`/`#3A3E44`/`#E9E3D2` ladder and answers "how does a night facade read in pure
   ink" — a style/value reference, not a cadrage one.
5. **A riso/screen-print halftone sample (D4, e.g. Secret Riso Club's technical examples)**
   — not a compositional or figurative reference at all, but the **grain layer**: if the
   generation pipeline supports a secondary texture/grain pass or a prompt clause for
   halftone dot density, this is the sample to calibrate it against.

**Recommendation for the regen pass:** no single reference in this board satisfies cadrage
+ style + grain at once — the practical path is likely a **two-reference kontext chain** (an
elevation plate for framing, crossed with Presl/Tardi for ink handling), with the riso
vocabulary (D4) folded into the prompt's style-block text rather than a third image input.
This is a production-method call for `lead-art`/`concept-artist`, not something this board
resolves on its own.

---

## Hand-off

Ready for `lead-art` to curate into the reference library
(`docs/references/art-culture.md` / `docs/art-direction/references/`) once Bertrand
validates (async — no live KEEP/DROP loop this round, per his instruction). `art-advisor`
and `concept-artist` consume the validated directions for the from-zero Belliard regen
prompt work once curated. This board does not reopen or supersede v1 (D1–D5, period/place/
mood) or v2 (the three regen axes, tags/spacing/trottoirs) — it is additive, scoped strictly
to the medium (drawn vs. photo) and the framing (self-contained frontal block) failures
observed after the long experimentation phase.
