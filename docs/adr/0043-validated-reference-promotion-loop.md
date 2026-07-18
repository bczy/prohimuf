# 0043 — Validated-reference promotion loop (internal hero → style-lock family derivation)

- **Status:** Accepted (2026-07-18)
- **Date:** 2026-07-18
- **Number:** 0043, **self-allocated** by `senior-architect` (no `producer` in the loop
  for this design session; Bertrand directed the scaffold via the `adr-new` skill —
  same sanctioned exception as ADR-0044). Collision-checked against local `docs/adr/`,
  the index, and `origin/main`. Re-check at merge per `adr-new` Step 4: at merge the
  ad-hoc base collided with main's 0042 (tech-scout lane) and was renumbered 0042→0044;
  this ADR kept 0043 (free on main).
- **Extends:** ADR-0044 (ad-hoc kontext reference-conditioned iteration). This ADR
  builds the _feedback half_ ADR-0044 deliberately left out; it does not supersede it —
  the manual `--ref` path stays as an explicit override.

## Context

ADR-0044 shipped the ad-hoc half of the reference loop: an operator drops a photo, hosts
it, runs one manual `kontext` img2img generation conditioned on it (`gen-from-reference.mjs`,
`scripts/lib/pollinations.mjs`), judges the pixels by eye. The `kontext` `image=` mechanism
it factored out is the same one `gen-enemy-types.mjs` already uses to lock enemy flipbook
frame ≥2 to the committed frame-1 PNG — the proven §4.1 same-character derivation.

What ADR-0044 left out, and this story (`story-validated-reference-promotion.md`, 7 ACs)
now requires: once a generated asset **passes the `lead-art` asset gate**, it should stop
being a one-shot and become a **reusable reference the pipeline itself reaches for** on the
next generation of a sibling in the same family. Bertrand's non-negotiable framing, twice
stated: a promoted reference is worthless if merely filed — it must be **used all the way
to the end of the generation chain, into the model**, and that must be **proven** and
permanently **guarded**. Framing correction respected: the end model is a **diffusion model
(FLUX / kontext), not an LLM**; `enhance=false` deliberately removes the only LLM in the
chain (Pollinations' enhancer). The reference reaches the diffusion model via `image=<hosted
URL>` fetched **server-side** by Pollinations — so the last mile is a public raw URL in the
request query, and proving the loop means proving that URL is present and correct.

The `lead-art` art contract (not relitigated here) fixes the art decisions:

- Promotion = a distinct **`PROMOTE`** verdict at the asset gate, only on an unqualified
  PASS of a canonical-slot exemplar — never automatic on PASS.
- **At most ONE reigning hero per family per canonical slot** (truck/car/moto; cop
  frame-1 per VARIANT; courier one representative cell per layer, TREATMENT-anchor only).
- **Freeze-a-copy:** on promotion the accepted PNG is **copied** to
  `references/approved/<family>/<slug>.png` — permanent, immutable, superseded-never-deleted
  — distinct from the ephemeral repo-root `references/` scratch (ADR-0044) and from the
  shipped `public/assets/…` live copy. The frozen copy is the lock anchor.
- **Usage:** same-slot derivation = STRONG lock (the proven enemy frame-1 → frame-2
  mechanism, generalized); cross-slot = WEAK treatment-anchor (extra gate scrutiny).
  kontext sits ON TOP of the verbatim shared `style` block; `enhance=false` / `nologo=true`
  / `private=true` / pinned seed are preserved. A hero-derived asset ALWAYS re-takes the
  full art gate — no trusted-derivative shortcut.
- **License firewall:** an EXTERNAL (Ray-board) image may be a kontext source only with a
  resolved permissive `LICENSES.md` note AND a lead-art `kontext-eligible` curation in
  `docs/references/art-culture.md`. Internal heroes (our IP) need only the PROMOTE verdict.

Two hard constraints from ADR-0044 still bind: **no network egress in the dev sandbox**
(generation runs in CI), and **server-side reference fetch** (the frozen copy must be
committed so its `raw.githubusercontent.com` URL resolves at `GITHUB_SHA`).

## Decision

Entirely within `scripts/**` + `.github/workflows/**` + `docs/**` + `references/**` —
**zero `src/` touch**, including `src/game/levels/levelArt.json` (see boundary note). One
`dev-tooling-assets` lane.

### 1. Resolution mechanism — a machine registry under `references/approved/`

The reigning hero for a slot is resolved from a **machine registry
`references/approved/heroes.json`**, keyed `family → slot → { slug, approved }`, read by the
generators. This is chosen over the two rejected alternatives:

- **File-existence convention** (`references/approved/<family>/<slug>.png` exists ⇒ hero) is
  **rejected**: superseded copies are kept forever (superseded-never-deleted), so multiple
  slugs coexist on disk for one slot and file-existence cannot say which is REIGNING. It
  fails the "unambiguous default" requirement by construction.
- **Parsing `HEROES.md`** at generation time is **rejected** as the machine source: it is a
  human registry (verdict, date, rationale, prose status) and coupling the generator to
  markdown formatting is brittle.
- **A `hero` field inside `src/game/levels/levelArt.json`** is **rejected** for two reasons:
  it would touch `src/` (AC7 says zero touch to the game tree), and it mixes _content_ (what
  assets exist + their prompts/seeds) with _pipeline state_ (which validated pixel is the
  current anchor) — different concern, different lifecycle (flips on lead-art verdicts, not
  on content edits). Co-locating the registry with the frozen copies it indexes, under
  `references/approved/`, is better cohesion and keeps AC7 literally true.

So the reference library is **one library with four projections, each single-concern**:

| Artifact                                                                   | Role                                                 | Consumer                   |
| -------------------------------------------------------------------------- | ---------------------------------------------------- | -------------------------- |
| `references/approved/heroes.json`                                          | machine registry (the `image=` default)              | generators + guard         |
| `references/approved/HEROES.md`                                            | human registry (verdict/date/rationale/status/trace) | lead-art, reviewers        |
| `references/approved/<family>/<slug>.png`                                  | frozen immutable pixel anchor                        | Pollinations (server-side) |
| `docs/references/art-culture.md` + `docs/art-direction/references/boards/` | Ray's EXTERNAL boards + curated culture index        | lead-art curation          |

`heroes.json` is the **only** machine-consumed file; the others are human/trace. The lint
(§5) cross-validates all three internal projections, and each doc cross-links the others so
a reader of any one finds the rest (AC5 — one coherent library, two intake paths: an
external mood board that informs a prompt, and an internal validated hero that conditions a
generation). **Absent or empty `heroes.json` ⇒ no heroes ⇒ exactly today's behaviour** (AC4).

### 2. Generator wiring — reuse the kontext seam, per family

New shared helpers, no duplication:

- `scripts/lib/heroes.mjs` — `loadHeroRegistry(root)` (returns `{}` when absent),
  `heroForSlot(reg, family, slot)` → `{ slug, approved } | null`, and
  `heroRawUrl(approvedPath, { repo, sha })` → the `raw.githubusercontent.com/…/<approvedPath>`
  URL (generalizes `frame1RawUrl` from `gen-enemy-types.mjs`).
- `scripts/lib/pollinations.mjs` gains one seam: `buildRequestUrl({ prompt, seed, width,
height, imageUrl })` → `kontextUrl(...)` when `imageUrl` is set, else `fluxUrl(...)`.
  This is the single point where "hero present ⇒ image=" is decided.

**v1 wires the two families with a clean STRONG same-slot lock and the proven mechanism:**

- **vehicles** (`gen-vehicle-sprites.mjs`) — when `vehicles`/`<slot>` has a hero and the run
  is not regenerating that hero fresh, `imageUrl = heroRawUrl(approved)` and the request goes
  through `buildRequestUrl` (kontext) instead of flux. The file's private fetch/URL copies
  are dropped in favour of the shared lib (closes the duplication ADR-0044 flagged).
- **enemies** (`gen-enemy-types.mjs`) — the frame ≥2 kontext `image=` source becomes the
  **frozen** `heroRawUrl(approved)` when the slot has a hero, instead of the live-copy
  `frame1RawUrl`. Because the frozen copy is immutable and always committed, the
  `frame1Fresh` fragility disappears for a promoted slot (a robustness win). With no hero
  declared it falls back to today's `frame1RawUrl` — no regression.

**v1 DEFERS levels and courier** (field-aware, not force-wired):

- **levels** (`gen-level-art.mjs`) — backdrops are not canonical-slot hero sprites in the
  lead-art contract (no integrity/pose/reads-at-game-size criterion applies), and the
  generator does not even pin seeds. No v1 hero, no generator change.
- **courier** (`gen-courier-sprites.mjs`) — **resolves the lead-art courier flag:** the
  courier hero is TREATMENT-anchor (weak) only and would **fight the strip-atomic contract**
  (ADR-0017: per-layer shared pinned seed, atomic all-frames regen, whole subject in every
  image). A strong same-slot `image=` default would override the seed-stable composition, so
  courier is DEFERRED from generator wiring in v1. A courier hero may be recorded for HUMAN
  reference, but a machine `heroes.json` entry for `levels`/`courier` is a **hard lint error**
  until a follow-up wires weak-anchor support.

**Enemy-variant cardinality flag — CONFIRMED, no change:** the `enemies` block already keys
by variant (`enemy_shooting_2` = cop variant 2 shooting) and `frame1RawUrl(key)` already
resolves per-variant, so "one reigning hero per canonical slot" maps directly to one hero
per `enemies.<key>`. `heroes.json` inherits that granularity; no re-keying.

**External kontext sources — DEFERRED in v1.** The code path centers on internal heroes
(our IP, PROMOTE verdict, no license). External Ray-board refs require the license firewall;
v1 does not auto-resolve any external URL into a generator default — the manual `--ref` on
`gen-from-reference.mjs` remains the only external path. The lint still enforces the firewall
invariant so the future wiring is guarded, but no generator consumes an external ref by
default in v1.

### 3. Promotion mechanics — `scripts/promote-hero.mjs`

An idempotent, reviewable, network-free transaction run by `dev-tooling-assets` **on
lead-art's recorded PROMOTE verdict** (AC1 — never on generation, never on a FAIL):

1. Copy `--from <public/assets/…png>` → `references/approved/<family>/<slug>.png`; refuse to
   overwrite an existing slug (superseded-never-deleted ⇒ a new hero gets a NEW slug).
2. Write/flip `references/approved/heroes.json` `<family>.<slot>` → `{ slug, approved }`.
3. Append to `references/approved/HEROES.md`: new entry `REIGNING` (path, family+slot, source
   trace = levelArt family+type + pinned seed + commit/PR, lead-art verdict+date+rationale);
   flip any prior entry for that slot to `SUPERSEDED-by-<slug>`.
4. Cross-link the `docs/references/art-culture.md` index (AC5).

Re-running with the same slug + source is a no-op. It never generates, never triggers regen
(AC6), never touches `src/`.

### 4. End-to-end proof (AC3) — two layers sharing one builder

- **Layer A — unit test** (`scripts/lib/__tests__/heroes.test.mjs`, Vitest): over the pure
  seam `buildRequestUrl` + `heroRawUrl`, assert (a) hero present ⇒ URL contains
  `image=${encodeURIComponent(heroRawUrl(approved))}` exactly; (b) **causality** — change the
  slug ⇒ the `image=` value changes accordingly; (c) no hero ⇒ `model=flux`, no `image=`
  (AC4). This is the atom of "the promoted reference's resolved URL is the one placed in
  `image=`".
- **Layer B — permanent CI guard** (`scripts/check-hero-wiring.mjs`, runs in `ci.yml` right
  after `check-art-prompts`): loads `heroes.json`; empty ⇒ PASS. For every declared hero it
  fails (exit 1) when: the frozen file is missing; `approved` ≠ the canonical
  `references/approved/<family>/<slug>.png` path; the slot is not `REIGNING` (exactly one)
  in `HEROES.md`; the family is DEFERRED (`levels`/`courier`); an external-sourced ref lacks
  the license firewall. Its core last-mile assertion imports each wired generator's exported
  pure `planRequests({ repo, sha, registry })` and asserts every slot with a hero yields a
  URL containing `image=${encodeURIComponent(heroRawUrl(approved))}`. Because the guard and
  the generator compute the request through the **same** `buildRequestUrl`, a slot that
  declares a hero the generator does not thread through (or a family not wired to consume
  heroes) is **detected and fails CI** — this is Bertrand's "hero declared but not used"
  guard, made permanent.

### 5. Lint additions

The wiring/coherence invariants live in the new `scripts/check-hero-wiring.mjs` (not
`check-art-prompts.mjs`, which stays about prompt _words_). It enforces: `heroes.json` ↔
`HEROES.md` ↔ frozen-file coherence; the canonical-path equality (mirrors the existing
courier `asset` equality invariant); one REIGNING per slot; DEFERRED-family rejection; and
the external-source license firewall.

### 6. Boundary confirmation

All new/changed surface is in `scripts/**`, `.github/workflows/ci.yml`, `docs/**`, and
`references/**`. **No `src/` file is touched** — the hero registry deliberately lives in
`references/approved/`, not in `src/game/levels/levelArt.json`, precisely so AC7 ("zero touch
to `src/game`, `src/render`, `src/hooks`") is literally true and the game/render/hooks
boundary law is not engaged.

## Acceptance note

Accepted 2026-07-18: landed in commit 7912783 (`scripts/lib/heroes.mjs`,
`scripts/promote-hero.mjs`, `scripts/check-hero-wiring.mjs`, the CI guard, and both test
layers). Per §1's "absent or empty `heroes.json` ⇒ exactly today's behaviour", the loop
ships as a **no-op** until the first `PROMOTE` verdict populates `heroes.json` — no
generator behaviour changes until then.

## Consequences

**Positive**

- A validated hero style-locks its siblings automatically — "we liked this truck" becomes
  "every future roll of this slot starts from the truck that passed the gate", with no
  operator re-supplying a URL by hand (AC2).
- The last mile is **proven** (Layer A) and **permanently guarded** (Layer B): a declared
  hero that fails to reach `image=` turns CI red. Guard and generator share one builder, so
  they cannot silently diverge.
- Promoting to a **frozen immutable** copy removes the `frame1Fresh` fragility for that slot
  (the anchor is never rewritten by a generation run).
- Fully additive: empty registry ⇒ today's behaviour; the ad-hoc `--ref` path is untouched.
- One coherent library with an explicit machine/human split; zero `src/` touch.

**Negative / gotchas**

- kontext fidelity is variable against anything but the same subject (ADR-0044 caveat carries
  over); same-slot internal heroes are the strong case, which is why v1 wires exactly those.
- `references/approved/` grows unbounded (superseded-never-deleted) — intended; a housekeeping
  concern, not a shipping one (outside the Vite bundle).
- The frozen copy must be committed and pushed before a CI generation resolves it
  (server-side fetch); an uncommitted promotion 404s — the promote script commits it in the
  same reviewed change.
- `levels`, `courier`, and external kontext sources are deferred; declaring a hero for them
  fails the guard until a follow-up story wires weak-anchor / backdrop / license-gated
  support. This is a documented boundary, not a bug.
- AC1's teeth are process + guard, not a code oracle: promotion is a separate reviewed commit
  and the guard requires a matching `REIGNING` `HEROES.md` entry, but the PASS/PROMOTE
  judgment itself remains a human gate.
