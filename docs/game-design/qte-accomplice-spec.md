# Hostage QTE — the accomplice (second shooter) — design spec (F4 / ADR-0036)

- **Owner:** game-designer (Sacha) · **Gate:** lead-game-designer (Karim) PASS required before dev.
- **Implements:** [ADR-0036](../adr/0036-hostage-qte-accomplice.md), re-specified against the
  **shipped** duel (ADR-0034 Revisions 2–5): static captor, spatial-colour ring, captor HP,
  and the **blown-peeks execution clock** — the state in `src/game/systems/qteSystem.ts` /
  `src/game/types/hostageQte.ts` as of this writing.
- **Cahier des charges:** _Prohibition_ (Atari ST) had no accomplice. This is a **conscious,
  documented, justified extension** (a late-level escalation), gated as such.
- **Iron rule of this spec:** the accomplice is **purely additive**. A level with no
  accomplice is **behaviourally byte-identical** to today — identical energy ledger, identical
  phase/stance transitions, identical WON/LOST outcome. The only structural addition is one
  nullable field defaulted to `null`, which no existing consumer reads.

---

## 0. The problem this spec exists to solve

ADR-0036's decision D2 — _"the accomplice replaces the captor's counter-fire"_ — was written
against **ADR-0034 D3's ORIGINAL clean branch**: "during `PEEKING` the captor fires at the
player and drains energy." That branch **no longer exists as a standalone thing.** Across
Revisions 2–5 it was **fused**: the captor's player-directed shot became the
`QTE_UNANSWERED_PEEK` (−8) charge, and that charge was welded onto the **blown-peeks loss
clock** — both now fire on the **same single event**: a `PEEKING → COVERED` close with
`captorHp > 0` (a "blown peek"), in `tickQte`'s ACTIVE branch:

```
if (captorHp > 0) {
  blownPeeks += 1;                 // ← threat to the HOSTAGE   (loss clock)
  energyDelta += QTE_UNANSWERED_PEEK; // ← threat to the PLAYER (captor's counter-fire)
  if (blownPeeks >= maxBlownPeeks) → LOST (execution)
}
```

So "the captor's counter-fire" today = the **−8 energy-drain half** of the blown-peek event.
The **blownPeeks-increment half** is a different threat entirely (the captor executing the
hostage). The re-spec must split the fused event and reassign only the correct half.

---

## D1 — What "replace" means now (precise, implementable)

Split the fused blown-peek event into its two threats and reassign exactly one:

| Half of the blown-peek event                          | Threat against | With accomplice present                          |
| ----------------------------------------------------- | -------------- | ------------------------------------------------ |
| `blownPeeks += 1` and execution at `maxBlownPeeks`    | **the hostage**| **UNCHANGED** — stays wholly on the captor.      |
| `energyDelta += QTE_UNANSWERED_PEEK` (−8)             | **the player** | **SUPPRESSED** — the captor stops firing at you. |

- **The accomplice owns the player-directed fire.** When present, it fires on its own
  deterministic cadence during `ACTIVE`, each landed shot draining `ACCOMPLICE_SHOT_DAMAGE`
  (−8) energy. This is the incoming fire that the captor's counter-fire used to be.
- **The captor keeps only the hostage threat.** `blownPeeks` still increments on every blown
  peek and still executes at `maxBlownPeeks` → `LOST`, **byte-for-byte as today**. The captor
  "concentrates on the hostage/retreat" (ADR-0036 D2) = it keeps driving the execution clock
  and stops draining your energy.

**The single surgical change to the existing loss branch** (everything else in the branch is
untouched):

```
if (captorHp > 0) {
  blownPeeks += 1;
  if (qte.accomplice === null) energyDelta += QTE_UNANSWERED_PEEK;  // captor counter-fire — OWNED BY ACCOMPLICE when present
  if (blownPeeks >= qte.maxBlownPeeks) → LOST (return with the ticked accomplice + accumulated energyDelta)
}
```

**Why this is the faithful reading of D2.** ADR-0036 D2's literal words — "the captor stops
firing **at the player**", "the accomplice **owns all incoming fire at the player**", "one
active threat on the player at a time (captor on the hostage, accomplice on you)" — map
exactly onto: suppress the −8 player-drain (captor stops firing at you), arm the accomplice's
−8 fire (accomplice owns incoming fire), leave the blownPeeks execution clock alone (captor on
the hostage). The loss route and the win route (deplete `captorHp` via ring hits) are **not
touched** — the accomplice does not change how you win or how you lose the hostage; it changes
**who shoots you while you try.**

**Net-drain neutrality (design rationale).** The removed captor drain and the added accomplice
drain are the **same −8 magnitude**. A player who does nothing still blows `maxBlownPeeks`
peeks and is executed at the same tick as today; the ~4 × −8 ≈ **−32 passive-ignore energy
figure** (ADR-0034 Rev 3) is **preserved** — the drain simply arrives on the accomplice's
clock instead of the peek clock. The escalation is not "more damage"; it is a **decoupled,
separately-telegraphed second threat locus** that turns "hold your nerve on the ring" into
"hold your nerve on the ring **while a second gun is working you** — so end it fast." That is
the _decision_ (target-priority / tempo) ADR-0036 wanted, added without inflating raw damage.

---

## D2 — The accomplice is a soft, telegraphed, unavoidable drain — NOT a second aim target

- The accomplice fire **always lands** (it is a soft energy cost, like the unanswered peek it
  replaces — you never "dodged" that either). There is **no aim, no dodge, no hitbox** on the
  accomplice in the game layer. The player's only counter is **end the duel faster** (deplete
  `captorHp` before more accomplice shots land).
- The accomplice is **not shootable** in this minimal version. The **ring stays the sole
  aim target** — adding a second shootable target would fracture the "shoot what you see"
  read and violate the single-active-threat clarity (P3). Silencing the accomplice = winning
  the duel. _(A killable accomplice is a deliberate future extension, explicitly out of scope
  here — flagged to lead-game-designer / F-future.)_
- Because the accomplice needs no aim, **the game layer carries no accomplice position.** Its
  world placement is a **render concern** (D6). Boundary law preserved: game owns cadence +
  damage; render owns where it stands and what its fire looks like.

---

## D3 — Additive contract fields (all `readonly`; absence == today)

### `QteSpec` (authoring — `src/game/types/hostageQte.ts`)

One additive, optional block. **Absent ⇒ no accomplice ⇒ byte-identical to today.**

```ts
/** A second shooter that OWNS the player-directed fire in advanced levels (F4 / ADR-0036).
 *  Absent ⇒ the captor keeps his own counter-fire (QTE_UNANSWERED_PEEK) exactly as today. */
readonly accomplice?: QteAccompliceSpec;

interface QteAccompliceSpec {
  /** Seconds between accomplice shots during ACTIVE. The F3 difficulty lever
   *  (shorter = more pressure). Finite, > ACCOMPLICE_TELL_SECONDS, > 0 — asserted
   *  in createQte so the wind-up tell is always a discrete beat. */
  readonly fireIntervalSeconds: number;
}
```

- **Only the cadence is authored.** `ACCOMPLICE_SHOT_DAMAGE` and `ACCOMPLICE_TELL_SECONDS` are
  **system constants** in `qteSystem.ts` (a shot is a shot on every level — mirrors the
  wander-amplitude / `RING_HIT_RADIUS` / energy-magnitude convention). Promoting damage/tell to
  `QteSpec` is an additive F3 seam reserved for later, not opened now.

### `HostageQte` (runtime — `src/game/types/hostageQte.ts`)

One additive, **nullable** field. `null` ⇒ the tick's accomplice branch is skipped and the
captor charges `QTE_UNANSWERED_PEEK` exactly as today (the null-guard IS the byte-identity).

```ts
/** The active accomplice, or null when this level has none (byte-identical to today). */
readonly accomplice: HostageAccomplice | null;

interface HostageAccomplice {
  /** Runtime mirror of QteSpec.accomplice.fireIntervalSeconds (copied once at createQte). */
  readonly fireIntervalSeconds: number;
  /** Counts down over ACTIVE delta; on ≤ 0 a shot lands and it resets to the interval.
   *  Seeded to fireIntervalSeconds at createQte (first shot one full interval into ACTIVE
   *  — a natural grace so ACTIVE never opens on an instant hit). */
  readonly fireCooldownRemaining: number;
  /** True during the last ACCOMPLICE_TELL_SECONDS before a shot — the render draws the
   *  aim/muzzle wind-up (D6). Mirrors the captor's G4 telegraphActive discipline. */
  readonly telegraphActive: boolean;
}
```

- `createQte`: when `spec.accomplice` is present, add its `fireIntervalSeconds` to the C6
  finite-numeric guard, assert `fireIntervalSeconds > ACCOMPLICE_TELL_SECONDS` (discrete tell,
  mirrors the `peekCadenceSeconds > TELEGRAPH_LEAD_SECONDS` assert), and seed
  `accomplice = { fireIntervalSeconds, fireCooldownRemaining: fireIntervalSeconds, telegraphActive: false }`.
  When absent, seed `accomplice = null`. **No other createQte field changes.**

---

## D4 — Deterministic cadence + damage (no `Math.random`, no `Date.now`)

- **Damage:** `ACCOMPLICE_SHOT_DAMAGE = -8`. Chosen to equal `QTE_UNANSWERED_PEEK` so
  replacement is net-neutral and the energy-severity ordering is untouched
  (`body -5 < panic -6 < accomplice/unanswered-peek -8 ≪ hostage -30 ≪ refill +40`).
- **Tell lead:** `ACCOMPLICE_TELL_SECONDS = 0.35` (its own named constant — do NOT alias
  `TELEGRAPH_LEAD_SECONDS`; ADR-0035 gotcha: separate names so a future edit to one doesn't
  silently move the other).
- **Belliard-of-the-accomplice cadence (the authored duel, D5):** `fireIntervalSeconds = 2.8`.
  Rationale: over the ~11–12 s of `ACTIVE` it takes a passive player to reach `maxBlownPeeks`,
  2.8 s cadence lands ≈ 4 shots ⇒ ≈ −32, matching the preserved passive-ignore figure (D1).
- **Cadence is a pure countdown accumulator over ACTIVE time** — the SAME multi-segment
  discipline the stance sub-machine already uses (consume whole intervals so a large `delta`
  never swallows a shot; each iteration subtracts a strictly-positive interval ⇒ bounded /
  terminating). Framerate-independent: a function of accumulated ACTIVE time alone, so
  re-chunking `delta` yields the identical shot count — replay-deterministic, exactly like the
  seeded wander (ADR-0034 Rev 3 precedent). Sketch (inside the ACTIVE branch, run **after** the
  fire-resolves-first WON check, **before/around** the stance loop so its result is included in
  BOTH the LOST early-return and the normal return):

```
let acc = qte.accomplice;
if (acc !== null) {
  let cd = acc.fireCooldownRemaining;
  let rem = delta;
  while (rem >= cd) {            // consume whole intervals — no swallowed shot on a big delta
    rem -= cd;
    energyDelta += ACCOMPLICE_SHOT_DAMAGE;   // a shot lands
    cd = acc.fireIntervalSeconds;            // reset
  }
  cd -= rem;
  acc = { ...acc, fireCooldownRemaining: cd, telegraphActive: cd <= ACCOMPLICE_TELL_SECONDS };
}
```

- **Ordering (deterministic, matches the existing tie-break):** (1) resolve `fire` first — a
  depleting ring hit returns `WON` and **no accomplice shot is charged that tick** (the duel is
  over); (2) tick the accomplice (accumulate energy, compute new `acc`); (3) tick the stance
  loop — on the fatal blown-peek close return `LOST` **including** the ticked `acc` and the
  accumulated `energyDelta`; else fall through to the normal return, also including `acc`.
  **Correctness requirement:** `acc` must be written into **every** ACTIVE exit path that
  isn't the WON early-return (both the LOST early-return and the normal return), or the
  cooldown desyncs — call this out in the dev handoff.
- **Accomplice fires throughout `ACTIVE`, independent of stance.** It is a second gun, not
  bound to the captor's peek. This is what makes "when is it safe to focus the ring" a real
  read (ADR-0036 D2). It does **not** fire during `ZOOMING` (the scene is still being read —
  consistent with "don't shoot what you can't read"), `WON`, `LOST`, or `DONE`.

---

## D5 — Prerequisite level: a minimal authored duel on **VITRY** to host the accomplice

Only `belliard` has a `qteSpec` today (ADR-0035 D3, Belliard-first; `stalingrad`/`vitry`
frozen). The accomplice is the **peak-difficulty escalation** (ADR-0036 D1: "advanced levels
only", "even at peak difficulty"), so it belongs on **Vitry — 94** (the last, hardest
district: `enemySpeedMultiplier 1.6`, `timeSeconds 70`), **not** on the Belliard teaching
level.

Add a minimal `hostageQte` to the `vitry` `LevelConfig` (`src/game/levels/levels.ts`). It is
the shipped duel **with the accomplice as its single distinguishing escalation** — the duel
body is held ≈ Belliard so the accomplice is the ONE new variable (one-variable-at-a-time):

```ts
hostageQte: {
  triggerAtElapsedSeconds: 10,   // early, mirrors Belliard's 12 scaled to the 70 s level
  zoomSeconds: 2,                // shell unchanged
  anchor: { x: 0, y: -5 },       // same sidewalk framing as Belliard (same facade world)
  maxBlownPeeks: 4,              // held = Belliard (≥2 authoring floor) — accomplice is the escalation, not a tighter clock
  peekCadenceSeconds: 1.5,       // held ≈ Belliard
  peekDurationSeconds: 1.5,      // held ≈ Belliard
  captorHp: 3,                   // held = Belliard
  targetSeed: 19940714,          // PLACEHOLDER — K-5 re-pin required (see below)
  accomplice: { fireIntervalSeconds: 2.8 },  // ← the escalation
},
```

- **Curve note (handoff to F3 / ADR-0035, not authored here):** ideally `stalingrad` gets a
  no-accomplice duel first (Belliard → harder duel → Vitry adds the second gun) so the player
  meets the duel and the accomplice on separate levels. Authoring `stalingrad`'s duel is out of
  this spec's minimal scope; recommended to lead-game-designer.
- **K-5 re-pin (blocking, stage-5 / dev-gameplay):** `targetSeed 19940714` is a placeholder.
  Because Vitry reuses the shipped wander constants, `dev-gameplay` must re-verify (structural
  assert or `verify` playtest) that each of the 4 peeks presents ≥ 1 on-captor (`vital ∪ limb`)
  decelerating waypoint window with the pinned seed, exactly as Belliard's seed was pinned. The
  accomplice does not affect the wander, so Belliard's pinned seed logic transfers directly.

---

## P3 — the single-active-threat invariant (structural, testable)

> **INVARIANT P3-ACC.** In `ACTIVE`, exactly one **player-directed incoming-fire** channel is
> armed, selected structurally by accomplice presence:
>
> - **Channel C — captor counter-fire:** charges `QTE_UNANSWERED_PEEK` on a blown-peek close.
>   Armed **iff `qte.accomplice === null`**.
> - **Channel A — accomplice fire:** charges `ACCOMPLICE_SHOT_DAMAGE` on a fire-interval
>   elapse. Armed **iff `qte.accomplice !== null`**.
>
> `armed(C) = (accomplice === null)` and `armed(A) = (accomplice !== null)` ⇒ `armed(C) XOR
> armed(A)` is a **tautology** — never both, never neither. (Player-caused self-inflicted costs
> — bavure −30, body −5, panic −6 — are **not** incoming fire and are outside this invariant.)

This is the exact P3 violation the ADR-0036 coherence pass ruled out ("do not let both the
captor and the accomplice fire at the player in the same level") expressed as code, not prose.

**Acceptance tests (unit, `qteSystem.test.ts`):**

1. **Accomplice present ⇒ Channel C silent.** Simulate a full `ACTIVE` run that blows peeks
   with `accomplice !== null`: assert **no** `QTE_UNANSWERED_PEEK` is ever charged (all
   player-drain in the run comes from `ACCOMPLICE_SHOT_DAMAGE` multiples), and `blownPeeks`
   still increments and still reaches `LOST` at `maxBlownPeeks` (execution clock unchanged).
2. **Accomplice absent ⇒ Channel A silent + byte-identical.** With `accomplice === null`,
   assert the accomplice never charges energy, and a golden run's energy-delta sequence,
   stance transitions, and WON/LOST outcome are **identical** to the pre-F4 baseline.
3. **Never both.** No single tick charges both `QTE_UNANSWERED_PEEK` and
   `ACCOMPLICE_SHOT_DAMAGE`.
4. **Determinism.** The same `ACTIVE` timeline chunked into different `delta` sizes charges the
   identical accomplice-shot count (framerate independence).

---

## D6 — Render tell (cop-fallback until real art)

Render lane (`dev-r3f-render`); this spec names the **read**, not the style (art is
lead-art's jurisdiction).

- **Presence:** draw the accomplice **iff `qte.accomplice !== null` and `isQteActive`**. A
  second cop-fallback figure — reuse the captor's `resolveEnemyTexture("hostage_taker", …)`
  fallback (same pure data-swap seam the captor uses; flag to lead-art that the accomplice
  needs its **own** sprite later).
- **Placement — visually DISTINCT from the captor** so the player never confuses the shootable
  captor (the ring target) with the unshootable second gun. A render constant
  `ACCOMPLICE_OFFSET` (anchor-relative), Belliard/Vitry-first, e.g. `{ x: -2.4, y: 0.0 }` —
  screen-LEFT, well clear of the ring's roam (ring reaches ≈ anchor − 0.98 in x) and of the
  front-right hostage. The accomplice carries **no ring** (it is not the kill target).
- **Fire tell — three legible beats (the read the player must get):**
  1. **Idle** (no imminent shot): present, menacing, gun-lowered read.
  2. **Wind-up** (`qte.accomplice.telegraphActive`): a readable aim/muzzle raise, held for
     ≥ `ACCOMPLICE_TELL_SECONDS` (0.35 s) — the player must see "a shot is coming" **before**
     it lands (P3: readable danger, never a surprise). Analogous to the captor's G4 peek tell.
  3. **Shot lands** (the tick charged `ACCOMPLICE_SHOT_DAMAGE`): a brief muzzle flash on the
     accomplice, and the drain is read through the **existing** `energyFloater("−8 ⚡")` already
     wired in `useGameLoop` from `energyDelta`. Reduced-motion: the flash/wind-up degrade to a
     **steady** appearing cue (no >3 Hz strobe), consistent with `hostageCue`'s existing
     reduced-motion discipline (WCAG 2.3.1).
- **The accomplice tint must not read as "shootable green/yellow"** — it must be clearly
  distinct from the ring's spatial-colour palette so the player never mistakes it for a kill
  target. (Exact hue: lead-art.)
- **Composite-gate / stage-5 framing check (like K-1):** confirm `ACCOMPLICE_OFFSET` keeps the
  accomplice figure + its muzzle tell **on-frame at the QTE zoom** on both device classes.
  Fallback if it clips: pull the offset toward the captor (e.g. `x: -2.0`) — a constant tweak
  that touches no game logic.

---

## Acceptance criteria (design VERIFY, stage 5)

1. A `hostageQte` with **no** `accomplice` block plays **byte-identically** to today
   (tests P3-ACC #2; playtest Belliard shows no change).
2. On Vitry, the accomplice figure is visible, spatially distinct from the captor, fires on a
   ~2.8 s cadence with a ≥ 0.35 s wind-up tell, and each shot floats a "−8 ⚡".
3. A blown peek on Vitry charges **0** energy from the captor (Channel C silent) but still
   increments `blownPeeks` and executes at `maxBlownPeeks` (tests P3-ACC #1).
4. Passive-ignore of the Vitry duel drains ≈ −32 energy total (net-neutral vs the captor's
   own counter-fire) and loses at the same blown-peek count as a captor-only duel would.
5. K-5: every one of Vitry's 4 peeks presents ≥ 1 on-captor decelerating window with the
   pinned `targetSeed` (blocking; dev-gameplay re-pins).
6. Reduced-motion: the accomplice wind-up/muzzle degrade to steady cues, no strobe.

---

## Hand-offs

- **lead-game-designer (Karim):** gate this spec; ratify Vitry-as-host + the D1 "replace ==
  suppress captor drain, arm accomplice, leave the execution clock" reading against ADR-0036
  D2. Note the F3 recommendation (a no-accomplice `stalingrad` duel first).
- **senior-architect (Winston):** the D3 fields + D4 ordering (`acc` written on all non-WON
  ACTIVE exits) touch the frozen `tickQte` contract — confirm the additive delta.
- **lead-art:** the accomplice needs its own sprite + a fire/muzzle tell; cop fallback until
  then. Spec the read (distinct from the captor, not ring-coloured), style is yours.
- **narrative-designer (Yasmine):** a second armed figure in the tableau — who is he? (fiction
  implication, not authored here.)
