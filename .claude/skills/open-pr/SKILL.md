---
name: open-pr
description: >
  Open muf's pull request the way the template demands: compute the branch-preview slug
  byte-per-byte, count the cargo table from the diff, fill every section of
  .github/pull_request_template.md, tick the right route (tournée complète vs course
  express), and open it as a DRAFT with `gh`. Use it after pushing a branch, or when
  someone says "ouvre la PR", "open a PR", "crée la pull request", "prépare la PR". Also
  repairs an existing PR whose body is half-empty or whose preview link is wrong. It
  fills the body and ticks only what is genuinely done — an unticked box is information,
  a falsely ticked one is a lie to the merge gate. Owner: any lane (the one holding the
  branch).
---

# open-pr — the bon de livraison, filled correctly

The PR body is not decoration: its checklist mirrors the mandatory gates, and its preview
link is the on-device test surface reviewers use. Both are re-derived by hand every time
and both go wrong in the same two ways — a slug computed per character instead of per
byte, and boxes ticked because they look expected.

## Step 1 — push and scope

```bash
git push -u origin HEAD
git diff --stat origin/main...HEAD
```

## Step 2 — the preview slug (per BYTE, this is the classic bug)

The workflow uses `tr -c`, which substitutes **bytes**: a UTF-8 `é` (2 bytes) becomes
`--`, not `-`. Never hand-write the slug — compute it exactly as CI does:

```bash
printf '%s' "$(git rev-parse --abbrev-ref HEAD)" | tr -c 'a-zA-Z0-9._\n-' '-'
```

URL: `https://bczy.github.io/prohimuf/preview/<slug>/`

`deploy-preview.yml` auto-runs on **`claude/**` branches only**. On any other branch the
preview does not exist until you dispatch it:

```bash
gh workflow run deploy-preview.yml --ref "$(git rev-parse --abbrev-ref HEAD)"
```

Do that before claiming the link, or say explicitly that the preview is still building.

## Step 3 — the cargo table

Counts come from the diff, not from memory:

```bash
git diff --name-status origin/main...HEAD | awk '{s=$1; n=$2; ext=(n ~ /\./) ? tolower(n) : "none"; sub(/.*\./,"",ext); c[s"."ext]++; exts[ext]; sts[s]} END{for (st in sts){printf "%s:", st; for (e in exts) if (c[st"."e]) printf " .%s=%d", e, c[st"."e]; print ""}}'
```

Map `A`→Créés, `M`→Modifiés, `D`→Supprimés into the template's table; anything outside the
listed extensions goes to **Autres**.

## Step 4 — fill the body, section by section

Start from `.github/pull_request_template.md` and keep every section and its ASCII header:

- **Quoi / pourquoi** — the change and its story; link `docs/handoffs/story-<slug>.md` (or
  write "fix lane"), and the ADR if one was touched, else `n/a`.
- **Inventaire** — step 3.
- **Preuve sur le mur** — mandatory when gameplay/render/UI moved: real `verify` or e2e
  screenshots, desktop **and** mobile if HUD/controls are involved. Never a mockup, never
  a description standing in for an image.
- **Preview** — step 2's URL.
- **Check du matos** — tick only what you actually ran, in this session.
- **Itinéraire** — tick exactly ONE route: 🚚 tournée complète (panel + pm acceptance +
  story shard) or 🛵 course express (`fix-lane`: one reviewer + one line in
  `docs/handoffs/fixes.md`).

## Step 5 — open it as a draft

```bash
gh pr create --draft --title "<conventional-commit-style title>" --body-file <body.md>
```

Draft is the default because the gates have not run yet: the CI panel
(`code-review-panel.yml`, ADR-0063) publishes `panel-verdict` on the PR. Then watch it:

```bash
gh pr checks --watch
```

Ready-for-review is a deliberate act once checks are green — not part of opening.

## Step 6 — report

```
PR #<n> (draft) — <title>
Branch: <branch> → main   ·   slug: <slug>   ·   preview: <url> (<live | dispatched | n/a>)
Cargo: <A/M/D counts>
Evidence: <screenshots attached / not player-visible>
Route: 🚚 tournée complète | 🛵 course express
Unticked (and why): <box — reason, or none>
Checks: gh pr checks — <state>
```

## Guardrails

- **Never tick a box you did not verify.** An honest empty box tells the reviewer where
  the branch stands; a false one corrupts the merge gate.
- Never hand-write or guess the slug — run the `tr -c` command (per byte).
- Never claim a preview link on a non-`claude/**` branch without dispatching the workflow.
- Never claim the review panel passed here: the CI `panel-verdict` check is the authority
  (a local `review-panel` run is a pre-check, and says so).
- Delete no section of the template, including its HTML comments.
- Draft by default; marking ready-for-review is Bertrand's call or an explicit request.
