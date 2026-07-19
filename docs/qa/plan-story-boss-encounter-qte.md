# QA test plan — Boss QTE encounter "le Commandant" (ADR-0051)

**Story:** `_bmad-output/planning-artifacts/story-boss-encounter-qte.md` · **ADR:**
`docs/adr/0051-boss-qte-encounter-system.md` · **Specs:**
`docs/game-design/spec-boss-qte-encounter.md` (§6 design ACs),
`docs/game-design/ux/spec-boss-qte-hp-read.md` (A1–A7).
**Owner:** `qa-lead` (Inès) · **Stage:** 5 (VERIFY) · **Date:** 2026-07-19
**Verdict of record:** handoff shard §11 (`docs/handoffs/story-boss-encounter-qte.md`).

This plan derives from the story ACs + the gated design/UX specs (plan-from-spec, not
from the diff). It is a DEV harness (`?preview=boss`, `import.meta.env.DEV`-gated), NOT a
player-facing V1 feature (K2 ratification): V1 ships the system + tuning + gated fiction +
the non-shipped dev-harness only. The gate therefore verifies the SYSTEM and — above all —
the **additive-and-inert** guarantee that no shipped level or player is affected.

---

## 1. What must be true (acceptance surface)

Traced to: story AC1–AC7, ADR-0051 D1–D7, mechanic spec §6 (AC1–AC8), UX spec A1–A7.

| #   | Claim to prove                                                                                                                                                                              | Source                                 | Verify via                                                |
| --- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------- | --------------------------------------------------------- |
| Q1  | tsc / vitest / lint clean; `src/game` coverage ≥ 80 %                                                                                                                                       | DoD, CLAUDE.md                         | mechanical (re-run)                                       |
| Q2  | Pure boss logic (phases, ring 2/1/0, HP deplete→WON, blown-window clock→LOST, tie-break, telegraph floors, phase break damage-free, determinism)                                            | spec §6 AC1–AC8, ADR D2/D7             | unit suite `bossQteSystem.test.ts`                        |
| Q3  | `bossQteSpec === null` ⇒ byte-identical tick; shipped quota-win path unchanged                                                                                                              | ADR D3/D4, story AC3                   | unit (`stateMachine` identity test) + build-artifact grep |
| Q4  | Harness boots via `?preview=boss` into the non-shipped level (desktop + mobile)                                                                                                             | ADR D4                                 | e2e boot (both device classes)                            |
| Q5  | `bossQteSpec` wired into the live state (24 HP / 3 phase / seed), inert until quota                                                                                                         | ADR D3                                 | runtime state read (`__MUF_STATE__`)                      |
| Q6  | **No shipped player can reach the gate**: harness level absent from production bundle; excluded from `LEVELS`                                                                               | ADR D4, story AC3                      | production build grep                                     |
| Q7  | Boss triggers on quota-completion; zoom/freeze; ring shootable only in EXPOSED; phases escalate; phase-break pulse; WON/LOST resolve; **ring-on-frame at boss zoom on both device classes** | spec §6 AC1–AC6, UX A1–A7, ADR gotchas | **e2e duel drive (see §4 holes)**                         |
| Q8  | Anti-"mort bullshit" (§5.6): EXPOSED window perceptible/answerable; every window telegraphed before opening; phase break telegraphed                                                        | spec §2.4, §6 AC3                      | unit (asserts) + e2e observation                          |

---

## 2. Mechanical checks (run every cycle — RESULTS in the verdict)

- `rtk tsc` / `yarn typecheck` → exit 0.
- `rtk vitest` / `yarn test` → 100 % pass; note total.
- `rtk lint` / `yarn lint` → 0 problems.
- `yarn test:coverage` → `src/game` ≥ 80 % (lines/branches/functions/statements);
  record `bossQteSystem.ts` line.
- `yarn build` → exit 0; grep `dist/assets/*.js` for the harness identifiers (Q6).

## 3. Unit coverage expectations (owned by `dev-gameplay`, verified here)

`src/game/systems/__tests__/bossQteSystem.test.ts` MUST cover, and did (34 tests):
create-invariant asserts (integers ≥ 1, EXPOSED ≥ `PEEK_EXPOSURE_FLOOR`, per-phase
`telegraphLeadSeconds` ≥ `BOSS_TELEGRAPH_LEAD_FLOOR` AND strictly < lull, phase break
damage-free ≥ `PHASE_BREAK_SECONDS`, C6 finite guards); `phaseIndexAt`; ZOOMING→ACTIVE;
window machine + telegraph edge; spatial-colour 2/1/0; phase break (damage-free +
panic-during-break); WON + LOST + BOTH tie-break directions; blown-window charged ONCE per
closed window; seeded-pure determinism (replay-identity + forbidden-API source scan);
winnability on the harness seed. `stateMachine.test.ts` (+8 boss cases): trigger on quota,
freeze, WON→LEVEL_COMPLETE, LOST→GAME_OVER, and the **`bossQteSpec === null` byte-identity**
no-op. No new HUD contract field (OQ6 diegetic).

## 4. E2e scenarios (SPEC — implemented by `dev-tooling-assets` on `e2e-lib.mjs`)

The existing e2e surface (`scripts/e2e-*.mjs`) has NO pattern for a dev-only preview mode
reachable only after clearing a mook quota. New scenarios to add:

- **E2E-BOSS-1 — harness boot (desktop + mobile).** `?preview=boss` → PLAYING on
  `boss-harness`, HUD renders, no `pageerror`. **[Automatable today — DONE manually §Evidence.]**
- **E2E-BOSS-2 — production reachability guard.** Build; assert `dist` bundle contains
  neither `boss-harness` nor `Le Commandant (harness)`. **[Automatable today — DONE §Evidence.]**
- **E2E-BOSS-3 — the duel (trigger → zoom → ring → phase break → WON/LOST).** Blocked:
  see the hole below. Requires a deterministic boss-trigger seam. Once seam exists, drive
  and assert: zoom pins to anchor, ring-on-frame at boss zoom (BOTH device classes),
  telegraph precedes every EXPOSED, phase-break pulse fires (reduced-motion ≤ 3 Hz),
  WON→LEVEL_COMPLETE / LOST→GAME_OVER with explicit reason.

**BLOCKING HOLE (routed + escalated) — C-QA1.** E2E-BOSS-3 and the UX A1–A7 / Gate-4
composite items could NOT be driven in the sandbox. Reaching the boss requires clearing a
3-mook quota; headless Playwright input cannot do this reliably (rAF throttled to ~7 fps,
synthetic `MouseEvent` dispatch does not register as fire, real clicks are latency-bound to
~1 shot/sec against fixed-slot enemies with hp > 1 → ~1 hit / 90 s). This is a
**harness/input limitation, not a defect**, but it means the runtime render acceptance items
are **UNVERIFIED**. → **Correction to `dev-tooling-assets` + `dev-r3f-render`:** add a
deterministic trigger seam to the harness (e.g. `boss-harness` `enemiesToWin: 0` /
auto-trigger, or `?preview=boss&at=active` seeding the boss ACTIVE at a pinned seed) so the
owed items become e2e-automatable. Escalated to `producer` as CI-DEFERRED-BLOCKED (CI uses
Playwright and hits the same wall until the seam lands); only Bertrand waives.

## 5. Exploratory charters (manual `verify`)

- **CH-1 (boundary):** quota reached at the exact trigger tick; boss NOT counted in
  `enemiesToWin`; passive player → 10 blown windows → LOST in ~34 s with explicit reason.
- **CH-2 (anti-bullshit, §5.6):** is the EXPOSED window perceptible and answerable? Is a
  telegraph visible before EVERY opening, including the phase-3 frenzy floor? Is a new
  attack pattern ever un-signalled at a phase break? — _blocked with E2E-BOSS-3._
- **CH-3 (device fork, ADR-0003/0015):** ring-on-frame + phase-break read at the boss zoom
  on mobile (narrow viewport) vs desktop. — _boot verified both; duel blocked._
- **CH-4 (determinism):** same seed ⇒ identical windows across reloads. — unit-covered.

## 6. Device matrix

| Class                       | Boot (`?preview=boss`) | Duel render (zoom/ring/pulse/verdict) |
| --------------------------- | ---------------------- | ------------------------------------- |
| Desktop (1280×720)          | VERIFIED (no error)    | **HELD — C-QA1**                      |
| Mobile (iPhone UA, 844×390) | VERIFIED (no error)    | **HELD — C-QA1**                      |

## 7. Regression specs (every escaped bug → a test)

- **REG-1 (owned, GREEN):** `bossQteSpec === null` byte-identity no-op — already asserted
  in `stateMachine.test.ts`; keep it as the permanent guard that shipped levels are inert.
- **REG-2 (OBSERVATION, → `dev-gameplay`, non-blocking):** with the pre-existing
  `__MUF_FREEZE_COPS__` dev harness enabled, the boss-harness completed the level via the
  quota path instead of triggering the boss (score reached 4 / "LA RAVE A EU LIEU" banner,
  no zoom observed). Dev-only combo (freeze is not a shipped or boss scenario) and not a
  shipped-path concern, but root-cause and add a guard/assert (or document the
  incompatibility) so the two ADR-0005-style seams don't silently mask each other.

## 8. Deliberately NOT covered (and why)

- Canon player-facing "le Commandant" encounter + Niveau Final — out of this V1 (K2);
  a named follow-up story owns it, with its own plan.
- FLUX boss sprites / Gate-2 asset defects (W-a/W-b/W-c) — art pipeline, not run in V1
  (harness uses the cop fallback; generation deferred, lead-art §7 N2).
- Score payout on defeat — energy-only by design (spec §4.4).
