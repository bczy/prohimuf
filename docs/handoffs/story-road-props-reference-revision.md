# Handoff — road-prop reference revision (7-kind board hunt)

**Intake** (Bertrand, 2026-07-20, verbatim): « revois tous les propos de rue suivant les nouveaux pipeline avec recherche de référence et » (message truncated after "et" — flagged, follow-up may complete it).

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

## 2. PROMPT-DELTA REVIEW — concept-artist (Maud) — pending curation

- claim: review the 8 road-prop prompts (currently in `docs/art/prompts-road-props.md` §"Lead-art gate", verbatim in `levelArt.json` `nearForegroundArt`) against the 7 newly hunted boards + the pre-CURATED traffic-light board, identify any prompt refinements that reference discovery surfaces.
- gate-dependency: **blocked until Bertrand's curation verdicts** on the 7 proposed boards land (needed to know which references are KEEP vs DROP before delta review).
- release: prompt-delta report (prose findings, proposed edits if any to the 8 prompts per reference alignment).
- next: lead-art gates any proposed deltas.

## 3. PROMPT-DELTA GATE — lead-art (Nico) — pending delta report

- claim: gate any proposed prompt refinements from the concept-artist's reference-alignment review (step 2) against §1, §2 laws, house-style/C1/no-text compliance.
- gate-dependency: **blocked until step 2 complete** (no delta = no gate; delta gate only if concept-artist flags refinements).
- release: PASS or PASS-WITH-CORRECTIONS on proposed deltas (if any), recorded in the delta report. Conditions carry forward.
- VERDICT format: PASS or PASS-WITH-CORRECTIONS — Prompt-delta gate (lead-art) — upon release.
- next: dev-tooling-assets applies gated deltas (if any) to `levelArt.json` + `docs/art/prompts-road-props.md`.

## 4. DEV (tooling lane) — dev-tooling-assets (Amelia) — pending gated deltas

- claim: apply lead-art-gated prompt deltas (if any, from step 3) to `levelArt.json` `nearForegroundArt` + `docs/art/prompts-road-props.md`, keeping verbatim alignment with any refined strings; confirm `check-art-prompts.mjs --set nearForeground` passes.
- gate-dependency: **blocked until step 3 gate complete**. If no delta approved, this step is a no-op (stage 4 skipped with entry "4. (no prompt delta approved)").
- release: **DONE** (if deltas exist) or **SKIPPED** (if no delta). File List (if applied): `levelArt.json` (nearForegroundArt block), `docs/art/prompts-road-props.md`.
- next: verify tsc/vitest/lint; merge gate.

## 5. VERIFY — qa-lead (Inès) — after dev-tooling-assets

- claim: confirm `tsc`/`vitest`/`lint`/`prettier` all green on the gated prompt-delta edits (if any).
- release: **GREEN** (if deltas applied) or **SKIPPED** (if no delta).
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
