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

**No further entries until design gate runs.**
