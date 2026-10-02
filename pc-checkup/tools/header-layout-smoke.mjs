import { chromium } from 'playwright';

const base = 'https://pc-checkup.pages.dev';
const localePaths = ['/', '/en/', '/ja/', '/es/', '/de/', '/fr/', '/pt/', '/it/', '/nl/', '/id/', '/vi/', '/zh-CN/', '/ru/'];
const viewports = [
  { name: 'desktop-1280', width: 1280, height: 900 },
  { name: 'desktop-1440', width: 1440, height: 900 },
];
const problems = [];
const assert = (ok, message) => { if (!ok) problems.push(message); };
const browser = await chromium.launch({ headless: true });

for (const viewport of viewports) {
  const context = await browser.newContext({ viewport: { width: viewport.width, height: viewport.height } });
  const page = await context.newPage();
  for (const path of localePaths) {
    const response = await page.goto(`${base}${path}`, { waitUntil: 'networkidle', timeout: 30000 });
    assert(response?.ok(), `${viewport.name} ${path}: navigation failed`);
    const metrics = await page.evaluate(() => {
      const nav = document.querySelector('.nav');
      const brand = document.querySelector('.brand');
      const picker = document.querySelector('.language-picker');
      const navlinks = [...document.querySelectorAll('.navlinks a')].filter(el => getComputedStyle(el).display !== 'none');
      const navRect = nav?.getBoundingClientRect();
      const brandRect = brand?.getBoundingClientRect();
      const pickerRect = picker?.getBoundingClientRect();
      const linkRects = navlinks.map(el => el.getBoundingClientRect());
      const linkTops = linkRects.map(r => Math.round(r.top));
      const firstTop = linkTops[0] ?? 0;
      return {
        navHeight: navRect?.height ?? 0,
        navLeft: navRect?.left ?? 0,
        navRight: navRect?.right ?? 0,
        brandHeight: brandRect?.height ?? 0,
        pickerTop: pickerRect?.top ?? 0,
        brandTop: brandRect?.top ?? 0,
        linkCount: linkRects.length,
        wrappedLinks: linkTops.some(top => Math.abs(top - firstTop) > 2),
        linkOutsideNav: linkRects.some(r => r.left < (navRect?.left ?? 0) - 1 || r.right > (navRect?.right ?? 0) + 1),
        horizontalOverflow: document.documentElement.scrollWidth > document.documentElement.clientWidth + 1,
      };
    });
    assert(metrics.linkCount >= 7, `${viewport.name} ${path}: expected desktop nav links, got ${metrics.linkCount}`);
    assert(!metrics.wrappedLinks, `${viewport.name} ${path}: navigation wrapped to another row`);
    assert(metrics.navHeight <= 72, `${viewport.name} ${path}: header row too tall (${metrics.navHeight}px)`);
    assert(metrics.brandHeight <= 40, `${viewport.name} ${path}: brand wrapped (${metrics.brandHeight}px)`);
    assert(!metrics.linkOutsideNav, `${viewport.name} ${path}: navigation link escaped nav bounds`);
    assert(!metrics.horizontalOverflow, `${viewport.name} ${path}: horizontal overflow`);
  }
  await context.close();
}

await browser.close();
if (problems.length) {
  console.error(problems.join('\n'));
  process.exit(1);
}
console.log(`Header layout QA passed: ${localePaths.length} locales at 1280px and 1440px, single-row desktop navigation with no overflow.`);
