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

---

---

# ROUND 2 (FINAL) — the set PASSES

**Gate:** `lead-game-designer` (Karim) · **Date:** 2026-08-01 ·
**Branch:** `design/qte-photo-paparazzi` · **Rework round: 2 of 2 — the cap. No round 3.**

| #   | Deliverable                                             | Author                         | **VERDICT ROUND 2**                                              |
| --- | ------------------------------------------------------- | ------------------------------ | ---------------------------------------------------------------- |
| 1   | `docs/game-design/spec-photo-qte-paparazzi.md` (Rev. 2) | `game-designer` (Sacha)        | **PASS** — K-1…K-4 closed. 2 binding amendments + 1 added AC.    |
| 2   | `docs/game-design/spec-photo-qte-fiction.md` (Rev. 2)   | `narrative-designer` (Yasmine) | **PASS** — F-1…F-4 closed. 1 editorial correction (C-1).         |
| 3   | `docs/game-design/ux/photo-qte-controls.md` (Rev. 2)    | `ux-designer` (Tony)           | **PASS** — T-1…T-6 closed. 1 binding amendment (shared with #1). |

**Set-level verdict: PASS. The set ships to `senior-architect`.** All three specs are
scope-legal, serve the core loop without diluting it, are implementable without guessing, and
are now mutually coherent — after the three reconciliations ruled below, which are **gate
rulings to transcribe, not a rework round**. The escalation package (§E) travels with them.

---

## 0. E-1 — CLOSED

`docs/adr/0077-qte-photo-paparazzi-set-pieces.md` **is present on this branch** and I have read
it. Compared line-by-line against the frame I reconstructed at round 1 from the three specs'
restatements:

| ADR-0077  | Text on branch                                                                            | Round-1 reconstruction | Verdict |
| --------- | ----------------------------------------------------------------------------------------- | ---------------------- | ------- |
| D1        | authored set-pieces, one system / scripted instances                                      | identical              | ✓       |
| D2        | frame + zoom + shoot, dedicated full-screen telephoto view, world paused                  | identical              | ✓       |
| D3        | zoom = double trade-off (fill-the-frame validation **+** sway growing with magnification) | identical              | ✓       |
| D4        | hybrid briefing (dossier = WHO/WHERE, lens = WHEN/WHAT), telegraphed deterministic poses  | identical              | ✓       |
| D5        | multi-moment scene, exactly one master proof, others bonus                                | identical              | ✓       |
| D6        | suspicion from shutter noise vs. sound cover **+** finite authored film                   | identical              | ✓       |
| D7        | spotted = scene aborted, checkpoint retry, no death, no run loss                          | identical              | ✓       |
| D8        | two beats: mechanical click at the shutter, semantic verdict at the contact sheet         | identical              | ✓       |
| D9        | dedicated 2D backdrop + key-pose sprites, no zoom into live layers                        | identical              | ✓       |
| guardrail | determinism: no `Math.random`, no `Date.now`                                              | identical              | ✓       |

**Zero divergence. No round-1 verdict re-opens.** Every ruling of round 1 and round 2 is now
**final, not provisional**. Two residuals travel with the ADR, neither design-side:

- The ADR is `Status: Proposed` and its number is **self-allocated** with an explicit
  "re-check at merge per the adr-new guard" clause; ADR-0078 §Number records the claim. →
  **`producer`** owns the merge-time number re-check. Not a gate condition.
- ADR-0077's Consequences name a stage-5 obligation none of the three AC sets carried:
  _"playtest must specifically verify that players do not burn full film rolls unknowingly."_
  I impose it as **AC14** below rather than let the ADR's own follow-up evaporate.

---

## 1. The three rulings Sacha asked for (§11.3)

### R2-1 — `SWAY_AMP_X = 2.00 su`. **RATIFIED.**

My K-1 named a hole and a **closing condition** (`≤ 2.131 su`), explicitly not a value —
"Sacha re-derives and re-tunes". 2.00 is inside the condition. I re-derived the whole ladder
independently and it holds: `s_eff` = 5.128 / 3.697 / 2.664 su, shares **39.0 / 54.1 / 75.1 %**
against 80 / 60 / 80, isotropy proof `s_eff_y = s_eff_x / 1.7778` exact, ceiling
`min(0.60 × 3.697, 0.80 × 2.664) = 2.131` confirmed.

The argument for the extra headroom is the correct one and I want it on the record as gate
doctrine: **a fairness floor satisfied at 0.0 % margin is a floor the next re-author breaks
silently.** LA PLAQUE's box is an art-dependent value (F12(1) ties it to the delivered
sprite's opaque-pixel AABB); a 4 % shrink of that sprite at the art gate would have re-breached
a 2.131 tuning without anyone touching the tuning. 2.00 su buys ≈ 5 pp on both binding cells
for 3 pp of master difficulty against an intent that was never actually shipped. Right trade.

**Pinned as a consequence:** `SWAY_AMP_X` may not be raised above **2.10 su** without
re-running §3.3.a's table — write the ceiling next to the constant, not only in the floor.
The ×0.55 counter-offer (2.03) is **declined**: it buys ~1 pp of master tension and spends
most of the plaque's margin.

### R2-2 — The phase-scoped multiplier (phases 1-2 only, phase 3 always ×1.00). **RATIFIED, and it is the better answer than the one I asked for.**

This is a flagged deviation from my correction's literal wording, and it is the right kind:
the correction asked for a compound floor **asserted**, Sacha asserted it, and the assert then
falsified the uniform shape. I re-derived `m ≥ (tell + CUT + ε)/lull` per phase: **×0.650 /
×0.781 / ×1.000**. Phase 3 admits no compression at any honest ε. The alternatives were (a)
shave ε to ≤ 0.05 s — the non-recovery I already refused in round 1, (b) ship a uniform
×0.875 that moves nothing anyone can feel, (c) scope the lever out of the phase that has no
room. (c) is correct.

Three things make me ratify rather than merely accept:

1. **ε is a quotation, not a preference.** `LULL_RESIDUAL_FLOOR = 0.35 s` is the worst headroom
   `spec-boss-shield-break-tempo-shot.md` §6-B **already ships and was already gated at**
   (phase 3: 0.70 − 0.35). That construction makes the photo reward provably **additive** to
   the shield-break experience, and it removes the one thing I feared: a designer picking ε to
   fit the multiplier they wanted.
2. **The fiction says the same sentence.** "Il est moins couvert" has almost nothing to say in
   the frenzy, where the boss barely hunkers. The reward moves the **waiting**, not the
   **climax** — that is Yasmine's §5.4 invariant expressed in the phase index.
3. **The rejected `min()` alternative is rejected for the right reason** and is recorded so it
   is not reinvented: it makes the reward invisible on exactly the lulls a good player
   creates. Recorded, closed.

**Two pins, binding, and the second is a real trap I want caught before dev:**

- **The compound assert is NON-STRICT (`≥`), and that is deliberate.** My round-1 wording said
  `> telegraphLead + ε`; with ε pinned by quotation, phase 3 at ×1.00 sits at **exactly**
  0.70 = 0.35 + 0.35, so a strict `>` would fail the **shipped baseline**. Amendment A1 point 3
  correctly uses `≥`. **Do not "tighten" it to `>` in review** — the equality case is the
  shipped state ADR-0060 was gated at.
- **Phase 3 must be asserted byte-identical at every tier** (AC12 already says so). The
  phase-scoping is the whole safety argument; a future refactor that applies `m` uniformly
  "for consistency" reopens K-3.

### R2-3 — F5b's bonus ceiling of **1.30**. **RATIFIED, with one condition attached.**

"A bonus may require tracking, a master may not" is the right fairness line, and it is the
first threshold in this spec that encodes a _difficulty policy_ rather than a geometry. I
re-derived: master 0.541 ≤ 1.00, plaque **1.158** ≤ 1.30, and the derived demand
`v_required = (1.158 − 1) × 2.664 / 0.35 = 1.20 su/s` — 39 % of the subject's own speed, 10 %
of `PAN_RATE_MAX`. The numbers say what the fiction says (§3.2: "le bonus le plus utile est le
plus dur"), which is the test I care about.

**Condition (binding, cheap):** F5b's ceiling above 1.00 is legal **only when the spec also
publishes the derived `v_required` as a number and an AC asserts it** (AC6c does). A ceiling
of 1.30 without a stated pan demand is an adjective wearing a decimal point — the next
set-piece must inherit the pair, not the number. Write that sentence into F5b's own row.

---

## 2. Yasmine's two peer-lane syncs (§9.3)

### R2-4 — The plaque as a distinct boolean on the contact sheet. **YES, and it costs nothing.**

Fiction §4.4 point 2 needs `hasPlaque`, not `hasAnyBonus`, to choose variant (b). The mechanic
already carries it: every `Frame` record stores its candidate instant `I` and its verdict
(§2.2), so the sheet selects on
`frames.some(f => f.verdict === BONUS && f.instant === LA_PLAQUE)`. **Ruling: it is a
derivation from the frame records, NOT a new authored field and NOT a change to the reward
tiers.** R1 stays flat (any one bonus ⇒ ×0.80) and the fiction stays plaque-specific: the two
lanes are describing different things — R1 pays the effort, (b) reports the information.
Sacha: state the derivation explicitly in §4.4 so a dev does not invent a second flag.

**And the trap:** the run-scoped carry (E-4e) is 3-valued — `none | master | master+bonus`.
That is **sufficient today** because variant (b) is chosen on the contact sheet, in-scene,
with the frames still in hand. It becomes **insufficient the day `pm` un-defers the
`PARIS-MINUIT` UNE variant (F-2)**, which is read on the scores screen, a different level and
a different surface. **Carried into E-4 and E-5 as an explicit conditional:** un-deferring the
UNE variant requires the carry to gain a `hasPlaque` bit. Say it now, not in a bug report.

### R2-5 — `[ LAISSER TOMBER ]` readable without being attractive — **and the contradiction none of the three lanes noticed.**

Yasmine asked for a hierarchy. Reading the three Rev.2s side by side, the lanes do not agree on
what the hierarchy IS, on **either** branch. This is the one genuine cross-lane break of round 2
and I arbitrate it here.

| Branch              | Sacha §1.1/§1.3                              | Tony §4.3 / A14                 | Yasmine §4.3/§4.4               |
| ------------------- | -------------------------------------------- | ------------------------------- | ------------------------------- |
| **Master proof**    | **two** controls (`Continuer` + `Réessayer`) | **exactly one** (`Continuer`)   | one button (`[ CONTINUER ]`)    |
| **No master proof** | two, **the leaving one is primary**          | two, **`Réessayer` is primary** | two, "ni invisible ni attirant" |

**Ruling A — master-proof branch: EXACTLY ONE CTA, `[ CONTINUER ]`.** Two lanes of three
already say it, and the design reason is Sacha's own: the bonus tier is **deliberately flat**,
so a `Réessayer` offered on a successful roll invites re-rolling for a second bonus that pays
**nothing mechanical** — precisely the completionist pressure §D7.2 rejects in the same
paragraph that justifies the flat tier. Offering a retry on success would re-import it through
the button. `spec-photo-qte-paparazzi.md` §1.1 ("Two exits, always") and the §1.3 table are
**amended: two controls on the no-master branch, one on the master branch.**
_Re-opens only if `pm` un-defers the UNE variant (F-2) — at that point the plaque acquires a
visible payoff and "retry for the plaque" stops being an empty loop._

**Ruling B — no-master branch: TWO PEER CTAs, neither styled primary.** Sacha's "the leaving
control is primary" over-reads my K-4, which asked for _"retry, and an explicit decline… in one
press"_ — availability, not precedence. Tony's "`Réessayer` primary, decline secondary" makes
the decline the thing you have to go looking for, which is how an invariant quietly dies.
Yasmine names the target exactly and she is right. **Binding shape, transcribe verbatim into
both specs:**

> On the no-master-proof branch the contact sheet shows **two peer controls**, side by side in
> the same row, with **identical visual weight** (same size, same treatment, same type scale) —
> neither is styled as a primary action. Both ≥ 44×44 CSS px with visible spacing (A15).
> **Initial keyboard/gamepad focus rests on `[ RECOMMENCER ]`** — the failing player's most
> likely intent, and it keeps `[ LAISSER TOMBER ]` from being pre-armed by a reflex Enter.
> `[ LAISSER TOMBER ]` is **one press away at all times** (one Tab, or a direct tap) and is
> never nested, never behind a confirmation, never on a second screen.

That is "readable without being attractive" made testable. Consequences: Sacha §1.3 bullet 1
amended (leaving control is **always present, always one press, never subordinate** — not
"primary"); Tony §4.3 amended (`Réessayer` is a **peer**, not the primary) and **A14 must assert
equal weight**, not a primary/secondary pair, plus the initial-focus target. Visual dress inside
those constraints stays Tony's + Nico's. No re-gate.

**Naming pin (C-3):** the shipped strings are **Yasmine's** — `[ CONTINUER ]` /
`[ RECOMMENCER ]` / `[ LAISSER TOMBER ]`. `Continuer` / `Réessayer` / `Décliner` in the mechanic
and UX specs are **role names**, not copy. Nobody ships the English-lane word.

---

## 3. Cross-coherence of the three Rev.2 — what I checked and what broke

**Verified sound, independently re-derived (no drift):** the whole `s_eff` ladder and the
isotropy proof; the nine keyframes against §4.2's instants (transits land exactly on
`[9.2,11.0] [34.7,36.5] [51.2,53.0]` = the three 1.8 s tells; constancy on `[15.5,34.7]` and
`[40.3,51.2]` holds by construction; K6→K7 = 3.103 su/s and K7→K8 = 3.098 su/s, i.e. the car
does not change speed at the window's close — no motion tell); the pan budget K4→K6
(`√(8.00² + 5.72²) = 9.835 su / 12.0 = 0.82 s`) against the 1.8 s tell with the 0.66 s zoom
traverse concurrent; every focal band's endpoints against `FILL_MIN`/`FILL_MAX` and every
sweet spot as the exact geometric mid-band; F5c's 10.19 with 17.7 % headroom; the 258 mm
self-punishing threshold and the 124 % at `FOCAL_MAX`; F1/F2/F3/F4/F6/F7/F9/F13 against the
authored data; the compound F10 table and the ×0.781 wall.

**Bracket states ↔ F12: coherent.** Tony's three states are driven by `T3∧T4` and `T5` only;
F12(1a) forces one call site so the brackets and the tests cannot diverge; A7bis (pixel-diff of
the bracket region, `locked` on `NO_SUBJECT` vs `locked` on master) is the right assertion and
is stronger than my T-1 asked for. Sacha's §2.1 piecewise-constant track means the brackets'
motion becomes a **channel of the tell** instead of a leak, and it kills the symmetric
retro-leak I had not named. Accepted as specified.

**Décliner ↔ variante (c) ↔ T-3: coherent after R2-5.** Yasmine's §4.4 coverage table has no
hole: every terminal × roll-content combination lands in exactly one variant, the failure
line-1 is conditioned on the terminal (guidelines §5 rule 4 satisfied per-terminal, including
the "rouleau intact" case nobody had written), and the decline path adds **zero** copy.

**Budgets: they hold, with 2.2 s of slack — and I want the knob named now.** F13 = 87.8 ≤ 90 s
authored; AC13's measured ≤ 2 min must absorb F13 **plus** `CONTACT_SHEET_READ_BUDGET = 30 s`
= 117.8 s. That is real but thin. **Advisory A-2 (verify-leg):** if AC13 misses at playtest,
the knob is `PHOTO_BRIEFING_MAX_SECONDS` (25 s, and the briefing is skippable) — **not** the
read budget. A verdict screen hurried to fit a stopwatch defeats the two-beat feedback the
whole feature is built on. Named so the playtest does not guess.

**Two editorial drifts — non-blocking, but they must land before transcription.** Both are one
lane citing another lane's number and going stale. Neither is a design disagreement, so neither
re-opens the gate; both would ship as bugs.

- **C-1 (Yasmine, blocking transcription).** `spec-photo-qte-fiction.md` §4.4 point 2 still says
  _"R1 est plate (un bonus quelconque = ×0.75)"_. Rev. 2 of the mechanic withdrew ×0.75 — it
  breaches phase 2's compound floor. Correct to **×0.80**. The mechanic spec is the source of
  truth for every tier value; the fiction should cite the mechanism, not the number, wherever
  it can.
- **C-2 (Sacha, blocking transcription).** `spec-photo-qte-paparazzi.md` §1.2 still describes
  the posture as _"Space held on desktop, **a held on-screen button on mobile**"_. Tony's T-2
  fix is a **device fork**: hold on desktop, **tap-to-toggle on mobile**. §6.3 says the UX
  bindings are adopted unchanged, so the spec contradicts what it claims to adopt — and it is
  `dev-gameplay`'s own reading. Correct §1.2 and cross-reference UX §1.4.

**One playtest watch item, not a correction.** The mobile toggle makes a sway re-roll (lower →
raise resets the waypoint path to zero offset **and** zero velocity, §3.3) cost **two taps**
instead of a press-release. D1.b's 0.40 s arm still lands the re-raise at `u = 0.73` of the
first leg (the fast part), and each re-roll costs ≥ 0.40 s inside a 2.9-4.5 s window, so the
anti-spam argument survives the fork on paper. **Confirm it in the built game** — AC6c and AC10
are the right place. If re-rolling turns out to dominate on mobile, the fix is a raise-index
continuity rule, **not** a punishment (D1.c stands: spam costs time, never suspicion or film).

---

## 4. Gate-imposed additions (transcribe verbatim, no re-gate)

- **AC14 (new, Sacha's spec) — the ADR's own stage-5 obligation, previously uncarried.**

  > **AC14 — the two-beat frustration hunt (ADR-0077 §Consequences).** At `verify`, a
  > first-time player must not reach `ROLL_END` with zero valid frames **without having
  > understood why**. The taught channel is the three-state bracket (`dashed` → `solid` →
  > `locked`) plus the crisp/dull click; the contact sheet's `rejectReason` stamps are the
  > diagnostic of last resort, not the teaching. If the observed failure mode is "the player
  > never saw `locked` before spending the roll", the deviation is reported to the design gate
  > — it is a spec problem, not a player problem.

- **F5b row (Sacha):** append the R2-3 condition — _a ceiling above 1.00 is legal only when the
  derived `v_required` is published as a number and asserted (AC6c)._
- **§3.3 constants table (Sacha):** write `SWAY_AMP_X ≤ 2.10 su` next to the constant (R2-1).
- **§1.1 / §1.3 (Sacha), §4.3 + A14 (Tony):** the R2-5 CTA shape, verbatim.
- **§4.4 (Sacha):** state the `hasPlaque` derivation from the frame records (R2-4).
- **C-1 (Yasmine), C-2 (Sacha), C-3 (all three):** the editorial fixes above.

None of these is a design decision left open — each is a sentence with its exact content given.
Transcription is `game-designer` / `narrative-designer` / `ux-designer` housekeeping; **no
fourth review of mine is required**, and the specs may travel to `senior-architect` in parallel
with the transcription.

---

## 5. Scope, loop and verifiability — the gate's own four tests, round 2

1. **Scope.** [EXTENSION], conscious and documented, and the document now exists on the branch
   (§0). Same standard as ADR-0012 / 0030 / 0034 / 0051. **PASS.**
2. **Core loop.** `Récupérer → Livrer → Éviter` untouched: no loop verb added, no rule added to
   `Éviter`, no energy, no score, no quota (F8, asserted as a zero-delta test). The set-piece
   plays before the delivery and outside the mission timer. **"Une mission = 3-5 minutes"
   survives** because the retry loop is now bounded on both legs: F13 (≤ 90 s authored,
   code-asserted) and AC13 (≤ 2 min measured), with a decline exit in one press. That was the
   whole of K-4 and it is closed. **PASS.**
3. **Verifiability.** The nine-keyframe table replaced the adjective; every floor F1–F13 is an
   assert against authored data; every threshold above 1.00 now publishes its derived demand.
   A dev can build this without guessing. **PASS.**
4. **Coherence.** Mechanics ↔ fiction ↔ UX reconciled by R2-4 / R2-5 / C-1 / C-2; against the
   gated set — ADR-0060 (compound F10 + amendment A1), the décor aim-honesty ruling (F12(1)),
   ADR-0034 Rev. 3 (determinism, seed pin), ADR-0003 (mobile is supported ⇒ ≤ 2 contacts) — no
   contradiction survives. Art conflicts are **flagged to `lead-art`, not arbitrated** (E-6).
   **PASS.**

**G-1 / G-2:** per Bertrand's E-3 ruling they stand as a **local exception for this QTE only**
and do **not** enter `PROJECT_GUIDELINES.md`. Recorded in fiction §7. Consequence I accept and
name: **the next set-piece re-argues both at the gate from zero** — this set creates no
opposable precedent. That is the cost of the ruling, and it is Bertrand's to have chosen.

---

## E. Consolidated outgoing escalation package

E-1 **CLOSED** (§0). E-2 **CLOSED** — ratified by Bertrand, canon gravé. E-3 **CLOSED** —
G-1/G-2 = local exception, not general rules. The four below travel with the PASS.

| ID      | To                       | Payload                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  |
| ------- | ------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **E-4** | `senior-architect`       | Seven asks. Round 1: **(a)** tick-gate the set-piece on the existing `paused` flag (design requirement, not a nicety — an unpausable deterministic scene is a broken one); **(b)** composition-validity and master/bonus role reach the render as **two independently computed fields**, never conflated; **(c)** `photoQteSpec === null` levels byte-identical. Rev. 2 adds: **(d)** `subjectTrack` data shape — `{t, cx, cy, w, h}[]` sorted on `t`, linear on all four components, F12(3) totality asserted at construction, and the brackets must consume the **same evaluated value** as T3/T4 (one call site — F12(1a) holds by construction, not by inspection); **(e)** a **run-scoped carry Stalingrad → Niveau Final** for the roll outcome — no such carry exists today outside ADR-0076's run-stats work; **it is 3-valued (`none｜master｜master+bonus`) and that is sufficient ONLY while the `PARIS-MINUIT` UNE variant stays deferred — un-deferring it (E-5) requires a `hasPlaque` bit** (R2-4); **(f)** `rewardMultiplier` authored on the **Niveau Final `bossQteSpec` row**, never a module constant, applied **before** `SHIELD_BREAK_LULL_CUT` and **before** the existing clamp, **phases 1-2 only** (amendment A1 point 2), **and the compound assert is non-strict `≥` — do not tighten it to `>`, the shipped baseline sits on the equality** (R2-2); **(g)** the decline exit returns control to the interrupted delivery **without a reload of the Stalingrad level state** — an exit from the set-piece, not a level restart. Plus: **amendment A1 (§D7.2) is transcribed verbatim into the gated `spec-boss-shield-break-tempo-shot.md` by that spec's lane** — no re-gate if verbatim. `producer`: ADR-0077's self-allocated number needs the merge-time re-check per the adr-new guard. |
| **E-5** | `pm`                     | (1) Set-piece is **bonus, never gate** — ratified, and now implemented (the `[ LAISSER TOMBER ]` button IS the invariant; if it disappears from the build, the claim becomes a lie — that is the design-acceptance check at stage 5). (2) Confirm placement in the Stalingrad story's scope and the build-order relative to the rest of Stalingrad (with `senior-architect` + `producer`). (3) **Rule on the deferred `PARIS-MINUIT` UNE variant** (F-2, ~2 strings, scores screen) — **and be told the price: un-deferring it makes the cross-level carry 4-valued (E-4e), i.e. it is no longer a 2-string change.** (4) The whole first-playthrough attempt is budgeted at ≤ 2 min (AC13) in front of a 3-5 min mission.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                               |
| **E-6** | `lead-art` (Nico)        | Peer lane — **flagged, not arbitrated** (`docs/art-direction.md` is yours). Four constraints, all functional: (1) **T-4** — the suspicion dial keeps its analogue-needle form but **no copy, glyph, numeral or treatment may present it as a light/exposure meter** (no lux markings, no sun/aperture iconography, no "EV"): the mechanic is shutter-noise-vs-cover, and a light-meter dress teaches a false causal model. (2) **F-4/glow** — guidelines §5 _"ce qui brille est interactif"_: here the subject **is** the interactive element but must **never be shot**, so the plate must make it read **without** the interactive-glow vocabulary (same trap as delivery-assault K-6 and the mur-d'enceintes note). (3) **F12(1) — the drawn subject and the keyframe table are ONE deliverable, not two**: at each of the 9 keyframes the delivered sprite's opaque-pixel AABB must match the authored box within `SUBJECT_BOX_TOLERANCE = max(0.40 su, 5 %)`; direct application of the gated décor aim-honesty ruling (2026-07-20). (4) **Two non-drifting hold poses are required** — the pair standing/talking (K2→K3, 19.2 s) and the pair post-exchange, heads still close (K4→K5, 14.7 s): their idle animation must stay inside the same tolerance, because **a dead beat where the actors drift is a semantic leak with extra steps**. Plus the three bracket states and three verdict stamps, all grayscale-distinguishable; mobile toggle button corner within "away from the pan and two-finger-tap zones"; asset list = fiction §6.                                                                                                                                                                                                                                                                     |
| **E-7** | `sound-designer` (Malik) | The cover windows are **gameplay state, not ambience**: `[10,17] [31,38] [52,59]` s with a **1.8 s audible approach** before each (`TRAIN_TELL_SECONDS`) — the approach must be audible **before** it is visible, and "covered" vs. "silent" must be unmistakable **without looking at the needle**. The shutter's **crisp vs. dull** click is the **sole** audio channel for T5 (focus held): an attentive ear must hear the difference with the visuals off. **The K-1 retune moved `SWAY_AMP_X` only — not one window, tell or cadence value changed**, so nothing you were briefed on at round 1 has moved. Malik gates his own deliverable; this is the design data it must be built against.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       |

---

## 6. What happens next

1. Sacha / Yasmine / Tony transcribe §4's additions (no fourth gate pass, no re-gate).
2. The set goes to **`senior-architect`** with E-4; `pm` picks up E-5; the art request opens to
   `concept-artist` → `lead-art` with E-6; `sound-designer` picks up E-7.
3. Amendment **A1** is transcribed verbatim into `spec-boss-shield-break-tempo-shot.md` by that
   spec's lane. Verbatim ⇒ no re-gate of the boss spec.
4. **Stage 5:** Sacha playtests the built set-piece against **AC1–AC14** and reports to me; I
   verdict **design acceptance** on that report. A feature that drifted from this spec goes back
   to the dev lane, or the spec is amended and re-gated — explicitly, never by silent drift. The
   three things I will look at first: the `[ LAISSER TOMBER ]` button exists and works in one
   press (the invariant), AC14 (the frustration hunt), and AC6b(d) (drawn == box, at the art
   composite).

_Karim — `lead-game-designer`, 2026-08-01, round 2, final._
