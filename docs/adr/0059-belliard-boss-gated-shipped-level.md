# 0059 — "Le Commandant" gates Rue Belliard: a boss-gated SHIPPED level with a failable ending (supersedes ADR-0051 D4)

- **Status:** Accepted
- **Date:** 2026-07-21

> **AMENDMENT (2026-07-21, Bertrand) — flag flipped ON ahead of canon art.** This ADR planned
> `BELLIARD_BOSS_ENABLED` OFF at merge, flipping ON only once canon Commandant art passes the gates.
> Bertrand chose to enable the boss immediately (`BELLIARD_BOSS_ENABLED = true`), **consciously
> overriding lead-art's BLOCKING placeholder-art ruling** — the boss ships on the provisional sprite
> until the `gen-boss-sprites` CI dispatch + gates land (the one-spot texture seams swap it in, no logic
> change). Second consequence, forced by the `stateMachine` "no hostage + boss on one level" guard:
> enabling the boss **drops Belliard's hostage QTE** (the boss replaces it as the level's set-piece).
> The hostage QTE remains live in normal play on **Vitry** (unchanged), so the feature is not lost.
> The "byte-identical when OFF" property (AC2) still holds for the flag's OFF branch, which is retained.

> **AMENDMENT 2 (2026-07-21, Bertrand) — the boss is the level's TIMED FINALE, not a quota trigger.**
> ADR-0051 D3 fired the boss the instant the kill quota was met. Bertrand wants the boss as the
> end-of-level climax, so on a BOSS level (`bossQteSpec !== null`) the trigger moves to **timer
> expiry**: the kill quota no longer completes the level nor opens the duel (it is score-only), the
> player runs the full timer, and when `timeRemaining <= 0` the boss is **created** (instead of the
> timeout GAME_OVER) and the level stays PLAYING so the boss block runs the duel — WON → LEVEL_COMPLETE,
> LOST → GAME_OVER. There is **no quota gate** for V1 (the boss always caps the timer); a **quota-gate**
> (must clear the quota to earn the confrontation) is the natural tunable alternative flagged for the
> game-designer playtest. Non-boss levels are byte-identical (quota still wins, timer still fails). The
> trigger helper `shouldTriggerBossQte(spec, qte, kills, enemiesToWin)` is replaced by the type guard
> `shouldTriggerBossFinale(spec, qte)`. Implemented in `stateMachine.ts` (guarded quota-win to non-boss,
> boss created at timer expiry) + `bossQteSystem.ts`; covered by the stateMachine timed-finale tests.

- **Number:** 0059. Renumbered twice across successive rebase-onto-main cycles as `main` claimed each
  number first: originally 0058, but `main` shipped its own `0058-grille-overlay-single-wide.md` before
  this branch merged, so this ADR moved 0058 → 0059 (the sibling shield-break ADR moved 0059 → 0060 in
  the same pass — the `adr-new` guard against the duplicate-number bug, applied at each rebase).
  Re-check at merge; `producer` (Marion) to confirm in the story shard.
- **Supersedes:** the **D4 clause of** [ADR-0051](./0051-boss-qte-encounter-system.md) only
  ("the harness/ship split: a non-shipped dev-harness, **Belliard's live contract untouched**"). ADR-0051
  D4 is deliberately, documentedly **reversed** for Belliard: Belliard becomes a boss-gated shipped level
  whose LOST path fails the level. **Every other clause of ADR-0051 (D1–D3, D5–D7) stands**, and the boss
  _system/contract_ is byte-untouched (this is a placement + routing + persistence change, not a system
  change). ADR-0051 is re-statused **Accepted (D4 superseded by ADR-0059)**.
- **Extends (does NOT supersede):** [ADR-0052](./0052-boss-qte-differentiation-levers.md) and
  [ADR-0053](./0053-niveau-final-live-boss-level.md) — the live-ship on Niveau Final; Belliard reuses
  the same frozen `bossQteSpec` shape and the same data-driven routing ADR-0053 D1/D2 proved.
- **Converges with:** [ADR-0060](./0060-boss-qte-shield-break-tempo-lever.md) (lever 6). Both land on
  the same merge; the shield **cover prop** is one of the canon assets gating this ADR's flip-on.
- **Related:** `_bmad-output/planning-artifacts/story-boss-belliard-live.md` (the story, AC1–AC6),
  `docs/game-design/spec-boss-belliard-fiction.md` (placement fiction + loss-reason copy, gated),
  `src/game/levels/levels.ts`, `src/game/systems/stateMachine.ts`, `src/render/scene/App.tsx`,
  `src/hooks/useGameLoop.ts`, `src/game/levels/levelArt.json`,
  [ADR-0030](./0030-hostage-taker-feature-and-sprite.md) (belliard's live hostage QTE — the
  mutual-exclusion collision, §D3).

## Context

ADR-0051 D4 deliberately kept the boss OUT of the shipped `LEVELS` array — reachable only via the
non-shipped `BOSS_QTE_DEV_HARNESS_LEVEL` behind the `?preview=boss` dev seam — so "Belliard's live
quota-win completion contract stays untouched". That was the right V1 call (K2: a required, level-failing
gate can't ship on a non-canon placeholder sprite). Bertrand now wants the boss to be a **required
end-gate in normal play, on the FIRST shipped level, Rue Belliard** — making the capstone duel something
every player actually reaches. This **reverses D4**.

Two forces shape the technical decision:

1. **`lead-art` ruled BLOCKING.** The boss currently renders on the provisional CRS-`riot` fallback
   sprite, which fails the art bible's automatic-FAIL clauses in normal play (reads as a helmeted mook,
   not the bare-headed chef; SHIELDED/telegraph/hit reads collapse onto colour-tint). Merging placeholder
   art into a normal player's path is not acceptable. So the work must **land merged and tested but stay
   OFF in normal play**, flipping ON only once canon Commandant + shield-cover-prop art passes the asset +
   composite gates (art-gen runs in CI, in parallel).

2. **The routing already exists; the collision does not.** Read from the real code at TECH PLAN:
   - `stateMachine.ts` **already routes** boss resolution: a non-null `bossQteSpec` suppresses the abrupt
     quota→`LEVEL_COMPLETE`, and on boss `DONE` returns `bossHp <= 0 ? "LEVEL_COMPLETE" : "GAME_OVER"`
     (`stateMachine.ts:186–195`). **WON→LEVEL_COMPLETE / LOST→GAME_OVER is already wired.**
   - **Belliard is already a member of `LEVELS`** (`levels.ts:75`), so `App.tsx`'s `isShippedLevel`
     (`LEVELS.findIndex(...) !== -1`, `App.tsx:269–270`) is **already true** for it. The score-save /
     high-score / next-level-unlock machinery already applies; `App.tsx` handles `GAME_OVER` and
     `LEVEL_COMPLETE` generically. The routing lane's job is therefore **verification + tests**, not new
     branching (§D4).
   - **The load-bearing collision the story did NOT flag:** belliard **already authors a live
     `hostageQte`** (the ADR-0030/0034 porte-cochère duel, `levels.ts:112`), and `stateMachine.ts:100`
     **throws** at load if a level carries BOTH `hostageQte` and `bossQteSpec`. Authoring a `bossQteSpec`
     on belliard as-is throws. This must be resolved before flip-on (§D3).

## Decision

### D1 — Reverse ADR-0051 D4 for Belliard: a shipped, boss-gated, FAILABLE level. Data + routing + persistence, not a system change.

Belliard's completion contract flips (story "the contract change"):

- **Today:** `kills >= enemiesToWin` → `LEVEL_COMPLETE` (abrupt win).
- **After (flag ON):** `kills >= enemiesToWin` → **boss duel** → `WON` → `LEVEL_COMPLETE` ·
  `LOST` → **level fails** (`GAME_OVER`, diegetic loss reason).

`src/game/systems/bossQteSystem.ts` and `src/game/types/bossQte.ts` are **byte-untouched** — the boss
contract (ADR-0051/0052 + lever 6 from ADR-0060) is frozen; this ADR authors only **data** (the
`bossQteSpec` on belliard) and confirms the **already-wired** routing + persistence. Canonical shipped
id stays `belliard`.

### D2 — The decouple seam: `BELLIARD_BOSS_ENABLED`, a module-level boolean in `levels.ts`, OFF at merge

The seam is a **single `const BELLIARD_BOSS_ENABLED: boolean` in `src/game/levels/levels.ts`** that
gates whether belliard's `LevelConfig` includes its `bossQteSpec`:

```
bossQteSpec: BELLIARD_BOSS_ENABLED ? { /* game-designer defaults */ } : undefined
```

- **OFF (default at merge):** belliard authors no `bossQteSpec` → the state machine's boss branch is a
  strict no-op → belliard is **byte-identical to today** (quota → `LEVEL_COMPLETE`, no boss, no
  placeholder art ever drawn). This rides the **existing** additive-and-optional law (ADR-0051 D3, already
  tested by the `bossQteSpec === null` identity test) — no new inertness machinery.
- **ON (flip-on, gated on canon art + §D3):** belliard carries the spec → the boss gates the level.
- Flipping the flag is a **one-line, data-only, game-layer change** — no render / hooks / state-machine
  edit (story AC2). Both states are covered by tests (AC2).

**Why a data flag beats the alternatives (the seam-shape call delegated to me):**

- **vs. an `import.meta.env.DEV` / env guard** — an env guard leaks a _runtime_ branch, can't be
  exercised **both ways in one build** (AC2 requires ON and OFF both tested), and couples player-facing
  placement to a build mode. Rejected.
- **vs. a render-side guard in `App.tsx`/`BossQteSprite`** — would leak a _placement rule_ into the
  render layer (boundary-law violation: rendering must hold no game rules). Rejected.
- **The data flag** keeps the decision in the game-data layer where placement belongs, reuses the proven
  null-vs-non-null byte-identity property directly, and makes flip-on data-only. **Chosen.**

### D3 — LOAD-BEARING PRECONDITION for flip-on: resolve the hostage/boss mutual-exclusion (design + `pm` call, my sign-off required)

Belliard authors a live `hostageQte`; `stateMachine.ts:100` throws on any level with BOTH. **The story
did not flag this.** It does **not** block the merge (flag OFF ⇒ no `bossQteSpec` ⇒ no throw), but it
**blocks flip-on** and the ON-state test. The resolution is a genuine design + boundary decision I will
**not** make silently. The clean options for `lead-game-designer` + `pm` to choose between, with my read:

- **(A) Belliard keeps its hostage duel AND gains the terminal boss (RECOMMENDED).** The two QTEs are
  **sequential, never simultaneous** (hostage triggers at `elapsedSeconds 12`; the boss at the
  `enemiesToWin` quota crossing) and the freeze law already serialises one QTE at a time. This requires
  **relaxing the load-time mutual-exclusion invariant** (`stateMachine.ts:100`) from "never both authored"
  to "never both _active in the same tick_", plus an assert that they can't co-activate. That is a
  **mechanic-lane + shared-file (`stateMachine.ts`) boundary change** needing my sign-off + a design gate.
  It honours both "Belliard first" and the shipped porte-cochère set-piece.
- **(B) On Belliard the boss REPLACES the hostage QTE** (drop belliard's `hostageQte` when the boss is
  enabled). No invariant change, but removes a shipped set-piece from Belliard — a design/narrative loss.
- **(C) Put the boss on a different shipped level** (stalingrad/vitry, no `hostageQte`). Rejected —
  contradicts Bertrand's explicit "Belliard first" directive.

**My recommendation: (A).** Because flip-on already sits a full art cycle away (gated on canon art),
this resolution rides the **same flip-on gate** — it is pinned now, decided by design+`pm` before the
flag flips, and its `stateMachine.ts` change is serialised (shared file) and reviewed then. Recorded as
this ADR's one genuinely-new open decision, not buried.

### D4 — The win/loss routing + persistence contract (already wired; the routing lane VERIFIES it)

`WON` → `LEVEL_COMPLETE`: save score (per ADR-0054 §2 — deferred to `NAME_ENTRY` when it qualifies,
else anonymous now) **and** unlock the next level (`LEVELS[shippedIdx + 1]`), exactly as a clean
Belliard clear does today. `LOST` → `GAME_OVER`: **no next-level unlock** (unlock lives only under the
`LEVEL_COMPLETE` branch, `App.tsx:286–292`), retry available.

**Key finding — near-zero App.tsx code.** Because belliard is already in `LEVELS`, `isShippedLevel` is
already true and the persistence effect already handles both terminal phases. The only genuinely-new
_exposure_ is that a **shipped** level can now reach `GAME_OVER` via a boss `LOST` (previously only via
lives/timer) and `LEVEL_COMPLETE` via a boss `WON` (previously only via quota). `App.tsx` routes both
generically. The routing lane's deliverable is therefore **tests + verification** (AC4: no double-save,
no unlock-on-LOST, no corrupt `muf_progress`), not new branching.

**Pinned interpretation of AC4 "no spurious score" (flag for `pm`):** a `LOST` Belliard follows the
**existing death-with-score contract** — the earned score is persisted if it qualifies (identical to
dying to lives/timer on any level), and **no unlock** fires. This is _consistent_, not spurious;
"spurious" means the double-save / unlock-on-loss / corruption AC4 guards against. If `pm` wants a boss
LOSS to write **zero** score (a deliberate divergence from the universal death-with-score behaviour),
that is a separate explicit call — I do not assume it.

### D5 — Lane partition (non-overlapping paths; the one shared file is serialised)

| Lane                                     | Files (owns)                                                    | Change                                                                                                                                                                                                                                    |
| ---------------------------------------- | --------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **data** (`dev-gameplay`)                | `src/game/levels/levels.ts`                                     | `BELLIARD_BOSS_ENABLED` const (OFF) + the conditional `bossQteSpec` on belliard (game-designer defaults: `phaseCount 3`, `bossHp 24`, `maxBlownWindows 10`, pinned `targetSeed`, décor prop, and — via ADR-0060 — the shield cover prop). |
| **mechanic** (`dev-gameplay`)            | `src/game/systems/stateMachine.ts`, `src/game/types/bossQte.ts` | ADR-0059 routing is **already wired** — no change at merge. The §D3 mutual-exclusion relaxation (option A) lands here **only at flip-on**, serialised (shared file), gated on design+`pm`+my sign-off.                                    |
| **routing** (`dev-r3f-render`)           | `src/render/scene/App.tsx`, `src/hooks/useGameLoop.ts`          | **Verification + tests** of the failable-shipped-ending persistence (AC3/AC4). Near-zero code — `isShippedLevel` already covers belliard.                                                                                                 |
| **render** (`dev-r3f-render`)            | `src/render/scene/BossQteSprite.tsx`                            | The shield-prop two-read swap (`bossShieldPointLive`, ADR-0060) + boss poses on the procedural fallback now; canon art at flip-on.                                                                                                        |
| **art / tooling** (`dev-tooling-assets`) | `src/game/levels/levelArt.json`, `scripts/`, CI                 | Canon Commandant + shield-cover-prop art-gen in CI — the **flip-on gate** (non-blocking for the merge).                                                                                                                                   |

`?preview=boss` and `BOSS_QTE_DEV_HARNESS_LEVEL` stay **byte-untouched** and excluded from `LEVELS`
(AC5 regression guard).

## Consequences

**Positive**

- The merge is safe by construction: flag OFF ⇒ belliard byte-identical to today ⇒ the merge gate
  reviews an appended flag + gated data + tests, riding the already-tested `bossQteSpec === null`
  identity law. No placeholder art can reach a normal player.
- Flip-on is a one-line data change once art clears its gates — decoupled, low-risk, testable both ways.
- Routing/persistence are already wired and data-driven (ADR-0053 precedent); the reversal costs no
  state-machine or App.tsx branching, only its tests.

**Negative / costs**

- The **hostage/boss mutual-exclusion collision (§D3) is a real, previously-unflagged precondition** for
  flip-on — it needs a design+`pm` decision and (option A) a serialised `stateMachine.ts` boundary change
  with my sign-off. Surfaced, not hidden; does not block the merge.
- A **shipped level can now fail on its ending** — the first time in muf. Persistence correctness (AC4)
  must be tested, not assumed (no double-save, no unlock-on-LOST).
- The canon finale on Belliard does not _look_ finished until flip-on (procedural fallback stands in) —
  the accepted decouple trade (ship the wiring + mechanic merged/tested now; flip on once art lands).

**Gotchas**

- **Winnability "as the player's FIRST boss" (story SCOPE-OUT, flagged to `game-designer` + `qa-lead`):**
  a full 3-phase escalating boss as a level-1 gate may wall new players. Re-check on the pinned seed; a
  difficulty adjustment is a **separate follow-up story** (Bertrand chose "Belliard first" over a
  toned-down intro — honour it unless verify proves it unfair).
- **Flip-on is gated on canon art AND §D3** — do not flip the flag until both clear.
- **AC5:** the dev-harness (`?preview=boss`) must stay reachable and inert on persistence — the existing
  membership-in-`LEVELS` guard (`App.tsx:269`, PR #112) already covers it; do not regress it.
