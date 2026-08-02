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

## stage-3. TECH PLAN — senior-architect (Winston) — 2026-08-01

- claim: turn the gated design set into a buildable technical plan — answer the seven E-4 asks
  with concrete structures, cut the dev lanes on non-overlapping paths, fix the build order, and
  rule whether ADR-0077 suffices.
  release: `docs/game-design/techplan-photo-qte.md` (12 sections, 9 headline decisions D-A…D-I)
  \+ `docs/adr/0080-photo-leverage-cross-level-carry.md` (Proposed). File List:
  `docs/game-design/techplan-photo-qte.md`, `docs/adr/0080-photo-leverage-cross-level-carry.md`,
  `docs/adr/README.md` + `public/adr/index.html` (regenerated index, freshness gate green),
  `docs/handoffs/story-qte-photo-paparazzi.md`, `docs/agent-handoffs.md`.
- VERDICT: APPROVED for build — 3 lanes, one ordering constraint, one typed seam. **No production
  code touched at this stage.**

**The seven E-4 asks — three are free, four are contracts.** **(a)** tick-gate on `paused`:
free — `useFrame` returns on `paused` (`useGameLoop.ts:327`) and the set-piece is a **fourth
frozen-scene block of `tickGameState`** (the hostage/boss shape), so every gauge freezes; a
design running beside the loop is rejected, and the property is asserted, not assumed. **(g)**
decline without a level reload: free for the same reason — the level state was never destroyed,
it rode `...state` with the clock frozen; **"retry from checkpoint" = re-entering the set-piece,
not a level checkpoint** (a clarification the specs left implicit, now pinned). **(c)**
byte-identity: the shipped additive-and-optional law (`bossQteSpec`/`lootSpec`), identity-tested.
**(b)** two independent fields: `PhotoComposition` (mechanical, live) vs `PhotoFrameRecord[]`
(semantic, sealed), and **the split is enforced by the projection types** — `photoSceneView` has
no field able to express a verdict, `photoSheetView` returns `null` before `CONTACT_SHEET`, so
the render **cannot** leak the secret. **(d)** `{t,cx,cy,w,h}[]` + **one evaluator**: the box is
computed once per tick and carried on `photoQte.subjectBox`; the brackets read that carried
value, so F12(1a) holds because there is **no second place that can compute it**. **(f)** the
multiplier: authored **tiers** on the Niveau Final row (absent ⇒ ×1.00), resolved once into
`BossQte.rewardMultiplier`, applied through **one** helper at the **three** lull sites, phases
1-2 only, ordered multiplier → cut → clamp, compound floor asserted **non-strict `≥`** with
ε = 0.35 quoted from ADR-0060. **(e)** the carry ⇒ its own ADR (below).

**The trap E-4(f) was pointing at is worse than it looked, and it is now closed.**
`shieldedLullSeconds` / `telegraphLeadSeconds` are **module constants in `BOSS_PHASE_TABLE`,
shared by Belliard AND the Niveau Final** — there is no per-level tuning row today. A multiplier
on the table or on `phaseTuning()` would hit both encounters, i.e. exactly the K-2 burn the gate
warned about. Hence: authored data on the row, resolved into the runtime record, one application
point. **Bonus property, free and worth having:** since `LULL_RESIDUAL_FLOOR (0.35) >
SHIELD_BREAK_LULL_FLOOR_MARGIN (0.05)`, any multiplier passing the construction-time compound
assert makes the runtime clamp **provably unreachable** — so AC12's "the −0.5 s cut is never
silently eaten" stops being a playtest hope and becomes structural.

**ADR verdict: ADR-0077 does NOT suffice — `docs/adr/0080-photo-leverage-cross-level-carry.md`
is written (Proposed).** Six of seven asks land inside shipped patterns and need no ADR. The
seventh does: the carry is **the first non-navigational cross-level state in muf** (ADR-0076 F1
is explicit that a run is one attempt on one level, and levels are separated by the menu and
possibly a browser reload), it needs a **sixth `muf_*` key**, it re-applies ADR-0076 D4's
pure/impure split to a second feature, and it couples one level's outcome to another level's
authored tuning. Decisions: **persisted** `muf_leverage`, **object** blob `{v, leverage}` so the
deferred `hasPlaque` bit is an added FIELD not a migration (R2-4's trap priced: one field, one
tier read, one scores-screen read — not 2 strings, not a migration), total parse, monotone merge,
pure algebra in `src/game` + I/O in `src/hooks`, **banked when the player LEAVES the set-piece,
not when Stalingrad is cleared** (contingency on clearing would re-couple an optional bonus to a
mandatory success — the exact pressure K-4 removed; flagged to `pm` as one predicate to
overrule). **Number 0080 self-allocated** (no producer in the loop, same posture as ADR-0077's
own §Number): verified against the branch, `origin/main` and all 107 fetched remote refs (max
visible 0077, itself claimed on three unmerged branches); **`producer` owns the merge-time
re-check for 0077 AND 0080**. ADR index regenerated, freshness gate green.

**Lanes — non-overlapping, one ordering constraint.** **A `dev-gameplay`** = `src/game/**`
(minus `assetManifest.ts`) + `src/hooks/**`, TDD, runs first: A0 seam types + channel (releases
B), A1 the determinism kernel, A2 the photo machine, A3 the boss lever + carry, A4 the bridge.
**B `dev-r3f-render`** = `src/render/**` only: telephoto view, three-state brackets, diegetic HUD
(CSS Modules + tokens, ADR-0046), contact sheet with the **R2-5 CTA shape verbatim**, mobile
toggle button, `App.tsx` seed/persist wiring. **C `dev-tooling-assets`** = `levelArt.json`,
`assetManifest.ts` (named exception: one file, one owner, for this story), `scripts/**` —
independent from t=0, and the art request is the longest pole. **A2 and A3 are the same lane and
must be SEQUENCED, not parallelised** (both touch `types/gameState.ts` and `levels.data.ts`).

**Two decisions the lanes could not have made, and one lint the plan adds.** **D-B: the device
fork dies in the bridge** — desktop hold-Space and the mobile toggle both resolve to one
`raiseIntent: boolean` before crossing into `src/game`, which keeps every device word out of the
pure layer AND makes **T-5 (resume `LOWERED`) one line on both devices** (clear the toggle latch
when `paused` goes true; desktop is free). **D-H: extract the determinism kernel BEFORE writing
the third copy** — `hash32`/`smoothstep` already exist **twice**, byte-identical in body, in
`qteSystem.ts` and `bossQteSystem.ts`; a third copy in the photo sway is precisely the silent
fork ADR-0077's Consequences hand to the review panel. Golden-vector test first, then the move;
the shipped seed pins are the regression. And **`scripts/check-photo-subject-boxes.mjs`** (Lane
C) makes **F12(1)(b) enforceable in CI**: the delivered sprite's opaque-pixel AABB vs the
authored box at each of the 9 keyframes, tolerance imported from the game module — the only
mechanism that catches a 4 % sprite shrink silently re-breaching F5a, which is R2-1's stated fear.

**Open, cheap, non-blocking.** **Q-1 → `game-designer` + `ux-designer`:** UX §1.1 gives desktop
an **absolute** mouse mapping, but the mechanic hangs F5b/F5c/AC6c on `PAN_RATE_MAX`; taken
literally that makes F5c vacuous on desktop and AC6c a mobile-only criterion — two fairness
models for one gated tuning. Plan builds the **rate-limited** form on both devices (D-I, ≈ 86 %
of frame width per second at 251 mm — imperceptible); one branch to revert. **Q-2 → `pm`:**
ratify ADR-0080 D3 (bank at exit). **To `game-designer`, editorial:** §1.1's phase table omits
**`BRIEFING`**, which F13 counts and §1.3 makes skippable — the plan builds it as a phase of the
machine (D-G).

**Residues assigned.** **Amendment A1 → `game-designer` (Sacha)**, verbatim into
`spec-boss-shield-break-tempo-shot.md` (own series, no re-gate); **C-1 → `narrative-designer`**
(×0.75 → ×0.80); **C-2 → `game-designer`** (device fork); **C-3 → `game-designer` +
`ux-designer`** (role names vs shipped strings); gate §4 transcriptions to their three lanes, in
parallel with the build. **Doc↔code bug found and routed to `tech-writer` (Otis):**
`spec-boss-shield-break-tempo-shot.md` still carries `Status: DRAFT (Rev. 2) — needs PASS before
any dev implements it`, while **lever 6 is shipped in `bossQteSystem.ts`** and the photo gate
cites the spec as GATED (ADR-0060). The stale status must be corrected **before** A1 is
transcribed onto it — an amendment onto a "do not implement" header is a trap for the next
reader.

**Routed:** `qa-lead` (A3bis touch-count, A7bis bracket pixel-diff, A9 pause/resume, A14bis
one-press decline, AC13(b) is wall-clock not an assert); `gpu-specialist` (low risk, **no perf
gate requested** — one plate + ≤6 sprites on a frozen world; watch preload and per-frame material
churn); `sound-designer` (`inCover(t)` is game state the audio lane reads, never re-derives;
`exposed.focusHeld` is the single boolean behind the crisp/dull click); `lead-art` (E-6 unchanged,
but F12(1) now has CI teeth); `pm` (Q-2 + the E-5 price).
