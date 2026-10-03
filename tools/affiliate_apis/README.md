# Affiliate API Hub

Owner: `직장/콘텐츠/AI 쇼핑 콘텐츠`

Purpose: keep provider-specific affiliate API clients under one owner without pretending that all providers share the same runtime constraints.

## Current baseline

### Secret management
GitHub Repository Secrets are the credential store.

Current names:
- `TOSS_ACCESS_KEY`
- `TOSS_SECRET_KEY`
- `TOSS_PUBLISHER_ID`
- `COUPANG_ACCESS_KEY`
- `COUPANG_SECRET_KEY`

Never write real secret values to repository files, request files, workflow logs, or chat.

### Coupang
Existing implementation:
- helper: `tools/coupang_partners/deeplink.py`
- workflow: `.github/workflows/coupang-partners-deeplink.yml`

Current gate:
- API availability still depends on Coupang Partners approval/key state.

### Toss
Provider client:
- `tools/affiliate_apis/toss_sharelink.ps1`

Diagnostic workflow:
- `.github/workflows/toss-sharelink-api.yml`

Supported client actions:
- `health`
- `best_selling`
- `product_details`
- `issue_sharelink`

Reality as of 2026-09-25:
- manual OAuth + `/openapi/health` passed once on an earlier registered egress condition.
- GitHub Secrets are bound only when the required secrets exist in this repository.
- `HWANGJE-PC` self-hosted runner previously connected successfully under the old owner repository.
- hotspot-based runner call to `/health` returned `SHARELINK_OPENAPI_ACCESS_DENIED`.
- hotspot public IPv4 is dynamic and is therefore not an unattended production baseline.

Status:
> `TOSS_AUTOMATION_HOLD`

Do not ask the user to repeat PowerShell commands, IP swaps, or workflow retries while this HOLD is active.

## Runtime policy

A provider runtime becomes production baseline only after these are known:
- owner
- official auth/endpoint contract
- secret store
- network/egress constraints
- durable runtime
- trigger path
- readback path
- required human interaction
- smallest live E2E

If network/runtime/trigger/readback is unresolved, keep the route as POC or diagnostic only.

Detailed incident remains in `gsh4124-cyber/hwangje-vault` under `직장/콘텐츠/AI 쇼핑 콘텐츠/기술/affiliate-api/INCIDENT_2026-09-25.md`.
