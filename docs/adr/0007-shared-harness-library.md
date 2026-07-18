# 0007 — Shared harness library, and rejection of a "harness that creates harnesses"

- **Status:** Accepted
- **Date:** 2026-06-22 (accepted 2026-07-18)
- **Related:** [ADR-0004](./0004-enemies-car-hostage-taker.md),
  [ADR-0005](./0005-dynamic-verification-harness.md) (consumes the contact-sheet / canvas
  primitive from this lib),
  [ADR-0006](./0006-directional-sprite-generation.md) (consumes the fetch / cutout primitives),
  `scripts/*.mjs`, [`scripts/SCRIPTS.md`](../../scripts/SCRIPTS.md),
  [`docs/asset-pipeline.md`](../asset-pipeline.md).

## Context

The asset-generation tooling has grown to **six-plus generator scripts that each independently
reimplement the same four pieces of boilerplate**. This is verifiable in the tree, not a
suspicion:

- **The Pollinations fetch + retry + rate-limit loop.** `scripts/generate-assets.mjs:676-694`
  defines `generateImage(asset, retries = 5)` — exponential-ish backoff (`(i + 1) * 15000`),
  five attempts, `await sleep(...)` between tries. `scripts/generate-game-assets.mjs:423-442`
  contains the **same loop, nearly line-for-line** (same `retries = 5`, same
  `(i + 1) * 15000` wait). `scripts/gen-enemy-types.mjs:90-106` has `generate(prompt, retries = 5)`
  with the identical structure (only the wait constant differs, `* 8000`).
  `scripts/gen-level-art.mjs:55-68` has `generate(prompt, size, retries = 5)` — again the same
  retry skeleton. `scripts/generate-style-demo.mjs` and `scripts/regen-pixel-sprites.mjs`
  repeat the idiom.
- **The idempotent "skip if exists" guard.** `generate-assets.mjs:698-702`
  (`if (fs.existsSync(outPath)) { console.log("[skip] …"); return; }`) is duplicated verbatim
  at `generate-game-assets.mjs:445-449` and again as the `!FORCE && fs.existsSync(...)` gate in
  `gen-enemy-types.mjs:113` and `gen-level-art.mjs:77`.
- **The `--list` / `--asset` CLI parser.** `generate-assets.mjs:717-728` and
  `generate-game-assets.mjs:464-475` are the **same parser**, differing only in a `padEnd`
  column width.
- **The chroma-key / canvas cutout.** `scripts/cutout-enemies.mjs` (105 LOC) implements an
  edge flood-fill background-clear over `@napi-rs/canvas` (`dist2`, corner-average key,
  `THRESHOLD_SQ`); `scripts/cutout-foreground.mjs` (63 LOC) carries the same canvas/alpha idiom
  for a different file glob.

By line count the two biggest offenders alone are large monoliths — `generate-assets.mjs` is
**744 LOC**, `generate-game-assets.mjs` is **491 LOC** — and the shared logic above accounts for
a meaningful slice of each, copied rather than imported.

**Two forces compound the duplication into a real risk:**

1. **These `.mjs` scripts have zero automated tests.** Every test in the repo lives under
   `src/game/systems/__tests__/`; there is no `scripts/__tests__/`. The tooling is unverified by
   construction, because the logic is welded inside `async function main()` monoliths that fetch
   the network and touch the filesystem — there is nothing pure to call.
2. **ADR-0004's enemy work adds more asset kinds** (`car_*`, `hostage_*` sprites and their
   cutouts), which on the current trajectory means _another_ copy of the same four blocks.

A proposal surfaced in discussion: build a **meta-harness — a generator that emits new harness
scripts** from a descriptor, so the next enemy kind costs one config entry instead of a new
copy-pasted file. This ADR settles that proposal and records the alternative we adopt instead.

## Decision

### D1 — Reject the meta-harness (the generator-of-generators)

We will **not** build a harness that stamps out harness scripts. A code-emitting layer does not
remove the boilerplate — it **multiplies it faster** and hides it behind a template, which is the
opposite of the goal. It is a premature abstraction (D-YAGNI below) and a leaky one
(D-SOLID below): tuned to today's "fetch a static PNG from Pollinations" shape, it would actively
mislead the next harness that does not share that shape.

### D2 — Extract `scripts/lib/` of small, **pure** primitives that every generator imports

The duplicated logic collapses into a handful of single-responsibility modules under
`scripts/lib/`, each imported by the generators:

| Module              | Responsibility (one each)                                                | Replaces                                        |
| ------------------- | ------------------------------------------------------------------------ | ----------------------------------------------- |
| `pollinations.mjs`  | `fetchWithRetry(url, { retries, backoff })` — fetch + retry + rate-limit | the duplicated `generateImage`/`generate` loops |
| `idempotent.mjs`    | `skipIfExists(path, { force }) → boolean`                                | the copy-pasted `existsSync` skip guard         |
| `cli.mjs`           | `parseAssetArgs(argv) → { list, target }`                                | the duplicated `--list` / `--asset` parser      |
| `cutout.mjs`        | `chromaKey(imageData, key, threshold)` (pure pixel op)                   | the `cutout-*` canvas logic                     |
| `contact-sheet.mjs` | canvas stitch of generated assets into one sheet                         | new; also consumed by ADR-0005's harness        |

The six existing generators are refactored to import these instead of re-declaring them. The
network/filesystem **edges stay in the scripts**; the **decisions** (how many retries, what
backoff, is this pixel background, did we already produce this file) move into the library where
they can be exercised in isolation.

### D3 — At most a _documented_ "anatomy of a harness", never an executable one

In place of the rejected meta-harness we ship **prose + a copyable template**: a short "anatomy of
a harness" section in [`scripts/SCRIPTS.md`](../../scripts/SCRIPTS.md) (descriptor shape, which
lib modules to import, the standard `main()` skeleton) plus one `scripts/lib/_template.mjs` a human
copies and fills. This is documentation a person reads and adapts with judgement — **not** code
that emits code. The distinction is the whole point of D1: a checklist guides, a generator
ossifies.

### The four principles (this is the ADR where the meta-harness call is justified)

- **DRY.** The duplication is the problem; the fix must _remove_ code, not generate more. A
  library deletes the duplicated loops (`generate-assets.mjs:676-694` ≈ `generate-game-assets.mjs:423-442`,
  the two `--list` parsers, the two cutouts) down to **one tested module each**. A meta-harness
  would instead keep emitting fresh copies — DRY measured at the _source_ gets worse, because the
  template _is_ the boilerplate, now stamped on demand. DRY favours D2 and forbids the meta-harness.
- **YAGNI.** muf is a faithful remake against a **frozen cahier des charges** (see `CLAUDE.md`
  scope guard): the universe of asset kinds is bounded — backgrounds, level layers, a small,
  closed enemy roster (ADR-0004), HUD bits. The number of _future_ harnesses is therefore small.
  The **rule of three** says: on the third repeat of a block, extract a library — which is exactly
  where we are. It does **not** say build a code-generation framework to serve a handful of
  foreseeable scripts. The meta-harness is speculative generality for harnesses that will never
  exist in the quantity that would justify it. (Cited alongside DRY/TDD/SOLID, never alone — this
  is a hard project rule.)
- **SOLID.**
  - _SRP_ — each `scripts/lib/` module owns exactly one reason to change: `pollinations.mjs`
    changes when the image API changes, `cutout.mjs` when the keying maths change, `cli.mjs` when
    the flag surface changes. The monoliths today mix all four plus the per-asset descriptor in
    one file.
  - _DIP_ — generators depend on the **abstraction** (`import { fetchWithRetry } from "./lib/pollinations.mjs"`),
    not on a re-declared concrete loop. The high-level "generate this asset list" policy stops
    owning the low-level fetch detail.
  - _OCP_ — the system extends by **importing an existing module or adding a new one**, not by
    regenerating a script. Critically, a meta-harness _violates_ OCP-as-honesty: it is a **leaky
    abstraction** frozen around today's "fetch one static PNG" shape. ADR-0005's dynamic-verification
    harness (it drives the live app and reads game state through the sanctioned `useGameLoop`
    seam — it fetches no PNG, keys no chroma, parses no `--asset`) shares **none** of that shape.
    A generator templated on the asset-fetch harness would hand the next author the wrong skeleton.
    A library of small primitives lets each new harness import only the pieces it actually shares.
- **TDD.** The scripts are **untestable monoliths with zero tests today** precisely because the
  logic is fused to network and disk inside `main()`. Extracting _pure_ primitives is what makes
  the tooling unit-testable at all, and the tests are written **first**:
  - `chromaKey` — **failing test first:** "given an ImageData whose four corners are `(20,20,20)`
    and an interior pixel `(200,30,40)`, `chromaKey(data, cornerAvg, THRESHOLD_SQ)` sets the
    background pixel's alpha to `0` and **leaves the interior pixel opaque**." Write it red against
    the not-yet-extracted function, then move the logic out of `cutout-enemies.mjs` to go green.
  - `skipIfExists` — **failing test first:** "returns `true` (skip) when the file exists and
    `force` is false; returns `false` when `force` is true." Drives the boolean out of the inline
    guards.
  - `fetchWithRetry` — **failing test first:** "with an injected fetch that rejects twice then
    resolves, it resolves on the third call and waits `backoff(1)` then `backoff(2)` between" —
    asserting the retry count and the backoff schedule via an injected clock/fetch (the dependency
    seam DIP gives us). A code-emitting meta-harness, by contrast, is barely testable: you would
    be asserting _string templates_, not behaviour — confirming D1 from the test angle too.

## Consequences

**Positive**

- The tooling becomes **DRY and, for the first time, unit-tested** — `scripts/lib/__tests__/`
  covers `fetchWithRetry`, `chromaKey`, `skipIfExists`, `parseAssetArgs` as pure functions.
- The **meta-harness question is settled and recorded**, so it is not re-proposed every time a new
  asset kind lands; the answer is "add/extend a lib module, copy `_template.mjs`."
- **ADR-0005 and ADR-0006 build on this lib** rather than re-deriving it: ADR-0005's verification
  harness consumes `contact-sheet.mjs` for the stitched preview; ADR-0006's directional-sprite
  generation imports the `pollinations.mjs` / `cutout.mjs` primitives. Each takes only what it
  shares (à-la-carte, not a frozen skeleton).
- **D2 realized further by the ADR-0044 consolidation:** `gen-level-art.mjs`,
  `gen-hostage-sprites.mjs`, `gen-courier-sprites.mjs`, and the `spike-model-ab.mjs` diagnostic
  are refactored to import `scripts/lib/pollinations.mjs` instead of each carrying its own
  fetch/URL-builder copy (see that ADR's "Consolidation follow-through").
- Boundary law untouched: `scripts/**` remains tooling; nothing here adds a runtime dep or touches
  the `src/game ↔ src/render ↔ src/hooks` contract.

**Negative / costs**

- A **one-time mechanical refactor of the six generators** to import the lib (`generate-assets.mjs`,
  `generate-game-assets.mjs`, `gen-enemy-types.mjs`, `gen-level-art.mjs`, `generate-style-demo.mjs`,
  `regen-pixel-sprites.mjs`, plus the two `cutout-*` scripts). Pure deletion-and-replace, but it
  touches every generator at once.
- `scripts/lib/` becomes a **shared dependency**: a change to `fetchWithRetry` now ripples to every
  generator. This is the normal cost of de-duplication and is **mitigated by the new unit tests** —
  a behaviour-changing edit to a primitive turns a red test before it reaches a generator.

**Gotchas to watch**

- Keep the primitives **pure and side-effect-free** (no hidden module-level state, network, or
  `fs` baked in — inject the fetch/clock/`existsSync` at the edge). The moment a primitive captures
  global state it stops being unit-testable and the TDD rationale (D-TDD) evaporates.
- **Resist regrowing the "anatomy" skeleton into an executable generator.** `_template.mjs` must
  stay a _copyable_ file a human edits, never a thing invoked with a descriptor to emit scripts —
  doing so re-opens D1 and re-imports every cost we just rejected.
- Watch the **backoff-constant divergence**: the loops today disagree (`* 15000` in the asset
  generators vs `* 8000` in `gen-*`). Consolidating onto one `fetchWithRetry` forces a deliberate
  choice of schedule; pick one, encode it as the default, and let callers override via options —
  do not silently change a script's rate-limit behaviour in the refactor.

## Implementation note (2026-07-18) — what shipped, what was deliberately deferred

`pollinations.mjs`/`fetchWithRetry` already existed and was already the ADR-0044-consolidated
fetch/URL contract for the active generators (see that ADR's "Consolidation follow-through" this
ADR's Consequences already cross-reference). This pass added the remaining D2 modules and closed
the loop:

- **`idempotent.mjs`** — `skipIfExists({ exists }, force)` (pure decision) + `skip(filePath,
{ force, existsSync })` (the injectable-`existsSync` edge wrapper, per the "inject at the edge"
  gotcha above). Adopted in the four **canonical** generators (see amendment below), replacing
  their inline `!FORCE && fs.existsSync(...)` guards.
- **`cli.mjs`** — `parseAssetArgs(argv, { targetFlag })` replaces the duplicated `--list`/`--asset`
  parser; `targetFlag` generalizes it to `gen-courier-sprites.mjs`'s `--layer` without renaming
  that generator's documented flag.
- **`cutout.mjs`** — `dist2` / `isBackgroundPixel` / `cornerAverageKey` / `chromaKey` (the pure,
  connectivity-free pixel decision). Adopted as the shared per-pixel test and corner-average
  computation **inside** `cutout-enemies.mjs`'s own border-flood, whose BFS control flow — and its
  separate enclosed-island pass — stays local exactly as D-TDD's `chromaKey` clause anticipated
  ("fused with per-component colour sampling... does not map onto a pure primitive"). This
  integration was verified **byte-identical**: re-running the script over the committed
  `enemy_*.png` set changed **zero PNG bytes** (`git status --porcelain -- public/assets/` empty),
  corroborated by an equivalence run of the old vs. new algorithm over a synthetic fresh
  (non-pre-keyed) sprite, byte-for-byte identical.
  `cutout-foreground.mjs`'s keying is **kept local** on purpose: its `isMagenta` ratio test
  (`r>110 && b>110 && g < min(r,b)*0.62`) is a different primitive from the distance-sphere
  `chromaKey`, and while both clear the committed flat-magenta grounds identically, they diverge on
  fresh anti-aliased FLUX art — so migrating it would be a behaviour change, not a faithful
  extraction, and stays out of scope (same discipline as the enclosed-island flood).
- **`_template.mjs` + "Anatomy of a harness"** (`scripts/SCRIPTS.md`) — the D3 checklist +
  copyable skeleton, never executable (no descriptor-driven code generation — that would re-open
  D1).
- **`scripts/__tests__/check-hero-wiring.test.mjs`** — a black-box subprocess exercise of the
  real, unmodified `check-hero-wiring.mjs` (ADR-0043 Layer B) over disposable fixtures, covering
  every documented failure path (deferred/unrecognised family, malformed entry, non-canonical
  path, missing frozen file, missing/non-REIGNING/duplicate-REIGNING HEROES.md entry, the license
  firewall, both last-mile wiring failures, and the reverse-wiring check) plus the empty-registry
  and fully-wired PASS cases.

**Amendment — adoption scope is the ADR-0044-canonical generator set, not "all six".** This ADR's
original Context/Consequences text scoped the refactor to "the six existing generators" (naming
`generate-assets.mjs`, `generate-game-assets.mjs`, `generate-style-demo.mjs`,
`regen-pixel-sprites.mjs` among them). By the time of implementation, ADR-0044's consolidation had
already re-classified those four as **non-canonical retirement candidates** — see
`scripts/SCRIPTS.md`'s "Legacy debt" note: unwired from any CI workflow, shipping no art the game
uses today, already missing `enhance=false`/`private=true`/`safe=false`. Migrating them onto this
lib would be polishing code on its way out and was **deliberately not done**; D2 adoption is scoped
to the four generators ADR-0044 kept canonical — `gen-enemy-types.mjs`, `gen-vehicle-sprites.mjs`,
`gen-courier-sprites.mjs`, `gen-level-art.mjs` — plus the two `cutout-*.mjs` scripts for
`cutout.mjs`. This resolves the apparent conflict between this ADR's original text and
`scripts/SCRIPTS.md`'s later ADR-0044 note: the later, more specific consolidation amends the
earlier, broader scope statement.

**YAGNI-deferred, not shipped: `contact-sheet.mjs`.** The D2 table above lists a fifth module,
`contact-sheet.mjs` ("canvas stitch of generated assets into one sheet"), for ADR-0005's dynamic
verification harness to consume. When ADR-0005 was implemented (same PR), its motion mode needed a
frame-strip stitch — but the real consumer's shape was a labelled frame strip, so the helper landed
as `stitchLabeledStrip` in `scripts/e2e-lib.mjs` (the de-facto E2E lib) rather than as a speculative
generic `scripts/lib/contact-sheet.mjs`. A single motion-mode consumer does not yet justify
promoting it to a standalone shared primitive; it stays in `e2e-lib.mjs` until a second consumer
appears. The speculative fifth `lib/` module remains deliberately unbuilt.
