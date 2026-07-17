# Références — Son & musique (`sound-designer`)

Pour l'identité sonore (`docs/audio-direction.md`), specs BGM/SFX, mapping tension, crossfades,
mix, et l'AUDIO GATE. Voir [`README.md`](README.md).

## Docs internes (source de vérité)

- `docs/audio-direction.md` — **la bible audio** (caractère, tiers BGM, fonction).
- `docs/audio-system.md` — architecture de lecture (Howler).
- ADR `docs/adr/0022`, `0027` — préchargement d'assets, audio dans le loading gate.
- `docs/qa/plan-story-audio-licence-attribution.md` — exigence de licence par asset.

## Références externes

- [Howler.js — docs](https://github.com/goldfire/howler.js#documentation) — moteur audio du projet (sprites, fade, pool).
- [MDN — Web Audio API](https://developer.mozilla.org/en-US/docs/Web/API/Web_Audio_API) — crossfades, gain, timing sous Howler.
- [MDN — AudioParam automation](https://developer.mozilla.org/en-US/docs/Web/API/AudioParam) — courbes de fade déterministes.

### Sources musique/SFX libres (licence à vérifier et créditer par asset)

- [Free Music Archive](https://freemusicarchive.org/) — vérifier CC-BY / CC0 par piste.
- [ccMixter](https://ccmixter.org/) — remixes sous Creative Commons.
- [Incompetech (Kevin MacLeod)](https://incompetech.com/music/royalty-free/) — CC-BY, attribution requise.
- [Freesound](https://freesound.org/) — SFX, licence par fichier (CC0/CC-BY).
- [Creative Commons — types de licences](https://creativecommons.org/share-your-work/cclicenses/) — savoir ce qu'on doit créditer.

## Skills à utiliser

- `bmad-brainstorming` — idéation d'un motif/tension sonore.

## Note

Ce qui exige des **oreilles humaines** (taste call) part en shortlist chez Bertrand — ne pas
trancher seul un verdict subjectif.
