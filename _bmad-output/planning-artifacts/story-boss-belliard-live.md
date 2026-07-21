# Story — Le Commandant, live on Rue Belliard (normal-play boss gate)

**Owner:** `pm` (John) · **Date:** 2026-07-21 · **Status:** DRAFT — needs `senior-architect` TECH PLAN
(ADR superseding ADR-0051 D4) before dev lanes cut.
**Authored directly by the orchestrator** after two `pm`/`narrative` subagent runs died on API stream
errors; content follows the pm lane's remit (the "what/why", scope, ACs — no code, no ADR text).

---

## Why

Today "le Commandant" — the fully-built, 3-phase boss QTE (ADR-0051/0052/0053) — is reachable ONLY via
the dev seam `?preview=boss` on the non-shipped `BOSS_QTE_DEV_HARNESS_LEVEL`. ADR-0051 **D4**
deliberately kept the boss OUT of the shipped `LEVELS` array so "Belliard's live contract stays
untouched". Bertrand now wants the boss to be a **required end-gate in normal play**, on the FIRST
shipped level, **Rue Belliard**. This makes the capstone duel something every player actually reaches —
the climactic obstacle on `Livrer` the system was built for — instead of a hidden harness.

## Cahier des charges verdict

**[EXTENSION]** — does NOT reopen the boss's own extension verdict (already ratified in
ADR-0051/0052/0053; Prohibition ST had no boss). This story is a **placement + reachability** change:
it moves an existing, gated mechanic from a dev seam into a shipped level. Core loop
`Récupérer → Livrer → Éviter` unchanged in kind — the boss remains the terminal beat on `Livrer`; only
its *location* (a shipped level) and its *contract consequence* (a shipped level can now fail on the
duel) are new.

## The contract change (the load-bearing decision)

Belliard's completion contract flips:

- **Today:** `kills ≥ enemiesToWin` → `LEVEL_COMPLETE` (abrupt win).
- **After:** `kills ≥ enemiesToWin` → **boss duel** → `WON` → `LEVEL_COMPLETE` · `LOST` → **level fails**
  (`GAME_OVER`, explicit diegetic reason).

Mechanically this already exists: `shouldTriggerBossQte(spec, qte, kills, enemiesToWin)` fires when a
level carries a non-null `bossQteSpec` and the quota is met. The change is **data + reachability +
routing**, not a new mechanic.

**This REVERSES ADR-0051 D4.** The TECH PLAN must open an ADR that supersedes/amends D4 ("Belliard live
contract untouched" no longer holds — it is deliberately, documentedly changed). `senior-architect`'s
lane.

## Key decision from Bertrand — DECOUPLE (do not ship placeholder art)

`lead-art` ruled **BLOCKING**: the boss currently renders on the provisional CRS-`riot` fallback sprite,
which fails the art bible's automatic-FAIL clauses in normal play (wrong archetype — reads as a
helmeted mook, not the bare-headed chef; SHIELDED/telegraph/hit reads collapse onto colour-tint alone).
So the plan is:

> **Land the boss wiring + the shield-break mechanic (its own story) now, merged and tested, but keep
> the Belliard boss OFF in normal play behind a clean on/off seam. Flip it ON only once canon Commandant
> art (+ the shield cover prop) passes the asset + composite gates. Art-gen runs in CI, in parallel.**

The decouple seam is an AC below. Its exact shape (build flag / level-config field / env guard) is the
architect's call; the requirement is that merging this work **never exposes placeholder art to a normal
player**, and that flipping it on later is a **one-line, low-risk change** (ideally data-only).

## Acceptance criteria

- **AC1 — Belliard authors the boss.** `belliard`'s `LevelConfig` carries a `bossQteSpec` (the
  game-designer defaults: `phaseCount 3`, `bossHp 24`, `maxBlownWindows 10`, a pinned `targetSeed`, the
  décor prop, and — once the shield-break story lands — the shield cover prop). Trigger = on
  quota-completion (`enemiesToWin`), the faithful stage-boss shape.
- **AC2 — Decouple seam.** With the seam OFF (default at merge), Belliard behaves **byte-identically to
  today** (quota → `LEVEL_COMPLETE`, no boss, no placeholder art ever drawn). With the seam ON, the boss
  gates Belliard. Toggling the seam is the only difference; both states are covered by tests.
- **AC3 — Win/loss routing for a shipped, failable level.** `WON` → `LEVEL_COMPLETE` (save score,
  unlock next level) exactly as a normal Belliard clear does today. `LOST` → `GAME_OVER` with the
  narrative loss reason; **no next-level unlock**, retry available. The routing must treat Belliard as a
  fully shipped level whose ending can now fail.
- **AC4 — Persistence correctness.** The save-score / high-score / next-level-unlock logic
  (`src/render/scene/App.tsx`, the `isShippedLevel` / `LEVELS.findIndex` block) must handle a shipped
  level with a boss whose LOST path fails: a `LOST` Belliard writes **no** spurious score/unlock, a
  `WON` Belliard persists exactly as a clean clear does. The prior guard ("boss level is non-shipped →
  inert") no longer applies to Belliard — verify no double-save, no corrupt `muf_progress`.
- **AC5 — `?preview=boss` still works.** The dev harness seam is unaffected (regression guard); the
  harness level and its capture seams (`?preview=boss&at=…`) keep working for art/QA iteration.
- **AC6 — ADR supersedes D4.** An ADR records the D4 reversal (Belliard is now a boss-gated shipped
  level), the decouple seam, and the routing/persistence change. Same standard as ADR-0051/0052/0053.

## Scope — IN

- Author `bossQteSpec` on `belliard` (data).
- The decouple on/off seam.
- Win/loss routing + persistence for a shipped, boss-gated, failable Belliard.
- The superseding ADR.

## Scope — OUT (explicitly)

- **Retuning the boss.** The 3-phase / 24 HP / blown-10 tuning is unchanged here. BUT a **winnability
  re-check "as the player's FIRST boss encounter"** is flagged for `game-designer` + `qa-lead` — a full
  escalating boss as a level-1 gate may wall new players. If that check says it's too steep, a
  difficulty adjustment is a **separate** follow-up story (Bertrand chose "Belliard first" over a
  toned-down intro; honour that unless verify proves it unfair).
- **The shield-break mechanic itself** — its own story
  (`_bmad-output/planning-artifacts/story-boss-shield-tempo-shot.md` /
  `docs/game-design/spec-boss-shield-break-tempo-shot.md`). This story only ensures Belliard *hosts* it.
- **Boss art generation** — tracked as the parallel art-gen workstream (the decouple gate). Blocking for
  the flip-on, not for the merge.
- **Any other shipped level** getting a boss (Option B/C) — not in scope.

## Dependencies / converges with

- **Shield-break story** — the Belliard boss will exercise lever 6 in phases 2-3; both land together.
- **Art-gen (lead-art BLOCKING)** — canon Commandant + shield cover prop art gates the flip-on.
- **Narrative fiction (OQ5)** — who the Commandant is on Belliard + the loss-reason copy
  (`docs/game-design/spec-boss-belliard-fiction.md`).

## Flags for other lanes

- `senior-architect`: the D4-reversal ADR; the decouple seam shape; the routing/persistence change for a
  failable shipped level (App.tsx).
- `game-designer` + `qa-lead`: winnability "as first boss" re-check on the pinned seed.
- `lead-art`: art-gen is the flip-on gate (already ruled BLOCKING).
- `narrative-designer`: Belliard boss fiction + loss-reason copy.
