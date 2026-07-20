# Spec — Armement multi-armes par pickup (roster V1: A-B-C)

**Feature:** the "récupérer une arme en tirant une caisse" system — one active weapon at a
time, no switch, finite special stock, forced auto-return to the ∞ base weapon.
**Author:** `game-designer` (Sacha) · **Date:** 2026-07-20
**Status:** DRAFT — **needs `lead-game-designer` (Karim) PASS** (design-gate **round 2 of 2**)
before `senior-architect` lane assignment and any dev implementation.
**Formalizes:** `docs/game-design/pre-spec-weapons.md` (pre-gate, 2026-07-18) with the
6 blocking corrections **B1–B6** and 8 guardrails **W1–W8** from Karim's round-1 design gate
(`docs/handoffs/story-weapons-pickup.md` §stage-2) resolved and baked in.
**Bound by (pm scope, `_bmad-output/planning-artifacts/story-weapons-pickup.md`):** roster
V1 = **A-B-C only** (D = fast-follow, E = YAGNI); **NO loss-on-death** (regression AC A7);
Belliard-first; **no FLUX art lane** (drawn glyph placeholder); window-crate only.
**Grounds on the shipped model:** `resolvePlayerShot` (`src/game/systems/bulletSystem.ts`),
**ADR-0040** (instant hitscan, one shot = one target, window-hit priority,
courier-only-on-miss), **ADR-0003** (controller contract, mobile discrete tap model),
**ADR-0034** (hostage QTE) + **ADR-0051** (boss QTE) (own classifiers).

---

## 0. Cahier des charges verdict (unchanged from the pre-spec, restated)

Prohibition ST (1987) had **one fixed weapon** — no pickup, no alternate fire. **The whole
multi-weapon roster is a conscious, documented [EXTENSION]**, greenlit by Bertrand
(2026-07-20) and gated to A-B-C by pm. What makes it faithful to the _grammar_ of the genre:
"tirer une caisse pour s'équiper" is a genre canon from 1987 (Operation Wolf, Contra —
contemporaries of Prohibition; Wild Guns is the exact viseur-gallery cousin). The core loop
`Récupérer → Livrer → Éviter` is untouched: the specials serve `Éviter` (firepower under
pressure), and the forced base-return recreates Prohibition's ammo tension in firepower form.
No new loop verb, no meta-layer.

---

## 1. Roster V1 — A-B-C (pm ruling #1)

Code identifiers are neutral (`WeaponKind = "base" | "auto" | "spread"`); the French names
are designer placeholders, not lore (`narrative-designer` hand-off stands).

| #   | `WeaponKind` | Placeholder   | Role                                 | Stock                | Cahier des charges                                                                           |
| --- | ------------ | ------------- | ------------------------------------ | -------------------- | -------------------------------------------------------------------------------------------- |
| A   | `"base"`     | Le calibre    | precision mono-cible, always present | **∞**                | [EXTENSION-proche-FIDÈLE] — the one fixed weapon, made ∞ (the ammo stress moves to specials) |
| B   | `"auto"`     | La sulfateuse | panic-clear, sustained rattle        | **finite (rounds)**  | [EXTENSION]                                                                                  |
| C   | `"spread"`   | L'éventail    | horizontal width, a row of windows   | **finite (presses)** | [EXTENSION]                                                                                  |

D (tromblon) and E (bombe) are **out of V1** (§7.4, §10). No switch key, no inventory, no
weapon wheel: the active weapon is a single state, replaced only by firing a crate (§5.2).

---

## 2. Resolution model — every weapon is N hitscan resolutions (resolves **B2**, **B4**)

The shipped player shot is an **instant hitscan resolved at a single crosshair world point**
(ADR-0040): no travelling player projectile, window-hit takes priority, and **only a MISS can
hit a courier — the nearest single one (one shot = one target)**. This spec keeps that model
verbatim and defines each weapon as a fixed set of **independent hitscan resolutions**, each
at a deterministic world offset from the live crosshair, each obeying the ADR-0040 precedence
**individually**. There is **no new projectile physics** and **no depth/range axis** (that is
why D — "portée réduite" — is descoped; see §10 / **B3**).

### 2.1 The single resolution primitive (unchanged from ADR-0040)

One **resolution** at world point `P`:

1. **Window-hit priority.** Find the nearest _eligible_ target (enemy **or** LOOT crate,
   §5.3) whose slot centre is within `HIT_RADIUS = 0.8` of `P`; tie → lowest `slotIndex`.
   - If it is an **enemy** → the existing `ARCHETYPES` reward math (score/lives/time/kill),
     byte-identical to today.
   - If it is a **LOOT crate** → equip (§5.3); **never** any `scoreDelta`/`livesDelta`.
   - This resolution is now **consumed** — it cannot also hit a courier.
2. **Courier-only-on-miss.** If step 1 found nothing (a MISS at `P`), the resolution may hit
   the nearest single **courier** within `COURIER_HIT_RADIUS = 1.2` of `P` → the full
   civilian penalty (`resolveCourierShot`, unchanged). No amnesty (§3 / **B1**).

A resolution is thus exactly one ADR-0040 shot. A-B-C differ only in **how many** resolutions
a trigger produces, **where** their offset points sit, and **when** they fire.

### 2.2 A — `base` (calibre): 1 resolution, offset 0

One resolution at the crosshair (offset `dx = 0`). Cadence = the existing input-gated fire
rate (one shot per `pendingShots` entry, consumed one per frame — desktop click / mobile
two-finger-tap / one-finger double-tap, ADR-0003 D3/D5/D7); **no cooldown constant is added**.
Stock = ∞, never decremented, never blinking (**W4**, §6). This IS the shipped shot; A is a
byte-identical continuation of `resolvePlayerShot`.

### 2.3 B — `auto` (sulfateuse): per-trigger BURST (the **B4** recommendation)

**One fire trigger emits a burst of `BURST_ROUNDS` resolutions, one per tick over the
following ticks, each at offset 0 at that tick's live crosshair.** It is **not** a held-auto:
there is no hold gesture (ADR-0003 has none) and the model works **identically** on desktop
tap and mobile tap — one tap = one burst — so it adds **zero new binding** (**W8**).

| Rule            | Value / behaviour                                                                                                                                                                                                                |
| --------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Trigger         | A single `fire` while `burstRemaining === 0` **and** the post-burst refractory has elapsed **starts** a burst (sets `burstRemaining = BURST_ROUNDS`). Further `fire` input during a burst is ignored (the burst auto-sequences). |
| Per burst-round | One §2.1 resolution at offset 0 at the **live** crosshair of that tick (the player sweeps by moving the crosshair mid-burst), fired every `BURST_INTERVAL_MS`; decrements `burstRemaining` by 1 and **stock by 1 round**.        |
| Burst end       | When `burstRemaining` reaches 0, a `BURST_REFRACTORY_MS` window must elapse before another trigger is accepted.                                                                                                                  |
| Interaction     | Each round independently obeys §2.1 (window-priority then courier-only-on-miss). A round emits **at most one** `ImpactEvent` per tick — so B needs **no** change to the "0-or-1 impact per tick" invariant (only C does, §8).    |
| Empty mid-burst | If stock reaches 0 mid-burst, the burst ends **that tick**, auto-return to `base` fires the same frame (**W3**, §6).                                                                                                             |

Sustained sweep, mono-cible per round (nearest-eligible, like A) — the "sulfateuse" read.

### 2.4 C — `spread` (éventail): 3 SIMULTANEOUS resolutions at horizontal offsets

**One press = 3 independent §2.1 resolutions in the same tick**, at horizontal offsets
`dx ∈ { −2.0, 0.0, +2.0 }` world units relative to the crosshair, all at the crosshair's `y`.

- **Why ±2.0 u.** The façade column pitch is exactly **2.0 world units**
  (`facade01.ts`: `x = col·2 − 18`). Offsets of ±2.0 align the two side barrels with the
  crosshair column's immediate neighbours, so a centred press covers **3 adjacent columns** —
  the "2-3 fenêtres à distance médiane" intent, made exact. Coverage span (disc edges) =
  `−2.8 … +2.8` u ≈ 3 windows wide.
- **No self-overlap / no double-billing.** Adjacent offset points are 2.0 u apart while each
  disc has radius 0.8 u (gap 0.4 u), so the three discs never overlap — no single enemy is
  ever hit by two barrels. Belt-and-suspenders: resolutions run left→centre→right and a target
  downed by an earlier resolution is excluded from the later ones the same tick (deterministic,
  prevents any double-kill/double-score of one entity).
- **Per-resolution precedence (each of the 3 independently).** Each offset point runs §2.1 in
  full: window-priority first (enemy → reward; LOOT → equip; then consumed), else
  courier-only-on-miss at **that offset's** world point. So one press can down up to 3 window
  enemies **or** — the honest cost — strike up to 3 couriers (§3 / **B1**).
- **Stock: 1 press = 1 unit** (not per barrel), matching the pre-spec §4.2 "par pression" and
  pm story AC A4. The shotgun-shell mental model: the fan is one shell.
- C emits **up to 3 `ImpactEvent`s in one tick** — the one architecture delta (§8), already
  flagged by pm to `senior-architect`.

---

## 3. Discrimination integrity under spread (resolves **B1**, = **W5**)

**Every resolution that lands on an innocent (courier/civilian) incurs the full existing
innocent penalty. Multi-resolution weapons grant NO discrimination amnesty.** This is the
`Éviter` moral pillar (veille §2.1 PILIER) and it is non-negotiable:

- A sulfateuse burst swept low across the street can charge the courier penalty **once per
  round** that misses all windows and lands on a courier (up to `BURST_ROUNDS` times).
- An éventail press aimed low can charge it **once per offset barrel** that lands on a
  courier — up to **3 penalties in a single press**.
- There is no "it was spray, forgive it" rule anywhere. The penalty is computed
  per-resolution through the unchanged `resolveCourierShot`, exactly as a base miss is today.

Rationale: silent amnesty would let a held/wide weapon hose a window row past innocents for
free — that dilutes the one thing that keeps `Éviter` honest. The spread makes killing
_faster_, never _cheaper_ morally.

---

## 4. Weapon behaviour during the cinematic QTEs (resolves **B5**)

**The cinematic QTEs are weapon-agnostic / base-only. The special is frozen and does not
carry in.** The hostage QTE (ADR-0034) and boss QTE (ADR-0051) resolve shots through their
**own** ring/zone classifiers (`tickQte` / `tickBossQte`), never `resolvePlayerShot`, and
their `tickGameState` branches early-return carrying `...state`. Therefore:

1. **No weapon logic runs during a QTE freeze.** A QTE shot is one fixed classifier hit test
   (head/body/hostage/miss, or the boss ring) — it is **not** modulated by A/B/C: no burst,
   no spread offsets, no per-round accounting. The player effectively duels with the base shot
   for the duration.
2. **Special stock is frozen, never touched.** `weapon.active` and `weapon.stock` are carried
   unchanged through the QTE branch (they ride `...state`); a QTE consumes **no** special
   stock and cannot empty a weapon. On exit the player resumes with the exact weapon and stock
   they entered with.
3. **No LOOT during a QTE.** The scene is frozen: no crate spawns, appears, or is resolvable
   while a QTE is `ACTIVE` (crates live on the normal-tick window channel, §5, which is not
   ticked during the freeze).

This makes explicit the drift this gate exists to prevent: the specials are a normal-play
`Éviter` tool, orthogonal to the cinematic duels.

---

## 5. The armament crate — LOOT read + spawn contract (resolves **B6**, = **W1**, **W2**)

### 5.1 Perceptual channel (the READ claim, style handed to `lead-art`)

A crate is a **non-human OBJECT silhouette in its own perceptual channel** — never confusable
with a human innocent or a human menace (art §2 law 3: the human menace/innocent binary is a
_human_ silhouette contract; an object sits outside it). This is the design **read**
requirement; the visual style/execution is `lead-art`'s jurisdiction:

- **R1** — The crate silhouette is **non-human and unmistakable as an object** at reticle
  distance, distinct from every enemy/civilian silhouette on the same slot.
- **R2** (**W1**, glyph-before-fire) — The crate **carries the weapon glyph (A/B/C picto)
  legibly at reticle distance BEFORE the collecting shot**. No blind pickup: the player reads
  _what_ they are about to equip before firing.
- **R3** — The crate **glows** ("ce qui brille est interactif") while `VISIBLE`.
- V1 uses a **drawn glyph placeholder** (existing `GestureIcon`/`DiagramIcon` DOM pattern),
  **no FLUX sprite** (pm ruling #4). If `lead-art`'s read judges the placeholder illegible,
  that is a small fast-follow, not a V1 blocker.

**Hand-off to `lead-art`:** own R1–R3's visual execution (silhouette, glyph legibility, glow)
and confirm the crate cannot be misread as a shoot/don't-shoot human under the <0.3 s triage
(R4 below). Log in `docs/agent-handoffs.md`.

### 5.2 Acquisition & the one-weapon rule

- A LOOT crate reuses the shipped window state machine
  (`HIDDEN → APPEARING → VISIBLE → …`) on its **own discriminant** (not `EnemyKind` — architect
  decides new kind vs new entity; pm note stands: the crate must stay **outside** the
  `ARCHETYPES`/score-lives path so a crate hit never emits a stray `scoreDelta`/`livesDelta`).
- **Firing a `VISIBLE` crate equips its weapon immediately at full stock**, replacing the
  active weapon. Any remaining stock of the previously-active special is **lost** (the
  conscious Contra-capsule trade-off; mitigated by W1 + W2, not removed).
- The base weapon is never "holstered"; it is the permanent fallback.
- **Ordering vs the equipping shot.** The shot that hits the crate resolves under the
  **currently-active** weapon (§2); the newly-equipped weapon takes effect from the **next**
  trigger. (Prevents any ambiguity where an éventail press both equips and fires the new gun.)

### 5.3 Shares the window channel — triage under pressure (**B6** (b))

LOOT **shares** the window-slot pop-up channel with enemies/civilians (pm: generic window
spawn). It is resolved by §2.1 step 1 as one more "eligible target": nearest-within-`HIT_RADIUS`
wins; if that nearest is a crate → equip, if an enemy → damage. Because one entity occupies a
slot, they never co-locate. Consequence for the pillar: the player's <0.3 s "shoot / don't-shoot"
triage now has a **third** read (loot = _do_ shoot, but for a different reason) — hence R4:

- **R4** — The three window reads (menace = shoot; innocent = don't shoot; **loot = shoot to
  equip**) must be **triageable within the same <0.3 s window** as today's two. `lead-art`
  confirms the loot channel does not degrade the innocent/menace discrimination time (composite
  gate re-measures triage with loot present).

### 5.4 Spawn-exclusion rule — the anti-accidental-loss trap, made TESTABLE (**W2**)

> **A LOOT crate may spawn only in a slot whose column is ≥ `LOOT_SPAWN_MIN_COL_GAP = 2`
> columns from the column of _every_ slot currently in `APPEARING`, `VISIBLE`, or `SHOOTING`
> state.** Formally: `∀ active slot a : |loot.col − a.col| ≥ 2`.

This is a measurable, unit-testable rule — not "idéalement pas devant le viseur". Rationale:
the reticle tracks the active engagement (the pop-up enemies the player is shooting); column
pitch is 2.0 u and the hit disc is 0.8 u, so a 2-column (4.0 u) horizontal gap guarantees the
crate never materialises under the reticle path of a target the player is mid-firing at — the
Contra-capsule mitigation, made a testable spawn constraint. If no slot satisfies the rule this
tick, the crate spawn is **deferred** (never force-placed into an active column).

---

## 6. Auto-return & HUD (resolves **W3**, **W4**, **N2**)

### 6.1 Auto-return to base (**W3**)

- **On the tick a special's stock reaches 0**, the active weapon returns to `base`
  **automatically and immediately (same tick)**.
- **Same-frame empty cue.** Exactly one `weaponEmpty` event fires on that tick, driving an
  **audible cue (culasse à vide, existing SFX acceptable for V1) + a HUD flash** the **same
  frame** as the auto-return. The player **never** discovers the return by a silently-failed
  shot.
- For B, an empty reached mid-burst ends the burst that tick and returns to base that tick
  (§2.3).

### 6.2 HUD = a resource readout, not a tension gauge (**N2**, **W4**)

The ammo HUD is a **fuel gauge on the same footing as the shipped timer/lives/score HUD** — a
resource readout, **not** a stress surrogate. Guideline §6 ("la musique est le seul indicateur
de tension") is honoured: the counter and its end-blink are legibility, never a tension meter.

| HUD element          | Rule                                                                                                 |
| -------------------- | ---------------------------------------------------------------------------------------------------- |
| Active-weapon glyph  | The A/B/C picto, legible at a glance; derived from `GameState.weapon.active`.                        |
| Special stock        | Numeric counter **or** depleting pips (Metal Slug / Wild Guns convention), for `auto`/`spread` only. |
| End-of-stock cue     | The last ~20 % of a **special** stock blinks (arcade convention) — a fuel warning, not tension.      |
| Base weapon (**W4**) | Shows the **∞ symbol**. **No depleting counter, no red, no blink, ever.**                            |
| Empty flash          | The `weaponEmpty` HUD flash (§6.1).                                                                  |

Layout on desktop **and** mobile (ADR-0003), plus the ∞-vs-counter presentation, is
`ux-designer`'s call; gameplay only exposes `weapon.active` + `weapon.stock`. Style is
`lead-art`'s.

---

## 7. Tuning table — A-B-C (starting values, `verify`-tunable; one variable at a time)

Values carry forward the pre-spec §4.2 hypotheses adapted to the A-B-C roster and the
per-trigger-burst model. **These are playtest starting points, not gated constants** (pm: the
tuning is a hypothesis to refine via `verify`); the _structure_ (§§2–6) and the ACs (§9) are
what the gate locks. Measure on the Belliard build, change one field per iteration, log
before/after + why.

| Weapon         | Resolutions / trigger                        | Offsets (world u)   | Cadence                                                                       | Stock (start)                                 | Stock unit | Rationale                                                                                                                                                                                                                   |
| -------------- | -------------------------------------------- | ------------------- | ----------------------------------------------------------------------------- | --------------------------------------------- | ---------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **A `base`**   | 1                                            | `{0}`               | input-gated (unchanged, no cooldown const)                                    | **∞**                                         | —          | The baseline; everything compares to it. Byte-identical to ADR-0040.                                                                                                                                                        |
| **B `auto`**   | `BURST_ROUNDS = 6` per trigger, 1 round/tick | `{0}` each round    | `BURST_INTERVAL_MS = 90` (≈11 rounds/s in-burst); `BURST_REFRACTORY_MS = 150` | **120 rounds** (= 20 bursts, ≈10.8 s of fire) | **round**  | Burns fast (§4.2 "brûle vite", MS Heavy-MG ratio 200); the rattle is faster than any human tap cadence — that is the _point_ of the burst (single-resolution "faster cooldown" would be inexpressible on mobile, ADR-0003). |
| **C `spread`** | 3 simultaneous                               | `{−2.0, 0.0, +2.0}` | ≈ `SPREAD_COOLDOWN_MS = 300`                                                  | **30 presses** (≈90 resolutions)              | **press**  | Small "par pression" stock (shotgun MS = 30); ±2.0 u = the façade column pitch → covers a 3-window row (§2.4).                                                                                                              |

**Stock-unit note (refines pm story AC A4 for B).** pm's A4 wrote "1 unité par pression" for
`auto` under the provisional "faster-cooldown base" reading of B. The gate-mandated
per-trigger burst (**B4**) makes B's natural stock unit the **round** (else "burns fast" is
false — 120 presses × 6 = 720 rounds). C stays **per-press** (matches A4). This is a mechanics
refinement inside the A-B-C envelope pm authorised; flagged to pm/architect in the hand-off,
not a scope change.

**Balance guardrails (measured, not hoped):**

- **W6 — Telegraph fairness is weapon-independent.** The enemy telegraph → riposte timing
  (`SHOOTING`-state danger window, set by `enemySystem`) is **unchanged by which weapon the
  player holds**. Specials clear a window faster (more targets down per second) but **never**
  shrink or erase any enemy's readable danger window. AC A-W6 asserts the SHOOTING cadence is
  identical across A/B/C.
- **W7 — Bounded special uptime ≤ 30–40 % of mission time.** A **measured `verify` playtest
  AC** (A-W7): across a Belliard run, time spent under `auto`/`spread` stays ≤ 40 %. If it
  exceeds, tune stock **down** (one variable at a time). The base weapon must remain the weapon
  the player lives in — that is where Prohibition's tension lives.

---

## 8. Contract delta — design intent for `senior-architect` + `dev-gameplay`

Pure `src/game`; boundary law preserved. This is the design intent; the dev lane owns the
code and the architect owns the shape (ADR-0052).

**Enters the contract:**

- `WeaponKind = "base" | "auto" | "spread"`; `WeaponSpec` (data: cadence/burst params, start
  stock or `Infinity`, offsets); `WeaponState` (runtime: `active: WeaponKind`, `stock: number`,
  `burstRemaining: number`, burst/refractory timers). Zero functions in `types/`.
- `weaponSystem.ts` (pure): resolve a trigger under the active weapon into 1..3 resolutions
  (§2), decrement stock, auto-return + `weaponEmpty` on 0 (§6.1), equip on a LOOT hit (§5).
- LOOT discriminant on the window state machine, kept **off** the `ARCHETYPES`/score-lives path.
- `weaponEmpty` event; the LOOT spawn-exclusion rule (§5.4) as a pure spawn constraint.

**The two multi-event points flagged by pm (architect to resolve in ADR-0052):**

1. **`spread` emits up to 3 `ImpactEvent`s in one tick**, and `weaponEmpty` is a distinct
   event — `GameState.impactEvents` is today commented "0 or 1 element (one shot per tick)".
   That invariant must widen for C. **B does not need this** (one impact per burst-tick).
2. `LOOT` resolution must never touch `score`/`lives` — a hit on a crate produces neither.

Everything else (base resolution, enemy return fire, courier resolution, the QTE branches) is
inherited **unchanged**.

---

## 9. Acceptance criteria (design VERIFY, stage 5)

Numbered, verifiable; W1–W8 and pm's regression A7 included. Sacha playtests the built system
(`verify`) against these and reports PASS/deviations to `lead-game-designer` **before** the
architect's integration review.

**Model & roster**

- **AC1** — `base`/`auto`/`spread` are distinct `WeaponKind`s with their own cadence + stock;
  `base.stock === Infinity`, never decremented.
- **AC2** — Every weapon resolves as N §2.1 hitscan resolutions (A:1@0, B:1@0 per burst-round,
  C:3@{−2,0,+2}); each resolution obeys window-priority **then** courier-only-on-miss
  individually. No travelling player projectile; no range/depth axis (**B3** stays descoped).
- **AC3** — **B is a per-trigger burst (B4/W8):** one trigger fires `BURST_ROUNDS` rounds over
  successive ticks at the live crosshair; identical on desktop tap and mobile tap; **no hold
  gesture and no new binding** (ADR-0003). Further fire during a burst is ignored. Stock
  decrements 1 **per round**.
- **AC4** — **C fires 3 simultaneous resolutions at ±2.0 u** (façade column pitch), covering a
  3-window row; the three discs never overlap (no enemy double-billed); stock decrements 1 **per
  press**.

**Discrimination (B1/W5)**

- **AC5** — Every resolution landing on a courier incurs the **full** civilian penalty; a
  low-swept burst can charge it up to `BURST_ROUNDS` times, a low éventail press up to 3 times.
  **No spread amnesty** anywhere.

**QTE (B5)**

- **AC6** — During a hostage/boss QTE: shots resolve via `tickQte`/`tickBossQte` only (no
  A/B/C modulation); `weapon.active` and `weapon.stock` are **unchanged** across the freeze; no
  LOOT spawns or is resolvable during the freeze.

**Crate (B6/W1/W2)**

- **AC7-loot** — A LOOT crate follows `HIDDEN→APPEARING→VISIBLE→…` with the same timing
  conventions as targets, but a shot on it **never** produces `scoreDelta`/`livesDelta`
  (explicit regression against the `ARCHETYPES` path).
- **AC8** (**W1**) — The crate carries the weapon glyph legibly at reticle distance **before**
  the collecting shot; firing a `VISIBLE` crate equips its weapon at full stock, replacing the
  active weapon (prior special's remaining stock is lost); the equip takes effect from the next
  trigger.
- **AC9** (**W2**) — Crate spawn obeys `∀ active slot a: |loot.col − a.col| ≥ 2`
  (`APPEARING`/`VISIBLE`/`SHOOTING`); unit-tested; spawn deferred if unsatisfiable. Crate reads
  as a non-human object in its own channel (R1–R4), never confusable with a human innocent/menace.

**Auto-return & HUD (W3/W4/N2)**

- **AC10** (**W3**) — Stock→0 returns to `base` the **same tick** with exactly one
  `weaponEmpty` event driving an audible + HUD-flash cue that frame; never a silently-failed
  shot. (B: an empty mid-burst ends the burst that tick.)
- **AC11** (**W4**) — The base weapon shows ∞ with **no** counter, **no** red, **no** blink,
  ever. Only special stock blinks (last ~20 %); the counter is a resource readout, not a
  tension gauge (**N2**).

**Balance (W6/W7)**

- **AC12** (**W6**) — Enemy telegraph→riposte (`SHOOTING`) timing is **identical** across
  A/B/C; specials clear faster but never shrink/erase any enemy's danger window.
- **AC13** (**W7**) — Measured on a Belliard `verify` run: time under a special ≤ **40 %** of
  mission time. Over ⇒ tune stock down.

**Regression (pm A7)**

- **AC14** (**A7**) — **A player hit (life loss) never touches `weapon.active` or
  `weapon.stock`** — explicit regression test. No loss-on-death in V1 (pm ruling #2).

**Determinism / boundary**

- **AC15** — `src/game/` stays free of React/Three imports; weapon resolution is pure and
  deterministic; `tsc`/ESLint/Vitest green.

---

## 10. Resolution of the blocking set + open flags

| Item   | Resolution                                                                                                                                                                                                                                                             |
| ------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **B1** | §3 + AC5 — full innocent penalty **per resolution**, no spread amnesty.                                                                                                                                                                                                |
| **B2** | §2 — each weapon = N hitscan resolutions at deterministic offsets; window-priority + courier-only-on-miss stated per resolution point.                                                                                                                                 |
| **B3** | **Resolved by descope.** D (tromblon, "portée réduite") is out of V1 (pm ruling #1); the current model has no depth/range axis (§2). **Re-answer only if/when D ships as a fast-follow** — D needs a concrete facade range mechanic defined before it can be built.    |
| **B4** | §2.3 — per-trigger burst for B (no hold, identical desktop/mobile, zero new binding); citation fixed to **ADR-0003** (controller contract) throughout — the pre-spec's ADR-0015 was the device-forked tutorial script, not the controller.                             |
| **B5** | §4 + AC6 — QTEs are weapon-agnostic/base-only; special stock frozen through the freeze.                                                                                                                                                                                |
| **B6** | §5 + AC7-loot/AC8/AC9 — LOOT is a non-human silhouette in its own channel (R1), glyph-before-fire (R2/W1), shares the window channel with a re-measured <0.3 s triage (R4), measurable spawn-exclusion rule (W2); off the score/lives path; read handed to `lead-art`. |

**Open flags for the gate:**

1. **ADR-0052** records the weapon system (reserved by producer; content is the architect's).
   This spec is its design input; the `impactEvents` widening for C (§8) is the key architecture
   call.
2. **B-stock-unit refinement** (§7 note) refines pm story AC A4 for `auto` (round vs press) as a
   consequence of B4 — flagged for pm/architect visibility, within the A-B-C envelope.
3. **Tuning values (§7)** are `verify` starting points, not gated; W7 (≤40 % uptime) is the
   measured acceptance bound that governs stock sizing.

## Hand-offs (log in `docs/agent-handoffs.md`)

- → `lead-art` (Maud): crate read R1–R4 + A/B/C glyphs (silhouette, glyph legibility, glow,
  loot-vs-human triage) — spec the read, style is yours.
- → `ux-designer` (Tony): HUD layout (active glyph + special stock + ∞ base + empty flash),
  desktop **and** mobile (ADR-0003).
- → `narrative-designer` (Yasmine): weapon names (calibre/sulfateuse/éventail are placeholders,
  not lore-locked).
- → `senior-architect` (Winston): ADR-0052 + the §8 contract delta (C's multi-impact,
  LOOT-off-score-path).
