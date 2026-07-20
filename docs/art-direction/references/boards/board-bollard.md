# Reference board — near-foreground bollard (potelet parisien à tête boule, PROP/SET-DRESSING family)

Hunt run by `graphic-references` (Ray), **relayed hunt — Bertrand is away**: no interview
round, no verdict rounds. This board is produced directly to ROUND-2-equivalent depth and
handed over ready for his KEEP/DROP verdict, exactly like the traffic-light precedent
(`docs/art-direction/references/boards/board-traffic-light.md`). Family = **near-foreground
prop / set dressing** for the side-scroller shooting-gallery world; this board covers the
single **bollard (potelet à tête boule)** kind only.

**Status: PROPOSED — relayed hunt, awaiting Bertrand's KEEP/DROP verdict.**

Not yet curated into `docs/references/art-culture.md` (that step is `lead-art`'s,
post-validation, per `docs/references/README.md`).

## Hunt context (brief, reconstructed from the existing prop docs — no live interview)

- **What it's for:** the near-side-kerb bollard prop in the side-scroller shooting-gallery
  world (`src/render/scene/nearForegroundArt.ts` kind `bollard`), the **tiniest** prop in
  the near-foreground set (heightFrac 0.13, ~60–90 px in-game).
- **Era / place:** Paris, 18e, 1998.
- **Camera:** strict side view from the kerb, same near-foreground register as the rest of
  the set (parkingMeter, lamppost, wallaceFountain, trafficLight, scooter, bench,
  streetSign).
- **Mood / technique:** crade-documentaire house style (`docs/art-direction.md` §1) — pure
  grey/B&W silhouette (§C1 of `docs/art/references-road-props.md`: this prop carries **no**
  neon, unlike the traffic light exception). Silhouette-first (§2 law 3): identifiable by
  outline alone at the smallest size in the set.
- **Avoid:** post-2015 Vigipirate / anti-ram bollards (reflective collar, concrete/steel
  block silhouette), the modern flat bollard with a reflective sticker band, and — the
  false-friend trap named explicitly in the brief — any drift toward an **American fire
  hydrant** silhouette.
- **Load-bearing claim to verify:** `docs/art/references-road-props.md` §5, as written by
  `art-advisor`: _"le déploiement massif du potelet boule dans Paris a précisément commencé
  dans les années 1990 — ce n'est pas un objet rétro-daté, c'est contemporain de la
  scène."_ This hunt exists specifically to pressure-test that dating claim plus the
  silhouette/colour traits, and to check the gate-final `[S5]` prompt in
  `docs/art/prompts-road-props.md` against real-world sourcing.
- **Scope guard:** cahier des charges test passed already — the bollard is existing set
  dressing (ADR-0047), this hunt is fidelity sourcing for an already-scoped prop, not new
  scope.

## Axis 1 — The "potelet boule" model: origin and the 1990s Paris deployment claim

- [Pourquoi les trottoirs français ont ces petits poteaux partout — Le Tribunal du Net](https://www.letribunaldunet.fr/insolite/pourquoi-poteaux-trottoirs-france-origine-histoire.html) —
  traces the object's lineage: 18th-century equestrian-training origin (the narrowed neck
  under the ball let a horse's lead rope be tied without slipping off), an 1807 Napoleonic
  standardization of the ball shape (so a prisoner could be handcuffed to the post without
  the cuff sliding free), and the **1950s–60s** automobile boom as the trigger for mass
  multiplication on sidewalks (to physically block cars mounting the pavement) — a long
  lineage, but not yet the "massif...1990s" claim specifically.
- ["Les Potelets, entre urbanisme et street-art" — Ma Plume Webmag](https://www.ma-plume-webmag.com/fr/fenetre-sur/8-les-potelets-urbanisme) —
  **the direct corroborating source for the load-bearing claim**: _"L'installation de
  potelets dans les rues de Paris s'est développée depuis le début des années 1990, et elle
  s'est accélérée depuis l'élection de Bertrand Delanoë"_ (Delanoë elected mayor in 2001,
  "modes de circulation doux" push). This dates the START of the modern wave to the
  early 1990s, with the true acceleration/saturation coming **after** 2001 — i.e. **after** 1998. _(Site returned a 403 to direct fetch during this hunt; content above is the search
  index's cached snippet — re-verify reachability before an asset build leans on it, same
  caution as the traffic-light board's flaky feu.routier.free.fr.)_
- [Potelet — Wikipédia](https://fr.wikipedia.org/wiki/Potelet) — baseline reference: the
  "potelet boule" as the most widespread French model, ball sometimes painted white for
  visually-impaired wayfinding (a colour detail, out of scope for this B&W prop).
- [You pass them every day in Paris... — Sortiraparis](https://www.sortiraparis.com/en/what-to-visit-in-paris/history-heritage/articles/345052-you-run-into-them-every-day-in-paris-without-noticing-these-little-bollards-and-posts-hide-a-royal-history) —
  already cited by `art-advisor`'s source list; corroborates the same long royal/Napoleonic
  lineage as the Tribunal du Net piece (independent confirmation, not a single-source
  claim).

_Why it serves muf:_ confirms the object is period-correct set dressing for 1998 — it was
not invented later — while sharpening the claim: 1998 sits in the **early growth phase**
of the modern ball-bollard rollout (started "début des années 1990"), not yet the
saturation density of the 2001+/2013 (355 000 units) city-wide programme. Good for the
game either way (a prop can read as "present, increasingly common," not necessarily
"everywhere"), but the internal doc's word **"massif"** overstates 1998 specifically.
_Risk:_ Ma Plume Webmag is a small outlet and the page could not be independently
re-fetched this session (403) — treat the Delanoë-dating detail as corroborated-but-
unverified-firsthand until re-checked.
_Licence:_ all three are editorial/reference pages, not asset sources — describe, never
scrape.

## Axis 2 — Silhouette and dimensions: shaft, ball cap, flared base, height

- [Sino Concept — Potelet boule](https://www.sinoconcept.fr/mobilier-urbain/borne-potelet-anti-stationnement/potelet-boule/) —
  manufacturer reference confirming the two-material construction (steel tube shaft +
  ductile cast-iron ball head) and that ball + shaft are painted **the same colour** (no
  colour-blocking between shaft and cap).
- [Techni-Contact — Potelet boule en acier, Ø76 mm, 900–1300 mm, à sceller ou sur platine](https://www.techni-contact.com/produits/2173-8027094-potelet-boule-anti-stationnement.html) —
  hard dimension data: **900–1300 mm above ground**, 76 mm shaft diameter vs 90 mm ball
  head diameter (shaft clearly thinner than the cap — a real proportion tell), two mounting
  options — "à sceller" (embedded directly in a concrete footing, shaft disappears straight
  into the pavement, no visible flare) or "sur platine" (bolted to a ~200 mm round steel
  base plate, which reads visually as a flared foot).
- [Panostock — Potelet Boule Ø76 mm à sceller, acier galvanisé](https://www.panostock.fr/mobilier-urbain/788-potelet-a-boule-.html) —
  corroborates the same 76 mm-shaft/90 mm-head ratio from a second manufacturer, plus
  galvanized-steel construction.
- [ATECH — Potelet boule Synergie](https://www.atech-sas.com/produit/potelets-a-boule-synergie/) —
  third independent manufacturer catalogue entry for the same silhouette family, useful for
  triangulating that this shape (not a competing "flat-top" or "spike-top" bollard) is the
  generic French norm rather than one brand's idiosyncrasy.

_Why it serves muf:_ pins the silhouette proportions (thin shaft : wide-ish ball ≈ 76:90,
i.e. the ball reads only modestly bigger than the shaft — not a huge globe on a toothpick)
and confirms the flared-base clause is accurate for the "sur platine" variant.
_Risk (dimension nuance, flagged for the prompt-delta check below):\* manufacturer standard
heights run **900–1300 mm above ground** — for an average adult, hip height is roughly
850–900 mm and mid-chest roughly 1200–1300 mm. That puts the real object at **roughly
hip-to-chest height**, not "knee-to-hip" (knee is closer to 450–500 mm). The prompt's
"knee-to-hip" undersells the real minimum height. See Prompt delta check.
\_Licence:_ manufacturer/e-commerce catalogue pages, reference/dimension-study only, never
an asset source.

## Axis 3 — Colour and finish: dark uniform, no reflective element

- [Bollard Direct — Potelet de Ville, Acier RAL 7016 (Gris Anthracite), Gamme Design](https://www.bollard-direct.com/bollards-de-style-contemporain/82potelet-ville-anthracite.html) —
  confirms anthracite-grey (RAL 7016) as a standard factory finish, uniform across the
  whole post.
- [Bollard Direct — Potelet de ville H 83 cm, acier Noir, "Design"](https://www.bollard-direct.com/bollards-de-style-contemporain/81potelet-ville-design.html) —
  confirms matte black (RAL 9005) as the other standard finish; no reflective element
  listed on either page.
- [Declic — Potelet boule acier galvanisé Biarritz, Ø7,6 cm](https://www.declic.fr/potelet-boule-acier-galvanise-biarritz-o-7-6-cm.html) —
  a third catalogue entry in the same dark/anthracite/black finish range, reinforcing that
  a flat reflective band is **not** part of the standard décor-bollard product line (it
  belongs to a separate security-bollard family — see Axis 4).

_Why it serves muf:_ directly supports the "dark uniform painted finish with no reflective
band and no collar" clause already in the gate-final prompt — this is the standard,
unremarkable factory finish of the object, not an invented simplification.
_Risk:_ none material; low-stakes commercial catalogue sourcing.
_Licence:_ commercial catalogue pages, reference only, never an asset source.

## Axis 4 — Anachronism traps: Vigipirate/anti-ram bollards and the fire-hydrant false-friend

- [Topequip — Borne Vigipirate en béton VIGIBLOC](https://www.topequip.fr/1784-borne-vigipirate-en-beton-vigibloc.html) /
  [DMC Direct — Bloc béton anti-voiture bélier](https://www.dmcdirect.fr/borne-en-beton/2478-borne-bloc-beton-vigipirate.html) —
  spec sheets for the Vigipirate/anti-ram product family: **each unit carries a reflective
  band on two opposite faces**, and the object itself is a squat concrete or steel **block**
  (not a slim post-and-ball), explicitly a different product line from the décor bollard —
  confirms ADR-0047's "keep the two separate" instruction is correct, not just cautious.
- [November 2015 Paris attacks — Wikipedia](https://en.wikipedia.org/wiki/November_2015_Paris_attacks) /
  [Bataclan 6 Years On — Institut Montaigne](https://www.institutmontaigne.org/en/expressions/bataclan-6-years-attacks-changed-france) —
  date the French hostile-vehicle-mitigation infrastructure push (bollards, planters,
  reinforced barriers integrated into urban design) to the security response following the
  **November 2015** Bataclan attack and the **2016** Nice truck attack — roughly **17–18
  years after** the 1998 setting, confirming the "post-2015" dating already in the internal
  doc's trap note rather than just asserting it.
- [Borne, bouche ou poteau incendie : que choisir ? — FDS Pro](https://www.fdspro.com/blog/2026/04/08/borne-bouche-poteau-incendie-choix-terrain/) /
  [Différences bouche/poteau incendie — Sécurité Incendie](https://www.securiteincendie.fr/poteau-incendie/differences-dutilisation-entre-poteau-bouche-dincendie/) —
  the French hydrant equivalent ("poteau incendie") is a **red**, roughly **1 m tall** post
  with valve/coupling hardware at the top — a functionally and visually distinct object
  from the ball-top bollard, and definitionally **not** the stepped, bonneted, multi-nozzle
  American fire-hydrant silhouette the prompt already excludes via "one smooth unbroken
  shaft."

_Why it serves muf:_ both traps named in the internal doc are now dated/sourced rather than
asserted from memory — useful ammunition if the prompt or the asset is ever challenged at
the gate.
_Risk:_ none — this axis is purely defensive/anachronism-proofing, low ambiguity.
_Licence:_ Wikipedia/Institut Montaigne are reference pages; commercial spec sheets are
catalogue pages. None are asset sources.

## Claims audit — `docs/art/references-road-props.md` §5

| Claim                                                                                                                     | Verdict                                                                                                                                                                                                                                                                  | Source                                                                                                          |
| ------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------- |
| "fût tubulaire acier meulé lisse, tête en fonte ductile sphérique" (smooth steel tube shaft, spherical ductile-iron head) | **VERIFIED**                                                                                                                                                                                                                                                             | Axis 2 — Sino Concept, Panostock                                                                                |
| "le déploiement massif du potelet boule dans Paris a précisément commencé dans les années 1990"                           | **VERIFIED, WITH NUANCE** — start date confirmed (early 1990s), but "massif" overstates 1998: Ma Plume Webmag dates the acceleration/saturation to **after** Delanoë's 2001 election, i.e. after the game's setting. 1998 = early growth phase, not yet mass saturation. | Axis 1 — Ma Plume Webmag (unreachable for direct re-fetch this session, 403 — flagged)                          |
| Trait 1: "fût court et trapu (hauteur genou/hanche)"                                                                      | **PARTIALLY VERIFIED / NUANCE** — real installed height is 900–1300 mm above ground, i.e. roughly **hip-to-chest**, not knee-to-hip (knee ≈ 450–500 mm). Overall squat/low/"much shorter than a street lamp" silhouette read is unaffected.                              | Axis 2 — Techni-Contact dimension sheet                                                                         |
| Trait 2: "tête en boule/dôme arrondi"                                                                                     | **VERIFIED**                                                                                                                                                                                                                                                             | Axis 2 — all three manufacturer sources                                                                         |
| Trait 3: "fût lisse, légèrement évasé à la base, section constante sinon"                                                 | **VERIFIED, WITH NUANCE** — true for the "sur platine" (bolted base-plate) mounting variant; the "à sceller" (embedded) variant has no visible flare. Both are period-plausible for 1998; prompt's flared-base clause matches the platine variant.                       | Axis 2 — Techni-Contact                                                                                         |
| Trait 4: "peint sombre uniforme (noir/anthracite), pas de bande réfléchissante"                                           | **VERIFIED**                                                                                                                                                                                                                                                             | Axis 3 — Bollard Direct ×2, Declic                                                                              |
| Piège: Vigipirate/anti-ram bollards (post-2015, reflective collar) are a separate object from the décor bollard           | **VERIFIED**                                                                                                                                                                                                                                                             | Axis 4 — Topequip/DMC Direct spec sheets + 2015/2016 attack dating                                              |
| Piège: never a US fire-hydrant silhouette                                                                                 | **VERIFIED**                                                                                                                                                                                                                                                             | Axis 4 — FDS Pro / Sécurité Incendie (French "poteau incendie" is itself a distinct, non-hydrant-shaped object) |

No claim in §5 was CONTRADICTED. One claim ("déploiement massif...1990s") needed
softening, and one silhouette trait ("genou/hanche") is a minor underestimate that doesn't
change the practical silhouette outcome.

## Prompt delta check — `docs/art/prompts-road-props.md` §[S5], gate-final PASS

Gate-final text (seed 6105):

> a Parisian ball-top bollard: a short stout smooth tubular steel post about knee-to-hip
> height, slightly flared where it meets the ground, topped by a single rounded cast-iron
> ball cap; squat and low, much shorter than a street lamp, one smooth unbroken shaft, dark
> uniform painted finish with no reflective band and no collar, a subtle lighter grey
> highlight along the ball cap and the shaft's lit side

Clause-by-clause against the hunt:

- `short stout smooth tubular steel post` — matches Axis 2 (steel tube shaft).
- `about knee-to-hip height` — the one clause touched by a claims-audit nuance (real
  minimum height is closer to hip than knee). **No delta recommended**: this is the
  tiniest prop in the set (heightFrac 0.13) and the clause's job is to keep the generated
  silhouette squat/low, which it does; nudging the wording toward "hip-to-chest" risks
  reading taller/less squat and would work against the game-graphist's own gate note that
  this prop "is exactly the right level of ambition" at its current size. Flagging for
  `concept-artist`/`lead-art` awareness only, not requesting a change.
- `slightly flared where it meets the ground` — matches the "sur platine" real-world
  variant (Axis 2); consistent.
- `topped by a single rounded cast-iron ball cap` — matches Axis 2.
- `squat and low, much shorter than a street lamp` — matches Axis 1 dating (a common,
  unremarkable 1998-era street object, nothing monumental) and Axis 2 proportions.
- `one smooth unbroken shaft` — matches Axis 2 AND is the working anti-hydrant /
  anti-Vigipirate-collar tell confirmed in Axis 4.
- `dark uniform painted finish with no reflective band and no collar` — matches Axis 3
  (standard factory colours) and is explicitly the correct line to draw against the
  separate Vigipirate/anti-ram product family (Axis 4).
- `a subtle lighter grey highlight along the ball cap and the shaft's lit side` — a
  render-legibility decision (game-graphist gate note, dark-on-dark risk mitigation), not
  a period-accuracy claim; nothing in this hunt bears on it.

**Verdict: no delta — prompt consistent with references.** No clause needs rewriting. The
only carry-forward is the Axis 1 dating nuance (soften "déploiement massif...1990s" to
something like "increasingly common since the early 1990s" if `references-road-props.md`
is ever revised) and the Axis 2 height nuance (informational, not a prompt change) —
neither is blocking.

## Hand-off

Ready for Bertrand's KEEP/DROP/DIG per axis. Once validated: `lead-art` curates into the
reference library (`docs/references/art-culture.md` / `docs/art-direction/references/`),
per `docs/references/README.md`. `art-advisor` should confirm the Axis 1 dating nuance
doesn't need a wording pass on `references-road-props.md` §5 (softening "massif" to
"croissant"/"increasingly common" for historical precision); `concept-artist` needs no
action since the prompt delta check found no required change to `[S5]`.
