# Audio credits & licences

Canonical provenance/licence record for every audio asset shipped with **muf**.
This file is served with the build (it lives under `public/`, so Vite copies it
into `dist/`). It is the single source of truth; the README "Audio credits /
licences" section and the per-track records in `scripts/download-audio.mjs` must
match it.

Titles below were verified against the ID3 tags of the actual `.mp3` files on
disk (`public/assets/audio/`). One variant to note: `bgm_loop2.mp3`'s embedded
ID3 title reads "Ouroboros - Full Mix"; "Ouroboros" is the canonical incompetech
work title used for attribution. All BGM files are unmodified, verbatim
downloads from incompetech.com (no edits, cuts or re-encodes by this project).

## Background music (5 tracks) — Kevin MacLeod, CC-BY 4.0

All five BGM tracks are by **Kevin MacLeod** (incompetech.com), licensed under
**Creative Commons: By Attribution 4.0 (CC-BY 4.0)**. Attribution is mandatory.

| File              | Title         | Author        | Source                   | Licence   | Licence URL                                  |
| ----------------- | ------------- | ------------- | ------------------------ | --------- | -------------------------------------------- |
| `bgm_loop.mp3`    | Funky Chunk   | Kevin MacLeod | https://incompetech.com/ | CC-BY 4.0 | https://creativecommons.org/licenses/by/4.0/ |
| `bgm_loop2.mp3`   | Ouroboros     | Kevin MacLeod | https://incompetech.com/ | CC-BY 4.0 | https://creativecommons.org/licenses/by/4.0/ |
| `bgm_tension.mp3` | Sneaky Snitch | Kevin MacLeod | https://incompetech.com/ | CC-BY 4.0 | https://creativecommons.org/licenses/by/4.0/ |
| `bgm_danger.mp3`  | Darkest Child | Kevin MacLeod | https://incompetech.com/ | CC-BY 4.0 | https://creativecommons.org/licenses/by/4.0/ |
| `bgm_win.mp3`     | Reformat      | Kevin MacLeod | https://incompetech.com/ | CC-BY 4.0 | https://creativecommons.org/licenses/by/4.0/ |

Attribution norm strings (as required by CC-BY 4.0):

- "Funky Chunk" Kevin MacLeod (incompetech.com) — Licensed under Creative Commons: By Attribution 4.0 — https://creativecommons.org/licenses/by/4.0/
- "Ouroboros" Kevin MacLeod (incompetech.com) — Licensed under Creative Commons: By Attribution 4.0 — https://creativecommons.org/licenses/by/4.0/
- "Sneaky Snitch" Kevin MacLeod (incompetech.com) — Licensed under Creative Commons: By Attribution 4.0 — https://creativecommons.org/licenses/by/4.0/
- "Darkest Child" Kevin MacLeod (incompetech.com) — Licensed under Creative Commons: By Attribution 4.0 — https://creativecommons.org/licenses/by/4.0/
- "Reformat" Kevin MacLeod (incompetech.com) — Licensed under Creative Commons: By Attribution 4.0 — https://creativecommons.org/licenses/by/4.0/

## Sound effects

### `shoot.wav` — UNKNOWN PROVENANCE — flagged for replacement

**Licence status: FAIL (unresolved).** No verifiable origin could be established
for this file. It is retained here as an explicit, honest FAIL record, not left
silently unattributed. Under the audio gate (ADR-0018 / sound-designer gate 1),
an asset with no verified provenance cannot PASS and must be traced or replaced.

Investigation evidence:

- **No embedded metadata.** The file's RIFF container carries only `fmt`/`data`
  chunks — there is no `INFO` chunk (`ISFT`/`IART`/`ICOP`), so no author, tool,
  or licence string is recorded inside the file.
- **No generator script.** No script under `scripts/` produces or references
  `shoot.wav` (unlike the sprites and the BGM, which have generators). It was not
  produced by this repo's asset pipeline as it stands today.
- **No meaningful git history.** `git log --follow` shows `shoot.wav` was
  introduced in the repository's **root commit** (`7db7d6b`, `max-parents=0`),
  bundled into a large initial import whose message ("chore(assets): generate
  delivery-vehicle sprites") is unrelated to it.
- **One in-repo source note exists.** `docs/roadmap.md` line 65 records
  "Shoot SFX: `shoot.wav` generated and wired" — consistent with the file's
  shape (13 KB, 0.15 s mono burst, bare `fmt`/`data` chunks, typical of a
  synthesized SFX). This points to the file being **generated in-project**,
  but the tool/method is unreconstructed and no author confirmation exists yet.

Conclusion: **likely original project work (generated in-project per the roadmap
note), unconfirmed.** Reuse status unknown — downstream consumers should not
assume redistribution rights for this one file. **Action required (out of scope
for this story): either the author confirms in-project generation (then this
record becomes a PASS as original work) or the file is replaced with a track of
known, compatible licence.** Until then, this asset blocks the audio-gate PASS.
