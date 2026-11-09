import fs from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';

const context={window:{}};
vm.runInNewContext(fs.readFileSync('memory-quiz.js','utf8'),context);
const {grade,normalize,labels}=context.window.BibleMemory;
assert.equal(grade('하나님이 세상을 이처럼 사랑하사','하나님이세상을\n이처럼 사랑하사.').score,100);
assert.equal(grade('Love, one another!','LOVE ONE ANOTHER').exact,true);
assert.equal(grade('가나다','가나다').exact,true,'NFC equivalent Korean must match');
assert.equal(grade('café','cafe').exact,false,'Meaningful accents must not disappear');
assert.equal(grade('abc','axc').parts.filter(p=>p.kind==='wrong').length,1);
assert.equal(grade('abc','ac').parts.filter(p=>p.kind==='missing').length,1);
assert.equal(grade('abc','abxc').parts.filter(p=>p.kind==='extra').length,1);
assert.equal(grade('abc','').score,0);
assert.equal(grade('abc','...').score,0);
assert.equal(grade('말씀'.repeat(6000),'말씀'.repeat(6000)).score,100,'Long exact passages must not allocate a quadratic diff matrix');
assert.equal(grade('a'.repeat(1000),'a'.repeat(999)+'b').score,99,'An error must never round to 100%');
for(const [expected,entered] of [['😀ab','😀b'],['성경을 읽습니다','성경은 읽는다'],['abc','xyzabc'],['a+1','a1']]){
  const result=grade(expected,entered);
  assert.equal(result.parts.map(p=>p.expected).join(''),normalize(expected));
  assert.equal(result.parts.map(p=>p.entered).join(''),normalize(entered));
  assert.equal(result.parts.filter(p=>p.kind!=='correct').length,result.distance);
}
const base=Object.keys(labels('en'));
for(const code of ['ko','en','fr','de','zh','ru','la','pt','ar'])for(const key of base){
  assert.equal(typeof labels(code)[key],'string',`${code}.${key} missing`);
  assert.ok(labels(code)[key].length,`${code}.${key} empty`);
}
for(const code of ['ko','en','fr','de','zh','ru','la','pt','ar'])assert.ok(labels(code).whole,'Whole-chapter label missing');
console.log('Memory quiz grading PASS: Korean IME normalization, punctuation/case, insertions/deletions, blank input, exact scores, Unicode and 9 UI languages.');
