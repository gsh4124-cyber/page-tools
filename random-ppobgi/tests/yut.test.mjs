import test from 'node:test';
import assert from 'node:assert/strict';
import {classifyYut,drawYut,yutStickSvg} from '../yut.js';
test('all 16 four-stick combinations use the visible flat sides for name and movement',()=>{
 for(let mask=0;mask<16;mask++){
  const faces=Array.from({length:4},(_,i)=>Boolean(mask&(1<<i))),flat=faces.filter(Boolean).length,result=classifyYut(faces);
  assert.equal(result.flat,flat);assert.equal(result.name,['모','도','개','걸','윷'][flat]);assert.equal(result.steps,flat||5);assert.equal(result.again,flat===0||flat===4);
 }
});
test('one throw samples exactly four faces and derives its result without drawing again',()=>{
 const input=[true,false,true,false];let calls=0;const result=drawYut(()=>input[calls++]);assert.equal(calls,4);assert.deepEqual(result.faces,input);assert.equal(result.name,'개');assert.equal(result.steps,2);
});
test('flat faces have one clear engraved X and rounded faces have none',()=>{
 assert.equal((yutStickSvg(true,'test').match(/class="yut-mark"/g)||[]).length,1);assert(!yutStickSvg(false,'test').includes('yut-mark'));assert(!yutStickSvg(true,'test').includes('text-shadow'));
});
test('invalid face sets cannot silently produce a result',()=>{
 for(const faces of [[],[true],Array(5).fill(true),[1,0,1,0],null])assert.throws(()=>classifyYut(faces),TypeError);
});
