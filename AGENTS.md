# Page tools — agent entry point

This repository owns the page products and their build and deployment evidence. Portfolio rules are maintained separately in `gsh4124-cyber/hwangje-vault`; do not copy that Vault into this public repository.

Before changing a project:
1. Use authorized GitHub access or an existing, up-to-date Vault checkout to read the actual latest main `START_HERE.md`, the relevant owner index and task-specific rules. Follow the repository link in README.md for the portfolio owner. Do not assume another repository's instructions have been injected by Codex.
2. If a Vault checkout is available, use its existing `scripts/skill_bootstrap.py` with the owner and task. Read the returned document bodies, not just the receipt or hashes. If the authoritative source cannot be reached, disclose the limitation and do not claim the rules were applied. Continue safe, independent work that does not depend on the unavailable context; pause only the steps that require it.
3. Read this repository's README.md, the target product source and its applicable QA/build instructions. Confirm the target, source revision and scope before modifying files. Read the designated live state when the task depends on it; do not invent it.
4. Preserve unrelated products and their deployment identities. Run the existing checks relevant to the changed behavior and verify their output. For documentation-only changes, check accuracy and links; run product builds or tests only when the change can affect them. Distinguish local tests from actual production readback. Do not deploy, incur costs, or modify external accounts without the relevant authorization.
5. In the completion report, identify the actual source revision and relevant rules used, commands and observed results, and any untested or blocked conditions. A document receipt is not proof that its instructions were followed.

## Production browser checks

For Random Ppobgi, Bible Reader, DEVICE CHECKUP and Calculatormoa, open live product pages through the protected QA browser. Its separate browser context blocks Cloudflare Web Analytics, product counters and ad telemetry before navigation, including when a check follows a link or changes language. Use a local build or preview for browser sessions that cannot apply these protections. The product's `?qa=1` flag alone only affects its own counters.

- Interactive check: `node .github/qa/open.mjs <production URL>`
- Verify all four home pages: `node .github/qa/open.mjs --check`
- Automated checks: start pages and contexts with `newQaPage` or `newQaContext` from `.github/qa/browser.mjs`. Mock analytics responses locally if the test needs them.

The commands reuse the Playwright installation from the browser QA jobs.

This is a thin entry point, not a replacement for the authoritative rules.
