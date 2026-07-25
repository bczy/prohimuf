# 0069 — Energy-rim signalling contract

- **Status:** Proposed — decision content ruled by `senior-architect` (Winston) in
  `docs/handoffs/story-street-graphics-effects.md` stage-6 TRIAGE ARCHITECTE §4 ("ADRs");
  drafted by `tech-writer` (Otis) per that ruling. Awaiting Winston's sign-off on this draft
  and the branch's own merge (currently NO-MERGE, condition **C1**: `lead-art` has not yet
  re-gated the re-cut on a hostage-QTE or post-fix boss frame).
- **Date:** 2026-07-25
- **Number:** self-allocated as 0069 (max+1 over local `docs/adr/`, `origin/main`, and the
  index — no collision found) via the `adr-new` skill. The triage asked for the number to
  come from `producer` ("never self-allocated"); no `producer` allocation was recorded in
  the story's handoffs shard at the time of drafting, so this follows the ADR-0038/0039
  posture of self-allocating and flagging it. **Re-check at merge** — if `producer` records
  a different number first, renumber (file, this line, index row).

## Context

`story-street-graphics-effects` shipped an energy aura on the QTE entities (hostage-taker
captor, boss, LOOT crate): a peripheral, on-world read of the same `GameState.energy` scalar
the HUD gauge shows, so the player feels their state dropping without leaving the tableau.

The first cut drew the aura as an additive radial disc (`radialGlowTexture`) behind each
sprite. `lead-art`'s Gate-4 composite review **FAILED** it (`docs/handoffs/
story-street-graphics-effects.md`, stage-5 ART GATE, verdict 3):

- A disc is only occluded where the narrow sprite covers it — the core escaped above the
  boss's head, between his legs and below his feet, pooling onto the road as a green ellipse
  with no source, clipping the pavement to `v=1.00` (an _aplat_ — bible §2.1) and tinting a
  B&W shutter to `s=0.33`. Measured: **7.73 %** of the world area in one contiguous
  430×454 px block, against **1.77 %** for an entire Belliard street of 14 rimmed enemies.
- The same hue was painted on both the captor (shoot him) and the hostage
  (`HostageQteSprite.tsx`, one `energy` scalar for both) — the exact confusion the lane had
  already reasoned its way out of for `CourierSprite` ("a red aura would contradict the
  don't-shoot colour code"), but not carried to the hostage, the _original_ don't-shoot
  figure.
- `ENERGY_EMPTY #FF3030` (as first cut) and the ramp's other two stops were minted locally,
  duplicating a state-colour language the enemy heat ramp (ADR-0025) already owns
  (art-gate finding **G5**).

`pm` / `lead-game-designer` ruled the aura's _premise_ — a second peripheral energy read
painted on world entities — is a valid design (escalation **E2**); `senior-architect` ruled
the _construction_ must be render-only: reuse the ADR-0025/ADR-0011 silhouette-rim machinery
rather than a disc. That re-cut (commit `7251569`) is what this ADR fixes as a contract, so
the next entity that needs an energy read does not re-derive — or re-fail — the same three
lessons.

## Decision

**An entity's player-energy read is a silhouette RIM, never a disc, built from the ADR-0025
rim machinery — with three constraints on top: which classes may carry it, what hue ramp it
draws from, and which render band it lives in.**

### 1. Construction — rim, not disc; structurally incapable of pooling

The aura reuses, verbatim, the render pipeline ADR-0025 built for the hostile heat ramp:
`getSilhouetteFor` bakes the entity's own alpha shape once, in white, with a quadratic
outward falloff (`applyHaloFalloff`), and `createEnemyRimMaterial`'s 1-tap shader multiplies
that bake by a live colour uniform — recolouring per frame is free, no per-frame bake.
Because the glow only exists in the `marginPx` band **outward from the sprite's own alpha
edge**, it is structurally incapable of the disc's three failure modes: it cannot pool onto
the road with no source (there is no glow where there is no silhouette to trace), cannot
clip a background plane to an _aplat_ (the falloff returns to zero at a fixed, small margin
around the actual figure), and cannot tint a décor plane behind the entity (same reason).
This is not a tuning fix on the disc — it is a different geometry that removes the failure
mode by construction.

`createEntityAura()` (`src/render/effects/entityAura.ts`) also draws the pre-existing,
separately-gated contact shadow (art gate verdict 3b, PASS) — a neutral ink-black ellipse
under the entity's feet. That part is unchanged by this contract; only the RIM half of the
aura is new machinery.

Rim brightness is capped at `RIM_INTENSITY 0.9`, below the ADR-0025 hostile rim's `1.0` —
deliberate hierarchy: the hostile rim is an interaction signal ("your window to shoot this
is closing") and must stay the loudest rim on screen; the energy aura is an ambient state
read layered on entities that already carry their own stance tint, and must never compete
with it.

### 2. Class membership — which entities may carry the rim

| Entity              | Aura   | Why                                                                                                                 |
| -------------------- | ------ | --------------------------------------------------------------------------------------------------------------- |
| LOOT crate           | Yes    | Neutral object; no colour-code to contradict.                                                                     |
| Hostage-taker captor | Yes    | The class you must shoot; identical semantics to the existing hostile rim.                                        |
| Boss ("le Commandant") | Yes  | Same reasoning as the captor, at boss scale.                                                                      |
| Hostage              | **No** | The **original** don't-shoot figure. A rim driven by a global energy scalar says nothing about the object it surrounds — la loi du glow's job is _identification_, and painting the same hue on captor and hostage identifies neither. |
| Courier              | **No** | Already excluded, pre-dating this contract: the courier is a civilian and carries the "don't shoot" colour code (`docs/handoffs/story-street-graphics-effects.md` §"Open points for the design gate", item 2). This contract generalises that exclusion into a rule instead of a one-off. |

**The rule, stated once so it does not need re-deriving per entity:** a player-energy rim may
be added to an entity class **only if that class is not, and can never become, a
"don't-shoot" figure** in the fiction. Adding the rim to a new class is a content change
(which classes exist, which are shootable) gated the same way class behaviour always is —
`game-designer` / `lead-game-designer` — not a render-only decision, because it recreates the
exact identification failure this contract exists to prevent.

### 3. Colour — one shared state ramp, not a locally-minted one

The aura's green/amber/red anchors are **`STATE_GREEN` / `STATE_AMBER` / `STATE_RED`**,
exported from `src/render/scene/neonHeatColor.ts` (`#78FF3C` / `#FF8C14` / `#FF3030`) — the
same triple the enemy heat ramp (ADR-0025) already used. `src/render/effects/energyGlow.ts`
imports these three and re-points its own `ENERGY_FULL` / `ENERGY_HALF` / `ENERGY_EMPTY`
constants at them rather than defining new hex values. The two ramps carry **different
signals** (a hostile's exposure timer vs. the player's own energy) and keep their own
_shaping_ — the enemy ramp lingers across a wide 0.35–0.70 orange plateau, the energy aura
is two even linear halves — but they now share their **anchors**, so a future bible
amendment to the state-colour language (art-gate finding **G5**) moves both features in one
edit instead of one drifting from the other. `STATE_RED (#FF3030)` remains a deliberate
non-palette "urgency" hue, as ADR-0025 already flags it; this contract does not change that
status, only its ownership (one export, two consumers).

**No feature may mint its own green/amber/red triple going forward.** A new state ramp
either imports `STATE_GREEN/AMBER/RED` or, if it genuinely needs different anchors, that is
a bible amendment (`lead-art`), not a local hex literal.

### 4. Render band — the aura lives in its host's own stack, not a shared lower band

An aura's `renderOrder` must be one fractional slot **immediately below its host's own
band**, following the `vehicleRim`/`vehicle` idiom already in `streetDepth.ts` (5.2 below
5.25) — **never** a lower integer band shared with unrelated layers. The QTE hostage and
boss auras were first wired at `renderOrder: 5`, which collided with `facadeOverlay` (5),
`vehicleRim` (5.2), `vehicle` (5.25), `courier` (5.5) and `nearRow` (5.75) — every one of
those layers sorts after a rim at (5, z 0.48), so any balcony slab, grille, frozen courier
or near-row prop overlapping the figure would paint over the rim while the host body (band
6) painted over all of them: a rim with a bite out of it (triage finding **I1**).

**Prescription (triage, not the code's momentary state — the render lane's fix rides a
separate, parallel commit): both QTE auras take `renderOrder: 5.9`**, `rimZ`/`shadowZ`
unchanged. `5.75 (nearRow) < 5.9 < 6 (host band)` keeps the aura above the whole street
stack, like the tableau it belongs to. `LootCrate`'s aura at `renderOrder: 4` is **correct
as shipped** — same band as its own host body (4), disambiguated by `z`, which is the
`EnemySprite` rim idiom, not the QTE one; it does not need to move.

Any future aura consumer follows the same rule: take the fractional slot immediately below
the host's own band, document the slot and its neighbours in `streetDepth.ts`'s header
table, and never share an integer band with a layer the aura does not belong to.

## Consequences

**Positive**

- The failure the composite gate caught (a disc that can pool, clip, and tint) cannot recur
  for any future consumer of `createEntityAura()` — the construction rules it out by
  geometry, not by convention.
- Class membership is now a named rule instead of a per-entity judgement call re-derived
  each time; the courier's pre-existing exclusion and the hostage's newly-ruled one are the
  same rule, stated once.
- One state-colour ramp (`STATE_GREEN/AMBER/RED`) serves both the hostile heat ramp and the
  energy aura — art-gate finding G5 is closed structurally, not by a one-off hex match.
- The render-band rule generalises the fix for finding I1 into a contract every future aura
  (and every future fractional-slot layer) must satisfy, and ties it to the documentation
  obligation already on `streetDepth.ts`'s header table.

**Negative / cost**

- A new entity that wants an energy rim must clear three gates before it draws: (a) the
  class-membership rule (never a don't-shoot figure — a `game-designer` call, not a render
  one), (b) the shared ramp (import, don't mint), (c) the render-band placement (fractional
  slot below its own host band, documented in `streetDepth.ts`). Skipping any one of them
  reintroduces a failure this contract exists to prevent.
- `RIM_INTENSITY 0.9` vs the hostile rim's `1.0` is now a load-bearing ordering, not a tuning
  knob — a future change to either value must preserve "hostile rim stays loudest" or get a
  design pass first.

**Gotchas to watch**

- This ADR does not re-open **E2** (the aura's premise) or **E1** (décor-prop emitters,
  ADR-0011/ADR-0025's `bollard`/`parkingMeter`/`scooter` question) — those remain
  `pm`/`lead-game-designer` and Bertrand calls respectively, tracked in the story's handoffs
  shard, not here.
- The renderOrder prescription above (`5.9`) is the triage's PRESCRIPTION, not necessarily
  what any given commit's working tree shows at read time — the render lane (`dev-r3f-render`)
  and the `streetDepth.ts` table are the sources of truth for the value actually shipped;
  verify against the file, not this ADR, if they ever disagree.
- Reviewers should reject any new `createEntityAura()` consumer that (1) targets a
  don't-shoot-eligible class, (2) defines its own green/amber/red hex literals instead of
  importing `STATE_GREEN/AMBER/RED`, or (3) shares an integer `renderOrder` band with a layer
  it does not belong to.
