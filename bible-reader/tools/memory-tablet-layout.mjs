import {chromium,firefox,webkit} from 'playwright';
import {createServer} from 'node:http';
import fs from 'node:fs/promises';
import path from 'node:path';
import assert from 'node:assert/strict';
import {fileURLToPath} from 'node:url';

const local=process.argv.includes('--local'),root=fileURLToPath(new URL('../dist/',import.meta.url));
const output=fileURLToPath(new URL('../qa_evidence/live/memory-tablet/',import.meta.url));
await fs.mkdir(output,{recursive:true});
let server,base=process.env.MEMORY_QUIZ_BASE||'https://bible-reader-1iz.pages.dev';
if(local){
  server=createServer(async(req,res)=>{try{
    let file=path.resolve(root,'.'+new URL(req.url,'http://local').pathname);
    if(file!==path.resolve(root)&&!file.startsWith(path.resolve(root)+path.sep))throw Error('path');
    if((await fs.stat(file)).isDirectory())file=path.join(file,'index.html');
    res.setHeader('Content-Type',({'.html':'text/html; charset=utf-8','.js':'text/javascript','.css':'text/css','.json':'application/json'})[path.extname(file)]||'application/octet-stream');
    res.end(await fs.readFile(file));
  }catch{res.writeHead(404).end();}});
  await new Promise(r=>server.listen(0,'127.0.0.1',r));base=`http://127.0.0.1:${server.address().port}`;
}
const engines={chromium,firefox,webkit},results=[];
const profiles=[{width:1024,height:500},{width:1280,height:640},{width:1024,height:500,chapter:true},{width:768,height:1024},{width:390,height:700},{width:1024,height:500,large:true}];
async function geometry(page){return page.locator('#memoryQuizDialog').evaluate(d=>{
  const rect=n=>{const r=n.getBoundingClientRect();return {x:r.x,y:r.y,right:r.right,bottom:r.bottom,width:r.width,height:r.height};};
  const row=d.querySelector('.memory-practice-row[open]'),content=d.querySelector('.memory-content');
  const reference=row.querySelector('.memory-practice-text:not([hidden])')||row.querySelector('.memory-row-feedback');
  return {wide:d.classList.contains('memory-practice-wide'),dialog:rect(d),content:rect(content),reference:rect(reference),answer:rect(row.querySelector('textarea')),primary:rect(d.querySelector('.memory-primary')),dock:rect(d.querySelector('.memory-dock')),overflow:d.scrollWidth>d.clientWidth+1||content.scrollWidth>content.clientWidth+1};
});}
function checkVisible(g,width,height,full){
  assert(!g.overflow,'No horizontal overflow');
  assert(g.dialog.x>=-1&&g.dialog.y>=-1&&g.dialog.right<=width+1&&g.dialog.bottom<=height+1,'Dialog fits the viewport');
  assert(g.primary.y>=-1&&g.primary.bottom<=height+1&&g.primary.height>=44,'Check button stays visible and touch sized');
  if(full){
    assert(g.wide&&g.reference.right<=g.answer.x+2,'Passage and answer are alongside each other');
    for(const [name,r] of [['passage',g.reference],['answer',g.answer]])assert(r.y>=g.content.y-1&&r.bottom<=g.content.bottom+1,`${name} is fully visible above the buttons`);
    assert(g.dock.height<=70,'Actions occupy a single compact row');
  }
}
try{
 for(const engine of (process.env.MEMORY_TABLET_ENGINES||'chromium').split(',')){
  const browser=await engines[engine].launch({headless:true});
  try{for(const profile of profiles){
   const {width,height,chapter,large}=profile,context=await browser.newContext({viewport:{width,height},hasTouch:true,reducedMotion:'reduce'});
   await context.route(/googlesyndication|doubleclick|adtrafficquality|cloudflareinsights/,r=>r.abort());
   await context.route('**/functions/v1/**',r=>r.fulfill({status:204}));
   await context.addInitScript(chapter=>localStorage.setItem('bible-reader-memory-passages-v1',JSON.stringify([{bookIndex:65,chapter:14,verse:18},...(chapter?[{bookIndex:65,chapter:14,verse:19}]:[])])),!!chapter);
   const page=await context.newPage(),errors=[];page.on('pageerror',e=>errors.push(String(e)));
   const id=`${engine}-${width}-${height}${chapter?'-chapter':''}${large?'-large':''}`;
   try{
    await page.goto(base+'/?qa=memory-tablet',{waitUntil:'domcontentloaded'});
    await page.waitForFunction(()=>document.querySelector('#status')?.hidden&&window.BibleMemory);
    await page.locator('#toolbarMoreToggle').click();await page.locator('.memory-practice-menu-button').click();
    const dialog=page.locator('#memoryQuizDialog');
    await page.waitForFunction(()=>!document.querySelector('#memoryQuizDialog .memory-primary').disabled);
    if(chapter)await page.locator('#memoryViewChapter').check();
    await dialog.locator('.memory-primary').click();
    const answer=dialog.locator('textarea:visible').first(),source=dialog.locator('.memory-practice-row[open] .memory-practice-text');
    if(large)await page.addStyleTag({content:'.memory-quiz .memory-answer,.memory-quiz .memory-practice-text,.memory-quiz .memory-diff{font-size:26px!important}'});
    const expected=await source.textContent();assert(expected.length>70,'Use the long passage from the reported screenshot');
    await answer.fill(expected);await page.waitForTimeout(100);
    const full=width>=900&&!large;
    checkVisible(await geometry(page),width,height,full);
    await page.screenshot({path:path.join(output,id+'-typing.png')});
    await answer.fill(expected+'가');await dialog.locator('.memory-primary').click();await page.waitForTimeout(100);
    assert.equal(await answer.getAttribute('aria-invalid'),'true');
    const g=await geometry(page);checkVisible(g,width,height,full);
    await page.screenshot({path:path.join(output,id+'-checked.png')});
    // Software-keyboard resize must preserve drafts and keep the action reachable.
    await page.setViewportSize({width,height:280});await page.waitForTimeout(100);
    assert.equal(await answer.inputValue(),expected+'가');checkVisible(await geometry(page),width,280,false);
    await page.setViewportSize({width,height});await page.waitForTimeout(100);
    assert.equal(await answer.inputValue(),expected+'가');
    await answer.fill(expected);await dialog.locator('.memory-primary').click();
    assert.equal(await answer.getAttribute('aria-invalid'),'false','Corrected answers still pass');
    assert.deepEqual(errors,[]);results.push({engine,...profile,pass:true,checked:g});
   }catch(error){await page.screenshot({path:path.join(output,id+'-failure.png')}).catch(()=>{});results.push({engine,...profile,pass:false,error:String(error)});console.error(id,String(error));}
   finally{await context.close();}
  }}finally{await browser.close();}
 }
}finally{if(server)await new Promise(r=>server.close(r));}
await fs.writeFile(path.join(output,'results.json'),JSON.stringify({base,local,physical_device_tested:false,keyboard_resize_simulated:true,results},null,2));
console.log(`Tablet typing layout: ${results.filter(r=>r.pass).length}/${results.length} PASS`);
if(results.some(r=>!r.pass))process.exitCode=1;
