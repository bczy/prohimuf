# PROMPT GATE — `photoQte` set-piece (Nico, `lead-art`, 2026-08-02)

Subject: `docs/art-direction/prompt-drafts/photo-qte-setpiece.md` (Maud, DRAFT).
Packet gated against: techplan §11.5 (**E-6, 7 constraints** + prohibition R3-2/N-1),
spec paparazzi §2.5 + §10.5 (items 1-9), fiction §2 / §6, `docs/art-direction.md` §2-§4.

**GLOBAL VERDICT: CONDITIONAL PASS — 2 REWORKS + 3 EDITS before the write.**
The draft is on-direction and the E-6 packet is honoured. Two prompt-craft defects are
blocking and one-clause each. See §4 for the write authorisation.

---

## 1. The three structural decisions — gated FIRST, as asked

**(a) The plate carries no actor and no berline — PASS.**
This is the right call and I want it on the record as more than a convenience. The gate
criterion E-6(3) is _the drawing IS the box_, checked in CI on the delivered sprite's opaque
AABB. A figure baked into an opaque 16:9 plate has no AABB to read; the constraint would be
declarative only, which is exactly the failure the "décor aim-honesty" ruling (2026-07-20)
corrected. Décor opaque + keyed cut-outs composited over it is the only staging where E-6(3),
(4), (5), (6) are assertable at all. Ratified.
_Condition:_ the plate's tone plan must keep the **mouth of the passage the darkest value on
the plate** (§10.5 closing ask) — it is what makes the pale overcoat read at 132 mm in
photocopy. The prompt says so (`the deepest solid pure-black shape in the picture`); it is a
verdict criterion at the asset gate, not a hope.

**(b) ONE `berline_plate` sprite translated for K6/K7/K8 — PASS.**
E-6(5) `cy` constant and E-6(6) `w × h` constant become true **by construction** instead of by
an artist's steady hand over 7 s and an interval sampler. Three drawings could not hold
`7.50 × 4.22` within 0.40 su and would triple the failure surface for zero motion gain.
Ratified, and the rejected variant (§5 of the draft) stays rejected.

**(c) Static mono-frame hold poses — PASS.**
E-6(4) is blocking and interval-checked; zero frames is the only zero-drift guarantee. I
accept the cost knowingly: two dead beats (19.2 s and 14.7 s) with no breathing. That is the
correct trade — a breathing loop buys a beat of life the player is not looking at, against a
drift budget on the two longest holds in the scene. Maud's mitigation (settled postures, no
limb parked outside the AABB) is the right insurance for a future pass.
_Missing bible rule, proposed here_ (§3 gate, mine): **when a mechanical tolerance constrains a
sprite's AABB over an interval, the default deliverable is a single static frame; any
animation on that sprite requires interval evidence at the composite gate before it ships.**
I will carry this into `docs/art-direction.md` as a separate edit, not smuggled into this
verdict.

## 2. Prompt-by-prompt verdicts

| #   | Prompt                                          | Verdict                         |
| --- | ----------------------------------------------- | ------------------------------- |
| 1   | Plate — telephoto view                          | **PASS** (conditions C1-C3)     |
| 2   | shared `opening` slot                           | **FAIL — rework R1**            |
| 3   | shared `style` slot                             | **PASS**                        |
| 4   | `commandant_wait`                               | **PASS** conditional on edit E1 |
| 5   | `pair_facing`                                   | **PASS** conditional on edit E2 |
| 6   | `exchange_close`                                | **PASS**                        |
| 7   | `berline_plate`                                 | **PASS** conditional on edit E3 |
| 8   | contact sheet                                   | **FAIL — rework R2**            |
| 9   | `stamp_master` / `stamp_bonus` / `stamp_reject` | **PASS** (3/3)                  |

### R1 (blocking) — the shared `opening` says `one subject centred`

Three of the four cut-outs are **groups**: `pair_facing` (two men + half a saloon),
`exchange_close` (two heads, four hands, an envelope), `berline_plate` (a car). The shared slot
is front-loaded — the highest-attention zone in the prompt (bible §3.2) — and it instructs FLUX
to draw **one** thing. This is how you get a `pair_facing` that comes back with a single man and
an AABB half the authored 24 su width. `style` carries the same defect with `alone on a flat
uniform bright magenta … field`.
**Rework, verbatim:** in `opening`, `one subject centred` → `the whole subject group centred`;
in `style`, `alone on a flat uniform bright magenta #FF3CDC field filling every gap` →
`on a flat uniform bright magenta #FF3CDC field filling every gap and every space between the
shapes`. The block stays verbatim-shared across the 7 cut-outs (bible §3.9), which is the point.

### R2 (blocking) — the contact sheet has no outer chroma ground

The draft calls it a "self-contained cut-out" and keys the six **windows** magenta, but no clause
states the field **outside** the sheet. FLUX will fill it with paper, a desk or a vignette, and
the cutout pass will ship a sheet welded to a rectangle of garbage.
**Rework:** append to the contact-sheet prompt `, the whole sheet floating alone with every
surrounding margin the same flat uniform bright magenta #FF3CDC field`.

### E1 — `commandant_wait`: two contradictory aspect statements

`a narrow upright column twice as tall as wide` states 2:1 while the frame the silhouette must
touch on all four edges is 4:9 = 2.25:1. Two aspect instructions fight; the weaker one wins at
random. **Edit:** `a narrow upright column well over twice as tall as wide`.

### E2 — `pair_facing`: the saloon must be the SAME car as `berline_plate`

The set-piece shows the berline twice, 20 s apart, in two drawings and two perspectives. That is
a family-consistency exposure (bible §"one printing run"): two renderings of one car that do not
read as one car is a set failure, and here it also breaks the fiction's identification beat.
**Edit:** `the rear half of a dark saloon, one front door open` → `the rear half of a dark
saloon with a flat boot lid, rectangular tail lamps at the outer corners and a straight chrome
bumper bar, one front door open` — the same three tokens `berline_plate` carries. Judged at the
asset gate: same body, same lamp treatment, same line weight, or the set fails.

### E3 — `berline_plate`: the plate face must be halftone-free

Ruling §3.1 puts authored characters on that face at runtime. A face carrying coarse toner dots
will fight composited glyphs at 251 mm. **Edit:** `blank pale face` → `its face one flat clean
pale rectangle, smooth and free of toner texture`.

## 3. The two seams — I rule

### 3.1 The registration plate — BLANK IN THE SPRITE, characters composited render-side

**Decided.** Maud is right that FLUX cannot letter a 1998 French plate legibly at this size, and
garbled characters would break both period truth and the fiction's `on lit QUI paie`. The
precedent already exists in this codebase and I am applying it: the LOOT crate ships as ONE
glyph-less body with the A/B/C glyph composited render-side (`levelArt.json` `loot.$comment`) for
exactly this reason — crisp, authored, re-editable. Same pattern here.

Conditions attached:

- **C-P1** — the characters are **decor ink** (black/grey, fanzine register). No neon, no rim, no
  emissive treatment: the berline is photographed, never shot (F-4). A glowing plate would teach
  the shoot affordance on the one element the player must never shoot.
- **C-P2** — the string, its period format and its typeface come from `art-advisor` (Estelle).
  Asked, not assumed — I do not ratify a format from memory.
- **C-P3** — this is a **runtime composite**, so my **composite gate** applies before merge:
  I need a real in-game screenshot of the K6-K8 window, through the viewfinder at 251 mm, with
  the characters composited. An asset-gate PASS on the PNG does **not** cover it.
- **C-P4** — the composited characters must not move the sprite's opaque AABB. They sit inside
  the drawn plate face; if the implementation pads or offsets, E-6(6) is back on the table.

### 3.2 The bakery fascia — BLANK PANEL, and NO render-side lettering

**Decided, and it closes the "flagged, not decided" item.** No overlay.
Reasons: (i) the plate's job is to **cite** a shipped décor, not enrich it (E-6(7), §10.5(9),
`spec-belliard-street-wide-repositioning.md` §0.2) — a word on the fascia that does not exist on
`street-wide.png` is an invention at the exact moment continuity is the gate criterion;
(ii) the continuity token the fiction names is the shopfront **in amorce under its scalloped
awning** (fiction §6), not lettering; (iii) crisp type at plate-left would be the sharpest,
highest-contrast element on the picture roughly 40 su away from the passage mouth — it pulls the
eye off the subject in a set-piece whose entire read is "look into the black slot". Blank panel,
full stop.
_Asset-gate condition:_ the kontext pass must not **inherit** garbled letters from the source
crop. Legible-looking gibberish on the fascia is a FAIL.

## 4. Generation method — kontext img2img VALIDATED

Maud's request is granted. Bible §3.12 exists for precisely this case, and E-6(7) makes
continuity a **gate criterion, not a style note**: prompt-only cohesion with a shipped opaque
décor is a hope, an img2img lock is a mechanism. Conditions:

- **C1** — source crop of the **shipped** `assets/levels/belliard/street-wide.png` around
  `x_norm 0,30 – 0,45`; the crop is committed as a reference file and its path recorded in the
  draft, so the plate is reproducible.
- **C2** — the plate is **opaque 16:9, no chroma key** (it is décor, not a cut-out). It carries
  no `neon` field.
- **C3** — pinned seed, `enhance=false`, `nologo`, `private` (bible §3.10/§3.11).
- **C4 — fallback, pre-authorised so nobody burns a cycle asking:** if kontext returns a mushy
  or over-locked frame, fall back to `flux` on the same prompt string with the same seed policy,
  and I judge continuity by eye at the asset gate. **Cap: 2 batches** for this asset set; past
  that, options go to Bertrand, not more rolls.

## 5. Prohibitions — checked, all three clear

- **F-4 (no interactive-glow vocabulary on the subject) — CLEAR.** No rim, halo or neon token in
  any of the 7 cut-outs; no `neon` field on the family. Readability carried by tone contrast
  (dark commandant / pale overcoat / pure-black mouth), which is the read fiction §2.2 buys for
  free in B&W. Correct, and it stays correct at runtime: **no render-side rim on any photoQte
  sprite** — that would reintroduce F-4 through the back door and would land in my composite gate.
- **T-4 (no dial / posemètre) — CLEAR** on this asset set: the three verdicts are told by three
  distinct _strokes_ (loop / tick / cross), grayscale-distinguishable with zero tonal cue, which
  also settles §10.5(4) for free. **One clarification for the record:** the draft's §0.5 wording
  ("no stamp or sheet element borrows a dial/needle/meter face") is right _for these assets_ and
  must not be read as forbidding the **HUD suspicion needle's dial form** — fiction §6 keeps that
  form; T-4 forbids presenting it as a **light cell**. Different surface, different owner.
- **R3-2 / N-1 (nothing encodes cover state but the headlights) — CLEAR.** The plate's feu is an
  unlit iron mast plus one plain **static** pool of light: scenery and a light source, animatable
  and never readable. No lens colour, no aspect. Two standing conditions:
  **(i)** the plate's feu gets **no render-side lit-lens overlay** — the C1 exception granted to
  the `nearfg` trafficLight PNG does **not** extend to this plate;
  **(ii)** **no** plate element consumes `inCover`. The headlight sweep is render-side, is the
  sole authorised tell, and is a runtime composite ⇒ **my composite gate before merge**, on a real
  screenshot, judged against §2.1 « un halo est un dégradé, jamais un aplat » — a hard-edged
  headlight wash is an automatic FAIL there even if every PNG passed clean.

## 6. Write authorisation

**`concept-artist` may write to `src/game/levels/levelArt.json` once R1, R2, E1, E2 and E3 are
applied verbatim as specified above, and `check-art-prompts.mjs` is green.** No second gate
round: the five edits are named and mechanical, and I am not spending a cycle re-reading strings
I dictated. Anything _else_ that changes in a `style`/`prompt` field comes back to me first.

Aspect ratios verified against §2.5 and consistent with the draft's hand-off: `commandant_wait`
4:9 (6.00/13.50 = 0.444); `pair_facing` 24.00/13.50, `exchange_close` 17.00/9.56,
`berline_plate` 7.50/4.22 all = 16:9. Structure, ids, paths, sizes and seeds remain
`dev-tooling-assets`'.

**Word counts:** four assembled prompts sit in the 90-120 warn band (100 / 111 / 106 / 110) with
the plate at 118. Tolerated under bible §3.3 — every clause is justified in the draft and I read
them as load-bearing. Consequence, stated now so it is not a surprise: the **tail is the weak
attention zone**, and on these prompts the tail is the shared `style` block carrying the chroma
ground. If a delivered cut-out comes back with ground bleed or a soft key, the fix is **cutting
subject words**, not adding more ground words.

## 7. Still owed to me on this set

1. **Asset gate** on the 8 delivered PNGs — including the AI-generation defect sweep on a
   contrasting background (detached limb, transparent enclave, duplicated/missing hands — this
   set has _four hands and an envelope_ in one 106-word prompt, which is the highest hand-defect
   exposure we have shipped; `exchange_close` gets read at 1:1).
2. **Composite gate** on: the render-side plate characters (C-P3), the headlight sweep (R3-2 ii),
   and any rim/glow that appears anywhere near this set-piece (there should be none).
