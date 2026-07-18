# Spec — Near-foreground differential-scroll layer (STORY-FOREGROUND-PARALLAX)

**Feature:** a very-near foreground décor layer that scrolls _faster_ than the facade when
the camera pans, adding a third depth stratum to the street.
**Author:** `game-designer` (Sacha) · **Date:** 2026-07-17
**Status:** PROPOSAL — awaiting `lead-game-designer` (Karim) gate, then `pm` (John) sign-off
on the extension flag below.
**Phase:** PROPOSAL — no code. Values are gated here and transcribed by `dev-r3f-render`
into `src/render/**` (this is a render-only layer; see §7).
**Scope guard:** PROJECT_GUIDELINES §1 (cahier des charges).

## Cahier des charges verdict — CONSCIOUS EXTENSION

Prohibition (Atari ST, 1987) was a flat single-plane shooting gallery: one facade, no
multi-layer differential parallax, no near-foreground stratum. **muf does not have this
today** (only the sky parallaxes; facade + street are world-locked — `LevelBackdrop.tsx`).
This layer is therefore a **conscious, documented extension**, not a faithful port.

**Justification for the extension:** it is pure ambience serving the "rave in a real
1998 Paris street" fantasy (a body between the player and the facade = you are _in_ the
crowd, not looking at a diorama). It touches the core loop `Récupérer → Livrer → Éviter`
**only if it occludes a target** — so the whole spec is built around one iron rule (§1)
that guarantees it never does. With that rule held, gameplay impact is exactly zero.
→ **This flag requires `pm` acknowledgement before implementation.**

---

## 0. The engine's parallax convention (READ FIRST — the brief's ">1" is inverted here)

The prompt assumed the physical convention "factor > 1 = closer / scrolls faster". **This
codebase uses the opposite mapping.** In `LevelBackdrop.tsx` a layer is drawn at
`mesh.x = camera.x * factor`, so its apparent on-screen speed relative to the camera pan is:

```
apparentSpeed S = |1 − factor|      (× camera pan speed)
```

| Layer                     | engine `factor` | S (apparent speed) | reads as        |
| ------------------------- | --------------- | ------------------ | --------------- |
| Sky                       | 0.88 – 0.92     | 0.08 – 0.12        | far / slow      |
| Facade, street (locked)   | 0.0             | **1.0** (baseline) | the target wall |
| **Near-foreground (new)** | **negative**    | **> 1.0**          | close / fast    |

So "scrolls faster than the facade" = **S > 1 = a NEGATIVE engine factor**, not > 1.
Every number below is given as **S (the design intent, courier-relative)** _and_ the
**engine factor the dev plugs in** (`factor = 1 − S`).

---

## 1. IRON RULE — non-occlusion of targets and crosshair

The layer **must never overlap an active target (window/cop slot) or sit around the
crosshair**, at ANY camera pan offset. Because the layer scrolls faster than the facade,
an object _slides across_ the facade as you pan — so the constraint must hold across the
**whole pan sweep**, not just at rest. That single fact drives the whole design.

**D1.1 — Band confinement (the enforceable rule).** Foreground objects live ONLY in two
bands, defined against the level's `windowGrid` (already data in `levelArt.json`):

- **TOP band** — everything **above the top window row** (minus a `HIT_RADIUS = 0.8`
  world-unit margin): overhead cables, banner/guirlande strings, tree-canopy edge,
  balcony undersides, a hanging sound-system horn.
- **BOTTOM band** — everything **below the bottom window row** (minus the same margin):
  crowd heads/shoulders, a lamppost base, bollards, a parked-van roofline, café-terrace
  rail, a bin, flyers on a pole.

**Mid-height foreground (between window columns) is FORBIDDEN.** A gap between two window
columns is safe only at rest; parallax slides a mid-band object _into_ a column as the
camera pans, so it cannot be kept clear across the sweep. Top/bottom bands can scroll
freely at any offset because they never share the windows' vertical range.

**D1.2 — Verifiable acceptance.** For every foreground object, its bounding box, swept
across the full `camera.position.x` pan range at the object's own parallax speed, must not
intersect any window-zone rect expanded by `HIT_RADIUS = 0.8`. Band confinement (D1.1)
satisfies this by construction; a reviewer checks it by confirming no object's Y-extent
enters the window rows' Y-range ± margin.

**D1.3 — Crosshair is always on top.** The crosshair is screen-space and must keep a
`renderOrder` **above** the foreground layer, so it is never visually occluded. No opacity
trick needed.

**D1.4 — REJECTED: dynamic "fade when a cop is behind".** Considered and rejected. It
couples render to game state (which cop is in which slot), needs a per-frame occlusion
test, and a foreground that flickers/fades as cops pop is worse feel than one that simply
never occludes. Confinement (D1.1) is simpler, cheaper, and keeps `src/game` pure. KISS.

---

## 2. Parallax factor — RECOMMENDATION

**D2.1 — Target: S = 1.20 → engine `factor = −0.20`.**
The near-foreground moves 20 % faster than the facade.

**D2.2 — Acceptable range: S = 1.15 – 1.30 (engine factor −0.15 to −0.30).**

Rationale:

- **Floor (S ≥ ~1.13).** Below this the differential against the world-locked facade is
  imperceptible during a normal pan — the layer reads as "just another locked plane" and
  buys no depth. Not worth the pixels.
- **Ceiling (S ≤ ~1.32).** The near plane has the largest per-pan screen displacement of
  any layer. Push it too fast and during a rapid edge-scroll the eye tracks the _foreground_
  instead of the target, the layer "swims"/slides against the aim plane, and it induces
  vection (mild motion discomfort). 1.30 is the comfort edge on the closest plane.
- **1.20 is the sweet spot:** a clearly readable ~20 % differential (instant depth) while
  the near plane's per-frame displacement stays close enough to the target plane that the
  shooting read is undisturbed.

**D2.3 — Coupling to pan speed (verify in build, one variable at a time).** S is a
_multiplier_ on the edge-scroll pan velocity (owned by `tuning.md`). The absolute swim is
`(S − 1) × panSpeed`. If the edge-scroll pan is fast, even S = 1.20 may feel like a lot →
re-check against the live pan value during VERIFY; tune S first, pan speed is not this
spec's to move. Change one at a time, record before/after.

---

## 3. "Apparaissent" — RECOMMENDATION: enter-by-edge on scroll, NOT time fade-in

**D3.1 — Objects are static world props on the fast-parallax plane; they enter and exit
the frame _from the screen edges_ as the camera pans.** This IS the payoff of "closer =
scrolls faster": a lamppost sweeps in from the side, faster than the facade behind it.
No spawn timers, no opacity animation, no per-frame spawn logic.

**D3.2 — REJECTED for the general case: time-based fade-in.** A near, solid object
(lamppost, human) that _materialises_ in place reads as ghostly and breaks the diegesis.
Fade-in is for supernatural/UI things, not street furniture. Because objects are confined
to the top/bottom bands (§1) they only ever cross the left/right edges — never pop in
mid-frame — so no fade is needed to hide a mid-frame appearance.

**D3.3 — Allowed, minimal: a soft alpha feather on the entering edge only.** Reuse the
exact mechanism the facade already uses (`LevelBackdrop` `BLEND` left-edge feather) so an
object's hard edge doesn't pop at the very frame boundary. This is a spatial edge feather,
NOT a time-based fade. Optional polish, not required for gate.

---

## 4. Density — RECOMMENDATION

**D4.1 — Target 3 foreground elements on screen; hard cap 4.**

**D4.2 — World spacing:** roughly **one element per ~0.5 screen-widths of street**, placed
in world space (not screen space) so the count on screen falls out of the pan naturally.

Rationale: depth needs contrast, not quantity — the scene already has two strata (sky
S≈0.1, facade S=1.0); **2–4** near elements at S=1.2 add a legible third stratum. Go
denser and the fast-scrolling layer becomes a "picket fence" strobing across the aim plane
that actively fights the target read (the near plane's high speed makes clutter worse here
than on any other layer). Sparse is the correct read: a body here, a lamppost there.

---

## 5. Interaction — RECOMMENDATION: purely decorative, minimal scope

**D5.1 — Decorative only. Not hit-testable. Zero gameplay effect.** The layer is invisible
to `src/game` logic — it is never a hit candidate.

Rationale: this is already an extension (§0); making props shootable widens it further and
collides with the gated shot rule (`spec-shot-flat-impact.md` D1.5, "one shot = one target,
nearest wins"). A foreground prop between crosshair and cop would either steal the hit or
force a new z-priority rule — scope and risk for no core-loop gain. Decorative = the safe
minimal scope, and it keeps the layer render-only (§7).

**D5.2 — Deferred (do NOT build now):** a cosmetic-only flutter (a leaf/flyer twitch) when
a bullet _tracer_ passes near — render-transient, reading the existing shot event, still
zero gameplay effect. Revisit only if playtest asks for it. YAGNI for v1.

---

## 6. Acceptance criteria (VERIFY stage — playtest against these)

- **AC1** No foreground object ever overlaps a window-zone rect (+0.8 margin) at ANY camera
  pan offset (D1.1/D1.2). Verified by panning across the full street and screenshotting.
- **AC2** Crosshair renders above the foreground at all times (D1.3).
- **AC3** Near-foreground apparent speed is 1.15–1.30× the facade (engine factor −0.15 to
  −0.30), default 1.20 / −0.20 (D2). No motion discomfort on a full-speed edge-scroll.
- **AC4** Objects enter/exit from the screen edges via scroll; nothing fades or pops in
  mid-frame (D3).
- **AC5** ≤ 4 foreground elements on screen at once, ~3 typical (D4).
- **AC6** Foreground is non-interactive: no shot ever hits or is blocked by it; `src/game`
  is unchanged (D5, §7).
- **AC7** Cop-target read is unharmed: A/B a pan with vs without the layer — target
  acquisition time and hit rate must not regress.

## 7. Lane / boundary note (architect to confirm)

This is a **render-only** layer: it reads `camera.position.x` and `levelArt` data and draws
planes, exactly like the existing sky parallax and `ForegroundImage.tsx`. It adds **no**
game state and **no** `src/game` change → lane = `dev-r3f-render`. The parallax factor and
density values above are design constants transcribed into `src/render/**` (candidate home:
alongside `LevelBackdrop`/`ForegroundImage`). Architect confirms placement.
