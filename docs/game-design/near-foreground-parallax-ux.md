# Near-foreground differential parallax — UX & accessibility constraints

**Feature:** near-foreground layer scrolling faster than the facade on pan (proximity depth cue)
**Author:** `ux-designer` (Tony) · **Gate:** `lead-game-designer` (Karim) — PASS required before architect
**Story:** `_bmad-output/planning-artifacts/story-near-foreground-parallax.md` (PM-validated, John)
**Anchors:** `PROJECT_GUIDELINES.md` §5 (règles UX non-négociables) · ADR-0003 (mobile pan/zoom) ·
existing reduced-motion pattern (`CrtPass.tsx`, `GestureIcon.tsx`, print `tokens.ts` `MOTION`)
**Date:** 2026-07-17 · **Status:** DRAFT — awaiting design gate · **Phase:** PROPOSITION (no code)

> **Convention note.** UX specs live flat under `docs/game-design/` (siblings:
> `pregame-landscape-ux.md`, `spec-shot-flat-impact.md`). No `ux/` subdir exists; I follow the
> repo convention rather than split the UX specs into a lone folder.

> **Lane.** This spec fixes whether the layer **works** — reduced-motion behaviour, non-occlusion,
> safe zones, mobile density, and their verification. It does **not** set the parallax factor
> magnitude / sign convention (architect + `game-designer`), the art asset (`lead-art`), or the
> `levelArt.json` field shape (architect). Where a number is a _ceiling_ (an ergonomic limit), it
> is mine; where it is a _tuned value_ inside that ceiling, it is theirs. Seams are flagged inline.

---

## 1. Reduced-motion — the rule (AC3)

A layer moving **faster than the entire world** is the textbook trigger WCAG 2.3.3 (Animation from
Interactions) flags: interaction-driven parallax with a faster-than-content register. It MUST honour
reduced-motion.

**D1 — Branch on the existing signal.** There is **no in-app reduced-motion toggle** in this project
(Prefs holds only sound/music/lives/difficulty; the CRT toggle is a _separate_ persisted boolean and
is not a motion pref). The established, repo-wide mechanism is the OS media query
`prefers-reduced-motion: reduce`, already consumed live (with a `matchMedia` change listener) by
`CrtPass.tsx` (lines 68–87), `GestureIcon`, `LoadingScreen`, `RotateOverlay`, and the print `MOTION`
tokens. **Branch this layer on the same signal, read live** (re-evaluate on media-query change, do
not snapshot once at load). This satisfies "discoverable + persisted": the OS setting persists across
sessions and is discoverable in OS accessibility settings — the same contract every other muf motion
already honours. _(Story open-Q #4 leaves the mechanism to the architect; this is my UX recommendation
— OS query, consistent with the whole codebase. If an in-app motion pref is ever added, it must OR
with the media query, never replace it.)_

**D2 — Behaviour = clamp to facade rate, keep the layer visible.** When reduced-motion is requested,
clamp the near-foreground's **effective on-screen speed to ≤ 1× (equal to the facade)** — i.e. remove
the _differential_, so the layer tracks the facade plane and never sweeps faster than the world. It
still translates with the base pan (that motion is essential and player-driven — reduced-motion does
not forbid the world pan the player is actively steering; it forbids the _added_ faster-than-world
sweep).

- **Prefer clamp-to-facade over hiding the layer.** Hiding removes the fanzine street decor and
  changes the frame composition between the two modes (a reduced-motion user sees a _different_
  scene). Clamping keeps the art and the identical composition; only the vestibular trigger is
  removed. Hiding is acceptable as a fallback but is the inferior read.
- Equivalent to the story's "disabled or clamped to ≤ facade rate" — this spec picks **clamped**.

**D3 — Verification (must be a check, not a claim).** In e2e, drive
`page.emulateMedia({ reducedMotion: 'reduce' })`, pan the camera between two x samples, and assert the
near-foreground's on-screen displacement ÷ facade displacement is **≤ 1.0** (within tolerance); in the
default state the same ratio is **> 1** (AC1). Screenshot both states at the same two camera positions.
The clamp is a pure function of `(factor, reducedMotion)` → unit-test it TDD-first exactly like
`deriveCrtParams(tier, reducedMotion)` (`crtParams.test.ts`).

---

## 2. Non-occlusion & legibility-as-function (AC2, HARD/blocking)

The core loop is _shoot cops at windows_. The window zones are the entire task surface; anything that
covers them is a functional failure, not a taste note.

**D4 — Zero overlap of any window opening, at any camera position, at any opacity.** Opacity is **not**
an escape hatch: a semi-transparent silhouette over a cop still degrades target acquisition and
glance-legibility. The rule is spatial, not alpha-based — **no near-foreground element may overlap a
window opening, period.** (Opaque inside its safe band is fine; the band itself must be clear of the
aiming reserve.)

**D5 — The layer is transparent to hit-testing.** Belt-and-suspenders on top of D4: the near-foreground
mesh must never intercept a shot ray or a mobile tap-target — the crosshair→world hit mapping stays
byte-unchanged (AC2). Even a one-frame visual clip during a fast sweep must never eat a shot. _(Hit
contract is `game-designer`/dev territory; I state it as a hard UX requirement.)_

**D6 — Differential ⇒ horizontal band only, never vertical columns.** Because the layer sweeps _faster
than the world_ (factor > 1), any element rakes horizontally across the screen as the camera pans. A
**horizontal band pinned above or below the window rows** stays out of the aiming reserve for its whole
sweep (its vertical extent is fixed). A **vertical edge column** (lamppost, drainpipe) would rake
_across the cops_ as it sweeps — forbidden for a differential layer. This rules out the story's
"edge-columns" option for Vitry (see D9).

---

## 3. Safe zones

Two coordinate frames — the geometric contract (facade space, for the data/art) and the player-facing
contract (screen space, what the eye sees).

**D7 — Geometric safe band (facade space, y-down, 0..1 — matches `levelArt` zones).**
The near-foreground band's **top edge ≥ (lowest window-zone bottom + 0.06)** — a 6%-of-facade-height
clearance below the lowest shootable window, camera-invariant. Band lives **below** that line (street
strip) or, where a level's top row leaves room, **above** the top window row by the same 0.06 margin.

| Level         | Lowest window bottom | Band top edge (min) | Verdict                  |
| ------------- | -------------------- | ------------------- | ------------------------ |
| Belliard      | ~0.48–0.52           | ≥ 0.58              | ample bottom strip — OK  |
| Stalingrad    | ~0.48–0.52           | ≥ 0.58              | ample bottom strip — OK  |
| Vitry (4-row) | **0.82**             | ≥ 0.88              | ~0.12 strip — see **D9** |

**D8 — Player-facing safe zone (screen space).** Opaque near-foreground may occupy only the band
**below the lowest on-screen cop**, with a **minimum clearance ≥ 8% of viewport height** between the
top of the foreground band and the bottom of the lowest shootable window, at every camera position.
The **central aiming reserve** (the vertical band any window row can occupy on screen) is **forbidden**
to opaque near-foreground. The layer never overlaps HUD elements (energy / timer / score / directional
cue) — HUD has priority; foreground is decor.

- **Desktop density ceiling:** ≤ 1 distinct silhouette cluster per viewport-width; band height
  ≤ ~18% of facade height. Rationale: a fast-sweeping high-frequency strip generates strong optical
  flow that distracts from target tracking even when it never occludes — keep it sparse.

---

## 4. Desktop vs mobile

Mobile landscape is a different device: `MOBILE_ZOOM_FACTOR = 1.7` crops to a smaller, window-centred
slice (each element subtends ~1.7×), the pan is a **swipe** (faster, larger retinal motion than
edge-scroll), and the **thumb + HUD own the bottom of the screen** (ADR-0003).

**D9 — Mobile constraints:**

1. **Density halved.** ≤ 1 silhouette cluster per ~2 viewport-widths (half the desktop ceiling).
   Bigger elements + faster swipe + hand-held screen close to the eye = more nausea per element; thin
   the field out.
2. **Prefer the TOP band on mobile.** The bottom band is the thumb + HUD zone; a busy strip sweeping
   fast directly under the steering thumb competes with both the control and the HUD read. Where a
   level's top-row geometry allows a top band (D7), use it on mobile. _(Feasibility per level = seam
   with `game-designer`/`lead-art`.)_
3. **If bottom band on mobile:** it must sit **below** the HUD/thumb reachable zone and never overlap a
   HUD element; if it cannot, drop it on mobile via the per-level `levelArt.json` opt-out (AC4).
4. **Lower parallax ceiling on mobile.** The comfortable _differential magnitude_ on mobile is lower
   than desktop (zoom 1.7 + swipe amplify retinal speed). I set the **ergonomic ceiling**, not the
   tuned value: on mobile the differential should not exceed **~0.7× the desktop differential
   magnitude**. Exact tuned factor = `game-designer` + art gate, inside this ceiling. **Flagged seam.**
5. **Vitry opts out (recommendation, resolves story open-Q #3).** Vitry's ~0.12 facade strip (D7) is
   cropped to a sliver — or off-screen — at zoom 1.7 and cannot hold a sweeping band that satisfies D4/D8;
   the edge-column alternative is forbidden by D6. **Vitry sets its near-foreground to opt-out in
   `levelArt.json`** rather than ship a band that risks occlusion. Belliard + Stalingrad carry the
   feature; Vitry proves the data opt-out path (AC4).

---

## 5. Cahier des charges

Prohibition (Atari ST, 1987) had no parallax — this is a **conscious, documented extension** (per the
story), pure presentation serving §5's depth language. UX position: the extension is justified **only
while it stays invisible to the task** — the moment it costs one shot, one target read, or one comfort
threshold, it has failed its own justification. Every rule above is a fence around that.

---

## 6. Acceptance criteria (what stage-5 VERIFY checks against this spec, both device classes)

- [ ] **Reduced-motion:** with `prefers-reduced-motion: reduce`, near-foreground on-screen
      displacement ÷ facade displacement ≤ 1.0 between two pan samples; > 1 in the default state;
      layer still visible (not hidden); clamp is unit-tested as a pure `(factor, reducedMotion)`
      function; media query read **live** (mirrors `CrtPass`). (D1–D3)
- [ ] **Non-occlusion:** at edge + mid + edge camera samples, on Belliard & Stalingrad, no
      near-foreground pixel overlaps any window opening; crosshair→world hit mapping byte-unchanged;
      shots land exactly as before. Blocking. (D4–D5)
- [ ] **Safe zone:** foreground band top ≥ lowest-window-bottom + 0.06 (facade space) and ≥ 8%
      viewport clearance (screen space); no overlap of any HUD element. (D7–D8)
- [ ] **Mobile:** density ≤ half desktop; bottom band clear of thumb/HUD or opted out; differential
      ≤ ~0.7× desktop ceiling; screenshots at real mobile landscape viewport. (D9)
- [ ] **Vitry:** `levelArt.json` opt-out honoured — Vitry ships no near-foreground; no occlusion of
      its 4-row grid at any camera position. (D9.5)

---

_Hand-offs: parallax factor magnitude / sign / `levelArt.json` field → `senior-architect` +
`game-designer` (inside the D9.4 ceiling). Street-silhouette art / band read → `lead-art`. Reduced-motion
mechanism ratification (OS query recommended, D1) → `senior-architect`. This spec →
`lead-game-designer` (Karim) for design-gate PASS before architect, with a gate decision requested on
the **Vitry opt-out (D9.5)** and the **mobile top-band preference (D9.2)**._
