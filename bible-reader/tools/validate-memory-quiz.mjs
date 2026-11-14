import fs from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';

const context={window:{}};
vm.runInNewContext(fs.readFileSync('memory-quiz.js','utf8'),context);
const {grade,normalize,comparisonRuns,labels,passageRows,passageReference,subsetReference,createSession}=context.window.BibleMemory;
for(const [expected,entered] of [['예수께서 눈물을 흘리시더라','애수께서 물을 흘리시더라요'],['내가 보매','또 내가보매'],['Love, one another!','loveoneanother'],['كلمة','كلمه'],['café','cafe'],['İstanbul','istanbul'],['a😀 b','a b'],['말씀','']]){
  const runs=comparisonRuns(expected,entered);
  assert.equal(runs.filter(run=>!['wrong','extra'].includes(run.kind)).map(run=>run.text).join(''),expected.normalize('NFC'),'Merged feedback must preserve the exact canonical text');
}
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
const chapters=[{chapter:1,verses:[{verse:1,text:'first'},{verse:3,text:'third'}]},
  {chapter:2,verses:[{verse:1,text:'next first'},{verse:2,text:'next second'}]},
  {chapter:3,verses:[{verse:1,text:'last first'}]}];
const original=JSON.stringify(chapters);
const combined=passageRows(chapters,1,3,3,1);
assert.equal(combined.map(r=>`${r.chapter}:${r.verse}`).join(','),'1:3,2:1,2:2,3:1');
assert.equal(combined[1].text,'next first','Repeated verse numbers must keep the correct chapter text');
assert.equal(passageRows(chapters,1,1,2,1).filter(r=>r.verse===1).length,2);
assert.equal(passageRows(chapters,1,3,1,1).length,0,'Reversed verse endpoints invalid');
assert.equal(passageRows(chapters,3,1,2,1).length,0,'Reversed chapter endpoints invalid');
assert.equal(passageRows(chapters,NaN,1,2,1).length,0);
assert.equal(passageRows(chapters,2,2,2,2)[0].text,'next second');
assert.equal(passageReference('John',combined),'John 1:3–3:1');
assert.equal(subsetReference('John',combined),'John 1:3 · 2:1–2 · 3:1','Wrong-only scope must not imply intervening verses are included');
assert.equal(subsetReference('John',[{chapter:3,verse:1},{chapter:3,verse:3},{chapter:4,verse:1}]),'John 3:1, 3 · 4:1');
assert.equal(subsetReference('John',[]),'');
assert.equal(passageReference('John',[{chapter:3,verse:1},{chapter:3,verse:2},{chapter:3,verse:4}]),'John 3:1–2, 4');
assert.equal(JSON.stringify(chapters),original,'Selecting a passage must not mutate reading data');
const session=createSession(combined);
assert.equal(session.move(-1),false,'Manual previous stops at the first unit');
assert.equal(session.move(1),true,'Manual next may move before checking');
assert.equal(session.move(-1),true,'Manual previous returns to an earlier unit');
assert.equal(session.move(100),false,'Manual next stops at the last unit');
assert.equal(session.move(0.5),false,'Manual movement requires a whole unit');
assert.equal(session.unitCount,4);
assert.equal(session.advance(),false,'Cannot skip an unchecked verse');
assert.equal(session.check([' ']).empty,true);assert.equal(session.advance(),false);
assert.equal(session.check(['wrong']).correct,false);assert.equal(session.advance(),false);
assert.equal(session.check(['third']).correct,true);assert.equal(session.index,0,'Checking must not also advance');
session.invalidate();assert.equal(session.advance(),false,'Editing a correct answer must require another check');
session.check(['third']);assert.equal(session.advance(),true);assert.equal(session.current[0].row.chapter,2);
assert.equal(session.firstAnswers[0],'wrong','Correcting an answer must preserve the first-check score');
for(const answer of ['next first','next second','last first']){assert(session.check([answer]).correct);assert(session.advance());}
assert.equal(session.done,true);assert.equal(session.advance(),false);assert.equal(session.current.length,0,'End must not wrap');
const chapterSession=createSession(combined,'chapter');
assert.equal(chapterSession.unitCount,3);chapterSession.check(['third']);chapterSession.advance();
assert.equal(chapterSession.current.map(item=>item.row.verse).join(','),'1,2');
assert.equal(chapterSession.check(['next first','']).correct,false);assert.equal(chapterSession.advance(),false);
assert.equal(chapterSession.check(['next first','next second']).correct,true);
assert.equal(chapterSession.check(['','']).empty,true);assert.equal(chapterSession.advance(),false,'Empty check clears stale correctness');
console.log('Memory quiz PASS: grading, Unicode/9 languages, chapter ranges, separate check/advance, wrong-answer blocking, edit invalidation, first checks and final stop.');
