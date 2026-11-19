# Instant chapter and verse grids

`scripture-index.js` contains numbers only for every offered translation. Normal
chapters are encoded as verse counts; chapters with skipped verse numbers store
the exact numbers. Never substitute KRV numbering for another translation.

KRV is generated from the bundled scripture files. The ten other translations
are generated from the same `midvash/bible-data` book files used by `fetchBook`,
pinned at `9586bd8228a747962df1ee8692730422fb7eb2ec`. The runtime provider revision
and the index revision must change together. Passage loading and grading still
use the actual text; only navigation numbers are available before loading.

To reproduce, check out that provider revision, then run from the repository:

```sh
node bible-reader/tools/build-scripture-index.mjs --provider=/path/to/bible-data --check
```

Omit `--check` to regenerate. This verifies all 660 remote book structures and all
66 bundled books. `scripture-index-sources.json` records per-translation totals
and structure hashes for offline CI checks. The small browser fixtures retain
one actual verse from each of John 1–3 to initialize each translation and the exact Acts 8
verse numbers; the target book response is deliberately held during UI tests.
