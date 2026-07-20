# Niveau Final — fiction spec (venue canon hardened + script wiring)

**Author:** `narrative-designer` (Yasmine) · **Gate:** `lead-game-designer` (Karim) —
status **DRAFT, awaiting PASS** · **Date:** 2026-07-20 ·
**Story:** `_bmad-output/planning-artifacts/story-boss-niveau-final-live.md`
(STORY-BOSS-NIVEAU-FINAL-LIVE) — my part: **venue canon + narrative wiring** (Open
Questions 4 / AC7).

**Extends / traces to (does not reopen):**
`docs/game-design/spec-boss-encounter-fiction.md` (gated « le Commandant » + the reserved
finale reveal + the gated `final_pre`/`final_post` scripts, §4) ·
`docs/game-design/spec-boss-differentiation-fiction.md` (venue + props fiction, §1) ·
ADR-0051 · ADR-0052.

**Canon status change this spec records:** the differentiation spec named the venue in
**loose form** ("a squatted grand disused hall with an old chandelier", flag 1), pending a
one-line Bertrand confirmation the `pm` AC7 review asked for. **Bertrand has CONFIRMED it
(2026-07-20): the squatted grand hall is now HARD canon.** This spec hardens it — names the
place, fixes its history, and wires the finale — **without rewriting one word of the gated
`final_pre`/`final_post` copy** (drift flags in §5, none of them a copy change).

Voice baseline is the **shipped** register in `src/game/systems/narrativeSystem.ts`
(DISPATCH terse/imperative, KENZA field-savvy, MUF laconic), unromanced per ADR-0030/0034.
Period is **31 décembre 1999, Paris, free-party circuit** — no smartphone-era vocabulary,
francs, `08 36` infolines. Player-facing strings are **French**; meta/notes are English.
Zero production code — scripts are the spec; `dev-gameplay`/`dev-r3f-render` transcribe.

---

## 0. Two hard pins (read before anything below)

- **The gated copy is frozen.** `final_pre`/`final_post` (encounter spec §4) ship
  **byte-for-byte as gated**. This spec adds only the **wiring** a concrete level needs (a
  key, a scene id, a backdrop path) — the "light adaptation for the concrete id/anchor" AC7
  explicitly anticipated. Any change that would touch a French line is raised as a
  **question to the gate** (§5), never done silently.
- **The finale spends its one true reveal here, and only here.** The `boss-harness`
  (`BOSS_QTE_DEV_HARNESS_LEVEL`, ADR-0051 D4) stays non-canon and out of `LEVELS` (§4). A
  shipped player's first and only canon meeting with le Commandant is this level.

---

## 1. The venue, hardened — **l'Éden**

### 1.1 The name (in-fiction)

The hall has a name now: **l'Éden** — *ancien dancing*. Not the rave's name and not a
squat tag: it is the building's own dead marquee, the name still bolted over a door nobody
has opened in years. The underground doesn't rename it; they just move in under the old
letters for one night.

- **Player-facing, it reads plainly** — a place, like « Stalingrad » or « Vitry ». Never
  glossed, never explained in dialogue. The irony of throwing the last party of the century
  in a ruin called *Éden* is left for the player to catch or miss; the scene never points
  at it. (Zine rule: name it, don't narrate it.)
- **Fictional & legal-safe.** *Éden* was a stock name for inter-war dancings, cinémas and
  concerts across France — common enough to be authentic, generic enough to name no real
  extant venue. Same legal-safe principle as *commandant Ferrand* and the `08 36` infolines
  (encounter spec flag 2). **The gate may rename it**; the venue *type* (Bertrand-confirmed
  squatted grand hall) does not depend on the proper noun.

### 1.2 Its history (canon, one paragraph)

**l'Éden** was a grand dancing / salle de bal from between the wars — parquet, a balcony, a
single heavy chandelier over the floor. It closed decades ago and was left to rot,
shuttered but never gutted: the chandelier still hangs. On **31 décembre 1999** the sound
systems requisition the husk for **la teuf du siècle** — thousands of people, the crew's
stacks trucked in against the dead grandeur. Period-authentic: `'98–'99` teufs took over
exactly these shells (old theatres, disused halls, hôtels particuliers) for the big dates
(differentiation spec §1.1; curated grounding in
`docs/references/narrative-1998-paris.md`). Location stays deliberately loose — **an old
dancing at the edge of Paris**, room enough for thousands, reachable on Muf's bike; the
exact arrondissement is for the art/backdrop pass to pin, not this spec.

This paragraph is the **only new prose canon** the story adds. It hardens exactly what
Bertrand confirmed and nothing further.

### 1.3 The room already fights on Muf's side (carried over, unchanged)

The three interactive objects are the differentiation-spec's, verbatim in identity — I add
nothing to them, I only tie them to the named hall:

| Objet | Ce que c'est | À qui |
| --- | --- | --- |
| **Le lustre** | Le lustre d'origine de l'Éden — le vieux monde suspendu au-dessus de la fête. | La salle (le passé) |
| **Le mur d'enceintes** | Le sound-system du crew — le corps sonore de la nuit. | Le crew (le son) |
| **La fumée** | La machine à fumée que personne n'a coupée. | La fête (le brouillard) |

The through-line stands: le Commandant came to cut the sound; the sound, the smoke and
l'Éden's old ceiling are all still running, and each is a way the night refuses to be
switched off (differentiation spec §1.2). **No change to that fiction — this spec only
gives the room its name.**

---

## 2. How the briefing sets it up (the narrative frame)

**The finale's briefing is the already-gated `final_pre` — reused as-is.** It is the same
DISPATCH/MUF scene the crew gated, and it already primes l'Éden without ever naming it:
« Le dernier son du siècle » (#1) and « Qu'il danse jusqu'en 2000 » (#8) establish a party
big enough to own a hall like this — exactly why the differentiation spec noted *"No change
to any gated line is required."* The hall is set up player-facing by **three surfaces that
are NOT the gated dialogue**, so the frozen copy stays frozen:

1. **The level-select node** — the venue is named there first: **`L'Éden`** (see §4). This
   is the player's first sight of the place, in my authored words, outside the gated script.
2. **The pre-level backdrop** — the gated `final_pre` scene plays over the **interior of
   l'Éden** (the new venue art, painted as the same halftone-B&W wash every pre/post scene
   already uses, ADR-0023). The room is *shown*, wired via the scene `backdrop` (§5, drift
   flag B). The dialogue over it is unchanged.
3. **The mission itself** — `Récupérer → Livrer` play out inside the hall; the living rig
   and dead chandelier (§1.3) are simply *there* before the boss weaponises them.

**Recommendation — do NOT add a line naming l'Éden inside the briefing.** The gated
`final_pre` is 8 lines, at the top of the shipped 5–9 bound, and the title + backdrop
already carry the venue. Cutting-not-padding is the house rule. If the gate *wants* the
name spoken in-scene, that is a **conscious amendment to gated copy** — raised as a
question (§5, Q1), never slipped in. My position: title + backdrop is enough; keep the
scene frozen.

The rule is still taught diegetically inside the gated scene — `final_pre` #6, DISPATCH:
« Il tire le premier. C'est là qu'il est à découvert. Nulle part ailleurs. » — no tutorial
plaque, and compatible with whatever window shape `game-designer` shipped (it names the
*quand*, not the *comment*).

---

## 3. The finale's one-shot reveal discipline

### 3.1 The boundary, restated (harness stays non-canon)

The `boss-harness` level (`BOSS_QTE_DEV_HARNESS_LEVEL`, id `boss-harness`) is **excluded
from the shipped `LEVELS` array** (ADR-0051 D4) and reachable only through a dev-only seam.
**No shipped player ever sees it.** It carries **no canon script** — placeholder/mute only
(encounter spec §4 tail; differentiation spec §0/AC8). Therefore:

- The Commandant's name, his embodiment, his defeat, and l'Éden itself **must not appear**
  on `belliard` / `stalingrad` / `vitry`, in the tutorial, or in the harness. Verified
  against shipped copy: none of the three prior levels' pre/post scripts name him — the
  reserved reveal is still unspent.
- The gated `final_pre`/`final_post` keys are wired to **this level's id only** (§4). No
  other level references them.

This is the whole point of holding the canon for the finale (encounter spec §3): the
capstone antagonist is *revealed once*, at the party he was always going to try to end.

### 3.2 The reveal beats, in player order (all on this one level)

| # | Beat | Carried by | First-ever for a shipped player |
| --- | --- | --- | --- |
| 1 | **The destination is named** | Level-select node « L'Éden — 31 décembre 1999 » (§4) | First sight of the venue |
| 2 | **The stakes + the name** | Gated `final_pre` over the l'Éden backdrop — DISPATCH sets the night; **MUF: « ...le Commandant »** (#4) | First canon utterance of the name |
| 3 | **The rule, diegetically** | Gated `final_pre` #6 (« il tire le premier… ») | — |
| 4 | **The embodiment** | The boss QTE: le Commandant descends and fires himself — the differentiation levers fire (décor / parade / renfort CRS / coup de grâce) | First time the player *sees him act* |
| 5 | **The downbeat** | Gated `final_post` — **« À terre. Ses hommes l'ont pas vu tomber. »** → « Écoute la ville. » → « Bonne année, Muf. » | The payoff = the city holding into 2000, not the kill |

Reveal #2's line stays **imageless** (as gated) until the Commandant sprite lands — exactly
as Vitry's monologue carries itself on the facade alone. The reveal is spent on the *words +
the venue*, not on a placeholder sprite. Opening the Commandant art lane (so #2/#4 get his
sprite) is **Open Question 3** — `pm` + `lead-game-designer` + `senior-architect`, not mine.

---

## 4. Player-facing words beyond the briefing — the level-select surface

`ux-designer` owns the level-select **surface** (how a title/subtitle render, whether a
subtitle field exists at all); I own the **words**. Seam handed to Tony:

- **Level name (the terse place-name, matching `LevelConfig.name` pattern —
  « Rue Belliard » / « Stalingrad » / « Vitry — 94 »):**
  **`L'Éden`**
- **Subtitle / context words (for whatever secondary surface ux exposes):**
  **`31 décembre 1999 · le dernier son du siècle`**
  (drawn from gated `final_pre` #1 — reuse, not a rewrite; safe to echo.)
- **If the surface takes only ONE string** (as `LevelConfig.name` does today), the single
  canonical value is:
  **`L'Éden — 31 déc. 1999`**
  (mirrors the « Vitry — 94 » one-field convention; the date is the finale's meaningful tag
  the way the *département* is Vitry's.)

Pick per what the surface supports — the words are fixed, the layout is Tony's. No other
new player-facing string is authored by this story (AC7: nothing beyond the gated scripts +
this title).

**Recommended level id (drives the narrative keying, §5): `niveau-final`** — the story's
own example (`levels.ts` / `senior-architect` own the final id at TECH PLAN; the keying in
§5 follows mechanically from whatever id ships).

---

## 5. Script wiring + drift flags — for the gate + `dev-r3f-render`

The gated `final_pre`/`final_post` copy is **reused as-is**. Wiring a concrete level needs
the adaptations below. **None is a copy change**; each is exactly the "light adaptation for
the concrete id/anchor" AC7 anticipated. Where an option *would* touch gated copy, it is a
**question**, flagged, not decided.

### Required wiring (no copy change — safe to transcribe)

- **Drift flag A — scene keys & ids follow the level id.** The gated spec proposed the ids
  `final_pre`/`final_post` as placeholders *before the level existed*. The shipped invariant
  is: the `PRE_/POST_LEVEL_NARRATIVE` **key must equal the level id**, and the test
  (`narrativeSystem.test.ts` A2) enforces `scene.id === "<key>_pre" / "<key>_post"`. So with
  level id `niveau-final`:
  - map key: **`niveau-final`** (in both `PRE_LEVEL_NARRATIVE` and `POST_LEVEL_NARRATIVE`)
  - `PRE` scene id: **`niveau-final_pre`** · `POST` scene id: **`niveau-final_post`**
  - The French lines inside are **verbatim from encounter spec §4** — only the id string
    changes. No copy touched.
- **Drift flag B — the scene needs a `backdrop` (mandatory, not optional).** Test A5
  requires **every** `PRE_/POST` scene to carry `backdrop: "assets/levels/<key>/facade.png"`
  (ADR-0023). The gated §4 scripts specified none (they predate the level). Wiring **must
  add**, to both scenes:
  **`backdrop: "assets/levels/niveau-final/facade.png"`**
  This is the **new venue art** (l'Éden's interior) `dev-tooling-assets` generates via
  `levelArt.json` — the standard per-level backdrop cost, here painting the hall instead of
  a street facade. The path convention is identical; only the image subject differs. Not a
  copy change; a required wiring addition the gated spec couldn't list.
- **Images stay shipped-sprite-only.** The gated lines reference `assets/courier/rider.png`
  (shipped ✓) and `assets/enemy_shooting.png` (shipped ✓); the reveal line (#4) is imageless
  by design (§3.2). Nothing here requests a new sprite. ✓

### Questions to the gate (would touch gated copy — DO NOT resolve silently)

- **Q1 — name l'Éden inside the briefing dialogue?** My recommendation: **no** — the title
  (§4) + backdrop (flag B) carry the venue; the gated `final_pre` stays frozen at 8 lines.
  If the gate wants KENZA/DISPATCH to *speak* the name, that is a conscious amendment to
  gated copy and I'll draft the inserted line for a fresh PASS. Flagged, not done.
- **Q2 — nothing else drifts.** I found no other tension between the hardened venue and any
  gated line: no gated line names or contradicts the hall, so hardening « l'Éden » requires
  **zero** rewrite of `final_pre`/`final_post`. If the gate disagrees on any specific line,
  raise it and I'll adapt against a new PASS — never silently.

---

## 6. Loop / scope compliance

- **Boucle intouchable.** The finale frames `Récupérer → Livrer → Éviter`; the boss remains
  the terminal beat on `Livrer` (ADR-0051 D3), `Éviter` gains no rule. This spec adds **zero
  mechanics, zero tuning** — one paragraph of venue history, a title, and wiring. PASS.
- **« une mission = 3–5 min ».** No new scene: the two gated pre/post scenes (8 + 6 lines,
  in-bound) are the only text; the frozen QTE is the set-piece. Skippable one-button.
- **Cahier des charges.** Building the Niveau Final is already-committed roadmap content
  (`PROJECT_GUIDELINES.md` §7/§10) — no extension test owed for a level per se; the boss's
  extension test was RATIFIED (ADR-0051). This spec re-runs neither.
- **Period authenticity.** `31 déc 1999` / bug an 2000 / francs / squatted inter-war dancing
  / chandelier / CRS-vs-BAC — zero anachronism. `art-advisor` (Estelle) consultable if the
  gate wants the *Éden* read or the arrondissement hardened
  (`docs/references/narrative-1998-paris.md`).

---

## 7. Hand-off — `lead-game-designer` (design gate)

**De :** `narrative-designer` (Yasmine) · **À :** `lead-game-designer` (Karim) ·
**Objet :** Niveau Final — venue canon hardened (Open Q4) + gated-script wiring (AC7).

**Livré :**

- **Open Q4 — venue hardened.** Bertrand-confirmed squatted grand hall named **l'Éden**
  (*ancien dancing*), history fixed in one paragraph (§1). Fictional/legal-safe proper noun
  (gate may rename); venue *type* is Bertrand-confirmed and independent of the name.
- **AC7 — gated scripts reused as-is.** `final_pre`/`final_post` ship byte-for-byte; only
  keys/ids/backdrop are wired to the concrete level id (§5, flags A/B — both anticipated
  "light adaptation", neither a copy change). **No canon copy rewritten.**
- **One-shot reveal discipline** restated: harness non-canon + out of `LEVELS`; reveal beats
  ordered (§3); the reveal is unspent on all prior levels (verified).
- **Level-select words** for `ux-designer`: title `L'Éden`, subtitle
  `31 décembre 1999 · le dernier son du siècle`, one-field fallback `L'Éden — 31 déc. 1999`
  (§4). Words mine, surface his.

**Ce que je NE décide pas :** the level id (`senior-architect`/`dev-gameplay` at TECH PLAN
— my keying in §5 follows it mechanically), pacing/quota/difficulty (Open Q1–2,
`game-designer`), art-lane timing (Open Q3, `pm`+`lead`+`architect`), and every HUD/surface.

**Demandé au gate :**

1. PASS / PASS-with-corrections on the hardened venue (§1) and the wiring (§5).
2. Rule on **Q1** (name l'Éden in-dialogue? — I recommend no) and confirm **Q2** (no other
   gated-copy drift).
3. Ratify the proper noun **l'Éden** or amend it (legal-safe, gate's call, §1.1).
4. Route the venue-interior backdrop request (l'Éden, flag B) to the art flow via the
   Niveau-Final art lane when Open Q3 is resolved.

**À loguer :** hand-off in `docs/handoffs/story-boss-niveau-final-live.md` (claim + release,
this pass). Gate verdict to `docs/game-design/README.md` (In flight / gated) once run.
