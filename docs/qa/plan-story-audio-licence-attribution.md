# QA Test Plan — Audio licence attribution + provenance cleanup

**Story:** `_bmad-output/planning-artifacts/story-audio-licence-attribution.md`
**Author:** Inès (`qa-lead`) · **Written:** 2026-07-14 · **Stage:** 5 (VERIFY)
**Status:** PLAN — written BEFORE the build lands (dev-tooling-assets implementing in parallel).
**Owning gate:** AC9 (quality). Sibling gate: AC8 (`sound-designer`, licence) — verified separately by Malik.
**Branch:** `claude/bmad-game-designer-agents-k6dlle`

> Derived from the STORY and the ADR-0018 audio-gate rule, **not** from the diff. The diff
> only tells me where to look hardest. This plan verifies AC1–AC7; AC8 is Malik's; AC10 is
> a hand-off-log check I confirm but do not author.

## What must be true (scope of my verdict)

The story is pure compliance/provenance debt paydown. There is **no gameplay, no fiction, no
audible behaviour change, no new UI, and no `src/**` change**. My gate therefore proves three
things and nothing more:

1. **No regression** — the script/doc edits break no type check, no test, no lint rule (AC9).
2. **The compliant surface actually ships and is internally consistent** — CREDITS deployed,
   README section present, all three attribution surfaces agree, no drift (AC1–AC3).
3. **The provenance landmine is defused** — dead/misleading code gone, header truthful,
   per-track records present, `shoot.wav` resolved to one of the two allowed outcomes
   (AC4–AC7).

## What I deliberately do NOT cover (and why)

- **Fresh network download of the five tracks from incompetech.com.** The five `.mp3` files
  and `shoot.wav` already exist on disk and already ship; re-sourcing is explicitly out of
  scope (story "Out of scope"). Outbound to incompetech.com is not available in this sandbox.
  Script integrity is proven instead by `node --check` + lint + a **no-op live run** (all
  files present → `[skip] × 5`). An end-to-end "empty dir → 5 downloads" smoke is CI-only and
  **non-blocking** — see CI-DEFERRED below. Not covering it is a conscious choice, not a hole
  in the AC surface I own.
- **Audible behaviour / mixing / loop points / tension→tier mapping.** Untouched by the story
  (out of scope). No playtest of audio behaviour is in this gate; `game-designer` conformity
  playtest does not apply (stage-2 explicitly skipped).
- **`docs/audio-system.md` stale-SFX discrepancy** (`hit/death/win.mp3` referenced, not on
  disk). Flagged in the story "Observations", explicitly NOT fixed here — I do not gate on it.
- **AC8 licence verdict content** — Malik's lane. I only confirm his PASS/FAIL exists in the
  hand-off log before I finalise (both gates must PASS at stage 5).

## Device matrix

**Not applicable.** No render, no UI, no input surface (ADR-0003/0015 desktop+mobile fork is
irrelevant — this story adds no player-facing surface). Recorded here so the omission is
deliberate, not forgotten.

---

## 1. Mechanical checks (AC9 core)

Run from repo root. All four must be green; any red = FAIL routed to `dev-tooling-assets`.

| # | Check | Command | Expected |
|---|-------|---------|----------|
| M1 | Typecheck | `rtk tsc` (fallback `yarn typecheck`) | 0 errors. Script edit introduces no type regression. |
| M2 | Unit tests | `rtk vitest` (fallback `yarn test`) | **208 tests green**, 0 failed, 0 skipped-unexpected. Count moved with PR#42 (baseline README says 14 suites; the 208 figure supersedes it). A drift from 208 that is NOT explained by PR#42 is a finding. |
| M3 | Lint | `rtk lint` (fallback `yarn lint`) | 0 errors, 0 warnings. Specifically no `no-unused-vars`/`no-unreachable` survivors after dead-code removal (AC4). |
| M4 | Format | `yarn format:check` | Clean. No unformatted edit to the script, CREDITS.md, or README.md. |

> Evidence to capture: raw tail of each command (pass/fail line + test count) pasted into the
> AC9 verdict. "208 green" is asserted only after I read the number, never from the dev's word.

---

## 2. Script integrity — `scripts/download-audio.mjs` (AC4, AC5, AC6)

| # | Check | Method | Expected |
|---|-------|--------|----------|
| S1 | Parses | `node --check scripts/download-audio.mjs` | Exit 0, no output. |
| S2 | Dead constants gone (AC4) | `grep -nE 'TRACKS\|IA_TRACKS\|FALLBACKS\|getIAFiles\|LukHash\|Waller' scripts/download-audio.mjs` (case-sensitive) | **No matches.** `IA_TRACKS`, the standalone `TRACKS` const, `FALLBACKS`, the `getIAFiles` helper, and the LukHash/Fats-Waller provenance strings are all deleted. (Note: `CURATED` does not contain the substring `TRACKS`; the lowercase word "tracks" in log strings is not matched by the uppercase pattern — intended.) |
| S3 | Fallback branch orphan gone (AC4) | `grep -niE 'fallback' scripts/download-audio.mjs` | **No matches.** The `fallback:` keys, `FALLBACKS` map, and the `if (fallbackUrl)` branch in `main()` are all removed. |
| S4 | Both protocol imports retained | `grep -nE '^import (https\|http) ' scripts/download-audio.mjs` | **Both** `import https from "https"` and `import http from "http"` present. Load-bearing: `download()` selects proto via `url.startsWith("https") ? https : http` and follows 301/302 redirects whose `location` may be `http:` — removing `http` would break redirect handling. Removing either is a FAIL even though it "looks unused". |
| S5 | Header truthful (AC5) | Read header comment block | No "public domain", no "Internet Archive", no "CC" tout-court. States: Kevin MacLeod, incompetech.com, **CC-BY 4.0, attribution required**. `grep -niE 'public domain\|internet archive' scripts/download-audio.mjs` → **no matches**. |
| S6 | Per-track provenance records (AC6) | Read each `CURATED` entry | Each of the 5 entries carries machine-readable fields: author (`Kevin MacLeod`), source URL, licence (`CC-BY 4.0`), licence URL (`https://creativecommons.org/licenses/by/4.0/`). Not just a bare download URL. |
| S7 | Still downloads exactly 5 (AC4) | Read `CURATED` | Exactly 5 entries: `bgm_loop`, `bgm_loop2`, `bgm_tension`, `bgm_danger`, `bgm_win`. `main()` iterates `CURATED` only. |
| S8 | Live run is a clean no-op (AC9) | `node scripts/download-audio.mjs` with all files present in `public/assets/audio/` | Output shows `[skip] × 5` (one per BGM, "already exists"), final line `5/5 tracks downloaded.` (skips count as present), no `[fail]`, exit 0. Proves the corrected control flow runs end-to-end without touching the network. `shoot.wav` is not in `CURATED` (it is a pre-existing SFX, not downloaded here) — its absence from the run output is correct. |

---

## 3. Attribution drift check (AC3) — single source of truth, no drift

**Canonical norm string** (per AC1), one per track, exact literal:

```
"<Title>" Kevin MacLeod (incompetech.com), Licensed under Creative Commons: By Attribution 4.0, https://creativecommons.org/licenses/by/4.0/
```

**Title ↔ file map to enforce** (AC1 — titles must match the real files on disk, verified by
the dev against ID3 before writing; I re-confirm the mapping is internally consistent across
surfaces):

| File on disk | Title |
|---|---|
| `bgm_loop.mp3` | Funky Chunk |
| `bgm_loop2.mp3` | Ouroboros |
| `bgm_tension.mp3` | Sneaky Snitch |
| `bgm_danger.mp3` | Darkest Child |
| `bgm_win.mp3` | Reformat |

**Concrete drift method** (three surfaces: `public/assets/audio/CREDITS.md`, `README.md`
audio section, `scripts/download-audio.mjs` `CURATED` records):

1. **Exact-match the full norm string on the two prose surfaces.** For each of the 5 titles:
   `grep -Fq '"<Title>" Kevin MacLeod (incompetech.com), Licensed under Creative Commons: By Attribution 4.0, https://creativecommons.org/licenses/by/4.0/' public/assets/audio/CREDITS.md`
   and the same against `README.md` (unless README unambiguously points to CREDITS.md as the
   single source of truth per AC2 — in which case README carries the pointer, and only CREDITS
   must carry all 5 literals). Each required `grep -F` returns exit 0 / ≥1 match. Any miss =
   drift FAIL.
2. **Field-normalise all three surfaces and diff.** Reduce each surface to 5 canonical rows
   `title|author|source-domain|licence|licence-url` (script contributes the AC6 fields;
   incompetech source URL normalised to domain, licence `CC-BY 4.0`, licence URL as above).
   Write the three normalised lists to scratch files and `diff` them pairwise — the three
   must be identical on `title`, `author`, `licence`, `licence-url`. Any pairwise `diff`
   producing output = "two surfaces disagree" = AC3 FAIL, named line-for-line in the verdict.
3. **Count & completeness.** Exactly 5 BGM norm rows on the CREDITS surface, no sixth phantom
   track, no missing track. Titles match the file map above (no `bgm_loop2`↔title swap).

> Method captures both *presence* (grep -F literal) and *agreement* (normalised diff), so a
> surface that is present-but-worded-differently is still caught as drift.

---

## 4. Deployed surface (AC1) — CREDITS ships in the build

| # | Check | Method | Expected |
|---|-------|--------|----------|
| D1 | CREDITS present in source tree | `test -f public/assets/audio/CREDITS.md` | Present under `public/` so Vite copies it. |
| D2 | CREDITS deployed | `yarn build` then confirm the file exists under `dist/` at the served path (e.g. `test -f dist/assets/audio/CREDITS.md`) | Present in the build output → reachable in the deployed game. This is the load-bearing AC1 check: a CREDITS file that lives outside `public/` (e.g. only in `docs/`) would pass presence but FAIL deployment — that is the failure mode I am specifically hunting. |
| D3 | Reachable path sanity | Confirm the `dist/` path matches how the game is served (root of served asset tree) | Path resolves under the deployed static root. |

---

## 5. `shoot.wav` provenance (AC7) — no silent absence

Binary outcome, no third option. I verify the CREDITS surface contains **exactly one** of:

- **(a) Verified record** — `shoot.wav` has a licence/provenance entry in CREDITS.md (author
  or origin, licence, source), OR
- **(b) Explicit flag-for-replacement** — `shoot.wav` is listed with a recorded FAIL rationale
  ("origin unknowable", flagged for replacement), NOT omitted.

| # | Check | Method | Expected |
|---|-------|--------|----------|
| W1 | `shoot.wav` appears on the credits surface | `grep -n 'shoot.wav' public/assets/audio/CREDITS.md` | ≥1 match. **Silent absence = automatic AC7 FAIL** (the whole point of the gate). |
| W2 | Outcome is (a) or (b), unambiguously | Read the `shoot.wav` entry | Either a real provenance record OR an explicit "flagged for replacement / FAIL rationale". A vague "TODO" that is neither = FAIL. |

> If outcome is (b), that unresolved provenance also blocks Malik's AC8 PASS by the gate-1
> rule — I note the cross-gate implication but Malik owns that verdict. My AC7 check passes as
> long as the file is *not silently unattributed*; the (b) flag itself is an acceptable AC7
> outcome per the story ("either … or … No third outcome").

---

## 6. Boundary / blast-radius checks

The story asserts zero code change and a tightly-scoped lane. I prove the blast radius.

| # | Check | Method | Expected |
|---|-------|--------|----------|
| B1 | Zero `src/**` change | `git diff --stat origin/main...HEAD -- src/` | **Empty.** No `src/game`, `src/render`, or `src/hooks` touched. Any line here = boundary violation, FAIL routed to architect. |
| B2 | Dev did not edit the hand-off log | `git diff --stat origin/main...HEAD -- docs/agent-handoffs.md` — attributed to the dev-tooling-assets lane | The dev lane must **not** author `docs/agent-handoffs.md` edits. AC10 log entries are authored by the gate owners / orchestrator, not the dev. (I verify the log is updated at close, but the *dev's* diff must not carry it.) |
| B3 | Diff confined to declared surfaces | `git diff --stat origin/main...HEAD` | Changed paths ⊆ `{ scripts/download-audio.mjs, public/assets/audio/CREDITS.md, README.md }` (plus an optional one-line ADR note if architect requested it). Anything outside this set is a scope finding. |
| B4 | No audio binary churn | `git diff --stat origin/main...HEAD -- public/assets/audio/*.mp3 public/assets/audio/*.wav` | **Empty.** The tracks are attributed, not re-sourced — no `.mp3`/`.wav` byte change (out-of-scope guard). |

---

## 7. CI-DEFERRED (named per protocol — an unrun check is a hole, never a silent PASS)

- **Fresh end-to-end download smoke** (empty `public/assets/audio/` → 5 real downloads from
  incompetech.com over the network). Cannot run in this sandbox (no outbound to
  incompetech.com; large binary fetch). **Non-blocking**: the files already ship, re-sourcing
  is out of scope, and script control-flow integrity is fully proven by S1–S8 offline. Flagged
  as **CI-DEFERRED**, escalated via `producer` for the record. This does **not** deadlock the
  gate — it is a redundant belt-and-braces check, not an AC surface. Only Bertrand may waive if
  he wants it treated as blocking; I do not treat it as such.

No AC I own (AC1–AC7, AC9) is blocked by a sandbox limitation: tsc/vitest/lint, `node --check`,
the no-op script run, `yarn build`, and all grep/diff drift checks run locally. If any of those
turns out to be sandbox-blocked at run time, that becomes a named hole in the verdict, not a PASS.

---

## Verdict template (to fill at run time, logged in `docs/agent-handoffs.md`)

```
AC9 QUALITY GATE — story-audio-licence-attribution — <PASS|FAIL>
  M1 tsc ....... <>   M2 vitest <208 green?> ...... <>   M3 lint <>   M4 format <>
  S1..S8 script integrity ...... <>   (dead code gone, header true, records present, no-op run)
  AC3 drift (grep -F ×5 + normalised diff) ...... <>
  AC1 D1..D3 CREDITS in dist/ ...... <>
  AC7 W1..W2 shoot.wav resolved (a|b) ...... <>
  B1..B4 blast radius ...... <>
  CI-DEFERRED: fresh-download smoke (non-blocking)
  Sibling gate AC8 (Malik) present in log: <yes|no>
  FAIL → failing case named + routed to: dev-tooling-assets | architect
Evidence: <command tails / grep outputs / dist listing>
```

FAIL names the specific failing case and routes it to the owning lane via `producer`. I do not
fix. Green is a verdict given only when every row above is checked, at the boundaries.
