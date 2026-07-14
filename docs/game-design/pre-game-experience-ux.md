# Pre-game experience — interaction / UX design spec

**Feature:** Total redesign of the pre-game experience (title → menu → briefing → play)
**Author:** `game-designer` (Sacha) · **Gate:** `lead-game-designer` (Karim) — PASS required before architect
**Story:** `_bmad-output/planning-artifacts/story-pre-game-experience-redesign.md` (PM-validated, John)
**Direction anchor:** `PROJECT_GUIDELINES.md` §5 (UI Fanzine) + `docs/art-direction.md` + art-advisor counsel (approved)
**Date:** 2026-07-14 · **Status:** DRAFT — awaiting design gate

> **Scope contract (hard boundaries, from the story).** This is a **reskin + entry-flow**
> spec. NO new mechanic, NO new pre-game feature, NO change to `Prefs`, `highScoreSystem`,
> `levels.ts`, or the game `stateMachine` (AC4/AC7). Everything below is presentation and
> render-layer flow. The **French copy is `narrative-designer`'s (Yasmine)** — this spec
> defines SLOTS, hierarchy, and max lengths with `[PLACEHOLDER]` tokens, never the words.
> The **visual treatment** (exact halftone, flyer art, stamp shapes) is `lead-art`'s (Nico) —
> this spec defines the READ ("identify X at a glance"), never the style.

---

## 0. Design north star (one sentence per law)

1. **Menus are PRINT, not screen.** Bright paper ground + black ink + ONE fluo stock per
   surface. If a menu screen glows on a dark ground, it has drifted — that is a FAIL, not a
   taste note. Glow is reserved for in-game (la loi du glow, art-direction §2).
2. **Every screen is one artifact of the universe** (§5): title = photocopied free-party
   flyer / zine cover; level select = a wall of taped-up rave flyers; scores = a fake
   journal _UNE_; options = the zine back-page colophon (_ours_).
3. **One action advances or skips any screen** (§5 UX rule 3 + AC5). Launch→gameplay for a
   returning player stays under **10 s** (AC5).
4. **Nothing is lost, nothing is added.** Every datum the current admin panel shows maps
   onto a new artifact slot (§4). No new datum appears.

**Motion allowed:** flyer slide/rotate-to-front, page peel, typewriter reveal, blinking
cursor. **Motion forbidden:** neon pulse, float/drop shadows used as glow, backdrop blur,
CRT scanlines, RGB-split. (Kill list from art-advisor; the current screens violate all of
these — see before-state screenshots in the design-gate handoff.)

---

## 1. Screen-by-screen flow

### 1.1 Phase map (render-layer `AppPhase`, NOT the game stateMachine)

> **Clarification for the architect / reviewers (heads off a false AC4 flag):** `AppPhase`
> is the local `useState` union in `src/render/scene/App.tsx`. It is **not**
> `src/game/systems/stateMachine.ts`. Adding a `TITLE` branch to `AppPhase` is a
> render-layer change and is explicitly permitted (AC7 allows `src/render/ui/**` +
> `src/hooks/**`; AC8 anticipates "a new `App` phase for the title" behind an ADR). The game
> `stateMachine`, `Prefs`, `highScoreSystem`, and `levels.ts` are byte-untouched.

```
                         cold load (no ?preview)
                                  │
                                  ▼
            ┌──────────────────────────────────────┐
            │  TITLE  (new)  — zine cover / flyer    │
            │  single action (click / tap / key)     │◄── ?preview=title boots here
            │  = "call the infoline"                 │
            └───────────────┬───────────────────────┘
                            │ one action
                            ▼
            ┌──────────────────────────────────────┐
            │  MENU  — zine interior, 3 rubriques    │◄── ?preview=menu boots here
            │  ┌────────┬────────┬────────┐          │    (default rubrique = NIVEAUX)
            │  │NIVEAUX │ SCORES │ OPTIONS│          │
            │  │(flyers)│ (UNE)  │(colophon)         │
            │  └────────┴────────┴────────┘          │
            └───┬───────────────┬───────────────┬────┘
   select flyer │               │ read-only     │ read/write (auto-save)
      (kind?)   │               ▼               ▼
   ┌────────────┴───────┐   [stays in MENU]  [stays in MENU]
   │                    │
 tutorial            playable
   │                    │
   ▼                    ▼
 TUTORIAL         PRE_LEVEL_NARRATIVE[id]?
 (NarrativeScreen  ├── yes ─► NARRATIVE_PRE ──(one action / skip)──► PLAYING
  frame-reskinned) └── no  ─────────────────────────────────────────► PLAYING
   │
   │ finish OR skip (one action)
   ▼
  MENU
```

Downstream (`PLAYING → NARRATIVE_POST → END`) is **out of this story** (in/after play). END
returns to MENU (unchanged). The only new node is **TITLE**; everything else keeps its
current wiring (AC4).

### 1.2 The single-action-advance / skip rule (per node)

| Node           | The one action to ADVANCE                                 | Skip path (also one action)                                 | No-trap guarantee                  |
| -------------- | --------------------------------------------------------- | ----------------------------------------------------------- | ---------------------------------- |
| TITLE          | click / tap anywhere OR any key → MENU                    | (advance _is_ the skip; the whole screen is one hit target) | Escape = also → MENU (no dead end) |
| MENU · NIVEAUX | click/tap a flyer OR focus + Enter → play/tutorial        | Escape → TITLE (a "back", so never trapped)                 | all three rubriques reachable      |
| MENU · SCORES  | (read-only; no advance)                                   | Escape → TITLE                                              | rubrique switch always available   |
| MENU · OPTIONS | (read/write; auto-saves)                                  | Escape → TITLE                                              | —                                  |
| NARRATIVE_PRE  | click/tap/Space/Enter advances line; final line → PLAYING | **Passer** button → PLAYING (existing, frozen)              | frozen behavior (AC-freeze)        |
| TUTORIAL       | same as narrative                                         | **Passer** → MENU (existing)                                | finish OR skip both → MENU         |

**Title must not force a dwell (AC5).** The typewriter reveal of the tagline / infoline is
decoration only: the entry action fires **immediately** on first click/key regardless of
reveal progress (like the current `StartScreen` root `onClick`). No un-skippable intro
animation, no minimum display time. A returning player's fastest path is: **tap title → tap
flyer → tap Passer → PLAYING = 3 actions**, each transition ≤ 320 ms (§3), comfortably
inside 10 s.

### 1.3 The infoline entry hook (diegetic single action)

The TITLE's call-to-action is the **infoline** — a répondeur phone number you "call" to get
the _point de rendez-vous_. Mechanically it is the existing single-action start; narratively
it is the diegetic dress. The whole TITLE surface is the hit target, but the infoline block
is the **visible affordance** that says "one action here":

- Slot: `[INFOLINE_NUMBER]` (a Paris `01`-style number, narrative-owned) + `[INFOLINE_CTA]`
  (e.g. the successor to `[ CLIQUER POUR ENTRER ]`, ≤ 28 chars).
- Print treatment: black ink on the cover stock, a blinking **typewriter cursor** after the
  CTA (allowed motion). **No glow** on the CTA (the current `StartScreen` CTA glows green
  `text-shadow: 0 0 10px` — that is killed).
- The affordance keeps clear of the bottom-right 40 px (FullscreenButton, §5).

---

## 2. Interaction spec per surface (pointer/touch AND keyboard)

### 2.0 The print-state vocabulary (defined once, reused everywhere)

No glow. States are drawn like hand-work on paper:

| State                | Print expression                                                                                                                                              | Applies to                                               |
| -------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------- |
| REST                 | black ink on the surface stock, no adornment                                                                                                                  | all                                                      |
| HOVER (pointer only) | element **pulls forward** (flyer) or a hand-drawn **marker ring** stamps around it; cursor → hand/stamp                                                       | flyers, tabs, buttons                                    |
| FOCUS (keyboard)     | **circled in marker** — a hand-inked ellipse or heavy underline in the surface's ink; ALWAYS visible without a pointer (keyboard nav must never be invisible) | all interactive                                          |
| ACTIVE / SELECTED    | ballot **X-stamp** in a box, a _coché_ tick, or **tape corners** pinning the front flyer                                                                      | selected level, chosen difficulty/lives, active rubrique |
| DISABLED (locked)    | grey ink + diagonal rubber-stamp `[LOCKED_STAMP]` across the flyer; no hover/focus pull                                                                       | locked levels                                            |

Touch has no hover: on touch, a single **tap = select/activate** directly (no hover-then-tap);
locked flyers ignore taps. Reduced motion (`prefers-reduced-motion`): marker-circle and
flyer-pull resolve **instantly** (no tween); typewriter still types (it is content, not
decoration) but can be completed by the first tap.

### 2.1 TITLE (zine cover / flyer)

- **Pointer/touch:** click/tap anywhere on the surface → MENU. The infoline block is the
  labelled affordance; the surface is the hit area (exclude `[data-muf-ui]`, §5).
- **Keyboard:** any printable key OR Enter/Space → MENU. Escape → MENU (no dead end).
  Modifier-only presses (Shift/Ctrl/Alt/Meta alone) are ignored.
- **Focus:** on mount, focus rests on the infoline affordance (so a keyboard user sees the
  marker circle and knows where "the one action" is).

### 2.2 MENU shell — rubrique navigation (replaces the admin TabBar)

The three rubriques (NIVEAUX / SCORES / OPTIONS) are a zine **sommaire** — hand-numbered
index tabs / inked section headers, **not** the current full-width glowing yellow tab bar.

- **Pointer/touch:** tap a rubrique label → switch surface. Active rubrique = circled /
  underlined in ink (not a yellow fill).
- **Keyboard:** `←/→` (Left/Right arrows) cycle the three rubriques; the active one is
  marker-circled. `↑/↓` move focus _within_ the active surface. Enter activates the focused
  item. Escape → TITLE.
- **Data:** labels are narrative-owned (`[RUBRIQUE_NIVEAUX]`, `[RUBRIQUE_SCORES]`,
  `[RUBRIQUE_OPTIONS]`, ≤ 12 chars each; the current `NIVEAUX / SCORES / OPTIONS` are the
  faithful baseline).

### 2.3 NIVEAUX — the flyer wall

Each level is its **own flyer**, its **own fluo stock**, slightly rotated, tape corners.
Legibility rule overrides literal pile depth (see §3.2 rationale): flyers are near-full-width
and stacked vertically with slight rotation + jitter, **never** so overlapped that a datum
is hidden.

- **Pointer:** hover a flyer → it straightens to 0°, lifts, tape corners appear (pull-to-front,
  §3). Click → select → `handlePlay(id)` (existing).
- **Touch:** tap = select directly.
- **Keyboard:** `↑/↓` move focus across flyers (including locked — so the player can read the
  locked stamp); focused flyer is marker-circled AND pulled forward. Enter on an unlocked
  flyer → play; Enter on a locked flyer → no-op + a 1-shake of the `[LOCKED_STAMP]` (feedback,
  no state change).
- **Tutorial flyer** reads as a different artifact — a photocopied _mode d'emploi_ / instruction
  sheet rather than a rave flyer — so its "this is not a scored level" nature is legible at a
  glance. It still lives first in the pile (levels.ts order, unchanged).

### 2.4 SCORES — the journal _UNE_

A fake newspaper front page: masthead + a leaderboard rendered as an **article / classement**,
not an HTML `<table>` look.

- **Level selector** (which level's _UNE_ you read): the current row of level buttons becomes
  the paper's **rubrique/edition switch** (section tabs under the masthead).
  - Pointer/touch: tap an edition → load that level's scores.
  - Keyboard: `←/→` switch edition; `↑/↓` scroll the classement if it overflows; Enter = no-op
    (read-only surface).
- Empty state keeps its meaning: `[NO_SCORE_LINE]` (successor to `AUCUN SCORE ENREGISTRÉ`,
  ≤ 32 chars) set as a "no news" standfirst.

### 2.5 OPTIONS — the colophon / _ours_

The zine back page. Sliders become **hand-inked VU meters**; toggles become **ballot boxes**.

- **Sliders (SFX / Musique):** keep a native `<input type="range">` underneath (accessibility,
  touch drag, keyboard) styled as an inked VU meter — no `accentColor` glow.
  - Pointer/touch: drag thumb or tap track.
  - Keyboard: focus the row, `←/→` adjust ±5 % (or the browser-native step), value tick prints
    the `[NN]%` readout.
- **Vies (1–5) & Difficulté (FACILE/NORMAL/DIFFICILE):** ballot boxes.
  - Pointer/touch: tap a box → X-stamp moves there (auto-saves, existing `onSave`).
  - Keyboard: `↑/↓` move between rows (SFX → Musique → Vies → Difficulté), `←/→` change the
    focused control; the choice is X-stamped. Escape → TITLE.
- All writes go through the **existing** `onSavePrefs` — no schema change, byte-compatible
  with saved prefs (AC4).

### 2.6 NARRATIVE_PRE / TUTORIAL frame (frozen behavior, frame joins the system)

Behavior is FROZEN (typewriter `CHAR_DELAY_MS = 28`, `Passer`, progress dots, advance logic,
three call sites — all unchanged per the story). Only the **frame** joins the print system:
dark facade wash → paper stock; scanlines → halftone; neon `#ffe600` borders → ink rule;
glowing green `[ JOUER ]` hint → inked hint with a blinking typewriter cursor. See the design
question in §7 (does the briefing read as a fax/répondeur transcript on paper, or keep world
glow — Karim's call).

---

## 3. Tuning values (durations, easings, geometry, targets)

One variable at a time; rationale attached to each. `prefers-reduced-motion` forces all
durations to 0 except the typewriter (content).

### 3.1 Motion

| Token                                | Value                             | Easing                              | Rationale                                                |
| ------------------------------------ | --------------------------------- | ----------------------------------- | -------------------------------------------------------- |
| `title→menu` transition              | **280 ms**                        | ease-out `cubic-bezier(.2,.8,.2,1)` | one page-drop; fast enough that 3 taps stay < 10 s (AC5) |
| flyer pull-to-front (hover/focus)    | **140 ms**                        | ease-out                            | feels like grabbing paper; snappy, not floaty            |
| flyer settle rotation                | rest angle → **0°** over 140 ms   | ease-out                            | pairs with the pull                                      |
| rubrique switch                      | **200 ms**                        | page-peel/cut, ease-out             | reads as turning to a section                            |
| marker-circle draw-on (focus)        | **90 ms**                         | ease-out (or instant)               | keyboard nav must feel immediate                         |
| typewriter reveal                    | **28 ms / char**                  | step                                | reuse the shipped `NarrativeScreen` value (consistency)  |
| blinking cursor                      | **0.7–1.0 s** step blink          | step-start                          | reuse shipped blink; the ONE allowed "pulse"             |
| locked-flyer shake (Enter on locked) | **180 ms**, 2 oscillations, ±3 px | ease-in-out                         | "no" feedback, no state change                           |

Forbidden: any `neon pulse`, `box-shadow` used as glow, `backdrop-filter: blur` (the current
`LevelCard` uses `backdropFilter: blur(2px)` — killed), `text-shadow: 0 0 …` glow.

### 3.2 Flyer-pile geometry

- **Rest rotation:** deterministic per index (NOT `Math.random` per render — that would
  reshuffle on re-mount). Cycle: `[-3°, +2°, -1.5°, +3°, -2°]` by list index.
- **Max tilt:** **±3°** (legible; a steeper fan hides data — forbidden by "nothing lost").
- **Horizontal jitter:** deterministic per index, **±8 px**.
- **Hover/focus:** rotation → 0°, `translateY -4 px`, `scale 1.02`, tape corners visible.
- **Stack, not deep fan (decision + rationale):** with up to 4 flyers that must each stay
  fully readable on mobile landscape, the "pile" is a **vertical stack of near-full-width
  flyers** with slight rotation + jitter + tape corners, scrollable — NOT a deeply
  overlapping fan. §5's "pile de flyers" is the _read_; legibility (no datum hidden) is the
  non-negotiable. This is a conscious reading of §5, flagged for the art gate.

### 3.3 Xerox texture (the READ; exact asset = lead-art)

| Layer                                     | Target value                         | Rationale                              |
| ----------------------------------------- | ------------------------------------ | -------------------------------------- |
| body halftone dot pitch                   | **3–4 px** @1x                       | reads as photocopy without eating text |
| hero-image (cover / flyer photo) halftone | **8–12 px** pitch, blown-up          | degraded 2nd-gen xerox look            |
| toner speckle                             | ~**2 %** coverage, sparse            | grime, not noise wall                  |
| fold streaks                              | **1–2** faint diagonal lighter bands | "this was folded in a pocket"          |

Halftone is **static** (no animation). Replaces the killed CRT scanline
`repeating-linear-gradient` present in every current screen.

### 3.4 Touch targets

- **Minimum 44 × 44 px** (WCAG 2.5.5 / Apple HIG) for every interactive element.
- Flyer tap area = full flyer, **min height 64 px**.
- Rubrique tabs, edition tabs: **≥ 44 px** tall.
- Lives ballot boxes: **44 × 44 px** — a bump from the current **36 px** (an ergonomics fix
  that satisfies AC6 "touch targets usable at mobile size"; not a new feature).
- Slider row hit height: **≥ 44 px** (thumb may be smaller visually but the row is the target).

---

## 4. Data mapping — every existing datum → new artifact slot (nothing lost, nothing added)

> Source of truth: `levels.ts` (`LevelConfig`), `prefsSystem.ts` (`Prefs`),
> `highScoreSystem.ts` (`ScoreEntry`). The **derivations** currently done in `MainMenu`
> (difficulty label from `enemySpeedMultiplier`, "best" from `loadScores[0]`) are
> render-side and are **preserved identically** — no new stored data, no dropped field.

### 4.1 Level flyer (NIVEAUX)

**Two datum classes on one flyer.** The current admin card carries **4 data fields** (name,
district/year, time, targets) + derived difficulty/best/lock. The redesign adds a set of
**narrative flavour slots** (crew, slogan, date, zone, RV, info-line, flavour-difficulty)
defined in the copy deck (`pregame-copy-deck.md` §2) so the surface reads as a _flyer_, not 4
fields. Both classes are budgeted against §3.2's "no datum hidden" rule — the real flyer is
**~8 lines**, not 4, and that is the box the art lane sizes and the stack must keep readable.
Data-class fields are byte-sourced from `levels.ts`; flavour-class strings are narrative-owned
copy (verbatim from the deck), **display only, zero data change**.

**Data-class fields** (from `levels.ts` — the existing datum, nothing dropped):

| Existing datum                                             | Source                                                                              | Current widget                      | New slot on the flyer                                                                                    | Constraint                                                            |
| ---------------------------------------------------------- | ----------------------------------------------------------------------------------- | ----------------------------------- | -------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------- |
| `name`                                                     | `level.name`                                                                        | 22 px heading                       | flyer **headline** (ransom/display type)                                                                 | show full; ~20 chars                                                  |
| `district` + `year`                                        | `level.district`, `level.year`                                                      | mono sub-line                       | flyer **dateline / lieu** ("[district] — [year]")                                                        | one line                                                              |
| `timeSeconds`                                              | `level.timeSeconds`                                                                 | `⏱ {n}s`                            | printed spec line, clock glyph or inked "⏱"→ `[TIME] s`                                                  | playable only                                                         |
| `enemiesToWin`                                             | `level.enemiesToWin`                                                                | `🎯 {n} cibles`                     | printed spec line, `[N] cibles`                                                                          | playable only                                                         |
| **difficulty tell**                                        | derived: `>1.2 → DIFFICILE (pink)`, `>1.0 → NORMAL (orange)`, else `FACILE (green)` | colored word                        | **rubber-stamp** in the same 3 ink colors; **keep the exact thresholds**; middle label = `NORMAL` (§4.6) | glanceable, but NOT a sole discriminator with shipped data — see §4.6 |
| **best score**                                             | `loadScores(id)[0].score`                                                           | "MEILLEUR / {score}" (green)        | **circled-in-green** record, corner of flyer                                                             | hidden if no scores / tutorial                                        |
| `unlocked` (default ∪ progress)                            | `level.kind==='tutorial' \|\| unlockedLevels.has(id)`                               | border + `VERROUILLÉ` + opacity 0.4 | locked = grey + diagonal `[LOCKED_STAMP]`, no pull                                                       | keep exact unlock predicate                                           |
| tutorial badge                                             | `kind==='tutorial'`                                                                 | `TUTORIEL` (yellow)                 | distinct _mode d'emploi_ stamp; **no** time/targets/difficulty/score                                     | keep the "no stats" rule                                              |
| `id`, `deliveries`, `roster`, `enemySpeedMultiplier` (raw) | —                                                                                   | not shown                           | **still not shown** (internal)                                                                           | do not surface                                                        |

**Flavour-class slots** (narrative flyer copy — `pregame-copy-deck.md` §2; `[PLACEHOLDER]` =
Yasmine's words, `car.` = the layout ceiling this spec fixes so §3.2's budget is real). Present
on **playable** flyers; the tutorial flyer substitutes its own annotated set; locked flyers
withhold most:

| Flavour slot                  | Placeholder   | Max (car.) | Note                                                                                    |
| ----------------------------- | ------------- | ---------- | --------------------------------------------------------------------------------------- |
| Crew / sound system           | `[CREW_NAME]` | **16**     | flyer headline identity; per-level (SPIRALE 23 / KANAL SYSTEM / NADIR 94)               |
| Slogan / teaser               | `[SLOGAN]`    | **32**     | one cryptic line; withholds                                                             |
| Date line                     | `[DATE_LINE]` | **26**     | "SAM. → DIM. · 23H → ?" register                                                        |
| Zone line                     | `[ZONE_LINE]` | **34**     | withholds the exact address; district-flavoured                                         |
| RV line                       | `[RV_LINE]`   | **24**     | "RV : SUR L'INFO-LINE"                                                                  |
| Info-line number              | `[INFO_LINE]` | **18**     | diegetic phone number; **absent on the tutorial flyer** (deck §2.1)                     |
| Flavour-difficulty (AMBIANCE) | `[AMBIANCE]`  | **22**     | felt-difficulty read (ÇA ROULE < CHAUD < BRÛLANT) — carries what the stamp can't (§4.6) |

Tutorial-flyer substitutions (deck §2.1) — same box, different slots: `[TUT_STAMP]` (≤12,
over-title "REPÉRAGE"), `[TUT_HANDNOTE]` (≤34, DISPATCH's hand), `[TUT_CREW]` (≤28, "SANS
SYSTÈME · AVANT LE SON"), `[TUT_RV]` (≤22), `[TUT_NOLINE]` (≤24, struck-out "pas besoin
d'appeler"). No time/targets/difficulty/score/info-line — the "no stats" rule holds.

Locked-flyer slots (deck §2.5) — most flavour withheld: `[LOCKED_STAMP]` (≤14, "LIGNE FERMÉE",
replaces VERROUILLÉ), `[LOCKED_DATE]` (≤16), `[LOCKED_RV]` (≤18), `[LOCKED_INFO]` (≤30, dead
line), `[LOCKED_OVERLAY]` (≤22), `[LOCKED_HELPER]` (≤48). Crew name **stays legible**; the rest
is the tear. Longest at-risk string on this surface = `[LOCKED_HELPER]` (48 car.) — size the
locked box to hold it or use the deck's `la ligne ouvre plus tard` fallback (deck §6).

**§3.2 legibility-budget consequence (amends §3.2 / §3.4).** The flyer box is sized for the
**playable ~8-line** layout, NOT 4 fields. The ±3° jittered stack (§3.2) must keep the
glanceable discriminators — **crew name, level title, difficulty stamp, AMBIANCE** — legible
**even at the rest angle in the pile**; the remaining lines may rely on the pull-to-front of
the focused/hovered flyer to read in full. §3.4's flyer min-height is therefore no longer a
flat 64 px: it is **whatever holds the 8-line flyer above the 44 px tap floor**, derived by the
art lane and verified at design acceptance.

### 4.2 Journal _UNE_ (SCORES) — per selected level

| Existing datum   | Source                        | Current                  | New slot                                   | Constraint                                                 |
| ---------------- | ----------------------------- | ------------------------ | ------------------------------------------ | ---------------------------------------------------------- |
| level selector   | unlocked non-tutorial levels  | button row               | **edition/rubrique switch** under masthead | same filter: `kind!=='tutorial' && unlockedLevels.has(id)` |
| rank             | index `i+1`                   | `#` column               | classement **position**                    | keep 1-based                                               |
| `score`          | `ScoreEntry.score`            | `SCORE` column           | headline **figure** per row                | up to `MAX_ENTRIES = 10` rows                              |
| `wave`           | `ScoreEntry.wave`             | `VAGUE` column           | **VAGUE** stat in the article row          | keep — do not drop                                         |
| `date`           | `ScoreEntry.date.slice(0,10)` | `DATE` column            | dateline per row                           | keep `YYYY-MM-DD` slice                                    |
| rank-1 highlight | `i===0` (green)               | green row                | **top of the classement**, circled-green   | keep the "your record" semantic                            |
| empty state      | `scores.length===0`           | `AUCUN SCORE ENREGISTRÉ` | `[NO_SCORE_LINE]` standfirst               | keep meaning                                               |

Columns kept: **# / SCORE / VAGUE / DATE** — all four, none added.

### 4.3 Colophon (OPTIONS)

| Existing datum                | Source              | Current                             | New slot                              | Constraint           |
| ----------------------------- | ------------------- | ----------------------------------- | ------------------------------------- | -------------------- |
| `soundVolume` 0–1             | `Prefs.soundVolume` | range + `{n}%`                      | inked VU meter, `[NN]%` readout       | keep 0–1 ↔ 0–100 %   |
| `musicVolume` 0–1             | `Prefs.musicVolume` | range + `{n}%`                      | inked VU meter                        | keep                 |
| `lives` 1–5                   | `Prefs.lives`       | 5 number buttons                    | 5 **ballot boxes**, X-stamp on chosen | keep 1–5 range       |
| `difficulty` easy/normal/hard | `Prefs.difficulty`  | 3 buttons (FACILE/NORMAL/DIFFICILE) | 3 ballot boxes                        | keep labels + values |

Labels narrative-owned (`[LABEL_SFX]`, `[LABEL_MUSIC]`, `[LABEL_LIVES]`, `[LABEL_DIFF]`,
`[DIFF_EASY/NORMAL/HARD]`); current strings are the faithful baseline.

### 4.4 Semantic color preservation (glow → ink, meaning kept)

Color currently _encodes_ meaning; the meaning must survive as **ink/marker**, not glow:

| Semantic                          | Current glow          | New ink expression                        |
| --------------------------------- | --------------------- | ----------------------------------------- |
| record / rank-1 / FACILE          | `#39ff14` green glow  | green **ink** stamp / green marker circle |
| NORMAL (middle tier)              | `#ff6600` orange      | orange ink stamp                          |
| DIFFICILE                         | `#ff2d9b` pink        | pink ink stamp                            |
| interactive / selected / tutorial | `#ffe600` yellow glow | X-stamp / marker circle / cover stock     |

Contrast of these inks on each fluo stock is a **lead-art** call; this spec fixes the READ
(the difficulty marks distinguishable at a glance; record visibly circled).

> **Middle-tier label = `NORMAL` (design-gate condition f2).** The render currently prints the
> middle tier as `MOYEN` (`MainMenu.tsx:170`) while `PrefsTab` / `Prefs` use `NORMAL`. Both
> lanes standardize on **`NORMAL`**; the render label is aligned `MOYEN → NORMAL` (a one-word,
> in-scope render change, **no data touch**, AC4-safe). See §4.6 — with shipped data no level
> actually renders the middle tier, so this is latent cohesion, not a visible fix.

### 4.5 Paper-stock assignment (one fluo per surface, art-advisor rule)

| Surface            | Ground                                   | Single fluo             | Note                                                            |
| ------------------ | ---------------------------------------- | ----------------------- | --------------------------------------------------------------- |
| TITLE (cover)      | jaune fluo                               | — (it _is_ the stock)   | brightest = the hook                                            |
| NIVEAUX flyers     | each flyer rotates the 4 stocks by index | per-flyer               | shell = neutral newsprint so flyers pop                         |
| SCORES (_UNE_)     | **newsprint cream**                      | rose fuchsia (masthead) | see §7 flag: a UNE is faithfully printed on newsprint, not fluo |
| OPTIONS (colophon) | orange brûlé                             | —                       | zine back-page stock                                            |

### 4.6 Difficulty stamp is NOT a glanceable discriminator with shipped data (design-gate condition)

Shipped `enemySpeedMultiplier`: **belliard `1.0` → FACILE**, **stalingrad `1.3` → DIFFICILE**,
**vitry `1.6` → DIFFICILE**. Under the **preserved** `>1.2 → DIFFICILE / >1.0 → NORMAL / else
FACILE` derivation (re-tuning `levels.ts` is forbidden — AC4, byte-unchanged):

- **Both Stalingrad and Vitry stamp DIFFICILE (pink).** No shipped level renders the middle
  (`NORMAL`) tier at all.
- Therefore the **difficulty stamp alone cannot differentiate the two hard gigs** — two
  playable flyers carry the identical pink DIFFICILE mark. It stays correct and glanceable as a
  _tier_ read (this-is-a-hard-one), but it is not the discriminator between the two.
- **What carries the felt difference between the two hard flyers:** the **AMBIANCE flavour
  gradient** (`CHAUD` for Stalingrad `<` `BRÛLANT` for Vitry — deck §2.3/§2.4) **+ the district
  line** (Stalingrad · bords du canal · 19e vs Vitry · Val-de-Marne · 94). The flyer layout
  (§4.1) must give AMBIANCE and district enough hierarchy to read at a glance, since they —
  not the stamp — do the discriminating work here.
- Implication for the art lane: do **not** rely on three visually distinct difficulty stamps to
  tell the hard levels apart; rely on AMBIANCE + district + the per-crew flyer identity.

---

## 5. Mobile landscape + overlay coexistence

- **Landscape-first (AC6).** All four surfaces are laid out for a wide viewport. Masthead /
  cover type shrinks on short landscape; the flyer wall scrolls; the journal classement
  scrolls; the colophon fits without scroll at mobile height.
- **RotateOverlay covers ALL pre-game phases incl. the new TITLE (ADR-0003, AC6).** The
  `TITLE` branch **must** render through `renderAppShell(content, rotateBlocked)` exactly like
  `MENU`, so the overlay and FullscreenButton are appended. **RotateOverlay itself is
  reskinned** into the print system (it is in the story's surface list): kill its scanlines,
  swap the 📱 emoji for an inked phone/rotate glyph, put it on a paper ground with black ink —
  behavior (portrait-only, pauses underneath) unchanged.
- **FullscreenButton (ADR-0008) stays above everything (`zIndex 300`).** It is **system
  chrome, not a menu artifact** — keep its current neutral white glyph + `data-muf-ui`
  (it also overlays the glowing game world, where a neutral control is correct). Do NOT
  restyle it into ink. Two coexistence constraints:
  1. The TITLE's "click/key anywhere advances" handler must **exclude** events whose target is
     inside `[data-muf-ui]` (mirror the `NarrativeScreen` skip-button `stopPropagation`
     pattern) so tapping fullscreen does not skip into the menu.
  2. The infoline CTA and any bottom-right menu content keep clear of the bottom-right
     **40 × 40 px** the button occupies.
- Mobile decision is made once at load from the UA (`IS_MOBILE`, ADR-0003) — unchanged.

---

## 6. Preview harness hooks (AC8)

`App.tsx` reads `?preview=` once at load (`PREVIEW_SCREEN`). Add two entries; keep the three
existing (`narrative | end | tutorial`) byte-identical:

| Param            | Boots into                              | Purpose                                                                                                                     |
| ---------------- | --------------------------------------- | --------------------------------------------------------------------------------------------------------------------------- |
| `?preview=title` | `TITLE` phase                           | screenshot the entry screen                                                                                                 |
| `?preview=menu`  | `MENU` phase (default rubrique NIVEAUX) | deterministic menu capture (cold boot also lands MENU, but the explicit param documents intent and lets the tool target it) |

These are render-layer switch additions only — no schema/stateMachine change. The `verify`
skill and CI render farm capture title + menu like the existing screens.

---

## 7. Tensions with the story ACs (raised to `lead-game-designer` + `pm`)

1. **AC1 — resurrect vs replace `StartScreen`.** The spec **replaces** the orphaned
   `StartScreen.tsx` with a new `TitleScreen` component + a `TITLE` `AppPhase`, rather than
   re-wiring the dead file. This satisfies AC1 ("wired **or** replaced"; grep finds the
   successor imported in `App.tsx`). **Recommendation:** delete `StartScreen.tsx` in the same
   change so "no orphaned pre-game UI component remains" (AC1) is literally true. → dev-r3f-render.
2. **AC5 10-second budget vs a new screen.** Adding TITLE inserts one screen/action before the
   menu. It stays inside budget ONLY IF (a) the title forces **no dwell** and the entry action
   fires immediately regardless of typewriter progress (§1.2), and (b) transitions are ≤ 280 ms
   (§3.1). Both are specced as hard constraints; the design-acceptance playtest must time the
   3-tap path. **Flagged so it is a verification checkpoint, not an assumption.**
3. **AC4/AC7 — `AppPhase` is not the game `stateMachine`.** Adding `TITLE` to the render-layer
   `AppPhase` union and adding `?preview=title|menu` are render changes and do NOT touch
   `Prefs`/`highScoreSystem`/`levels.ts`/game `stateMachine`. Documented in §1.1 to pre-empt a
   false AC4 flag at review. An ADR is warranted (AC8: new phase + shared token module) —
   architect's call.
4. **§5 "pile de flyers" read vs legibility (AC: nothing lost).** A literal deep overlapping
   fan would hide flyer data. The spec resolves this as a **rotated/jittered vertical stack**
   (§3.2) — the flyer _read_ without sacrificing legibility. Conscious reading of §5, flagged
   for the art gate.
5. **Journal _UNE_ stock exception.** Art-advisor's "one fluo stock per surface" is applied to
   the flyer-family surfaces (title, flyers, colophon). The SCORES _UNE_ is specced on
   **newsprint cream + one fluo accent** (rose masthead), because a journal is faithfully
   printed on newsprint, not fluo card. **This is a deliberate deviation — Karim/Nico to
   confirm** it reads as more faithful than a fluo _UNE_.
6. **NarrativeScreen frame — print or world glow?** The story freezes NarrativeScreen behavior
   and joins only its **frame** to the cohesive system (AC3). But the briefing is liminal
   (dispatch talking to you). Does its frame read as **print** (a fax / répondeur transcript on
   paper — fits the infoline motif) or keep **world glow**? Spec's recommendation: **print
   frame** (paper ground, ink rule, halftone) with the typewriter dialogue unchanged. **Karim's
   call** — it sets whether the briefing sits on the "menu = print" or "in-game = glow" side of
   the loi du glow line.
7. **Touch-target bump 36 → 44 px** (lives boxes) is an ergonomics fix under AC6, not a new
   feature — noted so it is not mistaken for scope creep.

---

## 8. Design-acceptance criteria (what the stage-5 playtest verifies against this spec)

A dev-implemented build PASSES design acceptance when:

- [ ] Cold load shows TITLE; one action → MENU; `?preview=title` and `?preview=menu` boot the
      right phase; existing `narrative|end|tutorial` still work (AC8).
- [ ] No menu surface glows on a dark ground; no CRT scanlines, no `backdrop-filter: blur`, no
      `text-shadow` glow, no neon corner brackets anywhere in the pre-game screens (art-advisor
      kill-list; grep the diff).
- [ ] Every datum in §4 is present on its new artifact; none added. Difficulty thresholds and
      labels match `MainMenu` exactly; best-score & unlock predicates unchanged.
- [ ] Keyboard nav (§2) works on every surface with an always-visible marker-circle focus; no
      screen traps the player (Escape always has an exit).
- [ ] 3-tap returning-player path (title → flyer → Passer) completes **< 10 s** with transitions
      ≤ 280 ms.
- [ ] Mobile landscape: all surfaces usable; RotateOverlay covers TITLE too; FullscreenButton
      above and not skip-triggering; touch targets ≥ 44 px.
- [ ] Prefs read/write, level unlock gating, tutorial → TUTORIAL, play → (NARRATIVE_PRE) →
      PLAYING all behave identically (AC4); Vitest game-system suite unedited & green.

---

_Hand-offs: French copy for every `[PLACEHOLDER]` → `narrative-designer` (Yasmine). Visual
treatment / stamps / halftone asset / difficulty-mark contrast → `lead-art` (Nico). Shared
print-token module home + ADR (new phase, token source of truth) → `senior-architect`
(Winston). This spec → `lead-game-designer` (Karim) for design-gate PASS before lanes._
