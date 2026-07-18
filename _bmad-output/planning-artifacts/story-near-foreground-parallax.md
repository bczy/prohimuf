# Story: Near-foreground differential parallax layer

**Story ID:** STORY-NEAR-FOREGROUND-PARALLAX
**Type:** Render-side depth treatment (conscious documented extension — reinforces the
established Paper Mario depth aesthetic). No new verb, input, rule, target, or scoring change.
**PM:** John · **Date:** 2026-07-17 · **Status:** DRAFT — proposal for Bertrand's validation (no code yet)
**Origin:** Bertrand — "a near-foreground layer that scrolls FASTER than the facade when the
camera pans, to sell depth/proximity."
**Scope guard:** PROJECT_GUIDELINES §1 (cahier des charges), §4 (boundary law), §5 (Paper Mario
depth rules) · README (fanzine 2D-in-3D)
**Touches (anticipated):** `src/render/scene/LevelBackdrop.tsx` (new near layer), one config
field in `src/game/levels/levelArt.json` (per-level parallax), possibly a pure parallax helper +
reduced-motion read. Exact partition is `senior-architect`'s call.

## Why (product value)

The game reads as a free-party flyer that came alive — flat sprites in a shallow 3D world. Today
the only depth cue on pan is the near-static sky (parallax 0.88–0.92); everything else moves at
world rate. A layer that sweeps **faster than the facade** — a street-level foreground gliding past
the player as the camera pans the block — adds the one missing depth register: *proximity*. It makes
the street feel like a physical place you are moving through, not a painted backdrop. It costs the
player nothing (no new input, no rule, no target) and directly serves the house depth aesthetic
(§5: "effets de profondeur via inclinaison des plans", "quartiers qui se déplient comme des pages
pop-up"). Smallest thing that validates the bet: **one near-foreground band, one level, confined to
a zone that can never touch a target.**

## Cahier des charges test — verdict: CONSCIOUS, DOCUMENTED, JUSTIFIED EXTENSION

> "Est-ce que Prohibition Atari ST avait ça ?"

- **Differential foreground parallax — No.** Prohibition (Atari ST, 1987) was a flat shooting
  gallery with a static facade and no parallax. So per §1 this is a conscious extension — and it is
  justified: it is **pure presentation in service of the already-approved depth language** (§5 Paper
  Mario rules explicitly endorse depth-via-plane effects). It adds zero to the verb set.
- **No change** to the core loop (`Récupérer → Livrer → Éviter`), the shooting-gallery win/lose
  condition, inputs, scoring, enemy spawn rules, timing, or the crosshair→world hit contract. Net
  gameplay surface is unchanged; only a decorative render layer is added.
- Justification lives in this story and (per CLAUDE.md ADR rule) in the ADR any layer/parallax
  contract change will carry.

## Decisions (PM rulings — fixed for this story)

### 1. MVP = ONE data-driven near-foreground band per level, static art, confined to a safe zone

- **One near-foreground layer, not a system of many independent parallax objects.** A single
  horizontal band (e.g. street-level silhouettes: railings/bollards/parked-vehicle/crowd shapes)
  tiled across the street, rendered in front of the facade, scrolling at a differential rate. This
  is the smallest thing that answers "does near-foreground parallax make muf feel deeper?"
- **Data-driven, per level, in `levelArt.json`** — the single source of truth already holds
  `parallax { sky, facade, street }` per level; extend it (near-foreground factor + which art) so
  factors are never hardcoded. Every level participates or opts out via data.
- **Static sprite for MVP — the parallax scroll IS the motion.** No per-object animation, no
  spawning entities, no gameplay interaction.
- **Reuse-vs-new-art is deferred to the art/architect gate.** Reusing an existing foreground asset
  is cheapest; a dedicated street-level silhouette may read better. Either way the differential
  layer is **separate from the window ironwork** (see ruling #2) — the window railings must stay
  registered to the facade and must never sweep across a cop.

### 2. Non-occlusion is a HARD constraint, not an AC to tune (mirrors CRT AC4 / UX §5)

The near-foreground sits closer to camera than the facade (higher z), so it *can* cover a cop. It
must not. The layer is **spatially confined to a per-level safe band that never overlaps that
level's cop spawn zones** (`windowGrid` / `windows`). Practically: anchor it to the bottom street
strip and/or screen-edge columns, below the lowest window row.

- **Per-level caveat (flagged):** the safe band is *not uniform*. Belliard/Stalingrad windows bottom
  out at ~0.48–0.52 (plenty of bottom band). **Vitry is a 4-row grid reaching `bottom` 0.82** —
  almost no bottom strip. Vitry must either use a very shallow street strip below 0.82, use edge
  columns, or opt out entirely via data. This must be verified per level, Vitry included.

### 3. Reduced-motion is required, not optional (accessibility)

A layer moving *faster than the whole world* is exactly the motion that triggers vestibular
discomfort. When reduced-motion is requested (OS `prefers-reduced-motion` and/or the project prefs),
the differential parallax is **disabled or clamped to ≤ facade rate** — no faster-than-world sweep.
Mechanism (media query vs a `prefs` field like the CRT toggle) is architect's call; the behaviour is
non-negotiable.

### 4. Parallax factor sign/convention — flagged for the architect, not prescribed by PM

Today `layer.x = camera.x * factor`, so on-screen travel ∝ `(factor − 1)`; the facade (factor 0)
moves at effective 1×. A near layer that moves *faster than the facade in the same on-screen
direction* needs an **effective magnitude > 1** — i.e. a factor outside `[0,1]` (negative, or > 2).
PM does not prescribe the exact value; the requirement is "visibly faster than the facade, tuned by
the art gate." Architect owns the sign convention and the field shape in `levelArt.json`.

## Acceptance Criteria (testable)

- **AC1 — differential depth is visible.** On camera pan, the near-foreground layer scrolls at an
  effective on-screen speed **greater than the facade's** (magnitude > 1×), producing a clear
  proximity cue. Verified on screen via `/verify` with pan before/after screenshots at several
  camera x positions.
- **AC2 — non-occlusion of targets (HARD).** At **every** camera position, on **all three levels
  including Vitry's 4-row grid**, the near-foreground never overlaps any cop spawn zone: every target
  stays fully visible and clickable, and the crosshair→world hit mapping is byte-unchanged (shots
  land exactly as before). The layer stays inside the per-level safe band (ruling #2). This is a
  blocking criterion — any overlap fails the story.
- **AC3 — reduced-motion respected.** With reduced-motion requested, the differential parallax is
  disabled or clamped to ≤ facade rate (no faster-than-world motion). Verified in both states.
- **AC4 — data-driven, single source of truth.** Per-level near-foreground config lives in
  `levelArt.json` alongside `parallax`; no hardcoded factors; a level can opt out via data. Consistent
  with the existing sky/facade/street model.
- **AC5 — boundary law holds (§4).** The layer renders in `src/render` reading state via hooks; any
  parallax math that is pure is data/helper in `src/game` (no Three import); rendering holds no game
  rule. Hooks stay the only bridge.
- **AC6 — verified + documented (DoD §9).** `rtk tsc` + `rtk vitest` + `rtk lint` clean; new pure
  logic unit-tested TDD-first; confirmed in-browser via `/verify` at edge and mid pan on every level;
  an ADR is added if the layer/parallax contract changes; this scope-guard justification is recorded.

## Out of scope (explicit)

- **Multiple near-foreground depths / a system of many independent parallax objects** — one band only.
- **Animated props** (passing car, walking crowd, blowing trash) — static art for MVP; parallax scroll
  is the only motion. Follow-up.
- **Any gameplay interaction** with the near-foreground (collision, cover, targets in front) — it is
  pure decor.
- **Any `src/game` change beyond parallax data + a pure factor helper** — no effect on hit detection,
  timing, scoring, enemy spawn/visibility, or the crosshair contract.
- **New art-generation pipeline work** beyond, at most, one street-level silhouette asset the art gate
  approves — reuse first.
- **Touching the window ironwork layer** — it stays registered to the facade; the differential layer
  is separate.

## Open questions (for the design + art + architect gates — not decided by PM)

1. **Reuse an existing foreground asset, or one new street-level silhouette?** Art/architect own it
   (ruling #1).
2. **Exact parallax factor + field shape in `levelArt.json`** — architect owns the sign convention and
   the tuned value (ruling #4); art gate tunes the felt speed.
3. **Vitry policy** — shallow street strip below 0.82, edge columns, or opt out? Design + art decide
   against the safe-zone check (ruling #2 caveat).
4. **Reduced-motion mechanism** — OS media query vs a `prefs` field (like `crt`) — architect owns.

---

*Pipeline: DESIGN LOOP (`game-designer` depth/feel + non-occlusion feasibility, `ux-designer`
reduced-motion + readability, gate on Vitry policy) → `senior-architect` (layer/parallax contract,
factor convention, `levelArt.json` field, ADR, lane partition) → render lane implements the layer +
config → QA (`qa-lead`: pure parallax/reduced-motion unit tests, shooting-smoke e2e unaffected,
composite gate incl. non-occlusion at edges on all 3 levels, `gpu-specialist` if the extra plane is
perf-sensitive) → code-review panel → PM acceptance (AC1–AC6 + scope-OUT respected). Devs implement
only assigned, scoped lanes; log every hand-off under `docs/handoffs/`.*
