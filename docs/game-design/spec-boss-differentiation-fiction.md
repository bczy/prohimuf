# Boss differentiation — fiction spec (levers 2 / 3 / 4 / 5)

**Author:** `narrative-designer` (Yasmine) · **Gate:** `lead-game-designer` (Karim) —
status **DRAFT, awaiting PASS** · **Date:** 2026-07-20 ·
**Story:** `_bmad-output/planning-artifacts/story-boss-qte-differentiation.md` (AC6) ·
**Extends / traces to:** `docs/game-design/spec-boss-encounter-fiction.md` (gated « le
Commandant », PASS-with-corrections 2026-07-19) · ADR-0051 · veille §3 (#2 parade, #6 boss,
#7 décor interactif).

This spec authors the fiction for four of the five differentiation levers — **décor
set-dressing (2)**, **renfort mi-combat (4, Open Question 4-D)**, **coup de grâce (5)** and a
one-line diegetic anchor for the **parade (3)**. It writes **zero mechanics, zero tuning
numbers, zero visual-style directives** (mechanics = `game-designer`; the parry/finisher HUD
read = `ux-designer`; the venue/prop LOOK = `concept-artist` → `lead-art`, from the request
sheet §5). Lever 1 (points faibles) needs no new fiction — it re-parameterises where he is
shootable, a beat already carried by the gated « il ouvre le feu » window (§1.3 of the
encounter spec); nothing here touches it.

Voice baseline is the **shipped** register in `src/game/systems/narrativeSystem.ts` (DISPATCH
terse/imperative, KENZA field-savvy, MUF laconic) and the grounded, unromanced tone
ADR-0030/0034 set for a downed antagonist. Period is **31 décembre 1999, Paris, free-party
circuit** — no smartphone-era vocabulary, francs, `08 36` infolines. Player-facing strings are
**French**; meta/notes are English.

---

## 0. Two hard scope pins (read before anything below)

- **AC8 — nothing here ships live.** Everything canon in this spec is written for the
  **Niveau Final** and **gated-then-held**, exactly as the encounter spec's §4 scripts are
  held until the finale is built. The `?preview=boss` **Belliard dev-harness** (ADR-0051 D4)
  gets only **non-canon placeholder** dressing — generic props, no named venue, no canon
  scripts. The reserved-for-Niveau-Final canon status from the V1 K2 ratification is
  **untouched**; this spec spends none of it.
- **AC6 — traces to, never contradicts, the gated Commandant fiction.** The load-bearing line
  I must not break is encounter-spec §1.3: **« il n'a plus personne pour le couvrir »** — his
  vulnerability EXISTS because his BAC is débordée and no one covers him when he fires. Every
  ruling below is tested against that sentence first.

---

## 1. Lever 2 — décor set-dressing : ce que sont le lustre, les enceintes, la fumée

### 1.1 The venue, in one line

The Niveau Final is a **free party the size of the century** — the millennium set — held in a
**grand disused hall squatted for the night** (a former ballroom / dancing / covered venue,
the kind of decayed-bourgeois shell the circuit requisitioned when it needed room for
thousands). Period-authentic: 1998–99 teufs took over exactly these husks — old theatres,
disused halls, hôtels particuliers — for the big dates. The three interactive objects are the
**two bodies that share that room**: the building's dead grandeur, and the rave's living rig.
They are not props invented for the fight; they are what is already in the room when the
Commandant walks in and the fight uses them.

> **NEW-CANON FLAG (for Karim, §6 flag 1).** The encounter spec named the _when_ (31 déc 1999) but never the _venue building_. Naming it — even loosely, « une grande salle
> désaffectée » — is net-new canon. I propose the loose form only (a squatted grand hall with
> an old chandelier), leaving the exact building to the Niveau-Final story + art flow. Culture
> grounding (is a chandelier-hall plausible for a `'99` teuf?) is `art-advisor` (Estelle)'s
> call if the gate wants it hardened.

### 1.2 What each object IS (diegetic identity — not its mechanic)

| Objet                  | Ce que c'est dans le monde (fiction)                                                                                                                                                                                         | À qui il appartient     |
| ---------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------- |
| **Le lustre**          | Le lustre d'origine de la salle morte — le vieux monde suspendu au-dessus de la fête. Il n'est pas à la teuf : il est **au bâtiment**. Le décrocher, c'est faire tomber l'ancien monde sur le flic qui vient couper le neuf. | La salle (le passé)     |
| **Le mur d'enceintes** | Le **sound-system lui-même** — les stacks du crew, le corps sonore de la nuit. Le faire basculer, c'est retourner **le son** contre celui qui vient l'éteindre : l'arme de la fête, c'est la fête.                           | Le crew (le son)        |
| **La fumée**           | La machine à fumée de la teuf, **que personne n'a coupée**. Elle couvre la récup de Muf **et** noie le Commandant — le brouillard n'est pas un effet tactique inventé, c'est l'appareil que la fête a laissé tourner.        | La fête (le brouillard) |

The through-line: **the room fights on Muf's side without meaning to.** The Commandant came to
cut the sound; the sound, the smoke and the old ceiling are all still running, and each one is
a way the night refuses to be switched off. That is the whole fiction of the lever — no more.

### 1.3 Harness vs canon (AC8)

- **Belliard dev-harness (now):** generic, un-named placeholder decor — a lamp, a stack of
  crates/gear, a haze — **no canon venue, no chandelier lore.** The harness proves the
  interaction; it does not present the millennium hall to any player.
- **Niveau Final (held):** the §1.1–§1.2 canon identities land only when the finale is built,
  in lockstep with the encounter spec's held scripts. Gated now so they cannot drift.

The gated encounter DISPATCH line already primes this room without a rewrite: `final_pre` #1
« Le dernier son du siècle » + #8 « Qu'il danse jusqu'en 2000 » establish a party big enough to
own a hall like this. **No change to any gated line is required.**

---

## 2. Lever 4 — renfort mi-combat : Open Question 4-D ruling

### 2.1 The ruling, in two sentences

**The reinforcement is NOT the Commandant's own men — it is a lost CRS section swept into the
hall by the millennium-night chaos, a different corps he neither called nor commands, that
does not coordinate with him and, in the smoke, does not even pick him out from the crowd.**
This preserves « il n'a plus personne pour le couvrir » exactly — the pressure on Muf rises
while the Commandant's isolation stays total (even the other cops in the room aren't his), so
his gated vulnerability is not merely intact but sharpened.

### 2.2 Why NOT his own men (the contradiction I am refusing)

If his BAC arrived as backup mid-fight, they would _cover him_ — which deletes the single
sentence his whole vulnerability rests on (encounter §1.3). That door is closed: a renfort of
_his_ brigade is a canon contradiction, not an option. Rejected outright.

### 2.3 Why a CRS section is the clean answer

- **Different corps, different chain.** The **CRS** (anti-émeute, crowd control) are not the
  **BAC** (§7 roster). On 31 déc 1999 the CRS were the ones thrown at the crowds citywide.
  One section losing its crowd and spilling into the venue is _plausible chaos_, not _called
  backup_ — it needs no order from the Commandant and gives him no cover.
- **Consistent with « flics débordés » (§7 / §1.3).** The whole city's police are swamped
  that night; a CRS unit getting overrun and drifting into the wrong building IS that
  débordement, shown instead of stated. It corroborates the gated premise; it doesn't fight it.
- **Uses roster that already exists (§7 + shipped).** The CRS is already the shipped
  `enemy_riot` / `enemy_riot_shooting` (« le CRS en tenue anti-émeute », tutorial copy). No
  new faction, no fourth-faction fork — AC6 and the encounter §1.2 « on étend, on ne forke
  pas » both hold. This is the SAME device the encounter spec used for the Commandant himself.
- **Sharpens, not softens, the isolation.** They aren't there for him; in the smoke they
  don't distinguish the man in the officer's coat from any other shape. He is the apex of a
  brigade, alone in a room where even his own side's other corps can't see him. That is the
  gated « plus personne pour le couvrir » taken to its darkest reading.

### 2.4 Written to survive BOTH architecture outcomes (per the story's parallel 4-A/4-C ruling)

`senior-architect` is ruling in parallel on whether lever 4 is **real roster enemies** or a
**scripted, non-lethal pressure cue**. The fiction above is agnostic; here is the variant each
outcome uses so nothing has to be rewritten either way:

- **If real enemies (4-A = `riot` roster, freeze-law exception granted):** the shapes at the
  frame edge ARE CRS — `enemy_riot` reused. Muf discriminates them like any CRS in the
  gallery; they are a stray hostile wave, not the Commandant's cover. No new sprite, no new
  faction.
- **If a scripted, non-lethal pressure cue (4-A = no live entity):** the cue is the _sound and
  edge-motion of a CRS charge crossing the hall_ — boots, a section forming at the doorway,
  the crowd surging — pressure without a shootable body. Same fiction, carried by audio +
  frame-edge motion instead of a target. (Surface = `ux-designer` / `sound-designer`; I supply
  only the words below.)

### 2.5 Optional player-facing cue copy (canonical if used; ux/sound own placement)

Anti-« bullshit » guardrail: a wave that arrives _unannounced_ is a gotcha. The gated
`final_pre` #3 « Débordés. Partout à la fois. » already foreshadows citywide police chaos, so
**no rewrite of gated copy is needed.** If the design wants an in-beat call the instant the
renfort lands, use exactly one, in DISPATCH register over the wire (never the Commandant — he
stays mute, encounter §2):

- **DISPATCH — `« Une section CRS vient de perdre la foule. Ils débarquent. Pas pour lui. »`**

The tail « Pas pour lui. » is load-bearing: it tells the player, in three words, that this is
not his backup — locking the 4-D ruling into the copy itself. If a shorter HUD/audio stamp is
wanted instead: **`« CRS — ILS SE SONT PERDUS »`** (one line, same meaning). Both are held for
the Niveau Final; the harness uses neither.

---

## 3. Lever 5 — coup de grâce : la fiction du beat + les mots

### 3.1 What the beat IS

At the moment his HP crosses to 0 the Commandant is **down but not finished** — on a knee,
reeling, one hand still reaching for the **radio / whistle** to call it in, to have the son
cut from somewhere else. The finisher is the single deliberate input that **stops that reach.**
It mirrors the ADR-0034 porte-cochère execution-click: HP-to-0 opens a brief HOLD, the player
commits one last beat, then the fight resolves to WON. (Exact trigger shape / hold vs.
guaranteed-success = `game-designer` OQ 5-A/5-B; I write only what the beat _means_.)

### 3.2 Tone guardrail (binding on the copy, traces to ADR-0030 restraint)

**This is not an execution fantasy and must never read as one.** The encounter spec already
set the rule: « on ne romance pas la chute du boss » (§4.2). No gore, no slow-mo relish, no
kill-word. The beat is about **the son passing**, not the man dying — the emotional payload is
already booked for « la ville qui tient », not for his death. So the finisher's fiction and any
word on screen point at the **delivery**, not the corpse. He is « celui qui coupe le son »
(character sheet §2); the coup de grâce is simply Muf making sure he never does.

### 3.3 Player-facing words

- **In-beat spoken line: NONE.** The QTE is frozen and mute (encounter §2, shell law). The
  finisher does not break that; no character speaks during the hold.
- **Optional on-screen action prompt (canonical if `ux-designer` places one):**
  **`« LIVRE LE SON »`** — or the one-word **`« LIVRE. »`**. It labels the last input with the
  core-loop verb, in register, and **bookends** the gated `final_pre` #8 « Livre le son, Muf. »:
  the mission's closing imperative becomes the finisher's mechanical beat. It carries zero
  bloodlust — deliberately, per §3.2. Surface (whether shown at all, and how) is `ux-designer`'s.
- **Aftermath: reuse the already-gated `final_post`, unchanged.** The finisher resolves
  _directly into_ encounter §4.2 (`final_post` #1 « Le son passe. » → #3 « À terre. Ses hommes
  l'ont pas vu tomber. »). That downbeat IS the coup de grâce's aftermath and it is already
  written, gated and in-tone. **I author no competing post-scene** — doing so would duplicate
  and risk contradicting gated copy. The finisher is the bridge into it, nothing more.

---

## 4. Lever 3 — parade : the one diegetic line

**Diegetically, the parade is Muf shooting the pistol, not the man.** When the Commandant
brings his sidearm up to fire — the EXPOSED windup — a precise shot **on the weapon itself**
knocks the barrel off-line and the shot goes wide; « une balle suffit », placed on the gun
instead of the chest. It is not a melee parry and he swings no baton: he is BAC with a service
pistol (character sheet §2 / art prompts « service pistol »), so the deflected thing is the
**shot**. This is the veille #2 « cliquer pile sur son arme dans la fenêtre = désarmé », kept
in-tone: Muf stays precise, not a killer. That shared sentence is all game / ux / art need from
me on this lever; the timing, reward, cost and telegraph are `game-designer` (OQ 3-A/B/C) and
the HUD read is `ux-designer`.

---

## 5. Request sheet to the art flow (props + renfort — NOT visual directives)

For `concept-artist` → `lead-art` when the Niveau-Final story opens. I provide identities and
poses REQUESTED; the LOOK is theirs, house-style as always (B&N photocopié + néon acide,
readable by silhouette, no colour-alone).

- **Venue props (lever 2):** `lustre` (the hall's dead chandelier — _belongs to the building_,
  reads « ancien monde », not rave gear), `mur d'enceintes` (the crew's speaker stacks — reads
  « le son »), `fumée` (a haze layer — the party's own machine). Poses/states requested by the
  mechanic are `game-designer`'s to name; I request only that each prop read as **whose it is**
  (building / crew / party) at a glance. **REQUEST, not a fait accompli — new props go through
  the art flow.**
- **Renfort (lever 4):** **reuse the shipped `enemy_riot` / `enemy_riot_shooting` CRS** — no
  new sprite is requested. Fiction: a stray CRS section, not the Commandant's men. If a
  distinct « lost / disordered » read is ever wanted, that is a future art request, not assumed
  here.
- **Coup de grâce (lever 5):** may want a « reaching for the radio/whistle, down on a knee »
  Commandant pose distinct from the gated `commander_down` (a _finishing_ beat vs. a _finished_
  sprawl). Flagged as a POSSIBLE future pose for the Niveau-Final art pass — **not requested
  now** (harness needs none; ADR-0051 art gate N2 « do not burn a run ahead of need »).

---

## 6. Fiction flags — for Karim's PASS

1. **NEW canon — the Niveau-Final venue** (a squatted grand disused hall with an old
   chandelier). First time the finale's _building_ is named, even loosely. Conscious extension;
   proposed in loose form only; `art-advisor` consultable. Fold into the future
   `narrative-bible.md` alongside « le Commandant ».
2. **4-D RULED — renfort = a lost CRS section, NOT his men.** Traces 1:1 to §7 (CRS/BAC are
   distinct arms) and to shipped `enemy_riot`; **no 4th faction** (AC6). Does NOT contradict
   « plus personne pour le couvrir » (§1.3) — it corroborates and sharpens it (§2.3). This is
   the flag the story explicitly asked me to close.
3. **Coup de grâce = delivery, not execution.** Tone guardrail (§3.2) binds the copy; aftermath
   reuses gated `final_post` unchanged; no new post-scene authored. No romance of the kill
   (ADR-0030 restraint).
4. **Parade = shot-on-the-weapon**, not a melee/baton parry — consistent with a BAC sidearm and
   « une balle suffit ». One diegetic line only.
5. **AC8 held.** All canon here is written-and-held for the Niveau Final; the Belliard harness
   gets only non-canon placeholders. Reserved-for-finale status untouched. Nothing ships live.
6. **Does NOT decide any mechanic or surface.** Lever-1 targeting shape, parry timing/reward
   (3-A/B/C), decor stagger/audio-tell (2-A/B/C), renfort real-vs-scripted (4-A) and freeze-law
   (4-C), finisher trigger/failure (5-A/B), and every HUD/audio surface remain
   `game-designer` / `senior-architect` / `ux-designer` / `sound-designer`. The fiction is
   written to survive both branches of the 4-A/4-C ruling (§2.4).

---

## 7. Loop / scope compliance

- **Boucle intouchable.** All four levers dress the already-gated `Livrer` duel; `Récupérer` /
  `Éviter` acquire no new rule from any word here. The finisher labels the last beat with the
  loop verb « LIVRE » rather than adding a verb.
- **« une mission = 3–5 min ».** No new scene, no wall of text — the fiction lives in objects
  already in the room, an optional one-line cue, an optional prompt word, and the _existing_
  gated pre/post scenes. The frozen QTE stays the set-piece.
- **Period authenticity.** CRS vs BAC as distinct `'99` corps, squatted grand hall, smoke
  machine left running, service pistol, bug de l'an 2000 — zero anachronism. `art-advisor`
  consultable if the gate wants the chandelier-hall read hardened.

---

## 8. Hand-off — `lead-game-designer` (design gate)

**De :** `narrative-designer` (Yasmine) · **À :** `lead-game-designer` (Karim) ·
**Objet :** fiction of levers 2/3/4/5 for the boss differentiation pack (AC6).

**Livré :**

- **Lever 2 — décor set-dressing:** venue = squatted grand disused hall (millennium teuf);
  lustre = the dead building, enceintes = the crew's son, fumée = the party's own machine.
  Harness gets placeholders; canon held for the Niveau Final.
- **Lever 4 — OQ 4-D RULED:** renfort = a lost CRS section (different corps, not his men,
  no cover) — does not contradict « plus personne pour le couvrir »; written to survive both
  the real-enemies and scripted-cue architecture outcomes; optional cue copy provided.
- **Lever 5 — coup de grâce:** the beat = stopping his reach for the radio; tone guardrail
  (delivery, not execution); optional prompt « LIVRE LE SON »; aftermath reuses gated
  `final_post` unchanged.
- **Lever 3 — parade:** one diegetic line (shoot the pistol, not the man).

**Ce que je NE décide pas :** all mechanics, tuning, and HUD/audio surfaces (flag 6).
Shared terrain to sync with `game-designer` (Sacha): the parade must _read_ as « il tire sur
l'arme » and the renfort must _read_ as « pas ses hommes » — on conçoit ensemble, on livre
séparément (COLLABORATION.md).

**Demandé au gate :**

1. PASS / PASS-with-corrections on the four fiction beats (§1–§4).
2. Ratify/amend the 6 flags (§6) — especially flag 1 (new venue canon) and flag 2 (the 4-D
   ruling, the story's named AC6 ask).
3. Route the §5 request sheet to `lead-art` when the Niveau-Final story opens (not now — AC8).

**À loguer :** hand-off in `docs/handoffs/story-boss-qte-differentiation.md`, indexed in
`docs/agent-handoffs.md`. Gate verdict to `docs/game-design/README.md` (In flight / gated).
