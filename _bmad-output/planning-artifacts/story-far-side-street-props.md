# Story: Far-side street props (bench + horodateur, camera-side kerb)

**Story ID:** STORY-FAR-SIDE-STREET-PROPS
**Type:** New render placement layer for existing décor art — no gameplay change.
**Status:** DRAFT — needs design loop (occlusion/readability is the central risk) +
architect lane assignment before any code
**PM:** John · **Date:** 2026-07-20 · **Branch context:** `claude/rue-propos-pipelines-revision-r4g52z`
**Origin:** Bertrand, verbatim (2026-07-20), re the front-view bench/horodateur variant
that was NOT used for the current near-foreground set: « Garde cette version pour le
mettre de l'autre coté de la route » — the discarded front-view renders were kept
(`public/assets/nearfg/{bench,parkingMeter}_front.png`) instead of deleted, specifically
so they could be reused on the OTHER side of the street.
**Scope guard:** PROJECT_GUIDELINES §1 (cahier des charges), §4 (boundary law) · ADR-0047
(near-foreground layer, non-occlusion iron rule + the trafficLight carve-out) · ADR-0049
(nearfg generated sprites) · `docs/handoffs/story-road-props-reference-revision.md`
(camera-orientation constraint this story must respect)
**Touches (anticipated):** likely a new render component mirroring
`src/render/scene/NearForeground.tsx` (or an extension of it) with a different parallax
factor + `renderOrder`; likely a `levelArt.json` data addition for which props go on
which side; possibly `src/render/scene/nearParallax.ts`. No confirmed `src/game` change —
flag if design finds otherwise. Needs BOTH `dev-r3f-render` and (if data-model shape
touches shared placement types) a cross-boundary check from `senior-architect` — this is
exactly the kind of change COLLABORATION.md flags as senior-architect's to hand off for
(more than one lane's surface touched).

## Why (product value)

The camera looks from the pavement across the street toward the facade, in strict
profile (the binding camera constraint logged in
`docs/handoffs/story-road-props-reference-revision.md`). Today's near-foreground props
(bench, horodateur, lamppost, etc.) all sit on the **facade-side kerb** — the far side,
same side as the building being shot at — because that's the only kerb currently
rendered. But a real Parisian street has furniture on **both** sides. Bertrand generated
front-view (not road-facing-side) variants of the bench and parking-meter sprites for
exactly this: props on the **camera-side kerb**, between the player and the street,
using the ALREADY-GENERATED `_front` variants (no new art-gen dependency for the MVP).
This reads as a fuller street and reuses art that would otherwise be thrown away —
cheap, additive atmosphere with a real design/occlusion question at its center (see
Central risk below), which is exactly why this needs the design loop before any
implementation.

## Cahier des charges test — verdict: CONSCIOUS, DOCUMENTED, JUSTIFIED EXTENSION (same family as ADR-0047)

> "Est-ce que Prohibition Atari ST avait ça ?"

- **A second row of street decor on the near/camera side — No**, same as the original
  near-foreground layer itself. ADR-0047 already established this whole décor-layer
  family as a conscious extension in service of the depth/Paper-Mario aesthetic; this
  story is an incremental widening of that SAME already-approved extension (a second
  placement row), not a new category of feature.
- **Zero gameplay change** is a hard requirement, not just a description: no new verb,
  input, rule, target, or scoring change. The props are decorative, exactly like the
  existing near-foreground layer.
- Justification is on record here and cross-references ADR-0047; if the new placement
  layer needs its own data/contract shape, that is architect's call whether it needs an
  ADR of its own or is documented as an ADR-0047 extension.

## Central design/UX risk — geometry MUST be clarified by the design gate, not assumed by PM

Bertrand's phrase is "de l'autre côté de la route" (the other side of the road). Two
readings exist and PM does NOT pick between them — this is exactly the question the
design loop must resolve:

1. **Camera-side kerb, between the street and the camera/player** — the props sit
   closer to the viewer than the roadway, meaning closer to camera than EVERYTHING else
   in the scene (facade, existing near-foreground, traffic). This is the most literal
   reading of "the other side of the road" given the profile camera (pavement → facade),
   and matches the reused front-view sprite orientation (a front view makes sense for
   something now facing the camera from the near kerb, whereas the current
   facade-side props are road-facing-side per the camera-orientation constraint).
2. **A row placed further back / across, mirrored on the same rendered plane region but
   still behind the roadway** — a less literal reading that would keep the layer behind
   existing traffic, avoiding the occlusion risk below, at the cost of not really being
   "the other side."

**PM's reading, for the design gate to confirm or override: (1), the camera-side kerb.**
This is the interpretation that matches "keep this version for the OTHER side" (the
front-view sprite orientation is the tell: it was shot facing the camera, which only
makes sense on the near kerb) and is the more interesting/valuable one product-wise
(genuine both-sides street fullness) — but it is also the one that creates the real risk
below, so the design gate must accept this reading with eyes open, not by default.

**The occlusion risk (if reading 1 is confirmed):** the existing near-foreground props
render at `renderOrder 4/5`, BELOW the courier (6) and delivery van (7) — deliberately,
per ADR-0047's finding #8, so décor never masks a `Livrer` target. A camera-side row, by
definition closer to the camera than the roadway, would need to render ABOVE the
traffic layer (`renderOrder` > 7) to be visually correct (nearer things draw over
farther things) — which means it CAN occlude the courier, the delivery van, or (if bench/
horodateur height is large enough) even facade windows/cops during a pan. This is the
opposite of ADR-0047's iron rule, and worse than the trafficLight carve-out (which only
risks masking a STATIC cop window, never a Livrer target, by construction — see ADR-0047
finding #8). A camera-side prop row has no such protection by default. **This is the
central design/UX question this story exists to raise, not resolve**: can placement,
sizing, and horizontal spacing keep camera-side props clear of the roadway's active
target lanes at every pan offset, the same way the iron rule proves it for the facade
side? If not by construction, some other mitigation (transparency on approach, a safe
horizontal band, hard exclusion zones) has to be designed — or the reading is wrong and
Bertrand meant something closer to option 2.

## Scope (framed, not decided by PM)

- **New render placement layer.** Likely mirrors `NearForeground.tsx`'s pattern (parent
  group repositioned by a parallax factor each frame, discrete plane objects, band
  confinement) but with its OWN parallax factor (camera-side objects should move
  differently from the facade-side layer — architect/design tune the exact value) and
  its own `renderOrder` (above traffic, per the risk above, pending the occlusion
  mitigation design).
- **Data model: which props, which side.** `levelArt.json`'s near-foreground placement
  data currently has no "side" concept — every placed object is implicitly facade-side.
  This story needs either a `side: "facade" | "camera"` field on placements, or a
  wholly separate placement list for the camera-side row. Architect's call which is
  cleaner; PM only requires it be data-driven (no hardcoded per-level camera-side
  arrays), consistent with the existing pattern (ADR-0047 decision #2).
- **Non-occlusion rules for the new row.** Per the Central risk above — this is THE
  design-gate deliverable, not an implementation detail. Whatever the mitigation, it
  must be provable the way the existing iron rule is (ADR-0047: "non-occlusion is
  verifiable by construction... a pure test asserts no object Y-extent enters the
  window rows... at any pan offset") — a camera-side equivalent test is expected.
- **Which props, for MVP.** Bertrand named bench + horodateur (parkingMeter) explicitly
  — the two kinds with a saved `_front` variant. MVP scope is these two only; other
  kinds are out of scope unless a future directive asks for `_front` variants of them
  too (see Out of scope).
- **Mobile density.** The existing near-foreground layer already halves density on
  mobile (drop every other instance by index parity, ADR-0047 decision #5). A
  camera-side row should follow the same convention by default — flagged for the design
  gate to confirm, especially given camera-side props are, by the occlusion risk above,
  more likely to need conservative placement on the smaller mobile viewport too.

## Acceptance Criteria (testable)

- **AC1 — geometry confirmed.** The design gate states explicitly which reading (camera-
  side kerb vs. the alternative) is being built, with Bertrand's confirmation if the
  gate cannot resolve it from the existing directive + camera-orientation doc alone.
- **AC2 — non-occlusion of gameplay-critical elements (HARD).** At every camera pan
  position, on every level carrying the new layer, the camera-side props never occlude
  the courier, the delivery van, any active cop window, or the crosshair. This must be
  provable the way the facade-side iron rule is (a unit test on band/placement geometry,
  per ADR-0047's non-occlusion test pattern) — not just "looked fine in one screenshot."
  If full non-occlusion cannot be guaranteed by construction, the story does not ship
  until the design gate has picked and validated a concrete mitigation.
- **AC3 — reuses existing art, no new gen dependency for MVP.** Bench + horodateur use
  the already-generated `_front` variants
  (`public/assets/nearfg/{bench,parkingMeter}_front.png`); no new Pollinations/CI
  generation is required to ship this story's MVP.
- **AC4 — data-driven placement.** Which props sit on which side is expressed in
  `levelArt.json` data, not hardcoded per-level logic, consistent with the existing
  near-foreground/ADR-0047 pattern.
- **AC5 — zero gameplay change.** No new verb, input, rule, target, or scoring change;
  `src/game` untouched unless the design/architect gate finds a concrete reason
  otherwise (flag it if so).
- **AC6 — boundary law holds (§4).** New render logic lives in `src/render`, consumes
  state via hooks; any pure placement/parallax math is `src/game` data/helper, no
  Three import there. Hooks stay the only bridge.
- **AC7 — mobile density addressed.** The design gate states the mobile density rule for
  the new row (default expectation: same halving convention as the existing layer,
  confirmed or overridden explicitly).
- **AC8 — verified + documented (DoD §9).** `rtk tsc` + `rtk vitest` + `rtk lint` clean;
  new non-occlusion logic unit-tested TDD-first; confirmed in-browser via `/verify` at
  edge and mid-pan on every affected level; ADR added/amended if the placement-layer
  contract changes (likely, given the data-model addition — architect's call whether
  this amends ADR-0047 or is its own ADR).

## Out of scope (explicit)

- **Any prop kind beyond bench + horodateur** for MVP — lamppost, trafficLight,
  wallaceFountain, bollard, scooter, streetSign stay facade-side only unless a future
  directive asks for `_front` (or otherwise camera-side-appropriate) variants.
- **New art generation** — this story ships with the already-saved `_front` PNGs only;
  regenerating/upscaling/re-prompting those sprites is a separate art-lane concern if
  ever needed.
- **Any change to the existing facade-side near-foreground layer** (ADR-0047) — its
  placements, parallax factor, and renderOrder stay exactly as shipped. This story adds
  a layer, it does not modify the existing one.
- **Any gameplay interaction** with the new row (collision, cover, targets) — pure decor,
  same as the existing layer.
- **Animated or lit camera-side props** — static art only for this story; the lamppost
  glow (see the sibling story `story-lamppost-lantern-glow.md`) is unrelated and out of
  scope here even if a lamppost is ever added to this row later.

## Open questions (for design + architect gates — not decided by PM)

1. **Which geometry reading is correct** (Central risk above) — needs Bertrand
   confirmation if the design gate can't resolve it unambiguously.
2. **Occlusion mitigation mechanism** if reading 1 is confirmed: hard exclusion band,
   transparency-on-approach, restricted horizontal placement, or something else.
   `game-designer` + `ux-designer` + `senior-architect`.
3. **Parallax factor + renderOrder value** for the new row — architect's call, tuned at
   the art/design gate like the existing layer's factor was.
4. **Data-model shape**: `side` field on existing placements vs. a separate placement
   list. Architect's call.
5. **ADR treatment**: amend ADR-0047 or open a new ADR for the second-row contract.
   Architect's call.

---

*Pipeline: DESIGN LOOP (`game-designer` + `ux-designer` MUST gate the occlusion
question — AC1/AC2 — before any implementation; `lead-game-designer` DESIGN GATE) →
`senior-architect` (geometry/data-model contract, lane partition across
`dev-r3f-render`/`dev-gameplay` if any pure logic is needed, ADR) → dev lane(s)
implement → VERIFY (`qa-lead` funnel incl. the non-occlusion test; composite/visual
check via `/verify` screenshots at edge and mid-pan) → code-review panel → PM acceptance
(AC1–AC8 + scope-OUT respected). This is explicitly NOT a fix-lane candidate — it
touches design (occlusion is a design question) and a new render placement
layer/data-model, i.e. more than one lane's surface. Devs implement only assigned,
scoped lanes; log every hand-off under `docs/handoffs/`.*
