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
console.log('Experience regression PASS: 13 locale catalogs, 6+6 manual checks, explicit QA exclusion and deduplicated anonymous events.');
