# Story: Lamppost lantern glow (near-foreground réverbère)

**Story ID:** STORY-LAMPPOST-LANTERN-GLOW
**Type:** Render-side visual treatment (Bertrand-directed exception to C1) — no gameplay change.
**Status:** DRAFT — needs design loop + architect lane assignment before any code
**PM:** John · **Date:** 2026-07-20 · **Branch context:** `claude/rue-propos-pipelines-revision-r4g52z`
**Origin:** Bertrand, verbatim (2026-07-20): « Fais le plus grand et allume le. Crée une
story pour ajouter une lumière ou un shader » — said while the near-foreground `lamppost`
(réverbère) sprite is being regenerated with a lit lantern (bright panes, baked into the
PNG — the "plus grand" half of the directive is a separate art-scale note, not this
story's scope).
**Scope guard:** PROJECT_GUIDELINES §1 (cahier des charges), §5 ("ce qui brille est
interactif, ce qui est gris est décor" — C1) · ADR-0047 (near-foreground layer + its
traffic-light amendment) · ADR-0049 (nearfg generated sprites + `drawSignalLenses`
overlay pattern)
**Touches (anticipated):** `src/render/scene/NearForeground.tsx` (or a new co-located
module, architect's call), possibly `src/render/scene/nearForegroundTextures.ts` /
`nearForegroundArt.ts`, possibly a `levelArt.json` `nearForegroundArt.types.lamppost`
anchor field (mirroring `trafficLight`'s `lenses`) if the overlay-plane mechanism is
chosen. No `src/game` change anticipated — flag if design finds otherwise.

## Why (product value)

The lamppost sprite is being regenerated with a lit lantern — bright window panes baked
into the art. A baked bright pane alone reads as "a lamp that happens to be on" in a
static PNG; it does not read as a **light source** in the scene the way the game's other
directed glow (the traffic-light lit lens, ADR-0047 amendment) does. Bertrand wants the
lantern to actually **light the night** — a visible glow/halo around the lantern head —
so the réverbère reads as active street furniture at night, not a flat sprite with a
bright rectangle painted on it. This is atmosphere/legibility value only: it reinforces
the fanzine-noir-at-night register the near-foreground layer was built for (ADR-0047),
costs the player nothing, and touches no rule, verb, input, or target.

## Cahier des charges test — verdict: CONSCIOUS, DOCUMENTED, JUSTIFIED EXTENSION (second instance of an established exception family)

> "Est-ce que Prohibition Atari ST avait ça ?"

- **A glowing streetlamp — No.** Atari ST Prohibition had no lit night decor. Per §1 this
  is a conscious extension, and per §5 (C1: décor is grey, only what's interactive
  glows) it is additionally a **named exception to a house law** — same family as the
  traffic-light lit lens, which ADR-0047's amendment already logs as
  "a scoped exception to the flat grey, zero glow register." **This is now a SECOND
  Bertrand-directed exception to C1** and must be recorded as such (not silently
  generalized into "decor can glow now" — the design gate below is exactly where that
  line gets drawn).
- **No change** to the core loop, win/lose condition, inputs, targets, or the
  crosshair→world hit contract. The lamppost is not interactive; C1's operational
  meaning ("what glows is interactive") is being knowingly overridden for this ONE prop,
  same as the traffic light was — the design gate must state explicitly that this does
  **not** make the lamppost a target or a gameplay signal, only atmosphere.
- Justification lives in this story and must be cross-referenced in ADR-0047 (which
  already carries the first C1 exception) — likely as a second amendment section, or a
  new small ADR that references it. Architect's call which.

## Scope questions to frame (PM does not decide these — routed to the right gate)

1. **Colour of the glow — lead-art's call, flagged here.** The trafficLight exception
   uses a directed real-world colour (red/orange/green signal colours). The lamppost is
   a **sodium-vapour-era Parisian streetlamp**; historically that reads warm-amber/
   warm-white, not neon. Options to frame at the design/art gate: (a) grey/warm-white —
   closest to a real gaslamp/sodium lamp and the most conservative reading of "still
   décor, just lit"; (b) an acid-neon hue matching the game's interactive palette, which
   would blur the C1 line harder than the traffic light does (the traffic light's colour
   is diegetic — real signal colours — not an invented neon). PM's lean, for the design
   gate to accept or override: **warm-white/pale-amber, not house-neon acid colour** —
   because unlike the traffic light, the lamppost has no gameplay signal to justify
   reading as "interactive-hued." This is a recommendation, not a ruling; lead-art owns
   the final colour call.
2. **Mechanism — overlay pattern vs a real Three.js light.** ADR-0049 already shipped
   the precedent for exactly this kind of thing: `drawSignalLenses`, a render-side
   transparent overlay texture on a co-located mesh, repainted only on state change (not
   per frame), reusing the housing sprite as the base and adding the lit/coloured layer
   on top. For a **static** glow (no phase cycle — the lamppost doesn't blink) the
   cheapest version of that pattern is even simpler: a co-located, alpha-falloff plane
   or sprite billboard behind/around the lantern (or a soft radial-gradient texture),
   drawn once, no per-frame repaint. The alternative — a real Three.js `PointLight` at
   the lantern — is a much heavier and more unusual mechanism for muf: this is a
   2D-sprites-in-3D world with no other dynamic lighting in the scene (the CRT/neon
   rim/traffic-light glow are all sprite/shader tricks, not scene lights), so a real
   point light would be the first of its kind, cost N draws' worth of relighting for
   every other object in range, and fight the flat "photocopied" art direction the
   moment it started casting believable falloff on facades. **PM flags the overlay
   plane / additive-sprite approach as the likely cheapest coherent mechanism**, matching
   precedent — but this is `gpu-specialist`'s and `senior-architect`'s call to confirm
   against `docs/perf-budget.md`, not PM's to mandate. If a lightweight custom shader
   (radial falloff, additive blend) reads better than a billboard sprite, that is also a
   render-lane choice within the same "no real scene light" envelope.
3. **Perf.** `gpu-specialist` must weigh in before lanes are cut (per COLLABORATION.md
   §3 TECH PLAN: perf-sensitive features route through GPU-cost analysis first). Every
   placed lamppost gets a glow — current levels place multiple lampposts per level (see
   `levelArt.json` placements, near + far rows) — so this is N simultaneous glows, not
   one. The additive/emissive draw cost, overdraw from alpha falloff, and any texture
   memory for a new glow asset all need a verdict against budget before this leaves the
   design/tech-plan stage.
4. **Reduced-motion / perf caps.** The glow itself is static (no pulse asked for by
   Bertrand — do not invent one), so `prefers-reduced-motion` is likely a non-issue for
   THIS story; flag it anyway so the design gate makes the call explicit rather than by
   omission, and so nobody quietly adds a pulse/flicker later without a fresh directive
   (out of scope below).

## Acceptance Criteria (testable)

- **AC1 — glow visible at night on every placed lamppost.** Every `kind: "lamppost"`
  instance placed in `levelArt.json` (near AND far rows, all levels that carry the
  near-foreground layer) shows a visible glow/halo around its lantern head in the game's
  night setting. Verified via `/verify` screenshots at rest and mid-pan.
- **AC2 — no gameplay change.** The lamppost remains non-interactive decor: not
  clickable/targetable, no effect on hit detection, scoring, timing, or the
  crosshair→world contract. `src/game` is untouched unless the design/architect gate
  finds a concrete reason otherwise (flag it if so — not expected).
- **AC3 — perf verdict.** `gpu-specialist` delivers a PERF VERDICT against
  `docs/perf-budget.md` for N simultaneous lamppost glows (current placement count) on
  both desktop and the mobile tier, BEFORE the tech-plan lane assignment is finalized,
  per COLLABORATION.md's perf-sensitive-feature rule.
- **AC4 — lead-art composite gate.** Because this is a runtime-composed visual (an
  overlay/shader/emissive effect not present in the delivered PNG — same class as the
  neon rim and the traffic-light lit lens), it goes through `lead-art`'s COMPOSITE GATE
  (Gate 4) at stage 5 VERIFY, on real in-game screenshots of the integrated build — not
  judged on the source sprite alone. « un halo est un dégradé, jamais un aplat. »
- **AC5 — reduced-motion behaviour is explicit.** The design gate states plainly whether
  reduced-motion affects the glow (default expectation: no, it's static — see scope
  question 4) so the behaviour is a decision on record, not an omission.
- **AC6 — C1 exception recorded.** The design/architect gate documents this as the
  SECOND named exception to C1 (grey décor / glow-means-interactive), cross-referenced
  against the traffic-light exception in ADR-0047, in an ADR amendment or a new ADR
  (architect's call which).
- **AC7 — verified + documented (DoD §9).** `rtk tsc` + `rtk vitest` + `rtk lint` clean;
  confirmed in-browser via `/verify`; ADR updated per AC6.

## Out of scope (explicit)

- **"Plus grand"** (making the lamppost sprite bigger) — that is an art/prompt-scale
  note on the sprite regeneration already in flight (the road-props reference-revision
  story), not a render/shader concern. Not this story.
- **Pulse, flicker, or any animated glow behaviour** — Bertrand asked for a static glow
  ("allume-le"), not a cycle. No phase clock, no `trafficSignal.ts`-style animation. If
  wanted later, a fresh directive opens a follow-up story.
- **A real dynamic Three.js scene light** that relights neighbouring geometry — explicitly
  flagged as the heavier alternative in scope question 2, not pre-selected; if the
  design/architect gate DOES choose this path it should come back through this story's
  AC set, not be smuggled in as a mechanism detail.
- **Glow on any other décor prop** (wallaceFountain, bollard, etc.) — lamppost only. A
  third C1 exception is a new directive, not an inference from this one.
- **Any change to the near-foreground non-occlusion band, placement data, or parallax
  factors** — this story only adds a visual around the existing lantern position.

## Open questions (for design + art + architect + gpu-specialist gates — not decided by PM)

1. Glow colour — warm-white/amber (PM's lean) vs a house-neon hue. Lead-art's call.
2. Overlay plane / additive sprite vs custom shader vs (if justified) a real point light.
   `senior-architect` + `gpu-specialist`'s call.
3. Whether a `levelArt.json` anchor field (mirroring trafficLight's `lenses`) is needed
   for glow registration, or whether the halo can be centred on the sprite's known
   lantern position without new data. Architect's call.
4. ADR treatment: amend ADR-0047 again, or open a new ADR. Architect's call.

---

*Pipeline: DESIGN LOOP (`game-designer` + `ux-designer` on the C1-exception framing and
non-occlusion/readability at night; `lead-game-designer` DESIGN GATE on colour lean +
"decor only, not a signal" framing) → `senior-architect` (mechanism, lane partition, ADR)
+ `gpu-specialist` GPU-cost analysis BEFORE lanes are cut (perf-sensitive feature) →
render lane implements → VERIFY (`qa-lead` funnel; `gpu-specialist` PERF VERDICT;
`lead-art` COMPOSITE GATE on real screenshots) → code-review panel → PM acceptance
(AC1–AC7 + scope-OUT respected). Devs implement only assigned, scoped lanes; log every
hand-off under `docs/handoffs/`.*
