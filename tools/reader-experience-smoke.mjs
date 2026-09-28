import { chromium } from 'playwright';

const base='https://bible-reader-1iz.pages.dev';
const browser=await chromium.launch({headless:true});
const problems=[];
const assert=(ok,message)=>{if(!ok)problems.push(message)};

async function freshPage(path='/'){
  const context=await browser.newContext({viewport:{width:720,height:900}});
  await context.addInitScript(()=>{
    try{
      localStorage.removeItem('bible-reader-navigation-history-v1');
      localStorage.removeItem('bible-reader-focus-mode-v1');
      localStorage.removeItem('bible-reader-verse-marks-v1');
      sessionStorage.clear();
    }catch(_){}
  });
  const page=await context.newPage();
  const errors=[];page.on('pageerror',error=>errors.push(String(error)));
  await page.goto(`${base}${path}`,{waitUntil:'networkidle',timeout:30000});
  await page.locator('#verses .verse').first().waitFor({state:'visible',timeout:15000});
  await page.locator('.reader-history-back').waitFor({state:'visible',timeout:5000});
  return {context,page,errors};
}

{
  const {context,page,errors}=await freshPage('/');

  await page.locator('#searchInput').fill('요14:10-12');
  await page.locator('#searchForm').evaluate(form=>form.requestSubmit());
  await page.waitForFunction(()=>document.querySelector('#bookSelect')?.value==='42'&&document.querySelector('#chapterSelect')?.value==='14',{timeout:15000});
  assert((await page.locator('#verses .verse.searched').count())>=3,'reference search: 요14:10-12 did not mark the verse range');

  const back=page.locator('.reader-history-back');
  const forward=page.locator('.reader-history-forward');
  assert(!(await back.isDisabled()),'history: back button did not enable after reference navigation');
  await back.click();await page.waitForTimeout(350);
  if(!(await back.isDisabled())){await back.click();await page.waitForTimeout(500)}
  assert((await page.locator('#chapterSelect').inputValue())==='3','history: repeated back did not return to the previous chapter');
  assert(!(await forward.isDisabled()),'history: forward button did not enable after going back');
  await forward.click();await page.waitForTimeout(350);
  if(!(await forward.isDisabled())){await forward.click();await page.waitForTimeout(600)}
  assert((await page.locator('#chapterSelect').inputValue())==='14','history: forward did not restore the reference destination');

  await page.locator('.reader-focus-toggle').click();
  assert(await page.locator('body').evaluate(el=>el.classList.contains('reader-focus')),'focus: focus mode did not activate');
  assert(await page.locator('.reader-focus-exit').isVisible(),'focus: mobile/visible exit control missing');
  await page.locator('.reader-focus-exit').click();
  assert(!(await page.locator('body').evaluate(el=>el.classList.contains('reader-focus'))),'focus: focus mode did not exit');

  const v10=page.locator('#verses .verse[data-verse="10"]');
  const v11=page.locator('#verses .verse[data-verse="11"]');
  await v10.click();await v11.click();
  await page.locator('.verse-multi-actionbar').waitFor({state:'visible',timeout:5000});
  assert(await page.locator('.verse-multi-color').isVisible(),'multi-select: color action missing');
  assert(await page.locator('.verse-multi-share').isVisible(),'multi-select: share action missing');

  await page.locator('.verse-multi-color').click();
  await page.locator('.reader-color-blue').click();
  assert((await v10.getAttribute('data-highlight-color'))==='blue','highlight colors: blue did not apply to first verse');
  assert((await v11.getAttribute('data-highlight-color'))==='blue','highlight colors: blue did not apply to second verse');
  const storedColor=await page.evaluate(()=>JSON.parse(localStorage.getItem('bible-reader-verse-marks-v1')||'{}')['krv1961:42:14:10']?.highlightColor);
  assert(storedColor==='blue','highlight colors: selected color was not persisted');
  await page.locator('.reader-undo-button').click();
  await page.waitForTimeout(150);
  assert(!(await v10.evaluate(el=>el.classList.contains('user-highlight'))),'undo: previous highlight state was not restored');

  const shareUrl=await page.evaluate(()=>window.ReaderExperience?.buildShareUrl?.([...document.querySelectorAll('#verses .verse.multi-selected')])||'');
  assert(shareUrl.includes('ref=John.14.10-11'),'share: deep link did not encode selected verse range');
  assert(shareUrl.includes('v=krv1961'),'share: deep link did not preserve translation');

  await page.locator('.verse-multi-done').click();
  await page.keyboard.press('/');
  assert(await page.locator('#searchInput').evaluate(el=>document.activeElement===el),'shortcuts: / did not focus search');
  await page.locator('#searchInput').blur();
  await page.keyboard.press('f');
  assert(await page.locator('body').evaluate(el=>el.classList.contains('reader-focus')),'shortcuts: F did not toggle focus mode');
  await page.keyboard.press('Escape');
  assert(!(await page.locator('body').evaluate(el=>el.classList.contains('reader-focus'))),'shortcuts: Escape did not exit focus mode');

  assert(errors.length===0,`reader experience page errors: ${errors.join(' | ')}`);
  await context.close();
}

{
  const {context,page,errors}=await freshPage('/?v=krv1961&ref=John.14.10-12');
  await page.locator('#verses .verse.deep-linked').first().waitFor({state:'visible',timeout:15000});
  assert((await page.locator('#bookSelect').inputValue())==='42','deep link: book did not restore to John');
  assert((await page.locator('#chapterSelect').inputValue())==='14','deep link: chapter did not restore to 14');
  assert((await page.locator('#verses .verse.deep-linked').count())===3,'deep link: verse range 10-12 was not emphasized');
  assert(errors.length===0,`deep-link page errors: ${errors.join(' | ')}`);
  await context.close();
}

await browser.close();
if(problems.length){console.error(problems.join('\n'));process.exit(1)}
console.log('Reader experience production QA passed: compact reference ranges, history, focus mode, color highlights with undo, share deep links, and keyboard shortcuts work on Cloudflare production.');
