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

### Iteration 3 — Bertrand review of the committed iter-2 result

Bertrand flagged 3 of the 10 sprites. Two per-file levers and one new pass were added; the
other 7 sprites stay **byte-identical** (their `--check` would-delete is 0 under the new code).

1. **Widened riot splash zones + relaxed SB.** The `enemy_riot_shooting{,_f2}` dark torn
   "wings" reach the **far right of the frame** (measured to x≈0.97), beyond the old x1≈0.84
   zone stop — so the wing tips were never candidates. The zones now span the full island
   (x→1.0). Much of the torn material is **dark-RED** (sat 0.5–0.75), which the default SB=0.5
   spared, so `THRESH_OVERRIDE` now also relaxes **SB→0.85** on those two files (only DARK
   pixels, lum<88, are ever candidates, so the bright/warm fiery core + rays are never touched
   — keep/strip stays a pure dark-vs-bright split). The existing all-opaque reconcile already
   drops a **detached** flash island via its `largestComponent` step, so f1's wings (a separate
   component) are freely removable — Bertrand's "reconcile against the figure's silhouette, not
   flash islands" is **intrinsic** to the reconcile for detached blasts, no new exception
   needed. For the **attached** f2 blast the reconcile keeps only the residual that hugs the
   bright rays within the disk-10 closing; that residual is the exact boundary that keeps
   `fill-sprite-holes.mjs --check` green. A **FIGURE-SEED reconcile** (seed the body from the
   largest component of opaque-minus-flash) was prototyped to strip that residual too and
   **REJECTED**: it deletes inside the fill-sprite-holes body and opened a **539px interior
   hole** in f2 — it violates the hard "figures 100% solid" constraint. The all-opaque
   reconcile is the **maximal removal that never opens an interior hole**.
2. **ERASE_ISLANDS pass (delete-only, tone-agnostic).** `enemy_shooting_3` frame 1's baked
   muzzle flash mis-rendered as a faint **star floating top-right, detached from everything**,
   while the pistol actually aims **right** (muzzle tip ≈ 0.77, 0.44 normalized). The tone
   guards would PRESERVE that bright star, so a new pass deletes every opaque pixel in a tight
   zone that is **not part of the largest raw component** (the figure) — figure-safe by
   construction, however wide the rect. The in-game glow is hand-anchored at the measured
   muzzle tip via the manifest (separate lane). Frame 2 (`enemy_shooting_3_f2`) keeps its
   flash: it is **one connected component** sitting at the recoiled gun and reads correct →
   **not** erased.

**Scope**: runs in place on the 10 shooting sprites that have zone entries.
`enemy_civilian.png` (the bicycle courier) has no entry → never processed (non-combatant,
no flash, courier lane, already ADR-0014-fixed). `retouch-flash-halos.mjs` is **not** wired
into CI (explicit human-run fix, like `retouch-sprites.mjs`).

### Iteration 4 — Bertrand review: "Relance un remplissage, tu as fait des trous"

Iter-2/iter-3 **over-deleted**. The zone+tone rule cannot tell a dark FIGURE region from a
dark background remnant, and the solidify reconcile can only protect a region it can still
_reconstruct as body_: once a whole dark figure region inside a zone is deleted, the body mask
collapses around the hole and the reconcile stops reverting it — so the deletion becomes a keyed
hole. Three concrete failures, surfaced only once composited off opaque white / keyed to
transparency:

- **`enemy_shooting_3` chest/cape** — the "torn wings under the bust" zone was the figure's own
  dark jacket/cape; keyed out it left a big hole under the extended arms ("tu vois pas un gros
  trou là").
- **Bust bottoms** (`enemy_shooting_2{,_f2}`, `enemy_shooting_3{,_f2}`) — the "torn jacket-bottom
  remnant" zones chewed ragged bites all along the lower bust silhouette ("beaucoup de trous sur
  tout le bas du buste").
- **Riot blasts + feet** — relaxing SB→0.85 over the widened splash zone ate the blast's own
  dark-red/neutral shading between the bright rays (blast went **lacy/holed**), and the
  under-feet zones bit the boots/ground contact ("pied gauche aussi").

**Fix — restore first, then recalibrate to a fixpoint.**

1. **`scripts/restore-figure-bites.mjs`** (new, ADD-BACK-ONLY; the inverse surgical guarantee of
   the retouch: only `alpha 0→255` + pristine RGB, never a delete; self-check aborts on any
   opaque-pixel change). Reference bytes = the pre-any-retouch commit **c79dfda**. Two regimes:
   - **Bust/figure regime** (every file except the riot pair): restore every deleted pixel that
     belongs to the base **figure** (largest connected component of base-opaque — connected to /
     enclosed by the figure mass) and is **not** inside the file's flash-exclude zone (the
     muzzle-flash area the retouch owns). This restores the _entire_ bust bottom and the chest
     with no morphological trimming — Bertrand's hard line "everything solid, prefer a slightly
     oversized solid bust to any hole" (commit 81a26ad). Truly **detached** fragments (their own
     base component — the floating star, separated torn paper) are excluded → stay deleted.
   - **Riot regime**: `RF` = figure body `opening(largestComponent, disk-4)` minus a 12px
     bright-halo dilation (chunky body/feet, thin wing-spikes opened away); `R2` = **warm**
     (`r−b>20`) pixels inside the blast zone (the dark-red shading that makes the blast read full).
     Grey (`r−b≤20`) torn wings stay deleted.
2. **`scripts/fill-sprite-holes.mjs`** re-run to top up interior holes (riot figures only:
   A=1221 / A=575; the aggressive bust restore left the busts already solid).
3. **`scripts/retouch-flash-halos.mjs` recalibrated to a FIXPOINT** on the restored bytes:
   - **Removed** every figure-covering zone (`enemy_shooting_3` under-bust + left fringe,
     `enemy_shooting_3_f2` bust-bottom + left fringe, `enemy_shooting_2{,_f2}` jacket-bottom, both
     riot **feet** bands) and **retired the two riot files from the zone table entirely** — their
     wings were already gone and a splash zone only re-laced the finished blast (the WARM_GUARD
     alone can't protect the blast's non-warm neutral smoke). `THRESH_OVERRIDE` emptied.
   - Added a global **WARM_GUARD** (`r−b>15` ⇒ never a deletion candidate) protecting fiery /
     dark-red shading in any surviving zone.
   - **Review-panel fixes**: the surgical self-check now asserts the real invariant
     `α≥OPAQUE→0` (was `255→0`, which would falsely abort on a legit semi-opaque deletion); the
     speckle sweep's **global** (not zone-scoped) scope is documented as deliberate — the sweep
     and the solidify reconcile are intentionally image-wide, only per-pixel deletion candidacy is
     zone-confined.

**Iter-4 result** (restored px / then interior-fill): `enemy_shooting_3` 6004, `enemy_shooting_3_f2`
2986, `enemy_riot_shooting` 1328 (+1221 fill), `enemy_riot_shooting_f2` 745 (+575 fill),
`enemy_shooting_2` 725, `enemy_shooting_2_f2` 600. `enemy_shooting{,_f2}` and
`enemy_biker_shooting{,_f2}` restore 0 (audited clean — no hidden figure bite). All four gates green
on the result: `retouch-flash-halos --check` = 0 (idempotent — no re-punch), `fill-sprite-holes
--check` PASS, `restore-figure-bites --check` = 0 (idempotent — restore/retouch no longer fight over
the flash ring), and a 4-connected border flood finds **zero enclosed transparent px anywhere,
including inside the blast islands**. `check-sprite-integrity` on the six: all **PASS** — the busts
are now a single solid component (`comps=1`), `enemy_shooting_3`'s star-erased figure is
`comps=1`, both riot figures stay dominant. Game-graphist read at 512/256/64 on light grey **and**
magenta: bust bottoms continuous and hole-free, `enemy_shooting_3` chest solid, riot blasts read
full (no lace) with wings gone, both boots solid; the AI-defect anatomy sweep on magenta is clean
(limbs rooted, feet attached, no floating member, no punched hole). Restoration is add-back from
pristine base, so no new anatomy was authored.

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
- **Iter-3 result.** Deleted px: `enemy_riot_shooting_f2` 1023, `enemy_riot_shooting` 1472,
  `enemy_shooting_3` 532 (the whole floating star); the other 7 sprites and
  `enemy_shooting_3_f2` are byte-untouched. Both `--check` gates stay PASS after the edit.
  Integrity: `enemy_shooting_3` improved **FAIL → PASS** (star erased → comps 2→1, 100%
  dominant); `enemy_riot_shooting_f2` stays PASS; `enemy_riot_shooting` stays FAIL with its
  figure component **unchanged** (dominant=12686 before and after) — the FAIL is solely the
  bright flash island falling below the 97% dominance line, the same accepted topological
  consequence as below, not a regression. Game-graphist verdict at 512px + 64px on light grey:
  no floating star on shooting_3 f1, no dark torn wings around either riot blast, figures
  intact; the anatomy defect sweep on magenta is clean (no detached limb, no punched hole).
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
  PASS-A; ~~re-sync if that morphology changes~~ — see the extraction note below: the mirror
  is gone. Zones/thresholds are measured on the current committed bytes; if a sprite
  is force-regenerated they must be re-measured (same caveat as ADR-0014's `RETOUCH_SPECS`),
  and any regen must still clear the integrity gate, the game-graphist AI-defect sweep, the
  lead-art asset gate and the merge panel before shipping.

## Shared-morphology extraction (2026-07-14) — the re-sync hazard is retired

story-shared-morphology-lib (PR #40 review-panel follow-up, greenlit by Bertrand): the
geometric primitives (`diskOffsets` / `dilate` / `erode` / `fillHoles` / `largestComponent`
/ `labelComponents` / `zoneMask`) **and** `solidBodyMask` were extracted **verbatim** to
`scripts/lib/morphology.mjs`; **behaviour frozen** (zero PNG byte and zero `levelArt.json`
byte changed). `retouch-flash-halos.mjs`'s ~135-line **mirrored PASS-A block was deleted** —
it now imports the SAME `solidBodyMask` as `fill-sprite-holes.mjs`, so the "re-sync if that
script's morphology changes" hazard called out above is **impossible by construction**:
there is one implementation and it cannot drift. The single geometric divergence
(`fill-bust-hem.mjs`'s `ny>=H` frame-cut erosion) is preserved behind an explicit
`erode(..., { outsideBelowBottom: true })` flag, never unified. Consumers: `fill-sprite-holes`,
`retouch-flash-halos`, `restore-figure-bites`, `fill-bust-hem`, `check-sprite-integrity`
(4-conn), `measure-muzzle-anchors` (8-conn); `cutout-enemies.mjs` keeps its colour-fused
flood local by design. Proven byte-identical: all four `--check` gates green in fixpoint on
the 22 enemy PNGs; write-mode changes 0 PNG; `measure-muzzle-anchors` leaves `levelArt.json`
byte-identical; `check-sprite-integrity` verdicts unchanged; and a full-chain replay from
`c79dfda` produces bytes identical to the pre-refactor code. Unit tests:
`scripts/lib/__tests__/morphology.test.mjs`. See `scripts/SCRIPTS.md` → _lib/morphology.mjs_.

- Cross-references: ADR-0013 (shared keyer / enclosed-island flood), ADR-0014
  (sprite-integrity gate + deterministic per-sprite retouch precedent + the solidify pass
  this reconciles with).

## Iteration 5 (2026-07-14) — authored bust-hem fill on enemy_shooting_3

Bertrand's art gate, after the iter-4 restore: "Je veux que tu remplisses encore
un peu plus le buste de cet ennemi" (enemy_shooting_3). The remaining raggedness
was the ORIGINAL art's torn hem — concave bays whose mouths open on the frame's
bottom border, unreachable by any closing radius and invisible to the enclosed-
hole gates. New `scripts/fill-bust-hem.mjs` AUTHORS fill (the first pass in this
chain allowed to go beyond the pristine base): per-file bounded closing
(disk-22, lower-half region) plus, on frame 1, a frame-cut extension (columns
whose hem mass reaches the bottom band are filled to the frame bottom, matching
the frame-2 silhouette Bertrand approved: "pour lui c'est ok"). New pixels take
the median nearby dark-clothing tone. Add-only with a self-check, iterated to a
fixpoint, `--check` CI-gateable. Run to a JOINT fixpoint with
`fill-sprite-holes.mjs` (the extension can enclose lateral pockets the solidify
then fills). Result: f1 +6,283 px, f2 +1,659 px, all four asset gates green.
