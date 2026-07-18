# references/approved/ — validated internal hero registry

The **permanent, immutable, superseded-never-deleted** projection of the reference
library that feeds the diffusion model directly (ADR-0043 —
[`docs/adr/0043-validated-reference-promotion-loop.md`](../../docs/adr/0043-validated-reference-promotion-loop.md),
extending ADR-0044). Distinct from:

- the repo-root [`references/`](../README.md) drop location — **ephemeral scratch**,
  throwaway iteration inputs for `gen-from-reference.mjs`, safe to prune;
- `public/assets/…` — the shipped **live copy** the game bundles (Vite);
- `docs/art-direction/references/boards/` — Ray's **external** mood/culture boards,
  curated into [`docs/references/art-culture.md`](../../docs/references/art-culture.md).

This file is the **human** projection (verdict/date/rationale/status/trace). The
**machine** projection generators actually read is
[`heroes.json`](heroes.json) (`family → slot → { slug, approved }`) in the same
directory. `scripts/check-hero-wiring.mjs` cross-validates the two never let them
drift — see that script and ADR-0043 §5 for the exact invariants. Never hand-edit
either file: run `node scripts/promote-hero.mjs` on a recorded `lead-art` `PROMOTE`
verdict (never on generation, never on a `FAIL`) — it writes both, network-free.

## Schema (per hero entry)

```
### <family>/<slot> — <slug>

- Path: `references/approved/<family>/<slug>.png`
- Family / slot: `<family>` / `<slot>`
- Source trace: `levelArt.json` `<family>.<slot>`, pinned seed `<seed>`; commit/PR `<pr>`
- Verdict: PROMOTE — lead-art, <date>
- Rationale: <one line — why this pixel passed the gate>
- Status: REIGNING | SUPERSEDED-by-<newer-slug>
```

- **Path** — the frozen, immutable copy; never overwritten, never deleted (a new hero
  for the same slot gets a NEW slug, the old file stays on disk for history).
- **Family / slot** — `vehicles`/`{truck,car,moto}` or `enemies`/`<variant key>`
  (enemy "slot" = the flipbook variant key, e.g. `enemy_shooting_2`, inheriting
  `frame1RawUrl`'s per-variant granularity — no re-keying). **v1 wires generation for
  these two families only** (ADR-0043 §2). `levels` and `courier` are DEFERRED — a
  human entry here is fine for reference, but a `heroes.json` machine entry for either
  is a hard `check-hero-wiring.mjs` error until a follow-up wires weak-anchor support.
- **Source trace** — where the pixel came from: the `levelArt.json` block/type that
  produced it, its pinned seed (reproducible rolls), and the commit or PR that
  generated and accepted it.
- **Verdict** — always `PROMOTE`, the distinct asset-gate verdict that authorizes
  promotion (never automatic on a plain PASS); `lead-art`, with the date.
- **Status** — exactly one `REIGNING` entry per family/slot at any time; promoting a
  new hero for an already-reigning slot flips the prior entry to
  `SUPERSEDED-by-<new-slug>` in the same commit.

**External-source license firewall (documented placeholder, ADR-0043 §2):** v1 only
promotes **internal** heroes (our own generated IP, `PROMOTE` verdict, no license
concern). An external (Ray-board) image entering the kontext `image=` path would need
a resolved permissive note in
[`docs/art-direction/references/LICENSES.md`](../../docs/art-direction/references/LICENSES.md)
plus a `lead-art` `kontext-eligible` curation in `docs/references/art-culture.md` —
`check-hero-wiring.mjs` reserves an `entry.source === "external"` + `entry.license`
check for that follow-up; no entry sets `source` today, so it never fires yet.

## Entries

_(none yet — v1 ships an empty registry; the first `PROMOTE` verdict adds an entry
here via `scripts/promote-hero.mjs`.)_
