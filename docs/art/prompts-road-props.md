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
