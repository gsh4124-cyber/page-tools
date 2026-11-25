import {chromium,firefox,webkit} from 'playwright';
import {createServer} from 'node:http';
import fs from 'node:fs/promises';
import path from 'node:path';
import assert from 'node:assert/strict';
import {fileURLToPath} from 'node:url';
import {closeMemory} from './picker-test-helpers.mjs';

const local=process.argv.includes('--local'),root=fileURLToPath(new URL('../dist/',import.meta.url));
const output=fileURLToPath(new URL('../qa_evidence/live/memory-usability/',import.meta.url));await fs.mkdir(output,{recursive:true});
let server,base=process.env.MEMORY_QUIZ_BASE||'https://bible-reader-1iz.pages.dev';
if(local){server=createServer(async(req,res)=>{try{
 let file=path.resolve(root,'.'+new URL(req.url,'http://local').pathname);
 if(file!==path.resolve(root)&&!file.startsWith(path.resolve(root)+path.sep))throw Error('path');
 if((await fs.stat(file)).isDirectory())file=path.join(file,'index.html');
 res.setHeader('Content-Type',({'.html':'text/html; charset=utf-8','.js':'text/javascript','.css':'text/css','.json':'application/json'})[path.extname(file)]||'application/octet-stream');res.end(await fs.readFile(file));
}catch{res.writeHead(404).end();}});await new Promise(r=>server.listen(0,'127.0.0.1',r));base=`http://127.0.0.1:${server.address().port}`;}
const engines={chromium,firefox,webkit},results=[];
async function headingVisible(dialog){return dialog.evaluate(d=>{
 const heading=d.querySelector('.memory-attempt-heading').getBoundingClientRect(),content=d.querySelector('.memory-content').getBoundingClientRect(),box=d.getBoundingClientRect(),action=d.querySelector('.memory-dock>.memory-primary').getBoundingClientRect();
 return heading.height>0&&heading.y>=box.y&&heading.bottom<=content.y+1&&action.bottom<=box.bottom&&action.height>=44;
});}
try{
 for(const engine of (process.env.MEMORY_USABILITY_ENGINES||'chromium').split(',')){
  const browser=await engines[engine].launch({headless:true});
  try{for(const [width,height,language] of [[1024,500,'ko'],[390,700,'en'],[844,390,'ar'],[1280,800,'fr']]){
   const context=await browser.newContext({viewport:{width,height},hasTouch:true,reducedMotion:'reduce'});
   await context.route(/googlesyndication|doubleclick|adtrafficquality|cloudflareinsights/,r=>r.abort());await context.route('**/functions/v1/**',r=>r.fulfill({status:204}));
   await context.addInitScript(()=>localStorage.setItem('bible-reader-memory-passages-v1',JSON.stringify([{bookIndex:42,chapter:3,verse:16},{bookIndex:42,chapter:3,verse:17}])));
   const page=await context.newPage(),errors=[];page.on('pageerror',e=>errors.push(String(e)));const id=`${engine}-${language}-${width}`;
   try{
    await page.goto(base+(language==='ko'?'/':`/${language}/`)+'?qa=memory-usability',{waitUntil:'domcontentloaded'});
    await page.waitForFunction(()=>document.querySelector('#status')?.hidden&&window.BibleMemory);
    await page.locator('#toolbarMoreToggle').click();await page.locator('.memory-practice-menu-button').click();
    const dialog=page.locator('#memoryQuizDialog');await page.waitForFunction(()=>!document.querySelector('#memoryQuizDialog .memory-primary').disabled);
    await dialog.locator('#memoryViewChapter').check();await dialog.locator('.memory-primary').click();
    const cards=dialog.locator('.memory-practice-row'),inputs=dialog.locator('textarea'),input=inputs.first();
    const expected=await cards.first().locator('.memory-practice-text').textContent(),heading=dialog.locator('.memory-attempt-heading');
    assert((await heading.innerText()).includes('3:16'));assert((await heading.innerText()).includes('1 / 2'));
    await input.fill('draft 🐟\n가  ');await input.evaluate(n=>n.setSelectionRange(6,8));
    const original=await input.inputValue(),storedBefore=await page.evaluate(()=>JSON.stringify({...localStorage}));
    await dialog.locator('.memory-practice-repeat').click();assert.equal(await input.inputValue(),'');assert(await dialog.locator('.memory-practice-undo').isVisible());
    await dialog.locator('.memory-practice-repeat').click();
    await cards.nth(1).locator('summary').click();assert(await dialog.locator('.memory-practice-undo').isHidden());await inputs.nth(1).fill('keep second draft');
    assert((await heading.innerText()).includes('3:17'));assert((await heading.innerText()).includes('2 / 2'));
    await cards.first().locator('summary').click();await dialog.locator('.memory-practice-undo').click();
    assert.equal(await input.inputValue(),original);assert.deepEqual(await input.evaluate(n=>[n.selectionStart,n.selectionEnd]),[6,8]);assert.equal(await inputs.nth(1).inputValue(),'keep second draft');
    assert.equal(await page.evaluate(()=>JSON.stringify({...localStorage})),storedBefore,'Undo never persists answers');
    await dialog.locator('.memory-practice-repeat').click();await input.fill('new answer');assert(await dialog.locator('.memory-practice-undo').isHidden(),'New typing must never be overwritten by an old undo');
    const first=[...new Intl.Segmenter(undefined,{granularity:'grapheme'}).segment(expected)].find(part=>/[\p{L}\p{N}]/u.test(part.segment)),wrong=' \n'+expected.slice(0,first.index)+'X'+expected.slice(first.index+first.segment.length);
    await input.fill(wrong);await dialog.locator('.memory-primary').click();
    const issue=cards.first().locator('.memory-issue').first();await issue.focus();await page.keyboard.press('Enter');
    assert(await input.evaluate(n=>n===document.activeElement));assert.equal(await input.evaluate(n=>n.value.slice(n.selectionStart,n.selectionEnd)),'X');assert.equal(await input.inputValue(),wrong,'Error navigation must not rewrite input');
    await input.fill('🐟'+expected);await dialog.locator('.memory-primary').click();await cards.first().locator('.memory-issue:has(.memory-extra)').first().click();
    assert.equal(await input.evaluate(n=>n.value.slice(n.selectionStart,n.selectionEnd)),'🐟');
    await input.fill('  '+expected.slice(first.index+first.segment.length));await dialog.locator('.memory-primary').click();await cards.first().locator('.memory-issue:has(.memory-missing)').first().click();
    assert.deepEqual(await input.evaluate(n=>[n.selectionStart,n.selectionEnd]),[2,2]);
    await dialog.locator('.memory-content').evaluate(n=>n.scrollTop=n.scrollHeight);assert(await headingVisible(dialog),'Current verse and progress stay above the scrolling answers');
    await page.setViewportSize({width,height:260});await page.waitForTimeout(100);assert(await headingVisible(dialog));
    await page.setViewportSize({width,height});await page.waitForTimeout(100);await input.fill(expected);await dialog.locator('.memory-primary').click();
    assert.equal(await input.getAttribute('aria-invalid'),'false');await dialog.locator('.memory-practice-repeat').click();await dialog.locator('.memory-practice-undo').click();
    assert.equal(await cards.first().locator('.memory-practice-state').getAttribute('data-complete'),'true','Undo restores the confirmed answer status');
    assert(await headingVisible(dialog));await page.screenshot({path:path.join(output,id+'.png')});
    await closeMemory(page);assert.deepEqual(errors,[]);results.push({engine,language,width,height,pass:true});
   }catch(error){await page.screenshot({path:path.join(output,id+'-failure.png')}).catch(()=>{});results.push({engine,language,width,height,pass:false,error:String(error)});console.error(id,String(error));}
   finally{await context.close();}
  }}finally{await browser.close();}
 }
}finally{if(server)await new Promise(r=>server.close(r));}
await fs.writeFile(path.join(output,'results.json'),JSON.stringify({base,local,physical_device_tested:false,results},null,2));console.log(`Memory usability: ${results.filter(r=>r.pass).length}/${results.length} PASS`);if(results.some(r=>!r.pass))process.exitCode=1;
