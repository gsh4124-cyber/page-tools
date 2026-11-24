import test from 'node:test';
import assert from 'node:assert/strict';
import {draftTitle} from '../core.mjs';

test('quick diary accepts a sentence or media without changing the document title contract',()=>{
 assert.equal(draftTitle('직접 쓴 제목','본문',[]),'직접 쓴 제목');
 assert.equal(draftTitle('  ','  산책하다 만난 고양이\n다음 줄',[]),'산책하다 만난 고양이');
 assert.equal(draftTitle('','',[{type:'image/jpeg'}]),'사진 기록');
 assert.equal(draftTitle('','',[{type:'video/mp4'}]),'영상 기록');
 assert.equal(draftTitle('','가'.repeat(120),[]).length,100);
 const emoji=draftTitle('','가'.repeat(99)+'🌷',[]);assert.equal(emoji,'가'.repeat(99));
 assert.throws(()=>draftTitle('  ','\n  ',[]),/사진이나 이야기/);
});
