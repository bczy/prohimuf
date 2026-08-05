# 0080 — Portrait-robot face data model: one atomic gabarit, sliced PNGs, a distance matrix, and `validatePortrait`

- **Status:** Proposed
- **Date:** 2026-08-05
- **Number:** 0080, allocated by producer (Marion) at story intake 2026-08-05.
- **Author:** decision content by `senior-architect` (Winston), stage 3 TECH PLAN.
- **Relates to:** ADR-0079 (the scene shell that consumes this catalogue), ADR-0081
  (presentation), ADR-0074 (the `*.data.ts` + `validate*` + no-I/O-at-import pattern this ADR
  copies deliberately), ADR-0075 (generated data committed beside its source), ADR-0011
  (a global property cannot be obtained by repeating it in N local prompts — the reason for
  slicing, not per-band generation), ADR-0068 (lazy chunking), asset-preload story
  (`assetManifest.ts` / `useAssetPreloader`).
- **Inputs (canonical):** `docs/game-design/design-gate-portrait-robot.md` §3 and A5;
  `docs/art-direction/brief-portrait-robot.md` §1, §5, §6, §7.3 (the three blocking questions
  answered in D6).

## Context

The gate froze the shape of the problem: **4 bands** (`LA COUPE` / `LE REGARD` / `LE NEZ` /
`LA BOUCHE`; internal ids `hair` / `eyes` / `nose` / `mouth`), **6 variants per band, hard
ceiling 6**, **1 gabarit** ⇒ 24 band assets, and a V1 difficulty composition of **1 truth + 2
strong-class decoys + 3 medium-class decoys + 0 class-4 decoys**. The draw must be a pure hash
of a `portraitSeed` — zero `Math.random`, zero `Date.now` in `src/game`.

Three facts make this a decision rather than a JSON file:

1. **`lead-art` proved the assets cannot be generated per band** (§5.2, and the neon-liseré
   precedent ADR-0011): FLUX has no memory of skull width between generations, so 24
   independent generations produce 24 different skulls and the seam rule (§1) fails by
   construction. The production route is **generate whole faces on a plate, then slice**. That
   makes "a band" a *derived* artefact, and derived artefacts need a provenance rule or they
   drift.
2. **The difficulty lever is the distance between variants, not their number** — the thesis
   shared by the recon, `game-designer` D2 and `lead-art` §2, and ratified in A5. A data model
   that stores only "6 pictures per band" cannot express, let alone enforce, "2 strong + 3
   medium + 0 fine". The gate's composition rule would degrade into a review promise.
3. **`levelArt.json` is keyed by level.** This catalogue is run-scoped and level-independent;
   it has no level to be keyed by.

## Decision

### D1 — The catalogue lives in `src/game/portraits/`, mirroring `src/game/levels/`

```
src/game/portraits/
  faceCatalogue.data.ts        pure, import-time-computable, no I/O, no clock, no randomness
  portraitPlate.generated.json emitted by the slicing script: seam ordinates + per-band asset paths
  validatePortrait.ts          the single source of catalogue invariants (no catalogue import)
  index.ts                     public barrel (types + data), the only import surface
```

This is ADR-0074's shape, applied verbatim and for the same reasons: a data module a tool can
read (and one day write) mechanically, a validator callable on a *candidate* catalogue that is
not the shipped one, and no transitive path from the data to browser I/O.

**It is not a block in `levelArt.json`** (answering `lead-art` §7.3 Q2): that file is a
per-level art table, this catalogue is run-scoped and level-independent, and every consumer of
`levelArt.json` would start paying an import cost for data it never reads. The **seam ordinates
live in data**, as he asks — but in `portraitPlate.generated.json`, **emitted by the slicing
script**, never hand-maintained. That is the `windowZones.generated.json` precedent already in
the repo, and it honours his "derived, never a redundant manifest field" rule: the seams are
whatever the script cut, by construction.

### D2 — The shape

```ts
export type PortraitBandId = "hair" | "eyes" | "nose" | "mouth";
export type VariantDistance = "strong" | "medium" | "fine";

export interface PortraitVariant {
  readonly id: string;      // stable, e.g. "eyes-03"
  readonly asset: string;   // BASE-relative path, e.g. "assets/portrait/eyes-03.png"
  readonly trait: string;   // the NAMED TRAIT (gate A5): one short sentence, no pixel coords
}

export interface PortraitBand {
  readonly id: PortraitBandId;
  readonly label: string;                 // canonical player-facing label (gate A6)
  readonly variants: readonly PortraitVariant[]; // exactly 6
  /** Symmetric pairwise perceptual distance, upper triangle, 15 entries. Key: "i:j", i < j. */
  readonly distances: Readonly<Record<string, VariantDistance>>;
}

export interface FaceCatalogue {
  readonly gabaritId: string;    // one template in V1 (gate A5)
  readonly plateChecksum: string; // provenance, see D5
  readonly bands: readonly PortraitBand[]; // exactly 4, in draw order
}
```

**Why the distance matrix is the decision.** With N = 6 = the whole pool, every variant of a
band is always on screen; the only free parameter is *which one is true*. The gate's
composition rule ("2 strong + 3 medium + 0 fine") is therefore a statement about the **row of
the truth** in a pairwise distance matrix — it cannot be expressed per variant, because a
variant's class only exists relative to another. 15 authored values per band, 60 in total,
produced once from `game-graphist`'s comparison plate (his §7.2 pre-prod pass). In exchange,
the difficulty rule becomes **data the validator can enforce**, and re-tuning difficulty never
touches code.

### D3 — `validatePortrait`, the single source of catalogue invariants (ADR-0074 §3, applied)

```ts
export function validatePortrait(catalogue: FaceCatalogue): readonly LevelIssue[];
```

Same contract as `validateLevel`: never throws, never mutates, deterministic issue order,
reuses the existing `LevelIssue` shape (`code` / `severity` / `field` / `message`) so one
reporting vocabulary serves both, and **imports no catalogue** so it can validate a candidate.

Invariants, error unless noted:

| code | Checks |
| --- | --- |
| `band-count` | exactly 4 bands, ids exactly the four canonical ones, no duplicate |
| `variant-count` | exactly 6 variants per band (hard ceiling, gate A5) |
| `variant-id-unique` | ids unique within the catalogue |
| `distance-complete` | all 15 pairs present per band, no unknown key, no self-pair |
| `decoy-profile` | **at least one** variant whose row is exactly 2 `strong` + 3 `medium` + 0 `fine`; the draw picks only among those (D4) |
| `no-fine-pair` | *warning* — a `fine` pair anywhere is legal data but unusable in V1 (gate A5 forbids class-4 decoys) |
| `trait-named` | every variant carries a non-empty `trait` (gate A5's rule of the named trait, made mechanical) |
| `asset-path` | every asset path matches the gabarit's naming convention and appears in the plate manifest |
| `plate-provenance` | `plateChecksum` matches the generated JSON (D5) |

`decoy-profile` is the one that matters: it turns the gate's difficulty composition from an
intention into a CI-checkable property. A catalogue whose truth candidates are all too easy or
all too subtle fails at test time, not at playtest.

**No throw-at-load twin.** Unlike `createInitialState`'s margin guard (ADR-0074 §3), a
malformed portrait catalogue must not brick the app: the scene is optional, the level is not.
`App.tsx` guards on a validated catalogue and **skips the phase** if it is invalid — the run
continues with no modifier. Failing loud belongs in the test suite (a unit test asserting
`validatePortrait(FACE_CATALOGUE)` returns `[]`), not in a player's browser.

### D4 — The draw: pure, hashed, and total

```ts
export function drawPortraitPuzzle(catalogue: FaceCatalogue, seed: number): PortraitPuzzle;
```

Per band, in fixed band order:

1. Compute `h = hash(seed, bandId)` with a small integer hash written in
   `portraitRobotSystem.ts` (xorshift/FNV-style, no library, no floats-as-entropy).
2. **Truth** = the `h`-th element of the band's *eligible* variants — those satisfying the
   `decoy-profile` row (D3). Restricting the draw to eligible variants is what makes the gate's
   composition true *for every seed*, not on average.
3. **Presentation order** = a Fisher–Yates shuffle of the 6, seeded from `hash(seed, bandId, 1)`.
   The truth's position is therefore not the same slot every run, and the shuffle is replayable.

Same seed ⇒ same puzzle, on every device, forever. The function is total: it never throws on a
catalogue that passed `validatePortrait`, and its behaviour on an invalid one is the caller's
problem (ADR-0074's gotcha, restated).

### D5 — Assets: 24 sliced PNGs, atomic per gabarit, provenance-checked

**24 separate PNGs, not an atlas** (answering `lead-art` §7.3 Q1). The atlas argument — "the
seam is guaranteed by construction" — is real but is *already* satisfied by slicing from a
single plate; what an atlas would additionally cost is a new loader, a new lint, exclusion from
`useAssetPreloader`'s per-path progress, and a second asset convention beside the ~200
per-file assets the pipeline already handles (chroma-key, `check-sprite-style.mjs`, the
manifest builders). One new file format for one screen is not a trade worth making.

**Atomicity is granted, and enforced, not promised** (his §7.3 Q3):

- `scripts/slice-portrait-plate.mjs` is the **only** writer of `assets/portrait/*.png`. It takes
  the validated plate, normalises it on the eye-line / nose-base registration marks, slices at
  the seam ordinates with bleed, and writes **all 24 files plus `portraitPlate.generated.json`
  in one run**. It has no per-band mode and no "regenerate one variant" flag — the absence of
  that flag *is* the atomicity guarantee.
- It emits a `plateChecksum` into the generated JSON; `validatePortrait` compares it with the
  catalogue's. A hand-patched single band therefore fails a unit test, loudly, with a message
  naming the rule. This is the courier's derived-width discipline (`levelArt.json` §4.2)
  applied to a new family.
- A consistency test in `src/game/portraits/__tests__/` asserts every catalogue asset path
  exists in the generated manifest and vice versa — the `levelArt.consistency.test.ts` pattern.

**Loading (his implicit fourth question).** One new `ManifestTarget`, `"portrait-robot"`, in
`assetManifest.ts`, returning the 24 band paths + the medallion. `App.tsx` preloads it through
the existing `useAssetPreloader` gate **during `NARRATIVE_POST`** — i.e. behind the framing
lines, before the chrono can start. The scene never begins with a half-loaded face: warming is
all-or-nothing at the phase boundary, which is also what makes the "no feedback, pure
observation" contract (A9) honest. The 24 PNGs are **not** added to any level manifest, so a
player who never reaches the scene never downloads them.

### D6 — The three blocking questions of the art brief §7.3, answered plainly

1. **Atlas or PNGs?** → **24 PNGs**, sliced from one plate (D5). Seams in
   `portraitPlate.generated.json`, emitted by the script, never authored by hand.
2. **Atomicity?** → **Granted and mechanised**: one script, no per-band mode, a checksum, a
   consistency test. A single regenerated band is a red test.
3. **Is the scene "monde de jeu" or "surface pré-jeu"?** → **Neither box: an interactive DOM
   surface** — ADR-0079 D1. No CRT (structurally unavailable outside the Canvas), selection
   liseré as a CSS falloff on the focused band, xerox grain as one post-composition CSS layer
   over the assembled face (his §7.3 Q4 preference, confirmed technically). His §4 must be
   rewritten on that basis before the prompt gate.

### D7 — Explicitly not built

No second gabarit (fast-follow, gate A5); no procedural or infinite bank (story OUT); no
per-level portrait data; no runtime image compositing to a texture; no atlas; no `fine`-class
decoys in V1.

## Consequences

**C1 — A fourth data family joins `levels/`, with the same rules.** `src/game/portraits/` is
import-time-computable, side-effect-free and validated by its own module. A future MCP/tooling
surface gets `validatePortrait` for free, exactly as story ③ got `validateLevel`.

**C2 — 60 authored distance values are a real, new authoring burden**, and they are the price
of making the difficulty rule executable. They come from a plate `game-graphist` already owes
(§7.2 pre-prod pass), so the burden is *transcription*, not judgement — but if that plate slips,
this is the item that blocks `dev-gameplay`, and a provisional matrix must be committed with the
placeholder assets so the lane is never idle.

**C3 — `dev-tooling-assets` inherits a real tooling cost** (`lead-art` §5.2's named risk): the
registration/normalisation pass before slicing. It is budgeted here as a first-class deliverable,
not as a footnote of the art lane.

**C4 — The 24 PNGs are a one-shot download at a phase boundary.** Sized in the house BD style
they are small; but they are downloaded *between* two levels, i.e. on a transition the player
experiences as a pause. The `NARRATIVE_POST` pre-warm hides it behind text the player is reading.
If the batch ever grows (a second gabarit), that hiding place is finite — flagged for the
fast-follow.

**C5 — The fallback path is "skip the scene", never "show a broken face".** An invalid catalogue
or a failed warm yields no phase and no modifier; the run is unaffected. This is what keeps a
purely optional interstitial from becoming a new failure mode for the whole game.

## Alternatives Considered

**A1 — Generate the 24 bands directly with FLUX, one prompt per band.** Rejected on
`lead-art`'s evidence and on ADR-0011's precedent: skull width is a global property of a drawing
and cannot be obtained by repeating it in 24 local prompts. This is not a prompt-quality problem
that iteration fixes; it is structural, and it would burn the batch budget without converging.

**A2 — A single atlas PNG + a seam table.** Genuinely tempting (one file, seams true by
construction) and rejected on integration cost: a new loader, exclusion from the per-path
preload progress, a second convention beside ~200 per-file assets, and a new lint. Slicing from
one plate already delivers the seam guarantee that was the atlas's only real advantage.

**A3 — Put the catalogue in `levelArt.json`.** Rejected: that file is keyed by level, this data
is not; every existing consumer would import data it never reads, and the file is already the
repo's densest coupling point.

**A4 — Store a per-variant difficulty class instead of a pairwise matrix (6 values per band
instead of 15).** Cheaper to author and semantically false: perceptual distance exists only
between two variants. A per-variant class would silently mean "distance from variant 0", which
is wrong for every seed where variant 0 is not the truth — and the gate's composition rule would
become unverifiable. Rejected as cheap-but-lying data.

**A5 — Let the draw pick the truth uniformly among all 6 and accept whatever decoy profile
results.** Simpler, and it breaks the gate: for some seeds the truth's row would be 5 `medium`,
for others 4 `strong`, so the scene's difficulty would swing per run with nothing to hold it.
Restricting the draw to eligible variants (D4.2) costs three lines and makes A5's composition
true for every seed.

**A6 — Compose the four bands into one texture at runtime and draw that.** Needed only if the
scene were a Canvas — which ADR-0079 D1 says it is not. Four stacked `<img>` in a CSS grid is
the whole compositor, and it keeps every band independently addressable for focus, `aria` and
the selection liseré.

---

**Next stage:** dev lanes per `docs/handoffs/story-portrait-robot.md` §3.
