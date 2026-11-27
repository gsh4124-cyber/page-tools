import {chromium,firefox,webkit} from 'playwright';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {createServer} from 'node:http';

const product=fileURLToPath(new URL('../',import.meta.url)),root=path.join(product,'dist');
const local=process.argv.includes('--local'),output=process.env.GUIDE_TEST_EVIDENCE||path.join(product,'qa_evidence/local-game-contract/guides');
let server,base=process.env.GUIDE_TEST_BASE||'https://random-ppobgi.pages.dev';
if(local){
 server=createServer(async(req,res)=>{
  try{
   const candidate=path.resolve(root,'.'+decodeURIComponent(new URL(req.url,'http://local').pathname));
   if(candidate!==root&&!candidate.startsWith(root+path.sep)){res.writeHead(403).end();return;}
   const file=(await fs.stat(candidate)).isDirectory()?path.join(candidate,'index.html'):candidate;
   res.setHeader('Content-Type',({'.html':'text/html; charset=utf-8','.js':'application/javascript; charset=utf-8','.css':'text/css','.svg':'image/svg+xml','.json':'application/json','.png':'image/png'})[path.extname(file)]||'text/plain');
   res.end(await fs.readFile(file));
  }catch{res.writeHead(404).end('Not found');}
 });
 await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));base=`http://127.0.0.1:${server.address().port}`;
}
await fs.mkdir(output,{recursive:true});
const routes={ladder:'ladder',roulette:'wheel',lots:'lot',pinball:'pinball',race:'race',capsule:'capsule',slot:'slot',bomb:'bomb',team:'team',order:'order',dice:'dice',coin:'coin',yut:'yut','guide/fair-draw':null,'guide/classroom':'wheel'};
const results=[];
try{
 for(const engine of (process.env.GAME_CONTRACT_ENGINES||'chromium').split(',')){
  const browser=await ({chromium,firefox,webkit})[engine].launch({headless:true});
  try{
   const context=await browser.newContext({viewport:{width:320,height:850},reducedMotion:'reduce'}),page=await context.newPage(),errors=[];
   page.on('pageerror',error=>errors.push(String(error)));
   await context.route(/googlesyndication|doubleclick|adtrafficquality|\/api\/events|supabase\.co/,route=>route.abort());
   for(const width of [320,1280]){
    await page.setViewportSize({width,height:850});
    for(const [route,target] of Object.entries(routes)){
     const response=await page.goto(`${base}/${route}/?qa=1`);assert.equal(response.status(),200);
     assert.equal(await page.locator('h1').count(),1);
     assert.equal(await page.locator('link[rel="canonical"]').getAttribute('href'),`https://random-ppobgi.pages.dev/${route}/`);
     assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),`${route} overflows at ${width}`);
     if(width===320)assert(await page.locator('.table-scroll').evaluateAll(tables=>tables.every(table=>table.scrollWidth<=table.clientWidth+1)),`${route} table needs sideways scrolling`);
     // Visible FAQs must agree with structured search data.
     const documents=await page.locator('script[type="application/ld+json"]').allTextContents();
     for(const document of documents){
      const schema=JSON.parse(document);
      if(schema['@type']==='FAQPage')for(const question of schema.mainEntity){
       assert(await page.locator('dt').filter({hasText:question.name}).count());
       assert((await page.locator('article').innerText()).includes(question.acceptedAnswer.text));
      }
     }
     // Check the article's actual internal destinations, including the real seat app.
     if(width===320){
      const links=await page.locator('main a[href^="/"]').evaluateAll(links=>[...new Set(links.map(a=>new URL(a.href).pathname))]);
      for(const link of links)assert.equal((await context.request.get(base+link)).status(),200,`${route} broken link ${link}`);
     }
     if(engine==='chromium'&&width===320&&['lots','pinball','race','capsule','slot','bomb','guide/fair-draw','guide/classroom'].includes(route))await page.screenshot({path:path.join(output,`${route.replaceAll('/','-')}-mobile.png`),fullPage:true});
     if(route==='guide/classroom'){
      const start=page.getByRole('link',{name:'발표자 뽑기 시작',exact:true});
      assert.equal(await page.locator('h1').innerText(),'수업 발표자 랜덤 뽑기');
      assert.equal(await start.getAttribute('href'),'/#wheel');
      const box=await start.boundingBox();
      assert(box&&box.y>=0&&box.y+box.height<=850&&box.height>=44,`classroom start link is outside the first screen at ${width}`);
     }
     if(target&&width===320){
      await page.locator('article a.button').first().click();
      // The deferred tool entry can finish after the game core is ready.
      if(['ladder','wheel','lot','pinball','race','capsule','slot','bomb'].includes(target)){
       await page.locator(`.methods [data-method="${target}"][aria-checked="true"]`).waitFor({state:'visible',timeout:10000});
       if(target==='lot'){
        assert(!(await page.locator('#inputTabs').isVisible()));
        await page.locator('#totalPeople').fill('8');await page.locator('#totalPeople').dispatchEvent('input');
        await page.locator('#pickCount').fill('2');await page.locator('#pickCount').dispatchEvent('input');
        await page.locator('#pickBtn').click();assert.equal(await page.locator('.paper-lot').count(),8);
        await page.locator('#showAllBtn').click();assert.equal(await page.locator('.paper-lot.win').count(),2);
        assert(!(await page.locator('#excludeBtn').isVisible()));
       }
      }else{
       await page.locator(`#gameTools [data-tool="${target}"][aria-selected="true"]`).waitFor({state:'visible',timeout:10000});
       assert.equal(await page.locator('#showTools').getAttribute('aria-pressed'),'true');
       assert(await page.locator(`[data-panel="${target}"]`).isVisible());
      }
     }
     results.push({engine,route,width,pass:true});
    }
   }
   for(const lang of ['ko','en','ar']){
    await page.setViewportSize({width:320,height:850});
    await page.goto(`${base}/${lang==='ko'?'':lang+'/'}?qa=1`);
    if(lang!=='ko')await page.waitForFunction(()=>window.__RANDOM_PICKER_I18N_READY__);
    const help=page.locator('[data-guide-link]');
    assert(await help.isVisible());
    assert(await page.locator('.hero p').isVisible());
    if(lang!=='ko')assert.equal(await help.innerText(),await page.evaluate(lang=>window.RandomPickerLocales[lang].footer.guide,lang));
    const box=await help.boundingBox();assert(box.height>=44);assert(box.x>=0&&box.x+box.width<=321);
    assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));
    if(engine==='chromium')await page.screenshot({path:path.join(output,`help-${lang}-mobile.png`)});
    await help.click();assert.equal(new URL(page.url()).pathname,'/guide/');
    if(lang!=='ko')assert.equal(new URL(page.url()).searchParams.get('lang'),lang);
    results.push({engine,phase:'help-entry',lang,pass:true});
   }
   assert.deepEqual(errors,[]);await context.close();
  }finally{await browser.close();}
 }
 await fs.writeFile(path.join(output,'results.json'),JSON.stringify(results,null,2));
 console.log(`Guide browser checks passed: ${results.length}`);
}finally{if(server)await new Promise(resolve=>server.close(resolve));}
