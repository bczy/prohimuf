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

## stage-2bis. DESIGN GATE — CONTRÔLE DELTA Rev.3 (relocalisation Belliard) — lead-game-designer (Karim) — 2026-08-02

- claim: contrôle **delta** de l'amendement Rev.3 (hôte = Belliard, décision Bertrand du
  2026-08-02, override de mon ruling R-10) — vérifier **uniquement** ce que la relocalisation a
  touché, rendre les 2 rulings demandés en §11.0, arbitrer le désaccord inter-lanes sur la
  fiction §2.3, contrôler la cohérence delta (fenêtres, déclencheur, contraintes art, pin de
  scope). **Ce n'est pas un round 3** : la décision n'est pas rediscutée, elle est exécutée.
  release: `docs/game-design/design-gate-photo-qte.md` § CONTRÔLE DELTA. File List:
  `docs/game-design/design-gate-photo-qte.md`, `docs/game-design/README.md` (ligne d'index),
  `docs/handoffs/story-qte-photo-paparazzi.md`, `docs/agent-handoffs.md`.
- VERDICT: **PASS DELTA sous 1 condition bloquante (D-1)** — design gate,
  `spec-photo-qte-paparazzi.md` Rev.3 (lead-game-designer)
- VERDICT: **PASS DELTA** — design gate, `spec-photo-qte-fiction.md` Rev.3 (lead-game-designer)
- (`ux/photo-qte-controls.md` Rev.2 non touché par la relocalisation — non relu. Le techplan et
  l'ADR-0080 sont le gate de Winston, pas le mien : 3 notes design lui reviennent.)

**Le travail des deux lanes est honnête et je l'ai re-dérivé, pas cru.** Fenêtres
[10,17][31,38][52,59] + tells 8,2/29,2/50,2 avec période 21 / offset 10 ✓ ; F3 = 4,5/**1,5**/2,9
≥ 1,2 ✓ ; K6→K7 = 9,00/2,90 = **3,103 su/s** ✓ ; transits = exactement les trois tells de 1,8 s ✓
« zéro valeur déplacée » vérifié par sondage sur les cellules qui portent. Citations décor
vérifiées contre `spec-belliard-street-wide-repositioning.md` (passage 0,372–0,408 = zone
d'exclusion, feu 0,388 = seul prop haut, boulangerie 0,340) : **la fiction cite le décor, elle ne
l'invente pas** — c'est la bonne façon de relocaliser.

**D-1 — LA CONDITION BLOQUANTE, et c'est MON raisonnement qui casse, pas celui de Sacha.** Mon
round 1 avait passé « une mission = 3-5 minutes » sur cette phrase : _« le set-piece est hors du
chrono de mission, donc la contrainte dure n'est pas violée sur sa face »_. Vrai à Stalingrad (le
set-piece **précédait** la mission), **faux à Belliard** : Rev.3 l'**encastre** dedans (bloc à
scène gelée, déclencheur 2-8 s d'une mission de 90 s). Le chrono interne ne bouge pas — le
techplan le prouve et il a raison — mais le temps du joueur, si. Une tentative : ≤ 120 s de photo
(AC13b) + 4-10 s de course + ≈ 21,5 s de duel otage gelé + ~80 s de mission ≈ **3,7-3,9 min**,
dans la borne haute. **Mais `[ RECOMMENCER ]` n'est pas borné en nombre** (décision gatée K-4) et
chaque re-tentative se paie **dans la même mission** ⇒ **2 tentatives ≈ 5,9 min : la contrainte
dure est franchie au premier retry.** Et la dilution est pire que le chiffre : sur les ~2,5
premières minutes du **premier niveau du jeu**, celui qui enseigne la boucle, le joueur n'exécute
**aucun** des trois verbes, avec deux scènes gelées à 4-10 s d'intervalle de jeu réel. Winston a
prouvé que les **horloges** composent (A-T12) ; personne n'a regardé si le **rythme** compose —
c'est ma lane. **Condition de fermeture :** le temps gelé total atteignable dans une tentative de
mission Belliard doit être **borné, chiffré et défendu contre les 3-5 min** avant que la lane A
ne fige `triggerAtElapsedSeconds`. Options cadrées : **(a)** borner les re-entrées dans une run —
la sortie gatée `[ LAISSER TOMBER ]` **porte elle-même le plafond**, coût = un compteur + une
ligne de copy ; **(b)** rendre le set-piece réellement pré-niveau (les mots de la fiction) — coût
architecture (D-A/D-G) ; **(c)** ne rien borner — déconseillé, ça vide la contrainte. `game-designer`

- `senior-architect` + `pm` reconcilient **une fois**, sinon les options partent chez Bertrand.
  **D-1 ne bloque PAS le build** : il ne touche ni type, ni signature, ni tuning — deux données
  authored.

**Règle manquante proposée (E-3bis → Bertrand) — G-3 :** _le temps de scène gelée ne compte pas
contre « une mission = 3-5 minutes », à condition que le temps gelé total atteignable dans une
tentative de mission soit borné et que la borne soit écrite._ Précédent : duel otage (≈ 21,5 s) et
boss QTE n'ont jamais été comptés **parce qu'ils sont bornés par construction**.

**Les 2 rulings demandés (§11.0).** **R3-1 — la lecture « carrefour 42 s à deux phases » :
RATIFIÉE.** La dérivation est faite dans le bon sens (re-dérivée, pas recyclée) et le
contre-factuel tient (21 s lu comme _cycle_ ⇒ une seule fenêtre en 60 s ⇒ F3 cassé sur un bonus).
**Deux pins :** (1) la donnée authored est `WAVE_PERIOD = 21,0 s`, **un intervalle de vague** — le
42 s est une justification de fiction, **jamais une valeur** ; aucune donnée, aucun test, aucun
brief ne contient 42, sinon le prochain lecteur « corrige » la période et emmène les neuf
keyframes ; (2) les deux vagues du cycle peuvent différer de **caractère**, jamais de **durée
(7,0 s)** ni d'**attaque** — `inCover` est un booléen unique et **F3 suppose trois fenêtres
égales** : c'est une exigence de gameplay dans le brief son, pas une note de mix. **Et je corrige
le coût qu'il s'annonce à lui-même :** l'échec de la lecture 42 s **ne rouvre pas la cadence** —
sa propre §10.4 porte le repli **fournil de la boulangerie**, source mono-périodique, à coût
mécanique nul (tout lit `WAVE_*`). Le risque est fiction+mix, pas cadence. **R3-2 — le refus du
« bonus de lisibilité » (§2.3) : SOUTENU et DURCI en interdiction.** Ce n'était pas un conflit de
pairs (Yasmine avait explicitement décliné la propriété du point et nommé le risque) ; Sacha a
raison, l'onde verte met la couleur ≈ 7 s hors phase ⇒ **modèle causal faux**, même famille que ma
prohibition T-4. Durci : **aucun élément de la planche n'encode l'état de couverture sauf les
phares du paquet** ; le feu est décor et source de lumière — ni hors phase (modèle faux) **ni en
phase** (indicateur gratuit non budgété = un changement de tuning déguisé en note d'art).

**La contradiction que le ruling fait apparaître, et que personne n'avait vue (N-1 → Winston).**
Mécanique §4.1 dit « le feu reste décor » ; techplan **D-J** dit « la lumière dessinée dans la
surface du set-piece est une **projection de `inCover`** ». La **décision** de D-J est ratifiée
sans réserve (`trafficSignalPhase` — 13,5 s, horloge murale, ne se met pas en pause — ne doit
jamais être la source de vérité, et retuner `TRAFFIC_PHASES` est le piège D-F en costume), mais sa
**rédaction** réintroduit par la porte de derrière le canal refusé. Correction d'une ligne : ce qui
se projette depuis `inCover` est **l'éclairement / les phares**, **pas la couleur du feu**.

**Cohérence delta.** **Fenêtres ↔ nouvelle fiction : cohérent, et meilleur** — les trois
recouvrements deviennent **causaux** (les acteurs se calent sur le feu ; ils attendent le silence
pour l'enveloppe ; la plaque est lisible parce que les phares rasent la bouche du passage), la
conformité F3 de l'instant 3 devient **structurelle** — verrouillé, personne ne « répare » cette
coïncidence. **Mais deux citations croisées périmées, bloquantes avant transcription : C-4** — la
fiction §2.2 fait éclairer la plaque par **le feu**, la mécanique §4.2 par **les phares** ; si
c'est le feu, l'onde verte désynchronise l'éclairage de la fenêtre et l'argument structurel de F3
**tombe** — la bonne lecture est celle de Sacha ; **C-5** — la fiction §2.4 dit encore « avant la
boucle » / « scène pré-niveau », faux depuis la relocalisation. **Déclencheur `[2,8]` :** ✓ contre
« avant le camion » (camion 20 s, otage 12 s, invariant d'ordre + `SAFETY_MARGIN` ⇒ avant 12 s,
arithmétique ratifiée) ; ✗ au sens littéral contre « avant la boucle » — à 2-8 s Muf est sur sa
moto et se retrouve à plat ventre sur le zinc sans avoir grimpé. **R3-3 : le déclencheur mi-niveau
est accepté, la phase `BRIEFING` EST l'ellipse de la montée** (techplan D-G, ligne 8 du script) —
donc elle est structurellement non-facultative (skippable pour le joueur, jamais absente de la
machine), et §1.1 doit l'ajouter à la table des phases (C-8). **Pin de valeur : viser le BAS de
`[2,8]` (≈ 2,0-3,0 s)** — l'écart de temps joué avant le gel du duel otage vaut `12 − t_p`, donc
**10 s à t_p = 2 mais 4 s à t_p = 8**, et 4 s sont indéfendables (D-1).

**Contraintes art : justes, bloquantes, mais ABSENTES du paquet qui part chez Nico.** Les deux
nouvelles (marche arrière **plate** en `cy` et **sans grossissement** sur `[53,0 ; 55,9]`, dans
`SUBJECT_BOX_TOLERANCE`) sont bien posées, avec le bon réflexe (« si la voiture doit approcher,
c'est une ré-écriture de K6/K7 qui revient au gate, pas une note d'art absorbée »). Mais le
techplan §11.4 route « les 4 contraintes E-6 + une cinquième » et cette cinquième est la
**continuité de rue**, pas les items 7-8. **E-6 est réémis à 7 contraintes** (+ la prohibition
R3-2). **Et un trou d'application (N-2) :** `check-photo-subject-boxes.mjs` contrôle F12(1) **aux
keyframes**, alors que les contraintes 7-8 portent sur l'**intervalle** K6→K7 et la non-dérive des
poses de maintien sur les intervalles K2→K3 (19,2 s) / K4→K5 (14,7 s) — **un contrôle aux bornes
n'asserte aucune des trois**. Échantillonner les intervalles (pas à `qa-lead` +
`dev-tooling-assets`).

**Pin de scope `rewardMultiplier` : cohérent avec mon pin du round 2, et strictement renforcé.**
Trois vérifications. (1) **Le scénario est CERTAIN, et plus tôt que Sacha ne le dit** — il écrit
« selon où `pm` place la nuit de retour » ; non : la ligne Belliard porte le `photoQte` (2-8 s)
**et** son propre `bossQteSpec` à l'expiration du timer (90 s), donc **dans la même run** le
joueur photographie à ~5 s et affronte le Commandant ~85 s plus tard en tenant `master-bonus` —
aucun placement ne l'évite. (2) Le techplan ferme le piège **par la structure** :
`shieldedLullSeconds` est une **constante de module partagée** ⇒ paliers = champ authored sur la
seule ligne Niveau Final, absent ⇒ ×1.00, testé aux **trois** valeurs de levier. Meilleur que mon
pin, qui supposait à tort une ligne de tuning par niveau. (3) **R3-4, gravé :** l'encontre
Belliard reste à ×1.00 **pour toujours, et ce n'est pas un oubli** — la récompense passe par la
photocopieuse, les vingt-trois copies et les cages d'escalier (fiction §5.1/§5.2), c'est-à-dire par
des **jours**, pas par 85 secondes. Toute proposition future de « récompenser aussi le boss
Belliard » est une réouverture de gate.

**Deux questions du techplan qui étaient des questions de DESIGN, tranchées.** **R3-5 — Q-3 : NON,
le set-piece ne se déclenche PAS à la première run Belliard.** Le plan recommandait
« inconditionnel, “retour” = cadrage narratif » ; je refuse, et pas pour la fiction : **G-1
s'écroule** — l'exception à « déplacement + une action » a été concédée sur la clause « apprenable
sans copy », or poser **quatre verbes** devant un joueur qui n'a pas appris **les deux premiers du
jeu** la casse ; et ça aggrave D-1 là où c'est le plus cher. Le prédicat est à `pm`, le « pas la
première » ne l'est pas (route déjà propre et gratuite : un booléen `LevelParams` via `handlePlay`).
**R3-6 — Q-4 (la preuve est farmable) : ACCEPTÉ, aucune rareté, FERMÉ design-side.** C'est la
conséquence assumée de trois décisions gatées (scène **déterministe faite pour être apprise** —
c'est l'argument même d'AC10 ; retry offert sans punition K-4/D1.c ; récompense délibérément
modeste). Toute rareté future (limite hors-D-1, péremption, one-shot, contingence à la survie du
niveau) rouvre K-4/R2-4/AC10. Si le levier paraît fort au playtest, **le levier honnête est le
tuning des paliers**, pas le report. **Q-4 sort de la liste de `pm`.** _(Q-1 : ratifié
**rate-limité sur les deux devices** — une souris absolue rend F5c vide et AC6c mobile-only, soit
deux modèles d'équité pour un tuning gaté, même refus que ma parité reduced-motion. Q-2 : reste à
`pm`, mais elle n'est plus neutre — « banquer au clear » **contredit** K-4.)_

**Résidus éditoriaux (bloquants avant transcription, aucun ne rouvre le gate) : C-1** — toujours
pas fait, flaggé au round 2 et la Rev.3 a shippé sans : la fiction §4.4 cite encore le **×0,75
retiré** (⇒ **×0,80**) ; **C-4** (source lumineuse de la plaque) ; **C-5** (« pré-niveau ») ;
**C-6** (marquer le bonus de lisibilité comme **décliné**, qu'il ne soit pas re-proposé) ; **C-7** —
mécanique §11.4 périmée : « E-1 remains open… l'ADR-0077 n'est pas sur la branche » alors qu'**il y
est** et qu'E-1 est **CLOSED** depuis le round 2 §0 ; **C-8** — §4.1 (repli boulangerie au lieu du
« +30 s de scène ») + §1.1 (ajouter `BRIEFING`).

**Paquet sortant.** **E-3bis → Bertrand** (adopter/refuser **G-3**) · **E-4 → `senior-architect`**
(les 7 asks sont **répondus et fermés** ; s'ajoutent **N-1** feu ≠ `inCover`, **N-2**
échantillonnage d'intervalle pour F12(1), **N-3** ne pas figer le déclencheur avant D-1) ·
**E-5 → `pm`** (Q-3 tranchée par le design, Q-4 **fermée**, Q-2 décidée en connaissance de cause,
D-1 = ta progression autant que mon rythme, prix du bit `hasPlaque` chiffré) ·
**E-6 → `lead-art`** réémis **à 7 contraintes** (les 4 connues + marche arrière **plate** + marche
arrière **sans grossissement** + **continuité de rue** avec `street-wide.png`) **plus la
prohibition R3-2** (aucun élément n'encode la couverture sauf les phares) · **E-7 →
`sound-designer`** (cadence **inchangée**, source changée ; deux exigences de **gameplay** : vagues
d'égale durée/attaque, et repli boulangerie à coût nul) · **E-8 → `qa-lead` (nouveau) : AC15
imposé** — mesurer au chronomètre le **temps réel total d'une tentative de mission Belliard
set-piece inclus**, à 1 puis 2 tentatives de set-piece, contre les 3-5 min : c'est la mesure qui
ferme ou rouvre D-1 par l'observation plutôt que par le débat.

**Stage 5 :** acceptation design par Karim contre **AC1–AC15**. Les quatre premières choses que je
regarde : `[ LAISSER TOMBER ]` en une pression (l'invariant), AC14 (chasse à la frustration),
AC6b(d) (dessiné == boîte au composite), **AC15** (le temps réel de la mission Belliard).
