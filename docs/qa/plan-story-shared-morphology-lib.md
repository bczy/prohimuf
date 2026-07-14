# QA Test Plan — Shared image-morphology lib for asset scripts

**Story:** `_bmad-output/planning-artifacts/story-shared-morphology-lib.md`
**Author:** Inès (`qa-lead`) · **Written:** 2026-07-14 · **Stage:** 5 (VERIFY)
**Owning gate:** AC6 (quality) + the HARD ACCEPTANCE LINE — behaviour byte-identical.
**Branch:** `claude/explosion-alignment-transparency-fk5k59` (fresh from main)
**Status:** **PLAN** — written BEFORE the build lands. The dev-tooling-assets lane runs
this same matrix and reports; this file is my independent gate checklist. I fill the
verdict block at the foot only after I have re-run each row myself and read the output.

> Derived from the STORY (AC1–AC7), Winston's stage-3 module contract for
> `scripts/lib/morphology.mjs`, and the producer tracking block in
> `docs/agent-handoffs.md` (§story-shared-morphology-lib). **Not** derived from the
> diff — the diff only tells me where to look hardest. R1/R2 in that tracking block
> (7 files not 5; the copies have DRIFTED, so "extract" is not a pure lift) are the
> reason this gate is byte-oracle-driven, not eyeball-driven.

## What must be true (scope of my verdict)

This is a pure DRY debt paydown in `scripts/` with a HARD, non-negotiable acceptance
line: **zero behaviour change, zero output-byte change.** My gate proves exactly four
things and nothing more:

1. **Fixpoint holds** — every `--check` gate is a no-op on the 22 committed enemy PNGs
   after the extraction; write-mode re-runs change zero bytes on disk (§1).
2. **The extracted lib reproduces the ORIGINAL non-trivial transforms byte-for-byte** —
   not just no-ops. Replaying the real fill pipeline from an older pre-processed source
   (c79dfda) must reconstruct today's committed PNGs exactly (§2). This is the check
   that actually drives dilate/erode/fill/label through the new lib.
3. **The two non-PNG outputs are byte-frozen** — `levelArt.json` after
   `measure-muzzle-anchors` write-mode (§3); `check-sprite-integrity` full-set metrics
   before vs after (§4).
4. **No regression + the duplication is actually gone** — tsc/vitest/lint/prettier green
   with the new unit suite in the SAME vitest run and `src/game` coverage untouched (§5),
   and no morphology primitive survives outside `scripts/lib/` (§6, §7).

If (1)–(4) all hold, the refactor is behaviour-preserving and the desync class the story
exists to kill is removed. AC7 (merge panel) is stage 7, not my gate.

## What I deliberately do NOT cover (and why)

- **Correctness of the morphology maths per se.** The story is behaviour-FROZEN, not
  behaviour-fixing. I do not judge whether the fills are "right" — only whether the new
  single implementation produces the **same** bytes as the shipped baseline. A latent bug
  faithfully preserved is a PASS for this gate (and out of scope by the story).
- **cutout-enemies border-flood parity.** Architect decision (recorded): its floods are
  **fused with colour sampling**, so it is exempted from the "no duplicate flood" static
  proof (§6) and is not required to route through the shared flood primitive. I confirm
  the exemption is honoured, I do not gate on cutout output bytes here.
- **Runtime / render / playtest.** No `src/game`/`src/render`/`src/hooks` surface, no
  player-facing change. `game-designer` conformity playtest N/A (stage 2 SKIPPED, per the
  tracking block). No e2e, no `verify` skill session — there is nothing to drive.
- **Asset generation / FLUX.** No generation batch in this story (N/A per tracking).

## Device matrix

**Not applicable.** No render, no UI, no input surface (ADR-0003/0015 desktop+mobile fork
is irrelevant — this story ships no player-facing surface). Recorded so the omission is
deliberate, not forgotten.

## Sandbox precondition (names the one thing that can turn checks into CI-DEFERRED)

All canvas-driven scripts (`fill-sprite-holes`, `retouch-flash-halos`,
`restore-figure-bites`, `fill-bust-hem`, `measure-muzzle-anchors`,
`check-sprite-integrity`) `await import("@napi-rs/canvas")`, which is **not vendored**.
Install first (repo pattern, from the script headers):

```
npm install --no-save --legacy-peer-deps --ignore-scripts @napi-rs/canvas@1.0.2
```

If this install SUCCEEDS in the sandbox, §1–§4 run locally and are blocking. If it FAILS
(no registry reach / native build blocked), §1–§4 become **CI-DEFERRED** and named as
holes — never a silent PASS (see §8). §5–§7 (tsc/vitest/lint/prettier/grep) never depend
on canvas and always run locally.

---

## 1. Fixpoint no-op proof (AC2 — the four `--check` gates + clean write-mode)

**Preconditions:** clean tree (`git status --porcelain` empty) before starting; canvas
installed. Run each `--check` against the full committed set of 22
`public/assets/enemy_*.png`.

| #   | Check                            | Command                                                                              | PASS criteria                                                                                                                                |
| --- | -------------------------------- | ------------------------------------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------- |
| F1  | fill-sprite-holes fixpoint       | `node scripts/fill-sprite-holes.mjs --check`                                         | Exit 0. Final line `[--check] every enemy_*.png fully solid — PASS`. Zero "would-fill" px across all 22.                                     |
| F2  | retouch-flash-halos fixpoint     | `node scripts/retouch-flash-halos.mjs --check`                                       | Exit 0. 0 would-delete px on every PNG (fixpoint on the restored bytes — the header's documented invariant).                                 |
| F3  | restore-figure-bites fixpoint    | `node scripts/restore-figure-bites.mjs --check`                                      | Exit 0. 0 would-restore px (add-back only).                                                                                                  |
| F4  | fill-bust-hem fixpoint           | `node scripts/fill-bust-hem.mjs --check`                                             | Exit 0. `would fill 0 px` on every configured file.                                                                                          |
| F5  | write-mode leaves the tree clean | run each of the four WITHOUT `--check`, then `git status --porcelain public/assets/` | **Empty output.** A write-mode run on an already-solid set writes zero PNG bytes (idempotency = the fixpoint). Any modified PNG here = FAIL. |

> The 22 targets are enumerated in the verdict evidence (glob
> `public/assets/enemy_*.png`, `git ls-files` count = 22). F5 is the load-bearing one:
> `--check` proves _detection_ is 0; F5 proves the _writer_ path is genuinely a no-op on
> HEAD. Both required — a script could report `--check` clean yet re-encode PNG bytes.

---

## 2. Full-chain replay oracle (AC2 — drives REAL fills through the lib)

**Rationale.** §1 exercises the morphology while filling 0 px — it proves the lib does not
_perturb_ solid bytes, but it does not prove the lib _reproduces the original transform_.
This check reconstructs today's committed PNGs from an older, less-processed source so the
dilate/erode/fill/label/largest-component paths actually do work, and byte-compares the
result to HEAD. If the drifted copies (R2) were reconciled wrongly, this diverges even
when §1 is green.

**Fixture provenance:** `c79dfda` = "feat: enemy & courier flipbook animation pipeline"
(#37) — the enemy PNG bytes _before_ the halo-retouch / figure-restore / bust-hem / hole-fill
authoring passes were applied.

**Method (independent replay, on a scratch checkout so HEAD is never mutated):**

1. `git checkout c79dfda -- public/assets/enemy_*.png` (repopulate the working tree with the
   pre-processed source bytes; HEAD index untouched).
2. Run the pipeline in write-mode, **in the story's declared order**:
   `retouch-flash-halos` → `restore-figure-bites` → `fill-bust-hem` → `fill-sprite-holes`
   (no `--check`), each against the scratch working copies.
3. Byte-compare to HEAD: `git diff --stat HEAD -- public/assets/enemy_*.png`.

| #   | Check                              | PASS criteria                                                                                                                                                                                                            |
| --- | ---------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| R1  | Pipeline reconstructs HEAD         | After step 3, `git diff HEAD -- public/assets/enemy_*.png` is **empty** — the replayed bytes are byte-identical to the committed HEAD PNGs.                                                                              |
| R2  | Real work was actually driven      | The write-mode runs report **non-zero** px changed on the c79dfda source (fills/restores/deletes > 0) — proof the lib's transform paths executed, not no-ops.                                                            |
| R3  | Fixtures cover the transformed set | Every PNG the pipeline authors between c79dfda and HEAD is present in the replay; PNGs added _after_ c79dfda that the pipeline does not touch are noted, not silently dropped (their identity is already covered by §1). |
| R4  | Clean teardown                     | `git checkout HEAD -- public/assets/enemy_*.png` restores the tree; `git status --porcelain` empty before the gate closes.                                                                                               |

> If R1 diverges by even one byte, that is the byte-oracle firing on the reconciliation of
> the drifted copies (R2 in the tracking block) — the primary threat this whole gate exists
> to catch. Named line-for-line and routed to dev-tooling-assets (see §9). The dev lane
> supplies its exact replay recipe in its report; I reproduce it independently and only
> trust my own `git diff` exit.

---

## 3. `measure-muzzle-anchors` write-mode → `levelArt.json` byte-identical (AC2)

`measure-muzzle-anchors.mjs` default mode measures muzzle anchors and edits
`src/game/levels/levelArt.json` **in place by string surgery** (then `prettier --write`).
Its CC labeling is 8-connected and moves into the shared lib — so this is a direct byte-diff
of a real consumer.

| #   | Check                                | Command / method                                                                                                                                 | PASS criteria                                                                                                                                                                                |
| --- | ------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| A1  | Snapshot baseline                    | `git stash`-free: capture `git diff --stat` clean first, then record HEAD `levelArt.json` hash (`git hash-object src/game/levels/levelArt.json`) | Baseline hash recorded; tree clean.                                                                                                                                                          |
| A2  | Write-mode run is a no-op on HEAD    | `node scripts/measure-muzzle-anchors.mjs` (write mode), then `git diff src/game/levels/levelArt.json`                                            | **Empty diff.** Re-running the measurement on unchanged sprites through the shared 8-conn labeler reproduces the exact same string surgery → zero-byte change. `git hash-object` matches A1. |
| A3  | Dry-run table unchanged (supporting) | `node scripts/measure-muzzle-anchors.mjs --dry-run` before vs after extraction                                                                   | Printed anchor table identical pre/post — the measured values (not just the serialization) are unchanged.                                                                                    |

> A2 is the AC. A2 empty-diff after a write-mode run is the byte-identity proof; A3
> corroborates that the _numbers_ (not merely prettier's formatting) are frozen. Any
> non-empty A2 diff = one rework round to dev-tooling-assets.

---

## 4. `check-sprite-integrity` full-set metrics identical before/after (AC2)

`check-sprite-integrity.mjs` uses `labelComponents` (moves to the lib). Its `--json` mode
is the machine-readable oracle for topology/integrity metrics across all enemy PNGs.

| #   | Check                   | Method                                                                                                                                        | PASS criteria                                                                                                   |
| --- | ----------------------- | --------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------- |
| C1  | Metrics snapshot (pre)  | On the pre-extraction commit (or the dev's captured baseline): `node scripts/check-sprite-integrity.mjs --json > /scratch/integrity-pre.json` | Full-set JSON captured for all 22 PNGs.                                                                         |
| C2  | Metrics snapshot (post) | On HEAD (extracted): `node scripts/check-sprite-integrity.mjs --json > /scratch/integrity-post.json`                                          | Full-set JSON captured, same PNG set.                                                                           |
| C3  | Byte-diff the two       | `diff /scratch/integrity-pre.json /scratch/integrity-post.json`                                                                               | **No output.** Every component count / integrity metric identical before vs after the labeler moved to the lib. |
| C4  | Exit-code parity        | Compare process exit code pre vs post (gate PASS/FAIL disposition)                                                                            | Identical exit code — the gate's verdict on the set did not flip.                                               |

> The pre-snapshot is captured against `origin/main` (a git-worktree or checkout of the
> base script). If the JSON key order is non-deterministic (map iteration), I normalise
> both through `jq -S` before `diff` and record that in evidence — an ordering artefact is
> not a metric change and must not masquerade as one, nor hide one.

---

## 5. Unit suite for the lib primitives — present, green, same run, coverage unaffected (AC4)

Winston's contract wires `scripts/lib/__tests__/morphology.test.ts` into the existing
Vitest run by extending `vitest.config.ts` `test.include` (today:
`["src/game/**/*.test.ts", "src/utils/**/*.test.ts", "src/render/**/*.test.ts"]`).
Coverage `include` stays `["src/game/**/*.ts"]` — so the new tooling suite must NOT drag
the `src/game` 80% thresholds.

| #   | Check                                        | Command / method                                                 | PASS criteria                                                                                                                                                                                                                                                 |
| --- | -------------------------------------------- | ---------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| U1  | Suite exists and imports the lib             | `test -f scripts/lib/__tests__/morphology.test.ts`; read imports | Present; imports the pure fns from `scripts/lib/morphology.mjs` directly.                                                                                                                                                                                     |
| U2  | Runs in the SAME `rtk vitest` run            | `rtk vitest` (fallback `yarn test`)                              | The morphology suite appears in the single run's file list; total green. Test count > the current baseline (208) by the new cases — the delta is the new suite.                                                                                               |
| U3  | Coverage-relevant surface unchanged (AC4)    | `rtk vitest --coverage` (fallback `yarn test:coverage`)          | `src/game` coverage thresholds (lines/functions/branches/statements 80) **still PASS**. The new `.mjs`/`.test.ts` are NOT in the coverage `include` (verify `vitest.config.ts` coverage.include is still exactly `src/game/**/*.ts`). Thresholds not lowered. |
| U4  | Coverage of the primitives themselves (spec) | Read the suite cases                                             | Both connectivities (4-conn AND 8-conn per AC3), holes, ≥2 disk radii, border-seeded flood, largest-component tie-breaking — each has at least one case on a small fixture. A primitive with zero cases = spec gap routed back to dev-gameplay.               |

> U3 is the trap I am hunting: a well-meaning dev could add `scripts/**` to coverage
> `include` or drop the threshold "so the numbers stay green" — that silently weakens the
> `src/game` gate. The story says thresholds **unaffected**; I read the config, I don't
> trust the summary line.

---

## 6. Static de-duplication proof (AC1, AC5 — the duplication is actually gone)

The whole point: ONE implementation, all copies deleted. Prove no primitive survives
outside `scripts/lib/`, and the desync comment is gone.

| #   | Check                                                  | Command (ripgrep)                                                                                                                                                                                                                      | PASS criteria                                                                                                                                                                                                                                                                             |
| --- | ------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| D1  | No duplicate primitive **definitions** outside the lib | Search `scripts/` (excluding `scripts/lib/`) for local _definitions_ of `dilate`, `erode`, `diskOffsets`, `fillHoles`, `largestComponent`, `labelComponents`, `solidBodyMask`, `zoneMask` (e.g. `function dilate` / `const dilate =`). | **No matches** outside `scripts/lib/`, with the single documented exemption: **`cutout-enemies.mjs`** (its flood fused with colour sampling — architect decision). Every other consumer only _imports_ these, never redefines them.                                                       |
| D2  | Consumers import from the lib                          | grep each of the 7 consumers for `from "./lib/morphology.mjs"` (or the canonical relative path)                                                                                                                                        | All 7 (`fill-sprite-holes`, `retouch-flash-halos`, `measure-muzzle-anchors`, `check-sprite-integrity`, `cutout-enemies`, `restore-figure-bites`, `fill-bust-hem`) carry the import. (cutout-enemies imports whatever subset the architect kept shared; its fused flood may remain local.) |
| D3  | "Re-sync" comment gone (AC5)                           | `rg -n "Re-sync" scripts/` — specifically the `retouch-flash-halos.mjs` header (was at lines ~338–339: "Re-sync if that script's morphology changes")                                                                                  | **No matches.** The human-discipline comment is replaced by the import — the desync class is structurally removed, not just documented away.                                                                                                                                              |
| D4  | Connectivity documented at call sites (AC3)            | Read each call site of a labeling/flood/mask call                                                                                                                                                                                      | Each carries a comment stating 4-conn vs 8-conn and matching today's de-facto behaviour (`measure-muzzle` = 8-conn; others per their headers). No baked default hiding intent. Documentation-only — a _changed_ connectivity is caught byte-side by §2/§3/§4.                             |
| D5  | `SCRIPTS.md` updated (AC5)                             | Read `scripts/SCRIPTS.md`                                                                                                                                                                                                              | Notes the shared `scripts/lib/morphology.mjs` and which scripts consume it.                                                                                                                                                                                                               |

> D1 is definition-scoped, not substring-scoped: the word "dilate" may legitimately appear
> in a comment or a log string. I match _definitions_ (`function <name>` / `const <name> =`)
> so a prose mention is not a false FAIL, and a real re-implementation is not a false PASS.
> Evidence records the exact `rg` patterns used.

---

## 7. Regression sweep (AC6 — nothing else moved)

| #   | Check                                        | Command                                                                                   | PASS criteria                                                                                                                                                                                                     |
| --- | -------------------------------------------- | ----------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| M1  | Typecheck                                    | `rtk tsc` (fallback `yarn typecheck`)                                                     | 0 errors.                                                                                                                                                                                                         |
| M2  | Full tests                                   | `rtk vitest` (fallback `yarn test`)                                                       | All green, 0 failed, 0 unexpected-skip. Count = 208 baseline + new morphology cases (read, not asserted).                                                                                                         |
| M3  | Lint                                         | `rtk lint` (fallback `yarn lint`)                                                         | 0 errors, 0 warnings. No `no-unused-vars` / `no-unreachable` survivors after the local copies + their imports are deleted (orphan check).                                                                         |
| M4  | Format                                       | `yarn format:check` on touched files (`prettier --check` scoped to the diff, or full)     | Clean. New `scripts/lib/morphology.mjs`, the 7 edited scripts, the test file, and `SCRIPTS.md` all Prettier-clean.                                                                                                |
| B1  | Blast radius confined to `scripts/` + config | `git diff --stat origin/main...HEAD`                                                      | Changed paths ⊆ `{ scripts/**, vitest.config.ts, (optional) docs/adr/**, scripts/SCRIPTS.md }`. **Zero** `src/game`/`src/render`/`src/hooks` bytes. Any `src/**` change = boundary violation routed to architect. |
| B2  | No asset byte churn                          | `git diff --stat origin/main...HEAD -- public/assets/*.png src/game/levels/levelArt.json` | **Empty.** The HARD ACCEPTANCE LINE at the diff level: not one PNG, not one levelArt byte changed by the refactor commit itself.                                                                                  |

> B2 is the diff-level restatement of §1–§3; if the extraction commit itself carries a PNG
> or levelArt byte change, the refactor was not behaviour-neutral regardless of what the
> `--check` gates say on the new bytes.

---

## 8. CI-DEFERRED / sandbox holes (named per protocol — an unrun check is a hole, never a PASS)

- **§1–§4 depend on `@napi-rs/canvas`** (installed `--no-save`). If the sandbox install
  fails, F1–F5 / R1–R4 / A1–A3 / C1–C4 cannot run locally and are flagged **CI-DEFERRED**,
  escalated via `producer`. These are the byte-oracle checks — they are **blocking**, so if
  they are CI-only in this sandbox the gate does **not** PASS on them; it reports them as
  unverified-locally, runs them in CI, and only Bertrand may waive. The gate does not
  deadlock — it escalates.
- **§5–§7 never depend on canvas** and always run locally; no part of tsc/vitest/lint/
  prettier/grep is sandbox-blocked. If any of those turns out blocked at run time, that
  becomes a named hole, not a PASS.
- Note: I will attempt the canvas install first and record its outcome in evidence, so the
  CI-DEFERRED flag (if raised) is a proven sandbox limit, not an assumption.

---

## 9. FAILURE ROUTING (producer cap: 2 verify↔build rounds, then STOP + escalate)

Every failure below routes back to the **owning lane via the producer**; I never fix it.

| Failing case                                                                            | Routes to                                          | Round cost |
| --------------------------------------------------------------------------------------- | -------------------------------------------------- | ---------- |
| Any `--check` fixpoint red / write-mode dirties a PNG (§1)                              | dev-tooling-assets                                 | 1 round    |
| Replay oracle diverges by ≥1 byte (§2 R1) — the drift-reconciliation bug                | dev-tooling-assets                                 | 1 round    |
| `levelArt.json` write-mode diff non-empty (§3 A2)                                       | dev-tooling-assets                                 | 1 round    |
| `check-sprite-integrity` metrics or exit-code differ (§4 C3/C4)                         | dev-tooling-assets                                 | 1 round    |
| Unit suite missing / not in the run / a primitive uncovered (§5 U1/U2/U4)               | dev-gameplay (specs) / dev-tooling-assets (wiring) | 1 round    |
| Coverage thresholds lowered or scripts added to coverage include (§5 U3)                | dev-tooling-assets                                 | 1 round    |
| Duplicate primitive definition survives / import missing / Re-sync comment remains (§6) | dev-tooling-assets                                 | 1 round    |
| tsc/vitest/lint/prettier red (§7)                                                       | dev-tooling-assets                                 | 1 round    |
| `src/**` or asset bytes touched by the refactor (§7 B1/B2)                              | senior-architect (boundary)                        | 1 round    |
| Dev disputes a spec as unautomatable                                                    | senior-architect arbitrates; Bertrand tie-breaks   | —          |

**Producer cap (from the tracking block):** the verify↔build rework loop is capped at
**2 rounds**. Any single-byte divergence in §1–§4 = one round back to dev-tooling-assets.
**Two failed rounds ⇒ STOP + escalation packet to Bertrand** — no silent third round.
A re-scope (e.g. the earlier 5→7 file expansion) does NOT reset the counter; only the
producer declares a cycle reset.

---

## Verdict template (to fill at run time, logged in `docs/agent-handoffs.md`)

```
QUALITY GATE (AC6 + byte-identity) — story-shared-morphology-lib — <PASS|FAIL>
  canvas install: <ok | FAILED → §1-4 CI-DEFERRED>
  §1 fixpoint  F1 fill <> F2 retouch <> F3 restore <> F4 hem <> F5 write-clean <>
  §2 replay oracle  R1 reconstructs-HEAD <> R2 real-work-driven <> R3 fixture-cover <> R4 teardown <>
  §3 measure-muzzle  A2 levelArt byte-identical <> (hash pre==post)
  §4 integrity  C3 metrics-diff-empty <> C4 exit-parity <>
  §5 unit suite  U1 exists <> U2 same-run <> U3 src/game coverage unaffected <> U4 primitives covered <>
  §6 static  D1 no-dup-defs (cutout exempt) <> D2 imports <> D3 Re-sync gone <> D4 conn-comments <> D5 SCRIPTS.md <>
  §7 sweep  M1 tsc <> M2 vitest <count> <> M3 lint <> M4 prettier <> B1 confined <> B2 no-asset-churn <>
  CI-DEFERRED: <none | §1-4 if canvas unavailable — escalated via producer>
  FAIL → failing case named + routed (§9); round <1|2> of 2; STOP+escalate if round 2 failed
Evidence: <22-PNG glob count · git diff exits · hashes · grep patterns+exits · command tails>
```

FAIL names the specific failing case and routes it to the owning lane via `producer`.
Green is a verdict given only when every row above is checked, at the boundaries, and every
number was READ from output — never taken from the dev's word.
