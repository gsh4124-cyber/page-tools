import { chromium, firefox, webkit } from 'playwright';

const base = 'https://pc-checkup.pages.dev';
const expectedSitemapUrls = 117;
const problems = [];
const assert = (ok, message) => { if (!ok) problems.push(message); };
const browserName = process.env.DEVICE_BROWSER || 'chromium';
const browserTypes = { chromium, firefox, webkit };
const browserType = browserTypes[browserName];
if (!browserType) throw new Error(`Unsupported DEVICE_BROWSER: ${browserName}`);

// Production intentionally loads Google AdSense. Keep the external-origin guard,
// but allow only the origins currently required by the approved Google integration.
const allowedExternalOrigins = new Set([
  'https://pagead2.googlesyndication.com',
  'https://googleads.g.doubleclick.net',
  'https://ep1.adtrafficquality.google',
  'https://ep2.adtrafficquality.google',
  'https://www.google.com',
  'https://csp.withgoogle.com',
]);
const unexpectedExternalOrigins = externalRequests =>
  [...externalRequests].filter(origin => !allowedExternalOrigins.has(origin));

// Chromium production QA has repeatedly observed one exact AdSense RUM exception:
// `Uncaught Error: int64`, with every captured frame inside pagead2.../rum.js.
// Treat only that exact source-bound signature as third-party noise. Unknown errors,
// message-only matches and product-origin errors remain fail-closed.
const isVerifiedAdSenseRumPageError = error => {
  const stack = typeof error?.stack === 'string' ? error.stack : '';
  const firstLine = (stack || String(error)).split('\n')[0].trim();
  const exactMessage = firstLine === 'Error: int64' || firstLine === 'Uncaught Error: int64';
  const verifiedSource = stack.includes('https://pagead2.googlesyndication.com/') && stack.includes('/rum.js:');
  const productFrame = stack.includes(`${base}/`);
  return exactMessage && verifiedSource && !productFrame;
};
const capturePageError = (pageErrors, error) => {
  const message = String(error);
  const stack = typeof error?.stack === 'string' ? error.stack : '';
  const formatted = stack && !stack.startsWith(message) ? `${message}\n${stack}` : (stack || message);
  if (isVerifiedAdSenseRumPageError(error)) {
    console.warn(`[third-party pageerror classified: AdSense RUM int64] ${formatted}`);
    return;
  }
  pageErrors.push(formatted);
};

const sitemapResponse = await fetch(`${base}/sitemap.xml`);
assert(sitemapResponse.ok, `sitemap HTTP ${sitemapResponse.status}`);
const sitemap = await sitemapResponse.text();
const urls = [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map(match => match[1]);
assert(urls.length === expectedSitemapUrls, `expected ${expectedSitemapUrls} sitemap URLs, got ${urls.length}`);
assert(urls.every(url => url.startsWith(`${base}/`)), 'sitemap contains non-Cloudflare production URLs');

for (let i = 0; i < urls.length; i += 12) {
  const batch = urls.slice(i, i + 12);
  const results = await Promise.all(batch.map(async url => {
    try {
      const response = await fetch(url, { redirect: 'follow' });
      return { url, ok: response.ok, status: response.status };
    } catch (error) {
      return { url, ok: false, status: 0, error: String(error) };
    }
  }));
  for (const result of results) {
    assert(result.ok, `${result.url}: HTTP ${result.status}${result.error ? ` ${result.error}` : ''}`);
  }
}

const browser = await browserType.launch({ headless: true });
const representative = [
  { path: '/', lang: 'ko', browserLocale: 'ko-KR' },
  { path: '/en/', lang: 'en', browserLocale: 'en-US' },
  { path: '/ja/', lang: 'ja', browserLocale: 'ja-JP' },
  { path: '/zh-CN/', lang: 'zh-CN', browserLocale: 'zh-CN' },
  { path: '/ru/', lang: 'ru', browserLocale: 'ru-RU' },
];

const collectLayoutProblems = async (page, label) => {
  const metrics = await page.evaluate(() => {
    const root = document.documentElement;
    const body = document.body;
    const selectors = '.wrap,.tool-layout,.toolbox,.side,.notice,.card,.stat,.checkitem,.progress-card,.eventlog,.controls,.actions,.check-actions,header,.nav';
    const badBounds = [...document.querySelectorAll(selectors)].filter(el => {
      const style = getComputedStyle(el);
      if (style.display === 'none' || style.visibility === 'hidden') return false;
      const r = el.getBoundingClientRect();
      return r.width > 0 && (r.left < -1 || r.right > root.clientWidth + 1);
    }).slice(0, 8).map(el => ({ tag: el.tagName, cls: el.className, left: el.getBoundingClientRect().left, right: el.getBoundingClientRect().right }));
    const clippedText = [...document.querySelectorAll('.notice,p,.card,.stat,.btn,.pill,.checkitem,.eventlog')].filter(el => {
      const style = getComputedStyle(el);
      if (style.display === 'none' || style.visibility === 'hidden') return false;
      const overflowX = style.overflowX;
      if (overflowX === 'auto' || overflowX === 'scroll') return false;
      return el.clientWidth > 0 && el.scrollWidth > el.clientWidth + 2;
    }).slice(0, 8).map(el => ({ tag: el.tagName, cls: el.className, text: (el.textContent || '').trim().slice(0, 60) }));
    return {
      horizontalOverflow: root.scrollWidth > root.clientWidth + 1 || body.scrollWidth > root.clientWidth + 1,
      badBounds,
      clippedText,
    };
  });
  assert(!metrics.horizontalOverflow, `${label}: horizontal overflow`);
  assert(metrics.badBounds.length === 0, `${label}: viewport-bound layout issue ${JSON.stringify(metrics.badBounds)}`);
  assert(metrics.clippedText.length === 0, `${label}: clipped text ${JSON.stringify(metrics.clippedText)}`);
};

for (const item of representative) {
  const context = await browser.newContext({ viewport: { width: 390, height: 844 }, locale: item.browserLocale });
  const page = await context.newPage();
  const pageErrors = [];
  const externalRequests = new Set();
  page.on('pageerror', error => capturePageError(pageErrors, error));
  page.on('request', request => {
    const url = new URL(request.url());
    if ((url.protocol === 'http:' || url.protocol === 'https:') && url.origin !== base) externalRequests.add(url.origin);
  });

  const response = await page.goto(`${base}${item.path}`, { waitUntil: 'networkidle', timeout: 30000 });
  assert(response?.ok(), `${item.path}: navigation failed`);
  assert(new URL(page.url()).pathname === item.path, `${item.path}: unexpected locale redirect to ${page.url()}`);
  assert((await page.locator('html').getAttribute('lang')) === item.lang, `${item.path}: html lang mismatch: ${await page.locator('html').getAttribute('lang')}`);
  assert(await page.locator('.brand').isVisible(), `${item.path}: brand not visible`);
  assert((await page.locator('#languagePicker').count()) === 1, `${item.path}: canonical language selector must exist exactly once`);
  assert((await page.locator('.lang-switch').count()) === 0, `${item.path}: retired duplicate .lang-switch is still present`);
  assert((await page.locator('header select[aria-label]').count()) === 1, `${item.path}: header contains duplicate language selects`);
  assert((await page.locator('a[href$="checkup.html"]').count()) > 0, `${item.path}: PC checkup entry missing`);
  assert((await page.locator('a[href$="mobile.html"]').count()) > 0, `${item.path}: mobile checkup entry missing`);
  await collectLayoutProblems(page, `${item.path} mobile`);
  assert(pageErrors.length === 0, `${item.path}: page errors: ${pageErrors.join(' | ')}`);
  const unexpectedOrigins = unexpectedExternalOrigins(externalRequests);
  assert(unexpectedOrigins.length === 0, `${item.path}: unexpected external network origins: ${unexpectedOrigins.join(', ')}`);
  await context.close();
}

for (const path of ['/en/keyboard.html', '/en/mobile.html', '/zh-CN/keyboard.html', '/ru/mobile.html']) {
  const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
  const pageErrors = [];
  const externalRequests = new Set();
  page.on('pageerror', error => capturePageError(pageErrors, error));
  page.on('request', request => {
    const url = new URL(request.url());
    if ((url.protocol === 'http:' || url.protocol === 'https:') && url.origin !== base) externalRequests.add(url.origin);
  });
  const response = await page.goto(`${base}${path}`, { waitUntil: 'networkidle', timeout: 30000 });
  assert(response?.ok(), `${path}: navigation failed`);
  assert(await page.locator('.brand').isVisible(), `${path}: brand not visible`);
  assert((await page.locator('#languagePicker').count()) === 1, `${path}: canonical language selector must exist exactly once`);
  assert((await page.locator('.lang-switch').count()) === 0, `${path}: retired duplicate .lang-switch is still present`);
  assert((await page.locator('header select[aria-label]').count()) === 1, `${path}: header contains duplicate language selects`);
  await collectLayoutProblems(page, `${path} mobile`);
  assert(pageErrors.length === 0, `${path}: page errors: ${pageErrors.join(' | ')}`);
  const unexpectedOrigins = unexpectedExternalOrigins(externalRequests);
  assert(unexpectedOrigins.length === 0, `${path}: unexpected external network origins: ${unexpectedOrigins.join(', ')}`);
  await page.close();
}

if (browserName === 'chromium') {
  for (const viewport of [
    { name: 'mobile-360', width: 360, height: 800 },
    { name: 'desktop-1280', width: 1280, height: 900 },
  ]) {
    const context = await browser.newContext({ viewport: { width: viewport.width, height: viewport.height }, locale: 'ko-KR' });
    const page = await context.newPage();
    const pageErrors = [];
    page.on('pageerror', error => capturePageError(pageErrors, error));
    for (const url of urls) {
      pageErrors.length = 0;
      const response = await page.goto(url, { waitUntil: 'load', timeout: 30000 });
      assert(response?.ok(), `${viewport.name} ${url}: navigation failed`);
      await collectLayoutProblems(page, `${viewport.name} ${new URL(url).pathname}`);
      assert(pageErrors.length === 0, `${viewport.name} ${url}: page errors: ${pageErrors.join(' | ')}`);
    }
    await context.close();
  }
}

await browser.close();

if (problems.length) {
  console.error(problems.join('\n'));
  process.exit(1);
}
console.log(`DEVICE CHECKUP Cloudflare production QA passed on ${browserName}: ${urls.length} sitemap URLs reachable; representative multi-engine checks passed${browserName === 'chromium' ? '; all 117 URLs passed 360px mobile and 1280px desktop layout/clipping/overflow sweep' : ''}.`);
