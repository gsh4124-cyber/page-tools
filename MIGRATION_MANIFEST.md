# Page Tools Monorepo Migration Manifest

Target repository before rename: `gsh4124-cyber/random-ppobgi`
Intended final repository name: `gsh4124-cyber/page-tools`
Migration branch: `migration/page-tools-monorepo`

## Imported source heads
- random-ppobgi main: `d262c3bc4cebab2e36694f503d66d9204a1b943a`
- bible-reader main: `246059b930fceacf800a2f0f76011dbd0422b45c`
- pc-checkup main: `ab23e6da2cf878788d588de18c57d7d68e9ff02f`
- pc-checkup feature/security-network-check: `0fcde03d4933f5a613e45affe6a3f8eaf9b7bd52`

## Integrity
All three current main trees were compared by exact Git blob SHA + relative path after import.
Source histories were merged without squash. Source branches are retained under `legacy/<source>/...`.
Source tags are retained under `legacy/<source>/...` tag namespaces where present.

## Production protection
This migration lives only on `migration/page-tools-monorepo`. Existing Production deployments and default `main` are intentionally untouched until independent QA and explicit cutover approval.
