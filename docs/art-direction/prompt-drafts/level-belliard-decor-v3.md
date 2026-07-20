# Prompt drafts — Rue Belliard décor **v3** (N&B fanzine repair)

Craft rules per [`flux-prompt`](../../../.claude/skills/flux-prompt/SKILL.md); nothing
reaches `levelArt.json` without the `lead-art` PROMPT GATE. This draft **repairs** the
v2 set ([`level-belliard-decor-v2.md`](level-belliard-decor-v2.md)) against the lead-art
audit (B1–B4 + NIGHT ruling) and the art-advisor cadrage.

**Scope of this file:** prompt/style strings only, for `troncon-a`, `troncon-b` (with the
Deneux volume), `troncon-c`, and `sky`. No `levelArt.json` edit, no script edit — that is
`dev-tooling-assets` after the gate PASS. `foreground` / `ground` / `street` and `facade`
(legacy) are **out of scope** (script retouch, per the audit).

---

## 0. Why v2 failed, and how it was actually generated (root cause of B1)

The v2 tronçons were **not** produced by flux text-to-image as v2 §0 proposed. The
committed PNGs came out as **muted-colour, photo-real** immeubles — the tell of
`scripts/gen-from-reference.mjs` (**`kontext` img2img**) run with `--family levels`:

1. **kontext inherits the reference.** Conditioning on a colour photo of real Paris
   façades drags the roll toward photographic realism and the photo's own colour; a
   trailing "bold flat graphic-novel comic-book illustration, muted desaturated palette"
   clause is far too weak to overrule the pixels it is conditioned on.
2. **`--family levels` runs NO post-process.** `postProcess()` desaturates only
   `vehicles`; `levels` backdrops ship the raw roll. So unlike a vehicle sprite, **nothing
   downstream turns a level backdrop B&W** — the greyscale must be *baked by the prompt*
   and, crucially, *not fought by a colour reference image*.

**v3 workflow requirement (flag for `dev-tooling-assets`, not a prompt clause):** generate
this set with **flux text-to-image** (no photo reference), so the xerox register is carried
end-to-end by the words. If composition-locking via `kontext` is ever needed, condition off
a **B&W / xerox reference** (an accepted fanzine facade), *never a colour photo*, and add a
grayscale pass for the `levels` family. B1 cannot be closed by prompt words alone if the
generator keeps conditioning on colour photos.

Also fixed here: **B3** (`sky.png` never generated — blank white placeholder; §3 writes it),
**B4** (troncon-c melted rooftops / hashed chimneys — §1 roof clause blinds it), and the
NIGHT ruling (v2 read as bright daylight).

---

## 1. Shared style block (verbatim, byte-for-byte across the 3 tronçons) + shared front lead

The three tronçons are **one printing run** (bible §2 law 2). They carry **two shared
verbatim fragments** so the medium AND the two hardest-won fixes (B4 roofline, buildings-off-
the-edge margin) land in the highest-attention zone (bible §3.2 — FLUX over-weights the
front; v2 buried the medium in the tail, and the v3.0 draft made the same mistake with B4 +
margin — Serge [S1]). The style block then repeats/reinforces the register at the tail.

**Shared FRONT LEAD (verbatim, opens every tronçon subject):** carries B1 medium + B4
roof/chimney + the buildings-float margin [S1/S4/S8].

```
Black-and-white photocopied fanzine, high-contrast xerox halftone and black ink, flat frontal night elevation: bold crisp rooflines carrying two or three thick blocky chimneys per building, sharply silhouetted against a flat black night-sky field, the buildings floating clear of both frame edges behind an empty sky margin at least a tenth of the image width on each side, of
```

**Shared STYLE BLOCK (verbatim, appended to every tronçon subject):**

```
, drawn as a high-contrast black-and-white photocopied punk-fanzine illustration: thick black ink outlines, flat posterized value blocks on a pure greyscale ladder of near-black ink #141210, dominant deep-night wall grey #3A3E44 and rare bare-paper highlight #E9E3D2, no colour, deep night carried by heavy ink and dense shadow, grimy walls in fine sparse inked hatching kept subordinate to the bolder window and shutter lines, sharp cutout edges
```

**Mandatory hex value-ladder (was optional in v2 §1 — now REQUIRED, B1):** the three
anchors ARE the single value key (B2) — ink `#141210` (deep shadow, night-sky field,
chimney/roof silhouettes), dominant wall grey `#3A3E44` (deep-night storeys), bare paper
`#E9E3D2` (rare highlights: a lit pane, a moonlit roof edge). Every value in the set lives
on this ladder; nothing sits at daylight brightness. The tagged ground band is pinned as an
**interpolation** of two existing anchors — "midway between #3A3E44 and #E9E3D2" — so it stays
on the ladder without adding a fourth named anchor [S3].

Per-clause rationale (front lead + style block):

- `Black-and-white photocopied fanzine, high-contrast xerox halftone and black ink, flat
  frontal night elevation` → front-loads the **xerox B&W medium + night + flat elevation**
  into the top tokens, the single most important B1 fix (v2 had the medium only in the tail).
- `bold crisp rooflines carrying two or three thick blocky chimneys per building, sharply
  silhouetted against a flat black night-sky field` → **B4 blindage promoted to the front
  [S1]**, and now bounds **count + stroke weight** ("two or three thick blocky", not a dense
  huddle of thin stacks) — the two variables that decide whether it survives 800px→200px [S4].
- `the buildings floating clear of both frame edges behind an empty sky margin at least a tenth
  of the image width on each side` → the **buildings-only float promoted to the front [S1]**
  with a **measured minimum margin** so the region-mask cut always has clear sky to remove and
  no roll butts a wall to the edge [S8]; the flat black sky field is dark (not paper-white) so
  gaps never read as holes (art-advisor).
- `high-contrast black-and-white photocopied punk-fanzine illustration` (tail) → the house §1
  register restated at the tail (bible §3.1/§3.4): xerox is the law, replaces v2's
  colour-friendly "graphic-novel comic-book illustration, muted desaturated palette" (B1 cause).
- `thick black ink outlines, flat posterized value blocks, … xerox halftone … toner grain` →
  locks flat inked posterisation over photographic tonal gradients — the look kontext-from-
  photo could not hold.
- `pure greyscale ladder of near-black ink #141210, dominant deep-night wall grey #3A3E44 and
  rare bare-paper highlight #E9E3D2` → the **mandatory hex ladder**; binds the value key so the
  3 rolls read as one printing run (B1 + B2, bible §3.5).
- `no colour` → the one anti-colour clause (only negation of the set); the positive greyscale
  ladder does the rest.
- `deep night carried by heavy ink and dense shadow` → the NIGHT ruling in xerox grammar:
  night = ink density (positively phrased — no "brightness"/"not" for FLUX to trip on); keeps
  it from drifting back to daylight.
- `grimy walls in fine sparse inked hatching kept subordinate to the bolder window and shutter
  lines` → the D1 crade texture, but deliberately **quiet and subordinate** so it does not
  drown the window-frame/shutter dark-line density that `gen-window-zones.mjs` detects [S10].
- `sharp cutout edges` → clean silhouette edges for the region-mask cut (keying soundness).

Negation budget (assembled): **1** (`no colour`) — well within the ≤2 budget for A/B/C.

**Word budget [S1] — honest accounting.** Assembled totals are now **A 191 / B 248 / C 224**
words, down from v3.0's 291 / 364 / 299 (≈ −34 % / −32 % / −25 %). They still exceed the
90-target / 120-hard craft band (bible §3.3), and I want to be straight about why **sub-120 is
not reachable here**: the two *shared* fragments alone — the dual-anchored B&W register (B1,
front + tail), the front-loaded B4 roof/chimney (S4) and S8 margin, the 3-hex ladder (B2), and
the S10 hatching-subordination clause — are ~**115 words of gate-mandated content**, so the
assembled floor is ~130-140 even with a near-empty subject. The remaining per-tronçon length is
also mandated: the NIGHT window logic, the axis-1 tag taper, the S3 value anchor, and for B the
Deneux hommage that S2 requires *more* detail on, not less. Every further cut would drop a
ruling. So I optimized for **front-loading the blocking fixes + per-prompt minimalism** and flag
the residual overage to `lead-art` as a conscious craft trade. Per Serge [S13] the `levels`
family is **not** lint-gated on word count, so nothing downstream silently enforces 120 — but
this is a real FLUX-attention risk on the long tail, so the in-scene gate should watch B (the
248-word outlier) hardest for tail-clause drop-out.

---

## 2. Per-tronçon subject prompts + full ready-to-generate strings

Each full prompt = **front lead + subject + style block** (concatenated verbatim). The NIGHT
value logic (dark panes, a few bare-paper lit ones, the tagged band midway on the ladder,
tags dense at street level thinning fast to bare clean walls above) lives in each subject;
décor never glows (bible §2 law 1 — a lit pane is paper-white, never a warm emissive halo).

### Tronçon A — two buildings, one thin sky sliver

**Subject:**

```
two ordinary Paris 18e faubourg buildings of different widths and heights standing close, one thin strip of night sky between them, four to five storeys of tall shuttered french windows over simple balconies, most panes dark and a few faint bare-paper white, the ground-floor shopfront band a locked mid-grey midway in value between #3A3E44 and #E9E3D2, its densely hand-tagged roll-down shutters thinning fast to bare clean walls above
```

**Full string (ready to generate):** `«FRONT LEAD» + «two ordinary Paris 18e … bare clean
walls above» + «STYLE BLOCK»` (191 words assembled).

### Tronçon B — three buildings, the Deneux hommage volume + a bare mur-pignon

**Subject:**

```
a tight row of three ordinary Paris 18e faubourg buildings, the middle one a strikingly narrow four-storey façade on a tiny parcel, stepped out by shallow projecting bow-windows, its whole face a large bold motif of chunky squares and diamond lozenges each as big as a window pane, a dense dark value-trame one tone heavier than its neighbours, reading as a single dark band, topped by a flat roof-terrace against their zinc mansards, one wider gap showing a blank unbroken raw-brick mur-pignon gable in solid opaque wall grey near #3A3E44, plus one thin strip of night sky, the two taller flanking buildings with dark shuttered windows and hand-tagged ground-floor shutters at a locked mid-grey midway between #3A3E44 and #E9E3D2, thinning to bare clean walls above
```

**Full string:** front lead + this subject + style block (248 words assembled — the set's
outlier, see [S1] note; the in-scene gate should watch B's tail hardest).

Deneux-specific rationale (hommage, stylised not photoreal):

- `strikingly narrow four-storey façade on a tiny parcel` → the signature that reads at sprite
  size: a much finer bay than the R+4/R+5 neighbours (the real 185 rue Belliard is a minuscule
  parcel).
- `stepped out by shallow projecting bow-windows` → the Deneux bow-window rhythm, the second
  at-a-glance tell.
- `a large bold motif of chunky squares and diamond lozenges each as big as a window pane, a
  dense dark value-trame one tone heavier than its neighbours reading as a single dark band at
  a glance` → **[S2] fix**: the céramique parement is now an explicitly **large-unit** motif
  (each tile pane-sized, never fine), and the prompt states the **READ** ("a single dark band
  at a glance") not just the shape vocabulary — so it survives the downscale + xerox-halftone
  overlay instead of mushing to moiré. Pops *by value, never colour, never glow* (loi du glow).
- `topped by a flat roof-terrace against their zinc mansards` → the flat toit-terrasse vs.
  neighbouring zinc mansards, a clean silhouette contrast (also feeds B4 roof legibility).
- `a blank unbroken raw-brick mur-pignon gable in solid opaque wall grey near #3A3E44` →
  **[S9] + [S10] fix**: the residual-wall gap beat is pinned **opaque and anchored to the wall
  value** (`near #3A3E44`, distinct from the `#141210` sky field) so the region-mask never
  cuts it and `gen-window-zones` never scans it as sky; and it is `blank unbroken raw-brick`
  (the damaging word "soot-stained" is **dropped** [S10]) so no brick-coursing lines fake a
  window-row peak on a wall that has no windows.

### Tronçon C — two–three buildings, one narrow passage (B4-critical: rooftops were melting)

**Subject:**

```
a tight row of two to three ordinary Paris 18e faubourg buildings of different widths and heights, four to six storeys of tall shuttered french windows over simple balconies, most panes dark with a few faint bare-paper white, one narrow passage recess between two of them in solid opaque wall grey near #3A3E44 kept clearly above the ink-black sky value, one thin strip of night sky, a plain blank rectangular bar-tabac sign panel with a simple pictogram at street level, the densely hand-tagged ground-floor shutters thinning fast to bare clean walls above on a locked mid-grey midway between #3A3E44 and #E9E3D2
```

**Full string:** front lead + this subject + style block (224 words assembled).

Shared subject rationale (A/B/C; deltas noted):

- `ordinary Paris 18e faubourg buildings of different widths and heights` → art-advisor: banal
  faubourien 18e nord, irregular widths/heights R+4/R+5, not strict Haussmann.
- gap beats: `one thin strip of night sky` (A) · `mur-pignon gable … plus one thin strip of
  night sky` (B) · `one narrow passage recess … one thin strip of night sky` (C) → the three
  differ by gap beat (sliver / mur-pignon / passage). The **sky strips** are keyable void; the
  **mur-pignon and passage are opaque wall anchored to `#3A3E44`, kept clearly above the
  `#141210` sky value** so neither drifts to the keyable dark and gets wrongly cut or mis-
  scanned [S9].
- `tall shuttered french windows over simple balconies` → volets/persiennes + the balcony that
  the `ForegroundFrames` ironwork layer (ADR-0048) and `gen-window-zones` anchor to; the
  wrought-iron rail itself is that separate render layer, not baked here.
- `most panes dark and a few faint bare-paper white` → the NIGHT ruling: windows éteintes; the
  rare lit pane is **paper-white in the greyscale**, never a warm halo (loi du glow).
- `the ground-floor shopfront band a locked mid-grey midway in value between #3A3E44 and
  #E9E3D2` → **[S3] fix**: the tag band's value is now a **closed interpolation of two existing
  anchors**, not a floating "one step lighter" FLUX could drift — enough contrast for the tag
  lettering to read, still on the three-anchor ladder (B2).
- `densely hand-tagged … shutters thinning fast to bare clean walls above` → axis-1 density on
  the rideaux de fer (Paris Tonkar 1987–91), tapering **positively** to bare clean walls up top
  (Bertrand's "do not overload"); `hand-tagged` guards against anachronistic 2010s wildstyle.
- `a plain blank rectangular bar-tabac sign panel with a simple pictogram` (C) → art-advisor
  signature motif, terne (not neon); **[S7] fix**: a **blank panel + pictogram, no lettering
  described**, so FLUX cannot smear pseudo-text charabia onto an asset-gate crop.

Negation budget: A = 1, B = 1, C = 1 (all from the style block's `no colour`; subjects add
none — the mur-pignon/passage/bar-tabac are all phrased positively) — within ≤2.

---

## 3. `sky` prompt — v3 (B3: never generated; blank white placeholder today)

The `sky` is the **separate parallax layer** that shows through the tronçon gaps and above
the rooftops (ADR-0048). Rooftops now live in the tronçons, so the sky is **sky only** (v2's
"distant haussmann rooftops silhouette, full moon haze" is dropped). Must stay **dark** so
gaps never read as holes, carry the sodium halo as **value not colour**, and tile.

**Full prompt:**

```
Black-and-white photocopied fanzine night sky, a flat empty deep-night field seen straight on, dark toner-grey low along the bottom horizon fading up to near-black ink #141210 at the top, the low sodium-lamp horizon glow rendered purely as a slightly lighter grey value band and coarse halftone dots, only a very few sparse pale specks each large enough to read as a small dot, an even overcast haze, coarse xerox halftone and toner grain, high-contrast black-and-white, no colour, the whole field staying well below paper white, horizontally tileable seamless repeat
```

Per-clause rationale:

- `Black-and-white photocopied fanzine night sky` → same register as the tronçons (family
  consistency); front-loaded.
- `flat empty deep-night field seen straight on` → a plain parallax backing, no scene.
- `dark toner-grey low along the bottom horizon fading up to near-black ink #141210 at the
  top` → art-advisor: **zenith darker than horizon**; hex-anchored to the set's ink value.
- `low sodium-lamp horizon glow rendered purely as a slightly lighter grey value band and
  coarse halftone dots` → the 1998 orange sodium halo **translated to value** in the N&B gamut
  — no orange, no synthwave sky (art-advisor).
- `only a very few sparse pale specks each large enough to read as a small dot` → quasi pas
  d'étoiles, positively bounded (no dense starfield, no moon-logo); **[S6] fix**: each fleck is
  given a **minimum size** so it does not vanish to a sub-pixel on the thin parallax band.
- `an even overcast haze` → soft, no lune-logo.
- `coarse xerox halftone and toner grain, high-contrast black-and-white, no colour` → medium
  lock (the only negation).
- `the whole field staying well below paper white` → **B3 / art-advisor**: sky luminance below
  paper white so the gaps read as sky, not blown-out holes.
- `horizontally tileable seamless repeat` → tech requirement (see [S12]: FLUX has no true wrap-
  awareness, so `dev-tooling-assets` must add a script-side seam check / offset-and-blend pass;
  the smooth gradient + sparse specks make that cheap here).

Negation budget: **1** (`no colour`).

---

## 4. Technical constraints per asset (from the ADR-0048 pipeline)

**Tronçons (`troncon-a|b|c`):**

- **Buildings-only, floating.** Transparent L/R and above-roofline margins; buildings never
  touch the frame edge (the front-lead margin minimum — **≥ a tenth of the width per side**
  [S8] — guarantees the region-mask always has clear sky to remove). **No baked road / trottoir
  / kerb** — `ground.png` is the separate continuous strip (v2's "far-trottoir baked in the
  tronçon" clause is **retired**, per the audit).
- **Keying = region-mask cut** (above rooflines + inside the L/R margins), NOT a global
  near-black chroma-key — the deep-night walls (`#3A3E44`) must survive; the ink sky field is
  darker (`#141210`) and the `sharp cutout edges` give the region cut a clean silhouette. The
  **mur-pignon (B) and passage (C) are anchored to the wall value `#3A3E44`, clearly above the
  `#141210` sky**, so they read as opaque wall to both the keyer and `gen-window-zones`, never
  as void [S9] (`dev-tooling-assets` keying call, ADR-0048).
- **`gen-window-zones.mjs` is a downstream consumer, not just décor** (ADR-0048 §4): it snaps
  cop-pop windows + railing anchors off the painted dark-line density. So the shared hatching
  is kept **fine, sparse and subordinate** to the window/shutter lines [S10], and the pignon is
  **blank raw brick with no coursing/soot** [S10] — no false window-row peak on a blind wall.
- **Aspects must match the committed tiles** so the ADR-0048 world layout is unchanged:
  A `1.6491`, B `1.7857`, C `1.9224`, height fixed. Suggested working sizes (H = 1024):
  A ≈ **1688×1024**, B ≈ **1829×1024**, C ≈ **1969×1024**. If a winning composition shifts an
  aspect, `dev-tooling-assets` re-derives and updates `backdrop.tiles[*].aspect` (structure,
  not my lane).
- **B2 — one printing run.** Same pinned seed for all three, **byte-identical** front lead +
  style block, generated in **one dispatch**, and **gated as a set**: if any one roll's value
  key / light state / line weight diverges, the whole set FAILs (bible §2 law 2). *(Strongest
  option, a `dev-tooling-assets` call: generate a single wide master elevation on one seed and
  slice it at the gaps into A/B/C — guarantees an identical value key. Offered, not required —
  same-seed separate rolls satisfy B2 within the per-asset-prompt format.)*
- Generation path: **flux text-to-image**, `enhance=false`, `nologo=true`, `private=true`
  (bible §3.11). Not `gen-from-reference` off a colour photo (§0).

**`sky`:**

- **Opaque, full-bleed** (it is the backing layer — no keying, no transparency).
- **Horizontally tileable** and **dark** (luminance below paper white). Short-and-wide plane
  (e.g. ≈ 1024×256, aspect a `dev-tooling-assets` sizing call). Seam is a **script-side check /
  offset-and-blend** pass, not trusted to the prompt clause alone [S12].

---

## 5. Changements vs v2 (diff for the gate)

| Clause / asset | v2 | v3 | Why |
| --- | --- | --- | --- |
| Register | `bold flat graphic-novel comic-book illustration, muted desaturated palette` | `high-contrast black-and-white photocopied punk-fanzine illustration` + xerox halftone/ink | **B1** — the named colour cause replaced by an explicit N&B xerox register |
| Medium placement | tail only | **front lead + tail** (front-loaded) | B1 — FLUX over-weights the front; v2 buried the medium |
| B4 roofline + margin placement | (n/a) v3.0 buried them in the late tail | **promoted to the front lead** | **[S1]** — same dead-zone mistake as v2's medium, recreated for B4/margin |
| Prompt length (assembled) | v3.0: 291 / 364 / 299 words | 191 / 248 / 224 (subjects trimmed, B4/margin promoted to front) | **[S1]** — ~25-34 % cut; sub-120 unreachable (shared overhead ~115 mandated words), residual flagged, `levels` not lint-gated on words [S13] |
| Chimneys | v3.0 shape only (`sharp chimney pots`) | **count + weight** bounded (`two or three thick blocky chimneys per building`) | **[S4]** — population/stroke is what survives 800→200px, not shape alone |
| Hex anchors | optional (§1 note) | **mandatory** ladder `#141210 / #3A3E44 / #E9E3D2` | B1/B2 — single value key baked in |
| Tag-band value | v3.0 "one value step lighter" (unanchored) | **locked interpolation** "midway between #3A3E44 and #E9E3D2" | **[S3]** — closes FLUX drift on a set already failed for value drift |
| Deneux frieze | v3.0 "small squares dots and triangles" | **large-unit** "chunky squares and diamond lozenges each as big as a window pane" + the READ ("single dark band") | **[S2]** — "small" mushes to moiré at game size; the hommage's one signature detail |
| Mur-pignon / passage | v3.0 ambiguous (could drift to sky-dark) | **opaque, anchored to wall `#3A3E44`, clearly above `#141210`** | **[S9]** — opposite answers for the keyer vs the window detector resolved |
| Pignon texture | v3.0 "raw soot-stained brick" | **"blank unbroken raw-brick"** (soot dropped) | **[S10]** — soot/coursing fakes a window-row peak for `gen-window-zones` |
| Wall hatching | v3.0 "soot marks water streaks peeling render and hairline cracks" | **"fine sparse inked hatching kept subordinate to the bolder window and shutter lines"** | **[S10]** — decoration must not drown the detector's window-line signal |
| L/R margin | v3.0 "wide margins" (mood) | **"≥ a tenth of the image width on each side"** (measured) | **[S8]** — region-mask needs a guaranteed clear band; seam defect otherwise |
| Bar-tabac sign | v3.0 "dim terne bar-tabac shopfront sign" | **"plain blank rectangular sign panel with a simple pictogram"** | **[S7]** — kills FLUX pseudo-lettering charabia on gate crops |
| Sky specks | v3.0 "pinprick paper-white specks" | **"each large enough to read as a small dot"** | **[S6]** — 1px specks vanish on the thin parallax band |
| Far-trottoir | **baked into the tronçon** (v2 §0/§2) | **removed** — `ground.png` separate; buildings-only float | ADR-0048 + audit ("clause obsolète") |
| `sky` | untouched (`… rooftops silhouette, full moon haze`) | **written** — sky-only, dark, sodium-halo-as-value, tileable | **B3** — sky.png was a blank placeholder |
| Deneux (presence) | absent | narrow bow-window façade + frieze value-trame + flat terrace, in **troncon-b** | Bertrand's explicit hommage |
| Consistency | 3 pinned seeds (7101/2/3), style optional-hex | one seed, byte-identical block, one dispatch, gated as a set | **B2** — one printing run |
| Generation path | flux OR kontext (ambiguous) → came out kontext-from-colour-photo | **flux text-to-image only**; kontext only off a B&W ref + grayscale pass | §0 — B1 root cause |

---

## 6. Hand-off

- `node scripts/check-art-prompts.mjs` → for the `levels` family the lint checks **non-emptiness
  only** (and, for `foreground` alone, the magenta chroma-key phrase); the word-count and
  negation budgets are **craft-gate judgment calls, not lint-enforced** for this family
  (`checkBudgets()` is never called from `checkLevels()`, per Serge [S13]). For the record these
  prompts still sit at ≤1 negation each; the length overage is a conscious craft trade (§1 [S1]),
  not something CI will catch.
- **Nothing generates before the `lead-art` PROMPT GATE PASS.** Then `dev-tooling-assets`
  lands the strings in `levelArt.json` (`belliard.prompts.troncon-a|b|c` + `sky`), regenerates
  via **flux text-to-image** on the pinned set-seed, region-mask-keys the tronçons, and
  in-scene validation runs at the play camera (value key, gap read, roof legibility, B2 set
  cohesion) before the ASSET GATE.

---

## 7. Annotations game-graphist (pre-prod) — Serge

Calibration before opening my mouth: I downscaled the committed v2 `troncon-a/b/c.png` to
~800px, ~380px and ~200px tall (the desktop-ish / narrow-viewport-ish / worst-case game
sizes, given `WORLD_HEIGHT=12` and the 0.85 Belliard dezoom in `GameScene.tsx`) and squinted.
At 200px the roofline is already soup — confirms the audit's B4 call, and sets the bar for
how much detail a clause can ask for before it's asking for something that dies on the
cutting-room floor. I also read `scripts/gen-window-zones.mjs` and ADR-0048 end to end, because
on this level the generated art isn't just decoration — it's the **input to an automated
detector** that snaps cop-pop windows and railings onto the painted ink lines. That changes
what "readability" means here: it's not only "does the eye register it", it's "does the
detector register it too". Numbered notes below, concrete fix + severity on each. I did not
touch the prompts — Maud integrates.

### Lisibilité en jeu

**[S1] BLOCKING — the assembled prompts are 2.4×–3× over the house word ceiling, and the
fixes that matter most sit in the dead zone.** I concatenated front-lead + subject + style
block exactly as `checkLevels` and the generator would: troncon-a = **291 words**, troncon-c
= **299**, troncon-b = **364**. Bible §3.3 caps assembled prompts at 90 target / **120 hard**.
`sky` is fine at 91. Worse than the raw count: I located the two clauses this draft calls its
B4/margin fixes inside the troncon-b string — `crisp hard-edged black silhouettes … chimney
pots` lands at **word 298 of 364**, `the buildings standing clear of the frame edges` at
**word 342 of 364**. §3.2 says early tokens weigh most and the tail is the weakest attention
zone — this draft's own §1 rationale invokes exactly that principle to justify front-loading
the *medium* (front lead + tail repeat), then turns around and buries the *two hardest-won
fixes in this file* (B4 roofline, buildings-off-the-edge) as single, un-repeated, very-late
tail clauses. That is the same failure mode as v2's medium placement, recreated for B4/margins
instead of B1. **Fix:** two moves, both needed. (a) Trim the subject clauses — they restate the
same "tags dense at street level, rarefying with height, bare clean walls above" beat almost
verbatim across A/B/C at 15-20 words a pop; tighten each subject toward ~60-70 words without
losing a silhouette-load-bearing noun. (b) Promote a compressed version of the B4 + margin
beats into the **front lead**, the same treatment already given to the medium: e.g. `Black-
and-white photocopied fanzine night elevation, flat frontal orthographic view of buildings
with sharp roofline silhouettes floating clear of a flat black night-sky field, of …` — then
let the full style-block clause repeat/reinforce it at the tail as originally drafted. Target:
assembled total back under ~150 words, ideally nearer the 90-120 band; if the subject can't
shrink that far, the two promoted clauses are non-negotiable regardless of total length.

**[S2] BLOCKING — the Deneux frieze is asked to be "small" then also asked to survive at game
size; those are opposite requests.** `repeated geometric ceramic frieze of small squares dots
and triangles` — "small" is exactly the word that produces a fine repeating micro-pattern, and
a fine repeating micro-pattern is exactly what turns to halftone soup once xerox-toner-grained
and downscaled to a ~600-800px-tall tronçon (my h200/h380 crops show plain window mullions
already thinning to a grey smear at that size — an ornamental trame this fine has no chance).
It also risks reading as moiré noise once the coarse xerox halftone dots from the shared style
block land on top of an already-fine pattern — two competing high-frequency textures. This is
the ONE signature detail carrying the whole hommage; if it mushes, the hommage reads as a dirty
smudge, not a building. **Fix:** replace "small squares dots and triangles" with an
explicitly large-unit motif — e.g. `a large bold geometric motif of chunky squares and diamond
lozenges, each tile roughly a hand's-width — as big as a window pane, never finer` — and add
"reads as one dense dark band at a glance, not fine ornamental detail" so FLUX is told the
READ, not just the shape vocabulary.

**[S3] BLOCKING — the ground-floor tag band's value is a floating instruction, not a locked
one, on a set that's already been failed once for value drift (the v2 B2 finding).** "the
ground-floor shopfront band … one value step lighter than the storeys above" has no anchor.
The mandatory ladder is explicitly closed to three: `#141210 / #3A3E44 / #E9E3D2` — good, that
spread (~L7% / L26% / L89%) is plenty of contrast for xerox reproduction, no complaint there —
but "one step lighter" between `#3A3E44` and `#E9E3D2` leaves FLUX to pick ANY midpoint, and
on three independent-ish rolls (same seed helps, but the subject text differs per tronçon) that
midpoint can drift, which is precisely the kind of per-tirage inconsistency the v2 audit
flagged. It also matters for legibility: if the band lands too close to `#3A3E44` the tag
lettering loses the contrast bump it needs to read as a distinct textured strip at game size.
**Fix, without adding a fourth named anchor (keeps B2's "three anchors ARE the value key"
rule intact):** pin it as an interpolation of the two existing anchors, e.g. `the ground-floor
band sits at a locked mid-grey roughly midway in value between #3A3E44 and #E9E3D2` — numeric,
closed, still on the ladder.

**[S4] BLOCKING — chimney pots get a shape fix (B4) but no count or thickness fix, so the
exact defect can recur inside the "fixed" clause.** `sharp chimney pots standing clean against
the sky` is the right instinct (positive, silhouette-first) but it doesn't bound HOW MANY or
HOW THICK. Troncon-c's rooftop at h200 is already the messiest crop in my calibration set —
a dense huddle of several thin stacks reads as a hashed blur the instant it's reduced, which is
verbatim the B4 defect this clause exists to kill. A single word fixing shape without fixing
population doesn't close the loop. **Fix:** `two or three bold, thick, blocky chimney
silhouettes per building, sparsely spaced, never a dense cluster of thin stacks` — bounds count
and stroke weight, the two variables that actually decide whether it survives 800px→200px.

**[S5] RECOMMENDED — storey count varies (4-5 / 4(+taller neighbours) / 4-6) but the working
canvas height is pinned equal (1024px) across A/B/C (§4), so the per-storey pixel budget isn't
equal.** Troncon-c's six-storey buildings get noticeably less vertical room per floor than
troncon-a's four-storey ones at the same 1024px height — meaning windows, shutters and tag
band render proportionally smaller on troncon-c, then everything is displayed at the SAME
`WORLD_HEIGHT`. Some variance is period-honest (real faubourien streets aren't uniform), but an
extreme case would read as "the c tronçon is finer/denser than its neighbours" when the set is
tiled side by side — a B2 cohesion nit, not a hard fail, since it's bounded (4-6 storeys isn't
a huge spread) and the shared style block otherwise locks the line weight. **Fix (optional,
insurance not a blocker):** add a loose proportion anchor, e.g. "each storey roughly a sixth to
a seventh of the building's height", so no single roll's floor pitch runs away from the others.

**[S6] NICE-TO-HAVE — sky pinprick stars have no minimum size, and the sky plane is small on
screen.** "only a very few faint sparse pinprick paper-white specks" is the right restraint
(no starfield, no moon-logo), but at 1px-in-source they can vanish entirely once resized/
mip-mapped for a parallax strip that's a thin band on screen. Low stakes — an empty ink field
still satisfies "flat empty deep-night field" — but if the intent is a few visible flecks,
worth insuring. **Fix:** "each fleck large enough to read as a small dot, not a single pixel."

**[S7] RECOMMENDED — the bar-tabac shopfront sign is a FLUX pseudo-lettering trap.** "one dim
terne bar-tabac shopfront sign" — signage is one of the two named FLUX failure modes in my
brief (text/lettering → charabia). At game size a garbled sign is a harmless texture blob, so
this isn't a gate-blocker, but it WILL show as an ugly fake-text smear on any asset-gate crop
or promo screenshot, and it's cheap to preempt. **Fix:** "rendered as a plain rectangular
sign shape with a simple pictogram, no legible lettering."

### Solidité technique — keying, tileability, set mechanics

**[S8] BLOCKING — the L/R transparent margin has no numerically guaranteed minimum width, and
the region-mask cut (not a chroma key) depends on that margin actually existing on every
roll.** The style block asks for "the wide margins to the left and right" and "the buildings
standing clear of the frame edges" — good direction, but FLUX text-to-image has no innate
respect for compositional margins and commonly fills frame-edge to frame-edge on a "wide shot"
read, especially the longer this prompt runs (S1) and dilutes the instruction's weight. Because
§4 specifies the keying method here is a **region-mask cut** (a fixed L/R band + above-roofline
band get cut, not a value threshold), a building that touches or nearly touches the edge on
one roll either gets clipped by the mask or leaves an un-keyed opaque sliver — on a THREE-tile
set generated to be tiled edge to edge, that's a visible seam defect, not a cosmetic one.
**Fix:** make the margin a measured minimum, not a mood: "a clear, unbroken band of the flat
night-sky field at least a tenth of the image's width along both the left and right edges
before any building wall begins."

**[S9] BLOCKING — the mur-pignon (troncon-b) and the passage alley (troncon-c) are neither
explicitly opaque nor explicitly transparent, and that ambiguity has two different downstream
consumers who need opposite answers.** The prompt describes both as rendered wall surface
("a blank flat expanse of raw soot-stained brick", "a narrow shadowed passage alley running
back") — i.e. opaque painted pixels, distinct from the "thin strip of dark night sky" gap beat
which the style block explicitly ties to the keyable `#141210` sky field. If that's the
intent, fine — but nothing in the prompt stops FLUX from rendering either as a near-black
recess that reads exactly like the sky-field value, which then either (a) gets wrongly cut by
a region-mask tuned for L/R margins only, or (b) gets scanned by `gen-window-zones.mjs`'s
dark-line-density detector as if it were real building surface (see S10) when it's actually a
value-matched void. **Fix:** state the intent explicitly per beat — if it should stay opaque
painted wall (my read of the current wording), add "rendered as solid opaque wall surface, not
sky-dark" to both the pignon and the passage clauses so neither drifts to the sky's own value
by accident.

**[S10] BLOCKING — this is a load-bearing one, not a taste note: `gen-window-zones.mjs` finds
cop-pop windows and railing anchors by peaks in the row/column density of near-black ink lines
on the real painted tronçon art (ADR-0048 §4) — it is not manual placement.** Two things in
this prompt actively compete with that signal. First, `soot-stained brick` on the pignon gable
is exactly the kind of texture — brick coursing reads as regular horizontal mortar lines — that
can fake a periodic "floor band" peak in a region that has NO real windows to detect, which is
the textbook false positive for this detector (cop pops on blank wall). Second, the shared
`hairline cracks rendered as inked hatching` clause, layered over the whole grimy wall texture
including the window-bearing floors, adds competing dark-line density right where the detector
is trying to isolate real window-frame/shutter outlines from everything else. Neither is
hypothetical — I'm reading the detector's own doc-comment describing exactly this
row/column-density method. **Fix:** keep the pignon/gable genuinely quiet — "a blank, unbroken
expanse of raw brick, free of coursing lines or soot mottling" (drop "soot-stained", it's the
one word doing the damage) — and on the window-bearing floors, keep the hatching clearly
SUBORDINATE to the window/shutter outlines: add "the hairline cracks stay fine and sparse,
never competing with the bolder window-frame and shutter lines" so the detector's signal isn't
drowned by decoration.

**[S11] RECOMMENDED — local ink-black shadow work risks touching the exact hex reserved for
the sky field, and that field is what the region-mask cut and the false-positive check in
`gen-window-zones` (opacity-checked against "real building pixels, not a between-building sky
sliver") both key off.** "grimy weathered walls with soot marks … rendered as inked hatching"
plus "thick black ink outlines" can legitimately produce small wall patches as dark as pure
`#141210` — normally fine, ink shadow is ink shadow, but here `#141210` is ALSO the literal
value the sky field and margins are anchored to. Low risk of an actual mis-key (the region-mask
is positional, not value-based, per §4), higher risk for any future value-based sanity check
or for a human eyeballing the alpha boundary. **Fix (cheap insurance, not urgent):** one clause
reserving true ink-black for outlines and the sky field specifically — "wall shadow never
drops all the way to the sky's own pure ink-black" — keeps a value margin between "dark wall"
and "void" even though nothing currently depends on it automatically.

**[S12] NICE-TO-HAVE — "horizontally tileable seamless repeat" is a words-only ask; FLUX
text-to-image has no true wrap-awareness, so a hard seam on the actual edge pixels is likely
regardless of the clause.** Low stakes here specifically because the content itself is
forgiving — a smooth top-to-bottom gradient plus a handful of sparse specks has almost nothing
structural to mismatch at a seam, unlike a skyline silhouette would. Not a prompt fix so much
as a heads-up for whoever lands this: **flag to `dev-tooling-assets`** that the seam should get
a script-side check (or a cheap offset-and-blend pass) rather than trusting the clause alone,
same caution any tileable texture gets regardless of what generated it.

**[S13] NICE-TO-HAVE — §6 of this draft overclaims what `check-art-prompts.mjs` actually
enforces for levels; worth fixing before it misleads someone at the gate.** I read
`checkLevels()`: for the `levels` set it checks non-emptiness and (foreground only) the
magenta chroma-key phrase — that's it. The word-count ceiling (§3.3, the one S1 leans on) and
the negation ceiling this draft's own §6 claims ("the ≤4-negation ceiling only") are BOTH
craft-only for this asset family — `checkBudgets()` is never called from `checkLevels()`. Not
a prompt-content risk, just a documentation-accuracy nit: correct "level prompts are
lint-checked for non-emptiness + the ≤4-negation ceiling only" to "non-emptiness only (word
count and negation budgets are craft-gate judgment calls, not lint-enforced, for this
family)", so nobody downstream assumes CI will catch a S1-style overrun.

### Verdict

**NEEDS REWORK.** Six blockers, all fixable in the text without touching the direction:
**[S1]** prompt length + tail-buried B4/margin fixes, **[S2]** frieze motif scale word,
**[S3]** tag-band value unanchored, **[S4]** chimney pot count/thickness unbounded, **[S8]**
L/R margin width unguaranteed, **[S9]** pignon/passage opaque-vs-transparent ambiguity, and
**[S10]** soot/hatching texture competing with the window-zone detector's own signal. None of
these touch the Deneux hommage, the NIGHT ruling, or the flux-text-to-image workflow call —
they're all "the words don't yet deliver what the direction already correctly wants." [S5],
[S6], [S7], [S11], [S12], [S13] are recommended/nice-to-have polish, not gate-blocking on
their own. Once S1/S2/S3/S4/S8/S9/S10 are folded in, this is ready for another look — happy to
re-squint at the next revision.

— Serge, PRE-PROD pass

### Réponses Maud — correction pass 1 (itération 1/2)

Sections 1–6 corrigées; le texte de Serge ci-dessus est conservé intact. Statut par
annotation:

- **[S1] ✅ appliqué** — B4 (rooflines + `two or three thick blocky chimneys per building`) et
  la marge bâtiments-hors-bord (`floating clear of both frame edges behind an empty sky margin
  at least a tenth of the image width per side`) **remontés dans le front lead**. Prompts
  assemblés ramenés à **191 / 248 / 224** mots (A/B/C) contre 291/364/299 (≈ -34/-32/-25 %).
  Honnêtement: **sub-120 est inatteignable ici** — les seuls fragments partagés (registre N&B
  bi-ancré B1, B4 toits/cheminées, marge S8, ladder 3-hex, clause S10) font déjà ~115 mots
  gate-mandatés, plancher assemblé ~130-140. Le reste est aussi mandaté (fenêtres NUIT, taper
  axe-1, ancre S3, hommage Deneux que S2 veut *plus* détaillé). Signalé à lead-art comme
  arbitrage conscient; `levels` non gatée mots par le lint (S13), mais le gate in-scene doit
  surveiller B (248 mots) pour un éventuel drop-out de clause en queue.
- **[S2] ✅ appliqué** — frise Deneux passée de `small squares dots and triangles` à un motif
  GROS et espacé: `chunky squares and diamond lozenges each as big as a window pane` + on donne
  le READ (`reading as a single dark band at a glance`), pas seulement le vocabulaire de forme.
- **[S3] ✅ appliqué** — bande taguée ancrée en interpolation fermée des deux ancres existantes:
  `locked mid-grey midway in value between #3A3E44 and #E9E3D2` (pas de 4e ancre nommée).
- **[S4] ✅ appliqué** — cheminées bornées en nombre ET épaisseur dans le front lead:
  `two or three thick blocky chimneys per building`.
- **[S5] ⏸️ accepté-mais-reporté** — l'ancre de pas d'étage (~1/6–1/7) est une assurance
  cohésion optionnelle (Serge: "not a blocker"); je ne l'ajoute pas au front lead partagé
  (zone la plus disputée en mots, cf. S1) pour ne pas diluer les fixes BLOQUANTS. Le bloc de
  style verrouille déjà la graisse de trait et l'étalement 4-6 étages est borné. Reporté à une
  itération ultérieure si la cohésion in-scene le réclame.
- **[S6] ✅ appliqué** — specks du ciel dotés d'une taille minimale: `each large enough to read
  as a small dot`.
- **[S7] ✅ appliqué** — bar-tabac reformulé en `plain blank rectangular sign panel with a
  simple pictogram` (panneau vierge + pictogramme, aucun lettrage décrit → pas de charabia).
- **[S8] ✅ appliqué** — marge L/R chiffrée: `an empty sky margin at least a tenth of the image
  width on each side` (front lead).
- **[S9] ✅ appliqué** — mur-pignon (B) et passage (C) explicitement opaques et ancrés à la
  valeur mur `#3A3E44`, `kept clearly above the ink-black sky value` → ni coupés par le
  region-mask, ni scannés comme ciel.
- **[S10] ✅ appliqué** — `soot-stained` retiré du pignon (`blank unbroken raw-brick`); hachures
  du bloc partagé reformulées `fine sparse inked hatching kept subordinate to the bolder window
  and shutter lines` → ne piège plus le détecteur de densité de lignes de `gen-window-zones.mjs`.
- **[S11] ⏸️ accepté-mais-reporté** — réserve "l'ombre de mur ne descend pas au pur ink-black
  du ciel": Serge la note "cheap insurance, not urgent" et le region-mask est **positionnel,
  pas value-based** (§4), donc rien n'en dépend automatiquement. Non ajouté pour tenir le budget
  mots (S1); à reprendre si un futur check value-based l'exige.
- **[S12] ✅ appliqué (flag)** — noté en §3 + §4: la couture du ciel passe par un check/offset-
  and-blend côté script `dev-tooling-assets`, pas la clause seule.
- **[S13] ✅ appliqué** — §6 corrigée: pour `levels`, `check-art-prompts.mjs` vérifie
  **non-vacuité uniquement** (et la phrase chroma-key magenta pour `foreground` seul); mots et
  négations sont craft-gate, non lint-enforced (`checkBudgets()` jamais appelé depuis
  `checkLevels()`).

Reste hors de mon lane (inchangé): pas de modification de `levelArt.json` (dev-tooling-assets
après le gate). Repart au **PROMPT GATE lead-art**.

— Maud, correction pass 1
