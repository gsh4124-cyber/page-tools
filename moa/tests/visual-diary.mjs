// Populated visual QA uses only an isolated local IndexedDB and CC0 sample media.
// Refuse a cloud-configured build; never seed the owner's actual diary.
import assert from 'node:assert/strict';
import {readFile,writeFile} from 'node:fs/promises';
import {chromium} from 'playwright';
import {serve} from '../tools/serve.mjs';
import {openView} from './navigation.mjs';
import {today} from '../core.mjs';
const manifest=JSON.parse(await readFile(new URL('../dist/build-manifest.json',import.meta.url),'utf8'));
assert.equal(manifest.cloudConfigured,false);
const photos=JSON.parse(await readFile(new URL('../ui/demo-media.json',import.meta.url),'utf8'));
const server=await serve(),base='http://127.0.0.1:'+server.address().port;
let browser;const errors=[],checks=[];
try{
 browser=await chromium.launch({channel:'chrome',headless:true});
 const context=await browser.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true});
 await context.route('**/*',route=>route.request().url().startsWith(base)?route.continue():route.abort());
 const page=await context.newPage();page.on('pageerror',error=>errors.push(error.message));
 await page.goto(base);await page.waitForFunction(()=>!document.querySelector('#writeNow').disabled);
 const examples=[
  {title:'노트를 펼친 아침',text:'노트를 펴고 오늘 기억하고 싶은 일부터 적어 보기로 했다.',photo:'notebook'},
  {title:'비가 그치고, 다시 걷기 시작한 주말의 해변 산책',text:'비가 그친 뒤 해변을 걸었다. 돌아오는 길에 사진을 한 장 남겼다.\n\n사진을 보니 파도 소리도 다시 생각난다.',photo:'surf'}
 ];
 for(const example of examples){
  await openView(page,'write');await page.locator('#recordDate').fill(today());
  await page.locator('#title').fill(example.title);await page.locator('#content').fill(example.text);
  await page.locator('#media').setInputFiles({name:example.photo+'.jpg',mimeType:'image/jpeg',buffer:Buffer.from(photos[example.photo].split(',')[1],'base64')});
  await page.locator('#entryForm button[type=submit]').click();await page.locator('#entries img').first().waitFor();
  await page.waitForFunction(()=>!document.querySelector('#writeNow').disabled);
 }
 await page.locator('#notice').waitFor({state:'hidden'});await openView(page,'home');await page.locator('#recentEntries img').first().waitFor();
 await page.waitForFunction(()=>[...document.querySelectorAll('#recentEntries img')].length===2&&[...document.querySelectorAll('#recentEntries img')].every(img=>img.complete&&img.naturalWidth>0));
 assert.equal(await page.locator('.recent-card.has-photo').count(),2);checks.push('Two real local fixture photos appear in recent records');
 for(const view of ['home','write','calendar','feed','habits','archive']){
  await openView(page,view);
  for(const width of [304,320,390,768,1280]){
   await page.setViewportSize({width,height:844});
   assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=document.documentElement.clientWidth),view+' overflow at '+width);
   if((view==='home'&&(width===390||width===1280))||(width===390&&['write','calendar','feed'].includes(view))){
    await page.screenshot({path:new URL(`../qa-evidence/populated-${view}-${width}.png`,import.meta.url).pathname.replace(/^\/(.:)/,'$1'),fullPage:true});
   }
  }
 }
 checks.push('Populated/long-title home and all five workspaces fit 304/320/390/768/1280px');
 await openView(page,'home');await page.setViewportSize({width:390,height:844});
 await page.getByRole('button',{name:examples[1].title+' 기록 열기',exact:true}).press('Enter');
 assert.ok(await page.locator('#feedSection').isVisible());assert.ok((await page.locator('#feedHeading').textContent()).includes(today()));
 checks.push('Keyboard opens the real fixture record date from the recent list');
 assert.deepEqual(errors,[]);await context.close();
 console.log('DONE populated diary visual QA:',checks.length);
}finally{
 await browser?.close();await new Promise(resolve=>server.close(resolve));
 await writeFile(new URL('../qa-evidence/visual-diary-results.json',import.meta.url),JSON.stringify({manifest,type:'local synthetic fixtures and CC0 media; no hosted writes',checks,errors},null,2));
}
