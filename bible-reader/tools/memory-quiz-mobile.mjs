import {chromium,firefox,webkit} from 'playwright';
import {createServer} from 'node:http';
import fs from 'node:fs/promises';
import path from 'node:path';
import assert from 'node:assert/strict';
import {fileURLToPath} from 'node:url';

const local=process.argv.includes('--local');
const output=process.env.MEMORY_QUIZ_EVIDENCE||fileURLToPath(new URL('../qa_evidence/mobile/',import.meta.url));
await fs.mkdir(output,{recursive:true});
let server,base=process.env.MEMORY_QUIZ_BASE||'https://bible-reader-1iz.pages.dev';
if(local){
  const root=path.resolve(process.env.MEMORY_QUIZ_ROOT||fileURLToPath(new URL('../dist/',import.meta.url)));
  const mime={'.html':'text/html','.js':'text/javascript','.css':'text/css','.json':'application/json','.svg':'image/svg+xml'};
  server=createServer(async(req,res)=>{try{
    let file=path.resolve(root,'.'+decodeURIComponent(new URL(req.url,'http://local').pathname));
    if(file!==root&&!file.startsWith(root+path.sep)){res.writeHead(403).end();return;}
    if((await fs.stat(file)).isDirectory())file=path.join(file,'index.html');
    res.writeHead(200,{'Content-Type':mime[path.extname(file)]||'application/octet-stream'}).end(await fs.readFile(file));
  }catch{res.writeHead(404).end();}});
  await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));base=`http://127.0.0.1:${server.address().port}`;
}
const engines={chromium,firefox,webkit},observations=[];
const profiles=[
  {name:'small',width:320,height:568},{name:'android',width:360,height:780},
  {name:'iphone-size',width:390,height:844},{name:'large',width:430,height:932},
  {name:'narrow-cover',width:280,height:653},{name:'landscape',width:844,height:390},
  {name:'large-text',width:390,height:844,largeText:true},{name:'tablet',width:768,height:1024},
  {name:'keyboard-short',width:390,height:844,keyboard:240},{name:'keyboard-landscape',width:844,height:390,keyboard:220},
  {name:'visible-width',width:844,height:844,keyboard:360,visibleWidth:360},{name:'no-visual-viewport',width:360,height:780,fallback:true},
  {name:'large-text-keyboard',width:390,height:844,keyboard:260,largeText:true},
  {name:'narrow-large-text-keyboard',width:320,height:568,keyboard:240,largeText:true},
  {name:'large-text-landscape-keyboard',width:568,height:320,keyboard:180,largeText:true},
  {name:'safe-area-keyboard',width:390,height:844,keyboard:240,safeArea:true}
];
try{
 for(const engine of (process.env.MEMORY_QUIZ_ENGINES||'chromium,webkit,firefox').split(',')){
  const browser=await engines[engine].launch({headless:true,...(engine==='chromium'&&process.env.MEMORY_QUIZ_CHANNEL?{channel:process.env.MEMORY_QUIZ_CHANNEL}:{})});
  try{for(const profile of profiles.filter(p=>!process.env.MEMORY_QUIZ_PROFILES||process.env.MEMORY_QUIZ_PROFILES.split(',').includes(p.name)))for(const view of ['verse','chapter']){
   const id=`${engine}-${profile.name}-${view}`,errors=[];console.log('Checking '+id);
   const context=await browser.newContext({viewport:{width:profile.width,height:profile.height},hasTouch:true,deviceScaleFactor:2,...(engine!=='firefox'?{isMobile:true}:{}),locale:'ko-KR'});let page;
   try{
    await context.route(/googlesyndication|doubleclick|adtrafficquality/,r=>r.abort());
    if(profile.keyboard)await context.addInitScript(()=>{const v=new EventTarget();Object.assign(v,{width:innerWidth,height:innerHeight,offsetTop:0,offsetLeft:0,scale:1});Object.defineProperty(window,'visualViewport',{configurable:true,value:v});window.__qaViewport=v;});
    if(profile.fallback)await context.addInitScript(()=>Object.defineProperty(window,'visualViewport',{configurable:true,value:null}));
    page=await context.newPage();page.on('pageerror',e=>errors.push(String(e)));
    await page.goto(base+'/?qa=mobile',{waitUntil:'domcontentloaded'});
    await page.locator('#verses .verse').first().waitFor({timeout:40000});
    await page.locator('.memory-menu-button').waitFor({state:'attached'});
    // Settle the initial reader/font layout before exercising mobile touch.
    await page.waitForFunction(()=>document.querySelector('#status')?.hidden);
    await page.evaluate(()=>document.fonts.ready.then(()=>true));
    if(profile.keyboard)await page.evaluate(()=>Object.assign(window.__qaViewport,{width:innerWidth,height:innerHeight}));
    await page.locator('#toolbarMoreToggle').tap();await page.locator('.memory-menu-button').tap();
    const dialog=page.locator('#memoryQuizDialog');await dialog.waitFor({state:'visible'});
    if(profile.largeText)await page.addStyleTag({content:'.memory-quiz{font-size:24px!important}.memory-quiz textarea{font-size:28px!important}.memory-quiz button{font-size:24px!important}.memory-header h2{font-size:28px!important}'});
    if(profile.safeArea)await dialog.evaluate(d=>{d.style.setProperty('--memory-safe-top','47px');d.style.setProperty('--memory-safe-bottom','34px');});
    await page.locator('#memoryView'+(view==='verse'?'Verse':'Chapter')).check();
    if(!await dialog.locator('.memory-range').evaluate(n=>n.open))await dialog.locator('.memory-range summary').click();
    await page.locator('#memoryFromVerse').selectOption('1');await page.locator('#memoryToVerse').selectOption('2');
    await dialog.locator('.memory-primary').click();
    if(profile.keyboard){await page.evaluate(({height,width})=>{Object.assign(window.__qaViewport,{height,width:width||innerWidth,offsetTop:25});window.__qaViewport.dispatchEvent(new Event('resize'));},{height:profile.keyboard,width:profile.visibleWidth});await page.waitForFunction(h=>parseFloat(document.querySelector('#memoryQuizDialog').style.getPropertyValue('--memory-view-height'))===h,profile.keyboard);}
    if(profile.fallback){await page.setViewportSize({width:profile.width,height:320});await page.waitForFunction(()=>parseFloat(document.querySelector('#memoryQuizDialog').style.getPropertyValue('--memory-view-height'))===320);}
    async function geometry(stage){
     const g=await dialog.evaluate(d=>{const r=n=>{const b=n.getBoundingClientRect();return {x:b.x,y:b.y,width:b.width,height:b.height,right:b.right,bottom:b.bottom};};const v=window.visualViewport;return {dialog:r(d),content:r(d.querySelector('.memory-content')),dock:r(d.querySelector('.memory-dock')),primary:r(d.querySelector('.memory-primary')),overflow:d.scrollWidth>d.clientWidth+1,v:{x:v?.offsetLeft||0,y:v?.offsetTop||0,width:v?.width||innerWidth,height:v?.height||innerHeight}};});
     assert(!g.overflow,stage+': dialog horizontal overflow');
     assert(g.dialog.x>=g.v.x-1&&g.dialog.right<=g.v.x+g.v.width+1,stage+': visible width overflow');
     assert(g.dialog.y>=g.v.y-1&&g.dialog.bottom<=g.v.y+g.v.height+1,stage+': visible height overflow');
     if(profile.safeArea)assert(g.dialog.y>=g.v.y+46&&g.dialog.bottom<=g.v.y+g.v.height-33,stage+': cutout/home-indicator overlap');
     assert(g.content.height>=44,stage+': input area lost to fixed controls');
     assert(g.primary.height>=44&&g.primary.y>=g.v.y&&g.primary.bottom<=g.v.y+g.v.height+1,stage+': answer button unavailable');
     // A textarea can be taller than this deliberately tiny viewport. Scroll the input region
     // directly instead of asking browser automation to center an uncontainable element.
     const input=dialog.locator('textarea').first();await input.evaluate(n=>{const c=n.closest('.memory-content');c.scrollTop+=n.getBoundingClientRect().top-c.getBoundingClientRect().top-8;});
     await page.evaluate(()=>new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve))));
     const b=await input.boundingBox();assert(b.y<g.content.y+g.content.height-20&&b.y+b.height>g.content.y+20,stage+': input not reachable');
     return g;
    }
    await geometry('before check');
    const input=dialog.locator('textarea').first();await input.fill('오답');await dialog.locator('.memory-primary').click();await geometry('after wrong check');
    assert(await input.evaluate(n=>document.activeElement===n),'First error not focused');
    assert.equal(await dialog.locator('.memory-error[role=alert]').count(),1);
    if(profile.keyboard){
     await page.evaluate(()=>{Object.assign(window.__qaViewport,{height:innerHeight,width:innerWidth,offsetTop:0});window.__qaViewport.dispatchEvent(new Event('resize'));});
     await page.waitForFunction(()=>parseFloat(document.querySelector('#memoryQuizDialog').style.getPropertyValue('--memory-view-height'))===innerHeight);
     if(profile.height>=400)assert.equal(await dialog.locator('.memory-dock > .memory-error').count(),1,'Restore notices after keyboard dismissal');
     await page.evaluate(({height,width})=>{Object.assign(window.__qaViewport,{height,width:width||innerWidth,offsetTop:25});window.__qaViewport.dispatchEvent(new Event('resize'));},{height:profile.keyboard,width:profile.visibleWidth});
     await page.waitForFunction(h=>parseFloat(document.querySelector('#memoryQuizDialog').style.getPropertyValue('--memory-view-height'))===h,profile.keyboard);
     await geometry('keyboard reopened');
    }
    if(['small','keyboard-short','keyboard-landscape','large-text'].includes(profile.name))await page.screenshot({path:path.join(output,id+'.png')});
    const answers=await page.evaluate(()=>currentBookData.chapters.find(c=>Number(c.chapter)===Number(document.querySelector('#chapterSelect').value)).verses.slice(0,2).map(v=>v.text));
    for(const [i,field] of (await dialog.locator('textarea').all()).entries())await field.fill(answers[i]);
    await dialog.locator('.memory-primary').click();assert.equal(await dialog.locator('.memory-primary').getAttribute('data-action'),'next');await geometry('after correct check');
    await dialog.locator('.memory-primary').click();
    if(view==='verse'){assert.equal(await dialog.locator('textarea').getAttribute('data-verse'),'2');assert.equal(await dialog.locator('textarea').inputValue(),'');}
    else assert(await dialog.locator('.memory-score').isVisible());
    assert.deepEqual(errors,[]);observations.push({engine,profile:profile.name,view,pass:true});
   }catch(error){if(page)await page.screenshot({path:path.join(output,id+'-failure.png')}).catch(()=>{});observations.push({engine,profile:profile.name,view,pass:false,error:String(error)});console.error(id,String(error));}
   finally{await context.close();}
  }}finally{await browser.close();}
 }
}finally{if(server)await new Promise(resolve=>server.close(resolve));}
await fs.writeFile(path.join(output,'result.json'),JSON.stringify({base,local,physical_device_tested:false,software_keyboard_simulated:true,engine_emulation_not_native_mobile_browser:true,ads_blocked_for_qa:true,observations},null,2));
const failed=observations.filter(x=>!x.pass);console.log(`Mobile engine QA: ${observations.length-failed.length}/${observations.length} PASS; ${output}`);if(failed.length)process.exitCode=1;
