# Reference board — near-foreground scooter (MBK Booster garé, PROP/SET-DRESSING family)

Hunt run by `graphic-references` (Ray), **relayed hunt** — Bertrand is away, so this board
skips the interview/verdict rounds of the standard protocol and goes straight to
propositions, ready for his KEEP/DROP verdict on return. Family = **near-foreground prop
/ set dressing** for the side-scroller shooting-gallery world; this board covers the
single **`scooter` NearForegroundKind** (parked décor prop), replacing/confirming the
current gate-final [S6] prompt in `docs/art/prompts-road-props.md`.

**Status: PROPOSED — relayed hunt, awaiting Bertrand's KEEP/DROP verdict.**

Not yet curated into `docs/references/art-culture.md` (that step is `lead-art`'s,
post-validation, per `docs/references/README.md`).

## Hunt context (brief, reconstructed from the existing spec chain — no live interview)

- **What it's for:** the parked scooter standing near the kerb among the other
  near-foreground props (`src/render/scene/nearForegroundArt.ts`), in the side-scroller
  shooting-gallery world.
- **Era / place:** Paris, 1998 — pre-maxi-scooter, pre-Vélib, pre-e-trottinette street.
- **Camera / posture:** strict side profile, standing upright and static on its **centre
  stand** (parked décor, never in motion) — distinct from the interactive delivery `moto`
  which is a moving gameplay entity.
- **Mood / technique:** crade-documentaire house style (`docs/art-direction.md` §1) —
  grey/B&W silhouette, art law **C1**: décor props render pure grey, no baked neon (only
  the `trafficLight`'s lit lens is the documented colour exception, ADR-0047).
- **The load-bearing constraint (already decided, not re-litigated):** the near-foreground
  `scooter` must **never read as the interactive `moto`**. The interactive moto anchor
  (`docs/art-direction.md` §5) is "skeletal 90s moped, fat small-diameter wheels, **exposed
  tube frame**, single round headlamp, **top-box crate strapped over the rear rack**" — the
  103/mobylette register. The lead-art gate (`prompts-road-props.md` [S6], open-item #1)
  already resolved the distinction two ways: (a) the décor prop takes the **other** canonical
  90s parti — the MBK Booster's **continuous one-piece plastic fairing** vs the moto's bare
  tube frame — and (b) the décor prop's rear rack is drawn **bare/empty**, dropping the
  top-box specifically because it is the moto's single most distinctive silhouette element.
  This hunt verifies the reference grounding for that already-gated choice; it does not
  reopen the top-box call.
- **Avoid:** maxi-scooters (Piaggio Beverly, Yamaha TMAX — 2000s+ full-bodywork/big-wheel
  register), e-scooters / trottinettes électriques and Vélib-style bike-share hardware
  (2000s–2010s), smooth continuous 2010s fairings, any named-artist mimicry.
- **Scope guard:** cahier des charges test already passed at the road-props ADR-0047 stage
  — the parked scooter is existing set dressing in the current prototype; this hunt is a
  faithful-fidelity regen check of an already-scoped prop, not new scope.

## Axis 1 — MBK Booster lineage and the 1998 model range

- [MBK Booster - Yamaha BW's — Wikipédia FR](https://fr.wikipedia.org/wiki/MBK_Booster_-_Yamaha_BW%27s) —
  the baseline lineage page: conceived mid-1980s at Yamaha (Iwata), shown at the 1988 Tokyo
  Motor Show as the BW's ("Big Wheels"), launched on the French market at the 1989 Paris
  motorcycle show, production started 1990 at the **MBK factory in Saint-Quentin** (Yamaha
  BW's / MBK Booster badge-engineered pair) — anchors "launched 1990" precisely.
- [Gamme MBK Booster 1998 — Scooter Mag](https://www.scooter-mag.fr/gamme-mbk-booster-1998) —
  the specialist trade-press page cataloguing the exact 1998 range: **Spirit** (Noir métal /
  Argent métal / Bleu océan métal / Sun métal), **Next Génération** (Noir métal / Rouge métal
  / Flashy gold), **Rocket** (Viper blue / Sun métal) and **Track** (Noir-blanc / Violet-blanc,
  described as an "extreme scooter" variant of the Next Generation) — confirms the four named
  trims cited in `references-road-props.md` §8 as a real, dated 1998 line-up, not an
  approximation.
- [MBK Booster Spirit Next Generation Rocket Track — brochure scooter 50 Booster 1998, Le Master Brockers](https://www.lemasterbrockers.com/brochures-moto/mbk-booster-spirit-next-generation-rocket-track-brochure-scooter-50-booster-1998.html) —
  the original 1998 manufacturer sales brochure covering all four trims together, a primary
  period document (antique-paper dealer site — reference/mood only, not an asset source).
- [L'origine du MBK Booster — Scooter Mag](https://www.scooter-mag.fr/4215-lorigine-du-mbk-booster.html) —
  the "Big Wheels" origin story: the concept was born from a dune-buggy/beach-riding joke at
  Yamaha's Iwata team, explaining the deliberately **chunky, fat-tired** wheel design as the
  scooter's founding idea, not an incidental proportion choice.

_Why it serves muf:_ dates and names the exact 1998 range already cited in the curated
art-advisor doc, from a specialist source rather than a single claim — the prop can be
built as "a Booster" with confidence it is period-correct down to the model year, and the
brochure gives a primary silhouette/livery reference if `concept-artist` wants a livery
detail pass later (out of scope for this B&W-only prop, per C1).
_Risk:_ Le Master Brockers and Scooter Mag are commercial/enthusiast sites, not archival
institutions — corroborated here by two independent sources per claim, but re-verify
reachability before an asset build leans on either.
_Licence:_ all three are reference/study pages, describe-only — never scrape brochure
artwork or site photography into a prompt or asset.

## Axis 2 — Silhouette anatomy: continuous plastic body vs the moto's exposed frame

- [Presentation of the YAMAHA scooter BW's — 50factory.com](https://en.50factory.com/content/19080-presentation-of-the-yamaha-bw-s-scooter) —
  confirms the "Big Wheels" wheel identity directly: **10-to-12-inch wheels**, notably large
  and chunky **for a scooter class** (vs a classic small-wheel scooter register like Vespa),
  air-cooled two-stroke, and the BW's/Booster badge-engineering pair. This is the concrete
  number behind "small fat" in `references-road-props.md` §8 trait 1 — small **relative to a
  motorcycle**, but genuinely fat/big **for a scooter**, which is the wheel's entire naming
  rationale (see Axis 1's dune-buggy note).
- [Yamaha TMAX — Wikipedia](https://en.wikipedia.org/wiki/Yamaha_TMAX) —
  used here structurally, not as a Booster source: it states the TMAX (2000, out of era) was
  built on a **motorcycle-type tubular steel frame instead of the U-section pressed-steel
  monocoque frame used on most scooters** — i.e. confirms by contrast that a standard-period
  scooter like the Booster is built on a **monocoque chassis wrapped in a continuous plastic
  fairing**, structurally distinct from a moped's exposed tube frame. This is the engineering
  fact underneath "one-piece moulded plastic body" in the gate-final [S6] prompt.
- [Peugeot 103 — Wikipédia FR](https://fr.wikipedia.org/wiki/Peugeot_103) and the search
  corpus around it (`voiture-moto.com`, `noil-motors.com`) — confirms the 103/mobylette's
  **exposed tubular frame that integrates the fuel tank**, longiligne profile, compact
  headlamp, elongated seat — the opposite silhouette register, and (per `docs/art-direction.md`
  §5) the register the interactive `moto` anchor actually draws from ("skeletal … exposed
  tube frame"). This is the concrete confirmation that Booster-vs-103/moto is a real,
  photographable structural difference, not just a naming convention.
- [Béquille centrale MBK Booster — Maxiscoot / Scooter-Moto-Pieces](https://www.maxiscoot.com/fr/produit/bequille-centrale-mbk-booster-78904) —
  a centre-stand replacement part explicitly listed for "MBK Booster Spirit et Yamaha BW's
  **1990 à 2003**" — confirms the centre stand is stock OEM equipment across the whole 1990s
  Booster run, not an aftermarket fitment (grounds the "parked on centre stand" posture, see
  Axis 4).

_Why it serves muf:_ gives the load-bearing "continuous fairing vs exposed frame" distinction
an engineering basis (monocoque-under-plastic vs tube-frame) rather than only a stylistic
one, which is exactly the property the [S6] prompt and the moto-distinctness constraint
lean on.
_Risk:_ the TMAX citation is anachronistic **by design** (used only as a structural contrast,
never as a period reference for the prop itself) — must not leak into the prompt as a form
reference.
_Licence:_ all reference/study pages; no direct asset use.

## Axis 3 — Cultural grounding: the Booster as THE French youth scooter of the 90s

- [Génération Yamaha BW's et MBK Booster — Le Repaire des Motards](https://www.lerepairedesmotards.com/dossiers/motos/generation-yamaha-bw-s-zuma-mbk-booster.php) —
  French motorcycle-press retrospective on the BW's/Booster generation: frames it as the
  scooter that **defined a French youth generation** in the 1990s, "atypical look, excellent
  maneuverability" — the closest sourced statement to "LE scooter jeune français des années
  90" in `references-road-props.md` §8.
- [MBK Booster (1988–1994) — autoevolution](https://www.autoevolution.com/moto/mbk-booster-1988.html) —
  English-language model history corroborating the French-market breakthrough figures
  (5,582 units registered in France in the first year) and framing the Booster as
  "symboliz[ing] adolescent emancipation … freedom and fun" — useful as the mood anchor for
  why this prop belongs in a 1998 rave-adjacent street scene (youth mobility, not utility
  transport).
- [Fiche Technique MBK Booster 1998 — L'argus](https://www.largus.fr/fiche-technique/motos-cyclos/Mbk/Booster/1998.html) —
  mainstream French automotive-press technical-sheet page for the 1998 model year — a second,
  more institutional source for the same "the Booster is THE 1998 reference scooter" claim,
  independent of the enthusiast press above.

_Why it serves muf:_ the brief asks for cultural grounding (banlieue/rave scene fit) — these
sources back the claim that a Booster parked on a Paris street in 1998 is not a curated prop
choice but the single most statistically/culturally obvious scooter to find there, which is
exactly the "invisible correctness" the house style wants from set dressing.
_Risk:_ "adolescent emancipation" mood language risks over-reading into a nightlife/rave
context the sources don't actually discuss — treat as general youth-mobility grounding, not
as rave-specific evidence; don't over-claim in the asset's authoring note.
_Licence:_ editorial/press pages, reference/mood only.

## Axis 4 — Parked posture (centre stand) and anachronism traps

- [Béquille centrale MBK Booster Spirit et Yamaha BW's 1990 à 2003 — Scooter-Moto-Pieces](https://www.scooter-moto-pieces.com/bequille-centrale-mbk-booster-spirit-c2x33623441) —
  a second, independent OEM-parts listing confirming the centre stand ("béquille centrale")
  as standard equipment across the exact 1990–2003 window that brackets 1998 — the
  "standing upright on its centre stand" clause in the gate-final [S6] prompt is period- and
  mechanically correct, not a generic pose choice.
- [Piaggio Beverly — Wikipedia](https://en.wikipedia.org/wiki/Piaggio_Beverly) — the Beverly
  launched **2001**, redesigned 2004/2009: full continuous bodywork, larger-displacement
  midsize-scooter register — confirms it postdates 1998 and belongs on the anachronism-trap
  list, not the reference list.
- [Yamaha TMAX — Wikipedia](https://en.wikipedia.org/wiki/Yamaha_TMAX) — the TMAX debuted at
  **July 2000** press events (Naples/Iwata) as the first "maxi-scooter" hybrid — confirms the
  2000s-launch date and the specific tells to avoid (motorcycle-derived swingarm, big
  continuous bodywork, large-displacement stance).
- [Vélib' — Wikipedia](https://en.wikipedia.org/wiki/V%C3%A9lib%27) — launched **15 July
  2007**; and the free-floating e-scooter (trottinette électrique) services in Paris that
  began **June 2018** (LimeBike first) per the transbus.org dossier and press coverage —
  both confirm e-mobility hardware (bike-share docks, e-scooters) is 9-to-20 years out of
  era for a 1998 street and must not bleed into the prop's silhouette vocabulary.

_Why it serves muf:_ locks down every anachronism trap named in the brief with a specific
launch date, so "avoid maxi-scooters / e-scooters" isn't just an instinct but has a
year-by-year fence around 1998.
_Risk:_ none of these are contested dates; low risk axis, mostly a confirmation pass.
_Licence:_ Wikipedia pages, reference/mood only; e-scooter press coverage likewise.

## Claims audit — `docs/art/references-road-props.md` §8

| Claim (§8)                                                                                          | Verdict                                         | Source                                                                                                                                                                                                                                                                                                                                                                                                                                      |
| --------------------------------------------------------------------------------------------------- | ----------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| "MBK Booster lancé 1990, LE scooter jeune français des années 90"                                   | **VERIFIED**                                    | Axis 1 (fr.wikipedia MBK Booster - Yamaha BW's, production start 1990 Saint-Quentin), Axis 3 (Le Repaire des Motards, autoevolution — generation-defining, 5,582 units yr 1)                                                                                                                                                                                                                                                                |
| "gamme 1998 incluait Spirit/Next Generation/Rocket/Track"                                           | **VERIFIED**                                    | Axis 1 (Scooter Mag "Gamme MBK Booster 1998", Le Master Brockers 1998 brochure — both name and colour-catalogue all four trims)                                                                                                                                                                                                                                                                                                             |
| "Peugeot 103 / mobylette classique — encore très répandue… cadre tubulaire apparent, sans carénage" | **VERIFIED**                                    | Axis 2 (fr.wikipedia Peugeot 103 — exposed tubular frame integrating the fuel tank, longiligne profile)                                                                                                                                                                                                                                                                                                                                     |
| "roues petites et grasses (proportions mobylette/scooter)"                                          | **VERIFIED — with nuance**                      | Axis 2 (50factory.com BW's presentation: 10–12" wheels; Axis 1 dune-buggy origin story). "Petites" holds only **relative to a motorcycle** — the BW's/Booster's own name means "Big Wheels", i.e. deliberately fat/chunky **for a scooter**. The existing [S6] clause "small fat low-diameter wheels" already reads correctly under this nuance (low-diameter vs a motorcycle, fat by design) — flagged for awareness, not a contradiction. |
| "cadre tubulaire apparent (103) OU jambière/carénage bas continu (Booster) — choisir UN seul parti" | **VERIFIED**                                    | Axis 2 (TMAX-vs-standard-scooter monocoque/fairing contrast; Peugeot 103 exposed-frame confirmation)                                                                                                                                                                                                                                                                                                                                        |
| "top-box/caisse arrière … garder"                                                                   | **SUPERSEDED — not re-litigated**               | `prompts-road-props.md` [S6] open-item #1: lead-art gate already overrode this trait to DROP the top-box (kept the rack bare/empty) for moto-distinctness (AC6). This hunt does not contest that call; see Axis 4 note below on rack plausibility.                                                                                                                                                                                          |
| "phare rond simple à l'avant, tige de rétroviseur fine"                                             | **PLAUSIBLE / not independently photo-sourced** | No dedicated source found describing headlamp/mirror shape specifically; consistent with generic Booster-era scooter anatomy visible in the brochure and general-market photography, but this hunt did not find a citable close-up description — flag as the weakest-sourced trait in the set, low risk (generic across the class, not a distinguishing feature).                                                                           |
| Piège "maxi-scooter moderne (Piaggio Beverly, Yamaha TMAX)"                                         | **VERIFIED**                                    | Axis 4 (Beverly 2001, TMAX July 2000 — both postdate 1998)                                                                                                                                                                                                                                                                                                                                                                                  |
| Piège "trottinette électrique ou Vélib"                                                             | **VERIFIED**                                    | Axis 4 (Vélib' 2007-07-15; Paris free-floating e-scooters June 2018)                                                                                                                                                                                                                                                                                                                                                                        |
| Piège "carénage plastique lisse et continu façon design 2010s"                                      | **VERIFIED (by same TMAX/Beverly dating)**      | Axis 4 — the smooth continuous-fairing look intensifies across the Beverly's 2004/2009 redesigns, confirming it as a post-1998 drift, not the 1998 Booster's own (chunkier, buggy-tired) fairing language.                                                                                                                                                                                                                                  |

**New finding not in §8 (informational, does not require a prompt change):** the rear
luggage rack the [S6] prompt keeps bare/empty is, per the parts catalogues (Axis 2/4), sold
specifically as an **aftermarket accessory for pre-2004 Boosters** (chromed Tun'R-branded
racks etc.), not stock equipment on the sport-oriented Spirit/Next Generation/Rocket/Track
trims. This does not contradict the gate decision — a bolt-on rack on a youth-owned Booster
is period-plausible and common enough in the parts record to read as authentic — but it is
worth logging: the rack itself is best understood as "period customization," same register
as the (now-dropped) top-box, rather than factory-stock hardware.

## Prompt delta check — `docs/art/prompts-road-props.md` [S6]

**No delta — prompt consistent with references.** The gate-final [S6] subject string:

```
a 1990s plastic-bodied sport scooter parked side-on in profile, standing upright on its centre stand: small fat low-diameter wheels shown as solid flat discs with no spokes and no rim cut-outs, a low continuous one-piece moulded plastic body with a step-through floorboard and a raised front leg-shield, a low flat seat, a simple round headlamp set in the front shield, a thin single mirror stalk, a bare empty rear luggage rack; stocky youthful scooter proportions, clearly wider than it is tall, comfortably inset within the frame with empty magenta margin on both sides, nothing touching the canvas edge
```

checks out clause-by-clause against this hunt:

- `1990s plastic-bodied sport scooter` / `low continuous one-piece moulded plastic body with
a step-through floorboard and a raised front leg-shield` — matches Axis 2's monocoque-
  under-fairing structural finding; correctly the OTHER parti from the moto's exposed frame.
- `parked side-on in profile, standing upright on its centre stand` — matches Axis 4's OEM
  centre-stand confirmation for exactly the 1990–2003 Booster window.
- `small fat low-diameter wheels` — matches Axis 2's 10–12" "Big Wheels" finding under the
  nuance logged in the claims audit above; no wording change needed, the clause already
  reads correctly (fat/chunky, low-diameter relative to a motorcycle).
- `a bare empty rear luggage rack` — respects the already-gated top-box DROP decision; this
  hunt's new finding (rack = plausible period aftermarket accessory) supports keeping the
  clause as-is.
- No clause in [S6] invokes a maxi-scooter or e-mobility silhouette — the Axis 4 anachronism
  traps are all already absent from the prompt, nothing to strike.

If Bertrand wants to act on the one soft spot this hunt surfaced (`phare rond simple à
l'avant, tige de rétroviseur fine` being the weakest-sourced trait), that is a "leave
as-is, low risk" call, not a prompt rewrite — both details are already generic/safe in the
current [S6] wording and this hunt found nothing to contradict them, only nothing extra to
confirm them with.

## Hand-off

Ready for Bertrand's KEEP/DROP/DIG per axis (relayed by the orchestrator). Once validated,
`lead-art` curates into `docs/references/art-culture.md` / `docs/art-direction/references/`
per `docs/references/README.md` — this board is not self-curating. Given the claims audit
found the existing gate-final [S6] prompt already consistent with sourced references (no
delta), the practical outcome of a KEEP verdict here is **confirmation of already-shipped
work**, not a rework instruction; a DIG verdict would most usefully target the one
soft-sourced trait (headlamp/mirror) if Bertrand wants tighter grounding before the next
regen cycle.
