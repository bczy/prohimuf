# Handoffs — enemy chroma-key migration (black → magenta)

Root defect: `enemy_sprite_f2` shipped with an open bite — black pantalon ink sat on a
black (#000000) generation ground, so the keyer could not tell pant-ink-black from
gap-black and ate the ink, punching a see-through hole. Fix: migrate `enemies.style` to a
saturated magenta chroma ground so gaps key out while black ink survives. Bertrand
approved the move to a chroma ground.

## 1. PROMPT GATE — lead-art (Nico) — 2026-07-18

- claim: gate the proposed `enemies.style` reprompt (black ground → magenta chroma) from concept-artist (Maud) against §1, §2 laws 1-3, §3 FLUX rules, §3.4, §4.1.
- release: PASS on direction. Chroma is a production ground keyed to transparent — shipped sprite stays a B&W two-tone pochoir; figure/seeds (4801/4802/4803) unchanged; gap-fill clause is the correct positive-shape fix for the bite; grain bound to figure only keeps the ground flat/keyable; render-side rim (ADR-0025) untouched. Conditions carried forward below.
- VERDICT: PASS — Prompt gate (lead-art)

Conditions / carry-forward (none block the prompt gate; all are downstream):

- HEX: reuse the pipeline's existing chroma magenta `#FF3CDC` (vehicles, §2.1 accent) rather than introduce a third magenta `#FF00FF`. Maud's "coherent with vehicles/foregrounds" rationale is factually the `#FF3CDC` value — vehicles key `#FF3CDC`, not `#FF00FF`. If `#FF00FF` is chosen deliberately for a purer key, document the divergence and make `cutout-enemies.mjs` key that exact value. Coordination item, dev-tooling-assets + game-graphist.
- ASSET/COMPOSITE GATE: magenta spill onto the paper-white figure (a colored fringe surviving the key = hue on the B&W layer, §1/§4) is the same hidden-until-keyed failure mode as the original bite. Sweep on a CONTRASTING (non-magenta) background at game size — endorse promoting the magenta visual sweep to a BLOCKING gate; the enclosed-island metrics were blind to the open bite.
- SEQUENCING: the coupled `ENEMY_STYLE_TOKENS` widening (accept chroma IN ADDITION to black) must land in the same commit or `check-art-prompts.mjs` lint fails; courier stays on black — do not break its token set.
- SIBLING RISK (out of this gate's scope, flag to crew): `hostages.girl` has the identical exposure — dark leather jacket ink + gaps between raised arms on a black ground. Fixing enemies but leaving hostages on black leaves the same bite defect live for the hostage family. Consider migrating hostages on the same pass. Also `hostages.$comment` ("Same black-ground pixel style as the enemies block") goes stale.
