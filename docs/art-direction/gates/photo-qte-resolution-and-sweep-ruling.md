# RULING — pixel resolutions + le balayage de phares (set-piece `photoQte`, Belliard)

Nico (`lead-art`), 2026-08-02. **Blocking ruling, art authority.** Closes Ben's **D1**
(`docs/perf-budget.md` §9.2, "the sizing question nobody asked") and rules on the headlight
sweep flagged in §9.6bis. Answers Serge's **[S1]**, **[S3]**, **[S4]** with a unit instead of
an adjective.

Read: `docs/perf-budget.md` §9 (whole), `docs/game-design/spec-photo-qte-paparazzi.md`
§2.2, §2.5, §3.2-3.3, §4.4, `docs/art-direction/prompt-drafts/photo-qte-setpiece-graphiste-notes.md`,
`docs/art-direction.md` §2.1 / §3.

---

## 0. The error I have to correct before I can decide anything

Ben's worst case ("subject ~6 su wide ⇒ usable viewfinder 6.5–13.3 su ⇒ **15×**") reads the
Commandant's box as **width-dominant**. It is not: `commandant_wait` is `6.00 × 13.50 su`
(4:9), far more portrait than the 16:9 viewfinder, so `fill = h / V.h` and the viewfinder it
implies is `V.h = 13.5 / fill` ⇒ **`V.w = 24 / fill` = 26–53 su**, not 6.5–13.3. The number is
wrong, but the finding is right and it is worse than he thought, because it lands on a
**different asset**:

| Instant               | Box (su)        | Dominant axis | `V.w` at `FILL_MAX 0.92` | `V.w` at `FILL_MIN 0.45` |
| --------------------- | --------------- | ------------- | ------------------------ | ------------------------ |
| A `commandant_wait`   | 6.00 × 13.50    | height        | 26.1 su                  | 53.3 su                  |
| B `pair_facing`       | 24.00 × 13.50   | either (16:9) | 26.1 su                  | 53.3 su                  |
| C `exchange_close`    | 17.00 × 9.56    | either (16:9) | 18.5 su                  | 37.8 su                  |
| **D `berline_plate`** | **7.50 × 4.22** | either (16:9) | **8.15 su**              | 16.7 su                  |

**The tightest legal framing in the whole set-piece is D, at 8.15 su of plate across the
screen** — 12 % of the plate's width filling the frame. That is the number the plate has to
survive, and it confirms Serge's [S3] instinct: `berline_plate` is the asset that fails first.

And it exposes the fact that settles everything below:

> **The subject's screen footprint is `fill × the screen's dominant axis` — 45 % to 92 % of
> the frame — and it does NOT depend on the box's size in su.** Every one of the four poses is
> displayed across the _same_ 864–1766 screen px (desktop, dpr 1). A pose sprite's pixel budget
> is therefore a function of the SCREEN, never of its world size.

That single line is the unit Serge asked for in [S3], and it is why the family can be authored
coherently at all.

---

## 1. DECISION — resolutions

Reference render targets, **CSS px at dpr 1** (`perf-budget.md` §2): desktop **1920×1080**,
mobile **844×390**. At dpr 2 the browser doubles everything; on a xerox halftone an integer 2×
is an honest toner enlargement and stays in family — I accept it explicitly, it is not a
degradation.

### 1.1 The décor plate — **2048 × 1152** (desktop and mobile alike, one asset)

`= 20.48 px/su`. Resident RGBA8 **9.44 MB**. This is Ben's option **B**, and the tier fork
below is what buys it.

| Framing                    | Plate px on screen | Magnification (nearest) |
| -------------------------- | ------------------ | ----------------------- |
| A/B widest (`V.w` 53.3 su) | 1092 → 1920        | **1.76×**               |
| A/B tightest (26.1 su)     | 535 → 1920         | 3.6×                    |
| C tightest (18.5 su)       | 379 → 1920         | 5.1×                    |
| **D tightest (8.15 su)**   | 167 → 1920         | **11.5×**               |

**REJECTED — 1280×768 (option A).** At 12.8 px/su the _establishing_ and `pair_facing`
framings — the two where the plate **is** the picture, 53.3 su and 26.1 su wide, and where the
player spends the first 35 of 60 seconds — sit at 2.8× and 5.7×. A 6-screen-px toner block on
the frame that has to establish "rue Belliard, une bouche de passage, 1998" is not house
style, it is a broken image. The plate carries the whole sense of place; I will not buy 5.5 MB
with it.

**REJECTED — 4096 (option C).** Fails B10 mobile by 2.7×, and buys sharpness at 11.5× on the
one framing where, per §1.3 below, nothing in the plate is allowed to matter. It is the trap
Ben named; I am not walking into it.

**REJECTED — option D.** Not a serious option, as stated.

### 1.2 The four pose sprites — **1024 px on the dominant axis** (desktop), **512** (mobile)

This is Ben's lever, used. The rule, in the unit derived in §0:

> **RULE — poses are authored 1:1 at `FILL_MIN`.** A pose sprite's dominant axis carries
> `FILL_MIN × the reference render target's dominant axis` source pixels, rounded up to the
> next power of two. It is therefore **1:1 at the widest legal framing and ≤ 2.05× at the
> tightest** — a magnification the halftone absorbs as a doubled dot, which is literally what
> a photocopy of a photocopy does.

`0.45 × 1920 = 864 → 1024`. `0.45 × 844 = 380 → 512`.

| Asset             | Box (su)      | Desktop PNG                   | Mobile PNG | px/su (desktop) | Desktop VRAM |
| ----------------- | ------------- | ----------------------------- | ---------- | --------------- | ------------ |
| `commandant_wait` | 6.00 × 13.50  | **456 × 1024** (pad 512×1024) | 256 × 512  | 170             | 2.10 MB      |
| `pair_facing`     | 24.00 × 13.50 | **1024 × 576**                | 512 × 288  | 42.7            | 2.36 MB      |
| `exchange_close`  | 17.00 × 9.56  | **1024 × 576**                | 512 × 288  | 60.2            | 2.36 MB      |
| `berline_plate`   | 7.50 × 4.22   | **1024 × 576**                | 512 × 288  | 136.5           | 2.36 MB      |
|                   |               |                               |            |                 | **9.18 MB**  |

Yes — `berline_plate` is authored **6.7× denser than the plate it sits on**, and
`commandant_wait` 8.3×. That is the decision, not a side effect. The player scrutinises the
subject for 60 s; the wall behind it is a place, not evidence. It also **retro-solves [S1]**:
`exchange_close` at 1024 px across 864 screen px means the two faces get ~200 px of head each
at `FILL_MIN` instead of Ben's ~83 source px for the whole frame. Serge's silhouette-level
clause stays required anyway — density buys legibility, it does not buy composition.

### 1.3 The rule that makes 11.5× on the plate acceptable — and it is a new bible rule

> **RÈGLE (nouvelle, §art-direction) — LA PLATE NE PORTE AUCUNE PREUVE.** Beyond ~5× apparent
> magnification, a décor plate carries **no load-bearing detail**: no character, no glyph, no
> element the player must read, count or identify. Everything the mechanic tests, stamps or
> asks the player to recognise lives either in a **pose sprite** (authored per §1.2) or in a
> **runtime composite**. A plate that must stay legible at the tightest legal framing is a
> plate that has been asked to do a sprite's job.

Two things fall out of it, both already wanted:

- The **registration characters** composited render-side (Serge [S4]) stop being a FLUX
  workaround and become **the correct construction**: at 11.5× the plate cannot carry glyphs,
  the sprite and the overlay can. [S4]'s degradation pass (quantise to the halftone's value
  steps, jitter the edge) is **mandatory**, not optional — I gate it at the composite gate.
- `SUBJECT_BOX_TOLERANCE = 0.40 su` = **8.2 plate px** at 20.48 px/su. `check-photo-subject-boxes.mjs`
  measures opaque AABBs **on the pose PNGs**, in the pose's own px/su — 0.40 su is 68 px on
  `commandant_wait`, 55 px on `berline_plate`. **Write the per-asset px/su into `levelArt.json`
  alongside the box**, or the checker's tolerance silently changes meaning per asset. That was
  Ben's warning and it survives the fork; it just now has four numbers instead of one.

### 1.4 Halftone dot pitch — the answer to [S3], in the right unit

> **RULE — the dot pitch is authored in APPARENT SCREEN PIXELS at the asset's own `FILL_MIN`
> framing, and the whole family targets a 6–8 screen-px dot.**

Concretely, for the prompt/post pass: **6–8 px in the delivered PNG for the four poses**
(1:1 at `FILL_MIN`), **4 px in the 2048-wide plate PNG** (which magnifies 1.76× at the
establishing framing ⇒ 7 screen px). One family, one apparent grain, three canvas sizes —
which is exactly what Serge asked for and what a copy-pasted "coarse halftone toner dots"
across four different su sizes could never deliver.

### 1.5 The contact sheet — **no new raster asset. 0 MB.**

Ben's §9.4 is right that the sheet is DOM, and **wrong on one point I have to catch**: six
`background-position` crops of the plate alone would show six pictures of a **wall with no one
in them**. A contact print that omits the subject is a lie about the photograph the player
took, and it destroys the verdict surface (§4.4) it exists to serve.

Ruling: each thumbnail is **two DOM layers** — the plate `<img>` cropped by
`background-position`/`background-size` from the stored UV rect, plus the corresponding pose
`<img>` positioned by the **same** rect. Both bitmaps are already decoded and already resident;
this is **zero added VRAM, zero draw calls, zero readback**, and it keeps Ben's B10 result
intact while telling the truth. Thumbnails render at **≤ 256 px on the long edge**, 6 up.

**Forbidden, explicitly:** (a) any canvas readback (`toDataURL`/`readPixels`) to "make the
thumbnails match" — Ben's hitch, confirmed, and it lands on the reward beat; (b) any
pre-rendered full-sheet background bitmap. The sheet dressing — perforated film-strip edge,
frame numbers, verdict stamps — is **CSS/SVG on the print tokens**, and the stamps stay
shape-carried (loop / tick / cross), never tone-carried.

### 1.6 The bill

|             | Plate | Poses | Total resident | vs `street-wide.png` (30.55 MB)            | B10                  |
| ----------- | ----- | ----- | -------------- | ------------------------------------------ | -------------------- |
| **desktop** | 9.44  | 9.18  | **18.62 MB**   | 61 % of one texture Belliard already holds | PASS                 |
| **mobile**  | 9.44  | 2.30  | **11.74 MB**   | 38 %                                       | PASS (73 % of 16 MB) |

Mobile is comfortable enough that I decline the further plate downgrade it would allow
(1280 on mobile would land the whole set-piece at 6 MB): **one plate asset, one download, one
manifest entry** is worth more than 5.7 MB of mobile headroom I do not need — a second plate
resolution is a second thing to keep in family across two generation runs, and family
consistency is a bible clause. The pose fork costs nothing in family terms: same PNG,
downsampled by the pipeline, never re-generated.

Wire cost: four halftone PNGs + one plate compress hard; expect **+2–4 MB** against the
30.42 MB / 54-asset Belliard roster — **+8 to +13 %** of one loading bar, once per session.
That is the honest price and it is small. I **support** Ben's D2 first-run skip
(`enabledOnFirstRun: false` ⇒ don't ship what is never drawn) but it is a boundary call, not
mine.

---

## 2. DECISION — le balayage de phares

**Baking it into the plate: REFUSED.** The sweep is the **only** element permitted to project
`inCover` (D-J / R3-2). A static tell is not a tell; baking it converts the set-piece's only
readable cover signal into wallpaper and hands the player a 60 s guessing game. Ben named the
consequence himself and asked me to rule in full knowledge — I am: this one is not tradeable.

**A full-screen additive quad: REFUSED — and not for perf reasons.**

> **LOI DU GLOW, §2.1 — « ce qui brille est interactif ».** The passage mouth is décor. An
> additive luminous layer over décor is the bible's central prohibition, not a budget
> question. Ben's B5 breach and my FAIL land on the same object for two independent reasons,
> which is usually how you know the shape is wrong.

**RULING — the sweep is a luminance remap of the plate, in the plate's own fragment shader.**

- A soft-edged band moving in the plate's **UV space**, phase driven by one uniform fed from
  `sceneClock`. Fully **animated**, so it keeps its tell function intact.
- It **lifts the plate's local value toward paper-white** — it does not add a second blended
  layer. Zero added blended coverage (B5 **untouched**), zero added draw call, no new material
  ⇒ no new program beyond the plate's own, which is warmed at the loading gate anyway (Ben's
  C2). Cost: one `float` uniform per frame.
- This is also the **truthful** rendering: a photocopier does not glow, it blows out. Headlights
  crossing a xerox surface burn the toner away. Additive haze would have been a photoreal
  effect smuggled into a fanzine — the exact failure mode the bible §3 exists to prevent.

**Falloff — §2.1 « un halo est un dégradé, jamais un aplat », in the house idiom.** The band's
falloff is expressed as a **moving threshold on the halftone**: the toner dots shrink
progressively toward the band's core and grow back at its edges. A dithered gradient is how a
photocopy renders a gradient — it satisfies the no-aplat clause natively, and a hard-edged
white band is an automatic FAIL here exactly as a binary-alpha rim was under ADR-0011.

Ben's option (a), scoping the quad to the passage-mouth rect, is **superseded** — and note it
would not have worked: at the D framing (`V.w` 8.15 su) the mouth rect covers more than the
whole screen, so the "scoped" quad is a full-screen quad precisely when the budget is tightest.

**COMPOSITE GATE — NOT PASSED, and it cannot be until I see it.** This is a runtime-composed
visual: no asset-gate PASS covers it. I need **in-game screenshots** (via `verify`) at three
framings — establishing (`V.w` 53.3 su), `exchange_close` tightest (18.5 su), `berline_plate`
tightest (8.15 su) — with the sweep at band-core, band-edge and absent. I verdict on those.
Until then the sweep ships behind nothing and merges through nothing.

---

## 3. What the lanes owe, from this ruling

| Owner                | Item                                                                                                                                                                             |
| -------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `concept-artist`     | Author the four pose prompts at the §1.2 canvas sizes; dot pitch per §1.4 (6–8 px in the PNG for poses, 4 px for the plate). Do **not** put readable glyphs in the plate (§1.3). |
| `dev-tooling-assets` | Per-asset `pxPerSu` in `levelArt.json` next to each box (§1.3); mobile pose variants by **pipeline downsample**, never a second generation run (§1.6).                           |
| `dev-r3f-render`     | Sweep as a plate-shader luminance remap (§2), never an additive quad. Contact sheet two-layer DOM (§1.5), no readback. Plate-character overlay with the [S4] degradation pass.   |
| `lead-art` (me)      | Composite gate on the sweep + the plate-character overlay, on real screenshots, before merge.                                                                                    |

**Verdict: DECIDED. Generation is unblocked** on §1.2 canvas sizes. The sweep is decided in
principle and **open at the composite gate**.

Signé — Nico, `lead-art`.
