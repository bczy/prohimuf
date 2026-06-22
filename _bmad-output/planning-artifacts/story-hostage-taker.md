# Story — Hostage taker (`hostage_taker`)

**Epic:** `epic-enemies-car-hostage.md` · **Sequence:** S3 (requires S1; independent of S2) · **Type:** new enemy archetype, precision-shot challenge, **two spawn modes (window + street)**.

## Why

Every existing target is a binary "shoot it" decision. The hostage taker is the first target that **punishes a careless shot**: a kidnapper holds a hostage as a partial human shield, exposing a small reward hitbox (the kidnapper) in front of a large penalty hitbox (the hostage). This sharpens `Éviter` from "dodge the threat" into "read the scene before you pull the trigger", and it makes `Livrer` meaningful — the biggest single reward in the roster (+5) is gated behind precision. It is the design reason to introduce a continuous `energy` stat: a discrete 3-lives counter cannot express "lose a lot" (killing the hostage) vs "lose a little" (letting the timer run out).

The archetype ships in **both** placements demanded by bestiary §3.1, reusing existing primitives (DRY):
- **Window** mode — a pop-up driven by the `enemySystem` state machine, with one extra terminal state (`EXECUTES`) on timeout.
- **Street** mode — a horizontally-traversing entity reusing the `Courier` movement primitive (and, if S2 lands first, the `Car` traversal/cull scaffolding).

## Cahier des charges check

> "Did Prohibition Atari ST have hostage takers?"

**No.** Conscious extension justified against the **core loop** and the non-negotiable "never a bullshit death" rule (`PROJECT_GUIDELINES.md` §5.6):

- `Éviter` — the player must *avoid the wrong shot*, not just avoid being shot. Precision-or-penalty is a new, legible decision axis.
- `Livrer` — risk/reward: +5 (best in roster) for a clean kill, gated behind aim.
- Anti-bullshit-death rule: the hostage is **visually distinct** (civilian, no weapon, captive posture, unmistakably foreground per §3.5); the kidnapper hitbox (exposed head/shoulder) and the hostage hitbox are spatially separated; the execution countdown is **perceptible** (rising-tension tint/animation); every outcome shows its scored feedback via `PointHitEvent`. The player is never surprised by a penalty.

## Energy stat decision (tracked here — open item promoted to scope)

`energy` (continuous, 0–100) **does not exist anywhere in `src/` today** (verified: no occurrence in the codebase). The bestiary §3.2 / §3.4 and the epic risk table flag its introduction as an open decision. This story **owns that decision** and resolves it as follows, to be confirmed by `senior-architect` via ADR before any code lands:

- **Decision:** introduce a single `energy: number` (0–100) slice into game state, of which the hostage taker is the **first and only** consumer in V1. `lives` is untouched and continues to handle net-life losses.
- **Boundary:** the stat is a pure data field owned by `src/game/state/**`; clamping/arithmetic live in a pure helper in `src/game/systems/**`. The HUD reading of it is `src/render/ui/**` only. No game rule in render; no React/Three in game.
- **Scope fence (YAGNI):** energy regeneration, energy-based death/game-over, energy thresholds gating difficulty, and any second consumer are **explicitly out of scope** (see Out of scope). Energy starts full, only the hostage decrements it in V1, and reaching 0 has **no special effect** beyond clamping in this story.
- **Fallback:** if the ADR rejects a new stat for V1, map the hostage penalties onto `lives` with a documented loss-of-nuance note; the rest of the story stands. The architect makes this call in S3's lane plan.

> This sub-section is the single source of truth for the `energy` question. The epic DoD's "ADR if energy touches game state" checkbox is satisfied by the ADR this story triggers.

## Scope (V1)

- New `EnemyKind = "hostage_taker"`, new `ARCHETYPES.hostage_taker` entry mirroring bestiary §3.4 (`hp=1`, `shoots=false`, `scoreDelta=+5` for a clean kill, `countsAsTarget=true`, `visibleDuration ≈ 3.5s`, window `weight ≈ 8`).
- **Double hitbox** as the core mechanic: two distinct collision zones per entity — `kidnapper` (reward) and `hostage` (penalty). A single player bullet resolves against **whichever zone it hits first**; the kidnapper zone, being the exposed sliver, is smaller and behind the hostage zone in screen space.
- **Window mode:** extend the `enemySystem` state machine for this kind so that a `visibleDuration` timeout transitions to a terminal `EXECUTES` state (hostage dies → timeout penalty applied) instead of looping back to `HIDDEN`. A clean kidnapper hit goes to `DEAD` and frees the hostage (reward applied).
- **Street mode:** a `HostageTaker` street entity reusing `Courier`-style `{ id, x, y, dir, speed }` movement; timeout is a **fixed delay** (bestiary §3.3 "we have the traversal time"), at which point the hostage is executed (timeout penalty) — *not* the off-screen cull. Off-screen cull (escaped without resolution) applies the timeout penalty once as well, per §3.3, to avoid a free escape.
- **Energy stat** introduced per the decision section above; the hostage applies `energy` deltas through a pure clamp helper.
- New pure system `hostageSystem` in `src/game/systems/` (or co-located logic) for: spawn (both modes), tick (window state machine extension + street move/cull), double-hitbox bullet resolution, and outcome→effect mapping (`PointHitEvent` carrying score + energy). **Must not** import React/Three.
- `PointHitEvent`/`HitEvent` extended (or a sibling field added) to carry an **energy delta** so the HUD can float "−25 ⚡" alongside score. Additive, default 0 → no regression for existing emitters.
- Window mode gated by S1's `roster.windowWeights` (the kind only enters the weighted pool when the level opts in). Street mode gated by S1's `roster.streetSpawns.includes("hostage_taker")`.
- Belliard `roster` extended to include `hostage_taker` in **both** `windowWeights` (weight ≈ 8) and `streetSpawns`; **only** Belliard (epic AC E2).
- Render: new R3F component(s) in `src/render/scene/**` (name TBD by Winston) drawing the kidnapper + foreground hostage, the rising-tension countdown cue, and the execution beat. Street variant mirrors on `dir`. **Logic-free.**
- Asset pipeline: a generator aligned with `gen-enemy-types.mjs` producing the composite (kidnapper + distinct captive hostage in front), with at least the poses needed to read "holding hostage" → "executing"; cutout reuses `cutout-enemies.mjs`; lazy-loaded via `enemyTextures.ts`.

## Acceptance criteria

| # | Given | When | Then |
| --- | --- | --- | --- |
| AC1 | Belliard run, `roster.windowWeights` includes `hostage_taker` (weight ≈ 8) | A wave spawns and the kind is picked | A `hostage_taker` appears in a window via the `enemySystem` machine; on `vitry`/`stalingrad` (no roster opt-in) it never appears. |
| AC2 | Belliard run, `roster.streetSpawns` includes `"hostage_taker"` | The street spawner timer fires for this kind | A street `HostageTaker` enters from the edge per `dir` (same convention as courier/car) and traverses; on `vitry`/`stalingrad` it never spawns. |
| AC3 | A `hostage_taker` is on screen, player bullet collides with the **kidnapper** zone (and not the hostage zone) | Hit resolves | Score `+5`, `energy` delta `0`, entity cleared, hostage freed; a `PointHitEvent` carries `scoreDelta:+5`. |
| AC4 | A `hostage_taker` is on screen, player bullet collides with the **hostage** zone | Hit resolves | Score `−3`, `energy` `−≈25` (single value pinned in code, traced to §3.4), entity cleared; `PointHitEvent` carries the score **and** energy delta; this is a *bavure* (no kill credit toward `enemiesToWin`). |
| AC5 | A window `hostage_taker` is left unhit until `visibleDuration` (≈ 3.5s) elapses | Timer expires | Machine enters `EXECUTES`: hostage dies, score `−1`, `energy` `−≈10`, then the entity leaves; the penalty is applied **once**. |
| AC6 | A street `hostage_taker` reaches its fixed timeout **or** the off-screen cull | Whichever fires first | The timeout penalty (score `−1`, energy `−≈10`) is applied **exactly once** (no double-charge across timeout + cull). |
| AC7 | When a bullet could overlap both zones in the same frame | Resolution runs | The **hostage** zone takes precedence (foreground) — you cannot "shoot through" the hostage to claim the reward; this protects the anti-bullshit-death rule and is asserted by a unit test. |
| AC8 | Any hostage outcome (reward, bavure, timeout) | Outcome occurs | A scored feedback label (score + energy) is emitted via `PointHitEvent`/`HitEvent`; the countdown cue was visibly rising before AC5/AC6 fired (browser check). |
| AC9 | `energy` slice introduced | Game runs | `energy` starts at 100, is clamped to `[0, 100]`, and **only** the hostage taker mutates it in V1; reaching 0 has no special effect (no game-over hook in this story). |
| AC10 | `belliard` opts the kind into its roster | A typical mission (≤ 5 min) | At least one window and the possibility of one street `hostage_taker` occur; the existing 58+ Vitest suite stays green. |
| AC11 | TypeScript strict | `rtk tsc` | Zero errors, no `any`; `src/game/**` holds no React/Three import. |
| AC12 | Vitest | `rtk vitest` | New `hostageSystem` tests cover AC3–AC7 + AC9 deterministically (seeded); full suite green. |
| AC13 | Bestiary trace | Reviewer reads `ARCHETYPES.hostage_taker` and the energy magnitudes | Every numeric value (`hp`, `scoreDelta`, hostage penalty, timeout penalty, energy deltas, `visibleDuration`, window weight) traces verbatim to `enemy-bestiary.md` §3.4. |

## File map (lane assignment hint for Winston)

| Lane | File(s) | Change |
| --- | --- | --- |
| `dev-gameplay` | `src/game/types/enemy.ts` | Extend union: add `"hostage_taker"`. |
| `dev-gameplay` | `src/game/types/enemyTypes.ts` | Add `ARCHETYPES.hostage_taker` (window `weight ≈ 8`, traced to §3.4). |
| `dev-gameplay` | `src/game/types/hostage.ts` (new) | Define the street `HostageTaker` entity and the double-hitbox shape (kidnapper/hostage zones + offsets/radii). |
| `dev-gameplay` | `src/game/types/feedback.ts` | Add an optional `energyDelta` to `HitEvent`/`PointHitEvent` (default 0; additive, no regression). |
| `dev-gameplay` | `src/game/state/**` | Add the `energy: number` (0–100) slice + initial value 100. |
| `dev-gameplay` | `src/game/systems/energySystem.ts` (new, tiny) | Pure clamp/apply helper for energy deltas. Unit-tested. |
| `dev-gameplay` | `src/game/systems/hostageSystem.ts` (new) | Spawn (window + street), tick (machine extension to `EXECUTES`; street move/cull/fixed-timeout), double-hitbox resolution with hostage-precedence, outcome→effect mapping. Pure. |
| `dev-gameplay` | `src/game/systems/enemySystem.ts` | Extend `nextState`/`durationFor` so `hostage_taker` timeout routes to a terminal execute path instead of `HIDDEN`. Keep other kinds byte-identical. |
| `dev-gameplay` | `src/game/systems/__tests__/hostageSystem.test.ts` (new) | AC3–AC7 + AC9, seeded determinism; hostage-precedence assertion (AC7). |
| `dev-gameplay` | `src/game/systems/__tests__/energySystem.test.ts` (new) | Clamp bounds, additive deltas. |
| `dev-gameplay` | `src/game/levels/levels.ts` | Extend `belliard.roster` (`windowWeights.hostage_taker ≈ 8`, `streetSpawns` += `"hostage_taker"`). Stalingrad/vitry untouched. |
| `dev-r3f-render` | `src/render/scene/HostageTaker*.tsx` (new) | Draw kidnapper + foreground hostage, rising-tension countdown cue, execution beat; street variant mirrored on `dir`. **Logic-free.** |
| `dev-r3f-render` | `src/render/ui/**` | Surface the `energy` value in the HUD (read-only) and float the energy delta on outcomes. |
| `dev-r3f-render` | `src/hooks/**` | Bridge hook(s) if cars/hostages need a tick bridge analogous to couriers — the only shared seam with gameplay; serialise edits with S2. |
| `dev-tooling-assets` | `scripts/gen-hostage-enemies.mjs` (new) | FLUX prompts: kidnapper + distinct captive hostage in front, "holding" + "executing" poses, black background. |
| `dev-tooling-assets` | `scripts/cutout-enemies.mjs` (extend or replicate) | Process hostage frames. |
| `dev-tooling-assets` | `src/render/scene/enemyTextures.ts` | Register lazy loaders for `hostage_*`. |
| `senior-architect` | `docs/adr/` | ADR for the `energy` state slice (new game-state contract) and for the `hostage_taker` dual-mode spawn. |

## Out of scope (V1)

- **Energy regeneration**, energy-based **death/game-over**, energy thresholds gating **difficulty**, and any **second consumer** of energy. Energy is introduced solely for the hostage penalty (YAGNI).
- **Hostage taker shooting at the player** (bestiary §3.4: `shoots = false`; the threat is the hostage, not outgoing fire).
- **Multiple hostages** or **negotiation / surrender** mechanics.
- **Street `hostage_taker` altering `enemiesToWin`** on stalingrad/vitry — those levels do not run it in V1 (epic E2).
- **Hostage taker spawns on `stalingrad`/`vitry`** (gated to Belliard).
- **Re-tuning existing archetypes** (`normal`/`riot`/`biker`/`bonus`/`civilian`).
- **Localising new UI strings** (i18n is out of scope per `PROJECT_GUIDELINES.md` §8).

## Definition of Done (per `PROJECT_GUIDELINES.md` §9)

- [ ] TDD: Vitest written first; AC3–AC7 + AC9 covered and green; full suite green (`rtk vitest`).
- [ ] `rtk tsc` clean, no `any`.
- [ ] `rtk lint` clean; Prettier applied.
- [ ] `src/game/**` boundary respected (no React/Three import); energy arithmetic lives in a pure helper.
- [ ] Browser validation on Belliard: clean kidnapper hit (+5), hostage hit (−3 / −≈25 energy), and timeout (−1 / −≈10 energy) each observed; double hitbox visibly separated; countdown cue rises before execution; HUD shows energy and floats energy deltas.
- [ ] Browser validation on Stalingrad and Vitry: no `hostage_taker` ever spawns in window or street (AC1/AC2).
- [ ] Each `ARCHETYPES.hostage_taker` numeric value and each energy magnitude cross-referenced to bestiary §3.4 in the PR description.
- [ ] ADR(s) merged: `energy` state slice + dual-mode `hostage_taker` (boundary/contract change).
- [ ] Hand-off logged in `docs/agent-handoffs.md`.
