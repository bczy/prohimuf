# references/

Ad-hoc drop location for **kontext img2img reference images** used by
`scripts/gen-from-reference.mjs` (ADR-0044 —
[`docs/adr/0044-adhoc-reference-conditioned-asset-iteration.md`](../docs/adr/0044-adhoc-reference-conditioned-asset-iteration.md)).

Drop a reference PNG/JPG here, commit and push it (Pollinations fetches the
`image=` source SERVER-SIDE, so it must be a public, already-pushed
`raw.githubusercontent.com` URL), then run the generator or dispatch
`.github/workflows/gen-from-reference.yml` pointing `--ref` at its path.

Deliberately **outside** `public/`: Vite only bundles/deploys `public/**`, so
files dropped here never ship in the built game — they are throwaway
iteration inputs, not production assets. Once an iteration is accepted, its
output PNG belongs in `public/assets/…` per the normal manifest/asset
contract; the reference itself can stay here or be deleted.

## kontext fidelity caveat

Adherence to an **arbitrary** dropped reference is **variable** — `kontext`
nudges style/pose toward the reference, it is not a deterministic transform.
It reproduces well when the reference already IS the target character/asset
(e.g. locking an enemy's frame 2 to its own frame 1). Against an unrelated
photo or a foreign art style, expect to iterate seed/prompt; some references
will not lock at all. This is a documented limitation, not a bug — the human
judges the output image directly (no automated style gate on this path).

## `references/` (here) vs `references/approved/` — scratch vs permanent

This directory (repo root `references/`) and its `approved/` subdirectory are
**deliberately different lifecycles**, both documented so nobody confuses them
(ADR-0043 — [`docs/adr/0043-validated-reference-promotion-loop.md`](../docs/adr/0043-validated-reference-promotion-loop.md)):

|               | `references/` (here)                                       | [`references/approved/`](approved/)                                                   |
| ------------- | ---------------------------------------------------------- | ------------------------------------------------------------------------------------- |
| Lifecycle     | **ephemeral scratch** — throwaway `--ref` iteration inputs | **permanent, immutable** — superseded copies kept forever, never deleted              |
| Who writes it | any operator dropping a file for `gen-from-reference.mjs`  | ONLY `scripts/promote-hero.mjs`, on a recorded `lead-art` `PROMOTE` verdict           |
| What it is    | an arbitrary image, judged by eye, no gate                 | an already-gate-PASSed pixel asset, frozen as a style-lock anchor for its family/slot |
| Consumed by   | one manual `kontext` run (ADR-0044, `--ref`)               | every subsequent generation of that family/slot, automatically (ADR-0043)             |
| Prunable?     | yes, safely                                                | no — history, never deleted                                                           |

`references/approved/heroes.json` (machine registry) + `HEROES.md` (human
registry, verdict/date/rationale/status/trace) are the two projections of the
internal-hero half of the one coherent reference library — see
[`docs/references/art-culture.md`](../docs/references/art-culture.md) for how
it relates to Ray's external boards under
`docs/art-direction/references/boards/`.
