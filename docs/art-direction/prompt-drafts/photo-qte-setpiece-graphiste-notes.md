# Graphiste notes — PRE-PROD pass, `photoQte` set-piece (Belliard)

Serge (`game-graphist`), 2026-08-02 — PRE-PROD pass on
`docs/art-direction/prompt-drafts/photo-qte-setpiece.md`, ahead of the `lead-art` PROMPT
GATE. I annotate, I don't rewrite Maud's prompts — she integrates.

Read: `photo-qte-setpiece.md` (full), `spec-photo-qte-paparazzi.md` §0, §1.2, §2.5, §3.2-3.3
(the fill/sway math), `docs/art-direction.md` §3 (house style), the sprite-hole-audit skill.

---

## [S1] `exchange_close` (K4/K5) — "two faces AND two hands" does NOT hold at worst-case fill

The master-proof read is checked by the game at **T4 FILL ∈ [FILL_MIN 0.45, FILL_MAX 0.92]**
of the viewfinder's dominant axis (spec §3.2). Maud's box is `17.00 × 9.56 su` (16:9). At
`FILL_MIN = 0.45` the player is legally allowed to click — and the game must count it —
with the box occupying only **45 % of screen width**, not the generous 64 % the spec's own
worked example (K4, 94→132 mm) assumes. At that floor the two heads plus two hands plus
envelope are sharing well under half the screen's horizontal real estate: each head is
roughly a fifth of that already-small band, and the hands/envelope cluster below it is
smaller still.

**Risk:** the prompt's "rough black ink linework" and "coarse halftone toner dots" generate
interior facial detail (eyes, nose, mouth-lines, individual toner dots) that is real
information at the 4K reference render and pure noise at 45 %-fill screen size. What survives
at that size is **silhouette + a handful of large value shapes** — not features. If the
generation leans on line detail to sell "two faces", the fill-min frame will read as two
blank ovals, and the mandatory proof becomes unreadable exactly at the edge of the legal
composition window the game is designed to accept.

**Fix (concrete, for Maud to weigh):** add a clause that pins the read to **silhouette-level
separation**, not line detail — e.g. "a dark gap of bare magenta between the two heads" (a
literal negative space the keyer preserves) and "the passed envelope reading as one pale flat
shape distinct from both hands" (value-block, not line). Ask for the halftone dot pitch to be
coarse enough that at `FILL_MIN` a dot is still ≥ 1 screen pixel in the delivered PNG — if
the dots are finer than that they'll dissolve into gray mush at the worst legal zoom, which
also risks banding after the alpha key (see S2). Concretely: request the head separation and
the hand/envelope cluster as **two independently readable blobs of value**, so the "two faces
AND two hands" contract is carried by shape count, the same trick decision 5 already uses for
the verdict stamps (loop/tick/cross by shape, not tone).

## [S2] `exchange_close` — the envelope is exactly the object type that vanishes at the key

"one passing a flat rectangular paper envelope edge-on ... wrists level" — a **thin, pale,
edge-on** object sitting directly against `#FF3CDC`. This is the textbook failure mode from
the sprite-hole-audit skill, just inverted: instead of a dark limb eaten by a near-black key,
here a **thin bright shape at the key boundary** gets fringe-eaten by the alpha ramp. Coarse
halftone toner dots right at that edge (decision-2 style clause, shared across the family)
make it worse: a hard vector edge keys cleanly in one pass; a dithered dot edge produces a
ragged, several-pixel-wide alpha ramp, and if the envelope's edge-on silhouette is only a few
pixels thick at `exchange_close`'s in-game size, that ramp can eat the whole object — the
envelope either disappears or shows as a magenta-fringed sliver. Same risk, lesser degree,
on any hand/finger gaps in this pose (the classic "webbed hand" that the AI-defect sweep
already watches for, compounded here by a key-adjacent thin light shape).

**Fix:** flag for the retouch pass regardless of gate outcome — this is a `retouch-sprites.mjs`
candidate (fringe cleanup / alpha hardening) by construction, not a "maybe." For the prompt
itself: ask for the envelope drawn with a **visibly thick paper edge** ("a stiff paper
envelope with a visible thickness at its edge") rather than a knife-edge line — a few extra
pixels of solid tone between the two hands buys the keyer margin it needs, and it's a
period-correct detail (thicker stock reads as more "official", which serves the fiction).

## [S3] Set mechanics — same treatment across 3 canvas sizes, and a 4th "size" nobody's named yet

`commandant_wait` (4:9, tall column), `pair_facing`/`exchange_close`/`berline_plate` (16:9,
three different absolute sizes: 24.00×13.50, 17.00×9.56, 7.50×4.22 su) all share the `style`
block verbatim (decision, correctly) so the halftone/ink/edge treatment is consistent **per
generation**. But the readability floor is not one canvas size, it's a **range per asset** —
each box is seen at any focal between the fill-min and fill-max bound for its own instant
(§3.2), and those bounds differ per instant because the boxes differ in absolute su size
while `FILL_MIN`/`FILL_MAX` are the same ratio. `berline_plate` at `7.50 × 4.22 su` is the
smallest box in the family — at `FILL_MIN` its legal screen footprint is the tightest of the
four, and it's the one asset carrying a mandatory-legible detail (the plate rim, per S4)
inside that footprint. Worth naming explicitly in the gate: the four assets are not
equally hard at their floor — `berline_plate` and `exchange_close` are the two that will
fail first if the halftone dot pitch is authored at one size-agnostic setting.

**Fix:** ask Maud (or flag to `lead-art`) for the dot pitch to be specified relative to each
box's own su size rather than copy-pasted verbatim across the family — "coarse halftone toner
dots" reads differently at 24×13.5 su than at 7.50×4.22 su. A pitch that's legible on the
big `pair_facing` box can be uselessly fine on the small `berline_plate` box.

## [S4] The blank plate + blank fascia composited at runtime — the seam risk is tone, not concept

Compositing plain vector text/lettering over a photocopy-fanzine cutout is the right call
(FLUX can't letter reliably, decision 5's own rejected-variants list agrees) but it creates a
specific production trap: **a clean, anti-aliased digital string sitting on a coarse-dot,
high-contrast xerox surface reads as an obvious digital sticker**, exactly the "photoreal
kills the house style" failure the bible is built to avoid, just introduced through the back
door of a UI overlay instead of the generator.

Concretely, for the registration plate (`berline_plate`, K6/K7/K8):

- **Tone mismatch**: smooth sub-pixel font rendering vs. coarse black-and-white halftone
  toner — the overlay will look too clean at any zoom where the plate is legible enough to
  read the characters at all.
- **Anchor drift**: the sprite is ONE PNG translated across the interval (decision 2, correct
  for the AABB math) — the text overlay's anchor must be authored in the sprite's own local
  coordinates and inherit the same translation, never a second independently-positioned DOM
  element, or the plate face and the composited string will visibly separate as the car
  slides `[53.0, 55.9]`.
- **Scale**: period `1234 AB 75` format (art-advisor's call) has to fit the "raised rim" at
  whatever pixel size the plate box resolves to at `FILL_MIN` — same worst-case-size logic as
  S1/S3. If the rim's inner rectangle isn't authored with headroom for real character widths,
  the overlay will either overflow the rim or need to shrink below legibility.

**Fix:** the composited text needs a **matching degradation pass** — quantize/threshold it
to the same value steps as the halftone, and jitter or dither its edges very slightly so it
doesn't sit as a pin-sharp foreign layer. This is a `dev-tooling-assets` + `render` seam per
Maud's own hand-off (§6 of her draft) — I'm flagging the specific technical symptom (tone
mismatch, not "will it work at all") so whoever owns that seam tests it at `FILL_MIN`, not
just at the comfortable reference size.

## [S5] Static single-frame holds at 19.2 s / 14.7 s — will read as frozen, not posed

Two hold poses (`pair_facing` K2→K3, `exchange_close` K4→K5) are a single unmoving bitmap
held on screen for 19.2 s and 14.7 s respectively — by design, correctly, since zero frames
is the only zero-drift guarantee (E-6(4), decision 3). But a perfectly static image held that
long, full-screen, with nothing else moving, reads to a player's eye as "the game has hung",
not "the men are standing still talking" — the same instinct that makes a frozen video call
tile look broken rather than posed. This is a real risk to flag even though the mechanic
correctly refuses to pay for it with sprite drift.

**The constraint that matters: whatever fixes this must NOT touch `subjectTrack`.** The box
may not move or grow (F12) — so the fix cannot live in the sprite or its AABB at all.

**Cheapest fix that respects that:** put the "it's alive" signal in a layer the AABB contract
doesn't cover — two options, both zero-cost against F12:

1. **The viewfinder itself already moves** — `SWAY_AMP_X/Y` drifts the _camera_, not the
   subject, continuously while raised (spec §3.3). A shaky handheld frame over a subject that
   holds dead still is exactly the correct real-world read of "someone posing while I keep the
   camera steady" — this may already be enough, and it's worth confirming at playtest before
   spending anything else.
2. **If sway alone doesn't sell it**, put a small independent motion in the **plate**, which
   carries no AABB contract at all (decision 1: plate = décor only): the traffic-light's
   "pale pool of light" could flicker very slightly, or a distant shuttered window could show
   a one-off light change. Anything alive in the frame that is provably outside every
   `subjectTrack` box breaks the "single frozen bitmap" read without moving a single pixel the
   game measures. This is cheaper than any sprite-side idle and carries zero risk to F12/F5.

I'd sequence it: ship static first, watch it at playtest (per spec's own "measured at
playtest" language for comparable budgets), and only spend on option 2 if reviewers flag the
hold as "broken" rather than "posed."

## [S6] `commandant_wait` (4:9 column) — smallest risk of the four, flagged for completeness

`6.00 × 13.50 su`, tall narrow column, staged in the plate's own black passage-mouth shadow
(decision 4: no glow, tone contrast only). This is the easiest of the four to read at any
size — a single upright silhouette against a pure-black backdrop is the strongest possible
value separation the family offers, and there's no multi-part enumeration to hold together.
No fix requested; noted so the gate doesn't spend review budget here that's better spent on
S1/S2/S4.

---

## Summary for the gate

Two of Maud's four subject sprites carry real technical risk at their **legal worst-case
fill** (S1 `exchange_close` faces, S2 `exchange_close` envelope at the key) — both concentrated
in the mandatory master-proof asset, which is the one prompt that can least afford a
readability failure. `berline_plate` needs the halftone pitch and rim geometry checked against
its own (smallest) box rather than the family default (S3), and the render-side plate-text
compositing (S4) needs a degradation pass or it will look like a sticker regardless of how
clean the sprite prompt is. The two static holds (S5) are a legitimate mechanical trade-off,
not a prompt defect — the fix, if needed, belongs in the plate or the viewfinder sway, never
in the sprite.

Signed — Serge, PRE-PROD pass.
