# Story: caisse en bois sur le trottoir — LOOT crate revision (placement + art)

**Status:** open  
**Branch:** `claude/features-a-implémenter-ehw9q4` (PR #115)  
**Greenlight:** Bertrand playtest verdict, 2026-07-20

---

## stage-0. INTAKE — producer (Marion) — 2026-07-20

- claim: story opening, ADR reservation, pipeline routing; supersession of story-weapons-pickup's deferred crate art fast-follows / release: shard opened, ADR-0053 reserved, design + art lanes queued, dependencies noted
- **Trigger:** Bertrand playtest of PR #115 (story-weapons-pickup, pm-accepted, unmerged): the shipped crate (V1 code-drawn placeholder, window-slot placement) "ne ressemble pas du tout à une caisse" — revision mandated: (1) REAL WOODEN CRATE sprite (FLUX art, references collected), (2) placed ON THE SIDEWALK (street level `y`-position, not window slot column), (3) full agent workflow.
- **Reserved ADR:** ADR-0053 LOOT crate revision: sidewalk placement + FLUX art asset gen (reserved; senior-architect to write post-design-gate).
- **Pipeline route:** design delta Karim (game-designer → lead-game-designer gate) ∥ art lane (art-advisor refs → concept-artist FLUX prompt → game-graphist pre-prod → lead-art prompt gate → CI generation → lead-art asset gate) → senior-architect tech-plan delta (ADR-0053, placement amendment to ADR-0052 D5 or standalone, architect's call) → dev-gameplay ∥ dev-r3f-render → verify → stage-6 panel re-run (material diff on an already-MERGE-cleared branch, per COLLABORATION.md §code-review panel) → pm re-accept.
- **Scope guard:** ADR-0052 V1 crate was deferred: pm ruling #4 (no FLUX, drawn glyph placeholder suffices unless lead-art's B6 read judges it illegible, then small fast-follow). Bertrand playtest overrides: the placeholder is illegible/wrong as a crate → immediate upscale to full FLUX art lane.
- **Supersession note:** The deferred fast-follows from story-weapons-pickup.md (lead-art R1–R4 read, concept-artist FLUX pass, hue amendment) are SUPERSEDED by this story — no longer fast-follows, now in-story gated deliverables. See story-weapons-pickup.md stage-5, "Fast-follows (NOT blocking V1)" entries 1–2.
- **Contention:** The branch is shared with story-weapons-pickup (PR #115), which is pm-accepted. No scope drift on weapons-pickup itself; this story adds commits on top. Serialization: story-weapons-pickup merges first (lead to this story's dev entry); this story's commits land after, same branch+PR.
- **Shared files at risk (hand-off coordination needed):** `src/game/levels/levelArt.json` (art-generation config), `src/render/scene/LootCrate.tsx` (visual + art reference hook). Both lanes must not edit these files in parallel — dev-r3f-render owns the hook, CI art-gen owns asset output. Rule: art lane generates assets to CI, dev-r3f-render consumes the final sprite path post-generation.

---

## Key Decisions (pre-stage-1 notes)

- **Placement model:** crate moves from window-slot (indexed by `loot.slotIndex`, a column) to fixed street-level position (world `y`, constant across levels). Coordinate system: verify against `facade01.ts` facade geometry (window rows live at `y = 2.5` nominal; street = `y < 0`, e.g., `y = -1.0` or `-2.0`). Open question for lead-game-designer: does street placement affect the pickup window (currently 4.0 s VISIBLE window per ADR-0052 D5)?
- **Art direction:** FLUX generation via a `levelArt.json` art directive (style: xerox/fanzine wood crate, matching `docs/art-direction.md` §2; on-brand acid-neon trim per the four-hex palette). No glyph drawn on the crate sprite itself — glyph lives in HUD only (design delta, if any). Concept-artist to source wooden-crate references (shipping crates, rave-era props, fanzine xerox examples).
- **CI pipeline:** assets/audio/art-generation lane will unblock this story post-design-gate when the FLUX prompt is ready (no local sandbox art generation; final sprite appears in `_bmad-output/sprites/` or equivalent, integrated into `levelArt.json`).

---

## stage-2. DESIGN DELTA — game-designer (Sacha) — 2026-07-20

- **Deliverable:** `docs/game-design/weapons-crate-sidewalk-delta.md` — a SHORT delta (not a
  re-spec) superseding only the placement half of weapons.md §5.1 (R2/R3/R4), §5.2, §5.3,
  §5.4, and `lootSystem.ts`'s `LOOT_VISIBLE_DURATION`. Everything else in weapons.md (§2/§3/
  §4/§6/§7/§8, ACs 1–6 & 10–15) holds verbatim. Grounded on the shipped model
  (`resolvePlayerShot`, `tickLoot`, `CourierField.streetY = −5`, `VIEW_W/H = 18/12`, façade
  pitch `x = col·2 − 18`) — played the numbers, not imagined them.
- **Placement (D1–D5):** static street entity at `LOOT_STREET_Y = −4.3` (sidewalk strip, ~0.7 u
  back from the courier/vehicle road lane at `−5`); horizontal position = the **existing
  deterministic column seed** (only y decouples from the window row); NEW in-frame constraint
  `|col·2 − 18| ≤ 7` so it is shootable without a pan; `VISIBLE 4.0 → 6.0 s` (street objects
  read slower, lost the window-unfold snap); appear = drop-and-settle (`0.45 s`), despawn =
  neon-rim leaving-blink over the last ~0.8 s (no fold-away, render-only, no new state).
- **Hit contract (D6–D7):** precedence is already correct and UNCHANGED — the crate resolves in
  `resolvePlayerShot` step 1 (window-priority) before courier-on-miss step 2, so it always wins
  overlaps: a pickup shot never penalises a courier and a courier never eats the pickup shot.
  Loot LEAVES the window channel ⇒ the §5.1 R4 three-read requirement **dissolves**; window row
  reverts to the ADR-0040 two-read triage. New crate-vs-courier read is static-object vs
  moving-human (easiest in the game). Disambiguation is by precedence, not distance.
- **W-guardrails (D8–D9):** W1 glyph-before-fire HOLDS, moved to a **stencil on the crate face**
  (overrides the shard's "HUD-only glyph" note — HUD-only would break W1). W2 becomes a street
  rule: kept firefight col-gap ≥2 PLUS a NEW delivery-x-gap ≥2.0 when a vehicle is present;
  defer if unsatisfiable.
- **Tuning (D10):** spawn cadence 15 s and all A-B-C stock values UNCHANGED — placement/art
  revision, not a rebalance. W6/W7 not re-opened.
- **Cahier des charges:** still an [EXTENSION] (crate pickup was never in Prohibition ST), but
  the sidewalk placement is MORE faithful to genre canon (Operation Wolf / Wild Guns crates are
  street objects, not window pop-ups). Core loop untouched.
- **Hand-offs queued (log in agent-handoffs):** → `lead-art`/`concept-artist` (real wooden crate
  FLUX sprite A1–A4: squat, planks, stencil glyph, neon rim, solid cutout); → `senior-architect`
  (ADR-0053: `LOOT_STREET_Y`/`LOOT_MAX_ABS_X`/`CRATE_DELIVERY_GAP_X` + crate hit-point y
  decoupled from the façade slot row); → `ux-designer` (no HUD change, glyph stays on crate).
- **No VERDICT** — `lead-game-designer` (Karim) gates next.

---

**Awaiting Karim's design gate on the delta.**

---

## stage-2. ART REFS — art-advisor (Estelle) — 2026-07-20

- claim: reference brief grounding the FLUX crate prompt (period objects, game precedents, fanzine B&W treatment, hue recommendation) / release: brief at `docs/game-design/refs-loot-crate-sidewalk.md`, no gate held (advisory). (Entry persisted by orchestrator — agent had no write tools.)
- **Hue recommendation: `#78FF3C` (green)** — the only one of the four §2-law-1 accent hues with no fixed street-level object identity (truck=orange, car=cyan, moto=magenta all already live at street level; orange is also the enemy heat-rim's danger-stage colour, magenta is also the vehicle chroma-key background). Green also carries the right "safe/go/positive pickup" connotation already established by `mark-green`=FACILE in the print system. Fallback if rejected: cyan. Watch-out flagged (not blocking): a same-frame co-occurrence with an early-telegraph (still-green) enemy heat-rim should get a runtime screenshot sanity-check at the composite gate.
- **Period register:** recommend the marché-crate / ammo-box register (thin pine slats or dovetailed box, rope-hole handles, single stencilled destination/lot mark) over a wooden beer crate (anachronistic — 1998 French beer crates are plastic, not wood).
- No code/prompt/levelArt.json touched. Hands to `concept-artist` for the FLUX prompt draft.

---

## stage-2. DESIGN GATE — lead-game-designer (Karim) — 2026-07-20 (round 1 of 2)

Gate object: `docs/game-design/weapons-crate-sidewalk-delta.md`. Cross-checked against
`bulletSystem.ts` (`resolvePlayerShot`), `lootSystem.ts`, `courierSystem.ts`,
`cameraPanSystem.ts`, `crosshairSystem.ts`, `GameScene.tsx`, `facade01.ts`, `levels.ts`,
ADR-0003/0026. Delta NOT edited; code NOT touched.

**Scope (cahier des charges):** PASS. Crate pickup is an already-documented [EXTENSION]
(weapons.md §0); moving placement to the sidewalk is a documented refinement toward genre
canon (Operation Wolf / Wild Guns street crates), not a new undeclared extension. Core loop
`Récupérer → Livrer → Éviter` untouched. Une-mission-3-5-min unaffected (placement/art only).

**BLOCKING corrections (must resolve before `senior-architect` / ADR-0053):**

- **C1 — In-frame constraint uses the wrong x (D2/D3/D9/AC-D1). [verifiability]**
  `|col·2 − 18| ≤ 7` is the legacy **FACADE_01 harness** formula. At runtime the crate's
  world-x is `mergedFacade.slots[slotIndex].screenPosition.x` — tile-derived via
  `stretchAboutCentre(tile.centreX + (z.x−0.5)·tile.width, …)` (GameScene.tsx:198-205) — and
  runtime `col` is a **sequential 0..N index** (GameScene.tsx:203), so `col·2 − 18` is
  meaningless arithmetic on Belliard/tronçon geometry (windows span the full ±40 street). A dev
  implementing AC-D1 literally gets wrong placement. Re-express the constraint (and AC-D1) as
  `|slot.screenPosition.x| ≤ LOOT_MAX_ABS_X`, anchored to the world origin.

- **C2 — "reachable/readable on BOTH device classes without pan" is FALSE on mobile
  (D1/D3/D4/AC-D1). [verifiability / ADR-0003+0026 coherence]** `MOBILE_ZOOM_FACTOR = 1.7`
  zooms IN: resting mobile frame ≈ x∈[−5.3,5.3], y∈[−3.5,3.5] (centred). A crate at
  `y = −4.3` is **below** the mobile resting frame, and x up to 7 is outside it horizontally, so
  reaching a street crate on mobile requires a pan-down / zoom-out (exactly as couriers −4.8 and
  the delivery truck −4.5 already do). AC-D1 as written fails on mobile. Either (a) reword
  D1/D3/AC-D1 to state the crate is engaged on mobile the same way other street content is
  (ADR-0003 pan / ADR-0026 zoom-out), drop "no pan", and restate D4's periphery rationale for the
  pan case; or (b) size `LOOT_MAX_ABS_X` against BOTH frames if "no-pan" is kept (≈ ≤4.5 h,
  likely too tight) — escalate if that kills the placement. Concept survives; the claim + AC do
  not.

**NON-BLOCKING corrections / notes:**

- **N1 (point 3) — factual grounding.** Runtime `streetY = −facadeH·0.4 = −4.8`
  (GameScene.tsx:276), not −5 (that's the test fixture); Belliard delivery
  `stopPosition.y = −4.5` (levels.ts:104), not −5. So the crate at −4.3 sits **0.5 u** above
  couriers and only **0.2 u** above the delivery truck — the "~0.7 u sidewalk-vs-road" vertical
  separation (D1/D7) does not exist. Silhouette separation is carried by D9-2's x-gap (vehicle) +
  shape/z-band, not a vertical offset; correct the premise.
- **N2 (points 2/3) — frame bottom edge.** D1's "well inside the frame (bottom y = −6)" is the
  ortho half-height, not the 16:9 cover crop. Per the truck tuning (levels.ts:99-104) the visible
  bottom in cover framing is ≈ −4.5/−4.6 (wheels clip below −4.6). A crate at −4.3 sits at that
  crop line — verify empirically (composite/verify gate) that the full crate + glyph + neon rim
  are inside the crop; `LOOT_STREET_Y` is verify-tunable, raise if it clips.
- **N3 (point 1) — precedence VERIFIED, hit-point path disclosed.** `resolvePlayerShot`:
  couriers are step-2 on-miss only; a VISIBLE crate consuming step-1 is never re-evaluated against
  couriers ⇒ crate-beats-courier is correct. But the function currently reads the crate hit point
  from `facade.slots[loot.slotIndex].screenPosition` (window y); street-y decoupling is a real
  change to it (or LootCrate gains its own position), and `tickLoot` must gain delivery phase+x
  for D9-2. Disclosed to the architect via ADR-0053 — ensure the hand-off does not claim
  "no code change to resolvePlayerShot / tickLoot".
- **N4 (point 1) — crate-eats-courier fairness.** Acceptable under P3: crate-wins can only
  **prevent** a courier penalty, never cause a death. Residual = an intentional near-crate shot
  always equips (discarding the current special's stock, weapons.md §5.2), mitigated by W1
  (glyph pre-fire) + R3 (glow) + D9-1 (crate off the firefight column). No new guard required;
  verify playtest confirms accidental-pickup rate is low.
- **N5 (point 2) — spawn anchor is boundary-bound.** The `|x| ≤ LOOT_MAX_ABS_X` filter must be
  anchored to the **world origin**: the pure spawn cannot read live camera pan (ADR-0003/0026 keep
  pan out of `GameState`). State this, and accept/document that a player panned away from centre
  may miss a 6 s crate (consistent with missing other central action).
- **N6 (point 4) — drop-in telegraph.** Confirm at verify/composite that the D5 drop-from-above
  does not transit the window engagement zone as a false telegraph; crate is resolvable only when
  VISIBLE (verified: `loot.state === "VISIBLE"` in `resolvePlayerShot`), so no mid-drop accidental
  grab. Render-only.

**CONFIRMED (PASS points):**

- **Point 5 — D8 W1 stencil-glyph-on-crate OVERRIDES the shard's HUD-only note: CONFIRMED as a
  gated guardrail.** Glyph-before-fire (weapons.md W1/R2/AC8) requires the A/B/C picto legible on
  the crate face BEFORE the collecting shot; a HUD-only glyph shows what you HOLD, not what you'd
  EQUIP ⇒ blind pickup ⇒ breaks W1. The HUD keeps its separate active-weapon glyph (weapons.md
  §6.2); no conflict. The stage-0 "glyph in HUD only" key-decision note is **superseded** — glyph
  lives on the crate face.
- **Point 4 — W2 street reformulation is MEASURABLE.** D9-1 `|col−a.col| ≥ 2` (unchanged) +
  D9-2 `|cx − delivery.stopPosition.x| ≥ 2.0`, both unit-testable (AC-D6). Shoot-reflex trap
  adequately mitigated (street-level separation from the window reticle zone + D9-1 +
  VISIBLE-only resolvability).
- **Point 1 — precedence claim VERIFIED** (see N3).

**DELEGATED (point 6 — hue):** the delta correctly does NOT hardcode a hue (A3 = four-hex house
palette), so no delta correction. Hue is `lead-art`'s prompt-gate call — I do not arbitrate
visuals. **Binding condition on lead-art:** the recommended green (`#78FF3C`) rim vs the enemy
early/safe telegraph (also green) co-occurrence MUST be confirmed discriminable under the <0.3 s
triage at the composite gate (same-frame screenshot: green crate + still-green enemy rim), with
the silhouette law (box vs figure) + z-band (street vs window) carrying it; cyan (`#28F0FF`) is
the art-advisor fallback if it fails. Flagged to `lead-art`, not blocking this design delta.

**VERDICT:** PASS-WITH-CORRECTIONS — 2 blocking (C1 runtime-x formula, C2 mobile-frame reachability), 6 non-blocking + 3 confirmed; hue delegated to lead-art composite gate. Round 1 of 2: back to `game-designer` (Sacha) to amend C1/C2 (and N1–N2 premises) in the delta, then re-gate before `senior-architect` (ADR-0053). Scope/core-loop/W1/W2/precedence all PASS.

---

## stage-2. DESIGN GATE — lead-game-designer (Karim) — 2026-07-20 (round 2 of 2, final)

Re-gate of the amended `docs/game-design/weapons-crate-sidewalk-delta.md` (Sacha, commit
c949ceb) against my round-1 corrections. Verified each landed in code-grounded form, not
hand-waved; checked no regression on confirmed rulings and no scope creep.

**Blocking corrections — both resolved:**

- **C1 (runtime-x formula) — RESOLVED.** The harness `col·2 − 18` is retired throughout;
  crate world-x is now `slot.screenPosition.x` (grounding block, D2, D9-2 `cx`, AC-D1), and the
  spawn filter is `|slot.screenPosition.x| ≤ LOOT_MAX_ABS_X = 7` world-origin-anchored (D3/N5).
  Runtime `col`-as-sequential-index is called out. Unit-testable against `mergedFacade`.
- **C2 (mobile reachability) — RESOLVED.** All "no-pan" claims removed. Grounding block states
  the mobile resting frame (zoom 1.7 → x∈[−5.3,5.3], y∈[−3.5,3.5]); D3/D4/AC-D1 state the crate
  is street content below the resting frame, engaged by the same pan-down / zoom-out as
  couriers (−4.8) and the truck (−4.5), ADR-0003/0026-aligned; panned-away-miss documented and
  accepted.

**Premise corrections — landed:** N1 (runtime −4.8/−4.5, separation via shape + z-band + D9-2
x-gap, not a 0.7 u depth offset — D1/D7); N2 (−4.3 sits at the ≈−4.5/−4.6 cover-crop bottom, new
**AC-D8** empirical crop-clearance gate, `LOOT_STREET_Y` verify-tunable); N3 (architect hand-off
now explicitly discloses the `resolvePlayerShot` street-y change + `tickLoot`/`attemptSpawn`
filters + constants — "a real code change, not no-code-change"); N5 (world-origin anchor,
boundary-legal, pan stays out of `GameState`).

**No regression / no scope creep:** D6/D7 precedence (crate-beats-courier), D9-1/D9-2
measurability, D8 W1 stencil-on-face override — all intact from round 1. D10 tuning (cadence 15 s,
A-B-C stock) untouched; AC-D8 is a verify/composite gate consistent with N2, not a new mechanic.
Supersession set (weapons.md §5.1-R2/R3/R4, §5.2, §5.3, §5.4, `LOOT_VISIBLE_DURATION`) unchanged.
Cahier des charges still PASS (documented refinement of the greenlit [EXTENSION], loop untouched).

**Pins for `senior-architect` (ADR-0053) / dev — carried into the tech lane, not blocking:**

- **P1 — signature change.** `tickLoot`/`attemptSpawn` must gain the delivery phase +
  `stopPosition.x` (for D9-2) as passed-in pure data (not render state) — the pure system takes
  no delivery input today. Keep boundary law: data in, no React/Three.
- **P2 — hit-point decoupling.** `resolvePlayerShot` must resolve the crate at `LOOT_STREET_Y`,
  not `slot.screenPosition.y`; keep the nearest-wins / step-1-before-step-2 ordering
  byte-identical (only the y source changes) so the AC-D3 precedence regression holds.
- **P3 — test targets.** Unit-test the `|slot.screenPosition.x| ≤ 7` filter against
  `mergedFacade` (not `facade01`); AC-D8 crop clearance is an empirical verify/composite gate
  (not unit) — tune `LOOT_STREET_Y` there if the crate/glyph/rim clips the 16:9 bottom.
- **P4 — lead-art (carried).** Green `#78FF3C` rim vs the green enemy early-telegraph
  co-occurrence remains a binding composite-gate check (same-frame screenshot); cyan fallback.

**VERDICT:** PASS — both blocking corrections (C1, C2) and all premise fixes (N1/N2/N3/N5) genuinely landed and code-grounded; confirmed rulings intact, no scope creep. Delta cleared for `senior-architect` (ADR-0053). 4 pins carried to the tech/art lanes (non-blocking). Cap reached (round 2 of 2) — no further design-gate rounds.

---

## stage-2. DELTA AMENDMENT — game-designer (Sacha) — 2026-07-20 (for Karim round 2)

All corrections applied to `docs/game-design/weapons-crate-sidewalk-delta.md`; confirmed points
left untouched.

- **C1 (BLOCKING) fixed** — dropped the harness `col·2 − 18` formula everywhere. Crate world-x
  is now `slot.screenPosition.x` (tile-derived, `GameScene.tsx:198-205`); the D3 constraint and
  AC-D1 are re-expressed as `|slot.screenPosition.x| ≤ LOOT_MAX_ABS_X (=7)`, world-origin-anchored
  (pure spawn can't read pan; a panned-away player may miss a 6 s crate — documented, N5). D2/D9-2
  cx updated too.
- **C2 (BLOCKING) fixed** — removed every "no pan / reachable on both device classes without pan"
  claim. D1/D3/D4/AC-D1 now state the crate is street content **below the mobile resting frame**
  (`MOBILE_ZOOM_FACTOR 1.7` → `y∈[−3.5,3.5]`), engaged by the same pan-down/zoom-out the couriers
  (`−4.8`) and truck (`−4.5`) already need (ADR-0003/0026); concept stands, the false claim is gone.
- **N1 fixed** — runtime `streetY = −4.8` and truck stop `−4.5` (not the `−5` fixture): the
  crate at `−4.3` is 0.5 u / 0.2 u above them, so the "~0.7 u sidewalk offset" is deleted. D1/D7
  now state separation is carried by the box-vs-figure shape + street-vs-window z-band + D9-2
  x-gap, **not** a vertical offset.
- **N2 fixed** — `−6` was the ortho half-height, not the 16:9 crop; added **AC-D8** requiring the
  full crate + glyph + rim to clear the cover crop (~`−4.5/−4.6`) empirically, `LOOT_STREET_Y`
  verify-tunable.
- **N3 fixed** — the architect hand-off no longer implies "no code change": it now spells out
  that `resolvePlayerShot` must resolve the crate at street-y (it reads window-y today) and
  `tickLoot` gains the x-bound filter + delivery phase/x check.
- **N4/N5/N6** — folded in as accepted (D7 accidental-pickup residual, D3 world-origin anchor,
  D5 drop-telegraph render-only note already present).
- **Untouched (Karim CONFIRMED):** precedence ruling (D6), W2 predicates D9-1/D9-2, W1 stencil
  override (D8), scope/core-loop, tuning (D10). Hue stays undelegated in the delta (lead-art
  composite-gate call).
- **No VERDICT** — back to Karim for the round-2 gate.

---

## stage-3. TECH PLAN + ADR-0053 — senior-architect (Winston) — 2026-07-20

- claim: tech plan + ADR for the gated sidewalk delta; lane cut → release: **ADR-0053**
  ([`docs/adr/0053-loot-crate-sidewalk-placement.md`](../adr/0053-loot-crate-sidewalk-placement.md),
  index regenerated); two dev lanes cut on disjoint paths; art lane runs ∥.
- **No escalation.** Everything in the plan follows the gated delta + Karim's pins P1–P4; nothing
  contradicts the delta. Honoured: P1 (delivery data threaded as pure input), P2 (`resolvePlayerShot`
  ordering byte-identical, only y source moves), P3 (unit targets vs `mergedFacade`; AC-D8 empirical),
  P4 (hue is lead-art's composite-gate call — untouched here).

**DECISION — slotIndex vs x-only:** **KEEP `slotIndex`** (column seed + x carrier); decouple **only
y** to `LOOT_STREET_Y`. An x-only model would break the replay-safe seed pick, the ADR-0052 D5
co-location guards (a)/(b), and the enemies∪crate tie-break. This is exactly delta D2 (ADR-0053 D1).

**ADR-0052 relationship:** ADR-0053 **supersedes ADR-0052's D5 _placement_ clause only** (+ the two
durations). Survives verbatim: new-entity-not-`EnemyKind`, `LootCrate`/`LootState` shape, `slotIndex`
as x-carrier, co-location guards (a)/(b), D9-1 col-gap. Untouched: ADR-0052 D1/D2/D3/D4/D7/D8.

### Lane cut (parallel-safe — disjoint paths; art lane ∥)

**Lane A — `dev-gameplay`** (`src/game/**`, TDD):

- `src/game/systems/lootSystem.ts` — add consts `LOOT_STREET_Y = −4.3`, `LOOT_MAX_ABS_X = 7`,
  `CRATE_DELIVERY_GAP_X = 2.0`; bump `LOOT_VISIBLE_DURATION 4.0→6.0`, `LOOT_APPEARING_DURATION
0.3→0.45`. Add to `attemptSpawn`'s eligible filter: `|slot.screenPosition.x| ≤ LOOT_MAX_ABS_X`
  (D3) + the D9-2 delivery-gap predicate. Add **one** new pure param to `tickLoot`/`attemptSpawn`
  carrying the delivery data — recommended `deliveryGap: { stopX: number } | null` (dev's exact
  shape). `lootSystem` stays delivery-type-agnostic (a number/enum in, never `DeliveryVehicle`).
- `src/game/systems/bulletSystem.ts` — in `resolvePlayerShot`, the crate hit-point y uses
  `LOOT_STREET_Y` (import from `lootSystem`; acyclic) instead of `slot.screenPosition.y`. Enemy
  loop, `HIT_RADIUS`, nearest-wins + tie-break, step ordering **byte-identical** (P2).
- `src/game/systems/stateMachine.ts` — at the step-3b `tickLoot` call site, assemble the delivery
  descriptor from the **pre-tick** `state.deliveryVehicle`/`state.deliverySpec`: non-null only when
  `phase ∈ {INCOMING, DELIVERING}`, `stopX = deliverySpec.stopPosition.x`. Phase-gate lives here
  (it already knows delivery types); only pure data crosses the seam (P1, boundary law).
- Tests: `src/game/systems/__tests__/lootSystem.test.ts` (x-filter + D9-2 gap + defer, against
  `mergedFacade`-shaped slots), `bulletSystem.test.ts` (AC-D3 street-y precedence regression). P3.

**Lane B — `dev-r3f-render`** (`src/render/**`):

- `src/render/scene/LootCrate.tsx` — mount at `(slot.screenPosition.x, LOOT_STREET_Y)` (**import**
  `LOOT_STREET_Y` from `lootSystem`, never re-declare −4.3); decouple the plane from `slot.size` →
  fixed crate world-size (verify-tunable for AC-D8). Load the FLUX wooden-crate sprite with the
  **existing code-drawn box kept as synchronous fallback** (ADR-0049 generated-with-procedural-
  fallback idiom; keying per `enemyTextures.ts`) so the lane never blocks on CI. A/B/C glyph
  composited **render-side** over the crate (per-weapon via `weaponGlyph`) — on the crate face,
  not HUD (D8). Render-side neon rim (ADR-0011/0025), **hue = lead-art's call (P4)**. Drop-and-
  settle APPEARING + pre-despawn rim blink over the last ~0.8 s (render-only, no new game state).
  Optional new `src/render/scene/lootTextures.ts` for the load-with-fallback cache (dev B's call).
- `src/render/scene/GameScene.tsx` — `<LootCrate slots={mergedFacade.slots}/>` mount: comment
  update only (still passes `slots` for x). Minimal/none.

**Seams & sequencing:**

- **`LOOT_STREET_Y`** — single source of truth in `lootSystem.ts` (Lane A owns), imported by
  `bulletSystem` (A) and `LootCrate.tsx` (B). Value fixed here (−4.3), so **both lanes run in
  parallel** with no blocking handshake; B imports the symbol, never re-declares the literal.
- **`src/game/levels/levelArt.json`** — the `loot` art block (prompt/seed/asset/size) is
  **`concept-artist`'s file**, authored in the **∥ art lane**, gated by lead-art, generated in CI.
  **Neither dev lane edits `levelArt.json`.** Lane B consumes `levelArt.loot.asset` **read-only**
  with the procedural fallback when the block/PNG is absent (shard stage-0 shared-file rule).
- No file is touched by both dev lanes (`src/game` vs `src/render` disjoint) → launch A ∥ B.

**Verify/composite (post-lanes):** AC-D8 crop clearance (tune `LOOT_STREET_Y` if the crate/glyph/rim
clips the ≈−4.5/−4.6 cover-crop bottom) + P4 green-crate-vs-green-enemy-telegraph co-occurrence.

- **Next:** `dev-gameplay` ∥ `dev-r3f-render` ∥ art lane. Then verify → stage-6 panel re-run → pm.

---

## stage-2. FLUX PROMPT — concept-artist (Maud) — 2026-07-20 (retry; prior run produced no output)

- claim: author the generation prompt for the REAL WOODEN CRATE sprite replacing the
  code-drawn LOOT placeholder (design delta gated round-2 PASS) / release: new `loot` family
  block in `src/game/levels/levelArt.json`, gate-ready, drafts logged.
- **One-asset decision (Step 3): ONE glyph-less crate BODY sprite**, weapon glyph composited
  render-side. Justified in the block `$comment`: `LootCrate.tsx` already bakes the A/B/C glyph
  per weapon onto the plane, so a single body serves all three weapons and the stencil glyph
  (D8/W1, glyph-before-fire on the crate FACE) stays crisp and re-hueable — no three
  near-identical rolls, no per-weapon asset drift.
- **Family = new `loot` block, structural cousin `vehicles`.** The crate is a street-level
  interactive object in the SAME fanzine printing run (pure B&W xerox, refs §3): reuses the
  vehicle `opening` framing + `style` tail VERBATIM (flat magenta `#FF3CDC` chroma-key ground,
  cutout edges), `neonPhrase` empty — the green neon rim is drawn RENDER-SIDE (ADR-0011
  analogue), `neon` is render metadata only. Structure (block name / key / `asset` / `size` /
  `facing` / `seed` / lint+generator wiring) is PROVISIONAL, owned by `dev-tooling-assets` per
  the boss-block precedent; concept-artist owns only `opening`/`style`/`prompt`.
- **Assembled prompt** (`loot.opening` + `loot.types.crate.prompt` + `loot.style`, neonPhrase
  empty), **90 words, 0 negations** — gate-ready, in the 30-90 band:
  > Flat 2D video game sprite, strict side view in orthographic projection, single wooden crate
  > centered and fully visible, sitting flat on the ground, a squat plank crate wider than tall,
  > thick horizontal pine boards butted tight with dark seams, corner battens, one bold diagonal
  > cross-brace, a top lid rail, photocopied 1990s punk fanzine illustration, rough black ink
  > linework, high-contrast xerox toner texture, coarse halftone dots, fully black and white,
  > isolated on a solid flat uniform bright magenta (#FF3CDC) chroma-key background, fully magenta
  > empty surroundings, flat ambient lighting, crisp cutout edges
- **Subject clause rationale (one line per clause that earns its place):**
  - `squat plank crate wider than tall` → A1 squat non-human OBJECT silhouette, ground-sitting
    (ground contact in `opening`); box-vs-figure read for the D6/D7 triage.
  - `thick horizontal pine boards butted tight with dark seams` → "real wood" read via thick ink
    plank strokes (refs §3), period-true pine marché/ammo register; **butted tight** locks A4
    (solid faces, no see-through gaps for the magenta key to bleed through — cf. sprite-hole-audit).
  - `corner battens` → structural crate vocabulary, reinforces the box corners for the cutout.
  - `one bold diagonal cross-brace` → the single strong plank gesture that reads a crate at street
    distance (Metal Slug / Wild Guns single-bold-mark discipline, refs §2), low-contrast ink so it
    does not fight the render-side glyph/rim accent.
  - `a top lid rail` → lid band = "crate", not a plain board; sits within strict side view.
- **HUE:** `neon: "green"` (`#78FF3C`, art-advisor rec). BINDING on lead-art composite gate
  (Karim P4): confirm the green rim vs the enemy early-telegraph green stays discriminable in a
  same-frame screenshot (silhouette box-vs-figure + street-vs-window z-band carry it); cyan
  (`#28F0FF`) is the fallback. NOT baked — render-side per the law of glow.
- **Lint:** `node scripts/check-art-prompts.mjs` → PASSED (12 pre-existing WARNs on
  enemies/courier/nearForegroundArt, left untouched; the new `loot` block is not yet in the
  lint's set list — dev-tooling-assets to add coverage with the generator wiring).
- **No VERDICT** — next: `game-graphist` pre-prod annotation (readability at game size, keying
  soundness), then the `lead-art` PROMPT GATE. No image generated (CI render farm); no other
  `levelArt.json` entry touched.

---

## stage-2. PRE-PROD PASS — game-graphist (Serge) — 2026-07-20

Gate object: the assembled `loot` prompt (Maud, above), `levelArt.json` `loot` block
(commit 6f71f09), refs brief, delta doc, `LootCrate.tsx`, `scripts/cutout-enemies.mjs`. No
image generated yet — this is a paper/text annotation pass, squinted at the numbers I can
actually ground: `VEHICLE_H = 2.4` world units for the street vehicles it's structurally
modeled on (`DeliveryVehicleSprite.tsx:19`), the crate's own generation canvas 256×192, and
the cutout script's magenta-keying math (`cutout-enemies.mjs`).

**[S1] Board count unconstrained — silhouette risk at squat display size.** "thick horizontal
pine boards butted tight with dark seams" says THICK but not HOW MANY. A squat crate is, per
the tech plan (`LootCrate.tsx` decouples from `slot.size` to "a fixed crate world-size,
verify-tunable for AC-D8") going to render smaller than the 2.4u vehicles it's modeled on —
plausibly ~1.0–1.4u to sit inside the AC-D8 crop line without dominating the street band, i.e.
roughly HALF the vehicle world-height. FLUX left to its own devices on "thick... boards"
without a count will happily give you 6-8 packed boards to fill a 192px-tall canvas; at half
the vehicles' on-screen height those seam lines close up into a grey mush exactly the way
fine plank/nail detail always does (refs §2, Wild Guns lesson). **Fix:** pin the count —
`"three or four wide horizontal pine boards"` — so FLUX can't hedge toward a fine lattice.
Three-to-four boards at any plausible crate world-height stay individually resolvable; six+
do not.

**[S2] Diagonal cross-brace sits exactly where the glyph lands — fights W1/AC-D5.** The
assembled prompt is `opening` ("strict side view in orthographic projection") — a TRUE 2D
side elevation, no depth reveal, so there is no end face to put the brace on; the "brace on
the END faces" option the delta docs floated is not opticaly available here (nothing but the
front plank face is ever visible). A brace running corner-to-corner through the crate's
geometric centre lands directly under the render-side A/B/C glyph (`LootCrate.tsx` bakes the
weapon glyph at `S/2, S/2`, dead centre) — a bold diagonal ink stroke crossing a bold letter
stroke is a legibility fight, and W1 (glyph-before-fire, AC-D5) is a gated guardrail, not a
nice-to-have. **Fix (concrete, pick one):**

- confine the brace to the **bottom third only** — a short diagonal strut between the
  bottom corner and mid-height, entirely below where the glyph sits: `"a short diagonal
corner brace low on the crate, confined to the bottom third, well clear of the crate's
centre"`; or
- drop the diagonal gesture and let corner battens + the top lid rail alone carry the
  "crate" read (both already in the prompt, both sit at the edges, both leave centre calm).
  Either reading keeps a calm, flat landing zone at the exact spot the glyph is composited.

**[S3] Keying soundness — READY, no change needed.** Dark pine ink body on `#FF3CDC` magenta
(luminance ≈136) is a huge colour-distance separation; `cutout-enemies.mjs`'s
`THRESHOLD_SQ = 24×24` per-channel key and the enclosed-island pass's `TIGHT_BAND = 20` are
tuned tight specifically because this is the SAME regime the vehicle set already ships
clean in (dark ink on bright magenta is the easy case — it's the near-black-ground enemy
migration that was the hard case, not this one). "butted tight with dark seams" already says
what the keyer needs: no gaps between boards for magenta to bleed through mid-body. No prompt
change required here.

**[S4] Halftone dots vs the cutout — WATCH, not blocking.** The shared `style` tail's "coarse
halftone dots" is inherited verbatim from the vehicle family and already ships clean there, so
this is not a NEW risk the crate introduces. Flagging anyway because the crate is smaller
(S1): if FLUX renders the halftone as genuinely OPEN dot-screen (magenta showing between
ink dots, not a solid dark wash with dot texture printed over it) on the shadow face, any
dot-gap fully enclosed by ink (touching neither border nor already-transparent pixel) reads
as a real magenta island to the enclosed-island pass and gets punched out — interior speckle,
the same defect class the mechanical `check-sprite-integrity.mjs` speckle budget polices. No
prompt tweak proposed (it's a shared style clause, not this prompt's to rewrite alone) — carry
it into the TECHNICAL pass as a specific crop to check once the PNG lands, magenta-composited
and at real display size.

**[S5] Set-mechanics across sizes.** The `loot` block has one type (`crate`) at one generation
size (256×192), so there's no per-type size split to cross-check the way `vehicles.types`
has three. The real "multiple sizes" exposure here is temporal, not spatial: the crate's final
on-screen world-height is still **verify-tunable** (AC-D8, not yet pinned in code). S1's fix
(pin the board count low) must hold across the whole plausible range the tech lane might land
on — from a vehicle-adjacent 2.4u down to a genuinely squat ~1.0u — not just whatever the first
`LootCrate.tsx` tuning pass happens to pick. Re-check S1 empirically once `LOOT_STREET_Y`/the
crate world-size are tuned at the composite gate.

**VERDICT: ANNOTATED** (not READY-FOR-GATE as-is). Two concrete prompt-wording changes
proposed (S1 board count, S2 cross-brace placement); S3 confirmed sound, no change; S4/S5 are
watches carried to the technical pass, not blockers on the prompt itself. I do not edit
`levelArt.json` — `concept-artist` (Maud) integrates if `lead-art` agrees, then the prompt
goes back up for the PROMPT GATE.

— Serge, PRE-PROD pass

---

## stage-2. PROMPT GATE — lead-art (Nico) — 2026-07-20

Gate object: the `loot` block in `src/game/levels/levelArt.json` (was commit 6f71f09),
against `docs/art-direction.md` §2 laws + §3 FLUX contract, with Serge's pre-prod annotations
(S1/S2) and the `vehicles` block as the family precedent. I own visual acceptance — Maud's
structure (block name, `types` key, `asset`/`size`/`facing`/`seed`) stays; I only ratified the
`prompt` wording.

**S1 (board count) — ACCEPTED, amended.** Serge is right: "thick boards" with no count lets
FLUX hedge toward a 6-8 board lattice that mushes to grey at the squat display size (Wild Guns
lesson, refs §2). Pinned the count. I kept "butted tight with dark seams" (Serge S3 keying
requirement — no gaps for the magenta key to bleed mid-body) and folded the count in.
Ratified: `three or four wide horizontal pine boards butted tight with dark seams` ("wide"
carries the low-count intent better than "thick").

**S2 (cross-brace vs glyph zone) — ACCEPTED, option (a) tightened.** A bold diagonal through
the geometric centre fights the render-side A/B/C glyph baked at `S/2,S/2` (`LootCrate.tsx`) —
W1/AC-D5 glyph-before-fire is a gated guardrail, not a nice-to-have, so the brace must clear
the centre. I did NOT drop the brace (option b): the diagonal is this object's single most
crate-specific interior gesture and preserves continuity with the placeholder's lid-band +
cross-brace language (refs §3) — dropping it risks the box reading as a plain carton
(silhouette-first / archetype law). Confined it low instead. Ratified: `a short diagonal brace
confined to the bottom third, clear of the centre` (dropped the "corner" qualifier to avoid
colliding with the adjacent "corner battens").

**Prompt vs the bible:**

- **One-accent / ADR-0011 lesson — PASS.** `neonPhrase` empty; body prompt is "fully black and
  white"; no neon/glow/acid/hue token anywhere in the assembled subject or style tail; `neon:
  green` is render metadata only. The green rim is render-side, exactly the vehicle contract —
  no baked-body flood risk.
- **Style-tail conformity — PASS.** `opening` + `style` are byte-identical to the `vehicles`
  block (Family consistency §2 law 2): same magenta `#FF3CDC` chroma-key ground, same
  fanzine/xerox/halftone treatment, same cutout tail. The crate reads as one printing run with
  the vehicle set it shares the street with.
- **Silhouette-first / register — PASS.** "squat plank crate wider than tall, sitting flat on
  the ground" is a box silhouette categorically distinct from any figure (D6/D7 triage);
  pine boards + corner battens + lid rail = marché/ammo-box register, no anachronism (no
  plastic beer crate, no branded label, no washi).
- **Word budget — 102 assembled words, 0 negations.** In the 90-120 warn band (over the 90
  target, under the 120 ceiling). Tolerated per §3.3: medium + view + silhouette all land in
  the first ~26 words; every word past 90 is a load-bearing pre-prod fix clause (S1 count-pin,
  S2 brace-placement), none filler. The tail is on watch at my asset gate. `check-art-prompts`
  does not yet cover the `loot` block (dev-tooling-assets owes that coverage with the generator
  wiring); ran it anyway — PASSED, 12 pre-existing WARNs, none on `loot`.

**Two conditions carried DOWNSTREAM, still owed — this PASS does NOT cover them:**

1. **ASSET GATE (mine, on the CI PNG).** Verdict the keyed `crate.png` on a contrasting
   background at game size before it ships: AI-defect sweep (detached/fused/duplicated planks,
   melted wood) + Serge's S4 crop — if FLUX renders the halftone as OPEN dot-screen, any
   ink-enclosed magenta dot-gap gets punched by the enclosed-island keyer as an interior hole;
   check that crop magenta-composited at real size. S5: re-verify the S1 low board count still
   resolves across the whole plausible crate world-height range once `LOOT_STREET_Y`/crate
   world-size are tuned.
2. **COMPOSITE GATE (mine, on real in-game screenshots).** The green `#78FF3C` render-side rim
   is a runtime composite never present in the PNG — it has NOT been gated here. Owed: (a) §2.1
   « un halo est un dégradé, jamais un aplat » — the rim must show monotonic alpha falloff to
   zero, no hard-edged aplat (the ADR-0011 hard-rim lesson); (b) Karim P4 — same-frame
   screenshot proving the green crate rim stays discriminable from the still-green enemy
   early-telegraph rim under the <0.3 s triage (box-vs-figure silhouette + street-vs-window
   z-band carry it); **cyan `#28F0FF` is the fallback** if it fails.

**VERDICT: PASS-WITH-CORRECTIONS** — S1 + S2 ratified and applied to `levelArt.json`
(`loot.types.crate.prompt`); one-accent/style-tail/silhouette/register all PASS; asset gate +
composite gate (incl. P4 hue-discriminability) carried as owed downstream. Prompt is cleared
for CI generation.

Ratified assembled prompt (opening + subject + style, neonPhrase empty):

> Flat 2D video game sprite, strict side view in orthographic projection, single wooden crate
> centered and fully visible, sitting flat on the ground, a squat plank crate wider than tall,
> three or four wide horizontal pine boards butted tight with dark seams, corner battens, a
> short diagonal brace confined to the bottom third, clear of the centre, a top lid rail,
> photocopied 1990s punk fanzine illustration, rough black ink linework, high-contrast xerox
> toner texture, coarse halftone dots, fully black and white, isolated on a solid flat uniform
> bright magenta (#FF3CDC) chroma-key background, fully magenta empty surroundings, flat
> ambient lighting, crisp cutout edges

— Nico, PROMPT GATE

---

## stage-4. DEV LANE A — dev-gameplay (Amelia) — 2026-07-20

- claim: Lane A (`src/game/**` only) — implement the sidewalk placement per ADR-0053 (D1-D4/D9),
  TDD red-first / release: **DONE, all green** (tsc 0, lint 0, format 0 on Lane-A files; vitest
  875 passed — 867 baseline + 8 new). No deviation from ADR-0053; `slotIndex` kept as the
  x-carrier (D1), no x-only refactor.
- VERDICT: PASS — dev-gameplay: LOOT crate sidewalk placement (Lane A)
- **Branch:** `claude/features-a-implémenter-ehw9q4` (1 commit; orchestrator pushes).
- **Decisions as-built:**
  - **D2 consts (single source of truth in `lootSystem.ts`):** `LOOT_STREET_Y = -4.3`,
    `LOOT_MAX_ABS_X = 7`, `CRATE_DELIVERY_GAP_X = 2.0`, all exported; `LOOT_VISIBLE_DURATION`
    4.0→6.0 (D4), `LOOT_APPEARING_DURATION` 0.3→0.45 (D5). `LOOT_STREET_Y` is imported by
    `bulletSystem` (game) and is available for `LootCrate.tsx` (render, Lane B) to import — never
    re-declared as a literal.
  - **D3 (`bulletSystem.resolvePlayerShot`):** crate hit-point y is now `LOOT_STREET_Y` instead of
    `slot.screenPosition.y`; x stays `slot.screenPosition.x`. The enemy scan, `HIT_RADIUS`,
    nearest-wins comparison and `crateWins` tie-break are **byte-identical** — only the one y
    source line changed (P2). AC-D3 street-y precedence holds by construction.
  - **D4 spawn filter (`attemptSpawn`):** added `|slot.screenPosition.x| <= LOOT_MAX_ABS_X` (D3)
    and the D9-2 delivery x-gap `|x - stopX| >= CRATE_DELIVERY_GAP_X` (skipped when no delivery),
    ALONGSIDE the kept §5.4 col-gap + occupied-slot guards. New pure param
    `deliveryGap: DeliveryGap | null` (a `{ stopX }` snapshot, default null) on `tickLoot`/
    `attemptSpawn` — `lootSystem` stays delivery-type-agnostic (a number in, never a
    `DeliveryVehicle`), boundary law preserved (P1).
  - **stateMachine (P1):** the delivery descriptor is assembled at the step-3b `tickLoot` call
    site from the **pre-tick** `state.deliveryVehicle`/`state.deliverySpec`, non-null only when
    `phase ∈ {INCOMING, DELIVERING}`, `stopX = deliverySpec.stopPosition.x`. Phase-gate lives here;
    only pure data crosses the seam.
- **Tests (TDD red-first, P3 — against `mergedFacade`-shaped slots, not facade01 arithmetic):**
  x-bound filter + defer-when-off-centre; D9-2 delivery-gap + defer + no-delivery-active (null)
  skip; VISIBLE 6.0 s / APPEARING 0.45 s; `bulletSystem` street-y regression (a shot at the crate
  slot's OLD window-y no longer hits; a shot at street-y hits). Existing crate-position tests
  (bulletSystem/weaponSystem/stateMachine) re-aimed to street-y for the moved crate; the AC-D3
  precedence mechanism and the ADR-0052 co-location guards stay green unmodified.
- **File List:** `src/game/systems/lootSystem.ts`, `src/game/systems/bulletSystem.ts`,
  `src/game/systems/stateMachine.ts`, and their `__tests__` specs
  (`lootSystem`, `bulletSystem`, `weaponSystem`, `stateMachine`).
- **Lane B / art handshake:** `LOOT_STREET_Y` is live and importable — Lane B mounts `LootCrate`
  at `(slot.screenPosition.x, LOOT_STREET_Y)` (import, never re-declare −4.3). No dev lane edits
  `src/game/levels/levelArt.json` (concept-artist's file). Not touched here: `src/render/**`,
  `scripts/**`, `levelArt.json`.
