# FLUX craft — deep dive, house-style checklist, worked examples

Companion to `SKILL.md`. Read this before authoring a prompt for a family you haven't
touched, or when a prompt keeps failing the gate for a reason you can't pin down.

## How FLUX actually behaves (the *why* behind the method)

- **Negations are noise.** "no sedan", "without windows", "not photorealistic" mostly
  don't register; worse, the noun you negate still seeds the concept. The only reliable
  way to exclude a reading is to describe a shape that *cannot* be read that way. This is
  why muf prompts are 100% positive and silhouette-first.
- **Category words summon the category's average.** "car", "van", "cop" pull FLUX toward
  a generic mean that fights the 1998-Paris, fanzine-B&W identity. Prefer volume language
  ("one-box monospace volume", "flat-fronted forward-control body") and let a single
  anchoring noun do minimal work.
- **It over-weights the front of the prompt.** Put the load-bearing silhouette clauses
  first; trailing clauses blur. muf splits this structurally: the family `opening` sets
  framing, the per-type `prompt` leads with the defining volume, the family `style`
  suffix carries texture/background.
- **Orientation and exact colour are unstable across seeds.** That is why muf makes both
  render-side metadata (`facing`, `neon` + ADR-0011 rim) instead of prompt text — a
  re-roll shouldn't flip the sprite or shift the accent.
- **Background bleed is a keying problem.** A busy or "scene" background survives
  chroma-key as fringe. muf generates on a flat uniform key colour (pure black `#000000`
  for enemies, bright magenta `#FF3CDC` for vehicles) declared once in the family `style`;
  never describe a setting in the subject.

## House-style checklist (run before hand-off)

- [ ] Subject clause is **volumes and proportions**, not a category label.
- [ ] No style/texture/lighting words in the per-type `prompt` (they live in `style`).
- [ ] No background/setting in the subject (chroma-key is in `style`).
- [ ] No neon/accent colour in the subject (it's the `neon` render field).
- [ ] No orientation words fighting `facing`.
- [ ] One subject, centred, whole silhouette in frame.
- [ ] Period-true for 1998 Paris (checked vs `docs/art-direction/references/`).
- [ ] If a repair: exactly **one** clause changed vs the last roll; seed unchanged.
- [ ] `node scripts/check-art-prompts.mjs` passes.

## Worked examples (from the real `levelArt.json`)

These are shipped entries — study how each carries subject + silhouette only, and how
the shared `opening`/`style`/`neon` do the rest.

**Vehicle — car** (family style: fanzine B&W on magenta key; `neon: cyan`, `facing: left`):
> `one-box monospace city car completely alone, empty surroundings, hood and windshield in one continuous slope, tall upright phone-booth-shaped glasshouse cabin, wheels pushed to the corners, vertical tail flush behind the rear wheel`

Why it works: the one-box slope + phone-booth glasshouse + corner wheels + flush tail
*is* a Twingo-mk1 silhouette without ever naming a model or a category; no colour, no
background, no orientation.

**Vehicle — truck**:
> `flat-fronted forward-control 1980s French panel van, near-vertical windshield, boxy cargo body taller than the cab line, single flank crease, steel wheels`

Why: "forward-control + cargo taller than the cab line" locks the C25/Master proportion;
"steel wheels" and "single flank crease" add period truth cheaply.

**Enemy — plainclothes cop** (family style: 16-bit sprite on pure-black key):
> `a menacing plainclothes french cop wearing a cap, standing facing forward, arms at sides`
> frames: `["", "weight shifted to the other leg, head turned slightly"]`

Why: enemies tolerate one anchoring noun ("cop") because readability at 256px needs a
legible archetype; the pose delta lives in `frames[1]` as a *single-variable* change for
the flipbook's second frame — the exact iteration discipline the gate wants.

## Common FAIL → single-variable fix map

| Gate/lint says | The one clause to change |
| --- | --- |
| Reads as the wrong category (sedan, SUV…) | Sharpen the defining volume/proportion clause; do not add a negation. |
| Colour baked into the sprite | Remove the hue word from the subject; it belongs to `neon`. |
| Background bleed / fringe after cutout | Remove any setting words from the subject; the key colour is in `style`. |
| Facing the wrong way | Don't touch the prompt — set `facing` at the gate (render mirrors it). |
| Set looks incoherent across types | Move any per-type style/texture words back into the family `style`. |
| Silhouette unreadable at game size | Simplify to the biggest 2–3 volumes; drop fine detail the size can't show. |
