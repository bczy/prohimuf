# Pre-game copy deck — title · flyers · UNE · ours

**Author:** `narrative-designer` (Yasmine) · **Gate:** `lead-game-designer` (Karim) —
status **DRAFT, awaiting PASS** · **Date:** 2026-07-14 ·
**Story:** `_bmad-output/planning-artifacts/story-pre-game-experience-redesign.md`

This deck is the **word spec** for every pre-game surface. `game-designer` (Sacha) owns the
layout slots; this file fills them. `dev-r3f-render` transcribes the strings verbatim — no
production code here. All player-facing strings are **French**; meta/notes are English.
Period is **1998 Paris, free-party circuit** — no smartphone-era vocabulary, francs not
euros, `08 36` premium-rate infolines (authentic pattern, fictional numbers).

Voice baseline is the **shipped** register in `src/game/systems/narrativeSystem.ts`
(DISPATCH terse/imperative, KENZA field-savvy, MUF laconic). **Flyer/print copy is a
different register from dialogue**: a free-party flyer _withholds_ — cryptic, information-
minimal, never ad copy. The current subtitle `Paris Rave Clandestin` reads like marketing
and is **replaced** throughout.

---

## Amendment log

A gated deck carries its corrections visibly. Every entry below names its date, its author
and the gate that ordered it; superseded text is struck through in place, never deleted.

**Amendment round 1 — 2026-08-05 · `narrative-designer` (Yasmine) · ordered by condition
**K-1** of the `lead-game-designer` PASS WITH CHANGES on
`decision-flyer-crew-emblems-fiction.md` (Karim, 2026-08-05, PR #145, branch
`claude/flyer-wall-float-in-animation`).**

Why: `FLYER_EMBLEMS` in `src/render/ui/menu/FlyerMotif.tsx` attributes one identity mark per
flyer. Two of those attributions diverged from this deck, and a third and fourth surface
(the tutorial, the finale) were never covered here at all. A gated doc contradicted by
shipped code is drift; K-1 closes it by moving the corrections into the canon itself.

| #   | Section     | Change                                                                                              |
| --- | ----------- | --------------------------------------------------------------------------------------------------- |
| A-1 | §2.1        | Records explicitly that the tutorial flyer carries **no crew emblem** (net-new: never stated here). |
| A-2 | §2.3        | Motif `biohazard` → **concentric rings**, re-motivated on the crew's own ground.                    |
| A-3 | §2.4        | Motif `acid smiley` → **plumb bob**, re-motivated on the sign-IS-the-name logic.                    |
| A-4 | §2.6 (new)  | Records the finale sheet's **chandelier** mark, sourced to the finale spec §1.3.                    |
| A-5 | §9.2 (new)  | Crew↔motif table, one row per sheet — including the two sheets that have no crew.                   |
| A-6 | §9.2 → §9.3 | Former §9.2 "Owed follow-ups" renumbered §9.3 to make room for A-5. No content change.              |
| A-7 | §2.2        | Logs the spiral **as homage** to Spiral Tribe (unchanged motif, missing provenance).                |

**A-2 and A-3 are not word swaps.** The superseded motifs each carried their own
justification — the biohazard was argued from the warehouse/industrial register, the acid
smiley from "euphoria over the melancholy". Neither reason transfers to its replacement, so
both paragraphs are rewritten around the new sign's own logic rather than edited in place.
The struck-through originals stay so the reasoning that was replaced is still legible.

**Flag, not amended (needs Karim, not me).** The header of this deck still reads
`status **DRAFT, awaiting PASS**` while `docs/game-design/README.md` records it as
**PASS w/ conditions** 2026-07-14 (`pre-game-design-gate.md`) and K-1 itself calls it gated
canon. The status line is stale, but granting a PASS is not the author's to write — left to
`lead-game-designer`.

---

## 0. Canonical naming decisions (quick reference)

| Thing                                             | Decision                                      | Notes                                                                            |
| ------------------------------------------------- | --------------------------------------------- | -------------------------------------------------------------------------------- |
| Fanzine (the UI world)                            | **UNDERGROUND PARIS** — _fanzine clandestin_  | Already shipped in masthead; kept as canon.                                      |
| Entry action (replaces `[ CLIQUER POUR ENTRER ]`) | **`[ COMPOSE L'INFO-LINE ]`**                 | Diegetic: you call the répondeur for the point de RV.                            |
| Cover info-line number                            | **08 36 23 98 23**                            | `23` motif + `98` year. Fictional, `08 36` period pattern.                       |
| Belliard crew / sound system                      | **SPIRALE 23**                                | spiral + `23` motifs.                                                            |
| Stalingrad crew                                   | **KANAL SYSTEM**                              | canal warehouse; teuf `K` spelling.                                              |
| Vitry crew                                        | **NADIR 94**                                  | dark register (matches the haunted Vitry post-scene) + dept `94`.                |
| Tutorial                                          | **no crew** — hand-annotated "première" flyer | The only flyer with **no** info-line (you're already there).                     |
| Scores tabloid (the UNE)                          | **PARIS-MINUIT**                              | Fictional establishment night-tabloid — deliberate foil to the underground zine. |
| Options screen                                    | **OURS** (the print colophon)                 | Cast credited as the "rédaction".                                                |

**New canon flag:** the three crew names and `PARIS-MINUIT` are **net-new named entities**
not in any shipped source. Conscious documented extension (ADR-0012 precedent). They belong
in a future `narrative-bible.md`; listed in §8 for Karim's PASS.

---

## 1. Zine cover / title (`StartScreen` successor)

Single entry action = **call the info-line**. Layout slots map to the current `StartScreen`.

| Slot                             | Copy (French)                                                    | Max     | Replaces                                               |
| -------------------------------- | ---------------------------------------------------------------- | ------- | ------------------------------------------------------ |
| Masthead top strip               | `UNDERGROUND PARIS · FANZINE CLANDESTIN · N°23 · NE SE VEND PAS` | 60 car. | `…— N°1 — GRATUIT`                                     |
| Issue label                      | `★ HIVER 1998 ★`                                                 | 20 car. | kept                                                   |
| Main title                       | `MUF`                                                            | —       | kept (fixed)                                           |
| **Subtitle**                     | `UN SON · UNE NUIT · PAS D'ADRESSE`                              | 34 car. | **`Paris Rave Clandestin`** (marketing → withheld)     |
| Year tag                         | `1998 · PÉRIPHÉRIE & ARRONDISSEMENTS`                            | 38 car. | `1998 — Banlieues & Arrondissements`                   |
| Teaser line 1                    | `► Les toits parlent. Les fenêtres tirent.`                      | 42 car. | `► Tireurs aux fenêtres : qui sont-ils ?`              |
| Teaser line 2                    | `► Un colis. Une sono. Zéro adresse.`                            | 42 car. | `► Carte exclusive : Stalingrad — 19e`                 |
| Teaser line 3                    | `► Récupère · Livre · Esquive`                                   | 42 car. | `► Survive. Livre. Esquive.` (aligns to the core loop) |
| Info-line row                    | `☎ INFO-LINE · 08 36 23 98 23`                                   | 30 car. | (new)                                                  |
| **CTA (blinking)**               | `[ COMPOSE L'INFO-LINE ]`                                        | 26 car. | **`[ CLIQUER POUR ENTRER ]`**                          |
| Micro-copy (optional, under CTA) | `le répondeur donne le point de RV`                              | 40 car. | (new)                                                  |

Teaser bullets use `►` as shipped. Line 3 restates the core loop `Récupérer → Livrer →
Éviter` in the imperative — the one place the loop is spelled out on the cover.

---

## 2. Level-select flyers (`MainMenu` levels tab → flyer stack)

One flyer per entry in `levels.ts`, each with its own crew identity. A flyer **withholds
the address** — the exact street lives behind the info-line (revealed on the pre-level
briefing / in-game), never on the print. Fields map to the existing card slots
(`level.name`, `level.district`, `level.year`) plus flyer flavor slots the redesign adds.

**Difficulty tag** — `LevelCard` derives the stamp `FACILE / NORMAL / DIFFICILE` from
`enemySpeedMultiplier` (standardized on **NORMAL** for the middle tier, gate f2). The shipped
render label at `MainMenu.tsx:170` currently reads `MOYEN`; aligning it to `NORMAL` is a
one-word, in-scope render change (no data touch) owned by the render dev. Flyer flavor label
(AMBIANCE) sits alongside the stamp (display only, data unchanged). With shipped data only
`FACILE` (belliard) and `DIFFICILE` (stalingrad, vitry) ever render — the middle tier is
latent (see §2.3).

### 2.1 Tutoriel — `tutorial` (district `Repérage`, 1998)

In-fiction: **not a gig** — a photocopied _old_ flyer that DISPATCH marked up by hand to
teach Muf. The margins carry handwriting; `23` is circled; an arrow points to "commence
ici". **This is the only flyer with no info-line** — you don't call, you're already there.

| Slot                               | Copy (French)                 | Max             |
| ---------------------------------- | ----------------------------- | --------------- |
| Title (`level.name`)               | `Tutoriel`                    | (fixed by data) |
| Stamp over the title               | `REPÉRAGE`                    | 12 car.         |
| Handwritten note (DISPATCH's hand) | `ta première — lis tout — D.` | 34 car.         |
| Crew slot                          | `SANS SYSTÈME · AVANT LE SON` | 28 car.         |
| RV line                            | `RV : ici, maintenant`        | 22 car.         |
| Info-line slot (struck out)        | `pas besoin d'appeler`        | 24 car.         |
| Menu badge (kept from ADR-0012)    | `TUTORIEL`                    | 10 car.         |

> **Amendment A-1 (2026-08-05, Yasmine — K-1).** **This sheet carries no crew emblem.** The
> four gig flyers each take one stamp (§9.2); this one takes none, and that absence is the
> design, not a gap waiting to be filled. `SANS SYSTÈME · AVANT LE SON` means the sheet is
> **unsigned** — Muf has no system yet — and an unsigned sheet takes no stamp. It is the same
> withholding as the struck-out info-line one row above: this flyer's whole fiction is _not
> affiliated yet_, so any scene badge on it would be denied by its own crew slot.
> The only mark it carries is DISPATCH's hand — the circled `23` and the arrow already
> written into this section's preamble, which is handwriting, not a stamp.
> Consequence in code: the sheet is simply **absent** from `FLYER_EMBLEMS`, which is that
> table's documented contract for "no motif". Not a fallback — the specified state.

### 2.2 Rue Belliard — `belliard` (19e, 1998) · **FACILE**

| Slot                       | Copy (French)                | Max     |
| -------------------------- | ---------------------------- | ------- |
| Crew / sound system        | `SPIRALE 23`                 | 16 car. |
| Level title (`level.name`) | `Rue Belliard`               | (fixed) |
| Slogan / teaser            | `LE SON MONTE PAR LES TOITS` | 30 car. |
| Date line                  | `SAM. → DIM. · 23H → ?`      | 24 car. |
| Zone line                  | `QUELQUE PART DANS LE 19e`   | 28 car. |
| RV line                    | `RV : SUR L'INFO-LINE`       | 24 car. |
| Info-line                  | `08 36 23 19 98`             | 18 car. |
| Flavor difficulty          | `AMBIANCE : ÇA ROULE`        | 22 car. |

Motifs: **spiral**, `23`, "no logo". `19` = arrondissement, `98` = year.

> **Amendment A-7 (2026-08-05, Yasmine — K-1).** The motif is unchanged; what was missing is
> its provenance. The spiral and the number `23` are **an homage to Spiral Tribe**, the sound
> system that carried the free-party circuit into France after Castlemorton and to whom the
> `23` belonged. That is exactly what a fictional French crew of 1998 would be doing, and a
> spiral and a number are common cultural property, not marks anyone owns — so this sits on
> the same legal footing as _l'Éden_ and the `08 36` numbers.
> **Recorded so it is never "sharpened".** A later contributor must not push this mark toward
> the real collective's actual artwork: that would turn a nod into appropriation. It is a
> nod, drawn in this zine's own hand, and it stays one.
> Note also that this deck lists the spiral as a motif on all three gig flyers (§2.2/§2.3/
> §2.4) — a shared scene sign, like the `23`. Its use as SPIRALE 23's **exclusive** stamp is
> legitimate only because that crew's name claims it; do not later read this as
> "spiral = Belliard only".

### 2.3 Stalingrad — `stalingrad` (19e, 1998) · **DIFFICILE**

| Slot                       | Copy (French)                 | Max     |
| -------------------------- | ----------------------------- | ------- |
| Crew / sound system        | `KANAL SYSTEM`                | 16 car. |
| Level title (`level.name`) | `Stalingrad`                  | (fixed) |
| Slogan / teaser            | `UN ENTREPÔT · UN MUR DE SON` | 30 car. |
| Date line                  | `NUIT ENTIÈRE · 00H → AUBE`   | 26 car. |
| Zone line                  | `BORDS DU CANAL · 19e`        | 24 car. |
| RV line                    | `RV : SUR L'INFO-LINE`        | 24 car. |
| Info-line                  | `08 36 23 95 19`              | 18 car. |
| Flavor difficulty          | `AMBIANCE : CHAUD`            | 22 car. |

~~Motifs: **biohazard** (warehouse/industrial), spiral, `23`.~~ **Superseded by A-2.**
Info-line `95` nods to KENZA's shipped line _"Ils ont des planques là-dedans depuis '95"_
(unchanged).

Motifs: **concentric rings** (canal ripple / speaker wavefront), spiral, `23`.

> **Amendment A-2 (2026-08-05, Yasmine — K-1).** The rings are not a redressing of the
> biohazard; they are a different argument, so the motivation is rewritten rather than
> patched.
> **What the rings say.** Concentric rings read two ways at once, and both are this crew's
> own: **ripples on the canal** — KANAL SYSTEM carries the water in its name and this flyer
> states `BORDS DU CANAL · 19e` — and a **speaker cone / wavefront**, which is the slogan
> `UN ENTREPÔT · UN MUR DE SON` drawn instead of written. One shape that means the place and
> the sound at once is a crew mark; that is what a stamp is for.
> **Why the biohazard went.** It was period-plausible (it belonged to the hardcore/gabber and
> early-tekno visual stock) but it was **borrowed**: it said "industrial" in general and
> nothing about _this_ crew in particular, and it dragged a toxic/danger connotation onto a
> party whose written register here is welcoming — `RV : SUR L'INFO-LINE`, a whole night
> `00H → AUBE`. Wrong tone, no ownership. That is the author's own misjudgement, corrected.
> Ground: `decision-flyer-crew-emblems-fiction.md` §2.2 (PASS w/ condition C1). Slot `mid`.

> **Difficulty read (data-true).** With shipped `enemySpeedMultiplier`
> (`>1.2 → DIFFICILE`), Stalingrad (`1.3`) stamps **DIFFICILE**, same as Vitry (`1.6`). The
> two hard gigs are therefore **not** discriminated by the stamp — the felt difference is
> carried by the **AMBIANCE gradient (`CHAUD` < `BRÛLANT`) + district**: Stalingrad is
> `CHAUD` in the 19e, Vitry is `BRÛLANT` in the 94. No shipped level renders the middle
> tier, so `NORMAL` never surfaces in-game (it exists only as a latent label). Re-tuning
> `levels.ts` to force a middle-tier stamp is forbidden (AC4, byte-unchanged).

### 2.4 Vitry — 94 — `vitry` (Val-de-Marne, 1998) · **DIFFICILE**

| Slot                       | Copy (French)                      | Max     |
| -------------------------- | ---------------------------------- | ------- |
| Crew / sound system        | `NADIR 94`                         | 16 car. |
| Level title (`level.name`) | `Vitry — 94`                       | (fixed) |
| Slogan / teaser            | `AU PIED DES BARRES · SON MAXIMAL` | 32 car. |
| Date line                  | `JUSQU'AU LEVER DU JOUR`           | 24 car. |
| Zone line                  | `VAL-DE-MARNE · 94 · TU CONNAIS ?` | 34 car. |
| RV line                    | `RV : SUR L'INFO-LINE`             | 24 car. |
| Info-line                  | `08 36 23 94 09`                   | 18 car. |
| Flavor difficulty          | `AMBIANCE : BRÛLANT`               | 22 car. |

~~Motifs: **acid smiley** (euphoria over the melancholy), spiral, `23`.~~
**Superseded by A-3.**

Motifs: **plumb bob** (the nadir; the mason's tool of the barres), spiral, `23`.

> **Amendment A-3 (2026-08-05, Yasmine — K-1).** Again a different argument, not a different
> word. The smiley's reason was contrast — euphoria laid over the melancholy. The plumb bob's
> reason is identity, and it does the same emotional work more specifically.
> **The sign IS the name.** A plumb bob is a weight on a line that points, by gravity and
> nothing else, straight down — at the **nadir**. The mark arrives at the crew's name by
> physics rather than by illustration, which makes it rhyme with SPIRALE 23's spiral: the two
> denotative marks of the set, so the wall reads as one printing.
> **It is period- and class-true.** A plumb bob is a mason's and builder's tool — the sign of
> the people who poured the barres. On the flyer for `AU PIED DES BARRES · SON MAXIMAL`, in
> the 94, it belongs to the place as no astronomical or acid symbol would. It is a tool, not a
> scene badge, which suits a crew defined by its soundman (DJ Masta Klem, §9.1) rather than by
> its affiliation.
> **It carries the grief without narrating it.** Vitry is the level where the loop stops and
> Muf goes quiet — « Ma mère habitait au 9e. Fenêtre du coin. » « J'aurais pas dû revenir. » A
> plumb line hangs, pulls down and finds the bottom. The sheet holds the weight of the
> post-scene before the player has read it, and never says so.
> **The smiley leaves the set entirely and is reassigned nowhere.** It is the scene's most
> loaded sign — acid house 1988, the Second Summer of Love, and by the mid-90s the free-party
> circuit's inherited badge: it always asserts _there is a system here_. On this sheet the
> plumb bob now does its job better; on any other it would be a scene affiliation with no crew
> behind it, which is decoration, and this zine does not decorate. It is not in the motif
> vocabulary any more.
> **Slot `hero` — defended.** NADIR 94 is the one sheet led by its image: the bob hangs across
> the top and the lettering starts under it. On the flyer for the heaviest level the image
> outranks the words and physically presses them down the page. Do **not** normalise Vitry to
> `mid`/`body` for consistency; the asymmetry is the point.
> Ground: `decision-flyer-crew-emblems-fiction.md` §2.3 + §2.4 (PASS, condition C1b).

Zone line echoes KENZA/MUF's shipped exchange (_"Tu connais ?" / "J'ai grandi là-bas."_). Info-line ends
`09` = the 9th floor of the shipped Vitry post-scene (_"Ma mère habitait au 9e"_) —
**intentional deep-cut, not a typo** (§8).

### 2.5 Locked flyers (any `unlocked: false` gig)

Diegetic logic: a crew only **opens its line** once you're vouched for — i.e. once the
previous gig is bouclé. So a locked flyer shows the crew name (the player sees what's next)
but the details are withheld: torn / face-down / line dead.

| Slot              | Copy (French)                                    | Max     | Replaces     |
| ----------------- | ------------------------------------------------ | ------- | ------------ |
| Locked badge      | `LIGNE FERMÉE`                                   | 14 car. | `VERROUILLÉ` |
| Date line         | `DATE À VENIR`                                   | 16 car. | —            |
| RV line           | `RV : INCONNU`                                   | 18 car. | —            |
| Info-line slot    | `08 36 · · · · · — LIGNE MUETTE`                 | 30 car. | —            |
| Overlay stamp     | `PAS ENCORE POUR TOI`                            | 22 car. | —            |
| Helper micro-copy | `la ligne ouvre quand la précédente est bouclée` | 48 car. | —            |

**Art suggestion (not a fait accompli — art flow owns it):** locked flyer rendered
_torn or face-down_ so only the crew name + `LIGNE FERMÉE` read. Crew name stays legible;
everything else is the tear.

### 2.6 Niveau Final — `niveau-final` (l'Éden, 31 déc. 1999) · **mark only**

> **Amendment A-4 (2026-08-05, Yasmine — K-1).** New section. This deck was written when only
> the four 1998 gigs existed, so the finale sheet has no copy table here — **its player-facing
> copy is authored and gated in `spec-niveau-final-fiction.md` §4.1 (`PLAYABLE_COPY`) and is
> not restated or duplicated in this deck.** K-1 requires only one thing to land here: the
> sheet's **mark**, so the next reader finds the whole emblem set in one place (§9.2).

**Mark: the chandelier**, reduced to a sign — a radiating pendant, a hub on a rod with its
branches thrown out and down. Slot `body`.

The ground is `spec-niveau-final-fiction.md` §1.3: l'Éden's own fixture, « **le lustre
d'origine de l'Éden — le vieux monde suspendu au-dessus de la fête** », listed there as
belonging to _la salle (le passé)_. Three things follow, and all three are why it is the
right mark:

- **It is the venue's mark, not a crew's.** L'Éden is a **Lieu**, never a collectif — the
  building's own dead marquee, the name still bolted over a door the underground moved in
  under without renaming. §9.1's standing rule (a crew is a collective) is therefore not
  violated: this sheet is signed by **the hall**. There is no sound system called L'Éden.
- **It is period-true and it is the level's subject.** An inter-war dancing — parquet,
  balcony, one heavy chandelier still hanging — on the night the century turns: the old world
  overhead while the last night of it plays underneath.
- **It pays off in-game.** The same object the room turns against le Commandant, so the flyer
  the player skimmed in the menu comes back as a weapon.

Register constraint (§3 of the decision doc applies here as everywhere): a **stamp**, not a
logo — hand-cut, off-register, ink-starved. Nothing on this mark glows; the rays are
branches, not light.

---

## 3. Scores — the UNE (`MainMenu` scores tab → tabloid front page)

The high-score view is a **fictional establishment night-tabloid**, `PARIS-MINUIT` — the
straight press horrified by the underground, a deliberate foil to the zine cover. Scores are
**per-level** in code (`ScoresTab` selects one level), so the UNE is one _édition_ per gig;
the headline reads off the **top entry** (`scores[0]`).

### 3.1 Masthead

| Slot                 | Copy (French)                           | Max     |
| -------------------- | --------------------------------------- | ------- |
| Title                | `PARIS-MINUIT`                          | 16 car. |
| Masthead line        | `LE QUOTIDIEN QUI VEILLE · 1F50 · 1998` | 42 car. |
| Kicker (per édition) | `RUBRIQUE FAITS DIVERS — {levelName}`   | 40 car. |

`1F50` = one franc fifty (francs, pre-euro — period-correct for 1998).

### 3.2 Lead story (built from `scores[0]`)

| Slot        | Formula (French)                            | Max           | Placeholders |
| ----------- | ------------------------------------------- | ------------- | ------------ |
| Over-kicker | `NOTRE ENVOYÉ SPÉCIAL Y ÉTAIT`              | 32 car.       | —            |
| Headline    | `NUIT BLANCHE : {score}`                    | 24 car. (big) | `{score}`    |
| Subhead     | `{wave} vagues de bleus, et le son a tenu.` | 46 car.       | `{wave}`     |

`{score}` and `{wave}` are the top row's fields. The tabloid reframes gameplay values as
_faits divers_: the delivery-defense score becomes the sensational figure; `wave` becomes
"vagues de bleus" (police assaults survived) — consistent with the loop, no data change.

### 3.3 Column headers (the records table)

| Data column | Header (French) | Max    |
| ----------- | --------------- | ------ |
| `#` (rank)  | `N°`            | 4 car. |
| `score`     | `BUTIN`         | 8 car. |
| `wave`      | `ASSAUTS`       | 8 car. |
| `date`      | `NUIT DU`       | 8 car. |

### 3.4 Empty state (replaces `AUCUN SCORE ENREGISTRÉ`)

| Slot     | Copy (French)                         | Max     |
| -------- | ------------------------------------- | ------- |
| Big line | `AUCUN MÉFAIT SIGNALÉ`                | 24 car. |
| Subline  | `La rue a été calme. Pour l'instant.` | 40 car. |

The level-selector buttons (kept from `ScoresTab`) read as **choosing the édition** — no
copy change needed beyond the surrounding masthead framing.

---

## 4. Options — the OURS / colophon (`MainMenu` prefs tab)

An "ours" is the French print colophon — the back-page block naming who made the zine and
how it's printed. OPTIONS **is** that colophon, with the settings living inside it. The cast
is the "rédaction" — ties the settings screen to the fiction without inventing a mechanic.

### 4.1 Colophon framing

| Slot                                         | Copy (French)                  | Max          |
| -------------------------------------------- | ------------------------------ | ------------ |
| Section title                                | `OURS`                         | 10 car.      |
| Subtitle                                     | `l'ours du fanzine · réglages` | 30 car.      |
| Colophon body (static block, ~5 short lines) | see below                      | 44 car./line |

```
UNDERGROUND PARIS — fanzine clandestin
Rédaction : DISPATCH · KENZA · MUF
Tirage : 23 exemplaires photocopiés
Ne se vend pas. Ne se jette pas. Se passe.
Ni pub, ni logo, ni adresse.
```

### 4.2 Settings labels (map to `Prefs` — data byte-unchanged, AC4)

| `Prefs` field | New label (French) | Sub-hint (French)                   | Replaces         |
| ------------- | ------------------ | ----------------------------------- | ---------------- |
| `soundVolume` | `BRUITS DE RUE`    | `tirs & sirènes`                    | `VOLUME SFX`     |
| `musicVolume` | `LA SONO`          | `le son du système`                 | `VOLUME MUSIQUE` |
| `lives` (1–5) | `VIES`             | `combien de fois tu te relèves`     | `VIES` (kept)    |
| `difficulty`  | `PRESSION`         | `à quel point les flics te collent` | `DIFFICULTÉ`     |

`difficulty` values stay **`FACILE / NORMAL / DIFFICILE`** (the code's display strings) for
instant readability. _Optional_ flavored variant if art/GD wants more texture:
`PEINARD / RÉGLO / BRÛLANT` — **not recommended over the clear labels**; offered only as a
fallback. Behavior/schema untouched either way.

---

## 5. Shared frame copy + NarrativeScreen note

### 5.1 Canonical masthead (one source of truth — pairs with AC3 palette single-source)

Recommend `dev-r3f-render` source these two strings from one shared module, not per-file:

- **Full masthead (cover):** `UNDERGROUND PARIS · FANZINE CLANDESTIN · N°23 · NE SE VEND PAS`
- **Running masthead (menu header, narrative header strip):** `UNDERGROUND PARIS · FANZINE CLANDESTIN · 1998`

Today three files re-declare near-identical strings with `—` dashes:
`StartScreen` (`…N°1 — GRATUIT`), `MainMenu` header (`UNDERGROUND PARIS — 1998`),
`NarrativeScreen` header (`…FANZINE CLANDESTIN — 1998`). Unify punctuation to `·` for one
visual system.

### 5.2 NarrativeScreen — frozen scripts, one frame touch (flag, not a rewrite)

`NarrativeScreen` **dialogue is frozen** (story constraint) — the pre/post/tutorial scripts
in `narrativeSystem.ts` are **not** touched by this deck. The **only** frame-copy note: its
header strip string (`UNDERGROUND PARIS — FANZINE CLANDESTIN — 1998`) should adopt the §5.1
running-masthead string so all three pre-game surfaces read as one printing. No script,
speaker, or line changes.

### 5.3 Index / sommaire labels (gate g2 — confirmed)

The three index-tab labels the UX spec references (`[RUBRIQUE_NIVEAUX]`,
`[RUBRIQUE_SCORES]`, `[RUBRIQUE_OPTIONS]`) **keep the shipped baseline** — this is the zine's
_sommaire_, the navigation index, and is deliberately distinct from each surface's own
masthead (flyer wall / `PARIS-MINUIT` / `OURS`):

| UX slot              | Label (French) | Max     | Opens surface           |
| -------------------- | -------------- | ------- | ----------------------- |
| `[RUBRIQUE_NIVEAUX]` | `NIVEAUX`      | 12 car. | flyer stack (§2)        |
| `[RUBRIQUE_SCORES]`  | `SCORES`       | 12 car. | UNE — PARIS-MINUIT (§3) |
| `[RUBRIQUE_OPTIONS]` | `OPTIONS`      | 12 car. | OURS / colophon (§4)    |

No change from shipped `NIVEAUX / SCORES / OPTIONS`: they are the plain, glanceable index;
the flavour lives in the surfaces they open, not the tabs.

---

## 6. Fit / max-length summary

Every string above carries an explicit `car.` ceiling sized to the existing slot font/box
(`StartScreen` clamp fonts, `LevelCard` 22px title + 10px meta, `ScoresTab` monospace table,
`PrefsTab` 11px labels). Longest at-risk strings: cover masthead (60), locked helper
micro-copy (48), UNE subhead (46). If a slot proves tighter at mobile size, the **fallbacks**
are: masthead → drop `· N°23 · NE SE VEND PAS`; helper → `la ligne ouvre plus tard`; subhead
→ `Les bleus ont dansé aussi.` Confirm final boxes with `game-designer`'s slot spec.

---

## 7. Loop / scope compliance

- **Cahier des charges:** presentation only — no mechanic, no level, no system. Faithful to
  guidelines §5 (UI Fanzine: cover / flyer stack / UNE) and the story's AC2. PASS.
- **`une mission = 3-5 min` / `< 10 s` to gameplay:** the info-line CTA is still a single
  action; flyers are read-at-a-glance; nothing here gates the loop.
- **Period authenticity:** francs (`1F50`), `08 36` infolines, répondeur/point-de-RV, "no
  logo" ethos — zero smartphone-era or post-2002 vocabulary.

---

## 8. Fiction conflicts & flags (for Karim's PASS)

1. **NET-NEW canon** — `SPIRALE 23`, `KANAL SYSTEM`, `NADIR 94`, and the tabloid
   `PARIS-MINUIT` are new named entities. Consistent with (never contradicting) shipped
   dialogue, but they need explicit PASS as canon and a home in a future `narrative-bible.md`.
2. **No bible/characters doc exists yet** — this deck was written against the shipped scenes
   as the de-facto bible. Recommend a follow-up to formalize `narrative-bible.md` +
   `characters.md`, folding in these crews and the still-unbuilt guidelines §7 contacts
   (DJ Masta Klem, Faïza, Seb le Blond, Oxane, Karim "Le Mécano") + the final `31 déc 1999`
   level — **all out of scope here**; only the four shipped levels are covered.
3. **Middle-tier label standardized on `NORMAL` (gate f2, RESOLVED)** — the deck now uses
   `NORMAL` deck-wide. Shipped `MainMenu.tsx:170` renders the middle tier as `MOYEN`; the gate
   authorizes the one-word render alignment `MOYEN → NORMAL` (in-scope, no data touch, owned by
   the render dev). With shipped `enemySpeedMultiplier` (belliard `1.0`, stalingrad `1.3`, vitry
   `1.6`; `>1.2 → DIFFICILE`, `>1.0 → NORMAL`, else `FACILE`) **no shipped level renders the
   middle tier** — Stalingrad and Vitry both stamp `DIFFICILE` (see §2.3). The two hard gigs are
   differentiated by the **AMBIANCE gradient (`CHAUD` < `BRÛLANT`) + district**, not the stamp.
   Re-tuning `levels.ts` to force a middle-tier stamp is forbidden (AC4).
4. **Tutorial breaks the info-line pattern on purpose** — it is the only flyer with no
   number ("you're already here"). Intentional; reinforces info-line = travel to a real gig.
5. **Vitry info-line `…94 09`** encodes the 9th-floor callback from the shipped Vitry
   post-scene. Intentional deep-cut, not a data error.
6. **UNE is per-level** — `ScoresTab` is per selected level, so the headline formula reads
   the selected level's `scores[0]`. Confirm `game-designer`'s layout exposes `levelName` +
   top `{score}`/`{wave}` to the headline/subhead slots.
7. **`08 36` numbers are fictional** on the authentic 1998 French premium-rate pattern —
   legal-safe per the story brief (no real number, no trademark).

---

## 9. Gated canon — seed for `narrative-bible.md` (gate f1)

Passed by the design gate as a **conscious, documented extension** (ADR-0012 precedent). No
bible exists yet; this section is the authoritative seed so the names do not drift, and it
is the record a future `narrative-bible.md` folds in. **Entity classes are kept separate on
purpose — no collision:**

- **Cast (handlers on the burner phone)** — MUF, DISPATCH, KENZA. The player's crew: they
  brief and route Muf. Established in shipped `narrativeSystem.ts`; unchanged here.
- **Sound systems (the collectives throwing the teufs Muf delivers to)** — a _different_
  entity class from both the cast and the §7 recruitable contacts. A flyer must name
  _something_ to read as a flyer; these are that something.
- **Recruitable contacts (guidelines §7)** — individuals Muf recruits (DJ Masta Klem, Faïza
  "La Logiste", Seb le Blond, Oxane, Karim "Le Mécano"). Not yet in-game; **out of scope**
  here. Logged only so the bridge below prevents a future name clash.

### 9.1 Crew ↔ §7-contact bridge (so a future bible does not collide)

| Sound system     | Level / zone       | Related §7 contact (future)                               | Relationship (seed)                                                                                  |
| ---------------- | ------------------ | --------------------------------------------------------- | ---------------------------------------------------------------------------------------------------- |
| **SPIRALE 23**   | Rue Belliard (19e) | _none_ — entry crew, no §7 anchor                         | The first gig; clean of any §7 individual, no collision risk.                                        |
| **KANAL SYSTEM** | Stalingrad (19e)   | Faïza "La Logiste" (Organisation / Lieux, Stalingrad 19e) | Faïza books & hosts KANAL SYSTEM's canal warehouse — she is the _logiste_ of the crew, not the crew. |
| **NADIR 94**     | Vitry — 94         | DJ Masta Klem (Sonorisateur, Vitry 94)                    | Masta Klem runs NADIR 94's sound — he is a member/soundman of the crew, not the crew.                |

Rule for the future bible: a **crew** is a collective; a **contact** is an individual who
belongs to or serves a crew. Never merge a crew name with a contact name.

### 9.2 Sheet ↔ mark (the emblem set) — Amendment A-5

> **Amendment A-5 (2026-08-05, Yasmine — K-1).** New section. **Five sheets, four marks.**
> One row per sheet, including the two that have no crew, so the next reader never has to
> re-derive this map by reading the SVG. Each mark is UNIQUE across the wall: repeating one
> turns a signature into wallpaper.

| Sheet           | Level id       | Crew / owner     | Mark                 | Slot   | Fiction ground                                                           |
| --------------- | -------------- | ---------------- | -------------------- | ------ | ------------------------------------------------------------------------ |
| Tutoriel        | `tutorial`     | — (unsigned)     | **none**             | —      | `SANS SYSTÈME · AVANT LE SON` — an unsigned sheet takes no stamp (§2.1). |
| Rue Belliard    | `belliard`     | `SPIRALE 23`     | **spiral**           | `body` | The name IS the sign; logged **as homage** to Spiral Tribe (§2.2).       |
| Stalingrad      | `stalingrad`   | `KANAL SYSTEM`   | **concentric rings** | `mid`  | Canal ripple + speaker wavefront — the crew's own ground (§2.3).         |
| Vitry — 94      | `vitry`        | `NADIR 94`       | **plumb bob**        | `hero` | A plumb bob points at the nadir: the sign IS the name (§2.4).            |
| L'Éden (finale) | `niveau-final` | la salle (venue) | **chandelier**       | `body` | The hall's own fixture — `spec-niveau-final-fiction.md` §1.3 (§2.6).     |

Two rules this table encodes, both binding on any future contributor:

- **A mark belongs to an owner.** Four of the five sheets have one (three crews, one venue).
  The fifth has none, and therefore has no mark. An emblem with no owner is decoration.
- **`hero` is not a style choice.** Only Vitry leads with its image (§2.4). Do not normalise
  it, and do not promote another sheet to `hero` here — wall rhythm across the five sheets is
  a composition question owned jointly by `lead-art` and `ux-designer`, deferred to their
  pile-repli pass, not settled in this deck.

Two motifs that are **out of the vocabulary**, recorded so neither comes back by accident:
the **acid smiley** (no owner in this fiction — A-3) and the **biohazard** (borrowed, says
nothing about KANAL SYSTEM — A-2). The rings, the plumb bob, the spiral and the chandelier
are the whole set.

### 9.3 Owed follow-ups (not actioned in this deck)

- Mirror this gated-canon list into `docs/game-design/README.md` (gate f1) — owed, and left
  to the orchestrator/lead since this pass edits **only** the copy deck.
- Open a story to seed `narrative-bible.md` + `characters.md`, folding in §9 plus the §7
  contacts and the `31 déc 1999` final level. Out of scope here.
