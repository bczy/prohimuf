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
