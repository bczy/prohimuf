---
name: flux-prompt
description: >
  Author or repair a FLUX image-generation prompt for muf's asset families in
  src/game/levels/levelArt.json (vehicles, enemies, courier, hostages, level
  backdrops). Use this whenever a NEW asset family/type is needed, or an existing
  prompt FAILED the lead-art gate or the check-art-prompts lint, or someone asks to
  "write/fix/iterate a prompt", "generate a new sprite/vehicle/enemy", or "the
  generated art is wrong (wrong shape, colour baked in, background bleed)". It
  produces a gate-ready prompt entry — silhouette-first, positively described,
  FLUX-aware, house-style-correct — plus a one-line rationale per clause, ready for
  the lead-art PASS. Owner lane: concept-artist (Maud).
---

# flux-prompt — author a gate-ready FLUX prompt for muf

FLUX is a temperamental airbrush: it paints what you *describe as present* and
quietly ignores what you tell it to avoid. A good muf prompt therefore describes a
**silhouette as volumes** so completely that the failure mode has no room to appear,
carries **only the subject** (the shared style block lives once, on the family), and
leaves colour and orientation to render-side metadata. This skill turns that craft
into a repeatable pass whose output a busy `lead-art` can PASS on the first read.

Full craft contract: `docs/art-direction.md`. Period truth: `docs/art-direction/references/`
(ask `art-advisor` when a 1998-Paris shape is uncertain). Deeper FLUX behaviour, the
house-style checklist and worked examples: **`references/flux-craft.md`** — read it
before writing your first prompt for a family you haven't touched.

## Before you write — read the target

1. Open `src/game/levels/levelArt.json` and find the family you're editing
   (`vehicles`, `enemies`, `courier`, `hostages`, or a `levels[*].prompts`). **Read its
   `$comment`** — it is the per-family contract (chroma-key colour, what `opening`/`style`
   already cover, what `neon`/`facing`/`seed` mean, where the PNG lands).
2. Note the **split**: the family holds a shared `opening` prefix and a shared `style`
   suffix (fanzine/xerox base, chroma-key background, flat side view, cutout edges). A
   per-type `prompt` carries **subject + silhouette ONLY** — never re-state style,
   background, colour, "no text", or orientation there.
3. If repairing: read the latest `lead-art` verdict (`docs/agent-handoffs.md`) or the
   lint error, and identify **the single clause** that addresses the failure.

## Write the prompt (the method)

Apply these in order; each maps to a real FLUX failure mode (why in `references/flux-craft.md`):

1. **Positive shape language.** Describe the silhouette as volumes, proportions and
   where mass sits — "single egg-shaped one-box volume, roof height more than half the
   length, flat vertical tail directly behind the rear wheel". Never name a category you
   *don't* want ("not a sedan" and even "sedan" both summon sedans) — describe the shape
   so the unwanted reading is impossible.
2. **Subject only.** Keep the per-type `prompt` to the subject and its silhouette. Style,
   background and lighting come from the family `style` suffix; adding them per-type
   double-exposes and drifts the set out of cohesion.
3. **Colour is render metadata, not paint.** The neon accent is the `neon` field
   (render-side rim per ADR-0011); the sprite is generated flat B&W or on the family's
   chroma-key colour. Do **not** write the accent hue into the subject text.
4. **Orientation is a registration knob.** FLUX won't obey "facing left" reliably —
   leave direction to the `facing` field the art gate sets; don't fight the seed with
   orientation words.
5. **Isolation.** One subject, centred, fully visible, whole silhouette inside frame
   (the `opening` usually says this — don't contradict it).
6. **One variable per iteration.** On a FAIL, change only the clause that addresses the
   named failure; keep the seed. Wholesale rewrites make the gate un-diffable and burn
   the batch cap (max 2 generation batches/cycle).

## Deliver

- Edit **only** the prompt/style strings in `levelArt.json` (ids, sizes, paths,
  structure belong to `dev-tooling-assets`).
- Log the draft + rejected variants + a one-line rationale per clause in
  `docs/art-direction/prompt-drafts.md` (traceability for the gate).
- Run the mechanical lint before hand-off: `node scripts/check-art-prompts.mjs` — it must
  pass (it enforces the contract; `lead-art` judges the craft).
- Hand to **`lead-art` for PASS** before any commit/generation. Output a short block:
  the final `prompt` string, the family it belongs to, and the per-clause rationale.

## Output template

```
Family: <vehicles|enemies|courier|hostages|levels[<slug>]>  ·  Type/key: <key>
Prompt (subject + silhouette only):
  "<the prompt string>"
Rationale (one line per clause that earns its place):
  - <clause> → <the shape/failure it locks down>
Iteration note (if a repair): changed ONLY "<old clause>" → "<new clause>" because <gate/lint reason>; seed kept.
Lint: node scripts/check-art-prompts.mjs → PASS
Next: lead-art PASS required before commit.
```

## Guardrails

- Never widen scope: a prompt serves an asset the game actually needs (cahier des
  charges — `_bmad-output/guidelines/PROJECT_GUIDELINES.md`), not a cool idea.
- Never hard-code the chroma-key or neon colour into the subject.
- Never mark done on a lint failure or without the `lead-art` gate.
- Doubt on a period shape → `art-advisor` before rolling.
