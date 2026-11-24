import {chromium,firefox,webkit} from 'playwright';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
const root=fileURLToPath(new URL('../',import.meta.url)),local=process.argv.includes('--local'),output=path.join(root,'qa_evidence/full-audit');
await fs.mkdir(output,{recursive:true});
const hosts={'bible-reader-1iz.pages.dev':'bible-reader','random-ppobgi.pages.dev':'random-ppobgi','pc-checkup.pages.dev':'pc-checkup'},results=[],engines={chromium,firefox,webkit};
async function makeContext(browser,width=390,height=844,storage='normal',language='ko'){
 const context=await browser.newContext({viewport:{width,height},locale:language==='ko'?'ko-KR':language,reducedMotion:'reduce'});
 await context.route(/googlesyndication|doubleclick|adtrafficquality|cloudflareinsights/,route=>route.abort());
 await context.route('**/functions/v1/**',route=>route.fulfill({status:204}));
 if(local)await context.route(/https:\/\/(?:bible-reader-1iz|random-ppobgi|pc-checkup)\.pages\.dev\//,async route=>{
  const url=new URL(route.request().url()),dist=path.join(root,hosts[url.hostname],'dist');let file=path.resolve(dist,'.'+decodeURIComponent(url.pathname));
  if(file!==dist&&!file.startsWith(dist+path.sep))return route.fulfill({status:403});
  try{if((await fs.stat(file)).isDirectory())file=path.join(file,'index.html');return await route.fulfill({status:200,contentType:({'.html':'text/html; charset=utf-8','.js':'text/javascript','.css':'text/css','.json':'application/json'})[path.extname(file)]||'application/octet-stream',body:await fs.readFile(file)});}catch{return route.fulfill({status:404,body:'Not found'});}
 });
 await context.addInitScript(mode=>{
  if(mode==='blocked')for(const key of ['localStorage','sessionStorage'])Object.defineProperty(window,key,{configurable:true,get(){throw new DOMException('Storage blocked','SecurityError');}});
  if(mode==='malformed')for(const key of ['bible-reader-location','bible-reader-verse-marks-v1','random-picker-saved-sets-v1','random-picker-config-sets-v1','random-picker-recent-results-v1','pc-checkup-results-v1','device-checkup-mobile-results-v1'])localStorage.setItem(key,'{');
  const native=crypto.getRandomValues.bind(crypto);Object.defineProperty(crypto,'getRandomValues',{value(array){if(window.__auditCoin)window.__auditCoinCalls=(window.__auditCoinCalls||0)+1;return native(array);}});
 },storage);
 return context;
}
async function scenario(browser,meta,fn){
 const context=await makeContext(browser,meta.width,meta.height,meta.storage,meta.language),page=await context.newPage(),errors=[];
 page.on('pageerror',error=>errors.push(String(error)));
 try{await fn(page);assert.deepEqual(errors,[],'Uncaught runtime errors');results.push({...meta,pass:true});}
 catch(error){results.push({...meta,pass:false,error:String(error)});await page.screenshot({path:path.join(output,`${results.length}-failure.png`),fullPage:true}).catch(()=>{});console.error(JSON.stringify(results.at(-1)));}
 finally{await context.close();}
}
async function fit(page){assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+2),'Horizontal page overflow');}
for(const engine of (process.env.FULL_AUDIT_ENGINES||'chromium').split(',')){
 const browser=await engines[engine].launch({headless:true});
 try{
  for(const [width,height] of [[320,740],[390,844],[844,390],[1280,900]])for(const host of Object.keys(hosts))await scenario(browser,{engine,width,height,site:host,flow:'home-layout'},async page=>{
   await page.goto(`https://${host}/?qa=1`,{waitUntil:'domcontentloaded'});
   await page.locator(host.startsWith('bible')?'#verses .verse':host.startsWith('random')?'#pickBtn':'#languagePicker').first().waitFor();await fit(page);
   const unnamed=await page.evaluate(()=>[...document.querySelectorAll('button,input[type=button],input[type=submit]')].filter(n=>n.getClientRects().length&&getComputedStyle(n).visibility!=='hidden').filter(n=>![n.getAttribute('aria-label'),n.title,n.textContent,n.value,(n.getAttribute('aria-labelledby')||'').split(/\s+/).map(id=>document.getElementById(id)?.textContent||'').join(' ')].some(v=>String(v||'').trim())).map(n=>n.id||n.outerHTML.slice(0,100)));
   assert.deepEqual(unnamed,[],'Visible controls without an accessible name');
  });
  for(const language of ['ko','ar'])await scenario(browser,{engine,width:390,height:844,language,site:'random',flow:'tools-keyboard-coin-teams-safe-content'},async page=>{
   await page.goto(`https://random-ppobgi.pages.dev/${language==='ko'?'':language+'/'}?qa=1`,{waitUntil:'domcontentloaded'});await page.locator('#showTools').click();
   const dice=page.locator('[data-tool="dice"]');await dice.click();await dice.press(language==='ar'?'ArrowLeft':'ArrowRight');assert.equal(await page.locator('.tool-tab[aria-selected="true"]').getAttribute('data-tool'),'yut');
   await page.locator('.tool-tab[aria-selected="true"]').press('End');assert.equal(await page.locator('.tool-tab[aria-selected="true"]').getAttribute('data-tool'),'team');await page.locator('.tool-tab[aria-selected="true"]').press('Home');assert.equal(await page.locator('.tool-tab[tabindex="0"]').count(),1);
   await page.locator('[data-tool="coin"]').click();await page.evaluate(()=>{window.__auditCoin=true;window.__auditCoinCalls=0;for(let i=0;i<20;i++)document.getElementById('flipCoin').dispatchEvent(new MouseEvent('click',{bubbles:true}));});await page.locator('#coinResult[aria-busy="false"]').waitFor();assert.equal(await page.evaluate(()=>window.__auditCoinCalls),1);assert(await page.locator('#flipCoin').isEnabled());
   await page.locator('[data-tool="order"]').click();await page.locator('#orderNames').fill('가\n나\n<img src=x onerror=alert(1)>\n가');await page.locator('#makeOrder').click();assert.equal(await page.locator('#orderResult .order-item').count(),4);assert.equal(await page.locator('#orderResult img').count(),0);
   await page.locator('[data-tool="team"]').click();await page.locator('#teamNames').fill('가\n나');await page.locator('#teamCount').selectOption('8');await page.locator('#makeTeams').click();assert.equal(await page.locator('#teamCount').inputValue(),'2');assert.equal(await page.locator('#teamResult .team-box').count(),2);
   await page.locator('#teamNames').fill('혼자');await page.locator('#makeTeams').click();assert.equal(await page.locator('#teamResult .team-box').count(),0);assert((await page.locator('#teamResult').textContent()).trim());await fit(page);
  });
  for(const storage of ['blocked','malformed'])for(const site of ['bible','random','device'])await scenario(browser,{engine,width:390,height:844,site,storage,flow:'unavailable-or-damaged-storage'},async page=>{
   if(site==='bible'){
    await page.goto('https://bible-reader-1iz.pages.dev/?qa=1',{waitUntil:'domcontentloaded'});await page.waitForFunction(()=>typeof currentBookData!=='undefined'&&!!currentBookData&&document.querySelector('#status').hidden);
    await page.locator('#fontUp').click();await page.locator('#toolbarMoreToggle').click();await page.locator('#widthToggle').click();
    if(!(await page.locator('#themeToggle').isVisible()))await page.locator('#toolbarMoreToggle').click();await page.locator('#themeToggle').click();
    if(await page.locator('#toolbarMoreMenu').isVisible())await page.locator('#toolbarMoreToggle').click();await page.locator('#compareToggle').click();assert(await page.locator('#comparePanel').isVisible());
    if(storage==='blocked')await page.locator('#readerStorageNotice').waitFor();
   }else if(site==='random'){
    await page.goto('https://random-ppobgi.pages.dev/?qa=1',{waitUntil:'domcontentloaded'});await page.locator('#showTools').click();await page.locator('[data-tool="dice"]').click();await page.locator('#rollDice').click();await page.locator('#diceResult[aria-busy="false"]').waitFor();assert.equal(await page.locator('#diceResult .die').count(),1);
   }else{
    await page.goto('https://pc-checkup.pages.dev/checkup.html?qa=1',{waitUntil:'domcontentloaded'});const finish=page.locator('[data-finish-checkup="pc"]');await finish.waitFor();
    for(const button of await page.locator('#checklist [data-value="unknown"]').all())await button.click();await page.waitForFunction(()=>!document.querySelector('[data-finish-checkup="pc"]').disabled);await finish.click();assert.equal(await page.locator('[data-device-experience="pc"]').getAttribute('data-flow-complete'),'true');assert.equal(await page.locator('[data-x="ok"]').textContent(),'0');
    if(storage==='blocked')await page.locator('.device-storage-note').waitFor();
   }await fit(page);
  });
  await scenario(browser,{engine,width:390,height:844,site:'bible',flow:'failed-passage-explicit-retry'},async page=>{
   await page.goto('https://bible-reader-1iz.pages.dev/?qa=1',{waitUntil:'domcontentloaded'});await page.waitForFunction(()=>typeof currentBookData!=='undefined'&&!!currentBookData);
   await page.route('**/scripture/krv1961/Genesis.json',route=>route.abort());await page.locator('#bookSelect').selectOption('0',{force:true});await page.locator('#reloadChapter').waitFor({state:'visible'});assert(await page.locator('#status.error').isVisible());
   await page.unroute('**/scripture/krv1961/Genesis.json');await page.locator('#reloadChapter').click();await page.waitForFunction(()=>document.querySelector('#status').hidden&&document.querySelector('#reloadChapter').hidden&&document.querySelectorAll('#verses .verse').length===31);await fit(page);
  });
  await scenario(browser,{engine,width:390,height:844,site:'device',flow:'denied-camera-and-microphone-remain-unconfirmed'},async page=>{
   await page.addInitScript(()=>Object.defineProperty(navigator,'mediaDevices',{value:{getUserMedia:()=>Promise.reject(new DOMException('Permission denied','NotAllowedError'))}}));
   await page.goto('https://pc-checkup.pages.dev/mobile.html?qa=1',{waitUntil:'domcontentloaded'});await page.locator('[data-device-experience="mobile"]').waitFor();await page.locator('#frontCam').click();await page.locator('#startMic').click();
   await page.waitForFunction(()=>document.querySelector('#camStatus').textContent.includes('권한')&&document.querySelector('#micStatus').textContent.includes('권한'));assert.equal(await page.locator('[data-x="ok"]').textContent(),'0');assert.equal(await page.locator('[data-x="bad"]').textContent(),'0');await fit(page);
  });
 }finally{await browser.close();}
}
await fs.writeFile(path.join(output,'browser-results.json'),JSON.stringify({local,physical_device_tested:false,media_devices_simulated:true,results},null,2));
console.log(`Full site audit: ${results.filter(r=>r.pass).length}/${results.length} PASS.`);if(results.some(r=>!r.pass))throw Error('Full site audit found failures; see browser-results.json');
