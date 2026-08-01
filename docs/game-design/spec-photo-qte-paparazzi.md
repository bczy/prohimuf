# Spec — Photo QTE "paparazzi" : set-piece de preuve photographique (mécanique + tuning)

**Feature:** the non-lethal QTE family opened by ADR-0077 — Muf photographs a corrupt
authority figure through a telephoto lens instead of shooting him. This spec owns the
**mechanic, the tuning and the 3C**; it is the `game-designer` deliverable of the ADR-0077
design loop.
**Author:** `game-designer` (Sacha) · **Date:** 2026-08-01
**Status:** DRAFT — **needs `lead-game-designer` (Karim) DESIGN GATE PASS** before it reaches
`senior-architect` (TECH PLAN) and before any dev implements it.

**Design source (DECIDED upstream, not re-opened here):**
[`docs/adr/0077-qte-photo-paparazzi-set-pieces.md`](../adr/0077-qte-photo-paparazzi-set-pieces.md)
— authored set-pieces (D1), verb = cadrer + zoomer + déclencher in a dedicated full-screen
view with the world paused (D2), zoom = fill-the-frame validation **+** sway (D3), hybrid
briefing (D4), multi-moment scene with exactly one master proof (D5), tension = suspicion
gauge fed by shutter noise vs. sound cover **plus** finite authored film (D6), spotted =
scene aborted + checkpoint retry, no death (D7), two-beat feedback — mechanical at the
shutter, semantic at the contact sheet (D8), dedicated 2D backdrop + key-pose sprites (D9).

**Sister specs this one is aligned to (read them, they are load-bearing):**

- `docs/game-design/spec-photo-qte-fiction.md` (`narrative-designer`, Yasmine) — the first
  set-piece is **le Commandant encaissant une enveloppe, quai de la Loire sous le métro
  aérien**, triptych **ARRIVÉE** (bonus) / **L'ÉCHANGE** (master proof: _two faces AND two
  hands in frame_) / **LA PLAQUE** (bonus, max focal on a moving subject); sound cover = the
  métro passages; reward invariant = **"moins couvert", jamais "moins de PV"**.
- `docs/game-design/ux/photo-qte-controls.md` (`ux-designer`, Tony) — four verbs (viser /
  zoomer / déclencher / **lever-baisser** l'appareil, hold-to-raise), suspicion **needle**,
  AF **brackets that read composition only, never the verdict**, film ≤ 8 for a
  no-pagination contact sheet, reduced-motion = slow drift at comparable difficulty.

**Cahier des charges verdict: [EXTENSION]** — conscious, documented. Prohibition (Atari ST, 1987) had no photo mini-game and no camera verb; ADR-0077 already records the extension and
its justification. The core loop `Récupérer → Livrer → Éviter` is **untouched**: the
set-piece plays _before_ the delivery (fiction §2.2), adds no rule to `Éviter`, and is
**never a gate** (§7). This spec adds no loop verb.

**No code here.** Every number is a `game-designer` default, tunable, with its rationale,
to be transcribed into `src/game/**` by `dev-gameplay` (pure, TDD) and drawn by
`dev-r3f-render`. I touch nothing outside `docs/game-design/`.

---

## 0. World frame the numbers live in (read once)

The telephoto view does **not** zoom into the parallax level layers (ADR-0077 Context: they
are not authored for ×10). It renders a **dedicated 2D scene plate** — one authored
backdrop + key-pose sprites (D9). All the geometry below lives on that plate, in its own
coordinate space, and never touches `WORLD_HEIGHT`/street coordinates.

| Frame element       | Value                                             | Note                                                                           |
| ------------------- | ------------------------------------------------- | ------------------------------------------------------------------------------ |
| Scene plate         | `100.0 × 56.25` **scene units (su)**, 16:9        | `x ∈ [0,100]` left→right, `y ∈ [0,56.25]` bottom→top. One plate per set-piece. |
| Viewfinder rect `V` | centred on `viewfinderCentre`, width `fovW`, 16:9 | Always clamped fully inside the plate.                                         |
| Focal `f`           | `FOCAL_MIN 35 mm` → `FOCAL_MAX 300 mm`            | Diegetic: the UX "300 mm" label (fiction §4.2) IS `FOCAL_MAX`.                 |
| Magnification law   | `fovW(f) = 3500 / f` su                           | `f = 35` ⇒ the whole plate; `f = 300` ⇒ `fovW = 11.67 su`.                     |
| Scene clock         | `sceneClock`, seconds, monotonic                  | The **only** cadence input. Everything authored is a function of it.           |
| World outside       | **paused** (ADR-0030/0034 shell)                  | No street sim, no enemies, no energy movement — see §6.4.                      |

**Primitives reused from the shipped QTE family** (do NOT re-derive): the forward-only phase
machine shape; the establishing hold (`QTE_ZOOM_SECONDS 2.0`) and the result hold
(`QTE_RESULT_HOLD 2.2`); the **closed-form hashed-waypoint** deterministic motion model
(ADR-0034 Rev. 3 — no `Math.random`, no `Date.now`, no per-tick PRNG cursor); the
"floors are asserted in code against authored data, never trusted" discipline (ADR-0035 D2);
the WYSIWYG classify order (resolve player input against the state the render **drew**, then
advance the sim).

**Primitives deliberately NOT reused:** `COVERED ↔ PEEKING`, the ring hit test, the anatomy
colour zones, the energy ledger, `blownPeeks`. This QTE is non-lethal: nothing is shot,
nothing loses HP, energy does not move (§6.4). Sharing the _shape_ of the shell is right;
forking the _lethal_ primitives into it would be the silent-fork the ADR's Consequences
section warns the review panel about.

---

## D1 — The set-piece state machine (DECIDED)

Forward-only, exactly like the house shell. The posture toggle the UX spec delegates to me
(`ux/photo-qte-controls.md` §1.4) is a **sub-machine inside `ACTIVE`**, not a top-level phase.

```
ESTABLISHING ──► ACTIVE ──┬─► SPOTTED   ─┐
   2.0 s                  ├─► ROLL_END   ├─► DEVELOPING ──► CONTACT_SHEET ──► DONE
                          └─► SCENE_END ─┘     0.8 s          (player CTA)
```

### 1.1 Top-level phases

| Phase           | Enter when                         | What runs                                                                                                                 | Exit                                               |
| --------------- | ---------------------------------- | ------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------- |
| `ESTABLISHING`  | set-piece triggers                 | The wide plate holds, unzoomed. Camera **forced LOWERED**, shutter inert, `sceneClock` **frozen at 0**, suspicion frozen. | after `PHOTO_ESTABLISH_SECONDS = 2.0 s` → `ACTIVE` |
| `ACTIVE`        | —                                  | `sceneClock` runs; the authored cadence (§3) plays; the posture sub-machine (§1.2) is live.                               | one of the three terminal conditions below         |
| `SPOTTED`       | `suspicion ≥ SUSPICION_MAX`        | Targets scatter. Terminal, **non-lethal** (D7).                                                                           | → `DEVELOPING`                                     |
| `ROLL_END`      | `film === 0` (after the decrement) | The roll is finished; the scene is over for Muf whatever happens on the quai.                                             | → `DEVELOPING`                                     |
| `SCENE_END`     | `sceneClock ≥ SCENE_DURATION`      | The berline is gone. The passive-failure route: a player who never presses ends here.                                     | → `DEVELOPING`                                     |
| `DEVELOPING`    | any terminal                       | `PHOTO_DEVELOP_SECONDS = 0.8 s` mechanical beat (wind-on / cut to black). No input.                                       | → `CONTACT_SHEET`                                  |
| `CONTACT_SHEET` | —                                  | The verdict (D8). Every frame shot is stamped (§4.4).                                                                     | player CTA → `DONE`                                |
| `DONE`          | —                                  | `Continuer` if the roll contains a `MASTER` frame, else `Réessayer` → checkpoint retry (§6.3).                            | —                                                  |

**Establishing is forced-LOWERED on purpose.** It gives the player the wide read of the
scene before any commitment, it makes the raise gesture the first thing they do, and it
guarantees the suspicion needle and the film counter are seen at rest before either moves.

**`SPOTTED` reaches the contact sheet — answering the UX open flag (`photo-qte-controls.md`
§4).** It does **not** bypass it. Rationale, and this is a real design call: the contact
sheet is the _only_ channel through which the player learns whether their frames were valid
(D8 withholds it everywhere else). A player who is spotted has just made the biggest
mistake available to them and is the player who most needs the diagnostic. Skipping the
sheet on `SPOTTED` would manufacture exactly the failure mode ADR-0077's Consequences
section flags for stage 5 ("players must not burn full film rolls unknowingly"). The sheet
shown on `SPOTTED` is the same sheet, truncated to the frames actually shot, with the
`Réessayer` CTA. Fiction variant (c) already covers the copy.

### 1.2 Posture sub-machine (inside `ACTIVE`) — `LOWERED ↔ RAISED`

Hold-to-raise (UX §1.4: Space held on desktop, a held on-screen button on mobile).
`LOWERED` is the default and the resting state.

| Property        | `LOWERED` (safe)                                                 | `RAISED` (committed)                     |
| --------------- | ---------------------------------------------------------------- | ---------------------------------------- |
| View            | Wide preview of the whole plate (reacquire where the action is)  | The viewfinder rect at the current focal |
| Focal **value** | **RETAINED** (see below)                                         | Live, player-adjustable                  |
| Sway            | **zero**, path reset                                             | Accrues from `raisedElapsed` (§2.3)      |
| Shutter         | **inert** — swallowed, no film, no noise, no suspicion (UX §1.3) | Armed after `SHUTTER_ARM_SECONDS` (§1.3) |
| Suspicion       | **frozen** (no rise, no decay — UX A5 verbatim)                  | Can rise, on shutter releases only (§5)  |
| `sceneClock`    | **runs** — the quai does not wait for you                        | runs                                     |

**D1.a — The focal value survives a lower/raise; only the displayed view changes.** The UX
spec says the viewfinder "retracts to a neutral, un-zoomed wide preview" — that is the
_view_. If the _setting_ were also reset, the free bail-out (UX §3.4) would cost a full
zoom traverse to undo, and players would stop using it, which destroys the escape hatch the
accessibility envelope depends on. **Decision: `focal` is retained across posture changes.**

**D1.b — `SHUTTER_ARM_SECONDS = 0.40 s` (anti-exploit, and diegetic).** The shutter stays
inert for 0.40 s after each raise. Without it, tap-raise → immediate click would be a strict
dominant strategy: the sway path restarts at zero offset **and zero velocity** on every
raise, so spamming the posture toggle would hand the player a permanently perfect frame.
With a 0.40 s arm delay against a `SWAY_LEG_DURATION` of 0.55 s, a freshly-raised camera
arms at `u = 0.73` of the first sway leg — i.e. at the _fast_ part of the drift, the worst
moment. Spam is therefore strictly worse than committing. Diegetically it is just "the
camera has to reach your eye". A player who holds the raise is never affected.

**D1.c — Lower/raise spam is not otherwise punished.** No suspicion cost, no film cost, no
cooldown. The only thing it costs is _time_, and time is bounded by the pose cadence (§3),
which never pauses. That is the whole anti-abuse budget, and it is the non-punitive kind.

---

## D2 — The validation contract of a photograph (DECIDED)

This is the spec's central deliverable. A shutter release produces a `Frame` record whose
verdict is computed **at the shutter**, on the state the render **drew** (WYSIWYG order),
and **revealed only at the contact sheet** (D8).

### 2.1 The subject track — one continuous box, not per-instant boxes

**Decision: the scene authors a `subjectTrack(t)` — a subject box (centre + size) defined at
EVERY scene time**, keyframed and linearly interpolated. Photographable instants are
**intervals over that same track**, not separate objects.

Why this shape and not "a box only during an instant": the AF brackets (UX §2.3) must read
composition validity **live and at all times**, and they must **not** leak whether the
current moment is incriminating. If the box only existed during an instant, the brackets
would silently become the "something is happening now" tell — a semantic leak that breaks
D8's two-beat promise. With a continuous track, composition validity is _always_ answerable,
and the only secret is which slices of the timeline count. One box function, one live read,
secrecy intact.

### 2.2 The five tests (conjunctive, in this order)

A shutter input at scene time `t`, viewfinder `V`, focal `f`, subject box `B = subjectTrack(t)`:

| #      | Test            | Condition                                                                                                                       | Shown live?                         |
| ------ | --------------- | ------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------- |
| **T1** | **ARMED**       | posture `RAISED` **and** `raisedElapsed ≥ SHUTTER_ARM_SECONDS`. Fails ⇒ input **swallowed**: no film, no noise, no record.      | yes (brackets absent while lowered) |
| **T2** | **MOMENT**      | `t` falls inside an authored instant's `[openAt, closeAt]` ⇒ candidate instant `I`. Else the frame is recorded as `NO_SUBJECT`. | **NO — the secret** (D8)            |
| **T3** | **CONTAINMENT** | `B` fully inside `V` with `FRAME_MARGIN` clear on all four sides.                                                               | yes (brackets)                      |
| **T4** | **FILL**        | `fill = max(B.w / V.w, B.h / V.h) ∈ [FILL_MIN, FILL_MAX]`.                                                                      | yes (brackets)                      |
| **T5** | **FOCUS HELD**  | T3 ∧ T4 have been **continuously true for `FOCUS_HOLD` seconds** at the moment of release.                                      | yes (bracket **lock** state)        |

**Verdict** (stored on the frame, stamped at the sheet):

- `MASTER` — T2 with `I.role === "master"`, and T3 ∧ T4 ∧ T5.
- `BONUS` — T2 with `I.role === "bonus"`, and T3 ∧ T4 ∧ T5.
- `REJECTED` — anything else, with a stored `rejectReason ∈ { no-subject, out-of-frame,
too-wide, too-tight, blurred }` so the sheet can stamp _why_ (§4.4).

Every release that passes T1 consumes exactly **one** frame of film, whatever the verdict
(ADR-0077 D6: every frame counts; UX §2.1).

### 2.3 D2.a — Focus is a HOLD, not a velocity test

**Decision: "focus tenu" means the composition tests (T3 ∧ T4) have been continuously
satisfied for `FOCUS_HOLD = 0.35 s` when the shutter fires.** Any break — sway pushing the
box past the margin, a pan overshoot, a zoom nudge out of the valid band — **resets the
hold to zero**.

Rejected alternative — _a velocity threshold on the viewfinder over a trailing window_
(the first model I costed). It fails on discrimination: with a smoothstep waypoint path,
the trailing-mean speed at a waypoint rest and at mid-leg differ by only ~12 %, so no
threshold cleanly separates "settled" from "moving" — the test would be a coin flip
dressed as a skill. It also breaks the moving subject (LA PLAQUE): panning **with** a car
is exactly how you photograph one, and a velocity test punishes it. The hold model is
positional, so tracking a moving subject is _free_ and _correct_ — the box simply has to
stay framed. One knob instead of two, and it is precisely what the AF brackets already draw.

**Consequence for the render (spec the read, not the style — `dev-r3f-render`/`lead-art`):**
the brackets need **three** forms, not two: `dashed` (composition invalid) → `solid`
(composition valid, focus charging) → `locked` (focus held ≥ `FOCUS_HOLD`, the shutter will
be sharp). This extends `ux/photo-qte-controls.md` §2.3 by one state — flagged back to Tony
in §8. It leaks **nothing** semantic: "the lens has settled" is not "this is proof". Without
it, "focus tenu" is an invisible rule the player only discovers via a dull click after
spending film — the exact frustration ADR-0077 asks stage 5 to hunt.

### 2.4 Where the two-beat feedback line falls (reconciling D8 with the live brackets)

| Bit                         | When the player learns it                           | Channel                                                                        |
| --------------------------- | --------------------------------------------------- | ------------------------------------------------------------------------------ |
| Composition valid (T3 ∧ T4) | **live**, continuously                              | brackets dashed/solid                                                          |
| Focus held (T5)             | **live** (charging → locked), then **at the click** | brackets locked · **crisp click + discreet flash** vs **dull click, no flash** |
| A moment was open (T2)      | **contact sheet only**                              | stamp                                                                          |
| Master vs. bonus (`I.role`) | **contact sheet only**                              | stamp                                                                          |

This is the honest reading of ADR-0077 D8: the shutter gives **mechanical** feedback
(sharp/blurred — a property of the tool), never a **semantic** one (proof/not-proof — a
property of the evidence). Composition and focus are mechanical and therefore shown; the
moment and the role are semantic and therefore withheld.

---

## D3 — Zoom: the double trade-off, in numbers (DECIDED)

ADR-0077 D3 requires zoom to be a genuine two-sided cost. Here is the mechanism.

### 3.1 The focal axis

| Field                   | Default                                             | Rationale                                                                                                                                                                                                                                                                                               |
| ----------------------- | --------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `FOCAL_MIN`             | **35 mm**                                           | The whole plate in one frame — the lowered/wide read.                                                                                                                                                                                                                                                   |
| `FOCAL_MAX`             | **300 mm**                                          | The fiction's own label (`300 mm`, fiction §4.2). Nothing longer exists in the roll.                                                                                                                                                                                                                    |
| Input law               | **logarithmic**: `f = 35 × (300/35)^u`, `u ∈ [0,1]` | Constant ratio per unit of input — the only law that gives usable fine control at the long end, where the bonus lives.                                                                                                                                                                                  |
| `ZOOM_TRAVERSE_SECONDS` | **2.2 s** for `u: 0 → 1` at max input rate          | Sized against the telegraph budget: the worst authored re-zoom (L'ÉCHANGE ≈132 mm → LA PLAQUE ≈251 mm) costs **0.67 s**, comfortably inside the 1.8 s tell (§3.3). Slower than that and the tell stops being enough; faster and the narrowest valid band (LA PLAQUE, 0.37 s of travel) becomes twitchy. |

### 3.2 Side A — fill-the-frame validation

| Constant       | Default  | Rationale                                                                                                                                                                                                                                  |
| -------------- | -------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `FRAME_MARGIN` | **0.04** | 4 % of each axis must stay clear around the subject box. Two jobs: it is the "the incriminating element must not touch the edge" rule, and it is the sway's working room (§3.3).                                                           |
| `FILL_MIN`     | **0.45** | Below 45 % of frame on its dominant axis the subject is not legible in photocopy B&W at fanzine size — "trop large, la scène est illisible" (fiction §3.2). It is the anti-safe-play rule: you cannot solve the set-piece by staying wide. |
| `FILL_MAX`     | **0.92** | **Derived, not authored:** `1 − 2 × FRAME_MARGIN`. One knob, no drift between the two rules.                                                                                                                                               |

Valid-fill latitude is a ratio of **2.04×** in focal terms — one stop. Wide enough to be
found under time pressure, narrow enough that "zoom to taste" is not a strategy.

### 3.3 Side B — sway

Sway is a **closed-form hashed-waypoint drift of the viewfinder centre**, in scene units,
identical in model to the shipped hostage wander (ADR-0034 Rev. 3): waypoints hashed from
`(swaySeed, raiseIndex, k)`, `k = floor(raisedElapsed / SWAY_LEG_DURATION)`, smoothstep-eased
between consecutive waypoints, `waypoint[0] = (0,0)` so a raise never snaps the frame.

**The physical model is the honest one: the tremor amplitude is CONSTANT in scene units, so
its share of the frame grows linearly with focal.** That is the whole trade-off — nothing
extra is bolted on.

| Constant               | Default     | Rationale                                                                                                                                                                                                                         |
| ---------------------- | ----------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `SWAY_AMP_X`           | **2.4 su**  | Peak displacement of the viewfinder centre. Calibrated by the F5 floor (§7): it must consume ≤ 60 % of the containment slack at the **master** instant's sweet spot (it consumes 51 %) and ≤ 80 % at a bonus's (LA PLAQUE: 75 %). |
| `SWAY_AMP_Y`           | **1.35 su** | `= SWAY_AMP_X / 1.7778` — the sway ellipse is isotropic **in frame fractions**, so it bites equally on both axes.                                                                                                                 |
| `SWAY_LEG_DURATION`    | **0.55 s**  | Slower than the hostage wander's 0.38 s: this is a tremor the player counter-steers, not a target that dodges. Fast enough that a leg fits inside every pose window.                                                              |
| `MIN_LEG_DISPLACEMENT` | **0.60 su** | Anti-jitter floor (re-hash on collision), scaled from the hostage's 0.15 to this spec's larger amplitude. Below it the drift reads as a rendering glitch.                                                                         |
| `MAX_LEG_DISPLACEMENT` | **3.20 su** | Keeps a leg's speed human-counterable at the long end.                                                                                                                                                                            |

**How the two sides bite together (the point of D3).** Containment slack per side is
`(1 − fill)/2 × fovW` scene units. Sway is a constant 2.4 su. So:

- Frame **greedily tight** (fill → `FILL_MAX`): slack collapses (at 189 mm, 0.74 su) — sway
  alone breaks the focus hold constantly. Tight framing is **unusable**, without a rule
  saying so.
- Frame **greedily wide**: `FILL_MIN` rejects the shot outright.
- Frame at the **sweet spot** (mid-band, fill ≈ 0.64): slack ≈ 4.7 su vs. 2.4 su of sway —
  holdable with light counter-steer.
- Push the **focal itself** to 300 mm on the plaque: slack 2.08 su < 2.4 su of sway — the top
  of the range is self-punishing, and the real sweet spot sits at ≈ 250 mm.

That is D3's "double trade-off" as a single geometric consequence, not two bolted rules.

### 3.4 Reduced motion (answering UX §3.1's tuning seam)

**Decision: same amplitude, longer legs, linear interpolation.**

| Constant            | Standard      | Reduced motion              |
| ------------------- | ------------- | --------------------------- |
| `SWAY_AMP_X / _Y`   | 2.4 / 1.35 su | **identical**               |
| `SWAY_LEG_DURATION` | 0.55 s        | **1.30 s** (`_RM`)          |
| Interpolation       | smoothstep    | **linear** (constant speed) |

Rationale, and why this specific pair: keeping the **amplitude identical** means every
fairness floor in §7 (F5 holdability, the slack arithmetic, the sweet-spot geometry) is
**byte-identical between the two modes** — reduced-motion players inherit the same fairness
guarantees rather than a re-derived approximation. The difficulty that could have been lost
to the 2.4× slower drift is given back by **removing the smoothstep's zero-velocity dwell at
each waypoint**: standard mode offers a free "settling" moment twice per leg; the linear RM
path offers none, so the player counter-steers continuously. Motion quality changes (fast
small shake → slow wide drift, ≈ 0.8 Hz, far under the 3 Hz seizure floor, no discontinuity);
the _task_ — active correction to hold a valid composition for `FOCUS_HOLD` — is unchanged.

**Parity criterion (measurable, and the AC that tests it — AC9):** with the viewfinder held
still at each instant's mid-band focal, centred on the subject, the **fraction of a raised
10 s sample during which T3 ∧ T4 hold** must match within **±10 percentage points** between
the two modes. `SWAY_LEG_DURATION_RM` is the single free knob to close any gap found at
playtest — one variable at a time.

---

## D4 — Deterministic cadence: poses and sound-cover windows (DECIDED)

Everything below is **authored data** and a **pure function of `sceneClock`**. No
`Math.random`, no `Date.now`, no wall clock, anywhere (ADR-0077 determinism guardrail). Same
retry ⇒ byte-identical scene, which is what makes learning it a real skill.

### 4.1 Sound cover — the métro passages

The fiction hands me a free, diegetic, periodic noise source (fiction §2.1, §3.3).

| Field                 | Default    | Rationale                                                                                                                                                                        |
| --------------------- | ---------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `TRAIN_FIRST_OPEN`    | **10.0 s** | Leaves 10 s of `ACTIVE` silence first, so the player meets the _risky_ state before the safe one and learns the needle from the safe side.                                       |
| `TRAIN_PERIOD`        | **21.0 s** | Three passages in a 60 s scene — the fiction's "deux passages" plus the one the plaque needs. A 1998 métro headway, and short enough that missing a window is never a 40 s wait. |
| `TRAIN_COVER_SECONDS` | **7.0 s**  | 33 % duty cycle. Generous enough that a patient player can take **all three** shots at zero suspicion (F3 floor), tight enough that impatience is the default failure.           |
| `TRAIN_TELL_SECONDS`  | **1.8 s**  | The rame is **heard and seen approaching** before it covers — "on entend la rame arriver avant qu'elle couvre" (fiction §3.3). Never a surprise window.                          |

⇒ Cover windows at **[10.0, 17.0]**, **[31.0, 38.0]**, **[52.0, 59.0]**; approach tells from
8.2 / 29.2 / 50.2 s.

**Silence is the default state, cover is the exception.** A shutter release is classified by
one boolean: `inCover(t)`. Nothing in between, no partial credit — the gauge stays countable
(§5).

### 4.2 The three instants (authored, from the fiction's triptych)

`SCENE_DURATION = 60.0 s`. All boxes in scene units on the plate.

| #   | Instant       | Role       | Tell at | Window          | Duration | Cover overlap                            | Subject box (su)                      | Valid focal band | Sweet spot |
| --- | ------------- | ---------- | ------- | --------------- | -------- | ---------------------------------------- | ------------------------------------- | ---------------- | ---------- |
| 1   | **ARRIVÉE**   | bonus      | 9.2 s   | **11.0 – 15.5** | 4.5 s    | **4.5 s** (fully in [10,17])             | `24.0 × 13.5` static                  | **66 – 134 mm**  | 94 mm      |
| 2   | **L'ÉCHANGE** | **master** | 34.7 s  | **36.5 – 40.3** | 3.8 s    | **1.5 s** (straddles the end of [31,38]) | `17.0 × 9.56` static                  | **93 – 189 mm**  | 132 mm     |
| 3   | **LA PLAQUE** | bonus      | 51.2 s  | **53.0 – 55.9** | 2.9 s    | **2.9 s** (fully in [52,59])             | `7.5 × 4.22`, **moving** x 62 → 71 su | **210 – 300 mm** | 251 mm     |

`TELEGRAPH_LEAD_PHOTO = 1.8 s` for all three (tell → window open).

**Why the windows shrink 4.5 → 3.8 → 2.9 s.** A legible difficulty ramp inside one scene,
with the _mandatory_ shot in the middle: the bonus you meet first is the teacher, the master
proof is demanding but generous, the last bonus is the mastery test. Nobody is asked to
learn the verb on the shot they must not miss.

**Why L'ÉCHANGE straddles the end of a cover window.** Directly from fiction §3.3, and I
adopt it as tuning: the master proof's window opens 1.5 s before the rame passes and stays
open 2.3 s into the silence. A player who reads the tell and shoots early pays **zero**
suspicion; a hesitant player pays **+34** for the same photograph. That is the entire
suspicion mechanic taught in one beat, on the one beat that matters, without a tutorial
line. 1.5 s is above the F3 floor (1.2 s) but only just — deliberately.

**Why the telegraph is 1.8 s and not the family's 0.35 s.** The shooting QTEs telegraph a
_click_; this one telegraphs a **zoom traverse + a re-frame + a 0.35 s focus hold**. Budget
at the worst authored transition (L'ÉCHANGE 132 mm → LA PLAQUE 251 mm): traverse 0.67 s +
re-frame ≈ 0.4 s + hold 0.35 s = **1.42 s** < 1.8 s. The floor F2 (1.2 s) is set just under
that computed need, not picked round.

### 4.3 LA PLAQUE — the moving subject

The box translates x 62 → 71 su across its 2.9 s window (**3.1 su/s** ≈ 22 %/s of the frame
width at the sweet spot). Held still, the viewfinder loses containment in ≈ 1.0 s, so the
shot **requires tracking**. Because focus is positional (D2.a), panning with the car costs
nothing — it is a tracking skill, not an impossible one. Combined with the band's 1.14×→1.43×
latitude and the top-of-range sway, this is the hardest frame in the set-piece, which is
exactly its authored role (bonus, never mandatory).

### 4.4 The contact sheet (verdict surface — mechanics only; look is `lead-art`'s)

One thumbnail per frame shot, in shot order, stamped by verdict (UX §4.2): `MASTER` /
`BONUS` / `REJECTED` (+ the `rejectReason` from §2.2 so the reject stamp says _why_: flou /
hors cadre / trop large / trop serré / rien à voir). CTA label follows the outcome
(`Continuer` with a master frame, `Réessayer` without). The sheet is shown on **all three**
terminals, including `SPOTTED` (§1.1).

---

## D5 — Film economy and the suspicion gauge (DECIDED)

Two independent pressures — one on **attempts** (film), one on **noise** (suspicion) — with
no passive drain on either. House rule: outcome economies, never clocks that empty by
themselves.

### 5.1 Film

| Field         | Default                                       | Rationale                                                                                                                                                                                                                                                                                      |
| ------------- | --------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `filmCount`   | **6**                                         | 3 instants + **3 spare frames** = exactly a 100 % error margin: you may miss the master proof once, blow a bonus, and still finish the roll with a full set. Sits inside the fiction's supported 4–8 (fiction §3.4) and inside UX's ≤ 8 no-pagination ceiling (UX §4.1) as a clean 2 × 3 grid. |
| Decrement     | **1 per armed release**, whatever the verdict | ADR-0077 D6, UX §2.1: a wasted frame is still film. This is the entire reason the two-beat feedback is tense.                                                                                                                                                                                  |
| Lowered input | **0**                                         | Swallowed at T1 — no film, no click, no cost (UX §1.3).                                                                                                                                                                                                                                        |

`film === 0` after a decrement ⇒ `ROLL_END` immediately. **The roll ending ends the scene**,
whether or not the master proof is in it — a finished roll is a finished roll; the contact
sheet then says which it was.

### 5.2 Suspicion

| Field                       | Default  | Rationale                                                                                                                                                      |
| --------------------------- | -------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `SUSPICION_MAX`             | **100**  | The needle's full sweep (UX §2.2).                                                                                                                             |
| `SUSPICION_SHUTTER_COVERED` | **0**    | A rame overhead absorbs the click completely. Cover is a genuine safe state, not a discount — that is what makes waiting for it a real decision.               |
| `SUSPICION_SHUTTER_EXPOSED` | **+34**  | **Three silent frames get you spotted; two do not.** The gauge is a countable budget the needle teaches at a glance, without ever printing a number (UX §2.4). |
| Decay                       | **none** | See below.                                                                                                                                                     |
| Any other source            | **none** | ADR-0077 D6 names exactly one input: shutter noise vs. sound cover. No time pressure, no proximity, no "he glances your way". One input, one lesson.           |

**Why no decay at all.** Three reasons, in order of weight: (a) UX A5 asserts the needle
shows **zero delta while lowered** — a decay that ran only while raised would be perverse,
and one that ran while lowered would contradict a gated acceptance criterion; (b) a
non-decaying gauge is a _budget_, which is countable and legible on a needle, whereas a
decaying one is a _rate_, which needs a number to read — and numbers are forbidden here
(UX §2.4); (c) the house rule is outcome economies over passive drains, and a decay is a
passive drain wearing a friendly hat. The anti-frustration guarantee is delivered instead by
the **F3 floor** (§7): every instant, master and bonus alike, has ≥ 1.2 s of overlap with a
cover window, so a **zero-suspicion perfect run always exists**. Patience is always
sufficient. That is a stronger promise than a decay, and it is assertable.

**Spotted (`suspicion ≥ 100`)** — targets scatter, scene aborts, contact sheet, retry from
checkpoint. **No death, no run loss, no energy cost, no quota effect** (D7, §6.4).

---

## D6 — 3C, and what this QTE does NOT touch

### 6.1 Camera

The "camera" here is the viewfinder rect; the R3F camera holds the plate. **No screen
shake, ever** — shake would be indistinguishable from sway and would corrupt the one signal
the player is reading. The only motion on screen is the sway, the subject track, and the
player's own pan. `LOWERED` shows the full plate; `RAISED` shows `V`.

### 6.2 Character

Muf has no avatar in this set-piece: he is the point of view. No movement, no weapon, no
energy stake. The four verbs of UX §1 are the entire ability set.

### 6.3 Controller and retry

Bindings, gestures, touch targets and the escape hatch are `ux-designer`'s
(`ux/photo-qte-controls.md` §1, §3) and I adopt them unchanged. Two gameplay notes I owe
back to that spec:

- **Pause freezes everything** — `sceneClock`, sway phase, `raisedElapsed`, film, suspicion.
  The set-piece must be tick-gated by the existing `paused` flag, not run beside it (UX §3.4
  already flags this to `senior-architect`; I confirm it as a gameplay requirement, not a
  nicety: an unpausable deterministic scene is a broken deterministic scene).
- **Retry restarts the set-piece at `sceneClock = 0`** with film restored and suspicion
  zeroed, from the checkpoint. Determinism means retry N is byte-identical to retry 1 — the
  player is learning a fixed scene, which is the only way a 60 s authored set-piece is worth
  replaying.

### 6.4 What does NOT move (answering UX §2.4's flag explicitly)

**No energy movement. None.** No refill on the master proof, no drain on `SPOTTED`, no panic
cost on a wasted frame. `energy` is inert for the whole set-piece, which is precisely why the
UX spec is right to keep the energy readout off this screen. **No score movement** either
(single-currency discipline, ADR-0034 D5 / boss spec §4.4). The only currencies are film,
suspicion, and the frames in the roll.

**No kill quota interaction, no enemy spawn, no vehicle sim.** The world is paused.

---

## D7 — The reward lever (RECOMMENDED, not decided — ADR-0077 open question)

ADR-0077 leaves "boss weakening vs. route unlock vs. narrative" open and assigns it jointly
to `game-designer` + `narrative-designer`. Yasmine's recommendation (fiction §5) is that the
proof makes the Commandant **isolé, jamais affaibli** — reusing the already-specified
"planque enfoncée" state (shortened `SHIELDED` lulls). Her invariant: _"toute récompense qui
se lit « il a moins de PV » casse la fiction ; toute récompense qui se lit « il est moins
couvert » la sert."_

**I concur, and I can make it exact.** Here are the three options with their cost, then the
recommendation.

| Option                        | What ships                                                                                 | Cost                                                                                      | Verdict                                                                                                                                                |
| ----------------------------- | ------------------------------------------------------------------------------------------ | ----------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **R1 — Boss cover reduction** | The final `bossQteSpec` per-phase **`SHIELDED` lull** is scaled down by an authored factor | **One multiplier** on an existing authored field. No new system, no new read, no new art. | **RECOMMENDED.** Cheapest, fully inside a gated contract, and it is literally "moins couvert".                                                         |
| **R2 — Route unlock**         | A new approach/entrance in the final level                                                 | New level authoring + art + a branch in level data + a second balance pass on that level  | **REJECTED for V1.** Expensive, and a route the set-piece unlocks quietly turns the set-piece into a soft gate — which fiction §5.3 and I both refuse. |
| **R3 — Narrative payoff**     | A `PARIS-MINUIT` UNE variant + the contact-sheet dialogue branch (b)                       | ~2 strings, zero systems (fiction §5.3)                                                   | **RECOMMENDED as a companion to R1**, never alone: a pure-cosmetic payoff for a 60 s skill set-piece reads as unpaid.                                  |

### 7.1 R1, specified

Applied to the shipped boss table (`spec-boss-qte-encounter.md` §4.3), **and to that field
only**:

| What the player brings back  | `SHIELDED` lull multiplier | Phase 1 / 2 / 3 lull |
| ---------------------------- | -------------------------- | -------------------- |
| Nothing (no master proof)    | **×1.00** (baseline)       | 2.00 / 1.60 / 1.20 s |
| Master proof only            | **×0.85**                  | 1.70 / 1.36 / 1.02 s |
| Master proof **+ ≥ 1 bonus** | **×0.75**                  | 1.50 / 1.20 / 0.90 s |

**Everything else in the boss contract is untouched:** `bossHp 24`, ring damage 2/1/0,
`maxBlownWindows 10`, `EXPOSED` durations, `telegraphLeadSeconds`, the per-phase drain. In
particular **no HP is removed** — the narrative invariant holds by construction.

**Why this is the right mechanical shape, not just the cheap one.** Shortening the lull does
**not** make the fight easier: `maxBlownWindows` is unchanged, so the efficiency bar the
player must clear (≈ 62 % of windows answered, boss spec §4.2) is **identical**. What changes
is that the openings come _sooner_: total cycle in phase 1 goes 3.6 s → 3.1 s (−14 %), and
the whole encounter shortens by roughly 13 s. The player's reward is **less waiting behind a
shield**, i.e. an enemy with less cover — the mechanic and the fiction say the same sentence.
A reward that lowered HP would have said "he is hurt", which is a lie a photograph cannot
tell.

**Floor (asserted, F10 §7):** the shipped boss assert `lull > telegraphLeadSeconds` must
still hold at the strongest multiplier — phase 3 worst case **0.90 s > 0.35 s** ✓, with the
tell unchanged. The multiplier must never be authored below **×0.70** (at which phase 3 lull
= 0.84 s, still 2.4× the tell).

**Never a gate.** The boss is fully beatable at ×1.00; the set-piece is skippable; no
progression depends on a photograph (fiction §5.3, ADR-0077 D1 "authored set-pieces").

**Bonus stacking is deliberately flat** (any one bonus gives the full ×0.75; a second adds
nothing mechanical). Rationale: two bonuses on a 6-frame roll would otherwise demand a
near-perfect run to feel complete, and completionist pressure on an optional set-piece is
how optional content becomes mandatory. The **second** bonus pays in fiction instead — R3's
UNE variant is gated on LA PLAQUE specifically (fiction §5.3), which is the right home for a
prestige reward.

---

## 7. Invariant floors — asserted in code against authored data, never trusted

House discipline (ADR-0035 D2, ADR-0034 G4/G5): every one of these is a unit-tested assert in
`createPhotoQte` (or equivalent) against the authored set-piece data, including any future
difficulty curve.

| ID      | Floor                                                                                                      | Value / rule                                                                        | Set-piece #1 (Stalingrad)                        | Why it exists                                                                                                                                                                   |
| ------- | ---------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------- | ------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **F1**  | Every instant's pose window ≥ `POSE_WINDOW_FLOOR`                                                          | **1.6 s**                                                                           | 4.5 / 3.8 / **2.9** ✓                            | Must fit tell-read + reframe + `FOCUS_HOLD` + click within human reaction.                                                                                                      |
| **F2**  | Every instant preceded by a tell ≥ `TELEGRAPH_LEAD_FLOOR`, strictly before `openAt`                        | **1.2 s**                                                                           | **1.8** ✓ (computed need 1.42 s)                 | No un-telegraphed instant ever ships. The zoom traverse must fit in the tell.                                                                                                   |
| **F3**  | Every instant (master **and** bonus) overlaps a cover window by ≥ `COVER_OVERLAP_FLOOR`                    | **1.2 s**                                                                           | 4.5 / **1.5** / 2.9 ✓                            | Guarantees a **zero-suspicion perfect run exists**. A bonus reachable only by risking the run is a trap, not a bonus. This is the anti-frustration floor that replaces a decay. |
| **F4**  | Every instant's valid focal band is non-empty, inside `[FOCAL_MIN, FOCAL_MAX]`, ratio ≥ `FOCAL_BAND_FLOOR` | **1.10×**                                                                           | 2.03 / 2.04 / **1.43** ✓                         | An instant you cannot legally frame is a bug shipped as difficulty.                                                                                                             |
| **F5**  | Sway peak ≤ share of containment slack at the instant's geometric mid-band focal                           | **≤ 60 %** (master) · **≤ 80 %** (bonus)                                            | 36 % / **51 %** / **75 %** ✓                     | The mandatory shot is never a coin flip; a bonus may be hard. Calibrates `SWAY_AMP_X`.                                                                                          |
| **F6**  | Film count                                                                                                 | `≥ instantCount + 2` **and** `≤ 8`                                                  | 6 (floor 5, ceiling 8) ✓                         | Lower ⇒ a single mistake is fatal; higher ⇒ the contact sheet needs pagination (UX §4.1).                                                                                       |
| **F7**  | Silent-shutter headroom `SUSPICION_MAX / SUSPICION_SHUTTER_EXPOSED`                                        | **≥ 2**                                                                             | 100/34 = 2.94 ⇒ **2 silent frames survivable** ✓ | Never spotted by a single mistake. Anti-"mort bullshit", non-lethal edition.                                                                                                    |
| **F8**  | Non-lethality                                                                                              | `SPOTTED` moves **no** energy, **no** score, ends **no** run, advances **no** quota | ✓                                                | ADR-0077 D7. Asserted as a zero-delta test, not a code-reading promise.                                                                                                         |
| **F9**  | `SHUTTER_ARM_SECONDS + FOCUS_HOLD ≤ 0.5 ×` shortest pose window                                            | 0.40 + 0.35 = 0.75 ≤ 1.45 ✓                                                         | ✓                                                | The arming rule must never eat the window it protects.                                                                                                                          |
| **F10** | Reward multiplier keeps the shipped boss assert `lull > telegraphLeadSeconds`, and is ≥ **×0.70**          | phase 3: 0.90 s > 0.35 s ✓                                                          | ✓                                                | The reward may never curve the boss's fairness floors away (§D7.1).                                                                                                             |
| **F11** | Determinism                                                                                                | no `Math.random`, no `Date.now`, no per-tick PRNG cursor, anywhere in the set-piece | ✓                                                | ADR-0077 guardrail; grep/lint-asserted like ADR-0034 Rev. 3.                                                                                                                    |

---

## 8. Consolidated value table (the deliverable)

**System constants** (Stalingrad-first, exactly as the hostage QTE's wander constants are —
promoted to authored fields only when a second set-piece needs to curve them):

| Constant                  | Default     |     | Constant                    | Default |
| ------------------------- | ----------- | --- | --------------------------- | ------- |
| `PHOTO_ESTABLISH_SECONDS` | 2.0 s       |     | `SWAY_AMP_X`                | 2.4 su  |
| `PHOTO_DEVELOP_SECONDS`   | 0.8 s       |     | `SWAY_AMP_Y`                | 1.35 su |
| `SHUTTER_ARM_SECONDS`     | 0.40 s      |     | `SWAY_LEG_DURATION`         | 0.55 s  |
| `FOCUS_HOLD`              | 0.35 s      |     | `SWAY_LEG_DURATION_RM`      | 1.30 s  |
| `FOCAL_MIN` / `FOCAL_MAX` | 35 / 300 mm |     | `MIN_LEG_DISPLACEMENT`      | 0.60 su |
| `ZOOM_TRAVERSE_SECONDS`   | 2.2 s       |     | `MAX_LEG_DISPLACEMENT`      | 3.20 su |
| `FRAME_MARGIN`            | 0.04        |     | `SUSPICION_MAX`             | 100     |
| `FILL_MIN`                | 0.45        |     | `SUSPICION_SHUTTER_EXPOSED` | +34     |
| `FILL_MAX` (derived)      | 0.92        |     | `SUSPICION_SHUTTER_COVERED` | 0       |
| `TELEGRAPH_LEAD_PHOTO`    | 1.8 s       |     | Floors F1–F11               | §7      |

**Authored per set-piece** (`photoQteSpec` — the data shape is `senior-architect`'s call):

| Key                | Stalingrad set-piece #1                                                             |
| ------------------ | ----------------------------------------------------------------------------------- |
| `scenePlate`       | quai de la Loire, `100 × 56.25 su` (art request: fiction §6)                        |
| `sceneDuration`    | 60.0 s                                                                              |
| `filmCount`        | 6                                                                                   |
| `swaySeed`         | integer, **pinned at stage-5 `verify`** (§9 AC10 — the ADR-0034 K-5 discipline)     |
| `coverWindows`     | period 21.0 s, first open 10.0 s, cover 7.0 s, tell 1.8 s ⇒ [10,17] [31,38] [52,59] |
| `subjectTrack`     | keyframed box (centre + size), interpolated, defined at every `t`                   |
| `instants`         | the three rows of §4.2 (`openAt`, `closeAt`, `role`, tell)                          |
| `rewardMultiplier` | ×0.85 master-only, ×0.75 master + ≥1 bonus (§D7.1)                                  |

---

## 9. Acceptance criteria (design VERIFY, stage 5 — Sacha playtests `verify` vs. these)

- **AC1 — State machine.** `ESTABLISHING` (2.0 s, forced-lowered, clock frozen) → `ACTIVE`
  → exactly one of `SPOTTED` / `ROLL_END` / `SCENE_END` → `DEVELOPING` → `CONTACT_SHEET` →
  `DONE`. Forward-only, no phase revisited. **All three** terminals reach the contact sheet.
- **AC2 — Posture.** Releasing the hold instantly (next tick) zeroes sway, freezes suspicion,
  disarms the shutter, and **retains the focal value**; re-raising restores that focal and
  arms the shutter only after 0.40 s. A shutter input while lowered or unarmed produces
  **zero** film, suspicion, sound and record (delta-asserted across the tick).
- **AC3 — Validation contract.** The five tests are conjunctive and evaluated against the
  drawn frame. Unit tests: a shot too wide (`fill < 0.45`) rejects; too tight (`fill > 0.92`
  or box clipping the 4 % margin) rejects; a shot fired before 0.35 s of continuous
  composition validity rejects as `blurred`; a valid shot outside every pose window rejects
  as `no-subject`; a valid shot inside L'ÉCHANGE returns `MASTER`.
- **AC4 — Two-beat feedback holds.** During `ACTIVE`, nothing on screen distinguishes an open
  instant from a dead beat, nor master from bonus (grep the frame's text + assert the bracket
  state depends only on T3/T4/T5). The click timbre and flash depend **only** on T5. The role
  is revealed **only** on the contact sheet.
- **AC5 — Zoom double trade-off is real.** In playtest: framing at `FILL_MAX` at ≥ 189 mm
  makes the focus hold break repeatedly under sway alone; framing at the sweet spot holds
  with light counter-steer; 300 mm on LA PLAQUE is measurably worse than 251 mm.
- **AC6 — Cadence and floors.** Windows/tells/cover match §4.2 within cadence tolerance;
  the F1–F11 floors are asserted in code against the authored data (unit test), not just
  observed. In particular **a zero-suspicion full-set run is achievable** (F3): master +
  both bonuses, needle never leaves rest.
- **AC7 — Suspicion economy.** Two silent shutters do **not** spot the player; the third
  does. A covered shutter moves the needle **zero**. The needle is frozen while lowered and
  while paused. No numeric suspicion value anywhere.
- **AC8 — Film economy.** Every armed release decrements film by exactly 1 regardless of
  verdict; `film → 0` ends the scene immediately; the 6-frame contact sheet fits one
  viewport with no pagination at both device classes.
- **AC9 — Reduced motion parity.** Under `prefers-reduced-motion: reduce`, the drift is slow,
  smooth and non-strobing, and the **valid-composition time fraction** at each instant's
  mid-band focal matches the standard mode within **±10 pp** over a 10 s raised sample
  (§3.4). Adjust `SWAY_LEG_DURATION_RM` only — one variable.
- **AC10 — Determinism.** Same `swaySeed` + same input sequence ⇒ byte-identical scene and
  sway path across two runs and across framerates/delta chunking; retry N is identical to
  retry 1. No `Math.random`/`Date.now` (grep-asserted). With the pinned seed, **each of the
  three instants presents at least one holdable 0.35 s composition window** — the K-5-style
  seed pin, confirmed empirically at `verify`.
- **AC11 — Non-lethality (F8).** Being spotted moves no energy, no score, ends no run,
  advances no quota, and returns the player to a checkpoint with a named reason on screen.
  Levels without a `photoQteSpec` are byte-for-byte unchanged (additive-and-optional law).
- **AC12 — Reward lever (if R1 is gated in).** The final boss's `SHIELDED` lull is ×0.85 /
  ×0.75 per the roll's contents; `bossHp`, damage, `EXPOSED`, tells and `maxBlownWindows` are
  **unchanged** (regression-asserted); the shipped `lull > telegraphLeadSeconds` assert still
  passes at the strongest multiplier; the boss is beatable at ×1.00 (the set-piece is not a
  gate).

Sacha playtests the built set-piece against AC1–AC12 and reports PASS/deviations to
`lead-game-designer` **before** the architect's integration review (pipeline stage 5).

---

## 10. Seams answered, and seams handed on

### 10.1 The four `ux-designer` seams — answered

| UX seam                                       | Answer                                                                                                           |
| --------------------------------------------- | ---------------------------------------------------------------------------------------------------------------- |
| Reduced-motion drift-curve calibration (§3.1) | §3.4: same amplitude, `SWAY_LEG_DURATION_RM = 1.30 s`, linear interpolation. Parity metric + AC9.                |
| Does `SPOTTED` reach the contact sheet? (§4)  | **Yes**, truncated, with `Réessayer`. §1.1, with rationale.                                                      |
| Hidden energy cost on abort? (§2.4)           | **None.** Energy and score are inert for the whole set-piece (§6.4, F8). The energy readout correctly stays off. |
| Film ceiling for a no-pagination sheet (§4.1) | **`filmCount = 6`**, ceiling asserted at 8 (F6). 2 × 3 grid.                                                     |

### 10.2 Back to `ux-designer` (Tony) — one reconciliation

**The AF brackets need a third state.** `dashed` (composition invalid) → `solid` (valid,
focus charging) → **`locked`** (focus held ≥ 0.35 s). Rationale in §2.3: without a lock read,
"focus tenu" is an invisible rule the player can only learn by burning film on dull clicks —
the frustration ADR-0077 explicitly asks stage 5 to hunt. It leaks nothing semantic. The
grayscale-distinguishability requirement (UX A6) now covers three states instead of two.

### 10.3 To `narrative-designer` (Yasmine) — synchronised

Her §5.4 invariant is adopted verbatim and made mechanical (§D7): the reward touches
`SHIELDED` lull only, never HP, never `maxBlownWindows`. The bonus tier is **flat** (any one
bonus = the full ×0.75) — so the second bonus's payoff should be **fictional**, which is
exactly where her `PARIS-MINUIT` UNE variant belongs (fiction §5.3), gated on LA PLAQUE. Her
§3.3 proposal (bonuses land inside cover, the master proof straddles the end of a rame) is
**adopted as tuning** and hardened into floor F3, extended to the bonuses too.

### 10.4 To `sound-designer` (Malik) — gameplay data, not dressing

The cover windows are **gameplay state**, not ambience: `[10,17] [31,38] [52,59]` s, with a
1.8 s audible approach before each. The mix must make "covered" and "silent" unmistakable
without looking at the needle, and the approach must be audible before it is visible. The
shutter's **crisp vs. dull** click is the sole mechanical feedback channel for T5 (§2.4) —
an attentive ear must hear the difference with the visuals off.

### 10.5 To `lead-art` (Nico) — the reads, not the style

1. The player must identify **the subject box** at a glance in the wide preview (where is the
   action) and again through the lens. 2. The **tell** of each instant must read as "something
   is about to happen" 1.8 s ahead, in B&W photocopy. 3. The **rame approaching** must read
   visually as well as audibly. 4. Three bracket states, three verdict stamps, all
   grayscale-distinguishable. Poses per fiction §6.

### 10.6 To `senior-architect` (Winston) — for the tech plan

New pure system in `src/game` (state machine, subject track, validation, sway closed form,
suspicion/film ledgers) + a render surface in `src/render`. My asks: (a) the set-piece must
be **tick-gated by the existing `paused` flag**, not run beside the loop (§6.3); (b) the
composition-validity bit and the master/bonus role must be **two independently computed
fields** the render never receives conflated (UX §2.3 + my §2.4); (c) `photoQteSpec === null`
levels stay byte-for-byte deterministic (AC11).

---

## 11. Hand-off — points to be validated by `lead-game-designer` (Karim)

**From:** `game-designer` (Sacha) · **To:** `lead-game-designer` (Karim), design gate.
**Requesting:** `VERDICT:` **PASS / PASS-WITH-CORRECTIONS / FAIL**, plus an explicit ruling
on each of the ten points below.

1. **The state machine, including the posture sub-machine (§D1).** Ratify `ESTABLISHING →
ACTIVE → {SPOTTED | ROLL_END | SCENE_END} → DEVELOPING → CONTACT_SHEET → DONE`, and in
   particular **D1.a** (the focal value survives a lower/raise — the free bail-out stays
   free) and **D1.b** (`SHUTTER_ARM_SECONDS = 0.40 s` as the anti-spam rule).
2. **`SPOTTED` reaches the contact sheet (§1.1).** This is a real call with a cost (one more
   branch to build) and a real reason (the player must not learn nothing from their worst
   run). It answers a UX open flag; ratify or overturn explicitly.
3. **The subject-track model (§2.1).** One continuous box for the whole scene, instants as
   intervals over it. It is what keeps the live brackets from leaking the secret. It also
   makes the art/authoring request bigger than "three key poses" — worth your eyes.
4. **Focus = a 0.35 s HOLD, not a velocity test (§2.3), and the third bracket state
   (§10.2).** The load-bearing mechanical decision of this spec, and the one that adds a
   state to an already-gated UX spec. Needs your ruling _and_ Tony's agreement.
5. **The tuning ladder (§3, §4.2).** `FILL_MIN 0.45` / `FRAME_MARGIN 0.04`, `SWAY_AMP_X 2.4
su`, the three focal bands (66–134 / 93–189 / 210–300 mm) and the shrinking windows
   (4.5 / 3.8 / 2.9 s). Is the master proof generous enough, and is LA PLAQUE allowed to be
   as hard as it is?
6. **`SUSPICION_SHUTTER_EXPOSED = +34` with NO decay (§5.2).** "Two silent frames survivable,
   spotted on the third" — a countable budget instead of a rate, with the anti-frustration
   guarantee moved into floor **F3** (every instant is reachable at zero suspicion). If you
   want a decay, F3 becomes redundant and the needle needs a number — say so now.
7. **`filmCount = 6` (§5.1).** Three instants + three spares, inside the fiction's 4–8 and
   UX's ≤ 8. Tighter is a punishment; looser breaks the one-glance contact sheet.
8. **The reward lever (§D7) — the ADR-0077 open question, with `narrative-designer`.**
   Recommend **R1 (`SHIELDED` lull ×0.85 / ×0.75) + R3 (narrative)**, reject R2 (route
   unlock). Ratify the invariant _"moins couvert, jamais moins de PV"_, the **flat** bonus
   tier, and **bonus-never-gate**. This one is jointly yours and `pm`'s (progression).
9. **The floors F1–F11 (§7).** In particular **F3** (cover overlap ≥ 1.2 s for _every_
   instant — my extension of the fiction's proposal) and **F5** (sway ≤ 60 % of slack on the
   master, ≤ 80 % on a bonus). These are the anti-frustration contract; they must be
   asserted in code, not trusted.
10. **Host level: Stalingrad, per the fiction (§4.1).** The whole cover cadence is derived
    from the métro. Relocating the first set-piece to Belliard for engineering velocity is a
    legitimate call but it **costs the free noise source** and forces an authored substitute
    (génératrice, a passing camion) with its own tell — the mechanic is source-agnostic, the
    _data_ in §4.2 is not. Yours and `senior-architect`'s.

**What I do NOT decide:** the fiction and cast (`narrative-designer`), controls,
accessibility envelope and HUD dress (`ux-designer`), the look (`lead-art`), the sound
palette (`sound-designer`), the lane split and data shape (`senior-architect`), gate-vs-bonus
in the progression (`lead-game-designer` + `pm`).

**After the verdict:** hand-off logged in `docs/handoffs/`, indexed in
`docs/agent-handoffs.md`; status reported in `docs/game-design/README.md`. If the gate
changes any ADR-0077 decision, that ADR is **superseded, not rewritten** (its own
Follow-up clause).
