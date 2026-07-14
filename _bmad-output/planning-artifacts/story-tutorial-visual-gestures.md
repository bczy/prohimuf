# Story: Make the tutorial visual — gesture icons + fuller enemy roster

**Type:** Onboarding clarity (informative-only, no gameplay rule added) ·
**Status:** ready-for-arch (awaits lane assignment + ADR amendment from `senior-architect`,
design-loop validation of the icon approach) ·
**Date:** 2026-07-14 · **PM:** John ·
**Extends:** ADR-0012 (optional scripted tutorial), ADR-0015 (device-forked script) ·
**Requires an ADR amendment:** ADR-0015 **D3** ("control panels stay text-only, no
control-scheme sprite ships") is **reopened** by this story — see §ADR impact.
**Source:** Bertrand product feedback, 2026-07-14 (verbatim in §Why).

## Why (product value)

Bertrand's feedback on the tutorial stage (verbatim):

> Le tutorial n'est pas du tout assez visuel. Je m'explique :
> - on voit parfois un ennemi mais ce n'est vraiment pas assez.
> - il faudrait par exemple afficher une souris pour illustrer le click nécessaire pour tirer
> - il faudrait des doigts pour illustrer le drag and move du mobile et encore un autre type
>   de cet icone avec deux doigts pour illustrer le double tap
> - je suis sûr que les tutoriaux pourraient être encore plus détaillés

The tutorial exists **because controls — especially mobile gestures — are not discoverable**
(ADR-0012 Context). Today the two control panels are **pure prose** (ADR-0015 D3): a player
reads "clic gauche" / "deux doigts" / "un doigt pour balayer" with **no picture of the
gesture**. That is the weakest possible teaching for a motor skill. Of eight panels only
three carry an illustration (truck, a shooting cop, the civilian courier), so the field
also under-shows the bestiary the player must instantly read on sight. This story makes the
control panels **show the gesture** and the field panels **show the enemies that actually
ship**, without adding any rule, verb, or interactivity.

## Cahier des charges test — verdict: CONSCIOUS DOCUMENTED EXTENSION (already established)

- *Did Prohibition (Atari ST, 1987) have a tutorial?* **No** — it shipped a printed manual.
  The tutorial stage is already the documented conscious extension of ADR-0012. This story
  **stays inside** that envelope: the stage remains **optional, skippable at any moment,
  informative-only** (zero gameplay rule added or changed), same fanzine briefing voice.
- Net new scope surface: **presentation only.** No new mechanic is taught that is not
  already live in a launchable level (see §Scope decisions). It does not expand the game;
  it illustrates what the game already is.

## Scope decisions (PM rulings — fixed here)

1. **Teach the REAL mobile shoot gesture, not "double tap".** Bertrand wrote "double tap";
   the shipped mobile shoot is a **single two-finger tap** at the midpoint (ADR-0015 D1,
   ADR-0003). The icon and its copy MUST show **two fingers, one tap** — never a double-tap.
   Correcting the feedback to the true mechanic is in scope; teaching a gesture that does
   not exist is not.
2. **Four gestures get an icon**, mapped one-per-control-panel:
   - desktop shoot → **mouse + left-click** (matches "Clic gauche, un coup part").
   - desktop pan → **edge-scroll** (cursor pushed to screen edge — there is NO drag-pan on
     desktop, ADR-0015 Context; the icon must show edge-push, not a drag).
   - mobile shoot → **two-finger single tap**.
   - mobile pan → **one-finger swipe** in the four directions (matches "un doigt pour
     balayer").
3. **Enemy illustration expands to the shipped Belliard pool only.** The default window pool
   playable today weights normal(52) / riot(15, hp 2) / biker(15, fast) / bonus(11, never
   shoots, +5s, not a target), plus the street courier civilian. All ship in `public/assets/`
   AND are live in a launchable level, so all are teachable IN SCOPE per PROJECT_GUIDELINES
   and ADR-0012 D4 ("cover only what a launchable level runs"). Sprites confirmed on disk:
   `enemy_sprite*` (normal), `enemy_shooting*`, `enemy_riot*(+_shooting)`, `enemy_biker*(+_shooting)`,
   `enemy_bonus`, `enemy_civilian`.
4. **Drive-by car and hostage taker stay OUT.** They are roster-gated to future stories
   S2/S3 and do not ship in any launchable level; illustrating them now repeats the exact
   YAGNI/scope-guard trap ADR-0012 D4 already ruled against. No new sprite is commissioned.
5. **No FLUX / no CI render-farm / no lead-art asset gate.** Gesture icons are drawn **in
   code** (SVG/CSS in the render layer) — proposed direction, to be validated by design/archi
   (§Open questions), NOT decided by PM. This keeps the story off the art-generation pipeline
   entirely; enemy panels reuse sprites already on disk.

## Proposed direction (to be validated by the design loop + architect — NOT a PM decision)

A new **optional, pure-data** field on `NarrativeLine` (e.g. `gesture?: "mouse-click" |
"edge-scroll" | "swipe-pan" | "two-finger-tap"`) — an enum of intent, zero React/Three, sits
beside the existing `image?`/`imageAlt?` (ADR-0012 D5). The render layer
(`NarrativeScreen.tsx`) draws the matching **animated gesture icon** (SVG/CSS) above the
dialogue box, the same slot `image` uses today. The game layer never renders; the boundary
law holds (game = data, render = pixels). Whether the icons animate, how, and the exact field
shape are **design/architect calls**, flagged in §Open questions — this story states the
*intent and acceptance*, not the implementation.

## ADR impact (must be resolved before merge)

- **ADR-0015 D3 is amended.** D3 currently states control panels stay **text-only** and "no
  control-scheme sprite ships (consistent with ADR-0012 D5)". This story deliberately reopens
  that: control panels gain an **in-code gesture icon** (not a generated sprite). A new ADR
  (or an amendment to 0015) must record: the icons are code-drawn (no FLUX, no asset gate,
  so ADR-0012 D5's "no generation" guarantee is preserved), the new `NarrativeLine.gesture`
  field, and the render-side icon mapping. `senior-architect` owns whether this is a new ADR
  or a D3 amendment.
- **Panel-count / progress-dot parity (ADR-0015 D1).** Both variants ship 8 panels today.
  Added enemy panels must live in the **shared field segment** so desktop and mobile stay at
  equal panel counts (fork stays control-panels-only). If icons are added to existing control
  panels rather than new panels, count is unchanged — preferred. The `tutorialInvariants`
  reference-equality test (shared segments identical) must stay green.

## What — Acceptance Criteria

- **AC1 — desktop shoot icon.** The desktop shoot control panel shows a mouse-with-left-click
  gesture icon; copy still reads the click-to-shoot instruction. Desktop copy still never
  mentions `doigt`/`balay` (ADR-0015 device-accurate-copy test stays green).
- **AC2 — desktop pan icon.** The desktop pan panel shows an **edge-scroll** gesture icon
  (cursor pushed to screen edge), NOT a drag — consistent with the real desktop pan.
- **AC3 — mobile shoot icon = two-finger single tap.** The mobile shoot panel shows a
  **two-finger, single-tap** icon. It is NOT a double-tap and NOT a one-finger tap. Mobile
  copy still mentions `deux doigts` and never `clic`/`souris`.
- **AC4 — mobile pan icon.** The mobile pan panel shows a **one-finger swipe** icon
  (directional). Distinct from the two-finger shoot icon at a glance.
- **AC5 — fuller bestiary.** The field panels illustrate the shipped Belliard pool — at
  minimum normal cop, riot, biker, bonus, and the courier civilian — each with a shipped
  sprite from `public/assets/` and correct French `imageAlt`. Copy states each enemy's rule
  in one line (targets vs the never-shoot courier; the bonus is +time, not a target).
- **AC6 — in-scope enemies only.** No panel illustrates or references the drive-by car or
  hostage taker (not shipped). No new sprite file is added; no FLUX/CI generation runs.
- **AC7 — boundary law + purity.** Any new field is **pure data in `src/game`** (no
  React/Three import); all icon drawing lives in `src/render`. `narrativeSystem.ts` stays
  import-free. Icon selection uses the existing render-lane device fork (ADR-0015 D2); the
  game layer never sees the device.
- **AC8 — still optional/skippable/informative.** The stage still gates nothing, is skippable
  at any panel ("Passer"), writes nothing to progress/scores, adds no verb, input, or rule.
- **AC9 — variant parity.** Both `TUTORIAL_NARRATIVE_DESKTOP` and `_MOBILE` variants keep
  equal panel/progress-dot counts; shared segments stay reference-equal
  (`tutorialInvariants.test.ts` green on both variants); new enemy panels are in the shared
  field segment.
- **AC10 — graceful + accessible.** Every gesture icon carries an accessible label
  (equivalent to `imageAlt`); a missing/unsupported icon degrades to the existing text panel
  (never a broken-image state — mirrors NarrativeScreen's `onError` fallback).
- **AC11 — ADR recorded.** The ADR-0015 D3 amendment (or a new ADR) lands in the same PR,
  stating icons are code-drawn (no generation, D5 guarantee preserved) and documenting the
  new field.
- **AC12 — verified before done.** `rtk tsc` + `rtk vitest` + `rtk lint` clean; the tutorial
  captured in-browser on BOTH the desktop and mobile preview contexts
  (`?preview=tutorial`, ADR-0015 harness) showing the four icons + the fuller bestiary.

## Out of scope (explicit)

- Any **interactive** tutorial step ("now shoot this") — locked out by ADR-0012 D6.
- **Drive-by car / hostage taker** panels (deferred with their roster, stories S2/S3).
- **New generated art** of any kind (FLUX, CI render-farm, HUD image) — icons are code-drawn.
- Tutorial-driven unlocks, "seen ✓" persistence, per-panel audio, analytics (ADR-0012 D6).
- Reworking the pre/post-level narrative scenes or the `image?` rendering already shipped.
- Changing the core loop, controls, victory condition, or any gameplay rule.

## Open questions for the design loop (`game-designer` + `narrative-designer` → `lead-game-designer` gate)

1. **Icon fidelity:** animated (loop showing the motion — swipe travel, tap pulse) vs static
   diagram? Bertrand's ask implies motion; confirm the fanzine-consistent treatment.
2. **New panels vs enriched panels:** add the four gestures onto the existing two control
   panels (keeps 8-panel parity) OR split into more panels ("encore plus détaillés")? A
   longer tutorial trades against ADR-0012's <10s-to-gameplay ethos (the stage is optional,
   but length still matters). Design-gate call.
3. **Bestiary depth:** one line per enemy (normal/riot/biker/bonus/courier) — is riot's
   "2 HP / two shots" and biker's "fast" worth teaching, or does that over-explain for an
   arcade onboarding? Narrative to pin the terse copy; game-designer to confirm which traits
   are must-teach.
4. **Field shape (architect):** discrete `gesture` enum vs a more general `icon` field —
   `senior-architect` owns this and the ADR form.

---

*Architect (`senior-architect`) owns: lane partition (`src/game` data field ∥ `src/render`
icon component), the ADR-0015 D3 amendment/new ADR, and the boundary-clean icon approach.
Design loop owns icon fidelity + copy + bestiary depth (Open questions). Devs implement only
assigned, scoped lanes. PM writes no production code.*
