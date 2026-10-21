import fs from 'node:fs';
import assert from 'node:assert/strict';

const source=fs.readFileSync('app.js','utf8');
function section(start,end){
 const first=source.indexOf(start),last=source.indexOf(end,first+start.length);
 assert(first>=0&&last>first,`Missing reader runtime section: ${start}`);
 return source.slice(first,last);
}
const search=section('async function searchBible(q){','async function goToSearchResult(');
const cancel=section('function cancelSearch(){','function setupControls(){');
const books=Array.from({length:12},(_,index)=>({index,ko:'Book'+index}));
const updates=[],holds=[],requests=[];
const controls={panel:{hidden:true},results:{innerHTML:''},summary:{textContent:''},button:{disabled:false},input:{disabled:false,focus(){}}};
const make=new Function('books','updates','holds','requests','controls',`
 const BOOKS=books,SEARCH_LIMIT=100,SEARCH_BATCH_SIZE=6;
 const searchPanel=controls.panel,searchResults=controls.results,searchSummary=controls.summary;
 const searchButton=controls.button,searchInput=controls.input;
 const TRANSLATIONS={krv1961:{name:'KRV'}};
 let searchRun=0,activeTranslationId='krv1961';
 const renderSearchResults=(results,q,failed,options={})=>updates.push({
  indices:results.map(x=>x.book.index),processed:options.processed??null
 });
 const fetchBook=(book,translationId)=>{
  requests.push(book.index);
  if(book.index>=6)return new Promise(resolve=>holds.push(()=>resolve({
   chapters:[{chapter:1,verses:[{verse:1,text:'find-me'}]}]
  })));
  return Promise.resolve({chapters:[{chapter:1,verses:[{
   verse:1,text:book.index%2===0?'find-me':'other'
  }]}]});
 };
 ${cancel}
 ${search}
 return {searchBible,cancelSearch};
`);
const runtime=make(books,updates,holds,requests,controls);
const pending=runtime.searchBible('find-me');
for(let i=0;i<8;i++)await Promise.resolve();
assert.equal(updates.length,1,'First six books should display partial matches');
assert.equal(updates[0].processed,6);
assert.deepEqual(updates[0].indices,[0,2,4],'Partial results must preserve canonical book order');
assert.equal(holds.length,6,'Search must respect the six-book concurrency boundary');
runtime.cancelSearch();holds.forEach(release=>release());await pending;
assert.equal(updates.length,1,'Canceled request must not repaint stale matches');
assert.equal(controls.panel.hidden,true);
assert.equal(controls.button.disabled,false);
assert.equal(controls.input.disabled,false);
console.log('Search streaming regression PASS: partial ordered matches, fixed concurrency, cancellation recovery.');
