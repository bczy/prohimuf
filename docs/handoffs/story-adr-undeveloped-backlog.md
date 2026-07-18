# Story — Develop the undeveloped (Proposed) ADR backlog

Branch: `claude/adr-undeveloped-list-vn2vrh` · opened 2026-07-18

Bertrand asked to develop the 8 `Proposed` ADRs: 0005, 0007, 0024, 0026, 0036, 0039,
0043, 0044. Scoping found most were already implemented in code (only the status was
stale); the genuinely new work was ADR-0007 (lib), ADR-0036 (QTE accomplice) and
ADR-0005 (dynamic verification harness). Two forks were escalated to Bertrand: 0005 →
full build incl. golden + required gate; 0036 → build logic+render now, cop-fallback art.

## 0. SCOPE — 8× parallel readers — 2026-07-18
- release: per-ADR implementation plans, file maps, design-gate flags, conflict areas.
  Finding: 0024/0026/0043/0044 already shipped (status flip only); 0039 is a decided
  backlog record; 0007 buildable offline; 0005/0036 XL + blocked → escalated.

## 1. BUILD (Wave 1) — dev-tooling-assets / game-designer→dev-gameplay→dev-r3f-render / dev-r3f-render / tech-writer — 2026-07-18
- 0007: pure lib (idempotent/cli/cutout) TDD + `_template` + SCRIPTS.md anatomy; adopted
  in canonical generators; chromaKey byte-identical over 22 enemy PNGs. Accepted.
- 0036: re-specified "replace the captor's counter-fire" against the shipped post-Rev-5
  design (accomplice OWNS the −8 unanswered-peek drain; captor keeps the blown-peeks loss
  clock); pure logic TDD (P3-ACC invariant, determinism); render + cop-fallback + fire
  tell; authored the Vitry duel. Accepted. Real art = follow-up CI generation.
- 0024: single-source breakpoint test. Accepted. 0026/0039/0043/0044: status flips.
- VERDICT: PASS — quality gate Wave 1 (orchestrator: tsc + 633 vitest + lint + build)

## 2. BUILD (Wave 2) — senior-architect→dev-r3f-render→dev-tooling-assets — 2026-07-18
- 0005: re-scoped stale D1/D2 AC (withdrawn car / superseded street-hostage → shipped
  courier + cinematic QTE); `__MUF_PLAY__` un-frozen mode + read-only `__MUF_STATE__`
  seam in useGameLoop; harness-motion (D1) / harness-assert (D2: belliard PANIC −6, vitry
  accomplice −8, P3-ACC) / harness-golden (D3, no-dep @napi-rs/canvas diff); golden
  baselines committed; fixed the dead preview.yml branch pin; wired the 3 modes into
  ci.yml as required checks. Accepted (amended).
- Note: Playwright scripts cannot run in the sandbox (chromium-1140 vs installed 1194 —
  hits every Playwright script incl. the existing e2e-ingame); they run in CI.
- VERDICT: PASS — quality gate Wave 2 (orchestrator: tsc + 633 vitest + lint + build + goldens)

## 3. MERGE GATE — review-panel (4 reviewers, parallel) — 2026-07-18
- code-review(high): no blocking; MINEUR cutout-foreground algo change (byte-identical
  claim misleading on fresh art); NIT deepFreeze redundant.
- bmad-code-review (acceptance auditor): no blocking; all ADR criteria met; MINEUR ×2
  ADR-0005 prose drift (contact-sheet not built; "Status stays Proposed" leftover); NIT
  ADR-0007 "0005 still Proposed".
- edge-case-hunter: no blocking; MINEUR cross-LOST accomplice over-fire (unreachable in
  prod — delta clamped 0.1 < 0.35 tell); NITs cli first-flag, createQte null.
- security-review: clean; informational NIT (preview.yml `claude/**` widens low-value
  token surface, not an escalation).
- TRIAGE (senior-architect integration review): boundary law intact (src/game pure,
  src/render no rules, useGameLoop the only bridge); seams read-only; deps unchanged.
  Fixed the CONFIRMED items: reverted cutout-foreground to its local isMagenta heuristic;
  corrected ADR-0005/0007 prose + infographics. NITs consciously accepted.
- VERDICT: PASS — merge gate (no unresolved CONFIRMED BLOQUANT/MAJEUR)

## Follow-ups (out of this story)
- ADR-0036: generate the real accomplice sprite family in CI (cop-fallback ships now);
  narrative-designer to name the second Vitry shooter; stage-5 playtest of the −32 drain
  / 2.8 s cadence; consider a no-accomplice stalingrad duel first (met on separate levels).
- ADR-0005: first CI run may re-bake goldens if the CI renderer diverges from the sandbox.
