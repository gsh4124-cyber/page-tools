import test from 'node:test';
import assert from 'node:assert/strict';
import {empty,parseTags,validateDocument,validateFile,validDate,encodeBackup,decodeBackup} from '../core.mjs';
const entry=()=>({id:'entry-one',title:'하루',content:'<img src=x onerror=alert(1)>',recordDate:'2026-11-19',created:'2026-11-19T09:00:00Z',category:'일상',decoration:'night',sticker:'🌷',stickerX:0,stickerY:0,visibility:'private',mediaKeys:['photo']});
test('calendar validates real dates including leap years',()=>{for(const s of ['2024-02-29','2026-12-31'])assert.ok(validDate(s));for(const s of ['2026-02-29','2026-04-31','2026-13-01','0000-01-01','2026-1-1'])assert.ok(!validDate(s));});
test('document rejects malformed data, duplicate IDs, unsafe media and other user references',()=>{
 const db={...empty(),entries:[entry()]};assert.equal(validateDocument(db).entries[0].content,db.entries[0].content);
 for(const change of [e=>e.mediaKeys=['https://evil.test/a'],e=>e.decoration='other',e=>e.stickerX=Infinity,e=>e.recordDate='2026-02-31',e=>e.title=' ',e=>e.mediaKeys=Array(7).fill('a')]){const d=structuredClone(db);change(d.entries[0]);assert.throws(()=>validateDocument(d));}
 assert.throws(()=>validateDocument({...db,entries:[entry(),entry()]}));
 assert.throws(()=>validateDocument(db,'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa'));
 assert.throws(()=>validateDocument({...db,checks:{'__bad':['a']}}));
 assert.throws(()=>validateFile(new File(['<svg>'],'x.svg',{type:'image/svg+xml'})));
});
test('encrypted full backup roundtrip includes media and detects wrong password, tampering, missing files and URL injection',async()=>{
 const db={habits:['산책'],checks:{'2026-11-19':['산책']},entries:[entry()]};const file=new File([new Uint8Array([137,80,78,71])],'photo.png',{type:'image/png'});
 const raw=await encodeBackup(db,async()=>file,'test-only-passphrase');assert.ok(!raw.includes('하루'));const restored=await decodeBackup(raw,'test-only-passphrase');assert.deepEqual(restored.db,validateDocument(db));assert.deepEqual(new Uint8Array(await restored.files.get('photo').arrayBuffer()),new Uint8Array(await file.arrayBuffer()));
 await assert.rejects(()=>decodeBackup(raw,'incorrect-password'));
 const tampered=JSON.parse(raw);tampered.data=tampered.data.slice(0,-8)+'AAAAAAAA';await assert.rejects(()=>decodeBackup(JSON.stringify(tampered),'test-only-passphrase'));
 await assert.rejects(()=>encodeBackup(db,async()=>null,'test-only-passphrase'));
 const legacy={format:'moa-full-backup-v4',db,files:{photo:{name:'x',type:'image/png',data:'https://evil.test/tracker'}}};await assert.rejects(()=>decodeBackup(JSON.stringify(legacy),''));
 legacy.files.photo.data='data:image/png;base64,iVBORw==';assert.equal((await decodeBackup(JSON.stringify(legacy),'')).files.size,1);
 legacy.files.photo.sha256='bad';await assert.rejects(()=>decodeBackup(JSON.stringify(legacy),''));
});

test('legacy entries and backups keep their shape; malformed tags and star values are rejected',async()=>{
 const legacy={...empty(),entries:[{...entry(),mediaKeys:[]}]};
 assert.deepEqual((await decodeBackup(JSON.stringify(legacy),'')).db,legacy);
 assert.deepEqual(parseTags(' #제주,가족 #JEJU jeju'),['제주','가족','JEJU']);
 for(const fields of [{favorite:'true'},{tags:'가족'},{tags:Array(11).fill('a')},{tags:['a'.repeat(25)]},{tags:[null]}]){
   assert.throws(()=>validateDocument({...legacy,entries:[{...legacy.entries[0],...fields}]}));
 }
});
