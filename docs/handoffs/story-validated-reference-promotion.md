# story-validated-reference-promotion — handoffs

Story: close the feedback loop ADR-0044 deliberately left ad-hoc — once a generated
asset passes the `lead-art` gate, promote it into a reusable internal reference that
subsequent generations of related assets in the same family automatically use (kontext
`image=` source), proven end-to-end rather than merely stored. Coexists with the new
`graphic-references` (Ray) external-hunt boards under one coherent, `lead-art`-curated
reference library. Branch `claude/image-generation-agents-references-1176lb` (PR #84,
draft), on top of ADR-0044.

## 1. PRODUCT — pm (John) — 2026-07-18

- claim: scope the promotion-loop story per Bertrand's intent (feedback half of
  ADR-0044's ad-hoc reference flow) and the new `graphic-references` agent's
  coexistence question / release: story written —
  `_bmad-output/planning-artifacts/story-validated-reference-promotion.md`.
- File List: `_bmad-output/planning-artifacts/story-validated-reference-promotion.md`
  (new).
- Design loop: **skipped, explicit** — no mechanics/tuning/3C, no fiction, no
  screens/flows/accessibility change; pure asset-tooling + art-flow doc/process
  extension. `lead-game-designer` gate not engaged.
- Next hand: **`senior-architect`** (cross-cutting: `scripts/**` generator/lib wiring +
  art-flow doc/gate contract, per COLLABORATION.md) for the tech plan, in coordination
  with **`lead-art`** for the promotion criterion (AC5 needs both reconciled before lanes
  are cut). Explicitly NOT designed in the story: registry/manifest schema, generator
  wiring, and the promotion acceptance criterion — those stay the architect's and
  lead-art's calls respectively.
