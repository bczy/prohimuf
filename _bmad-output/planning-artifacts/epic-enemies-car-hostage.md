# Epic — New enemies: drive-by car & hostage taker (Belliard-first rollout)

**Owner:** John (PM) · **Architect on-deck:** Winston · **Scope guard:** core loop `Récupérer → Livrer → Éviter` intact.

**Status:** Proposed · **Source of truth:** `_bmad-output/guidelines/enemy-bestiary.md` (sections 2, 3, 4, 5) and `_bmad-output/guidelines/PROJECT_GUIDELINES.md`.

---

## 1. Vision

Expand the shooting-gallery roster with **two new enemy archetypes** and a **per-level roster mechanism**, validated on `belliard` only. The two new archetypes are deliberate, documented extensions of *Prohibition* Atari ST:

1. **`car`** — a street-mobile drive-by entity (driver + single shooter, never both posts firing) reusing the `Courier` movement primitive.
2. **`hostage_taker`** — a precision-shot challenge with a double hitbox (kidnapper = reward, hostage = penalty), available **both as a window pop-up and as a street traversal**.

A **`LevelConfig.roster`** field gates the rollout so `stalingrad` and `vitry` stay unchanged in V1.

## 2. Why now (Cahier des charges test)

> "Did Prohibition Atari ST have this?"

- Drive-by car → **No.** Conscious extension justified by **`Éviter`** (a moving threat raises pressure without breaking the pop & shoot rhythm) and **`Livrer`** (rewards risk-taking on a tank-ier target). YAGNI-safe: built on the existing `Courier` precedent, no new "vehicle engine".
- Hostage taker → **No.** Conscious extension justified by **`Éviter`** (precision-or-penalty, the player must read the scene before pulling the trigger) and the "never bullshit deaths" rule (visible double hitbox, visible countdown, explicit feedback on each outcome).
- Per-level roster → **No** (Prohibition has a flat enemy pool), but mandated by our rollout discipline: stage on Belliard, then extend.

## 3. Global acceptance criteria

| # | Given | When | Then |
| --- | --- | --- | --- |
| E1 | A `belliard` run | Player starts the level | At least one `car` traversal and one `hostage_taker` event occur within a typical mission (≤ 5 min) and the existing 58+ Vitest suite stays green. |
| E2 | A `stalingrad` or `vitry` run | Player plays the level | Neither `car` nor `hostage_taker` ever spawn (window or street); roster behaviour is byte-identical to pre-epic baseline. |
| E3 | A `car` is on screen | Driver and shooter occupants are present | Driver never shoots, shooter never sits in the driver seat, exactly one shooter position is active per car, muzzle flash mirrors with `dir`. |
| E4 | A `hostage_taker` is on screen | Player bullet collides | A hit on the **kidnapper hitbox** scores +5 and clears the entity; a hit on the **hostage hitbox** applies the bavure penalty (score −3, energy −≈25). On `visibleDuration` timeout, the kidnapper executes the hostage (score −1, energy −≈10). |
| E5 | Any new code lands | `rtk tsc`, `rtk vitest`, `rtk lint` | All three are green; `src/game/**` holds zero React/Three imports; new sprites flow through the existing asset pipeline. |
| E6 | A new tuning value sits in `ARCHETYPES` | Reviewer audits the diff | Each value traces back to one line of `enemy-bestiary.md` (§2.4 or §3.4). |
| E7 | Per-level roster is wired | `LevelConfig.roster` is absent on a level | That level behaves exactly like today (no regression). |

## 4. Stories (build order)

| # | Story file | Title | Primary lane(s) |
| --- | --- | --- | --- |
| S1 | `story-level-roster-belliard.md` | Per-level roster scaffolding (Belliard-first) | `dev-gameplay` |
| S2 | `story-car-drive-by.md` | Drive-by car: street entity + occupants rule | `dev-gameplay` + `dev-r3f-render` + `dev-tooling-assets` |
| S3 | `story-hostage-taker.md` | Hostage taker (window + street, double hitbox, energy stat) | `dev-gameplay` + `dev-r3f-render` + `dev-tooling-assets` |

S1 lands first because S2 and S3 must be gated to `belliard` from day one — shipping either without a roster gate would regress `stalingrad`/`vitry`.

## 5. Out of scope (V1) — explicit, to kill creep

- **Killing the driver as a separate kill state** ("the car spins out"). Future work. The car has one HP pool, one death sprite. (YAGNI.)
- **Hostage taker as a *target* in the existing kill counter for window mode only.** The street version of `hostage_taker` does **not** alter `enemiesToWin` accounting in stalingrad/vitry until it ships there (E2).
- **Generic "vehicle engine"** abstraction. We model the car on the concrete `Courier` precedent (DRY without over-engineering).
- **Energy regen / energy-based death** beyond the hostage scenario. Energy is introduced for the hostage's continuous penalty; integration into other systems is out of scope.
- **Re-tuning existing archetypes** (`normal`, `riot`, `biker`, `bonus`, `civilian`) — untouched in this epic.
- **Localising new UI strings.** Per `PROJECT_GUIDELINES.md` §8, i18n is out of scope.

## 6. Definition of Done (epic-level)

- [ ] All three stories meet their per-story DoD.
- [ ] Manual browser validation on Belliard: at least one full mission with each archetype spawning, scoring, and penalising as specified.
- [ ] `stalingrad` and `vitry` run untouched (E2).
- [ ] No new `any`, no React/Three import in `src/game/**`, lint clean.
- [ ] ADR added if any boundary or contract shifts (e.g. introduction of `energy` in game state) — `docs/adr/`.
- [ ] Bestiary §1 table updated to include `car` and `hostage_taker` with cross-refs to the implementing files.

## 7. Risks & mitigations

| Risk | Mitigation |
| --- | --- |
| Energy stat balloons into a cross-cutting refactor. | `story-hostage-taker.md` owns the `energy` decision (single source of truth) and scopes it to the hostage penalty only — opt-in state slice, no regen/no death-hook in V1; ADR triggered there. |
| Car sprite mirroring miscued vs `dir` (visual lie about who is shooting). | S2 acceptance pins the mirror rule + muzzle-flash side per `dir` to bestiary §2.3. |
| Hostage hitbox too generous → players feel cheated. | Bestiary §3.5 mandates visible separation and rising-tension cue; story includes explicit "no bullshit death" check. |
| Roster regression on stalingrad/vitry. | E2 + S1 acceptance: default (no `roster` field) == today's behaviour byte-for-byte. |
