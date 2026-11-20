import {chromium,firefox,webkit} from 'playwright';
import {createServer} from 'node:http';
import fs from 'node:fs/promises';
import path from 'node:path';
import assert from 'node:assert/strict';
import {fileURLToPath} from 'node:url';
import {chooseMemory} from './picker-test-helpers.mjs';

const local=process.argv.includes('--local'),output=process.env.MEMORY_DRAFT_EVIDENCE||fileURLToPath(new URL('../qa_evidence/live/memory-draft/',import.meta.url));
await fs.mkdir(output,{recursive:true});let server,base=process.env.MEMORY_QUIZ_BASE||'https://bible-reader-1iz.pages.dev';
if(local){const root=path.resolve(fileURLToPath(new URL('../dist/',import.meta.url)));server=createServer(async(req,res)=>{try{
 let file=path.resolve(root,'.'+new URL(req.url,'http://local').pathname);if(file!==root&&!file.startsWith(root+path.sep))throw Error('path');if((await fs.stat(file)).isDirectory())file=path.join(file,'index.html');res.setHeader('Content-Type',({'.html':'text/html; charset=utf-8','.js':'text/javascript','.css':'text/css','.json':'application/json'})[path.extname(file)]||'application/octet-stream');res.end(await fs.readFile(file));
}catch{res.writeHead(404).end();}});await new Promise(r=>server.listen(0,'127.0.0.1',r));base=`http://127.0.0.1:${server.address().port}`;}
const key='bible-reader-memory-passages-v1',refs=[{bookIndex:42,chapter:3,verse:16},{bookIndex:42,chapter:3,verse:17}],observations=[],engines={chromium,firefox,webkit};
const languages=['ko','en','fr','de','zh','ru','la','pt','ar'];
let debugPage,debugId;
async function snapshot(dialog){return dialog.locator('textarea').evaluateAll(nodes=>nodes.map(n=>({value:n.value,book:n.dataset.book,chapter:n.dataset.chapter,verse:n.dataset.verse,invalid:n.getAttribute('aria-invalid')})));}
async function openMemory(page,mode,view){
 const entry=page.locator(mode==='practice'?'.memory-practice-menu-button':'.memory-menu-button');if(!await entry.isVisible())await page.locator('#toolbarMoreToggle').click();await entry.click();
 await page.waitForFunction(()=>!document.querySelector('#memoryQuizDialog .memory-primary').disabled);await page.locator('#memoryView'+(view==='verse'?'Verse':'Chapter')).check();await page.locator('#memoryQuizDialog .memory-primary').click();
}
async function defaultKeep(guard){assert(await guard.isVisible());assert(await guard.locator('.memory-leave-keep').evaluate(n=>n===document.activeElement),'Keeping work receives initial focus');}
async function assertRestored(dialog,before,comparison){assert.deepEqual(await snapshot(dialog),before,'Every original draft and invalid state survives');assert.equal(await dialog.locator('.memory-row-feedback').allTextContents().then(a=>a.join('')),comparison,'Inline grading survives the range editor');assert.equal(await dialog.locator('.memory-setup-resume').count(),0);}
try{for(const engine of (process.env.MEMORY_DRAFT_ENGINES||'chromium').split(',')){
 const browser=await engines[engine].launch({headless:true});
 try{for(const [li,language] of languages.entries())for(const mode of ['practice','exam'])for(const view of ['verse','chapter']){
  const [width,height]=[[320,740],[390,844],[844,390],[1280,800]][li%4],id=`${engine}-${language}-${mode}-${view}`;debugId=id;
  const context=await browser.newContext({viewport:{width,height},hasTouch:true});await context.route(/googlesyndication|doubleclick|adtrafficquality/,r=>r.abort());
  await context.addInitScript(({key,refs,dark})=>{localStorage.setItem(key,JSON.stringify(refs));localStorage.setItem('bible-reader-theme',dark?'dark':'light');},{key,refs,dark:li%2===1});
  if(language==='ko')await context.addInitScript(()=>{const v=new EventTarget();Object.assign(v,{width:innerWidth,height:innerHeight,offsetTop:0,offsetLeft:0,scale:1});Object.defineProperty(window,'visualViewport',{configurable:true,value:v});window.__draftViewport=v;});
  const page=await context.newPage(),errors=[];debugPage=page;page.on('pageerror',e=>errors.push(String(e)));
  try{
   await page.goto(base+(language==='ko'?'/':`/${language}/`)+'?qa=memory-draft',{waitUntil:'domcontentloaded'});await page.waitForFunction(()=>document.querySelector('#status')?.hidden&&window.BibleMemory&&document.querySelector('.memory-practice-menu-button'),{},{timeout:40000});
   const l=await page.evaluate(code=>BibleMemory.labels(code),language),reader=await page.evaluate(()=>({book:state.bookIndex,chapter:state.chapter}));
   const dialog=page.locator('#memoryQuizDialog'),guard=page.locator('.memory-leave-confirm');
   await openMemory(page,mode,view);await page.keyboard.press('Escape');await dialog.waitFor({state:'detached'});assert.equal(await guard.count(),0,'An untouched empty attempt closes without confirmation');
   await openMemory(page,mode,view);
   const answers=await page.evaluate(refs=>refs.map(ref=>currentBookData.chapters.find(c=>Number(c.chapter)===ref.chapter).verses.find(v=>Number(v.verse)===ref.verse).text),refs);
   const inputs=dialog.locator('textarea'),first=inputs.first();await first.fill('partial draft');
   if(mode==='practice')await dialog.locator('.memory-practice-reveal').click();
   await dialog.locator('.memory-primary').click();
   if(view==='chapter'){
    if(mode==='practice')await dialog.locator('.memory-practice-row').nth(1).locator('summary').click();
    await inputs.nth(1).fill('other draft');
    if(mode==='practice')await dialog.locator('.memory-practice-row').first().locator('summary').click();
   }
   const before=await snapshot(dialog),comparison=(await dialog.locator('.memory-row-feedback').allTextContents()).join('');
   await dialog.locator('.memory-close').click();await defaultKeep(guard);assert.equal(await guard.locator('h3').textContent(),l.protectDraftTitle);assert.equal(await guard.locator('.memory-leave-discard').textContent(),l.discardClose);
   await guard.locator('.memory-leave-keep').press('Enter');await assertRestored(dialog,before,comparison);
   await page.keyboard.press('Escape');await defaultKeep(guard);await page.keyboard.press('Escape');assert.equal(await guard.count(),0);await assertRestored(dialog,before,comparison);
   if(language==='ko'){
    await page.evaluate(()=>{Object.assign(window.__draftViewport,{height:240,offsetTop:20});window.__draftViewport.dispatchEvent(new Event('resize'));});await page.waitForFunction(()=>parseFloat(document.querySelector('#memoryQuizDialog').style.getPropertyValue('--memory-view-height'))===240);
    await dialog.locator('.memory-close').click();await defaultKeep(guard);
    const bounds=await guard.evaluate(d=>{const b=d.getBoundingClientRect();return {x:b.x,y:b.y,right:b.right,bottom:b.bottom,overflow:d.scrollWidth>d.clientWidth+1};});assert(bounds.x>=-1&&bounds.y>=19&&bounds.right<=width+1&&bounds.bottom<=261&&!bounds.overflow,'Draft prompt fits the simulated keyboard viewport');
    for(const button of await guard.locator('button').all()){const b=await button.boundingBox();assert(b.height>=44&&b.y>=19&&b.y+b.height<=261,'Both keep and discard actions remain reachable');}
    if(mode==='practice'&&view==='chapter')await page.screenshot({path:path.join(output,`${id}-keyboard.png`)});
    await page.keyboard.press('Escape');await page.evaluate(()=>{Object.assign(window.__draftViewport,{height:innerHeight,offsetTop:0});window.__draftViewport.dispatchEvent(new Event('resize'));});await page.waitForFunction(()=>parseFloat(document.querySelector('#memoryQuizDialog').style.getPropertyValue('--memory-view-height'))===innerHeight);
   }
   await dialog.locator('.memory-aids button').click();assert(await dialog.locator('.memory-setup-resume').evaluate(n=>n===document.activeElement));assert.equal(await dialog.locator('textarea').count(),0,'The parked answers are not editable in the range editor');
   await page.locator(mode==='practice'?'#memoryModeExam':'#memoryModePractice').check();await page.locator(view==='verse'?'#memoryViewChapter':'#memoryViewVerse').check();
   if(language==='ko'&&mode==='practice'&&view==='verse'){
    let release;const gate=new Promise(r=>release=r);await page.route('**/scripture/krv1961/Genesis.json',async route=>{const response=await route.fetch();await gate;await route.fulfill({response});});
    const response=page.waitForResponse(r=>r.url().includes('/scripture/krv1961/Genesis.json'));await chooseMemory(page,'memoryBook',0);await dialog.locator('.memory-setup-resume').click();release();await response;await page.evaluate(()=>new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r))));await page.unroute('**/scripture/krv1961/Genesis.json');
   }else await dialog.locator('.memory-setup-resume').click();
   await assertRestored(dialog,before,comparison);assert.equal(await page.locator('#memoryQuizTitle').textContent(),mode==='practice'?l.practiceTitle:l.title);
   if(mode==='practice'){assert.equal(await dialog.locator('.memory-practice-reveal').textContent(),l.showPracticeText);assert.equal(await dialog.locator('.memory-practice-text:visible').count(),0,'Return preserves passage visibility');}
   await dialog.locator('.memory-aids button').click();
   if(language==='ko'&&mode==='practice'&&view==='chapter')await page.screenshot({path:path.join(output,`${id}-resume.png`)});
   await page.locator(mode==='practice'?'#memoryModeExam':'#memoryModePractice').check();await dialog.locator('.memory-primary').click();await defaultKeep(guard);assert.equal(await guard.locator('.memory-leave-discard').textContent(),l.discardStart);assert.equal(await guard.locator('#memoryLeavePrompt').textContent(),l.restartDraftPrompt);
   if(language==='ko'&&mode==='practice'&&view==='chapter')await page.screenshot({path:path.join(output,`${id}-restart.png`)});
   await guard.locator('.memory-leave-keep').press('Enter');await assertRestored(dialog,before,comparison);
   await dialog.locator('.memory-aids button').click();await dialog.locator('.memory-close').click();await defaultKeep(guard);await page.keyboard.press('Escape');await assertRestored(dialog,before,comparison);
   // Completing the original attempt proves that first-check scores, current units and confirmations survived.
   if(mode==='practice'&&view==='chapter'){
    for(let i=0;i<2;i++){await dialog.locator('.memory-practice-row').nth(i).locator('summary').click();await inputs.nth(i).fill(answers[i]);await dialog.locator('.memory-primary').click();}
    await dialog.locator('.memory-primary').click();
   }else if(view==='chapter'){
    for(let i=0;i<2;i++)await inputs.nth(i).fill(answers[i]);await dialog.locator('.memory-primary').click();await dialog.locator('.memory-primary').click();
   }else{
    for(let i=0;i<2;i++){await first.fill(answers[i]);await dialog.locator('.memory-primary').click();await dialog.locator('.memory-primary').click();}
   }
   if(mode==='practice')assert.equal(await dialog.locator('.memory-score').textContent(),'100%');else assert.notEqual(await dialog.locator('.memory-score').textContent(),'100%','Exam first wrong check remains reflected after resuming');
   await dialog.locator('.memory-retry-all').click();await dialog.locator('textarea').first().fill('new draft');await dialog.locator('.memory-aids button').click();await page.locator(mode==='practice'?'#memoryModeExam':'#memoryModePractice').check();await page.locator(view==='verse'?'#memoryViewChapter':'#memoryViewVerse').check();
   await dialog.locator('.memory-primary').click();await defaultKeep(guard);await guard.locator('.memory-leave-discard').click();assert((await dialog.locator('textarea').evaluateAll(nodes=>nodes.map(n=>n.value))).every(v=>v===''),'Only explicit discard starts an empty new attempt');assert.equal(await page.locator('#memoryQuizTitle').textContent(),mode==='practice'?l.title:l.practiceTitle);
   await dialog.locator('textarea:visible').first().fill('close draft');await dialog.locator('.memory-close').click();await defaultKeep(guard);
   if(language==='ko'&&mode==='practice'&&view==='chapter')await page.screenshot({path:path.join(output,`${id}-close.png`)});
   await guard.locator('.memory-leave-discard').click();await dialog.waitFor({state:'detached'});assert.equal(await guard.count(),0);
   await openMemory(page,mode,view);assert((await dialog.locator('textarea').evaluateAll(nodes=>nodes.map(n=>n.value))).every(v=>v===''));await page.keyboard.press('Escape');await dialog.waitFor({state:'detached'});
   assert.deepEqual(await page.evaluate(key=>JSON.parse(localStorage.getItem(key)),key),refs);assert.deepEqual(await page.evaluate(()=>({book:state.bookIndex,chapter:state.chapter})),reader);
   assert.deepEqual(await page.evaluate(()=>Object.keys(localStorage).filter(k=>k.startsWith('bible-reader-memory-')).sort()),[key],'Answers and suspended screens are never written to browser storage');assert.deepEqual(errors,[]);
   observations.push({engine,language,mode,view,width,height,range_resume:true,cancel_defaults_to_keep:true,escape_preserves_work:true,setup_close_preserves_work:true,restart_requires_explicit_discard:true,first_check_and_latest_practice_results_preserved:true,reader_and_collection_preserved:true,physical_device_tested:false,pass:true});
  }catch(error){await page.screenshot({path:path.join(output,`${id}-failure.png`)}).catch(()=>{});await fs.writeFile(path.join(output,'failure.txt'),id+'\n'+String(error)+'\n'+await page.locator('body').innerText().catch(()=>''));throw error;}
  finally{await context.close();await fs.writeFile(path.join(output,'partial.json'),JSON.stringify(observations,null,2));}
 }}finally{await browser.close();}
}}catch(error){console.error(debugId,String(error));throw error;}
finally{if(server)await new Promise(r=>server.close(r));}
await fs.writeFile(path.join(output,'result.json'),JSON.stringify({base,local,physical_device_tested:false,software_keyboard_simulated:true,observations},null,2));console.log(`Draft protection QA PASS: ${observations.length} mode/view/language flows.`);
