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

**Escalations.** E-1 ADR-0077 absent → `producer`/`senior-architect`. **E-2 Bertrand: the
ideological flag (§8.3) — repression commissioned and paid for by "la nuit légale", irreversible
once shipped; not the gate's to ratify.** E-3 Bertrand: adopt proposed guidelines rules G-1
(verb count in a dedicated set-piece) and G-2 (diegetic tension instrument vs §6's "pas de barre
de stress"). E-4 `senior-architect`: pause tick-gating, two independent fields, null-spec
byte-identity, **new cross-level run-scoped carry Stalingrad→Niveau Final**, keyframe data shape.
E-5 `pm`: progression + the deferred UNE variant. E-6 `lead-art`: no interactive-glow vocabulary
on a non-shootable subject, drawn==box, needle-is-not-a-light-meter. E-7 `sound-designer`: cover
windows are gameplay state; crisp/dull click is the sole T5 audio channel.
