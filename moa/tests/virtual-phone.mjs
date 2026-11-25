// Isolated browser device emulation, not Android OS or native iOS Safari.
// Persistent test profiles never attach to the user's Chrome or hosted Auth.
import assert from 'node:assert/strict';
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import {createHash} from 'node:crypto';
import {chromium,devices} from 'playwright';
import {serve} from '../tools/serve.mjs';
const root=new URL('../',import.meta.url),manifest=JSON.parse(await readFile(new URL('dist/build-manifest.json',root),'utf8'));
assert.equal(manifest.cloudConfigured,false,'Run npm run build for a device-only QA copy first');
const demo=JSON.parse(await readFile(new URL('ui/demo-media.json',root),'utf8')),bytes=Buffer.from(demo.notebook.split(',')[1],'base64');
const photo={name:'virtual-phone-notebook.jpg',mimeType:'image/jpeg',buffer:bytes},photoSha=createHash('sha256').update(bytes).digest('hex');
const runId=new Date().toISOString().replace(/[:.]/g,'-'),evidence=new URL('qa-evidence/virtual-phone-'+runId+'/',root);await mkdir(evidence,{recursive:true});
const server=await serve(),base='http://127.0.0.1:'+server.address().port,results=[],errors=[];
const tempPhotos=async page=>page.evaluate(async()=>{const db=await new Promise((resolve,reject)=>{const r=indexedDB.open('moa-writing-photos-v1',1);r.onupgradeneeded=()=>r.result.createObjectStore('photos',{keyPath:'id'});r.onsuccess=()=>resolve(r.result);r.onerror=()=>reject(r.error);});try{return await new Promise(resolve=>{const r=db.transaction('photos').objectStore('photos').count();r.onsuccess=()=>resolve(r.result);});}finally{db.close();}});
const ready=async page=>page.waitForFunction(()=>!document.querySelector('#writeNow').disabled);
const saved=async page=>{await page.locator('#draftStatus[data-state=saved]').waitFor({state:'attached'});await page.waitForFunction(()=>Boolean(JSON.parse(localStorage.getItem('moa-writing-draft-v1')||'null')?.fields.photos));};
const restored=async page=>{await ready(page);await page.locator('#resumeDraft').tap();await page.waitForFunction(()=>{const image=document.querySelector('#draftMedia img');return image?.complete&&image.naturalWidth>0;});const recovered=await page.locator('#media').evaluate(async input=>({name:input.files[0].name,bytes:Array.from(new Uint8Array(await input.files[0].arrayBuffer()))}));assert.equal(recovered.name,photo.name);assert.equal(createHash('sha256').update(Buffer.from(recovered.bytes)).digest('hex'),photoSha);return recovered;};
try{
 for(const deviceName of (process.env.MOA_QA_VIRTUAL_DEVICES?.split(',')||['Pixel 7','iPhone 13','iPhone SE'])){
  const slug=deviceName.toLowerCase().replace(/[^a-z0-9]+/g,'-'),profile=fileURLToPath(new URL(slug+'-profile/',evidence));
  const {defaultBrowserType,...options}=devices[deviceName],checks=[],requests=[];let context,page;
  const launch=async()=>{context=await chromium.launchPersistentContext(profile,{channel:'chrome',headless:true,...options,reducedMotion:process.env.MOA_QA_REDUCE_MOTION==='1'?'reduce':'no-preference'});context.setDefaultTimeout(12000);await context.addInitScript(()=>{window.__qaClicks=[];for(const name of ['touchstart','touchend','click'])document.addEventListener(name,event=>{const rect=document.querySelector('#discardDraft')?.getBoundingClientRect();const point=event.changedTouches?.[0]||event;window.__qaClicks.push({event:name,id:event.target.closest('button')?.id||event.target.id,x:point.clientX,y:point.clientY,button:rect?{x:rect.x,y:rect.y,w:rect.width,h:rect.height}:null,scrollY,visualTop:visualViewport?.offsetTop,scale:visualViewport?.scale});if(window.__qaClicks.length>15)window.__qaClicks.shift();},true);});context.on('page',p=>p.on('pageerror',error=>errors.push({device:deviceName,message:error.message})));context.on('request',request=>requests.push({url:request.url(),method:request.method()}));page=context.pages()[0]||await context.newPage();page.on('pageerror',error=>errors.push({device:deviceName,message:error.message}));await page.goto(base);await ready(page);};
  const check=async(name,fn)=>{try{await fn();}catch(error){errors.push({device:deviceName,check:name,message:error.message});const diagnostic=await page?.evaluate(()=>({dialogOpen:document.querySelector('#changeDialog')?.open,notice:document.querySelector('#notice')?.textContent,draft:document.querySelector('#draftStatus')?.textContent,clicks:window.__qaClicks})).catch(()=>null);console.log('Virtual phone diagnostic',deviceName,name,JSON.stringify(diagnostic));await page?.screenshot({path:fileURLToPath(new URL(slug+'-failure.png',evidence)),fullPage:true}).catch(()=>{});throw error;}checks.push({name,status:'DONE'});console.log('DONE',deviceName,name);};
  try{
   await launch();
   const engine=context.browser()?.version()||'Chrome persistent context';
   await check('mobile metrics and touch controls fit the portrait viewport',async()=>{
    const metrics=await page.evaluate(()=>({width:innerWidth,scrollWidth:document.documentElement.scrollWidth,touch:navigator.maxTouchPoints,ua:navigator.userAgent,dpr:devicePixelRatio}));assert.equal(metrics.width,options.viewport.width);assert.ok(metrics.touch>0);assert.ok(metrics.scrollWidth<=metrics.width);const buttons=await page.locator('.bottom-nav button').evaluateAll(nodes=>nodes.map(node=>({width:node.getBoundingClientRect().width,height:node.getBoundingClientRect().height})));assert.ok(buttons.every(button=>button.width>=44&&button.height>=44));
   });
   await check('touch photo chooser and reduced keyboard viewport retain caption and original photo',async()=>{
    const choosing=page.waitForEvent('filechooser');await page.locator('#photoNow').tap();const chooser=await choosing;assert.ok(chooser.isMultiple());await chooser.setFiles(photo);await page.locator('#content').tap();await page.keyboard.insertText(deviceName+' 가상폰에서 이어 쓰는 기록');await saved(page);await page.setViewportSize({width:options.viewport.width,height:Math.max(300,options.viewport.height-260)});await page.locator('#entryForm button[type=submit]').scrollIntoViewIfNeeded();assert.ok(await page.locator('#entryForm button[type=submit]').isVisible());assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));assert.equal(await page.locator('#media').evaluate(input=>input.files.length),1);await page.screenshot({path:fileURLToPath(new URL(slug+'-keyboard-viewport.png',evidence))});await page.setViewportSize(options.viewport);
   });
   await check('offline draft autosave completes locally without a cloud upload',async()=>{
    await context.setOffline(true);await page.locator('#content').fill(deviceName+' 오프라인에서도 남긴 초안');await saved(page);assert.equal(await tempPhotos(page),1);assert.equal(await page.locator('#total').textContent(),'0');await context.setOffline(false);
   });
   await check('refresh restores text and the exact original photo bytes',async()=>{
    await page.reload();await restored(page);assert.equal(await page.locator('#content').inputValue(),deviceName+' 오프라인에서도 남긴 초안');await page.screenshot({path:fileURLToPath(new URL(slug+'-recovered.png',evidence)),fullPage:true});
   });
   await check('closing the browser process and reopening the isolated profile restores the draft',async()=>{
    await context.close();context=null;await launch();await restored(page);assert.equal(await page.locator('#content').inputValue(),deviceName+' 오프라인에서도 남긴 초안');
   });
   await check('landscape and portrait resizing keep controls usable; local save clears temporary photos',async()=>{
    await page.setViewportSize({width:options.viewport.height,height:options.viewport.width});assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));await page.screenshot({path:fileURLToPath(new URL(slug+'-landscape.png',evidence))});await page.setViewportSize(options.viewport);await page.locator('#entryForm button[type=submit]').tap();await page.locator('.entry img').waitFor();assert.equal(await page.locator('#total').textContent(),'1');await page.waitForFunction(()=>localStorage.getItem('moa-writing-draft-v1')===null);assert.equal(await tempPhotos(page),0);
   });
   await check('cancel preserves a new photo draft; explicit discard clears only the draft',async()=>{
    await page.locator('.bottom-nav [data-go=write]').tap();await page.locator('#media').setInputFiles(photo);await page.locator('#content').fill('가상폰 폐기 확인용 초안');await saved(page);await page.locator('#discardDraft').tap();await page.locator('#changeDialog').waitFor({state:'visible'});await page.locator('#changeCancel').tap();assert.equal(await page.locator('#media').evaluate(input=>input.files.length),1);await page.locator('#discardDraft').tap();await page.locator('#changeConfirm').tap();await page.waitForFunction(()=>localStorage.getItem('moa-writing-draft-v1')===null);assert.equal(await tempPhotos(page),0);assert.equal(await page.locator('#total').textContent(),'1');
   });
   await check('second process restart retains the saved record and leaves no ghost draft or temporary photo',async()=>{
    await context.close();context=null;await launch();assert.equal(await page.locator('#total').textContent(),'1');assert.ok(!await page.locator('#resumeDraft').isVisible());assert.equal(await tempPhotos(page),0);await page.locator('.recent-card').tap();await page.waitForFunction(()=>document.querySelector('.entry img')?.naturalWidth>0);assert.equal(await page.locator('.entry .body').textContent(),deviceName+' 오프라인에서도 남긴 초안');assert.ok(requests.every(request=>request.url.startsWith(base)||request.url.startsWith('blob:'+base)));assert.ok(requests.every(request=>request.method==='GET'));await page.screenshot({path:fileURLToPath(new URL(slug+'-final.png',evidence)),fullPage:true});
   });
   results.push({device:deviceName,engine,engineKind:'desktop Chrome with mobile device emulation',nativeOS:false,nativeSafari:false,viewport:options.viewport,photoSha256:photoSha,checks,temporaryPhotoRows:await tempPhotos(page),savedRecords:1});
  }finally{await context?.close();}
 }
 assert.deepEqual(errors,[]);
}finally{const report={checkedAt:new Date().toISOString(),scope:'isolated persistent Chrome mobile profiles; local device build; no real owner or hosted Auth; no real OS/native photo picker/keyboard',manifest,photoSha256:photoSha,results,errors,evidenceDirectory:fileURLToPath(evidence)};await writeFile(new URL('qa-evidence/virtual-phone-results.json',root),JSON.stringify(report,null,2));await new Promise(resolve=>server.close(resolve));}
