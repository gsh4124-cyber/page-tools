# page-tools

Integrated repository for Hwangje Vibecoding page-type products and related page/tool integrations.

## Products

- `random-ppobgi/` — Random Ppobgi
- `bible-reader/` — Bible Reader
- `pc-checkup/` — DEVICE CHECKUP

The products share one repository for management, but remain independent products with separate UI, URLs, Cloudflare production identities, QA/deploy identities, and rollback boundaries.

Current technical truth:
> latest `main` + target product subdirectory + relevant Actions/deploy/readback evidence

Historical standalone repositories such as `random-ppobgi`, `bible-reader`, and `pc-checkup` are not current code owners.

## Shared docs

- `docs/AdSense_승인_운영기준.md`
- `docs/글로벌_현지화_코드치환_재발방지.md`

## Shared integration tools

- `tools/affiliate_apis/` — affiliate provider clients and diagnostics
- `tools/coupang_partners/` — Coupang Partners deep-link helper

Provider secrets must stay in repository secrets/environment variables and must never be committed.

Portfolio rules, common QA/security/UI/UX principles, and live portfolio state remain owned by `gsh4124-cyber/hwangje-vault` and Supabase `hwangje_ops` as defined there.
