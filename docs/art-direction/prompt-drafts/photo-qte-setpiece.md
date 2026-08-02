# Prompt drafts — `photoQte` set-piece (QTE photo paparazzi, hôte Belliard)

Maud (`concept-artist`), 2026-08-02 — **REV.1, WRITTEN to `levelArt.json` (`photoQte` block)**
under the write authorisation of the prompt gate
([`../gates/photo-qte-setpiece-prompt-gate.md`](../gates/photo-qte-setpiece-prompt-gate.md) §6,
Nico, CONDITIONAL PASS). Rework **R1/R2** and edits **E1/E2/E3** applied verbatim, plus Serge's
pre-prod points **S1/S2/S3** ([`./photo-qte-setpiece-graphiste-notes.md`](./photo-qte-setpiece-graphiste-notes.md)).
Rev.0 (the drafted strings this gate read) is the previous git revision of this file.
Gated against the E-6 packet at **7 constraints** (techplan §11.5, spec paparazzi §10.5, fiction §6).

## Rev.1 changelog — what changed after the gate, and why

| #   | Where                             | Change                                                                                                                                                                                                                                                                                                                                                                      |
| --- | --------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| R1  | shared `opening` + `style`        | `one subject centred` → `the whole subject group centred`; `alone on a flat uniform bright magenta #FF3CDC field filling every gap` → `on a flat uniform bright magenta #FF3CDC field filling every gap and every space between the shapes`. Three of four cut-outs are GROUPS; the front-loaded slot was instructing FLUX to draw one thing. Applied verbatim as dictated. |
| R2  | `sheet`                           | appended `, the whole sheet floating alone with every surrounding margin the same flat uniform bright magenta #FF3CDC field` — the outer ground was undeclared, so the keyer would have shipped a sheet welded to a rectangle of garbage.                                                                                                                                   |
| E1  | `commandant_wait`                 | `twice as tall as wide` → `well over twice as tall as wide` (2:1 was fighting the 4:9 = 2.25:1 frame; two aspect instructions, the weaker wins at random).                                                                                                                                                                                                                  |
| E2  | `pair_facing`                     | the saloon now carries `berline_plate`'s three tokens — `flat boot lid, rectangular tail lamps at the corners, straight chrome bumper` — so the car seen twice, 20 s apart, reads as ONE car.                                                                                                                                                                               |
| E3  | `berline_plate`                   | `blank pale face` → `its face one flat clean pale rectangle, smooth and free of toner` — a halftoned face would fight the runtime-composited characters at 251 mm.                                                                                                                                                                                                          |
| S1  | `exchange_close`                  | the read moved OFF line detail onto silhouette blocks: `two large dark head shapes … held apart by a clear gap of bare magenta`. At `FILL_MIN = 0.45` facial linework is noise; shape count is what survives — the same trick the verdict stamps already use.                                                                                                               |
| S2  | `exchange_close`                  | the envelope gained `a visibly thick paper edge`: a knife-edge pale shape against the key is the textbook fringe-eaten object. Flagged as a `retouch-sprites.mjs` candidate by construction, not "maybe".                                                                                                                                                                   |
| S3  | `exchange_close`, `berline_plate` | per-box pitch clause `toner dots large and sparse` on the two smallest/hardest boxes only. The shared `style` stays **verbatim** across the 7 cut-outs (bible §3.9, gate's explicit condition) — the calibration lives in the per-asset subject, where per-asset variation is legal.                                                                                        |
| —   | all 7 assembled                   | re-trimmed to **≤ 120 words** (109 / 119 / 120 / 119 / 86 / 84 / 83). R1 alone cost +7 words on every prompt; per the gate's own §6 note, the budget was bought back by **cutting subject words**, never by adding ground words.                                                                                                                                            |

**Three points of Serge's that are NOT prompt changes** and are routed, not absorbed:
**S4** (composited plate characters must get a degradation pass — quantized to the halftone's
value steps, anchored in the sprite's local coordinates so they inherit the K6→K8 translation)
→ `dev-tooling-assets` + `dev-r3f-render`, judged at Nico's composite gate C-P3/C-P4.
**S5** (a 19.2 s frozen bitmap may read as a hang) → ship static, watch at playtest; if it needs
a fix it goes in the **plate** or the viewfinder sway, never in the sprite — both carry zero
AABB contract. **S6** — no action, noted.

Sources read: `docs/game-design/techplan-photo-qte.md` §6 Lane C + §11.5 ·
`docs/game-design/spec-photo-qte-paparazzi.md` §2.5 (table des 9 keyframes) + §10.5 ·
`docs/game-design/spec-photo-qte-fiction.md` §2, §3, §6 · `docs/art-direction.md` §3-4 ·
`src/game/levels/levelArt.json` (`levels[belliard]`, `boss`, `nearForegroundArt`).

---

## 0. Structural decisions the prompts encode (for the gate, before the strings)

1. **The plate carries NO actor and NO car.** The 9 keyframe boxes are checked in CI
   against the _delivered sprite's_ opaque AABB (`check-photo-subject-boxes.mjs`). A
   figure baked into the plate has no AABB the script can read, and a plate-baked
   berline cannot be translated flat across `[53.0 ; 55.9]`. So: plate = décor only;
   subject = 4 keyed cut-outs composited over it. This is what makes E-6(3) checkable
   at all.
2. **ONE berline sprite serves K6, K7 and K8** — translated horizontally by the render,
   never re-scaled and never re-drawn. E-6(5) `cy` constant and E-6(6) `w × h` constant
   then hold **by construction** over the whole interval, not by an artist's steady hand.
   Interval-mode sampling can only pass.
3. **The two hold poses (K2→K3, 19.2 s ; K4→K5, 14.7 s) are STATIC single-frame
   sprites** — no idle flipbook. E-6(4) asks for non-drifting; the cheapest guarantee of
   zero drift is zero frames. The prompts still describe _settled_ postures (feet planted,
   arms against the body) so that, if a future pass ever adds an idle, the silhouette has
   no limb parked outside the AABB waiting to swing out.
4. **The subject prompts carry no glow vocabulary at all** (E-6(2)/F-4): no rim, no halo,
   no neon, no `neon` field on this family. Readability is carried by **tone contrast**
   (dark commandant vs pale overcoat vs the pure-black passage) — exactly the read the
   fiction §2.2 buys for free in B&W.
5. **No stamp or sheet element borrows a dial/needle/meter face** (T-4). The three verdicts
   are told by **stroke shape** (loop / tick / cross), so they are grayscale-distinguishable
   without a single tonal cue — which also satisfies §10.5(4) at zero cost.
6. **Nothing in the plate encodes cover state** (prohibition R3-2/N-1): the traffic light is
   drawn as an unlit iron mast plus one plain static pool of light — scenery and a light
   source. The vehicle-packet headlights are **not in the plate**; they are a render-side
   sweep, so the only cover tell stays the authorised one.

## 1. Plate — dedicated telephoto view (self-contained, no chroma key, opaque 16:9)

```
Photocopied punk fanzine xerox illustration, rough black ink linework, coarse halftone
toner dots, high-contrast black and white: a plunging night view down a narrow 1998 Paris
street from a rooftop dormer. A dark roadway band across the bottom sixth. Right of centre
a tall vertical slot between two buildings, the deepest solid pure-black shape in the
picture, rising past the first floor, closed tagged roller shutters either side. Frame-left
in amorce a bakery shopfront under a scalloped awning, fascia a blank painted panel. A
slender cast-iron traffic-light mast on the pavement just left of the slot, hooded lamp
spilling one pale pool across the mouth. Haussmann facades with wrought-iron balconies
converge away up both sides, windows shuttered dark.
```

118 words · 0 negation.

| Clause                                                | What it earns                                                                                                                                                                                                                       |
| ----------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `Photocopied punk fanzine xerox … black and white`    | House medium front-loaded (bible §3.2/§3.4); also the positive kill of photoreal.                                                                                                                                                   |
| `plunging night view … from a rooftop dormer`         | The lucarne POV of fiction §2.1 — the 60-70 m diagonal that justifies the 300 mm.                                                                                                                                                   |
| `dark roadway band across the bottom sixth`           | Ground line `y = 6.0` of 56.25 su (spec §2.5 table) placed as a proportion, not a number.                                                                                                                                           |
| `tall vertical slot … deepest solid pure-black`       | The passage as a **volume**, and §10.5's read-level ask: the mouth is the darkest value, so the pale overcoat reads at 132 mm in photocopy. Placed right-of-centre = plate `x ≈ 58–74`.                                             |
| `closed tagged roller shutters either side`           | Continuity token #1 with `street-wide.png` (E-6(7)).                                                                                                                                                                                |
| `Frame-left in amorce a bakery shopfront … awning`    | Continuity token #2 — the BOULANGERIE at `x_norm 0,340`, in amorce as the fiction stages it.                                                                                                                                        |
| `fascia a blank painted panel`                        | Positive way to get a signless shopfront: FLUX writes garbage letters when asked for a sign, and refuses "no text" as an instruction. The word BOULANGERIE, if wanted, is a render/UI overlay decision — flagged, not decided here. |
| `slender cast-iron traffic-light mast … just left`    | Continuity token #3 — the feu at `x_norm 0,388`, the only tall prop, standing in front of the passage.                                                                                                                              |
| `hooded lamp spilling one pale pool across the mouth` | It **lights** the mouth (fiction §2.2) and stays scenery: one static pool, no lens colour, nothing readable — prohibition R3-2 honoured positively.                                                                                 |
| `Haussmann facades … windows shuttered dark`          | Continuity token #4 + it keeps the window band quiet so the eye falls into the slot.                                                                                                                                                |

**Generation method — VALIDATED at the gate (§4).** `kontext` img2img from a **committed** crop
of the shipped `assets/levels/belliard/street-wide.png` around `x_norm 0,30–0,45` (the crop is a
reference file with its path recorded here, so the plate is reproducible); opaque 16:9, no chroma
key, no `neon` field; pinned seed, `enhance=false`, `nologo`, `private`. **Fallback pre-authorised:**
`flux` on the same string and seed policy if kontext returns mush. **Cap: 2 batches** — past that,
options go to Bertrand, not more rolls. Asset-gate condition: the kontext pass must not inherit
garbled letters from the source crop — legible-looking gibberish on the fascia is a FAIL.

## 2. Pose family — shared slots

**`opening`** (20 words, R1 applied)

```
Flat 2D fanzine sprite, orthographic projection, long-telephoto compression, the whole subject
group centred, whole silhouette touching all four frame edges,
```

- `orthographic projection` + `long-telephoto compression` → flattens perspective, which is
  what keeps a drawn figure's AABB equal to its authored box instead of foreshortening out of it.
- `whole silhouette touching all four frame edges` → **the mechanical clause of the family**:
  it makes the opaque AABB equal the frame, so `size` (dev-tooling's field, set at the box's
  aspect) _is_ the box. Without it, a figure floating with margin fails E-6(3) at every keyframe.

**`style`** (43 words, R1 applied)

```
, photocopied fanzine xerox illustration, rough black ink linework, coarse halftone toner
dots, high-contrast black and white, flat ambient lighting, hard crisp cut-out edges, on a
flat uniform bright magenta #FF3CDC field filling every gap and every space between the
shapes, no text
```

- Verbatim-shared across all 7 cut-outs (bible §3.9) — the gate made that sharing an explicit
  condition, so S3's pitch calibration lives in the per-asset subjects instead (see changelog).
- `#FF3CDC` = the chroma key the cutout pipeline already keys on (`nearForegroundArt`,
  `levels[*].foreground`). No `neon` field on this family, by decision 4 above.
- `flat ambient lighting` = positive kill of cast shadow, which would leak outside the AABB.

### 2.1 `commandant_wait` — K0/K1 (box `6.00 × 13.50` su ⇒ **4:9**) · assembled 109 words

```
a tall bare-headed french police commander in a knee-length overcoat standing still, feet
planted flat side by side on one baseline, both arms hanging settled against the body,
shoulders square, coat straight and closed, head level: a narrow upright column well over
twice as tall as wide
```

- `bare-headed … knee-length overcoat` → the ratified Commandant silhouette, transcribed from
  the shipped `boss.commander_shielded` prompt (no new canon, no helmet).
- `feet planted flat side by side` / `arms hanging settled` / `coat straight and closed` →
  every limb inside the trunk column; nothing protrudes to widen the AABB.
- `a narrow upright column well over twice as tall as wide` (E1) → states the box's own
  proportion (13.50 / 6.00 = 2.25) as a shape, so FLUX composes to the aspect instead of the
  crop fixing it — and without contradicting it, which a flat `twice` did.
- Reading: he waits **in the dark of the passage mouth** — the darkness is the plate's job
  (decision 1), the sprite stays a clean cut-out.

### 2.2 `pair_facing` — K2/K3, HOLD 19.2 s (box `24.00 × 13.50` ⇒ **16:9**) · 119 words

```
two men in profile facing across a wide gap, feet flat on one baseline, arms settled against
the body: left a tall bare-headed commander in a dark long overcoat, right a shorter civilian,
pale overcoat; behind them a dark saloon's rear, flat boot lid, rectangular tail lamps at the
corners, straight chrome bumper, one front door open
```

- `across a wide gap` → fills a 16:9 box with two figures; without it FLUX packs them shoulder
  to shoulder and the AABB collapses to half the authored width.
- `on one common baseline` → the box bottom is a single line, so the AABB's `cy` is stable.
- `arms settled against their bodies` → the non-drift clause (E-6(4)); a gesturing arm is the
  one thing that can leave a 24 su box over 19.2 s.
- `dark … / pale overcoat` → the tonal read of fiction §2.2/§3.1; the client stays a **type**,
  never a face of cast (anonymat, fiction §3.1).
- `a dark saloon's rear, flat boot lid, rectangular tail lamps at the corners, straight chrome
bumper, one front door open` (E2) → instant 1 "l'ARRIVÉE" told by staging, inside the same
  cut-out so it counts in the same AABB; the three body tokens are `berline_plate`'s own, so the
  car seen twice reads as one car. Judged at the asset gate: same body, same lamp treatment,
  same line weight.

### 2.3 `exchange_close` — K4/K5, HOLD 14.7 s (box `17.00 × 9.56` ⇒ **16:9**) · 120 words

```
two large dark head shapes in three-quarter view spanning the frame width, cropped at the
collarbones, held apart by a clear gap of bare magenta: left short hair, right a pale overcoat
collar; below them two hands meet at centre passing a stiff pale envelope with a visibly thick
paper edge, wrists level; toner dots large and sparse
```

- The enumerated set of §2.5 K4 — `{Commandant's head, manteau-clair's head, both hands,
envelope}` — drawn as exactly those four things and nothing else, so drawn == box is
  auditable clause by clause.
- `spanning the frame width` + `cropped at the collarbones` + `wrists level` → the AABB is
  pinned on all four edges by named anatomy rather than by luck.
- `two large dark head shapes … held apart by a clear gap of bare magenta` (S1) → at the legal
  floor `FILL_MIN = 0.45` facial linework is noise; what survives is shape count and negative
  space, so the "two faces AND two hands" contract is carried by blocks of value, not features.
- `a stiff pale envelope with a visibly thick paper edge` (S2) → a knife-edge pale shape sitting
  on the key is the textbook fringe-eaten object; a few pixels of solid tone give the keyer its
  margin, and thicker stock reads more "official", which serves the fiction. It still reads as a
  _passed_ object at 132 mm — flat-on it would be a white rectangle and the proof would stop
  being an act. Retouch-pass candidate by construction.
- `toner dots large and sparse` (S3) → pitch calibrated on THIS box, one of the two smallest;
  a pitch that reads on the 24 su box dissolves to grey mush here at worst legal zoom.
- `three-quarter view` → the master proof needs **two faces**; strict profile would give one
  face and one back of a head, which is the picture that proves nothing (fiction §3.2 #2).

### 2.4 `berline_plate` — K6/K7/K8 (box `7.50 × 4.22` ⇒ **16:9**) · 119 words

```
a dark saloon's rear square-on, parallel to the picture plane, a low wide block filling the
frame, flat boot lid, rectangular tail lamps at the corners, straight chrome bumper below,
centred low a bright registration plate, crisp raised rim, its face one flat clean pale
rectangle, smooth and free of toner; toner dots elsewhere large and sparse
```

- `square-on and parallel to the picture plane` → **E-6(6) in the drawing itself**: a rear
  parallel to the plane cannot read as approaching, so the constant `7.50 × 4.22` is what the
  eye expects. Combined with decision 2 (one sprite, translated) the interval check is safe.
- `a low wide horizontal block filling the frame` → the 16:9 proportion as a volume; also the
  reason the reverse-out reads horizontal, matching `cy = 9.00` flat (E-6(5)).
- `the rear end … first thing to clear the mouth` (spec §2.5 check 3) → the plate faces the
  camera square, which is the only staging where the 300 mm read exists.
- `its face one flat clean pale rectangle, smooth and free of toner` (E3) → **deliberately
  blank, and deliberately untextured**: coarse dots on that face would fight the composited
  glyphs at 251 mm. FLUX
  cannot letter a 1998 French plate legibly at this size; garbled characters would break both
  period truth and the fiction's "on lit QUI paie". **RULED (gate §3.1):** characters composited
  render-side over the blank face, loot-crate precedent — decor ink only (no neon, no rim), the
  string/format/typeface from `art-advisor`, the composite must not move the AABB, and it lands
  in Nico's composite gate on a real 251 mm screenshot, not the asset gate.
- No headlight wash in the sprite: the packet's headlights are the render-side sweep
  (prohibition R3-2 authorises only them, and only as a live element).

## 3. Contact sheet (self-contained cut-out, 92 words, R2 applied)

```
Photocopied fanzine xerox illustration, high-contrast black and white, coarse halftone toner
dots: a blank photographic contact sheet flat and square to the viewer, a heavy black film
border framing six empty rectangular windows in two columns and three rows with equal black
gutters, a strip of square sprocket perforations down the outer edge of each column, the
inside of all six windows one flat uniform bright magenta #FF3CDC field, hard crisp edges,
flat ambient lighting, the whole sheet floating alone with every surrounding margin the same
flat uniform bright magenta #FF3CDC field
```

- `six empty rectangular windows in two columns and three rows` → the 2×3 grid of §4.4, as
  furniture only: the thumbnails are the player's own frames, composited at runtime.
- `inside of all six windows one flat uniform bright magenta field` → the six windows key out,
  which is the whole reason this asset is worth generating rather than drawing in CSS.
- `heavy black film border` + `sprocket perforations` → the 1998 argentique tell of fiction §6
  ("bords de perforation"), and the darkest frame on screen so the pasted thumbnails pop.
- `the whole sheet floating alone with every surrounding margin the same flat magenta field`
  (R2) → declares the ground OUTSIDE the sheet; without it the keyer ships a sheet welded to a
  rectangle of paper, desk or vignette.
- No dial, no scale, no meter face anywhere on the sheet (T-4). Per the gate's clarification
  this constrains THESE assets only — it does not forbid the HUD suspicion needle's dial form,
  which fiction §6 keeps; T-4 forbids presenting it as a light cell.

## 4. Verdict stamps (3 cut-outs, pose `opening` + `style`, 86 / 84 / 83 words assembled)

| Key            | Subject clause                                                                                                                                             |
| -------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `stamp_master` | `one closed hand-drawn oval loop of thick waxy black grease-pencil crayon, drawn large and hollow, with a blunt overshooting tail where the stroke closes` |
| `stamp_bonus`  | `one bold hand-drawn check stroke of thick waxy black grease-pencil crayon, a short down leg meeting a long rising leg, blunt ends`                        |
| `stamp_reject` | `two bold hand-drawn strokes of thick waxy black grease-pencil crayon crossing near their middles into a wide X, blunt overshooting ends`                  |

- **Loop / tick / cross** are three different _shapes_, so the three verdicts survive a
  grayscale capture (A6/A13) and a photocopy pass with zero tonal information — §10.5(4).
- `grease-pencil crayon … blunt overshooting` → the "croix au feutre gras" of fiction §6: a
  human hand marked this sheet, which is the whole editorial fiction of the surface.
- `hollow` on the master ring → it circles a thumbnail instead of covering it.
- The `rejectReason` (flou / hors cadre / trop large / trop serré / rien à voir) is **copy**,
  not art: it stays a text run beside the stamp. Lettering inside a FLUX cut-out would be
  garbage and would also make the stamp untranslatable.

## 5. Rejected variants (kept so they are not re-invented)

- **Plate with the actors and the berline baked in** — rejected: kills the CI AABB check
  (decision 1) and makes E-6(5)/(6) unassertable.
- **Three separate berline sprites for K6/K7/K8** — rejected: three drawings cannot hold
  `w × h` constant within 0.40 su, and it triples the interval-mode failure surface for zero
  motion gain.
- **2-frame idle flipbook on the hold poses** — rejected under E-6(4): any breathing loop is
  a drift budget nobody needs on a dead beat.
- **A neon rim on the subject to "make it findable"** — rejected under F-4: it would teach the
  shoot affordance on the one element the player must never shoot.
- **Traffic light drawn with a lit lens / a visible aspect** — rejected under R3-2: the plate
  would encode cover state.
- **Lettered BOULANGERIE fascia and a lettered number plate** — rejected as prompt content
  (FLUX lettering is garbage at this scale). Gate §3.2 then went further and rejected a
  render-side fascia overlay too: the plate **cites** the shipped décor, it does not enrich it,
  and crisp type 40 su from the passage would pull the eye off the black slot. Blank panel, full
  stop. Only the registration characters are composited (§3.1).

## 6. Hand-offs attached to this draft

- **`dev-tooling-assets`** — structure/ids/sizes/paths are yours. Required aspects:
  `commandant_wait` **4:9**; `pair_facing`, `exchange_close`, `berline_plate`, plate **16:9**.
  ONE `berline_plate` PNG referenced by K6, K7 and K8. Seeds to be allocated in the family's
  own range and pinned.
- **`art-advisor` (Estelle)** — 1998 French registration-plate format and the period bakery
  awning/fascia; asked, not assumed.
- **`lead-art` (Nico)** — prompt gate PASSED (conditional, §6 write authorisation used). Still
  owed: the **asset gate** on the 8 PNGs, and the **composite gate** on the runtime-composited
  registration characters (C-P3/C-P4) and the headlight sweep (R3-2 ii).
