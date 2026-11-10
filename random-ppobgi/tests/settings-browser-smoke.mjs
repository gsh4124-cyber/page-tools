import {chromium,webkit,firefox} from 'playwright';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
const base=process.env.SETTINGS_TEST_BASE||'https://random-ppobgi.pages.dev';
const output=process.env.SETTINGS_TEST_EVIDENCE||'qa_evidence/settings';await fs.mkdir(output,{recursive:true});
const engines={chromium,webkit,firefox},observations=[];
for(const engine of (process.env.SETTINGS_TEST_ENGINES||'chromium').split(',')){
 const browser=await engines[engine].launch({headless:true});
 try{for(const [language,width] of [['ko',320],['ko',1280],['en',390],['ar',390]]){
  console.log(`Settings QA ${engine} ${language} ${width}`);
  const context=await browser.newContext({viewport:{width,height:844},locale:language==='ko'?'ko-KR':language,hasTouch:width<600});
  try{
   const legacy=JSON.stringify([{name:'Old list',value:'Alice\nBob',at:1}]);
   await context.addInitScript(value=>localStorage.setItem('random-picker-saved-sets-v1',value),legacy);
   await context.route(/googlesyndication|doubleclick|adtrafficquality/,r=>r.abort());
   const page=await context.newPage(),errors=[];page.on('pageerror',e=>errors.push(String(e)));
   const route=language==='ko'?'/':`/${language}/`;
   async function ready(){await page.waitForFunction(()=>window.RandomPickerSettings&&document.querySelector('#pickBtn'));if(new URL(base).hostname==='127.0.0.1'&&await page.locator('#pickerConfigSets').count()===0)await page.addScriptTag({url:base+'/experience.js'});await page.locator('#pickerConfigSets').waitFor({state:'attached'});}
   await page.goto(base+route+'?qa=1',{waitUntil:'domcontentloaded'});await ready();
   const panel=page.locator('#pickerConfigSets');assert.equal(await panel.getAttribute('open'),null);await panel.locator('summary').click();assert(await page.locator('#loadPickerConfig').isDisabled());
   await page.locator('.method[data-method="lot"]').click();await page.locator('#nameTab').click();await page.locator('#names').fill('Alice\nBob\nCharlie\nDana');await page.locator('#pickCount').fill('2');await page.locator('#resultMode').selectOption('custom');await page.locator('#customResults').fill('Lunch\nCoffee');
   const expected=await page.evaluate(()=>window.RandomPickerSettings.capture()),title='<b>Lunch club</b>';
   page.once('dialog',d=>d.accept(title));await page.locator('#savePickerConfig').click();
   assert.equal(await page.locator('#pickerConfigSelect').inputValue(),title);assert.equal(await page.locator('#pickerConfigSelect b').count(),0,'Title must remain plain text');
   await page.locator('#numberTab').click();await page.locator('.method[data-method="wheel"]').click();await page.locator('#totalPeople').fill('9');await page.locator('#loadPickerConfig').click();
   assert.deepEqual(await page.evaluate(()=>window.RandomPickerSettings.capture()),expected,'Full named/custom setup restores across forced winner mode');
   assert.equal(await page.locator('.method[aria-checked="true"]').getAttribute('data-method'),expected.method,'Restored method matches its visible selection');
   assert.equal(await page.locator('#stage').evaluate(n=>n.classList.contains('show')),false,'Loading must not draw');
   await page.reload({waitUntil:'domcontentloaded'});await ready();await panel.locator('summary').click();await page.locator('#pickerConfigSelect').selectOption(title);await page.locator('#loadPickerConfig').click();assert.deepEqual(await page.evaluate(()=>window.RandomPickerSettings.capture()),expected,'Reload persistence');
   for(const method of ['ladder','wheel','lot','pinball','race','capsule','slot','bomb']){
    assert(await page.evaluate(data=>window.RandomPickerSettings.apply(data),{...expected,method,inputMode:'number',totalPeople:8,pickCount:2,bombTimerMode:'fixed',bombSeconds:90}));
    const actual=await page.evaluate(()=>window.RandomPickerSettings.capture());assert.equal(actual.method,method);assert.equal(actual.inputMode,'number');assert.equal(actual.totalPeople,8);assert.equal(actual.bombSeconds,90);assert.equal(await page.locator(`.method[data-method="${method}"]`).getAttribute('aria-checked'),'true');assert.equal(await page.locator('#resultMode').inputValue(),actual.resultMode);
   }
   const stable=await page.evaluate(()=>window.RandomPickerSettings.capture());
   page.once('dialog',d=>d.accept('Timed game'));await page.locator('#savePickerConfig').click();
   await page.evaluate(data=>window.RandomPickerSettings.apply(data),expected);await page.locator('#pickerConfigSelect').selectOption('Timed game');await page.locator('#loadPickerConfig').click();
   assert.deepEqual(await page.evaluate(()=>window.RandomPickerSettings.capture()),stable,'Number mode and fixed bomb time persist through the actual save/load controls');
   assert(await page.locator('#bombModeFixed').evaluate(n=>n.classList.contains('active')));assert.equal(await page.locator('#bombSeconds').inputValue(),'90');
   for(const invalid of [{...stable,version:99},{...stable,method:'__proto__'},{...stable,totalPeople:-5},{...stable,pickCount:NaN},{...stable,names:null},{...stable,bombSeconds:17}]){assert.equal(await page.evaluate(data=>window.RandomPickerSettings.apply(data),invalid),false);assert.deepEqual(await page.evaluate(()=>window.RandomPickerSettings.capture()),stable,'Malformed setup must not mutate current settings');}
   assert.equal(await page.evaluate(()=>localStorage.getItem('random-picker-saved-sets-v1')),legacy,'Legacy name lists preserved');
   // A rejected storage write must not announce a successful save or damage the previous setup.
   const stored=await page.evaluate(()=>localStorage.getItem('random-picker-config-sets-v1'));
   await page.evaluate(()=>{window.__originalSetItem=Storage.prototype.setItem;Storage.prototype.setItem=function(k,v){if(k==='random-picker-config-sets-v1')throw new DOMException('Quota','QuotaExceededError');return window.__originalSetItem.call(this,k,v);};});
   page.once('dialog',d=>d.accept('Cannot save'));await page.locator('#savePickerConfig').click();assert.equal(await page.evaluate(()=>localStorage.getItem('random-picker-config-sets-v1')),stored);assert.equal(await page.locator('#pickerConfigSelect option').filter({hasText:'Cannot save'}).count(),0);assert((await page.locator('#pickerConfigStatus').textContent()).length>10);
   await page.evaluate(()=>{Storage.prototype.setItem=window.__originalSetItem;});
   await page.locator('#pickerConfigSelect').selectOption(title);await page.locator('#loadPickerConfig').click();
   assert.deepEqual(await page.evaluate(()=>window.RandomPickerSettings.capture()),expected);
   assert.equal(await page.locator('.method[aria-checked="true"]').getAttribute('data-method'),expected.method);
   assert.equal(await page.locator('.method.active').getAttribute('data-method'),expected.method,'Visual highlight must also match the restored method');
   assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+2),'Mobile overflow');
   await panel.scrollIntoViewIfNeeded();await page.screenshot({path:path.join(output,`${engine}-${language}-${width}.png`),fullPage:false,scale:'css'});
   await page.locator('#deletePickerConfig').click();assert.equal(await page.evaluate(()=>JSON.parse(localStorage.getItem('random-picker-config-sets-v1')).length),1);await page.locator('#pickerConfigSelect').selectOption('Timed game');await page.locator('#deletePickerConfig').click();assert.equal(await page.evaluate(()=>JSON.parse(localStorage.getItem('random-picker-config-sets-v1')).length),0);assert.equal(await page.evaluate(()=>localStorage.getItem('random-picker-saved-sets-v1')),legacy);
   assert.deepEqual(errors,[]);observations.push({engine,language,width,pass:true,settings_roundtrip:true,eight_method_normalization:true,legacy_preserved:true,quota_error_handled:true});
  }finally{await context.close();}
 }}finally{await browser.close();}
}
await fs.writeFile(path.join(output,'result.json'),JSON.stringify({base,physical_device_tested:false,observations},null,2));console.log(`Saved setup browser QA PASS: ${observations.length} flows`);
