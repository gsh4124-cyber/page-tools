import { once } from 'node:events';
import { chromium } from 'playwright';
import { isAnalyticsRequest, newQaPage, productionHosts } from './browser.mjs';

const args = process.argv.slice(2);
const interactive = args[0] !== '--check';
const inputs = interactive ? args : args.slice(1);
if (interactive && inputs.length !== 1) {
  throw new Error('Usage: node .github/qa/open.mjs <production URL> or node .github/qa/open.mjs --check [production URLs]');
}

const targets = (inputs.length ? inputs : productionHosts.map(host => `https://${host}/`)).map(input => {
  const url = new URL(input);
  if (url.protocol !== 'https:' || url.port || url.username || url.password || !productionHosts.includes(url.hostname)) {
    throw new Error('Choose an HTTPS URL on one of the four production sites.');
  }
  return url.href;
});

const channel = process.env.QA_BROWSER_CHANNEL;
const browser = await chromium.launch({ headless: !interactive, ...(channel ? { channel } : {}) });
try {
  const finished = once(browser, 'disconnected');
  for (const target of targets) {
    const page = await newQaPage(browser);
    try {
      let blocked = 0;
      const analyticsResponses = [];
      page.on('requestfailed', request => {
        if (isAnalyticsRequest(new URL(request.url()))) blocked++;
      });
      page.on('response', response => {
        if (isAnalyticsRequest(new URL(response.url()))) analyticsResponses.push(response.url());
      });
      const response = await page.goto(target, { waitUntil: 'load' });
      const finalUrl = new URL(page.url());
      if (!response?.ok() || !productionHosts.includes(finalUrl.hostname)) {
        throw new Error(`Could not open ${target} (${response?.status() ?? 'no response'})`);
      }
      if (analyticsResponses.length) throw new Error(`Analytics reached the network from ${target}`);
      console.log(`${finalUrl.href} | ${await page.title()} | ${blocked} analytics requests blocked`);
      if (interactive) await finished;
    } finally {
      if (!page.isClosed()) await page.close();
    }
  }
} finally {
  await browser.close();
}
