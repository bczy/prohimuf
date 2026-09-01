# Story — Portrait-robot (photofit interstitial mini-game)

**Epic:** direct request, Bertrand, 2026-08-05 · **Reference:** RoboCop (Ocean, 1988-89) photofit
sequence, recon at `docs/research/research-photofit-robocop-atari-st.md` · **Type:** new
interstitial mini-game, cross-boundary (game + render, new `AppPhase`). ADR reservations:
ADR-0079 (scene/boundary), ADR-0080 (face-band data model), ADR-0083 (input & render layer) —
tracking shard `docs/handoffs/story-portrait-robot.md`.

## Why

muf's core loop is `Récupérer → Livrer → Éviter`. Every contact the player deals with today is
trusted by default — the guidelines list 5 recruitable contacts and note that "un contact retourné
garde une apparence normale" (indics, §7), but nothing in the current build ever makes the player
**verify who they're dealing with**. That is a real, already-canon gap: the fiction already promises
turned contacts and RG-in-civil infiltration; the mechanics never test the player against it.

Portrait-robot is a legitimate answer to that gap, not decoration for its own sake: the player is
handed a partial description — a courier says "je crois que c'était lui", a burned contact gives a
vague ID before going dark — and has to reconstruct the face before committing to the next
`Livrer`. Get it right → the run gets an edge (a known face to avoid, or a contact confirmed safe
to re-use). Get it wrong or run out of time → the wrong read costs the player, because that is what
"getting eyewitness ID wrong" means diegetically.

I want to be honest about the alternative reading, because RoboCop's own contemporary press
undercuts a lazy yes: the recon flags a real risk (§8, Ocean's mini-game interludes read to period
critics as filler, and RoboCop's own photofit was "difficult" mostly because near-identical variants
were hard to tell apart under time pressure — a recognition puzzle, not a shooting-gallery skill).
If I bolt this on as a random obligatory checkpoint with no narrative reason to exist, Bertrand's
brief becomes exactly that filler. The anchor that makes it earn its place is **identity
verification tied to `Éviter`** (is this contact/informant/cop who they claim to be) — not a generic
"minigame for variety". Scope decisions below are written to hold that anchor, not just cite it.

## Cahier des charges check

> "Did Prohibition Atari ST have a portrait-robot phase?"

**No.** `[EXTENSION CONSCIENTE]** — same documentation bar as the hostage QTE (ADR-0030) and the
boss QTE (this story's sibling): explicitly requested by Bertrand, justified against the loop
in writing, ADR before any code lands (ADR-0079/0080/0081, already reserved).

- `Éviter` — this is where it plugs in. The player uses the reconstructed face to recognise (or
  avoid) a threat later in the run — a snitch, an undercover RG, a compromised delivery point. It
  extends the discrimination skill the player already exercises against BAC/RG, applied to a face
  instead of a uniform tell.
- `Récupérer` / `Livrer` — indirectly served: getting the ID right is what lets the player safely
  keep using (or safely drop) a contact, i.e. it protects the delivery network rather than gating a
  single delivery directly. It is **not** a Livrer gate — see Scope decision below, this is
  deliberate.
- Anti-"bullshit death" guardrail (§5 Non-Négociables, "chaque échec = raison explicite affichée"):
  failure must read as "you misidentified the suspect", shown plainly, not an opaque score penalty.
  This is a UX floor `ux-designer` must hold at the design gate, not an assumption this story makes.

If the design loop cannot produce a version where the reconstructed face is **used** for something
downstream (recognition payoff), this extension has failed its own justification and should be cut
— I am flagging that as a hard exit criterion, not softening it into "nice to have".

## Scope decision (V1) — placement, frequency, stakes

**Placement: narrative interstitial, not a per-level gate.** Triggered by a specific story beat (a
contact going dark, a courier reporting a partial sighting) — not automatically inserted between
every two levels. It is **optional dramatically** (the run continues either way — see stakes below)
but **mechanically consequential** (the outcome changes what the player knows going forward).

**Frequency: once per run, V1.** The recon's own press citations call repeated interludes of this
kind "filler" when overused; a single, narratively-earned occurrence per run keeps it a set-piece,
not a checkpoint tax. This also respects the 3-5 minute per-mission budget (§2 KISS,
`PROJECT_GUIDELINES.md`) — a single ~30-40s digression sits inside that budget once; repeating it
every level would not.

**Stakes: I am not fixing a number, I am fixing the *currency*.** The recon's source value ("échec
= −1 vie", RoboCop) does not map cleanly onto muf: lives are fractional per archetype (ADR-0066) and
there is already a continuous `energy` stat (ADR-0004 D5, 0-100) used as QTE outcome currency
(precedent: hostage QTE, boss QTE). **I am ruling that failure/success resolves through `energy`,
not through a discrete life loss** — it reuses the existing ledger instead of inventing a second
incompatible one, and it lets a wrong ID be a costly mistake without being an instant, disproportionate
run-ending. The exact magnitude (how much energy, and whether success grants a bonus rather than just
avoiding a cost) is explicitly `game-designer`'s call — not fixed here.

**No player-visible timer failure = life loss**, unlike the RoboCop source: this is a deliberate
divergence, justified above, not an oversight.

## Scope IN / OUT (V1)

**IN:**

- **Exactly 4 bandes**, per Bertrand's brief (not the original's 5-6): cheveux, yeux, nez, bouche.
- **Free-selection input**, per the recon's confirmed mechanic (not a scrolling-band-to-freeze
  mechanic): one axis moves between the 4 zones, the other axis cycles variants within the current
  zone, order of resolution is free, no per-trait feedback until submission/timeout.
- **One curated target face + variant pool**, sized for one credible playthrough — not a generative
  or infinite bank (small closed set the game-designer/narrative-designer size at the design gate).
- **A visible countdown timer** (30-40s per the recon's range; exact value is `game-designer`'s
  tuning call) and an explicit, plain-language outcome message on resolution (success/fail), per
  §5 Non-Négociables.
- **House art direction for the faces** — per Bertrand's 2026-08-05 arbitration, faces stay in the
  BD-comics DA (`docs/art-direction.md`), not a photo-digitized Atari ST render. What we borrow
  from the ST source is the **mise-en-scène**: large target portrait, breathing full-screen
  composition, tense countdown — documented in the recon §6 for historical grounding only, not as a
  production constraint.
- **A downstream payoff**, however small in V1: the resolved face (correct or not) is referenced at
  least once later in the same run (a recognition beat, a warning, a confirmed-safe contact) — this
  is the non-negotiable anchor from the Why section; without it, cut the feature.

**OUT of V1 (explicitly deferred, not silently dropped):**

- **No second scripted occurrence** in the same run — one per run only. Multiple photofit scenes per
  run is a future call, not assumed here (mirrors the boss story's one-encounter discipline).
- **No procedurally-generated or infinite face bank.** A small curated pool only; generative variety
  is a distinct, larger production investment that has not been justified.
- **No repeatable/practice mode**, no replay of the scene outside its narrative trigger.
- **No per-trait feedback during play** (matches the recon's confirmed absence of it in the source
  — keeps the recognition-under-uncertainty tension the mechanic is actually testing).
- **No touch-gesture bespoke design in this story** — input vocabulary (4-way keys/gamepad vs. touch
  swipe/tap) is `ux-designer`'s call at the design gate against the existing mobile pattern
  (ADR-0003), not fixed here.
- **No new antagonist/contact roster invention.** Whoever the target face represents must trace to
  the existing cast (§7 contacts, BAC/RG/indics) — `narrative-designer`'s job, same discipline as
  the boss story's AC6.

## Acceptance criteria

| # | Given | When | Then |
| --- | --- | --- | --- |
| AC1 | The design-gate spec is being reviewed | `lead-game-designer` gates it | it explicitly states: exact timer value, variant-pool size per zone, energy cost/reward magnitudes, and the downstream recognition payoff — a spec silent on the payoff is a gate FAIL |
| AC2 | A run reaches the narrative trigger point | the photofit scene opens | exactly 4 zones (cheveux/yeux/nez/bouche) are shown, target portrait visible, countdown running, free selection on both axes (no forced auto-scroll) |
| AC3 | The player is in the scene | they move between zones and cycle variants | selection is instant, reversible, and un-timed per trait — only the overall countdown enforces urgency, per the recon's confirmed mechanic |
| AC4 | The countdown expires OR the player submits | resolution happens | a plain-language outcome message names success or failure explicitly (no silent state change), per §5 Non-Négociable #4 |
| AC5 | The scene resolves (success or failure) | the run continues | **RESOLVED — design gate A1/A1c (2026-08-05), now a ratified project rule (`PROJECT_GUIDELINES.md` §7, amendment 2026-08-05).** `FAILED` applies **−20 energy to the initial energy capital of the next level** (never to the elapsed level's energy); `PARTIAL`/`IDENTIFIED` apply **0 energy** (no energy reward — it would be clamped at 100 regardless, per the new rule; the reward is score + the A10 gameplay payoff). No life is subtracted, ever, on any outcome. |
| AC6 | The resolved identity (correct or not) exists in run state | a later run event references that identity | the player sees a visible callback (recognition, warning, or confirmation) — if this callback does not exist, the feature fails its own justification (Why section) and ships incomplete |
| AC7 | The faces are produced | any asset is generated or reviewed | they conform to the house BD-comics art direction (`docs/art-direction.md`), not a photo-digitized/dithered pastiche — per Bertrand's 2026-08-05 arbitration |
| AC8 | A run is played start to finish | the photofit scene is encountered | it occurs at most once per run, at its single narrative trigger — never as a repeating per-level checkpoint |
| AC9 | `pm` re-reviews the gated spec | before `senior-architect` cuts dev lanes | the resolved design confirms the 4-zone/once-per-run/energy-currency scope decisions above still hold — no silent drift into a repeatable gate or a life-loss mechanic |

## Open questions — handed to the design loop, not pre-decided here

1. **Exact timer value (30-40s range) and variant-pool size per zone** — `game-designer`, tuning
   against the "visual proximity of variants is the real difficulty lever" finding (recon §7).
2. ~~**Energy cost/reward magnitudes** on failure/success — `game-designer`.~~ **CLOSED — design
   gate A1/A1c, see AC5.** `FAILED` = −20 energy applied to next level's initial capital; no other
   outcome touches energy. Not reopened to tuning: it now follows a ratified project rule
   (`PROJECT_GUIDELINES.md` §7).
3. **Which narrative beat triggers it, and what it unlocks downstream** — `narrative-designer`,
   must trace to the existing cast (§7) and produce the AC6 payoff; this is the load-bearing design
   question for the whole feature's justification.
4. **Input vocabulary** (keys/gamepad + touch equivalent) and screen composition (target portrait
   placement, band layout, legibility of the outcome message) — `ux-designer`, against the existing
   mobile pattern (ADR-0003) and §5 UX non-négociables.
5. **Face art direction execution** (which house-style rendering approach fits a "gros portrait" — 4
   bandes swappable while staying legible and on-model) — `game-designer` + `ux-designer` jointly,
   feeding `concept-artist`/`game-graphist` at the art lane.

## Risks

1. **This mini-game is a foreign body in a shooter.** The single biggest risk, named up front: a
   pause-and-puzzle interlude sitting inside a twitch shooting gallery can feel like a tonal and
   mechanical non-sequitur, exactly the "filler" critique the recon surfaces about the source
   material. Mitigation: the AC6 payoff requirement is the guardrail — if design cannot show the
   resolved face mattering later, `pm` and `lead-game-designer` should be prepared to cut the
   feature rather than ship a disconnected curiosity. This should be tested with a throwaway
   prototype/playtest **before** full art and polish investment, not discovered after.
2. **Difficulty tuning inversion.** The recon confirms the historical difficulty came from visual
   proximity of variants, not the timer. If `game-designer` defaults to timer pressure instead
   (the more obvious lever), the mechanic loses its actual skill test. Flagged explicitly so the
   design gate checks for it.
3. **Art cost underestimated.** Even scoped to a small curated pool (4 zones × N variants ×
   however many target identities), this is still meaningfully more bespoke art than a typical
   enemy sprite family. `lead-art`/`concept-artist` should size this before the design gate closes,
   not after.
4. **Scope creep back toward the original's photo-digitized look.** Bertrand's 2026-08-05
   arbitration is explicit and postdates the initial brief — any implementation drifting back to a
   dithered/photo aesthetic (even "just for reference") is a regression against a settled call, not
   a legitimate interpretation. AC7 exists specifically to catch this.

## Hand-offs

- **Design loop (`game-designer` + `narrative-designer` + `ux-designer`, in parallel, gated by
  `lead-game-designer`):**
  - `game-designer`: timer value, variant-pool size, confirm the proximity-of-variants difficulty
    lever (Open Q1, Risk 2). Energy magnitudes are closed (Open Q2 — see AC5), not a tuning input.
  - `narrative-designer`: the trigger beat, the target identity's trace to the existing cast, and
    the downstream recognition payoff that this whole feature's justification depends on
    (Open Q3, AC6).
  - `ux-designer`: input vocabulary desktop/touch, screen composition, outcome-message legibility,
    accessibility pass (Open Q4).
  - `lead-game-designer`: design gate verdict; explicitly confirm AC6's payoff exists in the gated
    spec before PASS.
- **`senior-architect`:** ADR-0079 (scene/`AppPhase` insertion boundary, once-per-run trigger
  plumbing), ADR-0080 (face-band data model: zones, variants, target/pool matching, determinism),
  ADR-0083 (input & render layer, house-DA rendering approach, no photo-digitized asset pipeline
  per AC7). Lane cut for `dev-gameplay` (band/selection/timer state machine, `src/game`) and
  `dev-r3f-render` (band display, gesture handling, `src/render`) follows the tech plan.
- **`qa-lead`:** quality gate + playtest verifying AC6's payoff is actually felt by a player, not
  just present in code; device pass (desktop + mobile touch) alongside `ux-designer`.

## File map (indicative — `senior-architect` owns the real lane cut at TECH PLAN)

| Lane | Likely touch | Note |
| --- | --- | --- |
| `dev-gameplay` | `src/game/types/portraitRobot.ts` (new), `src/game/systems/portraitRobotSystem.ts` (new) | Pure logic — zone/variant state, timer, match resolution, energy adjustment. Zero React/Three. |
| `dev-r3f-render` | `src/render/scene/PortraitRobot*.tsx` (new) | Band display, target portrait, outcome message, gesture binding. Logic-free. |
| `src/hooks` (architect-assigned) | app-shell phase bridge | New `AppPhase` entry + trigger wiring; serialise with existing QTE phase handling. |
| `dev-tooling-assets` | new FLUX prompt family (house BD-comics style, not photo-digitized) | Face zone variant assets, once fiction (Open Q3) and art direction (Open Q5) are settled. |
| `senior-architect` | `docs/adr/` | ADR-0079/0080/0081 content. |

## Definition of Done (story-level, pre-dev)

- [ ] Design loop run: `game-designer` + `narrative-designer` + `ux-designer` specs delivered,
      non-overlapping.
- [ ] `lead-game-designer` design gate: PASS or PASS-WITH-CORRECTIONS, with the AC6 payoff
      explicitly confirmed present.
- [ ] Open Questions 1-5 all explicitly answered in the gated spec.
- [ ] `pm` re-review of the gated spec against this story's scope decisions (AC9).
- [ ] `senior-architect` TECH PLAN: ADR-0079/0080/0081 drafted, lanes cut.
- [ ] Hand-off logged in `docs/handoffs/story-portrait-robot.md`, indexed in
      `docs/agent-handoffs.md`.
