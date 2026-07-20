# Design gate — Menus / UI / HUD completion

**Gate:** `lead-game-designer` (Karim) · **Date:** 2026-07-20 · **Cycle:** menus/UI-completion
**Bertrand:** unavailable — decided within `PROJECT_GUIDELINES.md`; guideline-exceeding items
flagged (not blocked) in §Escalation.

## Deliverables under review

| #   | Deliverable                                                                     | Author               | Verdict               |
| --- | ------------------------------------------------------------------------------- | -------------------- | --------------------- |
| E   | `_bmad-output/planning-artifacts/epic-menus-ui-completion.md`                   | `pm` (John)          | **PASS**              |
| M1  | `_bmad-output/planning-artifacts/story-highscore-name-entry.md`                 | `pm` (John)          | **PASS w/ edits**     |
| M2  | `_bmad-output/planning-artifacts/story-difficulty-modifiers-separation.md`      | `pm` (John)          | **PASS w/ edits**     |
| M3  | `_bmad-output/planning-artifacts/story-accessibility-settings-consolidation.md` | `pm` (John)          | **PASS w/ condition** |
| UX  | `docs/game-design/ux/spec-menus-ui-completion.md`                               | `ux-designer` (Tony) | **PASS w/ edits**     |

No FAIL. Every edit was applied in-file (surgical, author voice preserved) and is listed in
§Edits. All five clear the four gate legs:

- **Scope / cahier des charges.** Name entry + difficulty + leaderboard are §8 canon
  (in-scope, faithful). Accessibility (M3) is a conscious, documented **extension** — same
  category already justified in `story-timer-duel-telegraph.md`. The epic's two REJECTED items
  (controller remapping; online/backend leaderboard) are correctly rejected against §5 rule 5
  and §8. No undeclared extension anywhere.
- **Core loop.** `Récupérer → Livrer → Éviter` untouched by all three stories — every change is
  menu/HUD/IA or an accessibility toggle. "Mission 3-5 min / <10s launch / one-action skip"
  guarded explicitly (M1 AC8, M2 AC6, name-entry only fires on a high score and is skippable).
- **Verifiability.** One real hole found and fixed: M1's input length was under-specified
  (story said "3-8 chars", UX said "16") — clamped to a single testable value (see Edits).
- **Coherence.** Cross-checked against `pregame-landscape-ux.md`, `story-timer-duel-telegraph.md`,
  `flyer-wall-format.md`, and the gated print-token/ADR-0021 posture. Two cross-deliverable
  contradictions found and resolved (M2 file-map vs UX chosen shape; M3/UX union vs timer-duel
  seed-once) — see §Decisions Q3 and Q5.

---

## The 7 decisions

### Q1 — M1 signature format → **native `<input>` typewriter byline** (not a 3-initial wheel)

Ratified as the UX spec has it. Prohibition (Atari ST, 1987) is a home-computer game, not an
arcade cabinet — it carried no 3-initial ritual, so a letter-wheel would be inventing an
artifact class the source never had. The typed byline reuses **already-gated** machinery (the
PARIS-MINUIT UNE, the newsprint print-token set, `[CREW_NAME]` register) and is the more
accessible path (real keyboard/IME/mobile-virtual-keyboard, screen-reader-legible, no custom
widget with mouse/touch-only input).

**Scope-verdict reconciliation (coherence fix):** the _feature_ — signing a high score — is
**[FIDÈLE]** (§8 "leaderboard" canon, arcade lineage), exactly as M1 states. The _byline form_
is not a separate net-new extension; it is the fanzine presentation of that in-scope feature,
already covered by the gated ADR-0021 reskin. So the two lanes agree: FIDÈLE feature, gated
fanzine skin — no new extension to justify. (The UX spec's "conscious documented extension"
wording refers only to choosing byline-over-wheel; recorded here so the set reads as one
verdict, no relabel needed.)

### Q2 — M1 trigger point → **new `NAME_ENTRY` `AppPhase`, after `NARRATIVE_POST`, before `EndScreen`**

Ratified as the UX flow diagram (§2) has it:
`… → GAME_OVER|LEVEL_COMPLETE → NARRATIVE_POST (if scripted) → NAME_ENTRY → END → MENU`.
It never interrupts a fiction beat ("the paper goes to print after the story is told") and it
is a **render-layer-only** phase addition — same boundary posture as the existing
`TUTORIAL`/`NARRATIVE_POST`/`TITLE` phases, no `stateMachine`/`levels.ts` touch. The **save is
deferred, not duplicated**: when `isHighScore` is true, the effect holds the `{score,wave,date}`
triple and calls `saveScore` once after submit/skip, name attached; the **next-level unlock
side-effect is unaffected** (fires on today's schedule, never gated behind typing a name).
Non-high-score path stays byte-identical to today. Exact mechanism (new phase vs sub-state) is
the architect's to wire — design ratifies the _new phase_ as specced.
`narrative-designer` to confirm no per-level post-narrative beat is displaced (routine hand-off).

### Q3 — M2 IA shape → **promoted `PRESSION` header in the NIVEAUX flyer-wall shell** + **short-landscape = Option A**

- **Shape:** a glanceable `PRESSION` ballot header row above the flyer grid, inside the NIVEAUX
  rubrique body (UX §5), reusing OptionsColophon's ballot/X-stamp vocabulary and the shared
  `Prefs.difficulty`/`onSave` round-trip. **Not** a 4th sommaire rubrique, **not** a removal
  from OPTIONS. It stays writable from OPTIONS too — the header is a _second, more prominent_
  point of access on a single field. This satisfies M2 AC1 ("distinct, not buried") without the
  brittleness of a new tab, and it makes the difficulty a player is about to play at glanceable
  during the level browse (a §5 rule 4 "no bullshit" transparency win).
- **Mobile short-landscape → Option A (chosen).** No new chrome row on the `SHORT_LANDSCAPE`
  (≤480px-tall) sub-class; PRESSION stays reachable via the OPTIONS tab there (one tap,
  unchanged from today — a documented non-regression). Option B (inline F/N/D cluster in the
  44px strip) is **rejected**: it risks the tab hit targets dropping below the 44px touch floor
  at 390px (UX §3.4 non-negotiable) and reopens the already-gated `pregame-landscape-ux.md`
  chrome budget (its headline 30%→12% fix). Full parity on the narrowest slice does not justify
  breaking a gated budget and a hard a11y floor.
- **VIES grouping resolved:** only `PRESSION` is promoted; `VIES` stays in the OPTIONS/PAUSE
  consolidated surface (M3's territory). PRESSION is the "which gig, how hard" browse decision;
  VIES is a run-config modifier that belongs with settings — and keeping the header to one row
  keeps parity with the budget reasoning above.

### Q4 — `Prefs.reducedMotion` ownership between M3 and `story-timer-duel-telegraph` → **sequencing rule fixed**

Both stories add the field + toggle. Ownership split so devs never collide:

- **Schema + seed/derive logic + the CrtPass authority ADR are owned by whichever of
  {`story-timer-duel-telegraph` (S0.1), M3} opens a `prefsSystem.ts` dev lane first.** Default
  expectation = **S0.1 owns it** (it already fully specs the field, the WCAG flash cap, and
  mandates the authority ADR; it cannot ethically ship without them).
- **The other story rebases:** it consumes the shipped field, does NOT re-add it. M3's own
  Sequencing section (outcomes a/b) already encodes this — **ratified**, with the default pinned
  to S0.1-first.
- **Regardless of order, M3 owns the CONSOLIDATION work** (grouping CRT + reduced-motion under
  one "AFFICHAGE / ACCESSIBILITÉ" heading; rebuilding Pause's options body to match
  OptionsColophon; closing the pre-existing CRT toggle's `aria-pressed`/44px debt). That is the
  irreducible M3 deliverable even under outcome (a).
- **Mechanic:** `producer`/`senior-architect` check `docs/handoffs/` at sprint planning; the
  first lane to touch `prefsSystem.ts` claims the field and logs the claim. This is a producer
  sequencing mechanic; the _design_ ownership split above is unambiguous, so no dev collision.

### Q5 — `reducedMotion` default + semantics → **default `false`; live-union; single derived signal**

- **Default `false` — ratified.** Default `true` would mute the Paper-Mario unfold/motion
  identity (§5 "Paper Mario Rules" = load-bearing visual identity) for every new player. `false`
  preserves identity; the OS half of the union (below) still covers OS-reduce users out of the
  box.
- **Semantics = live union, not seed-once.** Effective reduced motion =
  `prefs.reducedMotion === true` **OR** the live OS `prefers-reduced-motion: reduce` query,
  computed as **one shared derived signal** at the render/bridge edge and read by every consumer
  (CrtPass, `print/` primitives, and — once it ships — shake/hitstop). This satisfies DRY
  ("une seule source de vérité par concept") **and** the accessibility invariant the UX spec
  states: _the toggle can strengthen reduced motion but must never weaken a live OS `reduce`._
- **Coherence conflict caught & resolved.** `story-timer-duel-telegraph.md` AC13 specs the
  OPPOSITE model — "seed once from OS, then persist, never re-polled." That model can produce a
  state **weaker than the live OS setting** (seed `true` → player toggles `false` → motion runs
  even though the OS asks for reduce), violating the invariant. **Ruling: the union model is
  canonical.** AC13 must be amended to the union model (drop seed-once; default `false`; OS stays
  a live input to the shared derived signal) **before either story ships.** Routed to
  `game-designer` (amend + re-gate AC13) and `senior-architect` (the authority ADR must
  guarantee the single derived signal). One UX consequence to handle in that work: when the OS
  forces `reduce` and the player's flag is `false`, the toggle must communicate the OS is forcing
  it (avoid a false affordance) — small state/copy note, routed to `ux-designer` + `narrative`.

### Q6 — OPTIONS/PAUSE component boundary → **outcome contract confirmed; boundary is the architect's**

Confirmed as the UX spec §3 decision #4 has it: the gate requires the **outcome** — Pause's
options body and the Menu OPTIONS colophon expose the **same field set, same labels
(char-for-char, `TUBE CATHODIQUE` canonical), same ballot/VU visual system, same a11y contract
(`role="radiogroup"`/`role="radio"` + `aria-checked`, ≥44px)** — plus the false-affordance
"prend effet à la prochaine partie" note under VIES/PRESSION in Pause. Whether that is achieved
by embedding `OptionsColophon` in `PauseScreen` or by extracting a shared sub-component is a
`senior-architect` call, not a design one. No gate objection.

### Q7 — First-run detection → **one dedicated flag `muf_seen_tutorial_nudge`**

Chosen over the UX spec's original compound `no muf_progress AND no muf_scores_*` inference.
KISS: one explicit flag is simpler and more robust than a two-key inference (which carries the
`muf_progress` default-unlock caveat and breaks if a player clears scores). The nudge already
needs a "seen" flag to be one-time, so this is **zero extra keys** — the same flag gates both
the tutorial-flyer auto-focus and the one-time visual nudge, set on the first `NIVEAUX` mount.
UX §4 updated in-file.

---

## Edits applied (surgical, in-file)

**`story-highscore-name-entry.md` (M1)**

- Scope V1: input length pinned to **max 16 chars, no minimum** (was "3-8 chars, design-loop
  call") — reuses the gated `[CREW_NAME]` budget; recorded the byline form (Q1).
- AC6: length clamp fixed to **≤16, no minimum**, empty → fallback (removes the guess a dev
  would otherwise have to make between the story's 3-8 and the UX's 16).
- DoD: the "design-loop sign-off" checkbox marked GATED with the Q1/Q2 resolutions inline.

**`story-difficulty-modifiers-separation.md` (M2)**

- Scope: recorded the chosen shape (promoted NIVEAUX header, additive, kept in OPTIONS too) and
  Option A for short-landscape.
- Scope: VIES-grouping open question resolved (VIES stays in OPTIONS/PAUSE, not promoted).
- **File map corrected** — the biggest fix: the story said "**remove** PRESSION from
  OptionsColophon" and floated a new rubrique/`DifficultyColophon.tsx`. That contradicts the
  chosen shape and would **break short-landscape difficulty access** (Option A relies on OPTIONS
  keeping PRESSION). Rewritten to: keep PRESSION/VIES in OptionsColophon (no change), add the
  PRESSION header row in the NIVEAUX body (`FlyerWall`), no `MainMenu` rubrique change.

**`spec-menus-ui-completion.md` (UX)**

- §4: first-run heuristic switched to the single `muf_seen_tutorial_nudge` flag (Q7); §4 ACs
  updated to match.
- §5: Option A marked CHOSEN with rationale (Q3).
- §6: all six open questions marked RESOLVED with the rulings above (incl. the union-vs-seed-once
  reconciliation flag on Q5).

No edits were made to `epic-menus-ui-completion.md` (M3 story `story-accessibility-settings-
consolidation.md` needed none beyond the condition below — its Sequencing section already encodes
Q4 correctly) or to `story-timer-duel-telegraph.md` (an in-flight story of another epic — its
AC13 reconciliation is _routed_, not edited here; see §Escalation).

## M3 condition

**M3 PASSes on one condition:** its `Prefs.reducedMotion` semantics must be the **live-union /
single-derived-signal** model of Q5, not a seed-once model — and it must not ship a second
reduced-motion field/authority. M3's own Sequencing section already forbids the duplicate field;
this condition additionally pins the _semantics_ so M3 and S0.1 can never ship two contradictory
reduced-motion behaviours.

---

## Escalation notes for Bertrand (flags, not blockers)

1. **Cross-epic reconciliation of `reducedMotion` (Q5).** Resolving the union-vs-seed-once
   contradiction requires amending `story-timer-duel-telegraph.md` AC13 — a story in a _different_
   epic (`socle-fidélité`) that is queued but not built. I ruled the union model canonical on a
   guideline basis (DRY + the "never weaker than OS" accessibility invariant), so this is a
   routed reconciliation, not a blocked decision. Bertrand/`producer` should be aware only for
   **sequencing/priority** across the two epics (which story ships the schema first). Not
   blocking this gate.
2. **`muf_player_name` cross-run persistence (UX §2).** The last-used byline is persisted in a
   new `localStorage` key and pre-filled/selected on subsequent high scores (one-keypress
   re-sign). This is a small additive convenience serving the "≤10s / one-action" spirit — within
   guidelines, accepted, noted here only because it introduces a new persisted identity key
   beyond `Prefs`/`ScoreEntry`.

---

## Hand-off

Design gate **PASS** for the menus/UI-completion cycle (M1, M2, M3 stories + UX spec).

**Next → `senior-architect` (Winston)** for the lane cut and an ADR of the scope decisions:

- Lane split for M1 (`dev-gameplay` schema + `dev-r3f-render` screen + shared `App.tsx`
  `NAME_ENTRY` phase wiring / deferred-save contract).
- M2 is `dev-r3f-render`-only (NIVEAUX header + `SHORT_LANDSCAPE` gate) — **sequence with M3** on
  the shared `OptionsColophon.tsx`/`PauseScreen.tsx` surfaces (both stories touch them).
- M3 + `story-timer-duel-telegraph`: enforce the Q4 single-owner rule on `Prefs.reducedMotion`,
  and record the **Q5 union model + CrtPass/`print`-vs-`Prefs` authority** in the authority ADR
  (**ADR-0054** — `story-timer-duel-telegraph`'s own AIMING/shake ADR references it rather than
  re-deciding) — with AC13 reconciled to the union model first.
- Confirm the outcome-contract-only posture on the OPTIONS/PAUSE component boundary (Q6).

**Design-side hand-offs:** `game-designer` — amend `story-timer-duel-telegraph.md` AC13 to the
union model and re-gate. `narrative-designer` — NAME_ENTRY label/kicker/fallback copy,
`MOUVEMENT RÉDUIT` label/hint, the mid-run-no-effect note, the first-run nudge copy, and confirm
no per-level post-narrative beat is displaced by `NAME_ENTRY`. `lead-art` — NAME_ENTRY byline
typography reusing the gated newsprint/rose system, the first-run nudge mark (no new assets).

**VERIFY leg (stage 5):** `game-designer` playtests the built surfaces against the gated UX spec
ACs on both device classes and reports design acceptance back to this gate.
