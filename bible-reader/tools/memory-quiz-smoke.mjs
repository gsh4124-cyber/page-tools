import {chromium} from 'playwright';
import {createServer} from 'node:http';
import fs from 'node:fs/promises';
import path from 'node:path';
import assert from 'node:assert/strict';
import {fileURLToPath} from 'node:url';

const local=process.argv.includes('--local');
const output=process.env.MEMORY_QUIZ_EVIDENCE || fileURLToPath(new URL('../qa_evidence/live/memory-quiz/',import.meta.url));
await fs.mkdir(output,{recursive:true});
let server,base=process.env.MEMORY_QUIZ_BASE || 'https://bible-reader-1iz.pages.dev';
if(local){
  const root=path.resolve(process.env.MEMORY_QUIZ_ROOT || fileURLToPath(new URL('../dist/',import.meta.url)));
  const mime={'.html':'text/html; charset=utf-8','.js':'text/javascript','.css':'text/css','.svg':'image/svg+xml','.json':'application/json'};
  server=createServer(async(req,res)=>{try{
    let file=path.resolve(root,'.'+decodeURIComponent(new URL(req.url,'http://local').pathname));
    if(file!==root&&!file.startsWith(root+path.sep)){res.writeHead(403).end();return;}
    if((await fs.stat(file)).isDirectory())file=path.join(file,'index.html');
    const data=await fs.readFile(file);res.writeHead(200,{'Content-Type':mime[path.extname(file)]||'application/octet-stream'}).end(data);
  }catch{res.writeHead(404).end();}});
  await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));base=`http://127.0.0.1:${server.address().port}`;
}
const browser=await chromium.launch({headless:true,...(process.env.MEMORY_QUIZ_CHANNEL?{channel:process.env.MEMORY_QUIZ_CHANNEL}:{})});
const observations=[];
async function openPage(width=390,route='/'){
  const context=await browser.newContext({viewport:{width,height:844},locale:'ko-KR'});
  // Functional checks do not generate ad impressions or click ads.
  await context.route(/googlesyndication|doubleclick|adtrafficquality/,r=>r.abort());
  const page=await context.newPage(),errors=[];
  page.on('pageerror',e=>errors.push(String(e)));
  await page.goto(base+route+(route.includes('?')?'&':'?')+'qa=1',{waitUntil:'domcontentloaded'});
  await page.locator('#verses .verse').first().waitFor({timeout:40000});
  await page.locator('.memory-menu-button').waitFor({state:'attached'});
  await page.locator('#toolbarMoreToggle').click();await page.locator('.memory-menu-button').click();
  await page.locator('#memoryQuizDialog').waitFor({state:'visible'});
  return {context,page,errors};
}
try{
  for(const width of (local?[320,360,390,430,1280]:[390,1280])){
    const {context,page,errors}=await openPage(width);
    const dialog=page.locator('#memoryQuizDialog');
    await page.locator('#memoryFrom').selectOption('16');await page.locator('#memoryTo').selectOption('17');
    const originals=await dialog.locator('.memory-preview p').allTextContents();
    const answers=await page.locator('#verses .verse').evaluateAll(rows=>rows.filter(r=>['16','17'].includes(r.dataset.verse)).map(r=>r.querySelector('.verse-text').textContent));
    assert.equal(originals.length,2);
    const chapter=await page.locator('#chapterSelect').inputValue();
    await dialog.locator('.memory-close').focus();await page.keyboard.press('ArrowRight');await page.keyboard.press('f');
    assert.equal(await page.locator('#chapterSelect').inputValue(),chapter,'Quiz keyboard input changed the reader chapter');
    assert.equal(await page.locator('body').evaluate(b=>b.classList.contains('reader-focus')),false);
    await dialog.locator('.memory-primary').click();
    assert.equal(await dialog.locator('.memory-preview:visible').count(),0,'Answer must be hidden during test');
    assert.equal(await dialog.locator('textarea').count(),2);
    await dialog.locator('.memory-primary').click();assert(await dialog.locator('.memory-error').isVisible(),'Empty answers must not produce a score');
    await dialog.locator('textarea').nth(0).fill(answers[0].replace(/\s/g,'')+'!');
    await dialog.locator('textarea').nth(1).fill('오답');
    await dialog.locator('.memory-primary').click();
    assert.equal(await dialog.locator('.memory-result').count(),2);
    assert.equal(await dialog.locator('.memory-result').first().locator('h4').textContent(),'16 · 100%');
    assert.equal(await dialog.locator('.memory-result').first().locator('.memory-diff').first().textContent(),answers[0],'Results must preserve original readable spacing');
    assert.notEqual(await dialog.locator('.memory-score').textContent(),'100%');
    assert(await dialog.locator('.memory-wrong,.memory-missing').count()>0);
    await dialog.locator('.memory-primary').click();assert.equal(await dialog.locator('textarea').first().inputValue(),'');
    await dialog.locator('.memory-peek').click();assert(await dialog.locator('.memory-preview').isVisible());
    await dialog.locator('.memory-peek').click();assert(await dialog.locator('.memory-preview').isHidden());
    for(let i=0;i<2;i++)await dialog.locator('textarea').nth(i).fill(answers[i]);
    await dialog.locator('.memory-primary').click();assert.equal(await dialog.locator('.memory-score').textContent(),'100%');
    assert((await dialog.locator('h3').textContent()).includes('연습'),'Revealed answer must stay labeled practice');
    await page.screenshot({path:path.join(output,`${local?'local':'live'}-result-${width}.png`)});
    await dialog.locator('.memory-primary').click();
    for(let i=0;i<2;i++)await dialog.locator('textarea').nth(i).fill(answers[i]);
    await dialog.locator('.memory-primary').click();assert(!(await dialog.locator('h3').textContent()).includes('연습'));
    await page.keyboard.press('Escape');await page.locator('#memoryQuizDialog').waitFor({state:'detached'});
    await page.locator('#verses .verse[data-verse="1"]').click();await page.locator('#verses .verse[data-verse="3"]').click();
    await page.locator('.verse-multi-memory').click();
    assert.equal(await page.locator('#memoryMode').inputValue(),'selected');
    assert.equal(await dialog.locator('.memory-preview p').count(),2,'Non-contiguous selection must not add unselected verses');
    await dialog.locator('.memory-primary').click();
    assert.deepEqual(await dialog.locator('textarea').evaluateAll(inputs=>inputs.map(n=>n.dataset.verse)),['1','3']);
    assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),'Page horizontal overflow');
    assert(await dialog.evaluate(d=>d.scrollWidth<=d.clientWidth+1),'Dialog horizontal overflow');
    const sizes=await dialog.locator('button,textarea').evaluateAll(nodes=>nodes.map(n=>({height:n.getBoundingClientRect().height})));assert(sizes.every(s=>s.height>=44),'Small touch target');
    await page.screenshot({path:path.join(output,`${local?'local':'live'}-test-${width}.png`)});
    assert.deepEqual(errors,[],'Runtime errors');observations.push({width,flow:'range, blank, wrong, normalized exact, reveal/practice, clean retry, keyboard isolation, selected 1+3, overflow, touch targets',pass:true});
    await context.close();
  }
  for(const language of (local?['en','fr','de','zh','ru','la','pt','ar']:['en','ar'])){
    const {context,page,errors}=await openPage(390,`/${language}/`);
    const expected=await page.evaluate(code=>window.BibleMemory.labels(code).title,language);
    assert.equal(await page.locator('#memoryQuizTitle').textContent(),expected);
    assert.equal(await page.locator('html').getAttribute('lang'),language);
    await page.locator('#memoryQuizDialog .memory-primary').click();
    await page.locator('#memoryQuizDialog textarea').first().fill('test');
    await page.locator('#memoryQuizDialog .memory-primary').click();
    assert(await page.locator('.memory-score').isVisible());assert.deepEqual(errors,[]);
    assert(await page.locator('#memoryQuizDialog').evaluate(d=>d.scrollWidth<=d.clientWidth+1));
    observations.push({language,flow:'localized entry, real translation text, input, scoring',pass:true});await context.close();
  }
  await fs.writeFile(path.join(output,'result.json'),JSON.stringify({base,local,ads_blocked_for_qa:true,physical_device_tested:false,observations},null,2));
  console.log(`Memory quiz browser QA PASS: ${observations.length} viewport/language flows; ${output}`);
}finally{await browser.close();if(server)await new Promise(resolve=>server.close(resolve));}
