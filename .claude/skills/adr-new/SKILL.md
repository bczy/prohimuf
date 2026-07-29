---
name: adr-new
description: >
  Scaffold a new Architecture Decision Record in docs/adr/ with a collision-safe number.
  Use this whenever a decided outcome needs an ADR — a change to module boundaries, the
  game/render/hooks contract, a dependency, deployment, or any call future contributors
  must not re-litigate — or when someone asks to "write an ADR", "record this decision",
  "add an ADR", or "what's the next ADR number". It allocates the next `NNNN` by checking
  local files, the index, AND origin/main together (the guard against the duplicate-number
  bug that produced two ADR-0020s), scaffolds the Nygard template, and regenerates the
  index with scripts/gen-adr-index.mjs so the CI freshness gate stays green. Owner:
  tech-writer / producer. It scaffolds and numbers — the DECISION content stays the
  deciding lane's (usually senior-architect).
---

# adr-new — scaffold a collision-safe ADR

muf's ADRs live in `docs/adr/NNNN-kebab-title.md`, indexed in `docs/adr/README.md`. The
`NNNN` is normally **allocated by `producer` (Marion) at story opening** and recorded in the
story's handoffs shard. Parallel lanes numbering their own ADRs is exactly how muf ended up
with **two ADR-0020s** and a `0026→0028` rebase renumber — so the number must be checked
against everything that could already hold it, and **re-checked at merge**.

This skill scaffolds and numbers. The **decision itself** stays with the deciding lane
(`senior-architect` signs off ADR content; `tech-writer` drafts the prose).

## Step 1 — allocate a collision-safe number

Never eyeball the next number. Check local files, the index table, and `origin/main`
together, then take max + 1:

```
git fetch origin main --quiet
# highest NNNN across committed files on this branch AND on origin/main AND the index
{ ls docs/adr/ 2>/dev/null
  git show origin/main:docs/adr 2>/dev/null | tr -s ' ' '\n'
} | grep -oE '^[0-9]{4}' | sort -n | tail -1
```

Add 1, zero-padded to four digits. If a `producer` already allocated a number for this
story (in the handoffs shard), **use that** — don't self-allocate. If you must self-allocate
(no producer in the loop), say so in the ADR's Number line, as ADR-0038/0039 do.

## Step 2 — scaffold from the template

Copy `assets/adr-template.md` to `docs/adr/NNNN-kebab-title.md` and fill it:

- Title: short, imperative, matches the kebab filename.
- **Status:** `Proposed` while under discussion; `Accepted` once decided and shipping;
  `Superseded by ADR-XXXX` when replaced (ADRs are immutable once Accepted — supersede,
  don't rewrite).
- **Date:** today's real date (`date +%Y-%m-%d`).
- **Number:** the NNNN and how it was allocated (producer + shard, or self-allocated + why).
- **Context / Decision / Consequences:** the Nygard trio — forces at play, what was
  decided, what follows (positive, negative, gotchas).

## Step 3 — regenerate the index (never hand-edit it)

The index is **generated**, not written. Since ADR-0041 `scripts/gen-adr-index.mjs` owns it,
and CI enforces it (`Lint · Typecheck · Test` → step "ADR registry freshness"). Run:

```bash
node scripts/gen-adr-index.mjs --write   # regenerate
node scripts/gen-adr-index.mjs --check   # must print: fresh — N ADR, registry in sync
```

It writes **two** artifacts, both derived from the ADR files — commit BOTH:

- the `## Index` table in `docs/adr/README.md` (between the `ADR-INDEX` markers)
- `public/adr/index.html`, the page deployed at <https://bczy.github.io/prohimuf/adr/>

Adding the row by hand leaves the HTML behind and CI fails with `[adr-index] STALE`
(observed on PR #143 / ADR-0069). Both files are **prettier-ignored** — the generator owns
their bytes so `--check` can compare verbatim, so never reformat them either.

Because the row is derived, three things in your ADR file are load-bearing:

- **The H1 must be `# NNNN — Title`**, the template's form. The generator strips a leading
  `NNNN — ` to fill the Title column (which already has its own ADR column). `# ADR-NNNN — `
  is NOT stripped and leaves the number duplicated in the row — 3 files have drifted that
  way against 66 correct ones; don't add a fourth.
- **The `- **Status:**` line** feeds the Status column (`Proposed` reads as a draft).
- **The first sentence of `## Context`** becomes the one-line summary on the deployed page.
  Write it as a standalone sentence — it is read by people who never open the file. Avoid
  leading with `snake_case` identifiers in backticks: the generator strips markdown emphasis
  bluntly and eats the underscores (`FACADE_01` renders as `FACADE01`).

A missing H1 or a duplicate number makes the generator exit 1 with the reason — it is the
duplicate-number gate as much as an index builder.

## Step 4 — re-check at merge

Right before merge, re-run Step 1. If another branch took your number in the meantime,
renumber this ADR to the new next value: rename the file, fix the in-file H1 and Number
line, then **re-run Step 3's `--write`** to rebuild both artifacts (never edit the row by
hand). This is the cheap check that prevents the duplicate-number bug from reaching `main`.

## Guardrails

- Prefer the `producer`-allocated number; self-allocate only when no producer is in the loop, and say so.
- Re-check the number at merge — allocation at open is necessary but not sufficient.
- Never hand-edit `docs/adr/README.md`'s index table or `public/adr/index.html`; run
  `gen-adr-index.mjs --write` and commit both. CI checks it.
- Never rewrite an Accepted ADR — write a new one and mark the old `Superseded by ADR-XXXX`.
- The decision is the deciding lane's; this skill only scaffolds, numbers, and indexes.
- If the change alters boundaries/deps/deployment, the ADR ships in the SAME PR as the change.
