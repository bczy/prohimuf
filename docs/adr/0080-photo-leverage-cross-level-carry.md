# 0080 — Photo leverage: a cross-level carry (Belliard → Niveau Final)

- **Status:** Proposed
- **Date:** 2026-08-01 · **amended 2026-08-02** (host level moved to Belliard)
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
  `docs/game-design/spec-photo-qte-fiction.md` (**Rev.3**, §2, §5, §9.0),
  `docs/game-design/design-gate-photo-qte.md`
  (round 2 final — rulings R2-2 and R2-4, escalation E-4 asks (e) and (f)); tech plan
  `docs/game-design/techplan-photo-qte.md` §4–§5.
- **Amendment, 2026-08-02 (Bertrand, final — overrides gate ruling R-10):** the set-piece is
  hosted on **Belliard**, the shipped level 1; **no new level is built**. This ADR's source level
  changes accordingly. **The decision itself — persisted, monotone, own `muf_*` key, object blob,
  pure algebra + bridge I/O — is unchanged;** every clause of it is reinforced rather than
  weakened by the longer carry, as recorded in Context §2 and Consequences below.

## Context

The photo set-piece plays on **Belliard** — the shipped level 1 (Bertrand, 2026-08-02; before that
amendment the gate had placed it on Stalingrad, ruling R-10, now annulled). Its reward is paid on
the **Niveau Final**: a proof in the roll compresses the final boss's `SHIELDED` lulls — "il est
moins couvert", never "il a moins de PV" (fiction §5.4, gate R-F3). The outcome therefore has to
survive the gap between the game's first level and its last. Four facts of the shipped build make
that an architecture decision rather than a variable:

1. **muf has no run that spans levels.** ADR-0076 F1 is explicit — "a run is one attempt on one
   level" — and `RunStats` is reset by construction at every `createInitialState`. The design
   gate's phrase "run-scoped carry" has **no existing home** in the code.
2. **Levels are separated by the menu, and possibly by a browser reload — and now by two further
   levels.** `App.tsx`'s `handlePlay(levelId)` mounts a fresh `GameScene`; between **Belliard** and
   the Niveau Final the player crosses the end screen, the menu, narrative screens, **Vitry,
   Stalingrad**, an unbounded number of retries, and any amount of wall-clock time — plausibly
   several sessions. In-memory React state loses the leverage on reload — and a reward that
   vanishes without explanation is indistinguishable from a bug. **The relocation does not weaken
   this argument; it removes the last doubt about it.** What was an edge case (reload between two
   adjacent levels) is now the default path (days between the first level and the last).
3. **The boss's per-phase tuning is a module constant shared by two live encounters.**
   `BOSS_PHASE_TABLE` (`bossQteSystem.ts`) holds `shieldedLullSeconds` / `telegraphLeadSeconds`
   for **both** Belliard and the Niveau Final. A multiplier applied there hits both — the exact
   burn the shield-break story already took once on a system constant (gate K-3's own warning).
   **The relocation makes this fact acute.** Belliard now both _produces_ the leverage and _runs
   its own boss finale off that shared table_, minutes later, in the same session. A multiplier
   applied to the table would compress the boss of the very level the player just photographed —
   a visible, immediate, plausible-looking bug. Authored data on the consuming row is no longer
   merely the tidy answer; it is the only one that survives the host level's own encounter.
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

**Amendment 2026-08-02 — the blob shape is unchanged, and the monotone merge becomes
load-bearing.** Under the Stalingrad placement, "a later, worse roll" meant replaying a late-game
level: real, but rare. Hosting the set-piece on **Belliard** — always unlocked, always the first
row of the menu, the level players replay to warm up — makes the downgrade path the **normal**
one: earn `master-bonus`, replay Belliard the next evening, press `[ LAISSER TOMBER ]`, and a
last-write-wins store would silently take the proof back. The monotone merge is what makes that
harmless, and it was already the decision. This amendment only records that it is now the clause
holding the most weight, and that **it must not be "simplified" to a plain overwrite in review**.

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

### D3 — The leverage is banked when the player LEAVES the set-piece, not when the host level is cleared

The write happens on the tick `tickPhotoQte` reports a settled outcome — whichever exit the
player takes (`[ CONTINUER ]`, `[ LAISSER TOMBER ]`, or a `SPOTTED` roll declined).

**Why:** making the reward contingent on also clearing the host level would couple an explicitly
optional bonus to a mandatory success. That is precisely the pressure the gate's K-4 correction
exists to remove ("bonus, jamais gate" — and the `[ LAISSER TOMBER ]` button IS the invariant).
The photograph exists the moment it is in the box; dying to the street afterwards does not
un-take it. Consequence, accepted and named: once obtained, the leverage is banked permanently
for that browser profile. **Flagged to `pm` for ratification** (it is one predicate to overrule).

**Amendment 2026-08-02.** The host level is **Belliard**, and the set-piece fires in its first
seconds (tech plan D-K: the trigger must land before the hostage duel at 12 s). "Bank at level
clear" would therefore mean that most **first-time** photographers — beginners, on level 1, who
then die to the street — lose the proof they just took, minutes after being taught that the
photograph is theirs. The relocation does not change the predicate; it makes the case for it
plainly stronger. **Q-2 to `pm` remains open**, unchanged in substance.

### D4 — `rewardMultiplier` is AUTHORED DATA on the Niveau Final row, resolved once, applied through one helper

- **`BossQteSpec` gains `photoLeverageTiers?: { master: number; masterBonus: number }`**, authored
  on the **Niveau Final row only** (`×0.90` / `×0.80`). **Absent ⇒ ×1.00 at every leverage
  value**, so Belliard, Vitry, Stalingrad, the tutorial and the dev harness are byte-identical —
  the additive-and-optional law, and the structural answer to Context §3. **Never a module
  constant** (gate E-4(f), verbatim). **Amendment 2026-08-02:** Belliard now authors the
  `photoQte` **and no tiers**; the two fields are independent and sit on the same row. A player
  can hold `master-bonus` while fighting Belliard's own Commandant, who resolves to **×1.00 by
  absence**. The test that asserts Belliard's boss timeline is identical at all three leverage
  values is therefore no longer defensive — it covers a scenario the shipped build produces.
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
  possible failure shape for an optional bonus the player worked for. **Since 2026-08-02 the two
  levels are the first and the last, with two levels and probably several sessions between them,
  so this option does not merely fail on an edge case — it fails on the expected path.**
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
- **The carry now spans the whole campaign, not one seam (2026-08-02).** Belliard → Vitry →
  Stalingrad → Niveau Final, across sessions. Three practical consequences, all accepted:
  (i) the persisted key is the only workable transport, and the in-memory alternative below is now
  rejected for a stronger reason than it was written with; (ii) the monotone merge is load-bearing,
  because the source level is the most-replayed one in the game (D1 amendment); (iii) the value
  must stay **forward-compatible on its own**, since the blob may sit in a player's storage for
  weeks between write and read — which is exactly what the versioned object shape buys.
- **The proof becomes farmable, and that is a design fact, not an architectural one
  (2026-08-02).** Belliard is always unlocked, `[ RECOMMENCER ]` re-enters a byte-identical scene
  (AC10), and the merge only ever upgrades — so a patient player banks `master-bonus` on level 1
  and meets the final boss at ×0.80 by default. **No clause of this ADR is changed to prevent
  that:** the retry, the monotone merge and the exit-write are each gated decisions (R2-4, AC10,
  K-4), and undoing one to make the reward scarce would re-open a gate. If design wants scarcity,
  the lever is the **tiers on the Niveau Final row** — authored data, one line, no ADR.
  Routed to `pm` + `game-designer` as tech plan §8bis Q-4.
- **The host level was already crowded, and the photo set-piece had to learn to queue
  (2026-08-02).** Belliard authors a hostage duel (12 s) and a boss finale (timer expiry) with a
  margin invariant already asserted at load. The set-piece serialises with both by a runtime
  trigger guard plus an authoring ordering rule, and — because every frozen-scene block freezes
  `elapsedSeconds` — it costs the level timer zero seconds, leaving those shipped invariants
  arithmetically untouched. That belongs to the tech plan (D-K, §2.7), not to this ADR; it is
  recorded here only so the next reader knows the relocation was checked against the host row and
  not merely against the fiction.
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
- **Follow-up (2026-08-02):** if `pm` gates the set-piece on progression (fiction §2.4 frames it as
  a _return_ to Belliard, not the tutorial night), that condition must ride the existing
  `LevelParams` seam — a boolean computed in `App.tsx` from already-persisted state, threaded
  exactly like `photoLeverage`. **It must not become a second storage read inside the pure layer,
  and it does not warrant a seventh `muf_*` key.** Tech plan §8bis Q-3.
- **Follow-up:** if `pm` un-defers the `PARIS-MINUIT` UNE variant (E-5 / F-2), the blob gains
  `hasPlaque` — an additive field under the total parse, recorded in D1 so it is not discovered
  as a bug report. If `pm` overrules D3 (bank at exit vs bank at level clear), that is a change to
  one predicate and an amendment to this ADR, not a redesign.
