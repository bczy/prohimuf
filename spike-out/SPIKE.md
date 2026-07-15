# Spike — image-model A/B (courier rider flipbook)

Subject: `courier.rider` · 6 frames · seed `5220`
Reference (track B): `https://raw.githubusercontent.com/bczy/prohimuf/af65890936f22cad4ce5b8f872d71a1677044dac/public/assets/courier/rider.png`

| Model | Track | Result | Frames |
| ----- | ----- | ------ | ------ |
| `flux` | A:t2i seed-pinned | generated | 6/6 |
| `kontext` | B:ref-conditioned(img2img) | generated | 1/6 |
| `nanobanana-pro` | B:ref-conditioned(img2img) | generated | 6/6 |

Raw model output (NOT chroma-keyed, NOT production art). Judge character
consistency across frames of each model, then compare models. Track A = current
seed-pinned strategy; track B = reference-conditioned from the committed frame 1.
