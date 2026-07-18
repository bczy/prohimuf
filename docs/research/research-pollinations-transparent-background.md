# Spike — native transparent background on Pollinations (`transparent=true`)

**Status:** research only — no pipeline change made. Recommendation: **do not adopt now.**
**Author lane:** dev-tooling-assets. **Date:** 2026-07-18.
**Trigger:** review of the Pollinations image API (`gen.pollinations.ai/docs#tag/image`)
looking for parameters muf's asset pipeline does not yet use.

## Question

Pollinations exposes a `transparent` flag that returns a PNG with a real alpha
channel instead of a solid background. muf currently generates every sprite on a
**pure-black ground** and keys it to transparency afterwards
(`cutout-enemies.mjs` → `fill-sprite-holes.mjs` → integrity gates). Could native
`transparent=true` replace that chroma-key detour?

## Findings

1. **Model support is the blocker.** `GET https://gen.pollinations.ai/image/models`
   lists (2026-07): `flux` (text-to-image, free), `kontext` (img2img, free),
   `gpt-image-2` (img2img, free), `sana`, and the paid `nanobanana` / `nanobanana-2`.
   Native transparency on Pollinations has historically been tied to the
   **GPT-image family** (`gptimage` → now `gpt-image-2`), **not** `flux`/`kontext` —
   which are the only two models muf uses. So `transparent=true` on our current
   requests is very likely a no-op.
2. **Could not fully confirm from the docs.** The `/docs` page is a JS-rendered SPA
   and the OpenAPI JSON was truncated when fetched, so the exact per-model support
   matrix for `transparent` is **unverified**. A real API probe (below) is the only
   way to settle it.
3. **The black-ground contract is load-bearing well beyond keying.** Switching to a
   natively-transparent model would not just remove `cutout-enemies.mjs`; the
   solidify pass (`fill-sprite-holes.mjs`, ADR-0013/0014), the muzzle-anchor
   measurement, and the shared `morphology.mjs` primitives all assume the
   black-ground → keyed-figure contract. This is architecture, not a query param.
4. **Art consistency risk.** `flux` (seed-locked) is the house look. `gpt-image-2`
   is a different model with a different register; adopting it for sprites to gain
   transparency would change the art itself, and its rendering of the
   "photocopied fanzine B&W + acid neon" style is unproven.

## Recommendation

Keep the chroma-key pipeline. Do **not** wire `transparent=true` into
`fluxUrl`/`kontextUrl` — it would be silently ignored by our models and, if we
switched models to honour it, we would trade a well-gated deterministic pipeline
for an unproven art model and a large refactor.

## Cheap follow-up (separate story, if ever pursued)

A one-shot, evidence-gathering A/B, **not** a pipeline change:

```bash
# same subject, two paths — eyeball the alpha + the style
#  A) current: flux on black ground + chroma-key
#  B) candidate: gpt-image-2 with transparent=true, no keying
curl -o a.png "https://image.pollinations.ai/prompt/<enemy%20prompt>?model=flux&nologo=true&seed=12345"
curl -o b.png "https://image.pollinations.ai/prompt/<enemy%20prompt>?model=gpt-image-2&transparent=true&nologo=true&seed=12345"
```

Gate the decision on lead-art's verdict of B's style fidelity **and** a
`check-sprite-integrity.mjs` pass on B's alpha. Until both clear, black-ground +
key remains the contract.
