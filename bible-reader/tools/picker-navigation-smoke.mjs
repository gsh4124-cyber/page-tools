import {chromium} from 'playwright';
import {createServer} from 'node:http';
import fs from 'node:fs/promises';
import path from 'node:path';
import assert from 'node:assert/strict';
import {fileURLToPath} from 'node:url';
import {chooseMemory} from './picker-test-helpers.mjs';

const root=path.resolve(fileURLToPath(new URL('../dist/',import.meta.url)));
const output=fileURLToPath(new URL('../qa_evidence/pickers/',import.meta.url));
await fs.mkdir(output,{recursive:true});
const mime={'.html':'text/html; charset=utf-8','.js':'text/javascript','.css':'text/css','.json':'application/json'};
const server=createServer(async(req,res)=>{try{
  let file=path.resolve(root,'.'+decodeURIComponent(new URL(req.url,'http://local').pathname));
  if(file!==root&&!file.startsWith(root+path.sep)){res.writeHead(403).end();return;}
  if((await fs.stat(file)).isDirectory())file=path.join(file,'index.html');
  res.writeHead(200,{'Content-Type':mime[path.extname(file)]||'application/octet-stream'}).end(await fs.readFile(file));
}catch{res.writeHead(404).end();}});
await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
const base=`http://127.0.0.1:${server.address().port}`;
const browser=await chromium.launch({headless:true});
const observations=[];let debugPage;
try{
  for(const width of [320,390,1280]){
    const context=await browser.newContext({viewport:{width,height:width===1280?800:844},hasTouch:true,locale:'ko-KR'});
    await context.route(/googlesyndication|doubleclick|adtrafficquality/,route=>route.abort());
    const page=await context.newPage(),errors=[];debugPage=page;page.on('pageerror',error=>errors.push(String(error)));
    await page.goto(base+'/?qa=picker',{waitUntil:'domcontentloaded'});
    await page.waitForFunction(()=>document.querySelector('#status')?.hidden&&window.BibleTitleNavigator&&window.BibleMemory);
    await page.waitForTimeout(2300); // Initial one-off localization timers must have settled.
    const mutations=await page.evaluate(async()=>{
      let count=0;const observer=new MutationObserver(records=>count+=records.length);
      observer.observe(document.body,{subtree:true,childList:true,characterData:true});
      window.BibleI18n.apply();window.BibleI18n.apply();
      await new Promise(resolve=>setTimeout(resolve,650));observer.disconnect();return count;
    });
    assert(mutations<5,`Idle translation must settle instead of continually rewriting the page: ${mutations}`);

    let releaseGenesis,seenGenesis;
    const genesisRequested=new Promise(resolve=>seenGenesis=resolve);
    await page.route('**/scripture/krv1961/Genesis.json',async route=>{
      seenGenesis();await new Promise(resolve=>releaseGenesis=resolve);await route.continue();
    });
    await page.locator('#chapterTitle').click();
    await page.locator('#titleNavigatorDialog [data-switch="old"]').click();
    await page.locator('.title-navigator-books').getByRole('button',{name:'창세기',exact:true}).click();
    await genesisRequested;
    assert.equal(await page.locator('.title-navigator-chapters button').count(),50,'Cold book chapters appear before any passage bytes arrive');
    await page.screenshot({path:path.join(output,`reader-chapters-${width}.png`)});
    await page.locator('.title-navigator-chapters').getByRole('button',{name:'2',exact:true}).click();
    assert.equal(await page.locator('.title-navigator-verses button').count(),25,'Genesis 2 verse grid is immediate and never uses Genesis 1 counts');
    await page.locator('.title-navigator-verses').getByRole('button',{name:'3',exact:true}).click();
    assert(await page.locator('.title-navigator-overlay').isHidden());
    releaseGenesis();
    await page.waitForFunction(()=>document.querySelector('#bookSelect').value==='0'&&document.querySelector('#chapterSelect').value==='2'&&document.querySelector('#verseSelect').value==='3'&&document.querySelector('#status').hidden);

    // Looking at another book and cancelling must not move the reader.
    await page.locator('#chapterTitle').click();
    await page.locator('.title-navigator-books').getByRole('button',{name:'출애굽기',exact:true}).click();
    await page.locator('.title-navigator-dismiss').click();
    assert.deepEqual(await page.evaluate(()=>({book:state.bookIndex,chapter:state.chapter})),{book:0,chapter:2});

    let releasePsalms,seenPsalms;
    const psalmsRequested=new Promise(resolve=>seenPsalms=resolve);
    await page.route('**/scripture/krv1961/Psalms.json',async route=>{
      seenPsalms();await new Promise(resolve=>releasePsalms=resolve);await route.continue();
    });
    await page.locator('#toolbarMoreToggle').click();await page.locator('.memory-menu-button').click();
    const exam=page.locator('#memoryQuizDialog');await exam.waitFor({state:'visible'});
    assert(await page.locator('#memoryBook').isHidden(),'Native Android book dropdown is replaced');
    await page.locator('[data-memory-select="memoryBook"]').click();
    const choice=page.locator('#memoryChoiceDialog');await choice.waitFor({state:'visible'});
    assert.equal(await choice.locator('.title-navigator-books button').count(),39);
    await choice.locator('[data-switch="new"]').click();
    assert.equal(await choice.locator('.title-navigator-books button').count(),27);
    await choice.locator('[data-switch="old"]').click();
    await page.screenshot({path:path.join(output,`memory-books-${width}.png`)});
    await page.keyboard.press('Escape');await choice.waitFor({state:'detached'});
    assert(await exam.isVisible(),'Escape dismisses the chooser, not the exam');
    assert.equal(await page.locator('#memoryBook').inputValue(),'0');
    await chooseMemory(page,'memoryBook',18);await psalmsRequested;
    assert.equal(await page.locator('#memoryFromChapter option').count(),150);
    assert(!(await page.locator('[data-memory-select="memoryFromChapter"]').isDisabled()),'Numbers are selectable while passage text is pending');
    await chooseMemory(page,'memoryFromChapter',119);await chooseMemory(page,'memoryToChapter',119);
    await chooseMemory(page,'memoryFromVerse',176);await chooseMemory(page,'memoryToVerse',176);
    assert(await exam.locator('.memory-primary').isDisabled(),'No exam may start using missing or stale text');
    releasePsalms();
    await page.waitForFunction(()=>!document.querySelector('#memoryQuizDialog .memory-primary').disabled);
    for(const [id,value] of [['memoryFromChapter','119'],['memoryToChapter','119'],['memoryFromVerse','176'],['memoryToVerse','176']]){
      assert.equal(await page.locator('#'+id).inputValue(),value,'Completing a book fetch preserves the chosen range');
    }
    assert.match(await exam.locator('.memory-reference').first().textContent(),/119:176/);
    await page.screenshot({path:path.join(output,`memory-range-${width}.png`)});
    assert(await exam.evaluate(node=>node.scrollWidth<=node.clientWidth+1));
    await exam.locator('.memory-primary').click();
    const answer=exam.locator('textarea');assert.equal(await answer.getAttribute('data-chapter'),'119');assert.equal(await answer.getAttribute('data-verse'),'176');
    assert.deepEqual(await page.evaluate(()=>({book:state.bookIndex,chapter:state.chapter})),{book:0,chapter:2},'Exam choices remain independent from reading');
    await exam.locator('.memory-close').click();
    assert.deepEqual(errors,[]);
    observations.push({width,idle_body_mutations:mutations,cold_reader_grids_before_response:true,exact_verse_counts:true,cancel_preserves_reading:true,shared_exam_grid:true,nested_escape_preserves_exam:true,cold_exam_range_before_response:true,range_preserved_after_response:true,exam_reader_isolation:true,physical_device_tested:false});
    await context.close();
  }
  await fs.writeFile(path.join(output,'result.json'),JSON.stringify({observations},null,2));
  console.log('Picker QA PASS: immediate cold-book grids, preserved ranges, shared styling, focus/cancellation and settled localization.');
}catch(error){
  if(debugPage&&!debugPage.isClosed()){
    await debugPage.screenshot({path:path.join(output,'failure.png')}).catch(()=>{});
    await fs.writeFile(path.join(output,'failure.txt'),String(error)+'\n'+await debugPage.locator('body').innerText().catch(()=>''));
  }
  throw error;
}finally{await browser.close();await new Promise(resolve=>server.close(resolve));}
