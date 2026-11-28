import assert from 'node:assert/strict';
import test from 'node:test';
import { isAnalyticsRequest, newQaContext, newQaPage, productionHosts } from './browser.mjs';

const blocked = [
  ...productionHosts.map(host => `https://${host}/cdn-cgi/rum/`),
  'https://static.cloudflareinsights.com/beacon.min.js',
  'https://cloudflareinsights.com/cdn-cgi/rum?source=manual',
  'https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js',
  'https://random-ppobgi.pages.dev/api/events?qa=1',
  'https://preview.random-ppobgi.pages.dev/api/tool-uses',
  'https://afiqaibosavbjzkffggr.supabase.co/functions/v1/bible-page-view',
  'https://afiqaibosavbjzkffggr.supabase.co/functions/v1/device-checkup-event',
  'https://afiqaibosavbjzkffggr.supabase.co/functions/v1/random-picker-event',
];

test('Routes cover the four sites, automatic/manual Cloudflare and the first-party counters', () => {
  for (const url of blocked) assert(isAnalyticsRequest(new URL(url)), url);
  for (const url of [
    ...productionHosts.map(host => `https://${host}/?qa=1`),
    'https://gsh4124-cyber.github.io/vat.html',
    'https://bible-reader-1iz.pages.dev/topics/comfort/',
    'https://pc-checkup.pages.dev/mobile#touch-test',
    'https://afiqaibosavbjzkffggr.supabase.co/functions/v1/other-function',
  ]) assert(!isAnalyticsRequest(new URL(url)), url);
});

for (const [name, open] of [['context', newQaContext], ['page', newQaPage]]) {
  test(`${name} blocks service workers and registers blocking before returning`, async () => {
    const context = { route: async (matches, handler) => {
      assert.equal(matches, isAnalyticsRequest);
      await handler({ abort: async reason => assert.equal(reason, 'blockedbyclient') });
    } };
    const page = { context: () => context };
    const useOptions = options => assert.deepEqual(options, { viewport: null, serviceWorkers: 'block' });
    const browser = {
      newContext: async options => { useOptions(options); return context; },
      newPage: async options => { useOptions(options); return page; },
    };
    assert.equal(await open(browser, { viewport: null }), name === 'page' ? page : context);
  });
}

test('A real browser aborts analytics before the network and still renders each page', {
  skip: process.env.QA_BROWSER_TEST !== '1',
}, async () => {
  const { chromium } = await import('playwright');
  const channel = process.env.QA_BROWSER_CHANNEL;
  const browser = await chromium.launch({ ...(channel ? { channel } : {}) });
  const escaped = [];
  const fixture = {
    async newContext(options) {
      const context = await browser.newContext(options);
      await context.route('**/*', route => {
        const url = new URL(route.request().url());
        if (productionHosts.includes(url.hostname) && url.pathname === '/qa-fixture') {
          return route.fulfill({ contentType: 'text/html', body: '<title>QA fixture</title><h1>Ready</h1>' });
        }
        escaped.push(url.href);
        return route.abort();
      });
      return context;
    },
  };
  try {
    const context = await newQaContext(fixture);
    const page = await context.newPage();
    for (const host of productionHosts) {
      await page.goto(`https://${host}/qa-fixture`);
      assert.equal(await page.title(), 'QA fixture');
      const attempts = [...blocked, `https://${host}/cdn-cgi/rum`];
      const result = await page.evaluate(async urls => Promise.all(urls.map(url =>
        fetch(url, { method: 'POST', mode: 'no-cors', body: 'qa fixture' }).then(() => false, () => true)
      )), attempts);
      assert(result.every(Boolean), host);
    }
    assert.deepEqual(escaped, []);
  } finally {
    await browser.close();
  }
});
