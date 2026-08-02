# 0080 — Photo leverage: a cross-level carry (Stalingrad → Niveau Final)

- **Status:** Proposed
- **Date:** 2026-08-01
- **Number:** 0080, allocated by `senior-architect` (Winston) at stage 3 — no `producer` in this
  loop, same posture as ADR-0077's self-allocation clause. Verified against the local branch,
  `origin/main` and all 107 fetched remote refs (max visible = 0077, itself claimed on three
  different unmerged branches); 0078/0079 are reported taken on a branch not fetched here.
  **`producer` owns the merge-time re-check for both 0077 and 0080, per the adr-new guard.**
- **Author:** decision content by `senior-architect`, stage-3 tech plan.
- **Relates to:** ADR-0077 (the photo set-piece frame — this ADR closes the one hole it left),
  ADR-0060 (the shield-break tempo lever this reward composes with, and must not silently eat),
  ADR-0076 (run stats — the pure-algebra / bridge-I-O split reused verbatim, and the `F1` "a run
  is one attempt on one level" law this feature has to work around), ADR-0074 (storage owners
  beside each other in `src/game/systems` — the older precedent ADR-0076 already diverged from,
  and this ADR follows ADR-0076 rather than 0074), ADR-0051/0053 (the Niveau Final boss row the
  multiplier is authored on), ADR-0054 (`muf_scores_*` / `muf_player_name` — the storage family
  this feature must stay out of).
- **Inputs:** gated design set `docs/game-design/spec-photo-qte-paparazzi.md` (Rev. 2, §D7),
  `docs/game-design/spec-photo-qte-fiction.md` (§5), `docs/game-design/design-gate-photo-qte.md`
  (round 2 final — rulings R2-2 and R2-4, escalation E-4 asks (e) and (f)); tech plan
  `docs/game-design/techplan-photo-qte.md` §4–§5.

## Context

The photo set-piece plays on **Stalingrad**. Its reward is paid on the **Niveau Final**: a proof
in the roll compresses the final boss's `SHIELDED` lulls — "il est moins couvert", never "il a
moins de PV" (fiction §5.4, gate R-F3). The outcome therefore has to survive the gap between two
levels. Four facts of the shipped build make that an architecture decision rather than a variable:

1. **muf has no run that spans levels.** ADR-0076 F1 is explicit — "a run is one attempt on one
   level" — and `RunStats` is reset by construction at every `createInitialState`. The design
   gate's phrase "run-scoped carry" has **no existing home** in the code.
2. **Levels are separated by the menu, and possibly by a browser reload.** `App.tsx`'s
   `handlePlay(levelId)` mounts a fresh `GameScene`; between Stalingrad and the Niveau Final the
   player crosses the end screen, the menu, a narrative screen, and any amount of wall-clock
   time. In-memory React state loses the leverage on reload — and a reward that vanishes without
   explanation is indistinguishable from a bug.
3. **The boss's per-phase tuning is a module constant shared by two live encounters.**
   `BOSS_PHASE_TABLE` (`bossQteSystem.ts`) holds `shieldedLullSeconds` / `telegraphLeadSeconds`
   for **both** Belliard and the Niveau Final. A multiplier applied there hits both — the exact
   burn the shield-break story already took once on a system constant (gate K-3's own warning).
4. **Two gated fairness contracts meet on the same number.** ADR-0060 already cuts the next lull
   by `SHIELD_BREAK_LULL_CUT = 0.5 s`, clamped just above the phase tell. Composed naively with a
   reward multiplier, the clamp fires and **silently eats** the shield-break reward: the player
   pays a 1 HP chip for a compression that no longer happens (gate K-3).

The only shipped cross-level state is `muf_progress` (unlocked level ids): persisted, monotone,
written on a navigation event. That is the shape this feature actually needs.

## Decision

### D1 — The carry is PERSISTED, monotone, in its own `muf_*` key

**`muf_leverage`**, a sixth distinct key. Never read or written by prefs, progress, high scores
or the funnel; none of those is read by this feature.

```json
{ "v": 1, "leverage": "master-bonus" }
```

**An object, not a bare string** — deliberately. The design gate named the trap (R2-4): the carry
is 3-valued (`none | master | master-bonus`) **only while** the `PARIS-MINUIT` UNE variant stays
deferred, because the plaque's payoff is currently chosen on the contact sheet, in-scene, with the
frames still in hand (`hasPlaqueBonus(frames)` is a local derivation, not a carried fact).
Un-deferring it moves that read to the scores screen — a different level, a different surface —
and the carry needs a `hasPlaque` bit. With an object blob and a **total** parser, that upgrade is
**an added field, not a migration**: old blobs read `false`. The price is one field, one tier read
and one scores-screen read — not two strings, and not a data migration either. Stated here so
`pm` can price E-5 honestly.

- **Parse is total** (`parsePhotoLeverage`): absent, corrupt, unknown or wrong-typed all read as
  `"none"`. It never throws — a disabled or full `localStorage` degrades to "no leverage", never
  to an error on a navigation event.
- **Merge is monotone** (`none < master < master-bonus`) and idempotent. A later, worse roll can
  never downgrade a proof already obtained. Same OR-merge posture as the funnel's independent
  locks (ADR-0076 D4), for the same reason: a write that can only improve is a write no ordering
  bug can corrupt.

### D2 — Pure algebra in `src/game`, browser I/O in `src/hooks` — ADR-0076 D4, applied again

- **Pure (`src/game/systems/photoLeverageSystem.ts`):** the value type, the total parse, the
  monotone merge, and the tier lookup `photoRewardMultiplier(tiers, leverage)`.
- **Impure (`src/hooks/photoLeverageStorage.ts`):** `loadPhotoLeverage` / `recordPhotoLeverage`,
  the `localStorage` adapter and nothing else, in the same try/catch-swallow posture as
  `runFunnelStorage.ts`.

This **confirms ADR-0076 D4's precedent rather than forking it**, and it is the second feature to
take that shape — which is the point of recording it: the next contributor now has two data
points saying "storage adapters for new features live in the bridge", not one exception.
ADR-0074's older shape (each owner holding its own I/O inside `src/game/systems`) is **not**
retro-migrated, and this ADR does not authorise doing so.

### D3 — The leverage is banked when the player LEAVES the set-piece, not when Stalingrad is cleared

The write happens on the tick `tickPhotoQte` reports a settled outcome — whichever exit the
player takes (`[ CONTINUER ]`, `[ LAISSER TOMBER ]`, or a `SPOTTED` roll declined).

**Why:** making the reward contingent on also clearing Stalingrad would couple an explicitly
optional bonus to a mandatory success. That is precisely the pressure the gate's K-4 correction
exists to remove ("bonus, jamais gate" — and the `[ LAISSER TOMBER ]` button IS the invariant).
The photograph exists the moment it is in the box; dying to the street afterwards does not
un-take it. Consequence, accepted and named: once obtained, the leverage is banked permanently
for that browser profile. **Flagged to `pm` for ratification** (it is one predicate to overrule).

### D4 — `rewardMultiplier` is AUTHORED DATA on the Niveau Final row, resolved once, applied through one helper

- **`BossQteSpec` gains `photoLeverageTiers?: { master: number; masterBonus: number }`**, authored
  on the **Niveau Final row only** (`×0.90` / `×0.80`). **Absent ⇒ ×1.00 at every leverage
  value**, so Belliard, Vitry, Stalingrad, the tutorial and the dev harness are byte-identical —
  the additive-and-optional law, and the structural answer to Context §3. **Never a module
  constant** (gate E-4(f), verbatim).
- **`BossQte` gains a runtime `rewardMultiplier`**, resolved **once** in
  `createBossQte(spec, leverage)`. The tick reads the record, never the storage, never the tiers.
- **One application point**, `shieldedLullOf(row, phaseIndex, m)`, replacing all three raw reads
  of `row.shieldedLullSeconds` in the tick. **Phase-scoped: phases 1 and 2 only; phase 3 is
  always ×1.00** (gate R2-2 — phase 3 admits no compression at any honest ε, and the frenzy is
  not this reward's playground: the reward moves the waiting, not the climax).
- **Order of operations, fixed** (amendment A1 point 2): `lull = m × shieldedLull`, **then**
  `− SHIELD_BREAK_LULL_CUT`, **then** the existing `Math.max(…, tell + margin)` clamp. The
  multiplier never bypasses the clamp; the clamp never bypasses the multiplier.

### D5 — The compound floor is asserted at construction, against the runtime row, with a NON-STRICT `≥`

For `p ∈ {phase 1, phase 2}`:

```
m × shieldedLullSeconds(p) − SHIELD_BREAK_LULL_CUT  ≥  telegraphLeadSeconds(p) + LULL_RESIDUAL_FLOOR
```

with **`LULL_RESIDUAL_FLOOR = 0.35 s`** — a **quotation**, not a preference: it is the worst
headroom ADR-0060's own §6-B table already ships and was gated at (phase 3: `0.70 − 0.35`). That
construction makes the photo reward provably **additive** to the shield-break experience and
removes the failure mode where a designer picks ε to fit the multiplier they wanted.

**The `≥` is non-strict deliberately and must not be "tightened" to `>` in review.** With ε
pinned by quotation, phase 3 at ×1.00 sits at **exactly** `0.70 = 0.35 + 0.35`: a strict `>`
would fail the **shipped baseline**. The assert message carries that sentence so the reason is
readable at the failure site.

**A property this buys for free, and it is the real answer to K-3.** Since
`LULL_RESIDUAL_FLOOR (0.35) > SHIELD_BREAK_LULL_FLOOR_MARGIN (0.05)`, any multiplier passing the
construction-time assert leaves `base − CUT ≥ tell + 0.35 > tell + 0.05`, so **the runtime clamp
is provably unreachable at every legal multiplier**. "The −0.5 s cut is never silently eaten"
stops being a playtest hope and becomes a structural guarantee. Legal multipliers are therefore
`≥ ×0.781` (phase 2 binds); shipped tiers ×1.00 / ×0.90 / ×0.80.

## Alternatives considered

- **In-memory only (React state in `App.tsx`).** Rejected: it silently loses the leverage on any
  reload between the two levels, producing a reward that "sometimes doesn't work" — the worst
  possible failure shape for an optional bonus the player worked for.
- **Fold the leverage into `muf_progress`.** Rejected: that key is the unlock set, read by the
  menu on every render, with its own corrupt-blob default (`["belliard"]`). Overloading it
  couples two unrelated lifetimes and puts a gameplay reward inside navigation state.
- **Extend `RunStats` / `muf_funnel`.** Rejected: `RunStats` is per-level by construction (F1) and
  private to the pure layer (ADR-0076 D6); the funnel is a 4-milestone onboarding record whose
  vocabulary this would pollute. Two different lifetimes, two different keys.
- **Multiplier applied inside `BOSS_PHASE_TABLE` / `phaseTuning()`.** Rejected — it is the bug:
  the table is shared by Belliard and the Niveau Final (Context §3).
- **Non-cumulative composition** (`lull = min(m × lull, lull − CUT)` — the stronger lever wins).
  Closes the collision just as cleanly and preserves both gated contracts verbatim, but it makes
  the photo reward **invisible on every lull that follows a shield break** — i.e. it disappears
  exactly when the player is playing well. Rejected at the design gate (R2-2) and recorded here so
  it is not reinvented.
- **A uniform multiplier across all three phases.** Arithmetically dead once ε is honest
  (phase 3 requires `m ≥ ×1.000`), unless ε is shaved to ≤ 0.05 s — the non-recovery the gate
  already refused. Rejected.

## Consequences

- **muf gains its first non-navigational cross-level state.** The precedent is now written down:
  a fact produced by one level and consumed by another is persisted under its own `muf_*` key,
  with a total parse and a monotone merge, algebra pure and I/O in the bridge. The next such
  feature copies this, or supersedes this ADR — it does not invent a third shape.
- **A sixth `muf_*` key enters the storage family.** Nothing reads it but this feature. The
  forbidden-payload discipline of ADR-0076 D5 applies unchanged: no identity, no timestamp, no
  free text — the blob holds one enum and a version integer.
- **The Niveau Final's boss row acquires a second authored tuning field.** Belliard and the dev
  harness stay byte-identical by absence, and a test asserts it at every leverage value rather
  than trusting the absence.
- **`spec-boss-shield-break-tempo-shot.md` is amended, not re-gated** — amendment A1, transcribed
  verbatim by that spec's lane (`game-designer`). §D4/§D5 above are its implementation and must
  not diverge from it; if they ever do, the spec wins and this ADR is superseded.
- **Determinism is untouched.** The carry is read once at level boot and frozen into
  `BossQte.rewardMultiplier`; no tick reads storage, so a replay from a tick sequence stays
  reproducible (ADR-0034 Rev. 3 discipline, ADR-0077's guardrail).
- **Playtest obligation:** the reward must be _felt_ at ×0.90/×0.80 without changing the
  efficiency bar (`maxBlownWindows` is untouched, so the ≈ 62 % window-answer requirement is
  identical). If it is imperceptible, the honest fix is a design re-tune inside the `≥ ×0.781`
  wall — **not** widening the phase scope, which re-opens K-3.
- **Follow-up:** if `pm` un-defers the `PARIS-MINUIT` UNE variant (E-5 / F-2), the blob gains
  `hasPlaque` — an additive field under the total parse, recorded in D1 so it is not discovered
  as a bug report. If `pm` overrules D3 (bank at exit vs bank at level clear), that is a change to
  one predicate and an amendment to this ADR, not a redesign.
