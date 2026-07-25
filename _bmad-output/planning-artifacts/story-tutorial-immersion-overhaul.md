# Story: Tutorial immersion overhaul (live mechanics + atmosphere cues)

**Type:** Onboarding/tutorial surface only (informative-only, no gameplay-rule change)  
**Status:** ready-for-dev  
**Date:** 2026-07-25  
**PM:** John  
**Extends:** ADR-0012 (optional scripted tutorial), ADR-0015 (device-forked tutorial), ADR-0020 (gesture channel), ADR-0055 (weapon crates/stock semantics), ADR-0053 + ADR-0059 (boss finale behavior)

## User value (WHY)

First-session players currently get control basics and some enemy literacy, but still miss critical live mechanics now shipped in-game: weapon crates + stock behavior and boss-finale cues/conditions. The result is avoidable confusion exactly when the run gets harder.  

This story upgrades tutorial clarity **without changing gameplay**: show what already exists, with stronger visual immersion and explicit “what to watch” cues.

## Scope (in)

Tutorial/onboarding surfaces only:

1. Tutorial script content/data (`TUTORIAL_NARRATIVE_DESKTOP` / `TUTORIAL_NARRATIVE_MOBILE`).
2. Tutorial visual teaching channels (image / gesture / diagram / optional tutorial backdrop treatment).
3. Related tutorial invariants/tests and tutorial manifest preload coverage.
4. No game mechanic changes; only explanatory/tutorial presentation changes.

## Non-goals (out)

- No new gameplay systems, balance, controls, damage rules, QTE logic, spawn logic, or boss tuning.
- No new unlock/progression behavior, no tutorial completion persistence, no score/progress writes.
- No changes to pre-level/post-level narrative scenes except shared helper refactors strictly required by tutorial work.
- No asset-generation pipeline expansion (FLUX/CI art generation) required for this story.

## Constraints / guardrails

- Keep core loop contract intact (`Récupérer → Livrer → Éviter`), tutorial remains a conscious extension (ADR-0012).  
- Preserve architecture boundary: tutorial data in `src/game/**`; rendering in `src/render/**` only.
- Keep device-correct control teaching:
  - desktop: mouse + edge-scroll.
  - mobile: two-finger tap and one-finger double-tap shoot, one-finger pan.
- Keep tutorial optional/skippable and storage-inert (no `muf_progress`, no score writes).
- Keep scope to onboarding surfaces only (no feature creep into live gameplay systems).

## Acceptance criteria (must implement)

### A) Live mechanics coverage now missing

**AC1 — Weapon crates are taught as live mechanics.**  
Tutorial includes an explicit panel (or equivalent replacement of an existing panel) teaching crate pickup truthfully: crates are interactive pickups, acquired by shooting them, and they swap active weapon.

**AC2 — Weapon stock/readout is taught as live mechanics.**  
Tutorial explicitly teaches HUD weapon readout semantics already shipped: active weapon indicator, finite stock for specials, base weapon `∞`, and auto-return cue when special stock empties.

**AC3 — Boss finale cues/conditions are taught truthfully.**  
Tutorial includes explicit boss-finale teaching cue(s): what telegraphs the duel, what player should watch (boss HP / danger windows), and that boss trigger is a level finale condition (as authored in live level data), without inventing new rules.

### B) Immersion visuals upgrade

**AC4 — Decor context is visibly stronger in tutorial panels.**  
Tutorial gains stronger location/threat context through existing visual channels (scene backdrop and/or richer panel visuals) while keeping copy readable and print-style constraints.

**AC5 — Active threat feeling is communicated visually.**  
At least one tutorial visual cue shows “active threat” timing/pressure (not just static prose), using existing render patterns (gesture/diagram/image channels).

**AC6 — Bullet/projectile teaching cue is added.**  
Tutorial includes a visual teaching cue for projectile/fireflow literacy (player shot vs incoming threat behavior) using code-drawn visual language or existing shipped art; no gameplay simulation added.

### C) Device-correct controls preserved

**AC7 — Desktop/mobile fork correctness remains enforced.**  
Control panels remain the only forked tutorial segment; desktop and mobile keep device-accurate copy and gesture mapping consistent with live controls.

**AC8 — Variant parity preserved.**  
Desktop/mobile variants keep equal panel count/progress-dot parity and shared segment reference invariants continue to pass.

### D) Optional/skippable and no progress write preserved

**AC9 — Tutorial behavior unchanged (optional + skippable).**  
Tutorial remains optional from menu and skippable at any point via existing path; completion still returns to menu.

**AC10 — No persistence side effects.**  
Tutorial path writes no progress and no high-score data; preview/tutorial harness behavior stays deterministic.

### E) Verification gates

**AC11 — Tests and quality checks updated and green.**  
`tutorialInvariants` and affected narrative/manifest tests are updated for new panels/cues and pass; `rtk tsc`, `rtk vitest`, `rtk lint` all green.

**AC12 — Visual verification captured on both device contexts.**  
Tutorial screenshots/proofs exist for desktop and mobile contexts (including new mechanics panels and immersion cues).

---

## Dev-ready implementation tasks

### Lane A — dev-gameplay (`src/game/**`, data + tests only)

- [ ] Update tutorial narrative data in `src/game/systems/narrativeSystem.ts`:
  - add/replace panels for crates, weapon stock/readout, boss finale cues/conditions.
  - keep desktop/mobile fork limited to control panels.
  - keep all tutorial lines truthful to shipped mechanics.
- [ ] If needed for new visual cues, extend `DiagramKind` / line data shape in a pure-data way only.
- [ ] Update tutorial invariants in `src/game/levels/__tests__/tutorialInvariants.test.ts`:
  - fork indices, shared-segment invariants, panel count parity.
  - device-accurate control copy assertions.
  - gesture/diagram/image exclusivity + alt-label coverage.
- [ ] Update `src/game/systems/__tests__/narrativeSystem.test.ts` for any new narrative invariants.
- [ ] Update tutorial preload expectations in `src/game/systems/assetManifest.ts` and `src/game/systems/__tests__/assetManifest.test.ts` if tutorial image/backdrop references change.

### Lane B — dev-r3f-render (`src/render/**` only)

- [ ] Implement required new tutorial visual cues in render tutorial channels:
  - extend `src/render/ui/DiagramIcon.tsx` and/or `src/render/ui/GestureIcon.tsx` for new cue kinds.
  - keep cues readable, motion-safe (`prefers-reduced-motion` + in-app reduced motion behavior).
- [ ] Adjust `src/render/ui/NarrativeScreen.tsx` / `.module.css` only as needed to support improved tutorial immersion visuals while preserving existing narrative flow behavior.
- [ ] Ensure no gameplay logic is introduced in render; consume tutorial data only.
- [ ] Keep `src/render/scene/App.tsx` tutorial branch behavior unchanged (optional/skippable, no persistence effects).

## File map (expected touch surface)

- `src/game/systems/narrativeSystem.ts`
- `src/game/levels/__tests__/tutorialInvariants.test.ts`
- `src/game/systems/__tests__/narrativeSystem.test.ts`
- `src/game/systems/assetManifest.ts` (if tutorial assets list changes)
- `src/game/systems/__tests__/assetManifest.test.ts` (if manifest expectations change)
- `src/render/ui/DiagramIcon.tsx` and/or `src/render/ui/GestureIcon.tsx`
- `src/render/ui/NarrativeScreen.tsx`
- `src/render/ui/NarrativeScreen.module.css` (only if needed)

## Done definition (story)

- All AC1–AC12 implemented.
- No gameplay-rule diff outside tutorial/onboarding surfaces.
- Device-fork correctness + optional/skippable/no-write guarantees preserved.
- Green checks: `rtk tsc`, `rtk vitest`, `rtk lint`.
