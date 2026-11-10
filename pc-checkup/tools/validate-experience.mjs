import fs from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';
const source=fs.readFileSync('device-experience.js','utf8');
const catalog=vm.runInNewContext(source.slice(source.indexOf('const TEXT_KEYS='),source.indexOf('function redirectLegacy'))+';({TEXT_KEYS,TEXT,MANUAL_TEXT})',{document:{documentElement:{lang:'en'}}});
const languages=['ko','en','ja','es','de','fr','pt','it','nl','id','vi','zh-CN','ru'];
assert.deepEqual(Object.keys(catalog.TEXT).sort(),languages.sort());
for(const lang of languages){
  assert.equal(catalog.TEXT[lang].length,catalog.TEXT_KEYS.length,lang+' summary strings');
  assert(catalog.TEXT[lang].every(x=>typeof x==='string'&&x.trim()),lang+' nonempty strings');
  for(const kind of ['pc','mobile'])assert.equal(catalog.MANUAL_TEXT[lang][kind].length,6,lang+' manual items');
}
const tracking=source.slice(source.indexOf('function track('),source.indexOf('function copyText('));
for(const qa of [true,false]){
  const calls=[],stored=new Map();
  const sandbox={ENDPOINT:'https://example.test/events',isProd:()=>true,navigator:{webdriver:false},URLSearchParams,location:{search:qa?'?qa=1':''},sessionStorage:{getItem:k=>stored.get(k),setItem:(k,v)=>stored.set(k,v)},fetch:(url,options)=>{calls.push(JSON.parse(options.body));return Promise.resolve();}};
  vm.runInNewContext(tracking+`;track('pc_start');track('pc_complete');track('pc_complete');`,sandbox);
  assert.deepEqual(calls,qa?[]:[{event:'pc_start'},{event:'pc_complete'}]);
}
const pcTests=['keyboard','mouse','display','speaker','mic','webcam'],mobileTests=['touch','display','camera','mic','speaker','motion'];
const summaryCode=source.slice(source.indexOf('const count='),source.indexOf('function track('))+source.slice(source.indexOf('function statusGuidance('),source.indexOf('function buildCard('));
for(const language of languages)for(const kind of ['pc','mobile']){
  const tests=kind==='pc'?pcTests:mobileTests,state={[tests[0]]:'ok',[tests[1]]:'bad',[tests[2]]:'blocked'};
  const t=Object.fromEntries(catalog.TEXT_KEYS.map((key,i)=>[key,catalog.TEXT[language][i]]));
  const api=vm.runInNewContext(summaryCode+';({summaryText})',{PC_TESTS:pcTests,MOBILE_TESTS:mobileTests,t,manualLabels:catalog.MANUAL_TEXT[language],language,document:{querySelector:selector=>({querySelector:()=>({textContent:`1. label-${selector.match(/="([^\"]+)/)[1]}`})})}});
  const text=api.summaryText(kind,state,{0:true});
  tests.forEach((id,i)=>assert(text.includes(`label-${id}: ${i===0?t.ok:i===1?t.bad:t.unknown}`),`${language} ${kind} ${id} status`));
  assert.equal(text.split('\n').filter(line=>line.startsWith('label-')).length,6);
  assert(text.indexOf(`label-${tests[0]}`)<text.indexOf(`label-${tests[5]}`));
  assert.equal(state[tests[2]],'blocked','Unknown input must not be changed or promoted to OK');
}
console.log('Experience regression PASS: 13 locale catalogs, PC/mobile six-item shared reports, unknown handling, manual checks and anonymous QA-safe events.');
