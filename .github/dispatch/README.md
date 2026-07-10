# Dispatch markers

Touching (creating or modifying) a marker file here and pushing it dispatches
the matching workflow **on the pushed branch** — the file-based equivalent of
the Actions "Run workflow" button, usable by any actor with `contents: write`
(API tokens without `actions: write` get `403 Resource not accessible by
integration` on the dispatch endpoint). See `docs/adr/0003` and `docs/ci.md`.

| Marker                 | Workflow                   |
| ---------------------- | -------------------------- |
| `gen-sprites`          | Generate enemy-type sprites |
| `gen-vehicle-sprites`  | Generate vehicle sprites   |
| `deploy-preview`       | Deploy branch preview      |
