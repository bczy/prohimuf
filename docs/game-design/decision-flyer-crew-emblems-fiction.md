# Fiction gate — flyer crew emblems (`FLYER_EMBLEMS`)

**Author:** `narrative-designer` (Yasmine) · **Gate requested from:** `lead-game-designer`
(Karim) — status **DRAFT, awaiting PASS** · **Date:** 2026-08-05 ·
**Branch / PR:** `claude/flyer-wall-float-in-animation` — PR #145 ·
**Raised by:** CI review panel, MAJEUR — "crew emblems shipped without the fiction design gate".

## 0. Why this doc exists

`FLYER_EMBLEMS` in `src/render/ui/menu/FlyerMotif.tsx` gives each crew a **symbolic
identity mark**. That is an attribution of universe identity — my surface, not art's and
not UX's. The PR holds two real gates, neither of which covers it:

- `lead-art` (`docs/art-direction/decision-flyer-crew-emblems.md`) — judges **execution
  and style** (line weight, halftone, silhouette), not **who gets which sign**.
- `ux-designer` — scoped to the **entrance animation**, not the iconography.

COLLABORATION.md rule 1 ("no dev implements an ungated design") therefore holds. This doc
is the missing fiction gate. It changes **no code**: where an emblem must change I name
the replacement and hand it to `dev-r3f-render`.

**Canon this rests on** (all already gated):

- `docs/game-design/pregame-copy-deck.md` §2 + §9 — the crew names AND the **motif
  attribution per flyer**, PASSED by the `pre-game-design-gate.md` §(f).
- `docs/game-design/spec-niveau-final-fiction.md` §1 — l'Éden is a **venue**, not a crew.
- `src/game/systems/narrativeSystem.ts` — shipped scenes (Vitry grief, Stalingrad '95).

**What I verified, and what I did not.** The attribution map below — emblem _kind_ **and
layout slot** — is the real `FLYER_EMBLEMS` as it stands in `FlyerMotif.tsx` on the
branch, confirmed against the code (an earlier draft of this doc worked from a wrong map
taken from the PR body; that draft's ruling on NADIR 94 is corrected in §2.3). I have
**not** read `docs/art-direction/decision-flyer-crew-emblems.md`. No verdict below depends
on it: I rule on _which sign belongs to which crew and how loudly it is placed_, never on
line weight, halftone or silhouette — that is `lead-art`'s PASS and I do not reopen it.

**Slots are part of the attribution.** `hero` = the sheet is _led by its image_ (the emblem
hangs across the top, lettering starts below it); `mid` / `body` = the emblem sits under
the typography. Which crew earns the loud slot is a fiction question, so it is gated here.

---

## 1. Verdict table

| Emblem  | Slot   | Assigned to  | Verdict                                       | Fiction ground                                                        |
| ------- | ------ | ------------ | --------------------------------------------- | --------------------------------------------------------------------- |
| spiral  | `body` | SPIRALE 23   | **PASS**                                      | Deck §2.2 "spiral, 23"; Spiral Tribe lineage. The name IS the sign.   |
| rings   | `mid`  | KANAL SYSTEM | **PASS w/ condition**                         | Deviates from deck §2.3 ("biohazard") — but reads truer.              |
| plumb   | `hero` | NADIR 94     | **PASS — and it is the best sign in the set** | A plumb bob points at the nadir. Name, place and grief in one object. |
| smiley  | `mid`  | tutorial     | **CHANGE — contradicts**                      | The tutorial's canon is explicitly _no system, no sign_.              |
| invader | `body` | L'Éden       | **CHANGE — category error + wrong register**  | L'Éden is a venue; the invader is a gaming wink.                      |

---

## 2. Per-crew rulings

### 2.1 spiral (`body`) → **SPIRALE 23** — PASS

Nothing to argue. The copy deck fixes Belliard's motifs as "**spiral**, `23`, no logo"
(§2.2) and the crew is _called_ SPIRALE 23. The sign is denotative, which is exactly right
for the **entry gig**: the first flyer the player ever reads should be the one where name
and mark agree at a glance, before the vocabulary gets oblique. `body` is the correct slot
— the entry flyer should be led by its _lettering_, because that flyer's job is to teach
the player how to read all the others.

The code comment ("Archimedean spiral — Spiral Tribe's emblem, and literally SPIRALE 23's
namesake") states the lineage, and it is the right one: Spiral Tribe were the sound system
that carried the free-party circuit into France after Castlemorton, and the number **23**
was theirs. SPIRALE 23 is therefore an **homage**, not a coincidence — which is exactly
what a fictional French crew of 1998 would be.

**Recorded for the bible, no change asked:** a spiral and the number 23 are common cultural
property, not marks anyone can own, so this is legal-safe on the same footing as _l'Éden_
and the `08 36` numbers. But the bible must log it **as homage** so a later contributor
does not "sharpen" the emblem toward the real collective's actual artwork, which would turn
a nod into appropriation.

One note for the future bible, not a change request: the deck lists the spiral as a
motif on _all three_ gig flyers (§2.2/§2.3/§2.4) — a shared scene sign, like the `23`. Its
use as SPIRALE 23's **exclusive** identity mark is only legitimate because that crew's
name claims it. Do not later read this as "spiral = Belliard only" in the bible.

### 2.2 rings (`mid`) → **KANAL SYSTEM** — PASS with condition

The deck said **biohazard** (§2.3, "warehouse/industrial"). The PR shipped concentric
rings. I do **not** ask to revert, and I amend the deck instead — the rings are the better
fiction:

- Concentric rings read two ways at once, both correct for this crew: **ripples on the
  canal** (the crew is named for the water, Zone line `BORDS DU CANAL · 19e`) and a
  **speaker cone / wavefront** (slogan `UN ENTREPÔT · UN MUR DE SON`). A sign that means
  both the place and the sound is a better crew mark than one that only means "industrial".
- The biohazard was the weaker call on my part. It was period-plausible (it belonged to the
  hardcore/gabber and early tekno visual stock) but it is **borrowed** — it says nothing
  about _this_ crew, and it drags a toxic/danger connotation onto a warehouse party whose
  written register is welcoming (`RV : SUR L'INFO-LINE`, whole-night `00H → AUBE`).

**Condition C1 (deck amendment, docs only):** `pregame-copy-deck.md` §2.3 "Motifs:
**biohazard**…" is superseded by "Motifs: **concentric rings** (canal ripple / speaker
wavefront), spiral, `23`". No code change. Owner: me, on Karim's PASS.

### 2.3 plumb (`hero`) → **NADIR 94** — PASS, and it is the best sign in the set

> **Correction of record.** An earlier draft of this doc asked for a change here, on the
> belief that NADIR 94 carried the **halftone** — the house texture of the whole UI (the
> fanzine grain, the `HalftoneHero` wash behind every narrative backdrop, ADR-0023), which
> as an identity mark would have said nothing. That map was wrong; there is no halftone
> emblem in `FLYER_EMBLEMS`. The real emblem is a **plumb bob**, and it answers the demand
> that draft was making — _the mark must say the name_ — better than the replacement it
> proposed. Ask A3 is **withdrawn**. This paragraph stays so the reversal is on the record.

A plumb bob is a weight on a line that points, by gravity and nothing else, straight down
— at the **nadir**. The sign _is_ the name, arrived at by physics rather than by
illustration. That earns it on three counts:

- **It names the crew** exactly as the spiral names SPIRALE 23 — the two denotative marks
  in the set now rhyme, which makes the whole system read as one printing.
- **It is period- and class-true.** A plumb bob is a mason's and builder's tool: the sign
  of the people who _poured the barres_. On the flyer for `AU PIED DES BARRES · SON
MAXIMAL`, in the 94, it belongs to the place in a way no astronomical or acid symbol
  would. It is also a tool, not a scene badge — which suits a crew defined by its soundman
  (DJ Masta Klem, copy deck §9.1) rather than by its affiliation.
- **It carries the level's grief without narrating it.** Vitry is the one level where the
  loop stops and Muf goes quiet — « Ma mère habitait au 9e. Fenêtre du coin. » «
  J'aurais pas dû revenir. » A plumb line hangs, pulls down, and finds the bottom. The
  flyer holds the weight of the post-scene before the player has read it, and never says
  so. That is the zine rule working.

**On my earlier disc-on-horizon proposal:** it lit the same idea (the lowest point) but
as an _illustration_ of a concept — a picture that has to be decoded. The plumb is an
**object that behaves**: it points down because things point down. Between a symbol you
must interpret and a tool that simply obeys gravity, this fiction takes the tool every
time. The plumb is better. I withdraw mine.

**The `hero` slot is right, and it is the one I want defended.** NADIR 94 is the only sheet
led by its image — the bob hangs across the top, the lettering starts under it. That
hierarchy is doing fiction work: on the flyer for the heaviest level, the image outranks
the words and physically presses them down the page. Do not "normalise" Vitry to `mid`/
`body` for consistency; the asymmetry is the point. (Consequence for the finale: see §2.5.)

### 2.4 smiley (`mid`) → **tutorial** — CHANGE (contradicts gated canon)

This is the misfire the panel was right to smell, and it is not a matter of taste.

**What the smiley carries.** It is the single most loaded sign in this subculture: the acid
house smiley of 1988, the Second Summer of Love, and by the mid-90s the free-party
circuit's inherited badge — the mark that says _there is a system here, and it is playing_.
It is never neutral decoration; it is a **scene affiliation**.

**What the tutorial flyer is, in gated canon.** Copy deck §2.1: "**not a gig** — a
photocopied _old_ flyer that DISPATCH marked up by hand to teach Muf", crew slot literally
`SANS SYSTÈME · AVANT LE SON`, info-line struck out `pas besoin d'appeler`, RV `ici,
maintenant`. It is the **only** flyer that has no crew and no line, on purpose (§8.4).

So the PR stamps the scene's strongest affiliation badge onto the one surface whose entire
written fiction is _no affiliation yet_. The flyer's own crew slot denies what its emblem
asserts. That is a direct contradiction, not a thin choice.

**Correction — ask:** the tutorial gets **no crew emblem at all**. Its identity mark is
`DISPATCH`'s hand: a **hand-drawn circle around the `23`** with a short arrow — the deck
already writes it ("the margins carry handwriting; `23` is circled; an arrow points to
'commence ici'", §2.1). A wobbly ballpoint ring against four clean stamps is the strongest
possible read of _this one is different, this one is yours_, and it costs the render lane a
stroke, not a new asset. If the emblem slot must be non-empty for layout reasons, the
circled `23` fills it; it must not be a scene badge.

**Where the smiley goes instead: nowhere. It leaves the set.** The copy deck had assigned
the acid smiley to Vitry (§2.4, "euphoria over the melancholy") and that reading was sound
— but the plumb bob now does that job on the same sheet, better and more specifically
(§2.3). Two signs cannot lead one flyer, and I will not move the smiley to a crew that has
a stronger mark just to keep it in circulation. The set is complete without it.

Which is the honest reason it must not stay on the tutorial either: it is not that the
smiley is a bad drawing, it is that **it has no owner in this fiction**. An emblem with no
crew behind it is decoration, and this zine does not decorate.

**Condition C1b (deck amendment, docs only):** `pregame-copy-deck.md` §2.4 "Motifs:
**acid smiley**…" is superseded by "Motifs: **plumb bob** (the nadir; the mason's tool of
the barres), spiral, `23`". Same pass as C1. Owner: me, on Karim's PASS.

### 2.5 invader (`body`) → **L'Éden** — CHANGE (two independent faults)

**Fault A — category error.** Per `spec-niveau-final-fiction.md` §1.1, **l'Éden is not a
crew**. It is the building's own dead marquee, "the name still bolted over a door nobody
has opened in years"; the underground "doesn't rename it; they just move in under the old
sign". The copy deck's standing rule (§9.1) is explicit: _a crew is a collective; never
merge a crew name with something that is not one_. `FLYER_EMBLEMS` puts a venue in the crew
column and gives it a crew badge. Whatever mark the final flyer carries, it must be read as
belonging to **the hall**, not to a sound system named L'Éden — which does not exist.

**Fault B — the invader's register is wrong, twice over.**

- _Period:_ defensible on paper. Space Invaders is 1978 and Paris genuinely had the
  mosaic-invader tiles going up on its walls from the mid-90s. So it is not an anachronism.
- _But diegetically it is a videogame wink._ muf is a remake of an Atari ST game; an 8-bit
  invader on the **final level's** flyer reads to the player as the developers waving —
  "look, retro gaming" — and that is the one register this fiction has never used. The zine
  rule is _name it, don't narrate it_ (`spec-niveau-final-fiction.md` §1.1). A meta-joke on
  the last flyer narrates.
- _And it fights the venue._ L'Éden's canon is an inter-war dancing: parquet, balcony, one
  heavy chandelier still hanging — "le vieux monde suspendu au-dessus de la fête" (§1.3).
  The final level's whole subject is **the century turning**, the old world overhead while
  the last night of it plays underneath. A pixel alien has nothing to say about that.

**Correction — ask:** replace the invader with the **chandelier reduced to a sign** — a
small radiating starburst / pendant drop, the same object the finale spec already makes the
room's emblem. It is: the venue's own mark (fixing fault A), period-true for a 1930s
dancing, and it pays off in-game the instant the boss weaponises the chandelier. Second
choice, if `lead-art` finds the chandelier unreadable at flyer scale: a **double zero**
(`00`) or a stopped clock face at midnight — the millennium, which is what the flyer is
selling (`31 décembre 1999`, « Qu'il danse jusqu'en 2000 »).

**Fault C — the slot, now that I can see it.** The finale sits at `body`: emblem under the
lettering, the quietest placement in the set, while **Vitry** takes the only `hero`. As a
hierarchy that says the third gig outranks the last night of the century. Today that is
survivable only because the invader deserves no promotion — a bigger wrong sign is a worse
flyer. But it becomes an argument the moment the emblem is fixed:

**Ask A5b — promote the finale to `hero` together with the swap.** A chandelier hung across
the top of the sheet with the lettering starting beneath it is not a layout preference, it
is the canon image: « le vieux monde **suspendu au-dessus de** la fête »
(`spec-niveau-final-fiction.md` §1.3). The finale flyer would then rhyme with NADIR 94 —
two sheets led by a hanging object, one a weight that finds the bottom, one a chandelier
that has not fallen yet. Two `hero` sheets out of five is still an exception, not a rule,
and it puts the loudest one last. If `lead-art` or `ux-designer` judges a second `hero`
harmful to the wall's rhythm, I yield on the slot and keep only the emblem swap — A5b is a
**recommendation**, A5 is the blocking part.

---

## 3. Standing condition on the whole set

**C2 — emblems must read as stamps, not logos.** The zine's own colophon says it:
« Ni pub, ni logo, ni adresse » (copy deck §4.1), and the Belliard flyer's motif list ends
with "no logo". A fixed, crisp, per-crew identity mark is in tension with that ethos. The
fiction survives only if the emblems read as **hand-cut / rubber-stamped / photocopied**
— off-register, ink-starved, never a vector brandmark. Execution is `lead-art`'s call and
his decision doc may already cover it; I record the constraint so it is not lost, and so a
future contributor does not "clean up" the emblems into a logo set.

**C3 — bible follow-up (already owed).** `pregame-copy-deck.md` §9.2 owes a
`narrative-bible.md`. These five emblems are canon the moment they ship; they belong in it,
with the crew↔motif table as one row per crew. Not actioned here.

---

## 4. Ask to `lead-game-designer` (Karim)

| #   | Ask                                                                                                                             | Owner            | Blocking? |
| --- | ------------------------------------------------------------------------------------------------------------------------------- | ---------------- | --------- |
| A1  | Keep spiral (`body`) → SPIRALE 23 as shipped; log the Spiral Tribe homage.                                                      | me (bible)       | no        |
| A2  | Keep rings (`mid`) → KANAL SYSTEM; amend copy deck §2.3 (biohazard → rings).                                                    | me (docs)        | no        |
| A3  | ~~NADIR 94: halftone → black disc~~ — **WITHDRAWN.** `plumb` @ `hero` PASSES, unchanged; amend deck §2.4 (smiley → plumb, C1b). | me (docs)        | no        |
| A4  | Tutorial: smiley → **hand-circled `23` + arrow**, or no emblem.                                                                 | `dev-r3f-render` | **yes**   |
| A5  | L'Éden: invader → **chandelier starburst** (fallback: `00` / midnight).                                                         | `dev-r3f-render` | **yes**   |
| A5b | L'Éden: promote `body` → `hero` alongside A5 (recommendation, yieldable).                                                       | `dev-r3f-render` | no        |
| A6  | Record C2 (stamp, not logo) with `lead-art`; no re-gate of execution.                                                           | `lead-art`       | no        |

Two blocking asks remain, A4 and A5 — down from three: seeing the real code withdrew one
and confirmed the emblem it concerned is the strongest in the set. Both are blocking on
**fiction**, not on the animation work this PR is actually about. If
the pipeline prefers to land the float-in animation now, an acceptable split is: ship the
animation, open a one-lane follow-up for the two emblem swaps, and **do not** treat the
tutorial and finale attributions as canon in the meantime. Belliard, Stalingrad and Vitry
are gated by this doc and may be recorded as canon immediately. That call is Karim's +
`producer`'s, not mine.
