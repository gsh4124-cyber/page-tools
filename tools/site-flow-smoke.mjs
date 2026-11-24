import {chromium,firefox,webkit} from 'playwright';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
const root=fileURLToPath(new URL('../',import.meta.url)),local=process.argv.includes('--local'),output=path.join(root,'qa_evidence/site-flow');
await fs.mkdir(output,{recursive:true});
const projects={'random-ppobgi.pages.dev':'random-ppobgi','bible-reader-1iz.pages.dev':'bible-reader','pc-checkup.pages.dev':'pc-checkup'};
const results=[],engines={chromium,firefox,webkit};
async function contextFor(browser,width,holdApp){
 const events=[],context=await browser.newContext({viewport:{width,height:900},reducedMotion:'reduce',locale:'ko-KR',userAgent:'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/131.0.0.0 Safari/537.36'});
 await context.addInitScript(()=>Object.defineProperty(navigator,'webdriver',{get:()=>false}));
 // Every analytics request is intercepted: these checks never add visits or usage records.
 await context.route(/googlesyndication|doubleclick|adtrafficquality|cloudflareinsights/,route=>route.abort());
 await context.route('**/functions/v1/**',route=>{events.push(JSON.parse(route.request().postData()||'{}'));return route.fulfill({status:204,headers:{'access-control-allow-origin':'*','access-control-allow-headers':'content-type','access-control-allow-methods':'POST, OPTIONS'}});});
 if(local)await context.route(/https:\/\/(?:random-ppobgi|bible-reader-1iz|pc-checkup)\.pages\.dev\//,async route=>{
  const url=new URL(route.request().url());if(url.pathname==='/api/tool-uses'){events.push(JSON.parse(route.request().postData()));return route.fulfill({status:204});}
  const dist=path.join(root,projects[url.hostname],'dist');let file=path.resolve(dist,'.'+decodeURIComponent(url.pathname));
  if(file!==dist&&!file.startsWith(dist+path.sep))return route.fulfill({status:403});
  try{if((await fs.stat(file)).isDirectory())file=path.join(file,'index.html');return await route.fulfill({status:200,contentType:({'.html':'text/html; charset=utf-8','.js':'text/javascript','.css':'text/css','.json':'application/json'})[path.extname(file)]||'application/octet-stream',body:await fs.readFile(file)});}catch{return route.fulfill({status:404,body:'Not found'});}
 });
 else await context.route('**/api/tool-uses',route=>{events.push(JSON.parse(route.request().postData()));return route.fulfill({status:204});});
 if(holdApp)await context.route(/bible-reader-1iz\.pages\.dev\/.*\bapp\.js(?:\?|$)/,async route=>{await holdApp;await route.fallback();});
 return {context,events};
}
for(const engine of (process.env.SITE_FLOW_ENGINES||'chromium').split(',')){
 const browser=await engines[engine].launch({headless:true});
 try{
  for(const width of [390,1280]){
   {
   let release;const gate=new Promise(resolve=>release=resolve),{context}=await contextFor(browser,width,gate);
   try{
    await context.addInitScript(()=>{localStorage.setItem('bible-reader-font-size','32');localStorage.setItem('bible-reader-width','720');});
    const page=await context.newPage();await page.goto('https://bible-reader-1iz.pages.dev/',{waitUntil:'commit'});await page.locator('#verses .verse').first().waitFor();
    const before=await page.evaluate(()=>({size:document.documentElement.style.getPropertyValue('--font-size'),width:document.documentElement.style.getPropertyValue('--reader-width')}));
    assert.equal(before.size,'32px');assert.equal(before.width,'720px');release();
    await page.waitForFunction(()=>typeof currentBookData!=='undefined'&&!!currentBookData);
    assert.deepEqual(await page.evaluate(()=>({size:document.documentElement.style.getPropertyValue('--font-size'),width:document.documentElement.style.getPropertyValue('--reader-width')})),before);
    // A delayed book switch must retain reading space without showing the old chapter.
    let allowBook;const bookGate=new Promise(resolve=>allowBook=resolve);
    await page.route('**/scripture/krv1961/Genesis.json',async route=>{await bookGate;await route.fallback();});
    await page.locator('#bookSelect').selectOption('0');await page.locator('#singleReader[aria-busy="true"]').waitFor();
    assert.equal(await page.locator('#verses .verse').count(),0);
    assert(await page.locator('#singleReader').evaluate(n=>n.getBoundingClientRect().height>=320));allowBook();
    await page.waitForFunction(()=>typeof currentBookData!=='undefined'&&currentBookData&&document.querySelector('#bookSelect').value==='0'&&document.querySelector('#singleReader').getAttribute('aria-busy')!=='true');
    assert((await page.locator('#verses .verse').count())>0);results.push({engine,width,product:'bible',flow:'saved typography before paint; delayed book keeps space and clears stale text',pass:true});
   }finally{release();await context.close();}
   }
   for(const kind of ['pc','mobile']){
    const {context,events}=await contextFor(browser,width);
    try{
     const page=await context.newPage();await page.goto(`https://pc-checkup.pages.dev/${kind==='pc'?'checkup':'mobile'}.html`,{waitUntil:'domcontentloaded'});
     const finish=page.locator(`[data-finish-checkup="${kind}"]`),next=page.locator(kind==='pc'?'#nextCheck':'#nextMobileCheck');await finish.waitFor();assert(!(await finish.isEnabled()));
     const ids=kind==='pc'?['keyboard','mouse','display','speaker','mic','webcam']:['touch','display','camera','mic','speaker','motion'];
     for(let i=0;i<ids.length;i++)await page.locator(kind==='pc'?`[data-id="${ids[i]}"] [data-value="${i>3?'unknown':i===1?'bad':'ok'}"]`:`[data-test="${ids[i]}"] [data-result="${i>3?'unknown':i===1?'bad':'ok'}"]`).click();
     await page.waitForFunction(kind=>!document.querySelector(`[data-finish-checkup="${kind}"]`).disabled,kind);
     assert.equal(await page.locator(`[data-device-experience="${kind}"] [data-x="unknown"]`).textContent(),'2');
     const response=page.waitForResponse(r=>r.url().includes('device-checkup-event')&&r.request().postData()?.includes(`${kind}_complete`));await next.click();await response;
     await finish.click();assert.equal(events.filter(e=>e.event===`${kind}_complete`).length,1);
     if(engine==='chromium'&&width===390&&kind==='pc')await page.screenshot({path:path.join(output,'pc-completion.png'),fullPage:true});
     await page.reload({waitUntil:'domcontentloaded'});await finish.waitFor();assert.equal(events.filter(e=>e.event===`${kind}_complete`).length,1,'Reloading saved results must not finish a second time');
     const reset=page.locator(kind==='pc'?'#resetCheckup':'#resetMobileResults');await reset.click();await finish.waitFor();await page.waitForFunction(kind=>document.querySelector(`[data-finish-checkup="${kind}"]`).disabled,kind);
     assert.equal(await page.locator(`[data-device-experience="${kind}"] [data-x="ok"]`).textContent(),'0');
     assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+2));results.push({engine,width,product:kind,flow:'explicit unknown, next, finish once, saved result reload and new run',pass:true});
    }finally{await context.close();}
   }
   const {context,events}=await contextFor(browser,width);
   try{
    const page=await context.newPage();await page.goto('https://random-ppobgi.pages.dev/',{waitUntil:'domcontentloaded'});await page.locator('#showTools').click();
    for(const [tool,button,result] of [['yut','throwYut','yutResult'],['dice','rollDice','diceResult']]){
     await page.locator(`[data-tool="${tool}"]`).click();if(tool==='yut')await page.locator('#throwYut[data-yut-ready]').waitFor();
     await page.evaluate(id=>{for(let i=0;i<20;i++)document.getElementById(id).dispatchEvent(new MouseEvent('click',{bubbles:true}));},button);
     await page.locator(`#${result}[aria-busy="false"]`).waitFor();assert.equal(events.filter(e=>e.tool===tool).length,1,'Rapid clicks count one completed use');
     await page.locator('#'+button).click();await page.locator(`#${result}[aria-busy="false"]`).waitFor();assert.equal(events.filter(e=>e.tool===tool).length,2);
    }
    const before=events.length;await page.goto('https://random-ppobgi.pages.dev/?qa=1',{waitUntil:'domcontentloaded'});await page.locator('#showTools').click();await page.locator('[data-tool="dice"]').click();await page.locator('#rollDice').click();await page.locator('#diceResult[aria-busy="false"]').waitFor();assert.equal(events.length,before,'QA uses are not counted');
    results.push({engine,width,product:'random',flow:'yut/dice once per completed use, rapid-click lock and QA suppression',pass:true});
   }finally{await context.close();}
  }
 }finally{await browser.close();}
}
await fs.writeFile(path.join(output,'results.json'),JSON.stringify({local,physical_device_tested:false,analytics_requests_intercepted:true,results},null,2));
console.log(`Site flow PASS: ${results.length} cases, no production analytics writes.`);
