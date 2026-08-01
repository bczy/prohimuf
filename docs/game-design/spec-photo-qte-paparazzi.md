# Spec — Photo QTE "paparazzi" : set-piece de preuve photographique (mécanique + tuning)

**Feature:** the non-lethal QTE family opened by ADR-0077 — Muf photographs a corrupt
authority figure through a telephoto lens instead of shooting him. This spec owns the
**mechanic, the tuning and the 3C**; it is the `game-designer` deliverable of the ADR-0077
design loop.
**Author:** `game-designer` (Sacha) · **Date:** 2026-08-01
**Status:** **Rev. 2** — round 2 of the ADR-0077 design gate. Answers the four blocking
corrections K-1…K-4 of `docs/game-design/design-gate-photo-qte.md`. Still **needs
`lead-game-designer` (Karim) DESIGN GATE PASS** before it reaches `senior-architect`
(TECH PLAN) and before any dev implements it.

| Rev.     | Date       | What changed                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    |
| -------- | ---------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1        | 2026-08-01 | Initial spec.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   |
| **2**    | 2026-08-01 | **K-1** F5 re-derived against **effective** slack (formula pinned in §3.3), `SWAY_AMP_X` 2.4 → **2.00 su** + dependent constants, F5 becomes a **three-leg** floor (sway share / untracked grace / pan authority), new `PAN_RATE_MAX`. **K-2** the full **9-keyframe `subjectTrack` table** is authored (§2.5) and floor **F12** added in three legs. **K-3** F10 becomes a **compound** floor against the gated `SHIELD_BREAK_LULL_CUT`, `rewardMultiplier` is **phase-scoped and Niveau-Final-scoped**, tiers re-tuned ×0.90/×0.80, R1 transcribed as **AMENDMENT A1** (§D7.2). **K-4** the **decline exit** is specified (§1.3) and the ≤ 2 min attempt budget becomes floor **F13** + AC13. |
| ratified | —          | Carried unchanged from round 1 per the gate: `SPOTTED` → contact sheet, `SUSPICION_SHUTTER_EXPOSED +34` with **no decay**, `filmCount = 6`, `FOCUS_HOLD = 0.35 s` HOLD model, D1.a/D1.b, host level **Stalingrad**, floors F1/F2/F3/F4/F6/F7/F8/F9/F11. **Not re-opened here.**                                                                                                                                                                                                                                                                                                                                                                                                                 |

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

| Phase           | Enter when                         | What runs                                                                                                                                       | Exit                                               |
| --------------- | ---------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------- |
| `ESTABLISHING`  | set-piece triggers                 | The wide plate holds, unzoomed. Camera **forced LOWERED**, shutter inert, `sceneClock` **frozen at 0**, suspicion frozen.                       | after `PHOTO_ESTABLISH_SECONDS = 2.0 s` → `ACTIVE` |
| `ACTIVE`        | —                                  | `sceneClock` runs; the authored cadence (§3) plays; the posture sub-machine (§1.2) is live.                                                     | one of the three terminal conditions below         |
| `SPOTTED`       | `suspicion ≥ SUSPICION_MAX`        | Targets scatter. Terminal, **non-lethal** (D7).                                                                                                 | → `DEVELOPING`                                     |
| `ROLL_END`      | `film === 0` (after the decrement) | The roll is finished; the scene is over for Muf whatever happens on the quai.                                                                   | → `DEVELOPING`                                     |
| `SCENE_END`     | `sceneClock ≥ SCENE_DURATION`      | The berline is gone. The passive-failure route: a player who never presses ends here.                                                           | → `DEVELOPING`                                     |
| `DEVELOPING`    | any terminal                       | `PHOTO_DEVELOP_SECONDS = 0.8 s` mechanical beat (wind-on / cut to black). No input.                                                             | → `CONTACT_SHEET`                                  |
| `CONTACT_SHEET` | —                                  | The verdict (D8). Every frame shot is stamped (§4.4).                                                                                           | player CTA → `DONE`                                |
| `DONE`          | —                                  | **Two exits, always** (§1.3): `Continuer`/`Décliner` **leaves** the set-piece and resumes the run; `Réessayer` restarts it from the checkpoint. | run resumes, or `ESTABLISHING` on retry            |

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

### 1.3 The exits from `DONE` — implementing "bonus, jamais gate" (**K-4**)

**Round 1 hole, and it was a real one.** Rev. 1 offered `Continuer` on a master proof and
`Réessayer` otherwise. A failing player therefore had exactly one button and it said _do it
again_ — which makes the set-piece a gate in the built screen, whatever §D7 and fiction §5.3
assert in prose. An invariant that is only written down is not implemented.

**Decision: `DONE` always offers exactly two controls, and one of them always leaves.**

| Roll outcome                                                 | Leaving control          | Second control | Boss state carried out                     |
| ------------------------------------------------------------ | ------------------------ | -------------- | ------------------------------------------ |
| Contains a `MASTER` frame                                    | **`Continuer`**          | `Réessayer`    | `photoOutcome = master` / `master+bonus`   |
| No `MASTER` frame (incl. `SPOTTED`, `ROLL_END`, `SCENE_END`) | **`Décliner`** (decline) | `Réessayer`    | `photoOutcome = none` ⇒ **×1.00 baseline** |

- **The leaving control is the default/primary focus** on both branches — including the
  failure branch. Retry is offered, never imposed. (Copy for both labels is Yasmine's, gate
  condition F-1; the fiction already writes the decline as variant (c) _« Alors ils remettront
  ça. Ils remettent toujours ça. »_ — an acceptance, not a retry.)
- **`Décliner` is one press, and the run continues** from where the set-piece interrupted it,
  with the Stalingrad delivery intact and the Niveau Final boss at baseline. No penalty, no
  energy, no score, no quota (§6.4, F8). Declining is a legal way to play the game.
- **Retry is not rate-limited**, but it is **budgeted**: floor **F13** caps one un-skipped
  attempt at ≤ 90 s of authored time and AC13 measures the whole attempt (briefing → sheet →
  press) at **≤ 2 min**. That is what keeps an optional 60 s scene from being fronted onto a
  3-5 min mission as an unbounded loop.
- **`PHOTO_BRIEFING_MAX_SECONDS = 25.0 s`, skippable at any time** (the copy is fiction's,
  the cap is tuning). `CONTACT_SHEET_READ_BUDGET = 30.0 s` is a **design** budget measured at
  playtest, **not** an auto-dismiss timer: a verdict screen that closes itself is hostile and
  would defeat the whole two-beat feedback.

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

**Rev. 2 — the gate found the leak this model re-opens by the back door (K-2b), and it is
real.** A track that interpolates freely between three different subjects makes the brackets
travel toward the _next_ subject before that subject's authored tell fires. The fix is not to
abandon the continuous track (it is the right model) but to **constrain when the track is
allowed to move**:

> **The track is piecewise-constant except during a telegraph.** Between the close of an
> instant and the tell of the next one, `subjectTrack` does **not change at all** — same
> centre, same size. All transit happens inside `[tell(n), openAt(n)]`, i.e. exactly the
> 1.8 s the tell already exists to spend.

Three consequences, all of them good:

1. **The brackets' motion becomes one of the tell's channels** instead of a leak. The player
   who notices the frame start to travel learns _at the tell_, never before it.
2. **No retro-leak either.** The box does **not** relax at `closeAt(n)`, so the brackets never
   announce "a moment just ended" — which would have leaked T2 one beat late. It is why the
   authored staging owes a **hold pose** on every dead beat (§2.5, art constraint).
3. **A transit can never produce a verdict.** F2 guarantees `tell(n) < openAt(n)` strictly,
   so T2 is false for the whole transit: any release fired mid-transit is `no-subject`
   whatever the brackets say. The interpolated box during a tell is a travelling _read_ that
   leads the eye, never a validation claim — which is why F12(1) is asserted at keyframes.

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

### 2.5 The authored `subjectTrack` keyframe table (**K-2a** — set-piece #1) {#keyframes}

Staging on the `100 × 56.25 su` plate, quai de la Loire under the viaduct (fiction §2, §3.1):
quai ground line at `y = 6.0`; the berline parked under the viaduct and departing **to the
right**; the two men meeting mid-plate; the pillar the Commandant waits behind at `x ≈ 65`.
Standing men are `13.5 su` tall (24 % of frame height).

**Linear interpolation between consecutive keyframes, on all four components** (`cx`, `cy`,
`w`, `h`). Nine keyframes, defined and finite on the whole of `[0, 60.0]`:

| K   | `t` (s)   | centre `(cx, cy)` su | size `(w × h)` su | Drawn subject the box is the AABB of                                  | Segment                   |
| --- | --------- | -------------------- | ----------------- | --------------------------------------------------------------------- | ------------------------- |
| K0  | **0.00**  | (65.00, 12.75)       | **6.00 × 13.50**  | the Commandant alone, in the pillar's shadow                          | **A** hold — pre-roll     |
| K1  | **9.20**  | (65.00, 12.75)       | 6.00 × 13.50      | idem (unchanged) — last frame before tell #1                          | A end · **tell #1 fires** |
| K2  | **11.00** | (54.00, 12.75)       | **24.00 × 13.50** | the two men facing each other, full figures, car door open            | **B** hold · `openAt` #1  |
| K3  | **34.70** | (54.00, 12.75)       | 24.00 × 13.50     | idem — dead-beat **hold pose** (they stand and talk)                  | B end · **tell #2 fires** |
| K4  | **36.50** | (54.00, 14.72)       | **17.00 × 9.56**  | the two **faces** + the two **hands** + the envelope                  | **C** hold · `openAt` #2  |
| K5  | **51.20** | (54.00, 14.72)       | 17.00 × 9.56      | idem — dead-beat **hold pose** (envelope pocketed, heads still close) | C end · **tell #3 fires** |
| K6  | **53.00** | (62.00, 9.00)        | **7.50 × 4.22**   | the berline's rear plate, entering the lamppost's light               | **D** · `openAt` #3       |
| K7  | **55.90** | (71.00, 9.00)        | 7.50 × 4.22       | idem, plate leaving the light                                         | D · `closeAt` #3          |
| K8  | **60.00** | (83.70, 9.00)        | 7.50 × 4.22       | the berline continuing out of the plate at the same speed             | **E** · `SCENE_END`       |

Derived, and consistent with §4.2 (no value moved): K6→K7 is `9.00 su / 2.90 s = **3.103
su/s**`; the three transits are exactly `[9.20, 11.00]`, `[34.70, 36.50]`, `[51.20, 53.00]`
— the three `TELEGRAPH_LEAD_PHOTO = 1.8 s` telegraphs; the track is **constant** on
`[15.50, 34.70]` and on `[40.30, 51.20]`, which is F12(2) satisfied by construction.

**Why these centres.** K2→K4 keeps `cx = 54.00` and only shrinks the box while lifting `cy`
by 1.97 su: the master proof's telegraph is a **near-pure zoom-in** (94 → 132 mm, fill 0.64),
which is the cheapest transit in the scene and the right generosity for the mandatory shot.
K4→K6 is the expensive one — 9.83 su of pan **and** 132 → 251 mm of zoom in 1.8 s — which is
what makes LA PLAQUE the mastery test (§4.3 budgets it).

**Two constraints this table hands to `lead-art` / `concept-artist` (reads, not style).**

1. **Named parts, not "the subject".** Each keyframe's box is the AABB of an **enumerated set
   of drawn elements** — for K4 it is `{Commandant's head, manteau-clair's head, both hands,
envelope}`, not "the pair". The photo verb is a crop by nature; the honesty requirement is
   that the crop be **authored and enumerable**, so a dev and a reviewer can check it.
2. **Hold poses on dead beats.** K2→K3 (19.2 s) and K4→K5 (14.7 s) require key poses whose
   AABB does not move: idle animation must stay inside `SUBJECT_BOX_TOLERANCE` (§7, F12). A
   dead beat where the actors drift is a leak with extra steps.

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

| Constant               | Default (**Rev. 2**)  | Rev. 1 | Rationale                                                                                                                                                                                                   |
| ---------------------- | --------------------- | ------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `SWAY_AMP_X`           | **2.00 su**           | 2.4    | Peak displacement of the viewfinder centre. Re-calibrated by F5a against **effective** slack (below): 39 % / **54 %** / **75 %** at the three sweet spots, under the 60 % (master) / 80 % (bonus) ceilings. |
| `SWAY_AMP_Y`           | **1.125 su**          | 1.35   | `= SWAY_AMP_X / 1.7778`. The plate, the viewfinder and all three instant boxes are 16:9, so this makes the sway ellipse isotropic **in frame fractions** and F5 identical on both axes (verified below).    |
| `SWAY_LEG_DURATION`    | **0.55 s**            | =      | Unchanged. Slower than the hostage wander's 0.38 s: a tremor the player counter-steers, not a target that dodges. A leg fits inside every pose window.                                                      |
| `MIN_LEG_DISPLACEMENT` | **0.50 su**           | 0.60   | Anti-jitter floor (re-hash on collision), rescaled with the amplitude (`× 2.00/2.4`). Below it the drift reads as a rendering glitch.                                                                       |
| `MAX_LEG_DISPLACEMENT` | **2.60 su**           | 3.20   | Rescaled with the amplitude. Caps a leg's peak speed at `1.5 × 2.60 / 0.55 = **7.09 su/s**` (smoothstep), which is what F5c sizes the pan against.                                                          |
| `PAN_RATE_MAX`         | **12.0 su/s** _(new)_ | —      | Viewfinder pan authority at full input. Sized by F5c: `≥ 3.103` (fastest subject) `+ 7.09` (peak sway) `= 10.19`, with 18 % headroom. Also covers the worst authored re-frame (9.83 su, §2.5) in 0.82 s.    |

#### 3.3.a — Effective containment slack: the formula, pinned so it cannot drift again (**K-1**)

Rev. 1 measured sway against the **raw** slack `(1 − fill)/2 × fovW` and forgot that T3 has
**already spent `FRAME_MARGIN` of it**. The margin is not a separate rule that happens to sit
nearby — it is a subtraction from the very room the sway is allowed to use. The room actually
available to the drift, per side, is:

```
fovW(f)  = 3500 / f                                   (su)
s_eff(f) = (fovW(f) − B.w) / 2  −  FRAME_MARGIN × fovW(f)      (su, per side)
```

and the same relation on `y` with `fovH = fovW / 1.7778`, `B.h = B.w / 1.7778` — so
`s_eff_y = s_eff_x / 1.7778`, exactly the ratio of `SWAY_AMP_Y` to `SWAY_AMP_X`. **One axis
proves both.** The old figures (36 / 51 / 75 %) were the raw-slack numbers; two of them were
measured against a budget already spent, and the breach fell on the mandatory shot.

Re-derived at each instant's geometric mid-band focal, with `FRAME_MARGIN = 0.04` and
`SWAY_AMP_X = 2.00 su`:

| Instant                | `f`    | `fovW`   | raw slack | margin  | **`s_eff`** | **sway share** | F5a ceiling | Verdict           |
| ---------------------- | ------ | -------- | --------- | ------- | ----------- | -------------- | ----------- | ----------------- |
| ARRIVÉE (bonus)        | 94 mm  | 37.23 su | 6.62 su   | 1.49 su | **5.13 su** | **39.0 %**     | ≤ 80 %      | ✓ (teacher)       |
| L'ÉCHANGE (**master**) | 132 mm | 26.52 su | 4.76 su   | 1.06 su | **3.70 su** | **54.1 %**     | ≤ 60 %      | ✓ (5.9 pp margin) |
| LA PLAQUE (bonus)      | 251 mm | 13.94 su | 3.22 su   | 0.56 su | **2.66 su** | **75.1 %**     | ≤ 80 %      | ✓ (4.9 pp margin) |

**Why 2.00 su and not the 2.13 su ceiling.** `min(0.60 × 3.70, 0.80 × 2.66) = 2.131 su` does
close both breaches — on the nose, with **zero** headroom. A fairness floor satisfied at
0.0 % margin is a floor that the next re-author of a subject box silently breaks (shrink
LA PLAQUE's plate by 4 %, and it is back below its own ceiling). **2.00 su** is the round
value that keeps ≈ 5 pp of headroom on both binding cells, costs the master 3 pp of
difficulty against Rev. 1's _intended_ 51 % (it was never 51 %, it was 65 %), and leaves the
sweet-spot geometry visibly tense at the long end.

**How the two sides bite together (the point of D3), re-derived.**

- Frame **greedily tight** (fill → `FILL_MAX = 1 − 2 × FRAME_MARGIN`): `s_eff = 0` **by
  construction**, at every focal — the raw slack _is_ the margin. Any sway at all breaks the
  hold. Tight framing is unusable without a rule saying so.
- Frame **greedily wide**: `FILL_MIN` rejects the shot outright.
- Frame at the **sweet spot** (mid-band, fill ≈ 0.64): `s_eff = 3.70 su` vs. 2.00 su of
  sway — holdable with light counter-steer.
- Push the **focal itself** past ≈ **258 mm** on the plaque and the sway share crosses 80 %;
  at `FOCAL_MAX = 300 mm`, `s_eff = 1.62 su < 2.00 su` ⇒ **124 %**: containment cannot be held
  through a full sway leg at all. The top of the legal band is self-punishing, and the real
  sweet spot sits at ≈ 251 mm — which is where F5a is evaluated, on purpose (§7).

That is D3's "double trade-off" as a single geometric consequence, not two bolted rules.

#### 3.3.b — The moving subject's own share, and what the player owes it

At LA PLAQUE the box travels **3.103 su/s**, so over one `FOCUS_HOLD` it crosses
`1.085 su = 40.8 %` of `s_eff` on its own. A player who acquires the frame perfectly centred
and then **does not pan at all** faces a combined worst case of
`(2.00 + 1.085) / 2.66 = **115.8 %**` — i.e. the hold **cannot** be completed without
tracking. That is the authored intent (fiction §3.2: the most useful bonus is the hardest),
and F5b now bounds it instead of leaving it unstated. The demand is a number, not an
adjective:

```
v_required = (combined − 1.00) × s_eff / FOCUS_HOLD = 0.158 × 2.66 / 0.35 = 1.20 su/s
```

**The player must pan at ≥ 1.20 su/s — 39 % of the car's own speed — to hold the plate.** So:
tracking is required, _perfect_ tracking is not, and the pan authority (`PAN_RATE_MAX 12.0
su/s`, F5c) is 10× what the minimum demands and still beats subject + peak sway simultaneously.
The master proof's subject is static, so its combined budget is its sway budget: 54.1 %.

### 3.4 Reduced motion (answering UX §3.1's tuning seam)

**Decision: same amplitude, longer legs, linear interpolation.**

| Constant            | Standard            | Reduced motion              |
| ------------------- | ------------------- | --------------------------- |
| `SWAY_AMP_X / _Y`   | **2.00 / 1.125 su** | **identical**               |
| `SWAY_LEG_DURATION` | 0.55 s              | **1.30 s** (`_RM`)          |
| Interpolation       | smoothstep          | **linear** (constant speed) |

(Rev. 2: amplitudes follow the K-1 retune; the RM peak leg speed becomes
`2.60 / 1.30 = 2.00 su/s`, so F5c holds in both modes with a wider margin in RM.)

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

`TELEGRAPH_LEAD_PHOTO = 1.8 s` for all three (tell → window open). **The boxes in that last
column are not authored here** — they are the values `subjectTrack(t)` already holds on each
instant's segment, read off the keyframe table (§2.5, K2/K4/K6-K7). One source, no duplicate.

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

The box translates x 62 → 71 su across its 2.9 s window (**3.103 su/s** ≈ 22 %/s of the frame
width at the sweet spot — keyframes K6/K7, §2.5). Held still, the viewfinder loses containment
in ≈ 0.86 s, so the shot **requires tracking**; §3.3.b puts the exact demand at
**≥ 1.20 su/s of pan**, 10 % of the available authority. Because focus is positional (D2.a),
panning with the car costs nothing — it is a tracking skill, not an impossible one.

The transition into it is the scene's most expensive: **9.83 su of pan** (K4 → K6) **and**
132 → 251 mm of zoom, inside `TELEGRAPH_LEAD_PHOTO = 1.8 s`. Budget: pan `9.83 / 12.0 =
0.82 s`, zoom traverse `0.66 s` (concurrent inputs, not additive), then `FOCUS_HOLD 0.35 s`
inside the 2.9 s window. It fits, with the pan as the critical path — which is why
`PAN_RATE_MAX` is a tuned value and not an afterthought. Combined with the band's 1.43×
latitude and the top-of-range sway, this is the hardest frame in the set-piece, which is
exactly its authored role (bonus, never mandatory).

### 4.4 The contact sheet (verdict surface — mechanics only; look is `lead-art`'s)

One thumbnail per frame shot, in shot order, stamped by verdict (UX §4.2): `MASTER` /
`BONUS` / `REJECTED` (+ the `rejectReason` from §2.2 so the reject stamp says _why_: flou /
hors cadre / trop large / trop serré / rien à voir). **Two CTAs, always** — the leaving one
(`Continuer` with a master frame, **`Décliner`** without) plus `Réessayer` (§1.3, K-4). The
sheet is shown on **all three** terminals, including `SPOTTED` (§1.1).

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

### D7.1 R1, specified (**Rev. 2 — K-3**)

**What round 1 got wrong.** R1 was checked against the boss's tell **alone**, ignoring the
already-gated `SHIELD_BREAK_LULL_CUT = 0.5 s` of
[`spec-boss-shield-break-tempo-shot.md`](spec-boss-shield-break-tempo-shot.md) §6-B (ADR-0060),
which cuts the **next** lull after a shield break. Composed, Rev. 1's stated floor of ×0.70
put phase 3's post-break lull at **0.34 s against a 0.35 s tell** — at which point that spec's
own clamp fires and **silently eats the shield-break reward**: the player pays a 1 HP chip for
a compression that no longer happens. Even the shipped ×0.75 left 0.40 s post-break against a
0.35 s tell, i.e. **0.05 s** of non-tell recovery, which is not recovery. Two gated fairness
contracts, one authored collision.

#### 7.1.a — `ε`, pinned to the gated spec instead of invented

The compound floor needs a minimum **residual recovery that is not tell**. I do not invent it:
I pin it to the worst headroom the shield-break lever **already ships and was already gated
at** — phase 3, `1.20 − 0.5 = 0.70 s` lull against a `0.35 s` tell:

> **`LULL_RESIDUAL_FLOOR (ε) = 0.35 s`.** _The photo reward may never leave a post-break lull
> with less breathing room than ADR-0060 already ships without it._

That framing is deliberate: it makes ε non-negotiable design-side (it is a quotation, not a
preference), and it means R1 can only ever be **additive** to the shield-break experience.

#### 7.1.b — What ε forces, and the decision it forces

Solving `m × lull(p) − 0.5 ≥ telegraphLead(p) + 0.35` per phase:

| Phase          | lull   | tell   | minimum legal `m`          |
| -------------- | ------ | ------ | -------------------------- |
| 1 — pressure   | 2.00 s | 0.45 s | `1.30 / 2.00` = **×0.650** |
| 2 — pressure   | 1.60 s | 0.40 s | `1.25 / 1.60` = **×0.781** |
| 3 — **frenzy** | 1.20 s | 0.35 s | `1.20 / 1.20` = **×1.000** |

**Phase 3 admits no compression at all.** A _uniform_ multiplier is therefore capped at ×1.00
— i.e. the reward is arithmetically dead — unless ε is shaved to ≤ 0.05 s, which is the
non-recovery the gate already refused. So the honest reading is not "pick a smaller multiplier"
but: **phase 3's lull is already at the fairness floor, and it is not this reward's playground.**

> **DECISION — the multiplier is PHASE-SCOPED: it applies to phases 1 and 2 only; phase 3 is
> always ×1.00.**

It is also the better design, not merely the legal one: the frenzy is the phase where the boss
barely hunkers at all, so "he can't stay behind cover" has almost nothing left to say there,
and stacking two compressions on the tightest beat of the encounter is exactly how a reward
turns into a difficulty spike. The reward moves the **waiting**, not the **climax**.

**Rejected alternative — non-cumulative composition** (`lull = min(m × lull, lull − CUT)`, the
stronger lever wins). It closes the collision just as cleanly and preserves both gated
contracts verbatim, but it makes the photo reward **invisible on every lull that follows a
shield break** (the cut dominates in all three phases at any `m ≥ 0.79`) — a reward that
disappears precisely when the player is playing well. Recorded so it is not reinvented; if
Karim prefers it, it is a one-line swap in F10 and the tiers below revert to a uniform value.

#### 7.1.c — The tiers

| What the player brings back   | multiplier (**phases 1-2 only**) | P1 / P2 / P3 lull  | after a shield break (−0.5 s) | residual recovery vs. tell |
| ----------------------------- | -------------------------------- | ------------------ | ----------------------------- | -------------------------- |
| Nothing / **declined** (§1.3) | **×1.00** (baseline)             | 2.00 / 1.60 / 1.20 | 1.50 / 1.10 / 0.70            | 1.05 / 0.70 / 0.35 ✓       |
| Master proof only             | **×0.90**                        | 1.80 / 1.44 / 1.20 | 1.30 / 0.94 / 0.70            | 0.85 / 0.54 / 0.35 ✓       |
| Master proof **+ ≥ 1 bonus**  | **×0.80**                        | 1.60 / 1.28 / 1.20 | 1.10 / **0.78** / 0.70        | 0.65 / **0.38** / 0.35 ✓   |

Binding cell: **phase 2 at ×0.80**, 0.38 s of residual against ε = 0.35 s. The wall is
`m ≥ ×0.781` — written down here so any future re-tune sees it before it hits it. (Rev. 1's
×0.85 / ×0.75 are **withdrawn**: ×0.75 breaches phase 2's own compound floor.)

**Everything else in the boss contract is untouched:** `bossHp 24`, ring damage 2/1/0,
`maxBlownWindows 10`, `EXPOSED` durations, `telegraphLeadSeconds`, the per-phase drain, and
**`SHIELD_BREAK_LULL_CUT` and its clamp, byte-for-byte**. In particular **no HP is removed** —
the narrative invariant holds by construction.

**Scope pin (K-3): `rewardMultiplier` targets the DATA, not "the boss".** It applies to the
**Niveau Final** `bossQteSpec` **only**. The **Belliard** encounter is byte-untouched — it also
precedes the set-piece in progression, so this costs nothing, but it is written down because
the shield-break story's own K-2 already burned this crew once on a system constant that
reached _both_ live encounters. Implementation shape: a field on the Niveau Final authored row,
never a module constant.

**Why this is the right mechanical shape, not just the cheap one.** Shortening the lull does
**not** make the fight easier: `maxBlownWindows` is unchanged, so the efficiency bar the
player must clear (≈ 62 % of windows answered, boss spec §4.2) is **identical**. What changes
is that the openings come _sooner_ in the two phases where he actually hides: phase 1's cycle
goes 3.6 s → 3.2 s (−11 %) at the strongest tier. The player's reward is **less waiting behind
a shield**, i.e. an enemy with less cover — the mechanic and the fiction say the same sentence.
A reward that lowered HP would have said "he is hurt", which is a lie a photograph cannot tell.

**Advisory A-1, answered.** The gate asks whether lever 2 (décor prop) still arms inside a
compressed lull. Under the phase-scoped decision the worst compressed lull is **phase 2 at
1.28 s** (0.94 s after a shield break) versus baseline 1.60 s (1.10 s) — a −0.32 s / −0.16 s
change on a beat that already survives the gated −0.5 s cut. I assert no new arming failure,
and hand it to `senior-architect` as a **regression assertion to add**, not a design change:
_lever 2's arming window must be re-checked against the compressed row_ (AC12).

### D7.2 AMENDMENT A1 to the gated shield-break spec (**K-3**)

`spec-boss-shield-break-tempo-shot.md` is **GATED** (ADR-0060). R1 composes with its §6-B
lever, so it amends it. **I do not edit that file.** The block below is the amendment,
verbatim-transcribable by whoever holds that spec's lane, numbered in its own series (it has
no prior amendment):

> ### AMENDMENT A1 — composition with the photo-proof lull multiplier — proposed 2026-08-01
>
> _Source: `spec-photo-qte-paparazzi.md` §D7.1 (Rev. 2), design gate `design-gate-photo-qte.md`
> K-3. Amends §6-B and the §6-B headroom table. No decision of this spec is reversed._
>
> 1. The Niveau Final `bossQteSpec` gains an authored **`rewardMultiplier`** (`×1.00` default),
>    applied to `shieldedLull` in **phases 1 and 2 only**; phase 3 is always `×1.00`. Belliard
>    is untouched.
> 2. **Order of operations is fixed:** `lull_effective = rewardMultiplier × shieldedLull`, THEN
>    `SHIELD_BREAK_LULL_CUT` is subtracted from that value, THEN the existing
>    `shieldedLull > telegraphLeadSeconds` clamp applies. The multiplier never bypasses the
>    clamp and the clamp never bypasses the multiplier.
> 3. **New compound floor, asserted in code against the runtime row** (not trusted from data):
>    `rewardMultiplier × shieldedLull(p) − SHIELD_BREAK_LULL_CUT ≥ telegraphLeadSeconds(p) +
LULL_RESIDUAL_FLOOR`, with **`LULL_RESIDUAL_FLOOR = 0.35 s`** — pinned to the worst
>    headroom this spec's own §6-B table already ships (phase 3: `0.70 − 0.35`). This is the
>    assert that keeps the −0.5 s cut from ever being silently eaten by the clamp.
> 4. Legal `rewardMultiplier` values are therefore `≥ ×0.781` (phase 2 binds). Shipped tiers:
>    ×1.00 / ×0.90 / ×0.80.
> 5. §6-B's "at the shipped table values the floor never binds" remains true **at ×1.00** and
>    must be re-read as "never binds at any legal `rewardMultiplier`" once point 3 ships.
>
> **No re-gate of this spec is required** if the transcription is verbatim (gate protocol,
> same as AMENDMENT A2 of `spec-boss-qte-differentiation.md`, 2026-07-20).

**Never a gate — and now implemented as such.** The boss is fully beatable at ×1.00; the
set-piece is skippable; the contact sheet always offers a **decline** that leaves at ×1.00 in
one press (§1.3, K-4); no progression depends on a photograph (fiction §5.3, ADR-0077 D1
"authored set-pieces").

**Bonus stacking is deliberately flat** (any one bonus gives the full ×0.80; a second adds
nothing mechanical). Rationale: two bonuses on a 6-frame roll would otherwise demand a
near-perfect run to feel complete, and completionist pressure on an optional set-piece is
how optional content becomes mandatory. The **second** bonus pays in fiction instead — R3's
UNE variant is gated on LA PLAQUE specifically (fiction §5.3), which is the right home for a
prestige reward. (Gate condition F-2: the UNE variant itself is deferred out of V1 to `pm`.)

---

## 7. Invariant floors — asserted in code against authored data, never trusted

House discipline (ADR-0035 D2, ADR-0034 G4/G5): every one of these is a unit-tested assert in
`createPhotoQte` (or equivalent) against the authored set-piece data, including any future
difficulty curve.

| ID      | Floor                                                                                                                                                                                       | Value / rule                                                                                                  | Set-piece #1 (Stalingrad)                                             | Why it exists                                                                                                                                                                   |
| ------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **F1**  | Every instant's pose window ≥ `POSE_WINDOW_FLOOR`                                                                                                                                           | **1.6 s**                                                                                                     | 4.5 / 3.8 / **2.9** ✓                                                 | Must fit tell-read + reframe + `FOCUS_HOLD` + click within human reaction.                                                                                                      |
| **F2**  | Every instant preceded by a tell ≥ `TELEGRAPH_LEAD_FLOOR`, strictly before `openAt`                                                                                                         | **1.2 s**                                                                                                     | **1.8** ✓ (computed need 1.42 s)                                      | No un-telegraphed instant ever ships. The zoom traverse must fit in the tell.                                                                                                   |
| **F3**  | Every instant (master **and** bonus) overlaps a cover window by ≥ `COVER_OVERLAP_FLOOR`                                                                                                     | **1.2 s**                                                                                                     | 4.5 / **1.5** / 2.9 ✓                                                 | Guarantees a **zero-suspicion perfect run exists**. A bonus reachable only by risking the run is a trap, not a bonus. This is the anti-frustration floor that replaces a decay. |
| **F4**  | Every instant's valid focal band is non-empty, inside `[FOCAL_MIN, FOCAL_MAX]`, ratio ≥ `FOCAL_BAND_FLOOR`                                                                                  | **1.10×**                                                                                                     | 2.03 / 2.04 / **1.43** ✓                                              | An instant you cannot legally frame is a bug shipped as difficulty.                                                                                                             |
| **F5**  | **Three legs — see §7.1 below.** Sway share of **effective** slack · untracked grace on a moving subject · pan authority                                                                    | a: ≤ 60 % master / ≤ 80 % bonus · b: ≤ 100 % master / ≤ 130 % bonus · c: `PAN_RATE_MAX ≥ v_max + v_sway_peak` | a: 39 / **54** / **75 %** ✓ · b: 54 / **116 %** ✓ · c: 12.0 ≥ 10.19 ✓ | The mandatory shot is never a coin flip; a bonus may be hard; and "hard" never means "geometrically impossible". Calibrates `SWAY_AMP_X` and `PAN_RATE_MAX`.                    |
| **F6**  | Film count                                                                                                                                                                                  | `≥ instantCount + 2` **and** `≤ 8`                                                                            | 6 (floor 5, ceiling 8) ✓                                              | Lower ⇒ a single mistake is fatal; higher ⇒ the contact sheet needs pagination (UX §4.1).                                                                                       |
| **F7**  | Silent-shutter headroom `SUSPICION_MAX / SUSPICION_SHUTTER_EXPOSED`                                                                                                                         | **≥ 2**                                                                                                       | 100/34 = 2.94 ⇒ **2 silent frames survivable** ✓                      | Never spotted by a single mistake. Anti-"mort bullshit", non-lethal edition.                                                                                                    |
| **F8**  | Non-lethality                                                                                                                                                                               | `SPOTTED` moves **no** energy, **no** score, ends **no** run, advances **no** quota                           | ✓                                                                     | ADR-0077 D7. Asserted as a zero-delta test, not a code-reading promise.                                                                                                         |
| **F9**  | `SHUTTER_ARM_SECONDS + FOCUS_HOLD ≤ 0.5 ×` shortest pose window                                                                                                                             | 0.40 + 0.35 = 0.75 ≤ 1.45 ✓                                                                                   | ✓                                                                     | The arming rule must never eat the window it protects.                                                                                                                          |
| **F10** | **COMPOUND** with the gated `SHIELD_BREAK_LULL_CUT` (§D7.2 amendment): `m × lull(p) − 0.5 ≥ telegraphLead(p) + ε`, `ε = 0.35 s`; `m` applies to **phases 1-2 of the Niveau Final row only** | `m ≥ ×0.781` (phase 2 binds) · shipped ×1.00 / ×0.90 / ×0.80                                                  | residual 0.65 / **0.38** / 0.35 s ✓                                   | The reward may never curve the boss's fairness floors away **nor silently eat a second gated lever** (§D7.1, K-3).                                                              |
| **F11** | Determinism                                                                                                                                                                                 | no `Math.random`, no `Date.now`, no per-tick PRNG cursor, anywhere in the set-piece                           | ✓                                                                     | ADR-0077 guardrail; grep/lint-asserted like ADR-0034 Rev. 3.                                                                                                                    |
| **F12** | **Subject-track honesty — three legs, see §7.2 below**                                                                                                                                      | drawn == box (± `SUBJECT_BOX_TOLERANCE`) · no transit before the tell · total on `[0, sceneDuration]`         | 9 keyframes §2.5 ✓                                                    | The brackets are the player's only live read: a box that disagrees with the picture, or that moves before its tell, turns "bien cadré" into a lie (K-2).                        |
| **F13** | **Attempt budget** — authored time of one un-skipped attempt                                                                                                                                | `briefingMax + establish + sceneDuration + develop ≤ **90 s**`                                                | 25 + 2.0 + 60.0 + 0.8 = **87.8 s** ✓                                  | An optional set-piece may never front an unbounded loop onto the 3-5 min mission promise (K-4). The measured leg (≤ 2 min incl. reading the sheet) is AC13.                     |

### 7.1 F5, in full — the three legs (**K-1**)

With `fovW(f) = 3500 / f`, `s_eff(f) = (fovW − B.w)/2 − FRAME_MARGIN × fovW` (§3.3.a),
each leg evaluated at the instant's **geometric mid-band focal** (`√(f_min · f_max)`):

| Leg     | Assert                                                                                  | Ceiling                              | Set-piece #1                    |
| ------- | --------------------------------------------------------------------------------------- | ------------------------------------ | ------------------------------- |
| **F5a** | `SWAY_AMP_X / s_eff(f_sweet)`                                                           | **≤ 0.60** master · **≤ 0.80** bonus | 0.390 / **0.541** / **0.751** ✓ |
| **F5b** | `(SWAY_AMP_X + v_subject × FOCUS_HOLD) / s_eff(f_sweet)` — the **untracked** worst case | **≤ 1.00** master · **≤ 1.30** bonus | 0.390 / **0.541** / **1.158** ✓ |
| **F5c** | `PAN_RATE_MAX ≥ max(v_subject) + 1.5 × MAX_LEG_DISPLACEMENT / SWAY_LEG_DURATION`        | strict                               | `12.0 ≥ 3.103 + 7.09 = 10.19` ✓ |

- **F5a** is the K-1 fix: it is measured against `s_eff`, never the raw slack.
- **F5b** bounds how much of the hold a moving subject may eat. `≤ 1.00` on a master means the
  mandatory shot is holdable **without panning at all**; `≤ 1.30` on a bonus permits the
  tracking demand LA PLAQUE is authored to make — and the spec must then **state the demand as
  a number** (§3.3.b: ≥ 1.20 su/s). A bonus may be hard; it may not be secretly impossible.
- **F5c** guarantees the player can always out-run subject + worst tremor **simultaneously**.
  Without it, "hard" could silently mean "the input cannot physically produce the correction".
- **Evaluated at the sweet spot, on purpose.** F5a is breached above ≈ 258 mm on LA PLAQUE and
  at `FILL_MAX` everywhere; that is the authored self-punishing top of range (§3.3.a, AC5),
  **not** a floor violation. Nobody should "fix" it.

### 7.2 F12, in full — subject-track honesty (**K-2**)

Asserted in code **against the authored keyframe table** (§2.5), never trusted:

1. **The drawn subject IS the validation box.** (a) The AF brackets are drawn from the _same_
   `subjectTrack(t)` value T3/T4 consume — no parallel constant, no render-side offset, no
   second source of truth. (b) At **every keyframe**, the authored box equals the opaque-pixel
   AABB of that keyframe's **enumerated drawn elements** (§2.5) within
   **`SUBJECT_BOX_TOLERANCE = max(0.40 su, 5 % of the box dimension)`** per edge, and idle
   animation on a hold pose stays inside the same tolerance. Direct application of the gated
   _décor aim-honesty_ ruling (design gate 2026-07-20, `README.md`): catch geometry coincides
   with the drawn silhouette, or the player is asked to eat a bug.
2. **No transit before the tell.** For every consecutive pair of instants, `subjectTrack` is
   **constant on `[closeAt(n), tell(n+1)]`** — assertable on the authored keyframes as: no
   keyframe strictly inside that interval carries a different value, and the values at both
   ends are equal. All transit lives inside `[tell(n), openAt(n)]`. This also forbids the
   symmetric **retro-leak** (a box relaxing at `closeAt`, which would announce that a moment
   just ended). §2.1 carries the reasoning.
3. **Total and finite.** `subjectTrack(t)` is defined, finite and inside the plate for every
   `t ∈ [0, sceneDuration]`, including before the first instant (K0) and after the last (K8);
   the first and last keyframes sit exactly on `t = 0` and `t = sceneDuration`.

---

## 8. Consolidated value table (the deliverable)

**System constants** (Stalingrad-first, exactly as the hostage QTE's wander constants are —
promoted to authored fields only when a second set-piece needs to curve them):

| Constant                     | Default                                         |     | Constant                    | Default                       |
| ---------------------------- | ----------------------------------------------- | --- | --------------------------- | ----------------------------- |
| `PHOTO_ESTABLISH_SECONDS`    | 2.0 s                                           |     | `SWAY_AMP_X`                | **2.00 su** _(Rev.2)_         |
| `PHOTO_DEVELOP_SECONDS`      | 0.8 s                                           |     | `SWAY_AMP_Y`                | **1.125 su** _(Rev.2)_        |
| `PHOTO_BRIEFING_MAX_SECONDS` | **25.0 s** _(new)_                              |     | `SWAY_LEG_DURATION`         | 0.55 s                        |
| `CONTACT_SHEET_READ_BUDGET`  | **30.0 s** _(new, design budget — not a timer)_ |     | `SWAY_LEG_DURATION_RM`      | 1.30 s                        |
| `SHUTTER_ARM_SECONDS`        | 0.40 s                                          |     | `MIN_LEG_DISPLACEMENT`      | **0.50 su** _(Rev.2)_         |
| `FOCUS_HOLD`                 | 0.35 s                                          |     | `MAX_LEG_DISPLACEMENT`      | **2.60 su** _(Rev.2)_         |
| `FOCAL_MIN` / `FOCAL_MAX`    | 35 / 300 mm                                     |     | `PAN_RATE_MAX`              | **12.0 su/s** _(new)_         |
| `ZOOM_TRAVERSE_SECONDS`      | 2.2 s                                           |     | `SUSPICION_MAX`             | 100                           |
| `FRAME_MARGIN`               | 0.04                                            |     | `SUSPICION_SHUTTER_EXPOSED` | +34                           |
| `FILL_MIN`                   | 0.45                                            |     | `SUSPICION_SHUTTER_COVERED` | 0                             |
| `FILL_MAX` (derived)         | 0.92                                            |     | `SUBJECT_BOX_TOLERANCE`     | **max(0.40 su, 5 %)** _(new)_ |
| `TELEGRAPH_LEAD_PHOTO`       | 1.8 s                                           |     | `LULL_RESIDUAL_FLOOR` (ε)   | **0.35 s** _(new, boss-side)_ |
| Floors **F1–F13**            | §7                                              |     |                             |                               |

**Authored per set-piece** (`photoQteSpec` — the data shape is `senior-architect`'s call):

| Key                  | Stalingrad set-piece #1                                                                                                                                                                                                       |
| -------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `scenePlate`         | quai de la Loire, `100 × 56.25 su` (art request: fiction §6)                                                                                                                                                                  |
| `sceneDuration`      | 60.0 s                                                                                                                                                                                                                        |
| `filmCount`          | 6                                                                                                                                                                                                                             |
| `swaySeed`           | integer, **pinned at stage-5 `verify`** (§9 AC10 — the ADR-0034 K-5 discipline)                                                                                                                                               |
| `coverWindows`       | period 21.0 s, first open 10.0 s, cover 7.0 s, tell 1.8 s ⇒ [10,17] [31,38] [52,59]                                                                                                                                           |
| `subjectTrack`       | **the 9-keyframe table of §2.5** — `{ t, cx, cy, w, h }[]`, linearly interpolated, total on `[0, 60.0]`                                                                                                                       |
| `instants`           | the three rows of §4.2 (`openAt`, `closeAt`, `role`, tell)                                                                                                                                                                    |
| `briefingMaxSeconds` | 25.0 s, skippable (§1.3)                                                                                                                                                                                                      |
| `rewardMultiplier`   | **×0.90** master-only, **×0.80** master + ≥1 bonus, **×1.00** on decline — authored on the **Niveau Final** `bossQteSpec`, applied to **phases 1-2 only** (§D7.1, amendment §D7.2). Not a field of this set-piece's own data. |

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
- **AC5 — Zoom double trade-off is real.** In playtest: framing at `FILL_MAX` breaks the focus
  hold at **every** focal under sway alone (`s_eff = 0` by construction, §3.3.a); framing at
  the sweet spot holds with light counter-steer; 300 mm on LA PLAQUE is measurably worse than
  251 mm, and the degradation is visible from ≈ 258 mm up.
- **AC6 — Cadence and floors.** Windows/tells/cover match §4.2 within cadence tolerance;
  the **F1–F13** floors are asserted in code against the authored data (unit test), not just
  observed. In particular **a zero-suspicion full-set run is achievable** (F3): master +
  both bonuses, needle never leaves rest.
- **AC6b — Subject track (F12).** Unit tests on the authored keyframes: (a) brackets and the
  T3/T4 tests read the **same** `subjectTrack(t)` value (one source — assert by construction,
  not by inspection); (b) `subjectTrack` is byte-constant on `[closeAt(n), tell(n+1)]` for
  both dead beats; (c) it is defined and inside the plate for every `t ∈ [0, 60.0]`, with
  keyframes exactly on 0 and 60.0; (d) at every keyframe the box matches the drawn sprite's
  opaque-pixel AABB within `SUBJECT_BOX_TOLERANCE` (composite/visual check at `verify`, per
  the décor aim-honesty precedent); (e) a release fired during any of the three transits
  returns `no-subject`, whatever the brackets show.
- **AC6c — Tracking demand is real and bounded (F5b/F5c).** On LA PLAQUE at 251 mm: a raised,
  correctly-framed, **non-panning** player loses the hold before 0.35 s elapses (the bonus
  genuinely requires tracking); a player panning at ≥ 1.20 su/s completes it; and full pan
  input visibly out-runs subject + worst sway leg simultaneously.
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
- **AC12 — Reward lever (if R1 is gated in).** The **Niveau Final** boss's `SHIELDED` lull is
  ×0.90 / ×0.80 per the roll's contents, **on phases 1 and 2 only** (phase 3 byte-identical at
  every tier); `bossHp`, damage, `EXPOSED`, tells and `maxBlownWindows` are **unchanged**
  (regression-asserted); **the Belliard encounter is byte-identical at every tier**; the
  **compound** assert `m × lull − SHIELD_BREAK_LULL_CUT ≥ telegraphLead + 0.35` passes at the
  strongest multiplier, on the **runtime** row, **and the −0.5 s cut is observed to actually
  apply** (never silently clamped away) at every tier; **lever 2's décor arming window still
  fits** the compressed phase-2 lull; the boss is beatable at ×1.00 (the set-piece is not a
  gate).
- **AC13 — Bonus, never gate; and it is bounded (K-4, F13).** (a) On a roll with **no** master
  proof — including a `SPOTTED` abort — the contact sheet shows **two** controls, the primary
  one **leaves**, and **one press** returns the player to the Stalingrad delivery with the run
  intact and the boss at ×1.00. (b) The whole first-playthrough attempt, un-skipped and
  measured wall-clock at `verify` — briefing → set-piece → contact sheet → press — is
  **≤ 2 min**; the authored leg (F13) is asserted ≤ 90 s in a unit test. (c) The contact sheet
  never auto-dismisses.

Sacha playtests the built set-piece against AC1–AC13 and reports PASS/deviations to
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
**Imposed on the UX spec as gate correction T-1** — settled, not a request.

**Rev. 2 adds a second reconciliation (gate T-3, pairs with my §1.3 / K-4):** the contact
sheet's failure branch is **not** one control. It is **`Décliner` (primary) + `Réessayer`**.
UX §4.3 and A14 need the second CTA and its focus order; the copy is Yasmine's (F-1).

### 10.3 To `narrative-designer` (Yasmine) — synchronised

Her §5.4 invariant is adopted verbatim and made mechanical (§D7): the reward touches
`SHIELDED` lull only, never HP, never `maxBlownWindows`. The bonus tier is **flat** (any one
bonus = the full ×0.80) — so the second bonus's payoff should be **fictional**, which is
exactly where her `PARIS-MINUIT` UNE variant belongs (fiction §5.3), gated on LA PLAQUE. Her
§3.3 proposal (bonuses land inside cover, the master proof straddles the end of a rame) is
**adopted as tuning** and hardened into floor F3, extended to the bonuses too.

**Rev. 2 owes her one line back (gate F-1):** the contact sheet's failure branch now needs a
**decline** CTA label alongside `Réessayer` (§1.3). Her variant (c) — _« Alors ils remettront
ça. Ils remettent toujours ça. »_ — is already the right sentence for it; I need the button.

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

**Rev. 2 adds two hard constraints, both from F12 (gate E-6 already flagged them to Nico):**

5. **The drawn subject and the keyframe table are ONE deliverable, not two.** Each of the 9
   keyframes (§2.5) names the drawn elements its box is the AABB of; the delivered sprite's
   opaque-pixel AABB must match within `SUBJECT_BOX_TOLERANCE`. If art and table disagree,
   "bien cadré" becomes a lie — the same failure the décor aim-honesty ruling corrected.
6. **Two hold poses are required, and they must not drift**: the pair standing/talking
   (K2→K3, 19.2 s) and the pair post-exchange with heads still close (K4→K5, 14.7 s). Their
   idle animation must stay inside the same tolerance. A dead beat where the actors move is a
   semantic leak with extra steps.

### 10.6 To `senior-architect` (Winston) — for the tech plan

New pure system in `src/game` (state machine, subject track, validation, sway closed form,
suspicion/film ledgers) + a render surface in `src/render`. My asks: (a) the set-piece must
be **tick-gated by the existing `paused` flag**, not run beside the loop (§6.3); (b) the
composition-validity bit and the master/bonus role must be **two independently computed
fields** the render never receives conflated (UX §2.3 + my §2.4); (c) `photoQteSpec === null`
levels stay byte-for-byte deterministic (AC11).

**Rev. 2 adds four (they match gate escalation E-4):**

- (d) **`subjectTrack` data shape** — an array of `{ t, cx, cy, w, h }` sorted on `t`, linearly
  interpolated on all four components, with the F12(3) totality assert at construction. The
  brackets must consume the **same** evaluated value as T3/T4 — one call site, not two (F12(1a)).
- (e) **A run-scoped carry Stalingrad → Niveau Final.** The roll's outcome (`none | master |
master+bonus`) must survive between levels. No such carry exists today outside the run-stats
  work (ADR-0076) — this is a **new cross-level dependency** and it is yours to shape.
- (f) **`rewardMultiplier` is authored on the Niveau Final `bossQteSpec` row**, never a module
  constant, and is applied **before** `SHIELD_BREAK_LULL_CUT` and **before** the existing clamp
  (order fixed by amendment §D7.2 point 2). Phases 1-2 only.
- (g) **The decline exit** (§1.3) must return control to the interrupted delivery without a
  reload of the Stalingrad level state — it is an exit from the set-piece, not a level restart.

---

## 11. Hand-off — Rev. 2 back to `lead-game-designer` (Karim), round 2 of 2

**From:** `game-designer` (Sacha) · **To:** `lead-game-designer` (Karim), design gate round 2.
**Requesting:** closure of **K-1, K-2, K-3, K-4**. Round 1's ten points are ruled and I do not
re-open a single ratified one below.

### 11.1 The four blocking corrections — what I changed

| ID      | The hole                                                                                                               | What Rev. 2 does                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         | Where                              |
| ------- | ---------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------- |
| **K-1** | F5 measured sway against **raw** slack; T3 had already spent `FRAME_MARGIN`. Master 65 % / ≤60 %, plaque 90 % / ≤80 %. | `s_eff(f) = (fovW − B.w)/2 − FRAME_MARGIN × fovW` **pinned as a formula** so it cannot drift again, and the isotropy proof (`s_eff_y = s_eff_x / 1.7778`) written down. **`SWAY_AMP_X` 2.4 → 2.00 su** (not your 2.13 ceiling: 2.13 satisfies the floor at **zero** headroom, and a floor with no margin is a floor the next box re-author breaks silently). New shares **39 / 54.1 / 75.1 %** — both breaches closed with ≈ 5 pp of margin. Dependent constants rescaled (`SWAY_AMP_Y` 1.125, `MIN/MAX_LEG_DISPLACEMENT` 0.50/2.60). **F5 becomes three legs**: a) sway share, b) **untracked grace** — which is where your "the honest combined budget is above 90 %" observation lands: it is **115.8 %**, and I now state the exact pan the plaque demands (**≥ 1.20 su/s**) instead of leaving it implicit; c) **pan authority**, a hole nobody had costed — `PAN_RATE_MAX = 12.0 su/s`, sized to beat subject + peak sway simultaneously.                                                                                                                                                                                          | §3.3, §3.3.a, §3.3.b, §4.3, §7.1   |
| **K-2** | `subjectTrack` had no keyframes, and free interpolation pre-announced the next subject.                                | **The 9-keyframe table is authored** (`t`, centre, size, drawn elements, segment) with the staging it implies. The leak is closed by a **structural** rule, not a tolerance: **the track is piecewise-constant except during a telegraph** — all transit lives inside `[tell(n), openAt(n)]`. Two consequences I owe you: it also kills the symmetric **retro-leak** (a box relaxing at `closeAt` would announce that a moment just ended — T2 leaked one beat late), and **a transit can never produce a verdict** (F2 ⇒ T2 false throughout ⇒ `no-subject`), which is what makes it legitimate to assert F12(1) at keyframes only. **F12 written in your three legs**, with 1(a) strengthened: brackets and T3/T4 must read the _same_ evaluated value — one call site — so drawn==box holds by construction rather than by inspection. `SUBJECT_BOX_TOLERANCE = max(0.40 su, 5 %)`.                                                                                                                                                                                                                                                   | §2.1, §2.5, §7.2, §10.5            |
| **K-3** | F10 checked the multiplier alone; composed with the gated −0.5 s cut, ×0.70 shipped 0.34 s < 0.35 s tell.              | **ε pinned by quotation, not preference: `LULL_RESIDUAL_FLOOR = 0.35 s`** = the worst headroom `spec-boss-shield-break-tempo-shot.md` §6-B **already ships and was gated at**. Then the arithmetic decides for us: phase 3 needs `m ≥ ×1.000`, so a **uniform** multiplier is arithmetically dead unless ε is shaved to the 0.05 s you already refused. **Decision: the multiplier is PHASE-SCOPED — phases 1-2 only, phase 3 always ×1.00.** Tiers re-tuned **×0.90 / ×0.80** (Rev. 1's ×0.75 breaches _phase 2_'s compound floor; the wall is ×0.781, written down). Non-cumulative `min()` recorded as the rejected alternative with its reason (it makes the photo reward invisible on every broken lull). **`rewardMultiplier` scoped to the Niveau Final row only**, Belliard byte-untouched. **R1 transcribed as AMENDMENT A1** (5 numbered points, including the fixed order of operations) for verbatim transcription into the gated spec — **which I did not edit.** Advisory A-1 answered: lever 2's worst compressed lull is phase 2 at 1.28 s / 0.94 s post-break, no new arming failure, handed on as a regression assert. | §D7.1, §D7.2, F10, AC12            |
| **K-4** | `DONE` offered only `Réessayer` on failure — "bonus, jamais gate" asserted in prose, contradicted in the screen.       | **Two controls on `DONE`, always, and the leaving one is primary on both branches**: `Continuer` with a master proof, **`Décliner`** without (incl. `SPOTTED`), one press, run continues, boss at ×1.00. Budget written as a **floor**: `PHOTO_BRIEFING_MAX_SECONDS 25 s` (skippable) + establish + scene + develop = **87.8 s ≤ 90 s** (F13, code-assertable) and the measured full attempt ≤ **2 min** (AC13). `CONTACT_SHEET_READ_BUDGET 30 s` is explicitly a **design** budget, **not** an auto-dismiss — a verdict screen that closes itself would defeat the two-beat feedback.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   | §1.1, §1.3, §4.4, F13, AC13, §10.2 |

### 11.2 Ratifications applied, not re-opened

`SPOTTED` → contact sheet · `SUSPICION_SHUTTER_EXPOSED = +34` with **no decay** (F3 carries
the anti-frustration guarantee) · `filmCount = 6` · `FOCUS_HOLD = 0.35 s` as a HOLD ·
D1.a / D1.b · host level **Stalingrad** (R-10) · R1 + R3, R2 rejected · the "moins couvert,
jamais moins de PV" invariant · the flat bonus tier · floors F1/F2/F3/F4/F6/F7/F8/F9/F11 ·
the focal bands, windows, telegraph and traverse arithmetic you re-derived. **Untouched.**

### 11.3 The three rulings I am asking you for (and nothing else)

1. **`SWAY_AMP_X = 2.00 su`, not your 2.131 ceiling.** I traded ≈ 3 pp of master difficulty
   for ≈ 5 pp of headroom on both binding cells. If you want the tension back, ×0.55 of the
   master's slack (2.03 su) is the most I would take and it re-opens LA PLAQUE's margin.
2. **The phase-scoped multiplier (K-3).** This is the one place I did not do what the
   correction literally said: you asked for a compound floor asserted on the multiplier, and
   the compound floor — once ε is honest — says the multiplier cannot exist in phase 3 at all.
   So I scoped it out of phase 3 rather than shrinking it into meaninglessness (×0.875 uniform
   at best). If you prefer the non-cumulative `min()` model instead, it is a one-line swap in
   F10 + amendment point 2, and the tiers go back to a uniform value. **Your call, stated as
   an option rather than decided alone**, because it changes what the reward _feels_ like.
3. **F5b's bonus ceiling of 1.30** — i.e. "a bonus may require tracking, a master may not".
   It is the only genuinely new fairness threshold in Rev. 2 and it is the one that lets
   LA PLAQUE stay as hard as the fiction wants it.

### 11.4 Still open, not mine

**E-1 remains open and it still gates everything**: `docs/adr/0077-…` is **not on this branch**
(checked again this round). Every value above is provisional on it. E-2 (§8.3 ideological flag)
and E-3 (G-1/G-2) are Bertrand's. E-4 grew by four asks in §10.6 (d)-(g) — the run-scoped
Stalingrad → Niveau Final carry (e) is the one with real architecture in it. E-5 (`pm`,
progression + deferred UNE variant), E-6 (`lead-art`, now with the two F12 constraints in
§10.5 items 5-6), E-7 (`sound-designer`, cadence unmoved by the retune — the K-1 fix touches
`SWAY_AMP_X`, not a single window).

**What I do NOT decide:** the fiction and cast (`narrative-designer`), controls,
accessibility envelope and HUD dress (`ux-designer`), the look (`lead-art`), the sound
palette (`sound-designer`), the lane split and data shape (`senior-architect`), gate-vs-bonus
in the progression (`lead-game-designer` + `pm`).

**After the verdict:** hand-off logged in `docs/handoffs/`, indexed in
`docs/agent-handoffs.md`; status reported in `docs/game-design/README.md`. If the gate
changes any ADR-0077 decision, that ADR is **superseded, not rewritten** (its own
Follow-up clause).
