import fs from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';
const files=process.argv.slice(2);if(!files.length)files.push('mobile.js');
const deferred=()=>{let resolve,reject;const promise=new Promise((a,b)=>{resolve=a;reject=b;});return{promise,resolve,reject};};
const flush=async()=>{for(let i=0;i<16;i++)await Promise.resolve();};
function harness(file,{holdResume=false,holdPlay=false}={}){
 const nodes=new Map(),pending=[],events=new Map(),frames=new Map(),contexts=[],resume=deferred(),play=deferred();let frame=0;
 const node=selector=>{if(!nodes.has(selector))nodes.set(selector,{style:{},classList:{toggle(){},add(){},remove(){}},textContent:'',dataset:{},addEventListener(){},setAttribute(){},srcObject:null,play:()=>holdPlay?play.promise:Promise.resolve()});return nodes.get(selector);};
 const sandbox={console,Date,Uint8Array,setTimeout,clearTimeout,matchMedia:()=>({matches:false}),localStorage:{getItem:()=>null,setItem(){},removeItem(){}},navigator:{mediaDevices:{getUserMedia(){const p=deferred();pending.push(p);return p.promise;}}},document:{querySelector:node,querySelectorAll:()=>[],addEventListener(){},documentElement:{}},addEventListener:(type,fn)=>events.set(type,fn),requestAnimationFrame:fn=>{frames.set(++frame,fn);return frame;},cancelAnimationFrame:id=>frames.delete(id)};
 sandbox.window={AudioContext:class{constructor(){this.closed=false;contexts.push(this);}resume(){return holdResume?resume.promise:Promise.resolve();}close(){this.closed=true;return Promise.resolve();}createMediaStreamSource(){return{connect(){}};}createAnalyser(){return{fftSize:512,getByteTimeDomainData:data=>data.fill(128)};}}};
 const source=fs.readFileSync(file,'utf8').replace(/\}\)\(\);\s*$/,"globalThis.__media={camera,stopCamera,stopMic,get verified(){return frontCameraOk&&backCameraOk;},get cam(){return camStream;},get mic(){return micStream;}};})();");
 vm.runInNewContext(source,sandbox);
 const stream=()=>{const track={stopped:false,stop(){this.stopped=true;},getSettings:()=>({deviceId:'test',facingMode:'user',width:640,height:480})};return{track,getTracks:()=>[track],getVideoTracks:()=>[track]};};
 return{media:sandbox.__media,pending,node,events,frames,contexts,resume,play,stream,start:kind=>kind==='camera'?sandbox.__media.camera('user'):node('#startMic').onclick(),stop:kind=>kind==='camera'?sandbox.__media.stopCamera():sandbox.__media.stopMic()};
}
let cases=0;
for(const file of files)for(const kind of ['camera','mic']){
 const field=kind==='camera'?'cam':'mic';
 {const h=harness(file);h.start(kind);await flush();h.stop(kind);const late=h.stream();h.pending[0].resolve(late);await flush();assert(late.track.stopped);assert.equal(h.media[field],null);assert.equal(h.frames.size,0);cases++;}
 {const h=harness(file);h.start(kind);h.start(kind);const current=h.stream(),old=h.stream();h.pending[1].resolve(current);await flush();h.pending[0].resolve(old);await flush();assert.equal(h.media[field],current);assert(old.track.stopped);assert(!current.track.stopped);h.stop(kind);assert(current.track.stopped);cases++;}
 {const h=harness(file);h.start(kind);h.start(kind);const current=h.stream();h.pending[1].resolve(current);await flush();h.pending[0].reject({name:'NotAllowedError'});await flush();assert.equal(h.media[field],current);assert(!current.track.stopped);h.stop(kind);cases++;}
 {const h=harness(file);h.start(kind);h.events.get('pagehide')();const late=h.stream();h.pending[0].resolve(late);await flush();assert(late.track.stopped);assert.equal(h.media[field],null);cases++;}
 {const h=harness(file);h.start(kind);h.node('#resetMobileResults').onclick();const late=h.stream();h.pending[0].resolve(late);await flush();assert(late.track.stopped);assert.equal(h.media[field],null);cases++;}
 if(kind==='mic'){const h=harness(file,{holdResume:true});h.start(kind);const current=h.stream();h.pending[0].resolve(current);await flush();h.stop(kind);h.resume.resolve();await flush();assert(current.track.stopped);assert(h.contexts.every(c=>c.closed));assert.equal(h.frames.size,0);cases++;}
 else{
  {const h=harness(file,{holdPlay:true});h.start(kind);const current=h.stream();h.pending[0].resolve(current);await flush();h.stop(kind);h.play.resolve();await flush();assert(current.track.stopped);assert.equal(h.media[field],null);cases++;}
  {const h=harness(file);h.start(kind);h.pending[0].resolve(h.stream());await flush();h.media.camera('environment');const back=h.stream();back.track.getSettings=()=>({deviceId:'back',facingMode:'environment'});h.pending[1].resolve(back);await flush();assert(h.media.verified);h.node('#resetMobileResults').onclick();assert(!h.media.verified,'A new run must not inherit old front/back evidence');assert(back.track.stopped);h.start(kind);h.pending[2].resolve(h.stream());await flush();assert(!h.media.verified);h.stop(kind);cases++;}
 }
}
console.log(`Mobile media PASS: ${cases} cancellation, late permission, replacement and page-exit cases across ${files.length} runtimes; simulated devices only.`);
