import { chromium } from 'playwright';

const base=process.env.EXPERIENCE_TEST_BASE||'https://random-ppobgi.pages.dev';
const browser=await chromium.launch({headless:true});
const context=await browser.newContext({viewport:{width:390,height:844},locale:'ko-KR',reducedMotion:'reduce'});
await context.addInitScript(()=>{
  const listeners={};
  const track={addEventListener:(name,fn)=>{listeners[name]=fn},stop:()=>{}};
  const fakeStream={getVideoTracks:()=>[track],getTracks:()=>[track]};
  Object.defineProperty(navigator,'mediaDevices',{configurable:true,value:{getDisplayMedia:async()=>fakeStream}});
  class FakeRecorder{
    static isTypeSupported(){return true}
    constructor(){this.state='inactive';this.mimeType='video/webm'}
    start(){this.state='recording'}
    stop(){this.state='inactive';this.onstop?.()}
  }
  Object.defineProperty(window,'MediaRecorder',{configurable:true,value:FakeRecorder});
});
const page=await context.newPage();
const errors=[];page.on('pageerror',e=>errors.push(String(e)));
await page.goto(`${base}/`,{waitUntil:'networkidle',timeout:30000});

const assert=(ok,msg)=>{if(!ok)throw new Error(msg)};
await page.locator('#recordPickerBtn').waitFor({state:'visible'});
await assert(!(await page.locator('#recordPickerBtn').isDisabled()),'record control should be enabled with supported APIs');
await page.locator('#recordPickerBtn').click();
await assert(await page.locator('#recordPickerBtn').evaluate(el=>el.classList.contains('recording')),'recording state did not start');
await page.locator('#recordPickerBtn').click();
await assert(!(await page.locator('#recordPickerBtn').evaluate(el=>el.classList.contains('recording'))),'recording state did not stop');

await page.locator('#nameTab').click();
await page.locator('#names').fill('Alice\nBob\nCharlie');
page.once('dialog',dialog=>dialog.accept('Class A'));
await page.locator('#saveSetBtn').click();
await assert(await page.locator('#savedSetSelect option').filter({hasText:'Class A'}).count()===1,'saved participant set missing');
await page.locator('#names').fill('');
await page.locator('#savedSetSelect').selectOption({label:'Class A'});
await page.locator('#loadSetBtn').click();
await assert((await page.locator('#names').inputValue()).includes('Alice'),'saved participant set did not load');

await page.locator('.method[data-method="wheel"]').click();
await page.locator('#pickBtn').click();
await page.waitForTimeout(100);
const show=page.locator('#showAllBtn');
if(await show.isVisible())await show.click();
await page.locator('#resultBlock.show').waitFor({state:'visible',timeout:5000});
await assert(await page.locator('#copyPickerResult').isVisible(),'copy result action missing');
await assert(await page.locator('#sharePickerResult').isVisible(),'share result action missing');
await page.waitForTimeout(100);
await assert(await page.locator('#pickerHistoryList .picker-history-item').count()>=1,'recent result was not stored');
await assert(errors.length===0,`page errors: ${errors.join(' | ')}`);
const overflow=await page.evaluate(()=>document.documentElement.scrollWidth-window.innerWidth);
await assert(overflow<=2,`mobile horizontal overflow ${overflow}px`);

await browser.close();
console.log('Random picker experience QA PASS: recording state, saved lists, result actions and recent history.');