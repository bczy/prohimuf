# Tutorial script — visual & gesture pass (expanded copy)

**Author:** Yasmine (`narrative-designer`) · **Date:** 2026-07-14 ·
**Story:** `_bmad-output/planning-artifacts/story-tutorial-visual-gestures.md` ·
**Extends:** ADR-0012 (optional tutorial), ADR-0015 (device fork, shared-by-reference) ·
**Gate:** `lead-game-designer` (Karim) PASS required before `dev-gameplay` transcribes ·
**Target file:** `src/game/systems/narrativeSystem.ts` — constants
`TUTORIAL_OPENING_LINES` / `DESKTOP_CONTROL_LINES` / `MOBILE_CONTROL_LINES` /
`TUTORIAL_FIELD_LINES`.

This is the **words spec**. `dev-gameplay` transcribes the `text`/`image`/`imageAlt`
verbatim; `game-designer` owns the gesture-icon slot names + final panel structure;
final sprite pick is a design/lead call (see `[FLAG]` notes). I write zero production code.

## Voice pins (do not drift)

Terse, imperative, diegetic — DISPATCH/KENZA briefing Muf over the wire, not a narrator.
KENZA carries the tactical/field beats (controls + bestiary); DISPATCH bookends (loop,
HUD, "bouge"). Same zine as the shipped scenes. French, ~2 sentences max per panel so it
fits one typewriter panel and stays skippable.

## ADR-0015 device-accurate copy pins (must stay green)

- **Mobile scene** mentions `deux doigts`; NEVER `clic` / `souris`.
- **Desktop scene** mentions `souris` and `clic`; NEVER `doigt` / `balay`.
- Shared opening + field panels contain **none** of those tokens (verified below), so the
  fork stays control-panels-only and the regex pins hold on both variants.

## Fork invariant (ADR-0015 D1 / AC9)

Opening + field segments are **shared by reference**; only the 2 control panels fork.
Both variants land at the **same panel count** (see count table). New bestiary panels go
in the **shared field segment** — never in a fork.

---

## Segment 1 — `TUTORIAL_OPENING_LINES` (shared, 2 panels)

| # | Speaker | Text | Visual |
|---|---------|------|--------|
| O1 | DISPATCH | `Écoute bien, Muf. La règle tient en trois mots : Récupérer, Livrer, Éviter.` | text-only |
| O2 | DISPATCH | `Le colis arrive par le véhicule. Couvre-le pendant la livraison, puis laisse-le repartir intact.` | `assets/vehicles/truck.png` — alt: `Le camion de livraison` |

O1 unchanged from shipped. O2 lightly tightened from shipped to name the "couvrir
pendant la livraison" beat the story calls for (the delivery-window rule itself is
recalled in the HUD panel H1).

---

## Segment 2 — `DESKTOP_CONTROL_LINES` (forked, 2 panels)

| # | Speaker | Text | Gesture icon slot | Visual |
|---|---------|------|-------------------|--------|
| DC1 | KENZA | `Pour tirer : le viseur suit ta souris. Clic gauche, un coup part — une seule action, rien de plus.` | `mouse-click` | gesture icon (souris + clic gauche) |
| DC2 | KENZA | `La rue déborde de l'écran. Pousse le curseur au bord — la vue suit, dans les deux sens.` | `edge-scroll` | gesture icon (curseur poussé au bord) |

DC1/DC2 = shipped copy, kept. Gesture-icon slot is the story's proposed
`NarrativeLine.gesture` field. **NO drag** anywhere (edge-scroll only, ADR-0015). Copy
carries `souris` + `clic`, never `doigt`/`balay`.

---

## Segment 3 — `MOBILE_CONTROL_LINES` (forked, 2 panels)

| # | Speaker | Text | Gesture icon slot | Visual |
|---|---------|------|-------------------|--------|
| MC1 | KENZA | `Pour tirer : tape à DEUX doigts en même temps, bref et net. La balle part pile entre tes doigts.` | `two-finger-tap` | gesture icon (deux doigts, UN tap) |
| MC2 | KENZA | `La rue déborde de l'écran. Un doigt pour balayer — haut, bas, gauche, droite. Une pichenette, et ça glisse tout seul.` | `swipe-pan` | gesture icon (un doigt, balayage 4 sens) |

MC1 adds **`en même temps`** to the shipped line — this is the load-bearing correction:
the real gesture is a **single simultaneous two-finger tap**, NOT a double-tap (PM ruling
1, ADR-0015 D1). The icon MUST read as one tap with two fingers. MC2 = shipped copy
(balayage + pichenette inertie). Copy carries `deux doigts`, never `clic`/`souris`.

---

## Segment 4 — `TUTORIAL_FIELD_LINES` (shared, 7 panels)

Bestiary expanded to the full shipped Belliard pool (AC5). One line = one rule, TRUE to
`ARCHETYPES` in `src/game/types/enemyTypes.ts`. KENZA reads the enemies; DISPATCH closes.

| # | Speaker | Text | Visual | Archetype truth |
|---|---------|------|--------|-----------------|
| F1 | KENZA | `Le flic à la fenêtre, c'est ta cible. Une balle suffit — mais il dégaine avant toi si tu traînes.` | `assets/enemy_shooting.png` — alt: `Un flic qui dégaine à la fenêtre` | normal · hp 1 · shoots · +1 · target |
| F2 | KENZA | `Le CRS en tenue anti-émeute encaisse DEUX balles. Un seul tir le fait pas tomber — insiste.` | `assets/enemy_riot_shooting.png` — alt: `Un CRS anti-émeute qui dégaine` | riot · hp 2 · shoots · +2 · target |
| F3 | KENZA | `Le motard surgit vite et repart vite. Il reste jamais longtemps — vise dès qu'il paraît.` | `assets/enemy_biker_shooting.png` — alt: `Un motard qui dégaine à la fenêtre` | biker · hp 1 · shoots · fast (2.0s) · +1 · target |
| F4 | KENZA | `Celui-là ne tire jamais. Descends-le pour +5 secondes au chrono — mais il compte pas dans ton quota d'éliminations.` | `assets/enemy_bonus.png` — alt: `Une cible bonus qui donne du temps` | bonus · never shoots · +5s · +1 · NOT a target |
| F5 | KENZA | `Le livreur civil dans la rue, tu le touches JAMAIS. Un tir sur lui : une vie et un point en moins.` | `assets/enemy_civilian.png` — alt: `Le livreur civil dans la rue` | civilian · never shoots · -1 vie · -1 point |
| H1 | DISPATCH | `En haut : le chrono, tes vies, ton score, le compteur d'éliminations à atteindre, et la fenêtre de livraison.` | text-only | HUD |
| F6 | DISPATCH | `Compris ? Alors bouge. Rue Belliard t'attend.` | text-only | outro |

### Bestiary copy notes (TRUE-to-numbers audit)

- **F1 normal** — kept shipped copy, added `Une balle suffit` (hp 1). Still shows the
  dégaine pose (threat framing).
- **F2 riot** — teaches the ONE must-know trait: **2 HP / two shots** (story open Q3). I
  do not surface the +2 score in copy — over-explains for an arcade panel; the number
  rewards discovery.
- **F3 biker** — teaches **speed** only (visibleDuration 2.0 vs normal 3.2). "surgit
  vite et repart vite" = the read; no HP mention (it's 1, same as normal).
- **F4 bonus** — this is the corrected truth Bertrand flagged: shooting the bonus is
  **not** "temps perdu", it **grants +5 s and +1 point** (`timeDelta 5`, `scoreDelta 1`),
  it simply does **not advance the elimination quota** (`countsAsTarget false`). Copy says
  exactly that: shoot it for time, it won't tick your quota. It is a reward pop-up, not a
  trap and not a mandatory kill.
- **F5 civilian/courier** — the only NEVER-SHOOT. Copy now states the real penalty
  (`livesDelta -1`, `scoreDelta -1`) instead of the vaguer shipped "c'est fini pour nous",
  so the stakes are legible.

---

## Production annotations & `[FLAG]`s for the lead gate

1. **`[FLAG]` shooter-pose sprite rule.** F1/F2/F3 all use the `_shooting` variant
   (`enemy_shooting`, `enemy_riot_shooting`, `enemy_biker_shooting`) so every armed enemy
   is shown *dégainant* (consistent threat read); bonus/civilian shown neutral. If
   `game-designer` prefers idle silhouettes for the armored/fast reads, the idle sprites
   also ship (`enemy_riot.png`, `enemy_biker.png`, `enemy_sprite.png`) — either is on disk,
   design's call. My copy works with either pose.
2. **`[FLAG]` courier sprite mismatch.** F5 shows `enemy_civilian.png`, matching the
   shipped tutorial. But the *live* courier rides the street as `courier/rider.png`
   (`enemyTypes.ts` note + `courierSystem`). The player will meet the rider, not the
   window-civilian sprite. Consider `assets/courier/rider.png` for on-sight accuracy;
   `enemy_civilian.png` is the canonical "civilian" sprite and carries the shoot-penalty.
   Design/lead pick.
3. **Gesture-icon slots** (`mouse-click` / `edge-scroll` / `two-finger-tap` / `swipe-pan`)
   are the story's proposed `NarrativeLine.gesture` field — architect owns the field
   shape, `game-designer` owns icon fidelity (animated vs static). I only pin which slot
   sits on which panel and that the mobile-shoot icon is **one tap, two fingers** (never a
   double-tap, never one finger).
4. **Accessibility (AC10).** Every illustrated panel carries a French `imageAlt` above;
   each gesture icon needs an equivalent accessible label (game-designer/dev to author the
   icon `aria`), degrading to the text panel if the icon fails.
5. **No new art.** Every `image` path above already ships in `public/assets/`. Gesture
   icons are code-drawn (story ruling 5). Nothing here commissions a sprite.

## Panel count per variant

| Variant | Opening | Control (fork) | Field | **Total** |
|---------|:---:|:---:|:---:|:---:|
| Desktop | 2 | 2 | 7 | **11** |
| Mobile  | 2 | 2 | 7 | **11** |

Parity holds (11 = 11). Shared segments (opening 2 + field 7 = 9 panels) are
reference-identical across variants; only the 2 control panels differ — fork invariant
intact (ADR-0015 D1 / AC9). Was 8; +3 comes from the 3 new bestiary panels (riot, biker,
bonus).
