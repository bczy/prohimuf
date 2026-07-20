# QA Test Plan + Verdict — Armement multi-armes par pickup (roster A-B-C)

**Story:** `_bmad-output/planning-artifacts/story-weapons-pickup.md` · shard `docs/handoffs/story-weapons-pickup.md`
**Gated spec:** `docs/game-design/weapons.md` (design gate round 2: PASS + P1/P2/P3) · **ADR:** `docs/adr/0052-weapons-pickup-system.md` (D1–D8)
**Author:** Inès (`qa-lead`) · **Written/ran:** 2026-07-20 · **Stage:** 5 (VERIFY)
**Owning gate:** the QUALITY GATE (correctness + robustness). Sibling gates: `game-designer`
playtest (conformity to spec, incl. the **W7/AC13** measured-uptime AC — Sacha's lane, not mine);
`ux-designer` HUD reconcile; `lead-art` crate/glyph read (R1–R4). All verdict separately.
**Branch:** `claude/features-a-implémenter-ehw9q4` (both dev lanes done, committed, pushed).
**Status:** **PASS** — static gate green, all by-test ACs verified against named tests, runtime
evidence captured on Belliard. One AC (**AC13**, ≤40 % special uptime) is a measured playtest
owned by `game-designer`, marked MANUAL-PLAYTEST-NEEDED here (not a hole in _my_ gate). Two
non-blocking observations (documented V1 concessions) logged, owners named — neither fails the gate.

> Derived from the numbered ACs in `weapons.md` §9 and the ADR-0052 decisions, **not** from the
> diff. The diff (both lanes' File Lists) only told me where to look hardest: the N-resolution
> fold, the courier loop-widening (P1), the crate-equip ordering (P2), the `impactEvents`
> widening's render consumers, and the byte-identical guarantee for no-loot levels.

## What must be true (scope of my verdict)

The story adds a one-active-weapon pickup system (A `base` ∞ / B `auto` finite / C `spread`
finite), acquired by shooting an armament crate, auto-returning to `base` on empty. My gate proves:

1. **Correctness of the pure core** — every weapon resolves as the specified N hitscan
   resolutions with the ADR-0040 precedence per resolution; stock accounting, burst scheduling,
   auto-return and equip-ordering hold at their boundaries (AC1–AC11, AC14).
2. **No regression** — levels without `loot` are byte-identical; the QTE freeze does not touch
   weapon/loot; the `impactEvents` widening (0-or-1 → 0-to-3) breaks no render consumer (AC6,
   AC15, D3, D8).
3. **Structural safety** — LOOT is off the `ARCHETYPES`/score-lives path by construction; the
   telegraph cadence is weapon-independent by construction (AC7-loot, AC12).
4. **The built surface actually renders** — base ∞ HUD, the crate with a legible glyph in its
   window slot, and the post-pickup special glyph + numeric stock (runtime evidence).

## What I deliberately do NOT cover (and why)

- **AC13 (W7) — ≤40 % special uptime across a mission.** A _measured design playtest_ owned by
  `game-designer` (weapons.md §7/§9 — "Sacha playtests"). It governs stock **tuning**
  (`verify`-tunable, not gated), not correctness. Not automatable in the sandbox (needs a full
  human Belliard run + timing instrumentation). Marked MANUAL-PLAYTEST-NEEDED; it is the sibling
  design-acceptance verdict, not a case my quality gate fails on.
- **Visual-quality judgments of the crate placeholder (R1–R4 triage-time).** `lead-art`'s read +
  the composite gate own R4 (<0.3 s loot-vs-human triage). No-GPU **SwiftShader** rendering makes
  any pixel/quality verdict unsafe here — I gate that the crate _renders and reads as a non-human
  object with a legible glyph_, not that its art is final (pm ruling #4: drawn placeholder).
- **Mobile device-class fork of firing (ADR-0003).** B's burst uses only the `fire` boolean +
  `delta` (no gesture), so it is identical on desktop tap and mobile tap **by construction** — I
  verify that structurally (AC3), not via a second emulated device run, because there is no new
  binding to fork. HUD layout on mobile is `ux-designer`'s reconcile.
- **The culasse-à-vide _dedicated_ asset.** V1 reuses the `death` SFX slot (spec §6.1 permits an
  existing SFX); the dedicated asset is a named fast-follow (see Observation 1).

## Device matrix

| Class              | What I ran                                                                                                                                                                                                                   |
| ------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Desktop (1280×720) | Full runtime drive on Belliard (headless Chromium, SwiftShader) — evidence a/b/c below.                                                                                                                                      |
| Mobile             | Not separately driven — B adds **zero new binding** (fire boolean + delta, AC3); the firing model is device-identical by construction (ADR-0003). HUD-layout-on-mobile is `ux-designer`'s reconcile, not a correctness case. |

---

## 1. Static gate (mechanical checks — AC15 core)

Ran from repo root (rtk unavailable in sandbox → `yarn` fallbacks, per CLAUDE.md command table).
Counts read from output, never asserted from a dev's word.

| #   | Check     | Command             | Result                                                                                                                                             |
| --- | --------- | ------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------- |
| M1  | Typecheck | `yarn typecheck`    | **PASS** — 0 errors, no output (strict, `src/game` React/Three-free — AC15).                                                                       |
| M2  | Unit test | `yarn test --run`   | **PASS** — **860 passed / 67 files / 0 failed / 0 unexpected-skip** (matches Lane B's 860; 816 baseline + 40 Lane A + 4 Lane B render-derivation). |
| M3  | Lint      | `yarn lint`         | **PASS** — clean, no output (no unused/unreachable survivors).                                                                                     |
| M4  | Format    | `yarn format:check` | **PASS** — "All matched files use Prettier code style!".                                                                                           |

---

## 2. AC sweep (weapons.md §9) — evidence per case

Legend: **TEST** = verified by a named automated test I ran green · **EVID** = runtime PNG ·
**INSPECT** = verified by structural inspection (nothing to test — the coupling cannot exist) ·
**MANUAL** = needs a human/measured playtest.

| AC           | Requirement (short)                                                                            | Verdict     | Proof                                                                                                                                                                                                                                                                                                        |
| ------------ | ---------------------------------------------------------------------------------------------- | ----------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ----------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **AC1**      | Distinct kinds; `base.stock === Infinity`, never decremented                                   | TEST + EVID | `weaponSystem.test` — _"never decrements base stock across many shots"_; `weapon.ts` `base.startStock = Infinity`. Evid `a` (ARME "A ∞").                                                                                                                                                                    |
| **AC2**      | N §2.1 resolutions; window-priority then courier-on-miss per resolution; no projectile/range   | TEST        | `bulletSystem.test` — _"aim off target (AC2)"_, _"offsetDx shifts the resolution point (C spread, §2.4)"_, _"overlap rule (D1.5): nearest wins"_.                                                                                                                                                            |
| **AC3**      | B per-trigger burst, ≤1 round/tick, further-fire ignored, refractory, −1/round, no new binding | TEST        | `weaponSystem.test` — _"B auto (AC3)"_ block: burst over successive ticks, _"further fire during a burst is ignored"_, _"post-burst refractory blocks a new trigger"_. Device-identical by construction (fire+delta only).                                                                                   |
| **AC4**      | C 3 simultaneous @ ±2 u; −1/press; discs never double-bill                                     | TEST        | `weaponSystem.test` — _"C spread (AC4)"_ + _"threads couriers so one courier reachable by two barrels is hit only once"_. Offsets `[-2,0,2]` in `weapon.ts`.                                                                                                                                                 |
| **AC5**      | Full civilian penalty **per resolution**, no spread amnesty (≤3/press, ≤BURST/burst)           | TEST        | `weaponSystem.test` — _"a spread press landing on 3 couriers charges the civilian penalty 3 times"_ (P1 loop-widening).                                                                                                                                                                                      |
| **AC6**      | QTE freeze: weapon/stock untouched, no LOOT spawns/resolves                                    | TEST        | `stateMachine.test` — _"AC6: weapon + loot are FROZEN through a QTE freeze (D7)"_.                                                                                                                                                                                                                           |
| **AC7-loot** | Crate lifecycle `HIDDEN→APPEARING→VISIBLE`; hit never emits score/lives                        | TEST + EVID | `lootSystem.test` state-machine cases; `bulletSystem.test` _"loot-hit: … ZERO score/lives"_; `stateMachine.test` _"AC7-loot: a crate hit equips with ZERO score/lives delta"_. Evid `c` (SCORE 0000, VIES ♥♥♥ after pickup).                                                                                 |
| **AC8**      | Glyph legible **before** fire; equip full stock; prior stock lost; next-trigger effect         | TEST + EVID | `weaponSystem.test` — _"equip takes effect from the NEXT trigger"_, _"firing a VISIBLE crate equips at full stock"_. Evid `b` (readable "C" glyph before the shot), `c` (equipped → "C 30").                                                                                                                 |
| **AC9**      | Spawn `∀ active a:                                                                             | Δcol        | ≥2`, defer if unsatisfiable; non-human read (R1)                                                                                                                                                                                                                                                             | TEST + EVID | `lootSystem.test` — _"§5.4 spawn-exclusion predicate (AC9)"_, _"defers … when no column satisfies"_. Evid `b` (neon-outlined boxy crate = non-human object). R4 triage-time = `lead-art`/composite gate. |
| **AC10**     | Stock→0 → base same tick, exactly one `weaponEmpty`; empty flash + audible cue                 | TEST        | `weaponSystem.test` — _"auto-return on empty (AC10)"_ (spread→0 + auto empty mid-burst); `stateMachine.test` _"AC10: … one weaponEmpty event"_ + _"clears the transient … following tick"_. Same-frame HUD flash + `playSfx("death")` wired in `useGameLoop.ts` (visual/audio playback = MANUAL sub-aspect). |
| **AC11**     | Base ∞: no counter/red/blink ever; special stock blinks last ~20 %                             | TEST + EVID | `hud/derivations.test` — _"never warns for the base weapon"_, _"blinks a special in the last ~20 %"_, _"keeps the threshold ratio at 0.2"_. Evid `a`/`b` ("A ∞", no counter), `c` ("C 30"). Blink _animation_ = visual/MANUAL.                                                                               |
| **AC12**     | Enemy telegraph→riposte (`SHOOTING`) cadence **weapon-independent**                            | INSPECT     | `enemySystem.ts` has **zero** references to `weapon`/`WeaponKind`/`WeaponState` — the cadence cannot depend on the active weapon because the system never sees it. Nothing to unit-test; the coupling is structurally impossible.                                                                            |
| **AC13**     | Measured ≤40 % time under a special across a Belliard run                                      | MANUAL      | Owned by `game-designer` (measured playtest; stock is `verify`-tunable, not gated). Not automatable in-sandbox. See "MANUAL / CI-DEFERRED".                                                                                                                                                                  |
| **AC14**     | A player hit never touches `weapon.active`/`weapon.stock` (A7, no loss-on-death)               | TEST        | `stateMachine.test` — _"AC14 (A7 regression): a player hit never touches weapon state"_.                                                                                                                                                                                                                     |
| **AC15**     | `src/game` React/Three-free; pure/deterministic; tsc/lint/vitest green                         | TEST        | Static gate M1–M4 green; `weaponSystem.ts`/`lootSystem.ts`/`weapon.ts`/`loot.ts` import only `@game/*` types (no React/Three).                                                                                                                                                                               |

**Coverage counts:** **13 VERIFIED-BY-TEST** (AC1–AC11, AC14, AC15) — of which **5 also carry
runtime EVIDENCE** (AC1, AC7-loot, AC8, AC9, AC11); **1 VERIFIED-BY-INSPECTION** (AC12, structural);
**1 MANUAL-PLAYTEST-NEEDED** (AC13, `game-designer`'s measured lane). No AC I own is unverified.

---

## 3. Runtime evidence (Belliard, headless Chromium, SwiftShader — no GPU)

Driven via the ADR-0005 `__MUF_PLAY__` state seam (`seedPlay` + `readState`), real tick running
(couriers move, crate spawns). Every claim below is cross-checked against the state seam, never
inferred from pixels alone. Files in `docs/qa/evidence/weapons-pickup/`:

| File                         | Shows                                                                                                                                                                                                                                       |
| ---------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `a-hud-base-infinity.png`    | Game start: HUD **ARME "A ∞"** — base weapon, infinity, no counter/red/blink (AC11). State: `weapon.active="base", stock=Infinity, loot=null, lootSpec={15s, [auto,spread]}`.                                                               |
| `b-loot-crate-visible.png`   | A **LOOT crate VISIBLE** in its window slot (col 1): dark boxy body, **neon-yellow outline + big "C" glyph** legible at reticle distance BEFORE the collecting shot (W1/R1/R3, AC8/AC9). ARME still "A ∞".                                  |
| `c-hud-special-equipped.png` | Post-pickup: HUD **ARME "C 30"** (spread glyph + numeric stock); crate gone (collected); **SCORE 0000, VIES ♥♥♥** — the crate hit produced **zero score/lives** (AC7-loot confirmed at runtime). State: `weapon.active="spread", stock=30`. |

**How the crate was reached (method, for reproducibility):** crates spawn **away from centre
engagement** by the §5.4 exclusion rule (they land at the façade edges, e.g. col 1 / world
x = −16), so collection requires a **camera pan** — expected by design. The driver panned the
camera fully left (edge-scroll), then click-swept the non-edge safe zone at the row-0 window
height until the state seam reported `weapon.active` flip. This is a real in-app pickup, not an
injected state (the seam is read-only). No page errors fired during any run.

---

## 4. Regression hunt (the diff told me where to look)

| Area                                                               | Result | Proof                                                                                                                                                                                                                                                                                                        |
| ------------------------------------------------------------------ | ------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **Levels without `loot` byte-identical** (D8)                      | PASS   | `stateMachine.test` — _"levels without loot stay byte-identical (D8)"_: seeds base/∞ + null loot/lootSpec; _"never spawns a crate and never leaves base across 200 ticks (incl. firing)"_; _"a base shot still emits at most one impact per tick (ADR-0040 invariant preserved)"_.                           |
| **QTE freeze paths** (D7)                                          | PASS   | `stateMachine.test` AC6 (above) — weapon/loot ride `...state`, no crate spawns/resolves during the freeze; `useGameLoop` clears `weaponEmpty` in the early-return branches.                                                                                                                                  |
| **`impactEvents` widening 0-or-1 → 0-to-3, render consumers** (D3) | PASS   | Render is N-safe with **zero change**: `useGameLoop.ts` drains `for (const ev of next.impactEvents) impactChannel.queue.push(ev)` (a list loop, not a single slot); `ImpactEffects` splices the queue into pools of 12. A `loot-hit` emits **no** impact (its own channel). Base still ≤1/tick (test above). |
| **`weaponEmpty` transient drain** (new bridge)                     | PASS   | `useGameLoop.ts` — `if (next.weaponEmpty === true) { weaponEmptyNonceRef += 1; playSfx("death"); }`, distinct from `impactEvents`, in the change-detection + passed to the HUD as `weaponEmptyNonce` (same-frame flash re-key).                                                                              |
| **P1 courier loop-widening (≤3 `resolveCourierShot`/tick)**        | PASS   | `weaponSystem.test` — 3-courier press charges 3× penalty; courier threading prevents a double-hit; `courierField === undefined` short-circuit preserved (no-street levels).                                                                                                                                  |
| **LOOT off the `ARCHETYPES`/score-lives path** (D5)                | PASS   | New entity (`loot.ts`), not an `EnemyKind`; `loot-hit` routes to equip-only. Confirmed by test (zero deltas) **and** runtime evid `c` (SCORE 0000 post-pickup).                                                                                                                                              |

No escaped bugs to log as regression specs this cycle (`docs/qa/regressions.md` unchanged).

---

## 5. Observations (non-blocking — documented V1 concessions, owners named)

Neither fails the gate; both are already flagged in the story shard. Logged for the record and
for the code-review panel's awareness.

- **Obs-1 — culasse-à-vide reuses the `death` SFX slot** (`useGameLoop.ts` `playSfx("death")`).
  Spec §6.1 explicitly permits an existing SFX for V1, and the **same-frame HUD flash is the
  primary, unmistakable cue** (audio is reinforcement), so **W3/AC10 hold**. Minor UX note: the
  empty cue is _audibly identical to the player-death cue_ — a possible momentary confusion under
  pressure. **Fast-follow** (a dedicated `assets/audio/empty.*` + a one-line `"empty"` slot in
  `audioSystem.ts`) — owner: `sound-designer` + `dev-gameplay`. Not a V1 blocker.
- **Obs-2 — crate is a code-drawn glyph PLACEHOLDER** (pm ruling #4, no FLUX). Evidence `b` shows
  it reads as a clear non-human neon-outlined box with a legible "C" glyph. The final R1–R4 read
  (silhouette / triage-time) is `lead-art`'s gated fast-follow, not a V1 blocker.

---

## 6. MANUAL / CI-DEFERRED (an unrun check is a hole, never a silent PASS)

- **AC13 (W7) — ≤40 % special-uptime measured playtest.** MANUAL-PLAYTEST-NEEDED. Owned by
  `game-designer` (Sacha), stock is `verify`-tunable (not gated). Not automatable in this sandbox
  (needs a full human Belliard run + uptime instrumentation; SwiftShader/no-GPU makes an
  automated timing run unrepresentative). Escalated via `producer` for the record; it is the
  sibling design-acceptance measurement, and does **not** block _my_ correctness/robustness gate.
- **Visual sub-aspects** — the special-stock blink animation (AC11), the same-frame empty-flash
  wash (AC10), and the R4 loot-vs-human triage-time (AC9) — their _wiring/derivation_ is verified
  (tests + code path) but their _rendered motion/legibility_ under SwiftShader is not a safe
  verdict here; they are covered by the `ux-designer` reconcile + composite gate.

---

## VERDICT — ran 2026-07-20 (Inès, `qa-lead`)

```
QUALITY GATE — story-weapons-pickup — PASS
  (rtk unavailable in sandbox → yarn fallbacks, per CLAUDE.md command table)

  M1 tsc ........ PASS (0 errors, no output — src/game React/Three-free, AC15)
  M2 vitest ..... PASS (860 passed / 67 files / 0 failed / 0 unexpected-skip — READ, not asserted)
  M3 lint ....... PASS (clean, no output)
  M4 format ..... PASS ("All matched files use Prettier code style!")

  AC sweep: 13 BY-TEST (AC1-11,14,15; 5 also BY-EVIDENCE) · 1 BY-INSPECTION (AC12, structural)
            · 1 MANUAL (AC13, game-designer's measured uptime lane). No AC I own is unverified.

  Runtime evidence (Belliard, SwiftShader, __MUF_PLAY__ seam, no page errors):
    a-hud-base-infinity.png ..... HUD "A ∞", weapon=base/Infinity           (AC1/AC11)
    b-loot-crate-visible.png .... VISIBLE crate, neon box + legible "C" glyph (AC8/AC9/W1)
    c-hud-special-equipped.png .. HUD "C 30" post-pickup, SCORE 0000/♥♥♥      (AC7-loot/AC8/AC11)

  Regression: no-loot byte-identical (D8) PASS · QTE freeze (D7) PASS ·
              impactEvents 0-to-3 render consumers (D3) PASS — zero render change ·
              weaponEmpty bridge drain PASS · P1 courier loop-widening PASS ·
              LOOT off ARCHETYPES/score-lives (D5) PASS (test + runtime SCORE 0000).

  Non-blocking observations (documented V1 concessions, not gate failures):
    Obs-1 empty cue reuses `death` SFX (spec §6.1 permits) — dedicated asset fast-follow
          (sound-designer + dev-gameplay); HUD flash is the primary cue so W3/AC10 hold.
    Obs-2 crate = code-drawn placeholder (pm ruling #4) — lead-art R1-R4 read is a fast-follow.

  MANUAL / escalated via producer: AC13 (≤40% special uptime) — game-designer measured playtest.

  FAIL cases: NONE. No production code modified by this gate (iron rule honoured).
```

FAIL would name the failing case and route it to the owning dev lane via `producer`; there is
none. AC13 is escalated as the sibling measured-playtest (game-designer), not a hole in this gate.
Green is given only because every row above was checked at the boundaries, on the built app.

---

## STAGE-6 RE-VERIFY — ran 2026-07-20 (Inès, `qa-lead`)

Targeted re-verify of the two pre-merge fixes from the stage-6 review-panel triage (Winston's
sequence, steps 4–6), on the branch HEAD:

- **268eb16** — co-location invariant (D5) via two one-direction guards
  (`lootSystem.attemptSpawn` excludes any non-DEAD enemy's slot; `enemySystem.spawnWave` gains
  `excludeSlots`, the wave-rollover passes the live crate's slot) + `_nextLootId` reset (MINEUR-2).
  +7 tests → 867.
- **b9582ef** — shoot SFX keyed off `next.impactEvents.length > 0` (post-tick resolution
  activity) instead of the raw `didFire` gesture (MINEUR-1); `.emptyFlash` removed from the
  `prefers-reduced-motion` `animation: none` kill list (MINEUR-3).

### Static gate (re-run myself on HEAD)

| Check  | Result                                                                             |
| ------ | ---------------------------------------------------------------------------------- |
| tsc    | **PASS** (exit 0, no output)                                                       |
| vitest | **PASS — 867 passed / 0 failed** (860 + 7 new co-location/seed guard tests; read). |
| lint   | **PASS** (exit 0)                                                                  |
| format | **PASS** ("All matched files use Prettier code style!")                            |

The 7 new guard tests, all green: `enemySystem.test` — _"never seats an enemy on an excluded
slot (co-location guard)"_ + _"without excludeSlots is byte-identical (default path)"_;
`lootSystem.test` — _"never spawns on a slot occupied by a HIDDEN enemy"_ + _"defers when every
column-eligible slot is occupied by a non-DEAD enemy"_ + _"a DEAD enemy's slot is free for a
crate"_; `stateMachine.test` — _"D5 co-location guard (b): a wave rollover excludes the crate
slot"_ + _"createInitialState resets \_nextLootId for replay-safe crate picks"_.

### Runtime check 1 — crate co-location / pickable across a wave rollover (MAJEUR)

Driven on Belliard via the `__MUF_PLAY__` seam. Split into the two guard directions:

- **Direction (a) — a crate never co-locates with a non-DEAD enemy: VERIFIED-BY-RUNTIME.** Across
  **two independent sessions, 624 crate-present state reads, 0 violations** — no read ever showed
  a non-DEAD enemy sharing the live crate's `slotIndex`. This exercises the spawn-time guard
  (`lootSystem.attemptSpawn`) live over the whole run. A live pickup also resolved as a **loot-hit**
  (weapon flipped `base → spread`, no stray score/lives), i.e. shooting the crate slot equips —
  the tie-break assumption (slots never collide) holds live.
- **Direction (b) — the wave rollover excludes the crate slot: MANUAL-PLAYTEST-NEEDED (test-covered).**
  A wave rollover fires only when **every** enemy is DEAD (`allDead`), and un-shot enemies recycle
  (`VISIBLE→HIDDEN`), never reaching DEAD. Even with aggressive full-facade sweep-shooting for
  100 s, **0 rollovers** were reached in the sandbox (off-screen/recycling enemies keep `allDead`
  false), so a rollover **coincident with a VISIBLE crate** is not reliably drivable here. It is
  fully covered by the new `stateMachine.test` _"D5 co-location guard (b)"_ + `enemySystem.test`
  `excludeSlots` cases (re-run green). No fake evidence produced; `e-crate-across-rollover.png` is
  intentionally absent.

### Runtime check 2 — the signal the shoot cue is keyed on (`impactEvents`) behaves per the model

The cue now fires iff `next.impactEvents.length > 0`. I verified that signal live via the
**persistent `stock` counter** (the exact quantity `impactEvents` mirrors — one resolution per
consumed unit) plus opportunistic `impactEvents` sampling:

- **A fired spread press consumes 1** (`stock 30 → 29`) ⇒ ≥1 resolution ⇒ `impactEvents` non-empty
  ⇒ one cue. **VERIFIED.**
- **A swallowed press consumes 0**: two clicks 35 ms apart (the 2nd inside the 300 ms spread
  cooldown) consumed **only 1** total (`29 → 28`) ⇒ the swallowed tap produced **no** resolution
  ⇒ empty `impactEvents` ⇒ silent (no phantom shot). **VERIFIED.**
- **A spread press emits up to 3 in one tick**: caught live `impactEvents` samples of **3** — the
  fan cue fires once for the 3-resolution press. **VERIFIED.**
- **Each burst round tick emits ≥1 impact (auto):** NOT driven live (collecting an `auto` crate in
  its 4 s VISIBLE window was flaky), covered by `weaponSystem.test` _"one trigger fires
  BURST_ROUNDS rounds over successive ticks"_ (each round is one §2.1 resolution ⇒ ≥1 impact by
  the same mechanism proven above). VERIFIED-BY-TEST.

### Runtime check 3 — empty cue under `prefers-reduced-motion` (MINEUR-3)

- **The fix itself: VERIFIED-BY-CSS (deterministic, timing-independent).** With
  `emulateMedia({ reducedMotion: "reduce" })` active, I read the loaded stylesheet: the
  `@media (prefers-reduced-motion: reduce)` block stills **`._stockLow_8yynr_40`**
  (`animation: … none !important`) but does **NOT** contain **`._emptyFlash_8yynr_57`** — so the
  one-shot empty flash keeps its animation under reduced motion. `stillsStockLow=true`,
  `stillsEmptyFlash=false` ⇒ exactly the MINEUR-3 intent (suppress motion, not information).
- **Runtime path fires:** under reduced-motion emulation, draining a spread to 0 auto-returned to
  `base` (state-confirmed) with the flash element mounting.
- **`f-empty-cue-reduced-motion.png` — MANUAL-PLAYTEST-NEEDED (timing-limited, not a fix concern).**
  The flash is a **0.45 s one-shot** DOM animation; under SwiftShader (no GPU) `page.screenshot()`
  latency is **~400 ms each**, so even back-to-back captures land after the wash has faded (every
  frame showed the settled "A ∞"). The visible-wash PNG is not reliably capturable in this
  sandbox; the CSS-level proof above stands in its place. No fake evidence produced.

### Verdict block

```
QUALITY GATE RE-VERIFY — story-weapons-pickup (stage-6 fixes 268eb16 + b9582ef) — PASS

  Static (HEAD): tsc 0 · vitest 867/867 (7 new guard tests green) · lint 0 · format clean.

  Check 1 co-location:
    (a) crate never co-locates a non-DEAD enemy — VERIFIED-BY-RUNTIME (624 crate-present
        reads / 0 violations, 2 sessions) + live loot-hit equip (base→spread, no stray score).
    (b) wave-rollover excludes crate slot — MANUAL-PLAYTEST-NEEDED (0 rollovers drivable in
        sandbox: allDead needs every enemy DEAD, recyclers block it) — COVERED by the new
        stateMachine + enemySystem tests (re-run green). No fake e- PNG.
  Check 2 SFX signal (impactEvents): fired press consumes 1 (≥1 impact ⇒ cue) · swallowed
        press consumes 0 (0 impacts ⇒ silent) · spread press = 3 impacts caught live —
        VERIFIED-BY-RUNTIME (stock) + live samples. Burst-round ≥1 impact VERIFIED-BY-TEST.
  Check 3 reduced-motion empty cue: FIX VERIFIED-BY-CSS (reduced-motion stills .stockLow,
        keeps .emptyFlash) + runtime empty→base under reduced-motion. Visible-wash PNG
        (f-...) MANUAL-PLAYTEST-NEEDED — 0.45s one-shot vs ~400ms SwiftShader shot latency.

  FAIL cases: NONE. No production code modified. Two items honestly MANUAL (not gate holes):
  the wave-rollover-with-crate coincidence and the flash PNG — both under-covered by tests /
  proven by CSS, and not sandbox-drivable. Merge-blocking fixes verified.
```
