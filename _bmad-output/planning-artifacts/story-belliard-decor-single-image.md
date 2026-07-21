# Story — Rue Belliard décor: single wide-image backdrop integration (retires troncon-sequence)

**Type:** décor swap + gameplay re-fit (rendering + level-data change, no new mechanic).
**Depends on / amends:** ADR-0048 (`troncon-sequence backdrop mode`), ADR-0047 (near-foreground
parallax), `story-near-foreground-parallax.md` (PR #76 origin of ADR-0048), `story-belliard-decor-references.md`
(art curation + prompt gate history).

## Why

Bertrand validated **décor v4**: Rue Belliard's backdrop becomes **ONE drawn wide image**
(`public/assets/levels/belliard/street-wide.png`, 6656×1248, ≈5.3:1, N&B fanzine/Tardi register)
instead of the 4-tile `troncon-sequence` mode shipped under ADR-0048 (`troncon-a/b/c` tiled
`a, c, b, c`, transparent between-building gaps showing the parallax sky through). The asset is
**committed** (PR #122, branch `claude/belliard-decor-v3-clean`) via a bespoke pipeline —
`scripts/gen-street-paid.mjs` (paid `ideogram-v4-quality`, CI `gen-street-experiment.yml`) +
`scripts/stitch-belliard-street.mjs` (butt-joins two street renders into one wide, tone-matched
image) — **not** the standard Pollinations/FLUX `levelArt.json` prompt-gate pipeline. It is **not
wired**: `levelArt.json`/`levels.ts` still declare `backdrop.mode: "troncon-sequence"` pointing at
`troncon-a/b/c`, so the desaturated 4-tile décor is what actually renders today.

Ship it because the single continuous image is the **art-validated, final** direction (Bertrand's
call, already made) — this story is the integration debt that makes the committed asset the one
the player actually sees, and closes out the troncon-sequence detour cleanly (frozen contract
amendment, not a new feature).

## Cahier des charges check

> "Did Prohibition Atari ST have a street backdrop behind the shooting gallery?"

**Yes** — a continuous street façade is core, faithful decor; nothing new is being added to the
game's feature set. The swap from 4 tiles to 1 image is a **production/rendering simplification**,
not scope growth. The one place this story touches gameplay rules — **repositioning window pop-in
zones, the hostage-taker anchor, and street cover objects to the new geometry** — is a **necessary
consequence** of the asset swap (the old positions were tuned to buildings/gaps that no longer
exist at the same coordinates), not a new mechanic. It must still be **consciously verified**
(playtest, not carried over blind) because the new image is materially narrower than the old
tiled sequence (§Known numbers below) — this is the one part of the story with real design risk.

## Known numbers (context, not prescriptive — architect/game-designer own the exact geometry)

- `WORLD_HEIGHT = 12` (`manifest.world.heightUnits`).
- **Old** belliard `fullW` (troncon-sequence, aspects 1.6491/1.9224/1.7857/1.9224, `TRONCON_GAP = 0`):
  ≈ `7.28 × 12` ≈ **87.4 world units**.
- **New** `street-wide.png` aspect = `6656 / 1248` ≈ `5.333` → `fullW` ≈ `5.333 × 12` ≈
  **64 world units** — **≈27% narrower**. This shrinks spawn/traversal space for the same
  `enemiesToWin: 10` / `timeSeconds: 90`, and invalidates the hostage-taker captor's authored
  anchor (`hostageQte.anchor.x = 9.9`, a comment in `levels.ts` records it was tuned to
  "troncon-b's tile centre" specifically to avoid a black sky-gap void behind the captor at the
  ×2.4 QTE zoom — that gap no longer exists in the new opaque image, but the anchor's absolute
  position needs re-validation against the new art regardless).

## Scope

1. **Rendering — single-image backdrop.** Belliard's backdrop stops being 4 tiled `troncon-*`
   images and becomes the ONE `street-wide.png` image, composed with:
   - `ground.png` (trottoir/road band) — unchanged asset, current composition logic re-targeted
     to the new single-tile geometry.
   - `sky.png` — **do not reopen**. `LevelBackdrop.tsx` currently renders troncon-mode's sky
     layer as deliberately EMPTY (canvas background shows through above the roofline and through
     gaps); Bertrand is handling the sky treatment separately. This story must not change what is
     or isn't drawn there — whatever the hand-off point is, leave a clean seam for his task, not a
     silent behavior change.
   - The near-foreground layer (ADR-0047) — unchanged mechanism, its authored objects are
     re-tuned per point 3, not its rendering.
   - The hostage-taker QTE crop (×2.4 zoom on `hostageQte.anchor`) — must read cleanly against
     the new art (no void, no seam) after the anchor is repositioned (point 3).
2. **Window-zones re-calibration.** The cop/window pop-in positions (`windowZones.generated.json`
   belliard entry, produced by `scripts/gen-window-zones.mjs` / the ADR-0028-addendum detector in
   `scripts/align-troncon.mjs`) were tuned per-tronçon. They must be regenerated/re-tuned against
   the real window openings drawn in `street-wide.png` so cops keep popping on painted windows,
   not blank wall. (Whether this reuses the existing per-tile detector unchanged or needs
   adaptation for a single continuous image is a `dev-tooling-assets`/`senior-architect` call.)
3. **Gameplay — reposition barriers/street-cover and enemies for the new width.** Bertrand asked
   explicitly for this to be in scope, not deferred:
   - **Street cover / "barrières"** — read as the near-foreground street-furniture layer
     (`nearForeground.objects`: bollards, benches, lamppost, parking meters, traffic light, street
     sign — normalized `x` anchors over the full street width). Their positions are stored as
     fractions so they don't literally break, but their **visual grounding against the new,
     differently-paced building rhythm and the ≈27%-narrower street** needs a re-tuning pass so
     nothing reads as floating or mismatched to the art behind it. *(Assumption flagged for
     game-designer/senior-architect to confirm against Bertrand's intent — "barrières" has no
     dedicated gameplay entity in the codebase today; this is the closest existing concept. If
     Bertrand meant something else, correct this before DEV opens.)*
   - **Enemies** — the hostage-taker captor anchor (`hostageQte.anchor`) and the window spawn
     zones (point 2) must sit correctly on the new, narrower world. `enemiesToWin`/`timeSeconds`
     stay as-is **unless** `game-designer` playtest shows the new width materially changes pacing
     (see AC6) — this is a verify, not a blind carry-over.

## Acceptance criteria

| # | Given | When | Then |
| --- | --- | --- | --- |
| AC1 | `street-wide.png` is committed | Belliard's `levelArt.json`/`levels.ts` `backdrop` config is updated | Belliard renders the ONE `street-wide.png` image, correctly scaled (no stretch/squash) to `WORLD_HEIGHT`, with no visible seam or repeat artifact. |
| AC2 | The new backdrop is live | Composed with `ground.png`, the near-foreground layer, and whatever the current sky treatment is | The composite reads correctly on desktop (16:9) and both mobile orientations — no gap, no misaligned band, no z-order glitch. Sky compositing is **unchanged behavior** vs. pre-story (not reopened). |
| AC3 | Window pop-in zones are regenerated for `street-wide.png` | A wave spawns / the layout-aware harness (ADR-0028) runs | Cop pop-ins land on real painted windows; the SCREEN-validation round-trip passes; `game-designer` playtest confirms no off-window pops. |
| AC4 | `hostageQte.anchor` is repositioned | The hostage QTE triggers and zooms ×2.4 | The captor tableau reads against the drawn facade — no void, no seam bisecting the frame — confirmed by `game-designer` playtest (the PR #76 black-void regression must not recur). |
| AC5 | Near-foreground street-cover objects (`nearForeground.objects`) are reviewed against the new geometry | The level is played end to end | No object floats disconnected from the kerb line or reads mismatched against the building rhythm behind it (art/game-designer call on any re-tune needed). |
| AC6 | The new world is ≈27% narrower (`fullW` ≈ 64 vs. ≈87 world units) | `game-designer` plays the full level (delivery, courier street, hostage QTE, kill count, timer) | Pacing is re-validated against spec; `enemiesToWin`/`timeSeconds` are retuned **only if** the playtest shows a material drift — decision and rationale recorded in the story hand-off, not silently carried over. |
| AC7 | `stalingrad` and `vitry` are on the untouched `single-facade` path | Any part of this story ships | Their config, rendering, and `backdropLayout.test.ts`/`facadeLayout.test.ts` coverage stay **byte-identical** — zero diff in their rendered output or test expectations. |
| AC8 | `backdropLayout.test.ts` is the FROZEN ADR-0048 cross-lane contract | Belliard's geometry changes from a 4-tile sequence to 1 tile | The contract is **knowingly amended** for belliard (new tile count/geometry) with an explicit ADR update (amend ADR-0048 or supersede it — `senior-architect`'s call), never a silent test-value edit with no paper trail. |
| AC9 | Implementation is complete | `rtk tsc` / `rtk vitest` / `rtk lint` run | All green. `verify` skill end-to-end run confirms Belliard is fully playable (delivery, courier, hostage QTE, kill count, timer) with the new backdrop. Composite/runtime-visual result passes the `lead-art` Gate 4 screenshot review. |
| AC10 | This image's asset-gen path is non-standard (paid `ideogram-v4-quality` + bespoke stitch script, not the `levelArt.json` FLUX prompt-gate flow) | The story ships | The pipeline is documented (owner: `dev-tooling-assets`/`tech-writer`) so a future regeneration request doesn't default to the standard prompt-gate flow by mistake. |

## Out of scope

- **Sky compositing** (`sky.png` / above-roofline treatment) — Bertrand's separate, parallel task.
  Do not touch the current behavior; leave a clean interface point.
- Any change to `stalingrad` or `vitry` (config, rendering, tests).
- New gameplay mechanics, new `NearForegroundKind` values, new enemy kinds.
- Re-generating or re-stitching `street-wide.png` itself — the asset is **final/validated**; this
  story is integration only, not a new art gate. (If the composite-gate screenshot review surfaces
  a genuine art defect, that reopens a `lead-art`-owned art fast-follow, not this story's scope.)
- Deleting the now-unused `troncon-a/b/c.png` / legacy `facade.png` files from disk — a
  `dev-tooling-assets` housekeeping call, not blocking this story.
- Persisting or UI-surfacing any of the repositioned values.

## Risks / open questions (for senior-architect + game-designer, biggest first)

1. **Frozen-contract drift.** `backdropLayout.test.ts` is explicitly labeled a frozen cross-lane
   contract (ADR-0048). Amending it for belliard without an equally explicit ADR update risks the
   next contributor not knowing why belliard's shape changed, or accidentally regressing
   stalingrad/vitry while "generalizing" the pipeline. Mitigation: AC7 (byte-identical regression
   test) + AC8 (paper trail) are both blocking.
2. **Pacing drift from the ≈27% narrower world.** Same `enemiesToWin`/`timeSeconds` on a smaller
   street changes effective density and traversal time. Mitigation: AC6, `game-designer` playtest
   gate before merge, matching ADR-0048's own risk register item #3.
3. **Window-zone re-detection behavior on a continuous image vs. isolated buildings-on-transparency.**
   The current detector (`scripts/align-troncon.mjs`, ADR-0028 addendum) was built for per-tronçon
   art; it may need adaptation, not just a re-run, for one continuous street. `senior-architect` to
   confirm feasibility before lanes are cut (may need a `tech-scout` spike if the detector's
   assumptions don't hold).
4. **Hostage-QTE anchor regression repeat.** The captor anchor was already mis-tuned once (PR #76
   black-void note in `levels.ts`). Must be explicitly re-verified against the new art at the
   ×2.4 crop, not assumed fine because the transparency problem that caused it is gone.
5. **Non-standard asset pipeline as a process outlier.** `scripts/gen-street-paid.mjs` +
   `scripts/stitch-belliard-street.mjs` + `gen-street-experiment.yml` (paid `ideogram-v4-quality`)
   sit outside the documented Pollinations/FLUX `levelArt.json` prompt-gate flow. Undocumented,
   this is a landmine for the next regen request. AC10 makes this blocking, not a nice-to-have.
6. **Composite-gate coverage.** This is a runtime-composed, player-visible visual change spanning
   backdrop + ground + near-foreground + QTE crop — must not skip `lead-art` Gate 4 (screenshot
   review) or `qa-lead`'s quality-gate funnel.
7. **"Barrières" interpretation.** Flagged as an assumption in scope point 3 — confirm against
   Bertrand's actual intent before `game-designer`/`senior-architect` lock the design spec, since
   no dedicated gameplay entity of that name exists in the codebase today.

## Suggested lane map (for senior-architect to confirm/amend at TECH PLAN)

| Lane | Likely file(s) | Change |
| --- | --- | --- |
| `senior-architect` | `docs/adr/0048-troncon-sequence-backdrop-mode.md` (amend) or a new ADR | Document the belliard geometry change (tile count, mode discriminator) and the frozen-contract amendment (AC8). |
| `dev-gameplay` | `src/game/levels/levelArt.ts`, `src/game/levels/levelArt.json`, `src/game/levels/levels.ts`, `src/game/levels/__tests__/backdropLayout.test.ts` | Belliard `backdrop` config → single tile; `hostageQte.anchor` reposition; `nearForeground.objects` re-tune; frozen-contract test update for belliard only (stalingrad/vitry assertions untouched). |
| `dev-r3f-render` | `src/render/scene/LevelBackdrop.tsx`, `src/render/scene/GameScene.tsx`, `src/render/scene/facadeLayout.ts`, their `__tests__` | Compose the single image with ground/near-foreground/QTE crop; generalize or branch the troncon-mode rendering path for a 1-tile geometry without touching the single-facade path. |
| `dev-tooling-assets` | `scripts/gen-window-zones.mjs`, `scripts/align-troncon.mjs` (or a successor), `src/game/levels/windowZones.generated.json`, pipeline docs | Regenerate/re-tune belliard window zones against `street-wide.png`; document the non-standard `gen-street-paid.mjs`/`stitch-belliard-street.mjs`/`gen-street-experiment.yml` asset path (AC10). |
| `game-designer` | `docs/game-design/**` (tuning notes) | Playtest verdict on AC4/AC5/AC6 (anchor read, street-cover grounding, pacing); rules on whether `enemiesToWin`/`timeSeconds` need retuning. |
| `qa-lead` | `docs/qa/**` | Test plan + orchestrate VERIFY (tsc/vitest/lint, `verify` e2e, composite-gate funnel). |

## Definition of Done (per `PROJECT_GUIDELINES.md` §9)

- [ ] Cahier des Charges note carried in the PR description (§Why/§Cahier des charges above).
- [ ] `rtk tsc` / `rtk vitest` / `rtk lint` all green.
- [ ] `stalingrad`/`vitry` byte-identical (AC7) — explicit regression test.
- [ ] ADR amendment/supersession for ADR-0048's frozen contract (AC8).
- [ ] `game-designer` playtest sign-off (AC4, AC5, AC6).
- [ ] `lead-art` Gate 4 composite screenshot review PASS.
- [ ] `verify` skill end-to-end pass on Belliard (delivery, courier, hostage QTE, kill count, timer).
- [ ] Non-standard asset pipeline documented (AC10).
- [ ] Hand-off logged in `docs/handoffs/story-belliard-decor-single-image.md`
      (index: `docs/agent-handoffs.md`).
