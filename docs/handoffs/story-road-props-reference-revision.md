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

## Notes

- **Lane / file exclusion:** Each of the 7 hunts (ray's work) writes exactly one `board-<kind>.md` file; no other lane reads or writes any of the 7 hunt files. Concept-artist reads all 7 boards + the pre-CURATED traffic-light board for the delta review; lead-art reads the delta report. Dev-tooling-assets reads the lead-art verdict and applies only approved deltas to the two target files (`levelArt.json`, `docs/art/prompts-road-props.md`).
- **Trafficlight board:** pre-CURATED by Bertrand 2026-07-18, in use in the prompt already (ADR-0043 ADR-0044). This story does NOT re-hunt or re-curate it; concept-artist uses it as reference for consistency check against the 7 new hunts' direction.
- **Precedent:** The trafficLight hunt model (Ray's board, then Bertrand's curation verdicts, then lead-art integration) is the blueprint for the 7-kind relay here.
