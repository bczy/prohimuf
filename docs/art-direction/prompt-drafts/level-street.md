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

**Final prompt** (seed committed: 3303 — PIN it, see reroll risk below):

```
flat overhead top-down view of a very dark wet parisian asphalt road surface seen
straight from directly above, near-black bitumen colour #0E1418 filling the whole
frame edge to edge, low-key dim night lighting deep in shadow, smooth fine grain
with only a few sparse faint reflections, a faded white pedestrian crossing of
several evenly spaced parallel horizontal white zebra stripes painted flat across
the road near the top, flat level ground plane, no horizon
```

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
- `a faded white pedestrian crossing of several evenly spaced parallel horizontal white
  zebra stripes … near the top` → the requested marking; "horizontal" + "near the top"
  place the crossing inside the ~37–51% band the QTE actually reveals (stripes parallel
  to the road = geometrically correct for a crossing over the facade-parallel street).
- `flat level ground plane, no horizon` → reinforces the overhead read (the sole
  negation, within the ≤2 bible budget).

**Reroll risk (lead-art watch-item).** `gen-level-art.mjs` picks a RANDOM seed; the
edge rooftops FLUX leaves at ~0–8% / 92–100% of the frame are only harmless because
they crop OUTSIDE the QTE-visible band at seed 3303. A different seed can land a
building row inside the band and reintroduce the "miroir de l'immeuble" failure — so
regenerate this backdrop ONLY with the pinned seed, never a random reroll.

**Rejected variants** (all re-composited under the real facade at QTE framing):

- Batch A (`bitume_81xx`, "matte deep blue-grey"): correct overhead texture, but too
  LIGHT/bright — a busy teal speckle field that read as a separate lighter band with a
  hard seam under the facade's near-black strip. → pushed darker/low-key (one variable).
- Dashed-line dark version (`dark_9204`): PASSED the lead-art gate, but Bertrand asked
  for a passage piéton instead → swapped the marking clause only (dashed line → zebra
  crossing) and folded in the gate's hex-anchor note in the same pass.
- Early full-scene neon roads (`road_*`, `final_*`): clean roads but saturated
  neon-noir, wrong palette, occasional corner buildings — rejected on integration.

Verification: composited `facade.png` + candidate `street.png` at the exact world
geometry (facade `y∈[-6,6]`, street plane centre `y=-7.44` h`10.8`, ×2.4 zoom on the
`(0,-5)` anchor) and screenshot at QTE framing to judge the seam. Lint: `node
scripts/check-art-prompts.mjs` → PASS.
