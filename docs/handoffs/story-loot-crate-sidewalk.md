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
