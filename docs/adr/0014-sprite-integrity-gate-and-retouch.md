# 0014 — Post-cutout sprite-integrity gate and deterministic per-sprite retouch

- **Status:** Accepted
- **Date:** 2026-07-13

## Context

The delivery courier sprite (`public/assets/enemy_civilian.png`, the "livreur en
vélo") shipped with an **AI-generation anatomy defect**. FLUX never drew the
courier's pelvis: the hip/crotch/upper-thigh band rendered as paper-WHITE. In
`origin/main` that white was opaque, so the figure read solid (if anatomically
odd). ADR-0013's enclosed-island keying pass then measured that white as flat
ground and cleared it → an interior **transparent hole** that visibly severs both
legs from the torso at game size, plus 68 tiny keying-debris parasites left by the
cutout.

Two facts made this bug slip every existing gate:

1. **Topology alone does not see it.** The silhouette stays ONE dominant opaque
   component — the legs hang on via the bike frame — so a component-count check
   passes (dominance ~0.99). The defect is a VISUAL/readability hole, not a
   fragmentation.
2. **No gate looks at enemy sprites.** `check-sprite-style.mjs` is vehicle-only
   (per-type hue bands + silhouette-aspect bounds calibrated on truck/car/moto);
   `gen-sprites.yml` explicitly notes enemy archetypes need their own gate.

The fix has to (A) add an objective post-cutout integrity check that catches this
class of defect and route the anatomy signal to a human, and (B) repair the shipped
sprite deterministically **without** FLUX regeneration (the network is blocked in
the sandbox, and a re-roll would change the accepted art).

## Decision

### A. A new standalone integrity gate — `scripts/check-sprite-integrity.mjs`

A **new** script, not an extension of `check-sprite-style.mjs`: topology/integrity
is ground-agnostic and orthogonal to hue/silhouette, and the style gate is
vehicle-calibrated — folding them together would muddy both. Modelled on
`check-halo-gradient.mjs`: a **pure** exported `measureIntegrity({W,H,d})` /
`evaluateIntegrity` (no I/O, unit-testable) plus a thin CLI that decodes pixels via
`@napi-rs/canvas` (lazy import, so importing the module never throws).

Two layers:

- **HARD** (exit 1, fails CI): (a) dominance ratio (largest 4-conn opaque component
  / total opaque) ≥ 0.97; (b) a **speckle budget** — ≤ 4 non-dominant opaque
  components smaller than 12px; (c) binary alpha (0 pixels with `0 < alpha < 255`).
  4-**connectivity** is required — 8-conn would merge the diagonally-linked debris
  cluster under budget.
- **SOFT** (printed WARN, never fails — routed to the human/agent art gates): an
  inventory of interior transparent enclaves, flagging any > 150px whose bbox-top
  sits in the upper 80% (torso/hip) of the figure. This is the layer that surfaces
  the anatomy-hole class; it is **figure-scoped** (`isFigure`) so vehicles, whose
  large voids are legitimate, are not false-flagged.

**Proof of detection:** on the courier, the HARD speckle budget FAILS the pre-fix
69-component state (68 > 4) and PASSES the repaired sprite (0); the SOFT layer flags
the 224px hip enclave (60% down) on the pre-fix sprite.

### B. A new deterministic retouch — `scripts/retouch-sprites.mjs`

A dedicated retouch script is sanctioned and does **not** contradict ADR-0013.
ADR-0013 rejected a standalone retouch **only for the KEYING/flood logic** (which
must stay in the shared `cutout-enemies.mjs` so it doesn't fork and rot). A
hip-bridge + speckle sweep is **post-key GEOMETRY repair** — a different concern —
and `game-graphist.md` already names `scripts/retouch-sprites.mjs` as the sanctioned
home for documented scripted retouches. It:

1. **Hip bridge** — samples the sprite's own dark trouser aplat **locally** (never a
   hardcoded colour; measured ≈ (52,48,62)) and fills only the hip/crotch pixels
   truly enclosed by opaque-dark body on all four sides (maxGap 30px), keeping the
   bike-frame triangle and wheel spokes see-through. Flat aplat, binary alpha.
2. **Speckle sweep** — drops non-dominant 4-conn opaque components < 12px (the same
   budget the gate enforces), after the bridge.

Every window/threshold is a documented per-sprite constant (`RETOUCH_SPECS`) tuned
to one sprite — a documented per-sprite retouch, NOT a general filter. It runs in
place, deterministic and **idempotent** (re-run = byte-identical).

**Idempotency required iterating the bridge to a fixed point.** The graphist's
prototype filled in a single pass (566px) and assumed that was idempotent — it is
not: the flat aplat we write is itself dark body, so it enables 45 more pixels on a
second pass, and a fresh re-run would change the bytes. The script iterates until no
pixel is added (2 rounds, 611px, identical bbox), so a later re-run finds nothing
enclosed and fills 0 → byte-stable.

### C. CI wiring — scoped, deliberately

The check is wired into `gen-sprites.yml` **after** the cutout step and **before**
commit (`@napi-rs/canvas` already installed by the cutout step — no duplicate
install), **scoped to `enemy_civilian.png`**. `retouch-sprites.mjs` is deliberately
**NOT** wired into CI: it is the explicit human-run fix, so the gate stays a TRUE
gate. The HARD gate guarantees only that a regen cannot reintroduce keying debris
beyond budget, fragment the subject, or break binary alpha — a re-opened hip hole
**alone** still PASSES HARD (dominance ~0.99, the legs hang on via the bike frame)
and surfaces only as a SOFT WARN that a human/agent art gate must act on. The
committed courier is fixed by running the
retouch once now; CI's no-args batch cutout SKIPS pre-keyed sprites (ADR-0013), so
the bytes stay stable and the check passes on the fixed commit.

**Why scoped, not the whole `enemy_*.png` set (finding).** Measuring the full set
revealed that the other 11 committed enemy sprites carry PRE-EXISTING keying debris
(22–220 non-dominant components) and action-pose detached elements (muzzle flash /
separated limbs → dominance as low as ~78%). The courier's 68 parasites is actually
**fewer** than several accepted sprites (137, 220), so no single speckle budget
separates the courier bug from accepted art — a blanket HARD gate over the set would
fail the job on pre-existing, accepted state. Gating only the sprite this cycle
fixed is the correct scope; extending the gate to the full set is a separate story
(a set-wide speckle cleanup, or per-sprite baselines / recalibration). The standalone
CLI still inventories the whole set (run with no `--file`) for that future work.

## Consequences

- `enemy_civilian.png` retouched in place: opaque components 69 → 1 (dominant), the
  three hip anatomy enclaves (224/110/103px) closed, dominant 19469 → 20082px
  (+611 bridge, plus 2px of two former 1px speckles absorbed into the dominant by the
  fill), silhouette outer bbox `[29,19,226,237]` unchanged, semi-transparent
  0 → 0 (binary preserved). Re-run is byte-identical. The figure now reads with an
  attached lower body at game size.
- The `enemy_civilian.png` slice of the CI enemy pipeline is now guarded at root: a
  regeneration that reintroduces keying debris beyond budget, fragments the subject, or
  breaks binary alpha fails the job. A re-opened hip hole **alone** does not HARD-fail
  (dominance stays ~0.99) — it surfaces as a SOFT WARN routed to the human/agent art
  gates (game-graphist AI-defect sweep + lead-art), which are the binding catch for the
  anatomy-hole class.
- **This ADR alters the CI contract** (`gen-sprites.yml` gains a gate step) — hence
  the ADR.
- **Known residual SOFT warnings (non-failing).** With `ENCLAVE_TORSO_FRAC = 0.80`
  the repaired courier still emits two SOFT WARNs on legit bike see-through (a 367px
  leg-gap void and a 169px fork void, both at ~75% down) — the SOFT layer routing
  large enclosed regions to the human gate, which confirms them. The architect's
  0.80 was calibrated expecting wheel voids only at > 85% down; a post-bridge
  re-segmentation raised one fork void to ~75%. Lowering `ENCLAVE_TORSO_FRAC` to
  ~0.73 would make the repaired sprite warn-clean while still flagging the 58–70%-down
  hip holes — left as an architect call, not silently retuned.
- **Retouch specs are calibrated to the current bytes.** `RETOUCH_SPECS` windows /
  `maxGap` are measured against THIS courier sprite. If `enemy_civilian.png` is ever
  FORCE-regenerated (new FLUX art at the same path), the specs must be **re-measured**,
  not blindly re-run — a stale hip-bridge window applied to different art would fill the
  wrong pixels. This is a documented human procedure, not an automated guard: the script
  is not in CI, and any regenerated output must still clear the integrity gate, the
  game-graphist AI-defect sweep, the lead-art asset gate, and the 4-reviewer merge panel
  before it can ship — so blind reuse cannot reach `main`. (A per-spec source-hash
  precondition was considered and deferred as optional hardening, not a merge blocker.)
- **Follow-up:** a set-wide enemy-sprite speckle cleanup (or a recalibrated /
  per-sprite-baselined integrity gate) is needed before the HARD gate can cover the
  whole `enemy_*.png` set; tracked as a separate story.
- **Shared morphology (2026-07-14, story-shared-morphology-lib).** This script's hand-rolled
  connected-component labeler was extracted verbatim to `scripts/lib/morphology.mjs`
  (`labelComponents`, called here with explicit 4-connectivity) — behaviour frozen, verdicts
  byte-identical. See ADR-0019 → _Shared-morphology extraction_.
