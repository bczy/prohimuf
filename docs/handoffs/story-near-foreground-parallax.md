# Hand-offs — Near-foreground differential parallax layer

Story: [`_bmad-output/planning-artifacts/story-near-foreground-parallax.md`](../../_bmad-output/planning-artifacts/story-near-foreground-parallax.md)

## 0. PM — pm (John) — 2026-07-17

- claim: scope + author the story for Bertrand's proposed near-foreground differential
  parallax layer (proposal phase, no code).
- release: DRAFT story written. Verdict on scope guard = **conscious, documented, justified
  extension** (pure presentation serving the approved §5 Paper Mario depth language; zero verb
  added). MVP fixed = ONE data-driven near-foreground band per level, static art, confined to a
  per-level safe zone below the window grid. Two hard constraints locked as ACs: non-occlusion of
  targets (AC2, blocking — incl. Vitry's low 4-row grid) and reduced-motion (AC3). Factor
  convention + reuse-vs-new-art + Vitry policy deferred to architect/art gates.
  File List: `_bmad-output/planning-artifacts/story-near-foreground-parallax.md`.
- next: awaiting Bertrand's validation of the proposal menu before the design loop opens. Not yet
  handed to `senior-architect`.

## 1. DESIGN LOOP (UX lane) — ux-designer (Tony) — 2026-07-17

- claim: frame the ergonomics + accessibility constraints of the near-foreground layer (reduced-motion,
  non-occlusion, safe zones, desktop-vs-mobile density). Proposal phase, no code.
- release: UX spec authored — `docs/game-design/near-foreground-parallax-ux.md`. Key rulings:
  (D1–D2) reduced-motion branches on the existing repo-wide OS `prefers-reduced-motion` signal (no
  in-app motion pref exists; CRT is a separate boolean), read **live** like `CrtPass`, behaviour =
  **clamp effective on-screen speed to ≤ 1× (facade rate), keep layer visible** (clamp preferred over
  hide); (D4) **zero window-opening overlap at any opacity** — opacity is not an occlusion escape hatch;
  (D6) a differential layer may only be a **horizontal band above/below the window rows, never vertical
  edge columns** (they rake across cops when sweeping); (D7) safe band top ≥ lowest-window-bottom + 0.06
  facade-space; (D9) mobile = density halved, **prefer TOP band** (bottom = thumb+HUD), differential
  ceiling ~0.7× desktop, **Vitry opts out** via `levelArt.json` (its 0.12 strip is cropped at zoom 1.7).
  File List: `docs/game-design/near-foreground-parallax-ux.md`.
- next: **`lead-game-designer` (Karim) design-gate PASS** requested before `senior-architect`. Two gate
  decisions asked: (a) Vitry opt-out (D9.5), (b) mobile top-band preference (D9.2). Seams flagged to
  `game-designer` (factor magnitude inside the mobile ceiling) and `lead-art` (silhouette art / band read).
- VERDICT: PASS — design gate (lead-game-designer) — see §3 for the ruling

## 2. TECH PLAN (tracking open) — producer (Marion) — 2026-07-17

- claim: open production tracking now that Bertrand validated the proposal menu; allocate the
  ADR number the `senior-architect` needs to draft the ADR, and set the pipeline state entering
  TECH PLAN → DEV.
- release: pipeline tracking opened. Decisions recorded below.
  - **ADR ALLOCATION: `ADR-0045`** — near-foreground differential-parallax layer. Verified
    the next free number by sweeping all branch `docs/adr/` files, all commit messages
    (`git log --all --grep=ADR`) and all handoff shards: highest allocated anywhere = 0037
    (crew-extension). `main` has NOT allocated beyond 0037. `senior-architect` (Winston) owns
    the ADR file `docs/adr/0042-near-foreground-parallax-layer.md`; it MUST ship in
    PR #76. Nobody self-allocates (rule #9) — 0042 is now spoken for by this story (0038 was taken by main's agent-capability-upgrade).
  - **CYCLE:** cycle 1, TIER = **full pipeline** (touches design + render + per-level art data;
    not a fix-lane candidate). Only `producer` declares a cycle reset.
  - **Current stage: 2. TECH PLAN** — hand is with `senior-architect` (Winston): confirm
    render-only lane placement (spec §Lane → `dev-r3f-render`, no `src/game` change), the
    non-occlusion contract against `windowGrid`, the `levelArt.json` factor convention
    (engine `mesh.x = camera.x * factor`, negative factor for S>1 apparent speed), and draft ADR-0045.
  - **Next hand-offs:** DEV (`dev-r3f-render`, ∥ `lead-art` for band silhouettes / read) →
    VERIFY (`qa-lead` orchestrated: tsc/vitest/lint + `game-designer` playtest vs AC1–AC7 +
    `ux-designer` built-screen review both device classes + `gpu-specialist` perf verdict since
    the fast plane is redraw-sensitive) → REVIEW PANEL (4 skills) → `pm` accept.
  - **BLOCKER (must clear before DEV):** the `lead-game-designer` (Karim) **design gate is
    PENDING** in BOTH shards (this one §1 UX, and `story-foreground-parallax.md` §1 design).
    Two open gate decisions await Karim: (a) Vitry opt-out (UX D9.5), (b) mobile top-band
    preference (UX D9.2), plus the design spec's conscious-extension flag. DEV must not open
    until this gate returns PASS.
  - **SHARD HOUSEKEEPING:** two shards track ONE feature (`story-near-foreground-parallax`
    = PM+UX lanes; `story-foreground-parallax` = game-designer design lane). This file is the
    canonical tracking shard going forward; the sibling stays as the design-lane record.
    Flagged so the single design gate is read against both.
  - **CAPS (bounded iteration — enforced by producer):** ≤ 2 spec rework rounds; ≤ 2 art
    generation batches for the band silhouette set; ≤ 2 verify↔build rework rounds for the story.
    On any cap hit I stop the loop and assemble the escalation packet for Bertrand.
- next: `senior-architect` (Winston) — TECH PLAN + draft ADR-0045 (blocked-soft on Karim's design
  gate for the design-dependent rulings, but the ADR number is available to start drafting NOW).

## 3. DESIGN GATE — lead-game-designer (Karim) — 2026-07-17

- claim: close the PENDING design gate carried across BOTH shards (this one §1 UX, and
  `story-foreground-parallax.md` §1 design); ratify/amend the two UX flags (Vitry opt-out D9.5,
  mobile top-band D9.2) + the scope conscious-extension flag, to unblock DEV.
- release: **PASS with binding conditions.** Both specs
  (`spec-foreground-parallax.md`, `near-foreground-parallax-ux.md`) clear all four gate legs —
  scope (declared conscious extension, PM-acked §0, serves §5 Paper Mario depth language),
  core loop (non-occlusion iron rule D1.1/D4 + non-hit-testable D5 + AC6/AC7 ⇒ zero gameplay
  impact, "une mission 3-5 min" untouched), verifiability (numeric: S=1.20 / factor −0.20, range
  1.15–1.30, density 3 cap 4, margins 0.06 / HIT_RADIUS 0.8, 8% viewport, mobile /2, ≤0.7× ceiling;
  reduced-motion clamp is a unit-testable pure `(factor, reducedMotion)` fn), coherence (mechanics ↔
  UX reconciled, art-direction checked — see conditions).

  **RULING 1 — Vitry opt-out (UX D9.5): RATIFIED.** Vitry's ~0.12 bottom strip (windows to y=0.82)
  minus the 0.06 clearance ≈ a sliver, cropped further at `MOBILE_ZOOM_FACTOR = 1.7`; cannot hold a
  band satisfying D4/D8 non-occlusion, and the edge-column alternative is forbidden by D6/D1.1.
  Bertrand's objects are all BOTTOM-band and ground-anchored, so no top-band fallback rescues Vitry
  either. Non-occlusion (AC2, blocking) outranks ambience → Vitry ships NO near-foreground: the
  `levelArt.json` field is ABSENT (graceful, no crash), proving the data opt-out path (AC4).
  Belliard + Stalingrad carry the feature. Pure-decor absence ⇒ NADIR 94 fiction untouched.

  **RULING 2 — Mobile behaviour (UX D9.2 tension): bottom band on mobile, ACCEPTED with the D9.3
  fallback as the binding rule.** Bertrand's object set (toit de voiture au ras du bas, support-sac
  Vigipirate, bouteilles/mégots) is intrinsically ground-anchored → all BOTTOM band; UX's mobile
  TOP-band preference is thus not available and is overruled by the ratified art direction. Bottom
  band on mobile is allowed IFF: (a) density halved (D9.1), (b) the band sits BELOW the HUD + thumb
  reachable zone and NEVER overlaps a HUD element (D9.3), (c) mobile differential ≤ 0.7× desktop
  (D9.4) — note the 1.7× zoom amplifies retinal speed, so this ceiling stays perceptible, no
  conflict with Sacha's ~1.13 desktop perceptibility floor. Escape hatch: any level that cannot meet
  (b) drops the layer on mobile via the same `levelArt.json` opt-out as Vitry.

  **RULING 3 — Conscious-extension / core loop (scope): CONFIRMED.** Prohibition ST had no
  multi-layer parallax; this is a declared, PM-acknowledged (zero verb added) presentation-only
  extension serving §5 depth language. Design side confirms `Récupérer → Livrer → Éviter` is intact:
  the iron non-occlusion rule + non-hit-testable layer + AC6 (`src/game` byte-unchanged) + AC7 (no
  target-acquisition / hit-rate regression) guarantee exactly-zero gameplay impact.

  **BINDING CONDITIONS carried into DEV / art / VERIFY (not spec-rework — annotate + verify):**
  - **C1 (art coherence → `lead-art`, flag not arbitration).** The layer is DECOR ⇒ **loi du glow
    §2 law 1 + guidelines §5 "ce qui est gris est décor": ZERO glow, grey/B&W silhouettes only.** A
    neon-rimmed foreground prop is an automatic art FAIL AND a false interactivity signal. Matches
    Bertrand's "sprites code-drawn discrets, pas de néon décoratif." It renders in the in-game world
    (under crosshair/HUD per D1.3, within the CRT world layer) — being non-saturated it will not
    bloom (§8.4.3), so no CRT conflict.
  - **C2 (false-affordance → `lead-art` + `game-designer`).** The "toit de voiture au ras du bas"
    must be visually DISTINCT from the interactive delivery-vehicle class (which carries the
    render-side neon rim, la loi du glow): ship it as a **partial/cropped grey roofline at the very
    screen bottom, no rim** — never a full car silhouette that could read as "deliver here / shoot".
  - **C3 (verifiability pin → `game-designer` + `ux-designer`, before `dev-r3f-render` transcribes).**
    Pin the mobile bottom-band top-edge as a concrete **screen-%** derived from ADR-0003's thumb
    reserve + HUD extents, so the dev does not guess where the thumb/HUD zone ends (Ruling 2b). May be
    a one-line addendum to the UX spec; the level opts out on mobile if the number can't be met.
  - **C4 (VERIFY leg).** Stage-5 playtest checks AC1–AC7 + the UX AC checklist on Belliard &
    Stalingrad, both device classes; I hold the second gate leg (design acceptance) on that report.
    File List: `docs/handoffs/story-near-foreground-parallax.md`, `docs/handoffs/story-foreground-parallax.md`,
    `docs/game-design/README.md`.

- next: **DEV UNBLOCKED.** `senior-architect` (Winston) finalises TECH PLAN + ADR-0045; then
  `dev-r3f-render` (∥ `lead-art` on the grey band silhouettes under C1/C2). C3 to be pinned before
  transcription. Caps unchanged (≤2 spec-rework rounds — none consumed).
- VERDICT: PASS — design gate (lead-game-designer)
