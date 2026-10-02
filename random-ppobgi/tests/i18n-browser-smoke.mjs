import { chromium } from 'playwright';

const base = process.env.I18N_TEST_BASE || 'http://127.0.0.1:4173';
const priority = ['en','ja','es','zh','pt','ar'];
const allForeign = ['en','ja','es','zh','fr','de','pt','id','hi','pl','it','nl','tr','vi','th','ar'];
const korean = /[가-힣]/;

const browser = await chromium.launch({headless:true});
let failed = false;
const problems = [];

function assert(ok, message) {
  if (!ok) { failed = true; problems.push(message); }
}
function koreanLines(text) {
  return text.split(/\n+/).map(s=>s.trim()).filter(s=>korean.test(s)).slice(0,12).join(' | ');
}
async function koreanAttrs(page) {
  return page.evaluate(() => {
    const re=/[가-힣]/; const out=[];
    for (const el of document.querySelectorAll('[aria-label],[title],[placeholder]')) {
      if (el.closest('#languageSwitch')) continue;
      for (const key of ['aria-label','title','placeholder']) {
        const value=el.getAttribute(key);
        if (value && re.test(value)) out.push(`${el.tagName.toLowerCase()}#${el.id||''}.${el.className||''} ${key}=${value}`);
      }
    }
    return out.slice(0,16);
  });
}
async function visibleTextWithoutLanguageSwitch(page) {
  return page.evaluate(() => {
    const el=document.getElementById('languageSwitch');
    if(!el) return document.body.innerText;
    const previous=el.getAttribute('style');
    el.style.setProperty('display','none','important');
    const text=document.body.innerText;
    if(previous===null) el.removeAttribute('style'); else el.setAttribute('style',previous);
    return text;
  });
}
async function headerMetrics(page) {
  return page.evaluate(() => {
    const selectors=['header','.logo','.header-actions','#soundToggle','#resetBtn','#languageSwitch'];
    const out={};
    for(const sel of selectors){
      const el=document.querySelector(sel);if(!el){out[sel]=null;continue;}
      const r=el.getBoundingClientRect();out[sel]={top:r.top,bottom:r.bottom,left:r.left,right:r.right,width:r.width,height:r.height,centerY:r.top+r.height/2};
    }
    return out;
  });
}
function assertMobileHeader(m,lang,width){
  for(const sel of ['header','.logo','.header-actions','#soundToggle','#resetBtn','#languageSwitch']) assert(!!m[sel],`${lang}@${width}: missing ${sel}`);
  if(!m['header']||!m['.logo']||!m['.header-actions']||!m['#soundToggle']||!m['#resetBtn']||!m['#languageSwitch']) return;
  const controls=[m['#soundToggle'],m['#resetBtn'],m['#languageSwitch']];
  assert(Math.max(...controls.map(x=>x.centerY))-Math.min(...controls.map(x=>x.centerY))<=2,`${lang}@${width}: header controls are not vertically aligned`);
  assert(Math.abs(m['.logo'].centerY-m['.header-actions'].centerY)<=2,`${lang}@${width}: logo and actions are not on the same line`);
  const separated=m['.logo'].right<=m['.header-actions'].left+1 || m['.header-actions'].right<=m['.logo'].left+1;
  assert(separated,`${lang}@${width}: logo overlaps header actions`);
  assert(m['.header-actions'].left>=-1 && m['.header-actions'].right<=width+1,`${lang}@${width}: header actions overflow viewport`);
  assert(controls.every(x=>x.top>=m['header'].top-1 && x.bottom<=m['header'].bottom+1),`${lang}@${width}: a header control escapes header row`);
}

async function waitReady(page) {
  await page.waitForFunction(() => window.__RANDOM_PICKER_I18N_READY__ === true, null, {timeout:10000});
  await page.locator('#languageSwitch').waitFor({state:'attached',timeout:5000});
}

for (const lang of allForeign) {
  const page = await browser.newPage({viewport:{width:1280,height:900}});
  const errors = [];
  page.on('pageerror', e => errors.push(String(e)));
  await page.goto(`${base}/${lang}/`, {waitUntil:'networkidle'});
  await waitReady(page);
  assert(await page.locator('#languageSwitch').count() === 1, `${lang}: language selector count is not 1`);
  assert(await page.locator('#languageSwitch .globe').count() === 1, `${lang}: globe count is not 1`);
  assert(await page.locator('#languageSelect').inputValue() === lang, `${lang}: selector does not show current language`);
  assert(await page.locator('.method').count() === 8, `${lang}: expected 8 picker games`);
  assert(await page.locator('.tool-tab').count() === 5, `${lang}: expected 5 game tools`);
  assert(await page.locator('#numberTab').count() === 1 && await page.locator('#nameTab').count() === 1, `${lang}: number/name modes missing`);
  const visibleText = await visibleTextWithoutLanguageSwitch(page);
  assert(!korean.test(visibleText), `${lang}: Korean remains in initial visible UI: ${koreanLines(visibleText)}`);
  const attrs=await koreanAttrs(page);
  assert(attrs.length===0, `${lang}: Korean remains in accessibility attributes: ${attrs.join(' | ')}`);
  assert(errors.length === 0, `${lang}: page errors: ${errors.join(' | ')}`);
  if (lang === 'ar') assert(await page.locator('html').getAttribute('dir') === 'rtl', 'ar: html dir is not rtl');
  await page.close();
}

for (const lang of priority) {
  for (const width of [390,360]) {
    const page = await browser.newPage({viewport:{width,height:844}});
    const errors = [];
    page.on('pageerror', e => errors.push(String(e)));
    await page.goto(`${base}/${lang}/`, {waitUntil:'networkidle'});
    await waitReady(page);
    assertMobileHeader(await headerMetrics(page),lang,width);

    const wheel = page.locator('.method[data-method="wheel"]');
    if (await wheel.count()) await wheel.click();
    await page.locator('#pickBtn').click();
    await page.waitForTimeout(350);

    const show = page.locator('#showAllBtn');
    if (await show.count() && await show.isVisible()) {
      await show.click();
      await page.waitForTimeout(150);
    }
    const dynamicText = await visibleTextWithoutLanguageSwitch(page);
    assert(!korean.test(dynamicText), `${lang}@${width}: Korean remains after picker execution: ${koreanLines(dynamicText)}`);
    const attrs=await koreanAttrs(page);
    assert(attrs.length===0, `${lang}@${width}: Korean remains in dynamic accessibility attributes: ${attrs.join(' | ')}`);
    assert(errors.length === 0, `${lang}@${width}: page errors after execution: ${errors.join(' | ')}`);
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
    assert(overflow <= 2, `${lang}@${width}: mobile horizontal overflow ${overflow}px`);
    assert(await page.locator('#languageSwitch').count() === 1, `${lang}@${width}: duplicate selector after interaction`);

    await page.locator('#showTools').click();
    await page.waitForTimeout(80);
    assert(await page.locator('.tool-tab').count() === 5, `${lang}@${width}: tools missing after switching tab`);
    const toolText = await visibleTextWithoutLanguageSwitch(page);
    assert(!korean.test(toolText), `${lang}@${width}: Korean remains in game tools: ${koreanLines(toolText)}`);
    assertMobileHeader(await headerMetrics(page),lang,width);
    await page.close();
  }
}

for (const width of [390,360]) {
  const page=await browser.newPage({viewport:{width,height:844}});
  const errors=[];page.on('pageerror',e=>errors.push(String(e)));
  await page.goto(`${base}/`,{waitUntil:'networkidle'});
  await page.addScriptTag({url:`${base}/language-switch.js`});
  await page.locator('#languageSwitch').waitFor({state:'attached',timeout:5000});
  assert(await page.locator('#languageSwitch').count()===1,`ko@${width}: language selector count is not 1`);
  assert(await page.locator('#languageSelect').inputValue()==='ko',`ko@${width}: selector does not show Korean`);
  assert(await page.locator('.method').count()===8,`ko@${width}: expected 8 picker games`);
  assert(await page.locator('.tool-tab').count()===5,`ko@${width}: expected 5 game tools`);
  const overflow=await page.evaluate(()=>document.documentElement.scrollWidth-window.innerWidth);
  assert(overflow<=2,`ko@${width}: mobile horizontal overflow ${overflow}px`);
  assertMobileHeader(await headerMetrics(page),'ko',width);
  assert(errors.length===0,`ko@${width}: page errors: ${errors.join(' | ')}`);
  await page.close();
}

await browser.close();
if (failed) {
  console.error(problems.join('\n'));
  process.exit(1);
}
console.log('Browser smoke passed: 16 foreign languages scanned; en/ja/es/zh/pt/ar interactive mobile checked at 390px and 360px; Korean mobile/header checked at 390px and 360px.');
