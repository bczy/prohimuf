# Design spec — Tutorial: visual gesture icons + fuller bestiary

**Feature:** make the optional tutorial stage teach by _showing_, not by prose —
four code-drawn gesture icons on the control panels + one bestiary panel per shipped enemy.
**Story:** `_bmad-output/planning-artifacts/story-tutorial-visual-gestures.md`
**Author:** `game-designer` (Sacha) · **Gate:** `lead-game-designer` (Karim) — UNGATED until PASS
**Extends:** ADR-0012 (optional scripted tutorial), ADR-0015 (device-forked script; D3 reopened)
**Lane:** this spec covers the **gameplay-teaching** side only. Panel copy + French
`imageAlt`/icon labels are `narrative-designer`'s deliverable (parallel). The
`NarrativeLine.gesture` **field shape** is `senior-architect`'s call — this spec fixes the
**values and semantics**, not the TypeScript.

---

## 0. Cahier des charges verdict

_Did Prohibition (Atari ST, 1987) have a tutorial?_ **No** — printed manual. The tutorial
stage is the already-documented conscious extension (ADR-0012). This spec stays **inside**
that envelope: **presentation only**, zero new mechanic, verb, input or rule. Every icon
illustrates a control that already ships; every bestiary panel illustrates an enemy already
live in the default Belliard pool (`ARCHETYPES`, `enemyTypes.ts`). It illustrates the game
that exists; it does not widen it.

---

## 1. Four gesture icons (render layer, code-drawn SVG/CSS)

### 1.0 Shared rules for all four icons

- **Slot & size.** The icon occupies the **same slot `image` uses today** — centred above
  the dialogue box (`NarrativeScreen.tsx`, the `currentLine.image` block). Same
  `maxHeight: 38vh`, `objectFit: contain` envelope so it never crowds the copy.
- **Medium.** Fanzine **B&W line art** (rough xerox stroke, high contrast) for the _inert_
  parts of the icon (the mouse body, the screen frame, the finger outlines, the glass).
  These parts **never glow** — they are décor (`loi du glow`, art-direction §2).
- **La loi du glow — ce qui brille est interactif.** In each icon, exactly the element the
  player _acts with_ glows in one acid-neon accent: the clicked button, the touched edge,
  the tapping fingertips, the swiping trail. Nothing else glows.
- **Un halo est un dégradé, jamais un aplat.** Every glow is an **alpha-falloff** gradient
  (radial for a point of contact, linear-tail for a motion trail) that decreases from the
  element outward and **reaches 0 at the outer margin**. No flat neon plate — automatic
  FAIL at the composite gate (Gate 4), checked on real in-browser screenshots, not the CSS.
- **Accent hue.** Recommend the tutorial screen's existing active accent, **neon yellow
  `#ffe600`** (already the screen's `NEON_YELLOW` for header/dots/borders) so the glow reads
  as one system with the chrome. Final hue is **`lead-art`'s call**; if a per-icon hue is
  wanted, draw from the four hex-anchored hues (art-direction §2). One accent per icon.
- **Read-at-a-glance contract (AC3/AC4).** The four icons must be mutually distinguishable
  in a single frame: **device object** (mouse) vs **framed screen + cursor** (edge-scroll)
  vs **two static contact dots** (two-finger tap) vs **one dot + motion trail** (swipe).
- **Accessibility & fallback (AC10).** Each icon carries an accessible French label
  (narrative copy, parallel to `imageAlt`). If the icon can't render / is unsupported, the
  panel **degrades to its text** (never a broken slot) — mirrors `NarrativeScreen`'s
  `onError` image fallback.
- **Motion, not diagram (Open Q1 ruling).** Bertrand's ask ("illustrer le drag and move")
  implies motion → the icons **animate** a single looped gesture. Loops are short and
  CSS/SVG-cheap; the gesture is legible on the first cycle.

### 1.1 Desktop — mouse left-click (`gesture: "mouse-click"`)

- **Depicts.** A B&W line-art two-button computer mouse, slight three-quarter top view,
  scroll wheel + cable drawn. The **left button** is the only lit element.
- **Animation loop (~1.2 s, infinite).**
  0.00–0.15 s: left button depresses ~2 px and its neon glow **spikes** (falloff halo
  blooms from the button). · 0.15–0.35 s: a single **click-ripple** ring expands from the
  mouse and fades to alpha 0 (one ring, one click). · 0.35–1.20 s: button rests, glow at
  low idle. Repeat. Easing: fast-in on the press, ease-out on the ripple.
- **Teaching point (exact).** _One **left**-click = one shot; a single discrete click, not a
  hold, not the right button._ The lit left button IS the fire button.

### 1.2 Desktop — edge-scroll pan (`gesture: "edge-scroll"`)

- **Depicts.** A fanzine-framed screen rectangle with the **cursor arrow pushed flat against
  one edge**; directional chevrons on that edge imply the view sliding. NOT a hand, NOT a
  grabbed drag — there is no drag-pan on desktop (ADR-0015).
- **Animation loop (~2.4 s, infinite, alternating edge).**
  0.0–0.6 s: cursor slides from centre to the **right** edge. · 0.6–1.4 s: the touched edge
  **lights up** (edge-band glow, falloff inward to 0) and 2–3 chevrons march outward in the
  pan direction (content implied scrolling). · 1.4–1.6 s: snap back to centre. · next cycle
  runs the **left** edge (then may cycle top/bottom) to teach _"dans les deux sens", all
  four directions_. No mouse button is held anywhere in the loop.
- **Teaching point (exact).** _Push the cursor to the screen **edge** and the view scrolls
  that way — edge-scroll, both senses / four directions. It is a push, not a drag._

### 1.3 Mobile — two-finger single tap (`gesture: "two-finger-tap"`)

- **Depicts.** Two fingertips (index + middle, B&W line art) contacting glass **at the same
  instant**; the two contact points are the lit elements — two neon dots with falloff halos.
- **Animation loop (~1.4 s, infinite — exactly ONE tap per loop).**
  0.0–0.2 s: both fingers descend together; **both fingertip halos flash ON simultaneously**
  and a **single** concentric ripple springs from the **midpoint between them**. · 0.2–0.4 s:
  ripple fades to alpha 0. · 0.4–0.7 s: fingers lift. · 0.7–1.4 s: **rest** — the inter-loop
  pause is deliberately long so the repeat never reads as a double-tap.
- **Teaching point (exact).** _Two fingers, **ONE simultaneous tap** = shoot; the bullet
  leaves from the **midpoint** between the fingers._ This is the ADR-0015 D1 gesture —
  **never a double-tap, never a one-finger tap.** (Corrects Bertrand's "double tap".)

### 1.4 Mobile — one-finger swipe pan (`gesture: "swipe-pan"`)

- **Depicts.** A **single** fingertip dragging across glass, a **glow motion trail** streaking
  behind it (the trail IS the alpha-falloff demo — bright at the fingertip, fading to 0 at the
  tail), plus a direction arrow.
- **Animation loop (~2.0 s per direction, cycles the four directions).**
  0.0–0.5 s: one finger presses and **sweeps** across (e.g. left→right), trail trailing. ·
  0.5–0.7 s: finger **releases** mid-travel. · 0.7–1.2 s: the trail/content **keeps gliding**
  a short distance and eases to a stop — the **flick inertia** ("une pichenette, et ça glisse
  tout seul"). · 1.2–2.0 s: reset; next cycle sweeps a different direction (up, then left,
  then down) to teach _all four_.
- **Teaching point (exact).** _One finger **swipes** to pan in any of the four directions; a
  flick keeps gliding on its own (inertia)._ One finger + lateral travel + trail — visibly
  distinct from the two-finger static-dot shoot icon.

### 1.5 Icon animation tuning table

| Icon           | gesture value    | Lit element (glows)               | Loop      | One-cycle beat                                 | Must never read as        |
| -------------- | ---------------- | --------------------------------- | --------- | ---------------------------------------------- | ------------------------- |
| Mouse click    | `mouse-click`    | Left button + click-ripple        | 1.2 s     | press → 1 ripple → rest                        | a hold / right-click      |
| Edge-scroll    | `edge-scroll`    | Touched edge band + cursor tip    | 2.4 s     | slide → edge glow + chevrons → snap, alt. edge | a drag / grab-pan         |
| Two-finger tap | `two-finger-tap` | Both fingertips + midpoint ripple | 1.4 s     | 1 simultaneous tap → long rest                 | a double-tap / one-finger |
| Swipe pan      | `swipe-pan`      | Fingertip + fading motion trail   | 2.0 s/dir | sweep → release → inertial glide               | a two-finger gesture      |

---

## 2. Panel structure — ruling: ENRICH the control panels, ADD the bestiary panels

Open Q2 ("more detailed" = enrich vs add) — **design-gate call, split by segment:**

- **Control panels → ENRICH (no new panels).** The four gestures are one-per-control-panel:
  each existing control panel gains its gesture icon **in the image slot**, keeping the
  control fork at **2 panels/variant** (ADR-0015 D1 progress-dot parity, preferred path per
  story §ADR impact). Desktop panel 2 = `mouse-click`, panel 3 = `edge-scroll`; mobile panel
  2 = `two-finger-tap`, panel 3 = `swipe-pan`. Each variant shows **its own two icons only**;
  four icons exist across the two variants.
- **Bestiary → ADD panels.** `NarrativeLine` carries **one** illustration slot, so showing
  five distinct enemies requires **five panels** — cramming multiple sprites into one panel
  is impossible and defeats the silhouette-recognition purpose. Today's field segment shows
  only 2 enemies (cops + civilian); we add **3** (riot, biker, bonus). These live in the
  **shared field segment** so both variants stay at equal panel count (AC9).

### 2.1 Resulting panel list (both variants — 11 panels, parity held)

| #   | Segment             | Speaker  | Slot                       | Teaching intent                                                         |
| --- | ------------------- | -------- | -------------------------- | ----------------------------------------------------------------------- |
| 0   | opening _(shared)_  | DISPATCH | —                          | Core loop: Récupérer → Livrer → Éviter                                  |
| 1   | opening _(shared)_  | DISPATCH | `truck.png`                | The delivery vehicle; cover it, let it leave intact                     |
| 2   | control **(fork)**  | KENZA    | **gesture icon**           | Shoot — `mouse-click` (desktop) / `two-finger-tap` (mobile)             |
| 3   | control **(fork)**  | KENZA    | **gesture icon**           | Pan — `edge-scroll` (desktop) / `swipe-pan` (mobile)                    |
| 4   | bestiary _(shared)_ | KENZA    | `enemy_shooting.png`       | **Normal cop** — your target; it shoots back if you dawdle              |
| 5   | bestiary _(shared)_ | KENZA    | `enemy_riot_shooting.png`  | **Riot cop** — takes **two** hits to go down                            |
| 6   | bestiary _(shared)_ | KENZA    | `enemy_biker_shooting.png` | **Biker** — **flash** window, pops and vanishes fast                    |
| 7   | bestiary _(shared)_ | KENZA    | `enemy_bonus.png`          | **Bonus** — never shoots, **+time**, **not** a target                   |
| 8   | bestiary _(shared)_ | KENZA    | `enemy_civilian.png`       | **Courier civilian** — **NEVER** shoot the livreur                      |
| 9   | field _(shared)_    | DISPATCH | —                          | HUD: chrono, vies, score, compteur d'éliminations, fenêtre de livraison |
| 10  | field _(shared)_    | DISPATCH | —                          | Outro: "bouge, Rue Belliard t'attend"                                   |

- **Both `TUTORIAL_NARRATIVE_DESKTOP` and `_MOBILE`: 11 panels.** Shared-by-reference indices
  become **[0,1,4,5,6,7,8,9,10]**; the fork is **[2,3]** only. (Downstream: the
  `tutorialInvariants` reference-equality loop's index list widens accordingly — that's a
  dev/architect edit, flagged, not my lane.)
- **Ordering rationale.** Learn to _shoot/pan_ (2–3) **before** learning _what_ to shoot /
  never shoot (4–8): the danger targets first, the never-shoot courier as the emphatic close
  of the roster, then HUD, then go.

### 2.2 Length budget vs the <10 s ethos (guidelines §5)

11 panels vs 8. Justification: the <10 s rule governs **launch → gameplay**, and the tutorial
is **off** that path by construction — Belliard is the default menu highlight; the tutorial is
an optional/secondary affordance (ADR-0012 D2). A hurried player never enters it; a player who
opts in is asking to learn, and clarity beats brevity there. It stays **skippable at every
panel** ("Passer", AC8) and writes nothing to progress. This is a conscious, documented trade,
not a violation — the ethos protects the _default_ first-play, which is untouched.

---

## 3. Bestiary teaching — one panel, one enemy, one rule

Open Q3 ruling: **each of the five shipped enemies gets its own panel and exactly ONE
must-teach fact.** All values sourced from `ARCHETYPES` (`enemyTypes.ts`) — the tutorial must
not drift from live tuning.

| Enemy            | Sprite (slot)              | ONE teaching point                                    | Source value                                             | Why it's must-teach                                                |
| ---------------- | -------------------------- | ----------------------------------------------------- | -------------------------------------------------------- | ------------------------------------------------------------------ |
| Normal cop       | `enemy_shooting.png`       | Legitimate **target**; **shoots back** if you linger  | `shoots:true, countsAsTarget:true, visibleDuration 3.2s` | The baseline threat + the kill-counter unit                        |
| Riot cop         | `enemy_riot_shooting.png`  | Takes **two hits** to go down                         | `hp:2`                                                   | Changes behaviour — don't move on after one shot                   |
| Biker            | `enemy_biker_shooting.png` | **Flash** window — pops and vanishes fast             | `visibleDuration 2.0s` (vs 3.2), `hiddenDuration 1.2s`   | Sets reaction-speed expectation                                    |
| Bonus            | `enemy_bonus.png`          | **Never shoots**, gives **+5 s**, is **not** a target | `shoots:false, timeDelta:5, countsAsTarget:false`        | Positive-but-optional; "not a target" stops kill-counter confusion |
| Courier civilian | `enemy_civilian.png`       | **NEVER** shoot — a downed livreur ends the run       | `scoreDelta:-1, livesDelta:-1` (courier reuse)           | The single most costly mistake in the game                         |

### 3.1 Shooting-state sprites where the threat is the lesson (story point 3)

- **Armed archetypes (normal / riot / biker) → SHOOTING-state sprite** (`enemy_shooting`,
  `enemy_riot_shooting`, `enemy_biker_shooting`). Rationale: the **SHOOTING pose is the
  in-game danger tell** (`EnemyState "SHOOTING"`); illustrating it _teaches the tell the
  player must read on sight_ and reinforces "armed = shoot it". This upgrades panel 4 from
  today's lone cop to a consistent "these three are armed threats" family read.
- **Non-threat archetypes (bonus / civilian) → IDLE sprite** (`enemy_bonus`,
  `enemy_civilian`). Their lesson is _"not a threat / never shoot"_, so an un-armed pose is
  the **correct read**; a drawn weapon on them would mis-teach.
- All five files are confirmed on disk (`public/assets/`); **no new sprite, no FLUX, no CI
  render-farm, no lead-art asset gate** (story §5, AC6).

**Resolves narrative `[FLAG]` (a):** shooting-pose vs idle for the armed types — RULED above
(armed → SHOOTING sprite; bonus/civilian → idle).

**Resolves narrative `[FLAG]` (b) — courier sprite = keep `enemy_civilian.png`, not
`courier/rider.png`.** The live courier renders as a **side-profile 2-layer composite**
(`courier/bike.png` under `courier/rider.png`, ADR-0017), but (1) the **bike layer is not on
disk** yet — only `rider_f*.png` frames exist, so the composite can't be shown; (2) a lone
`rider.png` still is an **upper-body-only** frame (prompt: "torso ending at hip height") that
in a static panel reads as a **floating headless torso** — worse teaching than a whole figure.
`enemy_civilian.png` is a purpose-drawn, front-facing, unmistakable "friendly delivery courier,
empty hands, no weapon" — the **clearest single-still read of _the livreur, never shoot him_**,
which is the panel's only job. Accepted trade: the panel's front-facing courier ≠ the in-game
side-profile rider silhouette, but both read instantly as "the livreur". **Revisit** once
`courier/bike.png` ships and a composite still can be captured.

### 3.2 In-scope only (AC6)

No panel references the **drive-by car** or **hostage taker** — not shipped, roster-gated to
S2/S3 (ADR-0012 D4). No `vehicles/car.png` repurposing (it's the _delivery_ vehicle).

---

## 4. Data-model semantics (values only — architect fixes the TS shape)

The story's proposed direction: an **optional, pure-data** field on `NarrativeLine` beside
`image?`/`imageAlt?`. This spec fixes the semantics; `senior-architect` owns whether it's a
discrete `gesture` enum or a general `icon` field, and the ADR.

1. **Enum of intent — four values:** `"mouse-click" | "edge-scroll" | "two-finger-tap" |
"swipe-pan"`. Each maps 1:1 to §1's icons in the render layer.
2. **Pure data, zero React/Three** — `narrativeSystem.ts` stays import-free (AC7). The value
   is an _intent token_; all drawing lives in `src/render`.
3. **Device-correctness is structural, not a runtime device read.** The gesture value lives
   in the **forked control segment**: the desktop segment carries `mouse-click`/`edge-scroll`,
   the mobile segment carries `two-finger-tap`/`swipe-pan`. The game layer never sees the
   device; `App.tsx` already picks the variant once at load (ADR-0015 D2). So the render layer
   maps value → icon with no extra device branch (AC7).
4. **Mutually exclusive with `image` on a panel.** Control panels set `gesture`, unset
   `image`; bestiary panels set `image`, unset `gesture`. They share the one render slot above
   the dialogue box. A panel never carries both.
5. **Accessible label required** (parallel to `imageAlt`) — a short French description of the
   gesture, authored by `narrative-designer`. Consumed like `imageAlt ?? ""`.
6. **Graceful degradation** — an unknown/unsupported gesture value renders **no icon** and the
   panel shows its text only; never a broken slot (AC10).

---

## 5. Acceptance criteria (design-side — playtested via `verify` at stage 5)

- **DA1.** Desktop control panels show `mouse-click` (panel 2) and `edge-scroll` (panel 3)
  icons per §1.1/§1.2; edge-scroll shows an **edge push, not a drag** (AC2).
- **DA2.** Mobile control panels show `two-finger-tap` (panel 2) and `swipe-pan` (panel 3);
  the shoot icon is **two fingers, ONE simultaneous tap** — verifiably not a double-tap and
  not one-finger (AC3); swipe is one finger, four directions, with an inertial glide (AC4).
- **DA3.** Each icon's lit element (button / edge / fingertips / trail) is the only glowing
  part, with a monotonic **alpha falloff to 0** (no flat plate) — checked on real screenshots
  at the composite gate.
- **DA4.** The four icons are distinguishable at a glance in a contact sheet.
- **DA5.** Bestiary shows five panels (normal/riot/biker/bonus/civilian), each the sprite of
  §3 with its ONE teaching point; armed types use their SHOOTING sprite, bonus/civilian idle
  (AC5).
- **DA6.** Both variants = **11 panels**, equal progress-dot count; shared segments
  reference-equal; fork on [2,3] only (AC9).
- **DA7.** Stage stays optional, skippable at every panel, informative-only — no verb/input/
  rule added, nothing written to progress (AC8).
- **DA8.** Captured in-browser on both `?preview=tutorial` contexts (desktop + mobile UA)
  showing the two device icons + the five-enemy bestiary (AC12).

---

## 6. Hand-offs

- **`narrative-designer` (Yasmine):** all panel copy for the 11 panels + the five `imageAlt`
  strings + the four gesture accessible labels. Keep each bestiary line to **one terse
  imperative** carrying only the §3 fact. Desktop copy never says `doigt`/`balay`; mobile
  never says `clic`/`souris` (ADR-0015 device-accurate-copy test).
- **`lead-art` (Nico):** final accent hue for the icon glow (recommend `#ffe600`); judge the
  B&W line-art read + the `un halo est un dégradé` falloff at the composite gate.
- **`senior-architect` (Winston):** `NarrativeLine.gesture` field shape + the ADR-0015 D3
  amendment/new ADR; the value/semantics above are the design contract to encode.
- **`lead-game-designer` (Karim):** gate this spec before any dev implements.
  </content>
  </invoke>
