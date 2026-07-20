# Reference board — near-foreground fontaine Wallace (grande à 4 cariatides), PROP/SET-DRESSING family

Hunt run by `graphic-references` (Ray), **relayed hunt — Bertrand away**. No interview round,
no interim verdict rounds: this board goes straight to the web hunt and is delivered ready
for a single KEEP/DROP verdict pass on Bertrand's return, per the `board-traffic-light.md`
precedent format.

**Status: PROPOSED — relayed hunt, awaiting Bertrand's KEEP/DROP verdict.**

Not yet curated into `docs/references/art-culture.md` (that step is `lead-art`'s,
post-validation, per `docs/references/README.md`).

## Hunt context (brief, reconstructed from the existing gate artefacts — no live interview)

- **What it's for:** the near-side-kerb Wallace drinking fountain standing in the
  foreground of the street, in the side-scroller shooting-gallery world (camera looks at
  the street from the sidewalk; `src/render/scene/nearForegroundArt.ts` `wallaceFountain`
  kind, aspect 0.55, 282×512, gate-final seed 6103).
- **Era / place:** Paris, 18e, 1998. The grande-modèle Wallace fountain is a permanent
  1872-onward fixture, so — unlike the traffic-light board — there is effectively no
  "which era's hardware" question; the question is model-variant accuracy, not date.
- **Camera:** strict side view from the kerb, matching the rest of the near-foreground set
  (lamppost, bollard, traffic light all authored as profile silhouettes).
- **Style / technique:** crade-documentaire house style (`docs/art-direction.md` §1) —
  photocopied B&W silhouette. Per `references-road-props.md` intro and law C1, this prop
  renders **grey/B&W pure**, no baked or render-side neon (the traffic light is the sole
  colour exception in the set) — colour claims (vert-bronze patina) are out of scope for
  this hunt; only silhouette and proportion count.
- **What this hunt must verify or contradict:** the four `references-road-props.md` §3
  claims — (1) grande modèle 4-cariatides vs the "petite" model, (2) hourglass profile,
  (3) ~2.5 m scale, (4) dolphin-studded pointed dome — plus, new to this hunt: whether a
  grande-modèle fountain is a plausible object to find on an 18e secondary-street kerb.
- **Avoid:** anachronistic modern steel drinking-post designs (post-2000 Ville de
  Paris/Eau de Paris hardware), the single-column read (piège already flagged in
  `references-road-props.md`), any named-artist mimicry.
- **Scope guard:** cahier des charges test already passed at brief stage — the fountain is
  existing set dressing (ADR-0047, `NearForegroundKind`), already prompted and gate-PASSed
  ([S3] in `docs/art/prompts-road-props.md`); this hunt back-fills the sourcing the
  art-advisor claims and the prompt gate were run without a dedicated reference board.

## Axis 1 — Model history and taxonomy: is "grande à 4 cariatides" the right pick, and what actually is the "petite" model?

- [Wallace fountain — Wikipedia (EN)](https://en.wikipedia.org/wiki/Wallace_fountain) —
  the fountain was commissioned by Sir Richard Wallace, sculpted by Charles-Auguste
  Lebourg, first installed 30 July 1872 on boulevard de la Villette, cast by the Val
  d'Osne foundry; confirms **four distinct models exist**: the large/grand model (4
  caryatids), the wall-applied model, the colonnade model, and the small model.
- [Liste des fontaines Wallace de Paris — Wikipédia (FR)](https://fr.wikipedia.org/wiki/Liste_des_fontaines_Wallace_de_Paris) —
  gives the precise taxonomy and current Paris counts: **grand modèle à cariatides, 2,71 m,
  ~117 units in Paris today**; **petit modèle ("borne de jardin"), 1,32 m, ~40 units**,
  push-button, sited in parks/squares; **2 fontaines à colonnettes** (grand-model
  silhouette but with plain columns instead of caryatids, 2 survivors: rue de Rémusat and
  avenue des Ternes); **1 fontaine en applique** (wall-mounted).
- [Wallace Fountains — official history site](https://wallacefountains.org/about-sir-wallace-and-his-fountains/) —
  corroborating source on the model family and the "kindness/simplicity/charity/sobriety"
  caryatid symbolism (fetch blocked by the proxy during this hunt — HTTP 403 — link kept
  as a stable reference to re-verify, not scraped for this board).
- [Fontaines Wallace: the icon is 150 years old — Eau de Paris](https://www.eaudeparis.fr/en/news/fountains-wallace-icon-150-years) —
  Ville de Paris's own water utility, official 150th-anniversary piece; corroborates the
  four-model taxonomy and the "9 feet"/2.71 m grand-model figure from an institutional
  source rather than an enthusiast page.

**Claims audit outcome for this axis (see full audit below):** the `references-road-props.md`
§3 piège line — _"le modèle 'petite' à une seule cariatide (variante plus tardive/réduite
… ne pas la confondre)"_ — is **factually wrong as worded**. There is no Wallace-fountain
variant with exactly one caryatid. The **petit modèle has zero caryatids** (a plain
push-button post); the model that swaps out the caryatid figures keeps **four** simplified
columns (the "colonnade" model), not one. The underlying instruction — favour the
4-caryatid grande modèle for recognisability, don't drift toward a lesser variant — is
sound and the gate-final prompt already follows it correctly; only the taxonomy label in
the reference doc is off (see Claims audit, item 1).

_Why it serves muf:_ confirms the grande-modèle 4-caryatide pick is the historically
correct, most numerous, most iconic Paris variant (117 of ~160 fountains today) — the
right silhouette to spend the game's one fountain-prop budget on.
_Risk:_ enthusiast sites (fontaine-wallace.info, wallacefountains.org) returned HTTP 403
to automated fetch during this hunt (proxy-side, not a licence issue) — content above is
corroborated across at least two independent sources per fact; re-verify reachability
before leaning further on either site.
_Licence:_ all sources here are historical/reference pages, described not scraped; no
asset-feeding use — describe only, per `docs/references/README.md`.

## Axis 2 — Silhouette anatomy: octagonal pedestal, 4 caryatids, dome — and are the dome ornaments really dolphins?

- [UNE FONTAINE WALLACE DANS LES JARDINS — Musée Carnavalet](https://www.carnavalet.paris.fr/le-musee/la-fontaine-wallace) —
  the strongest single source for this axis: Paris's own history museum (which now holds
  a restored grande-modèle fountain in its courtyard, ex-place Denfert-Rochereau) states
  explicitly the four caryatids "face away from each other and support a dome adorned
  with a point, decorated with dolphins," plus aquatic motifs on the base (tridents,
  tritons, conches, pearl strings). **Confirms the dolphin-dome claim directly** — this
  is not a game convention or a stock-photo guess, it's documented museum text.
- [Pourquoi les fontaines Wallace ont-elles été offertes à la Ville de Paris — Paris ZigZag](https://www.pariszigzag.fr/insolite/histoire-insolite-paris/histoire-fontaines-wallace/) —
  independent corroboration of the same dolphin-dome + caryatid-virtue reading, already
  the source used by `art-advisor` for the green-patina claim in `references-road-props.md`,
  so this hunt cross-checks the same outlet on a different fact.
- [Wikipedia (EN) — Wallace fountain](https://en.wikipedia.org/wiki/Wallace_fountain) —
  confirms the octagonal ("eight-sided") base pedestal, noting the earliest castings carry
  the sculptor's and foundry's marks on that same octagonal top face — a structural, not
  decorative, detail that anchors trait 1 of the reference doc.
- [Fontaine Wallace en fonte, XIXe siècle — Marc Maison antiques](https://www.marcmaison.com/Architectural-Exterior/fountains-wells-basins/wallace-fountain-cast-iron-fountain-13974) —
  an antiques-dealer listing photographing an original grande-modèle casting in isolation
  (no street context, clean studio shots) — useful purely as a silhouette/proportion study
  of the bare object, not as a mood reference.

**Note on source quality:** an early search surfaced Grokipedia (AI-generated encyclopedia)
with the same dolphin-dome claim; it is **not cited above** and should not be treated as a
primary source — the Carnavalet museum page and Paris ZigZag corroboration make it
unnecessary, and an AI-generated tertiary source is exactly the kind of citation this board
should route around.

_Why it serves muf:_ turns "dolphin-studded dome" from an assumption into a
museum-sourced fact, and pins the octagonal-pedestal trait to primary-adjacent evidence
(the foundry/sculptor marks are literally cast into that octagonal face).
_Risk:_ none significant on the historical facts; the only live risk is downstream at the
prompt-authoring stage, where the gate-final prompt deliberately trades "dolphins" for
"small rounded bumps" for FLUX legibility/keying reasons — a production decision, not a
reference gap (see Prompt delta check below).
_Licence:_ Carnavalet/paris.fr and ZigZag are editorial/institutional reference pages,
described not scraped. Marc Maison is a commercial antiques listing — reference/mood only,
never a direct asset source.

## Axis 3 — Scale vs a lamppost: is "modest, ~2.5 m, lower and wider than the lamppost" correct?

- [Fontaines Wallace: the icon is 150 years old — Eau de Paris](https://www.eaudeparis.fr/en/news/fountains-wallace-icon-150-years) —
  states the grand model is **9 feet tall** (≈2.74 m), and — the load-bearing fact for
  this axis — that Richard Wallace's own brief to Lebourg specified the fountains be
  **"tall enough to be seen from a distance, but not so tall as to destroy the harmony of
  the surrounding landscape."** This is a documented **design intent**, not just an
  observed proportion: the fountain was deliberately kept subordinate in scale to the
  taller street furniture (lampposts) around it.
- [Liste des fontaines Wallace de Paris — Wikipédia (FR)](https://fr.wikipedia.org/wiki/Liste_des_fontaines_Wallace_de_Paris) —
  gives the precise grand-modèle figure as **2,71 m / 610 kg**, the number to correct the
  reference doc's "~2,5 m" against (see Claims audit item 3).
- [Apollo Magazine — "The subtle details that put Paris streets ahead"](https://apollo-magazine.com/street-furniture-paris-haussmann-marville/) —
  general piece on the coordinated Second-Empire/Third-Republic street-furniture
  programme (the same Alphand/Davioud-era lineage as the lamppost and bench boards in
  `references-road-props.md`) that situates the fountain, lamppost and bench as one
  design family at deliberately different, non-competing scales.

_Why it serves muf:_ confirms the "lower and wider than the lamppost" silhouette
relationship isn't an art-direction convenience — it's the fountain's original design
brief — which is exactly the kind of grounding the gate-final prompt clause "modest and
squat, clearly wider and lower than a street lamp" needs.
_Risk:_ the reference doc's "~2,5 m" is a slight understatement (actual 2,71 m / 9 ft);
low-stakes since the prompt itself carries no numeric figure, only the qualitative
lower-and-wider relationship — flagged as a minor correction, not a direction risk.
_Licence:_ Eau de Paris and Wikipedia are reference/citation only; Apollo Magazine is
editorial press, mood/context reference only.

## Axis 4 — Where they actually stand: plausible on an 18e secondary-street kerb?

- [Liste des fontaines du 18e arrondissement de Paris — Wikipédia](https://fr.wikipedia.org/wiki/Liste_des_fontaines_du_18e_arrondissement_de_Paris) —
  the direct answer to the plausibility question: the 18e has multiple grande-modèle
  Wallace fountains on ordinary street corners, not just monumental squares — e.g. the
  corner of rue Saint-Éleuthère and rue Azaïs (Montmartre backstreet), place des Abbesses,
  place du Château-Rouge, and 42 boulevard de Rochechouart.
- [Fontaine Wallace — Rue Saint-Éleuthère – Paris (75018) — e-monumen.net](https://e-monumen.net/patrimoine-monumental/fontaine-wallace-rue-saint-eleuthere-paris-75018/) —
  a documented single example: a grande-modèle, 4-caryatide fountain standing at an
  ordinary Montmartre street-corner kerb, exactly the near-foreground framing muf needs
  (not a fenced garden, not a monumental forecourt).
- [Fontaine Wallace — Rue Belliard corridor context, via Liste des fontaines Wallace de Paris](https://fr.wikipedia.org/wiki/Liste_des_fontaines_Wallace_de_Paris) —
  the same list confirms Wallace fountains are distributed street-by-street across most
  arrondissements including the 18e, corroborating that placing one in muf's Belliard-area
  street scene (the game's own 18e playable level, per `docs/art-direction.md`) is
  period- and geography-correct, not a monument-only object being dragged into a generic
  street.

_Why it serves muf:_ directly answers a question the original `references-road-props.md`
entry never asked — this is not a monument-square-only object, it plausibly stands on the
exact kind of ordinary residential/commercial 18e street corner the game is set in.
_Risk:_ none identified; if anything this axis strengthens the case for keeping the prop.
_Licence:_ Wikipedia and e-monumen.net are descriptive/documentary pages, reference only.

## Axis 5 — Anachronism trap: the modern steel drinking-post alternatives to rule out

- [Paris : Les fontaines Millénaire, héritières controversées des fontaines Wallace — Paris la Douce](https://www.parisladouce.com/2013/09/paris-les-fontaines-millenaire.html) —
  names and dates the exact modern trap the reference doc gestures at: the **"Millénaire"
  fountains, installed in year 2000** (Notre-Dame forecourt, place Saint-Michel, quai
  François-Mauriac, BnF), by RADI Designers — steel, minimalist "o"-shaped silhouette,
  explicitly conceived as a modern counterpoint to the Wallace fountain. **Confirmed
  post-1998, confirmed steel, confirmed no ornament** — a precise, sourced anachronism to
  exclude rather than a vague "modern fountain" gesture.
- [O'claire Arceau — Fontaines à boire Ville de Paris — Cécile Planchais Designer](https://www.cecileplanchais.com/oclaire-arceau-fontaines-a-boire-ville-de-paris/) —
  a second, later modern-fountain programme (accessibility-driven "Arceau" design,
  Eau de Paris) — reinforces that any smooth-steel, non-ornamented, accessibility-shaped
  drinking post belongs to a post-2000s design lineage, never to 1998.
- [Fontaines à boire — Paris Data (opendata.paris.fr)](https://opendata.paris.fr/explore/dataset/fontaines-a-boire/) —
  the city's open dataset of all current drinking-fountain models (Wallace, Millénaire,
  Arceau and others) — usable to cross-check that a specific silhouette isn't accidentally
  one of the later steel models if a future reference photo needs auditing.

_Why it serves muf:_ turns the reference doc's generic "not a modern steel fountain" piège
into two named, dated real designs to actively exclude, sharpening the anachronism guard
for anyone auditing future reference photos of "Paris drinking fountains."
_Risk:_ none — this axis is purely exclusionary/defensive.
_Licence:_ editorial (Paris la Douce), designer portfolio (Cécile Planchais), and open
government data (opendata.paris.fr) — reference only, no asset use.

## Claims audit — `references-road-props.md` §3 verified against this hunt

1. **"Le modèle 'grande' à 4 cariatides, installé dès 1872 (Richard Wallace, don au
   lendemain du siège de Paris) — piédestal octogonal, quatre cariatides dos tournés
   soutenant un dôme pointu orné de dauphins."** → **VERIFIED.** Wikipedia (EN/FR),
   Musée Carnavalet, Eau de Paris and Paris ZigZag all corroborate the model, date,
   sculptor (Lebourg), donor (Wallace), octagonal pedestal, and dolphin-studded dome
   independently (Axis 1, Axis 2).
2. **Silhouette trait 1 — "quatre colonnes fines (cariatides) … jamais une colonne
   unique."** → **VERIFIED**, and see item 5 below for a needed correction to the piège
   sentence that references a "single caryatid" variant.
3. **Silhouette trait 2 — "dôme pointu, orné de petites protubérances (dauphins) — pas un
   dôme plat."** → **VERIFIED** directly by the Musée Carnavalet page (Axis 2): "a dome
   adorned with a point, decorated with dolphins." Not a stock-photo assumption — documented
   museum text.
4. **Silhouette trait 3 — profil "sablier" (resserré à la base, élargi à mi-hauteur, puis
   resserré vers le dôme).** → **VERIFIED by structural inference**, not by a source using
   the word "hourglass" itself: the octagonal pedestal is the narrow base, the four
   caryatid figures project outward around it at mid-height (the widest point per every
   photographed example in Axis 2/4), and the dome tapers back inward to its point. No
   source contradicts this; none phrases it as an explicit silhouette profile, so treat
   this as inference-verified rather than quote-verified.
5. **Silhouette trait 4 / scale — "échelle modeste (~2,5 m), nettement plus basse et plus
   large qu'un lampadaire."** → **VERIFIED, with a minor correction.** Actual documented
   height is **2,71 m (9 ft)**, not ~2,5 m (Axis 3) — same order of magnitude, direction of
   the claim (modest, lower than a lamppost) is correct and is backed by Wallace's own
   documented design brief, but the reference doc's number should be nudged to 2,71 m if
   it's ever restated precisely.
6. **Piège — "le modèle 'petite' à une seule cariatide (variante plus tardive/réduite,
   aujourd'hui répandue mais moins iconique)."** → **CONTRADICTED.** There is no Wallace
   fountain variant with exactly one caryatid. Per Axis 1, the actual taxonomy is: **petit
   modèle** = zero caryatids (a plain push-button post, "borne de jardin," 1,32 m); the
   variant that does replace the caryatid figures is the **modèle à colonnettes**
   (colonnade model, only 2 survive today), which swaps in **four** plain columns, not
   one. The underlying craft instruction in the piège — favour the iconic 4-caryatide
   grande modèle, don't drift toward a lesser variant — remains correct and does not need
   revisiting; only the specific "une seule cariatide" label is wrong and should be
   corrected to "le petit modèle (sans cariatide, simple borne à bouton-poussoir) ou le
   modèle à colonnettes (colonnes nues à la place des cariatides)" if `art-advisor` or
   `lead-art` update that doc.
7. **Piège — "ne pas la confondre avec une fontaine à boire moderne en acier (design
   'Ville de Paris' post-2000, cylindrique, sans ornement)."** → **VERIFIED and now
   precisely sourced**: the Millénaire fountains (2000, RADI Designers, steel, "o"-shaped)
   and the Arceau fountains (Eau de Paris, accessibility-era) are the two real, dated
   designs this piège was gesturing at (Axis 5).
8. **Piège — "ne pas la réduire à une silhouette de borne/bollard (il lui faut le dôme +
   les colonnes pour se lire)."** → **VERIFIED as well-founded**, and sharpened by item 6:
   the petit modèle genuinely IS a plain borne/bollard-style post (no dome, no caryatids),
   so this piège is correctly warning against literally collapsing the grande modèle into
   the visual register of the OTHER real Wallace-fountain model, not a hypothetical risk.
9. **New finding, not a §3 claim — plausibility of siting on an 18e secondary-street
   kerb.** → **VERIFIED** (Axis 4): documented grande-modèle fountains stand at ordinary
   18e street corners (rue Saint-Éleuthère/rue Azaïs, place des Abbesses, place du
   Château-Rouge, bd de Rochechouart), not only in monumental squares or fenced gardens.

## Prompt delta check — gate-final `[S3] wallaceFountain` prompt (`docs/art/prompts-road-props.md`)

**No delta — prompt consistent with references.** Clause-by-clause against the verified
facts above:

- `"an octagonal pedestal at the base"` — matches Axis 1/2 (VERIFIED).
- `"four caryatid figures fused into one continuous closed silhouette … no open gaps
between them or under their raised arms"` — matches the grande-modèle 4-caryatide read
  (VERIFIED); the "fused" phrasing is a keying-safety rewrite already reasoned through at
  the [S3] RISK/PASS entries (enclosed-magenta fix), not a factual claim, and doesn't
  conflict with anything found in this hunt.
- `"a domed pointed cap with a few small rounded bumps studding the dome"` — the prompt
  deliberately does **not** say "dolphins." This hunt confirms the dolphins are
  historically real (Axis 2, item 3 above), so the reference itself was never the reason
  for dropping the word — the [S3] RISK note gives the real reason: at 100–160 px after
  3-tone shading, "small dolphin ornaments" would die to noise, so "small rounded bumps"
  keeps the silhouette cue without a doomed level of detail. Reference-accurate content
  (dolphins) traded for game-legible content (bumps) is the right call at this resolution;
  no change recommended.
- `"the silhouette pinched narrow at the base, widest at mid-height where the four figures
stand, then tapering up to the pointed dome"` — matches the structural-inference
  hourglass read (item 4 above, VERIFIED by inference).
- `"modest and squat, clearly wider and lower than a street lamp"` — matches Axis 3
  (VERIFIED, direction correct; the prompt carries no numeric figure, so the ~2,5 m vs
  2,71 m discrepancy in the reference doc never propagates into the asset).
- `"dark uniform patinated finish, a lighter grey highlight along the dome and body edges"` —
  colour/patina is out of scope for this hunt (B&W silhouette, C1); the highlight clause is
  a keying/legibility fix from the [S3] RISK pass, unrelated to historical accuracy, no
  conflict.

No clause needs rewriting on the strength of this hunt. The one open item is documentary,
not prompt-facing: `references-road-props.md` §3's piège sentence about a "petite modèle à
une seule cariatide" should be corrected by whoever owns that file next (see Claims audit
item 6) — it does not change the already-PASSed [S3] prompt, which never referenced that
variant.

## Hand-off

Ready for Bertrand to return a KEEP/DROP (per axis or as a whole) on the next pass.
Once validated: `lead-art` curates into the reference library
(`docs/references/art-culture.md` / `docs/art-direction/references/`) per
`docs/references/README.md`; `art-advisor` should fold the Claims-audit corrections
(items 5 and 6 above) into `references-road-props.md` §3 on her own pass — this board does
not edit that file itself; no action needed from `concept-artist` since the Prompt delta
check found the gate-final [S3] prompt already consistent with the verified references.
