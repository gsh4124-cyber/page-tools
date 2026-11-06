# page-tools

Integrated repository for Hwangje Vibecoding page-type products.

## Products

- `random-ppobgi/` — Random Ppobgi
- `bible-reader/` — Bible Reader
- `pc-checkup/` — DEVICE CHECKUP

The products share one repository for management, but remain independent products with separate UI, URLs, Cloudflare production identities, QA/deploy identities, and rollback boundaries.

Current technical truth:
> latest `main` + target product subdirectory + relevant Actions/deploy/readback evidence

Historical standalone repositories such as `random-ppobgi`, `bible-reader`, and `pc-checkup` are not current code owners.

## Automatic production builds

Cloudflare watches each product's directory and shared `tools/*` on `main`.
The project root remains the product directory (including Random Picker's Pages Functions).
All three projects publish `dist`, using these validated entry points:

| Product | Command from product directory |
| --- | --- |
| Random Picker | `python3 ../tools/build_static.py random-ppobgi` |
| Bible Reader | `python3 ../tools/build_static.py bible-reader` |
| DEVICE CHECKUP | `python3 tools/build_site.py` |

The same commands run in GitHub CI. They fail on source/security/behavior checks;
the device build also validates all 117 localized pages before preserving legacy demo assets.
Every artifact includes `build-revision.txt` and `build-manifest.json` with source commit and file digests.
The Product Health Monitor waits for the pushed commit and verifies served runtime bytes
before exercising the changed production sites in desktop/mobile Chromium. Existing six-hour
HTTP health checks remain in place. Screenshot evidence is retained for seven days.

Each product publishes a top-level `404.html` so missing paths return HTTP 404
instead of Cloudflare Pages' implicit SPA home-page fallback. The error page has
no ads and links back to the Korean and English homes. It is not included in a
sitemap; DEVICE CHECKUP copies it after validating its 117 translated app pages.
Production verification checks both missing document and nested asset paths.

A failed Cloudflare build keeps the previous successful release live. To roll back an already
published release, use that product's previous successful production deployment in Cloudflare;
then revert the faulty source commit before the next push. A green source CI alone does not
prove a new production release: confirm the health monitor and served commit marker.

After a changed production release passes those checks, `tools/notify-indexnow.mjs`
submits the product's sitemap URLs to IndexNow using its public ownership file.
This notifies participating search engines about all existing locale routes; it does
not claim that they have indexed or shown those URLs. Google Search Console sitemap
submission and URL Inspection remain separate account operations. Naver ownership
verification HTML files are preserved verbatim in each production package.
DEVICE CHECKUP keeps each language URL stable for a first visit, including browsers
with a different language. Its selector still saves explicit language choices;
only that saved preference can redirect a later visit to the Korean root.

## Shared docs

- `docs/AdSense_승인_운영기준.md`
- `docs/글로벌_현지화_코드치환_재발방지.md`

Portfolio rules, common QA/security/UI/UX principles, and live portfolio state remain owned by `gsh4124-cyber/hwangje-vault` and Supabase `hwangje_ops` as defined there.
