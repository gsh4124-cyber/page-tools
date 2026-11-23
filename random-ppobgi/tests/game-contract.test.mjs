import fs from 'node:fs';
import vm from 'node:vm';
import test from 'node:test';
import assert from 'node:assert/strict';
const source=fs.readFileSync(new URL('../game-core.js',import.meta.url),'utf8');
let seed=123456789;
const rand=n=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed%n;};
const shuffle=a=>{a=[...a];for(let i=a.length-1;i>0;i--){const j=rand(i+1);[a[i],a[j]]=[a[j],a[i]];}return a;};
const helpers=source.slice(source.indexOf('function buildLadderLayout('),source.indexOf('function initLadder('));
const api=vm.runInNewContext(helpers+';({buildLadderLayout,wheelColorIndices,wheelTargetAngle,createDrawSession})',{rand,shuffle});

test('2–12 lane ladders connect every gap, have no touching rungs and map every participant to one endpoint',()=>{
 for(let size=2;size<=12;size++)for(let attempt=0;attempt<100;attempt++){
  const x=api.buildLadderLayout(size),coverage=Array(size-1).fill(0),rows=new Map();
  for(const r of x.rungs){coverage[r.c]++;const row=rows.get(r.y)||new Set();assert(!row.has(r.c)&&!row.has(r.c+1));row.add(r.c);row.add(r.c+1);rows.set(r.y,row);}
  assert(coverage.every(n=>n>=2),`${size}: isolated pair`);
  assert.equal(new Set(x.routes.map(r=>r.end)).size,size);
  for(let lane=0;lane<size;lane++)assert(Math.abs(x.pad+lane*x.dx-x.w*(lane+.5)/size)<1e-9,'Button centers and vertical lines align');
 }
});
test('2–100 wheel wedges have different neighbors including the wraparound edge',()=>{
 for(let size=2;size<=100;size++){
  const colors=api.wheelColorIndices(size);assert.equal(colors.length,size);
  assert(colors.every(c=>[0,1,2].includes(c)));
  for(let i=0;i<size;i++)assert.notEqual(colors[i],colors[(i+1)%size],`${size}/${i}`);
  if(size>=3)assert.equal(new Set(colors).size,3);
  for(let selected=0;selected<size;selected++)for(const angle of [0,.17,99,10000]){
   const target=api.wheelTargetAngle(selected,size,angle,4),tau=Math.PI*2,atPointer=(((-Math.PI/2-target)%tau)+tau)%tau;
   assert(target>angle);assert.equal(Math.floor(atPointer/(tau/size)),selected);
  }
 }
});
test('skipping an animation preserves its pending selection and commits it only once',()=>{
 const pool=Array.from({length:4},(_,id)=>({id,label:id%2?'안 산다':'산다'})),entries=[{id:0,text:'당첨'}];
 const draw=api.createDrawSession(pool,entries),selected=draw.select();
 for(let i=0;i<20;i++)assert.equal(draw.select(),selected);
 assert.equal(draw.commit(),selected);assert.equal(draw.select(),null);assert.equal(draw.commit(),null);assert.equal(draw.assigned.length,1);assert.equal(draw.remaining.length,3);assert.equal(pool.length,4);
});
test('game setup labels are present in all 17 supported languages',()=>{
 const state={window:{}};vm.runInNewContext(fs.readFileSync(new URL('../game-flow.js',import.meta.url),'utf8'),state);
 assert.equal(Object.keys(state.window.RandomPickerFlowText).length,17);
 for(const [lang,labels] of Object.entries(state.window.RandomPickerFlowText)){assert.equal(labels.length,6);assert(labels.every(x=>typeof x==='string'&&x.trim()));if(lang!=='ko')assert(labels.every(x=>!/[가-힣]/.test(x)));}
});

function wheel(selectedIndex){
 let now=0,seq=0,depth=0,paints={angle:0,labels:[]},drawCalls=0;
 const frames=new Map(),timers=new Map(),nodes={};
 const ctx={clearRect(){paints={angle:0,labels:[]}},save(){depth++},restore(){depth--},translate(){},rotate(a){if(depth===1)paints.angle=a},beginPath(){},moveTo(){},arc(){},closePath(){},fill(){},measureText(t){return{width:t.length*12}},fillText(t){paints.labels.push(t)}};
 for(const name of ['wheelCanvas','wheelRound','wheelStart','wheelStop'])nodes[name]={textContent:'',disabled:false,addEventListener(e,fn){this[e]=fn},getContext(){return ctx},setAttribute(){}};
 const state={visual:{},interactiveControls:{},hint:{},stageStatus:{},animationToken:1,lastResults:[],lastWinners:[],revealed:0,$:id=>nodes[id],gamePack:()=>null,targetEntries:()=>[{id:0,text:'당첨',active:true}],label:p=>p.label,rand:n=>{if(n===4){drawCalls++;return selectedIndex;}return 0;},sortResults:a=>a,motionTime:n=>n,performance:{now:()=>now},requestAnimationFrame:fn=>{frames.set(++seq,fn);return seq},cancelAnimationFrame:id=>frames.delete(id),setTimeout:(fn,delay)=>{timers.set(++seq,{fn,delay});return seq},clearTimeout:id=>timers.delete(id),cancelAllAsync(){frames.clear();timers.clear()},revealResults(){state.revealed++;}};
 vm.createContext(state);vm.runInContext(source.slice(source.indexOf('function wheelColorIndices('),source.indexOf('function initLadder('))+source.slice(source.indexOf('function initWheel('),source.indexOf('function initLots(')),state);
 state.initWheel(Array.from({length:4},(_,id)=>({id,label:'P'+id})),1,1);
 return{state,start:()=>nodes.wheelStart.click(),stop:()=>nodes.wheelStop.click(),immediate:()=>state.revealAllHandler(),frame(ms){now=ms;const pending=[...frames.values()];frames.clear();pending.forEach(fn=>fn(now));},verify(){const tau=Math.PI*2,pointer=Math.floor((((-Math.PI/2-paints.angle)%tau+tau)%tau)/(tau/4));assert.equal(state.lastResults[0].person.id,selectedIndex);assert.equal(pointer,selectedIndex);assert.equal(drawCalls,1);},paint:()=>paints};
}
test('normal, immediate and interrupted wheel results all match the painted pointer without redrawing a winner',()=>{
 for(let chosen=0;chosen<4;chosen++)for(const phase of ['ready','spinning','slowing','stopped']){
  const w=wheel(chosen);
  if(phase!=='ready')w.start();
  if(['slowing','stopped'].includes(phase)){w.stop();w.frame(phase==='slowing'?1000:3000);}
  w.immediate();w.verify();w.immediate();w.verify();
 }
});
