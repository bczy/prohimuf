# Handoffs — Hostage-QTE rework ("duel de la porte cochère", ADR-0034 F1+F2)

Story shard opened by `ux-designer` (Tony). `producer` (Marion): please reconcile the index row.

## 2. DESIGN — ux-designer (Tony) — 2026-07-17

- claim: HUD & feedback readability for the ADR-0034 QTE rework (bounded — mechanic decided in
  the ADR; UX owns how the player READS it: HUD hierarchy, peek-tell legibility, head-vs-hostage
  spatial fairness, accessibility).
- release: UX spec `docs/game-design/ux/spec-hostage-qte-hud-readability.md` (new `ux/` folder).
  Key readability requirements handed to the render lane (`dev-r3f-render`):
  - §1: remove captor-HP bar + countdown bar from `HUD.tsx`; nothing replaces them (distance = the
    in-world diegetic clock, D1); OTAGE banner + WON/LOST stamp KEPT; door must stay in-frame.
  - §2: peek TELL must precede the peek, originate at the head location, read as a discrete "NOW"
    event, and carry motion/shape (not colour alone) — P3 "always 'I cracked', never unreadable".
  - §3 (G6): peeking head silhouette clears the hostage silhouette by a visible gap at all zooms /
    both DPRs; visible-head region == scored head-zone (aim honesty).
  - §4: reduced-motion degrades strobe→steady cue but keeps the signal; COVERED/PEEKING + tell
    distinguishable without hue; contrast-as-function.
- FLAGs raised in-spec: (a) `hostageHp` contract question (pips row) → `lead-game-designer` +
  `senior-architect`; (b) ambient-tension climb now that `windowRemaining` is gone →
  `game-designer`; (c) head-zone-vs-visible-head assertion → `dev-gameplay`/architect.
- NEEDS: `lead-game-designer` (Karim) DESIGN GATE PASS before `senior-architect`.
- VERDICT: PENDING — design gate (lead-game-designer)

## 4. DESIGN GATE — lead-game-designer (Karim) — 2026-07-17

Gating BOTH design deliverables for the ADR-0034 F1+F2 rework as one set (they are
downstream of the same decision and must be mutually coherent):

- `docs/game-design/spec-hostage-qte-duel-porte-cochere.md` (Sacha — tuning defaults, AC1–AC7)
- `docs/game-design/ux/spec-hostage-qte-hud-readability.md` (Tony — HUD/readability, A1–A12)

Checked against ADR-0034 (source of truth, D1–D6 + G4/G5/G6), PROJECT_GUIDELINES (scope
guard, §5.6 no-bullshit-death, single core loop), the frozen contract in
`story-hostage-qte-duel.md` §3 (Winston), and each other.

**Scope / core loop / verifiability:** both PASS. Conscious documented extension
(ADR-0030/0034), side objective that never advances the kill quota (D4 preserved), core
loop untouched, 12 s duel fits inside a 3–5 min mission. Sacha's numbers carry tolerances
(±0.2 s, ≥4 peeks) and AC1–AC7; Tony's A1–A12 are device-class/DPR/grayscale/reduced-motion
checks — a dev can implement neither by guessing. Verifiable.

### VERDICT

- **Game-design spec (Sacha): PASS-WITH-CORRECTIONS** (1 correction, below — G-1).
- **UX spec (Tony): PASS-WITH-CONDITIONS** (1 condition, below — U-1).
- Plus one documentation correction (D-1) and one ratification flag (F-1), routed out.

### Decisions the gate was asked to make

**D1 — scoreDelta (KEEP +8 vs REMOVE).** RULING: **REMOVE** — correction **G-1**. The
orchestrator's provisional "keep flat +8" is _defensible_ (D5's letter rejects
multipliers / magnified-failure / score-as-stake, arguably not a flat non-load-bearing
side bonus), but it FAILS the coherence leg of the gate: Sacha §3/§5 keeps +8 while
Winston's already-FROZEN contract removes it (`QteTickResult = { qte, energyDelta }`,
`stateMachine` drops the `score:` fold) and the dev lanes are building against that
contract _now_. One of the two must yield, and removal wins on every axis: (a) it is what
the frozen downstream contract already encodes → requiring removal = ZERO dev churn;
requiring keep = reopening a frozen contract for a value Sacha himself calls
"non-load-bearing"; (b) D5's header — "Energy is outcome currency only" — reads cleaner
with a single currency; (c) removal is mildly PRO-intent (rescue for the fuel, not for
points) and costs the design nothing (KISS/YAGNI, guidelines §2); (d) the whole-QTE
re-pricing under ADR-0034 (which supersedes ADR-0030's QTE) is the documented umbrella that
covers dropping the vestigial +8 — not silent drift. This is a design ruling I own; it
ratifies Winston's provisional removal and corrects Sacha's spec.

**D2 — §1.1 clock start.** RULING: **CONFIRM THE DEFAULT** — retreat begins at `ACTIVE`
onset, distance-to-door **7.2 u**, answerable budget 12.0 s of ACTIVE time. No change to
Sacha's spec. Rationale: (a) the 2 s zoom is an _establishing hold_ where firing is a panic
penalty (D4/D5) and no peek can be answered — starting the door-clock then would create
"shoot before he escapes" pressure during a phase the design penalises firing in, a P3
fairness snag; (b) it minimises the highest-risk camera coupling — during ZOOMING the
anchor is STATIC, so the camera merely zooms to a fixed point, then follows at ACTIVE,
rather than a compound zoom+pan; (c) decisively, the FROZEN contract advances the anchor
ONLY inside `tickQte` ACTIVE — the 8.4 u "whole-QTE" reading would require advancing the
anchor during ZOOMING too, contradicting the frozen contract. Default 7.2 u is the reading
consistent across all three artifacts. D1's "for the whole QTE" = the continuous ACTIVE
retreat, not a literal claim on the establishing zoom.

**D3 — hostage killable? (hostageHp removed).** RULING: **CONFIRM the intended design** —
hostage NOT killable, hostage hit = flat **−30 energy** (non-fatal; energy has no death-at-0,
Sacha §0), sole LOST route = door reached. This is unambiguously the intent across the two
lanes that matter: Sacha §4 already lists `hostageHp` among Belliard-removed fields, and
Winston's frozen contract + ADR-note #1 lock it removed. It is coherent with D4's sanction
hierarchy ("hostage = big cost, nothing else counts" — a _cost_, not a death/loss route),
with D1 (single clock, single fail), and it is _actively more_ coherent with
PROJECT_GUIDELINES §5.6 "jamais de mort bullshit" than an instant one-stray-bullet
hostage-death would be. The only laggard is ADR-0034 D6's removed-fields _prose_, which
omits `hostageHp` (an incompleteness, resolved by D4's flat-penalty rule) — see D-1.
Per the orchestrator's steer I do NOT silently override: I confirm the design as coherent
AND raise **F-1** so pm/Bertrand consciously ratify that ADR-0030's hostage-death loss
route is retired (matching Winston's own "reversible if Bertrand disagrees"). Not a block.

**D4 — severity order + "no HUD surrogate" vs P1–P4.** Energy ledger
`body −5 < panic −6 < unanswered peek −8 ≪ hostage −30, rescue +40`: **PASS as-is.**
Strictly monotonic, each gap tied to a decision (body = smallest deliberate cost / D4
loophole; panic > body because you fired at a frame you were told you can't read / D4;
unanswered peek > panic because the captor's shot LANDED / D3; hostage ≫ all = bavure;
rescue +40 → 72-pt swing vs full ignore ⇒ P1 stakes-first satisfied, "ignoring is
near-optimal" closed). Single bavure (−30) ≈ ignoring the whole duel (−32) is coherent:
catastrophic-per-event vs catastrophic-cumulative; the atomic sharpness of −30 holds.
The UX "no HUD surrogate for distance-to-door" (D1.3) serves D1 directly and is coherent
with P1–P4 **provided** two load-bearing constraints hold → **U-1** + the D1.4 framing
constraint (door always in-frame during ACTIVE, captor→door gap legible at all tracked
zooms/DPRs, A3/A8) — both correctly handed to the scene/camera lane; confirmed load-bearing.

### Required corrections (gate conditions — game-designer/dev apply; I do NOT edit numbers)

- **G-1 (Sacha, blocking the spec's PASS):** delete the +8 rescue score bonus — the "Score"
  paragraph in §3 and the "rescue score bonus +8" row in §5's game-wide constants table.
  Energy is the sole QTE currency (D5); align to the frozen `QteTickResult = { qte,
energyDelta }`. No other number in the spec changes.
- **U-1 (Tony, condition on the UX spec's PASS):** make explicit that D1.3 empties only the
  QTE-specific bottom-centre bars (captor-HP + countdown), and the **standing global energy
  readout MUST remain visible during the QTE** — energy is the sole stake (P1); if it were
  hidden with the removed bars, the stake becomes invisible in the moment. Add to the §1
  acceptance (A1 currently asserts the region is empty — clarify "empty of the two removed
  QTE bars", energy stat stays).
- **D-1 (documentation, → `senior-architect` + `tech-writer`):** amend ADR-0034 **D6**
  removed-fields list to explicitly name `hostageHp`/`hostageHpMax` (closes the D1.6 seam
  the UX spec flagged; both design and arch lanes already treat it removed).

### Flag routed (NOT a block)

- **F-1 (→ `pm` + Bertrand):** conscious ratification that ADR-0034 retires ADR-0030's
  hostage-death loss route (sole LOST = door). Design is coherent and I PASS it; this is a
  for-the-record confirmation of a superseded-scope change, per Winston's "reversible if
  Bertrand disagrees." Tie-break only if Bertrand wants the death route kept — then re-gate.

### Reconcile notes (→ `producer`, no gate action)

- **This story is split across two shards** — `story-hostage-qte-rework.md` (UX-opened) and
  `story-hostage-qte-duel.md` (architect HOW). Same story. Please merge into one and fix the
  `docs/game-design/README.md` index row. This gate verdict is the canonical one; it covers
  both shards.
- **Telegraph lead:** the frozen contract fixes `TELEGRAPH_LEAD_SECONDS = 0.35` as a
  structural constant (no per-level tell field on `QteSpec`). Sacha's §2.2 authorable-tell +
  0.25 floor is therefore _informational_ for F1/F2 (0.35 fixed trivially satisfies ≥0.25).
  Whether F3 wants to CURVE the tell per level is an **ADR-0035 lane question**, out of this
  gate's scope. For F1+F2 the fixed-0.35 reading is confirmed and satisfies G4.
- **Energy constant naming** (Sacha `QTE_RESCUE_REFILL`… vs Winston `RESCUE_REFILL`…) is a
  dev-lane reconcile; the VALUES in Sacha §5 are canonical, Winston's contract defers
  magnitudes to the spec — no value conflict.

Rework rounds used: 0 of 2. Corrections G-1/U-1 are single-line applies, not redesigns —
apply and proceed to `senior-architect`; no re-gate needed unless a value beyond G-1/U-1
moves. Design acceptance (stage 5) will re-verdict Sacha's playtest vs AC1–AC7 + Tony's
review vs A1–A12 post-BUILD.

- VERDICT: **PASS-WITH-CORRECTIONS** (game-design: apply G-1 · UX: apply U-1 · docs: D-1 ·
  ratify: F-1). Cleared to `senior-architect` once G-1/U-1 are applied.
