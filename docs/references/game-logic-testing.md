# Références — Logique de jeu pure & tests (`dev-gameplay`)

Pour la lane `src/game/**` (systems, types, maps, entities, state) — cœur React/Three-free,
TDD Vitest — et le pont `src/hooks` côté logique. Voir [`README.md`](README.md).

## Docs internes (source de vérité)

- `docs/architecture.md` — `src/game` n'importe **jamais** React/Three ; systems = fonctions pures state-in/state-out.
- `docs/game-systems.md` — inventaire des systèmes et de leurs contrats.
- `docs/diagrams/enemy-state-machine.md` — machine à états ennemis (référence de modélisation).
- `_bmad-output/guidelines/PROJECT_GUIDELINES.md` — cœur de boucle `Récupérer → Livrer → Éviter`.

## Références externes

- [Vitest — guide](https://vitest.dev/guide/) — runner de test du projet ; `expect`, mocks, coverage.
- [Vitest — API](https://vitest.dev/api/) — assertions et matchers exacts.
- [TypeScript — handbook](https://www.typescriptlang.org/docs/handbook/intro.html) — types stricts, pas de `any`.
- [TS — narrowing / discriminated unions](https://www.typescriptlang.org/docs/handbook/2/narrowing.html) — modéliser des états sûrs (state machines typées).
- [Game Programming Patterns — State](https://gameprogrammingpatterns.com/state.html) — pattern machine à états, gratuit en ligne.
- [Game Programming Patterns — Update Method / Game Loop](https://gameprogrammingpatterns.com/game-loop.html) — boucle déterministe, `dt` fixe.
- [Fix Your Timestep! (Gaffer on Games)](https://gafferongames.com/post/fix_your_timestep/) — pas de temps déterministe et testable.

## MCP à utiliser

- **codegraph** — tracer les call chains entre systems avant de refactorer (`callers`/`callees`/`impact`).
- **Context7** — doc TypeScript/Vitest à jour au besoin.

## Skills à utiliser

- `bmad-dev-story` / `bmad-quick-dev` — exécuter une story en TDD.
- `bmad-qa-generate-e2e-tests` — générer la couverture e2e derrière une feature.
