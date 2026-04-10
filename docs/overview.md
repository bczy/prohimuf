# Project Overview — muf

## Vision

**muf** is a browser-based remake of _Prohibition_ (Atari ST, 1987), transposed to the **Paris clandestine rave scene of the late 1990s**. The player is a courier for an underground party network, delivering sound equipment, flyers, and generators across Paris while avoiding the BAC, CRS, and plainclothes RG police.

The visual identity is **black-and-white fanzine photocopied aesthetic** with **acid neon highlights** — Paper Mario–style flat 2D sprites in a React Three Fiber 3D world.

---

## Game Universe

- **Setting:** Paris périphérique, 1993–1999 (19e, Pantin, Vitry, Belleville, Oberkampf)
- **Player role:** Underground rave courier — pick up, deliver, avoid
- **Antagonists:** BAC de nuit, CRS anti-rave, RG en civil, neighbourhood informers
- **Key contacts (NPC network):**
  - DJ Masta Klem — sound engineer, Vitry 94
  - Faïza "La Logiste" — organiser, Stalingrad 19e
  - Seb le Blond — unreliable fixer, Châtelet
  - Oxane — photographer/flyer artist, Belleville 20e
  - Karim "Le Mécano" — generators, Pantin 93

---

## Core Gameplay Loop

1. **Pick up** cargo (vinyl, flyers, walkie-talkie, generator key…)
2. **Deliver** to the correct contact / squat location
3. **Avoid** police patrols and informers
4. Score points, survive timer, complete the wave

The current prototype implements the **shooting gallery phase**: enemies (targets in windows) appear, shoot back, and must be eliminated before the timer runs out.

---

## Visual Style

- **Facade:** Haussmann building rendered procedurally on a Canvas2D texture mapped to a Three.js plane
- **Sprites:** Flat 2D planes (meshBasicMaterial) facing camera — Paper Mario style
- **UI:** Fanzine-style screens (StartScreen, HUD, EndScreen)
- **Camera:** Orthographic, zoom driven by viewport height / visible rows, scroll on mouse edge

---

## Tone & References

- _Prohibition_ (Atari ST, 1987) — original gameplay reference
- _Paper Mario_ — visual depth technique (flat sprites in 3D space)
- Fanzine culture, xerox photocopied zines, 90s Paris underground
- Boom bap instrumental soundtrack, tension-driven crossfade
