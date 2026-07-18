# story — Pollinations image-API optimisation & consolidation

**Branch:** `claude/pollinations-image-api-s58e2y` · **PR:** #93 · **Lane:** dev-tooling-assets
**ADR:** amends ADR-0044 (consolidation follow-through), cross-refs ADR-0007.

## What / why

Audit of muf's Pollinations image-API usage against `gen.pollinations.ai/docs#tag/image`.
Pin `safe=false`, add an optional `POLLINATIONS_TOKEN` Bearer auth in the shared lib,
and finish the ADR-0044 consolidation so no generator carries a private URL/fetch copy.

## Delivered

1. **Shared lib** (`scripts/lib/pollinations.mjs`): generic `modelUrl()` builder;
   `fluxUrl`/`kontextUrl` delegate (byte-identical, regression-locked); `safe=false`
   pinned; optional `Authorization: Bearer` from `POLLINATIONS_TOKEN` in `fetchImage`,
   attached only to `*.pollinations.ai` hosts.
2. **Consolidation:** `gen-level-art`, `gen-hostage-sprites`, `gen-courier-sprites`,
   `spike-model-ab` migrated onto the lib (inherit the token). `gen-level-art` also
   gained `private=true` (was leaking backdrops to the public feed).
3. **CI:** `POLLINATIONS_TOKEN` wired into every `gen-*.yml`, `spike-model-ab.yml`, and
   `preview.yml` (gen-level-art's runner) job env.
4. **Legacy debt:** the four non-CI generators (`generate-assets`, `generate-game-assets`,
   `regen-pixel-sprites`, `generate-style-demo`) left unmigrated, documented in SCRIPTS.md.
5. **Docs:** SCRIPTS.md token + debt notes; `docs/research` transparent-background spike
   (keep chroma-key); ADR-0044/0007 amendments; harness infographics manifest re-pinned.

## Verify

`yarn typecheck` ✓ · `yarn test` 571/571 ✓ (pollinations 14/14, incl. regression-lock +
cross-host/whitespace auth cases) · `yarn lint` ✓ · `prettier --check` ✓ · no-network
`--list` smoke of migrated generators ✓. No `public/assets/**` bytes changed.

## Stage-6 code-review panel (merge gate)

Four reviewers in parallel — `code-review` (high), `bmad-code-review`,
`bmad-review-edge-case-hunter`, `security-review` — on `git diff origin/main...HEAD`.
No BLOQUANT. CONFIRMED findings triaged (senior-architect = integration review):

- **Cross-host Bearer replay** (consensus A/B/C/D) → FIXED: token attached only to
  `*.pollinations.ai`; whitespace token → anonymous. Tests added.
- **gen-level-art token gap** (B MAJEUR: `preview.yml` lacked the env while docs claimed
  coverage) → FIXED: env wired into `preview.yml`.
- **spike retry divergence undocumented** / **regression-lock wording** (A NIT) → FIXED
  (comments).
- **enhance=false on level-art** (A MAJEUR / B MINEUR): INTENDED per art bible §3.11
  (enhancer destroys the verbatim style block) and consistent with every other
  generator. No committed bytes change now; the **next** level-art regen will differ →
  heads-up to lead-art to re-gate at that regen. Accepted, documented.
- **kontextUrl falsy imageUrl** / **raw numeric interpolation** (C/D NIT): no live path
  (buildRequestUrl guards; inputs are numeric, review-gated). Accepted.

Integration: boundary law intact (no `src/game`/`src/render`/`src/hooks` touched), no new
dependency, no shipped bytes. **Verdict: MERGE** (no unresolved CONFIRMED BLOQUANT/MAJEUR).

## Status

Panel-cleared, CI green expected. Awaiting Bertrand's merge decision. Follow-up (deferred,
not blocking): full retirement of the four legacy generators; optional lead-art re-gate on
the next level-art backdrop regeneration.
