import fs from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';
const files=process.argv.slice(2);if(!files.length)files.push('app.js');
const deferred=()=>{let resolve,reject;const promise=new Promise((a,b)=>{resolve=a;reject=b;});return {promise,resolve,reject};};
const flush=async()=>{for(let n=0;n<12;n++)await Promise.resolve();};
function harness(source,kind){
 const nodes=new Map(),events=new Map(),pending=[],frames=new Map();let frameId=0;
 const canvas={clearRect(){},beginPath(){},lineTo(){},moveTo(){},stroke(){}};
 const node=id=>{if(!nodes.has(id))nodes.set(id,{id,style:{},value:'',textContent:'',listeners:{},addEventListener(type,fn){this.listeners[type]=fn;},getContext(){return canvas;},play(){return Promise.resolve();},appendChild(){},innerHTML:'',srcObject:null});return nodes.get(id);};
 const sandbox={console,Uint8Array,Math,navigator:{mediaDevices:{getUserMedia(){const request=deferred();pending.push(request);return request.promise;},enumerateDevices(){return Promise.resolve([]);}}},document:{querySelector:s=>node(s.slice(1)),querySelectorAll:()=>[],getElementById:node,addEventListener(){},createElement:()=>({})},requestAnimationFrame:fn=>{const id=++frameId;frames.set(id,fn);return id;},cancelAnimationFrame:id=>frames.delete(id)};
 sandbox.window={addEventListener:(type,fn)=>events.set(type,fn),AudioContext:class{createMediaStreamSource(){return {connect(){}};}createAnalyser(){return {fftSize:1024,getByteTimeDomainData:data=>data.fill(128)};}close(){return Promise.resolve();}}};
 vm.createContext(sandbox);vm.runInContext(source+`;globalThis.__media=media;init${kind==='mic'?'Mic':'Cam'}();`,sandbox);
 const stream=()=>{const track={stopped:false,stop(){this.stopped=true;},getSettings:()=>({deviceId:'test',width:640,height:480}),label:'Test'};return {track,getTracks:()=>[track],getAudioTracks:()=>[track],getVideoTracks:()=>[track]};};
 return {pending,frames,node,stream,media:sandbox.__media,events,click:id=>node(id).listeners.click(),kind};
}
let cases=0;
for(const file of files){const source=fs.readFileSync(file,'utf8');for(const kind of ['mic','cam']){
 const cap=kind==='mic'?'Mic':'Cam',field=kind+'Stream';
 {
  const h=harness(source,kind);h.click('start'+cap);await flush();h.click('stop'+cap);const late=h.stream();h.pending[0].resolve(late);await flush();assert(late.track.stopped,file+' '+kind+' stopped request must dispose late stream');assert.equal(h.media[field],null);if(kind==='mic')assert.equal(h.frames.size,0);cases++;
 }
 {
  const h=harness(source,kind);h.click('start'+cap);await flush();h.click('start'+cap);await flush();const current=h.stream(),old=h.stream();h.pending[1].resolve(current);await flush();h.pending[0].resolve(old);await flush();assert.equal(h.media[field],current,file+' '+kind+' latest start wins');assert(old.track.stopped);assert(!current.track.stopped);h.click('stop'+cap);assert(current.track.stopped);cases++;
 }
 {
  const h=harness(source,kind);h.click('start'+cap);await flush();h.click('start'+cap);await flush();const current=h.stream();h.pending[1].resolve(current);await flush();h.pending[0].reject({name:'NotAllowedError'});await flush();assert.equal(h.media[field],current,file+' '+kind+' obsolete failure must not stop newer stream');assert(!current.track.stopped);h.click('stop'+cap);cases++;
 }
 {
  const h=harness(source,kind);h.click('start'+cap);await flush();h.events.get('beforeunload')();const late=h.stream();h.pending[0].resolve(late);await flush();assert(late.track.stopped,file+' '+kind+' page exit invalidates pending request');assert.equal(h.media[field],null);cases++;
 }
}}
console.log(`Media lifecycle PASS: ${cases} async race cases across ${files.length} runtime files; simulated media only, no device permission requested.`);
