# 0018 — Flash-halo background-remnant cleanup on the enemy shooting sprites

- **Status:** Accepted
- **Date:** 2026-07-14

## Context

Bertrand: _"rectangle visible autour des personnages ingame, cela devrait être
transparent."_ The enemy **shooting** sprites carry OPAQUE dark background remnants —
torn-paper-shaped near-black / dark-grey sheets around each **muzzle flash**, plus torn
"wings"/fringe hanging off the busts.

Root cause, two passes deep:

1. `scripts/cutout-enemies.mjs` chroma-keys the near-#000 ground. The style prompt asked
   for a matte-black background; FLUX rendered it dark-grey (lum ≈ 40–110), **not** the
   pure key colour, so ragged sheets of it survived the key.
2. The solidify pass (`scripts/fill-sprite-holes.mjs`, ADR-0014 iter-2) only ever **adds**
   opaque pixels inside the reconstructed body; it never removes exterior opaque, so it
   locked the remnants fully opaque. On the opaque-white origin they hid; composited on a
   light facade / in-game they read as dark torn RINGS around the flash stars and wings
   hanging off the figures.

Why it is hard: the remnant tone is **indistinguishable** from the figures' own
matte-black clothing (`enemy_shooting_2`'s flat jacket rgb≈(45,45,49) lum45 sat0.08 vs its
own bottom remnant rgb≈(43,43,46) lum44 sat0.07 — identical), so no global tonal key can
separate them without eating the flat-black shoulders.

**Iteration 1** used automatic tonal + muzzle-flash-distance guards. The lead-art visual
gate rejected it as **too conservative** — on a light background at 512px/64px the torn
rings and wings were still clearly visible. Directive: switch to **documented per-file
clear zones / thresholds**; hand-tuned masks are legitimate production craft for a fixed
set of 10 sprites (the same per-sprite-constant precedent as `retouch-sprites.mjs`
`RETOUCH_SPECS`).

## Decision

### A deterministic, delete-outside-only retouch — `scripts/retouch-flash-halos.mjs`

Post-key geometry cleanup (a different concern from the shared keyer, so it does not fork
`cutout-enemies.mjs`, per ADR-0013). Per file it runs a pipeline **to a fixpoint**:

1. **Per-file CLEAR ZONES** (`CLEAR_ZONES`, normalized rects, commented with what each
   removes: flash rings, bat-wings, cap fringe, torn bust bottoms). Inside a file's zones a
   pixel is a candidate iff opaque + dark (lum < LB) + desaturated (sat < SB). The
   muzzle-flash STAR and its warm rays are bright/warm → never candidates → **preserved**
   (gate: keep the star, not the dark ring). Files with no entry (idle sprites, the
   courier) are never touched.
2. **Per-file THRESHOLD overrides** (`THRESH_OVERRIDE`): the two riot muzzle flashes are
   big fiery blasts whose own dark-warm smoke base (lum ~90–125) both constitutes the flash
   and connects it to the gun; the default LB=125 ate that base and shattered the blast, so
   riot uses LB=88 (removes only the very dark neutral petals, keeps the flash body).
3. **EXTERIOR-CONNECTED filter** — a candidate must be border-reachable through
   transparent+candidate pixels; we only extend exterior transparency inward, so we can
   **never punch an interior hole** → `fill-sprite-holes.mjs --check` stays green.
4. **SOLIDIFY RECONCILE** — mirror `fill-sprite-holes.mjs` PASS-A body reconstruction
   (disk-10 closing → fill-holes → largest component → disk-1 erode + selective bottom
   seal), dilate by 1px, and **revert** any deletion inside it. The cut boundary is thus
   the accepted solidify **silhouette**, not an arbitrary hand line — the figure body is
   protected even where a zone overlaps it (e.g. the flat-black jacket bottom), and only
   remnant sticking out **beyond** the solid silhouette is removed.
5. **SPECKLE SWEEP** — clear tiny (< 12px) non-dominant opaque components the petal removal
   orphaned (same budget as `check-sprite-integrity.mjs`); never the figure or a legit
   detached flash STAR (both far larger).
6. **FIXPOINT LOOP** — repeat 1–5 until a pass deletes 0. Required for **idempotency**: the
   first pass can detach the muzzle flash, which shrinks the solidify body mask and exposes
   more remnant on the next pass; removals only shrink the opaque set (monotonic, bounded)
   so it converges, and the committed bytes are a fixpoint → a re-run deletes 0.

**Surgical, delete-outside-only**: the ONLY mutation is alpha 255 → 0. RGB is never
touched, no figure pixel moves/recolors, no pixel is made more opaque. A built-in
self-check re-asserts this and **aborts the write** on any violation. `--check` is the
detect-only gate.

**Scope**: runs in place on the 10 shooting sprites that have zone entries.
`enemy_civilian.png` (the bicycle courier) has no entry → never processed (non-combatant,
no flash, courier lane, already ADR-0014-fixed). `retouch-flash-halos.mjs` is **not** wired
into CI (explicit human-run fix, like `retouch-sprites.mjs`).

## Consequences

- 10 shooting sprites retouched in place (deleted px): `enemy_shooting_3` 7483,
  `enemy_shooting_3_f2` 5915, `enemy_riot_shooting` 2376, `enemy_shooting_f2` 1456,
  `enemy_shooting_2` 1260, `enemy_shooting` 1179, `enemy_shooting_2_f2` 1012,
  `enemy_biker_shooting` 971, `enemy_riot_shooting_f2` 878, `enemy_biker_shooting_f2` 823.
  The 11 idle / non-shooting enemy sprites and `enemy_civilian.png` are byte-untouched.
- **Gates.** `fill-sprite-holes.mjs --check` PASS (0 px would fill — figures stay solid);
  `retouch-flash-halos.mjs --check` PASS (idempotent). `check-sprite-integrity.mjs` over
  the full set: the failing set **shrank 16 → 9** — the speckle sweep took 8 previously
  failing shooting sprites to PASS (comps=1); no sprite regressed PASS → FAIL. Its
  CI-scoped target `enemy_civilian.png` still PASSES (untouched).
- **Detached muzzle flash (accepted consequence).** On `enemy_shooting_3` and
  `enemy_riot_shooting` the flash was attached to the figure ONLY through the dark remnant;
  removing the remnant leaves the bright flash as its own opaque island, so those two drop
  below the 97% dominance line (they were already failing at baseline, on speckle). This is
  **purely topological** — the game renders every opaque pixel regardless of component, so
  the flash renders identically at the muzzle; it reads clean on a light background at
  512px and 64px. The FIGURE stays whole and dominant. Not a fragmentation defect.
- **Deliberately left (game-graphist charter: err on keeping).** Small dark bits nested in
  the flash-ray concavities that the solidify silhouette claims as body (a thin frame on
  the riot flash tips) — removing them would break `--check`; they read as flash, not a
  rectangle. Idle-sprite feet contact shadows are untouched (no zone).
- **Coupling / recalibration gotchas.** The reconcile mirrors `fill-sprite-holes.mjs`
  PASS-A; re-sync if that morphology changes (the binding oracle is its `--check`, run
  after applying). Zones/thresholds are measured on the current committed bytes; if a sprite
  is force-regenerated they must be re-measured (same caveat as ADR-0014's `RETOUCH_SPECS`),
  and any regen must still clear the integrity gate, the game-graphist AI-defect sweep, the
  lead-art asset gate and the merge panel before shipping.
- Cross-references: ADR-0013 (shared keyer / enclosed-island flood), ADR-0014
  (sprite-integrity gate + deterministic per-sprite retouch precedent + the solidify pass
  this reconciles with).
