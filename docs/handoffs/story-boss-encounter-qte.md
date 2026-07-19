# Handoffs — Boss / mini-boss encounter, cinematic QTE (STORY-BOSS-ENCOUNTER-QTE)

Story slug: `story-boss-encounter-qte` · opened by `pm` (John), 2026-07-19.
Feature: a boss/mini-boss set-piece as a dedicated cinematic QTE, extending the
ADR-0030/ADR-0034 hostage-QTE architecture with a sequenced-vulnerability duel. Origin:
Bertrand direct-build request, grounded in the competitive veille
(`docs/game-design/veille-concurrentielle-shooters.md` §3 Tier A idea #6). Jumped ahead of
normal roadmap sequencing on Bertrand's explicit instruction.

## 1. INTAKE + PRODUCT — pm (John) — 2026-07-19

- claim: turn Bertrand's "boss QTE, look at the veille" intent into a scoped, actionable
  story ahead of the design loop.
- release: `_bmad-output/planning-artifacts/story-boss-encounter-qte.md`. Headlines:
  - **Cahier des charges: CONSCIOUS EXTENSION** (Prohibition had no boss — veille §1
    confirms). Same documentation standard as ADR-0030's hostage QTE.
  - **Scope IN (V1):** one boss archetype, one scripted encounter, reusing the ADR-0030/34
    freeze + zoom + phase-machine shell wholesale; a sequenced-vulnerability duel
    (narratively distinct from the hostage's peek-duel, free to reuse its state-machine
    shape if `game-designer` judges it fits); a graded multi-hit HP resolution (unlike the
    now-binary hostage duel — a deliberate divergence, not an oversight).
  - **Scope OUT (V1, explicitly deferred):** the "fuyard" variant from the same veille
    entry (different mechanic shape — street-escape clock, not a frozen duel); a distinct
    mini-boss tier / any total-encounter count; any new HUD surface beyond the shell; no
    re-tuning of the hostage QTE.
  - **6 open questions handed whole to the design loop, not pre-decided:** (1) required
    core-loop gate vs. optional side set-piece — pm leans "required, tied to `Livrer`" but
    does not decide it; (2) the exact vulnerability-window mechanic; (3) boss-vs-mini-boss
    count/placement; (4) Belliard-first (precedent) vs. the finale level (PROJECT_GUIDELINES
    §7's already-scoped "Niveau Final", narratively correct home) — pm defaults to
    Belliard-first absent a strong narrative counter-argument; (5) fiction of "le chef de
    brigade" — must extend the existing antagonist roster (§7), not fork a new faction; (6)
    HP read — HUD bar or diegetic, a fresh call, not inherited from ADR-0034 Rev.4's
    hostage ruling.
  - **Architecture directive (binding on tech plan):** `senior-architect` must treat
    ADR-0030/0034 as load-bearing precedent — expect a new `bossQteSystem.ts` or an
    extension of `qteSystem.ts`; reinventing the freeze/zoom/phase-machine primitive from
    scratch is an explicit scope violation.
- handoff → `game-designer` + `narrative-designer` (+ `ux-designer` if an HP-read surface
  is proposed): design loop, non-overlapping deliverables, answer Open Questions 1–6.
- handoff → `lead-game-designer`: design gate once specs land.
- handoff → `senior-architect`: TECH PLAN once gated — ADR, lane cut, confirm ADR-0030/0034
  shell reuse (binding directive above).
- Not yet logged as a `VERDICT:` line — no gate has run yet; this entry is INTAKE/PRODUCT
  only. `producer` to track stage progression from here.
