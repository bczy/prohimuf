# DESIGN GATE — Photo QTE "paparazzi" (ADR-0077 design loop)

**Gate:** `lead-game-designer` (Karim) · **Date:** 2026-08-01 ·
**Branch:** `design/qte-photo-paparazzi` · **Rework round:** 1 of 2 (cap per COLLABORATION.md)

| #   | Deliverable                                                         | Author                         | **VERDICT**                                                                |
| --- | ------------------------------------------------------------------- | ------------------------------ | -------------------------------------------------------------------------- |
| 1   | `docs/game-design/spec-photo-qte-paparazzi.md` (mechanic + tuning)  | `game-designer` (Sacha)        | **PASS WITH CORRECTIONS** — 4 blocking (K-1…K-4)                           |
| 2   | `docs/game-design/spec-photo-qte-fiction.md` (fiction)              | `narrative-designer` (Yasmine) | **PASS WITH CONDITIONS** — 4 conditions (F-1…F-4), 1 escalated to Bertrand |
| 3   | `docs/game-design/ux/photo-qte-controls.md` (controls / HUD / a11y) | `ux-designer` (Tony)           | **PASS WITH CORRECTIONS** — 2 blocking (T-1, T-2), 4 conditions            |

**Set-level verdict: the set does NOT ship to `senior-architect` yet.** Three seams are
genuinely broken (K-1 tuning arithmetic, K-2 unimplementable data, K-4 = T-2 soft-gate exit),
and one frame-law dependency (E-1) is unverifiable on this branch. Nothing here is a FAIL:
the spine of all three specs is sound, coherent with each other, and coherent with the
guidelines. Fix the named holes, one round, and the set is gate-ready.

---

## 0. Blocking caveat on this gate itself — E-1

**`docs/adr/0077-qte-photo-paparazzi-set-pieces.md` DOES NOT EXIST on this branch.** The ADR
numbering jumps 0076 → 0078, and `docs/adr/0078-…` §Number records why: _"ADR-0077 is claimed
on unmerged branch `design/qte-photo-paparazzi` (commit 82850c16)"_. The three specs under
review are present in the tree; the frame law they instantiate is not.

I gated anyway, against a **reconstructed frame**: D1–D9 as restated, independently, by the
three specs. Their restatements are **mutually concordant on all nine decisions** (authored
set-pieces; frame+zoom+shoot in a dedicated paused full-screen view; fill-the-frame + sway;
hybrid briefing; one master proof among several instants; suspicion gauge from shutter-noise
vs. sound cover + finite film; spotted = abort to checkpoint, no death; two-beat feedback;
dedicated 2D backdrop + key-pose sprites), plus the determinism guardrail. Three independent
paraphrases agreeing is strong evidence, but it is not the law.

**Consequence, and it is binding:** every verdict below is **provisional on ADR-0077 landing
on this branch**. If the ADR's text diverges from the reconstruction on any point, the gate
re-opens **on that point only** — not the whole set. `producer` / `senior-architect`: the ADR
must be on this branch (cherry-pick from 82850c16) **before** the tech plan opens. Escalated.

---

## 1. Scope — the "cahier des charges" test

Prohibition (Atari ST, 1987) had no camera verb, no photo mini-game, no narrative. All three
specs declare **[EXTENSION], conscious and documented**, and point at ADR-0077 as the record.
That is the correct form (same standard as ADR-0012 / 0030 / 0034 / 0051). **PASS on scope**,
conditional on E-1: the extension is only "documented" once the ADR is actually in the repo.

**Core loop `Récupérer → Livrer → Éviter`:** untouched. The set-piece plays _before_ the
Stalingrad delivery, adds no rule to `Éviter`, spawns nothing, moves no energy, no score, no
quota (mechanic §6.4, F8). It is bonus, never gate (mechanic §D7, fiction §5.3) — **ratified**
(gate ruling R-8 below).

**"Une mission = 3-5 minutes":** the set-piece is outside the mission timer, so the hard
constraint is not violated on its face. But see **K-4/T-2**: as specified, a player without a
master proof is offered `Réessayer` as their only exit. An unbounded retry loop bolted in
front of a 3-5 min mission is exactly how a soft gate is smuggled in. Fix required.

---

## 2. Rulings on Sacha's 10 points (`spec-photo-qte-paparazzi.md` §11)

| #   | Point                                                                                         | Ruling                                                                                                                                                                                                                                                                     |
| --- | --------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | State machine + posture sub-machine, D1.a (focal retained), D1.b (`SHUTTER_ARM_SECONDS 0.40`) | **RATIFIED.** D1.a is right and load-bearing: a bail-out that costs a zoom traverse is not a bail-out, and the a11y envelope (UX §3.4) leans on it. D1.b's anti-spam reasoning is sound and F9 bounds it.                                                                  |
| 2   | `SPOTTED` reaches the contact sheet                                                           | **RATIFIED.** Answers the UX §4 open flag the right way; coherent with guidelines §5 rule 4 ("chaque échec : raison explicite affichée") and with fiction variant (c).                                                                                                     |
| 3   | Continuous `subjectTrack` model                                                               | **RATIFIED IN PRINCIPLE, BLOCKED ON DATA — see K-2.** The anti-leak argument is correct. The model as delivered is not implementable and, worse, leaks by a channel the spec did not consider.                                                                             |
| 4   | Focus = 0.35 s HOLD + third bracket state                                                     | **RATIFIED.** The velocity-test rejection is well argued (12 % discrimination, and it would punish tracking on LA PLAQUE, which is the correct way to photograph a moving car). The third bracket state is **imposed on the UX spec** as T-1 — not a request, a condition. |
| 5   | The tuning ladder                                                                             | **NOT RATIFIED — K-1.** The focal bands, windows, telegraph and traverse arithmetic all check out (I re-derived them). F5 does not.                                                                                                                                        |
| 6   | `SUSPICION_SHUTTER_EXPOSED +34`, no decay                                                     | **RATIFIED.** "Budget, not rate" is the right call for a needle with no numerals (UX §2.4 + A7), F7 checks (100/34 ⇒ 2 survivable, spotted on the 3rd), and F3 is a stronger and _assertable_ anti-frustration guarantee than a decay. No decay. Do not re-open.           |
| 7   | `filmCount = 6`                                                                               | **RATIFIED.** Inside fiction's 4–8, inside UX's ≤ 8, 2×3 grid = 3 per row (UX §4.1 discipline), F6 floor 5 / ceiling 8 asserted. Coherent across all three lanes.                                                                                                          |
| 8   | Reward lever R1 + R3, R2 rejected                                                             | **RATIFIED IN SHAPE, BLOCKED ON THE FLOOR — see K-3.** R2 rejected for V1: correct, and for the right reason (a quiet route unlock IS a soft gate).                                                                                                                        |
| 9   | Floors F1–F11                                                                                 | **F1/F2/F3/F4/F6/F7/F8/F9/F11 RATIFIED** (re-derived, they hold). **F5 FAILS its own arithmetic (K-1). F10 is incomplete (K-3).** A new **F12** is imposed (K-2).                                                                                                          |
| 10  | Host level = Stalingrad                                                                       | **RATIFIED — Stalingrad.** Ruling detail below (R-10).                                                                                                                                                                                                                     |

### R-10 — Stalingrad is the host level for set-piece #1

Belliard-first would buy engineering velocity that does not exist here: ADR-0077 D9 forces a
**dedicated 2D plate** either way, so Belliard's shipped parallax buys nothing. What
relocation _costs_ is the free diegetic noise source — you would have to invent a substitute
(génératrice, camion), author its own tell, re-author all three cover windows, and re-verify
F3 on the new cadence, i.e. re-open §4.2 entirely for zero asset saving. **Stalingrad.**
Build-order sequencing (when the story opens relative to other Stalingrad work) is
`senior-architect` + `producer`'s call, not a design one.

---

## 3. Blocking corrections on the mechanic spec

### K-1 — F5's sway/slack arithmetic omits `FRAME_MARGIN`; two of three instants breach their own floor

§3.3 computes containment slack as `(1 − fill)/2 × fovW`. That is the **raw** slack. T3
(§2.2) additionally requires `FRAME_MARGIN = 0.04` of clear frame on every side, so the room
sway may actually consume is `slack − 0.04 × fovW`. The spec proves this itself: at
`FILL_MAX = 1 − 2 × FRAME_MARGIN` the raw slack **equals** the margin (§3.3's own 0.74 su at
189 mm), i.e. effective slack is exactly zero. F5 is therefore measured against a budget T3
has already spent.

Re-derived at each instant's stated sweet spot (`fovW = 3500/f`, effective slack per side
`= (fovW − B.w)/2 − 0.04 × fovW`):

| Instant                | f      | `fovW`   | raw slack | margin  | **effective slack** | sway 2.4 su = | F5 ceiling | Verdict      |
| ---------------------- | ------ | -------- | --------- | ------- | ------------------- | ------------- | ---------- | ------------ |
| ARRIVÉE (bonus)        | 94 mm  | 37.23 su | 6.62 su   | 1.49 su | **5.13 su**         | **47 %**      | ≤ 80 %     | ✓            |
| L'ÉCHANGE (**master**) | 132 mm | 26.52 su | 4.76 su   | 1.06 su | **3.70 su**         | **65 %**      | ≤ 60 %     | **✗ BREACH** |
| LA PLAQUE (bonus)      | 251 mm | 13.94 su | 3.22 su   | 0.56 su | **2.66 su**         | **90 %**      | ≤ 80 %     | **✗ BREACH** |

The spec's own figures (36 / 51 / 75 %) are the raw-slack numbers, and they are internally
consistent — the error is not sloppiness, it is one missing subtraction that happens to fall
on the mandatory shot. On top of it, LA PLAQUE's box travels 3.1 su/s, so over one
`FOCUS_HOLD` the subject alone crosses 1.09 su ≈ 41 % of the effective slack; the honest
combined budget there is above 90 %.

**Correction:** re-derive F5 against **effective** slack, state the formula in the spec so it
cannot drift again, and close the breach on the single knob the spec already nominates.
`SWAY_AMP_X ≤ min(0.60 × 3.70, 0.80 × 2.66) = 2.13 su` closes both (master 57 %, plaque
79 %); `SWAY_AMP_Y` follows the isotropy rule. **Sacha re-derives and re-tunes — I am naming
the hole and the closing condition, not authoring the value.** AC5's playtest claim
("`FILL_MAX` at ≥ 189 mm breaks the hold repeatedly") survives either way: at `FILL_MAX`
effective slack is 0 by construction.

### K-2 — `subjectTrack` is not implementable as delivered, and it leaks by a channel §2.1 did not cost

Two distinct holes in the same decision.

**(a) Missing data — a dev cannot build this without guessing.** §2.1 decides "a keyframed box
defined at EVERY scene time, linearly interpolated". §8's authored table then says only
`subjectTrack: keyframed box (centre + size), interpolated`. The spec supplies box **sizes**
at three instants, box **centres** for none (only LA PLAQUE's x-range), and **no keyframe
between them** across 60 s. Verifiability FAIL by the gate's own criterion: adjectives where
values are owed. **Deliver the keyframe table** — `t`, centre `(x,y)`, size `(w,h)`, for every
keyframe of the 60 s track, in scene units.

**(b) The track's own motion is a tell.** The three instants have three _different_ subjects
(the pair, the pair's hands+faces, the departing car's plate: 24×13.5 → 17×9.56 → 7.5×4.22 su
at x 62→71). A track continuously interpolating between them means the brackets — which read
containment live, at all times — **move toward the next subject before its authored tell
fires**. That is precisely the "something is about to happen" leak §2.1 rejects, re-entering
by the back door, and it can arrive well before `TELEGRAPH_LEAD_PHOTO = 1.8 s`.

**(c) And the box must be what is drawn.** Prior gated ruling of this project (design gate
2026-07-20, _Décor aim-honesty_, `docs/game-design/README.md`): the catch geometry must
coincide with the drawn silhouette; a validation volume that disagrees with the picture is a
bug the player is asked to eat. It applies verbatim here — the AF brackets are the player's
only live read, and if the validation box and the drawn subject diverge, "well framed" becomes
a lie.

**Correction — new floor F12, asserted in code against authored data, three legs:**

1. The subject box coincides with the drawn subject's silhouette at every keyframe (state the
   tolerance; the précédent's shape is an authored AABB, not a fudge factor).
2. Between the close of instant _n_ and the tell of instant _n+1_, the track's centre and size
   **do not begin their transit before that tell** (the transit may run during the tell — that
   is what a tell is for). Assert on the authored keyframes.
3. The track is defined and finite at every `t ∈ [0, SCENE_DURATION]`, including before the
   first instant and after the last.

### K-3 — F10 does not compound with the already-gated shield-break lever (ADR-0060); the stated ×0.70 floor ships an illegal state

R1 scales the final boss's `SHIELDED` lull. `spec-boss-shield-break-tempo-shot.md` (ADR-0060,
**gated**) already cuts the next lull by `SHIELD_BREAK_LULL_CUT = 0.5 s`, clamped to stay
strictly above that phase's `telegraphLeadSeconds`. F10 checks the multiplier **alone**
against the tell. Compounded (baseline lulls 2.00/1.60/1.20, tells 0.45/0.40/0.35):

| Reward                           | P1 / P2 / P3 lull  | after a shield break (−0.5 s) | vs. tell                               |
| -------------------------------- | ------------------ | ----------------------------- | -------------------------------------- |
| ×1.00                            | 2.00 / 1.60 / 1.20 | 1.50 / 1.10 / 0.70            | ✓                                      |
| ×0.85                            | 1.70 / 1.36 / 1.02 | 1.20 / 0.86 / **0.52**        | ✓                                      |
| ×0.75                            | 1.50 / 1.20 / 0.90 | 1.00 / 0.70 / **0.40**        | ✓ but only 0.05 s of non-tell recovery |
| **×0.70** (F10's stated minimum) | 1.40 / 1.12 / 0.84 | 0.90 / 0.62 / **0.34**        | **✗ below the 0.35 s tell**            |

At ×0.70 the ADR-0060 clamp fires and **silently eats the shield-break reward** — the player
pays a 1 HP chip for a compression that no longer happens. That is a fairness-floor violation
of a gated spec, authored in by this one. Even at the shipped ×0.75, phase 3's post-break lull
is 0.40 s against a 0.35 s tell: 0.05 s of actual recovery, which is not recovery.

**Correction:** F10 becomes a **compound** floor —
`m × lull(phase) − SHIELD_BREAK_LULL_CUT > telegraphLead(phase) + ε`, with `ε` pinned and
justified as the minimum residual recovery that is not tell (phase 3 sets the binding
constraint: `m > (0.35 + 0.5 + ε)/1.20`, i.e. **≥ ×0.71 before ε**). Assert the compound, not
the multiplier. **Advisory A-1:** lever 2 (décor prop) arms _during_ a `SHIELDED` lull —
check that the compressed lull still contains its arming window, or say explicitly that it
may not.

Two more pins on R1, non-negotiable but cheap:

- **Target the data, not "the boss".** `rewardMultiplier` applies to the **Niveau Final**
  `bossQteSpec` only. The Belliard encounter is byte-untouched (it also precedes the
  set-piece in progression, so this is free — but write it down: the shield-break story's K-2
  already burned this crew once on a system constant that hit _both_ live encounters).
- **`spec-boss-qte-encounter.md` is a GATED spec.** R1 amends it. Transcribe R1 as a numbered
  **AMENDMENT** into that spec (same protocol as amendment A2 from the décor aim-honesty
  ruling) rather than letting the boss table drift silently. No re-gate of the boss spec is
  needed if the amendment is verbatim this ruling.

### K-4 — `DONE` has no exit that is not a retry: the "bonus, jamais gate" invariant is not implemented by either spec

Mechanic §1.1: `DONE` offers _"`Continuer` if the roll contains a `MASTER` frame, else
`Réessayer` → checkpoint retry"_. UX §4.3: one primary CTA, `Continuer` **or** `Réessayer`.
So a player who fails has exactly one button, and it says "do it again". Both specs
simultaneously assert the set-piece is optional and never a gate (mechanic §D7, fiction §5.3).
Those two statements cannot both be true in the built screen.

The fiction already writes the correct exit: variant (c) is _"Alors ils remettront ça. Ils
remettent toujours ça."_ — that is a **decline**, not a retry, and it is the humane reading.

**Correction (mechanic + UX, one shape, both specs):** on a no-master-proof outcome the
contact sheet offers **two** controls — retry, and an explicit decline that returns to the
Stalingrad delivery with the baseline (×1.00) boss state. Copy is Yasmine's (F-1). Add an AC:
_the player can leave the set-piece without a master proof, in one press, and the run
continues_. Also budget the thing: **first playthrough, un-skipped, briefing + set-piece +
contact sheet ≤ 2 min**, so the 3-5 min mission promise is never fronted by an unbounded loop.

---

## 4. Conditions on the fiction spec

Yasmine's spec is the cleanest of the three: it decides what it owns, argues its alternatives,
declares its net-new canon, and pays back shipped dialogue instead of adding to it. The target
ruling below is mine; the ideology ruling is not.

- **R-F1 — The target: the Commandant encaissant une enveloppe. RATIFIED**, against
  alternatives A and B, on Yasmine's own strongest argument: a muted set-piece at 300 mm needs
  a silhouette the player already reads in under a second, and the Commandant is the only
  such face shipped. Alternative B (RG/indic) is **reserved as set-piece #2**, recorded here so
  it is not reinvented. §1.3's "not the boss fight in photo form" defence holds: _dégage-le_
  vs. _il est l'employé de quelqu'un_ are different sentences. **Conditional on E-2** below.
- **R-F2 — Le triptyque (§3.2). RATIFIED**, including _two faces AND two hands in frame_ for
  the master proof: it is what makes the zoom a real arbitration rather than a slider, and it
  is what pins `B.w = 17.0 su` in the tuning.
- **R-F3 — "Isolé, jamais affaibli" (§5.4). RATIFIED AS AN INVARIANT** of this feature, and
  made mechanical by R1 (lull only, never HP, never `maxBlownWindows`). The reward and the
  fiction now say the same sentence, which is the whole point.
- **R-F4 — Oxane entering canon by mention. PASS.** Guidelines §7 already scopes her; no new
  speaker, no new sprite, and her §7 risk is left as an unbuilt hook. Correct restraint.
- **R-F5 — "Le patron de boîte" anonymous, non-recurring, not in the roster. PASS.** No fourth
  faction. Fold into the future `narrative-bible.md`.

**Conditions:**

- **F-1 (blocking, pairs with K-4).** Variant (c) currently reads as acceptance and moving on,
  while the screen offers only `Réessayer`. Write the **decline** copy explicitly (a second CTA
  label plus, if you want it, one line) so the fiction and the button agree. Two labels, ≤ the
  existing copy budget.
- **F-2 (scope).** **Ship (a) + (b) + (c) at V1.** Cutting (b) would leave the bonus tier with
  _zero_ payoff — R1 is deliberately flat (any one bonus = full ×0.75), so if (b) goes, the
  second bonus pays nothing at all and LA PLAQUE becomes an unpaid difficulty spike. The
  `PARIS-MINUIT` UNE variant (R3's prestige tier) is **deferred out of V1**: it touches the
  scores screen, i.e. another surface and `pm`'s progression call.
- **F-3 (escalated — see E-2).** §8.3 is not mine to ratify. Until Bertrand rules, the §4
  scripts are **not** transcribable.
- **F-4 (art request AUTHORISED, with two constraints).** Open the request to
  `concept-artist` → `lead-art`: dedicated plate (quai de la Loire), key poses (Commandant /
  manteau clair / berline), contact-sheet surface. Constraints handed to Nico, **not
  arbitrated by me** (`docs/art-direction.md` is his): (1) guidelines §5 _"ce qui brille est
  interactif"_ — in this scene the subject is the interactive element but must never be shot;
  it must therefore read **without** the interactive-glow vocabulary, or the plate teaches a
  false shooting affordance (same trap as the delivery-assault K-6 and the mur-d'enceintes
  note); (2) the drawn subject must match the validation box per F12(1) — the art and the
  keyframe table are one deliverable, not two.

---

## 5. Corrections on the UX spec

Tony's four seams were all answered by Sacha and I ratify the four answers (reduced-motion =
same amplitude / `SWAY_LEG_DURATION_RM 1.30` / linear + the ±10 pp parity metric; `SPOTTED`
reaches the sheet; **no** hidden energy cost, so the energy readout correctly stays off;
`filmCount = 6`). The spec's spine — diegetic instruments over abstract bars, hold-to-raise as
a free bail-out, brackets that read composition and never the verdict — is right and coherent
with the hostage-duel precedent it cites.

- **T-1 (blocking).** Add the **third bracket state**: `dashed` (composition invalid) → `solid`
  (valid, focus charging) → `locked` (held ≥ `FOCUS_HOLD`). Extend **A6** to three states
  grayscale-distinguishable. Imposed by ruling 4 above: without a lock read, "focus tenu" is an
  invisible rule the player can only learn by burning film on dull clicks.
- **T-2 (blocking).** **Mobile simultaneous-contact budget.** While raised — the only posture
  in which anything can be photographed — the scheme requires: the held raise button (1
  contact) **+** one-finger pan (1) **+** two-finger pinch (2) **+** two-finger tap shutter
  (2). That is up to **three simultaneous contacts on a hand-held landscape phone**, one of
  which must not drift for the whole framing (your own §3.2 warns a drifting thumb lowers the
  camera mid-frame — under D1.b that also disarms the shutter for 0.40 s at the worst moment).
  ADR-0003 makes mobile _supported_, and supported means playable. Re-derive the mobile scheme
  under an explicit constraint — **≤ 2 simultaneous contacts, one of which may be the held
  raise** — or make raise a toggle **on mobile only** (your tap-to-toggle rejection in §1.4 is
  argued from the physical metaphor and the free bail-out; the bail-out survives a toggle if
  the lower action is one tap on the same button). Your call which; the constraint is not
  optional.
- **T-3 (condition, pairs with K-4/F-1).** The CTA is not one control on the failure branch —
  it is retry **plus** decline. Update §4.3 and A14.
- **T-4 (condition).** The suspicion needle is a **metaphor**, not an instrument: a light meter
  measures light. Keep the dial form (I ratify it — see the guidelines ruling below), but no
  copy, glyph or art treatment may present it as an exposure/light meter, or the player is
  taught a false causal model ("brightness matters") for a mechanic driven purely by
  shutter noise vs. cover. Hand the dress to `lead-art` with that one prohibition.
- **T-5 (condition, verifiability hole).** **Posture on resume from pause is unspecified.**
  Both specs freeze everything while paused, but a held Space / held on-screen button is not
  reliably still held across a pause overlay. Define it — my recommendation: **resume
  `LOWERED`, focal retained (D1.a), shutter re-arms on the next raise** — and put it in A9.
- **T-6 (minor).** Film counter form: §2.1 specifies a mechanical dial with a numeral; fiction
  §4.2 supplies `POSES : {n}` (12 ch.). Pick one — dial with numeral, and the `POSES` label
  only if the dial needs a caption. Reconcile with Yasmine, no re-gate.

---

## 6. Guidelines seams — two rules missing, proposed here

The gate is required to propose the rule when `PROJECT_GUIDELINES.md` is silent. Two are, and
both are already de-facto settled by precedent; they should be written down rather than
re-litigated per set-piece. **Both are Bertrand's to adopt (E-3).**

- **G-1 — verb count in a dedicated set-piece.** §5 rule 5 says _"contrôles : déplacement + une
  action — appris en 10 secondes"_. The photo QTE has four verbs; the hostage and boss QTEs
  already exceeded the rule and were gated. Proposed wording: _a dedicated set-piece may exceed
  "déplacement + une action" if (a) every added verb maps 1:1 to a mechanic of its gating ADR,
  (b) the whole scheme is learnable without copy, and (c) the set-piece is optional and outside
  the mission timer._ The photo QTE satisfies (a), (b) and (c) — **PASS** under the proposed
  rule, and it is why K-4/T-2 matter: (c) is what the missing decline exit puts at risk.
- **G-2 — tension readouts vs. §6 "la musique est le seul indicateur de tension — pas de barre
  de stress".** Proposed wording: _a tension readout is admissible when it is an instrument of
  the fiction's own tool, positioned inside that tool's frame, carrying no numeral, and
  readable by shape/position in grayscale; an abstract bar overlaid on the HUD remains
  forbidden._ The suspicion needle satisfies it (UX §2.2, §3.3, A6, A7) — **PASS** under the
  proposed rule, with T-4 attached.

---

## 7. Escalations

| ID      | To                              | What                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             |
| ------- | ------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **E-1** | `producer` / `senior-architect` | **ADR-0077 is absent from this branch** (claimed at commit 82850c16, per ADR-0078 §Number). Land it here before the tech plan. Every verdict above is provisional on it.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         |
| **E-2** | **Bertrand**                    | **Fiction §8.3 — the ideological flag.** The spec establishes that the repression of the free-party circuit is _commissioned and paid for by la nuit légale_. It is irreversible once shipped: after it, the BAC is no longer a blind force, it is somebody's contractor. Design-side reading: coherent with roster §7, period-plausible (1998, pre-2001), and it repays shipped canon rather than adding to it — but it fixes the game's worldview permanently and closes the ambiguity the current fiction enjoys. **Not mine to ratify.** If you refuse it, R-F1 (the Commandant) still stands, but §3 and §4's content are rewritten. Say it now, not after. |
| **E-3** | **Bertrand**                    | Adopt (or reject) **G-1** and **G-2** into `PROJECT_GUIDELINES.md`. Both are already precedent; writing them down stops every future set-piece re-arguing them at the gate.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      |
| **E-4** | `senior-architect`              | (a) tick-gate the set-piece on the existing `paused` flag (Sacha §6.3 + Tony §3.4 — I confirm it as a design requirement, not a nicety); (b) composition-validity and master/bonus role must reach the render as **two independently computed fields**, never conflated; (c) `photoQteSpec === null` levels byte-identical; (d) **new cross-level dependency**: the roll's outcome must survive Stalingrad → Niveau Final as run-scoped state — no such carry exists today outside the run-stats work (ADR-0076); (e) the data shape for the K-2 keyframe table.                                                                                                 |
| **E-5** | `pm`                            | Progression: set-piece is **bonus, never gate** (ratified). Confirm placement in the Stalingrad story's scope, and rule on the deferred `PARIS-MINUIT` UNE variant (F-2).                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        |
| **E-6** | `lead-art` (Nico)               | The two F-4 constraints (no interactive-glow vocabulary on a non-shootable subject; drawn subject == validation box per F12) and the T-4 prohibition (needle is not a light meter). Peer lane — flagged, not arbitrated.                                                                                                                                                                                                                                                                                                                                                                                                                                         |
| **E-7** | `sound-designer` (Malik)        | Cover windows `[10,17] [31,38] [52,59]` s with a 1.8 s audible approach are **gameplay state, not ambience**; crisp-vs-dull shutter click is the sole audio channel for T5. Provisional on the K-1 retune, which does not move the cadence.                                                                                                                                                                                                                                                                                                                                                                                                                      |

---

## 8. What happens next

1. Sacha: Rev.2 addressing **K-1** (F5 re-derivation + retune), **K-2** (keyframe table + F12),
   **K-3** (compound F10 + the two R1 pins), **K-4** (decline exit + the ≤ 2 min budget).
2. Tony: Rev.2 addressing **T-1** and **T-2** (blocking) + T-3…T-6.
3. Yasmine: **F-1** and **F-2** now; **F-3** blocked on E-2. Art request opens under **F-4**.
4. Back to me for round 2. **Round 2 is the cap** — past it, options go to Bertrand rather
   than a third loop.
5. No hand-off to `senior-architect` until round 2 passes **and** E-1 is closed.

_Karim — `lead-game-designer`, 2026-08-01._
