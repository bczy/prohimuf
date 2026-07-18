# 0044 — Ad-hoc kontext reference-conditioned asset iteration (gen-from-reference)

- **Status:** Accepted (2026-07-18)
- **Date:** 2026-07-18
- **Number:** 0044, **self-allocated** by `senior-architect` (no `producer` in the loop
  for this design session; Bertrand directed the scaffold via the `adr-new` skill).
  Originally scaffolded as 0042 (origin/main max was 0041 then); at merge, `origin/main`
  had independently taken 0042 for the tech-scout lane, so — per `adr-new` Step 4 — the
  ad-hoc base was renumbered 0042→0044 (the promotion-loop follow-up kept 0043).

## Context

muf's asset pipeline is manifest-driven: every sprite/backdrop is a curated entry in
`src/game/levels/levelArt.json` with a pinned seed, generated in CI by a per-family
script (`gen-vehicle-sprites.mjs`, `gen-enemy-types.mjs`, `gen-level-art.mjs`) and gated
by `check-art-prompts.mjs` (words) and `check-sprite-style.mjs` (pixels). That loop is
right for **production** assets but heavy for **exploration**: to try "make the truck look
like _this_ photo I found" there is today no path short of authoring a manifest type.

The `kontext` img2img capability is already wired for one narrow case: enemy flipbook
frames ≥2. `gen-enemy-types.mjs` builds
`https://image.pollinations.ai/prompt/<prompt>?…&model=kontext&enhance=false&private=true&image=<encoded ref URL>`
(`kontextUrl()`), passing the committed frame-1 PNG's `raw.githubusercontent.com` URL as
the `image=` source so the new pose is the _same character_. Pollinations fetches that URL
**server-side**, so the reference MUST be a public URL. `enhance=false` is load-bearing
everywhere (the Pollinations LLM enhancer rewrites the verbatim style block and breaks
family consistency — art bible §3.11/§3.12).

Two hard constraints shape any ad-hoc design:

1. **No network egress in the dev sandbox** (HARNESS.md). A purely local script cannot
   call Pollinations; real generation must run in CI, exactly like the existing
   per-family generators.
2. **Server-side reference fetch.** The dropped reference must be committed and pushed so
   `raw.githubusercontent.com/<repo>/<sha>/<path>` resolves at the checked-out SHA.

The art bible already anticipates this: §7 lists "download reference images into
`references/`" and "`kontext` hero-sprite derivation pass for hard style-locking."

The need (decided with Bertrand): an **ad-hoc**, one-shot flow — drop a reference, host it,
run a single kontext generation of a target asset conditioned on it, iterate — for
**vehicles, enemies, and levels/backdrops**. Not a curated per-asset manifest field.

## Decision

Add an exploratory, single-lane (`dev-tooling-assets`) capability living entirely in
`scripts/**` + `.github/workflows/**` + `docs/**` + repo-root `references/` (input data).

1. **Reference drop location: repo-root `references/`** (override of the suggested
   `public/assets/references/`). Rationale: any committed file has a `raw` URL regardless
   of path, and `references/` is outside Vite's `public/`, so throwaway iteration inputs do
   **not** ship in the deployed bundle. §7 already names this directory. The generator's
   raw-URL builder takes an arbitrary **repo-relative path**, so the location is a
   convention, not a hardcoded dependency — a `--ref` under `public/assets/…` or a full
   external URL is equally accepted.

2. **One generalized generator: `scripts/gen-from-reference.mjs`.** Its network helpers are
   the same ones `gen-enemy-types.mjs` already uses, so `fluxUrl`, `kontextUrl`,
   `fetchImage`, `fetchWithRetry` are factored into a new **`scripts/lib/pollinations.mjs`**
   (unit-tested, matching the existing `scripts/lib/` pattern); `gen-enemy-types.mjs` is
   refactored to import them (no behaviour change — pure extraction, single source of the
   kontext URL contract). CLI/env contract:
   - `--ref <repo-relative-path | https URL>` (required) — a path becomes
     `raw.githubusercontent.com/${GITHUB_REPOSITORY}/${GITHUB_SHA}/<path>` (mirrors
     `frame1RawUrl`); a full URL is passed through.
   - `--prompt <text>` (required) — sent verbatim with `enhance=false`.
   - `--out <repo-relative path>` (required) — target PNG.
   - `--family <vehicles | enemies | levels>` (required) — selects post-processing.
   - `--seed <positive int>` (required) — pinned for reproducible, reviewable rolls
     (same fail-fast as the family generators).
   - `--size <WxH>` (default `256x256`) and `--style <text>` (optional, appended verbatim
     so the caller can reuse a family style tail).
   - Same **soft-fail on no network** behaviour as the siblings: a failed fetch logs
     per-asset and exits 0, so a local dry-run never crashes.

3. **Per-family post-processing is reused, not reinvented:**
   - `vehicles` → `cutout` (chroma-key, `cutout-enemies.mjs`, already exported) + Rec.601
     `desaturateFile` (currently private in `gen-vehicle-sprites.mjs` — add an `export`).
   - `enemies` → `cutout` only.
   - `levels` → none (full-bleed backdrops).

4. **Network egress handled by a `workflow_dispatch` action:
   `.github/workflows/gen-from-reference.yml`.** Inputs mirror the CLI (ref, prompt, out,
   family, seed, size, style). Steps: checkout the branch (where Bertrand already committed
   the reference, so its `raw` URL resolves at `GITHUB_SHA`) → setup Node → install
   `@napi-rs/canvas` (needed by cutout/desaturate) → run `gen-from-reference.mjs` → commit
   the single `--out` file back to the branch (`git add -f`, bounded push-retry, as
   `gen-vehicle-sprites.yml` does). No style gate — this is exploratory; the human reviews
   the output in the PR/branch preview.

5. **`check-art-prompts.mjs` is unchanged.** Ad-hoc has no manifest field for it to lint.
   The accompanying prompt should still respect §3 (no-negation, 30–90 word budget), but
   that stays a documented author responsibility — hard-gating an exploratory one-shot adds
   friction for little payoff, and the human judges the output image directly.

## Acceptance note

Accepted 2026-07-18: implemented in full, including the consolidation follow-through
below (`scripts/lib/pollinations.mjs`, `gen-from-reference.mjs`, the
`gen-from-reference.yml` workflow, and the six generators migrated onto the shared lib).
Live kontext generation itself is only exercised in CI/branch-preview runs (network
egress is unavailable in the dev sandbox — see Context); it is not validated locally.

## Consequences

**Positive**

- A fast iteration loop for style-locking any of the three families against an arbitrary
  reference, with no manifest churn and no new production surface.
- `kontextUrl`/`fluxUrl`/fetch helpers become single-source in `scripts/lib/pollinations.mjs`,
  removing the copy in `gen-enemy-types.mjs` (and available to retire the
  `gen-vehicle-sprites.mjs` copy later — deliberately out of scope here).
- Fully inside the tooling layer: **no** touch to `src/game`, `src/render`, or `src/hooks`;
  the boundary law is not engaged. Output PNGs land in `public/assets/` where the existing
  render-side loaders already consume them — no new coupling.

**Negative / gotchas**

- **kontext fidelity is variable.** Adherence works for enemy frames because the reference
  _is_ the same character's frame 1. Against an **arbitrary** dropped reference (a photo, a
  foreign art style) adherence degrades — kontext nudges style/pose, it is not a
  deterministic transform. Expect to iterate seed/prompt; some references will not lock at
  all. This is documented so expectations are set; it is not a bug to be filed.
- The reference must be **committed and pushed before** the workflow runs (server-side
  fetch); a dirty local-only reference 404s. The workflow reads `GITHUB_SHA`, so it must run
  on the branch that holds the reference.
- Refactoring `gen-enemy-types.mjs` to the shared lib touches a subtle, working generator.
  Mitigated by keeping the extraction pure (URL builders + fetch only), a unit test for the
  lib, and requiring `rtk vitest` + a `gen-enemy-types` no-network dry-run to stay green.
- `--out` can point at a committed hero (e.g. `vehicles/truck.png`) and overwrite it; that
  is intentional (it then goes through the PR art gate) but callers should prefer a scratch
  path while iterating.
- `references/` accumulates throwaway inputs; periodic pruning is a manual follow-up (they
  are outside the deploy bundle, so this is housekeeping, not a shipping concern).

## Consolidation follow-through

The "available to retire the `gen-vehicle-sprites.mjs` copy later — deliberately out of
scope here" deferral above (Consequences, positive) is now executed, and the lib gained one
extension beyond the original scope:

- **More generators migrated onto `scripts/lib/pollinations.mjs`.** Beyond the original
  `gen-enemy-types.mjs` / `gen-from-reference.mjs` / `gen-vehicle-sprites.mjs`, three more
  callers now import `fluxUrl` / `fetchWithRetry` (and, for `spike-model-ab.mjs`,
  `fetchImage` / `modelUrl` directly) instead of carrying their own copy:
  `gen-level-art.mjs`, `gen-hostage-sprites.mjs`, `gen-courier-sprites.mjs`, and the
  `spike-model-ab.mjs` diagnostic. Each local `fetchImage`/`generate`/URL-builder duplicate
  is deleted, not kept alongside the import.
- **New generic builder: `modelUrl({prompt, seed, width, height, model, imageUrl?})`.**
  `fluxUrl` and `kontextUrl` are now both thin wrappers that delegate to it (`model: "flux"`
  / `"kontext"` respectively) instead of each holding its own template-literal URL — one
  query-string contract, not two kept in sync by hand.
  `spike-model-ab.mjs`'s own local `imgUrl` helper is retired in favour of importing this
  same `modelUrl`, and in the process **gains `safe=false`**: its hand-rolled version had
  carried `enhance=false&private=true` but had silently dropped `safe=false`, an undetected
  drift this consolidation closes.
- **Auth header is now single-sourced.** `fetchImage` in the shared lib sends an optional
  `Authorization: Bearer ${POLLINATIONS_TOKEN}` header (CI secret; see `scripts/SCRIPTS.md`
  "Optional — account tier"). Every generator that imports the lib inherits it automatically
  — no per-script wiring — including the three newly migrated above and the spike.
- **Four legacy generators are deliberately left unmigrated: documented debt.**
  `generate-assets.mjs`, `generate-game-assets.mjs`, `regen-pixel-sprites.mjs`, and
  `generate-style-demo.mjs` keep their own pre-lib Pollinations URL construction. Reason: none
  has a CI workflow, none is referenced from `package.json`, none ships art the game uses
  today, and migrating them would force reconciling their divergent 15s-step retry backoff
  (`attempt × 15000`) against the lib's `attempt × 8000` default rather than a mechanical
  import swap. Recorded as non-canonical in `scripts/SCRIPTS.md`; retirement candidates, not
  touched by this consolidation.
