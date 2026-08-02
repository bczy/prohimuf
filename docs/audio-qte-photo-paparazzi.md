# Audio spec — QTE photo paparazzi (Belliard set-piece #1)

**Author:** `sound-designer` (Malik) · **Date:** 2026-08-02 · **Status:** Rev. 1, first pass
**Frame:** ADR-0077, `spec-photo-qte-paparazzi.md` Rev. 4 (`game-designer`), §2.3 +
`spec-photo-qte-fiction.md` Rev. 3 (`narrative-designer`), `techplan-photo-qte.md` D-J
(`senior-architect`). Owns character only — every number below (periods, windows, hold
times) is `game-designer`'s, cited not re-derived. **Sister document to
`docs/audio-direction.md`, whose gate criteria this spec is judged against.**

**Iron rule respected: zero code, zero asset files written here.** This is the brief;
sourcing/generation is `dev-tooling-assets`, wiring is the owning dev lane
(behaviour is likely `dev-gameplay` state + `dev-r3f-render`/hooks for playback — lane
assignment is `senior-architect`'s, not mine).

---

## 0. Why this set-piece is not "add some SFX to a screen"

The brief is explicit and I take it literally: **in this set-piece the sound IS the
tension curve, not wallpaper on top of it.** The suspicion needle (UX) is the only _visual_
tension readout, and it is deliberately unlabelled ("no numbers"). The mechanic's whole
fairness model — a patient player can clear all three instants at zero suspicion, an
impatient one pays `+34` — is **taught entirely through hearing**, because the shutter's
_technical_ verdict (crisp vs. dull click) is the sole live feedback channel and the
_semantic_ verdict (master/bonus/rejected) is deliberately withheld until the contact
sheet (D8, two-beat feedback). If the mix does not carry this cleanly, the set-piece has
no readable skill in it at all — it becomes "click and hope". This is the sharpest
instance of §2 of the bible (`ce qui sonne informe`) shipped so far: get the mix wrong here
and the failure is not cosmetic, it is the mechanic not existing.

---

## 1. The four cues, what they are, what they are NOT

### 1.1 The wave — `WAVE_*` (the sound cover itself, a gameplay state, not ambience)

**Function:** `inCover(t)` is a boolean the player must be able to call **blind**, from the
mix alone, well enough to time a shutter release against it. This is not "traffic noise
under a scene" — it is the mechanic's on/off switch given a voice.

**Identity:** a packet of 6-8 vehicles releasing at a signalled Paris crossroad, descending
~45 m past the affût — diesel-heavy through traffic, a scooter or two in the mix, tyre roll
on old asphalte, no synthesised "traffic loop" texture. Period-correct: 1998 Maréchaux-type
junction at night, not a stock "city ambience" library loop.

**Two waves, one envelope — this is a gameplay law, not a mix choice (R3-1 pin 2, cited to
me directly by the mechanic spec §10.4).** The three waves in the scene may sound different
(a "through traffic" wave vs. a "turners" wave, per the fiction's two-phase junction) but
**must share identical duration (7.0 s) and identical attack shape** — the rise into
audibility, not just the peak. If I ship a shorter or slower-building third wave for
"variety", I silently break the zero-suspicion run for whatever instant lands in it (LA
PLAQUE, in this scene). **My discipline: author one attack/decay envelope, vary only the
timbral content riding on it** — same rule as varying an SFX's pitch inside a fixed ADSR.
This is checkable mechanically (`ffprobe` peak-time / RMS-rise comparison across the three
renders) before it ever reaches a human ear.

**Tell — 1.8 s, engines rising at the line, close and above.** The mechanic is explicit that
the light (and therefore the tell) is at the **top** of the street, i.e. structurally close
to the affût's rooftop position, not the far end. This is a mix placement instruction, not
just a sound-design one: the tell must read as **near and above**, arriving from roughly the
same perceived direction as the wave itself, so the player never mistakes "something is
happening down the street" (a different, unrelated sound) for "the wave is coming" (this
cue). Practically: front-loaded transient, minimal reverb tail, no stereo width trick that
would place it "elsewhere" in the image.

**Silence is the default, and it must be genuinely dead (§4.1 "the street is dead between
waves").** No bed under the silence beyond a genuinely quiet Belliard-at-night residue (a
distant néon buzz, a rideau de fer settling, nothing periodic, nothing that could be
mistaken for an early tell). If the "silent" state has any looping texture in it, the
player's ear stops trusting silence as a hard boundary, and the whole gauge becomes fuzzy.
This is the single easiest way to fail this cue set and the one I will listen for first.

**Fallback — the `game-designer` already priced this at zero mechanical cost (§4.1, §10.4):
the boulangerie's fournil/extractor**, mono-periodic, same duty cycle, same tell shape,
one wave every 21 s with no two-phase junction fiction required. If the two-phase junction
mix does not survive a first pass or the playtest flags it as unreadable, I say so plainly
and switch source rather than stretch the junction fiction to fit — this is explicitly
authorised, not a fallback I need to escalate for permission to use.

### 1.2 The shutter — crisp click + discreet flash vs. dull click, no flash

**Function (§2.4 of the mechanic spec, D2.a):** the ONLY live, audible signal for whether
`FOCUS_HOLD` was satisfied at release (T5). It is **mechanical feedback on a property of the
tool**, never semantic feedback on a property of the evidence — the mechanic spec is
explicit that composition/focus (mechanical) is shown, moment/role (semantic, master vs.
bonus vs. no-subject) is withheld until the sheet. My job is to make that boundary audible
and airtight: **the click must never, under any composition of inputs, hint at whether a
moment was open.** A "sharp click on a valid frame with no open instant" and "a sharp click
on a valid frame during the master proof" are **the same sound, with no discoverable
difference** — the game-designer's T2 (`MOMENT`) is invisible to me by design and it stays
invisible in the mix.

**Two states only, and they must be reliably discriminable blind (bible §2, "identifiable
blind"):**

| State     | Trigger (mechanical, from `tickPhotoQte`)         | Character                                                                                                                                                                                                                                                                                                                                                                                                                                            |
| --------- | ------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Crisp** | T3∧T4∧T5 true at release — a valid, focused frame | A tight, dry mechanical shutter snap — period-correct SLR/rangefinder click, minimal room tone, a transient that reads instantly against the wave's low-end. Paired with a **discreet flash pop visually** (render's cue, not mine to spec further than "it exists and is instantaneous with the click").                                                                                                                                            |
| **Dull**  | release fails T3 or T4 or T5                      | The same mechanical family, but **muffled** — as if the same shutter fired with something wrong (soft focus, a knocked frame): shorter high-frequency content, no "snap" transient, no flash. **Not a different instrument, a degraded version of the same one** — this is what makes it read as "the same camera, a bad take" rather than "an error buzzer", which would be a modern-UI intrusion the bible's period-correct test rejects outright. |

**Discrimination requirement, stated as a gate criterion I will hold both takes to:** an
attentive player must be able to tell crisp from dull **with the visuals off** — the
mechanic spec says so explicitly (§10.4, "an attentive ear must hear the difference with the
visuals off") and I am adopting it as my own acceptance test, not just repeating it. This is
mechanically checkable pre-listen (spectral centroid / transient sharpness diff between the
two renders) before it goes to a human ear for the taste call.

**One more discipline I am adding, not asked but implied by §2.4's table:** the shutter click
**must cut through the loudest concurrent wave** (mix-safe, bible §3) — a player who fires
mid-wave (which the mechanic explicitly rewards at zero suspicion) must still hear their own
click's crisp/dull distinction over the traffic. If the click gets buried under the wave at
its loudest, the reward for good timing (shoot in cover) actively degrades the one feedback
channel the player has. This is a mix-in-context test, not a solo-file test (bible §3).

### 1.3 The affût — rooftop stakeout ambience (`BRIEFING` / `ESTABLISHING` / `ACTIVE` bed)

**Function:** establish "alone, above the street, before anyone else is out" (fiction §2.4:
solitude justifies the silence between waves being credible). This is scene-setting, not a
gameplay signal, so it is held to a lighter bar than 1.1/1.2 — but it must not fight them.

**Character:** a thin, high, open-air bed — wind across a zinc roof, the residual hum of a
quiet residential street well below, no music, no crowd. Belliard at 23:40 is explicitly
**before** the free-party's own sound system exists in the fiction (the courier's whole
night is still ahead) — so nothing here should sound like the game's own BGM tiers bleeding
through; that would contradict "personne ne regarde en l'air, personne n'entend rien" (§2.1
of the fiction). **This bed must duck hard under the wave and the shutter, never compete
with them** — it exists to make the silence between waves feel like a specific place, not
to be listened to on its own.

**BGM tier interaction — a behaviour question for `game-designer`/`senior-architect`, not
mine to decide alone.** The shipped tension-tier BGM (`audioSystem.ts`) presumably keeps
running under the level while `ACTIVE`/other frozen-scene blocks hold the tick (hostage
duel does, as far as I can tell from the shipped system doc — **I flag this as unverified,
not assumed**, §5). If the photo QTE's dedicated 2D plate is meant to feel like its own
place (a rooftop, not the street), I recommend the BGM tier **ducks to near-silence or
stops entirely** for the duration of `BRIEFING`→`DONE`, replaced by the affût bed — the same
logic the mechanic spec already applies to energy/score/enemies (frozen, inert, §6.4). I do
not gate this point myself; I hand it to `game-designer` as a **behaviour spec question**
(§5) because it changes what "paused" sounds like, which is state, which is his lane's call
on WHEN, mine on WHAT.

### 1.4 The contact sheet — a mechanical beat, and the one place I must NOT invent a verdict cue

**`DEVELOPING` (0.8 s):** a single mechanical beat — film wind-on / a shutter-crank click, or
a photographic cut-to-black whoosh. Purely mechanical, no semantic content, matches the
"wind-on / cut to black" description in the mechanic's own phase table (§1.1).

**`CONTACT_SHEET` reveal:** **I am NOT proposing a verdict-differentiated sting per frame**
(a "success chime" vs. a "failure buzz" per thumbnail), and I want this refusal on the
record so it is not re-proposed later. The mechanic spec (D8, §2.4) is explicit that
master/bonus/rejected is **revealed only visually, at the sheet, via stamps** — the same
family of discipline as the gate's own R3-2 prohibition on the plate's traffic light
encoding cover state. An audio sting that differs by verdict would leak the semantic beat
through a channel the design never budgeted for it, exactly the failure mode R3-2 exists to
prevent, just on the other side of the frozen-scene boundary. **My cue here is uniform**: one
neutral "sheet unrolls / paper sound" on entry to `CONTACT_SHEET`, identical whatever the
roll contains. If a stamp-reveal _sound_ is wanted later (a discrete "thunk" per stamp as the
sheet populates, uniform across MASTER/BONUS/REJECTED), that is a UX/render pacing question,
not a verdict-encoding one, and I would gate it the same way: **uniform across verdicts,
timing only.**

---

## 2. What is asset vs. what is behaviour

| Item                                                                        | Asset (my gate, `public/assets/audio/`)                                                                         | Behaviour (spec gate, not mine to implement)                                                                                                                                                                                                       |
| --------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Wave loop/one-shot per character variant, tell stinger, silence-bed residue | ✓ new files                                                                                                     | Trigger timing (`WAVE_FIRST_OPEN`, `WAVE_PERIOD`, tell scheduling) is `game-designer`'s authored data, read by `inCover(t)`/`tickPhotoQte` — pure `src/game` per techplan §2.3                                                                     |
| Crisp click + dull click (two short one-shots)                              | ✓ new files                                                                                                     | Which one plays is a **pure function of T3∧T4∧T5 at release**, computed in `tickPhotoQte`, never re-decided in the render (techplan D-C: one evaluator). The wiring that plays the right file on the right tick is the owning dev lane's, not mine |
| Rooftop affût bed                                                           | ✓ new file (loopable)                                                                                           | Whether/how it ducks the shipped BGM tier during the frozen block — open question to `game-designer`/`senior-architect`, §1.3                                                                                                                      |
| `DEVELOPING` mechanical beat, sheet-reveal paper sound                      | ✓ new files                                                                                                     | Playback on phase transition — trivial hook, owning dev lane                                                                                                                                                                                       |
| Verdict-differentiated sheet stings                                         | **Declined** (see §1.4) — not authored, not to be re-proposed without a design ask that justifies overriding D8 |

**None of these six files exist in `public/assets/audio/` today** — this is a wholly new cue
set for a wholly new set-piece, not a re-skin of `shoot/hit/death/win`. Sourcing is
`dev-tooling-assets`' pipeline; I hold the bounded-iteration rule (max 2 sourcing/generation
batches per cue set, then escalate a shortlist to Bertrand) and will apply it separately to
(a) the wave family and (b) the shutter family, since they have independent risk (the wave's
risk is "does the two-phase junction read"; the shutter's risk is "is crisp/dull genuinely
blind-discriminable").

---

## 3. AUDIO GATE — verdicts on behaviours already specified by other lanes

**D4 §4.1 (`WAVE_*` constants and the two-waves-same-envelope rule), mechanic spec Rev. 4:**
**PASS on the spec.** The constraint is buildable exactly as written (one envelope, varied
timbre) and it is the correct discipline — I adopt R3-1 pin 2 as my own authoring rule
rather than merely complying with it, and I've stated the mechanical pre-check I'll run
against it (envelope match across the three wave renders) before any human-ear pass.

**D2.4 / D2.a (crisp vs. dull click as the sole T5 channel):** **PASS on the spec, with one
discipline I am adding on record (§1.2 above):** the click must remain discriminable when
mixed against the loudest concurrent wave, not just solo. This is not a spec change, it is
me stating how I will judge my own asset at the gate (bible §3, judged in-mix).

**D8 / §2.4 two-beat feedback boundary (semantic verdict withheld until the sheet):**
**PASS, and I am formally declining to add a verdict-differentiated audio sting** (§1.4) —
recorded here, same posture as the fiction's declined "feu de circulation encode cover"
proposal (R3-2), so it is not silently reopened by a future audio pass that assumes "add
some juice to the reveal" is a free win.

**Techplan D-J (traffic light colour is decor, never `inCover`'s source of truth; cover is
read from `sceneClock`, never wall time):** **PASS, nothing for audio to touch here** — I
have no dependency on `trafficSignalPhase` or any wall-clock-driven render prop; the wave
audio is scheduled off `sceneClock` exactly like every other system in this set-piece
(determinism guardrail, ADR-0077). I flag explicitly that **I will not accept a wiring
request that drives the wave's audible cadence from `NearForeground.tsx`'s decorative signal
prop** — that would silently reintroduce the wall-clock/non-determinism bug the techplan
already killed, from the audio side instead of the render side.

**§1.3 BGM-tier interaction during the frozen block:** **Not gated — open question**, filed
to `game-designer`/`senior-architect` (§1.3 above). I hold no PASS/FAIL until the behaviour
is specified; I've stated my recommendation (duck/stop, replaced by the affût bed) rather
than assuming it.

---

## 4. Nothing here is unreachable or incoherent — one thing flagged as unverified

I found no request in the mechanic, fiction or tech-plan specs that is unbuildable or
contradicts the bible. The one open point (§1.3, whether the shipped BGM tier keeps running
under this frozen block) is not a defect in the specs — it is a gap none of the three
upstream docs actually closes, and I am naming it rather than assuming an answer, per the
"unverified, not assumed" discipline the bible holds me to on licence/provenance.

---

## 5. Hand-offs

- **To `dev-tooling-assets`:** sourcing brief for six new files (three wave-family renders +
  tell, crisp click, dull click, affût bed, `DEVELOPING` beat, sheet-reveal paper sound) —
  8 files total, none touching the shipped `bgm_*`/`shoot.wav`. Licence-first, same as every
  other asset gate.
- **To `game-designer` (Sacha):** §1.3's open question (BGM tier behaviour during the frozen
  block) — needs a spec answer before the owning dev lane wires playback.
- **To `senior-architect` (Winston):** confirm which dev lane owns the audio-hook wiring
  (crisp/dull click selection off `tickPhotoQte`'s tick result, wave-cadence scheduling off
  `sceneClock`) — likely `dev-gameplay` for the pure trigger + `dev-r3f-render`/hooks for
  `Howler.js`-side playback, mirroring the shipped `shoot/hit/death/win` split, but I do not
  own lane assignment.
- **Logged:** `docs/agent-handoffs.md` gets one line pointing here once this lands.
