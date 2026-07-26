# Reference board — tag graffiti live-paint reveal (future FX, mechanic + look)

Hunt run by `graphic-references` (Ray) on Bertrand's **direct, fully-specified brief**
(not an open scope call) — he explicitly asked to skip the interview/verdict rounds for
this hunt and go straight to a complete, well-sourced board. No round-1 questions were
relayed, no per-axis KEEP/DROP/DIG round happened yet.

**Status: VALIDÉ (Bertrand, 2026-07-26 — « Ok good refs, we keep that »), CURÉ par
`lead-art` le 2026-07-26.** Les deux axes sont entrés dans la bibliothèque canonique :
`docs/references/art-culture.md` §« FX tag live-paint — process de peinture & alphabet »,
avec la hiérarchie des sources (INA 1990 seul admissible en LOOK ; Style Wars / Vecchione /
Sofles MÉCANIQUE seulement), les garde-fous anti-clonage et anti-anachronisme, et le
registre tranché (throw-up / petite pièce). Ce board reste la trace de la chasse ; la
version citable par le crew est celle d'`art-culture.md`.

## Hunt context (brief, standing in for the interview round)

- **What it's for:** a **future** render effect — a graffiti tag that paints itself
  live in front of the player (an animated reveal, traced stroke-by-stroke /
  gesture-by-gesture, as if the can were drawing the letters in real time). **This
  effect does not exist in code yet.** This board is reference collection only —
  mechanic design and implementation belong to `dev-r3f-render` later; nothing here
  is a spec, a timing budget, or an asset.
- **Era / place:** the muf universe is Paris, 1998, `docs/art-direction.md`'s
  "photocopied fanzine B&W + acid neon" register. Paris tag graffiti (rideaux de fer,
  murs) is already a validated cultural anchor for the Rue Belliard décor
  (`docs/references/art-culture.md` §"Décor de niveau — façade Rue Belliard",
  `board-belliard-decor.md`) — this hunt does not re-curate that anchor, it
  cross-references it for the LOOK axis and adds new material for the two axes
  Bertrand asked for: (1) painting-in-progress footage (the MECHANIC: stroke order,
  timing, gesture) and (2) an alphabet construction reference (the LOOK: how a letter
  is built so it reads as graffiti, not generic type).
- **Two consumers, two axes:** `concept-artist`/`lead-art` want the alphabet axis (a
  coherent letter-construction language, house-style-correct); `dev-r3f-render` wants
  the process axis (segment/stroke order and plausible timing to animate later).
- **Avoid:** downloading/scanning any video frame, flyer, or alphabet sheet as an
  asset (describe + link only, same regime as _Prohibition_ and Paris Tonkar in
  `LICENSES.md` §1/§5); tracing or naming a living writer's hand in a future prompt;
  anachronistic surfaces (2020s legal-wall murals, laser-cut vinyl lettering,
  digital vector "graffiti font" packs) presented as if period-1998.
- **What this hunt does NOT do:** no timing numbers, no stroke count, no shader/
  animation plan — that is `dev-r3f-render`'s design work once this board is
  validated and handed off.

## Axis A — Painting-in-progress footage (the MECHANIC: stroke order, timing, gesture)

- [INA — "Rap et Tag" (France 2, _Envoyé spécial_, 19 avril 1990)](https://www.ina.fr/ina-eclaire-actu/video/cab90016065/rap-et-tag)
  (context article: [INA — "Plongée dans la vie des tagueurs du Paris des années 90"](https://www.ina.fr/ina-eclaire-actu/graffiti-rap-tag-ntm-joeystar-look-sen-bando-josephine)) —
  French national TV archive, Paris, **1990**: André tagging around the city, the
  writer BANDO, early NTM, and a filmed mural session by **Mode 2** at Paris 8
  University (Saint-Denis). The single best-anchored reference in this board: real
  Paris writers, real paint-in-progress footage, only 8 years before 1998 and still
  inside the same "wild" pre-cleanup register (Tibéri's "Opération Murs propres"
  didn't start until 1999 — same dating logic already used for Paris Tonkar in
  `art-culture.md` §Belliard). Watch for: how a mural is built up in visible layers
  over time, the working distance from the wall, the unhurried pace of a
  university-sanctioned piece versus a quick illegal tag.
- [Style Wars (1983, dir. Tony Silver, prod. Henry Chalfant) — official reference: stylewars.com](https://www.stylewars.com/) /
  [Folkstreams — Style Wars](https://www.folkstreams.net/films/style-wars) —
  the documentary corpus muf already treats as a source-document, never a thing to
  clone (per this agent's brief). NYC subway yards, early 1980s: shows the classic
  **outline → fill → highlight/3D → final black keyline** build-up on whole train
  cars in long unbroken takes, plus close hand-and-can work. Not Paris and not our
  period register visually, but the single clearest documentary demonstration of
  the layer _order_ Bertrand describes in his brief.
- ["Writers, 20 ans de graffiti à Paris" (dir. Marc-Aurèle Vecchione, 2004)](https://www.film-documentaire.fr/4DACTION/w_fiche_film/12443_0) —
  French documentary tracing the Paris scene **1983–2003** through Bando, Mode 2,
  JonOne, Futura 2000 and others — the exact scene and decade our décor already
  anchors on. Flagged here as a **lead to chase**, not a confirmed clip: this hunt
  didn't locate a legally embeddable excerpt showing a painting process in progress,
  only the film's existence and cast. Worth a direct follow-up (festival screenings,
  official DVD extras) if `lead-art` wants more Paris-specific process footage than
  the 1990 INA reel alone provides.
- [SOFLES — LIMITLESS (dir. Selina Miles, prod. Ironlak, 2013) — official page](https://ironlak.com/sofles-limitless/) —
  a warehouse hyperlapse of four writers (Sofles, Fintan Magee, Treas, Quench)
  covering walls in Brisbane, Australia. **Mechanic reference only, explicitly
  anachronistic and off-scope for look:** 2013, Australia, four named living
  artists. Useful for exactly one thing — watching the _sequencing_ of a large
  multi-panel work (sketch pass → outline pass → fill pass → highlight/3D pass →
  detail pass, repeated across several walls in parallel) at a pace a camera can
  actually follow. Never a mood or style reference; flag prominently if it ever
  reaches a prompt or shot list — no named-artist mimicry.
- [Wikipedia — Throw-up (graffiti)](<https://en.wikipedia.org/wiki/Throw_up_(graffiti)>) and
  [Wikipedia — Piece (graffiti)](<https://en.wikipedia.org/wiki/Piece_(graffiti)>) —
  no footage, but the canonical, stable, textual backbone for the layer sequence:
  a **throw-up** is two layers (outline, then a flat single-colour fill, "hollow" if
  the fill is skipped); a **piece/burner** is up to five (sketch → outline → fill →
  highlights/shadow/3D → background/details), often with a **final black keyline
  pass re-cut on top of the fill** to sharpen edges — matches Bertrand's brief
  ("outline puis fill puis highlights/3D puis contour final") almost clause for
  clause. A **tag** by contrast is usually a single continuous gesture with no
  separate fill stage at all — closer to a fast signature than a multi-layer build.
  This distinction matters for scope: Bertrand's brief describes a throw-up/piece
  build sequence, but names the effect a "tag" — worth a scope check with him before
  `dev-r3f-render` designs the mechanic (see Open question below).

_Why it serves muf:_ gives `dev-r3f-render` a real, sourced menu of what "painting
in real time" actually looks like at three different registers (documentary Paris
1990, documentary NYC 1983, modern hyperlapse) instead of one invented assumption,
plus a stable textual source for the layer order itself.
_Risk:_ INA is the only genuinely period+place-correct footage found; the Vecchione
documentary lead is unconfirmed (no verified painting-process clip located this
session); Style Wars and Sofles are both explicitly off-register (wrong city/decade)
and must stay MECHANIC-only, never LOOK.
_Licence:_ INA archive footage is copyrighted French national-archive material —
describe/link only, never download or re-encode a frame (same regime as
_Prohibition_, `LICENSES.md` §1). Style Wars is a copyrighted 1983 theatrical/PBS
documentary — reference the official site/distributor only; several unofficial
full-film uploads exist on file-sharing archives and were deliberately **not** linked
here. The Vecchione documentary is a commercial French DVD release — reference-page
only. Sofles/Ironlak/Selina Miles content is copyrighted contemporary commercial
work — describe/link only, and never mimic Sofles's or his co-writers' actual
letterforms in any future prompt.

## Axis B — Alphabet construction (the LOOK: how a letter is built so it reads as graffiti)

- [Art in Context — "How to Draw Graffiti Bubble Letters"](https://artincontext.org/how-to-draw-graffiti-bubble-letters/) —
  a generic pedagogical step-by-step (not tied to a single famous writer's hand):
  **skeleton/guideline → rounded outline → highlight shapes → colour fill → black
  keyline**, demonstrated across a near-complete alphabet set (article numbers
  progressive examples through the mid-20s). The single best structural reference
  found for defining a coherent, buildable in-game letter-construction system —
  each letter is shown as a small stack of ordered passes, which maps directly onto
  an animatable stroke/segment breakdown later. Author: Matthew Matthysen,
  Art in Context / Faessler Media — a contemporary instructional site, not period,
  but describing a technique (letter skeleton → outline → fill) that long predates
  it and is not itself dated to any era.
- [Bombing Science — "23 Mind-Blowing Graffiti Alphabets"](https://www.bombingscience.com/graffiti-alphabets-will-blow-mind/) —
  a curated gallery of 20+ named contemporary writers' full A–Z alphabet sets across
  bubble, wildstyle and straight-letter registers (Atoms, Ceaf, Izer, Meas7, Peza,
  and ~15 others, each credited by name/Instagram). Useful strictly as a **range**
  reference — how much stylization a letter can carry while staying legible as its
  base character, and how differently the same 26 letters read across bubble vs
  wildstyle vs straight-letter families. **Explicit clone-risk flag:** every
  alphabet shown is a specific living artist's authored hand — never trace or
  reference a named set directly in a prompt; use only to calibrate "how far is too
  far" for legibility, the way `art-advisor` already treats Paris Tonkar as
  texture/density reference and never a tracing source.
- [Wikipedia — Glossary of graffiti](https://en.wikipedia.org/wiki/Glossary_of_graffiti) —
  stable cross-reference for the vocabulary the two axes above assume (tag,
  throw-up, piece, burner, wildstyle, blockbuster, bombing, fill-in, hollow, keyline)
  — useful so `concept-artist`/`dev-r3f-render` share one glossary with this board
  and with `art-advisor`.
- [Art Crimes / graffiti.org](https://www.graffiti.org/) — founded May 1994 by Susan
  Farrell, the first and (for years) largest graffiti photo archive on the open web;
  by the early 2000s it held photos from 445+ cities worldwide. Flagged as a
  **period-plausible in-universe touchstone**, not just a modern retrospective site
  — it was genuinely live and being updated in 1998, the same year the muf universe
  is set in. Not independently re-browsed for specific alphabet pages this session:
  `WebFetch` returned HTTP 403 on `graffiti.org` (the same outbound-proxy block
  already logged in `board-bench.md`'s tooling note, not a source-quality problem);
  findings above come from `WebSearch` synthesis only. Flagged for a direct browse
  by someone with unblocked access before `lead-art` leans on it for specific
  alphabet or Paris-page content.
- **Cross-reference, not re-curated here:** [Paris Tonkar (Ben Yakhlef & Doriath,
  Massot, 1991)](https://archive.org/details/paris-tonkar-4-ans-de-graffitis) —
  already validated in `art-culture.md` §"Décor de niveau — façade Rue Belliard" as
  the B&W photo-documentary anchor for tagged rideaux de fer, Paris, 1987–91. This
  hunt doesn't re-curate it (see `docs/references/README.md`'s "on étend par revue,
  jamais en dumpant" rule) — it's named here only because it's the one place in the
  library that already shows _what a real 1998-era Paris tag actually looked like on
  a wall_, as opposed to the two axes above (generic construction pedagogy /
  contemporary global style range). Same licence regime as already logged
  (`LICENSES.md` §1 — book under rights, describe/study only, never scan-paste).

_Why it serves muf:_ gives `concept-artist`/`lead-art` a construction method
(Art in Context) to build a coherent, house-style letter system from, a calibration
range (Bombing Science) for how stylized a letter can go before it stops reading,
a shared glossary, and a reminder that the actual period-Paris look anchor already
lives in the library and doesn't need re-fetching.
_Risk:_ Bombing Science's alphabets are named-living-artist work — the single
sharpest clone-risk item in this board, flagged explicitly above; Art Crimes
couldn't be independently re-browsed this session (proxy block).
_Licence:_ Art in Context page is a commercial editorial site, all rights
reserved — describe/study only. Bombing Science alphabets are each individual
artists' copyrighted work, credited by name on the page — describe/study for range
only, never reproduce or trace a named set. Wikipedia per its standard CC BY-SA
licence. graffiti.org content is photographer/contributor-owned per the site's own
(unread this session) terms — reference/study only until re-verified.

## Open question for Bertrand — RESOLVED

**Decision (Bertrand, 2026-07-26): the effect targets a throw-up / small piece
register** — multi-layer build (outline → fill → highlights/3D → final contour),
not a single-gesture tag. This is the richer/longer mechanic; `dev-r3f-render`
should design the reveal around distinct outline/fill/highlight/keyline passes,
not a single continuous stroke. Keep this note when this board is superseded or
curated — it settles the scope question below, do not re-litigate.

Axis A surfaces a possible scope mismatch worth a quick check before
`dev-r3f-render` designs anything: Bertrand's brief describes a build-up with
**outline → fill → highlights/3D → final contour**, which is the documented
sequence for a **throw-up or small piece**, not a **tag** in the strict graffiti-
vocabulary sense (a tag is normally one continuous gesture, no separate fill
stage — see the Wikipedia throw-up/piece note in Axis A). Worth confirming which
register he actually wants animated: a fast one-gesture signature tag (simpler
mechanic, shorter plausible duration), or a short throw-up/piece-style build with
distinct layers (matches the "outline then fill then highlights" description more
literally, longer plausible duration). Either is a legitimate direction — this
board supports both — but the two want different stroke/segment designs later, so
naming the target now saves `dev-r3f-render` a false start.

## Hand-off

**DONE.** Bertrand validated both axes (no DROP) and called the register
(throw-up / petite pièce). `lead-art`'s curation pass landed in
`docs/references/art-culture.md` §« FX tag live-paint » on 2026-07-26 — every item
kept, each fenced (source hierarchy, MÉCANIQUE-only flags, clone-risk flag on
Bombing Science, unverified-source flag on graffiti.org / Vecchione).

Next: `concept-artist` takes Axis B for the letter-construction look, `dev-r3f-render`
takes Axis A for the reveal mechanic — both citing `art-culture.md`, not this board.
Reminder for whoever goes first: the live-paint reveal is a **runtime-composed**
visual, so it lands under `lead-art`'s in-game composite gate (verdict on real
screenshots, `verify` skill), not the asset gate — and « un halo est un dégradé,
jamais un aplat » applies to any glow on the wet paint.
