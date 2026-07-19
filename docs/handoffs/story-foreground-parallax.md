# Handoffs — Near-foreground differential-scroll layer (STORY-FOREGROUND-PARALLAX)

Story slug: `story-foreground-parallax` · opened by `game-designer` (Sacha), 2026-07-17.
Feature: a very-near foreground décor stratum that scrolls faster than the facade on pan,
adding depth to the street. Origin: Bertrand proposal (PROPOSAL phase, no code).

## 1. DESIGN — game-designer (Sacha) — 2026-07-17

- claim: game-feel + 3C design spec for the near-foreground parallax layer (non-occlusion,
  parallax factor, appearance behaviour, density, interaction scope).
- release: `docs/game-design/spec-foreground-parallax.md` (PROPOSAL). Headlines:
  - **Cahier des charges: CONSCIOUS EXTENSION.** Prohibition had no multi-layer
    near-foreground; muf's core loop is untouched _iff_ non-occlusion holds. **Needs `pm`
    (John) acknowledgement of the extension flag before implementation.**
  - **Engine-convention correction (load-bearing):** the codebase uses
    `mesh.x = camera.x * factor`, so higher factor = FARTHER (sky 0.88–0.92, facade 0.0).
    "Scrolls faster than facade" (apparent speed S > 1) = a **NEGATIVE** engine factor, NOT
    the brief's ">1". Spec gives both S and `factor = 1 − S`.
  - **Non-occlusion (iron rule):** confine objects to the TOP and BOTTOM bands only
    (above/below the window rows ± 0.8 margin); mid-height forbidden because parallax slides
    it into window columns across the pan. Verifiable against `windowGrid` at every pan
    offset. Rejected dynamic fade-when-cop-behind (couples render↔state, worse feel).
  - **Parallax factor:** target **S = 1.20 (engine factor −0.20)**, range S 1.15–1.30
    (factor −0.15 to −0.30). Below ~1.13 no depth; above ~1.32 the near plane swims/induces
    vection. Couples to edge-scroll pan speed → verify in build.
  - **Appearance:** enter/exit **from screen edges on scroll** (static world props on the
    fast plane), NOT time fade-in. Optional spatial edge-feather (reuse facade BLEND).
  - **Density:** target **3** on screen, hard cap **4**; ~1 element per 0.5 screen-widths.
  - **Interaction:** **purely decorative**, not hit-testable, zero gameplay effect. Tracer
    flutter deferred (YAGNI).
  - **Lane:** render-only (reads camera.x + levelArt), no `src/game` change → candidate
    `dev-r3f-render`; architect confirms placement.
- handoff → `lead-game-designer` (Karim): design gate requested.
- handoff → `pm` (John): FYI + acknowledge the §0 conscious-extension flag (scope).
- downstream once gated: `senior-architect` (lane/boundary confirm), `lead-art` (spec the
  read — which top/bottom-band silhouettes; style is art's call), `dev-r3f-render` (impl),
  `game-designer` (VERIFY playtest vs AC1–AC7).

- VERDICT: PASS — design gate (lead-game-designer)

## 2. DESIGN GATE — lead-game-designer (Karim) — 2026-07-17

- The single design gate covering this feature is recorded on the canonical shard,
  `story-near-foreground-parallax.md` §3 (both shards track ONE feature — producer housekeeping,
  §2 there). **VERDICT: PASS with binding conditions.**
- For Sacha's spec (`spec-foreground-parallax.md`): scope = conscious extension, PM-acked, core loop
  intact (non-occlusion iron rule + non-hit-testable + AC6/AC7). Ratified as-is. Binding downstream
  conditions C1 (decor ⇒ zero glow, grey/B&W — loi du glow §2 law 1 / guidelines §5) and C2 (the
  parked-car roofline must read distinct from the interactive delivery-vehicle class: partial grey
  roofline, no rim) are flagged to `lead-art` + `game-designer` for the art/asset stage. Full ruling
  - Rulings 1–3 on the two UX flags: canonical shard §3.
- VERDICT: PASS — design gate (lead-game-designer)
