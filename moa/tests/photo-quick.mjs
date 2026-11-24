// Isolated browser-local photo diary, never the owner's hosted data.
import assert from 'node:assert/strict';
import {readFile,writeFile} from 'node:fs/promises';
import {chromium} from 'playwright';
import {serve} from '../tools/serve.mjs';
const root=new URL('../',import.meta.url),photos=JSON.parse(await readFile(new URL('ui/demo-media.json',root),'utf8'));
const photo={name:'notebook.jpg',mimeType:'image/jpeg',buffer:Buffer.from(photos.notebook.split(',')[1],'base64')};
const server=await serve(),base='http://127.0.0.1:'+server.address().port,browser=await chromium.launch({channel:'chrome',headless:true}),context=await browser.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true}),page=await context.newPage(),results=[],errors=[],requests=[];
page.on('pageerror',e=>errors.push(e.message));page.on('request',r=>requests.push({url:r.url(),method:r.method()}));page.on('dialog',d=>d.accept());
await context.addInitScript(()=>{window.revokedPreviews=0;const revoke=URL.revokeObjectURL.bind(URL);URL.revokeObjectURL=url=>{window.revokedPreviews++;revoke(url);};});
const check=async(name,fn)=>{await fn();results.push({name,status:'DONE'});console.log('DONE',name);};
try{
 await page.goto(base);await page.waitForFunction(()=>!document.querySelector('#photoNow').disabled);
 await check('home photo action opens chooser; draft previews stay private with optional details collapsed',async()=>{
  const picker=page.waitForEvent('filechooser');await page.locator('#photoNow').click();await (await picker).setFiles(photo);
  await page.waitForFunction(()=>{const img=document.querySelector('#draftMedia img');return img?.complete&&img.naturalWidth>0;});assert.equal(await page.locator('#entryExtras').getAttribute('open'),null);assert.equal(await page.locator('#title').inputValue(),'');assert.equal(await page.locator('#total').textContent(),'0');assert.ok(requests.every(x=>(x.url.startsWith(base)||x.url.startsWith('blob:'+base))&&x.method==='GET'));
  for(const width of [304,320,390,768,1280]){await page.setViewportSize({width,height:844});assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=document.documentElement.clientWidth),'photo editor overflow '+width);await page.screenshot({path:new URL(`qa-evidence/photo-quick-${width}.png`,root).pathname.replace(/^\/(.:)/,'$1'),fullPage:true});}
  await page.setViewportSize({width:390,height:844});
 });
 await check('one-sentence photo entry saves without a title and reopens after reload',async()=>{
  const line='새 노트에 첫 줄을 적었다';await page.locator('#content').fill(line);await page.locator('#entryForm button[type=submit]').click();await page.locator('.entry img').waitFor();assert.equal(await page.locator('.entry strong').textContent(),line);assert.equal(await page.locator('.entry .body').textContent(),line);assert.equal(await page.locator('#draftMedia img').count(),0);assert.equal(await page.locator('#media').evaluate(n=>n.files.length),0);
  await page.reload();await page.getByRole('button',{name:line+' 기록 열기',exact:true}).click();await page.waitForFunction(()=>{const img=document.querySelector('.entry img');return img?.complete&&img.naturalWidth>0;});assert.equal(await page.locator('.entry strong').textContent(),line);
 });
 await check('individual attachment removal preserves other files and draft across menus; photo-only entry works',async()=>{
  await page.locator('.bottom-nav [data-go=write]').click();await page.locator('#media').setInputFiles([photo,{...photo,name:'second.jpg'}]);assert.equal(await page.locator('#draftMedia img').count(),2);const before=await page.evaluate(()=>window.revokedPreviews);
  await page.getByRole('button',{name:'첨부 1 빼기',exact:true}).click();assert.equal(await page.locator('#media').evaluate(n=>n.files[0].name),'second.jpg');assert.equal(await page.locator('#draftMedia img').count(),1);assert.ok(await page.evaluate(()=>window.revokedPreviews)>before);
  await page.locator('.bottom-nav [data-go=home]').click();await page.locator('.bottom-nav [data-go=write]').click();assert.equal(await page.locator('#draftMedia img').count(),1);assert.equal(await page.locator('#media').evaluate(n=>n.files.length),1);
  await page.locator('#entryForm button[type=submit]').click();await page.locator('.entry strong').filter({hasText:'사진 기록'}).waitFor();assert.equal(await page.locator('#total').textContent(),'2');
 });
 await check('empty draft and unsupported files cannot save; failed save preserves caption/files and exposes no executable preview',async()=>{
  await page.locator('.bottom-nav [data-go=write]').click();await page.locator('#entryForm button[type=submit]').click();await page.getByText('사진이나 이야기를 먼저 남겨 주세요.',{exact:true}).waitFor();assert.equal(await page.locator('#total').textContent(),'2');
  await page.locator('#content').fill('<img src=x onerror="window.photoXss=1">');await page.locator('#media').setInputFiles({name:'<script>bad</script>.svg',mimeType:'image/svg+xml',buffer:Buffer.from('<svg onload="window.photoXss=1"/>')});assert.equal(await page.locator('#draftMedia img').count(),0);await page.locator('#entryForm button[type=submit]').click();await page.getByText('JPEG·PNG·WebP·GIF 사진 또는 MP4·WebM·MOV 영상만 첨부할 수 있어요.',{exact:true}).waitFor();assert.equal(await page.locator('#media').evaluate(n=>n.files.length),1);assert.equal(await page.evaluate(()=>window.photoXss),undefined);assert.equal(await page.locator('#total').textContent(),'2');
  await page.getByRole('button',{name:'첨부 1 빼기',exact:true}).click();assert.equal(await page.locator('#media').evaluate(n=>n.files.length),0);await page.locator('#entryForm button[type=submit]').click();await page.locator('.entry strong').filter({hasText:'<img src=x'}).waitFor();assert.equal(await page.evaluate(()=>window.photoXss),undefined);
 });
 await check('seven attachments are refused with draft and records intact',async()=>{
  await page.locator('.bottom-nav [data-go=write]').click();await page.locator('#media').setInputFiles(Array.from({length:7},(_,i)=>({...photo,name:`photo-${i}.jpg`})));await page.locator('#content').fill('첨부 수 제한 초안');await page.locator('#entryForm button[type=submit]').click();await page.getByText('첨부 파일은 최대 6개예요.',{exact:true}).waitFor();assert.equal(await page.locator('#media').evaluate(n=>n.files.length),7);assert.equal(await page.locator('#content').inputValue(),'첨부 수 제한 초안');assert.equal(await page.locator('#total').textContent(),'3');
 });
 assert.deepEqual(errors,[]);
}finally{await writeFile(new URL('qa-evidence/photo-quick-results.json',root),JSON.stringify({manifest:JSON.parse(await readFile(new URL('dist/build-manifest.json',root),'utf8')),authentication:'isolated local IndexedDB, no hosted Supabase writes',results,errors},null,2));await context.close();await browser.close();await new Promise(r=>server.close(r));}
