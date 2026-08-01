# Story — QTE photo paparazzi (ADR-0077 set-pieces)

Frame: `docs/adr/0077-qte-photo-paparazzi-set-pieces.md` (claimed on this branch,
`design/qte-photo-paparazzi`). Design loop: `game-designer` + `narrative-designer` +
`ux-designer` in parallel → `lead-game-designer` design gate.

## stage-2. DESIGN GATE — lead-game-designer (Karim) — 2026-08-01

- claim: gate the three design-loop deliverables (mechanic / fiction / UX) against ADR-0077,
  `PROJECT_GUIDELINES.md` and the previously gated QTE + boss specs; rule every flagged point;
  name the escalations.
  release: `docs/game-design/design-gate-photo-qte.md` (full verdict, rulings, corrections,
  escalations E-1…E-7). File List: `docs/game-design/design-gate-photo-qte.md`,
  `docs/game-design/README.md` (index row), `docs/handoffs/story-qte-photo-paparazzi.md`.
- VERDICT: PASS — design gate, `spec-photo-qte-paparazzi.md` (lead-game-designer)
- VERDICT: PASS — design gate, `spec-photo-qte-fiction.md` (lead-game-designer)
- VERDICT: PASS — design gate, `ux/photo-qte-controls.md` (lead-game-designer)

All three PASS are **WITH CORRECTIONS / CONDITIONS** — rework round 1 of 2, nothing ships to
`senior-architect` until round 2 passes and E-1 is closed.

**Blocking caveat E-1 — the frame law is missing.** `docs/adr/0077-…` does not exist on this
branch (numbering jumps 0076→0078; ADR-0078 §Number records the claim at commit `82850c16`).
The gate ran against a frame **reconstructed** from the three specs' mutually concordant
restatements of D1–D9. Every verdict is provisional on the ADR landing here; if its text
diverges, the gate re-opens on the divergent point only.

**Mechanic (Sacha) — PASS WITH CORRECTIONS, 4 blocking.** Ratified: state machine + D1.a/D1.b,
`SPOTTED`→contact sheet, focus = 0.35 s HOLD, `+34` with no decay (F3 replaces a decay and is
assertable), `filmCount 6`, R1+R3 / R2 rejected, host level **Stalingrad**, floors
F1/F2/F3/F4/F6/F7/F8/F9/F11 (re-derived, they hold). Blocking: **K-1** F5's slack arithmetic
omits `FRAME_MARGIN` ⇒ the master (65 % vs ≤60 %) and LA PLAQUE (90 % vs ≤80 %) breach their
own floor; retune on `SWAY_AMP_X` (≤ 2.13 su closes both). **K-2** `subjectTrack` unimplementable
(no keyframes delivered) and its inter-instant transit pre-announces the next subject before
the tell ⇒ new floor **F12** (drawn==box per the 2026-07-20 décor aim-honesty ruling, no
early transit, total definition). **K-3** F10 ignores the gated ADR-0060 shield-break cut:
compounded, the stated ×0.70 floor drives phase-3 lull to 0.34 s < 0.35 s tell ⇒ compound
floor + `rewardMultiplier` scoped to the Niveau Final spec + R1 transcribed as a numbered
amendment to the gated boss spec. **K-4** `DONE` offers only `Réessayer` on failure ⇒ the
"bonus, jamais gate" invariant is not implemented; add a decline exit + a ≤2 min first-play
budget.

**Fiction (Yasmine) — PASS WITH CONDITIONS.** Ratified: the Commandant as target (alt. B
reserved as set-piece #2), the triptych incl. "two faces AND two hands", "isolé jamais
affaibli" as the reward invariant, Oxane by mention, the anonymous patron de boîte (no 4th
faction). Conditions: **F-1** write the decline copy (pairs with K-4); **F-2** ship (a)+(b)+(c),
defer the `PARIS-MINUIT` UNE variant to `pm`; **F-3** blocked on E-2; **F-4** art request
AUTHORISED with two constraints handed to `lead-art`.

**UX (Tony) — PASS WITH CORRECTIONS, 2 blocking.** Four seams answered by Sacha and ratified.
Blocking: **T-1** third bracket state (`dashed`/`solid`/`locked`) + A6 to three states;
**T-2** mobile needs up to 3 simultaneous contacts while raised ⇒ re-derive under "≤2 contacts,
one may be the held raise", or a mobile-only toggle. Conditions T-3 (two CTAs), T-4 (the needle
is not a light meter), T-5 (posture on resume from pause is unspecified), T-6 (counter form vs
`POSES : {n}`).

**Escalations (round 1).** E-1 ADR-0077 absent → `producer`/`senior-architect`. **E-2 Bertrand: the
ideological flag (§8.3) — repression commissioned and paid for by "la nuit légale", irreversible
once shipped; not the gate's to ratify.** E-3 Bertrand: adopt proposed guidelines rules G-1
(verb count in a dedicated set-piece) and G-2 (diegetic tension instrument vs §6's "pas de barre
de stress"). E-4 `senior-architect`: pause tick-gating, two independent fields, null-spec
byte-identity, **new cross-level run-scoped carry Stalingrad→Niveau Final**, keyframe data shape.
E-5 `pm`: progression + the deferred UNE variant. E-6 `lead-art`: no interactive-glow vocabulary
on a non-shootable subject, drawn==box, needle-is-not-a-light-meter. E-7 `sound-designer`: cover
windows are gameplay state; crisp/dull click is the sole T5 audio channel.

## stage-2. DESIGN GATE — ROUND 2 (FINAL) — lead-game-designer (Karim) — 2026-08-01

- claim: gate the three Rev.2 deliverables; rule the 3 points Sacha escalated (§11.3), the 2
  peer-lane syncs Yasmine escalated (§9.3), and the cross-coherence of the set; close or carry
  every escalation.
  release: `docs/game-design/design-gate-photo-qte.md` § ROUND 2 (verification of E-1, rulings
  R2-1…R2-5, gate-imposed additions, consolidated escalation package E-4…E-7). File List:
  `docs/game-design/design-gate-photo-qte.md`, `docs/game-design/README.md` (index row),
  `docs/handoffs/story-qte-photo-paparazzi.md`.
- VERDICT: PASS — design gate round 2, `spec-photo-qte-paparazzi.md` (lead-game-designer)
- VERDICT: PASS — design gate round 2, `spec-photo-qte-fiction.md` (lead-game-designer)
- VERDICT: PASS — design gate round 2, `ux/photo-qte-controls.md` (lead-game-designer)

**SET-LEVEL: PASS. The set ships to `senior-architect`.** Round 2 was the cap; no round 3 was
needed. Scope ([EXTENSION], documented), core loop (untouched, retry loop now bounded on both
legs), verifiability (keyframes replace adjectives, every floor asserted) and coherence
(mechanics ↔ fiction ↔ UX ↔ the gated set) all PASS.

**E-1 CLOSED.** `docs/adr/0077-…` is present on this branch and reads **identical** to the
round-1 reconstruction on all nine decisions D1–D9 plus the determinism guardrail. Zero
divergence ⇒ no round-1 verdict re-opens; every ruling is now final, not provisional. Residuals
carried, neither design-side: the ADR's self-allocated number needs the merge-time re-check
(`producer`), and its Consequences carried a stage-5 obligation no AC set held — imposed as
**AC14** (the two-beat frustration hunt).

**The 3 rulings Sacha asked for.** **R2-1 `SWAY_AMP_X = 2.00 su` RATIFIED** (my K-1 named a
closing condition ≤2.131, not a value; 2.00 is inside it; doctrine recorded: a fairness floor
satisfied at 0 % margin is a floor the next re-author breaks silently — and LA PLAQUE's box is
art-dependent via F12(1)). Pin: `SWAY_AMP_X ≤ 2.10` written next to the constant; the ×0.55
counter-offer declined. **R2-2 the PHASE-SCOPED multiplier RATIFIED — better than what I asked
for**: the compound assert I demanded is what falsified the uniform shape (`m ≥ 0.650/0.781/1.000`
per phase ⇒ phase 3 admits no compression at any honest ε); ε = 0.35 s is a **quotation** of
ADR-0060's own worst shipped headroom, not a preference, which makes the reward provably
additive; the `min()` alternative rejected for the right reason (invisible on every lull a good
player creates). **Two binding pins: the compound assert is NON-STRICT `≥` — do NOT tighten it
to `>` in review, the shipped baseline sits exactly on the equality (phase 3 = 0.70 = 0.35+0.35);
and phase 3 must be asserted byte-identical at every tier.** **R2-3 F5b ceiling 1.30 RATIFIED
with a condition**: a ceiling above 1.00 is legal only when the derived `v_required` is
published as a number and asserted (1.20 su/s, AC6c) — otherwise it is an adjective with a
decimal point.

**The 2 peer-lane syncs Yasmine asked for.** **R2-4 the plaque IS a distinct boolean, derived
from the frame records** (`verdict === BONUS && instant === LA_PLAQUE`), not a new authored
field and not a change to the flat R1 tiers — R1 pays the effort, fiction (b) reports the
information. **Trap named:** the run-scoped carry (E-4e) is 3-valued and that is sufficient ONLY
while the `PARIS-MINUIT` UNE variant stays deferred; un-deferring it (E-5) requires a
`hasPlaque` bit, i.e. it stops being a 2-string change. **R2-5 — the cross-lane break none of
the three lanes noticed**: the specs disagreed on the CTA shape on BOTH branches (Sacha: 2+2
with the leaving control primary; Tony: 1 on master, `Réessayer` primary on failure; Yasmine:
1 on master, "ni invisible ni attirant"). Arbitrated: **(A) master branch = EXACTLY ONE CTA
`[ CONTINUER ]`** (2 lanes of 3, and the reason is Sacha's own — the bonus tier is deliberately
flat, so a retry on success re-imports the completionist pressure §D7.2 rejects); **(B) failure
branch = TWO PEER CTAs, neither styled primary, identical visual weight, both ≥44×44 with
spacing, initial focus on `[ RECOMMENCER ]`, `[ LAISSER TOMBER ]` always one press away, never
nested/confirmed/second-screen.** Sacha's "leaving control is primary" over-read K-4
(availability ≠ precedence); Tony's "decline = secondary" is how an invariant quietly dies.

**Cross-coherence.** Independently re-derived and sound: the full `s_eff` ladder + isotropy
proof, the 9 keyframes against §4.2 (transits land exactly on the three 1.8 s tells; the car's
speed does not change at the window close — 3.103 vs 3.098 su/s, no motion tell), the K4→K6 pan
budget (9.835 su / 12.0 = 0.82 s) vs the concurrent 0.66 s traverse, every focal band endpoint
and geometric mid-band sweet spot, F5c's 17.7 % headroom, the 258 mm self-punishing threshold,
the compound F10 table and the ×0.781 wall, F1/F2/F3/F4/F6/F7/F9/F13. Brackets ↔ F12 coherent
(A7bis pixel-diff is stronger than T-1 asked); the piecewise-constant track turns the brackets'
motion into a channel of the tell and kills the retro-leak I had not named. Yasmine's §4.4
coverage table has no hole (incl. "rouleau intact"). **Budgets hold with 2.2 s of slack**
(F13 87.8 + read budget 30 = 117.8 vs AC13's 120) — **advisory A-2: if AC13 misses, the knob is
`PHOTO_BRIEFING_MAX_SECONDS`, NOT the read budget; a verdict screen hurried to fit a stopwatch
defeats the two-beat feedback.**

**Non-blocking, must land before transcription (no re-gate).** **C-1** fiction §4.4 still cites
the withdrawn `×0.75` (Rev.2 = ×0.80; ×0.75 breaches phase 2's compound floor) → cite the
mechanism, not the number. **C-2** mechanic §1.2 still says "held on-screen button on mobile" —
T-2's fix is a **device fork** (hold on desktop, tap-to-toggle on mobile), so the spec
contradicts the UX it claims to adopt unchanged. **C-3** the shipped strings are Yasmine's
(`[ CONTINUER ]` / `[ RECOMMENCER ]` / `[ LAISSER TOMBER ]`); the other specs' words are role
names. **Playtest watch (not a correction):** the mobile toggle makes a sway re-roll 2 taps
instead of a press-release — D1.b's 0.40 s arm still lands it at the fast part of the leg, so
the anti-spam argument survives on paper; confirm at AC6c/AC10, and if it dominates the fix is a
raise-index continuity rule, never a punishment (D1.c stands).

**Gate-imposed additions, transcribe verbatim, no fourth pass:** AC14 (ADR-0077's own stage-5
frustration-hunt obligation); the R2-3 condition on F5b's row; `SWAY_AMP_X ≤ 2.10` next to the
constant; the R2-5 CTA shape into Sacha §1.1/§1.3 and Tony §4.3+A14; the `hasPlaque` derivation
into §4.4; C-1/C-2/C-3. Specs may travel to `senior-architect` in parallel with transcription.

**Escalations (round 2 — consolidated outgoing package).** E-1 **CLOSED** (ADR verified on
branch). E-2 **CLOSED** (Bertrand: canon gravé). E-3 **CLOSED** (Bertrand: G-1/G-2 = local
exception for this QTE only, NOT in `PROJECT_GUIDELINES.md` — accepted cost, named: the next
set-piece re-argues both from zero, this set creates no opposable precedent). Travelling:
**E-4 `senior-architect`** — 7 asks: (a) tick-gate on `paused`, (b) validity and role as two
independently computed fields, (c) null-spec byte-identity, (d) `subjectTrack` shape
`{t,cx,cy,w,h}[]` + one call site shared with the brackets (F12(1a) by construction), (e) the
**new run-scoped Stalingrad→Niveau Final carry** (3-valued, conditional on E-5), (f)
`rewardMultiplier` on the Niveau Final row, applied before the cut and before the clamp, phases
1-2 only, **assert non-strict**, (g) decline exits without reloading the level state; plus
amendment **A1** transcribed verbatim into the gated `spec-boss-shield-break-tempo-shot.md` by
that spec's lane, and the ADR-0077 number re-check at merge (`producer`). **E-5 `pm`** — bonus
never gate (now with a button that IS the invariant), Stalingrad scope/build order, rule on the
deferred UNE variant **knowing it makes the carry 4-valued**, AC13's ≤2 min in front of a 3-5 min
mission. **E-6 `lead-art`** — 4 functional constraints, flagged not arbitrated: T-4 (the dial is
never a light/exposure meter), F-4 (the subject must read WITHOUT interactive-glow vocabulary —
it is interactive but must never be shot), F12(1) (drawn == box at all 9 keyframes within
`max(0.40 su, 5 %)` — art and keyframe table are ONE deliverable), and **two non-drifting hold
poses** (K2→K3 19.2 s, K4→K5 14.7 s — a dead beat where the actors drift is a semantic leak with
extra steps). **E-7 `sound-designer`** — cover windows `[10,17] [31,38] [52,59]` + 1.8 s audible
approach are gameplay state, crisp/dull click is the sole T5 channel; **the K-1 retune moved
`SWAY_AMP_X` only — no window, tell or cadence value changed since round 1.**

**Stage 5 (design acceptance, mine):** Sacha playtests against **AC1–AC14**; I verdict the
report. First three things I look at: the `[ LAISSER TOMBER ]` button works in one press (the
invariant), AC14, and AC6b(d) drawn == box at the art composite.
