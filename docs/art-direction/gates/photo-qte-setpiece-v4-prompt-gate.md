# PROMPT GATE — `photoQte` set-piece **v4 / round 4** (Nico, `lead-art`, 2026-08-05)

Subject: `docs/art-direction/prompt-drafts/photo-qte-setpiece-v4.md` (Maud, DRAFT v4).
Gated against: gate v3 (`photo-qte-setpiece-v3-prompt-gate.md`, D0-D4), spec
`spec-photo-qte-paparazzi.md` **Rev.6.2 §A.14 (F21, F22)**,
`photo-qte-resolution-and-sweep-ruling.md` §1.2-§1.4, `docs/art-direction.md` §2-§4.

> **GLOBAL VERDICT: FAIL — three defects, one of them eliminatory. Everything else is
> PASS and banked.**
> **Authorised to commit in `src/game/levels/levelArt.json`: the `boss.$comment` line
> ONLY (verified: `git diff` = 1 line, `photoQte` untouched).**
> **The `photoQte` block stays frozen.** Three chains return in round 5: `plate`,
> `berline_double_file`, `berline_decoy` (+ one re-cut of `decoy_table_c`).

I re-opened `public/assets/boss/commander_exposed.png` before writing this. Bald, no hair
mass, clean-shaven, heavy brow, square jutting jaw, thick neck on heavy shoulders, long
knee-length overcoat. **The §1 clause is faithful, token for token** — this is the method
D0 demanded, executed. The direction ruling is right and I endorse it without reserve: this
image has no fine trait, and no amount of px/su was ever going to grow one.

---

## What passes, and is banked (not to be reopened)

| Item                                                                                                                   | Verdict                                                                                                                                                                  |
| ---------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **§1 clause de traits**, observed on both PNGs, cast-coherence only                                                    | **PASS** — quoted verbatim in both families or not at all (E1 mechanism stands)                                                                                          |
| **D3 / 1536 canvas** now optional                                                                                      | **PASS** — I withdraw the px/su-equality demand as blocking; `gpu-specialist` decides on cost alone                                                                      |
| **§3 near-miss rule transposed to scene signals** (form)                                                               | **PASS on the form**, FAIL on its application to `_c` — see D5                                                                                                           |
| **§5 R5 — hand motif quoted VERBATIM on `_a`, `_c`, `_e`**                                                             | **PASS** — this was round 3's worst defect and it is properly closed. A paraphrase is another ink; you did not paraphrase                                                |
| **§5 decoy tables `_b`, `_d`, `_e`, `_f`** (openings/closings verbatim, one ground line, enumerated set, cast hygiene) | **PASS**                                                                                                                                                                 |
| **§6 all-bands discriminant audit, written**                                                                           | **PASS** — this is now the model for any dense-scene set in this project                                                                                                 |
| **§8 revert + traceability in `boss.$comment` + the seven boss prompts left UNCHANGED**                                | **PASS.** The judgement not to spend a pre-authorisation you no longer hold is exactly right. The naive-replace bug you reproduced and logged is worth more than the fix |
| **§2.2 — the car is a cutout, not paint**                                                                              | **PASS**, and your R1-twin argument is the correct one                                                                                                                   |

---

## D5 (ELIMINATORY) — `decoy_table_c` carries the whole sufficient conjunction. F22 breach, and F21 collapses with it.

Your §3 table gives `_c`: car out of line **with driver** (signal 1, complete) **and**
tailored suit + stiff briefcase (signal 2, complete), missing only the déroulé. §6 confirms
it on two rows.

Spec Rev.6.2 is explicit: **F22 — no decoy carries both early signals**, and **F21 — the
conjunction `1 ∧ 2` must designate a _unique_ candidate before `masterOpenAt −
IDENTIFICATION_LEAD_FLOOR` (28,5 s)**. With `_c` as drafted, `1 ∧ 2` designates **two**
tables. Disambiguation then requires signal 3, which resolves at ~53 s — **12,7 s after the
master proof window has closed.** That is the precise failure A14.3 was written to kill, and
v4 re-imports it through the door of a rule I wrote myself.

**The cause is mine as much as yours:** R4 ("a near-miss for each of the N signals") was
authored when the N signals were interchangeable face traits. They are not interchangeable
any more — signal 3 is _declared redundant_ by A14.2. A near-miss on a redundant signal is
not a near-miss, it is a **second target**.

### RULING R7 — amendment to R4, and a bible rule I am proposing

> **The near-miss rule applies only to signals that are load-bearing for identification.
> No decoy may carry the full sufficient conjunction, whatever it lacks elsewhere.**
> Where the identification is carried by a subset `S` of the signals, the decoy set must
> contain, for each signal _in `S`_, a decoy holding `S` minus that one — and **nothing
> outside `S` can buy a decoy the right to hold all of `S`.**

Applied here (`S = {1, 2}`, N−1 = 1 carrier per signal, which is why the spec's 2/2/2
distribution fits six decoys exactly):

- **`_c` must lose one of the two early signals.** My preference: it keeps **signal 2**
  (tailleur + serviette rigide — it is the better-drawn half and lives in the sprite you own)
  and **loses signal 1**: its car goes back **parked in the row**. Rewrite the §3 row
  accordingly; the sprite chain itself needs no change beyond the placement contract.
- `_a` (signal 2 complete, signal 1 incomplete — no driver) is **legal**, keep it.
- `_b` (signal 1 complete, no professional marker) is **legal**, keep it.
- The "quasi-manqué on signal 3" slot is **deleted from the budget**, not reassigned. Signal
  3 is redundant; it needs no near-miss. That frees a leurre lointain, which is a gain.

---

## D6 (blocking, cheap) — the plate still paints furniture under the cutouts. You fixed half of it.

You caught the real contradiction and I thank you for catching it against my own PASS: seven
painted couples under seven cut-out couples is exactly the composition defect the addition
rule forbids, and I validated it. **That is my miss and it is now on the record.**

But the correction stops one layer short. Each candidate cutout's enumerated set is _two
seated people **+ two bistro chairs + one round table** + what is on it_. So
`seven small round pavement tables standing empty with their bistro chairs in place`
paints **seven tables and fourteen chairs underneath seven tables and fourteen chairs.**
Same defect, one level down: doubled table edges, doubled chair legs, a second ground line
through the cutout's feet.

### RULING R8 — the plate paints the _place_, never the _furniture of a candidate_

Apply to the tables the exact reasoning you applied to the car in §2.2: the plate provides
**the empty slot**, the cutout provides **everything that stands in it**.

> `a clear stretch of open terrace pavement under the awning, wet flagstones catching the
lamplight, no tables and no chairs on it`

…kept as one described emplacement under the bistro awning, sized to hold the seven
candidate positions. The **three dead tables stay painted** as drafted (lone reader / chairs
up on the tabletop / hidden behind the awning post) — they are what makes the empty stretch
read as _a terrace with room_ rather than _a hole in the drawing_, and they carry the R2
count. Awning, tiled wall, shopfronts: unchanged.

This costs you one clause and buys the same guarantee-by-construction as the roadway slot.

---

## D7 (blocking) — signal n°1 cannot live behind a windscreen. Answer to your question 1.

You are right to distrust it, and you undersell the problem. At **20,5 px/su** the whole
saloon is a small horizontal mass; the cabin is a few pixels of dark glass; the coarse
halftone dot is 6-8 px. **A head behind glass is at best one dot.** The _coarsest and most
important_ signal in the scene would rest on the finest mark in the picture — that is
"Silhouette first" (§art-direction.md law 4) inverted, and it is an automatic FAIL.

**I also reject your fallback as drafted.** An open driver's door does not say _he is
waiting_, it says _someone just got out, or is about to get in_ — and in high-contrast xerox
a black notch in a dark car at plate scale is indistinguishable from the gaps in the parked
row. Right instinct (make it a mass), wrong noun.

### RULING R9 — the waiting driver is a mass BESIDE the car, not a value inside it

> **`berline_double_file`**: the uniformed driver **stands at the car**, cap on, in a dark
> uniform coat, hand resting on the roof or the door frame, waiting — a **vertical mass
> against the car's horizontal mass**, planted on the same wet tarmac, on the traffic side.
> **`berline_decoy`**: the same body, same angle, **nobody at it, cabin dark, doors shut,
> nothing standing on the tarmac beside it.**

The contrast becomes **mass present vs mass absent**, which survives any trame, any px/su,
and any keying. It also _says the thing better_: a chauffeur standing to attention beside a
double-parked car is the whole accusation — _venu en fonction_ — in one silhouette. The open
door is retained only as a **cumulative** token on the double-file car (standing driver **+**
open door), never as the carrier.

Everything else in your §4 stands: `seen from the same high dormer angle` is exactly how C2
should have been answered from the start (named, therefore reproducible — not hoped for), and
`the car empty otherwise` is textbook positive-shape phrasing. Keep both verbatim.

**One art constraint the departure inherits:** no frame may show the standing driver sliding
down the street. Either the departure swaps to a driver-seated variant one beat before the
translation, or the translation starts from a state where he is aboard. Mechanic's choice,
one sprite either way; I only forbid the sliding man.

---

## Answer to your question 2 — the DÉPART: what the art requires

**Nothing to invent, and no fourth instant.** Here is the art requirement, stated so the
mechanic can supply the data:

1. **A car leaving does not read "he leaves alone and she stays".** It reads "a car leaves".
   If signal 3 is to exist at all as authored, **the table must visibly change state**.
2. **That change is a sprite swap on the master candidate, not a new box.** The candidate
   track is continuous at every scene time (§2.1) — the master's AABB, its `pxPerSu` and its
   enumerated set are already authored and already asserted × 7 in §7.2.a. What art needs is
   **one additional sprite** and **one authored swap time**, no `openAt/closeAt`, no
   instant, no floor:
   - **`commandant_table_apres`** — the same table, the same chair positions, the same
     ground line, the same box: **the woman alone**, the man's chair empty and pushed back,
     the folder now open in front of her. Enumerated set = one seated person + two chairs +
     one round table + what is on it. Opening/closing clauses verbatim from
     `commandant_couple`. Same canvas, same px/su. **`concept-artist` can write this chain
     without any new datum from the spec.**
3. **F18 hygiene:** a table that changes state late must not be a unique channel. `_a`, `_b`
   and `_e` already claim an arrive/leave déroulé; at least two of them must therefore also
   change state in the same late window — for a decoy, "the couple leaves" (cutout removed,
   empty slot revealed) is enough, and it is a _different_ event from "the couple halves",
   which is precisely why the master's swap remains a content signal and not a render tell.
4. **Redundancy is preserved**: signal 3 still resolves at ~53 s, still pays only the bonus
   instant, still cannot be required (F21). Nothing above touches that.

So: **hypothesis "translation de la berline" is insufficient on its own; hypothesis "4th pose"
is over-engineered.** The answer is one swap sprite on an existing box. `game-designer` owes
only the **swap timestamp** (and the same for the two decoy removals).

---

## Answers to your questions 2 and 3 (as numbered in the draft)

- **Six distinct seeds — yes, confirmed.** The verbatim hand motif is content shared _on
  purpose_; identical seeds would share the _drawing_, which is a family tell. One seed per
  leurre, no exception.
- **The painted lone lookalike (round-2 Q6) — keep it.** It no longer imitates anything, and
  that is the point: it thickens the crowd for free and it costs the player one glance. Under
  R8 he sits at one of the **three dead tables** (the lone reader), which is where he was
  always meant to be.

---

## Verdict on `src/game/levels/levelArt.json`

- **`boss.$comment` (1 line, current working diff): PASS — commit it.** It is documentation,
  it contains no prompt string, `check-art-prompts` is green, and it records the exact thing
  this project keeps forgetting: _le PNG livré est la référence, jamais le prompt_.
- **The `photoQte` block: NO WRITE.** D5 changes a leurre's contract, D6 changes the plate,
  D7 changes both vehicle chains. Writing now would ship the F22 breach into the file.
- Your `origin/main`-vs-working-diff call in §8 is **correct and I ratify it**; the verdict's
  wording was sloppy, the intent was the working diff. `dev-tooling-assets` is on notice.

---

## Round 5 — scope, and does it converge?

**It converges. There is no design problem left.** The pivot to the scene is the right call
and it is the first version of this set-piece whose discrimination I can defend in front of a
player: the coarse signal is coarse, the fine signal only confirms, and the late signal only
pays a bonus. Rounds 1-3 were a design problem wearing an art costume — this one is craft.

Round 5 is **three chains and one row**, and I expect to PASS it:

1. `plate` — R8 applied (candidate emplacement painted empty of furniture; three dead tables
   kept).
2. `berline_double_file` / `berline_decoy` — R9 applied (standing uniformed driver vs nothing
   beside the car).
3. `decoy_table_c` — signal 1 removed from its contract (car back in the parked row); §3 and
   §6 tables re-tabulated under **R7**; the freed near-miss slot returns to the leurres
   lointains.
4. Optional, and welcome now rather than later: `commandant_table_apres` per the §"DÉPART"
   ruling above.

Everything banked above is out of scope for round 5 and must not be rewritten.

**Still owed, unchanged owners:** `game-designer` — the departure swap timestamp + the two
decoy removals, and where the placement/déroulé contracts are asserted in CI;
`art-advisor` — terrace furniture Nov. 1998; `gpu-specialist` + `dev-tooling-assets` — fork
(a)/(b), the two (now three) extra vehicle/table sprites, `pxPerSu` per candidate, crop
bounds; `narrative-designer` — the uniformed driver as a witness (worth a line, and R9 makes
him visible enough to deserve one); `lead-art` — round 5 gate, then the asset gate with the
full anti-defect sweep (fourteen hands on tables, four on the coat at ARRIVÉE, and now a
standing figure whose legs must join his hips).
