import {chromium,firefox,webkit} from 'playwright';
import {createServer} from 'node:http';
import fs from 'node:fs/promises';
import path from 'node:path';
import assert from 'node:assert/strict';
import {fileURLToPath} from 'node:url';
import {chooseMemory} from './picker-test-helpers.mjs';

const product=fileURLToPath(new URL('../',import.meta.url)),local=process.argv.includes('--local');
const output=process.env.MEMORY_GRADING_EVIDENCE||path.join(product,'qa_evidence/live/memory-grading');
await fs.mkdir(output,{recursive:true});
let server,base=process.env.MEMORY_QUIZ_BASE||'https://bible-reader-1iz.pages.dev';
if(local){
 const root=path.join(product,'dist');
 server=createServer(async(req,res)=>{try{
  let file=path.resolve(root,'.'+decodeURIComponent(new URL(req.url,'http://local').pathname));
  if(file!==root&&!file.startsWith(root+path.sep)){res.writeHead(403).end();return;}
  if((await fs.stat(file)).isDirectory())file=path.join(file,'index.html');
  res.setHeader('Content-Type',({'.html':'text/html; charset=utf-8','.js':'text/javascript','.css':'text/css','.json':'application/json'})[path.extname(file)]||'application/octet-stream');
  res.end(await fs.readFile(file));
 }catch{res.writeHead(404).end();}});
 await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));base=`http://127.0.0.1:${server.address().port}`;
}
const expected='이 별 이름은 쑥이라 물들의 삼분의 일이 쑥이 되매 그 물들이 쓰게 됨을 인하여 많은 사람이 죽더라';
const engines={chromium,firefox,webkit},observations=[];let debugPage;
try{
 if(!local){
  const response=await fetch(base+'/memory-quiz.js?qa=grading-readback');assert(response.ok);
  assert.equal(await response.text(),await fs.readFile(path.join(product,'dist/memory-quiz.js'),'utf8'),'Live grading code must match the tested release');
 }
 for(const engine of (process.env.MEMORY_GRADING_ENGINES||process.env.MEMORY_QUIZ_ENGINES||'chromium').split(',')){
  const browser=await engines[engine].launch({headless:true});
  try{for(const width of [320,390,1280])for(const mode of ['exam','practice'])for(const view of ['Verse','Chapter']){
   const context=await browser.newContext({viewport:{width,height:900},locale:'ko-KR'});
   try{
    await context.route(/googlesyndication|doubleclick|adtrafficquality/,route=>route.abort());
    const page=await context.newPage(),errors=[];debugPage=page;page.on('pageerror',error=>errors.push(String(error)));
    await page.goto(base+'/?qa=memory-grading',{waitUntil:'domcontentloaded'});
    await page.waitForFunction(()=>document.querySelector('#status')?.hidden&&window.BibleMemory&&document.querySelector('.memory-menu-button'));
    await page.locator('#toolbarMoreToggle').click();await page.locator(mode==='exam'?'.memory-menu-button':'.memory-practice-menu-button').click();
    const dialog=page.locator('#memoryQuizDialog');await page.locator('#memoryView'+view).check();
    if(!await dialog.locator('.memory-range').evaluate(n=>n.open))await dialog.locator('.memory-range summary').click();
    await chooseMemory(page,'memoryBook','65');await chooseMemory(page,'memoryFromChapter','8');await chooseMemory(page,'memoryToChapter','8');
    await chooseMemory(page,'memoryFromVerse','11');await chooseMemory(page,'memoryToVerse','11');await dialog.locator('.memory-primary').click();
    const input=dialog.locator('textarea:visible');assert.equal(await input.getAttribute('data-verse'),'11');
    for(const entered of ['이 별의 이름은 쑥이라','이별의이름은쑥이라']){
     await input.fill(entered);await dialog.locator('.memory-primary').click();
     const feedback=dialog.locator('.memory-row-feedback:visible'),diff=feedback.locator('.memory-diff');
     assert.equal(await diff.locator('.memory-wrong').count(),0);
     assert.equal((await diff.locator('.memory-extra').allTextContents()).join(''),'의');
     assert.equal((await diff.locator('.memory-correct').allTextContents()).join('').replace(/\s/g,''),'이별이름은쑥이라');
     assert.equal((await diff.locator('.memory-missing').allTextContents()).join(''),expected.slice(expected.indexOf('물들의')).replace(/\s/g,''));
     assert((await feedback.locator('.memory-counts').textContent()).includes('오자 0 · 빠진 글자 31 · 더 쓴 글자 1'));
     assert.equal(await input.inputValue(),entered,'Checking must preserve the answer');
     assert.equal(await dialog.locator('.memory-primary').getAttribute('data-action'),'check');
     assert(await dialog.evaluate(d=>d.scrollWidth<=d.clientWidth+1));
     observations.push({engine,width,mode,view,entered,pass:true});
    }
    if(engine==='chromium'&&width===1280&&mode==='exam'&&view==='Verse'){
     await input.fill('이 별의 이름은 쑥이라');await dialog.locator('.memory-primary').click();
     await dialog.screenshot({path:path.join(output,'revelation-8-11.png')});
     const proof=await dialog.screenshot({type:'jpeg',quality:55});console.log('MEMORY_GRADING_VISUAL_PROOF_JPEG:'+proof.toString('base64'));
    }
    await input.fill(expected);await dialog.locator('.memory-primary').click();
    assert.equal(await dialog.locator('.memory-primary').getAttribute('data-action'),'next');
    assert.deepEqual(errors,[]);
   }finally{await context.close();}
  }}finally{await browser.close();}
 }
}catch(error){
 await fs.writeFile(path.join(output,'failure.json'),JSON.stringify({error:String(error),stack:error.stack,observations},null,2));
 try{await debugPage?.screenshot({path:path.join(output,'failure.png'),fullPage:true});}catch{}
 throw error;
}finally{
 if(server)await new Promise(resolve=>server.close(resolve));
 await fs.writeFile(path.join(output,'results.json'),JSON.stringify({base,local,physical_device_tested:false,observations},null,2));
}
console.log(`Memory grading browser PASS: ${observations.length} partial-answer checks; exact correction also accepted in every view and mode.`);
