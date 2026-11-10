import fs from 'node:fs';
import vm from 'node:vm';
import test from 'node:test';
import assert from 'node:assert/strict';
const source=fs.readFileSync(new URL('../experience.js',import.meta.url),'utf8');
test('saved setup controls have complete labels for all 17 supported languages',()=>{
 const {CONFIG_KEYS,CONFIG_TEXT}=vm.runInNewContext(source.slice(source.indexOf('const CONFIG_KEYS='),source.indexOf('function enhanceConfigSets('))+';({CONFIG_KEYS,CONFIG_TEXT})');
 const languages='ko en ja es zh fr de pt id hi pl it nl tr vi th ar'.split(' ');
 assert.deepEqual(Object.keys(CONFIG_TEXT).sort(),languages.sort());
 for(const lang of languages){assert.equal(CONFIG_TEXT[lang].length,CONFIG_KEYS.length,lang);assert(CONFIG_TEXT[lang].every(x=>typeof x==='string'&&x.trim()),lang);if(lang!=='ko')assert(CONFIG_TEXT[lang].every(x=>!/[가-힣]/.test(x)),lang+' Korean leakage');}
});
