# Spec — Tutorial immersion: gameplay-teaching panel map (no new mechanics)

**Author:** Sacha (`game-designer`)  
**Date:** 2026-07-25  
**Status:** PROPOSED (needs `lead-game-designer` PASS)  
**Extends lineage:** ADR-0012 (optional tutorial), ADR-0015 (device fork on controls only), ADR-0020 (gesture icons), ADR-0055/0056 (weapon crate loop), ADR-0059 (boss timed finale), `spec-shot-flat-impact.md` (projectile read).

---

## 0) Guardrails and CdC verdict

- **No new mechanic.** Tutorial only teaches already-shipped behavior.
- **Core loop untouched:** `Récupérer → Livrer → Éviter`.
- **Device fork invariant kept:** desktop/mobile divergence exists **only** on control panels.
- Tutorial remains optional, skippable, informative-only.

_CdC test:_ tutorial itself is an existing conscious extension (ADR-0012); this update only improves teaching accuracy for current live gameplay.

---

## 1) In scope / out of scope

### In scope
1. Re-map tutorial panel sequence to teach:
   - live weapon/crate loop,
   - real threat hierarchy,
   - boss finale expectation,
   - player-shot vs enemy-bullet perception.
2. Define panel-level **intent tokens** expected in game data channels (gesture/diagram/illustration semantics), without defining TS shapes.
3. Keep desktop/mobile fork only where control instructions differ.

### Out of scope
1. Any production code (`src/**`) change.
2. Any new enemy/weapon/control/boss rule.
3. Any ADR rewrite in this task.
4. Art style decisions (owned by `lead-art`) beyond readability contracts.

---

## 2) Panel-level intent tokens (data contract, no TS typing)

### 2.1 Gesture channel tokens (fork-only control panels)
- `mouse-click`
- `edge-scroll`
- `two-finger-tap`
- `swipe-pan`

### 2.2 Diagram channel tokens (shared gameplay-teaching panels)
- `shot-read-player-vs-enemy-bullet`
- `weapon-crate-loop`
- `threat-hierarchy-ladder`
- `hostage-ring`
- `boss-finale-switch`

### 2.3 Illustration-channel semantics
- Enemy panels use shipped enemy/courier visuals for per-archetype truth.
- Delivery/boss expectation panels use shipped level-appropriate visuals where available; otherwise text + diagram.

---

## 3) Final accepted panel map (both variants)

## Total panels per variant: **16**
- Desktop: 16
- Mobile: 16
- Shared-by-reference indices: **[0,1,4,5,6,7,8,9,10,11,12,13,14,15]**
- Forked indices only: **[2,3]**

| #  | Segment | Desktop token/content | Mobile token/content | Teaching beat (verifiable) |
|----|---------|-----------------------|----------------------|-----------------------------|
| 0 | Opening (shared) | text | text | Core loop: récupérer/livrer/éviter |
| 1 | Opening (shared) | illustration: delivery vehicle | illustration: delivery vehicle | Live delivery protection beat |
| 2 | Controls (fork) | `gesture: mouse-click` | `gesture: two-finger-tap` | Shoot input per device |
| 3 | Controls (fork) | `gesture: edge-scroll` | `gesture: swipe-pan` | Camera pan input per device |
| 4 | Field (shared) | `diagram: shot-read-player-vs-enemy-bullet` | same | Player shot is instant impact; enemy bullets are travelling threats |
| 5 | Field (shared) | `diagram: weapon-crate-loop` | same | Shoot LOOT crate → equip special (`auto`/`spread`) → finite stock → auto return `base` (∞) |
| 6 | Bestiary (shared) | normal cop illustration | same | Target; armed; baseline threat |
| 7 | Bestiary (shared) | riot cop illustration | same | 2 HP; highest direct bullet damage threat |
| 8 | Bestiary (shared) | biker illustration | same | Fast exposure; medium bullet threat |
| 9 | Bestiary (shared) | bonus illustration | same | Non-shooter; +time; not target quota |
| 10 | Bestiary (shared) | courier illustration | same | NEVER shoot; life/score penalty |
| 11 | Field (shared) | `diagram: threat-hierarchy-ladder` | same | Priority cue: Riot (1.0) > Biker (0.5) > Normal (0.25) > Bonus/Courier (0) |
| 12 | Field (shared) | `diagram: hostage-ring` | same | Existing hostage QTE color-read cue |
| 13 | Field (shared) | `diagram: boss-finale-switch` | same | On boss-gated levels: timer expiry switches from timeout to boss finale; quota no longer ends level |
| 14 | HUD (shared) | text (+ optional HUD-safe iconography) | same | Score/level/wave/time/lives + delivery window + weapon state readability |
| 15 | Outro (shared) | text | text | Go signal / end tutorial |

---

## 4) Acceptance criteria (design verification)

1. **AC-IMM-01:** No panel introduces a mechanic not already in current shipped gameplay.
2. **AC-IMM-02:** Only panels 2–3 differ between desktop and mobile variants.
3. **AC-IMM-03:** Weapon/crate panel explicitly teaches `LOOT -> special -> stock depletion -> base`.
4. **AC-IMM-04:** Threat hierarchy panel uses real archetype danger order (`bulletDamage` truth).
5. **AC-IMM-05:** Boss finale panel teaches real end-of-level switch logic on boss levels.
6. **AC-IMM-06:** Projectile clarity panel distinguishes instant player hit vs travelling enemy bullet.
7. **AC-IMM-07:** Panel token set is explicit and panel-mapped (this spec §2/§3), with no TS type prescription.

---

## 5) Hand-off targets

- `narrative-designer`: rewrite per-panel copy to this map (no rules drift).
- `lead-art`: diagram readability checks only (not style lock here).
- `senior-architect`: encode token channels in data model if needed; keep ADR-0015 fork invariant.
- `dev-gameplay` / `dev-r3f-render`: implementation only after `lead-game-designer` gate PASS.

