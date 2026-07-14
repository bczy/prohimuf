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

**Difficulty tag** — `LevelCard` derives `FACILE / MOYEN / DIFFICILE` from
`enemySpeedMultiplier`. Flyer flavor label sits alongside it (display only, data unchanged).

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

### 2.3 Stalingrad — `stalingrad` (19e, 1998) · **MOYEN**

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

Motifs: **biohazard** (warehouse/industrial), spiral, `23`. Info-line `95` nods to KENZA's
shipped line _"Ils ont des planques là-dedans depuis '95"_.

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

Motifs: **acid smiley** (euphoria over the melancholy), spiral, `23`. Zone line echoes
KENZA/MUF's shipped exchange (_"Tu connais ?" / "J'ai grandi là-bas."_). Info-line ends
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
3. **Existing difficulty-label inconsistency (pre-existing, flag only)** — `LevelCard`
   renders the middle tier as `MOYEN`; `PrefsTab` and the `Prefs` value use `NORMAL`. This
   deck standardizes new copy on `NORMAL`. `MOYEN` is the odd one out; a dev _may_ align it,
   but it is shipped copy — I flag, I do not rewrite it.
4. **Tutorial breaks the info-line pattern on purpose** — it is the only flyer with no
   number ("you're already here"). Intentional; reinforces info-line = travel to a real gig.
5. **Vitry info-line `…94 09`** encodes the 9th-floor callback from the shipped Vitry
   post-scene. Intentional deep-cut, not a data error.
6. **UNE is per-level** — `ScoresTab` is per selected level, so the headline formula reads
   the selected level's `scores[0]`. Confirm `game-designer`'s layout exposes `levelName` +
   top `{score}`/`{wave}` to the headline/subhead slots.
7. **`08 36` numbers are fictional** on the authentic 1998 French premium-rate pattern —
   legal-safe per the story brief (no real number, no trademark).
