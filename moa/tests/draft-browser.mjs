// Browser-local drafts only: no hosted requests or diary writes.
import assert from 'node:assert/strict';
import {chromium} from 'playwright';
import {readFile,writeFile} from 'node:fs/promises';
import {serve} from '../tools/serve.mjs';
const root=new URL('../',import.meta.url),key='moa-writing-draft-v1';
const server=await serve(),base='http://127.0.0.1:'+server.address().port,browser=await chromium.launch({channel:'chrome',headless:true}),context=await browser.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true}),results=[],errors=[],requests=[];
const demo=JSON.parse(await readFile(new URL('ui/demo-media.json',root),'utf8'));const original=Buffer.from(demo.notebook.split(',')[1],'base64');
let page=await context.newPage();
context.on('page',p=>p.on('pageerror',e=>errors.push(e.message)));page.on('pageerror',e=>errors.push(e.message));context.on('request',r=>requests.push(r.url()));
const open=async p=>{await p.goto(base);await p.waitForFunction(()=>!document.querySelector('#writeNow').disabled);};
const write=async p=>p.locator('.bottom-nav [data-go=write]').click();
const saved=async p=>p.locator('#draftStatus[data-state=saved]').waitFor({state:'attached'});
const check=async(name,fn)=>{await fn();results.push({name,status:'DONE'});console.log('DONE',name);};
try{
 await open(page);await write(page);
 await check('immediate reload flushes and restores text/date/details without saving a diary record',async()=>{
  await page.locator('#content').fill('아직 저장하지 않은 이야기 <img src=x onerror="window.draftXss=1">');await page.locator('#entryExtras>summary').click();await page.locator('#title').fill('이어 쓰기');await page.locator('#sticker').fill('☕');await page.locator('#decoration').selectOption('sunny');await page.locator('#recordDate').fill('2026-11-21');
  await page.reload();await page.locator('#resumeDraft').click();assert.equal(await page.locator('#content').inputValue(),'아직 저장하지 않은 이야기 <img src=x onerror="window.draftXss=1">');assert.equal(await page.locator('#recordDate').inputValue(),'2026-11-21');assert.equal(await page.locator('#title').inputValue(),'이어 쓰기');assert.equal(await page.locator('#decoration').inputValue(),'sunny');assert.equal(await page.locator('#total').textContent(),'0');assert.equal(await page.evaluate(()=>window.draftXss),undefined);
 });
 await check('closed tab reopens text and the original photo; localStorage contains no file name or bytes',async()=>{
  await page.locator('#media').setInputFiles({name:'PRIVATE-FILE-NAME.jpg',mimeType:'image/jpeg',buffer:original});await saved(page);const raw=await page.evaluate(k=>localStorage.getItem(k),key);assert.ok(!/PRIVATE-FILE-NAME|PRIVATE-BYTES/.test(raw));await page.close();page=await context.newPage();await open(page);await page.locator('#resumeDraft').click();assert.equal(await page.locator('#content').inputValue(),'아직 저장하지 않은 이야기 <img src=x onerror="window.draftXss=1">');assert.equal(await page.locator('#media').evaluate(n=>n.files.length),1);assert.equal(await page.locator('#media').evaluate(n=>n.files[0].name),'PRIVATE-FILE-NAME.jpg');const bytes=await page.locator('#media').evaluate(async n=>Array.from(new Uint8Array(await n.files[0].arrayBuffer())));assert.deepEqual(Buffer.from(bytes),original);await page.waitForFunction(()=>{const image=document.querySelector('#draftMedia img');return image?.complete&&image.naturalWidth>0;});assert.ok(!await page.locator('#draftMediaNotice').isVisible());
  for(const width of [304,320,390,768,1280]){await page.setViewportSize({width,height:844});assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),'overflow '+width);}await page.setViewportSize({width:390,height:844});await page.screenshot({path:new URL('qa-evidence/draft-recovered-390.png',root).pathname.replace(/^\/(.:)/,'$1'),fullPage:true});
 });
 await check('discard cancel/Escape preserves draft; confirm clears it and cannot resurrect on reload',async()=>{
  await page.locator('#discardDraft').click();await page.keyboard.press('Escape');assert.ok(await page.locator('#content').inputValue());await page.locator('#discardDraft').click();await page.locator('#changeConfirm').click();assert.equal(await page.locator('#content').inputValue(),'');assert.equal(await page.evaluate(k=>localStorage.getItem(k),key),null);await page.reload();await write(page);assert.equal(await page.locator('#content').inputValue(),'');
 });
 await check('successful record save clears draft while the saved record survives reload',async()=>{
  await page.locator('#content').fill('정식으로 저장할 기록');await saved(page);await page.locator('#entryForm button[type=submit]').click();await page.locator('.entry strong').filter({hasText:'정식으로 저장할 기록'}).waitFor();assert.equal(await page.evaluate(k=>localStorage.getItem(k),key),null);await page.reload();await page.getByRole('button',{name:'정식으로 저장할 기록 기록 열기',exact:true}).waitFor();await write(page);assert.equal(await page.locator('#content').inputValue(),'');
 });
 await check('another tab change is reported; old tab cannot overwrite or resurrect discarded draft',async()=>{
  await page.locator('#content').fill('첫 창');await saved(page);const other=await context.newPage();await open(other);await other.locator('#resumeDraft').click();await other.locator('#content').fill('둘째 창');await saved(other);await page.locator('#content').fill('첫 창을 계속 쓰기');await page.locator('#draftStatus[data-state=conflict]').waitFor({state:'attached'});assert.equal(await page.evaluate(k=>JSON.parse(localStorage.getItem(k)).fields.content,key),'둘째 창');await other.locator('#discardDraft').click();await other.locator('#changeConfirm').click();await page.locator('#content').fill('옛 초안 부활 시도');await page.waitForTimeout(500);assert.equal(await page.evaluate(k=>localStorage.getItem(k),key),null);await other.close();await page.reload();await write(page);assert.equal(await page.locator('#content').inputValue(),'');
 });
 await check('quota failure is visible, keeps text, and does not pretend to have saved',async()=>{
  await page.evaluate(()=>{const original=Storage.prototype.setItem;window.restoreDraftStorage=()=>Storage.prototype.setItem=original;Storage.prototype.setItem=function(k,v){if(k==='moa-writing-draft-v1')throw new DOMException('quota','QuotaExceededError');return original.call(this,k,v);};});await page.locator('#content').fill('실패해도 글은 남아야 한다');await page.locator('#draftStatus[data-state=unavailable]').waitFor({state:'attached'});assert.equal(await page.locator('#content').inputValue(),'실패해도 글은 남아야 한다');assert.equal(await page.evaluate(k=>localStorage.getItem(k),key),null);await page.evaluate(()=>window.restoreDraftStorage());await page.locator('#content').fill('다시 저장 가능');await saved(page);await page.locator('#discardDraft').click();await page.locator('#changeConfirm').click();assert.equal(await page.evaluate(k=>localStorage.getItem(k),key),null);
 });
 assert.deepEqual(errors,[]);assert.ok(requests.every(url=>url.startsWith(base)||url.startsWith('blob:'+base)));
}finally{await writeFile(new URL('qa-evidence/draft-browser-results.json',root),JSON.stringify({manifest:JSON.parse(await readFile(new URL('dist/build-manifest.json',root),'utf8')),scope:'isolated device browser, no hosted writes',results,errors},null,2));await context.close();await browser.close();await new Promise(r=>server.close(r));}
