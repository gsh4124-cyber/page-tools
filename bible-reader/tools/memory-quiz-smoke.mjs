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
async function openPage(width=390,route='/',expectedChapter=null){
  const context=await browser.newContext({viewport:{width,height:844},locale:'ko-KR'});
  // Functional checks do not generate ad impressions or click ads.
  await context.route(/googlesyndication|doubleclick|adtrafficquality/,r=>r.abort());
  const page=await context.newPage(),errors=[];
  page.on('pageerror',e=>errors.push(String(e)));
  await page.goto(base+route+(route.includes('?')?'&':'?')+'qa=1',{waitUntil:'domcontentloaded'});
  await page.locator('#verses .verse').first().waitFor({timeout:40000});
  if(expectedChapter)await page.waitForFunction(chapter=>document.querySelector('#chapterSelect')?.value===String(chapter)&&document.querySelector('#verses .verse[data-verse="176"]'),expectedChapter,{timeout:40000});
  await page.locator('.memory-menu-button').waitFor({state:'attached'});
  await page.locator('#toolbarMoreToggle').click();await page.locator('.memory-menu-button').click();
  await page.locator('#memoryQuizDialog').waitFor({state:'visible'});
  return {context,page,errors};
}
async function setRange(page,fromChapter,fromVerse,toChapter,toVerse){
  await page.locator('.memory-range summary').click();
  await page.locator('#memoryFromChapter').selectOption(String(fromChapter));
  await page.locator('#memoryToChapter').selectOption(String(toChapter));
  await page.locator('#memoryFromVerse').selectOption(String(fromVerse));
  await page.locator('#memoryToVerse').selectOption(String(toVerse));
}
async function answerFor(page,chapter,verse){return page.evaluate(({chapter,verse})=>currentBookData.chapters.find(c=>Number(c.chapter)===chapter).verses.find(v=>Number(v.verse)===verse).text,{chapter,verse});}
async function identity(dialog){return dialog.locator('textarea').evaluateAll(nodes=>nodes.map(n=>`${n.dataset.chapter}:${n.dataset.verse}`).join(','));}
async function fillUnit(page,dialog){
  for(const input of await dialog.locator('textarea').all()){
    const chapter=Number(await input.getAttribute('data-chapter')),verse=Number(await input.getAttribute('data-verse'));
    await input.fill(await answerFor(page,chapter,verse));
  }
}
async function fit(page,dialog){
  assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),'Page horizontal overflow');
  assert(await dialog.evaluate(d=>d.scrollWidth<=d.clientWidth+1),'Dialog horizontal overflow');
  const sizes=await dialog.locator('button,textarea,.memory-views label,summary').evaluateAll(nodes=>nodes.filter(n=>n.getClientRects().length).map(n=>n.getBoundingClientRect().height));
  assert(sizes.every(height=>height>=44),'Small touch target');
}
try{
  for(const width of (local?[320,360,390,430,1280]:[390,1280])){
    const {context,page,errors}=await openPage(width),dialog=page.locator('#memoryQuizDialog');
    assert.equal(await dialog.locator('input[name=memoryView]').count(),2,'Exactly two view modes');
    assert(await page.locator('#memoryViewVerse').isChecked());
    assert.equal(await page.locator('.memory-range').getAttribute('open'),null,'Scope controls start collapsed');
    const chapter=await page.locator('#chapterSelect').inputValue();
    await dialog.locator('.memory-close').focus();await page.keyboard.press('ArrowRight');await page.keyboard.press('f');
    assert.equal(await page.locator('#chapterSelect').inputValue(),chapter,'Reader shortcuts must be isolated');
    assert.equal(await page.locator('body').evaluate(b=>b.classList.contains('reader-focus')),false);
    await fit(page,dialog);await page.screenshot({path:path.join(output,`setup-${width}.png`)});
    await setRange(page,3,16,3,17);await dialog.locator('.memory-primary').click();
    assert.equal(await identity(dialog),'3:16');assert.equal(await dialog.locator('.memory-preview,.memory-peek,.memory-hint').count(),0,'No text reveal or hints during a test');
    const input=dialog.locator('textarea'),answer=await answerFor(page,3,16);
    await input.press('Enter');assert(await dialog.locator('.memory-error[role=alert]').isVisible());
    assert.equal(await identity(dialog),'3:16');
    await input.fill('오답');await input.press('Enter');
    assert.equal(await dialog.locator('.memory-feedback').getAttribute('data-correct'),'false');
    assert.equal(await dialog.locator('.memory-result .memory-diff').first().textContent(),answer,'Show readable expected answer');
    await input.press('Enter');assert.equal(await identity(dialog),'3:16','Wrong answer cannot skip');
    await input.fill(answer.replace(/\s/g,'')+'!');
    await input.evaluate(n=>{n.dispatchEvent(new CompositionEvent('compositionstart',{bubbles:true}));n.dispatchEvent(new KeyboardEvent('keydown',{key:'Enter',bubbles:true,cancelable:true}));});
    assert.equal(await dialog.locator('.memory-primary').getAttribute('data-action'),'check','IME composition Enter must not grade');
    await input.evaluate(n=>{n.dispatchEvent(new CompositionEvent('compositionend',{bubbles:true}));n.dispatchEvent(new KeyboardEvent('keydown',{key:'Enter',keyCode:229,bubbles:true,cancelable:true}));n.dispatchEvent(new KeyboardEvent('keydown',{key:'Enter',isComposing:true,bubbles:true,cancelable:true}));});
    assert.equal(await dialog.locator('.memory-primary').getAttribute('data-action'),'check');
    await input.press('Shift+Enter');assert((await input.inputValue()).includes('\n'));
    assert.equal(await dialog.locator('.memory-primary').getAttribute('data-action'),'check','Shift+Enter is a newline');
    await page.keyboard.down('Enter');
    assert.equal(await dialog.locator('.memory-feedback').getAttribute('data-correct'),'true');
    assert.equal(await identity(dialog),'3:16','One Enter checks only');
    await page.keyboard.down('Enter');assert.equal(await identity(dialog),'3:16','Held Enter cannot skip');await page.keyboard.up('Enter');
    await input.fill(answer+' ');assert.equal(await dialog.locator('.memory-primary').getAttribute('data-action'),'check','Editing invalidates correctness');
    await input.press('Enter');assert.equal(await identity(dialog),'3:16');
    await input.press('Enter');assert.equal(await identity(dialog),'3:17');assert.equal(await input.inputValue(),'');
    assert(await input.evaluate(n=>document.activeElement===n),'Next verse receives typing focus');
    await fillUnit(page,dialog);await input.press('Enter');assert.equal(await identity(dialog),'3:17');
    await fit(page,dialog);await page.screenshot({path:path.join(output,`correct-${width}.png`)});
    await input.press('Enter');assert.equal(await dialog.locator('.memory-result').count(),2);
    assert.notEqual(await dialog.locator('.memory-score').textContent(),'100%','First wrong check remains reflected in results');
    assert((await dialog.locator('.memory-content').textContent()).includes('첫 답 확인 기준'));
    assert.equal(await dialog.locator('.memory-retry-wrong').textContent(),'틀린 절만 재시험 (1)');
    await page.screenshot({path:path.join(output,`wrong-result-${width}.png`)});
    await dialog.locator('.memory-retry-wrong').click();assert.equal(await identity(dialog),'3:16');assert.equal(await input.inputValue(),'');
    assert((await dialog.locator('.memory-context').textContent()).includes('오답 재시험'));
    await fillUnit(page,dialog);await input.press('Enter');await input.press('Enter');assert.equal(await dialog.locator('.memory-result').count(),1);assert.equal(await dialog.locator('.memory-score').textContent(),'100%');assert.equal(await dialog.locator('.memory-retry-wrong').count(),0);
    await dialog.locator('.memory-retry-all').click();assert.equal(await identity(dialog),'3:16');assert.equal(await input.inputValue(),'');
    assert(!(await dialog.locator('.memory-context').textContent()).includes('오답 재시험'));
    for(let i=0;i<2;i++){await fillUnit(page,dialog);await dialog.locator('.memory-primary').click();assert.equal(await dialog.locator('.memory-primary').getAttribute('data-action'),'next');await dialog.locator('.memory-primary').click();}
    assert.equal(await dialog.locator('.memory-score').textContent(),'100%');assert.equal(await dialog.locator('.memory-result').count(),2);assert.equal(await dialog.locator('.memory-retry-wrong').count(),0);
    await page.keyboard.press('Escape');await dialog.waitFor({state:'detached'});assert.equal(await page.locator('#chapterSelect').inputValue(),chapter);
    await page.locator('#verses .verse[data-verse="1"]').click();await page.locator('#verses .verse[data-verse="3"]').click();await page.locator('.verse-multi-memory').click();
    assert(await page.locator('#memoryUseSelected').isChecked());
    await dialog.locator('.memory-primary').click();assert.equal(await identity(dialog),'3:1');
    await fillUnit(page,dialog);await input.press('Enter');await input.press('Enter');assert.equal(await identity(dialog),'3:3','Non-contiguous selected verses stay selected');
    assert.deepEqual(errors,[]);observations.push({width,flow:'two modes, Enter check/next, wrong/blank blocking, IME/repeat, first-check score, wrong-only retry, full-scope reset, no reveal, selected 1+3, fit/touch targets',pass:true});await context.close();
  }
  for(const language of (local?['en','fr','de','zh','ru','la','pt','ar']:['en','ar'])){
    const {context,page,errors}=await openPage(390,`/${language}/`),dialog=page.locator('#memoryQuizDialog');
    const labels=await page.evaluate(code=>window.BibleMemory.labels(code),language);
    assert.equal(await page.locator('#memoryQuizTitle').textContent(),labels.title);assert.equal(await page.locator('html').getAttribute('lang'),language);
    assert.equal(await dialog.locator('.memory-views label').first().textContent(),labels.verseView);
    assert.equal(await dialog.locator('.memory-views label').last().textContent(),labels.chapterView);
    const chapter=Number(await page.locator('#chapterSelect').inputValue());
    await setRange(page,chapter,1,chapter,1);await dialog.locator('.memory-primary').click();await dialog.locator('textarea').fill('x');await dialog.locator('textarea').press('Enter');await fillUnit(page,dialog);
    await dialog.locator('textarea').press('Enter');assert.equal(await dialog.locator('.memory-primary').textContent(),labels.finish);
    await dialog.locator('textarea').press('Enter');assert.equal(await dialog.locator('.memory-retry-wrong').textContent(),`${labels.retryWrong} (1)`);assert.equal(await dialog.locator('.memory-retry-all').textContent(),labels.retryAll);
    await dialog.locator('.memory-retry-wrong').click();assert((await dialog.locator('.memory-context').textContent()).includes(labels.review));await fillUnit(page,dialog);await dialog.locator('textarea').press('Enter');await dialog.locator('textarea').press('Enter');assert.equal(await dialog.locator('.memory-score').textContent(),'100%');assert.equal(await dialog.locator('.memory-retry-wrong').count(),0);
    await fit(page,dialog);assert.deepEqual(errors,[]);observations.push({language,flow:'localized two modes and sequential grading/results',pass:true});await context.close();
  }
  for(const [language,route] of [['ko','/?v=krv1961&ref=Ps.119.1'],['en','/en/?v=kjv&ref=Ps.119.1']]){
    const {context,page,errors}=await openPage(390,route,119),dialog=page.locator('#memoryQuizDialog');
    const answers=await page.locator('#verses .verse-text').allTextContents();assert.equal(answers.length,176);
    if(language==='en')assert(answers.join('').length>8000);
    await page.locator('#memoryViewChapter').check();await dialog.locator('.memory-primary').click();assert.equal(await dialog.locator('textarea').count(),176);
    await fillUnit(page,dialog);await dialog.locator('.memory-primary').click();assert.equal(await dialog.locator('textarea').count(),176,'Checking must not also finish');
    await dialog.locator('.memory-primary').click();assert.equal(await dialog.locator('.memory-score').textContent(),'100%');assert.equal(await dialog.locator('.memory-result').count(),176);
    assert.equal(await dialog.locator('.memory-result').last().locator('h4').textContent(),'119:176 · 100%');
    await page.screenshot({path:path.join(output,`psalm119-${language}.png`)});await dialog.locator('.memory-primary').click();
    assert.equal(await dialog.locator('textarea').count(),176);assert.equal(await dialog.locator('textarea').last().inputValue(),'');await fit(page,dialog);
    assert.deepEqual(errors,[]);observations.push({language,chapter:'Psalm 119',verses:176,flow:'whole chapter view, no verse/total-character cap, check/finish, clear retry',pass:true});await context.close();
  }
  {
    const {context,page,errors}=await openPage(390),dialog=page.locator('#memoryQuizDialog');
    await page.locator('#memoryViewChapter').check();await setRange(page,3,35,4,2);
    await page.screenshot({path:path.join(output,'multi-chapter-setup.png')});await dialog.locator('.memory-primary').click();assert.equal(await identity(dialog),'3:35,3:36');
    await fillUnit(page,dialog);await dialog.locator('.memory-primary').click();assert.equal(await identity(dialog),'3:35,3:36');assert.equal(await dialog.locator('.memory-primary').textContent(),'다음 장');
    await dialog.locator('.memory-primary').click();assert.equal(await identity(dialog),'4:1,4:2');
    await fillUnit(page,dialog);await dialog.locator('.memory-primary').click();await dialog.locator('.memory-primary').click();
    assert.equal(await dialog.locator('.memory-score').textContent(),'100%');assert.equal(await dialog.locator('.memory-result').count(),4);
    assert.equal(await dialog.locator('.memory-result').last().locator('h4').textContent(),'4:2 · 100%');
    await page.keyboard.press('Escape');await dialog.waitFor({state:'detached'});assert.equal(await page.locator('#chapterSelect').inputValue(),'3');
    assert.deepEqual(errors,[]);observations.push({passage:'John 3:35–4:2',flow:'chapter mode shows one chapter at a time, separate check/next, whole scope completion, reading preserved',pass:true});await context.close();
  }
  {
    const {context,page,errors}=await openPage(390,'/?v=krv1961&ref=Ps.119.1',119),dialog=page.locator('#memoryQuizDialog');
    await setRange(page,119,176,120,1);assert.equal(await page.locator('#memoryToVerse option').count(),7,'Verse bounds follow chapter');
    await dialog.locator('.memory-primary').click();assert.equal(await identity(dialog),'119:176');
    await fillUnit(page,dialog);await dialog.locator('textarea').press('Enter');await dialog.locator('textarea').press('Enter');assert.equal(await identity(dialog),'120:1');
    await fillUnit(page,dialog);await dialog.locator('textarea').press('Enter');await dialog.locator('textarea').press('Enter');assert.equal(await dialog.locator('.memory-score').textContent(),'100%');
    assert.deepEqual(errors,[]);observations.push({passage:'Psalm 119:176–120:1',flow:'verse mode crosses chapter boundary and finishes entire scope',pass:true});await context.close();
  }
  for(const width of (local?[320,390,1280]:[390])){
    const {context,page,errors}=await openPage(width),dialog=page.locator('#memoryQuizDialog');
    await page.locator('#memoryViewChapter').check();await dialog.locator('.memory-primary').click();
    assert.equal(await dialog.locator('textarea').count(),36);
    const first=dialog.locator('textarea').nth(0),second=dialog.locator('textarea').nth(1),primary=dialog.locator('.memory-primary');
    const small=await first.boundingBox();assert(small.height<=100,'Empty chapter input should be compact');
    const firstAnswer=await answerFor(page,3,1);await first.fill((firstAnswer+' ').repeat(3));
    assert((await first.boundingBox()).height>small.height,'Chapter input must grow to fit typed text');
    await first.fill(firstAnswer);await first.press('Tab');assert(await second.evaluate(n=>document.activeElement===n),'Tab should move directly to the next verse');
    await second.fill(await answerFor(page,3,2));assert.equal(await dialog.locator('.memory-meter').getAttribute('value'),'2');
    assert.equal(await dialog.locator('.memory-hint,.memory-inline-hint').count(),0,'Hints are not part of the test');
    assert.equal(await dialog.locator('.memory-peek,.memory-preview').count(),0,'Chapter view must not provide text reveal');assert(await second.evaluate(n=>document.activeElement===n));
    const dockBefore=await dialog.locator('.memory-dock').boundingBox();assert(dockBefore.width>=(await dialog.boundingBox()).width-4,'Controls must span the dialog width');
    await dialog.locator('.memory-content').evaluate(n=>{n.scrollTop=n.scrollHeight;});
    const dockAfter=await dialog.locator('.memory-dock').boundingBox();assert.equal(dockBefore.y,dockAfter.y,'Dock must remain visible during chapter scrolling');
    assert(dockAfter.y+dockAfter.height<=844,'Dock must fit viewport');
    await primary.hover();const colors=await primary.evaluate(n=>({background:getComputedStyle(n).backgroundColor,foreground:getComputedStyle(n).color,expectedBackground:getComputedStyle(n.closest('dialog')).color,expectedForeground:getComputedStyle(n.closest('dialog')).backgroundColor}));
    assert.equal(colors.background,colors.expectedBackground,'Hovered primary button must retain its contrast');assert.equal(colors.foreground,colors.expectedForeground);
    await page.mouse.move(0,0);await dialog.locator('.memory-content').evaluate(n=>{n.scrollTop=0;});
    await fit(page,dialog);await page.screenshot({path:path.join(output,`chapter-compact-${width}.png`)});
    if(width<500){
      await page.setViewportSize({width,height:460});
      const dock=await dialog.locator('.memory-dock').boundingBox(),body=await dialog.locator('.memory-content').boundingBox();
      assert(dock.y+dock.height<=460&&body.height>=64,'Dock must fit a reduced viewport without covering the input scroller');assert(body.y+body.height<=dock.y+1);
      await dialog.locator('textarea').last().focus();await page.keyboard.press('a');assert(await primary.isVisible());
      await page.screenshot({path:path.join(output,`chapter-reduced-height-${width}.png`)});
    }
    assert.deepEqual(errors,[]);observations.push({width,flow:'compact/growing chapter inputs, Tab focus, filled progress, no hints, pinned controls, hover contrast, reduced viewport',pass:true});await context.close();
  }
  {
    const {context,page,errors}=await openPage(390),dialog=page.locator('#memoryQuizDialog');
    await setRange(page,3,1,3,2);await dialog.locator('.memory-primary').click();
    assert.equal(await dialog.locator('.memory-hint,.memory-inline-hint').count(),0);
    for(let i=0;i<2;i++){await fillUnit(page,dialog);await dialog.locator('textarea').press('Enter');await dialog.locator('textarea').press('Enter');}
    assert(!(await dialog.locator('h3').textContent()).includes('연습'),'Unaided attempt remains a test');
    await dialog.locator('.memory-primary').click();assert.equal(await dialog.locator('.memory-inline-hint,.memory-peek,.memory-preview').count(),0);
    await page.keyboard.press('Escape');await dialog.waitFor({state:'detached'});await page.keyboard.press('f');
    assert(await page.locator('body').evaluate(n=>n.classList.contains('reader-focus')));
    await page.locator('#verses .verse[data-verse="1"]').click();await page.locator('#verses .verse[data-verse="3"]').click();await page.locator('.verse-multi-memory').click();
    await dialog.locator('.memory-primary').click();assert(await dialog.locator('.memory-dock').isVisible(),'Reader focus mode must not hide quiz controls');assert(await dialog.locator('.memory-primary').isVisible());
    assert.deepEqual(errors,[]);observations.push({flow:'unaided verse flow, test result, clean retry, reader focus mode',pass:true});await context.close();
  }
  {
    const {context,page,errors}=await openPage(390),dialog=page.locator('#memoryQuizDialog');
    await page.locator('#memoryViewChapter').check();await setRange(page,3,1,4,2);await dialog.locator('.memory-primary').click();
    for(const chapter of [3,4]){
      await fillUnit(page,dialog);await dialog.locator(`textarea[data-chapter="${chapter}"][data-verse="1"]`).fill('오답');await dialog.locator('.memory-primary').click();
      await fillUnit(page,dialog);await dialog.locator('.memory-primary').click();await dialog.locator('.memory-primary').click();
    }
    assert.equal(await dialog.locator('.memory-result').count(),38);assert.equal(await dialog.locator('.memory-retry-wrong').textContent(),'틀린 절만 재시험 (2)');
    await dialog.locator('.memory-retry-wrong').click();assert.equal(await identity(dialog),'3:1');assert.equal(await dialog.locator('textarea').inputValue(),'');
    await fillUnit(page,dialog);await dialog.locator('.memory-primary').click();await dialog.locator('.memory-primary').click();assert.equal(await identity(dialog),'4:1','Repeated verse numbers retain their chapter');
    await dialog.locator('textarea').fill('오답');await dialog.locator('.memory-primary').click();await fillUnit(page,dialog);await dialog.locator('.memory-primary').click();await dialog.locator('.memory-primary').click();
    assert.equal(await dialog.locator('.memory-result').count(),2);assert.equal(await dialog.locator('.memory-reference').textContent(),'요한복음 3:1 · 4:1','Review reference must list only included verses');
    assert.equal(await dialog.locator('.memory-retry-wrong').textContent(),'틀린 절만 재시험 (1)');await dialog.locator('.memory-retry-wrong').click();assert.equal(await identity(dialog),'4:1');assert.equal(await dialog.locator('textarea').inputValue(),'');
    await fillUnit(page,dialog);await dialog.locator('.memory-primary').click();await dialog.locator('.memory-primary').click();assert.equal(await dialog.locator('.memory-result').count(),1);assert.equal(await dialog.locator('.memory-score').textContent(),'100%');assert.equal(await dialog.locator('.memory-retry-wrong').count(),0);
    await dialog.locator('.memory-retry-all').click();assert.equal(await dialog.locator('textarea').count(),36,'Full retry must restore original scope');assert((await dialog.locator('.memory-reference').textContent()).includes('3:1–36'));
    await fillUnit(page,dialog);await dialog.locator('.memory-primary').click();await dialog.locator('.memory-primary').click();assert.equal(await identity(dialog),'4:1,4:2');
    assert.equal(await dialog.locator('.memory-peek,.memory-preview,.memory-hint').count(),0);assert.deepEqual(errors,[]);observations.push({flow:'chapter retry across repeated verse numbers, successive narrowing 2→1→0 mistakes, exact review references, clean answers, original full-scope restoration',pass:true});await context.close();
  }
  {
    const {context,page,errors}=await openPage(390),dialog=page.locator('#memoryQuizDialog');
    const answer=await answerFor(page,11,35),characters=Array.from(answer.normalize('NFC'));
    const missing=characters.findIndex((character,index)=>index>3&&/[\p{L}\p{N}]/u.test(character));assert(missing>3);
    characters[0]='애';characters.splice(missing,1);characters.push('요');const entered=characters.join('');
    const kinds=['wrong','missing','extra'],palettes={};
    for(const theme of ['light','dark']){
      if(await page.locator('html').getAttribute('data-theme')!==theme){
        await page.keyboard.press('Escape');await dialog.waitFor({state:'detached'});
        if(!await page.locator('#themeToggle').isVisible())await page.locator('#toolbarMoreToggle').click();await page.locator('#themeToggle').click();
        if(!await page.locator('.memory-menu-button').isVisible())await page.locator('#toolbarMoreToggle').click();await page.locator('.memory-menu-button').click();
      }
      assert.equal(await page.locator('html').getAttribute('data-theme'),theme);await setRange(page,11,35,11,35);await dialog.locator('.memory-primary').click();
      await dialog.locator('textarea').fill(entered);await dialog.locator('textarea').press('Enter');
      assert.deepEqual(await dialog.locator('.memory-legend-item').allTextContents(),['오자','탈자','추가']);
      const palette=[];
      for(const kind of kinds){
        const run=dialog.locator(`.memory-feedback .memory-diff .memory-${kind}`).first();assert(await run.isVisible());
        const styles=await run.evaluate(n=>({color:getComputedStyle(n).color,background:getComputedStyle(n).backgroundColor,line:getComputedStyle(n).textDecorationLine,style:getComputedStyle(n).textDecorationStyle,size:getComputedStyle(n).fontSize}));
        const legend=await dialog.locator(`.memory-legend-${kind}`).evaluate(n=>({color:getComputedStyle(n).color,background:getComputedStyle(n).backgroundColor}));
        assert.equal(styles.color,legend.color);assert.equal(styles.background,legend.background);
        const luminance=rgb=>rgb.match(/[\d.]+/g).slice(0,3).map(Number).map(v=>v/255).map(v=>v<=.04045?v/12.92:((v+.055)/1.055)**2.4).reduce((sum,v,i)=>sum+v*[.2126,.7152,.0722][i],0);
        const a=luminance(styles.color),b=luminance(styles.background);assert((Math.max(a,b)+.05)/(Math.min(a,b)+.05)>=4.5,'Colored comparison text must remain readable');
        if(kind==='extra')assert(styles.line.includes('line-through'));else assert(styles.line.includes('underline'));
        if(kind==='missing')assert.equal(styles.style,'dotted');palette.push({kind,...styles});
      }
      assert.equal(new Set(palette.map(p=>p.background)).size,3);assert.equal(new Set(palette.map(p=>p.color)).size,3);
      const correctSize=await dialog.locator('.memory-feedback .memory-diff .memory-correct').first().evaluate(n=>getComputedStyle(n).fontSize);assert(palette.every(p=>p.size===correctSize),'Correct and error characters must use the same text size');
      palettes[theme]=palette;await dialog.locator('.memory-feedback').scrollIntoViewIfNeeded();await fit(page,dialog);await page.screenshot({path:path.join(output,`grading-colors-${theme}.png`)});
      await fillUnit(page,dialog);await dialog.locator('textarea').press('Enter');await dialog.locator('textarea').press('Enter');
      assert.equal(await dialog.locator('.memory-retry-wrong').count(),1);assert.equal(await dialog.locator('.memory-legend').count(),1,'Result must also explain the colors');
      for(const kind of kinds)assert(await dialog.locator(`.memory-results .memory-${kind}`).count()>0);
      if(theme==='light'){await page.keyboard.press('Escape');await dialog.waitFor({state:'detached'});if(!await page.locator('.memory-menu-button').isVisible())await page.locator('#toolbarMoreToggle').click();await page.locator('.memory-menu-button').click();}
    }
    assert.notDeepEqual(palettes.light,palettes.dark);assert.deepEqual(errors,[]);observations.push({flow:'real verse with substitution/deletion/insertion, matching legend, distinct readable colors, underline/dots/strike, equal text size, light/dark feedback and results',palettes,pass:true});await context.close();
  }
  await fs.writeFile(path.join(output,'result.json'),JSON.stringify({base,local,ads_blocked_for_qa:true,physical_device_tested:false,ime_events_simulated:true,observations},null,2));
  console.log(`Memory quiz browser QA PASS: ${observations.length} viewport/language flows; ${output}`);
}finally{await browser.close();if(server)await new Promise(resolve=>server.close(resolve));}
