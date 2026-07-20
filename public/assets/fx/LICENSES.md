# `public/assets/fx/` — licences & provenance

Provenance discipline (repo policy): every bundled asset records its source URL + licence.

## `smoke.png`

- **Use:** particle sprite for the boss-QTE smoke effect (lever 2, ADR-0052) — a soft
  white puff on transparent alpha, tinted to a desaturated grey at runtime and animated
  as a drifting particle field (`src/render/scene/smokeParticles.ts`).
- **Source:** `mrdoob/three.js` example texture set, `examples/textures/opengameart/smoke1.png`.
  Direct URL (retrieved 2026-07-20):
  `https://raw.githubusercontent.com/mrdoob/three.js/dev/examples/textures/opengameart/smoke1.png`
- **Licence:** CC0 1.0 (public domain). The texture is part of three.js's OpenGameArt-sourced
  example texture set (`textures/opengameart/`), which three.js distributes as CC0 public-domain
  example assets. No attribution required; recorded here for provenance discipline.
- **Modifications:** none (committed byte-for-byte as downloaded, renamed `smoke1.png` → `smoke.png`).
