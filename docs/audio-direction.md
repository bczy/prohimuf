# Audio direction — muf

The single source of truth for every sound in muf. Owned by **sound-designer** (Malik);
changes go through him. Sister document to `docs/art-direction.md` (Nico) — one identity,
two senses. Architecture (Howler.js wiring, tension math) lives in `docs/audio-system.md`;
this document owns character, function and gate criteria, not implementation.

---

## 1. Identity

**The sonic twin of "photocopied fanzine B&W + acid neon."** 1998, Paris, clandestine
rave logistics. If the art bible reads like a flyer come alive, the mix must sound like
what that flyer promised: a free-party sound system running on a génératrice in a
hangar, not a Spotify playlist. Raw, lo-fi grain is allowed and expected — tape hiss,
compressed transients, a system that occasionally clips. Nothing polished enough to have
come out of a 2020s DAW preset pack.

**Genre anchor:** acidcore / tribe / hardtek — the 303 squelch, the four-on-the-floor
kick pushed hot, the rising arpeggio that never quite resolves. The reference era is
1991-1999 free-party France (Spiral Tribe and the scene it spawned), the same
generational anchor the art bible cites for its own identity.

**Period-correct test (mirrors the art bible's silhouette-first / cahier-des-charges
discipline): could this cue plausibly have come out of a 1998 sound system on a stolen
génératrice?** No modern EDM polish (sidechain-pumped "festival drop" mastering,
glossy trap hi-hats, contemporary vocal chops). No source or generation prompt that
reads as 2010s+ commercial EDM. A cue that fails this test fails the gate regardless of
how well it otherwise fits the tension tier.

---

## 2. The law of sound — _ce qui sonne informe_

Every audio cue is information, not decoration. Two corollaries, both binding on every
gate verdict:

1. **The BGM tension tiers must be legible as game state.** A player should be able to
   name whether the level is calm, tense, or in danger from the music alone, blind
   (mirrors `PROJECT_GUIDELINES.md` §6: "la musique est le seul indicateur de tension —
   pas de barre de stress" — tempo accelerates as cops approach, slows when safe).
2. **Every SFX maps to exactly one gameplay event and is identifiable blind.** No cue
   plays "for atmosphere" with no corresponding state change; no two distinct gameplay
   events share one indistinguishable sound. When a cue IS a gameplay signal (a
   telegraph, a phase change, a hit confirmation), `game-designer` owns WHEN it fires —
   this bible owns WHAT it sounds like, and both must agree the function is served.

**Nothing decorative honks.** A cue proposed with no gameplay function attached does not
clear the asset gate, however well it fits the identity sonically.

---

## 3. The mix serves the loop

BGM and SFX must never mask each other. The test: **a player who closes their eyes
should still be able to hear `Récupérer → Livrer → Éviter` happening** — pickup
confirmation, delivery confirmation, threat discrimination (shot/hit/death), all
distinguishable inside the current BGM tier at its loudest (danger, tier 2). Concretely:

- SFX sit in a different frequency pocket / transient shape than the BGM's dominant
  kick+bass so a shot or hit reads instantly, not buried under the 303 line.
- A new SFX or BGM layer that masks an existing information-bearing cue is a FAIL on
  mix grounds even if the asset itself passes in isolation — gate verdicts are judged
  in-mix, not solo.

---

## 4. Shipped system (what exists today — `docs/audio-system.md` is the technical record)

Three parallel BGM tracks, crossfaded by tension level (`audioSystem.ts`):

| Tier | File              | Tension range    | Character               |
| ---- | ----------------- | ---------------- | ----------------------- |
| 0    | `bgm_loop.mp3`    | 0.0–0.4 (calm)   | groove, headroom, safe  |
| 1    | `bgm_tension.mp3` | 0.4–0.7 (tense)  | tighter, more insistent |
| 2    | `bgm_danger.mp3`  | 0.7–1.0 (danger) | hardest, most pressured |

Volume 0.4→0.75, playback rate 0.95→1.05 with tension; 800 ms crossfade. `bgm_win.mp3`
plays on level complete. SFX: `shoot`, `hit`, `death`, `win` — one cue per named event,
lazy-loaded, cached.

**Honest gaps on record (not this document's job to fix, flagged so nobody assumes
otherwise):**

- `shoot.wav` — **licence status FAIL**, unresolved provenance (`CREDITS.md`). Blocks a
  clean gate; Bertrand ordered a known-licence replacement, not yet delivered as of this
  writing.
- `hit.mp3` / `death.mp3` are referenced by `audioSystem.ts`'s `playSfx` union type but
  are **not present** in `public/assets/audio/` on disk today — a pre-existing gap, not
  introduced by this document. Flagged for the owning lane, not fixed here.
- §6's "minimum 10 tracks en rotation" guideline is not yet met (5 BGM tracks shipped:
  4 tiers + win). Tracked as a standing gap, not a blocker on any single gate.

---

## 5. Gate criteria (applied per asset, per behaviour — see agent fiche for process)

1. **Licence first.** No asset PASSes without a verified licence/provenance record
   (public domain, CC with terms met, or cleared). Unverified or mislicensed is an
   automatic FAIL regardless of fit or quality — the game deploys publicly.
2. **Period-correct identity** (§1) — mechanical PASS (format/duration/loudness/loop
   cleanliness) never overrides a taste FAIL; taste calls I can't judge alone go to
   Bertrand as a shortlist, never a blind PASS.
3. **Legible function** (§2) — every cue traces to exactly one gameplay event or tier;
   `game-designer` confirms the trigger is correct, this bible confirms the character
   and distinguishability are correct.
4. **Mix-safe** (§3) — judged in-mix against the loudest concurrent tier/SFX combo, not
   solo.

---

## 6. Sources

Curated library: `docs/references/audio.md`. Licence discipline record:
`docs/qa/plan-story-audio-licence-attribution.md`, `public/assets/audio/CREDITS.md`.
