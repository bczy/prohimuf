# Prompt drafts — road props (gptimage remake, ADR-0047/0049)

Author: `concept-artist` (Maud). Status: **DRAFT for `game-graphist` preprod + `lead-art`
gate.** Covers the 8 `NearForegroundKind` props migrated from procedural Canvas2D to
GENERATED art via the gptimage pipeline (`scripts/gen-gptimage-asset.mjs` →
`gen-nearfg-sprites.mjs`, tech plan `docs/handoffs/tech-plan-road-props.md`).

Method: `flux-prompt` craft discipline adapted to **gptimage** — silhouette-first,
positive description (say what IS there, never "not a sedan"), colour + orientation carried
as render metadata not baked in the subject. gptimage is more instruction-adherent than
FLUX and can actually render legible text, so the no-text clauses are stated hard and
twice (opening/tail + per-prop "blank"). Assembled prompt = `opening` + per-kind `prompt` +
`style`.

Traits + anachronism traps per prop come verbatim from
`docs/art/references-road-props.md` (art-advisor, 2026-07-19) and, for the feu, from
`docs/art-direction/references/boards/board-traffic-light.md` (CURATED, Bertrand
2026-07-18). Every prop renders **strictly grey / B&W** (art law C1): colour is out of
scope here except the traffic light's lit lens, which is a **render-side overlay** and is
NOT part of the generated housing.

---

## Shared `opening`

```
Flat 2D video game sprite, strict side-view orthographic projection, a single piece of 1998 Parisian street furniture at street level,
```

- `strict side-view orthographic projection` → the house side-scroller camera (mirrors
  `vehicles.opening`); every prop lines the kerb and is read from its side.
- `single piece of … street furniture` → forces one object, kills incidental scene props.
- `1998 Parisian` → period + place anchor at the top so the model biases pre-2000 hardware
  before it reads the silhouette (the anachronism traps all live post-2000).

## Shared props `style` tail

```
, clean bold comic book ink illustration, three-tone cel shading in grey black and white, thick clean black outline, flat evenly filled shapes, strictly monochrome greyscale with no colour, the single object fully visible and centered, floating isolated on a perfectly flat solid uniform bright magenta #FF3CDC background, empty flat magenta backdrop, no ground, no floor, no cast shadow, no drop shadow, no people, no text, no letters, no numbers, no logo, no writing, no signature, single object only
```

- `clean bold comic book ink illustration, three-tone cel shading … thick clean black
outline, flat evenly filled shapes` → the shipped house look (enemies/vehicles/courier/
  hostage), so the near-fg layer reads as one family — this is the PROPS variant of the
  harness `FIGURE_TAIL` (figure clauses swapped for object clauses).
- `strictly monochrome greyscale with no colour` → art law C1; the harness luma-desaturates
  anyway, but stating it keeps the model from wasting detail on colour and satisfies the CI
  grey/C1 style gate.
- `floating isolated on … bright magenta #FF3CDC background … no ground, no floor, no cast
shadow, no drop shadow` → the chroma ground the flood-fill key expects; killing the shadow
  at source avoids a post-matte halo.
- `no people` → props stand alone (critical: no pedestrian appears on the bench / at the
  pay station).
- `no text, no letters, no numbers, no logo, no writing, no signature` → hard text kill;
  gptimage WILL letter a screen or a plate if unchecked. Reinforced per-prop for the pay
  station (blank screen) and the street plaque (blank plate).
- `single object only` → last-word reinforcement against a duplicated/second unit.

---

## 1. parkingMeter — horodateur (aspect 0.5, 256×512, seed 6101)

```
a 1990s Parisian pay-and-display parking machine standing tall: a slim steel pole clearly much thinner than the head, topped by a bulky rectangular boxy head whose whole top face is a single steeply slanted rain-cap wedge; on the head's road-facing front a small dark blank recessed rectangular screen with nothing on it, a wide horizontal coin slot below it, a low ticket-delivery slot near the bottom, and a few horizontal ventilation grooves; angular sheet-metal casing, hard straight edges, distinctly taller than it is wide
```

- `slim steel pole clearly much thinner than the head` → ref trait 1; without the strong
  mast/head ratio the silhouette reads as a bollard.
- `whole top face is a single steeply slanted rain-cap wedge` → the "casquette solaire",
  ref trait 2 — THE identifier, and it rules out a flat-top modern terminal.
- `small dark blank recessed rectangular screen with nothing on it` → the mono LCD is
  present but blank (hard no-text) — anti Flowbird colour touchscreen.
- `wide horizontal coin slot … ticket-delivery slot … ventilation grooves` → ref trait 3,
  the mechanical/electronic Schlumberger tell; the coin slot is exactly what the 2010s
  Flowbird (anachronism #1) lacks.
- `angular sheet-metal casing, hard straight edges` → ref trait 4 (box, never round) and
  anti the rounded anthracite Flowbird shell.

## 2. lamppost — réverbère col-de-cygne (aspect 0.5, 256×512, seed 6102)

```
a tall cast-iron Haussmann-era Parisian street lamp: a fluted base flaring out at the foot, a slender fluted shaft tapering as it rises, a single curved S-shaped swan-neck arm sweeping outward near the very top, ending in a faceted many-sided polygonal lantern with a small pointed cap; ornamental antique cast-iron, elegant and slender, dark uniform painted finish
```

- `fluted base flaring at the foot … slender shaft tapering as it rises` → ref trait 1.
- `single curved S-shaped swan-neck arm near the top` → the col-de-cygne, ref trait 2, the
  primary identifier.
- `faceted many-sided polygonal lantern with a pointed cap` → ref trait 3; explicitly NOT a
  round globe and NOT a flat LED panel.
- `ornamental antique cast-iron … dark uniform painted finish` → ref trait 4 + trap: rules
  out the 2000s aluminium "cobra head" (straight mast, flat rectangular head, bright brushed
  metal).

## 3. wallaceFountain — fontaine Wallace (aspect 0.55, 282×512, seed 6103)

```
a Wallace drinking fountain, a compact cast-iron monument: an octagonal pedestal at the base, four slender caryatid women standing back-to-back in a ring around the centre, their raised arms supporting a domed pointed cap studded with small dolphin ornaments; the silhouette pinched narrow at the base, widest at mid-height where the four figures stand, then tapering up to the pointed dome; modest and squat, clearly wider and lower than a street lamp, dark uniform patinated finish
```

- `four slender caryatid women … in a ring around the centre` on an `octagonal pedestal` →
  the iconic "grande à 4 cariatides", ref trait 1 — never a single column.
- `domed pointed cap studded with small dolphin ornaments` → ref trait 2, not a flat dome.
- `pinched at the base, widest at mid-height, tapering to the pointed dome` → the hourglass
  profile, ref trait 3, that separates it from a plain cylinder.
- `modest and squat, clearly wider and lower than a street lamp` → ref trait 4 scale; stops
  it reading as a bollard or a tall column.

## 4. trafficLight — feu tricolore, DEAD housing only (aspect 0.44, 226×512, seed 6104)

The generated art is the **unlit housing** — mast + heads + dark dead lenses, in the
house grey. The lit coloured lens + halo and the pedestrian pictograms are a **render-side
overlay** (§ lens-anchor sketch below), never baked here.

```
a French road traffic signal on a slim round mast with a splayed foot, seen from the side at street level. High on the mast a tall boxy vehicle signal head turned in strict side profile: three round lenses stacked vertically, each tucked under a curved tunnel hood-visor that juts sideways toward the road, the lens discs seen edge-on as narrow dark slivers, all dead and unlit. Lower down a smaller pedestrian signal head turned to face the viewer head-on: two blank dark round lens windows stacked vertically, both dead and unlit. Both heads cantilevered from the mast on short brackets. Every lens dark, matte and switched off, no glow and no colour; boxy hooded metal housings, dark uniform finish
```

- `strict side profile … hood-visor juts sideways toward the road, lens discs seen edge-on
as narrow dark slivers` → the load-bearing geometry (board Axis 1/3): the vehicle head is
  a directional shield, so from the kerb we see its side, not the lens faces.
- `three round lenses … each under a curved tunnel hood-visor` → the pre-LED casquette
  silhouette (ref trait); rules out the 2000s+ flat-LED slimline retrofit.
- `smaller pedestrian signal head turned to face the viewer head-on: two blank dark round
lens windows` → the second head at 90° (board Axis 2), face-on and legible-sized, but
  BLANK (pictograms are the render overlay, not baked).
- `Every lens dark, matte and switched off, no glow and no colour` → the dead-housing
  requirement; the lit lens is composited render-side. Positively describes "unlit" so the
  model doesn't helpfully light one up.
- `slim round mast with a splayed foot` → ref trait 3.

### trafficLight lens-anchor sketch (normalized [0..1] over the 226×512 texture, y-down)

Approximate positions for the render lane's overlay; **to be tuned at the gate** against the
real PNG (seeded from the current procedural geometry in `drawTrafficLight`).

| lens       | role           | x    | y    | rx   | ry    | note                                                                        |
| ---------- | -------------- | ---- | ---- | ---- | ----- | --------------------------------------------------------------------------- |
| vehicle[0] | red (top)      | 0.29 | 0.10 | 0.11 | 0.035 | flat foreshortened ellipse — edge-on lens at the hood lip, road (left) side |
| vehicle[1] | amber (mid)    | 0.29 | 0.24 | 0.11 | 0.035 | "                                                                           |
| vehicle[2] | green (bottom) | 0.29 | 0.38 | 0.11 | 0.035 | "                                                                           |
| ped[0]     | stand / red    | 0.34 | 0.62 | 0.14 | 0.05  | face-on window — see note                                                   |
| ped[1]     | walk / green   | 0.34 | 0.80 | 0.14 | 0.05  | face-on window — see note                                                   |

- Vehicle lenses are wide-and-short ellipses (rx ≫ ry): in profile the round lens is a
  foreshortened sliver of colour on the hood edge, road side (x < 0.5).
- **Concept note for the render lane:** the ped head is drawn FACE-ON, so its two lit
  pictogram windows likely want a **rounder** anchor (rx ≈ ry, e.g. rx 0.11 / ry 0.10)
  than the profiled vehicle ellipses — the seeded ry 0.05 above inherits the old profiled
  ped geometry. Tune both at the gate.

## 5. bollard — potelet boule (aspect 0.6, 307×512, seed 6105)

```
a Parisian ball-top bollard: a short stout smooth tubular steel post about knee-to-hip height, slightly flared where it meets the ground, topped by a single rounded cast-iron ball cap; squat and low, much shorter than a street lamp, one smooth unbroken shaft, dark uniform painted finish with no reflective band and no collar
```

- `short stout … knee-to-hip height … squat and low, much shorter than a street lamp` →
  ref trait 1; keeps it from reading as a slim post.
- `single rounded cast-iron ball cap` → ref trait 2, never flat or pointed.
- `smooth tubular … slightly flared where it meets the ground … one smooth unbroken shaft`
  → ref trait 3, and a single smooth post is emphatically NOT a US fire hydrant.
- `dark uniform … no reflective band and no collar` → ref trait 4 + trap: rules out the
  post-2015 Vigipirate anti-ram bollard (reflective collar) and the modern sticker-banded
  post.

## 6. scooter — scooter garé (aspect 1.5, 768×512, seed 6106)

**Model choice — MBK Booster (plastic-fairing sport scooter), NOT the moped.** The
interactive `moto` sprite (`vehicles.moto`) is the exposed-tube-frame delivery **moped**
(103/mobylette register: "exposed tube frame, top-box crate"). Per references-road-props §8,
the parked décor prop takes the OTHER canonical 90s model — the MBK Booster, a
plastic-bodied step-through sport scooter on its centre stand — so the two never read as a
duplicate in the same scene (AC6). The Booster's continuous plastic fairing vs the moto's
bare tube frame is the load-bearing distinction; the décor prop also carries no render-side
neon rim, so it stays "grey = décor".

```
a 1990s plastic-bodied sport scooter parked side-on in profile, standing upright on its centre stand: small fat low-diameter wheels, a low continuous one-piece moulded plastic body with a step-through floorboard and a raised front leg-shield, a low flat seat, a simple round headlamp set in the front shield, a thin single mirror stalk, a small top-box case strapped on the rear luggage rack; stocky youthful scooter proportions, clearly wider than it is tall
```

- `1990s plastic-bodied sport scooter … low continuous one-piece moulded plastic body with a
step-through floorboard and a raised front leg-shield` → the Booster parti (ref §8
  option A); the continuous fairing is what distinguishes it from the moto's exposed frame.
- `parked side-on in profile … on its centre stand, standing upright` → parked décor, side
  view, visibly static/distinct from the moving interactive moto.
- `small fat low-diameter wheels` → ref trait 1: scooter proportions, not thin bicycle
  wheels nor big road-motorcycle wheels.
- `simple round headlamp … thin single mirror stalk` → ref trait 4.
- `small top-box case … on the rear luggage rack` → ref trait 3, the period-Parisian tell
  kept from the current draw. **Open item for lead-art:** the top-box is also the
  interactive moto's signature — keep it here (period-true, in the current procedural draw)
  or drop it to sharpen the moto-vs-prop distinction (the fairing already carries most of
  it). Authored WITH the top-box; flag to decide at the gate.
- `stocky youthful … clearly wider than it is tall` → composed for the wide 1.5 aspect;
  "stocky/1990s" also blocks the modern maxi-scooter (TMAX) trap.

## 7. bench — banc Davioud (aspect 1.7, 870×512, seed 6107)

```
a Parisian Davioud public bench seen side-on in profile: several bold horizontal wooden slats forming the seat and the gently reclined backrest, clear evenly-spaced parallel horizontal lines; a heavy ornate cast-iron end frame at each end with floral scrollwork legs, visibly bulkier and heavier than the thin slats; the backrest gently reclined for comfort, the whole bench resting directly on the pavement; a long low bench, much wider than it is tall, one continuous seat with no armrest dividers
```

- `bold horizontal wooden slats … clear evenly-spaced parallel horizontal lines` → ref
  trait 1, the most identifying feature of the Davioud.
- `heavy ornate cast-iron end frame … floral scrollwork legs … heavier than the thin slats`
  → ref trait 2.
- `backrest gently reclined for comfort` → ref trait 3, not a vertical-straight back.
- `resting directly on the pavement` → ref trait 4, no raised plinth.
- `long low bench … one continuous seat with no armrest dividers` → composed for the 1.7
  aspect + trap: no mid-seat "hostile design" dividers (post-2000s), not a solid concrete
  block, not a US A-frame picnic table.

## 8. streetSign — plaque émaillée sur poteau (aspect 0.75, 384×512, seed 6108)

Authored as the **post** version (it must stand on the kerb). **Open item for lead-art:**
Paris street-name plaques are almost always wall-mounted, so a post-mounted plate reads more
honestly as a regulatory/info panel; whether to keep the post plaque or switch to a
wall-mounted plaque (if the facade render allows) is a `lead-art` call — flagged, not decided
here.

```
a Parisian enamel street-name plaque mounted on a single thin post: a wide landscape rectangular flat plate, clearly wider than it is tall, its face completely blank and empty with nothing written on it, bordered by a fine raised double-keyline frame running just inside the edge; one slender post, much thinner than the plate, rising from below into the centre of the plate and planted on a small splayed foot on the pavement; a single flat plane, not a boxy double-sided sign, plain and empty
```

- `wide landscape rectangular flat plate, clearly wider than it is tall` → ref trait 1; a
  square/round/lozenge plate would read as a French regulatory road sign (which the code
  reserves those shapes for).
- `face completely blank and empty with nothing written on it … plain and empty` → hard
  no-text (critical): the plaque must NOT grow a legible street name.
- `fine raised double-keyline frame running just inside the edge` → ref trait 2, the
  double-filet border — a real silhouette tell even in pure grey.
- `one slender post, much thinner than the plate, into the centre … splayed foot on the
pavement` → ref trait 3, single centre post standing on the kerb — never the US
  double-post crossing sign.
- `a single flat plane, not a boxy double-sided sign` → ref trait 4.

---

## Seeds (distinct, stable — aligned with the frozen tech-plan block)

| kind            | seed |
| --------------- | ---- |
| parkingMeter    | 6101 |
| lamppost        | 6102 |
| wallaceFountain | 6103 |
| trafficLight    | 6104 |
| bollard         | 6105 |
| scooter         | 6106 |
| bench           | 6107 |
| streetSign      | 6108 |

## Open items for the `lead-art` gate

1. **scooter top-box** — keep (period-true, in current draw) or drop to sharpen distinction
   from the interactive moto (whose signature IS the top-box crate). Authored WITH it.
2. **streetSign wall-vs-post** — authored the post plaque; wall-mounted plaque is the more
   Paris-honest option if the facade render supports it.
3. **trafficLight ped lens anchors** — face-on ped windows likely want a rounder anchor
   (rx ≈ ry) than the seeded profiled ellipses; render lane to tune at the gate.

---

## Preprod annotations (game-graphist)

Serge, pre-prod pass, before the `lead-art` PROMPT GATE. Read against real in-game size
(60–170 px tall; bollard tiniest at heightFrac 0.13, traffic light hero at 1.44) and the
`keyAndDown` flood-fill in `gen-gptimage-asset.mjs`: it seeds from the four canvas edges
and grows through **connected** near-magenta only — any magenta pocket boxed in on all
sides by opaque geometry never gets touched and ships as a pink hole. Two failure
patterns recur across this set and I flag them per prop rather than once: (1) **enclosed
magenta** wherever a prop is described as several separate solid pieces with visible gaps
between them (slats, spokes, ring-of-figures, lattice), and (2) **dark-on-dark** wherever
a prop's own clause states a flat "dark uniform … finish" with nothing else to carry a
rim — the shared three-tone-cel-shading tail should provide separation, but per-prop
content shouldn't rely on it alone against a dark street. I also flag the two widest
canvases (bench 1.7, scooter 1.5) for edge-touching risk on top of the shared "centered,
fully visible" clause, since that clause alone hasn't stopped edge-clipping before
(courier precedent).

**[S1] parkingMeter — OK-with-edits.**
Readability: screen / coin slot / ticket slot are bold enough to survive at size — good.
Risk: `horizontal ventilation grooves` is ambiguous between embossed surface ridges
(safe) and pierced-through vents (each groove boxed by the casing on both ends →
un-keyed magenta hairlines). Edit: append to that clause — `(shown as indented surface
ridges, not cut-through vents)`. No dark-uniform clause here; the screen/slot detail
already supplies natural rim contrast, no further edit needed.

**[S2] lamppost — OK-with-edits.**
Risk (dark-on-dark): `dark uniform painted finish` with nothing else to carry a rim risks
a near-solid black column at size. Edit: append `, a paler grey highlight edge along the
shaft's lit side to keep the silhouette legible against a dark night backdrop`.
Risk (enclosed magenta): if gptimage renders the `faceted many-sided polygonal lantern`
as an openwork/lattice cage (glazing bars with gaps to background) instead of solid
panels, each inter-facet gap is boxed by the cap+lantern rim on every side → unkeyed
pockets at the top of the sprite. Edit: append to the lantern clause — `, the lantern's
facets solid opaque panels with no open lattice or see-through gaps`.
Note (non-blocking): the shaft `fluted` texture will mush invisible at 60–170 px; leave
it, it costs nothing and doesn't create a defect.

**[S3] wallaceFountain — RISK.**
Keying: `four slender caryatid women standing back-to-back in a ring` — the negative
space between adjacent figures (and under their raised arms) is boxed by the ring on
every side, not edge-connected → this is the textbook "between the Wallace caryatids"
enclosed-magenta failure, and it sits right in the middle of the silhouette. Fix: replace
with a clause that keeps the four-figure read as a single closed silhouette — e.g. "four
caryatid figures fused into one continuous fluted column silhouette, only surface
linework separating each figure, no open gaps between them."
Readability: `small dolphin ornaments` studding the dome will not read at 100–160 px
after 3-tone shading + luma desaturation — it'll die to noise. Fix: replace with `a few
small rounded bumps studding the dome` (keeps the silhouette cue, drops the doomed
detail).
Risk (dark-on-dark): `dark uniform patinated finish` — same solid-mass risk as lamppost/
bollard. Fix: append `, a lighter grey highlight along the dome and column edges to
separate the silhouette from the dark street`.

**[S4] trafficLight — OK-with-edits.**
Aspect: narrowest canvas in the set (0.44, 226×512) while the content demands a
`hood-visor [that] juts sideways toward the road` off the mast — real risk of gptimage
cropping the visor tip at the frame edge, which both breaks the key (2c) and clips the
geometry the render-side `lenses` anchors are pinned to. Fix: append `, with generous
empty magenta margin on the road side so the visor tip stays fully clear of the frame
edge`.
Keying: the gaps between mast and each cantilevered head are open to background on both
sides (street/sky), genuinely edge-connected — keys clean, no edit needed.
Readability: hero-sized prop (heightFrac 1.44); edge-on lens slivers and the blank ped
windows survive at size — OK.
Minor dark-on-dark note: housings are `dark uniform finish` with only the render-side lit
lens as accent; low priority since a lens is normally lit in play, but worth a light
rim-highlight on the visor lip for the rare frozen/reduced-motion frame — not blocking.

**[S5] bollard — OK-with-edits.**
Readability: tiniest prop in the set (heightFrac 0.13, ~60–90 px) — a single post+ball
mass with no requested interior detail is exactly the right level of ambition here. OK.
Keying: `one smooth unbroken shaft`, no gaps anywhere — no enclosed-hole risk. OK.
Risk (dark-on-dark): `dark uniform painted finish with no reflective band and no collar`
correctly kills the anachronistic Vigipirate collar, but leaves nothing to separate the
silhouette from a dark street at the size with the least room for the three-tone shading
to work. Fix: append `, a subtle lighter grey highlight along the ball cap and the
shaft's lit side` — keep it subtle, it must not read as the reflective collar the trap
explicitly forbids.

**[S6] scooter — OK-with-edits.**
Risk (enclosed magenta): `small fat low-diameter wheels` unqualified risks spoked/rimmed
wheels with gaps between spokes boxed by tire+hub on every side — this is the named
"inside the scooter wheel" failure. Fix: append to the wheel clause `(solid flat discs,
no spokes, no rim cut-outs)` — also matches the flat comic-silhouette house style, no
loss.
Risk (edge-touching): `stocky youthful … clearly wider than it is tall`, second-widest
aspect in the set (1.5) — handlebar, mirror stalk or top-box likely reach the left/right
frame edge. Fix: append `, comfortably inset within the frame with empty magenta margin
on both sides, nothing touching the canvas edge`.
Note (non-blocking): `thin single mirror stalk` will likely vanish at 90–140 px in-game —
lost detail, not a defect, no edit needed.

**[S7] bench — RISK.**
Keying: `several bold horizontal wooden slats … heavy ornate cast-iron end frame at each
end` — the slats are explicitly boxed by a frame at BOTH ends, so every gap between
slats is enclosed on all four sides (frame left, frame right, slat above, slat below) →
none of it is edge-connected. On the widest canvas in the set (870 px) this reads as a
row of unkeyed pink hairlines across the whole seat and backrest. Fix: replace the slat
clause with one that keeps the exterior silhouette closed — e.g. "the slats drawn flush
against each other with only thin dividing outline strokes between them, no open gaps or
daylight visible between slats."
Risk (edge-touching): `much wider than it is tall`, widest aspect in the set (1.7) — the
cast-iron end-frame scrollwork or a bench leg is likely to touch the left/right frame
edge. Fix: append `, comfortably inset with empty magenta margin on both ends, no part
touching the canvas edge`.
Readability: at heightFrac 0.17 (~60–90 px on screen), a high slat count mushes into a
striped smear even once the key issue above is fixed. Fix: replace `several bold
horizontal wooden slats` with `three or four bold horizontal wooden slats` so the banded
read survives downscale.

**[S8] streetSign — OK-with-edits.**
Readability: `fine raised double-keyline frame running just inside the edge` — a double
line this fine will mush to a single blurred edge (or vanish) at in-game size after luma
desaturation + downscale; the double-filet nuance is a colour-era trait (per the
reference doc) that won't read in monochrome at this scale regardless. Fix: soften to `a
bold single raised keyline border running just inside the edge` so the ask matches what
the pipeline can actually deliver.
Keying: the post entering "into the centre of the plate" reads as a mounting description
(attaches behind/below), not a through-hole — no enclosed-magenta risk as written, but
worth a one-line disambiguation since a literal "post visible through a slot in the
plate" reading would create one. Fix: append `, the post attaching behind the plate with
no visible gap or hole through it`.
Aspect: canvas is portrait (384×512) while the plate itself must read landscape (wider
than tall) — plausible, the plate sits in the upper portion with post+foot filling the
height below; no edit needed.
Colour: no pink/violet-inviting language anywhere in the clause — OK.

— Serge, PRE-PROD pass

---

## Lead-art gate (PASS/FAIL per prop)

Nico (lead-art), PROMPT GATE, 2026-07-19. Gated against `docs/art-direction.md` (§1 house
style, §2 law 3 silhouette-first + AI-defect clause, §3 prompt rules, C1 grey-décor law) +
`references-road-props.md` + `board-traffic-light.md` + the frozen tech plan (Decision 1
schema, Decision 4 lint scope). **Verdict: 8/8 PASS.** No prop sent back for a re-draft —
every preprod clause edit and both RISK rewrites accepted (two with a minor lead-art
tightening, noted). Serge's pre-prod pass did the keying/readability heavy lifting; I am
signing it through.

**These 8 FINAL subject strings + the FINAL opening + FINAL tail below are the tooling
contract** — `dev-tooling-assets` copies them **verbatim** into `levelArt.json`
`nearForegroundArt` (`opening`, `style`, and `types[kind].prompt`/`seed`). They REPLACE the
tech-plan Decision-1 skeleton placeholders (`"…"`, `"<silhouette-only>"`, and the short caps
`ALL LENSES DARK AND UNLIT` trafficLight stub — do not ship the stub). The `lenses` anchor
block, `asset` paths and `size` dims stay exactly as frozen in tech-plan Decision 1.

### Shared `opening` (FINAL — verbatim, family-locked) — PASS

```
Flat 2D video game sprite, strict side-view orthographic projection, a single piece of 1998 Parisian street furniture at street level,
```

Front-loads medium + camera lock (§3.2/§3.6), mirrors `vehicles.opening` for family
consistency (§2 law 2). Minor note (non-blocking): "street furniture" is a slight misnomer
for the parked scooter, but the shared opening is byte-locked by design and each subject
clause dominates the read on the instruction-adherent gptimage model — accepted as-is.

### Shared props `style` tail (FINAL — verbatim, family-locked) — PASS

```
, clean bold comic book ink illustration, three-tone cel shading in grey black and white, thick clean black outline, flat evenly filled shapes, strictly monochrome greyscale with no colour, the single object fully visible and centered, floating isolated on a perfectly flat solid uniform bright magenta #FF3CDC background, empty flat magenta backdrop, no ground, no floor, no cast shadow, no drop shadow, no people, no text, no letters, no numbers, no logo, no writing, no signature, single object only
```

- House look matches the shipped enemy/vehicle/courier/hostage family — one printing run
  (§2 law 2). PASS.
- `strictly monochrome greyscale with no colour` upholds C1 and matches the pipeline's luma
  desat (`keyAndDown`, no `--keepcolor`). Carries no neon token — correct, these are grey
  décor and the trafficLight lit lens is render-side only. PASS.
- Magenta `#FF3CDC` chroma ground matches the gptimage vehicles/courier/hostage precedent
  and the tech-plan Decision-1 style block. PASS.
- No-text kill is stated **six ways** in the tail (`no text, no letters, no numbers, no
logo, no writing, no signature`) and reinforced per-prop on the two text-magnet props
  (parkingMeter blank screen, streetSign blank plate) — strong enough for gptimage, which
  will letter a screen/plate if unchecked. PASS.
- Concept-artist's additions over the tech-plan skeleton — `no people`, `no floor`, `no
drop shadow`, `no letters/no numbers`, `single object only` — are all house-correct
  strengthenings (critically `no people`: no pedestrian may grow on the bench / at the pay
  station). KEPT.
- Negation-heavy by FLUX standards, but this is the **gptimage** pipeline (instruction-
  adherent, reads negation correctly) and the tech-plan Decision-4 `checkNearForegroundArt()`
  lint does NOT apply the FLUX 120-word ceiling / negation budget to this set — no CI
  conflict. The assembled prompts intentionally run long; every clause is load-bearing
  (silhouette, keying-safety, or text/shadow kill).

### Per-prop verdicts + FINAL subject strings

**[S1] parkingMeter — PASS** (seed 6101). Accepted Serge's vent-groove keying edit
(embossed ridges, not pierced vents → no un-keyed magenta hairlines).

```
a 1990s Parisian pay-and-display parking machine standing tall: a slim steel pole clearly much thinner than the head, topped by a bulky rectangular boxy head whose whole top face is a single steeply slanted rain-cap wedge; on the head's road-facing front a small dark blank recessed rectangular screen with nothing on it, a wide horizontal coin slot below it, a low ticket-delivery slot near the bottom, and a few horizontal ventilation grooves shown as indented surface ridges rather than cut-through vents; angular sheet-metal casing, hard straight edges, distinctly taller than it is wide
```

**[S2] lamppost — PASS** (seed 6102). Accepted both edits: solid-panel lantern (kills
openwork-lattice enclosed magenta at the sprite top) + paler-grey shaft highlight (dark-on-
dark legibility; grey, not colour, so C1 holds).

```
a tall cast-iron Haussmann-era Parisian street lamp: a fluted base flaring out at the foot, a slender fluted shaft tapering as it rises, a single curved S-shaped swan-neck arm sweeping outward near the very top, ending in a faceted many-sided polygonal lantern with a small pointed cap, the lantern's facets solid opaque panels with no open lattice or see-through gaps; ornamental antique cast-iron, elegant and slender, dark uniform painted finish, a paler grey highlight edge along the shaft's lit side to keep the silhouette legible against a dark night backdrop
```

**[S3] wallaceFountain — PASS (with one lead-art tightening)** (seed 6103). Accepted both
RISK rewrites (fused-silhouette caryatids → kills the textbook "between the Wallace
caryatids" enclosed magenta; dolphins → rounded bumps, the doomed detail dropped) and the
dark-on-dark highlight. **Tightening:** replaced Serge's "one continuous fluted column
silhouette" with "one continuous closed silhouette" and extended the no-gap clause to cover
"under their raised arms" — the reference §3 piège explicitly forbids the single-column read
("jamais une colonne unique"), so I keep "four caryatid figures" prominent and drop the word
"column." Same keying outcome, no re-roll.

```
a Wallace drinking fountain, a compact cast-iron monument: an octagonal pedestal at the base, four caryatid figures fused into one continuous closed silhouette around the centre, only surface linework separating each figure with no open gaps between them or under their raised arms, the arms supporting a domed pointed cap with a few small rounded bumps studding the dome; the silhouette pinched narrow at the base, widest at mid-height where the four figures stand, then tapering up to the pointed dome; modest and squat, clearly wider and lower than a street lamp, dark uniform patinated finish, a lighter grey highlight along the dome and body edges to separate the silhouette from the dark street
```

**[S4] trafficLight — PASS** (seed 6104). Accepted the road-side margin edit (protects the
visor tip AND the render-side lens anchors from frame-crop on the narrowest canvas).
**Promoted Serge's optional visor-lip highlight to included:** the three other dark-uniform
props (lamppost/wallace/bollard) all carry the grey legibility highlight, and this is the
hero prop (heightFrac 1.44, most-seen) — for one-printing-run consistency it should not be
the single dark-mass prop that skips it. Highlight is grey and the lenses stay dead/colour-
less, so the dead-housing requirement and C1 both hold; the lit lens + halo remain a
render-side overlay, NOT baked.

```
a French road traffic signal on a slim round mast with a splayed foot, seen from the side at street level. High on the mast a tall boxy vehicle signal head turned in strict side profile: three round lenses stacked vertically, each tucked under a curved tunnel hood-visor that juts sideways toward the road, the lens discs seen edge-on as narrow dark slivers, all dead and unlit. Lower down a smaller pedestrian signal head turned to face the viewer head-on: two blank dark round lens windows stacked vertically, both dead and unlit. Both heads cantilevered from the mast on short brackets. Every lens dark, matte and switched off, no glow and no colour; boxy hooded metal housings, dark uniform finish, a light grey highlight along the visor lips and mast edge to keep the housing legible against a dark night backdrop, with generous empty magenta margin on the road side so the visor tip stays fully clear of the frame edge
```

> **Composite gate (Gate 4) flag — NOT gated here.** This prompt gate covers the DEAD grey
> housing only. The render-side lit lens + halo overlay (`drawSignalLenses`, tech-plan
> Decision 3) is a runtime composite that no screenshot has yet shown, so it is **not** yet
> PASS. It must clear my composite gate on real in-game screenshots before merge, checked
> against §2.1 « un halo est un dégradé, jamais un aplat » — the lit-lens halo must carry
> alpha falloff to zero, not a hard-edged neon plate. Open-item #3 (ped anchors) is tuned
> there too (see below).

**[S5] bollard — PASS** (seed 6105). Accepted the subtle ball-cap / lit-side highlight
(tiniest prop, ~60–90 px — most needs the dark-on-dark help). The highlight runs along the
cap and the vertical lit side, NOT as a horizontal band, so it cannot read as the reflective
collar the anachronism trap forbids.

```
a Parisian ball-top bollard: a short stout smooth tubular steel post about knee-to-hip height, slightly flared where it meets the ground, topped by a single rounded cast-iron ball cap; squat and low, much shorter than a street lamp, one smooth unbroken shaft, dark uniform painted finish with no reflective band and no collar, a subtle lighter grey highlight along the ball cap and the shaft's lit side
```

**[S6] scooter — PASS** (seed 6106). Accepted both edits (solid-disc wheels → no inter-spoke
enclosed magenta; comfortable inset → no edge-clip on the second-widest canvas). **Open item
#1 decided: DROP the top-box** — see below; the subject now carries "a bare empty rear
luggage rack" instead.

```
a 1990s plastic-bodied sport scooter parked side-on in profile, standing upright on its centre stand: small fat low-diameter wheels shown as solid flat discs with no spokes and no rim cut-outs, a low continuous one-piece moulded plastic body with a step-through floorboard and a raised front leg-shield, a low flat seat, a simple round headlamp set in the front shield, a thin single mirror stalk, a bare empty rear luggage rack; stocky youthful scooter proportions, clearly wider than it is tall, comfortably inset within the frame with empty magenta margin on both sides, nothing touching the canvas edge
```

**[S7] bench — PASS (with one lead-art addition)** (seed 6107). Accepted all three RISK
edits (flush slats with dividing strokes → closes the seat/back silhouette, kills the row of
pink hairlines; "three or four" slats → banded read survives the ~60–90 px downscale;
comfortable inset → no edge-clip on the widest canvas). **Addition:** a scrollwork-solid
clause on the cast-iron end frame — floral openwork scrollwork is the same enclosed-magenta /
lattice risk Serge caught on the lamppost lantern, and it dies to a mass at game size anyway;
drawing it as bold solid shapes is keying-safe and on-style. Merged Serge's two slat edits
into one coherent clause.

```
a Parisian Davioud public bench seen side-on in profile: three or four bold horizontal wooden slats forming the seat and the gently reclined backrest, drawn flush against each other with only thin dividing outline strokes between them so they read as clear parallel horizontal lines with no open gaps or daylight visible between slats; a heavy ornate cast-iron end frame at each end with floral scrollwork legs, the scrollwork read as bold solid shapes rather than fine see-through openwork, visibly bulkier and heavier than the thin slats; the backrest gently reclined for comfort, the whole bench resting directly on the pavement; a long low bench, much wider than it is tall, one continuous seat with no armrest dividers, comfortably inset with empty magenta margin on both ends, no part touching the canvas edge
```

**[S8] streetSign — PASS** (seed 6108). Accepted both edits (bold single keyline → the
double-filet is a colour-era trait that won't survive mono downscale; behind-plate mounting
disambiguation → no through-slot enclosed magenta). **Open item #2 decided: KEEP the
post version** — see below.

```
a Parisian enamel street-name plaque mounted on a single thin post: a wide landscape rectangular flat plate, clearly wider than it is tall, its face completely blank and empty with nothing written on it, bordered by a bold single raised keyline border running just inside the edge; one slender post, much thinner than the plate, rising from below into the centre of the plate and planted on a small splayed foot on the pavement, the post attaching behind the plate with no visible gap or hole through it; a single flat plane, not a boxy double-sided sign, plain and empty
```

### Open-item decisions (final)

1. **scooter top-box → DROP.** The top-box crate is the interactive `moto`'s **signature
   silhouette** (`art-direction.md` §5 moto anchor lists "top-box crate strapped over the
   rear rack" as a defining trait). Two props in one scene must not share their single most
   distinctive silhouette element — silhouette-first (§2 law 3) and AC6 (décor scooter stays
   visually distinct from the interactive vehicle class) both push the same way. The
   Booster's continuous plastic fairing is the load-bearing distinction and already carries
   the read; the parked-on-centre-stand posture keeps it period-true. I keep the rack but
   draw it **bare/empty** — a positive "not the moto" tell. Scene distinctness beats the
   courier-culture cliché. (Overrides references-road-props §8 trait 3 "garder" — the
   duplication risk with a same-scene interactive prop outweighs the period-cliché value.)

2. **streetSign → KEEP post-mounted (as authored).** Placement is fixed to the kerb line by
   `NearForeground` — a wall-mounted plaque is not viable at this layer (no facade to mount
   to). A post-mounted plate on the kerb reads honestly as generic street signage / a
   regulatory-info panel, which references-road-props §7 itself accepts as "le plus honnête
   vu le poteau." Phrasing keeps "enamel street-name plaque" purely as the **landscape-plate
   silhouette anchor** (drives the wide-rectangle-with-border shape and away from the round/
   triangle/lozenge regulatory-sign shapes §7 warns against) — the blank plate makes the
   info-panel read regardless.

3. **trafficLight ped lens anchors → render-lane tune, not a prompt matter (agreed).** The
   face-on ped windows likely want a rounder anchor (rx ≈ ry) than the seeded profiled
   ellipses (ry 0.05 inherits the old profiled geometry). This is render-side data
   (`lenses.ped` in the tech-plan block), tuned against the real PNG **at the composite gate**
   (Gate 4), where the whole lit-lens overlay is judged against §2.1. No prompt change.

### Notes for the generation lane

- The 8 strings above are gate-final. Generate under the pinned seeds 6101–6108 (unchanged
  from the draft table). Iteration budget: 2 batches per the set this cycle before options
  escalate to Bertrand.
- On delivery: I run the **asset gate** on each keyed PNG on a contrasting ground (§2 law 3
  AI-defect sweep — every prop was hardened here against the flood-fill enclosed-magenta
  failure, so verify the keyer left no pink pocket and no defect the white ground hid), then
  the **composite gate** on the trafficLight overlay in real in-game screenshots. Neither is
  covered by this prompt-gate PASS.

— Nico, PROMPT GATE — 8/8 PASS

---

## Reference-revision delta review (concept-artist, 2026-07-20)

Maud, reference-alignment DELTA REVIEW of the 8 gate-final road-prop strings (§ "Lead-art
gate" above, verbatim in `levelArt.json` `nearForegroundArt`). Two audits per prop:
(1) **camera-orientation** against Bertrand's binding directive
(`docs/handoffs/story-road-props-reference-revision.md` intake completion — « fais
attention au sens de la caméra, la rue est vue de profil. la caméra regarde du trottoir
vers le batiment »): street in strict profile, camera from the opposite pavement toward
the facade, props stand on the facade-side kerb and are seen from their **road-facing
side** (the face turned toward the roadway/camera); any clause depicting a prop's
sidewalk-facing back is a defect. (2) **Reference-delta** folding in the 7 relayed boards'
"Prompt delta check" conclusions + the pre-CURATED traffic-light board.

Gate-decided items are NOT relitigated here (scooter top-box DROP, streetSign post-mount +
single keyline, lamppost solid-panel lantern, wallace solid caryatid silhouette + rounded
bumps, bench solid scrollwork + flush slats + 3–4-slat cap, all grey legibility
highlights).

### 1. Camera-orientation audit

| Prop                 | Verdict      | Reasoning (one line)                                                                                                                                                                                       |
| -------------------- | ------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| [S1] parkingMeter    | **CONFORME** | Screen + coin/ticket slots sit on the "road-facing front" — the operative face is turned toward the roadway/camera exactly as the directive wants visible; no sidewalk-facing back described.              |
| [S2] lamppost        | **CONFORME** | Near-symmetric fluted shaft in strict profile; the col-de-cygne arm "sweeping outward" reads as an in-plane S-silhouette (side-scroller convention), no front/back face to reverse.                        |
| [S3] wallaceFountain | **CONFORME** | Radially symmetric ring of four caryatids — the profile silhouette reads identically from any azimuth; there is no road-vs-sidewalk face to get wrong.                                                     |
| [S4] trafficLight    | **CONFORME** | Matches the CURATED board geometry verbatim: vehicle head strict profile with the hood-visor jutting toward the road (camera), pedestrian head face-on toward the crossing — the directive's dual read.    |
| [S5] bollard         | **CONFORME** | Radially symmetric post + ball cap; no orientation face to reverse.                                                                                                                                        |
| [S6] scooter         | **CONFORME** | "Parked side-on in profile"; a scooter flank reads the same from either side and the road-facing flank is what the camera sees; no sidewalk-back defect (mirror/headlamp are front-of-vehicle, in-plane).  |
| [S7] bench           | **CONFORME** | Seat + backrest read toward the camera = the road-facing side; the street-correct Davioud is the double-sided/coat-of-arms type (a seat faces the road regardless), so the road-facing seat view is right. |
| [S8] streetSign      | **CONFORME** | The blank plate is presented face-on (landscape rectangle visible) — its face turned toward the road/camera, same face-on-toward-camera logic as the ped head; no sidewalk-facing back.                    |

**Camera verdict: 8/8 CONFORME — no camera-orientation delta.** The gate authored every
prop as a profile silhouette and put each prop's identifying/operative face on the
road-facing side already; Bertrand's directive confirms that framing rather than
overturning it. Two props carry a legibility-driven face-on element that is _consistent
with_ (not contrary to) the directive because it faces the road: the trafficLight ped head
and the streetSign plate — both present their road-facing face to the camera, which is the
correct read.

### 2. Reference-delta list

**One delta — [S7] bench backrest reclination → straight.**

- **Prop:** bench (seed 6107).
- **Clause(s) to change (two occurrences of the reclination claim):**
  1. `...forming the seat and the gently reclined backrest, drawn flush...`
     → `...forming the seat and the upright straight backrest, drawn flush...`
  2. `the backrest gently reclined for comfort, the whole bench resting directly on the pavement`
     → `the backrest standing straight and vertical, not curved or reclined, the whole bench resting directly on the pavement`
- **Source / board line:** `board-bench.md` — Prompt delta check item 1, backed by Claims
  audit item 8 (Trait 3 « dossier légèrement incliné (confort), pas un dossier vertical
  droit » → **CONTRADICTED**). Axis 2: **both** documented Davioud typologies (the
  boulevard/pavement straight-back bench AND the garden gondola) carry a **straight
  backrest** (« dossier droit »); the only inclination that exists is in the gondola's
  _seat pan_, never the back — and the gondola is the garden, not street, type. Sourced:
  Jardins de France (« Amoureux des bancs publics ») + Musée du Louvre (votrebanc « urban
  furniture ») + Wikipédia (Banc Davioud). A kerb-side street bench should read
  upright-backed.
- **Craft / keying note (gptimage-adapted flux-prompt discipline):** silhouette guidance
  only. Leaves intact the flush-slats enclosed-magenta fix, the solid-scrollwork clause,
  the "three or four" slat readability cap, and the edge-inset margin. A vertical back
  introduces no new gaps (no enclosed magenta), no dark-on-dark (the bench string carries
  no dark-uniform/highlight clause to disturb), and no text risk; a straight vertical back
  still satisfies "a long low bench, much wider than it is tall."

**PROPOSED FINAL string — [S7] bench (delta applied, ready for the lead-art gate):**

```
a Parisian Davioud public bench seen side-on in profile: three or four bold horizontal wooden slats forming the seat and the upright straight backrest, drawn flush against each other with only thin dividing outline strokes between them so they read as clear parallel horizontal lines with no open gaps or daylight visible between slats; a heavy ornate cast-iron end frame at each end with floral scrollwork legs, the scrollwork read as bold solid shapes rather than fine see-through openwork, visibly bulkier and heavier than the thin slats; the backrest standing straight and vertical, not curved or reclined, the whole bench resting directly on the pavement; a long low bench, much wider than it is tall, one continuous seat with no armrest dividers, comfortably inset with empty magenta margin on both ends, no part touching the canvas edge
```

**Deferred (flagged, NOT authored — pending `art-advisor`/`lead-art` one-photo check):**
`board-bench.md` delta #2 — backrest slat multiplicity. Sourced technical text (Axis 2:
« l'assise double est constituée de quatre lattes et le dossier d'une latte ») describes
the backrest as a **single broad board per side**, not a multi-slat assembly, but the
board explicitly withholds this as a DIG pending a photo-level check before touching an
already-gated prompt. I therefore keep the current "slats forming the seat **and** the...
backrest" wording and the 3–4-slat cap unchanged. If the photo check confirms, the
follow-up delta would change the **backrest only** from slats to a single broad board
while keeping the seat's multi-slat read — logged here as pending, not proposed.

**Informational (no delta):** `board-bench.md` Claims audit item 5 CONTRADICTED — the
street-correct Davioud is the **double-sided/coat-of-arms** bench (garden = single-face
gondola). The gate-final string is orientation-agnostic on single-vs-double and reads
correctly either way (a seat faces the road on the road side regardless), so this forces
no prompt change; it is a correction to the reference-doc framing, not a silhouette gap.
It also _reinforces_ the camera verdict (a double-sided bench always presents a seat toward
the road).

### 3. No-delta confirmations

Seven props left untouched — each board's Prompt delta check concluded NO DELTA; the
remaining nuances are informational only and below the bar to reopen a gated, seed-pinned
prompt:

- **[S1] parkingMeter** — `board-parking-meter.md`: no delta. Only soft flag = the
  rain-cap slant "steeply slanted" rests on the weakest-sourced clause (no period
  Schlumberger photo confirming a _steep_ pitch); nothing contradicts it, genre-consistent,
  don't touch on this hunt's strength.
- **[S2] lamppost** — `board-lamppost.md`: no delta; every silhouette clause corroborated
  (fluted shaft, S-arm, faceted lantern). Solid-panel lantern is the gate-decided keying
  deviation from real glazing, not relitigated. Open items (unverified 12 485→33 859
  figures; missing dated-1998 photo) are evidentiary, not prompt-facing.
- **[S3] wallaceFountain** — `board-wallace-fountain.md`: no delta; octagonal pedestal +
  4-caryatid + dolphin dome all VERIFIED. Dolphins→"rounded bumps" is the gate-decided
  legibility trade (dolphins historically real but doomed at 100–160 px), not relitigated.
  2.71 m vs "~2.5 m" is a ref-doc number nuance; the prompt carries no numeric figure.
- **[S4] trafficLight** — `board-traffic-light.md` (pre-CURATED, Bertrand 2026-07-18): the
  gate-final string already conforms (profile vehicle head + face-on ped head, visor toward
  road, dead grey housing). No prompt delta. The render-side lit-lens + halo overlay stays
  a Gate-4 composite matter (ped anchor tuning included), not a prompt change.
- **[S5] bollard** — `board-bollard.md`: no delta; smooth shaft + ball cap + dark uniform
  no-collar all VERIFIED. "knee-to-hip" (real ≈ hip-to-chest) and "massif...1990s" (real ≈
  early-growth phase, saturation post-2001) are informational nuances the board explicitly
  declines to turn into edits — nudging height wording risks reading taller/less squat.
- **[S6] scooter** — `board-scooter.md`: no delta; continuous plastic fairing (vs the
  moto's exposed frame), centre-stand posture, "small fat low-diameter" wheels all VERIFIED
  under the Big-Wheels nuance. Top-box DROP stays gate-decided (open-item #1, moto
  distinctness / AC6), not relitigated; the bare rack reads as period-plausible
  customization. Weakest-sourced trait (headlamp/mirror) is generic-and-safe, no change.
- **[S8] streetSign** — `board-street-sign.md`: no delta; landscape rectangle + single
  post + blank face all consistent, every anachronism trap dated. Post-mount and single
  keyline stay gate-decided, not relitigated. The optional "boxy-panel thickness" is a
  non-blocking observation only (thickness barely reads in strict profile; silhouette-first
  law favours the flat plate).

**Hand-off:** one delta ([S7] bench backrest) for the lead-art delta gate (stage 3); on
PASS, `dev-tooling-assets` applies the [S7] PROPOSED FINAL string above verbatim to
`levelArt.json` `nearForegroundArt.types.bench.prompt` and this doc (stage 4). Seven props
= no-delta (stage 4 no-op for them). The bench backrest-slat DIG and the single/double-face
ref-doc correction are routed to `art-advisor`, not blocking this pass.

— Maud, reference-revision delta review

---

## Lead-art delta gate (Nico, 2026-07-20)

Gate on the concept-artist's reference-revision delta review (§ above) — Stage 3 of
`docs/handoffs/story-road-props-reference-revision.md`. Gated against `docs/art-direction.md`
§1 (house style), §2 (law 2 one-printing-run, law 3 silhouette-first + AI-defect clause),
§3 (prompt rules), C1 (grey-décor law), keying safety, no-text kill, and reference fidelity
(`board-bench.md` sourcing + Bertrand's binding camera constraint). The 8/8 gate-final
strings of 2026-07-19 remain the baseline; only what changes below is re-gated.

### 1. Camera-orientation audit — COUNTERSIGNED (8/8 CONFORME)

I countersign the concept-artist's 8/8 CONFORME with no contest. The 2026-07-19 gate already
authored every prop as a profile silhouette with its identifying/operative face on the
road-facing side, so Bertrand's directive (« la rue est vue de profil, la caméra regarde du
trottoir vers le bâtiment ») confirms the existing framing rather than overturning it.
Spot-checks that carried the most risk of a sidewalk-facing-back defect:

- **[S7] bench** — "seen side-on in profile … much wider than it is tall" shows the long
  road-facing flank (seat + backrest running horizontally, end-frames at each end); the
  street-correct double-sided/coat-of-arms Davioud (board-bench Claims audit item 5) presents
  a seat toward the road regardless of azimuth. Road-facing seat view is correct. CONFORME.
- **[S1] parkingMeter** — screen + coin/ticket slots on the "road-facing front": the operative
  face is turned to the camera, no sidewalk back described. CONFORME.
- **[S4] trafficLight** — matches the CURATED board verbatim (vehicle head strict profile,
  visor toward road; ped head face-on toward the crossing). CONFORME.
- The two legibility-driven face-on elements (trafficLight ped head, streetSign plate) face
  the **road**, so they are consistent with — not contrary to — the directive.

No camera delta. Nothing to change from this audit.

### 2. [S7] bench backrest reclination → straight — **PASS** (clean, no tightening)

**Verdict: PASS.** The one proposed delta is accepted as authored — no lead-art tightening
required. Rationale against each gate criterion:

- **Reference fidelity (the source of the delta):** PASS. `board-bench.md` Claims audit item 8
  rates Trait 3 (« dossier légèrement incliné, pas un dossier vertical droit ») **CONTRADICTED**:
  both documented Davioud typologies (boulevard/pavement straight-back AND garden gondola)
  carry a « dossier droit »; the only inclination that exists is the gondola's _seat pan_, and
  the gondola is the garden type, not the street type. Three sources (Jardins de France,
  Musée du Louvre / votrebanc, Wikipédia). The old clause was actively wrong — it not only
  reclined the back but explicitly steered _against_ "a vertical-straight back," i.e. away from
  the correct reference. The delta corrects a genuine fidelity error on a kerb-side street bench,
  not a taste preference. This clears the reference-fidelity bar.
- **House style §1–§2, silhouette-first:** PASS. A straight-vs-reclined backrest is
  silhouette-guidance only; it changes no treatment, line weight, ground or family clause, so
  the one-printing-run read with the other seven props is untouched. A vertical back still
  satisfies "a long low bench, much wider than it is tall" — no conflict with the low-wide
  silhouette, and at ~60–90 px on screen the corrected back reads at least as legibly as the
  reclined one.
- **C1 grey-décor law:** PASS. No colour introduced; the bench string carries no
  dark-uniform/highlight clause, so nothing to disturb. The bench remains grey décor with no
  neon rim (« ce qui brille est interactif » — the bench is not interactive).
- **Keying safety:** PASS. A vertical back introduces no new enclosed magenta. The flush-slats
  enclosed-magenta fix, the solid-scrollwork clause, the "three or four" slat readability cap
  and the both-ends edge-inset margin all survive verbatim. No dark-on-dark regression (no dark
  clause present to regress).
- **No-text kill:** PASS. Untouched — lives in the shared family-locked tail, not disturbed by
  this subject-clause edit.
- **Coherence of the full PROPOSED FINAL string:** PASS. Both reclination occurrences are
  replaced and now agree; no leftover "reclined for comfort" / "gently reclined" wording
  survives, and no clause contradicts another. One coherent prompt.

**FINAL [S7] bench string (delta applied — this is the new tooling contract):**

```
a Parisian Davioud public bench seen side-on in profile: three or four bold horizontal wooden slats forming the seat and the upright straight backrest, drawn flush against each other with only thin dividing outline strokes between them so they read as clear parallel horizontal lines with no open gaps or daylight visible between slats; a heavy ornate cast-iron end frame at each end with floral scrollwork legs, the scrollwork read as bold solid shapes rather than fine see-through openwork, visibly bulkier and heavier than the thin slats; the backrest standing straight and vertical, not curved or reclined, the whole bench resting directly on the pavement; a long low bench, much wider than it is tall, one continuous seat with no armrest dividers, comfortably inset with empty magenta margin on both ends, no part touching the canvas edge
```

**This FINAL [S7] string REPLACES the 2026-07-19 [S7] string as the tooling contract.**
`dev-tooling-assets` (stage 4) copies it **verbatim** into `levelArt.json`
`nearForegroundArt.types.bench.prompt`. Seed 6107, `size`, `asset` path and every other field
stay exactly as frozen. The other seven props carry **no delta** (I concur with the seven
no-delta confirmations — all rest on the boards' own "no delta" conclusions and informational
nuances below the bar to reopen a gated, seed-pinned prompt); stage 4 is a no-op for them.

### 3. Deferred item — backrest slat multiplicity — **DEFERRAL CONFIRMED**

**Decision: confirm the deferral. Do not touch the "slats forming the seat and the … backrest"
wording or the 3–4-slat cap on this pass.** `board-bench.md` rates this a **DIG**, not a
CONTRADICTED: the "backrest = single broad board per side" figure is textual-only, repeated
across sources of a shared lineage, and could not be cross-checked against a photograph this
session — and the board itself notes circulation photos suggest more visible board-lines than
"one slat" reads as. That is not strong enough evidence to reopen a gated, seed-pinned clause.
The stakes are low either way (at ~60–90 px a single-board back and a 1–2-line slatted back
both resolve to one dark horizontal band at the top of the bench), which makes burning a
re-gate cycle on it now disproportionate. Routed to `art-advisor` for a one-photo check; if
confirmed, `concept-artist` owns the backrest-only rewrite (seat keeps its multi-slat read) and
a fresh delta gate — a separate follow-up, not this pass. The single-vs-double-face ref-doc
correction (Claims audit item 5) forces no prompt change and only reinforces the camera verdict.

### What remains owed downstream (unchanged)

- **Asset gate — still owed on the [S7] bench PNG when generated.** This delta gate covers the
  prompt string only. On delivery I run the §2 law-3 AI-defect sweep on the keyed PNG on a
  contrasting ground (verify the flush-slats / solid-scrollwork hardening left no pink pocket
  and no defect the white ground hid). Not covered here.
- **Composite gate — N/A for the bench, unchanged for the trafficLight.** The bench carries no
  runtime-composed visual (grey décor, no neon rim), so Gate 4 does not apply to it. The
  trafficLight lit-lens + halo overlay remains the open Gate-4 composite matter (judged on real
  in-game screenshots against §2.1 « un halo est un dégradé, jamais un aplat », ped anchors
  tuned there) — no change from the 2026-07-19 flag.
- **Generation still blocked** on the unset `POLLINATIONS_TOKEN` repo secret; this PASS updates
  the contract for when the token lands, it does not trigger a run. Iteration budget unchanged
  (2 batches per set this cycle before options escalate to Bertrand).

— Nico, DELTA GATE — camera audit COUNTERSIGNED (8/8), [S7] bench delta PASS, slat-multiplicity
DEFERRAL CONFIRMED

---

## Bertrand-directed revision v2 (concept-artist, 2026-07-20)

Maud, authoring the new prompt strings for six props from **Bertrand's DIRECTED art
changes** on the freshly generated PNGs (`public/assets/nearfg/*.png`, branch
`claude/rue-propos-pipelines-revision-r4g52z`). These are Bertrand verdicts and **override
prior gate decisions where they conflict** — I note each override at the clause where it
happens and do NOT relitigate them. One variable changed per directive against the current
gate-final strings; every keying/legibility hardening clause the earlier gate earned is
carried through untouched unless the directive itself displaces it. Assembled prompt is
still `opening` + this per-kind `prompt` + shared `style` tail (both family-locked, unedited).

`bench_front.png` and `parkingMeter_front.png` are **preserved assets** (already copied) for
a future far-side-of-road layer — no prompt entries here; that is a separate future story.

### Camera-constraint override (directives 1 & 2)

`story-road-props-reference-revision.md` binds props to their **road-facing side** (face
toward the roadway/camera). Directives 1 (bench) and 2 (parkingMeter) **override that for the
near-foreground copies**: Bertrand wants the FOREGROUND bench and horodateur seen **from
behind**. Spatially coherent — these two sit on the camera's own (near) pavement, oriented so
a sitter/user faces the street, so the camera sees their backs; the preserved front versions
(`*_front.png`) go on the facade-side kerb across the road, where the road-facing front reads
toward camera per the original constraint. Override noted; the other six-prop camera verdicts
(8/8 CONFORME) stand.

---

**[R1] bench — regenerate from BEHIND** (seed 6107).
Directive (verbatim): « Tourne le banc à 180° de manière à ce qu'on le voit de dos. Place
celui de dos en premier plan. Garde cette version pour le mettre de l'autre coté de la
route ». [Turn the bench 180° so we see it from behind. Put the back-view one in the
foreground. Keep this (front) version for the other side of the road.]

Clause-level changes (vs the 2026-07-19/-20 delta-gate FINAL):

- Opening framing `seen side-on in profile` → `seen from directly behind, the straight
vertical backrest turned toward the viewer and filling the view, the seat hidden behind
the backrest` — the 180° turn. **Overrides** the road-facing-side camera clause for this
  near copy (see override note above).
- The slats now form the **backrest only** (the seat plane is hidden behind it), so `forming
the seat and the upright straight backrest` → `forming the upright straight backrest`.
- `one continuous seat` → `one continuous backrest` (the seat is no longer the visible
  surface).
- KEPT verbatim: straight-vertical backrest (delta-gate fidelity fix), flush-slats +
  thin-dividing-strokes keying clause, three-or-four-slat readability cap, solid-scrollwork
  cast-iron end frames (still visible flanking the back), resting-on-pavement, both-ends
  edge-inset margin.

PROPOSED FINAL:

```
a Parisian Davioud public bench seen from directly behind, the straight vertical backrest turned toward the viewer and filling the view, the seat hidden behind the backrest: three or four bold horizontal wooden slats forming the upright straight backrest, drawn flush against each other with only thin dividing outline strokes between them so they read as clear parallel horizontal lines with no open gaps or daylight visible between slats; a heavy ornate cast-iron end frame at each end with floral scrollwork legs, the scrollwork read as bold solid shapes rather than fine see-through openwork, visibly bulkier and heavier than the thin slats; the backrest standing straight and vertical, not curved or reclined, the whole bench resting directly on the pavement; a long low bench, much wider than it is tall, one continuous backrest with no armrest dividers, comfortably inset with empty magenta margin on both ends, no part touching the canvas edge
```

Keying/readability: rear view is keying-SAFER than the front — the backrest is one closed
slab flanked by solid end frames, flush-slats clause keeps inter-slat gaps closed (no
enclosed magenta); no dark-uniform clause to regress; both-ends inset holds on the widest
canvas (1.7).

---

**[R2] parkingMeter — regenerate from BEHIND** (seed 6101).
Directive (verbatim): « [même] » [same — seen from behind]. Bertrand: the back of the head =
plain sheet-metal back panel, no screen/slots; keep the slanted rain-cap read from behind,
thin mast.

Clause-level changes (vs the gate-final S1):

- `standing tall:` → `standing tall, seen from behind:` — the 180° turn. **Overrides** the
  road-facing-front camera clause for this near copy.
- The whole operative-face clause `on the head's road-facing front a small dark blank
recessed rectangular screen … coin slot … ticket-delivery slot … ventilation grooves shown
as indented surface ridges` → `the head's back face turned toward the viewer as a plain
blank flat sheet-metal panel with nothing on it, broken only by a faint vertical hinge seam
down one side and a small flush lock plate, no screen and no slots on this rear face`. The
  back genuinely shows none of the front furniture; the hinge seam + lock plate are the only
  honest back-of-cabinet tells, drawn as surface lines (not cut-through → no un-keyed
  hairlines, same discipline as the retired vent-groove edit).
- `whole top face is a single steeply slanted rain-cap wedge` → `… rain-cap wedge sloping
away from the viewer` (the cap read from behind).
- KEPT: slim-pole-thinner-than-head ratio, bulky boxy head, angular sheet-metal hard edges,
  taller-than-wide.

PROPOSED FINAL:

```
a 1990s Parisian pay-and-display parking machine standing tall, seen from behind: a slim steel pole clearly much thinner than the head, topped by a bulky rectangular boxy head whose whole top face is a single steeply slanted rain-cap wedge sloping away from the viewer; the head's back face turned toward the viewer as a plain blank flat sheet-metal panel with nothing on it, broken only by a faint vertical hinge seam down one side and a small flush lock plate, no screen and no slots on this rear face; angular sheet-metal casing, hard straight edges, distinctly taller than it is wide
```

Keying/readability: blank rear panel = no interior gaps, no enclosed magenta; hinge/lock are
surface lines only. Mid-grey sheet-metal head + three-tone tail carry rim; no dark-uniform
clause to regress. The now-plain head loses the screen/slot contrast that used to break up
the mass — the slanted cap + hinge seam are the only silhouette breakers, adequate at the
0.5 canvas.

---

**[R3] streetSign — plate reads "PARIS" + a graffiti tag** (seed 6108).
Directive (verbatim): « Inscrit: PARIS. Et rajoute un tag ». [Write: PARIS. And add a tag.]

**EXPLICIT no-text-law OVERRIDE:** this is a Bertrand-directed exception to the house no-text
law for **this prop only**. The word PARIS is the ONLY legible text; the tag is an illegible
spray scrawl (no readable letters). Clause changes (vs gate-final S8):

- Removed `its face completely blank and empty with nothing written on it` and the trailing
  `plain and empty` — those directly contradict the directive (this is the override).
- Added the PARIS clause: `across the centre of the plate the single word PARIS spelled out
in bold clean white uppercase capital letters, large and clearly legible, this one word
PARIS being the only readable text anywhere` — emphatic and self-limiting so it does not
  invite a second street-name line.
- Added the tag clause: `sprayed across one corner of the plate an illegible looping graffiti
tag, a tangle of curving spray-paint strokes forming no readable letters, kept clear of the
plate edge` — scrawl, not letters; kept off the edge per Bertrand's note.
- KEPT: landscape-rectangle silhouette anchor, bold single keyline border, single slender
  post + splayed foot, post-attaches-behind (no through-hole), single flat plane.

PROPOSED FINAL:

```
a Parisian enamel street-name plaque mounted on a single thin post: a wide landscape rectangular flat plate, clearly wider than it is tall, bordered by a bold single raised keyline border running just inside the edge; across the centre of the plate the single word PARIS spelled out in bold clean white uppercase capital letters, large and clearly legible, this one word PARIS being the only readable text anywhere; sprayed across one corner of the plate an illegible looping graffiti tag, a tangle of curving spray-paint strokes forming no readable letters, kept clear of the plate edge; one slender post, much thinner than the plate, rising from below into the centre of the plate and planted on a small splayed foot on the pavement, the post attaching behind the plate with no visible gap or hole through it; a single flat plane, not a boxy double-sided sign
```

Keying/readability: the tag sits ON the opaque plate and is held off the plate edge → no
bridge to the magenta ground, no enclosed pocket. **RISK — flagged to lead-art (mechanical
conflict I cannot resolve in my lane):** the shared family-locked `style` tail still ends
with the six-way no-text kill (`no text, no letters, no numbers, no logo, no writing, no
signature`) and it is the LAST word of the assembled prompt, so it directly fights the PARIS
instruction (which lives earlier, in the subject). The subject is worded as forcefully as I
can, but if PARIS fails to render, the fix is structural (a streetSign-specific `style`
override, owned by dev-tooling-assets) — not a subject reword I can do alone. Second, lower
risk: white letters on the light enamel plate are low-contrast in greyscale; the black glyph
outline from the house ink style should carry them, verify at the asset gate.

---

**[R4] trafficLight — bigger + wider gap between the two heads** (seed 6104).
Directive (verbatim): « Fais le plus grand et ajoute de l'espace entre les deux feux ».
[Make it bigger and add space between the two lights.]

Clause changes (vs gate-final S4):

- Added scale: `the signal drawn large to fill most of the frame height`; vehicle head
  `a tall boxy vehicle signal head` → `a big tall boxy vehicle signal head`.
- Head gap: `Lower down a smaller pedestrian signal head` → `Well below it, separated by a
long clearly bare stretch of empty mast, a smaller pedestrian signal head` — the directed
  bare-mast gap.
- Road-side margin: `generous empty magenta margin on the road side so the visor tip stays
fully clear` → `just enough empty magenta margin on the road side that the visor tip stays
fully clear` — honours "bigger / less empty margin" while **keeping** the clause that
  protects the keyer and the render-side lens anchors from a frame-crop (the earlier gate's
  load-bearing fix; not dropped).
- KEPT verbatim: strict-profile vehicle head, three edge-on lens slivers under tunnel
  hood-visors, face-on ped head with two blank windows, dead/unlit/no-glow/no-colour
  dead-housing law, grey visor-lip/mast highlight, splayed-foot mast.

PROPOSED FINAL:

```
a French road traffic signal on a slim round mast with a splayed foot, seen from the side at street level, the signal drawn large to fill most of the frame height. High on the mast a big tall boxy vehicle signal head turned in strict side profile: three round lenses stacked vertically, each tucked under a curved tunnel hood-visor that juts sideways toward the road, the lens discs seen edge-on as narrow dark slivers, all dead and unlit. Well below it, separated by a long clearly bare stretch of empty mast, a smaller pedestrian signal head turned to face the viewer head-on: two blank dark round lens windows stacked vertically, both dead and unlit. Both heads cantilevered from the mast on short brackets. Every lens dark, matte and switched off, no glow and no colour; boxy hooded metal housings, dark uniform finish, a light grey highlight along the visor lips and mast edge to keep the housing legible against a dark night backdrop, with just enough empty magenta margin on the road side that the visor tip stays fully clear of the frame edge
```

Keying/readability: mast/head gaps stay open to background (edge-connected, key clean); the
retained road-side margin protects the visor tip from a frame-crop even as the signal grows.
**Note (not a prompt matter):** the render-side lens anchors (`lenses` block) must be
re-tuned to the new bigger heads + wider gap after regen — orchestrator pixel-scan, tuned at
the composite gate, NOT baked here.

---

**[R5] lamppost — bigger + LIT lantern** (seed 6102).
Directive (verbatim): « Fais le plus grand et allume le ». [Make it bigger and light it up.]

Clause changes (vs gate-final S2):

- Added scale: `drawn large to fill most of the frame`.
- Lit lantern: the lantern clause gains `every pane glowing bright pale near-white as if the
lamp is lit from within, a soft narrow pale halo hugging close around the lantern and
staying fully clear of the frame edges`. Per Bertrand: the pipeline luma-desaturates, so
  "lit" = brightness, not colour → near-white panes + soft bright halo. The real glow is a
  **render-side light/shader story pm is opening**; the sprite carries only the lit-lantern
  READ. **This inverts the earlier keying rationale** for the lantern from "dark panes" to
  "bright panes" — but it KEEPS `solid opaque panels with no open lattice or see-through
gaps` (the enclosed-magenta guard is orthogonal to pane brightness).
- Scoped the dark clause: `dark uniform painted finish` → `dark uniform painted finish on the
base, shaft and arm` so the ironwork stays dark while the panes read lit (no self-conflict).
- KEPT: fluted flaring base, tapering fluted shaft, S-swan-neck arm, faceted lantern +
  pointed cap, solid-opaque panels, shaft lit-side grey highlight.

PROPOSED FINAL:

```
a tall cast-iron Haussmann-era Parisian street lamp drawn large to fill most of the frame: a fluted base flaring out at the foot, a slender fluted shaft tapering as it rises, a single curved S-shaped swan-neck arm sweeping outward near the very top, ending in a faceted many-sided polygonal lantern with a small pointed cap, the lantern's facets solid opaque panels with no open lattice or see-through gaps, every pane glowing bright pale near-white as if the lamp is lit from within, a soft narrow pale halo hugging close around the lantern and staying fully clear of the frame edges; ornamental antique cast-iron, elegant and slender, dark uniform painted finish on the base, shaft and arm, a paler grey highlight edge along the shaft's lit side to keep the silhouette legible against a dark night backdrop
```

Keying/readability: bright panes IMPROVE legibility of the lantern (was the dark-mass top of
the sprite). **RISK — flagged to lead-art asset gate:** the soft halo blends near-white →
magenta at its outer edge, and that transition band is exactly where the flood-fill keyer
gets ambiguous (a pink fringe or a ragged halo edge). Mitigated by `hugging close` (small
halo) + `staying fully clear of the frame edges` (keeper edge-seeds never touch it) — verify
no pink fringe on the keyed PNG; if it fringes, tighten the halo to zero and let the
render-side shader own all the glow.

---

**[R6] wallaceFountain — add a prominent socle** (seed 6103).
Directive (verbatim): « Ajoute un socle ». [Add a base/plinth.]

Clause changes (vs gate-final S3):

- Added the socle at the base: `raised on a prominent stepped stone plinth: a broad low socle
of two or three stacked rectangular stone steps at the very bottom, clearly wider than the
fountain body and reading plainly as a solid stone base, fully inside the frame with empty
margin on either side`. Wider-than-body, clearly a socle, per directive.
- Adjusted the profile description to match: the old `pinched narrow at the base` read is now
  preceded by the wider socle, so `the silhouette pinched narrow at the base, widest at
mid-height` → `the silhouette widest at the stone base, pinched narrower at the pedestal,
widening again at mid-height where the four figures stand`.
- Extended the dark/highlight clause: `dark uniform patinated finish` → `dark uniform
patinated finish with the stone base a lighter stone grey` (tonal separation of the new
  socle, keeps it legible + reads as stone vs the iron body).
- KEPT: fused-caryatid closed silhouette (the enclosed-magenta guard), rounded-bump dome,
  octagonal pedestal, squat-wider-than-lamp scale, dome/body-edge grey highlight.

PROPOSED FINAL:

```
a Wallace drinking fountain, a compact cast-iron monument raised on a prominent stepped stone plinth: a broad low socle of two or three stacked rectangular stone steps at the very bottom, clearly wider than the fountain body and reading plainly as a solid stone base, fully inside the frame with empty margin on either side, above it an octagonal pedestal, four caryatid figures fused into one continuous closed silhouette around the centre, only surface linework separating each figure with no open gaps between them or under their raised arms, the arms supporting a domed pointed cap with a few small rounded bumps studding the dome; the silhouette widest at the stone base, pinched narrower at the pedestal, widening again at mid-height where the four figures stand, then tapering up to the pointed dome; modest and squat, clearly wider and lower than a street lamp, dark uniform patinated finish with the stone base a lighter stone grey, a lighter grey highlight along the dome and body edges to separate the silhouette from the dark street
```

Keying/readability: the stepped socle is solid stone (no gaps → no enclosed magenta); the
`fully inside the frame with empty margin on either side` clause keeps the now-widest element
off the side edges on the 0.55 portrait canvas. Lighter-stone-grey base = no dark-on-dark
regression; fused-caryatid guard untouched.

---

### Unchanged props

- **bollard** (seed 6105) — no directive, UNTOUCHED; gate-final S5 string stands.
- **scooter** (seed 6106) — no directive, UNTOUCHED; gate-final S6 string stands.

### Hand-off

Six PROPOSED FINAL strings above for the **lead-art gate** (Nico). On PASS, dev-tooling-assets
copies them verbatim into `levelArt.json` `nearForegroundArt.types.{bench,parkingMeter,
streetSign,trafficLight,lamppost,wallaceFountain}.prompt` (seeds/size/asset unchanged) and the
trafficLight `lenses` anchors get re-tuned to the bigger heads post-regen. Two risk flags for
the gate: **[R3] streetSign** — the family-locked tail's no-text kill mechanically fights the
directed PARIS text (may need a streetSign-specific `style` override, above my lane); **[R5]
lamppost** — the lit-halo/magenta blend is a keyer fringe risk (asset-gate check).

— Maud, Bertrand-directed revision v2

---

### Lead-art v2 gate (Nico, 2026-07-20)

Gate on the six Bertrand-directed v2 strings above (§ "Bertrand-directed revision v2").
Scope of THIS gate = **craft only**: Bertrand's directives are his authority and are NOT
gateable — I check keying safety, readability at game size, family consistency (§2 law 2),
coherence of each full assembled string, C1 grey-décor, silhouette identity, and that each
documented override is **scoped no wider than directed**. Gated against `docs/art-direction.md`
§1–§3, §2.1, §8.1, C1, the shared family-locked `opening`/`style` tail (both unedited — good),
and the preserved-front-twin split. The v1 asset gate PASSED 8/8 (handoff §7); the two
untouched props (bollard S5, scooter S6) keep their gate-final strings and are out of scope.

**Verdict: 6/6 through — 3 PASS clean ([R1] [R2] [R4]), 3 PASS-with-tightening ([R3] [R5]
[R6], FINAL strings below).** No re-draft ask; no directive contested.

#### Ruling on the three risk flags

**Flag 1 — [R3] family-locked no-text tail vs directed PARIS (structural). RULING: ship
as-worded for batch 1; do NOT demand the tail override now.** The shared `style` tail's
six-way no-text kill is family-locked (§2 law 2) and byte-identical across all 8 props;
carving a streetSign-specific tail is a permanent family-consistency cost and a last resort,
not a pre-emptive move. Against the instruction-adherent gptimage model the subject's PARIS
clause is **specific, early (higher weight), and self-limiting** ("the only readable text
anywhere"), pitted against a **generic** "no text" in the weakest tail-attention zone —
specific-and-early has a real chance of winning, and the only way to know is one roll.
**Contingency (asset-gate-triggered):** if the keyed PNG shows a blank plate (PARIS
suppressed), escalate to a **streetSign-ONLY** `style` override owned by dev-tooling-assets
that drops **only** the six no-text tokens and keeps every other tail byte identical — the
minimum possible family deviation, and legitimate solely because Bertrand explicitly exempted
this one prop from the no-text law. That deviation stays scoped to streetSign; no other prop's
tail moves. Costs at most one batch to learn; family consistency is preserved by default.

**Flag 2 — [R5] lit-lantern halo vs keyer fringe. RULING: do NOT accept the baked halo —
tighten it out (reflected in the [R5] FINAL below).** A baked halo blending near-white →
magenta #FF3CDC is a documented failure zone for this flood-fill keyer (pink fringe ring, or
the keyer eats a ragged edge and turns the falloff into an aplat). "Accept-with-asset-gate-
check" defers a gamble; I close it at source. The **sprite carries only the bright near-white
lit panes** — that satisfies Bertrand's « allume le » as BRIGHTNESS (C1-safe, survives the
luma-desat, keys clean because the panes sit inside the solid opaque lantern frame and never
touch the ground). The atmospheric **halo is render-side** (the light/shader story pm is
opening), exactly where §2.1's dégradé-jamais-un-aplat law gates it on in-game screenshots —
and this is the same ADR-0011 discipline that moved the vehicle rim render-side precisely
because a baked glow fouled the body and the keyer. Stripping the baked halo does not weaken
the directive: lit panes read as "lit" on their own, and the halo lands properly when the
shader ships. **Loi-du-glow note:** a lamppost is décor, yet it now emits pale light — this is
NOT a breach of « ce qui brille est interactif ». That law reserves the four **accent neon
hues** as the interactivity signal; a near-white lit lantern carries no accent hue, so it
reads as a light source (§8.1 "lit-window" vocabulary), not as an interactive-neon rim. I log
this as the governing read (bible was thin on "décor that is itself lit"): **pale/near-white
lit décor is a value/light read; only accent-hue neon signals interactive.**

**Flag 3 — [R4] lens/ped anchor re-tune. ACKNOWLEDGED — orchestrator/render-lane matter, no
prompt change.** The bigger heads + wider bare-mast gap move the geometry the `lenses` block
pins to; those anchors get re-tuned to the regenerated PNG and are judged at the composite
gate (Gate 4) against §2.1, not baked here. Concur with Maud.

#### Per-string verdicts

**[R1] bench — regenerate from behind — PASS (clean)** (seed 6107). Davioud back still reads
Davioud: the identifying pair survives the 180° turn — **horizontal slats** (backrest) + the
**floral-scrollwork cast-iron end frames** flanking them are both explicitly visible from
behind. Distinct from the preserved side-profile front twin (back = a long slatted slab
between two end frames; front = an L-profile with the seat). Keying is SAFER than the front
(one closed backrest slab, flush-slats clause intact → no enclosed magenta; both-ends inset
holds on the 1.7 canvas). C1 grey, no colour. Override = camera-only, scoped to the near copy;
front preserved for the far kerb. Coherent — no leftover seat-visible wording. Through.

**[R2] parkingMeter — regenerate from behind — PASS (clean)** (seed 6101). Horodateur back
still reads horodateur: **rain-cap wedge** (now "sloping away from the viewer") + **slim mast
clearly thinner than the head** + boxy angular head all kept — the silhouette is intact from
behind (as it must be: front/back are two views of one object). Distinct from the front twin
by face treatment (front = screen + coin/ticket slots; back = blank sheet-metal panel, hinge
seam + flush lock plate as surface lines). Keying clean (hinge/lock are surface lines, not
cut-through → no un-keyed hairlines; blank panel = no interior gaps). C1 grey sheet-metal,
three-tone tail carries the rim, no dark-uniform regression. Override = camera-only, scoped.
**Watch-item for the asset gate (not a fail):** the now-plain rear head loses the screen/slot
contrast that broke up the mass — verify the slanted cap + hinge seam keep the head from
reading as a featureless grey block at size. Through.

**[R3] streetSign — PARIS + tag — PASS-with-tightening** (seed 6108). The override is scoped
correctly (only PARIS legible; tag is illegible scrawl; "only readable text anywhere"
self-limits against a second line; tag sits on the opaque plate, off the edge → no keying
bridge, no enclosed pocket; a graffiti tag is on-world for §1). **Tightening (readability, my
jurisdiction — Bertrand directed the WORD, not its colour):** white letters on a light enamel
plate are the low-contrast greyscale trap Maud flagged. I change the glyphs to **black** —
dark ink on the light plate is maximum greyscale contrast and is exactly the house black-ink
language, removing the gamble on the keyer/model consistently outlining interior white glyphs.
C1 holds (mono throughout). Flag-1 ruling governs the tail conflict (ship as-worded, contingent
streetSign-only override on failure).

FINAL [R3]:

```
a Parisian enamel street-name plaque mounted on a single thin post: a wide landscape rectangular flat plate, clearly wider than it is tall, bordered by a bold single raised keyline border running just inside the edge; across the centre of the plate the single word PARIS spelled out in bold clean black uppercase capital letters, large and clearly legible, this one word PARIS being the only readable text anywhere; sprayed across one corner of the plate an illegible looping graffiti tag, a tangle of curving spray-paint strokes forming no readable letters, kept clear of the plate edge; one slender post, much thinner than the plate, rising from below into the centre of the plate and planted on a small splayed foot on the pavement, the post attaching behind the plate with no visible gap or hole through it; a single flat plane, not a boxy double-sided sign
```

**[R4] trafficLight — bigger + wider gap — PASS (clean)** (seed 6104). Scale + gap only, no
camera/C1 override. Correctly HONOURS "bigger / less empty" (margin softened "generous" →
"just enough") while **keeping** the load-bearing road-side anti-crop clause that protects the
visor tip and the render-side lens anchors on the narrowest canvas (0.44) — the right craft
call, not dropped. Mast/head gaps stay open to background (edge-connected, keys clean).
Dead-housing law + grey highlight kept; lit lens stays render-side (C1 holds, no colour baked).
Coherent. Flag-3 anchor re-tune acknowledged. Through.

**[R5] lamppost — bigger + lit — PASS-with-tightening** (seed 6102). Directive satisfied as
BRIGHTNESS (near-white panes), C1 luma-desat stays on, solid-opaque-panel enclosed-magenta
guard KEPT, dark clause correctly scoped to base/shaft/arm. **Tightening per Flag-2 ruling:
the baked halo clause is removed** — the sprite carries only the lit panes; the halo is
render-side (§2.1-gated at Gate 4, ADR-0011 discipline). This eliminates the near-white→magenta
keyer-fringe risk at source. Override scoped no wider than "light it up."

FINAL [R5]:

```
a tall cast-iron Haussmann-era Parisian street lamp drawn large to fill most of the frame: a fluted base flaring out at the foot, a slender fluted shaft tapering as it rises, a single curved S-shaped swan-neck arm sweeping outward near the very top, ending in a faceted many-sided polygonal lantern with a small pointed cap, the lantern's facets solid opaque panels with no open lattice or see-through gaps, every pane glowing bright pale near-white as if the lamp is lit from within; ornamental antique cast-iron, elegant and slender, dark uniform painted finish on the base, shaft and arm, a paler grey highlight edge along the shaft's lit side to keep the silhouette legible against a dark night backdrop
```

**[R6] wallaceFountain — add socle — PASS-with-tightening** (seed 6103). Socle is keying-safe
(solid stone, no gaps → no enclosed magenta), edge-clip-protected on the 0.55 portrait canvas
("fully inside the frame with empty margin on either side"), the fused-caryatid closed-silhouette
guard is untouched, and the lighter-stone-grey base gives tonal separation without breaking C1.
**Tightening (silhouette-first, my jurisdiction — verifying "the socle doesn't break the
hourglass read"):** as authored the socle was "clearly wider than the fountain body" and "widest
at the stone base," which makes the plinth the single widest element and flattens the Wallace
hourglass into a bottom-heavy wedge — the caryatid ring is the identifying headline and must
stay the visual widest. I ground the socle as a **prominent broad plinth the fountain stands on**
without letting it out-widen the figures, and restore the **caryatid ring as the widest swell**
(pinch-at-pedestal → widest-at-figures → taper preserved). This is also more reference-true
(a real Wallace sits on a step roughly its base width, not a dominating platform). Directive
("ajoute un socle") fully honoured — a prominent stepped stone socle is added; it just no longer
upstages the fountain it bases. Fused-caryatid guard, rounded-bump dome, grey highlights all KEPT.

FINAL [R6]:

```
a Wallace drinking fountain, a compact cast-iron monument raised on a prominent stepped stone plinth: a broad low socle of two or three stacked rectangular stone steps at the very bottom, clearly wider than the pinched pedestal it stands on and reading plainly as a solid stone base, fully inside the frame with empty margin on either side, above it an octagonal pedestal, four caryatid figures fused into one continuous closed silhouette around the centre, only surface linework separating each figure with no open gaps between them or under their raised arms, the arms supporting a domed pointed cap with a few small rounded bumps studding the dome; the silhouette broad at the stone base, pinching in at the pedestal, then swelling to its widest at mid-height where the four caryatid figures stand, then tapering up to the pointed dome; modest and squat, clearly wider and lower than a street lamp, dark uniform patinated finish with the stone base a lighter stone grey, a lighter grey highlight along the dome and body edges to separate the silhouette from the dark street
```

#### C1 grey confirmation (all six)

C1 holds everywhere: R1/R2 grey sheet-metal & wood, R3 mono plate + **black** glyphs + grey
tag, R4 dark housing + grey highlight (lit lens render-side only), R5 near-white panes are
**brightness not colour** (luma-desat stays on) + dark iron + grey highlight, R6 dark patina +
lighter-stone-grey socle + grey highlights. No accent-hue neon baked into any of the six.

#### Closing — tooling contract

**The FINAL v2 strings above become the tooling contract for `levelArt.json`
`nearForegroundArt.types`:** `bench` ([R1] as-authored), `parkingMeter` ([R2] as-authored),
`streetSign` (**[R3] FINAL**, black glyphs), `trafficLight` ([R4] as-authored), `lamppost`
(**[R5] FINAL**, no baked halo), `wallaceFountain` (**[R6] FINAL**, grounded socle).
dev-tooling-assets copies each **verbatim** into the matching `.prompt`; seeds 6101–6104/6107,
`size`, `asset` paths and the shared `opening`/`style` tail stay exactly as frozen. **`bollard`
(6105) and `scooter` (6106) are UNCHANGED** — no directive, gate-final S5/S6 stand.

Still owed downstream (unchanged by this prompt gate): the §2-law-3 **asset gate** on every
keyed PNG on a contrasting ground (verify no pink pocket / defect the white ground hid — R2
plain-head legibility, R3 PARIS actually rendered + letter contrast, R5 lit panes key clean
with no residual fringe); the trafficLight **composite gate** (Gate 4) on the lit-lens+halo
overlay AND the R5 lamppost render-side halo, both against §2.1; the Flag-1 contingency
(streetSign-only tail override) fires only if the asset gate shows PARIS suppressed. Iteration
budget unchanged: 2 batches per set this cycle before options escalate to Bertrand.

— Nico, LEAD-ART v2 GATE — 6/6 through (3 PASS, 3 PASS-with-tightening)

## Bertrand-directed live iteration v3 (2026-07-20, orchestrator-applied)

Live art direction from Bertrand on the v2 renders, applied directly to `levelArt.json`
(lead-art gates at the asset gate on the regenerated PNGs — live-directed pass, same
authority chain as v2):

1. **trafficLight** (verbatim): « le feu tricolore. Il faut vraiment le fait plus grand et
   plus d'espace entre le deux feux. Deux la distance qu'il y a entre le feu piéton et le
   sol. Du coup le feu tricolore est beaucoup plus grand ». Applied: (a) prompt recomposed —
   the bare-mast gap between the vehicle head and the ped head is now described as about
   TWICE the mast run left between the ped head and the ground, signal fills the whole frame
   height; (b) render-side `TRAFFIC_LIGHT_H_FRAC` raised 0.6 → 0.8 (the in-game size was
   cap-bound, not sprite-bound — this extends the ADR-0047 directed non-occlusion exception,
   same law, bigger allowance); (c) `lenses` anchors re-tuned after regen (orchestrator
   pixel-scan, composite gate).
2. **lamppost** (verbatim): « Le réverbère; fait le plus grand, rajoute deux fois ce que
   j'ai ajouté en saisie d'écran » (screenshot = a slice of bare shaft). Applied: (a) prompt —
   exceptionally long bare fluted shaft, lantern held high, signal fills the frame height;
   (b) `NEAR_KIND_SPECS.lamppost.heightFrac` 0.44 → 0.62 and `MAX_PROP_WORLD_H` 3.4 → 4.5 so
   the taller lamp is not silently clamped (band cap `nearForegroundBandTop` untouched — the
   window non-occlusion law still clamps if the band is lower).

Golden baselines: Stalingrad/Vitry regenerated after the v2 art landed (deliberate art
change, `UPDATE_GOLDEN=1`, eyeballed); they will be regenerated once more after this v3
feu/réverbère regen — accepted churn of a live-direction session.

## Belliard ground kontext refine (concept-artist, 2026-07-20)

Bertrand rejected the hand-recomposed Belliard ground (`public/assets/levels/belliard/ground.png`)
— « grossier, flou, ça fait tache avec le reste » (smudgy white wet-reflection blobs, coarse
render). Repair path = one kontext img2img roll (`gen-from-reference.yml`, ADR-0044,
`--family levels`, `enhance=false`) conditioned on the committed composition reference
`references/belliard-ground-bands-ref.png` (1024×256; output downscaled to 940×85 for
supersampled crispness). kontext nudges the reference toward the description, so the prompt
describes the **target rendering** — the band layout is held; the wet-blob failure mode is
named to be edited out. Sent **verbatim**.

**Prompt (verbatim, enhancer OFF):**

```
Fine crisp Paris street ground texture, keep the reference band layout exactly: thin light pavement strip across the top, wide dark asphalt roadway in the middle, thin light pavement strip along the bottom, thin crisp kerbstone lines between the bands. Night asphalt in clean near-black greys with subtle fine grain, no bright white smudges, no blurry pale blotches, no large wet highlight puddles, at most faint small dim reflections. Pavement strips are flat-on Paris paving slabs with thin sharp joint lines, no perspective convergence, same slab rhythm on top and bottom strips. Photocopy ink-grey monochrome, no colour, seamless horizontal tiling.
```

**Seed:** `7301`

**Rationale (one line per clause):**

- `Fine crisp Paris street ground texture` → sets the register the whole edit serves — the
  opposite of the rejected "grossier/flou"; period+place anchor kept minimal.
- `keep the reference band layout exactly: thin light pavement strip across the top, wide dark
asphalt roadway in the middle, thin light pavement strip along the bottom, thin crisp
kerbstone lines between the bands` → pins the four bands + kerb lines of the ref so kontext
  refines the RENDER, not the COMPOSITION (top ~9% / road / bottom ~16% / kerb edges held).
- `Night asphalt in clean near-black greys with subtle fine grain` → the positive target for
  the roadway: dark, clean, finely grained — replaces the blotchy wet look with tight tonal
  value.
- `no bright white smudges, no blurry pale blotches, no large wet highlight puddles` → names
  the exact rejected failure mode (kontext is an edit model — stating what to remove is
  load-bearing here, unlike open-canvas FLUX); kills the smeared white reflections directly.
- `at most faint small dim reflections` → does not forbid wet-street reflection outright (period
  truth — a wet 18e chaussée does glint), only caps it to small/dim so it never dominates.
- `Pavement strips are flat-on Paris paving slabs with thin sharp joint lines` → the trottoir
  bands read as crisp Decaux-era slabs, not a soft grey wash; sharp joints = the "fine" Bertrand
  asked for.
- `no perspective convergence` → the strips stay orthographic flat-on (the ground tiles as a
  band; converging joints would break the tile and fight the profile camera).
- `same slab rhythm on top and bottom strips` → top and bottom pavement read as one material
  at one scale, so the narrower bottom strip matches the top's slab cadence.
- `Photocopy ink-grey monochrome, no colour` → the Belliard crade-documentaire B&W register
  (art-culture.md § Belliard), coherent with the adjacent `troncon-a.png` ink/wash greys — no
  colour to key or clash.
- `seamless horizontal tiling` → the ground repeats side-by-side along the street; edges must
  not seam.

**Gate note:** `gen-from-reference.yml` is exploratory and carries **no** style/word gate
(no `check-art-prompts` on this roll — it is not a manifest `nearForeground`/`vehicles` entry).
**lead-art gates the RESULT at the asset gate** (live-directed pass, same authority chain as the
Belliard v2/v3 iterations above): the produced 940×85 PNG is judged in-scene under `troncon-a`,
not the prompt. Iterate on FAIL within the batch cap.
