# 0002 — Cargo delivery in core game state

- **Status:** Accepted
- **Date:** 2026-07-02

## Context

The core loop `Récupérer → Livrer → Éviter` needs a first, playable slice: a
single cargo the player collects at one point and drops at another. This touches
the **game ↔ render** contract — the render lane must show the cargo and its
status without owning any of the pickup/delivery rules.

The crosshair-to-world conversion already lived inline in `fireBullet`
(`src/game/systems/bulletSystem.ts`). Delivery proximity must match exactly where
shots land, so both need the same formula from a single place.

## Decision

- Add `GameState.cargo` as a **required** field
  (`src/game/types/cargo.ts`: `Cargo` = `status` + `pickup` + `depot`). Pickup and
  delivery rules live in a pure `tickDelivery` system
  (`src/game/systems/deliverySystem.ts`), unit-tested, folded into `tickGameState`.
- MVP positions are **hard-coded** as `BELLIARD_CARGO_PICKUP` / `BELLIARD_CARGO_DEPOT`
  in `stateMachine.ts`. Data-driven per-level placement is **deferred** to a
  follow-up story.
- Extract `crosshairToWorld` in `bulletSystem.ts` as the **single source of truth
  for aiming**, shared by `fireBullet` and `deliverySystem`. Pure refactor —
  identical formula, no behaviour change.
- A **victory condition on delivery** is explicitly **out of scope** here and
  pushed to a follow-up story; this slice only tracks the cargo through its legs
  and awards a score bonus on drop-off.
- Render (`CargoMarkers.tsx`, `HUD.tsx`) **reads** `cargo` only — it holds no
  delivery rules.

## Consequences

- Boundary law preserved: pickup/delivery logic stays in `src/game/**` (pure,
  zero React/Three); the render lane only reads `cargo` and displays status.
- `crosshairToWorld` guarantees aiming and delivery proximity can never drift
  apart, since a change to the conversion updates both call sites at once.
- Hard-coded positions are a known, documented shortcut; the follow-up story that
  makes placement data-driven should update or supersede this ADR if the state
  shape changes.
- `GameState.cargo` being required means every state constructor must seed it;
  the render's defensive read is belt-and-braces against merge-order gaps only.
