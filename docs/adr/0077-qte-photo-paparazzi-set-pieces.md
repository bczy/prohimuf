# 0077 — QTE photo paparazzi : set-pieces de preuve photographique

- **Status:** Proposed
- **Date:** 2026-08-01
- **Number:** 0077, self-allocated (no producer in the loop yet — allocated at
  brainstorming close with Bertrand, to be re-checked at merge per the adr-new guard).

## Context

muf needs a non-lethal QTE family where Muf captures photographic proof of corrupt
authority figures instead of shooting them. The existing QTE family (hostage duel
ADR-0034/0036, boss encounter ADR-0060) is entirely built around "aim + shoot under
pressure"; every planned escalation so far adds lead, none adds leverage. The fiction
(1998 Paris, clandestine raves, police pressure) has an obvious counter-power move the
game never exercises: blackmail — catching a specific person, at a specific place and
moment, with specific company or doing a specific act, through a telescopic lens.

Forces at play:

- The QTE house rules are established and must hold: deterministic cadence (no
  `Math.random`, no `Date.now`), energy/outcome economies over passive drains,
  anti-"mort bullshit" guardrails asserted in code, per-level authored rollout.
- The art pipeline (FLUX backdrops + keyed sprites in `levelArt.json`) and the fanzine
  B&W DA are fixed constraints — a photo mini-game must be renderable with them.
- The parallax level layers are not authored for ×10 magnification; a telephoto view
  cannot simply zoom the existing scene.
- muf ships on desktop AND mobile; any new control scheme goes through ux-designer
  and the accessibility gates.

This ADR records the decisions of the 2026-08-01 brainstorming session with Bertrand
(19 structured questions, all answered) so the design loop starts from settled ground
instead of re-litigating the frame.

## Decision

Build the photo QTE as **authored set-pieces** — one new system, scripted instances —
with the following settled shape:

1. **Fiction: blackmail / counter-power.** Muf photographs corrupt authority figures
   in flagrant délit to gain leverage. The photos are evidence, not journalism and not
   a delivery job.
2. **Core verb: frame + zoom + shoot.** A dedicated full-screen telephoto view (world
   paused outside the QTE, like the porte-cochère duel). The player moves the viewfinder,
   adjusts zoom, and releases the shutter.
3. **Zoom is a double trade-off**, not cosmetic: (a) _fill-the-frame validation_ — too
   wide and the photo is illegible (rejected), too tight and the incriminating element
   (second person, envelope) leaves the frame; (b) _sway_ — viewfinder shake grows with
   magnification.
4. **Briefing is hybrid.** The dossier (DISPATCH/KENZA) gives WHO and WHERE; the player
   discovers WHEN and WHAT by observing through the lens. Telegraphed, deterministic
   pose sequences announce the incriminating moments.
5. **Multi-moment scenes, one master proof.** Each set-piece contains several
   photographable instants (e.g. the arrival, THE EXCHANGE, the licence plate). Exactly
   one is mandatory (the master proof); the others are bonus shots that strengthen the
   leverage.
6. **Tension = suspicion gauge fed by shutter noise vs. sound cover, plus limited
   film.** Releasing the shutter during loud scene beats (train, music, argument) is
   safe; in silence it is risky. Film is finite and authored per set-piece (1998,
   argentique — every frame counts). Full gauge = spotted.
7. **Spotted = scene aborted, retry from checkpoint.** Targets scatter, the set-piece
   fails, the player retries from a checkpoint. No death, no run loss — consistent with
   the anti-"mort bullshit" guardrails.
8. **Feedback in two beats.** At the shutter: honest _mechanical_ feedback only (crisp
   click + discreet flash when focus was held, dull click when blurred) — no semantic
   verdict. At scene end: a contact sheet (planche contact, photocopy-B&W fanzine
   style) reveals which shots count as proof.
9. **Rendering: dedicated 2D backdrop + key-pose sprites** through the existing FLUX
   pipeline. Moments are deterministic pose changes; no zooming into live level layers.

**Explicitly open — delegated to the design loop** (game-designer, narrative-designer
and ux-designer in parallel, gated by lead-game-designer):

- The exact reward of the blackmail lever (boss weakening vs. route unlock vs.
  narrative) — game-designer + narrative-designer.
- The first set-piece's target and fiction (chef de brigade is the natural candidate,
  not yet decided) — narrative-designer.
- The desktop+mobile control scheme and its accessibility envelope — ux-designer.
- All tuning values (film count, gauge rates, sway curves, frame-fill thresholds).

## Consequences

- A new gameplay system enters `src/game` (photo set-piece state machine, condition
  validation, suspicion/noise ledger) plus a render surface in `src/render` (telephoto
  view, contact sheet). Lane split and contracts are stage-3 work for senior-architect
  — this ADR fixes the frame, not the module design.
- The QTE family gains its first non-lethal member; shared skeletons (telegraphed
  windows, deterministic cadence, outcome economies) should be reused where they fit,
  and the temptation to fork them silently is a review-panel concern.
- The shutter-noise / sound-cover mechanic couples gameplay to the audio direction:
  sound-designer joins the loop earlier than usual (scene sound beats are gameplay
  data, not dressing).
- New art surfaces: per-set-piece backdrops and key-pose character sprites through the
  FLUX pipeline, plus the contact-sheet UI — art lane cost is per-set-piece, which is
  why set-pieces stay few and authored.
- The two-beat feedback (mechanical at shutter, semantic at contact sheet) is a
  deliberate frustration trade-off; playtest at stage 5 must specifically verify that
  players do not burn full film rolls unknowingly.
- Determinism guardrails apply from day one: pose sequences, sound-cover windows and
  sway must all be reproducible without `Math.random`/`Date.now`.
- Follow-up: design-loop specs under `docs/game-design/` (mechanic spec, fiction spec,
  UX spec), then the normal pipeline. If the accepted design changes any decision
  above, supersede this ADR — do not rewrite it.
