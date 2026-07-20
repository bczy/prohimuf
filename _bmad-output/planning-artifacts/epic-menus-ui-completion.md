# Epic — Menus / UI / HUD completion (post pre-game-redesign audit)

**PM:** John · **Date:** 2026-07-20 · **Intake:** Bertrand — menu/UI/HUD audit, verbatim
7-item gap list · **Status:** ready-for-design (stories 1–2 are render-only IA work →
`ux-designer`/`game-designer` light touch; story 3 is cross-boundary → full design loop +
`senior-architect`).

## Context

Bertrand audited `src/render/ui` against the shipped game and flagged 7 gaps. Since his
list was written, `story-pre-game-experience-redesign` (ADR-0021, "PARIS-MINUIT"/flyer-wall/
OURS-colophon reskin) **already shipped** and quietly closed two of the seven items as a
side effect. This epic re-verifies each gap against the current code (not assumption),
applies the cahier-des-charges test, and scopes only what's still actually missing.

## Gap audit (verified against code, 2026-07-20)

| # | Bertrand's gap | Current state (verified) | Verdict |
| --- | --- | --- | --- |
| 1 | High-score name entry | `highScoreSystem.ts` `ScoreEntry` has no name field; `App.tsx` computes `isHighScore` (`App.tsx:439`) but only feeds it to the live in-HUD `★HI` flag (`ScoreReadout.tsx`) — `EndScreen.tsx` never reads it, no entry step exists, the score auto-saves anonymously on `GAME_OVER`/`LEVEL_COMPLETE` (`App.tsx:226-228`). **Gap confirmed.** | **[FIDÈLE]** — arcade lineage + PROJECT_GUIDELINES §8 "leaderboard" explicitly in scope. → `story-highscore-name-entry.md` |
| 2 | Settings menu complet | Already substantially shipped by the redesign: `OptionsColophon.tsx` (MENU ▸ OPTIONS) has SFX, music, VIES, PRESSION (difficulty), CRT. `PauseScreen.tsx` mirrors SFX/music/CRT (deliberately omits VIES/PRESSION — can't change mid-run, correct). The one real hole is accessibility (see #4). | **No standalone story** — folded into #4 per the sizing note below (no speculative settings invented, YAGNI). |
| 3 | Controller remapping UI | There is nothing to remap: input is mouse-position + left-click (desktop) or one-finger-swipe + two-finger-tap (mobile) — no keybinding scheme exists anywhere in the codebase. PROJECT_GUIDELINES §5 rule 5: "déplacement + une action — appris en 10 secondes." | **[REJETÉ]** — see "Rejected items" below. No story. |
| 4 | Accessibility settings (reduced to CRT toggle) | Confirmed: `Prefs` (`prefsSystem.ts`) has only `crt`, no `reducedMotion` field. Reduced-motion is honoured **live and independently** in two places without a player-facing toggle: `CrtPass.tsx:70-85` (`window.matchMedia` + change-listener, freezes CRT grain/flicker) and the `print/` primitives (per `story-pre-game-experience-redesign` plan §1.1: "`prefers-reduced-motion` is honoured inside `PaperSheet`/primitives … forced to 0"). A player who can't or doesn't set the OS-level preference has **zero in-game way** to reduce motion. `story-timer-duel-telegraph.md` (queued, not yet built — no handoff logged, `reducedMotion` absent from code) **already specs** adding `Prefs.reducedMotion` + a toggle (AC13–AC19) and explicitly flags the `CrtPass`-vs-`Prefs` dual-authority question as a `[GATE-FLAG]` for the architect to resolve. **Gap confirmed, with a real sequencing dependency.** | **[EXTENSION]** conscious & justified (accessibility). → `story-accessibility-settings-consolidation.md` — scoped to NOT duplicate `story-timer-duel-telegraph`'s pref/toggle work; see that story's "Sequencing" section. |
| 5 | Tutorial flow menu (exists in code, no UI entry point) | **Already resolved** by the redesign. `FlyerWall.tsx` renders the tutorial as its own manila-stock "mode d'emploi" flyer (`STOCK.manila`, always unlocked: `isTutorial \|\| unlockedLevels.has(...)`), and `App.tsx:handlePlay` special-cases `level.kind === "tutorial"` → `setAppPhase("TUTORIAL")` (`App.tsx:259-262`). This is a live, reachable, keyboard/pointer-navigable entry point today. | **No story** — closed by prior work. Flagged so Bertrand can re-verify in-browser and close the item on his side. |
| 6 | Leaderboard (local high-score only) | The shipped leaderboard **is** the in-scope item: `ScoresUne.tsx` (PARIS-MINUIT journal UNE), backed by `highScoreSystem.ts` (`localStorage`, per-level, top 10). PROJECT_GUIDELINES §8 explicitly scopes "leaderboard" (in) and explicitly excludes "Backend / serveur / base de données" (out) — so "local only" is not a gap, it is the correct, guideline-mandated shape. An **online/shared** leaderboard would require a backend. | **[REJETÉ]** for anything beyond local — see "Rejected items" below. The one real completion gap under this heading is name entry, already covered by #1. |
| 7 | Difficulty/modifiers not separated from OPTIONS | Confirmed: `PRESSION` (difficulty) lives as one `BallotRow` inside `OptionsColophon`, alongside SFX/music/VIES/CRT — no visual or navigational distinction from general settings. PROJECT_GUIDELINES §8 explicitly scopes "niveaux de difficulté" as full-feature-set-original. | **[FIDÈLE]** — small IA fix. → `story-difficulty-modifiers-separation.md` |

## Stories in this epic

| Seq | Story | Size | Lane(s) | Depends on |
| --- | --- | --- | --- | --- |
| M1 | `story-highscore-name-entry.md` | S | dev-gameplay (schema) + dev-r3f-render (screen) — cross-boundary, needs `senior-architect` lane split | none |
| M2 | `story-difficulty-modifiers-separation.md` | XS | dev-r3f-render only | none (can run parallel to M1) |
| M3 | `story-accessibility-settings-consolidation.md` | M | dev-gameplay (pref field, IF not already landed) + dev-r3f-render (toggle UI, consolidation) | **soft dependency on `story-timer-duel-telegraph`** — see story for the sequencing rule |

All three are render-facing IA/UX work with no core-loop change; each still needs a design-loop
pass (`ux-designer` at minimum; `game-designer` only if M3's tuning/telegraph interaction is
touched) before `senior-architect` assigns final lanes, per COLLABORATION.md flow.

## Rejected items (documented per PROJECT_GUIDELINES §1 cahier-des-charges test)

**Controller remapping UI — REJECTED.** There is no keybinding scheme to remap: the entire
control surface is mouse-position-as-aim + one click (desktop) or one-finger-swipe-pan +
two-finger-tap-shoot (mobile). PROJECT_GUIDELINES §5 rule 5 mandates controls stay
"déplacement + une action — appris en 10 secondes"; a remapping UI would be config for a
control scheme that doesn't exist (YAGNI, §2) and Prohibition (Atari ST) never had one
(cahier-des-charges: No → would need to be a conscious extension, and there is no player
value to justify it — nothing to remap). If a future story introduces genuine rebindable
keys, this verdict should be revisited then, not before.

**Online / shared / server-backed leaderboard — REJECTED.** PROJECT_GUIDELINES §8 explicitly
lists "Backend / serveur / base de données" as **out of scope**. The in-scope leaderboard is
the local, per-device `PARIS-MINUIT` journal already shipped; §10 Sprint 4+ additionally
scopes a "leaderboard narratif (UNE de journal fictif)" which is exactly what shipped. Any
cross-device/online ranking would require a backend and is a hard reject, not a sizing call.

## ADR note

`story-accessibility-settings-consolidation.md` and `story-highscore-name-entry.md` each
change a persisted schema (`Prefs`/`ScoreEntry`) and, for M3, resolve the
`CrtPass`-vs-`Prefs.reducedMotion` authority question already flagged by
`story-timer-duel-telegraph`. **ADR-0054** (`docs/adr/0054-menus-ui-completion-scope-and-
contracts.md`) records the scope verdicts, the `NAME_ENTRY` phase + deferred-save contract,
the `reducedMotion` live-union authority (canonical over `story-timer-duel-telegraph` AC13's
seed-once model), and the OPTIONS/PAUSE extract-a-shared-component boundary.
`story-difficulty-modifiers-separation` is presentation-only (no schema change) and needs no
ADR of its own.

## Open questions for the `lead-game-designer` gate

1. **M1 signature format.** Is the high-score "name entry" a classic 3-initial arcade input,
   or a fanzine-native equivalent (a scrawled tag/pseudo in the `FONT.hand` "Caveat" felt-tip
   register, consistent with flyer annotations)? PM's provisional lean is the fanzine tag
   (more in-universe, avoids reinventing the 3-letter-cycler UI pattern with mouse/touch-only
   input) — `game-designer`/`ux-designer` to confirm or override.
2. **M1 trigger point.** Should name entry happen on `EndScreen` (after `GAME_OVER`/
   `LEVEL_COMPLETE`, gated on `isHighScore`) or as its own phase between `PLAYING` and `END`?
   Affects `App.tsx` phase wiring — architect call once design confirms the UX flow.
3. **M2 IA shape.** Is "separate difficulty from OPTIONS" a new sommaire rubrique (4th tab
   next to NIVEAUX/SCORES/OPTIONS), a sub-section within the existing OPTIONS surface with a
   visual break, or folded into the flyer-selection step itself (difficulty-per-attempt)? PM
   states the *what* (must read as distinct, not buried in a generic settings list) — the
   *how* is a design-loop call, sized to stay small (XS).
4. **M3 sequencing.** Should `story-accessibility-settings-consolidation` be blocked until
   `story-timer-duel-telegraph` lands (avoiding two lanes racing to add `Prefs.reducedMotion`),
   or should M3 own the pref addition and `story-timer-duel-telegraph` be updated to consume
   it? `producer`/`senior-architect` to call at sprint planning — flagged, not decided here.

## Cross-reference

- UX spec for these surfaces (in progress in parallel, `ux-designer`/Sally): expected under
  `docs/game-design/ux/` (exact filename TBD — none of the three menu-completion topics has
  a spec file yet as of this writing; the existing UX docs there cover flyer-wall format and
  the two QTE HUD reads only).
- Prior art / conventions to follow: `_bmad-output/planning-artifacts/story-pre-game-
  experience-redesign.md` + `plan-pre-game-experience-redesign.md` (the print-system tokens,
  lane-partition pattern, and ADR-0021 boundary rulings these three stories should reuse
  rather than reinvent).
