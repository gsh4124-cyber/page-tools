import {chromium,firefox,webkit} from 'playwright';
import {createServer} from 'node:http';
import fs from 'node:fs/promises';
import path from 'node:path';
import assert from 'node:assert/strict';
import {fileURLToPath} from 'node:url';

const local=process.argv.includes('--local');
const output=process.env.MEMORY_DETAIL_EVIDENCE||fileURLToPath(new URL('../qa_evidence/live/memory-detail/',import.meta.url));
await fs.mkdir(output,{recursive:true});
let server,base=process.env.MEMORY_QUIZ_BASE||'https://bible-reader-1iz.pages.dev';
if(local){
  const root=fileURLToPath(new URL('../dist/',import.meta.url));
  server=createServer(async(req,res)=>{try{
    let file=path.resolve(root,'.'+new URL(req.url,'http://local').pathname);
    if(!file.startsWith(path.resolve(root)+path.sep)&&file!==path.resolve(root))throw Error('path');
    if((await fs.stat(file)).isDirectory())file=path.join(file,'index.html');
    res.setHeader('Content-Type',({'.html':'text/html; charset=utf-8','.js':'text/javascript','.css':'text/css','.json':'application/json'})[path.extname(file)]||'application/octet-stream');
    res.end(await fs.readFile(file));
  }catch{res.writeHead(404).end();}});
  await new Promise(r=>server.listen(0,'127.0.0.1',r));base=`http://127.0.0.1:${server.address().port}`;
}
const observations=[],engines={chromium,firefox,webkit};
const languages=['ko','en','fr','de','zh','ru','la','pt','ar'];
const profiles=[{width:320,height:568,theme:'dark'},{width:844,height:390,theme:'light',largeText:true},{width:1280,height:800,theme:'light'}];
const refs=[{bookIndex:42,chapter:3,verse:16},{bookIndex:42,chapter:3,verse:17}];
const collectionKey='bible-reader-memory-passages-v1';
function record(meta,flow,pass,details){observations.push({...meta,flow,pass:!!pass,...(details?{details}:{})});}
async function geometry(dialog){return dialog.evaluate(d=>{
  const r=n=>{const b=n.getBoundingClientRect();return {x:b.x,y:b.y,right:b.right,bottom:b.bottom,width:b.width,height:b.height};};
  const c=d.querySelector('.memory-content'),v=window.visualViewport;
  return {dialog:r(d),content:r(c),primary:r(d.querySelector('.memory-primary')),horizontal:d.scrollWidth>d.clientWidth+1||c.scrollWidth>c.clientWidth+1,viewport:{x:v?.offsetLeft||0,y:v?.offsetTop||0,width:v?.width||innerWidth,height:v?.height||innerHeight}};
});}
async function contrast(input){return input.evaluate(n=>{
  const rgb=s=>s.match(/[\d.]+/g).map(Number),blend=(a,b)=>a.slice(0,3).map((x,i)=>x*(a[3]??1)+b[i]*(1-(a[3]??1)));
  const luminance=c=>c.map(v=>{v/=255;return v<=.04045?v/12.92:((v+.055)/1.055)**2.4;}).reduce((s,v,i)=>s+v*[.2126,.7152,.0722][i],0);
  const ratio=(a,b)=>{const x=luminance(a),y=luminance(b);return (Math.max(x,y)+.05)/(Math.min(x,y)+.05);};
  const s=getComputedStyle(n),bg=blend(rgb(s.backgroundColor),rgb(getComputedStyle(n.closest('dialog')).backgroundColor));
  return {hint:ratio(rgb(getComputedStyle(n,'::placeholder').color),bg),focus:ratio(rgb(s.outlineColor),bg),offset:parseFloat(s.outlineOffset),width:parseFloat(s.outlineWidth)};
});}
try{
 for(const engine of (process.env.MEMORY_DETAIL_ENGINES||'chromium').split(',')){
  const browser=await engines[engine].launch({headless:true});
  try{for(const [languageIndex,language] of languages.entries()){
   const profile=profiles[languageIndex%profiles.length],context=await browser.newContext({viewport:{width:profile.width,height:profile.height},hasTouch:true,reducedMotion:'reduce'});
   await context.route(/googlesyndication|doubleclick|adtrafficquality/,r=>r.abort());
   if(language==='ko')await context.addInitScript(()=>{const v=new EventTarget();Object.assign(v,{width:innerWidth,height:innerHeight,offsetTop:0,offsetLeft:0,scale:1});Object.defineProperty(window,'visualViewport',{configurable:true,value:v});window.__detailViewport=v;});
   await context.addInitScript(({refs,collectionKey,theme})=>{localStorage.setItem(collectionKey,JSON.stringify(refs));localStorage.setItem('bible-reader-theme',theme);},{refs,collectionKey,theme:profile.theme});
   const page=await context.newPage(),errors=[];page.on('pageerror',e=>errors.push(String(e)));
   let view='setup';const common={engine,language,...profile};
   try{
    await page.goto(base+(language==='ko'?'/':`/${language}/`)+'?qa=memory-detail',{waitUntil:'domcontentloaded'});
    await page.waitForFunction(()=>document.querySelector('#status')?.hidden&&window.BibleMemory&&document.querySelector('.memory-practice-menu-button'),{},{timeout:40000});
    await page.evaluate(()=>document.fonts.ready.then(()=>true));
    const reader=await page.evaluate(()=>({book:state.bookIndex,chapter:state.chapter}));
    const l=await page.evaluate(code=>BibleMemory.labels(code),language);
    for(view of ['verse','chapter']){
     const meta={...common,view},dialog=page.locator('#memoryQuizDialog');
     await page.locator('#toolbarMoreToggle').click();await page.locator('.memory-practice-menu-button').click();
     await page.waitForFunction(()=>!document.querySelector('.memory-primary').disabled);
     await page.locator('#memoryView'+(view==='verse'?'Verse':'Chapter')).check();
     await dialog.locator('.memory-help summary').click();
     const help=await dialog.locator('.memory-help').innerText();
     record(meta,'View-specific practice help',help.includes(view==='verse'?l.enterHelp:l.practiceChapterHelp));
     await page.locator('#memoryModeExam').check();
     record(meta,'View-specific exam help',(await dialog.locator('.memory-help').innerText()).includes(view==='verse'?l.enterHelp:l.chapterHelp));
     await page.locator('#memoryModePractice').check();
     await dialog.locator('.memory-primary').click();
     if(profile.largeText)await page.addStyleTag({content:'.memory-quiz{font-size:24px!important}.memory-quiz textarea{font-size:28px!important}.memory-quiz button{font-size:24px!important}'});
     const input=dialog.locator('textarea:visible').first(),source=dialog.locator('.memory-practice-text:visible').first();
     const expected=await source.textContent();
     record(meta,'One focused verse and localized empty hint',await dialog.locator('textarea:visible').count()===1&&await input.getAttribute('placeholder')===l.practiceHint);
     await input.focus();const colors=await contrast(input);
     record(meta,'Readable hint and continuous keyboard focus',colors.hint>=4.5&&colors.focus>=3&&colors.width>=2&&colors.offset<=0,colors);
     const g=await geometry(dialog);
     record(meta,'Dialog fits and check action stays reachable',!g.horizontal&&g.dialog.x>=g.viewport.x-1&&g.dialog.y>=g.viewport.y-1&&g.dialog.right<=g.viewport.x+g.viewport.width+1&&g.dialog.bottom<=g.viewport.y+g.viewport.height+1&&g.primary.height>=44&&g.content.height>=44);
     const original=await input.inputValue();
     await page.locator('.memory-practice-reveal').click();
     record(meta,'Hidden passage has matching visual and accessible instructions',await input.getAttribute('placeholder')===l.practiceMemoryHint&&(await input.getAttribute('aria-label')).endsWith(' · '+l.answer)&&await dialog.locator('.memory-practice-text:visible').count()===0);
     record(meta,'Hiding the source preserves input',await input.inputValue()===original);
     await input.fill('draft');await input.press('ArrowLeft');
     record(meta,'Arrow key stays in answer and preserves reader position',JSON.stringify(await page.evaluate(()=>({book:state.bookIndex,chapter:state.chapter})))===JSON.stringify(reader));
     await input.dispatchEvent('compositionstart');await input.dispatchEvent('keydown',{key:'Enter',code:'Enter',isComposing:true,keyCode:229});await input.dispatchEvent('compositionend');
     record(meta,'IME Enter does not check or navigate',await input.inputValue()==='draft'&&await dialog.locator('.memory-diff').count()===0);
     await page.locator('.memory-practice-reveal').click();
     record(meta,'Showing source restores hint and preserves draft',await input.getAttribute('placeholder')===l.practiceHint&&await input.inputValue()==='draft'&&await dialog.locator('.memory-practice-text:visible').count()===1);
     if(language==='ko'||language==='ar'){
      await input.fill('x'.repeat(Math.min(1000,Number(await input.getAttribute('maxlength')))));
      record(meta,'Long unbroken input grows without clipping',await input.evaluate(n=>n.scrollHeight<=n.clientHeight+2)&&!(await geometry(dialog)).horizontal);
      await input.fill('draft');
     }
     if(language==='ko'){
      await page.evaluate(()=>{Object.assign(window.__detailViewport,{height:240,offsetTop:25});window.__detailViewport.dispatchEvent(new Event('resize'));});
      await page.waitForFunction(()=>parseFloat(document.querySelector('#memoryQuizDialog').style.getPropertyValue('--memory-view-height'))===240);
      await input.evaluate(n=>{const c=n.closest('.memory-content');c.scrollTop+=n.getBoundingClientRect().top-c.getBoundingClientRect().top-8;});
      const k=await geometry(dialog),b=await input.boundingBox(),close=await dialog.locator('.memory-close').boundingBox();
      record(meta,'Simulated keyboard keeps input and pinned actions reachable',!k.horizontal&&k.content.height>=44&&k.primary.height>=44&&k.primary.bottom<=k.viewport.y+k.viewport.height+1&&close.height>=44&&close.y>=k.viewport.y-1&&close.y+close.height<=k.viewport.y+k.viewport.height+1&&b.y<k.content.bottom&&b.y+b.height>k.content.y);
      await page.screenshot({path:path.join(output,`${engine}-ko-${view}-keyboard.png`)});
      await page.evaluate(()=>{Object.assign(window.__detailViewport,{height:innerHeight,offsetTop:0});window.__detailViewport.dispatchEvent(new Event('resize'));});
      await page.waitForFunction(()=>parseFloat(document.querySelector('#memoryQuizDialog').style.getPropertyValue('--memory-view-height'))===innerHeight);
      record(meta,'Keyboard dismissal retains draft and restores header',await input.inputValue()==='draft'&&await dialog.locator('.memory-header .memory-close').count()===1);
     }
     if(view==='chapter'){
      const cards=dialog.locator('.memory-practice-row');
      await cards.nth(1).locator('summary').focus();await page.keyboard.press('Enter');
      record(meta,'Keyboard opens only the chosen verse',await cards.nth(1).evaluate(n=>n.open)&&await dialog.locator('.memory-practice-row[open]').count()===1);
      await cards.first().locator('summary').focus();await page.keyboard.press('Space');
      record(meta,'Keyboard returns with draft intact',await cards.first().evaluate(n=>n.open)&&await dialog.locator('textarea').first().inputValue()==='draft');
     }
     await input.fill('');await dialog.locator('.memory-primary').click();
     record(meta,'Blank check shows one comparison and a named invalid input',await input.getAttribute('aria-invalid')==='true'&&await dialog.locator('.memory-diff:visible').count()===1&&await dialog.locator('.memory-practice-text:visible').count()===0&&!!(await input.getAttribute('aria-describedby')));
     const invalidColors=await contrast(input);record(meta,'Error focus remains readable',invalidColors.focus>=3,invalidColors);
     await input.fill(expected+'\n');
     record(meta,'Editing clears stale error feedback',await input.getAttribute('aria-invalid')===null&&await dialog.locator('.memory-diff').count()===0);
     await input.press('Shift+Enter');
     record(meta,'Shift+Enter keeps the answer in place',await input.getAttribute('data-verse')==='16'&&(await input.inputValue()).includes('\n'));
     if(view==='chapter'){await input.press('Enter');record(meta,'Chapter Enter inserts a line break without checking',await input.getAttribute('data-verse')==='16'&&await dialog.locator('.memory-primary').getAttribute('data-action')==='check');}
     await dialog.locator('.memory-primary').click();
     record(meta,'Correct check is compact and preserves actual input',await dialog.locator('.memory-diff:visible').count()===0&&(await input.inputValue()).startsWith(expected)&&await dialog.locator('.memory-correct').isVisible());
     if(language==='ar')record(meta,'Arabic source and answer use RTL text direction',await input.evaluate(n=>getComputedStyle(n).direction==='rtl')&&await dialog.locator('.memory-practice-text:visible').first().evaluate(n=>getComputedStyle(n).direction==='rtl'));
     await page.screenshot({path:path.join(output,`${engine}-${language}-${view}.png`)});
     if(view==='verse'){
      await input.press('Enter');
      record(meta,'Enter advances only after separate confirmation',await input.getAttribute('data-verse')==='17'&&await input.inputValue()==='');
      await dialog.locator('.memory-previous').click();
      record(meta,'Previous restores confirmed answer and its hint',(await input.inputValue()).startsWith(expected)&&await input.getAttribute('placeholder')===l.practiceHint&&await dialog.locator('.memory-primary').getAttribute('data-action')==='next');
     }else{
      await dialog.locator('.memory-primary').click();await input.fill('second draft');await page.locator('.memory-practice-repeat').click();
      record(meta,'Repeat clears only active verse and keeps first confirmation',await input.inputValue()===''&&(await dialog.locator('textarea').first().inputValue()).startsWith(expected)&&await dialog.locator('.memory-practice-state').first().getAttribute('data-complete')==='true');
     }
     await dialog.locator('.memory-close').focus();await page.keyboard.press('Tab');
     record(meta,'Native modal contains keyboard focus',await dialog.evaluate(d=>d.contains(document.activeElement)));
     await page.keyboard.press('Escape');await dialog.waitFor({state:'detached'});
     record(meta,'Escape closes and restores reachable toolbar focus',await page.evaluate(()=>document.activeElement?.matches('.memory-practice-menu-button,#toolbarMoreToggle')&&!!document.activeElement.getClientRects().length));
     record(meta,'Closing preserves collection and reading position',JSON.stringify(await page.evaluate(key=>JSON.parse(localStorage.getItem(key)),collectionKey))===JSON.stringify(refs)&&JSON.stringify(await page.evaluate(()=>({book:state.bookIndex,chapter:state.chapter})))===JSON.stringify(reader));
    }
    record(common,'No browser runtime errors',errors.length===0,errors);
   }catch(error){record({...common,view},'Scenario completed',false,String(error));await page.screenshot({path:path.join(output,`${engine}-${language}-${view}-failure.png`)}).catch(()=>{});console.error(engine,language,view,String(error));}
   finally{await context.close();await fs.writeFile(path.join(output,'partial.json'),JSON.stringify(observations,null,2));}
  }}finally{await browser.close();}
 }
}finally{if(server)await new Promise(r=>server.close(r));}
const failed=observations.filter(o=>!o.pass),result={base,local,physical_device_tested:false,ime_events_simulated:true,software_keyboard_simulated:true,observations,failed:failed.length};
await fs.writeFile(path.join(output,'result.json'),JSON.stringify(result,null,2));
console.log(`Memory detail audit: ${observations.length-failed.length}/${observations.length} checks passed.`);
if(failed.length){console.error(JSON.stringify(failed,null,2));process.exitCode=1;}
