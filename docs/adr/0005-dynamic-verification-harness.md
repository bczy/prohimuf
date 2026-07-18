# 0005 — Dynamic & interactive verification harness (evolve the render farm)

- **Status:** Accepted (amended)
- **Date:** 2026-06-22 (accepted 2026-07-18)
- **Related:** [ADR-0004](./0004-enemies-car-hostage-taker.md), [docs/ci.md](../ci.md),
  [HARNESS.md](../../HARNESS.md), `scripts/screenshot-preview.mjs`,
  `_bmad-output/planning-artifacts/story-car-drive-by.md`,
  `_bmad-output/planning-artifacts/story-hostage-taker.md`.
  Cross-refs: [ADR-0007](./0007-shared-harness-library.md) (shared lib supplies the contact-sheet /
  canvas primitive this harness draws on),
  [ADR-0006](./0006-directional-sprite-generation.md) (the directional `car_*` / `hostage_*` sprites
  whose generation this harness's D1 motion mode exercises and reviews).

## Amendment (re-scope) — 2026-07-18

The original D1/D2 acceptance criteria below target features that have since been **withdrawn or
superseded**. This amendment re-points them at SHIPPED reality; the D1/D2/D3 **structure, the four
principles, and the seam/boundary rules are unchanged** — only the concrete entities they assert
against move. Status stays **Proposed** (the tooling lane flips it last).

- **The drive-by `car` is withdrawn.** `belliard`'s roster is `streetSpawns: ["courier"]`
  (`src/game/levels/levels.ts`). No `car` traverses any level. Every D1/D2 clause that named the
  car's trailing-side muzzle flash / `dir` mirror (`story-car-drive-by.md` AC5/AC6) is **void**.
- **The street `hostage_taker` became the cinematic QTE.** ADR-0004's double-hitbox street-hostage
  was replaced by the ADR-0030 → ADR-0034 → ADR-0036 **static-duel QTE** (`src/game/systems/qteSystem.ts`,
  authored per-level via `LevelConfig.hostageQte`). There is no traversing street hostage_taker and no
  street-vs-hostage double-hitbox precedence; the "execution countdown cue" (`story-hostage-taker.md`
  AC8) is now the QTE's **G4 telegraph tell** before each PEEKING exposure.
- **Re-pointed D1 (motion).** The surviving mobile street entity is the **courier**; the surviving
  "motion to review by eye" is the **QTE cinematic** (the ZOOMING camera push onto the static
  `anchor`, and the COVERED→PEEKING telegraphed cadence with the wandering ring). The motion strip
  proves those, on `belliard`, in play mode.
- **Re-pointed D2 (assertions).** The hostage-precedence / timeout-once clauses are void (no
  traversing street hostage). The concrete shipped deltas asserted through the seam are instead:
  (a) `belliard` **PANIC shot** — a `fire` during `qte.phase === "ZOOMING"` drains
  `energy` by `QTE_PANIC_SHOT` (−6), aim-independent; (b) `vitry` **accomplice** (ADR-0036, the
  just-shipped second shooter) — with zero player fire in `ACTIVE`, `qte.accomplice !== null` and
  `energy` drops in exact steps of `ACCOMPLICE_SHOT_DAMAGE` (−8) on the authored 2.8 s cadence while
  `qte.captorHp` stays 3. `energy` remains the sole outcome currency (score never moves).
- **D3 (golden) unchanged in intent**, with one caveat: `vitry` now carries a `hostageQte` that
  fires at elapsed 10 s, so its golden is explicitly the **pre-QTE static frame** — the freeze-mode
  settle stays well under 10 s (today's 4 s), so the QTE never triggers and the frame is deterministic.

## Context

The render farm we have today is a **single static frame per level**:

- `scripts/screenshot-preview.mjs:47-59` injects an `addInitScript` that sets
  `window.__MUF_FREEZE_COPS__ = true`. `src/hooks/useGameLoop.ts:135-150` reads that flag and,
  when set, **replaces the live `gameStateRef.current`** with a synthetic state where every facade
  slot holds a `state: "VISIBLE"` cop (`timer: 999`, no shooting). The game is therefore not
  _played_ — it is frozen with cops pinned visible.
- `screenshot-preview.mjs:24` waits `ENEMY_WAIT_MS = 4000` ms purely as a settle delay (the comment
  states cops are frozen visible so "a short settle is enough"), then `:75` takes **one** screenshot
  per level and `:96-142` stitches them into a contact sheet.
- `.github/workflows/preview.yml:112-118` uploads `screenshots/` as a **downloadable artifact only**
  — never committed. It is also **pinned to a non-current branch**
  (`preview.yml:11` → `push.branches: ["claude/graphics-change-conversation-279ooc"]`), so on a
  feature branch like `feat/enemies-car-hostage-taker` **the harness does not run at all**.

This was adequate while every enemy was a static window pop-up. ADR-0004 changed the shape of the
problem on three axes the current harness cannot observe:

1. **The new content is mobile.** ADR-0004 D1 puts `car` (drive-by) and the street `hostage_taker`
   on the `Courier` traversal model — they enter from an edge, cross the screen, and are culled
   off-screen. A single frozen frame can catch a moving car only by luck, and the two stories
   demand the opposite: `story-car-drive-by.md` AC5/AC6 require the trailing-side muzzle flash and
   the `dir` mirror to be **verified by eye**, and `story-hostage-taker.md` AC8 requires the
   execution countdown cue to be **perceptible** (rising before it fires).
2. **The new content has interactive safety properties.** ADR-0004 D4 (hostage-precedence,
   story S3 AC7), D4 (timeout penalty applied **exactly once**, S3 AC6), and D5 (the continuous
   `energy` stat) are all **anti-bullshit-death** guarantees. They are unit-tested as pure logic in
   `src/game/systems/__tests__/levelRoster.test.ts` and the new hostage/energy suites — but **no
   harness today fires input or asserts a state/HUD delta**. The full `input → render → state → HUD`
   loop that the player actually experiences is never exercised end-to-end.
3. **The frozen levels are now load-bearing.** ADR-0004 D2 promises `stalingrad` / `vitry` stay
   **byte-for-byte unchanged for the same seed** (no `roster` field). That guarantee is asserted at
   the logic layer (`levelRoster.test.ts`), but nothing protects it at the **visual** layer — a
   render-side regression could silently change those screens.

So the harness is structurally blind to exactly the work ADR-0004 just landed.

## Decision

**Extend, do not rewrite, the existing Playwright harness.** We add three _additive_ capture modes
and leave today's static path byte-identical (same default flag, same single-frame output, same
contact sheet). The freeze hook stays the default; the new modes opt in.

### D1 — Motion capture mode

Record a short multi-frame sequence (frame strip / GIF / WebM, smallest that proves the point) of
the mobile street entities traversing on `belliard`, so the trailing-side muzzle flash
(`story-car-drive-by.md` AC5/AC6), the `dir` mirror, and the hostage countdown cue
(`story-hostage-taker.md` AC8) are reviewable by eye. This requires the freeze hook in
`useGameLoop.ts:135-150` to grow a **"play" (un-frozen) mode** — a second flag (e.g.
`window.__MUF_PLAY__`) that leaves `gameStateRef.current = next` untouched while still suppressing
audio and pinning the seed. The existing `__MUF_FREEZE_COPS__` path is unchanged.

### D2 — Scripted play-through assertions

Drive real input through the canvas (fire at a known hitbox position), read **live** game state
through the sanctioned game↔render seam, and **assert deltas**:

- hostage-precedence: a bullet overlapping both zones resolves the **hostage** zone (S3 AC7);
- timeout-once: a street hostage that times out _and_ is culled charges the penalty **exactly once**
  (S3 AC6);
- energy: a hostage-zone hit decrements `energy` by the pinned magnitude and floats it on the HUD
  (S3 AC4 / D5).

The seam is the law (boundary rule, `docs/architecture.md`): the harness reads game state **only**
through a window-exposed, **read-only** snapshot bridged in `src/hooks/useGameLoop.ts` — the same
file that already owns `gameStateRef.current` and the `__MUF_FREEZE_COPS__` hook. It exposes a
getter (e.g. `window.__MUF_STATE__()` returning a frozen clone of `gameStateRef.current` plus the
current `HudData`). **No new rule, no new branch logic moves into `src/render/**`.\*\* Render keeps
rendering; the hook keeps bridging.

### D3 — Golden-screenshot visual regression

Pixel-diff `stalingrad` and `vitry` (the frozen levels) against committed golden PNGs to enforce
ADR-0004 D2's "byte-for-byte unchanged for the same seed" at the **visual** layer. The logic layer
is already covered by `levelRoster.test.ts`; D3 closes the render-side gap. Goldens live under
`screenshots/golden/` and are committed; a diff over a tolerance reds the run.

### The four principles, explicit

- **TDD.** This harness _is_ a test harness, so the assertions come **first** and they are **red
  today**: D2's hostage-precedence/energy assertions fail because the entities are not yet wired and
  the read seam does not exist; D1's motion frames currently show fallback cops (ADR-0004:
  `getEnemyTexture` returns the cop sprite for ungenerated `car_*`/`hostage_*`); D3 fails because no
  golden exists. The first concrete failing assertion to write: _"firing at the kidnapper zone while
  it overlaps the hostage zone leaves `score` unchanged and decrements `energy`"_ — write it, watch
  it fail, implement until green. Crucially, a **red harness must gate merge** — D1/D2/D3 are wired
  into CI as a required check (`docs/ci.md`), unlike today's artifact-only preview which can fail
  invisibly.
- **SOLID.** **SRP** — each mode is one capture responsibility (motion / assertion / regression);
  none reaches into another's concern. **DIP + the boundary rule** — the harness depends on game
  state through the `useGameLoop` seam abstraction, not on render internals or game-system imports,
  so it holds **zero game rules**. **OCP** — the static path is closed for modification: new modes
  are added behind new flags without editing the `__MUF_FREEZE_COPS__` branch.
- **YAGNI.** We build only the three modes the car / hostage / energy epic needs. **No** generic
  recording framework, **no** per-frame animation-diffing engine, **no** golden coverage of the
  animated `belliard` mob (motion is reviewed by eye in D1; only the _frozen_ levels get pixel
  goldens in D3). The play-mode flag is a boolean, not a scripting DSL.
- **DRY.** All three modes reuse `screenshot-preview.mjs`'s Playwright bootstrap
  (`:144-155`), its narrative-dismiss / level-navigation helpers (`:33-78`), and the freeze-hook
  injection point. The canvas / contact-sheet primitive (`:96-142`) is lifted into the shared lib
  per ADR-0007 and consumed by all modes rather than copied.

## Consequences

**Positive**

- The mobile (`car`, street `hostage_taker`), interactive (precedence, timeout-once), and
  continuous-stat (`energy`) features finally get **automated** verification through the real
  input→render→state→HUD loop — closing the gap between ADR-0004's pure unit tests and the played
  game.
- The frozen `stalingrad` / `vitry` levels gain a visual safety net (D3) backing ADR-0004 D2's
  byte-for-byte promise.
- The seam stays clean: read-only state access lives in the one sanctioned bridge
  (`useGameLoop.ts`), so the boundary rule is provably intact.

**Negative / costs**

- A real browser driven through input in CI is **slower and costlier** than a 4-second settle and a
  snapshot; D1/D2 add wall-clock time to every gated run.
- Goldens (D3) need a **deliberate update workflow** — a legitimate art change will red the diff and
  someone must consciously regenerate and review, not rubber-stamp.
- Becoming a merge gate (vs today's artifact-only preview) means harness flakiness now blocks merges;
  the play-mode determinism (fixed seed, suppressed audio) must be solid or it becomes a tax.

**Gotchas to watch**

- The freeze hook must **cleanly toggle** play vs frozen: `__MUF_PLAY__` and `__MUF_FREEZE_COPS__`
  must be mutually exclusive, and the default (neither set) must remain the production live path.
  Guard against both being set.
- **Golden churn:** document the regen step (the command to refresh `screenshots/golden/` and the
  expectation that the diff is eyeballed in the PR) so a real art change is not mistaken for a
  regression — and a regression is not mistaken for an art change.
- **Fix the branch pin:** `preview.yml:11` is pinned to
  `claude/graphics-change-conversation-279ooc`, so the harness will not run on
  `feat/enemies-car-hostage-taker` or any future feature branch. The pin must be widened (PR trigger
  / current branches) or the gate is decorative. See `docs/ci.md`.
- D2 must read state through the window getter only; if a future contributor is tempted to assert
  against render internals or import a game system into the harness, that breaks DIP and the boundary
  rule — reject it.
