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
