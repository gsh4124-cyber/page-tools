import { chromium } from 'playwright';
import { mkdir, writeFile } from 'node:fs/promises';

// Public production only: no credentials, account data, publishing, or mutations.
const origin = process.env.LIVE_TEST_BASE || 'https://random-ppobgi.pages.dev';
const output = 'qa_evidence/live';
const report = {
  kind: 'public-production-browser-proof',
  target: origin,
  commit: process.env.GITHUB_SHA || 'local-unverified',
  run_id: process.env.GITHUB_RUN_ID || 'local-unverified',
  cases: [],
};
await mkdir(output, { recursive: true });
const browser = await chromium.launch({ headless: true });
const cases = [
  { id: 'desktop-ko', path: '/', viewport: { width: 1280, height: 900 } },
  { id: 'mobile-en', path: '/en/', viewport: { width: 390, height: 844 } },
];

for (const test of cases) {
  const result = { id: test.id, path: test.path, viewport: test.viewport, status: 'UNVERIFIED' };
  const runtimeErrors = [];
  let page;
  try {
    page = await browser.newPage({ viewport: test.viewport });
    page.on('pageerror', error => runtimeErrors.push(String(error)));
    const url = new URL(test.path, origin).toString();
    const response = await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 20000 });
    if (!response || !response.ok()) throw new Error('HTTP ' + (response ? response.status() : 'no response') + ' at ' + url);
    result.http_status = response.status();
    if (test.path === '/en/') {
      await page.waitForFunction(() => window.__RANDOM_PICKER_I18N_READY__ === true, null, { timeout: 20000 });
    }
    await page.locator('#pickBtn').waitFor({ state: 'visible', timeout: 15000 });
    const methods = await page.locator('.method').count();
    if (methods !== 8) throw new Error('Expected 8 picker methods, found ' + methods);
    if ((await page.locator('.tool-tab').count()) !== 5) throw new Error('Game tools are missing');
    await page.screenshot({ path: output + '/' + test.id + '-before.png', fullPage: true });
    if (test.id === 'mobile-en') await page.locator('.method[data-method="wheel"]').click();
    await page.locator('#pickBtn').click();
    const showAll = page.locator('#showAllBtn');
    if (await showAll.isVisible()) await showAll.click();
    await page.waitForFunction(() => document.querySelectorAll('#winners li').length > 0, null, { timeout: 20000 });
    const winners = await page.locator('#winners li').count();
    if (test.viewport.width < 500) {
      const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
      if (overflow > 2) throw new Error('Horizontal overflow: ' + overflow + 'px');
      result.mobile_overflow_px = overflow;
    }
    if (runtimeErrors.length) throw new Error('Page runtime errors: ' + runtimeErrors.join(' | '));
    await page.screenshot({ path: output + '/' + test.id + '-after.png', fullPage: true });
    result.winners = winners;
    result.status = 'PASS';
  } catch (error) {
    result.status = 'FAIL';
    result.error = String(error);
    result.runtime_errors = runtimeErrors;
    if (page) {
      try { await page.screenshot({ path: output + '/' + test.id + '-failure.png', fullPage: true, timeout: 5000 }); }
      catch (screenshotError) { result.screenshot_error = String(screenshotError); }
    }
  } finally {
    if (page) await page.close();
    report.cases.push(result);
  }
}
await browser.close();
report.status = report.cases.every(item => item.status === 'PASS') ? 'PASS' : 'FAIL';
await writeFile(output + '/proof.json', JSON.stringify(report, null, 2) + '\n');
console.log(JSON.stringify(report, null, 2));
if (report.status !== 'PASS') process.exitCode = 1;
