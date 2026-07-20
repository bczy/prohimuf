# UX spec — Menus/UI completion (audit follow-up: name entry, options consolidation, tutorial entry, difficulty)

**Surface:** post-game name entry (new), OPTIONS/PAUSE consolidation, NIVEAUX tutorial
entry, NIVEAUX difficulty selector.
**Author:** `ux-designer` (Tony) · **Date:** 2026-07-20.
**Status:** DRAFT — awaiting `lead-game-designer` (Karim) DESIGN GATE PASS before
`senior-architect`. Companion PRD/epic being written in parallel by `pm` (John) in
`_bmad-output/planning-artifacts/`; this spec designs inside that scope, does not set it.
**Scope guard:** `PROJECT_GUIDELINES.md` §5 (UI Fanzine — every screen is a universe
artifact; menu = zine cover; game over = journal UNE; level select = flyer pile) + §8
(Scope Control — "niveaux de difficulté" and "leaderboard" are canon; online/backend and
controller remapping are explicitly out). Cahier des charges test applied per item below.
**Groundwork:** `pre-game-experience-ux.md`, `pregame-landscape-ux.md`,
`ux/flyer-wall-format.md`, `ux/spec-hostage-qte-hud-readability.md` (house format), ADR-0015
(device wording), ADR-0003 (mobile scope/`IS_MOBILE`), live read of `src/render/ui/**`,
`src/game/systems/prefsSystem.ts`, `src/game/systems/highScoreSystem.ts`,
`src/render/scene/App.tsx` (2026-07-20).
**Lane:** spec only — zero production code (`src/render/**` is `dev-r3f-render`'s), zero
visual/style decision (type, texture, exact stamp art = `lead-art`). I spec WHETHER each
screen works (hierarchy, hit areas, glance-legibility, flow length, a11y); I hand the LOOK
seam to `lead-art` explicitly per section.

---

## 0. Non-retenu (rejected, one line each — not specced further)

- **Controller remapping.** Rejected — YAGNI. Controls are "déplacement + une action"
  (guidelines §5 rule 5); there is no meaningful binding space to remap, and no controller
  input exists in the shipped control model (mouse/keyboard desktop, two-finger tap +
  one-finger pan touch, ADR-0003/0015). Revisit only if a controller input path ships.
- **Online leaderboard.** Rejected — backend/serveur/base de données is explicitly out of
  scope (guidelines §8). The local `ScoresUne` (PARIS-MINUIT UNE, per-device
  `localStorage`) stands as the shipped "leaderboard narratif" and is what item 1 below
  extends with a name field — still 100% local.

---

## 1. Current-state audit (grounding — verified by reading the live code, 2026-07-20)

| Item | Claimed gap (brief) | Verified against code |
| --- | --- | --- |
| 1. Name entry | No name-entry screen exists | **Confirmed.** `ScoreEntry` (`highScoreSystem.ts`) has only `score/wave/date` — no `name` field. `App.tsx` calls `saveScore()` silently the instant `hudData.phase` hits `GAME_OVER`/`LEVEL_COMPLETE`, before `EndScreen` even renders. `isHighScore` is computed and shown as a `★HI` in-HUD badge (`ScoreReadout.tsx`) but never surfaced as a moment/ritual — the player never learns their run made the board, let alone gets to sign it. |
| 2a. CRT toggle | shipped | **Confirmed shipped**, `Prefs.crt: boolean`, default `true`, present in both `PauseScreen` and `OptionsColophon`. |
| 2b. reducedMotion | "check if it shipped" | **Not shipped as a preference.** `Prefs` (`prefsSystem.ts`) has no `reducedMotion` field. Reduced motion today is **OS-media-query only** (`prefers-reduced-motion: reduce`, read live in 7 render files + a `base.css` block that zeroes `--motion-*` CSS vars). There is no persisted, discoverable, in-app escape hatch — a player who can't or doesn't know how to flip their OS setting (shared computer, some mobile browsers) has no way to ask muf for less motion. |
| 2c. Options consolidation | one coherent surface reachable from Menu OPTIONS and Pause | **Not consolidated — two divergent implementations.** `MainMenu → OPTIONS` renders `OptionsColophon.tsx` (fanzine ballot-box/VU-meter system, `SelectableListItem` + `useRovingIndex`, exposes **SFX, Musique, Vies, Pression/Difficulté, Tube Cathodique**). `PauseScreen.tsx` is a **separate, older, un-migrated** implementation: plain `<input type=range>` + a single on/off `<button>`, a leftover `repeating-linear-gradient` scanline decoration (the exact "kill list" item `pre-game-experience-ux.md` §0 forbids on print surfaces), and exposes only **SFX, Musique, Écran Cathodique** — **Vies and Difficulté are missing from Pause entirely**, and the CRT label text differs (`ÉCRAN CATHODIQUE` in Pause vs `TUBE CATHODIQUE` in the Colophon) for the *same* `Prefs.crt` field. Neither surface's interactive controls carry `aria-pressed`/`aria-checked` — state is conveyed by an X-stamp CSS class only, invisible to a screen reader. |
| 3. Tutorial entry point | "no menu-facing entry" | **Partially outdated — an entry point already exists and is gated.** The tutorial IS a first-class flyer in `FlyerWall` (`levels.ts` `kind: "tutorial"`, manila stock, always unlocked, first in list order; `pre-game-experience-ux.md` §2.3/§4.1 and `tutorial-visual-gestures.md` are already PASSed). What's still missing: **discoverability on a true first visit** — `MainMenu`'s mount-focus lands on the NIVEAUX **tab**, not on the tutorial **flyer** itself, and there is no "start here" signal distinguishing it from three equally-weighted playable flyers for a player who has never played this game (or any Prohibition-like game) before. |
| 4. Difficulty selection | "should not be buried in OPTIONS" | **Confirmed buried.** `Prefs.difficulty` (`easy/normal/hard`, global multiplier via `DIFFICULTY_CONFIG`, applied to every level) lives only as the **3rd of 3 rows** inside `OptionsColophon`, itself the 3rd of 3 tabs, itself one tap past the title. A player who never opens OPTIONS plays every level at the `normal` default, never learning `FACILE`/`DIFFICILE` exist — despite "niveaux de difficulté" being explicit canon (guidelines §8). Note: this is a **different datum** from the per-flyer difficulty *stamp* (`FACILE/NORMAL/DIFFICILE` derived from `level.enemySpeedMultiplier`, §4.6 of `pre-game-experience-ux.md`) — the stamp describes the level's fixed character; `Prefs.difficulty` is the player's global dial. Both concepts stay; this spec only relocates the dial's *visibility*. |

---

## 2. Screen — HIGH-SCORE NAME ENTRY ("le fait-divers", byline on PARIS-MINUIT)

### Purpose

Give the player one beat, at the moment they earn it, to sign the record their run just
wrote to `ScoresUne`. Today the game silently files the score; the player never gets the
"you made the paper" payoff the fanzine fiction sets up.

### Fanzine artifact metaphor

Not an arcade 3-letter initials wheel. muf's leaderboard is already a fictional
night-tabloid (`PARIS-MINUIT`, "LE QUOTIDIEN QUI VEILLE", `ScoresUne.tsx`) with a
"NOTRE ENVOYÉ SPÉCIAL Y ÉTAIT" byline convention on the lead story. The name-entry screen
IS that byline being typed: same masthead, same newsprint ground, a blank byline slot under
"NOTRE ENVOYÉ SPÉCIAL" with a blinking typewriter cursor, waiting for the player's tag. A
native, real `<input>` styled as the typed line (not a letter-wheel) — this is both more
period-faithful (a journalist typing their own byline on a typewriter, not an arcade
cabinet's 3-character joystick roller) and the more accessible choice (real keyboard/IME/
mobile-virtual-keyboard support, screen-reader-legible, no custom widget to relearn).
**Cahier des charges:** Prohibition (Atari ST, 1987) is a home-computer game, not an
arcade cabinet — it did not carry an arcade initials ritual either way. This is a
conscious, documented extension that reuses machinery already gated (the UNE, the
newsprint print-token set) rather than inventing a new artifact class.

### Trigger condition (when this screen appears at all)

Only when `isHighScore(selectedLevel.id, hudData.score)` is true at the same moment
`saveScore()` currently fires (`App.tsx` ~L226-228). **Not a high score → this screen never
appears** — the flow is byte-identical to today (silent save, straight to `EndScreen`).
This keeps the non-high-score path (the common case across repeated 3-5 min runs) at zero
added friction.

### Entry/exit flow

```
PLAYING
   │ hudData.phase → GAME_OVER | LEVEL_COMPLETE
   ▼
┌─────────────────────────────┐   isHighScore == false
│ (existing) save score        ├────────────────────────────┐
│ silently, unlock-next-level  │                             │
│ logic unchanged               │                             │
└──────────────┬────────────────┘                             │
        isHighScore == true                                   │
               ▼                                               │
   NARRATIVE_POST (if scripted for this level, unchanged)      │
               │                                               │
               ▼                                               │
      ┌─────────────────────────┐                              │
      │  NAME_ENTRY  (new phase) │                              │
      │  "le fait-divers"        │                              │
      │  one action to confirm   │                              │
      │  one action to skip      │                              │
      └───────────┬───────────────┘                             │
       submit OR skip (score now saved, WITH name)              │
               │                                                │
               └───────────────┬────────────────────────────────┘
                                ▼
                        END (EndScreen, unchanged)
                                │ one action
                                ▼
                              MENU
```

- **Save is deferred, not duplicated.** When `isHighScore` is true, the `useEffect` that
  today calls `saveScore()` immediately instead **holds** the `{score, wave, date}` triple
  and waits for `NAME_ENTRY` to resolve (submit or skip) before calling `saveScore()` once,
  with the name attached. The next-level unlock side-effect is **unaffected** — it fires on
  the same schedule as today, independent of the name. (Implementation ownership:
  `dev-r3f-render`/`dev-gameplay` per the architect's lane split; this spec fixes the
  contract — one save, name attached or blank, unlock untouched.)
- **`NAME_ENTRY` is a new `AppPhase`**, inserted the same way `TUTORIAL`/`NARRATIVE_POST`
  are — render-layer only, no `stateMachine`/`levels.ts` touch (same boundary posture as
  `pre-game-experience-ux.md` §1.1's `TITLE`).

### Layout

**Desktop (mouse+keyboard):**

```
┌──────────────────────────────────────────┐
│ PARIS-MINUIT · LE QUOTIDIEN QUI VEILLE     │  masthead (reused, STOCK.newsprint)
├──────────────────────────────────────────┤
│  ★ ENTRÉE AU CLASSEMENT                    │  small rose-accent kicker (existing MARK)
│  NUIT BLANCHE : 1240                       │  reused ScoresUne lead-story convention
├──────────────────────────────────────────┤
│  NOTRE ENVOYÉ SPÉCIAL Y ÉTAIT :            │  label
│  ┌──────────────────────────────────┐     │
│  │ _[typed byline]_▍                  │     │  native <input>, styled as typed line
│  └──────────────────────────────────┘     │
│                                            │
│  [ SIGNER ]           [ PASSER ]           │  primary = submit, secondary = skip
└──────────────────────────────────────────┘
```

**Mobile landscape:** same single-column composition (this is a short, one-field screen —
none of the vertical-space pressure that drove `pregame-landscape-ux.md`'s two-column/rack
rework applies here). Input row and both buttons stay within the top ~200 px so the
on-screen keyboard (which eats the bottom half of a short-landscape viewport) never covers
them — `<input>` gets `scrollIntoView` on focus if the keyboard pushes it, standard mobile
form behavior, not bespoke. Touch targets: `[ SIGNER ]` / `[ PASSER ]` ≥ 44×44 px.

### Input handling

- **Autofocus** on the `<input>` on mount (desktop: OS keyboard-ready; mobile: tapping in is
  still one action).
- **Max length 16 characters** — reuses the exact budget already set for `[CREW_NAME]` on
  the level flyer (`pregame-copy-deck.md`/`pre-game-experience-ux.md` §4.1), so the byline
  fits the same visual register as the crew names already on the flyers.
- **Allowed characters:** no server-side or moderation concern (local-only storage, no
  network, no other player ever sees it — per the "online leaderboard rejected" note in §0)
  — free text, trimmed. No profanity filter: there is no audience to protect against, this
  is the player's own device.
- **Enter key or `[ SIGNER ]` click/tap → submit** (name = trimmed input, or the fallback
  below if empty) → `saveScore()` fires → advance to `END`.
- **`[ PASSER ]` (secondary action, always present) → submit immediately with the fallback
  name** → same advance to `END`. This is the one-button skip the guidelines require of
  every liminal beat (§5 rule 3's spirit) — a player who doesn't care never has to type.
- **Escape key → same as `[ PASSER ]`** (no dead end, matches the existing `NARRATIVE_PRE`/
  `TUTORIAL` Escape convention where applicable — here Escape submits-and-advances rather
  than reopening Pause, since this is not `PLAYING`).
- **Returning-player convenience:** the last-used name is persisted (`localStorage`, new key
  e.g. `muf_player_name`, separate from `Prefs` since it is identity, not a setting) and
  pre-fills the input on every subsequent high score, selected (not just placed) so a single
  Enter re-signs with the same tag, or the player can just start typing to overwrite. This
  keeps the repeat-high-score case (a session of several 3-5 min runs) to **one keypress**,
  not a re-type every time.

### Data model note (for the architect/dev handoff, not a decision I'm making)

`ScoreEntry` needs one new optional-on-read field: `name?: string`. Existing stored entries
(no `name`) must keep loading (`isValidEntry` already only requires `score/wave/date`) and
display their fallback in `ScoresUne` — no migration, no data loss, additive only, same
posture as every other "byte-compatible" schema change in this codebase's UX specs.

### Accessibility

- `<input>` has a visible, associated `<label>` ("NOTRE ENVOYÉ SPÉCIAL Y ÉTAIT" or the
  narrative-owned equivalent) — not a placeholder-only field (placeholders disappear on
  input and fail screen-reader association).
- `[ SIGNER ]` and `[ PASSER ]` are real `<button>`s, ≥ 44×44 px, reachable by Tab in DOM
  order (input → Signer → Passer), with visible keyboard focus (reuse the existing
  marker-circle focus ring vocabulary from `print/MarkerCircle.tsx` for consistency with
  every other pre-game surface).
- Reduced motion: the typewriter cursor blink is the ONE allowed pulse (existing convention,
  `MOTION.cursorBlinkMs`), forced static under `prefers-reduced-motion` exactly like every
  other cursor in the print system (`base.css` already zeroes `--motion-cursor-blink-ms`).
  No other motion on this screen (no slide-in, no confetti/flash on "high score" — a static
  reveal is the print-system's law, `pre-game-experience-ux.md` §0's "motion forbidden"
  list).

### Failure / edge cases

| Case | Behavior |
| --- | --- |
| Score is NOT a high score | Screen never appears (see Trigger condition). |
| Empty submit (`[ SIGNER ]` with a blank/whitespace-only field) | Falls back to a fixed anonymous tag (narrative-owned string, e.g. `SANS NOM` / `ANONYME`) — never blocks advancing, never re-prompts. |
| `[ PASSER ]` | Same anonymous fallback, immediate advance — this is the explicit escape hatch. |
| First-ever high score (no prior `muf_player_name`) | Input starts empty, placeholder-less (see a11y note), autofocus is the only affordance. |
| Player already has 10 entries at this level, new score ties the 10th | `isHighScore`'s existing `score > lowest.score` rule (strict inequality) already excludes ties from this flow — unchanged, not reopened here. |
| Multiple levels, multiple high scores in one session | Each level's `ScoresUne` is independent (existing per-level storage key); the flow above is per-run, so a player who then plays a second level and beats IT gets this screen again, independently — expected, not a bug. |
| Player backgrounds the tab / closes mid-entry | Nothing is saved until submit/skip resolves (deferred-save design above) — worst case the run's score is lost from the board, same risk profile as closing during `NARRATIVE_POST` today. No special handling needed (guidelines KISS). |

---

## 3. Surface — OPTIONS / ACCESSIBILITY consolidation (Menu OPTIONS + Pause, one system)

### Purpose

One coherent, labelled options surface, reachable from both `MENU → OPTIONS` and
`PLAYING → Pause`, showing the **same controls, same labels, same visual language, same
accessibility contract** in both places. Today they are two different implementations that
have already drifted (see §1 audit row 2c).

### Fanzine artifact metaphor

Unchanged from the already-gated `OptionsColophon` — the zine's back-page **ours**
(colophon): orange stock, ballot boxes with an X-stamp, inked VU-meter sliders. Pause's
options body adopts this SAME artifact rather than keeping its own scanline-decorated
card — Pause is otherwise correctly its own thing (a modal overlay with REPRENDRE/RETOUR
AU MENU actions), only its **options body** is the seam that must match.

### Decision — what "consolidated" means here (a UX contract, not an implementation)

1. **Same field set, both places.** Pause's options body must expose the same six rows
   `OptionsColophon` does: BRUITS DE RUE (SFX), LA SONO (musique), VIES, PRESSION
   (difficulté), TUBE CATHODIQUE (CRT), and the new MOUVEMENT RÉDUIT (below). Today Pause
   is missing VIES and PRESSION entirely — that's the biggest single gap.
2. **Same copy, one source.** `TUBE CATHODIQUE` (the Colophon's label) is canonical —
   Pause's `ÉCRAN CATHODIQUE` is the one that must change, not the other way round (the
   Colophon is the gated surface; `pregame-copy-deck.md` is the copy source of truth).
   Every label in Pause's options body must be textually identical to the Colophon's,
   character for character — a player must never wonder "is this the same setting I saw in
   the menu."
3. **Same visual system, zero exceptions.** Ballot boxes with an X-stamp for
   discrete choices (Vies/Pression/CRT/Mouvement Réduit), inked VU meters for the two
   volume sliders — not Pause's plain `<input type=range>` + on/off `<button>`. This also
   removes Pause's leftover scanline decoration (the exact motif killed everywhere else in
   the print system, `pre-game-experience-ux.md` §0).
4. **Whether this is achieved by literally embedding `OptionsColophon` inside `PauseScreen`,
   or by extracting a shared sub-component both consume, is `dev-r3f-render`'s /
   `senior-architect`'s call — this spec fixes the OUTCOME (byte-identical labels, controls,
   and interaction pattern in both places), not the component boundary.**
5. **One nuance requiring explicit copy, not silence:** changing VIES or PRESSION from
   Pause happens **mid-run**, but neither affects the level already in progress
   (`buildHudInitial`/`buildLevelParams` commit these values at level start, per the live
   code read in §1). The Pause options body needs a one-line note under those two rows —
   narrative-owned copy, e.g. "prend effet à la prochaine partie" — so a player who bumps
   PRESSION mid-run and doesn't feel a difference does not read it as broken. This is a
   **false-affordance guard**, not new scope.

### Add — REDUCED MOTION as a persisted, discoverable escape hatch (matching the CRT pattern)

- **New field:** `Prefs.reducedMotion: boolean`, default `false` — same shape as `Prefs.crt`
  (single boolean, `loadPrefs`/`savePrefs` round-trip, byte-additive to the existing schema
  exactly like every other `Prefs` change in this codebase's history).
- **Semantics — a union, never a downgrade.** Effective reduced motion =
  `prefs.reducedMotion === true` **OR** the OS `prefers-reduced-motion: reduce` media query.
  Turning the in-app toggle ON always reduces motion (an explicit escape hatch for a player
  whose OS setting they can't or don't know how to change — shared computer, some mobile
  browser UIs bury it). Leaving it OFF never overrides or weakens what the OS already
  requests — the existing `base.css` OS-driven `@media` block keeps working exactly as
  today. **Concretely:** the render root should carry a `data-reduced-motion="true"`
  attribute (or equivalent) whenever `prefs.reducedMotion` is true, and `base.css`'s
  motion-zeroing rule extends to match on that attribute in addition to the existing
  `@media` query (union of both signals feeding the same `--motion-*` zeroing this spec is
  not re-deciding — the rule already exists, it needs a second trigger). This is the literal
  contract the collaborator brief means by "an escape hatch that doesn't persist is a lie":
  the toggle must actually reach every motion consumer already listening to
  `prefers-reduced-motion` (the 7 files in §1's audit table), not just a subset.
- **Ballot row** in both Colophon and Pause: `MOUVEMENT RÉDUIT` — `OUI` / `NON`, same
  pattern as `TUBE CATHODIQUE`'s `OUI`/`NON` ballot.
- **Label/hint copy** is narrative-owned (`[LABEL_REDUCED_MOTION]`); the functional
  requirement is that the ON state is comprehensible without reading a tooltip — "less
  motion/flash" is the plain-language intent, mirroring the CRT row's "scanlines & courbure
  d'écran" hint style.

### Accessibility checklist (applies to BOTH Colophon and Pause bodies)

- [ ] **Visible text state.** Every ballot option already prints its label; the *selected*
      one additionally carries the existing X-stamp — this stays, it's already correct.
- [ ] **`aria-pressed` (or `aria-checked` + `role="radio"`/`role="radiogroup"`) on every
      ballot button.** **Currently absent** (verified in §1 — `SelectableListItem` renders a
      plain `<button>`, state is CSS-class-only). Recommendation: since each ballot row is a
      mutually-exclusive single choice from a small fixed set (VIES 1 of 5, PRESSION 1 of 3,
      CRT 1 of 2, MOUVEMENT RÉDUIT 1 of 2), the more correct pattern is
      `role="radiogroup"` on the row container (with an accessible name from the row label)
      and `role="radio"` + `aria-checked={selected}` on each option — not a generic
      `aria-pressed` (which implies an independent toggle, not a 1-of-N choice). This is a
      concrete, verifiable requirement: a screen reader must announce "Pression, groupe de
      3 boutons radio, Normal, sélectionné" (or equivalent), not just "bouton".
  - [ ] Same requirement for the sliders: the native `<input type=range>` already carries
        implicit ARIA (`role="slider"`, value announced) — keep the native element under the
        VU-meter skin (already the case, `OptionsColophon.tsx`'s `VuMeter`), do not replace
        it with a non-native drag surface.
- [ ] **Touch targets ≥ 44×44 px** on every ballot box and slider row, in **both** surfaces —
      already the case in `OptionsColophon` (per `pre-game-experience-ux.md` §3.4's
      36→44 px bump); Pause's rebuilt body must match, not regress.
- [ ] **Keyboard navigable** with the SAME pattern already shipped
      (`useRovingIndex`/`SelectableListItem`, arrow-key roving within a row, Tab between
      rows, always-visible marker-circle focus) — Pause's rebuilt body adopts this, not a
      bespoke `<input>`+`<button>` tab order.
- [ ] **Escape from Pause** still resumes gameplay (existing `Escape` toggles `paused`,
      `App.tsx:169`) regardless of whether the options body is showing — no new trap.
- [ ] **Reduced motion respected by the menu transitions themselves.** Already true for the
      pre-game print system (`base.css` zeroes `--motion-*`); this spec's ask is only that
      the SAME zeroing also fires from the new `prefs.reducedMotion` flag (see union
      semantics above) — verifiable by toggling the in-app switch with OS reduced-motion
      OFF and confirming rubrique/flyer transitions go instant.

---

## 4. Surface — TUTORIAL entry point (ratify + close the discoverability gap)

### Decision: KEEP the existing placement, do not add a new rubrique or forced first-run flow

The tutorial's current home — its own flyer, first in the `NIVEAUX` pile, manila "mode
d'emploi" stock, always unlocked, `Passer`/`TERMINER` both returning to `MENU` with zero
game-state writes — is the right answer and is already gated
(`pre-game-experience-ux.md` §2.3/§4.1, `tutorial-visual-gestures.md` PASS 2026-07-14). It
satisfies every non-negotiable already: it never forces a dwell (a returning player's 3-tap
path — title → flyer → Passer — stays under 10 s per the existing gate), it's a one-button
skip in both directions, and — cahier des charges — Prohibition (Atari ST) assumed arcade
literacy and had no onboarding stage at all, so an entirely optional, skippable tutorial is
already the documented conscious extension (`docs/game-design/README.md` gated-canon table).
**No separate rubrique, no auto-launch on first load** — either would add a screen before
the player's chosen action and violate the <10 s rule for a player who already knows how to
play (returning devices, repeat visits after a `localStorage` clear, etc.).

### What's actually missing: first-ever-visit discoverability

A total first-time player has no signal that the manila flyer is different in *kind*
(instructional, not a mission) from a rave flyer, beyond the stock color and the standalone
`TUTORIEL` badge already on the card. Two gaps, both fixable without touching the placement
decision above:

1. **Mount focus doesn't land on it.** `MainMenu`'s mount-effect focuses the NIVEAUX **tab**
   (`roving.index` default 0 on the tab list); `FlyerWall` never independently steals focus
   onto the first flyer. A keyboard-first player tabs into an empty rubrique, not a
   highlighted "start here."
2. **No "you've never been here before" affordance.** Every returning player sees the exact
   same manila flyer as a true first-timer — reasonable (it stays useful as a reference),
   but a first-timer gets no extra nudge toward it over the three equally-weighted playable
   flyers next to it.

### Spec

- **First-ever-session auto-focus (not auto-navigate).** Define "first-ever session"
  precisely and cheaply: no `muf_progress` key AND no `muf_scores_*` key exists in
  `localStorage` (i.e., this device has never unlocked a second level nor recorded a score —
  `muf_progress` defaulting to `{"belliard"}` unlocked doesn't disqualify this, since that's
  the unconditional default, not evidence of play). On that condition, when `NIVEAUX` first
  mounts, keyboard focus lands on the **tutorial flyer** (index 0) instead of nowhere/the
  tab — same marker-circle-focus mechanism already used everywhere, no new visual language.
  This is *focus*, not *navigation*: nothing plays, nothing advances, the player still
  chooses. Does not affect the <10 s budget (focus placement has zero time cost).
- **A one-time visual nudge, slot only (style = `lead-art`).** On that same first-ever-visit
  condition, a small hand-drawn annotation (e.g. an arrow / "COMMENCE ICI" scrawl in the
  `FONT.hand` felt-tip register already reserved for annotations) may sit near the tutorial
  flyer. Persisted as "seen" after the first NIVEAUX visit (new `localStorage` flag, e.g.
  `muf_seen_tutorial_hint`) so it never nags a returning player. **I spec that this slot
  exists and when it appears/disappears — the mark itself, exact copy, and precise placement
  are `lead-art`'s and `narrative-designer`'s calls respectively.**
- **Rejected alternative — forcing the tutorial before the first playable level.** Explicitly
  rejected: it would insert a mandatory screen ahead of the player's own choice, breaking
  the <10 s rule's spirit for anyone who already knows the genre, and contradicts the
  existing ADR-0012 framing of the tutorial as "optional, scripted, informative-only."

### Acceptance criteria

- [ ] On a `localStorage`-cleared device, opening `MENU → NIVEAUX` for the first time places
      keyboard focus on the tutorial flyer, not the tab strip.
- [ ] On any subsequent visit (same device), focus behavior is unchanged from today (lands
      on the tab strip / wherever the roving index already was) — the nudge is one-time.
- [ ] The tutorial flyer's `Passer`/`TERMINER` paths are unaffected — this section changes
      discoverability only, never the tutorial's own frozen behavior.

---

## 5. Surface — DIFFICULTY selection promoted out of OPTIONS, into the NIVEAUX ritual

### Decision: a visible, always-present PRESSION dial in the flyer-wall shell, not a per-flyer control

`Prefs.difficulty` is a single global dial (§1 audit), distinct from the per-flyer
difficulty *stamp*. It belongs where the player is already making a "which gig tonight"
decision — the flyer wall — not three taps away in a different rubrique. It stays writable
from `OptionsColophon` too (same field, same `onSave`, no schema change) — this section adds
a second, more prominent point of access, it does not remove the first.

### Layout — desktop / tall landscape / portrait (the ≥640px-wide, >480px-tall wrap-grid from `flyer-wall-format.md`)

A header row sits above the flyer grid, inside the `NIVEAUX` rubrique body, same shell
padding as the wall itself:

```
┌──────────────────────────────────────────────────┐
│  PRESSION : [FACILE] [●NORMAL●] [DIFFICILE]        │  ballot row, same X-stamp system
├──────────────────────────────────────────────────┤
│  ╭──────╮  ╭──────╮  ╭──────╮  ╭──────╮            │
│  │TUTO  │  │SPIRALE│ │KANAL │  │NADIR │             │  flyer wall, unchanged below
│  ╰──────╯  ╰──────╯  ╰──────╯  ╰──────╯            │
└──────────────────────────────────────────────────┘
```

- Reuses the exact ballot-box vocabulary already shipped in `OptionsColophon` (same 3
  options, same labels, same X-stamp, same `role="radiogroup"` requirement from §3) — no new
  interaction pattern to learn.
- Does not reduce the flyer grid's own row capacity (`flyer-wall-format.md`'s "4 across at
  1440px, 2 across at 640px" acceptance criteria are unaffected — this is one header row of
  fixed ~44 px height, not a competing grid item).
- **Glanceable read while browsing.** Because it's a header, not a hidden field, a player
  scanning flyers always sees which PRESSION they're about to play at — a small,
  non-negotiable transparency win (same spirit as guidelines §5 rule 4's "no bullshit
  death" — the player should never discover their difficulty setting only retroactively,
  via an unexpectedly hard run).

### Layout — mobile short-landscape (`SHORT_LANDSCAPE_MEDIA`, ≤480px tall, `pointer:coarse`)

This is the one place a straight "add a header row" answer collides with an
**already-gated budget**: `pregame-landscape-ux.md` fought hard to shrink MENU chrome from
two rows (~106px, ~30% of a 360px viewport) to one 44px strip (≤12%), and flagged that
budget as the headline fix for the "feels like an SPA" complaint. Adding a second chrome row
here would partially undo that work.

**Recommendation (Option A, my default): do NOT add a new chrome row in short-landscape.**
On this one device sub-class (phone held sideways, not a tablet/laptop landscape), PRESSION
stays reachable via the OPTIONS tab only — the same one extra tap it already costs today,
unchanged for this narrow slice. Desktop, portrait, and any landscape taller than 480px
(the vast majority of "mobile landscape" per ADR-0003's own framing, and all of desktop) get
the promoted header from the layout above.

**Alternative (Option B, flagged, not chosen by me): fold a compact 3-letter cluster
(F / N / D, single-letter ballot, full word as `aria-label`, marker-circled on the active
one) into the existing 44px chrome strip alongside the `MUF` mark and the three tabs.**
This would achieve full mobile parity but risks squeezing the tab hit targets below 44px at
the smallest tested width (390px) and reopens a budget that already went through its own
design gate — I am not overriding that gate unilaterally.

**This tension is an open question for the design gate (§6), not silently resolved here.**

### Accessibility

- Same `role="radiogroup"` + `role="radio"` + `aria-checked` requirement as §3's Colophon
  ballot rows (same component, same contract — one accessibility fix serves both).
- Touch target ≥ 44×44 px per ballot option, both layouts.
- Keyboard: `←/→` cycles the three PRESSION options when focus is inside the header row
  (same `useRovingIndex` pattern), `Tab` moves from the header into the flyer wall.

### Failure / edge cases

| Case | Behavior |
| --- | --- |
| Player changes PRESSION from the NIVEAUX header, then plays | Applies at the next `handlePlay` (`buildLevelParams` reads `prefs.difficulty` fresh at level start) — already true today, unaffected by *where* the control lives. |
| Player changes PRESSION from OPTIONS instead | Identical effect, same field — both surfaces stay in sync via the shared `Prefs`/`onSave` round-trip, no divergence possible (single source of truth, not two settings). |
| Short-landscape mobile player wants to change PRESSION | One tap to OPTIONS tab, exactly as today — a documented, deliberate non-regression on this one sub-class (see Option A above), not a silent gap. |

### Cahier des charges

"Niveaux de difficulté" is explicit, listed canon in guidelines §8's "full feature set
original." This section does not add the feature — it relocates its visibility to where a
player will actually find it, per the audit's premise that a buried canonical feature is
effectively a missing one.

---

## 6. Open questions for the `lead-game-designer` design gate

1. **§5 short-landscape PRESSION placement — Option A vs Option B.** I recommend A
   (OPTIONS-only on the narrow phone-landscape sub-class, promoted header everywhere else)
   to protect the already-gated `pregame-landscape-ux.md` chrome budget. Karim's call if B
   (compact inline cluster) is worth reopening that budget for full parity.
2. **§2 NAME_ENTRY exact position relative to `NARRATIVE_POST`.** I placed it AFTER any
   scripted post-level narrative and BEFORE `EndScreen`, so it never interrupts a fiction
   beat and reads as "the paper goes to print after the story's told." Confirm this doesn't
   fight a story beat `narrative-designer` has planned for a specific level's post-narrative.
3. **§2 fallback anonymous name string** — copy slot only (`[FALLBACK_NAME]`), word choice is
   `narrative-designer`'s.
4. **§3 component boundary (embed vs extract) for the OPTIONS/PAUSE consolidation** — I fixed
   the outcome (identical labels/controls/a11y in both places); whether `PauseScreen` embeds
   `OptionsColophon` directly or both consume a new shared sub-component is an architecture
   call, flagged to `senior-architect`.
5. **§3 `Prefs.reducedMotion` default value** — I specced `false` (matches "never weaker than
   the OS setting" reasoning: OFF still respects OS `prefers-reduced-motion`). Confirm this
   reads correctly rather than defaulting `true` for new players, which would mute the
   Paper-Mario unfold/motion identity by default for everyone (guidelines §5's "Paper Mario
   Rules" are load-bearing visual identity, not just flourish) — I believe `false` is right
   but flagging since it's an accessibility-vs-identity tradeoff.
6. **§4 first-ever-session detection heuristic** (`no muf_progress AND no muf_scores_*`) —
   confirm this is precise enough, or if a dedicated flag (`muf_has_launched`) is preferred
   for clarity even though it's one more localStorage key than strictly needed.

---

## Hand-offs

- **`narrative-designer` (Yasmine):** every `[PLACEHOLDER]` above — the NAME_ENTRY screen's
  label/kicker copy, the fallback anonymous name, `MOUVEMENT RÉDUIT` label/hint, the
  mid-run-no-effect note under VIES/PRESSION in Pause, the first-run tutorial nudge copy.
- **`lead-art` (Nico):** NAME_ENTRY screen's exact visual treatment (byline typography,
  kicker placement) reusing the newsprint/rose system already gated for `ScoresUne`; the
  first-run tutorial nudge mark; nothing here implies new sprite/asset generation.
- **`dev-gameplay` / `senior-architect`:** `ScoreEntry.name?` schema addition,
  `Prefs.reducedMotion` schema addition, `AppPhase` `NAME_ENTRY` addition (render-layer,
  same posture as prior `AppPhase` additions), the deferred-save contract in §2, the
  `data-reduced-motion` union-with-OS-media-query wiring in §3.
- **`dev-r3f-render` (Amelia):** all four surfaces' implementation; component boundary for
  the OPTIONS/PAUSE consolidation (open question 4); verify at both device classes.
- **Gate:** this spec needs `lead-game-designer` DESIGN GATE PASS (open questions above)
  before `senior-architect` lane assignment. At stage 5 (VERIFY) I review the built screens
  against this spec's acceptance criteria on real screenshots, both device classes, and
  report PASS/deviations to `lead-game-designer`.
