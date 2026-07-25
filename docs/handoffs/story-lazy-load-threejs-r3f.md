# Story handoff — lazy-load-threejs-r3f (ADR-0068)

Branch: `bczy-perf-lazy-loading-js-split` | PR: #140

## Pipeline

| Stage | Agent | Status |
|---|---|---|
| 0 — Scope | pm | ✅ |
| 1 — Architecture | senior-architect | ✅ |
| 2 — Dev render | dev-r3f-render | ✅ PlayingCanvas.tsx + App.tsx |
| 2 — Dev tooling | dev-tooling-assets | ✅ vite.config.ts manualChunks |
| 3 — ADR | tech-writer | ✅ ADR-0068 |
| 4 — QA Verify | qa-lead | ✅ PASS (87 files, 1154 tests) |
| 5 — Code Review Panel | 4 reviewers | ✅ |
| 6 — Triage | senior-architect | ✅ MERGE |

## Panel findings → resolutions

| Finding | Sev | Résolution |
|---|---|---|
| `selectedLevel?.name ?? "LOADING"` — ESLint no-unnecessary-condition | MAJEUR | ✅ Fixé — `selectedLevel.name` |
| `progress={1}` → 100 % pendant fetch chunk | MINEUR | ✅ Fixé — `progress={0}` |
| aria-valuenow=100 trompeur (AT) | MINEUR | ✅ Fixé par même one-liner |
| HUD hors Suspense boundary overlay LoadingScreen (cold/boss harness) | MINEUR | 🔵 Tech debt — différé |
| Header PlayingCanvas "only file in project" inexact | NIT | ✅ Fixé |
| Security: aucun finding | — | ✅ |

## Tech debt logué

- **HUD-over-LoadingScreen** : `<HUD>` rendu hors Suspense boundary — visible sur cold load + BOSS_HARNESS_PREVIEW. Fix: gate HUD sur `onChunkReady` callback ou déplacer dans PlayingCanvas. Ticket: à ouvrir.

## Résultats build

| Metric | Avant | Après |
|---|---|---|
| index chunk | 1 425 kB | 237 kB (−83 %) |
| Premier paint gzip | 408 kB | ~80 kB |
| vendor-three | — | 736 kB (lazy) |
| vendor-r3f | — | 156 kB (lazy) |
| vendor-react | — | 194 kB |

## Verdict : MERGE ✅
