# Story — "Le Commandant" ships live: a minimal Niveau Final level (canon boss, real gate)

**Epic:** direct follow-up to `story-boss-encounter-qte.md` (ADR-0051, K2 ratification)
and `story-boss-qte-differentiation.md` (ADR-0052) · **Sequence:** opened on Bertrand's
direct instruction — *"OK N'OUBLIE PAS D'INCLURE LE BOSS DANS LE STAGE — CELA FAIT PARTIE
D'UNE STORY APPAREMMENT."* — naming exactly the follow-up both prior stories reserved and
never opened. **Type:** new level (`LevelConfig` + `levelArt.json` entry) that ships the
already-built boss system live, canon, player-facing, for the first time. Cross-boundary
(game + render + tooling/assets), but **not** a new mechanic — the ADR-0051/0052 system
ships **as-is**.

## Why now

Bertrand's message is the direct go-ahead this follow-up has been waiting for since the V1
K2 ratification (2026-07-19): *"the canon, player-facing, required-gate 'le Commandant'
encounter... ships in a separate follow-up story that also builds a minimal Niveau
Final."* The differentiation story's own advisory (2026-07-20) recommended exactly this
sequencing — *"I recommend this differentiation story lands before the Niveau-Final
live-ship story is opened, so the finale spends its one true reveal on the fight Bertrand
actually wants"* — and flagged that sequencing call as Bertrand's/`producer`'s to make,
not pre-decided. Bertrand's message, read together with the timing (sent while the
differentiation story is finishing its own stage-6/7 gates on this same branch), is
consistent with that advisory being satisfied. **I am treating it as such, not as a
blanket instruction to skip ahead of the merge gate** — see Sequencing recommendation,
below, and Open Question 4.

**Two things are true at once and both matter to scoping this honestly:**

- The *need* for this beat is not new scope invented today. `PROJECT_GUIDELINES.md` §7/§10
  already commits to a **"Niveau Final — 31 décembre 1999… flics débordés"** as a Sprint
  4+ deliverable, independent of the boss feature entirely. This story is the first one to
  actually build that level.
- The boss-in-that-level pairing is not new either — it was the exact configuration ADR-0051's
  K2 ruling reasoned about and deferred ("Option 2… rejected for V1… If Bertrand wants this
  sooner, it is a distinct, explicit scope call"). This message **is** that explicit scope
  call.

So this story does two things that were previously kept apart on purpose: it builds the
Niveau Final level (long-promised, never built) and it makes that level's terminal beat the
already-built, already-differentiated boss system (long-built, never shipped). Both halves
are legitimate, planned work; this story is where they finally meet.

## Cahier des charges check

> "Did Prohibition (Atari ST, 1987) have a boss?" **No** — already answered and RATIFIED as
> a conscious **[EXTENSION]** in `story-boss-encounter-qte.md` / ADR-0051. This story does
> **not** re-run that test; it inherits the ratified answer.

What **is** new here, and gets its own test:

- **The LIVE level is the new surface.** Everything built so far (ADR-0051, ADR-0052) is
  system + tuning + fiction, exercised only through a non-shipped dev-harness that no
  shipped player can reach. Shipping it on a real, menu-visible, progression-gated level is
  the first time this extension has a player-facing footprint. That footprint is not a new
  *decision* (K2 already made the call: required gate on `Livrer`, terminal to the level) —
  it is that decision's first execution. Test applied: does going live change what the
  feature *is*? No — same mechanic, same tuning, same fiction, already gated three times
  over (design gate, `pm` AC7 review, `senior-architect` TECH PLAN, twice). It changes only
  who can reach it. That is exactly the class of change the K2 ratification already
  anticipated and reserved for "a distinct, explicit scope call" — which this is.
- **The Niveau Final level itself** is not an extension at all — it is already-scoped,
  already-committed roadmap content (`PROJECT_GUIDELINES.md` §7/§10, Sprint 4+, "Niveau
  final : 31 décembre 1999"). No cahier-des-charges test is owed for *building a level*;
  every shipped level already passed that bar structurally (facade + roster + delivery +
  quota, following `HARNESS.md`'s standard level-authoring path).

`Récupérer → Livrer → Éviter` — untouched by this story specifically (it was already
resolved not to touch it by ADR-0051 D3): the boss remains the terminal beat on `Livrer`,
not folded into the kill quota, and `Éviter` gains no new rule. This story's own addition
to the loop is zero; it is a distribution change (canon vs. harness), not a mechanic
change.

## Relationship to the two prior stories (extend, do not reopen)

**story-boss-encounter-qte.md / ADR-0051** — the boss system, V1. Ships here **unchanged**:
`phaseCount`, `bossHp`, `maxBlownWindows`, the per-phase escalation table, the fiction (le
Commandant, BAC de nuit apex, "il n'a plus personne pour le couvrir"). This story does not
re-open OQ1–OQ6; they are closed.

**story-boss-qte-differentiation.md / ADR-0052** — the 5-lever pack (two-ring targeting,
parade, décor, coup de grâce, renfort). Ships here **unchanged**: same constants, same
reuse map, same fiction (the squatted grand disused hall, the lost-CRS-section renfort,
the "LIVRE LE SON" finisher). **This story does not retune, re-gate, or re-litigate any of
the five levers.** If this story's own stage-5 playtest surfaces a tuning problem specific
to the live level (e.g. the pinned seed doesn't land the same way on the new anchor
position, or the difficulty reads wrong slotted after Vitry instead of after Belliard),
that is handled as a **correct-course** against this story or a narrow follow-up tuning
note — explicitly **not** a silent edit to `bossQteSystem.ts`'s constants, and not this
story quietly re-opening ADR-0052's gate. See AC8.

**What this story actually adds, on top of both:** one new `LevelConfig` entry (id TBD,
e.g. `niveau-final`) carrying a live, non-null `bossQteSpec` copied/re-anchored from the
tuned values, a matching `levelArt.json` backdrop entry, its place in the shipped `LEVELS`
array and the unlock chain, and the wiring of the already-written, already-gated
`final_pre`/`final_post` narrative scripts (`spec-boss-encounter-fiction.md` §4) to that
level's id.

## Sequencing recommendation (read before opening the design loop)

**Recommendation: do not start this story's BUILD stage until the differentiation story
(ADR-0052) is MERGE-cleared through its stage-6 review panel on `main`.** Reasoning, not an
assumption:

- Building a new, canon, player-facing level on top of `bossQteSystem.ts` while that exact
  file is still an uncommitted, unreviewed diff on this branch means building on a contract
  that could still change under the 4-reviewer panel's findings (a CONFIRMED blocking/major
  finding could alter constants, the `FINISHER` phase shape, or the D4 renfort boundary
  compliance this story would otherwise inherit as fact).
- The differentiation story's own advisory already named this exact ordering as correct —
  I am extending that same logic one stage further: differentiate-before-live-ship, and
  *land*-before-build-on-top-of.
- This does **not** block the DESIGN LOOP for this story (level pacing/quota/difficulty,
  the venue-canon confirmation, narrative script wiring) from starting now, in parallel —
  only the dev lanes that touch `bossQteSystem.ts`/`levels.ts` for real. `producer` should
  track this as an explicit dependency gate, not an informal "probably fine."

If Bertrand wants to compress this further (start dev lanes before ADR-0052 merges), that
is a legitimate call but should be made explicitly, the same way the K2 ratification
insisted the harness→live jump be an explicit call rather than a default. Flagging, not
deciding — **Open Question 4**.

## Scope

**IN — the minimal live level:**

- One new, shipped `LevelConfig` — a **minimal** Niveau Final: real facade/backdrop
  (`levelArt.json` entry, per `HARNESS.md`'s standard level-authoring path), a real roster
  and delivery (`Récupérer`/`Livrer` play out normally first), a real `enemiesToWin` quota
  (**not** the harness's `enemiesToWin: 0` instant-trigger shortcut — AC4), and a
  **non-null `bossQteSpec`** using the ADR-0051/0052 system exactly as tuned, re-anchored
  to this level's world geometry and re-seeded per the standing K-5 discipline (every level
  that ships a QTE re-pins/re-verifies its own seed for landability — Vitry did this for
  its own hostage QTE; this level does the equivalent for the boss).
- Placement in the shipped `LEVELS` array **after** the existing three playable levels
  (belliard → stalingrad → vitry → **niveau-final**), so the existing index-based unlock
  chain (`App.tsx`'s `LEVELS[shippedIdx + 1]` hop on `LEVEL_COMPLETE`) unlocks it
  automatically on clearing Vitry — **no new unlock-logic code needed**, this is exactly
  the mechanism every prior level addition has used.
- Wiring the already-gated `final_pre`/`final_post` narrative scripts
  (`spec-boss-encounter-fiction.md` §4) to this level's actual id in
  `PRE_LEVEL_NARRATIVE`/`POST_LEVEL_NARRATIVE` (`App.tsx`) — narrative-designer confirms
  the scripts still apply as written or need light adaptation for the concrete id/anchor.
- An ADR (new, extending ADR-0051/ADR-0052 — number allocated by `producer` at DESIGN
  stage, not self-allocated, per the standing rule) documenting: the new `LevelConfig`, the
  re-anchor/re-seed, confirmation that `bossQteSystem.ts`/`types/bossQte.ts` are
  **byte-untouched** by this story (only new *data* is authored), and the resolution of
  Open Questions 1–4 below.

**Recommended, not assumed — art:** ship with the **procedural/placeholder visuals already
built and stage-5-verified on the dev-harness** (cop-fallback boss sprite, procedural
rings/parry-glyph/decor/smoke/renfort silhouettes — all logic-free, already reusable
as-is) for the boss encounter itself, and generate **only the new venue backdrop art** (the
squatted grand disused hall — a genuinely new environment, not reuse of Belliard/
Stalingrad/Vitry's street facades) through the normal `levelArt.json`/FLUX pipeline, since
every level needs its own backdrop to exist at all (this is not extra scope — it is the
standing cost of any new level, per `HARNESS.md`).

I recommend this over blocking on the boss's own canon art (the 4 `commander_*` sprite
poses still gated-but-not-asset/composite-cleared from V1, plus the 5 differentiation-story
art asks — parry pose, two-ring form-read, finisher pose, smoke-degraded telegraph,
venue props — deliberately deferred by both prior ADRs' "N2: do not run ahead of need"
discipline) because:

- It is the exact pattern every QTE in this codebase has shipped under before art landed
  (hostage duel shipped on a fallback first too) — not a new risk, a proven one.
- It lets the *mechanical* live-ship (the actual product question — does the required gate
  read right at the end of a real level) ship and get playtested without waiting on an art
  lane that has no open work order yet.
- Blocking on 9 art asks (4 commander poses + 5 differentiation reads) compounds this
  story's scope with a full art-generation cycle it does not need to answer its own
  question.

**Recommendation, not a decision — flagging the alternative plainly:** if Bertrand wants the
finale to *look* finished on first ship (a real argument — this is meant to be a one-shot
narrative payoff, and a cop-fallback sprite standing in for "le Commandant" at the actual
climax is a bigger tonal cost than it was on a dev-harness nobody but the team saw), the
honest alternative is to open the art lane (`concept-artist` → `lead-art`, the request
sheets both prior specs already prepared) as a **parallel**, not blocking, lane — landing
before this story's own stage-6 panel, not before dev starts. That is a real trade-off
between velocity and the finale "spending its one true reveal" well; I am flagging it, not
picking it. **Open Question 3.**

**OUT (same standing exclusions both prior stories held, restated so this story doesn't
silently reopen them):**

- The **"fuyard"** street-escape variant — still deferred, untouched.
- A distinct **mini-boss tier** — still untouched; `phaseCount`/`bossHp` stay data (ADR-0051
  C4), no new tier introduced here.
- **Hostage QTE retuning** — untouched; this level does not author an `hostageQte` (the
  existing `stateMachine.ts` invariant forbids a level authoring both `hostageQte` and
  `bossQteSpec` — this story respects that by construction, AC1).
- **Any new player verb, mechanic, or tuning number** on the boss — the system ships
  exactly as ADR-0051/0052 left it (AC8).
- **A second boss encounter or any raised total-encounter count** — still exactly one
  boss-tier archetype (ADR-0051 OQ3/C4, untouched).

## Open questions — for the design loop to resolve, not pre-decided here

Handed to `game-designer` (level pacing/quota/difficulty), `narrative-designer` (venue
canon confirmation, script wiring), `ux-designer` (fresh-eyes legibility — see Q2),
`lead-game-designer` (gate owner), `senior-architect` (Q4 sequencing + art-lane timing),
`producer` (ADR number, stage tracking, dependency-gate tracking on Q4).

1. **Level length/quota shape before the boss triggers.** How many kills (`enemiesToWin`),
   what `timeSeconds`, what roster/delivery precede the boss beat? The boss triggers on
   real quota-completion (AC4) — this needs its own pacing pass, not a copy of Vitry's
   numbers by default. Should the pre-boss section be short (mostly a ramp into the set
   piece) or a full mission in its own right before the terminal beat? `game-designer`'s
   call.
2. **Difficulty placement.** Sits after Vitry (`enemySpeedMultiplier: 1.6`) in the unlock
   chain — does the pre-boss section escalate further (continuing the
   1.0→1.3→1.6→? curve), hold at Vitry's level (since the boss itself is the escalation),
   or something else? `game-designer`'s call, informed by the fact the boss's own per-phase
   escalation already carries most of the difficulty ramp.
3. **Art lane timing** (see Scope, above) — ship on placeholder/procedural (recommended)
   or open the art lane now, in parallel, targeting landing before this story's stage-6
   panel? A real trade-off between velocity and the finale's "one true reveal" reading
   finished — `pm` + `lead-game-designer` + `senior-architect` call, not pre-decided here.
4. **The canon-venue confirmation.** `spec-boss-differentiation-fiction.md` named the
   Niveau Final venue for the first time — "a squatted grand disused hall with an old
   chandelier" — flagged by `narrative-designer` as NEW-CANON and ratified by
   `lead-game-designer`'s gate as a *conscious, loose-form* extension, but `pm`'s own AC7
   review (2026-07-20) explicitly recommended "**a one-line confirmation from Bertrand
   before it hardens further, whenever the Niveau-Final story is opened**" — this story is
   that opening. **Bertrand's intake message plausibly IS that go-ahead** (it opens this
   exact story), but I am flagging it as an open question rather than assuming a message
   about including the boss also constitutes sign-off on a specific venue description he
   has not been shown. A one-line confirmation ("yes, squatted hall + chandelier, as
   written" or a correction) closes this cleanly before art/backdrop work commits to it.
5. **Sequencing (see Sequencing recommendation, above).** Does dev-lane BUILD wait for
   ADR-0052's stage-6 merge, or does Bertrand want it compressed? Flagged, not decided.

## Architecture directive (binding on the tech-plan stage, not a suggestion)

At TECH PLAN, `senior-architect` is instructed to treat this story as **data + narrative
wiring only** against the frozen ADR-0051/ADR-0052 contract — not a system-design pass.
Concretely:

- `bossQteSystem.ts` / `types/bossQte.ts` — **no new fields, no new constants, no new
  branches.** If this story's playtest surfaces a genuine tuning gap, that is a
  correct-course against THIS story, not a silent edit to the differentiation contract
  (AC8).
- The new `LevelConfig`'s `bossQteSpec` is authored using the **existing** `BossQteSpec`
  shape (`zoomSeconds`, `anchor`, `phaseCount`, `bossHp`, `maxBlownWindows`, `targetSeed`,
  optional `decorProp`) — same fields the harness already exercises, re-anchored and
  re-seeded, not redesigned.
- The `stateMachine.ts` hostage/boss mutual-exclusion invariant (the throw at load if a
  level authors both) is a **safety net to verify against, not a change target** — this
  story's level must simply not author a `hostageQte` (AC1).
- `BOSS_QTE_DEV_HARNESS_LEVEL` stays exactly as-is, excluded from `LEVELS`, unmodified
  (AC3) — this story does not repurpose or delete the harness; it is a distinct, separate,
  new `LevelConfig` entry.
- Reinventing any part of the shell, the fiction wiring mechanism (`PRE_LEVEL_NARRATIVE`/
  `POST_LEVEL_NARRATIVE`), or the unlock chain is out of scope — all three already exist
  and are reused verbatim.

## Acceptance criteria

| # | Criterion |
| --- | --- |
| AC1 | The new `LevelConfig` authors a non-null `bossQteSpec` and **does not** author a `hostageQte` — respecting the existing `stateMachine.ts` mutual-exclusion invariant by construction (verified: the level loads without triggering the invariant's throw). |
| AC2 | Every existing shipped `LevelConfig` (`tutorial`, `belliard`, `stalingrad`, `vitry`) is **byte-untouched** — this story only appends a new array entry and (if needed) new `PRE_LEVEL_NARRATIVE`/`POST_LEVEL_NARRATIVE` keys for the new level's own id. |
| AC3 | `BOSS_QTE_DEV_HARNESS_LEVEL` and its exclusion from the shipped `LEVELS` array (ADR-0051 D4) are unchanged — this story does not repurpose, delete, or alter the harness; the live level is a distinct, new, separately-authored `LevelConfig`. |
| AC4 | The boss triggers via the **real quota-crossing tick** on the new level (`kills >= enemiesToWin` with a real, non-zero `enemiesToWin` — not the harness's instant-trigger `enemiesToWin: 0` shortcut), matching ADR-0051 D3's "terminal beat on `Livrer`" design as it will actually be experienced by a player who clears real mooks first. |
| AC5 | This story does not modify `bossQteSystem.ts` or `types/bossQte.ts` — no new fields, constants, or branches. Any tuning gap found at this story's own playtest is logged as a correct-course against this story, never a silent edit to the ADR-0052 contract. |
| AC6 | An ADR (new, extending ADR-0051/ADR-0052; number allocated by `producer` at DESIGN stage, not self-allocated) documents the new `LevelConfig`, the re-anchor/re-seed, the byte-untouched confirmation on the boss system files, and the Open Questions' resolutions. |
| AC7 | The already-gated `final_pre`/`final_post` narrative scripts (`spec-boss-encounter-fiction.md` §4) are wired to the new level's actual id — confirmed by `narrative-designer` as applying as-written or lightly adapted, with no new canon script authored beyond what is already gated. |
| AC8 | This story's dev lanes (anything touching `levels.ts`/`bossQteSystem.ts`) do not start until `producer` confirms ADR-0052's stage-6 review panel has MERGE-cleared on `main` — or an explicit, logged decision from Bertrand/`pm` to compress that sequencing (Open Question 5). |
| AC9 | `pm` re-reviews the gated design-loop spec (mirroring the AC7 pattern of both prior stories) before `senior-architect` cuts dev lanes — confirming no drift into a second boss, a mini-boss tier, hostage retuning, or new boss mechanics/tuning. |
| AC10 | The fuyard variant, a mini-boss tier, and hostage-QTE retuning remain explicitly out of scope — none introduced by this story. |

## File map (indicative only — `senior-architect` owns the real lane cut at TECH PLAN)

| Lane | Likely touch | Note |
| --- | --- | --- |
| `dev-gameplay` | `src/game/levels/levels.ts` | New `LevelConfig` entry (data only — re-anchored/re-seeded `bossQteSpec`, real `enemiesToWin`, roster, delivery). `BOSS_QTE_DEV_HARNESS_LEVEL` untouched. |
| `dev-r3f-render` | `src/render/scene/App.tsx` | New `PRE_LEVEL_NARRATIVE`/`POST_LEVEL_NARRATIVE` entries keyed to the new level id, using the already-gated scripts. No new component logic — reuses the existing narrative-scene machinery. |
| `dev-tooling-assets` | `src/game/levels/levelArt.json` + FLUX prompts | New backdrop entry for the venue (the squatted grand disused hall) — the standard per-level art cost, per `HARNESS.md`. Boss-specific art (Commandant sprite, differentiation reads) stays deferred per Open Question 3, unless that question is resolved to open the lane now. |
| `senior-architect` | `docs/adr/` | New extending ADR (AC6). |
| `producer` | `docs/handoffs/`, `docs/agent-handoffs.md` | ADR number allocation, stage tracking, the AC8 dependency-gate chase (ADR-0052 merge status). |

## Definition of Done (story-level, pre-dev)

- [ ] Design loop run: `game-designer` (pacing/quota/difficulty) + `narrative-designer`
      (venue-canon confirmation + script wiring) + `ux-designer` (fresh-eyes legibility of
      the boss beat inside a full level, first time a player reaches it without harness
      familiarity) on non-overlapping deliverables.
- [ ] `lead-game-designer` design gate: PASS or PASS-WITH-CORRECTIONS logged with a
      `VERDICT:` line.
- [ ] Open Questions 1–5 all explicitly answered in the gated spec — not silently assumed,
      including the Bertrand venue-canon confirmation (Open Question 4) and the art-lane
      timing call (Open Question 3).
- [ ] `pm` re-review of the gated spec against this story's scope decisions (AC9).
- [ ] `senior-architect` TECH PLAN: ADR drafted (AC6), lanes cut, AC1–AC5 confirmed against
      real code (not assumed).
- [ ] `producer` confirms the AC8 sequencing gate (ADR-0052 merge status) before dev lanes
      that touch `levels.ts`/`bossQteSystem.ts` start.
- [ ] Hand-off logged in `docs/handoffs/story-boss-niveau-final-live.md`, indexed in
      `docs/agent-handoffs.md`.
