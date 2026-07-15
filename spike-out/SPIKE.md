# Spike — image-model A/B (courier rider flipbook)

Subject: `courier.rider` · 6 frames · seed `5220`
Reference (track B): `https://raw.githubusercontent.com/bczy/prohimuf/b87ae50dc43d68e05b77c57255c88097e5b60aed/public/assets/courier/rider.png`

| Model | Track | Result | Frames |
| ----- | ----- | ------ | ------ |
| `flux` | A:t2i seed-pinned | generated | 6/6 |
| `zimage` | A:t2i seed-pinned | generated | 6/6 |
| `qwen-image` | A:t2i seed-pinned | generated | 6/6 |
| `kontext` | B:ref-conditioned(img2img) | skipped (HTTP 500) | 0/6 |
| `nanobanana-pro` | B:ref-conditioned(img2img) | generated | 6/6 |

Raw model output (NOT chroma-keyed, NOT production art). Judge character
consistency across frames of each model, then compare models. Track A = current
seed-pinned strategy; track B = reference-conditioned from the committed frame 1.
