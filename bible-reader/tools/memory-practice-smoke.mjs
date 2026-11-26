import {chromium} from 'playwright';
import {createServer} from 'node:http';
import fs from 'node:fs/promises';
import path from 'node:path';
import assert from 'node:assert/strict';
import {fileURLToPath} from 'node:url';
import {chooseMemory,closeMemory} from './picker-test-helpers.mjs';

const local=process.argv.includes('--local');
const output=process.env.MEMORY_PRACTICE_EVIDENCE||fileURLToPath(new URL('../qa_evidence/live/memory-practice/',import.meta.url));
await fs.mkdir(output,{recursive:true});
let server,base=process.env.MEMORY_QUIZ_BASE||'https://bible-reader-1iz.pages.dev';
if(local){
  const root=path.resolve(fileURLToPath(new URL('../dist/',import.meta.url)));
  server=createServer(async(req,res)=>{try{
    let file=path.resolve(root,'.'+decodeURIComponent(new URL(req.url,'http://local').pathname));
    if(file!==root&&!file.startsWith(root+path.sep)){res.writeHead(403).end();return;}
    if((await fs.stat(file)).isDirectory())file=path.join(file,'index.html');
    res.setHeader('Content-Type',({'.html':'text/html; charset=utf-8','.js':'text/javascript','.css':'text/css','.json':'application/json'})[path.extname(file)]||'application/octet-stream');
    res.end(await fs.readFile(file));
  }catch{res.writeHead(404).end();}});
  await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));base=`http://127.0.0.1:${server.address().port}`;
}
const browser=await chromium.launch({headless:true}),observations=[];
const key='bible-reader-memory-passages-v1',saved=[{bookIndex:42,chapter:3,verse:16},{bookIndex:42,chapter:3,verse:17}];
let debugPage;
async function fit(page){
  assert(await page.locator('#memoryQuizDialog').evaluate(d=>d.scrollWidth<=d.clientWidth+1));
  const box=await page.locator('#memoryQuizDialog').boundingBox(),size=page.viewportSize();
  assert(box.x>=-1&&box.y>=-1&&box.x+box.width<=size.width+1&&box.y+box.height<=size.height+1);
}
async function expectedAnswers(page){
  return page.locator('#memoryQuizDialog textarea').evaluateAll(inputs=>inputs.map(input=>currentBookData.chapters.find(ch=>Number(ch.chapter)===Number(input.dataset.chapter)).verses.find(v=>Number(v.verse)===Number(input.dataset.verse)).text));
}
try{
  for(const [width,height,language] of [[320,740,'ko'],[390,844,'en'],[844,390,'ar'],[1280,800,'ko']]){
    const context=await browser.newContext({viewport:{width,height},hasTouch:true});
    await context.route(/googlesyndication|doubleclick|adtrafficquality/,route=>route.abort());
    const page=await context.newPage(),errors=[];debugPage=page;page.on('pageerror',error=>errors.push(String(error)));
    await page.goto(base+(language==='ko'?'/':`/${language}/`)+'?qa=memory-practice',{waitUntil:'domcontentloaded'});
    await page.locator('#verses .verse').first().waitFor({timeout:40000});
    await page.waitForFunction(()=>document.querySelector('#status')?.hidden&&window.BibleMemory&&document.querySelector('.memory-practice-menu-button'));
    await page.evaluate(({key,saved})=>localStorage.setItem(key,JSON.stringify(saved)),{key,saved});
    const l=await page.evaluate(code=>BibleMemory.labels(code),language);
    await page.locator('#toolbarMoreToggle').click();
    const menuBox=await page.locator('#toolbarMoreMenu').boundingBox();
    assert(menuBox.y>=0&&menuBox.y+menuBox.height<=height,'More menu stays inside the visible viewport');
    assert.equal(await page.locator('.memory-practice-menu-button').textContent(),l.practiceTitle);
    await page.locator('.memory-practice-menu-button').click();
    const dialog=page.locator('#memoryQuizDialog'),start=dialog.locator('.memory-primary');
    assert.equal(await page.locator('#memoryQuizTitle').textContent(),l.practiceTitle);
    assert(await page.locator('#memoryModePractice').isChecked());assert.equal(await start.textContent(),l.practiceStart);
    await page.waitForFunction(()=>!document.querySelector('.memory-primary').disabled);
    assert(await page.locator('.memory-collection-clear').isHidden(),'Deletion stays inside collapsed collection management');

    // An accidental click, followed by Enter, must cancel rather than erase.
    const stored=await page.evaluate(key=>localStorage.getItem(key),key);
    await page.locator('.memory-collection-management summary').click();await page.locator('.memory-collection-clear').click();
    assert.equal(await page.evaluate(key=>localStorage.getItem(key),key),stored);
    assert.equal(await page.locator('.memory-collection-confirm p').textContent(),l.confirmCollectionDelete.replace('{count}',2));
    assert(await page.locator('.memory-collection-cancel').evaluate(node=>node===document.activeElement));
    await page.keyboard.press('Enter');assert(await page.locator('.memory-collection-confirm').isHidden());
    assert.equal(await page.evaluate(key=>localStorage.getItem(key),key),stored);
    await page.locator('.memory-collection-clear').click();
    await page.screenshot({path:path.join(output,`delete-confirm-${width}.png`)});
    await page.locator('.memory-collection-confirm-delete').click();
    assert.deepEqual(await page.evaluate(key=>JSON.parse(localStorage.getItem(key)),key),[]);
    // Undo must retain newly added references as well as restoring the deleted ones.
    await chooseMemory(page,'memoryFromVerse',1);await chooseMemory(page,'memoryToVerse',1);
    await page.locator('.memory-collection-add').click();await page.locator('.memory-collection-restore').click();
    await page.waitForFunction(()=>!document.querySelector('.memory-primary').disabled);
    assert.deepEqual(await page.evaluate(key=>JSON.parse(localStorage.getItem(key)),key),[...saved,{bookIndex:42,chapter:3,verse:1}]);
    assert(await page.locator('#memoryUseCollection').isChecked());
    assert(await page.locator('.memory-collection-clear').isHidden());
    await page.locator('#memoryViewChapter').check();
    await start.scrollIntoViewIfNeeded();await page.screenshot({path:path.join(output,`practice-setup-${width}.png`)});await start.click();
    const inputs=dialog.locator('textarea'),sources=dialog.locator('.memory-practice-text'),cards=dialog.locator('.memory-practice-row');
    assert.equal(await inputs.count(),3);assert.equal(await sources.count(),3);
    const expected=await expectedAnswers(page);assert.deepEqual(await sources.allTextContents(),expected);
    assert.equal(await dialog.locator('.memory-practice-row[open]').count(),1);
    assert.equal(await dialog.locator('textarea:visible').count(),1,'Chapter practice focuses one verse at a time');
    assert(await sources.first().isVisible());
    await page.screenshot({path:path.join(output,`practice-focused-${width}.png`)});
    await inputs.first().fill('practice draft');
    await cards.nth(2).locator('summary').click();await inputs.nth(2).fill('other draft');
    await cards.first().locator('summary').click();
    assert.equal(await inputs.first().inputValue(),'practice draft','Changing the focused verse preserves drafts');
    assert.equal(await dialog.locator('.memory-practice-row[open]').count(),1);
    await page.locator('.memory-practice-reveal').click();
    assert.equal(await page.locator('.memory-practice-reveal').textContent(),l.showPracticeText);
    for(const source of await sources.all())assert(await source.isHidden());
    assert.equal(await inputs.first().inputValue(),'practice draft','Hiding the source must preserve input');
    if(width<500){
      await inputs.first().focus();await page.setViewportSize({width,height:260});await page.waitForTimeout(150);await fit(page);
      assert.equal(await inputs.first().inputValue(),'practice draft');
      const primaryBox=await dialog.locator('.memory-primary').boundingBox();assert(primaryBox.height>=44);
      await page.screenshot({path:path.join(output,`practice-keyboard-${width}.png`)});
      await page.setViewportSize({width,height});await page.waitForTimeout(150);
    }
    await page.locator('.memory-practice-reveal').click();assert(await sources.first().isVisible());
    await page.locator('.memory-practice-repeat').click();
    assert.equal(await inputs.first().inputValue(),'');assert.equal(await inputs.nth(2).inputValue(),'other draft','Repeat clears only the focused verse');
    assert(await sources.first().isVisible());
    await inputs.first().fill('wrong');await dialog.locator('.memory-primary').click();
    assert.equal(await dialog.locator('.memory-feedback').getAttribute('data-correct'),'false');
    assert.equal(await dialog.locator('.memory-practice-text:visible').count(),0,'Comparison replaces the source instead of adding a third passage copy');
    assert.equal(await dialog.locator('.memory-diff:visible').count(),1);
    await page.screenshot({path:path.join(output,`practice-correction-${width}.png`)});
    await page.locator('.memory-practice-reveal').click();
    assert.equal(await dialog.locator('.memory-result').count(),0,'Hiding the passage also removes answer-revealing feedback');
    assert.equal(await inputs.first().inputValue(),'wrong');
    await page.locator('.memory-practice-reveal').click();
    for(let i=0;i<3;i++){
      assert(await cards.nth(i).evaluate(card=>card.open));
      await inputs.nth(i).fill(expected[i]);await dialog.locator('.memory-primary').click();
      assert.equal(await dialog.locator('.memory-feedback').getAttribute('data-correct'),'true');
      assert.equal(await dialog.locator('.memory-result:visible').count(),0,'Correct answers use a compact confirmation');
      assert.equal(await dialog.locator('.memory-practice-text:visible').count(),1);
      assert.equal(await dialog.locator('textarea:visible').count(),1);
      if(i<2){assert.equal(await dialog.locator('.memory-primary').getAttribute('data-action'),'practice-next');await dialog.locator('.memory-primary').click();}
    }
    assert.equal(await cards.first().locator('.memory-practice-state').textContent(),l.correct);
    await fit(page);await page.screenshot({path:path.join(output,`practice-writing-${width}.png`)});
    await dialog.locator('.memory-primary').click();
    assert.equal(await dialog.locator('h3').textContent(),l.practiceResult);
    assert.equal(await dialog.locator('.memory-score').textContent(),'100%','Practice results use the latest answers after correction');
    assert((await dialog.innerText()).includes(l.practiceResultNote));
    assert.equal(await dialog.locator('.memory-practice-review').count(),3);
    assert.equal(await dialog.locator('.memory-diff:visible').count(),0,'Result details start folded when every verse is correct');
    await dialog.locator('.memory-practice-review summary').first().click();assert.equal(await dialog.locator('.memory-diff:visible').count(),1);
    await dialog.getByRole('button',{name:l.change,exact:true}).click();await page.locator('#memoryModeExam').check();
    assert.equal(await page.locator('#memoryQuizTitle').textContent(),l.title);assert.equal(await start.textContent(),l.examStart);
    await start.click();assert.equal(await dialog.locator('.memory-practice-text,.memory-practice-controls').count(),0,'Exam never reveals practice source text');
    await closeMemory(page);
    await page.reload({waitUntil:'domcontentloaded'});await page.locator('#verses .verse').first().waitFor({timeout:40000});await page.waitForFunction(()=>document.querySelector('#status')?.hidden);
    assert.deepEqual(await page.evaluate(key=>JSON.parse(localStorage.getItem(key)),key),[...saved,{bookIndex:42,chapter:3,verse:1}],'Restored references survive reload');
    assert.deepEqual(await page.evaluate(()=>({book:state.bookIndex,chapter:state.chapter})),{book:42,chapter:3});
    if(width===1280&&language==='ko'){
      await page.locator('#toolbarMoreToggle').click();await page.locator('.memory-practice-menu-button').click();await page.locator('.memory-primary').click();
      assert.equal(await dialog.locator('.memory-practice-row').count(),1);assert(await dialog.locator('.memory-practice-row>summary').isHidden());
      const input=dialog.locator('textarea'),answer=(await expectedAnswers(page))[0];
      const layout=await dialog.evaluate(node=>{
        const source=node.querySelector('.memory-practice-text'),input=node.querySelector('textarea'),primary=node.querySelector('.memory-primary');
        const inputBox=input.getBoundingClientRect(),primaryBox=primary.getBoundingClientRect();
        const textTop=element=>{const style=getComputedStyle(element);return element.getBoundingClientRect().top+parseFloat(style.borderTopWidth)+parseFloat(style.paddingTop);};
        const panelStyle=element=>{const style=getComputedStyle(element);return [style.borderTopLeftRadius,style.borderTop,style.backgroundColor];};
        return {top:node.getBoundingClientRect().top,gap:primaryBox.top-inputBox.bottom,aligned:Math.abs(textTop(source)-textTop(input)),buttonOffset:Math.abs(primaryBox.left-inputBox.left),sourceStyle:panelStyle(source),inputStyle:panelStyle(input),panelHeightDifference:Math.abs(source.getBoundingClientRect().height-inputBox.height)};
      });
      assert(layout.gap>=0&&layout.gap<48,'Answer check stays close below the single-verse input');
      assert(layout.aligned<=1&&layout.buttonOffset<=6,'Passage, input and answer check align');
      assert.deepEqual(layout.sourceStyle,layout.inputStyle,'Passage and answer use the same rounded panel styling');
      assert(layout.panelHeightDifference<=1,'A short passage and its input have matching panel heights');
      await input.fill(Array(8).fill('입력 줄 늘리기').join('\n'));
      assert(Math.abs((await dialog.boundingBox()).y-layout.top)<=1,'Wrapping the draft keeps the dialog anchored');
      await fit(page);
      await input.fill('wrong');await input.press('Enter');assert.equal(await dialog.locator('.memory-practice-text:visible').count(),0);assert.equal(await dialog.locator('.memory-diff:visible').count(),1);
      await input.fill(answer);await input.press('Enter');assert.equal(await dialog.locator('.memory-diff:visible').count(),0);assert.equal(await dialog.locator('.memory-practice-text:visible').count(),1);
      await input.press('Enter');assert.equal(await input.getAttribute('data-verse'),'17');
      await dialog.locator('.memory-previous').click();assert.equal(await input.getAttribute('data-verse'),'16');assert.equal(await input.inputValue(),answer);
      assert.equal(await dialog.locator('.memory-primary').getAttribute('data-action'),'next','Confirmed practice work survives unit navigation');
      await page.screenshot({path:path.join(output,'practice-single-1280.png')});await closeMemory(page);
    }
    assert.deepEqual(errors,[]);
    observations.push({width,height,language,delete_cancel_and_undo:true,undo_preserves_new_additions:true,practice_source_hide_repeat:true,drafts_preserved:true,practice_latest_results:true,focused_verse_only:true,comparison_reuses_source_panel:true,compact_results:true,exam_source_absent:true,restored_refs_persist:true,reader_position_preserved:true,physical_device_tested:false});
    await context.close();
  }
  // A long chapter must keep its controls beside the active verse and never size hidden fields at zero width.
  {
    const context=await browser.newContext({viewport:{width:390,height:844},hasTouch:true});await context.route(/googlesyndication|doubleclick|adtrafficquality/,route=>route.abort());
    const page=await context.newPage(),errors=[];debugPage=page;page.on('pageerror',error=>errors.push(String(error)));
    await page.goto(base+'/?qa=practice-long-chapter',{waitUntil:'domcontentloaded'});await page.locator('#verses .verse').first().waitFor({timeout:40000});await page.waitForFunction(()=>document.querySelector('.memory-practice-menu-button'));
    await page.locator('#toolbarMoreToggle').click();await page.locator('.memory-practice-menu-button').click();
    await chooseMemory(page,'memoryBook',18);await chooseMemory(page,'memoryFromChapter',119);await chooseMemory(page,'memoryToChapter',119);
    await chooseMemory(page,'memoryFromVerse',1);await chooseMemory(page,'memoryToVerse',176);await page.locator('#memoryViewChapter').check();await page.locator('#memoryQuizDialog .memory-primary').click();
    const dialog=page.locator('#memoryQuizDialog'),cards=dialog.locator('.memory-practice-row'),inputs=dialog.locator('textarea');assert.equal(await cards.count(),176);
    await inputs.first().fill('first draft');await cards.last().locator('summary').click();
    assert.equal(await dialog.locator('.memory-practice-row[open]').count(),1);assert.equal(await dialog.locator('textarea:visible').count(),1);
    assert(await dialog.locator('.memory-practice-controls').evaluate(node=>node.closest('details').open&&node.closest('details').querySelector('textarea').dataset.verse==='176'));
    const answer=await cards.last().locator('.memory-practice-text').textContent();await inputs.last().fill(answer);assert((await inputs.last().boundingBox()).height<500);
    await dialog.locator('.memory-practice-reveal').click();assert.equal(await inputs.last().inputValue(),answer);await dialog.locator('.memory-practice-repeat').click();
    assert.equal(await inputs.last().inputValue(),'');assert.equal(await inputs.first().inputValue(),'first draft');
    await dialog.locator('.memory-practice-reveal').click();await inputs.last().fill(answer);await dialog.locator('.memory-primary').click();
    assert.equal(await dialog.locator('.memory-primary').getAttribute('data-action'),'practice-next');await fit(page);
    await page.screenshot({path:path.join(output,'practice-psalm119-390.png')});await dialog.locator('.memory-primary').click();
    assert(await cards.first().evaluate(card=>card.open));assert.equal(await inputs.first().inputValue(),'first draft');assert.deepEqual(errors,[]);
    observations.push({width:390,chapter:'Psalm 119',verses:176,focused_verse_only:true,controls_follow_active_verse:true,repeat_preserves_other_drafts:true,hidden_input_sizing_safe:true,physical_device_tested:false});await context.close();
  }
  await fs.writeFile(path.join(output,'result.json'),JSON.stringify({base,observations,physical_device_tested:false},null,2));
  console.log(`Memory practice QA PASS: ${observations.length} viewport/language flows, focused verse cards, one source/comparison panel, per-verse checks, drafts, long chapters and exam isolation.`);
}catch(error){
  if(debugPage&&!debugPage.isClosed()){
    await debugPage.screenshot({path:path.join(output,'failure.png')}).catch(()=>{});
    await fs.writeFile(path.join(output,'failure.txt'),String(error)+'\n'+await debugPage.locator('body').innerText().catch(()=>''));
  }
  throw error;
}finally{await browser.close();if(server)await new Promise(resolve=>server.close(resolve));}
