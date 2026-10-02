import { chromium } from 'playwright';

const base='https://pc-checkup.pages.dev';
const browser=await chromium.launch({headless:true});
const context=await browser.newContext({viewport:{width:390,height:844},locale:'ko-KR'});
const page=await context.newPage();

async function assert(condition,message){if(!condition)throw new Error(message)}

await page.goto(`${base}/checkup.html`,{waitUntil:'networkidle',timeout:30000});
await assert(await page.locator('[data-device-experience="pc"]').isVisible(),'PC result summary missing');
await assert(await page.getByRole('button',{name:'결과 복사'}).isVisible(),'PC copy action missing');
await assert(await page.getByRole('button',{name:'결과 공유'}).isVisible(),'PC share action missing');
await page.locator('[data-id="keyboard"] .pill.ok').click();
await page.waitForTimeout(50);
await assert((await page.locator('[data-device-experience="pc"] [data-x="ok"]').textContent())==='1','PC result summary did not sync');
await page.locator('[data-device-experience="pc"] summary').click();
await assert((await page.locator('[data-device-experience="pc"] [data-manual]').count())===6,'PC manual checklist count mismatch');

await page.goto(`${base}/mobile.html`,{waitUntil:'networkidle',timeout:30000});
await assert(await page.locator('#nextMobileCheck').isVisible(),'mobile next-incomplete control missing');
await assert(await page.locator('[data-device-experience="mobile"]').isVisible(),'mobile result summary missing');
await assert((await page.locator('#nextMobileCheck').getAttribute('data-target'))==='touch','mobile next target should begin with touch');
await page.locator('[data-test="touch"] [data-result="ok"]').click();
await page.waitForTimeout(100);
await assert((await page.locator('#nextMobileCheck').getAttribute('data-target'))==='display','mobile next target did not advance');
await assert((await page.locator('[data-device-experience="mobile"] [data-x="ok"]').textContent())==='1','mobile result summary did not sync');
await page.locator('[data-device-experience="mobile"] summary').click();
await assert((await page.locator('[data-device-experience="mobile"] [data-manual]').count())===6,'mobile manual checklist count mismatch');

await browser.close();
console.log('DEVICE CHECKUP experience production QA PASS: next incomplete, summary sync, copy/share controls, manual checklist.');