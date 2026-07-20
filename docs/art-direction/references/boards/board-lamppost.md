# Reference board — near-foreground lamppost (réverbère parisien col-de-cygne, PROP/SET-DRESSING family)

Hunt run by `graphic-references` (Ray), **relayed, non-interactive** — Bertrand is away,
so this hunt skips the interview/verdict rounds of the normal protocol and produces a
board ready for his single KEEP/DROP pass, following the precedent set by
`board-traffic-light.md`. Family = **near-foreground prop / set dressing** for the
side-scroller shooting-gallery world; this board covers the **`lamppost` /
NearForegroundKind** only, verifying (or contradicting) the claims already asserted by
`art-advisor` in `docs/art/references-road-props.md` §2 and checking them against the
gate-final `[S2]` prompt in `docs/art/prompts-road-props.md`.

**Status: PROPOSED — relayed hunt, awaiting Bertrand's KEEP/DROP verdict.** Not yet
curated into `docs/references/art-culture.md` (that step is `lead-art`'s, post-validation,
per `docs/references/README.md`).

## Hunt context (brief, reconstructed from the existing docs — no live interview)

- **What it's for:** the `lamppost` near-foreground prop standing at street level in the
  side-scroller shooting-gallery world (camera looks at the street from the kerb).
- **Era / place:** Paris, 18e, **rue secondaire** (not a grand boulevard), 1998.
- **Camera / technique:** strict side-view orthographic projection (shared `opening`
  clause in `prompts-road-props.md`), grey/B&W silhouette only — art law C1: this prop is
  décor, not interactive, so it carries **no neon** (only the traffic-light lens is the
  documented colour exception, ADR-0047).
- **Mood:** crade-documentaire house style (`docs/art-direction.md` §1) — the prop reads
  as period Parisian street furniture, not a postcard-clean tourist icon.
- **The load-bearing claim to verify:** was the ornate cast-iron col-de-cygne candélabre
  genuinely still the visual norm on an **ordinary secondary street** of the 18e in 1998,
  or would a secondary street more plausibly have carried a plain functional steel/
  aluminium mast with a sodium lamp by then?
- **Avoid:** the 2000s+ aluminium "cobra head" (straight mast, flat rectangular functional
  head), a round glazed/all-LED flat-panel globe, any named-artist mimicry, any HLM/
  Vitry-register functional pole (already out of scope per ADR-0047's `nearForeground`
  exclusion for Vitry).
- **Scope guard:** cahier des charges test passed already — `lamppost` is an existing
  `NearForegroundKind` already migrated to a gate-final generated-art prompt; this hunt is
  a faithful-fidelity verification pass on an already-scoped prop, not new scope.

---

## Axis 1 — Second Empire cast-iron candélabre lineage (Alphand/Davioud programme)

- [napoleon.org — "La Ville lumière : le candélabre ou la révolution nocturne de Paris au XIXe siècle"](https://www.napoleon.org/histoire-des-2-empires/objets/la-ville-lumiere-le-candelabre-ou-la-revolution-nocturne-de-paris-au-xixe-siecle/) —
  confirms the programme: under Haussmann, engineer Alphand (Administrateur des
  Promenades et Plantations) and architect Davioud multiplied the number of gas
  candélabres across Paris between 1855 and 1869, with gas consumption tripling over the
  period; the lanterns were mounted on ornately decorated cast-iron candélabres in the
  "surchargé" Second Empire style, with roughly a hundred distinct decorative models
  varying by location.
- [Histoire des Arts — "Le Paris d'Haussmann : le mobilier urbain"](https://histoire-des-arts.over-blog.com/article-le-paris-d-haussmann-le-mobilier-urbain-70756773.html) —
  corroborates the same Alphand/Davioud street-furniture programme (candélabres, kiosks,
  fountains, vespasiennes, benches) as one coordinated Second Empire design effort — the
  same programme that produced the Wallace fountain and the Davioud bench already anchored
  in `references-road-props.md` §3/§6, so the lamppost sits in the same documented family.
- [Wikipédia FR — Banc Davioud](https://fr.wikipedia.org/wiki/Banc_Davioud) — cross-ref
  already used for the bench prop; confirms Davioud's authorship register spans multiple
  street-furniture types under the same programme, reinforcing (not proving anew) the
  candélabre's place in it.
- [Fontes de Paris](https://fontesdeparis.fr/en/) — a foundry (founded 1985, "Entreprise
  du Patrimoine Vivant"-labelled) still manufacturing and restoring cast-iron candélabres
  to 19th-century patterns for French municipal clients including Paris — evidence the
  lineage was never discontinued, only ever restored/replicated, through the 1990s and
  into today.

_Why it serves muf:_ anchors the prop to the same documented Second Empire programme
already used for the Wallace fountain and the Davioud bench (§3/§6 of
`references-road-props.md`), so the three props read as one coherent period-furniture
family rather than three separately-sourced silhouettes.
_Risk:_ **the exact figures "12 485 → 33 859 mâts installés 1853-1869" cited in
`references-road-props.md` §2 could not be corroborated this hunt** — see Claims audit
below. The general "programme multiplied candélabres 1855–1869" claim is solid; the
specific digits are not.
_Licence:_ all four are text/reference pages (historical article, foundry company site),
not asset sources — describe, never scrape their photos into a prompt.

## Axis 2 — col-de-cygne S-arm + faceted lantern silhouette

- [Paris ZigZag — "Les plus beaux réverbères de Paris"](https://www.pariszigzag.fr/insolite/lieux-insolites/plus-beaux-reverberes-paris/) —
  already in the art-advisor source list; a browsable corpus of Paris's best-known
  candélabre models (Pont Alexandre III, Place de l'Opéra, Place Vendôme) confirming the
  visual family — ornate cast fittings, curved arms, faceted lanterns — though these
  particular examples are showcase/monument-grade, not ordinary-street grade (see Axis 3).
- [French Moments — "What Are The Different Lamp Posts Of Paris?"](https://frenchmoments.eu/lamp-posts-of-paris/) —
  an English-language survey specifically of Parisian lamppost variety: six-sided
  (faceted) lantern heads, cylindrical and flared shaft variants, single/double/quadruple
  lantern counts, and the detail that many posts carry their arrondissement number cast
  into the base — useful silhouette-variety context, though not fetched in full this hunt
  (see availability note below).
- [Wikimedia Commons — Category:Lamp posts in Paris](https://commons.wikimedia.org/wiki/Category:Lamp_posts_in_Paris) —
  browsable photo corpus for silhouette/proportion study (fluted shaft, S-arm, faceted
  cap), same curation caveat as the traffic-light board's Commons category: verify any
  individual file's installation date before treating it as period-representative, several
  categories skew toward recently-photographed (not recently-installed) fixtures.
- [vietnamcastiron.com — "Collection of most impressive Lampposts in Paris street"](https://vietnamcastiron.com/paris-lamp-post/) —
  a foundry/reproduction-manufacturer gallery page; useful only as an additional
  silhouette-variety corpus (col-de-cygne arm shapes, faceted lantern caps), commercial
  site, mood reference only.
- _Availability note:_ **WebFetch returned HTTP 403 on nearly every direct page fetch this
  session** (Wikipédia FR/EN, pariszigzag, French Moments, lightzoomlumiere, several
  others) — a proxy/tooling issue on this run, not a source-quality problem. The content
  above is corroborated through independent WebSearch passes (multiple queries converging
  on the same facts) rather than direct page reads; **re-verify by direct fetch before an
  asset build leans on any single one of these pages for a detail not cross-confirmed
  elsewhere in this board.**

_Why it serves muf:_ these sources converge, independently of `references-road-props.md`,
on exactly the three silhouette traits already specified there and baked into the
gate-final `[S2]` prompt: fluted tapering shaft, S-shaped col-de-cygne arm near the top,
faceted polygonal lantern cap — no drift, no correction needed to the silhouette claim.
_Risk:_ several of the most-photographed exemplars (Pont Alexandre III, Opéra, Vendôme)
are monument/showcase-grade fittings, not ordinary-street models — don't let their extra
ornamentation (cherub statuettes, sculpted figures) creep into a "generic secondary
street" prompt; the `[S2]` prompt already stays generic ("ornamental antique cast-iron",
no named-monument ornament), which is correct.
_Licence:_ Paris ZigZag and French Moments are editorial/blog pages, reference only.
Wikimedia Commons files are free-licensed per file page — verify before any direct texture
use (not needed here, silhouette guidance only). vietnamcastiron.com is a commercial
foundry site — mood/silhouette reference only, never scrape/composite its product photos.

## Axis 3 — what actually lit a secondary 18e street in 1998 (the load-bearing claim)

- [Paris ZigZag — "Les réverbères, une invention parisienne !"](https://www.pariszigzag.fr/insolite/histoire-insolite-paris/les-reverberes-une-invention-parisienne/) —
  contains the single most useful fact for this axis: **from the late 1950s, the City of
  Paris deliberately drew on 19th-century candélabre patterns (their design patents having
  entered the public domain) to design its new electric street lamps.** This means the
  ornate col-de-cygne silhouette was not merely inherited 19th-century stock quietly aging
  in place — it was the **actively chosen visual standard for new installations for
  decades afterward**, which is a much stronger claim than "old lamps hadn't been removed
  yet."
- [Fontes de Paris](https://fontesdeparis.fr/en/) — (cross-ref from Axis 1) a heritage
  foundry, active since 1985, whose clientele includes French municipalities for both
  restoration AND new-build candélabres to 19th-century patterns — direct evidence the
  supply chain for this silhouette was alive and serving Paris through the 1990s, not a
  discontinued relic.
- [Lux Revue — "Mâts d'éclairage public : l'acier et l'aluminium plébiscités"](https://lux-revue-eclairage.fr/mats-declairage-public-lacier-et-laluminium-plebiscites/) —
  **the counter-nuance.** Current French public-lighting spec guidance states cast iron
  ("fonte") is now specified mainly for "decorative lighting of prestigious sites"
  (squares, esplanades, parks), while aluminium is the material "widely used for lighting
  streets, avenues and boulevards" generally. Read carefully this is about **material
  choice for new fixtures**, not silhouette — and critically, reproduction/modern
  aluminium candélabres are routinely cast in the SAME ornate col-de-cygne shape (see
  `eclairagepublic.org` below), not the flat "cobra head." So this source narrows the
  fonte-specific claim without threatening the **silhouette** claim the game asset
  actually depends on (material/paint is explicitly out of scope in B&W, per
  `references-road-props.md` §2's own framing).
- [Guide du candélabre d'éclairage public — eclairagepublic.org](https://www.eclairagepublic.org/2024/02/guide-du-candelabre-eclairage-public.html) —
  same material-vs-decorative-site nuance as above, current spec-guide register (not
  period-specific, treat as present-day context only).
- [MEGE-Paris — "LE BOULEVARD PERIPHERIQUE PARISIEN"](https://mege-paris.org/2022/10/04/le-boulevard-peripherique-parisien/) —
  confirms the genuinely distinct **"voirie fonctionnelle" register**: the ring road
  (built 1956–73) uses ~38,490 functional light sources on generic masts across its
  length — a completely different, and completely separate, lighting programme from
  intra-muros streets. This is the source of the real "cobra-head" register the trap
  warns against, and it is geographically walled off from an ordinary 18e street.

_Why it serves muf:_ this is the axis Bertrand most needs sourced before trusting the
brief's framing — it now stands on two independent legs instead of one assertion: (1) the
City actively re-chose the ornate silhouette for new installations for decades after 1950,
so even non-original candélabres on an ordinary street would still read as col-de-cygne
fonte-style, not functional; (2) the genuinely functional/aluminium register (périphérique,
by extension HLM/Vitry per the existing note) is a separately-built, separately-located
system, not something that crept onto intra-muros residential streets by 1998.
_Risk:_ **no direct period photograph of a specific 18e secondary street in 1998 was found
this hunt** — the claim rests on institutional/design-continuity evidence, not a dated
photo of "rue X, 18e, circa 1998." If Bertrand wants harder proof, this needs either an
archival photo search (Paris en Images / BHVP, not searched this pass) or an art-advisor
sign-off treating the institutional evidence as sufficient. Recommend flagging this
explicitly in the verdict relay.
_Licence:_ all four are text/reference/spec-guide pages, reference only — no asset use.

## Axis 4 — anachronism traps: cobra-head aluminium, all-LED flat globes

- [Lux Revue — "De la fonderie à la LEDification en passant par l'Art déco"](https://lux-revue-eclairage.fr/de-la-fonderie-a-la-ledification-en-passant-par-lart-deco/) —
  already in the art-advisor source list; frames "LEDification" as the endpoint of a
  historical material arc (cast iron → Art Deco → modern retrofit), i.e. something that
  comes chronologically AFTER the cast-iron/Art-Deco eras this prop belongs to, not
  something concurrent with 1998 — confirms the all-LED flat-panel globe trap is correctly
  a post-1998 anachronism to avoid.
- [MEGE-Paris — "LE BOULEVARD PERIPHERIQUE PARISIEN"](https://mege-paris.org/2022/10/04/le-boulevard-peripherique-parisien/) —
  (cross-ref from Axis 3) the real home of the functional-mast/cobra-head register in
  Paris, walled off from ordinary streets — confirms the trap is real hardware that
  existed in 1998, just never on the street type this prop represents.
- HLM/Vitry functional-pole note in `references-road-props.md` §2 — not re-hunted this
  pass (Vitry `nearForeground` is already excluded by ADR-0047), flagged only as the
  existing cross-reference for "if this ever changes."

_Why it serves muf:_ confirms both halves of the trap warning in `references-road-props.md`
§2 are correctly dated and correctly geographically scoped — nothing to correct.
_Risk:_ none identified this axis; low-risk confirmatory axis.
_Licence:_ text/reference pages only.

---

## Claims audit — `docs/art/references-road-props.md` §2, verified against this hunt

| #   | Claim (§2, verbatim or summarized)                                                                              | Verdict                            | Basis                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   |
| --- | --------------------------------------------------------------------------------------------------------------- | ---------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | Candélabre haussmannien en fonte, héritage Second Empire, Alphand/Davioud programme                             | **VERIFIED**                       | Axis 1 — napoleon.org, Histoire des Arts, same programme as the already-anchored Wallace fountain / Davioud bench.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      |
| 2   | Figures "12 485 → 33 859 mâts installés 1853-1869"                                                              | **UNSUPPORTED**                    | Could not corroborate these exact digits. An independent search surfaced different figures for gas lamps specifically (~12,400 in 1853 → ~23,325 in 1869, with a separate count of "over 31,000" by end-1869) — same order of magnitude and direction, but the digits don't match, and it's unclear whether "mâts"/candélabres and "becs de gaz" (gas burners, which can outnumber posts on multi-lamp candélabres) are being conflated. **Not contradicted, but not confirmed either — flag for a source citation before reusing these specific numbers anywhere public-facing (e.g. a future curated library entry).**                                                                                                                                                                                |
| 3   | "Encore la norme visuelle sur les rues secondaires du 18e/19e en 1998 — pas seulement les grands boulevards"    | **VERIFIED, WITH NUANCE**          | Axis 3. Institutional continuity evidence is strong (City of Paris actively re-chose the 19th-c silhouette for new installations from the late 1950s onward; heritage foundries kept supplying/restoring it through the 90s). Countervailing nuance: current spec guidance reserves cast-iron _material_ for "prestigious sites" and defaults _aluminium_ for ordinary streets/avenues — but modern aluminium candélabres are commonly cast in the same col-de-cygne silhouette, so this doesn't threaten the game asset (silhouette-only, B&W, material out of scope). **No dated photo of a specific 18e secondary street circa 1998 was found** — the claim rests on design-continuity reasoning, not direct visual proof. Recommend treating as verified-but-not-photo-proven in the verdict relay. |
| 4   | Silhouette traits 1–3: fluted tapering shaft, S-shaped col-de-cygne arm near the top, faceted polygonal lantern | **VERIFIED**                       | Axis 2 — independently corroborated by Paris ZigZag, French Moments, Commons category, vietnamcastiron.com gallery; matches trait-for-trait what's already baked into the gate-final `[S2]` prompt.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     |
| 5   | Silhouette trait 4 / paint colour (vert wagon / noir foncé, dark uniform fill)                                  | **N/A this hunt**                  | Explicitly out of scope in B&W per the reference doc's own framing ("sans objet en N&B"); not re-hunted.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                |
| 6   | Trap: cobra-head aluminium 2000s+, autoroute-grey functional masts, all-LED flat globe                          | **VERIFIED**                       | Axis 4 — LEDification is correctly framed as a post-cast-iron/Art-Deco (i.e. post-1998) endpoint; the cobra-head/functional register is confirmed real but geographically walled off to the périphérique/functional-voirie system, not ordinary streets.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                |
| 7   | Cross-reference to the HLM/Vitry functional-pole register (§2, "cas Vitry")                                     | **NOT RE-HUNTED — scope-excluded** | `nearForeground` at Vitry is already excluded by ADR-0047; this hunt did not re-open it. The MEGE-Paris périphérique source (Axis 4) incidentally corroborates the general "functional mast = a different, separate system" logic this note relies on.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  |

## Prompt delta check — `docs/art/prompts-road-props.md` `[S2] lamppost`

Checked the **gate-final PASS prompt** (Nico, lead-art gate, 2026-07-19) clause by clause
against everything sourced in this hunt:

```
a tall cast-iron Haussmann-era Parisian street lamp: a fluted base flaring out at the foot,
a slender fluted shaft tapering as it rises, a single curved S-shaped swan-neck arm sweeping
outward near the very top, ending in a faceted many-sided polygonal lantern with a small
pointed cap, the lantern's facets solid opaque panels with no open lattice or see-through
gaps; ornamental antique cast-iron, elegant and slender, dark uniform painted finish, a
paler grey highlight edge along the shaft's lit side to keep the silhouette legible against
a dark night backdrop
```

- `cast-iron Haussmann-era` → matches Axis 1's confirmed lineage. No delta.
- `fluted base flaring out at the foot … slender fluted shaft tapering` → matches trait 1,
  confirmed Axis 2. No delta.
- `single curved S-shaped swan-neck arm … near the very top` → matches trait 2 (col-de-
  cygne), confirmed Axis 2 independently of the reference doc. No delta.
- `faceted many-sided polygonal lantern with a small pointed cap, solid opaque panels with
no open lattice or see-through gaps` → matches trait 3. Note: real Haussmannian lanterns
  are typically **glazed** (glass panes between metal glazing bars), not solid opaque
  panels — but the "solid opaque panels" phrasing is a **documented, deliberate,
  already-gated deviation** (game-graphist pre-prod pass flagged the open-lattice/glazing-
  bar version as an enclosed-magenta keying failure; lead-art accepted the solid-panel
  fix). This is a known and justified departure from strict period accuracy for a technical
  reason, not something this hunt's references contradict or reopen. No delta.
- `ornamental antique cast-iron, elegant and slender, dark uniform painted finish` →
  matches trait 4; paint colour correctly left as "dark uniform" per the B&W-out-of-scope
  framing. No delta.
- `paler grey highlight edge … dark night backdrop` → a render-technique addition (dark-
  on-dark legibility fix from the game-graphist pass), not reference-driven, doesn't
  conflict with anything sourced here. No delta.
- The prompt correctly contains **no claim about frequency/prevalence** ("still the norm on
  secondary streets") — that's background justification for _choosing_ this silhouette at
  all, not something that needs to appear in the prompt text itself. Its truth is what
  Axis 3 above addresses; the prompt itself doesn't need editing either way.

**Verdict: no delta — the gate-final `[S2]` prompt is consistent with every reference
sourced in this hunt.** Nothing here sends the prompt back for rework. The only open item
is evidentiary (Claim 2's exact figures, Claim 3's missing dated photo), not a prompt
defect — flagged above for `art-advisor`/`lead-art` awareness, not blocking.

---

## Hand-off

Ready for Bertrand's KEEP/DROP verdict per axis (and per claims-audit line, if he wants to
weigh in on the two open evidentiary items — the unverified 12 485→33 859 figures and the
missing dated 1998-street photo). Once validated, `lead-art` curates into the reference
library (`docs/references/art-culture.md` / `docs/art-direction/references/`) — this board
is not self-curating. Because the prompt delta check came back clean, no action is needed
from `concept-artist` on `[S2]` regardless of the verdict on Axis 1/3's evidentiary gaps —
those affect confidence in the _written claim_, not the _shipped prompt_, which was already
independently corroborated by this hunt's Axis 2/4 findings.
