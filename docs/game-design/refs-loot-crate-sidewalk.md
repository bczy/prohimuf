# Reference brief — LOOT crate, sidewalk placement

Advisory only (art-advisor / Estelle). No gate held. Grounds `concept-artist`'s FLUX
prompt for the wooden-crate revision (story-loot-crate-sidewalk, PR #115).

## 1. Period-correct "crate of gear" objects (1998 Paris free-party world)

- **Sound-system flight case** — the crew's own ATA-style road case (Spiral
  Tribe/Total Resistance lineage, `docs/references/art-culture.md` Spiral Tribe
  link): black ply, silver ball-corner protectors, recessed chrome latches,
  stencilled crew name + a routing number ("SYS 04", "TOP") on the lid in
  spray-through stencil. Reads as "professional rig gear", not domestic furniture —
  good for a weapon/ammo crate if you want the _sound-system_ register.
- **Wooden fruit/vegetable crate, marché parisien** — thin pine slat lattice,
  open sides, stapled corners, producer/region stamped in a single ink colour
  ("POMMES", a départment code). This is the _street_ register — found stacked
  outside a fermé shop or dumped on a trottoir, exactly the "sits on the
  sidewalk" placement Bertrand wants. See Wikimedia Commons
  [Category:Fruit crates](https://commons.wikimedia.org/wiki/Category:Fruit_crates)
  for the slat/stencil geometry (verify individual file licenses before any
  direct reuse — describe, don't trace).
- **Ammo-style wooden box, rope/rope-hole handles** — military-surplus crate
  (the puces/army-surplus aesthetic squats raided for furniture and props):
  dovetailed or nailed pine, a cut rope-loop or drilled hand-hole at each end,
  stencilled destination + lot number + a fragile/this-way-up pictogram.
  This is the closest visual cousin to "ammo crate" without going full
  US-military-cliché — keep it French/generic, not a labeled NATO box.
- **Beer crate** — caution: by 1998 French beer crates are mostly **injection
  plastic** (yellow Kronenbourg, red 33), not wood. Using a wooden beer crate
  reads as 1970s, not 1998 — if the beer-crate silhouette is wanted, it must be
  plastic with a printed (not carved) brand-style label, which drifts off the
  "hand-printed wood" register you actually want here. Recommend dropping this
  option in favour of the fruit crate or ammo box.
- **Stencil conventions to reuse on the glyph** (Paris/Anglo shipping-crate
  vocabulary, all period-correct and pre-digital): a **destination or crew
  code** (short, all-caps, single stencil font), a **fragile glass-and-crack
  pictogram** (never spelled "FRAGILE" in English on a French street object —
  use the pictogram or "FRAGILE" only if it's genuinely an import-look prop),
  a **lot/batch number** stencilled small in a corner, and a **directional
  arrow pair ("HAUT")** on the ammo-box register. Keep it to ONE stencil mark,
  not a label cluttered with three — the fanzine treatment wants one clean
  accent, not a busy crate.

## 2. Videogame precedents for readable pickup crates (side-view gallery)

- **Metal Slug — supply/POW crate** ([Metal Slug Wiki, Items](https://metalslug.fandom.com/wiki/Items)):
  a squat box, single bold icon baked on the lid (ammo/weapon/food glyph),
  outlined in a saturated colour that contrasts hard against the muted
  battlefield palette. The icon is legible at 1:1 sprite scale because it's
  the ONLY bright saturated mark in a ~6x6px lid area — everything else on the
  box (rivets, plank lines) stays low-contrast ink.
- **Wild Guns — pickup icons**: bright, simple, single-silhouette items that
  pop against the (comparatively busy) painted backdrop purely through hue
  isolation, not detail. The lesson for muf: a wooden crate covered in fine
  plank/nail detail will lose to the facade behind it unless ONE element
  (glyph or rim) is pushed to full saturation while the rest stays flat ink.
- **Cabal / Blood Bros — street props as cover/pickups**: props sit on the
  same ground plane and at the same scale discipline as the player-adjacent
  furniture (barrels, sandbags), so a new prop reads as "this world's
  furniture", not an alien HUD element. Directly useful here: the crate must
  share scale/ground-contact logic with whatever OTHER street objects muf
  already draws (vehicles at street level) — same baseline, same implied
  weight, not floating.
- **What makes them read in <0.3s, distilled**: (a) rectangular box silhouette
  is categorically distinct from any figure silhouette on sight — this is
  already true of muf's current placeholder and should be preserved; (b) ONE
  saturated accent (icon or rim), never the whole body; (c) the object sits
  ON a ground line, anchored, not floating mid-frame; (d) surface detail
  (planks, straps) stays low-contrast so it doesn't compete with the accent
  for the eye's first pass.

## 3. Fanzine B&W treatment — how the crate should print

- **Plank lines = thick black ink strokes**, not thin technical hairlines —
  think woodcut/linocut crate illustration, the same register as the existing
  placeholder's lid-band + diagonal cross-brace, but with visible **grain
  texture** (short parallel scratch-strokes along each plank, xerox-degraded)
  rather than a clean vector line. This is what will read as "real wood" over
  "code-drawn box" — texture reads as material, geometry alone does not.
  Reuse the shared style block already governing every FLUX sprite
  (`docs/art-direction.md` §3.4/§3.9): "photocopied 1990s punk fanzine
  illustration, rough black ink linework, high-contrast xerox toner texture,
  coarse halftone dots" — the crate gets NO bespoke treatment, it's one more
  object printed by the same run as the vehicles/enemies.
- **Halftone dot-screen on the shadowed face** sells the box's volume in a
  medium with no cast shadow (§3.8 forbids cast shadow) — a light halftone
  wash on the crate's "far" side/underside, same tool the level backdrops and
  menu paper already use, is enough to turn a flat rectangle into a solid
  object without breaking the flat-lighting rule.
- **The stencil glyph is the single accent**, per the crate's existing
  weapon-glyph baking (`src/render/scene/LootCrate.tsx`) — keep that pattern:
  everything on the crate stays pure ink EXCEPT the stencilled glyph/rim,
  which alone carries colour. Do not let the FLUX prompt introduce a second
  colour island (branded label, painted logo) — that would violate "family
  consistency" (§2 law 2) the same way a baked neon rim on a vehicle did
  (ADR-0011's lesson: let FLUX generate B&W, keep colour render-side or
  minimal-baked).
- **Where the neon accent belongs**: rim only, per "la loi du glow" (§2 law 1
  — "ce qui brille est interactif"). The current implementation already does
  this correctly (a baked falloff rim, lead-art-cleared at stage-5b). The open
  item is the **hue**, not the placement.

## 4. Hue recommendation (the open fast-follow from story-weapons-pickup)

Lead-art's ruling (`docs/handoffs/story-weapons-pickup.md` stage-5) already
flagged `#ffe600` yellow as off the in-world accent family AND colliding with
the reticle/control yellow. The four hex-anchored in-world accents
(`docs/art-direction.md` §2 law 1) are:

| Hex       | Name    | Already claimed by                                                                                                   |
| --------- | ------- | -------------------------------------------------------------------------------------------------------------------- |
| `#FF8C14` | orange  | delivery **truck** (`levelArt.json`) + the enemy heat-rim's late/danger stage of its green→orange→red telegraph ramp |
| `#28F0FF` | cyan    | delivery **car** (Twingo)                                                                                            |
| `#FF3CDC` | magenta | delivery **moto** — also the vehicle-sprite chroma-key background hue in the FLUX pipeline                           |
| `#78FF3C` | green   | the enemy heat-rim's _early/safe_ telegraph stage (dynamic, not a fixed object identity)                             |

**Recommendation: `#78FF3C` (green).** Reasoning:

- The crate now lives at **street level, alongside the delivery vehicles**
  (car/truck/moto — cyan/orange/magenta respectively). Of the four hues,
  green is the only one with no fixed street-level object identity, so it
  stays maximally distinct from every other object sharing that same ground
  plane and screen band — the <0.3s silhouette/hue read this brief keeps
  citing depends on that separation.
- Orange is doubly booked (truck AND the enemy danger-ramp's end state) —
  picking it for loot risks a pickup reading as "this enemy is about to fire"
  at a glance, exactly the kind of triage collision the design gate (B6/R4 in
  `weapons.md`) was careful to rule out.
- Magenta is also the FLUX chroma-key background colour for the whole vehicle
  set — no runtime collision, but an odd echo to build a _hero_ colour on top
  of a _keying_ colour; avoid it if there's a clean alternative, and there is.
- Culturally, green also carries the right connotation for a pickup: on
  period free-party flyers and in the muf print system itself
  (`mark-green` = FACILE, "go"), green already reads as "safe/positive/go" —
  a loot crate is the one friendly interactive object in the window row, so
  the semantic fits better than it would on orange (danger) or magenta
  (delivery-vehicle-specific).
- Watch-out to flag, not a blocker: the enemy heat-rim ramp _starts_ green
  (safe/early telegraph) before shifting orange/red. A green loot crate
  sitting near a freshly-spawned (still-green) enemy is a minor same-hue
  co-occurrence. It's a different shape (box vs. figure) and a different
  z-layer (street vs. window), so the silhouette law should carry it, but
  `lead-art`/`game-graphist` should sanity-check a same-frame screenshot with
  both on screen before calling it closed.

If green is rejected for some reason at the gate, cyan is the fallback
(second-most-free hue — only claimed by one vehicle, not by the enemy ramp
at all) — but green is the stronger recommendation on both readability and
period-connotation grounds.

## 5. Reference pointers to anchor `concept-artist`'s prompt

1. Wikimedia Commons [Category:Fruit crates](https://commons.wikimedia.org/wiki/Category:Fruit_crates) —
   slat/stencil geometry of a real wooden market crate (verify per-file
   license before any direct reuse; describe, don't trace, same rule as every
   other §3 Commons reference in `LICENSES.md`).
2. Metal Slug supply/POW crate ([Metal Slug Wiki, Items](https://metalslug.fandom.com/wiki/Items)) —
   the single-bold-icon-on-lid precedent for the glyph-before-fire legibility
   requirement (W1 in `weapons.md`).
3. Spiral Tribe / free-party sound-system visual identity
   (`docs/references/art-culture.md`, already banked) — the flight-case
   register if the crew prefers a "rig gear" read over "market crate" for the
   crate's cultural frame; stencilled crew-code lettering lives here too.
4. `docs/art-direction/references/LICENSES.md` §2 (xerox-fanzine sources) —
   reuse verbatim for the plank-grain/halftone treatment; no new links needed,
   this family is already curated.
5. Existing implementation for the accent-placement contract:
   `src/render/scene/LootCrate.tsx` (the baked falloff-rim technique
   lead-art already cleared at stage-5b) — the new FLUX sprite should replace
   the code-drawn body while the render-side/baked rim contract stays as-is,
   just re-hued to `#78FF3C`.
