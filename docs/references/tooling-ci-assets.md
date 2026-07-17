# Références — Tooling, CI & pipeline d'assets (`dev-tooling-assets`)

Pour `scripts/` (génération d'assets/tiles, audio, screenshots), le flux Pollinations/FLUX,
la structure de `levelArt.json`, et la render-farm `.github/workflows`. Voir [`README.md`](README.md).

## Docs internes (source de vérité)

- `HARNESS.md` — la render-farm CI et le workflow de génération.
- `docs/asset-pipeline.md` — chaîne de génération d'images.
- `docs/ci.md` — pipeline d'intégration continue.
- ADR `docs/adr/0005`, `0007`, `0009`, `0033` — harness de vérification, lib partagée, marker push, provisioning.

## Références externes

- [Vite — guide](https://vite.dev/guide/) & [config](https://vite.dev/config/) — bundler/dev-server du projet.
- [Yarn — Plug'n'Play](https://yarnpkg.com/features/pnp) — résolution PnP (pas de `node_modules`), pièges d'exécution.
- [GitHub Actions — docs](https://docs.github.com/en/actions) — syntaxe workflow, matrices, artifacts.
- [Actions — workflow syntax](https://docs.github.com/en/actions/using-workflows/workflow-syntax-for-github-actions) — référence des clés `on`/`jobs`/`steps`.
- [Pollinations — API](https://github.com/pollinations/pollinations/blob/master/APIDOCS.md) — endpoint image (le flux de génération l'utilise).
- [FLUX — Black Forest Labs](https://github.com/black-forest-labs/flux) — le modèle derrière les prompts (comportement, forces/limites).
- [Playwright — docs](https://playwright.dev/docs/intro) — pilotage headless pour screenshots (le harness `verify` s'appuie dessus).
- [sharp — API](https://sharp.pixelplumbing.com/api-constructor) — traitement d'images Node (keying, resize, retouche scriptée).

## MCP à utiliser

- **Context7** — doc Vite/Actions/Playwright/sharp à jour avant d'écrire un script.

## Skills à utiliser

- `bmad-quick-dev` — stories tooling. · `sprite-hole-audit` — solidifier les cutouts poreux.
- `crew-sync` — après toute édition de `.claude/agents/**` ou du générateur : régénère le bitmap + re-épingle la gate de fraîcheur.
