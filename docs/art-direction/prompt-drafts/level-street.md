# Prompt drafts — level `street` layer (Maud, concept-artist)

Craft rules per [`flux-prompt`](../../../.claude/skills/flux-prompt/SKILL.md); nothing
reaches `levelArt.json` without the `lead-art` PROMPT GATE.

## belliard — `street` (road under the hostage-QTE)

**Why it changed.** The `street` plane is world-locked BEHIND the opaque facade and
is only ever visible during the hostage QTE, in the ~1.5-world-unit band directly
below the facade's ground line (`y=-6`) that the ×2.4 cinematic zoom exposes. The old
prompt (`"parisian night sidewalk and cobblestone street, wet asphalt reflections,
neon glow, gutter, street level horizontal strip"`) yielded a full perspective street
SCENE — background buildings + saturated magenta/cyan neon — so under the facade it
read as a mirrored building, not a road, and clashed with the facade's muted blue-grey
dusk palette (Bertrand: _"on dirait un miroir de l'immeuble… tout sauf une route"_).

**Requirement.** Bitumen/pavés directly — a FLAT overhead road TEXTURE that fills the
strip and ends at the bottom (no horizon, no vanishing point). Marking: a **passage
piéton** (Bertrand: _"it lacks of passage piéton"_) — a faded zebra crossing; nothing
else. Muted, DARK, matched to the facade's near-black ground strip so the two are
continuous.

**Final prompt** (seed committed: 6601 — PIN it, see reroll risk below):

```
flat overhead top-down view of a very dark wet parisian asphalt road surface seen
straight from directly above, near-black bitumen colour #0E1418 filling the whole
frame edge to edge, low-key dim night lighting deep in shadow, smooth fine grain
with only a few sparse faint reflections, a full-width pedestrian crossing of
several bold horizontal white zebra stripes each spanning the entire width from the
far left edge to the far right edge of the frame, evenly stacked and covering the
whole road, flat level ground plane, no horizon
```

**Committed asset = seed 6601 + a 15% width inset (post retouch).** Bertrand's final
call: the crossing must be a touch narrower — it should NOT reach the kerbs. FLUX cannot
dial width to the percent, so the full-width seed-6601 generation is trimmed in post: the
outer 7.5% on each side is repainted with the image's own sampled dark-asphalt tone
(mean of the dark bluish pixels) + grain, giving asphalt shoulders and a crossing ~85%
of the road width. Deterministic scripted retouch (repo precedent: `scripts/retouch-*.mjs`);
the FLUX prompt above intentionally still describes the full-width generation. Re-composited
under the facade at QTE framing to confirm the shoulders read as asphalt, not a seam.

Rationale (clause → the failure it locks down):

- `flat overhead top-down view … seen straight from directly above` → kills the
  perspective SCENE FLUX builds from "street" (vanishing point + background buildings).
- `near-black bitumen colour #0E1418 filling the whole frame edge to edge` → value
  HEX-ANCHORED (per the lead-art gate; §3.5 "'dark' alone does nothing") so the surface
  sits at the facade's near-black ground value and the QTE seam is continuous; "filling
  edge to edge" prevents a framed vignette.
- `low-key dim night lighting deep in shadow … only a few sparse faint reflections` →
  counters the shared `style` tail's "warm orange + magenta cyan neon accents" that
  otherwise brightens the surface into a lighter, busier band than the facade base.
- `a full-width pedestrian crossing of several bold horizontal white zebra stripes each
spanning the entire width from the far left edge to the far right edge … covering the
  whole road` → the requested marking, final form. Bertrand's call after two in-game
  looks: the bars run HORIZONTAL and, crucially, span the FULL WIDTH of the road edge to
  edge — the crossing must not stop mid-road as the earlier centred blocks did. "each
  spanning the entire width … far left edge to far right edge" is the load-bearing clause
  that stops FLUX centring the marking into a floating patch.
- `flat level ground plane, no horizon` → reinforces the overhead read (the sole
  negation, within the ≤2 bible budget).

**Reroll risk (lead-art watch-item).** `gen-level-art.mjs` picks a RANDOM seed; the
edge rooftops FLUX leaves at ~0–8% / 92–100% of the frame are only harmless because
they crop OUTSIDE the QTE-visible band at seed 6601. A different seed can land a
building row inside the band and reintroduce the "miroir de l'immeuble" failure — so
regenerate this backdrop ONLY with the pinned seed, never a random reroll.

---

## belliard — `street` iteration: near-side trottoir (ADR-0046, v2 §4)

**Why it changed.** ADR-0046 (tronçon-sequence backdrop) bakes the FAR-side trottoir
into each tronçon PNG, but the **near-side** trottoir — the pavement strip nearest the
camera, in front of the roadway — was never part of any layer; the `street` plane was
bitumen + crossing only. `docs/art-direction/prompt-drafts/level-belliard-decor-v2.md`
§4 calls for a single-clause addition here: a narrow foreground pavement band, kept
**visibly narrower than the roadway** so it reads as a kerb-edge sidewalk sliver, not a
second lane.

**Single-clause addition** (appended verbatim to the committed prompt's tail, per v2 §4
— the overhead-road spine and the zebra-crossing marking are untouched, one variable
only):

```
flat overhead top-down view of a very dark wet parisian asphalt road surface seen
straight from directly above, near-black bitumen colour #0E1418 filling the whole
frame edge to edge, low-key dim night lighting deep in shadow, smooth fine grain
with only a few sparse faint reflections, a full-width pedestrian crossing of
several bold horizontal white zebra stripes each spanning the entire width from the
far left edge to the far right edge of the frame, evenly stacked and covering the
whole road, flat level ground plane, no horizon, a narrow worn granite-kerbed stone
pavement strip running along the bottom foreground edge, clearly narrower than the
roadway above it
```

Rationale for the added clause:

- `a narrow worn granite-kerbed stone pavement strip running along the bottom
foreground edge` → the requested near-side trottoir: kerb stone, not more asphalt,
  anchored to the frame's bottom edge (the camera-near side of the QTE cross-section).
- `clearly narrower than the roadway above it` → the load-bearing negation-adjacent
  clause (v2 §4's own call-out): without an explicit width contrast FLUX tends to give
  a pavement band comparable in width to the road itself, which reads as a second lane
  rather than a kerb-edge sidewalk — the exact axis-3 risk the v2 board flags.

**Seed re-pin: 6601 → 6602.** The prompt changed (one clause added), so the FLUX
generation for it is a different image regardless of seed; keeping seed 6601 pinned
against a changed prompt would still be re-rolling composition, only silently. Per the
reroll-risk watch-item above (edge rooftops must crop OUTSIDE the QTE-visible band),
**6602 is not yet a validated pin** — it is the next sequential draw in this prompt's
seed lineage (6601 → 6602), picked so the two remain traceable as the same family/
iteration rather than an unrelated random number. It must clear the same composite-gate
check as 6601 did (composited under `facade.png`/the tronçon sequence at QTE framing,
confirming both the zebra crossing AND the new near-side trottoir band read correctly
and no rooftop/building edge lands inside the visible band) before the `--force`
regeneration in CI treats it as canonical. The post-generation 15% width inset retouch
(crossing narrowing, unchanged from the committed-asset note above) still applies
identically regardless of which seed is pinned.

**Rejected variants** (all re-composited under the real facade at QTE framing):

- Batch A (`bitume_81xx`, "matte deep blue-grey"): correct overhead texture, but too
  LIGHT/bright — a busy teal speckle field that read as a separate lighter band with a
  hard seam under the facade's near-black strip. → pushed darker/low-key (one variable).
- Dashed-line dark version (`dark_9204`): PASSED the lead-art gate, but Bertrand asked
  for a passage piéton instead → swapped the marking clause only (dashed line → zebra
  crossing) and folded in the gate's hex-anchor note in the same pass.
- Horizontal centred crossing (`pp_3303`, merged in #80): correct crossing but a centred
  block that stopped mid-road.
- Vertical crossing (`vpp_5502`, PR #83 draft): bars turned vertical, but Bertrand then
  clarified he wants HORIZONTAL bars spanning the FULL road width (the crossing must not
  stop in the middle) → final clause `each spanning the entire width … far left to far
right edge`, committed as seed 6601.
- Early full-scene neon roads (`road_*`, `final_*`): clean roads but saturated
  neon-noir, wrong palette, occasional corner buildings — rejected on integration.

Verification: composited `facade.png` + candidate `street.png` at the exact world
geometry (facade `y∈[-6,6]`, street plane centre `y=-7.44` h`10.8`, ×2.4 zoom on the
`(0,-5)` anchor) and screenshot at QTE framing to judge the seam. Lint: `node
scripts/check-art-prompts.mjs` → PASS.
