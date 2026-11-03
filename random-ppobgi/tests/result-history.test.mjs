import fs from 'node:fs';
import vm from 'node:vm';
import test from 'node:test';
import assert from 'node:assert/strict';
const source=fs.readFileSync(new URL('../experience.js',import.meta.url),'utf8');
function runtime(){
 let saved=[];
 const container={innerHTML:'',append(){}};
 const code=source.slice(source.indexOf('function historyText('),source.indexOf('function enhanceNameSets('));
 const api=vm.runInNewContext(code+';({historyText,saveResultIfNew})',{
  lang:()=> 'en',window:{RandomPickerLocales:{en:{methods:{ladder:'Ladder'},winner:'Winner',dynamic:{lose:'No win'}}}},
  document:{createElement:()=>({setAttribute(){}})},read:()=>saved,write:(_,items)=>{saved=items;},RESULTS_KEY:'history',MAX_RESULTS:12
 });
 return {...api,container,saved:()=>saved};
}
const result={method:'ladder',inputMode:'number',resultMode:'rank',showAll:true,results:[{label:'1',active:true,rank:1,text:'1등'},{label:'2',active:false,rank:2,text:'꽝'}]};
test('translated history keeps losing participants unranked',()=>{
 const api=runtime();assert.equal(api.historyText(result),'Ladder · #1 · #1 / #2 · No win');
});
test('updates to one draw deduplicate while identical results from a new draw stay separate',()=>{
 const api=runtime();
 api.saveResultIfNew(api.container,{...result,runId:'draw-1'});
 api.saveResultIfNew(api.container,{...result,runId:'draw-1'});
 assert.equal(api.saved().length,1);
 api.saveResultIfNew(api.container,{...result,runId:'draw-2'});
 assert.equal(api.saved().length,2);
 assert.equal(api.saved()[0].runId,'draw-2');
});
