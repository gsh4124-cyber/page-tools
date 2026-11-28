import { newQaContext } from '../../.github/qa/browser.mjs';
import {chromium} from 'playwright';
import fs from 'node:fs/promises';
import path from 'node:path';
import {createServer} from 'node:http';
import {fileURLToPath} from 'node:url';
const local=process.argv.includes('--local'),output=process.env.READING_QA_OUTPUT||fileURLToPath(new URL('../qa_evidence/reader-detail/',import.meta.url));
if(!output)throw Error('READING_QA_OUTPUT required');await fs.mkdir(output,{recursive:true});
let base=process.env.READING_QA_BASE||'https://bible-reader-1iz.pages.dev',server;
if(local){const root=path.resolve(fileURLToPath(new URL('../dist/',import.meta.url)));server=createServer(async(req,res)=>{try{let file=path.resolve(root,'.'+new URL(req.url,'http://local').pathname);if(file!==root&&!file.startsWith(root+path.sep))throw Error('path');if((await fs.stat(file)).isDirectory())file=path.join(file,'index.html');res.setHeader('Content-Type',({'.html':'text/html','.js':'text/javascript','.css':'text/css','.json':'application/json'})[path.extname(file)]||'application/octet-stream');res.end(await fs.readFile(file));}catch{res.writeHead(404).end();}});await new Promise(r=>server.listen(0,'127.0.0.1',r));base=`http://127.0.0.1:${server.address().port}`;}
const browser=await chromium.launch({headless:true,...(process.env.MEMORY_QUIZ_CHANNEL?{channel:process.env.MEMORY_QUIZ_CHANNEL}:{})}),observations=[];
const profiles=[[320,568],[390,844],[844,390],[1280,900]];
try{for(const [width,height] of profiles)for(const language of ['ko','en']){
 if(process.env.READING_QA_ONE&&(width!==320||language!=='ko'))continue;
 const context=await newQaContext(browser, {viewport:{width,height},locale:language,reducedMotion:'reduce'});await context.route(/googlesyndication|doubleclick|adtrafficquality/,r=>r.abort());
 const page=await context.newPage(),errors=[];page.on('pageerror',e=>errors.push(String(e)));
 const check=(flow,pass,data={})=>observations.push({width,height,language,flow,pass,...data});
 try{
 await page.goto(base+(language==='en'?'/en/':'/')+'?qa=reader',{waitUntil:'domcontentloaded'});
 const ready=()=>page.waitForFunction(()=>document.querySelector('#status')?.hidden&&document.querySelector('#verses .verse'));
 await ready();await page.evaluate(()=>document.fonts.ready.then(()=>true));const chapter=await page.locator('#chapterSelect').inputValue();
 const title=page.locator('#chapterTitle');check('Unboxed chapter title and no horizontal overflow',await title.evaluate(n=>getComputedStyle(n).boxShadow==='none'&&parseFloat(getComputedStyle(n).borderTopWidth)===0)&&await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));
 await page.locator('#nextChapterTitle').click();await page.waitForFunction(ch=>document.querySelector('#chapterSelect').value!==ch,chapter);await ready();await page.locator('#prevChapterTitle').click();await page.waitForFunction(ch=>document.querySelector('#chapterSelect').value===ch,chapter);await ready();check('Next/previous chapter restores reading location',true);
 const one=page.locator('#verses .verse[data-verse="1"]'),two=page.locator('#verses .verse[data-verse="2"]');await one.click();await two.click();
 check('Adjacent selections join; middle deselection separates',await one.evaluate(n=>n.classList.contains('selection-join-next')));await two.click();check('Deselection updates count and outline',await page.locator('.verse.multi-selected').count()===1&&!(await one.evaluate(n=>n.classList.contains('selection-join-next'))));await two.click();
 await page.locator('.verse-multi-note').click();const sel=page.locator('.selection-note-editor');await sel.locator('textarea').fill('검수 메모\nSecond line <text>');await sel.locator('.selection-note-save').click();
 check('Selection note stores original verse set and literal multiline text',await page.evaluate(()=>Object.values(JSON.parse(localStorage.getItem('bible-reader-verse-marks-v1'))).some(m=>m.selectionNotes?.some(n=>n.verses.join(',')==='1,2'&&n.note==='검수 메모\nSecond line <text>'))));
 await page.locator('.verse-multi-highlight').click();check('Highlight applies to selected verses',await one.evaluate(n=>n.classList.contains('user-highlight'))&&await two.evaluate(n=>n.classList.contains('user-highlight')));
 await page.locator('.verse-multi-note').click();await sel.locator('.selection-note-cancel').focus();await page.keyboard.press('ArrowRight');await ready();check('Selection note buttons isolate chapter shortcuts',await page.locator('#chapterSelect').inputValue()===chapter);await sel.locator('.selection-note-cancel').click();
 await page.locator('.notebook-button').click();const panel=page.locator('.notebook-panel');await panel.waitFor();await page.waitForFunction(()=>document.querySelector('.highlight-record-item'));
 check('Notebook opens with keyboard focus inside',await panel.evaluate(n=>n.contains(document.activeElement)));
 await panel.locator('.highlight-record-item').first().locator('button').nth(1).click();const editor=page.locator('.record-note-editor'),input=editor.locator('textarea');await input.fill('기록 메모\nLiteral <note>');
 check('Record memo has named modal and input',await editor.getAttribute('role')==='dialog'&&!!(await editor.getAttribute('aria-labelledby'))&&!!(await input.getAttribute('aria-label')));
 const buttons=editor.locator('button');await buttons.last().focus();await page.keyboard.press('Tab');check('Record memo Tab stays in editor',await editor.evaluate(n=>n.contains(document.activeElement)));
 await buttons.first().focus();await page.keyboard.press('ArrowRight');await ready();check('Record memo buttons isolate chapter shortcuts',await page.locator('#chapterSelect').inputValue()===chapter);
 await page.screenshot({path:path.join(output,`record-${language}-${width}.png`)});
 await buttons.first().click();await page.waitForFunction(()=>!document.querySelector('.record-note-editor'));
 check('Save memo restores focus within rerendered notebook',await panel.evaluate(n=>n.contains(document.activeElement)));
 await panel.locator('.highlight-record-item').first().locator('button').nth(1).click();await editor.locator('textarea').fill('unsaved change');await page.keyboard.press('Escape');
 const closed=await editor.count()===0;check('Escape dismisses record edit without overwriting saved memo',closed&&await page.evaluate(()=>Object.values(JSON.parse(localStorage.getItem('bible-reader-record-notes-v1'))||{}).includes('기록 메모\nLiteral <note>')));if(!closed)await editor.locator('button').last().click();
 await panel.locator('.notebook-close').focus();await page.keyboard.press('Escape');const panelClosed=await panel.count()===0;check('Escape closes notebook before affecting selected verses',panelClosed&&await page.locator('.verse.multi-selected').count()===2);if(!panelClosed)await panel.locator('.notebook-close').click();
 await page.reload({waitUntil:'domcontentloaded'});await ready();check('Highlight and selection memo survive reload',await one.evaluate(n=>n.classList.contains('user-highlight'))&&await page.evaluate(()=>Object.values(JSON.parse(localStorage.getItem('bible-reader-verse-marks-v1'))).some(m=>m.selectionNotes?.some(n=>n.note==='검수 메모\nSecond line <text>'))));
 if(width>=1000){await page.locator('.notebook-button').click();await panel.waitFor();await page.waitForFunction(()=>document.querySelector('.notebook-panel')?.getAttribute('aria-modal')==='false');await title.focus();await page.keyboard.press('ArrowRight');await page.waitForFunction(ch=>document.querySelector('#chapterSelect').value!==ch,chapter);await ready();await title.focus();await page.keyboard.press('ArrowLeft');await page.waitForFunction(ch=>document.querySelector('#chapterSelect').value===ch,chapter);await ready();check('Desktop dock allows reading navigation outside the notebook',true);await page.locator('.notebook-button').click();check('Toolbar toggle removes notebook and its backdrop',await panel.count()===0&&await page.locator('.notebook-backdrop').count()===0);}
 check('No runtime errors',errors.length===0,{errors});
 }catch(error){check('Flow completed',false,{error:String(error)});console.error(String(error));}finally{await context.close();}await fs.writeFile(path.join(output,'partial.json'),JSON.stringify(observations,null,2));console.log(`${language} ${width}: checked; failures: ${observations.filter(o=>o.width===width&&o.language===language&&!o.pass).map(o=>o.flow).join(', ')}`);
}}finally{await browser.close();if(server)await new Promise(r=>server.close(r));}
const result={checked_at:new Date().toISOString(),base,local,observations,failed:observations.filter(x=>!x.pass).length,physical_device_tested:false,ads_blocked_for_qa:true};await fs.writeFile(path.join(output,'result.json'),JSON.stringify(result,null,2));console.log(`${observations.length-result.failed}/${observations.length} checks passed`);if(result.failed)process.exitCode=1;
