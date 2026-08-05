# PROMPT GATE — `photoQte` set-piece **v2 / round 2** (Nico, `lead-art`, 2026-08-05)

Subject: `docs/art-direction/prompt-drafts/photo-qte-setpiece-v2.md` (Maud, DRAFT v2.2).
Gated against: `docs/game-design/spec-photo-qte-fiction.md` **Rev.4**,
`docs/game-design/spec-photo-qte-paparazzi.md` **Rev.6.1 §A.12 / §A.13**,
my own ruling `photo-qte-resolution-and-sweep-ruling.md` §1.2-§1.4,
prompt gate v1 (2026-08-02), `docs/art-direction.md` §2-§4.

> **GLOBAL VERDICT: FAIL — packet incomplete + one structural defect that would ship the
> target self-denounced. NO write to `src/game/levels/levelArt.json`.** Round 3 required.
> The pivot itself is right and the writing is good: the failures are two doctrine points and
> one missing prompt, all nameable, none of them a matter of taste.

---

## 0. My own error first, because it is the cause of half of what follows

Bertrand is right and the rejection is mine before it is anyone's. In v1 I ratified
« la plate ne contient ni acteur ni berline » on a correct axis (E-6(3): an AABB baked into an
opaque plate is unmeasurable) and I never asked the next question — **what does the picture look
like once that rule is applied to the whole scene?** The answer was a deserted street with one
photographable object. Every gate passed its own axis; nobody read the result as a player.

So this gate opens with the scene verdict, not with the prompts:

> **The v2 scene, as drafted, gives the player ~11 things to zoom at and ONE of them is
> authored at three times the ink density of the other ten.** That is the same failure as v1,
> arrived at from the opposite direction: a scene that looks dense and is still a « photograph
> here » sign, only now the sign is written in sharpness instead of in emptiness.

Two bible rules come out of it (§6), and they are the real deliverable of this round.

---

## 1. Verdicts, prompt by prompt

| #   | Prompt / directive                         | Verdict                                                                                |
| --- | ------------------------------------------ | -------------------------------------------------------------------------------------- |
| 1   | `plate` — dense street (§1)                | **FAIL** — reworks R1, R2, R3                                                          |
| 2   | `commandant_couple` — LA TABLE (§3)        | **PASS as text**, conditional on edit E1 (§7)                                          |
| 3   | `berline_plate` reused unchanged (§4.b)    | **CONDITIONAL PASS** — separation ratified, no-regen claim contested (C1, C2)          |
| 4   | **ARRIVÉE / « ils s'assoient » (24×13,5)** | **FAIL — ABSENT.** Required master instant, no prompt in the packet                    |
| 5   | **The 6 `decoy` tables**                   | **FAIL — no prompt, and the doctrine that covers them is void** (R3)                   |
| 6   | Route A vs Route B for the crowd (§2.b)    | **RULED** — A for non-candidates, **B rejected outright** (§4.1)                       |
| 7   | Table rule §2.d                            | **PASS in principle, count is wrong** (R2) — and yes, it is an asset-refusal criterion |
| 8   | Resolutions (plate 2048, poses 1024/512)   | **HOLD, with one addition** (§5)                                                       |

---

## 2. R3 — the structural failure: **a `decoy` is not a figurant**

The draft's doctrine (§0) is: _décor dense non vérifié + figurants réutilisés non vérifiés + UN
sujet découpé vérifié_. It rests on « les figurants ne sont vérifiés par rien ». **That was true
when the draft was written and it stopped being true on 2026-08-05**, at
spec Rev.6.1 §A.13.3.a: `DECOY_COUNT_MAX` 4 → **6**, the seven terrace tables become
**`candidateTracks`** — 1 `master` + 6 `decoy` — each with its keyframes, and §A.13.3.e states
the interval control §7.2.a passes **× 4 → × 7**. F12(1b) asserts, per sampled `t`,
`AABB(drawn(t))` against the authored box, for **every** track.

So the six decoy tables are exactly what the draft says they are not: **drawn subjects whose
opaque AABB is measured in CI**. A decoy painted into an opaque plate has no AABB — the identical
argument I used in v1 to empty the street now says the opposite thing, and it says it about six
objects instead of one.

**R3 — the six decoy tables leave the plate and become cut-outs**, authored in the pose class,
not painted. Non-candidate crowd (walkers, the kiss, the parcel, the lit windows, the lookalike
seated ALONE, the phone box, the crouching figure) stays painted per Route A — that part of the
doctrine survives intact and is good work.

### 2.1 …and once they are cut-outs, the density gap becomes the whole verdict

Numbers, from my own ruling §1.2 and the 100 su plateau (spec §A.13.3.c):

| Element                               | px/su    | A seated head (≈ 1,77 su) |
| ------------------------------------- | -------- | ------------------------- |
| Plate (2048 px / 100 su)              | **20,5** | **36 px**                 |
| `commandant_couple` (1024 px / 17 su) | **60,2** | **107 px**                |

At the LA TABLE tightest legal framing (`V.w` 18,5 su), the master's face and a painted decoy's
face occupy **the same 184 screen px** — and one carries **three times the ink**. The player does
not need to recognise a moustache: he needs to find the sharp table. **Sharpness is a tell**, and
it is the most powerful one in a halftone family, because it is the only one the toner does not
flatten.

**Directive, opposable at the asset gate:** every `candidateTrack` sprite — `master` and the six
`decoy` alike — is authored at the **same px/su**, delivered on the same canvas rule (ruling
§1.2), with the **same dot pitch** (ruling §1.4, 6-8 px in the PNG). A decoy authored cheaper
than its target is not a saving, it is a wallhack.

Two ways to pay for it; **I do not pick, the bill is `gpu-specialist` + `dev-tooling-assets`**:

- **(a) 6 unique decoy PNGs** at the pose canvas — desktop set ≈ 30,8 MB resident (comparable to
  `street-wide.png` alone, 30,55 MB); mobile ≈ 14,7 MB, inside B10's 16 MB but tight.
- **(b) 3 unique decoy PNGs, each used twice** (mirrored, never rescaled — rescaling breaks the
  px/su equality above) ≈ 23,6 MB desktop / 10,9 MB mobile. Cheaper, and it costs a repetition
  the player may read at the establishing framing. My preference if Ben's numbers bite:
  **(b), with the two copies of a pair never adjacent and never both inside one legal frame**.

---

## 3. R1, R2 — the plate prompt

### R1 (blocking) — **the plate must NOT paint the double-parked saloon**

§1 adds « one dark saloon standing out in the open roadway, angled slightly across the traffic
lane and blocking it, alone away from the kerb », and §4.b keeps `berline_plate` as a cut-out
that **drives away** on `[53,0 ; 55,9]` (spec §A.13.2 option (i), the one the mechanic
recommends). Composed, that is **two berlines**: the cut-out leaves and reveals a painted twin
that stays double-parked forever, in the frame, for the last four seconds of the scene — during
the beat whose whole job is « the car is gone ».

**Rework, verbatim:** remove that clause and replace it with the empty slot it must leave —
`and one clear empty stretch of open roadway alongside the parked row, wet tarmac catching the
lamplight, away from the kerb`.

The evidence does not weaken: **the parked row is what accuses**, because it is what the double-
parked car is out of line with. The offending vehicle arrives with the cut-out, which is the only
version of it that can leave.

### R2 (blocking) — the table count contradicts the mechanic

The prompt says « **eight** small round pavement tables », §2.d reads it as « 1 cible +
**7** leurres ». The spec caps `DECOY_COUNT_MAX` at **6** (§A.13.3.a) ⇒ **1 master + 6 decoys =
7 interacting tables**. The eighth interacting table is an **orphan target**, precisely the case
floor **F20** was created to forbid: a perfectly framed photo would be stamped « hors cadre ».
Fiction §2.2's « une dizaine de tables » is not in conflict — it is satisfied by the
non-photographable remainder.

**Rework, verbatim:** `eight small round pavement tables, most of them taken by seated pairs of
customers in coats leaning towards each other over their glasses` →
`seven small round pavement tables each taken by a seated pair of customers in coats leaning
towards each other over their glasses, and three further tables along the same terrace, one with
a single customer reading alone, one with its chairs turned up on the tabletop, one half hidden
behind the awning post`.

Ten tables, seven candidates, three positively non-photographable. §2.d rule 2 gets its
enumeration instead of a principle, and the count stops being a hope.

**Yes to §6 question 8: the count is an asset-refusal criterion, not a detail.** A delivered plate
with an eighth interacting table is retouched or re-rolled — F20 is a floor, and a stamp that
lies is the one defect the player is entitled to be angry about.

### R2-bis — the anonymity-by-blur argument is arithmetically void

§1's closing risk paragraph says « à 2048×1152, des figurants de 40-60 px ». A standing figure is
13,5 su ⇒ **276 px** in the plate, seven times the assumption. FLUX will draw those faces, hands
and fingers with intent, and the AI-defect sweep applies to them at the asset gate like everything
else. **Anonymity must therefore be authored, not inherited from resolution**: backs turned,
three-quarter-away angles, collars up, faces behind glasses/awning posts/lamplight, hands in
pockets or holding something. Extend §2.d rule 4 to the whole painted crowd, not only the couples.

---

## 4. Rulings on the draft's open questions

### 4.1 Q1 — Route A / Route B: **A for the crowd, B rejected**

Route A (painted crowd) **PASS** for every non-candidate figure — zero assets, guaranteed one
printing run, and it is the right instinct. Route B (desaturated 16-bit sprites pushed through a
halftone filter) **FAIL**: inside the viewfinder everything the player sees is one photocopy, and
a square-pixel grid under a toner-dot grid is two printing runs in one frame — the family clause
(`art-direction.md` §2, "one printing run") does not bend for a filter. The `nearForegroundArt`
precedent is not applicable: those sprites live in the world, not inside the xerox lucarne.
`commandant_wait`'s recycling (§4) is fine — same tirage, painted or composited, non-candidate.

### 4.2 Q2 — `pair_facing`: **cannot be demoted. It is the ARRIVÉE master instant.**

Spec §A.13.1 line 1 keeps instant #1 at **24,00 × 13,50 su, valeurs inchangées** — « les deux
silhouettes entières se rejoignent à la table ». Fiction §3.2 stages it: _elle traverse la
terrasse, il se lève, il lui prend son manteau_. The draft's §4 proposal (demote it, let
`commandant_couple` carry the box alone) predates Rev.6.1 and contradicts it: the master track has
**three** drawn instants, and the packet delivers one. **This is the packet's largest hole.**

Round 3 owes me an **ARRIVÉE prompt**, with:

- the same face clause as §3, **verbatim** (see E1) — it is the same man, twelve seconds earlier;
- both figures **whole, standing, one ground line**, framed by the décor and never by anatomy
  (the v1 nude post-mortem applies unchanged, and « il lui prend son manteau » is a two-body
  contact gesture: the coat is the object, hands on a garment, never on a person);
- the same px/su rule as §2.1 (24 su box ⇒ 1024 px canvas ⇒ 42,7 px/su — **note that this is
  already 1,4× coarser than LA TABLE's 60,2**; the face clause must survive at 42,7 px/su or the
  ARRIVÉE beat teaches a face the player then cannot re-find).

### 4.3 Q5 + §3.0-bis — **the face reference does not exist. This is the eliminatory point.**

Maud carries her own refusal criterion (face legibility at max zoom) and asks me to treat it as
eliminatory. **I do — and I raise it one floor, because the problem is upstream of legibility.**

The shipped `boss/commander_*` prompts in `levelArt.json` describe: _a towering bare-headed french
police commander in a knee-length overcoat, reflective armband, shoulder radio_. **No face at
all** — no hair, no moustache, no jaw. Their gated identity tells are \*\*bare head + long overcoat

- armband + radio**. The terrace prompt gives a heavy-set man in a dark wool overcoat, no armband,
  no radio. Shared tells: **bare-headedness. That is all.\*\*

So today a player who zooms in on a perfectly rendered face has **nothing to compare it to**, and
the loop is decided before the render quality is. (Worse: `gen-boss-sprites.mjs` does not exist —
none of the nine boss PNGs is generated. There is no picture in the game of this man's face.)

**Ruling — the face is authored ONCE and propagated, and it is a family, not a prompt:**

1. The trait clause of §3 — `thick greying hair swept back, a broad moustache, square jaw,
bare-headed` — becomes **the Commandant's face clause**, and is inserted **verbatim** into the
   nine `boss/commander_*` prompts as well as into every `photoQte` pose that shows him. I gate
   that boss-family edit **now, pre-authorised**, so it does not cost a round: it is an addition
   of the same four tokens, it touches no silhouette, no armband, no radio, and it makes the two
   families one man.
2. `art-advisor` (Estelle) does **not** need to invent it — she checks it: four traits that
   survive coarse halftone at 42,7 px/su AND 16-bit pixel art is a hard brief, and if the
   moustache is the only one that survives both, I want to know before generation, not after.
3. **Dependency I re-flag, out of my lane and able to kill the loop:** the player must have SEEN
   this face before the set-piece (`lead-game-designer` + `narrative-designer`, draft §3.0-bis).
   If the answer is « at the Niveau Final boss, i.e. after », the discriminant is retroactive and
   the scene is a lottery. **I hold my asset-gate PASS on `commandant_couple` until that answer
   exists** — it is not an art defect, but it is a condition of the art meaning anything.

### 4.4 Q3 — period truth, pre-authorised clause

A November-1998 Paris terrace, open and occupied at night: glass wind screens, standing gas
heaters, rattan chairs, an awning. `art-advisor` confirms the exact furniture; **I pre-authorise a
single clause insertion in the plate prompt on her confirmation, without a new gate round** —
it is décor vocabulary, it moves nothing structural. Any other edit comes back to me.

### 4.5 Q4 — wider source crop: **PASS.** E-6(7) is continuity with the shipped décor; a wider

crop of `street-wide.png` increases the shared material, it does not dilute it. Condition
(inherited C1, v1 §4): the crop bounds are committed as a reference file and recorded in the
draft, so the plate is reproducible.

### 4.6 Q6 — the lookalike (§2.c-8): **painted, and he stays ALONE at his table.** Alone = F20

category 2 = non-photographable by construction, at zero asset cost. If he ever gains a companion
he becomes a seventh decoy and an authored track; he must not.

---

## 5. Q on my resolutions — they hold, with one addition

`plate` **2048×1152** (20,5 px/su) and poses **1024 / 512** stand. The dense scene does not
break them, because the density argument resolves itself: everything the player must _tell apart_
leaves the plate (§2), and the plate keeps the job it was sized for — a place, not evidence
(ruling §1.3). At 20,5 px/su the painted crowd gets 276 px per standing figure, which is ample
for the texture of a street and, as R2-bis says, **too much** for accidental anonymity.

**Addition to ruling §1.3, forced by Rev.6.1:**

> **LA PLATE NE PORTE AUCUN CANDIDAT.** The rule already said the plate carries no evidence; it
> now says the plate carries no _candidate_ either. Any element the mechanic tracks, boxes,
> stamps or asks the player to tell apart — `master` **and** `decoy` — is a cut-out authored per
> §1.2. The plate carries the crowd; it never carries a track.

---

## 6. Two bible rules I propose out of this round (§ to transcribe into `docs/art-direction.md`)

1. **RÈGLE — la netteté est un tell.** Any element the mechanic asks the player to distinguish
   from its decoys is authored at the **same px/su and the same dot pitch** as those decoys. A
   target rendered denser than its neighbours is identifiable without being recognised: the
   picture answers the question the gameplay was supposed to ask.
2. **RÈGLE — le gate rend un verdict de scène avant ses verdicts d'asset.** Before any per-asset
   PASS/FAIL, the gate states in one sentence _what the player is asked to look at, and how many
   plausible candidates the image offers him._ A set of assets each correct on its own axis can
   compose into a scene with one thing in it — that is exactly how v1 shipped a « photograph
   here » sign, and no per-asset criterion caught it.

I will carry both into the bible as a separate edit, not smuggled into this verdict.

---

## 7. Write authorisation

**NO. `concept-artist` may NOT write to `src/game/levels/levelArt.json`.** The packet is
incomplete (ARRIVÉE absent, six decoy prompts absent) and the plate prompt carries two blocking
reworks; ids and counts depend on the (a)/(b) fork of §2.1, which is not mine.

Banked so round 3 does not re-litigate it: **the `commandant_couple` string of §3 is PASSED as
text**, conditional on

- **E1** — the face clause becomes the propagated family clause (§4.3.1), identical token for
  token everywhere the man appears (in this prompt it does not change a character — it changes
  status: it is now quoted, not invented here);
- **E2 — considered and REFUSED, recorded so nobody proposes it in round 3.** I was going to ask
  for `the corner of one further round table just entering the frame`, so the cut-out does not
  read as an island at the tightest framing (spec §A.13.3.d expects « un bout de table voisine
  dans le cadre »). **It must not be drawn:** F12(1b) measures the opaque AABB of the _enumerated_
  elements, and a neighbouring table corner is opaque pixels outside that enumeration — it would
  inflate the box and fail the interval check. The neighbouring tables enter the frame **as their
  own decoy sprites** (§2), which is exactly what R3 buys. Same prohibition on all seven candidate
  cut-outs: **nothing in a candidate sprite that is not in its enumerated set.**

Everything I ratify explicitly, so it is not reopened: the pivot to the terrace, the choice of
gesture over the kiss/walk/gift (§3.0 — the reasoning is exactly right, and « le geste ne
discrimine plus rien, seul le visage discrimine » is the best sentence in the packet), the
uniform trap and its three locks (§3.0-bis), the reinforced nude post-mortem (§3), the table rule
§2.d as a **contract** rather than a composition choice, and the semantic separation « le contexte
accuse, le gros plan identifie » (§4.b).

### 7.1 `berline_plate` — the separation is ratified, the "no regeneration" is not (C1, C2)

Point 4's _principle_ is right and I ratify it: the double-file offence belongs to the décor, the
identification belongs to the close-up. Two conditions before the no-regeneration claim can stand:

- **C1** — R1 above. Without it, the reused sprite is not reused, it is duplicated.
- **C2 — perspective coherence, judged at the asset gate on the delivered plate.** In v1 the plate
  had no vehicles and a square-on rear « parallel to the picture plane » cost nothing. The v2
  plate is an explicitly perspectival plunging view with a parked row converging up the street. A
  square-on rear composited into that geometry can read as a sticker, and _perspective-incoherent
  = automatic FAIL_ is a clause I apply to my own reuse decisions too. If it reads as a sticker on
  the delivered plate, `berline_plate` gets **one** re-generation inside the cap, on the viewing
  angle only. No other change.

---

## 8. Still owed to me

| Owner                                       | Item                                                                                                                                                                                                                                                                 |
| ------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `concept-artist`                            | Round 3 draft: plate with R1+R2, **ARRIVÉE** prompt (§4.2), **6 decoy-table prompts** (§2), E1 propagated to the nine `boss/commander_*` prompts                                                                                                                     |
| `art-advisor`                               | Four face traits that survive halftone at 42,7 px/su **and** 16-bit pixel art (§4.3.2); terrace period furniture (§4.4)                                                                                                                                              |
| `gpu-specialist` + `dev-tooling-assets`     | The (a) 6-unique / (b) 3×2 decoy fork and its VRAM bill (§2.1); per-asset `pxPerSu` next to every candidate box                                                                                                                                                      |
| `lead-game-designer` + `narrative-designer` | Where the player sees the Commandant's face **before** this scene (§4.3.3) — can kill the loop                                                                                                                                                                       |
| `lead-art` (me)                             | Round-3 prompt gate · asset gate on the delivered PNGs incl. the AI-defect sweep (this set now has **fourteen hands on tables**, the highest hand-defect exposure we have ever shipped) · composite gate on the sweep and the plate characters, unchanged from v1 §7 |

Signé — Nico, `lead-art`.
