# Audio spec — Boss QTE differentiation pack (5 levers)

**Author:** `sound-designer` (Malik) · **Date:** 2026-07-20
**Status:** DRAFT — audio-flow verdict below, pre-implementation (per `COLLABORATION.md`
§audio flow: audible behaviour changes get my verdict on the spec BEFORE build, then on
the built result at VERIFY). Runs in parallel with `game-designer` (mechanic/tuning),
`narrative-designer` (fiction), `ux-designer` (accessibility) on the same story per
`docs/handoffs/story-boss-qte-differentiation.md` §2.
**Story:** `_bmad-output/planning-artifacts/story-boss-qte-differentiation.md`
(STORY-BOSS-QTE-DIFFERENTIATION), specifically Open Questions 2-C, 3-A/B/C, 4-A/C, 5-A/B.
**Governing bible:** `docs/audio-direction.md` (drafted alongside this spec — did not
exist before this pass). **Reused contract:** `src/game/systems/bossQteSystem.ts` /
`src/game/types/bossQte.ts` (ADR-0051), the `AudioSystem` interface
(`src/game/systems/audioSystem.ts`, `docs/audio-system.md`).
**I write zero production code.** This spec is WHAT cues sound like and their
information function; WHEN each fires is `game-designer`'s tuning (still open for levers
3/4/5 as of this writing) and `narrative-designer`'s diegetic dressing for lever 4/2.

---

## 0. The frame these cues sit in (read once)

Two facts about the shipped system that every cue below is designed against:

1. **BGM tension is frozen for the whole boss encounter.** `setTension` is driven by
   `1 - timeRemaining / levelSeconds` (`App.tsx`), and the boss QTE freezes the level
   clock (`isBossQteActive` early-return, ADR-0051). Whatever BGM tier was playing at
   trigger (on quota-completion, i.e. late in the level — almost certainly tier 2
   `bgm_danger.mp3` in practice) **holds constant, unchanging, for the entire fight.**
   Every new cue in this spec is therefore layered **on top of a static tier-2 bed**, not
   riding any tension ramp of its own — none of them can lean on `setTension` doing work
   for them.
2. **Only `shoot` is actually wired today.** `hit` / `death` / `win` exist in the
   `playSfx` union and in `audioSystem.ts`'s lazy-loader, but nothing in `src/hooks` or
   `src/render` calls them (verified: `grep playSfx\(` across `src/` — the sole call site
   is `useGameLoop.ts:288`, `playSfx("shoot")`). I flag this as a pre-existing gap, not
   introduced by this story and **not mine to fix here** (it's a wiring bug in an
   already-shipped lane, out of this story's scope) — but it matters for this spec: I
   cannot assume "hit" already gives audio confirmation of a landed shot inside the boss
   fight, because in the shipped build it doesn't fire anywhere yet. Every cue below is
   specified as new, explicitly-wired-by-name so it does not silently inherit that gap.

None of the five levers currently has ANY dedicated audio cue in the shipped V1 (the
phase-break beat shipped with a **visual** pulse only — `spec-boss-qte-hp-read.md` D2.3
recommended an audio stinger there "not mandated," and it was never built). That gap is
adjacent to this pack but not one of the five named levers — I flag it, I do not spec it
here, to avoid scope creep past AC3's "exactly the five named levers."

---

## 1. The smoke audio tell — lever 2, Open Question 2-C

**My position: ADD a redundant audio channel; do NOT replace the visual tell.**

### Why (the accessibility call, stated plainly)

`docs/audio-direction.md` §2 extends the game's existing "not colour alone" discipline
to "not audio alone": a cue that is safety/pacing-relevant (missing it costs a blown
window under the escalating per-phase drain, §OQ1 of `spec-boss-qte-encounter.md`) can
never live on ONE sense exclusively. Today the telegraph is 100% visual. If smoke makes
that visual read genuinely unavailable and audio is asked to REPLACE it, a
deaf/hard-of-hearing player faces the exact un-telegraphed window the story's own OQ2-C
framing warns against — trading one accessibility hole for another, not closing it. If
instead audio ADDS to a visual tell that is merely **degraded, not removed** by the
smoke (dimmer contrast, partially occluded silhouette — still technically parseable),
every player keeps a channel and hearing players get a second, faster-to-register one
through the visual noise. That is the only version of "shift the tell vers l'audio"
that doesn't regress accessibility. **This is the same shape as `ux-designer`'s expected
call — if Tony rules the opposite way (audio-as-replacement) when the UX spec lands,
that is a real seam and I escalate it to `lead-game-designer` rather than silently
picking a side.**

### Character

- **Riser (the wind-up read):** a short, rising, filtered-noise/synth sweep — mid-to-high
  frequency band, cuts clean above whatever BGM tier is frozen (almost certainly tier-2
  `bgm_danger.mp3`, §0). NOT a low-end sound — it must never compete with kick/bass.
  Fires on the `telegraphActive` false→true edge (`BossQte.telegraphActive`), duration
  matched to the CURRENT phase's `telegraphLeadSeconds` (0.45 s → 0.40 s → 0.35 s across
  phases 1→3, `bossQteSystem.ts` `BOSS_PHASE_TABLE`). The riser **time-compresses as
  phases escalate** — same identity, faster tempo — which is literally the bible's
  existing "tempo accelerates with danger" law (§1/§3, `PROJECT_GUIDELINES.md` §6),
  applied to a one-shot instead of the BGM loop, so it stays in the established
  vocabulary rather than inventing a new one.
- **Downbeat (the window-open confirmation):** a sharp, dry mechanical "un-click"/metallic
  clank landing exactly at the `SHIELDED→EXPOSED` stance flip — doubles as positive
  confirmation the window is now live, not just a warning it's coming. This is the part
  that matters most under smoke: even a player who cannot parse the dimmed silhouette at
  all still gets an unambiguous "now" beat.
- **Distinguishability from lever 3's parry tell (§2 below):** texture family, not just
  pitch — this is a continuous SWEEP; the parry tell is a single dry TRANSIENT with no
  sweep. Blind A/B: a player hearing only the two cues in isolation must be able to name
  which is which without seeing anything.
- **Mix placement:** sits under the decor-stagger SFX (lustre/enceintes, lever 2-B — not
  mine to spec, flagged for whoever specs that cue) — if both fire in the same tableau,
  the telegraph riser/downbeat must remain legible; that's a mix-gate check at Gate 4
  composite time, not assumed clean here.

### New or reuse

**NEW** — no existing SFX serves this function. Two new one-shots (riser + downbeat) to
source/generate: future `dev-tooling-assets` + my AUDIO GATE work. Not a BGM-tier change.

---

## 2. Parry cues — lever 3

Three distinct cues, contingent on `game-designer`'s OQ3-A/B/C rulings (not yet closed as
of this writing). I spec character assuming the shape OQ3-C itself leans toward — "a
second, distinguishable tell type is likely required, not optional" — and flag where a
different mechanic answer would change the wiring, not the character.

### 2.1 Parry-window tell

- **Character:** a single bright, dry, high-passed transient — a "glint"/metallic ping,
  60–120 ms, no sweep. The opposite texture family from the telegraph riser (§1) on
  purpose: sweep = "a shoot window is coming," dry ping = "a parry beat is coming." A
  player closing their eyes must be able to tell which read applies before committing,
  which is exactly the anti-bullshit floor OQ3-C names.
- **Contingency:** if 3-A resolves to a genuinely new input/verb (a distinct click zone),
  this cue marks that new window's onset, same as any telegraph. If 3-A resolves to
  timing-reinterpretation of the SAME click (a click during his windup frame = parry), the
  cue still fires at the windup-frame onset — it is what makes "this specific stretch of
  windup means something different" legible by ear, which is arguably MORE load-bearing in
  that shape, not less (nothing else distinguishes the two readings of one click).
- **New or reuse:** NEW.

### 2.2 Success clang

- **Character:** metal-on-metal clang, bright, percussive, short reverb tail for weight —
  but layered with a brief vinyl-scratch/mixer-cut flavour rather than a generic
  fantasy-sword clang, so the "parry" reads as a sound-system beat (a fader slammed, a
  needle yanked) consistent with the game's own identity instead of importing a
  Sekiro-generic sting wholesale. Distinct from `hit` (a softer, thuddier body-hit
  confirmation, §0 caveat notwithstanding) and from `shoot`.
- **New or reuse:** NEW.

### 2.3 Whiff feedback

- **Character:** a quiet, non-punitive miss — a dull, diegetic fumble (a scuffed
  footing/stagger, not a game-y "wrong-answer buzzer," which would break the period-correct
  test in `docs/audio-direction.md` §1: an arcade fail-buzzer did not exist on a 1998
  free-party sound system). Short, low in the mix, registers instantly as "that didn't
  land" without being a harsh sting — matches OQ3-B's own framing that a whiffed parry
  "must not be a hidden, unreadable punishment": the SOUND itself should not read as a
  bigger deal than whatever mechanical cost `game-designer` lands on (still open).
- **New or reuse:** NEW.

**Escalation note:** if `game-designer`'s 3-B ruling makes a whiff carry real HP/energy
cost (not just an opportunity cost), the whiff cue's character should be revisited —
right now I'm specifying it as a *neutral* miss, not a *penalised* one; a heavier cost
would want a slightly harder-landing sound to keep sound and consequence proportionate.
Flagged, not pre-decided.

---

## 3. Finisher — lever 5

**Relationship to the existing WON / `QTE_RESULT_HOLD` audio.**

Today WON has no dedicated boss-side audio of its own; the level's completion flow plays
`bgm_win.mp3` once `LEVEL_COMPLETE` fires (existing, shipped, unrelated to this story).
I recommend the finisher audio **frames and precedes** that existing beat rather than
replacing any of it — whichever shape `game-designer`'s 5-A ruling takes (a dedicated
HOLD sub-state the player clicks through, mirroring the porte-cochère precedent):

1. **A brief hush** as the finisher beat opens — the frozen tier-2 BGM (§0) ducked/
   attenuated for the beat's duration, mirroring a sound-system operator killing the
   fader. This is the "time slows down" read done acoustically instead of visually.
2. **One decisive impact stinger** on the click itself — bigger and more ceremonial than
   the ordinary `hit`/parry-clang, but from the SAME sonic family as the parry success
   clang (§2.2) rather than an unrelated fanfare: think "the sound system slams back to
   full volume" — a kill-switch-and-slam-back gesture, tying the finale beat to the
   game's own rave-sound-system fiction instead of importing a generic game "finisher"
   cue.
3. **Existing WON treatment resumes unchanged** (`bgm_win.mp3` / whatever
   `QTE_RESULT_HOLD` already does) — this spec does not touch it.

**Failure-mode contingency (5-B):** `game-designer` leans toward the finisher being
guaranteed-success (no new failure surface at the moment of victory). If that holds, the
finisher needs no negative-outcome cue. If 5-B instead lands on a real failure mode (a
missed/slow click can still lose after `bossHp → 0`), that failure needs its OWN distinct
cue — flagged as an open item, not specced here, because specifying character for a
failure mode that may not exist would be guessing ahead of the mechanic.

**New or reuse:** hush + impact stinger = NEW (one new asset pair, distinct from the
parry clang but same sonic family). Post-beat WON treatment = REUSE, unchanged.

---

## 4. Renfort pressure cue — lever 4 (informational shape ONLY, no tuning)

Per `senior-architect`'s 4-C ruling (`docs/handoffs/story-boss-qte-differentiation.md`
§3): lever 4 lives entirely inside `bossQteSystem.ts`'s own state machine as scripted,
seeded, telegraphed in-tableau pressure priced in the existing energy ledger — no real
roster enemies, no `lives`/bullet threat. I spec only the audio SHAPE that fits that
architecture; magnitudes, timing and whether it exists at all in the final tuning are
`game-designer`'s call, still blocked-then-unblocked per that ruling but not yet posted
as of this writing.

- **Function:** a low background pressure layer that communicates "reinforcement
  pressure rising" **independently of BGM tension**, because BGM tension is frozen for
  the whole fight (§0) — this cue is the ONLY sonic channel available to carry that
  specific piece of state. It is not a telegraph for a shootable window (that stays the
  riser/downbeat vocabulary, §1); it's an ambient bed reporting a rising background
  threat that the player is not directly aiming at.
- **Shape:** a monotonically-rising-then-resolving texture — intensifies while the
  in-tableau pressure state is active, resolves (drops or cuts) when it clears. Same
  "tempo/intensity tracks danger" law the bible already states (§1/§3), applied to a
  sub-layer since the main BGM can't move. Diegetic dressing (radio chatter, a distant
  siren swell, boots/crowd rumble — the actual timbral choice) is `narrative-designer`'s
  call per OQ4-D's fiction question (does it read as HIS men or a rival unit); I specify
  only that it must read as *approaching pressure*, not as a specific narrative object.
- **Mix constraint (binding regardless of final tuning):** this is a background LAYER,
  never a foreground cue — it must sit low enough in the mix that it never masks the
  EXPOSED telegraph riser/downbeat (§1) or the parry tell (§2.1). If lever 4's tuning
  ever makes this cue loud enough to compete with a window telegraph, that is an
  automatic mix-gate FAIL regardless of how well the cue reads in isolation
  (`docs/audio-direction.md` §3).
- **No magnitudes specced here** (duration, escalation curve, resolution trigger) —
  those are lever-4 tuning, explicitly not mine to post ahead of `game-designer`'s pass
  per the story's own AC4 discipline, applied here by analogy even though AC4 itself
  only names `game-designer`.

**New or reuse:** NEW ambient-layer family. No existing SFX or BGM asset covers this
function.

---

## 5. New vs. reuse — consolidated

| Cue | Lever | New / reuse | Notes |
| --- | --- | --- | --- |
| Smoke-tell riser | 2 (OQ2-C) | **NEW** | pitched sweep, duration = phase `telegraphLeadSeconds` |
| Smoke-tell downbeat | 2 (OQ2-C) | **NEW** | dry clank at `SHIELDED→EXPOSED` flip |
| Parry-window tell | 3 | **NEW** | dry transient, distinct family from telegraph riser |
| Parry success clang | 3 | **NEW** | metallic + vinyl-cut flavour |
| Parry whiff feedback | 3 | **NEW** | quiet diegetic fumble, non-punitive character |
| Finisher hush | 5 | **NEW** | BGM ducking/attenuation, frozen tier-2 bed |
| Finisher impact stinger | 5 | **NEW** | same sonic family as parry clang, bigger/ceremonial |
| Finisher → WON handoff | 5 | **REUSE** | existing `bgm_win.mp3` / `QTE_RESULT_HOLD` treatment, unchanged |
| Renfort pressure bed | 4 | **NEW** | ambient layer, shape only, no tuning; mix-subordinate to window telegraphs |

Every NEW item above is future `dev-tooling-assets` sourcing/generation work, gated by me
(licence-first, period-correct, legible-function, mix-safe) at the ASSET GATE before it
lands in `public/assets/audio/`, per the standing 2-batch bounded-iteration rule.

---

## 6. Audio-flow verdict

**VERDICT: APPROVABLE FOR IMPLEMENTATION, WITH THREE OPEN SEAMS NOT YET CLOSED — none of
which block starting the sourcing/generation lane on the cues above, but all three must
resolve before final wiring:**

1. **Lever 2-C (smoke tell) — my ADD-not-REPLACE position is stated, not yet reconciled
   with `ux-designer`.** If Tony's parallel ruling agrees, this closes clean. If it
   diverges, escalate to `lead-game-designer` per the collaboration contract — do not let
   both rulings ship independently.
2. **Lever 3 (parry) character is contingent on `game-designer`'s still-open 3-A/3-B/3-C
   mechanic rulings.** The character specced above holds under either shape OQ3-A poses
   (new verb or timing-reinterpretation); only the exact trigger wiring changes, not the
   sound. Whiff character (§2.3) is contingent on 3-B's cost ruling as flagged.
3. **Lever 5 (finisher) failure-mode audio is unspecced pending 5-B**, and lever 4's
   pressure-cue MAGNITUDES are unspecced pending `game-designer`'s tuning pass under the
   architect's 4-C constraints — both deliberately, not an oversight.

**What would FAIL this spec outright (none apply as written):** any cue proposed as the
SOLE channel for a safety-relevant read (would violate §2 of `docs/audio-direction.md`
and reopen the exact accessibility hole OQ2-C warns against); any cue that reads as
modern-EDM-polished or otherwise fails the period-correct test (§1); any lever-4 cue
sized loud enough to mask a window telegraph (§3, mix-safe). Standing licence-first rule
applies to every sourced/generated asset at the ASSET GATE, not waived by this PASS.
