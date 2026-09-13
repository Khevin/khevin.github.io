# Third-party notices — Nihongo Reader

The distributable extension bundle contains application code plus the
following third-party components. Personal mnemonic images and reading
history are never part of the bundle; they live in the learner's own
library package and browser storage.

## kuromoji.js (via `@patdx/kuromoji`)

- Original: kuromoji.js, Copyright Takuya Asano — https://github.com/takuyaa/kuromoji.js
- Fork used: `@patdx/kuromoji` (ESM/TypeScript port, zero dependencies) — https://github.com/patdx/kuromoji.js
- Licence: Apache License 2.0 — see `kuromoji-LICENSE-2.0.txt` in this directory (copied from the package at build time).
- Version and pin: recorded in `nihongo/package.json` / `package-lock.json`.

## mecab-ipadic dictionary (bundled as `dict/*.dat.gz`)

The tokenizer dictionary is built from mecab-ipadic-2.7.0-20070801.
Copyright (c) Nara Institute of Science and Technology (NAIST). Use,
reproduction, and distribution are permitted provided the original copyright
notice and disclaimers are retained. NAIST disclaims all warranties and
accepts no liability for damages resulting from use of the software, in
original or modified form. A substantial portion derives from ICOT Free
Software, whose NO WARRANTY provisions must remain attached to any
distributed version. The full notice text ships in the upstream repository
as `NOTICE.md` (https://github.com/takuyaa/kuromoji.js/blob/master/NOTICE.md);
verify and copy it verbatim into this directory before any release beyond
local unpacked loading (tracked as an M4 release item).
