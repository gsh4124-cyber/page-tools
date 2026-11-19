import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';

const { chromium } = await import(process.env.PLAYWRIGHT_MODULE || 'playwright');
const bases = {
  random: process.env.SEARCH_RANDOM_BASE || 'https://random-ppobgi.pages.dev',
  bible: process.env.SEARCH_BIBLE_BASE || 'https://bible-reader-1iz.pages.dev',
  device: process.env.SEARCH_DEVICE_BASE || 'https://pc-checkup.pages.dev',
};
const output = process.env.SEARCH_ENTRY_EVIDENCE || 'qa_evidence/search-entry';
await fs.mkdir(output, { recursive: true });
const browser = await chromium.launch({ headless: true, ...(process.env.SEARCH_BROWSER_CHANNEL ? {channel:process.env.SEARCH_BROWSER_CHANNEL} : {}) });
const observations = [];
try {
  for (const width of [320, 1280]) {
    const context = await browser.newContext({viewport:{width,height:900},locale:'ko-KR'});
    await context.route(/googlesyndication|doubleclick|adtrafficquality|\/api\/events/, route => route.abort());
    const page = await context.newPage();
    const errors = [];
    page.on('pageerror', error => errors.push(String(error)));
    const fits = async () => assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 2), `Horizontal overflow at ${width}px: ${page.url()}`);
    await page.goto(bases.random + '/guide/?qa=1');
    await fits();
    await page.locator('a.button[href="/#teams"]').click();
    await page.locator('#gameTools:not([hidden]) [data-panel="team"]:not([hidden])').waitFor();
    assert.equal(await page.locator('#teamNames').inputValue(), '', 'Opening a link must not overwrite the participant list');
    assert.equal(await page.locator('#teamResult .team-box').count(), 0, 'Opening a link must not generate a draw');
    const names = Array.from({length:10}, (_,i) => `Participant ${i + 1}`);
    await page.locator('#teamNames').fill(names.join('\n'));
    await page.locator('#teamCount').selectOption('3');
    await page.locator('#makeTeams').click();
    const teams = await page.locator('#teamResult .team-box > div').allTextContents();
    assert.equal(teams.length, 3);
    // Read individual rendered lines, rather than checking only output length.
    const assigned = await page.locator('#teamResult .team-box > div').evaluateAll(nodes => nodes.flatMap(n => n.innerText.split('\n')));
    assert.deepEqual([...assigned].sort(), [...names].sort(), 'Every participant appears exactly once');
    const sizes = await page.locator('#teamResult .team-box > div').evaluateAll(nodes => nodes.map(n => n.innerText.split('\n').length).sort());
    assert.deepEqual(sizes, [3,3,4]);
    await page.evaluate(() => { location.hash = 'order'; });
    await page.locator('#gameTools [data-panel="order"]:not([hidden])').waitFor();
    await page.locator('#orderNames').fill(names.join('\n'));
    await page.locator('#makeOrder').click();
    const ordered = await page.locator('#orderResult .order-item').evaluateAll(nodes => nodes.map(n => [...n.childNodes].filter(x => x.nodeType === 3).map(x => x.textContent).join('')));
    assert.deepEqual([...ordered].sort(), [...names].sort());
    await page.evaluate(() => { location.hash = 'teams'; });
    await page.locator('#gameTools [data-panel="team"]:not([hidden])').waitFor();
    assert.equal(await page.locator('#teamNames').inputValue(), names.join('\n'), 'Hash navigation preserves entered names');
    await fits();
    await page.screenshot({path:path.join(output, `random-teams-${width}.png`)});
    await page.goto(bases.bible + '/guide/?qa=1');
    await fits();
    assert.equal(await page.locator('link[rel="canonical"]').getAttribute('href'), 'https://bible-reader-1iz.pages.dev/guide/');
    await page.screenshot({path:path.join(output, `bible-guide-${width}.png`)});
    await page.locator('.examples a[href*="Ps.23.1-6"]').click();
    await page.locator('#verses .verse.deep-linked[data-verse="6"]').waitFor({timeout:20000});
    assert.equal(await page.locator('#chapterSelect').inputValue(), '23');
    assert.equal(await page.locator('#verses .verse.deep-linked').count(), 6);
    assert.match(await page.locator('#chapterTitle').textContent(), /23/);
    const route = bases.device.includes('127.0.0.1') ? '/checkup.html' : '/checkup';
    await page.goto(bases.device + route + '?qa=1#used-laptop-checklist');
    await page.locator('#laptop-symptoms').waitFor();
    await fits();
    assert.match(await page.title(), /중고 노트북 점검/);
    assert.match(await page.locator('meta[name="description"]').getAttribute('content'), /중고 노트북/);
    assert.equal(await page.locator('#device-flow-guide a[href="/keyboard"]').count(), 2);
    await page.locator('#laptop-record').scrollIntoViewIfNeeded();
    await page.screenshot({path:path.join(output, `device-guide-${width}.png`)});
    assert.deepEqual(errors, [], `Application errors at ${width}px`);
    observations.push({width,random:'team assignment and order preserve all participants; navigation preserves inputs',bible:'guide link opens Psalm 23 and all six highlighted verses',device:'guide, search description and small-screen layout verified',page_errors:errors});
    await context.close();
  }
  // Guide content and ordinary links remain available without JavaScript.
  const noJs = await browser.newContext({javaScriptEnabled:false,viewport:{width:390,height:844}});
  for (const [key,base] of Object.entries(bases).filter(([key]) => key !== 'device')) {
    const page = await noJs.newPage();
    await page.goto(base + '/guide/');
    assert(await page.locator('h1').isVisible());
    assert((await page.locator('article a[href]').count()) > 5);
    await page.close();
  }
  await noJs.close();
  await fs.writeFile(path.join(output,'results.json'), JSON.stringify({checked_at:new Date().toISOString(),bases,observations,no_js_guides:true},null,2));
  console.log('Search entry PASS: mobile/desktop guide-to-tool flows, real team/order output, scripture deep link, no-JS guides.');
} finally {
  await browser.close();
}
