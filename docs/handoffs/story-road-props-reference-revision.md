# Handoff — road-prop reference revision (7-kind board hunt)

**Intake** (Bertrand, 2026-07-20, verbatim): « revois tous les propos de rue suivant les nouveaux pipeline avec recherche de référence et » (message truncated after "et" — flagged, follow-up may complete it).

**Intake completion** (Bertrand, 2026-07-20, follow-up, verbatim): « et fais attention au sens de la caméra, la rue est vue de profil. la caméra regarde du trottoir vers la batiment ». **Binding camera constraint for stages 2–3 (delta review + gate):** the street is seen in strict profile; the camera looks from the opposite pavement toward the facade. The props stand on the facade-side kerb (renderOrder: props 5 < courier 6 < delivery van 7 — props sit BEHIND the street traffic), so every prop is seen from its **road-facing side** (the face turned toward the roadway/camera), street axis in profile. The concept-artist pass must audit every orientation clause of the 8 gate-final prompts against this (e.g. parkingMeter "road-facing front" screen = correct and visible; streetSign plate faces the road; bench seat faces the road; trafficLight vehicle head strict profile + ped head face-on, per the CURATED board). Any prompt clause that would depict a prop's sidewalk-facing back is a delta.

**Interpretation**: Revise all 8 near-foreground road props (ADR-0047/0049 — parkingMeter, lamppost, wallaceFountain, trafficLight, bollard, scooter, bench, streetSign) through the NEW reference pipeline (reference-hunt boards under `docs/art-direction/references/boards/`, lead-art curation into `docs/references/art-culture.md`, per ADR-0043/0044). Currently only trafficLight carries a hunted and CURATED board (`board-traffic-light.md`, CURATED by Bertrand 2026-07-18); the other 7 rest only on the citation doc `docs/art/references-road-props.md`. The gate-final prompts already PASSED (`docs/art/prompts-road-props.md`, 8/8 PASS 2026-07-19) and are verbatim in `levelArt.json` `nearForegroundArt`. This story relays the 7 missing hunts in parallel, integrates any prompt deltas flagged by reference discovery, gates them, and stages the prompt/board alignment for generation.

**Blockers**: (1) POLLINATIONS_TOKEN repo secret NOT SET — regeneration impossible until Bertrand sets it (flagged in story-road-props-gptimage.md § Verify). (2) Boards cannot self-curate — Bertrand verdict required on each board's KEEP/DROP/ADD recommendations before lead-art curates into `docs/references/art-culture.md`.

## 1. REFERENCE HUNT × 7 (parallel) — graphic-references (Ray)

- claim: relay the hunt for 7 near-foreground road-prop boards (parkingMeter, lamppost, wallaceFountain, bollard, scooter, bench, streetSign) — one board per kind, same protocol as `board-traffic-light.md` (ADR-0043/0044 reference loop). Hunt context supplied by orchestrator on Bertrand's behalf; each board is authored independently, status PROPOSED until Bertrand's curation pass. Traffic-light hunt is already CURATED and out of scope for this pass.
- release: **PROPOSED** — 7 new reference boards delivered:
  - `docs/art-direction/references/boards/board-parking-meter.md` (horodateur)
  - `docs/art-direction/references/boards/board-lamppost.md` (réverbère)
  - `docs/art-direction/references/boards/board-wallace-fountain.md` (fontaine Wallace)
  - `docs/art-direction/references/boards/board-bollard.md` (potelet)
  - `docs/art-direction/references/boards/board-scooter.md` (mobylette, décor family only)
  - `docs/art-direction/references/boards/board-bench.md` (banc)
  - `docs/art-direction/references/boards/board-street-sign.md` (panneau)

  File List: one file per kind in `docs/art-direction/references/boards/`. No lane writes another's file.

- next: Bertrand's curation pass (KEEP/DROP/ADD verdicts on each board); then lead-art gates prompt delta.
- **release note (2026-07-20): DONE — 7/7 boards delivered** (all PROPOSED). Claims-audit outcome: parkingMeter 7 verified / 4 unsourced / 0 contradicted; lamppost traits+traps verified, 1853-69 figures unsupported (softened); wallaceFountain verified incl. real dolphins + 2.71 m, 1 CONTRADICTED (no single-caryatid petite — taxonomy fixed in the reference doc); bollard verified w/ nuances (1990s start, post-2001 saturation; hip-to-chest height); scooter verified (BW = Big Wheels nuance; bare-rack DROP reinforced); bench 8 verified / **2 CONTRADICTED** (street/garden typology inverted; straight Davioud backrest) → the one prompt delta of this pass; streetSign verified (plaque vs panneau distinction sourced, ~2:1 numerically unsupported). WebFetch 403'd through the proxy on most domains — every VERIFIED claim rests on ≥2 convergent WebSearch sources, flagged per board.
- **addendum (2026-07-20, Bertrand): +1 hunt — `board-phone-booth.md`** (cabine téléphonique France Télécom, PROPOSED, roster-EXTENSION candidate — kind absent from ADR-0047/0049; needs its own pm/senior-architect pass after Bertrand's KEEP). Model: glass-and-aluminium cabin, full-height tinted panes stopping ~40 cm short of the ground, blank roof band, Télécarte console inside; network peak ~241-250k booths in 1997-98 (the game's year IS the peak); keying risk = enclosed magenta behind glass → solid opaque mid-grey panes per the lamppost-lantern precedent.

## 2. PROMPT-DELTA REVIEW — concept-artist (Maud) — pending curation

- claim: review the 8 road-prop prompts (currently in `docs/art/prompts-road-props.md` §"Lead-art gate", verbatim in `levelArt.json` `nearForegroundArt`) against the 7 newly hunted boards + the pre-CURATED traffic-light board, identify any prompt refinements that reference discovery surfaces.
- gate-dependency: originally blocked on Bertrand's curation verdicts; **proceeded early on Bertrand's direct camera directive** (intake completion) — deltas rest only on multiply-sourced CONTRADICTED claims, not on curation-sensitive picks.
- release: **DONE (2026-07-20)** — `docs/art/prompts-road-props.md` § "Reference-revision delta review": camera-orientation audit **8/8 CONFORME** (the 2026-07-19 gate had already framed every prop road-face toward camera); ONE delta proposed — [S7] bench backrest reclination → straight (board-bench CONTRADICTED trait); backrest slat-multiplicity deferred to an art-advisor photo check; 7 no-delta confirmations.
- next: lead-art gates the [S7] delta.

## 3. PROMPT-DELTA GATE — lead-art (Nico) — pending delta report

- claim: gate any proposed prompt refinements from the concept-artist's reference-alignment review (step 2) against §1, §2 laws, house-style/C1/no-text compliance.
- gate-dependency: **blocked until step 2 complete** (no delta = no gate; delta gate only if concept-artist flags refinements).
- release: **DONE (2026-07-20)** — `docs/art/prompts-road-props.md` § "Lead-art delta gate": camera audit COUNTERSIGNED 8/8; **[S7] bench delta PASS (clean, no tightening)** — the delta-applied FINAL [S7] string is the new tooling contract (replaces 2026-07-19); slat-multiplicity DEFERRAL CONFIRMED (DIG → art-advisor photo check, separate follow-up). Asset gate + trafficLight composite gate still owed downstream, unchanged.
- VERDICT: **PASS — Prompt-delta gate (lead-art), 2026-07-20.**
- next: dev-tooling-assets applies gated deltas (if any) to `levelArt.json` + `docs/art/prompts-road-props.md`.

## 4. DEV (tooling lane) — dev-tooling-assets (Amelia) — pending gated deltas

- claim: apply lead-art-gated prompt deltas (if any, from step 3) to `levelArt.json` `nearForegroundArt` + `docs/art/prompts-road-props.md`, keeping verbatim alignment with any refined strings; confirm `check-art-prompts.mjs --set nearForeground` passes.
- gate-dependency: **blocked until step 3 gate complete**. If no delta approved, this step is a no-op (stage 4 skipped with entry "4. (no prompt delta approved)").
- release: **DONE (2026-07-20)** — gate-FINAL [S7] string copied verbatim into `levelArt.json` `nearForegroundArt.types.bench.prompt` (seed 6107, size, asset unchanged; other 7 kinds untouched). Applied by the orchestrator as a verbatim single-string copy (micro-edit exception); `check-art-prompts.mjs --set nearForeground` + tsc/vitest/lint run at stage 5. File List: `src/game/levels/levelArt.json`, `docs/art/prompts-road-props.md` (delta review + gate sections appended by stages 2-3).
- next: verify tsc/vitest/lint; merge gate.

## 5. VERIFY — qa-lead (Inès) — after dev-tooling-assets

- claim: confirm `tsc`/`vitest`/`lint`/`prettier` all green on the gated prompt-delta edits (if any).
- release: **GREEN (2026-07-20)** — typecheck OK, vitest 816/816, eslint OK, prettier applied, `check-art-prompts.mjs --set nearForeground` PASSED (one non-blocking negation-budget warning on the bench string — the gate-accepted "not curved or reclined" clause; contract errors zero). Environment note: one test run initially failed (`gen-nearfg-sprites` fail-fast-token) because the operator token supplied in-session had been stashed at the LEGACY_TOKEN_PATH the script reads — token relocated off that path (it is unusable in-sandbox anyway: the egress proxy 403s `image.pollinations.ai`); suite green after. Generation remains CI-only, blocked on the unset `POLLINATIONS_TOKEN` repo secret.
- next: merge gate.

## 6. MERGE GATE — code-review panel (4-reviewer) — after verify

- claim: stage-6 gate on the reference-revision + any prompt-delta edits (diff: `origin/main...HEAD`). No logic/asset changes, only reference boards + prompt prose/JSON.
- release: MERGE-cleared or findings triage (same panel protocol, adversarial verification).
- VERDICT: (TBD, after review).
- next: pm accepts.

## 7. ASSET GATE — lead-art (Nico) — 2026-07-20

- claim: run the ASSET GATE owed from the road-props story (the prompt-gate PASS of stage 3
  did NOT cover the produced pixels). Inspected the 8 generated PNGs landed on
  `claude/rue-propos-pipelines-revision-r4g52z` (CI run, commit `e98629d`, seeds 6101-6108,
  gate-final prompts incl. the [S7] straight-backrest delta) at
  `public/assets/nearfg/*.png`, plus the pre-rendered lit composite
  `trafficLight_composite_v2.png` at the new tuned `lenses` anchors (vehicle y
  0.094/0.193/0.292, ped y 0.44/0.537; vehicle green + ped red).
- method: Read every PNG; then composited each over contrasting grounds (magenta/dark) and
  ran a border-flood enclosed-hole + pink-residue + saturated-hue sweep (non-binding
  mechanical pre-check, taste-overridable). Mechanical result, all 8: **0 enclosed
  transparent holes, 0 pink/magenta residue pixels, 0.00 % saturated-hue** (strict C1
  monochrome confirmed, incl. the trafficLight base — dead lenses, no baked colour). No
  keyer-revealed anatomy hole in any of the flagged risk zones (bench slat gaps, scooter
  wheels, lamppost lantern, wallace caryatid ring, streetSign plate interior — all solid).

### Per-prop verdict

| Prop            | Verdict            | One-line reason (bible anchor)                                                                                                                                                                                                                                                                                                                                                                           |
| --------------- | ------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| parkingMeter    | **PASS**           | Schlumberger horodateur reads: single steep rain-cap wedge top, thin pole ≪ bulky head, blank recessed screen + wide coin slot + low ticket slot + indented vent ridges. Monochrome, no holes, silhouette holds downscaled (§2 law 3, C1).                                                                                                                                                               |
| lamppost        | **PASS**           | Col-de-cygne candélabre: fluted flared base, tapering fluted shaft, single S swan-neck arm near the top, faceted lantern with pointed cap drawn as **solid opaque panels** (lantern keys solid — 0 holes). One clean printing (§2 law 2).                                                                                                                                                                |
| wallaceFountain | **PASS**           | Grande modèle 4-caryatide: octagonal pedestal, four figures fused into one closed silhouette (inter-figure gaps solid, 0 holes), dome with small rounded bumps, hourglass profile pinched-base/wide-mid/tapered-dome. Reads squat & lower than the lamp.                                                                                                                                                 |
| trafficLight    | **PASS-with-note** | Casquette tunnel-hoods jut sideways (road-facing profile cue) + ped head face-on — two heads, two readings, NOT the flat face-on Bertrand DROPPED (board-traffic-light). C1 clean (satPct 0). **Note:** vehicle lenses read as partial discs tucked under the deep visors (a 3/4 read) rather than [S4]'s literal "edge-on narrow dark slivers" — see composite gate + escalation below.                 |
| bollard         | **PASS**           | Ball-top potelet: smooth unbroken shaft, slight flared foot, single rounded cast-iron ball cap, squat/low. Simplest silhouette in the set, reads cleanly at its ~60-90 px game size (smallest prop). Ball specular dot is a painted value highlight, not a glow.                                                                                                                                         |
| scooter         | **PASS-with-note** | Plastic-fairing scooter — step-through floorboard, front leg-shield, round headlamp, single mirror stalk, **bare empty rear rack / no top-box → AC6 satisfied**, does NOT read as the interactive delivery moto. **Note:** carries a **baked ground/contact shadow** under the wheels — the only prop in the set with a baked ground, an off-family tell vs §2 law 2 ("same ground"). Retouch fix below. |
| bench           | **PASS**           | Davioud straight-back bench — the **[S7] delta LANDED**: backrest is **upright/vertical, not reclined**. Flush horizontal slats (no daylight gaps, 0 holes), heavy floral-scrollwork cast-iron end frames bulkier than the slats, resting on pavement, no armrest dividers. Widest silhouette, reads long-and-low.                                                                                       |
| streetSign      | **PASS**           | Landscape blank plate, bold single keyline border, one slender post ≪ plate on a splayed foot, single flat plane (not the barred US double-post). Face blank (no baked text). Plate interior solid opaque (0 holes), monochrome. Carries no neon → will not falsely read as interactive (loi du glow intact).                                                                                            |

### Composite gate (Gate 4) — trafficLight lit lenses

- **PASS.** On `trafficLight_composite_v2.png`: **green sits on the bottom vehicle lens**
  (y≈0.29, the "go" position) and **red on the top pedestrian window** (y≈0.44, the
  standing-man position) — both on the correct windows, aligned to the new tuned anchors.
- **« Un halo est un dégradé, jamais un aplat » (§2.1): SATISFIED.** Both the green and red
  halos are soft radial dégradés falling off to zero at the outer margin — no binary-alpha
  aplat, no hard-edged decal. The only added hue is the two lit lenses + their bloom; the
  B&W housing stays neutral.
- This composite is exactly why the trafficLight PASS-with-note (3/4 vehicle lens vs strict
  edge-on sliver) is the **right** call, not a defect: a pure edge-on lens sliver could not
  present a face for the diegetic green dot to land on. The delivered 3/4 lens (partial disc
  under a deep jutting hood) keeps the hooded road-side profile read AND makes the lit-lens
  state legible. The board's "lens faces not visible" line predates the committed render-side
  lit-lens approach (board §"Note for concept-artist", option (a)); the two are in tension.

### Escalation (board ↔ delivered tension — Bertrand, tie-breaker)

- Bertrand CURATED `board-traffic-light.md` on the explicit point that the vehicle head must
  be **strict profile, lens faces NOT visible** (he DROPPED the MSR25 fiche _because_ its
  vehicle heads were face-on). The delivered sprite honours the load-bearing half (hoods jut
  sideways, two heads read distinctly) but shows the vehicle lens faces as partial discs so
  the render-side green/red lit-lens composite can read. I am **PASSing** it because the
  deviation serves the diegetic composite and readability and is NOT the flat face-on he
  rejected — but flagging the board-text ↔ shipped-art contradiction for Bertrand's ruling.
  No regen requested on my authority; if he wants literal edge-on slivers, that reopens the
  lit-lens composite design (Gate 4), not just this sprite.

### Fixes (prefer retouch/render-side over seed bump — a seed bump swaps reviewed art)

- **scooter (baked ground shadow):** cheapest fix is a **scripted retouch** to erase/crop the
  baked contact-shadow band beneath the wheels (or mask it render-side), restoring "same
  ground" family parity with the other 7 props — **not** a seed bump (which would re-roll the
  whole reviewed, AC6-passing sprite). Non-blocking for merge; log as a follow-up retouch.

### PROMOTE (ADR-0043 heroes)

- **None recorded.** `nearForegroundArt` is not a wired hero family, and PROMOTE is recorded
  only for **humans**, not machine-wired props — all 8 here are set-dressing props. Craft note
  only (not a PROMOTE): lamppost and wallaceFountain are the two strongest renders of the set.

### VERDICT

- **ASSET GATE: PASS — 8/8 usable, 0 FAIL, 0 regen required.** 6 clean PASS (parkingMeter,
  lamppost, wallaceFountain, bollard, bench, streetSign) + 2 PASS-with-note (trafficLight —
  board↔render tension escalated to Bertrand, no rework; scooter — baked shadow, follow-up
  retouch). **Composite gate (Gate 4): PASS** (correct windows, halo dégradé to zero, §2.1
  clean). The [S7] straight-backrest delta is correctly reflected in the bench sprite.
- next: pm/product acceptance; dev-tooling-assets to schedule the scooter shadow retouch as a
  follow-up; Bertrand's ruling on the trafficLight profile-vs-lit-lens tension when convenient.

## Notes

- **Lane / file exclusion:** Each of the 7 hunts (ray's work) writes exactly one `board-<kind>.md` file; no other lane reads or writes any of the 7 hunt files. Concept-artist reads all 7 boards + the pre-CURATED traffic-light board for the delta review; lead-art reads the delta report. Dev-tooling-assets reads the lead-art verdict and applies only approved deltas to the two target files (`levelArt.json`, `docs/art/prompts-road-props.md`).
- **Trafficlight board:** pre-CURATED by Bertrand 2026-07-18, in use in the prompt already (ADR-0043 ADR-0044). This story does NOT re-hunt or re-curate it; concept-artist uses it as reference for consistency check against the 7 new hunts' direction.
- **Precedent:** The trafficLight hunt model (Ray's board, then Bertrand's curation verdicts, then lead-art integration) is the blueprint for the 7-kind relay here.

## Follow-up stories opened (pm)

- `_bmad-output/planning-artifacts/story-lamppost-lantern-glow.md` — Bertrand-directed
  night glow/halo on the near-foreground lamppost lantern (render-side, second C1
  exception after trafficLight); needs design loop + gpu-specialist perf verdict +
  lead-art composite gate before build.
- `_bmad-output/planning-artifacts/story-far-side-street-props.md` — place the saved
  `bench_front`/`parkingMeter_front` sprites on the camera-side kerb (new render
  placement layer + data model); central risk is occlusion of gameplay-critical
  elements, gated by the design loop before any implementation.
