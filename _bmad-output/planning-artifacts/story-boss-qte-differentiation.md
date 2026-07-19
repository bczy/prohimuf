# Story — Boss QTE differentiation pack (5 levers, post-playtest correction)

**Epic:** direct follow-up to `story-boss-encounter-qte.md` (ADR-0051) · **Sequence:**
opened immediately after Bertrand playtested the `?preview=boss` dev-harness on PR #112
(V1, currently finishing the stage-6 review panel — **not reopened, not blocked by this
story**) · **Type:** mechanic-deepening pack, **extends** ADR-0051 (not a new feature),
cross-boundary (game + hooks + render), touches `src/game/systems/bossQteSystem.ts` +
`src/game/types/bossQte.ts` + `src/render/scene/BossQteSprite.tsx` +
`src/render/ui/hud/BossHpBar.tsx`.

## Why

Bertrand's playtest verdict on the V1 harness: **"c'est limite au même gameplay que
l'otage sans l'otage."** That is a real, structural finding, not a taste note — the V1
duel (ADR-0051 D1/D2: one wandering ring, `SHIELDED↔EXPOSED`, shoot when exposed) is,
verb-for-verb, the hostage duel's `COVERED↔PEEKING` skeleton re-themed. ADR-0051 D1 says
this explicitly: "the two QTEs share a _shape_, not a _contract_" — but shape is exactly
what the player experiences, and the fiction re-skin (a commander instead of a kidnapper)
doesn't change what the mouse does. The V1 story scoped a **capstone that fills a real
gap** ("nothing tests sustained mastery"); a boss that plays identically to a side
objective does not deliver that gap-filling, however correct its shell reuse was.

In response I proposed 10 differentiation candidates sourced from the same competitive
veille that grounded V1 (`docs/game-design/veille-concurrentielle-shooters.md` §3, Tier
S/A), adapted to "le Commandant." **Bertrand selected five, together, as one
differentiation pack** — not incrementally, one at a time. That matters for how this
story is scoped (see "Scope decision" below): the ask is not "try one lever," it is
"make the fight demonstrably not-the-hostage-duel," which plausibly needs more than one
lever landing at once to actually read as different at the table.

## Cahier des charges check

The boss itself already passed its own cahier des charges test and was RATIFIED as a
conscious **[EXTENSION]** in `story-boss-encounter-qte.md` / ADR-0051 (Prohibition ST had
no boss — veille §1). This story does not reopen that test; it is a **refinement of an
already-approved extension**, held to the same documentation standard (ADR-0030's
"conscious, documented, justified" bar), applied per lever below:

- **Récupérer / Éviter** — untouched by levers 1, 2, 3, 5 (they refine the existing
  `Livrer`-gate duel, not the shooting-gallery discrimination rule). **Lever 4
  (reinforcement wave) is the one item that risks touching `Éviter`** — see the risk
  flag below; that is exactly why it is carved out for an explicit architecture ruling
  before tuning, not folded in silently.
- **Livrer** — all five levers sit on the already-approved terminal-obstacle beat (OQ1,
  ADR-0051 D3); none of them change whether the boss gates completion, only how the duel
  plays once triggered.
- Anti-"bullshit death" guardrail (§5.6, load-bearing on both the hostage and boss
  duels) — **every one of these five levers adds new tells, new inputs, or new failure
  surfaces**, which is exactly the guardrail's jurisdiction. This story explicitly hands
  each lever's tell/floor discipline to the design loop (Open Questions below); it does
  not assume any of them are automatically as safe as the reused shell.

## Relationship to the still-open Niveau Final follow-up (read before scoping further)

V1 (ADR-0051) shipped **no live, canon, player-facing boss** — only a non-shipped
Belliard dev-harness (K2 ratification, `story-boss-encounter-qte.md` §"Decisions
post-gate"). The canon "le Commandant" live encounter, on a minimal Niveau Final level,
was named as a **separate, not-yet-opened follow-up story**. Bertrand's playtest feedback
came from the harness, which is consistent with that plan — he is iterating the system
before it ships live, exactly as intended.

**This story stays inside that same boundary.** It differentiates the SYSTEM, still
exercised via the non-shipped harness (ADR-0051 D4 unchanged: `belliard`'s live
`LevelConfig` stays byte-identical, no shipped player reaches any of this). It does
**not** fold in "ship it live" — that remains the separate Niveau-Final story.

**Advisory, not decided here:** differentiating the system before it ships live is the
right order of operations — shipping a canon boss fight that already reads as "the
hostage duel again" would waste the one-shot capstone narrative (`spec-boss-encounter-
fiction.md` §3.1: "on ne tue pas le boss final au niveau 1" applies just as much to "on
ne présente pas le boss final avec la mécanique du niveau 1"). I recommend this
differentiation story lands **before** the Niveau-Final live-ship story is opened, so
the finale spends its one true reveal on the fight Bertrand actually wants. Sequencing
call stays Bertrand's / `producer`'s to make when queuing the roadmap.

## Scope decision — one story, sequenced in two build waves, one risk carve-out

Bertrand chose these five together, as a pack — I am not going to silently fragment that
into five separate stories, each re-litigating "is this different enough" in isolation;
several of the ideas only add up to a differentiated fight in combination (one new lever
alone might still read as "hostage duel, reskinned"). But "one story" does not mean "one
undifferentiated blob" either — the five levers have real, unequal coupling and risk,
and the story-boss-encounter-qte.md precedent (the K2 carve-out, the harness/ship split)
is exactly the discipline for making that legible instead of pretending five things are
one thing. So:

### Wave 1 — the two levers that actually redefine the moment-to-moment loop (build + verify together)

- **1. Points faibles multiples (tête/corps)** — replaces (or reshapes) the base
  targeting model every other lever sits on top of: the wandering ring + `bossRingZoneAt`
  spatial-colour read (ADR-0051 D2) IS the mechanic Bertrand is calling too-similar to
  the hostage. This is foundation, not decoration — it has to be settled first because
  levers 2 and 3 both interact with "where/when is he shootable."
- **3. Parade façon Sekiro** — the other lever that changes the verb, not just the
  dressing: today "shoot when exposed" is the entire input vocabulary; a parry adds a
  second, timing-gated read on the SAME exposed/telegraph timeline lever 1 touches. This
  was explicitly named OUT of V1 scope ("Any new player verb... beyond what the existing
  QTE shell already provides" — `story-boss-encounter-qte.md` Scope decision, OUT). This
  story **consciously reopens that OUT-of-scope line on Bertrand's direct request** — I
  am flagging the reversal explicitly so it reads as a deliberate scope call, not drift.

These two are the direct answer to "c'est le même gameplay que l'otage" — they are also
the two carrying the most anti-bullshit-guardrail load (new tells, new failure surfaces)
and the most design risk, so they get first design-loop attention and their own
verification pass before Wave 2 locks in on top of them.

### Wave 2 — pacing/texture, additive once Wave 1's targeting model is frozen

- **2. Décor interactif** (lustre/enceintes stagger bonus + fumée → tell bascule vers
  l'audio) — layers on top of the existing telegraph/window model without redefining it.
  The audio-tell half needs its own accessibility pass (see Open Questions) but doesn't
  touch targeting.
- **5. Coup de grâce cinématique** — a terminal beat bolted onto the existing WON
  transition (mirrors the ADR-0034 porte-cochère execution-click precedent already
  proven on the hostage duel). Lowest risk, most self-contained of the five.

Wave 2 does not need Wave 1's tuning to be *final*, only its **shape** (what "exposed"
and "shootable" mean) to be settled, so the two waves can build in the same story/PR
sequence — I am not mandating two separate PRs, only two separate design-loop passes and
two separate verification passes within this one story, with Wave 2 explicitly not
starting tuning until Wave 1's spec is gated.

### Risk carve-out — 4. Renfort mi-combat (does NOT get tuned until this is ruled on)

This is the one lever I am not comfortable folding into either wave's default sequencing
without an explicit architecture ruling first, because of what it might cost, not what
it's worth:

- **Every QTE revision to date — ADR-0030 D3, restated at ADR-0034 and again at
  ADR-0051 D2 — has held "freeze the rest of the level" as a hard invariant.** A "brief
  wave of flics BAC" interrupting the duel is, on its face, either (a) real roster
  enemies (`riot`/`normal`) with real player-facing threat during a scene the whole
  architecture has treated as frozen, which would be the first exception to that
  invariant in the feature's history, or (b) a scripted, non-lethal pressure cue that
  never actually breaks the freeze. Those are wildly different builds with wildly
  different cost and risk, and the difference is an architecture call, not a design or
  tuning one.
- I am therefore **blocking this lever's tuning on an explicit `senior-architect` ruling**
  on the freeze-law interaction (Open Question 4-C below) before `game-designer` puts a
  single number on it. If the ruling finds a narrow, safe exception (e.g., a scripted,
  seeded, in-tableau pressure element that never leaves the QTE's own state machine),
  lever 4 folds into Wave 2. **If the ruling finds the freeze-law exception genuinely
  invasive, lever 4 is split out into its own follow-up story** rather than let it drag
  the other four levers into a boundary fight they don't need — a conditional split,
  decided by `senior-architect` at TECH PLAN, not pre-empted here.

## Open questions — for the design loop to resolve, not pre-decided here

Handed to `game-designer` (mechanic/tuning, all five), `narrative-designer` (fiction for
the decor set-dressing, the reinforcement's in-fiction justification, and the finisher
beat), `ux-designer` (the audio-tell accessibility question and the finisher/parry HUD
read), `lead-game-designer` (gate owner, and the Wave 1 / Wave 2 / carve-out sequencing
concurrence), `senior-architect` (the lever-4 freeze-law ruling, ahead of everything
else on that lever).

**1. Points faibles multiples**

- 1-A. Does this replace the CONTINUOUS wandering-ring model (today: one ring drifts
  across the boss, classified `vital`/`limb`/`off` by where it currently sits) with a
  DISCRETE alternation (the ring commits to a head-mode window or a body-mode window for
  a stretch, forcing the player to read which one is live), or does it add a genuinely
  SECOND simultaneous target (a head hitbox and a body hitbox both live at once, player
  chooses which to shoot, each with its own risk/reward)? These are mechanically
  different systems with different anti-bullshit floor needs — `game-designer`'s call,
  not assumed here.
- 1-B. If a second simultaneous target: does exposing one shield the other, or are both
  live together? This changes the difficulty curve and the telegraph budget.
- 1-C. Does this run the same way in every phase, or is "multiple weak points" itself a
  phase-2/3 escalation (i.e., phase 1 keeps the simple single-ring read as a soft
  onboarding, and the choice-under-pressure only kicks in later)? Bertrand's framing
  ("force un choix de ciblage sous pression") suggests this is meant to raise the skill
  ceiling, not the floor — worth checking it doesn't just make phase 1 harder to read.

**2. Décor interactif**

- 2-A. Is the chandelier/speaker-stack stagger a single, one-level-specific object (tied
  to the eventual Niveau Final's actual venue geometry) or a generic "interactive decor"
  system data-driven per level (mirroring how `phaseCount`/`bossHp` were architected as
  data from day one, ADR-0051 C4)? Generic buys future reuse; single-use is cheaper now
  and honest about the fact only one canon venue exists.
- 2-B. Is the stagger bonus PLAYER-TRIGGERED (the player must shoot a specific decor
  prop at the right moment — an extra target, not just ambient set dressing) or
  scripted/automatic (fires on a phase transition, no input required)? This determines
  whether it's a third thing to aim at (compounding with lever 1's targeting change) or
  pure spectacle.
- 2-C. The smoke/visibility effect shifting the tell "vers l'audio" is the one item here
  that needs real accessibility scrutiny: today the telegraph is purely visual
  (`telegraphActive`, ADR-0051 D2/D5). An audio-only tell during smoke would fail the
  same "not colour-alone" principle the game already applies elsewhere (§6 guidelines,
  ADR-0034 anti-bullshit floors), just on the audio axis instead — a deaf/hard-of-hearing
  player would face an un-telegraphed window. Does the audio tell REPLACE the visual one
  during smoke, or does it ADD a redundant channel while the visual tell is merely
  degraded/obscured (not removed)? `ux-designer` + `sound-designer` must rule on this
  before it is built, not discover it at stage-5 `verify`.

**3. Parade façon Sekiro**

- 3-A. New distinct input (a second click zone, a modifier key, a click on a specific
  "weapon" hitbox distinct from the body ring) or a reuse of the SAME single fire-click,
  reinterpreted by TIMING (a click landing during his windup frame = parry; a click
  landing during `EXPOSED` = a normal ring shot)? These have very different scope/risk
  profiles — the first is a genuinely new verb (reopening the V1 OUT-of-scope line for
  real); the second is arguably still "the existing verb," just newly meaningful during
  a window that previously did nothing. `game-designer`'s call, but the story needs the
  answer stated plainly, not left ambiguous, because it changes whether this needs new
  input-handling in `src/hooks` or stays inside `bossQteSystem.ts`'s existing tick.
- 3-B. What does a successful parry buy — a stagger that extends/reopens the current
  `EXPOSED` window (a bonus beat), straight bonus HP damage, or skipping the next
  `SHIELDED` lull? And symmetrically: what is the cost of a WHIFFED parry attempt (a
  click during his windup that lands neither on the parry nor as useful damage)? The
  story's own anti-bullshit precedent (OQ1's "every point of pressure must be
  attributable to a window you saw and failed to answer") should extend here — a missed
  parry must not be a hidden, unreadable punishment.
- 3-C. Does the parry window need its OWN telegraph, distinguishable from the existing
  `EXPOSED`-window telegraph, so the player can tell "this is a parry beat" from "this is
  a shoot beat" before committing? Given how much anti-bullshit floor discipline the
  existing telegraph already carries (`BOSS_TELEGRAPH_LEAD_FLOOR`, the `lull > lead`
  assert), a second, distinguishable tell type is likely required, not optional —
  `game-designer` to confirm and size it.

**4. Renfort mi-combat**

- 4-A. Real roster enemies (`riot`/`normal`, spawned with real player-facing damage, the
  same discrimination rules as the shooting gallery) or a scripted, non-lethal pressure
  cue (audio/HUD "renforts en approche," visual distraction at the frame edges, no
  actual shootable/damaging entity)? This is the crux the freeze-law ruling below turns
  on.
- **4-C. (Architecture, gates 4-A/4-B — answer this FIRST.)** Does spawning anything
  live during the boss QTE violate the standing "freeze the rest of the level" invariant
  (ADR-0030 D3 / ADR-0051 D2)? If the answer is "yes, and it must," is the freeze law
  amended with a narrow, explicit, still-deterministic exception scoped to this one
  scripted wave — or is "renfort" reframed to live entirely inside the QTE's own state
  machine (e.g., additional shapes at the frame edges that are part of the boss
  encounter's own scripted sequence, never touching the general enemy-spawn/roster
  system)? `senior-architect`'s ruling, requested before `game-designer` tunes anything
  on this lever (see Risk carve-out above).
- 4-B. If real enemies (4-A): does a miss against a reinforcement inflict a SEPARATE
  energy/HP cost from the boss's own blown-window drain — and if so, is that double
  jeopardy under the same pressure clock, or a genuinely distinct, forgivable side
  threat? Fairness call for `game-designer`, downstream of 4-C.
- 4-D. Fiction: `narrative-designer` to confirm the reinforcement is diegetically
  consistent with "le Commandant" already being the apex of a BAC de nuit that is itself
  "débordée" (`spec-boss-encounter-fiction.md` §1.3) — do HIS men arrive as backup (in
  tension with "il n'a plus personne pour le couvrir," the exact justification for his
  vulnerability) or is this reinforcement wave narratively distinct (e.g., a rival unit,
  not his own)? This needs to not contradict the already-gated vulnerability fiction.

**5. Coup de grâce cinématique**

- 5-A. Exact trigger shape: does the literal `bossHp` 1→0 transition immediately fire
  the finisher, or does crossing 0 open a dedicated HOLD sub-state (mirroring the
  hostage's porte-cochère execution-click precedent, ADR-0034) that the player must
  click through before `WON` resolves? The mission brief's framing ("un clic final façon
  porte cochère") suggests the latter — `game-designer` to confirm and state whether it
  REPLACES or PRECEDES the existing `QTE_RESULT_HOLD` breather.
- 5-B. Does the finisher carry its own failure mode (can the fight still be lost after
  dropping the boss to 0 HP, if the click is missed/slow), or is it a guaranteed-success
  ceremonial beat once HP hits 0 (consistent with how `QTE_BOSS_REFILL` was already
  framed as "mostly ceremonial" on a finale)? I lean toward guaranteed-success — a new
  failure surface bolted onto the moment of victory would be an odd place to introduce
  bullshit-death risk — but this is `game-designer`'s call to make and justify, not mine
  to assume.

## Architecture directive (binding on the tech-plan stage, not a suggestion)

At TECH PLAN, `senior-architect` is instructed to treat **ADR-0051 as the load-bearing
precedent** for lever 1/2/3/5, exactly as ADR-0051 itself treated ADR-0030/0034: state
which parts of the existing `bossQteSystem.ts`/`types/bossQte.ts` contract are extended
in place vs. newly authored, mirroring the revision-log discipline both prior ADRs
established. Whether this lands as an **amendment to ADR-0051** or a **new ADR that
extends it** (the same choice ADR-0051 itself faced re: ADR-0030/0034, and resolved as
"extends, does not supersede") is `senior-architect`'s call, not pre-decided here.

**Lever 4 is the one exception to "just extend ADR-0051 D2":** if `senior-architect`'s
freeze-law ruling (Open Question 4-C) finds a genuine boundary change, that ruling gets
documented as its own explicit decision (possibly its own ADR section or a distinct ADR
entirely) — it must not be silently folded into the same reuse-map paragraph as the
other four, low-risk levers.

## Acceptance criteria

| # | Criterion |
| --- | --- |
| AC1 | The gated design spec explicitly answers every Open Question above (1-A/B/C, 2-A/B/C, 3-A/B/C, 4-A/B/C/D, 5-A/B) — a spec silent on any of these is a design-gate FAIL, not a `pm`-review surprise later. |
| AC2 | The build states, per lever, which parts extend `bossQteSystem.ts`/`types/bossQte.ts` in place vs. are newly authored — mirroring the ADR-0051 revision-log discipline one level down. |
| AC3 | Exactly the five named levers ship (or, for lever 4, ship OR are explicitly carved into a named follow-up per the risk carve-out) — no additional idea from the veille's Tier S/A list is silently folded in alongside them. |
| AC4 | Lever 4 (renfort) does not receive `game-designer` tuning magnitudes until `senior-architect` has ruled on Open Question 4-C (the freeze-law interaction). A tuned lever-4 spec delivered before that ruling is a design-gate FAIL, not a pm-review surprise. |
| AC5 | An ADR change is merged — amendment to ADR-0051 or a new, explicitly-extending ADR (`senior-architect`'s call) — documenting the reuse/new map for levers 1/2/3/5 and, separately, the freeze-law ruling for lever 4. |
| AC6 | Fiction for the decor set-dressing, the reinforcement's in-world justification, and the finisher beat is authored by `narrative-designer`, traces to the already-gated "le Commandant" fiction (`spec-boss-encounter-fiction.md`), and does not contradict the reserved-for-Niveau-Final canon status established in the V1 story's K2 ratification. |
| AC7 | `pm` re-reviews the gated spec at ACCEPT (this story's own review, before `senior-architect` cuts dev lanes) to confirm Wave 1 / Wave 2 / the lever-4 carve-out are respected — no drift into building all five as one undifferentiated blob, and no silent re-scoping of the reused-verb lines (3-A) without the reversal being visible. |
| AC8 | This story does not change whether the boss ships live/canon. It remains scoped against the same non-shipped Belliard dev-harness (ADR-0051 D4); the Niveau-Final live-ship follow-up stays a separate, not-yet-opened story. |

## File map (indicative only — `senior-architect` owns the real lane cut at TECH PLAN)

| Lane | Likely touch | Note |
| --- | --- | --- |
| `dev-gameplay` | `src/game/types/bossQte.ts`, `src/game/systems/bossQteSystem.ts`, `src/game/systems/__tests__/bossQteSystem.test.ts` | Pure logic — targeting model rework (1), parry state (3), decor/audio-tell state (2), finisher sub-state (5); lever 4 only if 4-C clears it for in-tableau scripting. Zero React/Three. |
| `dev-gameplay` | `src/game/levels/levels.ts` | `BOSS_QTE_DEV_HARNESS_LEVEL` spec fields, if any lever needs new authored data (e.g. decor prop position). |
| `dev-r3f-render` | `src/render/scene/BossQteSprite.tsx` | Decor render, parry cue, finisher click cue, any lever-4 in-tableau visuals. Logic-free. |
| `dev-r3f-render` | `src/render/ui/hud/BossHpBar.tsx` / new HUD widgets | If the finisher or parry need a HUD-legible cue beyond the existing diegetic + HUD-bar surfaces (Bertrand's OQ6 override is already live — see `docs/handoffs/story-boss-encounter-qte.md` "HUD BOSS-HP BAR"). |
| `src/hooks` (architect-assigned) | `src/hooks/useGameLoop.ts` | Only if 3-A resolves to a genuinely new input channel (not a timing-reinterpretation of the existing click). |
| `dev-tooling-assets` | `levelArt.json` + FLUX prompts | New poses/props: decor (lustre/enceintes/fumée), parry weapon-flash cue, any lever-4 asset. Gated by the existing `boss` block's ASSET GATE discipline (still owed per `story-boss-encounter-qte.md` §11). |
| `senior-architect` | `docs/adr/` | ADR-0051 amendment or new extending ADR (AC5); the lever-4 freeze-law ruling, wherever it lands. |

## Out of scope (this story)

- Shipping the boss live/canon on any level (Niveau Final follow-up, separate, not yet
  opened — AC8).
- The "fuyard" street-escape variant (still deferred from V1, untouched here).
- A distinct mini-boss tier (Option C, `story-boss-encounter-qte.md` OQ3 — untouched;
  `phaseCount`/`bossHp` stay data, per that story's C4 ratification).
- Any of the other 5 veille candidates from the original 10-item proposal that Bertrand
  did **not** select (AC3 — no silent addition).
- Re-tuning the hostage QTE (ADR-0034) to add any of these five levers to it. This story
  is boss-only; the hostage duel stays the playtest-frozen, gated contract it already is.

## Definition of Done (story-level, pre-dev)

- [ ] Design loop run: `game-designer` (all five levers' mechanic/tuning, gated behind
      AC4 on lever 4) + `narrative-designer` (decor/reinforcement/finisher fiction) +
      `ux-designer` (audio-tell accessibility, parry/finisher HUD legibility) on
      non-overlapping deliverables.
- [ ] `senior-architect` freeze-law ruling on Open Question 4-C delivered BEFORE
      `game-designer` tunes lever 4 (AC4) — sequenced ahead of the rest of the design
      loop's gate, not folded into the same pass.
- [ ] `lead-game-designer` design gate: PASS or PASS-WITH-CORRECTIONS logged with a
      `VERDICT:` line, explicitly covering Wave 1 / Wave 2 / the lever-4 carve-out.
- [ ] Open Questions 1-A through 5-B all explicitly answered in the gated spec — not
      silently assumed.
- [ ] `pm` re-review of the gated spec against this story's scope decisions (AC7).
- [ ] `senior-architect` TECH PLAN: ADR-0051 amendment or new extending ADR drafted,
      lanes cut, reuse map stated per lever (AC2, AC5).
- [ ] Hand-off logged in `docs/handoffs/story-boss-qte-differentiation.md`, indexed in
      `docs/agent-handoffs.md`.
