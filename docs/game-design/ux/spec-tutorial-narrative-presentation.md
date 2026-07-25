# UX spec — NarrativeScreen tutorial presentation (immersion + fast decode)

**Surface:** `NarrativeScreen` during `TUTORIAL` only.  
**Author:** `ux-designer` (Tony) · **Date:** 2026-07-25  
**Status:** DRAFT — requires `lead-game-designer` DESIGN GATE PASS before `senior-architect` and render implementation.

**Scope guard**

- No production code in this lane.
- Keep tutorial optional/skippable (guidelines §5 rule 3).
- Preserve launch→gameplay `<10s` on the default path (tutorial is optional; no added friction on cold start path).
- Respect print-system law: menu/tutorial surfaces are paper artifacts, **zero glow**, grayscale décor only (`docs/art-direction.md` §2bis, ADR-0021, ADR-0023).

---

## 1) Decision set

## D1 — Décor integration strategy (immersion without readability loss)

Tutorial gains **context décor as a restrained backdrop layer**, not as content under text.

1. Reuse ADR-0023 backdrop mechanism (scene-level décor), but tutorial décor stays a **faint top-band context cue** only.
2. Transcript zone remains solid paper (`paper-newsprint`/`paper-shell` family), never transparent over décor.
3. Décor must not sit behind running body copy:
   - décor visual energy limited to upper band;
   - text block remains on clean paper.
4. No colour reintroduction: grayscale-only façade treatment, no neon/glow/scanline/RGB split.
5. If backdrop asset fails, tutorial remains fully readable (text + cue channels still functional).

**Functional intent:** player feels “street context” immediately, but decoding controls/mechanics stays first.

---

## D2 — Visual channel hierarchy (image / gesture / diagram / bullet cues)

Tutorial panels use **one primary visual channel per panel** + optional short bullet reinforcement in copy.

### D2.1 Primary channel priority by teaching goal

1. **Gesture** = input action teaching (shoot/pan).
2. **Diagram** = timing/zone logic teaching (e.g., hostage ring read).
3. **Image** = identity recognition (enemy/courier silhouettes).
4. **Bullets** = textual reinforcement only (never the sole carrier for core controls).

### D2.2 Panel density rules

- Never show more than **one** of `{image, gesture, diagram}` simultaneously.
- Bullet reinforcement max **2 bullets** per panel, each one action-oriented.
- Use bullet cues on high-risk misunderstanding panels only:
  - mobile shoot gesture,
  - “never shoot courier,”
  - hostage-ring “shoot on green.”
- If panel already decodes in one glance with visual + sentence, omit bullets.

### D2.3 Bullet cue format contract

- Bullet 1 = “what to do”.
- Bullet 2 = “what happens if wrong” **or** “why this matters”.
- Keep copy device-accurate (ADR-0015 vocabulary law):
  - mobile: `deux doigts`, no `souris/clic`;
  - desktop: `souris/clic`, no `doigt/balay`.

---

## D3 — Pacing and interaction rhythm

Keep current 2-step interaction mental model, but tighten comprehension rhythm.

1. **Tap/press #1** while typewriter runs = complete current line instantly.
2. **Tap/press #2** = advance panel.
3. “Continue” affordance appears immediately once line is complete, in a stable position.
4. “Passer” remains always available and visually persistent.
5. Rhythm target for onboarding:
   - control understanding by panel 3,
   - threat taxonomy by panel 8,
   - HUD + objective recap in final 2 panels.
6. Reduce long prose blocks: split dense mechanics into visual + short bullets rather than one long paragraph.

---

## D4 — Desktop/mobile ergonomics + accessibility

## D4.1 Ergonomics

- Touch targets: all actionable controls (skip/continue hotspots) meet **≥44×44 CSS px**.
- Landscape mobile safe layout: skip and progress remain reachable and not occluded by browser UI.
- Illustration slot scales down before clipping on short landscape (preserve one-glance legibility).

## D4.2 Accessibility contract (verifiable)

1. Tutorial container exposed as dialog-like narrative surface (`role` + accessible name).
2. Skip control has explicit destination label (“skip tutorial, return to menu” semantics).
3. Primary cue node (image/gesture/diagram) exposes usable alt/aria label; empty labels are hidden from a11y tree.
4. Reduced-motion mode:
   - no pulsing/strobing cue loops;
   - gesture/diagram cues degrade to static key pose/frame;
   - typing/advance flow remains functional.
5. Contrast floor:
   - transcript text vs paper ground stays AA minimum;
   - cue silhouettes remain legible in grayscale capture.

---

## 2) Wireframe-level layout (function only)

### Desktop

```text
┌──────────────────────────────────────────────────────────────┐
│ masthead                             progress dots    [skip] │
│                                                              │
│      [context décor band: faint, grayscale, non-text area]  │
│                                                              │
│                    [PRIMARY CUE SLOT]                        │
│            (gesture OR diagram OR image, one only)           │
│                                                              │
├──────────────────────────────────────────────────────────────┤
│ SPEAKER                                                      │
│ line text…                                                   │
│ • optional bullet 1 (action)                                │
│ • optional bullet 2 (risk/benefit)                          │
│                                              [ CONTINUER ]   │
└──────────────────────────────────────────────────────────────┘
```

### Mobile landscape

```text
┌──────────────────────────────────────────────────────────────┐
│ [skip]                                       progress dots   │
│ [faint context décor band]                                    │
│ [PRIMARY CUE SLOT scaled for short height]                   │
├──────────────────────────────────────────────────────────────┤
│ SPEAKER                                                      │
│ short line + optional bullets (max 2)                        │
│                                              [ CONTINUER ]   │
└──────────────────────────────────────────────────────────────┘
```

---

## 3) Acceptance checks — render lane implementation checklist

Use `?preview=tutorial` desktop + mobile captures and reduced-motion variants.

- [ ] **AC1 Décor readability:** tutorial includes contextual backdrop treatment, but transcript text never sits over high-detail décor; text remains readable at arm’s length on phone.
- [ ] **AC2 Print-law compliance:** no menu/tutorial glow artifacts (`text-shadow` glow, neon rim, CRT scanline, RGB split) introduced.
- [ ] **AC3 Channel hierarchy:** each panel shows at most one primary cue channel; gesture/diagram/image are never stacked together.
- [ ] **AC4 Bullet discipline:** bullets appear only on designated high-risk mechanics and never exceed 2 per panel.
- [ ] **AC5 Rhythm interaction:** first input while typing completes line; second input advances; continue hint appears only when panel is ready.
- [ ] **AC6 Skip persistence:** skip is visible and usable on every tutorial panel, desktop and mobile.
- [ ] **AC7 Device-copy correctness:** desktop tutorial copy uses `souris/clic` and excludes finger wording; mobile uses `deux doigts` and excludes mouse wording.
- [ ] **AC8 A11y labels:** cue channels expose valid alt/aria labels; decorative/empty labels are hidden from assistive tech.
- [ ] **AC9 Reduced-motion:** animated gesture/diagram cues degrade to static non-pulsing presentation while preserving comprehension.
- [ ] **AC10 Fast mechanic decode (playtest):** first-time players can correctly answer, by end of tutorial: how to shoot, how to pan, which target is forbidden, and when to shoot hostage ring (green) without replaying panels.

---

## 4) Hand-off seams

- **`narrative-designer`**: bullet microcopy and any line splits (French wording authority).
- **`lead-art`**: final décor/cue rendering style within print-law constraints (I define hierarchy/readability only).
- **`senior-architect` + `dev-r3f-render`**: field/UI contract changes required to support bullet-cue presentation and tutorial backdrop behavior.
