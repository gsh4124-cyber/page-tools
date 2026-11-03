import { chromium } from 'playwright';
import { mkdir } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import assert from 'node:assert/strict';
const proofDir=new URL('../qa_evidence/live/',import.meta.url);
await mkdir(proofDir,{recursive:true});
const base=process.env.DEVICE_TEST_BASE||'https://pc-checkup.pages.dev';
const browser=await chromium.launch({headless:true});
const locales=['ko','en','ja','es','de','fr','pt','it','nl','id','vi','zh-CN','ru'];
for(const locale of locales){
  const context=await browser.newContext({viewport:{width:390,height:844},locale:locale==='ko'?'ko-KR':locale,permissions:['clipboard-read','clipboard-write']});
  const page=await context.newPage(),errors=[];
  page.on('pageerror',error=>{
    const stack=error.stack||'';
    const knownRum=error.message==='int64'&&stack.includes('https://pagead2.googlesyndication.com/')&&stack.includes('/rum.js:')&&!stack.includes(base+'/');
    if(!knownRum)errors.push(String(error));
  });
  const prefix=locale==='ko'?'':locale+'/';
  await page.goto(`${base}/${prefix}checkup.html?qa=1`,{waitUntil:'domcontentloaded',timeout:30000});
  const card=page.locator('[data-device-experience="pc"]');
  await card.waitFor({state:'visible'});
  assert.equal(await card.locator('[data-manual]').count(),6,locale+' PC manual items');
  await page.locator('[data-id="keyboard"] .pill.ok').click();
  await page.waitForFunction(()=>document.querySelector('[data-device-experience="pc"] [data-x="ok"]').textContent==='1');
  if(locale==='ko'||locale==='en'){
    await card.locator('[data-copy]').click();
    await page.waitForFunction(()=>Boolean(document.querySelector('[data-copy-status]').textContent));
    const status=await card.locator('[data-copy-status]').textContent();
    assert.equal(status,locale==='ko'?'복사됨':'Copied',locale+' copy feedback');
    assert((await page.evaluate(()=>navigator.clipboard.readText())).includes(locale==='ko'?'PC 전체 점검':'Full PC check'));
    await page.screenshot({path:fileURLToPath(new URL(`${locale}-pc-results.png`,proofDir)),fullPage:true});
  }
  await page.reload({waitUntil:'domcontentloaded'});
  await page.waitForFunction(()=>document.querySelector('[data-device-experience="pc"] [data-x="ok"]')?.textContent==='1');
  await page.goto(`${base}/${prefix}mobile.html?qa=1`,{waitUntil:'domcontentloaded',timeout:30000});
  await page.locator('[data-device-experience="mobile"]').waitFor({state:'visible'});
  assert.equal(await page.locator('#nextMobileCheck').getAttribute('data-target'),'touch',locale+' initial next test');
  await page.locator('[data-test="touch"] [data-result="ok"]').click();
  await page.waitForFunction(()=>document.querySelector('#nextMobileCheck').dataset.target==='display');
  assert.equal(await page.locator('[data-device-experience="mobile"] [data-x="ok"]').textContent(),'1');
  assert.equal(await page.locator('[data-device-experience="mobile"] [data-manual]').count(),6);
  assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=window.innerWidth+2),true,locale+' overflow');
  assert.deepEqual(errors,[],locale+' runtime errors');
  await context.close();
}
await browser.close();
console.log('DEVICE CHECKUP experience PASS: 13 locales, summaries, next checks, persistent results, copy contents/feedback and runtime errors.');
