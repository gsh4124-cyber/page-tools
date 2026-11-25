import test from 'node:test';
import assert from 'node:assert/strict';
import {writingDrafts,DRAFT_KEY,DRAFT_TTL} from '../drafts.mjs';
const input={title:'',content:'이어 쓰는 이야기',sticker:'',recordDate:'2026-11-25',category:'일상',decoration:'none',optimizePhotos:false,attachments:0};
const fixture=()=>{const data=new Map();return {data,getItem:k=>data.get(k)??null,setItem:(k,v)=>data.set(k,v),removeItem:k=>data.delete(k)};};
test('drafts recover only validated bounded text fields for the same account',()=>{
 const storage=fixture(),draft=writingDrafts({storage});draft.begin('A');draft.save({...input,password:'never-store',files:['secret.jpg'],jwt:'never-store'});
 const raw=storage.getItem(DRAFT_KEY);assert.ok(!/never-store|secret.jpg/.test(raw));assert.deepEqual(writingDrafts({storage}).begin('A'),input);
 assert.equal(writingDrafts({storage}).begin('B'),null);assert.equal(storage.getItem(DRAFT_KEY),null);
});
test('logout/switch purge drafts; another tab cannot silently overwrite or resurrect them',()=>{
 const storage=fixture(),a=writingDrafts({storage}),b=writingDrafts({storage}),states=[];
 a.begin('A');a.save(input);b.begin('A');b.save({...input,content:'다른 창'});a.save(input);assert.equal(JSON.parse(storage.getItem(DRAFT_KEY)).fields.content,'다른 창');
 b.purge();a.save(input);assert.equal(storage.getItem(DRAFT_KEY),null);
 const c=writingDrafts({storage,status:s=>states.push(s)});c.begin('A');c.save(input);c.begin('B');assert.equal(storage.getItem(DRAFT_KEY),null);assert.ok(states.includes('saved'));
});
test('expired malformed oversized and invalid date drafts are removed safely',()=>{
 const storage=fixture(),now=1000000000,draft=writingDrafts({storage,now:()=>now});draft.begin('A');draft.save(input);const original=JSON.parse(storage.getItem(DRAFT_KEY));
 for(const value of ['broken',JSON.stringify({...original,updated:now-DRAFT_TTL-1}),JSON.stringify({...original,fields:{...input,content:'a'.repeat(20001)}}),JSON.stringify({...original,fields:{...input,recordDate:'2026-02-30'}}),'x'.repeat(50001)]){storage.setItem(DRAFT_KEY,value);assert.equal(writingDrafts({storage,now:()=>now}).begin('A'),null);assert.equal(storage.getItem(DRAFT_KEY),null);}
});
test('storage failure never reports saved and a successful clear removes only its own revision',()=>{
 const states=[],storage=fixture(),draft=writingDrafts({storage,status:s=>states.push(s)});draft.begin('guest');storage.setItem=()=>{throw Error('quota');};draft.save(input);assert.equal(states.at(-1),'unavailable');assert.equal(storage.getItem(DRAFT_KEY),null);
 storage.setItem=(k,v)=>storage.data.set(k,v);draft.save(input);assert.equal(states.at(-1),'saved');draft.clear();assert.equal(storage.getItem(DRAFT_KEY),null);
 const broken=writingDrafts({storage:{getItem(){throw Error('denied');}},status:s=>states.push(s)});assert.equal(broken.begin('guest'),null);broken.save(input);assert.equal(states.at(-1),'unavailable');
});
