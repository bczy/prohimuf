# Story — Discrimination menace/innocent daltonien-safe

**Epic:** socle-fidélité (veille 2026-07-18) · **Sequence:** S0.2 · **Type:** core loop
hardening — classification law + accessibility law + graduated penalty (no new enemy
archetype, no new sprite family).

## Why

`Éviter` — "ne pas tirer l'innocent" — is the moral spine of the shooting gallery, and
today its guarantee is scattered across four implicit signals (`countsAsTarget`,
`shoots`, score/life deltas, `weight: 0`) with no single named predicate, and its only
punishment is a flat, un-graded −1 life/−1 score on the very first miss. Meanwhile the
read that lets a player *tell* menace from innocent currently leans on near-white tints
(`enemyTypes.ts`) that happen to be colour-safe by accident, never contractually so.
`veille-concurrentielle-shooters.md` §2.1 names both gaps as the discrimination pillar's
two open risks: no obligatory non-chromatic tell, and no graduated penalty curve. This
story closes both without touching a single pixel of new art or adding a new enemy —
it names the existing law, tests it, and makes the courier's punishment a curve instead
of a cliff.

## Cahier des charges check

> "Did Prohibition Atari ST have menace/innocent discrimination?"

**Yes — it is the pillar.** [FIDÈLE] for the discrimination itself: Prohibition already
punished shooting the wrong silhouette; this story does not invent that law, it names,
tests and hardens the one already implicit in `ARCHETYPES`/`courierSystem.ts`.

Two conscious extensions, both justified against the **core loop** and sourced from the
veille (§2.1), neither of which widens `Récupérer → Livrer → Éviter` — they make it
legible and fair:

- **[EXTENSION] — signe non-chromatique obligatoire (daltonien-safe).** The original
  never guaranteed its threat/innocent tell survived colour removal. Muf makes it a law:
  silhouette/pose/held-object alone must carry the read, colour only ever reinforces.
- **[EXTENSION] — barème `heat` gradué.** The original punished flatly. Muf softens the
  opening (soft score-only penalty for the first mistakes in Normal) and escalates to a
  hard bust, with Point-Blank-grade severity (5 fautes) reserved for the Hard difficulty
  — closer to Operation Wolf's forgiving heat than Point Blank's five-strikes-and-out.

## Scope (V1)

- **Classification, single source of truth.** New pure `classify(kind)` /
  `isInnocent(kind)` in `src/game/systems/classification.ts`, deriving
  `'threat' | 'reward' | 'innocent'` from `EnemyKind` alone: `normal`/`riot`/`biker`/
  `hostage_taker` → **threat**, `bonus` → reward, `civilian` → innocent. `hostage_taker`
  is the QTE captor — a menace holding a hostage (`ADR-0030`,
  `src/game/types/enemyTypes.ts` l.121-144) — not an innocent; its penalty stays entirely
  in `qteSystem` (see Out-of-scope), untouched by this classification. The courier has no
  `EnemyKind` of its own: it is classified by explicit construction as `ARCHETYPES.civilian`
  (`weight: 0`), so `classify('civilian')` is what makes `isInnocent(courier)` true — there
  is no separate courier-specific branch. `classify` is an **exhaustive switch over all 6
  `EnemyKind` members with an `assertNever` default** (no partial map), so a future kind
  forces a classification decision at compile time instead of silently defaulting. Never
  reads tint or rim colour — it replaces the four scattered implicit signals with one
  named, tested predicate.
- **Graduated `heat` penalty.** New pure `heat` (0..100) and `innocentHits` fields on
  `GameState`, reset to 0 at the start of every mission. New `heatSystem.ts`
  (`applyInnocentHit(heat, difficulty)`) that bands the consequence by resulting heat:
  soft (score only) below the life threshold, score+life above it, `BUST` (game-over) at
  the cap. **Clamp-then-fire rule (unambiguous, one implementation):** compute
  `raw = heat + HEAT_STEP(difficulty)`; if `raw >= HEAT_MAX (100)` the hit is a `BUST`
  (`bust: true`, stored `heat` clamped to `100`); otherwise stored `heat = raw` and the
  soft/vie band is chosen by comparing `raw` to `HEAT_LIFE_THRESHOLD(difficulty)`. This
  is the one condition both AC3 (Normal, raw 105 ≥ 100) and AC4 (Hard, raw 100 ≥ 100)
  read from — no dev has to reconcile two different equality checks. On BUST, `heatSystem`
  also returns a fixed reason fact, `"Trop de bavures — la descente"`, which
  `stateMachine` writes verbatim into a new pure `gameOverReason: string | null` field on
  `GameState` (reset to `null` at mission start alongside `heat`/`innocentHits`); render
  (`EndScreen`) displays it verbatim as a fact and never derives the cause itself.
  Replaces the courier's current flat −1 life/−1 score on first miss
  (`courierSystem.ts`), keeping its existing fairness rule untouched (hit only on a
  missed shot inside `COURIER_HIT_RADIUS`).
- **Reading-budget guarantee.** The classification tell (weapon/aggressive pose for
  threat, empty hands/non-aggressive pose for innocent) renders from the archetype's
  very first `APPEARING` frame — never introduced only at `SHOOTING`. Because a shooter
  cannot open fire before `APPEARING(0.3s) + VISIBLE(≥2.0s)`, this guarantees ≥ 300 ms
  of glance-legibility at crosshair distance, matching the veille's `< 0,3 s` target.
- **Non-chromatic contract, spec only.** This story specifies the *read* (silhouette/pose
  survives grayscale + daltonization with zero reliance on tint); it does not draw new
  art. Confirmation that existing/future silhouettes satisfy it is a `lead-art` /
  `concept-artist` hand-off, gated before this story can go PASS.
- **Distinct failure feedback.** `PointHitEvent` (`src/game/types/feedback.ts`) gains an
  optional `severity: 'innocent'` marker; render consumes it to show an ultra-legible
  "BAVURE" feedback (Hogan's Alley MISS-counter lineage), visually separable from both a
  normal miss and a kill, one reserved accent colour drawn from the **existing neon
  palette only** (art-direction §2.1: orange/cyan/magenta/green — no new hue, MadWorld
  rule, no second "impact" colour). The "BAVURE" text must **not** float over the target
  (no HUD text over targets in the original — veille §2.3 anachronismes bannis); it reads
  as a fanzine-style stamp/counter, not an on-target label. This constraint is routed to
  `lead-art` as a peer-lead coherence flag alongside the silhouette confirmation pass
  (see DoD). No new screenshake/hitstop — that is a separate socle story.
- **Difficulty-scoped tuning.** `HEAT_STEP` and `HEAT_LIFE_THRESHOLD` exposed per
  difficulty (Normal, Hard, **and Easy** — `Difficulty` is `'easy'|'normal'|'hard'` and
  `DIFFICULTY_CONFIG` is a total `Record<Difficulty, ...>`; a partial config fails to
  typecheck) from level/difficulty config, not hardcoded in the system. Easy inherits the
  Normal values as its V1 placeholder (see Tuning table) — same as every other
  not-yet-tuned Easy knob in this system, subject to the existing playtest pass.

## Tuning (à playtester, non gaté)

| Knob | Start value | Note |
| --- | --- | --- |
| `HEAT_MAX` | `100` | Plafond = BUST. Fixe, pas un levier de feel. |
| `HEAT_STEP_NORMAL` | `15` | 3 bavures soft (15/30/45), vie perdue à partir de la 4e, bust à la 7e — le "départ soft" du scope. |
| `HEAT_STEP_HARD` | `20` | Sévérité Point Blank : bust à la 5e bavure. Réservé au mode difficile. |
| `HEAT_STEP_EASY` | `15` (= Normal) | Placeholder V1 — hérite de Normal faute de tuning dédié ; le knob doit exister (config `Record<Difficulty,...>` totale) même si la valeur n'est pas encore jouée. À playtester comme le reste de la table. |
| `HEAT_LIFE_THRESHOLD_NORMAL` | `60` | Heat à partir duquel une bavure coûte aussi une vie (Normal). |
| `HEAT_LIFE_THRESHOLD_HARD` | `20` | Hard : coût en vie dès la 1re bavure, aucun départ soft (intentionnel). |
| `HEAT_LIFE_THRESHOLD_EASY` | `60` (= Normal) | Placeholder V1, même statut que `HEAT_STEP_EASY`. |
| `INNOCENT_SCORE_PENALTY` | `-1 pt / bavure (plat)` | Aligné sur `ARCHETYPES.civilian.scoreDelta` actuel. L'escalade porte sur heat→vie→bust, pas sur le score. |
| `HEAT_DECAY_PER_SEC` | `0 (OFF)` | Pas de rédemption en MVP ; knob à rouvrir plus tard, une variable à la fois. |
| `READING_BUDGET_MIN_MS` | `300` | Plancher garanti = `APPEARING_DURATION` actuel. Ne jamais descendre en dessous — c'est la cible veille §2.1. |

> [GATE-FLAG] The bavure-count tables above silently assume enough starting lives to
> survive to the heat-BUST. `DEFAULT_PREFS.lives = 3` (`prefsSystem.ts`), and lives is a
> configurable 1–5 counter also mutated by combat hits — not isolated from this system.
> Under the **default** 3 lives: Normal's life-losing bavures (4th/5th/6th) deplete lives
> to 0 at the 6th bavure, triggering the existing life-depletion `GAME_OVER` **before**
> the 7th-bavure heat-BUST AC3 describes; Hard's life-losing bavures (1st onward) deplete
> 3 lives by the 3rd bavure, before the 5th-bavure heat-BUST AC4 describes. As tuned, the
> heat-BUST path is only reachable at lives ≥ 4 (Normal) / lives = 5 (Hard, and it ties
> with life-depletion at exactly 5) — i.e. it is dead code under the shipping default.
> This needs a game-designer (Sacha) call, not a PM guess: either (a) retune
> `HEAT_LIFE_THRESHOLD`/`HEAT_STEP` so the heat curve and the default life count are
> compatible, or (b) explicitly accept that heat-BUST is a rare, higher-lives-only
> outcome and restate AC3/AC4 as conditional on lives available, with life-depletion
> `GAME_OVER` as the ordinary outcome at default settings. Whichever a same-tick tie
> between the two `GAME_OVER` triggers resolves to must also be picked (see AC3/AC4
> precedence note below, added as the interim rule pending this decision).

## Accessibility (daltonien-safe law — baseline, no toggle)

This is a **law**, not an opt-in setting: gating non-chromatic legibility behind a
settings-screen toggle would leave colourblind players playing an objectively harder
game by default, which violates "accessibility is a floor, never a feature." It ships
ON for everyone.

| # | Given | When | Then |
| --- | --- | --- | --- |
| A1 | Any archetype at `VISIBLE` (innocent vs threat) | Colour is stripped (grayscale + protanopia/deuteranopia/tritanopia daltonization filter over a real screenshot) | Menace vs innocent still reads from silhouette/pose/held-object alone, zero reliance on tint — same "silhouette first" law `art-direction.md` §2 already enforces, applied to the moral read. Ambiguity found = art fault (concept-artist/lead-art), not a story fault. |
| A2 | An enemy fully `VISIBLE` at crosshair distance | Pose becomes visible | Classifiable within < 0,3 s (glance-legibility check: an observer shown the frame for 300 ms calls it correctly) — and the same holds on the daltonized/desaturated version, no accuracy drop. |
| A3 | Current `ARCHETYPES` tints (`normal #ffffff`, `riot #dbe9ff`, `biker #fff7e0`, `civilian #d8ffe2`) | Reviewed against this law | Flagged (not pass/fail here) to `lead-game-designer`/`lead-art`: tints are already near-white/low-saturation, so the law's real guarantee rests entirely on pose/silhouette distinctness — needs a `concept-artist`/`lead-art` confirmation pass before this story gates PASS. |
| A4 | The existing `hostage_taker` QTE ("OTAGE" warning, text not colour) | This story's grammar is specified | Reused as house precedent: text/typographic tells are an accepted non-chromatic channel for genuinely exceptional beats — does **not** license floating labels over routine window pop-ups (rejected: fails the cahier des charges test, no HUD text over targets in the original). |
| A5 | No HUD element changes as part of this story | Verifying scope | No new aria attributes/touch targets owed. CONDITIONAL: if implementation later adds an on-screen menace/innocent legend key, it must carry `aria-label` (or `aria-hidden="true"`) and, if interactive, a ≥44×44px hit target. |

## Acceptance criteria

| # | Given | When | Then |
| --- | --- | --- | --- |
| AC1 | An occupant kind `K` | `classify(K)` is called | Returns `'threat'` for `normal`/`riot`/`biker`/`hostage_taker` (the hostage_taker is the QTE captor — a menace, per ADR-0030 — not an innocent), `'reward'` for `bonus`, `'innocent'` for `civilian`; courier `isInnocent` is `true` because the courier is classified via `classify('civilian')` (`ARCHETYPES.civilian`, weight 0) — there is no courier-specific branch. Implementation is an exhaustive switch over all 6 `EnemyKind` members with an `assertNever` default (totality test: adding a 7th kind without a case fails to typecheck). Signature takes no colour input (structural test: reads neither tint nor rim). |
| AC2 | Fresh mission, Normal difficulty, full lives | Player shoots exactly ONE innocent (courier) | Lives unchanged, score −1, `heat = 15`, `innocentHits = 1`, no bust — soft start verified. |
| AC3 | Normal difficulty, **starting lives ≥ 4** (see `[GATE-FLAG]` above — under the default 3 lives, ordinary life-depletion `GAME_OVER` fires first at the 6th bavure and this table's BUST branch does not trigger) | Bavures chain up | Deterministic table using the clamp-then-fire rule (`raw = heat + HEAT_STEP_NORMAL`; BUST iff `raw >= HEAT_MAX`): bavures 1–3 (raw 15/30/45, below threshold 60) no life lost; bavures 4–6 (raw 60/75/90, ≥ threshold 60) −1 life each; 7th bavure (raw 105 ≥ 100) ⇒ BUST, stored `heat` clamped to 100, `gameOverReason = "Trop de bavures — la descente"`. |
| AC4 | Hard difficulty, **starting lives = 5** (see `[GATE-FLAG]` above — at any lower default this table's BUST branch ties with or is preempted by life-depletion `GAME_OVER`) | Bavures occur | −1 life from the 1st bavure onward (raw heat 20/40/60/80 ≥ threshold 20 every time); at the 5th bavure `raw = 100 >= HEAT_MAX` ⇒ BUST, `gameOverReason = "Trop de bavures — la descente"` — Point Blank severity (5 fautes). |
| AC5 | Any window occupant | Enters `APPEARING` | Its non-chromatic classification tell (armed/aggressive silhouette for threat, empty hands for innocent) renders from this very first frame; a shooter cannot open fire before ≥ 300 ms after becoming visible. |
| AC6 | Effects-off / grayscale render path (rim + tint removed, §8.4.5 reduced-motion) | A threat and the courier are both on screen at in-game size (screenshot verify) | Each is correctly classed by silhouette/pose alone — colour is never the only channel (daltonien-safe test). |
| AC7 | A shot resolves on an innocent | Feedback event is produced | `PointHitEvent` marked `severity: 'innocent'` drives a distinct "BAVURE" failure feedback, visually separable from a normal miss and from a kill, one reserved accent colour drawn from the existing neon palette only (no new hue, MadWorld rule), rendered as a stamp/counter — never a label floating over the target. |
| AC8 | Start of a new mission | State initialized | `heat = 0`, `innocentHits = 0`, and `gameOverReason = null` — no carry-over between missions (including chained `LEVEL_COMPLETE` → next-level starts, not only the first mission load). |

## File map (lane assignment hint for Winston)

| Lane | File(s) | Change |
| --- | --- | --- |
| `dev-gameplay` | `src/game/systems/classification.ts` (new) | Pure `classify(kind)` / `isInnocent(kind)` — single source of truth, kind-only, exhaustive switch (`normal`/`riot`/`biker`/`hostage_taker` → threat, `bonus` → reward, `civilian` → innocent) with `assertNever` default. Tests in `__tests__/`. |
| `dev-gameplay` | `src/game/types/gameState.ts` | Add pure `heat: number` (0..100), `innocentHits: number`, and `gameOverReason: string \| null`; all init to 0/0/null. |
| `dev-gameplay` | `src/game/systems/heatSystem.ts` (new) | `applyInnocentHit(heat, difficulty)` → `{ heat', scoreDelta, livesDelta, bust, reason? }` banded by soft/vie/BUST using the clamp-then-fire rule (`raw = heat + HEAT_STEP`; `bust` iff `raw >= HEAT_MAX`, stored `heat'` clamped to `HEAT_MAX`). Reads `HEAT_STEP`/`HEAT_LIFE_THRESHOLD` from a **total** (`easy`/`normal`/`hard`) difficulty config. Applied exactly ONCE per hit — either here or in `stateMachine`, not both (avoid double penalty). TDD. |
| `dev-gameplay` | `src/game/systems/courierSystem.ts` | Replace the hardcoded flat penalty (`ARCHETYPES.civilian` −1/−1) with an `isInnocent(classify('civilian'))` → `heatSystem` call. Keep the fairness rule (missed-shot-in-radius) untouched. Ensure the old flat −1 life no longer leaks into the emitted `PointHitEvent`. |
| `dev-gameplay` | `src/game/systems/stateMachine.ts` | Thread `heat`/`innocentHits` through the tick; on `bust`, write `gameOverReason` and transition to `GAME_OVER`; produce the `severity: 'innocent'` feedback event; reset `heat = 0`/`innocentHits = 0`/`gameOverReason = null` on every mission start (including chained level transitions from `LEVEL_COMPLETE`). Define precedence when a life-depleting hit and a heat-BUST land in the same tick (see `[GATE-FLAG]` in Tuning). |
| `dev-gameplay` | `src/game/types/feedback.ts` | Extend `PointHitEvent` with optional `severity: 'innocent'` marker (cosmetic-only, no rule change). **Serialization point:** dev-gameplay lands this additive/optional change first; dev-r3f-render consumes after — the only cross-lane shared file in this story. |
| `dev-gameplay` | difficulty config (e.g. level params / `buildLevelParams`) | Expose `HEAT_STEP` + `HEAT_LIFE_THRESHOLD` per difficulty as a total `Record<'easy'\|'normal'\|'hard', ...>` (Easy inherits Normal values as V1 placeholder, per Tuning table). No new render logic. |
| `dev-r3f-render` | `src/render/effects/` or `ui/` (BAVURE feedback) | Consume `severity: 'innocent'` → distinct "BAVURE" failure feedback, separable from miss/kill, one accent colour from the existing neon palette only (no new hue), rendered as a stamp/counter — never a label floating over the target. Land only after the `feedback.ts` change above. Style is `lead-art`'s call within these constraints. |
| `dev-r3f-render` | `src/render/ui/EndScreen.tsx` | Consume the new `gameOverReason` fact and display it verbatim on the BUST game-over screen (current props are `phase`/`score`/`wave` only — add `gameOverReason`). Render must not derive the cause, only display the fact. |
| `dev-r3f-render` | `src/hooks/useGameLoop.ts` | Bridge only: map the innocent event to the failure floater; surface `heat`/`gameOverReason` to render if a display is retained (see Out-of-scope: no continuous heat bar). No rules in the hook. |
| `lead-art` (hand-off, not owned here) | `src/game/levels/levelArt.json` silhouettes | Confirm menace (weapon/pose) vs innocent (empty hands) read distinctly in pure grayscale at in-game size, colour reinforcement only; **and** confirm the BAVURE accent colour is drawn from the existing neon palette and the text does not float over the target. Read spec (< 0,3 s, colour-independent) is this story's; style is theirs. |
| `tech-writer`/`senior-architect` | `docs/adr/` (new ADR, **mandatory**) | New `heat`/`innocentHits`/`gameOverReason` state on `GameState`, a new BUST fail-outcome, and the graduated courier penalty replacing a flat one are three contract changes at once — an ADR is required, not conditional. Reference `ADR-0004` (kind classification) and `ADR-0030` (hostage_taker QTE contract). Number allocation = producer/tech-writer; decision = architect. |

## Out of scope (V1)

- Any HUD "heat bar" display: `PROJECT_GUIDELINES.md` §6 reserves tension signalling to
  music alone — a continuous heat bar would violate that. If any display is kept, it
  must be a discrete fanzine stamp ("BAVURE ×N"), never a continuous meter; decision
  deferred to `ux-designer` + gate.
- Unifying the hostage-taker QTE penalty (`qteSystem.zoneAt`) with `heat` — stays a
  separate, existing penalty in this story. `classify(hostage_taker) = 'threat'` (see
  Scope) makes this consistent: the classification predicate does not gate or replace
  the QTE penalty, it simply never labels the captor `'innocent'`.
- Reactivating the window `civilian` (currently `artRetired weight: 0`, ADR-0029) as a
  second living innocent. The courier remains the sole innocent target for this story;
  a window innocent needs new art and is a separate scope call.
- Escalating (non-flat) score penalty per bavure — one variable at a time, not this pass.
- Any new screenshake/hitstop tuning (separate socle story).

## Definition of Done (per `PROJECT_GUIDELINES.md` §9)

- [ ] TDD: Vitest for `classification.ts` and `heatSystem.ts` written first; AC1–AC4 and
      AC8 covered and green, including the `assertNever` exhaustiveness test for
      `classify` and the total (`easy`/`normal`/`hard`) difficulty config; full suite
      green (`rtk vitest`).
- [ ] `rtk tsc` clean, no `any`.
- [ ] `rtk lint` clean; Prettier applied.
- [ ] `src/game/**` boundary respected — `classification.ts`/`heatSystem.ts` hold no
      React/Three import; render only consumes the `severity` marker and the
      `gameOverReason` fact (never derives it).
- [ ] `lead-art`/`concept-artist` confirmation pass, covering BOTH: (1) menace vs
      innocent silhouettes read distinctly in pure grayscale + daltonization simulation
      (AC6/A1/A3), and (2) the BAVURE accent colour is drawn from the existing neon
      palette (no new hue) and its text does not float over the target — required before
      this story can gate PASS.
- [ ] Browser validation: soft-start table (AC2/AC3) and Hard severity (AC4) verified by
      play at the starting-lives assumption resolved by the `[GATE-FLAG]` above; "BAVURE"
      feedback visually distinct from miss/kill (AC7).
- [ ] ADR added (mandatory, not conditional) for the `heat`/`innocentHits`/
      `gameOverReason` state, the new BUST fail-outcome, and the graduated courier
      penalty — number from producer/tech-writer, decision content from architect.
- [ ] Hand-off logged in `docs/agent-handoffs.md` (or sharded `docs/handoffs/`).
