# PROMPT GATE — `photoQte` set-piece **v3 / round 3** (Nico, `lead-art`, 2026-08-05)

Subject: `docs/art-direction/prompt-drafts/photo-qte-setpiece-v3.md` (Maud, DRAFT v3).
Gated against: gate v2 (`photo-qte-setpiece-v2-prompt-gate.md`), spec
`spec-photo-qte-paparazzi.md` Rev.6.1 §A.13, `photo-qte-resolution-and-sweep-ruling.md`
§1.2-§1.4, `docs/art-direction.md` §2-§4.

> **GLOBAL VERDICT: FAIL — five named defects. D0 is mine, and it voids the content of
> the one thing I pre-authorised.**
> **NO write to the `photoQte` block of `src/game/levels/levelArt.json`.**
> The R1/R2/R2-bis/R3 corrections are **accepted and banked**; the ARRIVÉE prompt is
> written and is 90 % right. What fails is the _decoy set as a system_: the discrimination
> it is supposed to protect can still be won without reading the face.

---

## D0 (eliminatory, and my error) — **the face exists, and the clause does not look like him**

My round-2 gate asserted « aucun des neuf PNG boss n'est généré » and « il n'y a aucune
image de ce visage dans le jeu ». **That is false.** `public/assets/boss/` ships nine PNGs,
seven of them `commander_*`. I have now read `commander_exposed.png` and
`commander_shielded.png` myself, on a contrasting background.

**What the shipped Commandant actually looks like:** a heavy, hard-featured man,
**clean-shaven**, **no moustache**, hair **shaved or cropped to nothing** (`shielded` reads
as a bare skull, `exposed` as a very short receding crop), **heavy brow, deep-set eyes,
square jutting jaw, thick neck**. Of the four tokens E1 propagated —
`thick greying hair swept back, a broad moustache and a square jaw`, `bare-headed` — only
**bare-headed** and **square jaw** are true of him. The two others describe a different man.

So I pre-authorised E1 on a false premise, and the premise was false in my favour: I
allowed a clause to be invented because I believed there was nothing to be faithful to.
There was. **The correct method was never « author the face once », it was « read the face
we shipped and write it down ».**

### Ruling

1. **E1's CONTENT is revoked.** `thick greying hair swept back, a broad moustache` must not
   enter any prompt, boss or `photoQte`. Shipping it would regenerate the boss as a
   different man and, worse, would make the set-piece target unlike the boss the player
   actually meets — the exact failure E1 existed to prevent, arrived at from the far side.
2. **E1's MECHANISM stands and I re-ratify it:** one face clause, quoted verbatim in both
   families, any change a family edit (boss + photoQte in one commit), never a per-prompt
   tweak. Only the four tokens change.
3. **The shipped PNGs are the reference, not the prompts.** The new clause is _derived by
   observation_ from `commander_exposed.png` + `commander_shielded.png`, and it is
   `concept-artist`'s to write and mine to gate in round 4. It must be true of **both**
   sprites (they already disagree on hair: bare skull vs short crop — the clause resolves
   that by naming what both show, i.e. no hair mass at all, not by picking one).
4. **Consequence I will not paper over: this cast has no fine-detail trait.** The
   discriminant set the images give us is **all masses** — bald/cropped head, heavy brow,
   square jutting jaw, heavy build. The moustache was the only detail token and it was
   invented. Two live consequences:
   - **Good news for D3/legibility:** masses survive coarse halftone far better than a
     moustache does, so Maud's own 42,7 px/su alert largely dissolves. My D3 ruling below
     therefore rests **only** on the px/su-equality argument (soft-in-a-sharp-set is a
     tell), not on legibility. It stands unchanged.
   - **Bad news for the decoy set:** `decoy_table_c` — _a tall bald man, clean-shaven_ — is
     no longer a leurre. Under the corrected clause he carries **three of four** target
     traits and differs only on build. He is currently the second most target-looking man
     on the terrace, by accident. The whole set must be re-audited against the corrected
     clause (see D1).
   - If, after observation, the corrected clause yields fewer than four usable traits, that
     is a **design fact**, not an art defect: come back to me with N and I re-rule the
     decoy budget with `lead-game-designer`. Do **not** invent a fifth trait to reach four.
5. **Do NOT retrofit the shipped PNGs.** Nothing here asks for a boss re-roll. The images
   are the ground truth; the text catches up to them.

**Everything in §5 (D4) and §6 below is superseded on one point:** the seven
`commander_*` prompt strings are **no longer PASS**. The whole working diff on
`src/game/levels/levelArt.json` — seven prompts **and** the misplaced `loot.$comment` —
**reverts to `origin/main`**, and E1 returns in round 4 as one clean family edit with the
corrected tokens.

---

## 0. Scene verdict first (bible rule proposed in gate v2 §6.2, applied here)

> The player is asked to find, among **seven identically framed terrace tables**, the one
> couple whose man carries four face traits. As drafted, he can find it **without looking
> at a face**: two of the seven traits-pairs are unique to the target, and the target is
> the only table in the set where **two people's hands meet on the cloth**. The scene
> currently offers ~1,5 plausible candidates, not 7.

That is the same disease as v1 and v2 in its third costume: v1 wrote the sign in
emptiness, v2 wrote it in sharpness, **v3 writes it in combinatorics and in gesture.**

---

## 1. What I ratify, definitively, so round 4 never reopens it

| Item                                                                                                                   | Verdict                                                                                                                                                                                                                                                                         |
| ---------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `plate` v3 (R1 empty slot, R2 10 tables = 7+3, R2-bis authored anonymity)                                              | **PASS as text.** Verbatim reworks applied correctly; the three dead tables are enumerated, not wished. The « l'emplacement vide _attend_ la voiture et reste après son départ » reading is better than my own note.                                                            |
| §2.0 contract: same box 17,00×9,56 su, same 1024 canvas, **60,2 px/su**, same 6-8 px dot pitch for all candidates      | **PASS** — this is R3 honoured. Checked string by string on the six decoys.                                                                                                                                                                                                     |
| Opening + closing **verbatim identical** to `commandant_couple`                                                        | **PASS, verified character by character.** Opening (`two fully dressed customers … on one ground line:`) and closing (`behind them the glowing awning of the bistro and a wall of tiles, at their feet the wet pavement`) match the v2.2 frozen target string. No staging tell. |
| §2.0.2 E2 prohibition (nothing outside the enumerated set)                                                             | **PASS**, and correctly recorded as dead so nobody re-proposes the neighbouring table corner.                                                                                                                                                                                   |
| §2.0.3 identical enumerated set, §2.0.4 mono-frame                                                                     | **PASS**                                                                                                                                                                                                                                                                        |
| Route A ratified / Route B refused, the lookalike alone, `berline_plate` C1+C2 (§4)                                    | **PASS** — including the written commitment that the C2 re-roll changes the viewing angle and nothing else.                                                                                                                                                                     |
| `commandant_arrivee` **as staging** (both whole, standing, one ground line, explicit gap, coat-as-object, face taught) | **PASS as staging.** `both hands holding a folded pale coat by its shoulders, arms lowered` is the correct literal answer to gate v2 §4.2, and « le paquet est déjà posé et fermé à l'arrivée » closes a payment reading I had not asked for and should have.                   |
| E1 propagated to the seven `commander_*` prompts                                                                       | **PASS as text**, four tokens, no silhouette touched. Conditional on **D4** below.                                                                                                                                                                                              |

---

## 2. D1 (blocking) — **two traits are enough. §2.0 rule 5 is inverted.**

> **Read under D0.** The trait audit below was run against the traits as drafted. Those
> traits are now void. **The rule this section produces is what survives and is binding;
> the specific four-name audit is re-run in round 4 against the corrected clause.** I keep
> the worked audit here because it shows exactly how the failure is diagnosed, and because
> the same shortcut is already visible in the corrected cast: `_c` (bald, clean-shaven)
> will carry three of four corrected traits, and nothing in the set will be built to defeat
> the pair {bare-headed + heavy square jaw}, which is the coarsest pair of all.

Rule 5 reads: _« Aucun leurre ne porte un seul des quatre traits … Un leurre peut être tête
nue **ou** moustachu, jamais les deux. »_ That rule is the defect, not the protection.
Forbidding combinations is precisely what makes a **short combination sufficient**.

Audit of the six decoys as written:

| Trait                         | Carried by                                                                                         |
| ----------------------------- | -------------------------------------------------------------------------------------------------- |
| broad moustache               | `_e` only                                                                                          |
| bare-headed                   | `_c` (bald), `_e` (no headwear named)                                                              |
| thick greying hair swept back | **nobody.** `_f` has _greying sideburns_ under a homburg — hatted hair is not swept-back grey hair |
| square jaw                    | **nobody**                                                                                         |

Consequences, and they are fatal:

- **{bare-headed + greying hair}** → no decoy. Those are the two **coarsest** traits, the
  two Maud herself says survive as masses. The player who holds only those two — no
  moustache reading, no jaw reading, no zoom past the establishing framing — cuts straight
  to the target.
- **{greying hair + moustache}** → no decoy. Same shortcut.
- The only pair properly defended is {bare-headed + moustache} (`_e`) — i.e. she
  distributed the **finest** trait and left the **coarsest** pair unique. The audit is
  exactly inverted relative to what the halftone does to detail.

**Rework R4 — the near-miss quartet.** Rule 5 is rewritten as its opposite:

> **RÈGLE — le leurre porte la combinaison, jamais la collection complète.** For a target
> defined by N identity traits, the decoy set must contain, **for each trait**, at least
> one decoy carrying the other **N−1** and lacking only that one. Only the full N is
> forbidden. Otherwise a sub-set of traits shorter than N is sufficient and the zoom stops
> being a verification: it becomes a filter.

With N = 4 this costs **four** of the six decoys (one near-miss per trait); the remaining
two stay far leurres so the establishing framing keeps its variety. `_d` — currently the
« calibre maximal » — is the natural first of the four, and it is currently a _far_ leurre
(cap + dark eyebrows + clean-shaven = it lacks three of the four). Concretely, round 4
owes me:

- a decoy **greying-swept-back + moustache + square jaw, but hatted** (lacks bare-headed);
- a decoy **bare-headed + greying-swept-back + square jaw, clean-shaven** (lacks moustache);
- a decoy **bare-headed + moustache + square jaw, dark or bald head** (lacks grey) — `_c`
  or `_e` are two thirds of the way there already;
- a decoy **bare-headed + greying-swept-back + moustache, narrow/soft jaw** (lacks jaw).

Yes, four near-misses is harsh. That is the price of a four-trait discriminant, and it is
the only configuration in which the four traits all _mean_ something. If the design cannot
afford four near-misses, the answer is to reduce N in the family clause — **which is a
family edit and comes back to me**, not to leave N = 4 with two of them free.

## 3. D2 (blocking) — **the gesture discriminates. It was not distributed.**

The target string ends its middle block with:
`on the tablecloth between them their two hands rest side by side on the cloth, fingers
loosely folded together`. **No decoy has a two-person hand contact on the cloth.** `_b` has
_both hands flat on the cloth_ (one person), `_e` _both hands resting side by side on the
cloth_ (one woman's own two hands). Neither is a joined pair across the table.

Two joined hands in the centre of a round tabletop are a **mid-frequency dark mass** — it
survives the toner, it survives 60,2 px/su, and it is readable at the establishing framing
where the face is not. It is therefore a **coarser discriminant than the face**, and gate
v2 ratified the opposite doctrine — « le geste ne discrimine plus rien, seul le visage
discrimine » — which §2.0 rule 6 of this very draft restates and then contradicts four
lines below.

**Rework R5:** at least **three** of the six decoys carry the joined-hands motif, quoted
**verbatim** from the target string (`their two hands rest side by side on the cloth,
fingers loosely folded together`). Not paraphrased — a paraphrase is a different ink shape.
General clause, opposable at the asset gate:

> **RÈGLE — tout discriminant plus grossier que le discriminant voulu doit être distribué,
> ou il devient le discriminant réel.** The trait audit runs over _every_ frequency band of
> the image — pose, gesture, silhouette mass, value — not only over the band the designer
> chose to make meaningful.

Run that audit once more over the whole set before round 4: I have checked pose and
gesture; check also value (the target's woman wears `a belted pale coat` — `_c` and `_f`
carry pale coats, so value is fine, but say so in writing) and tabletop objects (`_d` and
`_f` already echo the target's `two tall glasses, a coffee cup` triple — good, keep it).

## 4. D3 (blocking) — **the master is the softest sprite in its own scene**

§2.0 opens: _« Ces règles valent pour `commandant_couple` **et** pour les six
`decoy*table*_`»* — and §3 then authors`commandant_arrivee` at **42,7 px/su**, i.e.
1,4× coarser than every candidate sprite in the set. That is the packet contradicting its
own contract on the one sprite whose job is to **teach** the face. Soft-in-a-sharp-set is
a tell in the same way sharp-in-a-soft-set is; it is the same rule with the sign flipped.

Maud raises this as an _alerte_ and proposes, if only one trait survives, to amend the
clause **en famille**. **I rule the opposite way: the clause is not reduced. The canvas is
raised.**

- The trait cull is refused. Cull to one surviving trait and the discriminant becomes « a
  moustache » — which `_e` already defeats by design, and which D1's rework will make three
  decoys defeat. A one-trait discriminant is not a hard scene, it is a coin flip.
- **`commandant_arrivee` moves to a 1536 px canvas on its 24,00 su box ⇒ 64,0 px/su**,
  within 6 % of the candidate class's 60,2 and with the same 6-8 px dot pitch. The four
  traits are then read at a density where jaw and hair are shapes, not masses, and the
  pedagogic beat does its job. The VRAM delta is one sprite; it goes on Ben's bill next to
  the (a)/(b) fork, and if he refuses it, he refuses it to me in writing and I re-rule.
- I ratify the **mechanism** she proposes: any future change to the four traits is a
  **family edit** (boss + photoQte in one commit), never a per-pose tweak. `art-advisor`
  still owes the survivability check, but it now bears on 64,0 px/su, not 42,7 — and its
  possible answer « only one trait survives » no longer decides alone: it comes back to me
  as a family-edit proposal.

## 5. D4 (blocking, mechanical) — **E1 was written into the wrong block**

`git diff src/game/levels/levelArt.json` on this worktree: 8 insertions / 8 deletions.
Seven are the `commander_*` prompts — correct, pre-authorised, PASS. **The eighth is the
`loot.$comment`**, which now ends with the FACE CLAUSE traceability paragraph about the
Commandant. §6 of the draft claims « `boss.$comment` reçoit la traçabilité » —
`boss.$comment` is untouched.

Nobody's gate covers that block this round, and a future reader of the loot crate entry
will find a paragraph about a police commander's moustache. **Rework R6:** revert the
`loot.$comment` to its `origin/main` state byte for byte, and append the same paragraph to
`boss.$comment`. No other change rides along.

**Point 4 of the brief — verified and clean otherwise: the `photoQte` block is untouched.**

---

## 6. Write authorisation

- **`photoQte` block of `src/game/levels/levelArt.json`: NO.** Four blocking defects, and
  the decoy set is the object of two of them; ids, counts and the (a)/(b) fork are still
  not mine to settle.
- **`boss/commander_*` prompts: NO — revoked by D0.** The seven strings carry a moustache
  and swept-back grey hair the shipped sprites do not have. **Revert the entire working
  diff on `src/game/levels/levelArt.json` to `origin/main`** (seven prompts + the misplaced
  `loot.$comment`, which R6 covers). E1 comes back in round 4 as ONE family edit with the
  observation-derived clause, and I gate it then — the pre-authorisation is spent.

Banked as PASSED text, not to be rewritten in round 4: the `plate` v3 string, the §2.0
contract (rules 1-4 and 6), the `commandant_arrivee` string **except** its px/su and
**except** whatever R4/R5 add to the family's shared clauses, and the six decoy
openings/closings.

## 7. Answers to the draft's §8 open questions

1. **Seeds** — six distinct seeds under the same `style` block, as she leans. Same seed
   across seven near-identical prompts is how you get seven near-identical faces, which is
   worse than style drift; drift is what the shared `style` block and the dot-pitch rule
   exist to hold. Ratified.
2. **Fork (b) pairing/positions** — the constraint « jamais adjacents, jamais dans un même
   cadre légal » is a **spec** constraint (`game-designer`), because only the spec knows
   what a legal frame is and only the spec can assert it in CI. Placement executes it.
   Recorded as owed if (b) is chosen.
3. **`commandant_wait`** — keep it as a painted non-candidate figurant. It costs nothing,
   it is already gated, and it thickens the crowd Route A now carries alone.

## 8. Still owed to me for round 4

| Owner                                       | Item                                                                                                                                                                                                                                                                                                                                               |
| ------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `concept-artist`                            | **R0 (first, everything else depends on it)** — read `public/assets/boss/commander_exposed.png` and `commander_shielded.png` and write the face clause **from the images**: four tokens true of both sprites, no invention. Then re-derive `commandant_couple`, `commandant_arrivee` and the six decoys from it, and revert the levelArt.json diff |
| `concept-artist`                            | **R4** near-miss quartet (rule 5 rewritten + 4 decoys re-specified), **R5** joined-hands motif in ≥3 decoys verbatim + the full-frequency discriminant audit in writing, **R6** revert `loot.$comment` / append to `boss.$comment`, **D3** `commandant_arrivee` at 1536 / 64,0 px/su in §3 and §5                                                  |
| `art-advisor`                               | **Corrected** (observation-derived) traits at **64,0 px/su** **and** 16-bit pixel art — and, given D0.4, the harder question: does an all-mass discriminant set survive a seated coated crowd at 60,2 px/su, or does the cast need a fine trait it does not currently have? Terrace furniture (pre-authorised clause) unchanged                    |
| `gpu-specialist` + `dev-tooling-assets`     | (a)/(b) fork + VRAM incl. the ARRIVÉE 1536 delta; `pxPerSu` per candidate; source-crop bounds                                                                                                                                                                                                                                                      |
| `lead-game-designer` + `narrative-designer` | Where the player sees this face **before** the scene — **materially easier now**: the boss sprites exist and the face is legible, so the question is no longer « does an image exist » but « does the player meet him before the terrace, or only after ». Still able to kill the loop                                                             |
| `lead-art` (me)                             | Round-4 prompt gate; asset gate incl. the AI-defect sweep (**fourteen hands on tables**, plus four more on the coat at ARRIVÉE)                                                                                                                                                                                                                    |

**Bible rule I propose out of D0** (to transcribe into `docs/art-direction.md`, third of the
series started at gate v2 §6):

> **RÈGLE — le PNG livré est la référence, jamais le prompt.** Before writing or extending
> any clause that describes an existing asset, the author **opens the shipped PNG**. A
> prompt is what we asked for; the PNG is what the family looks like. Where they disagree,
> the PNG wins and the prompt is corrected to it. A gate that authorises a description of
> an asset it has not looked at is not a gate — that is how this packet spent a round
> propagating a moustache no character has.

Round 4 must be a **single-variable pass** on D0-D4, D0 first. If it does not close them, I stop
iterating and escalate the discriminant design itself (N traits vs decoy budget) to
Bertrand rather than burn a fifth round.

Signé — Nico, `lead-art`.
