import {chromium,firefox,webkit} from 'playwright';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {createServer} from 'node:http';
import {createHash} from 'node:crypto';
const product=fileURLToPath(new URL('../',import.meta.url)),local=process.argv.includes('--local');
let server,base=process.env.GAME_CONTRACT_BASE||'https://random-ppobgi.pages.dev';
if(local){
 const root=path.join(product,'dist');
 server=createServer(async(req,res)=>{try{const url=new URL(req.url,'http://local'),rel=decodeURIComponent(url.pathname),candidate=path.resolve(root,'.'+rel);if(!candidate.startsWith(root+path.sep)&&candidate!==root){res.writeHead(403).end();return;}let file=candidate;if((await fs.stat(file)).isDirectory())file=path.join(file,'index.html');const types={'.html':'text/html; charset=utf-8','.js':'application/javascript; charset=utf-8','.css':'text/css','.svg':'image/svg+xml','.json':'application/json','.png':'image/png'};res.setHeader('Content-Type',types[path.extname(file)]||'text/plain');res.end(await fs.readFile(file));}catch{res.writeHead(404).end('Not found');}});
 await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));base=`http://127.0.0.1:${server.address().port}`;
}
const output=process.env.GAME_CONTRACT_EVIDENCE||path.join(product,'qa_evidence/local-game-contract');
await fs.mkdir(output,{recursive:true});
const results=[],engines={chromium,firefox,webkit},revision=process.env.DEPLOY_VERIFIED_SHA;let debugPage;
function inlineCore(html){const scripts=[...html.matchAll(/<script\b[^>]*>([\s\S]*?)<\/script>/g)].map(m=>m[1]);return scripts.find(s=>s.includes('function initWheel('));}
try{
 if(!local&&revision){
  const actual=(await (await fetch(base+'/build-revision.txt')).text()).trim();assert.equal(actual,revision);
  const actualCore=inlineCore(await (await fetch(base+'/?qa=1')).text()),expectedCore=inlineCore(await fs.readFile(path.join(product,'dist/index.html'),'utf8'));
  assert(actualCore&&expectedCore);assert.equal(createHash('sha256').update(actualCore).digest('hex'),createHash('sha256').update(expectedCore).digest('hex'),'Actual served game logic must match this release');
 }
 for(const engine of (process.env.GAME_CONTRACT_ENGINES||'chromium').split(',')){
  const browser=await engines[engine].launch({headless:true});
  try{
   for(const [lang,width] of [['ko',320],['ko',390],['ko',1280],['en',390],['ar',390]]){
    const context=await browser.newContext({viewport:{width,height:900},reducedMotion:'reduce',locale:lang==='ko'?'ko-KR':lang});
    const page=await context.newPage(),errors=[];debugPage=page;page.on('pageerror',e=>errors.push(String(e)));
    await context.route(/googlesyndication|doubleclick|adtrafficquality/,r=>r.abort());
    await page.goto(`${base}/${lang==='ko'?'':lang+'/'}?qa=1`,{waitUntil:'domcontentloaded'});
    await page.waitForFunction(()=>window.RandomPickerSettings&&window.RandomPickerFlowText);
    if(lang!=='ko')await page.waitForFunction(()=>window.__RANDOM_PICKER_I18N_READY__);
    for(const method of ['ladder','wheel','lot','pinball','race','capsule','slot','bomb']){
     console.log(`Game contract ${engine} ${lang} ${width} ${method}`);
     const setup={version:1,method,inputMode:'name',names:'산다\n안 산다\n산다\n안 산다',customResults:'산다\n안 산다\n산다\n안 산다',totalPeople:4,pickCount:4,resultMode:['ladder','lot'].includes(method)?'custom':'winner',bombTimerMode:'fixed',bombSeconds:15};
     assert(await page.evaluate(s=>window.RandomPickerSettings.apply(s),setup));
     assert((await page.locator('#methodFlow').textContent()).trim());
     if(method==='lot'){assert(!(await page.locator('#inputTabs').isVisible()));assert(!(await page.locator('#names').isVisible()));assert.equal((await page.evaluate(()=>window.RandomPickerSettings.capture())).inputMode,'number');}
     if(method==='bomb')assert(!(await page.locator('#totalField').isVisible()));
     await page.locator('#pickBtn').click();
     if(method==='ladder'){
      assert.equal(await page.locator('.ladder-pick').count(),4);
      const metric=await page.evaluate(()=>{const wrap=document.querySelector('.ladder-wrap').getBoundingClientRect(),svg=document.querySelector('.ladder-svg').getBoundingClientRect(),buttons=[...document.querySelectorAll('.ladder-pick')].map(b=>b.getBoundingClientRect()),lines=[...document.querySelectorAll('.ladder-svg line')].slice(0,4).map(l=>Number(l.getAttribute('x1')));return{overflow:document.querySelector('.ladder-wrap').scrollWidth-wrap.width,offsets:buttons.map((b,i)=>Math.abs(b.left+b.width/2-(svg.left+lines[i]*svg.width/620)))};});
      assert(metric.overflow<=2);assert(metric.offsets.every(x=>x<=1));
      if(lang==='ko'&&width===390){await page.locator('#stage').scrollIntoViewIfNeeded();await page.screenshot({path:path.join(output,`${engine}-ladder.png`)});}
      await page.locator('#showAllBtn').click();assert.equal(await page.locator('#winners li').count(),4);
     }else if(method==='lot'){
      assert.equal(await page.locator('.paper-lot').count(),4);assert.equal(await page.locator('.paper-lot .tag').filter({hasText:/산다/}).count(),0);
      for(let i=0;i<4;i++)await page.locator('.paper-lot').nth(i).click();
      await page.waitForFunction(()=>document.querySelectorAll('.paper-lot.open').length===4);
      assert.deepEqual((await page.locator('.paper-lot .inside').allTextContents()).sort(),['산다','산다','안 산다','안 산다'].sort());
      await page.locator('#showAllBtn').click();const before=await page.locator('.paper-lot .inside').allTextContents();assert(!(await page.locator('#showAllBtn').isVisible()));await page.waitForTimeout(80);assert.deepEqual(await page.locator('.paper-lot .inside').allTextContents(),before);
      assert(!(await page.locator('#excludeBtn').isVisible()));
      if(lang==='ko'&&width===390){await page.locator('#stage').scrollIntoViewIfNeeded();await page.screenshot({path:path.join(output,`${engine}-lots.png`)});}
     }else if(method==='bomb'){
      await page.locator('#bombStart').click();assert(await page.locator('#bombStart').isDisabled());await page.locator('#bombNow').click();await page.waitForFunction(()=>document.querySelector('#bombResult').textContent.trim());assert(await page.locator('#bombNow').isDisabled());
     }else{
      if(method==='wheel'){await page.locator('#wheelStart').click();}
      if(method==='slot')await page.locator('#slotStart').click();
      if(method==='capsule'){assert.equal(await page.locator('.capsule-ball').count(),4);await page.locator('#capsuleStart').click();}
      if(method==='race')await page.locator('#raceStart').click();
      if(method==='pinball')await page.locator('[data-action="launch"]').click();
      await page.locator('#showAllBtn').click();await page.waitForFunction(()=>document.querySelector('#resultBlock').classList.contains('show'));
      const winner=await page.locator('#winners li').first().innerText();
      if(method==='wheel')assert.equal(await page.locator('#wheelCanvas').getAttribute('aria-label'),(await page.locator('#wheelRound').innerText()));
      if(method==='slot')assert(winner.includes(await page.locator('#slotItem2').innerText()));
      if(method==='capsule')assert(winner.includes(await page.locator('.capsule-paper').innerText()));
      if(method==='race'){assert.equal(await page.locator('.racer.finished').count(),4);assert((await page.locator('#raceResult').textContent()).includes((await page.locator('.race-rank-chip').first().textContent()).split(' · ')[1]));}
      if(method==='pinball')assert.equal(await page.locator('.finish-chip').count(),4);
      const before=await page.locator('#winners').innerText();if(await page.locator('#showAllBtn').isVisible())await page.locator('#showAllBtn').click();assert.equal(await page.locator('#winners').innerText(),before,'Repeated reveal must preserve results');
      if(method==='wheel'&&lang==='ko'&&width===390){await page.locator('#stage').scrollIntoViewIfNeeded();await page.screenshot({path:path.join(output,`${engine}-wheel.png`)});}
     }
     assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+2),`${method} page overflow`);
     results.push({engine,lang,width,method,pass:true});
    }
    assert.deepEqual(errors,[]);await context.close();
   }
   // Exercise stop-animation interruptions with ordinary motion, not just accessibility shortcuts.
   const context=await browser.newContext({viewport:{width:390,height:844},reducedMotion:'no-preference'}),page=await context.newPage();
   await context.route(/googlesyndication|doubleclick|adtrafficquality/,r=>r.abort());await page.goto(base+'/?qa=1',{waitUntil:'domcontentloaded'});await page.waitForFunction(()=>window.RandomPickerSettings);
   for(const method of ['wheel','capsule','slot']){
    await page.evaluate(method=>window.RandomPickerSettings.apply({version:1,method,inputMode:'name',names:'A\nB\nC\nD',customResults:'',totalPeople:4,pickCount:1,resultMode:'winner',bombTimerMode:'random',bombSeconds:60}),method);
    await page.locator('#pickBtn').click();await page.locator(method==='wheel'?'#wheelStart':method==='capsule'?'#capsuleStart':'#slotStart').click();
    if(method!=='capsule')await page.locator(method==='wheel'?'#wheelStop':'#slotStop').click();
    await page.waitForTimeout(150);await page.locator('#showAllBtn').click();const result=await page.locator('#winners').innerText();await page.waitForTimeout(1200);assert.equal(await page.locator('#winners').innerText(),result);
    if(method==='wheel')assert(result.includes((await page.locator('#wheelRound').innerText()).split(' · ')[0]));
    if(method==='capsule')assert(result.includes(await page.locator('.capsule-paper').innerText()));
    if(method==='slot')assert(result.includes(await page.locator('#slotItem2').innerText()));
    results.push({engine,method,phase:'skip-during-animation',pass:true});
   }
   await context.close();
   const raceContext=await browser.newContext({viewport:{width:390,height:844},reducedMotion:'reduce'});
   await raceContext.route(/googlesyndication|doubleclick|adtrafficquality/,r=>r.abort());
   await raceContext.addInitScript(()=>{const native=crypto.getRandomValues.bind(crypto);Object.defineProperty(crypto,'getRandomValues',{value(array){if(window.__raceTestValues?.length){array[0]=window.__raceTestValues.shift();return array;}return native(array);}});});
   const racePage=await raceContext.newPage();await racePage.goto(base+'/?qa=1',{waitUntil:'domcontentloaded'});await racePage.waitForFunction(()=>window.RandomPickerSettings);
   await racePage.evaluate(()=>{window.RandomPickerSettings.apply({version:1,method:'race',inputMode:'name',names:'A\nB\nC\nD',customResults:'',totalPeople:4,pickCount:1,resultMode:'winner',bombTimerMode:'random',bombSeconds:60});window.__raceTestValues=[2000,1000,500,0];});
   await racePage.locator('#pickBtn').click();await racePage.locator('#raceStart').click();await racePage.waitForFunction(()=>document.querySelector('#resultBlock').classList.contains('show'));
   assert.equal((await racePage.locator('#winners li').first().innerText()).trim(),'D','Motion preference and skipped frames must preserve the randomly fastest racer');
   assert((await racePage.locator('.race-rank-chip').first().innerText()).includes('D'));
   results.push({engine,method:'race',phase:'reduced-motion-natural-finish',pass:true});await raceContext.close();
  }finally{await browser.close();}
 }
}catch(error){
 await fs.writeFile(path.join(output,'failure.json'),JSON.stringify({message:String(error),stack:error.stack,cases:results},null,2));
 try{await debugPage?.screenshot({path:path.join(output,'failure.png'),fullPage:true});}catch{}
 throw error;
}finally{
 if(server)server.close();
 await fs.writeFile(path.join(output,'results.json'),JSON.stringify({base,revision:revision||null,physical_device_tested:false,cases:results},null,2));
}
console.log(`Game interaction contract PASS: ${results.length} flows at ${base}`);

