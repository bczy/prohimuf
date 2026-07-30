# Story — Run stats system (local-first)

**Type:** new feature, cross-boundary (game counters + end-of-run render + localStorage
bridge). **Stage:** opening (pre-design-loop). **Origin:** crew brainstorm, 2026-07-30,
consensus captured below.

## Why

`muf` has no feedback loop today beyond a raw score number that vanishes when the tab
closes. Two audiences need more, for different reasons:

- **The player** wants a legible answer to "how did that run go?" beyond a digit — did I
  actually get better at the loop (récupérer → livrer → éviter), or did I just get lucky?
- **Bertrand-the-playtester** (and any future playtester) currently has no way to report a
  run except "it felt hard" in Discord. A one-tap "copy my report" turns every playtest
  session into a structured, comparable data point — without asking anyone to install
  anything or send anything over a network.

Both needs are served by the same underlying thing: pure, deterministic counters on the
core loop, aggregated at run end, surfaced briefly, and optionally exported.

## Cahier des charges check

> "Did Prohibition Atari ST have a stats system?"

**[EXTENSION CONSCIENTE]** — Prohibition Atari ST had a score and nothing else; it did not
track a funnel, a run history, or an export. This story is a deliberate, documented
extension, justified by:

1. It does not touch or replace the core loop (récupérer → livrer → éviter) — it only
   *observes* it.
2. It stays inside the project's existing local-first posture (PROJECT_GUIDELINES §8:
   "Backend / serveur / base de données" is explicitly OUT of scope) — zero network, zero
   telemetry, zero accounts. Everything lives in `localStorage`, same trust boundary as
   the Sprint 4 high-score list already on the roadmap.
3. Its stated purpose is playtest instrumentation for a team with no analytics backend —
   not a retention/engagement mechanic. If a future story ever proposes turning this into
   networked telemetry or a SaaS analytics hook, that is a *new* decision requiring its own
   scope justification — not implied by this one.

## User stories

- **As a player**, when my run ends, I want to see 2-3 numbers I can read at a glance (not
  a wall of stats), so I understand what I did well without doing math.
- **As a player**, I want a "details" option I can ignore, so the default end screen stays
  fast and doesn't slow down my next attempt.
- **As Bertrand playtesting the build**, I want a "copy my report" button that puts a
  structured JSON blob on my clipboard, so I can paste it straight into the crew Discord
  without transcribing numbers by hand.
- **As Bertrand reviewing playtest feedback over several sessions**, I want the game to
  remember, locally, whether I've seen the title screen, finished the tutorial, made my
  first delivery, and reached Belliard, so repeat playtesters aren't asked to re-report
  onboarding milestones every single run.

## Scope (V1)

### IN

1. **Per-run counters**, computed as pure, deterministic state in `src/game` (no
   `Date.now()`/`Math.random()` inside the counting logic itself — a run's summary must be
   reproducible from its tick sequence, same TDD bar as the rest of `src/game`).
2. **A minimal v1 event list** (see below) — count what serves the core loop, nothing more.
3. **End-of-run display**: 3 headline metrics shown immediately and without extra input,
   plus an optional "detail" expansion for the rest. Exact choice of which 3 metrics and
   the screen's exact layout is a **design-loop decision** (game-designer + ux-designer),
   not decided in this story — see hand-off note below.
4. **Funnel persistence in `localStorage`**: four one-way milestones — title screen seen →
   tutorial finished → first delivery made → Belliard reached. Each flips once, never
   resets, survives reloads.
5. **"Copy my report" export**: serializes the current run's stats (+ funnel state) to
   JSON and writes it to the clipboard on a single explicit action. No auto-copy, no
   auto-submit anywhere.
6. Optional, only if it stays cheap: a small local run history (last N runs) in
   `localStorage`, purely so a returning playtester can eyeball a trend — not a ranking, not
   a leaderboard (see risk #1 below).

### OUT

- Any network call, any remote endpoint, any SaaS analytics SDK (Segment, Amplitude,
  PostHog, etc.) — zero exceptions.
- User accounts, login, identity of any kind. The "player" is anonymous and local to one
  browser profile.
- Turning this into the Sprint 4 competitive high-score/leaderboard feature — that is a
  separate, already-roadmapped story (`docs/roadmap.md` Sprint 4). This story's optional
  run history is a personal diagnostic log, not a ranked list, and must not compete with or
  duplicate the high-score storage key/shape.
- A stats dashboard, charts, graphs, or any screen beyond the end-of-run summary + its
  detail expansion.
- Achievements, badges, or any progression system hung off the funnel — the funnel is
  read-only instrumentation, not a reward mechanic, in this story.
- Automatic sharing (auto-post to Discord/social). The export is manual, one paste at a
  time, by the player's own action.

## Minimal v1 event list (YAGNI pass)

Proposed — not gospel, open to a one-round design-loop challenge, but this is the floor,
not a starting sketch to pad:

| # | Counter | Why it's IN (ties directly to the core loop) |
| --- | --- | --- |
| 1 | Deliveries completed | The "Livrer" half of the loop's success condition. Without it there is no stats system at all. |
| 2 | Pickups collected | The "Récupérer" half. Pairs with #1 to show the full supply chain, not just the payoff. |
| 3 | Lives lost / deaths | The "Éviter" half's *failure* signal — the loop's risk side needs a counter or the report is one-sided. |
| 4 | Run duration (derived from the existing timer, not a new clock) | Lets "how did that run go" be read against time, and lets a playtester report pacing without guessing. |
| 5 | Final score (already computed) | Already exists — carrying it into the report costs nothing and is the one number players already recognize. |

Explicitly cut for v1 (candidates for a later story if a real need shows up, not implied by
this one): shots fired / accuracy, per-enemy-type kill breakdown, per-wave timing splits,
near-miss counts, distance traveled. None of these are needed to answer "did I get better
at récupérer → livrer → éviter", which is the only question this story commits to
answering.

## Acceptance criteria

| # | Given | When | Then |
| --- | --- | --- | --- |
| AC1 | A run is in progress | A delivery/pickup/life-loss event happens (per the loop's existing rules) | The matching counter increments exactly once per event — no double-counts, no missed counts, verifiable by a deterministic tick-by-tick test. |
| AC2 | A run ends (`GAME_OVER` or `LEVEL_COMPLETE`) | The end screen renders | Exactly 3 headline metrics are visible without any extra tap/click; the rest is behind a single, clearly-labeled "detail" action. |
| AC3 | The end screen's detail view | The player opens it | It shows all 5 v1 counters (see table above) and nothing invented beyond them. |
| AC4 | The player taps "copy my report" | The action fires | A JSON blob containing the run's 5 counters + the 4-step funnel state is written to the clipboard; no network request is made (verifiable — no `fetch`/`XMLHttpRequest` in the code path). |
| AC5 | Clipboard write fails (permission denied, unsupported browser) | The player taps "copy my report" | The player gets a visible, non-crashing fallback (e.g., selectable text) — never a silent no-op, never an uncaught error. |
| AC6 | A fresh browser profile (no prior `localStorage`) | The player reaches the title screen, finishes the tutorial, makes a first delivery, and reaches Belliard, across any number of sessions/reloads | Each of the 4 funnel milestones flips to "reached" exactly once, in order, and survives a full page reload after each step. |
| AC7 | The funnel/stats `localStorage` keys | Inspected against the existing high-score `localStorage` keys (`muf_scores_<levelId>`, per `story-highscore-name-entry.md`) | They are namespaced distinctly and never read/write the same key — no shared mutable state between the two features. |
| AC8 | Any counter-computing code in `src/game` | Reviewed against PROJECT_GUIDELINES §2/§4 | It is pure, has no import from React/R3F, and is covered by Vitest tests written before the implementation (TDD). |
| AC9 | The end-of-run screen with the new metrics | Reviewed against PROJECT_GUIDELINES §5 | It adds no mandatory extra step to the restart loop — dismiss/restart remains a single action; the detail view and export are both optional and skippable. |

## Hand-off note for the design loop

This story deliberately does **not** decide:
- Which 3 of the 5 counters are the "headline" ones shown by default (or whether it's a
  different cut, e.g. score + deliveries + a computed derived stat) — `game-designer` call,
  since it's a legibility/tuning-feedback question.
- The exact visual form of the end-of-run summary and detail expansion — `ux-designer` +
  fanzine visual language (`lead-game-designer` gate).
- Any copy/voice for the funnel milestones or the report's framing — `narrative-designer` if
  it needs in-universe flavor text (may not: this can be a diagnostic overlay, not
  necessarily in-fiction).

## Risks

1. **Duplication with Sprint 4 high scores** (`docs/roadmap.md`, not yet built). Both
   features want `localStorage` and both touch "how did this run go." Mitigation: this
   story's optional run history is explicitly a personal log, not a ranked list (see Scope
   OUT); AC7 forces distinct storage keys; when Sprint 4 lands, `senior-architect` should
   check the two features don't grow into overlapping systems.
2. **UX cost of the end-of-run screen.** Any added screen/step risks the "<10s
   launch-to-play" and "one-action skip" rules (PROJECT_GUIDELINES §5). Mitigation: AC2/AC9
   make the 3-metric view the *only* mandatory addition, with everything else opt-in.
3. **Scope creep into a full analytics suite.** "Stats system" invites inflation (funnels,
   segments, dashboards). Mitigation: the minimal-event-list table above is the hard v1
   ceiling; anything beyond it needs its own story with its own justification.
4. **Determinism drift.** If counters end up reading wall-clock time or random values
   directly instead of deriving from existing deterministic game state (e.g. the existing
   timer), they break the TDD/pure-logic bar the rest of `src/game` holds itself to.
   Mitigation: AC1/AC8 make this explicit; `senior-architect` should double-check the
   counter implementation touches no non-deterministic API.

## Definition of Done (per `PROJECT_GUIDELINES.md` §9)

- [ ] Tests Vitest écrits et verts pour tous les compteurs (TDD, `src/game`).
- [ ] `rtk tsc` clean, no `any`.
- [ ] `rtk lint` clean; Prettier applied.
- [ ] Validé contre le Test du Cahier des Charges — logged above (extension consciente,
      justifiée).
- [ ] `src/game/**` boundary respected: counters and funnel logic are pure; the end-of-run
      screen, clipboard write, and `localStorage` I/O live in `src/render`/bridge only.
- [ ] Browser-verified: counters increment correctly across a real run, the 3-metric view
      renders on both `GAME_OVER` and `LEVEL_COMPLETE`, "copy my report" produces valid JSON
      on the clipboard, funnel milestones persist across a reload.
- [ ] Design-loop sign-off on the 3 headline metrics and the screen's visual form
      (open question above) before dev lanes start.
