import assert from 'node:assert/strict';
import test from 'node:test';
import { onRequest } from '../functions/api/events.js';

const url='https://random-ppobgi.pages.dev/api/events';
const valid={event_name:'game_start',method:'wheel',input_mode:'number',participant_bucket:'6-10',result_mode:'winner'};
const request=(body=valid,headers={})=>new Request(url,{method:'POST',headers:{'content-type':'application/json',origin:'https://random-ppobgi.pages.dev',...headers},body:JSON.stringify(body)});
function capture(impl=async()=>new Response(null,{status:204})){
  const previous=globalThis.fetch;
  const calls=[];
  globalThis.fetch=(...args)=>{calls.push(args);return impl(...args);};
  return {calls,restore:()=>{globalThis.fetch=previous;}};
}

test('valid anonymous event proxies to Supabase without extra fields or credentials',async()=>{
  const m=capture();
  try {
    assert.equal((await onRequest({request:request()})).status,204);
    assert.equal(m.calls.length,1);
    assert.equal(m.calls[0][0],'https://afiqaibosavbjzkffggr.supabase.co/functions/v1/random-picker-event');
    assert.deepEqual(JSON.parse(m.calls[0][1].body),valid);
    assert.equal(m.calls[0][1].headers.origin,'https://random-ppobgi.pages.dev');
    assert.equal(m.calls[0][1].headers.authorization,undefined);
  }finally{m.restore();}
});
test('sensitive fields, invalid categories, and foreign origins are blocked',async()=>{
  const m=capture();
  try {
    assert.equal((await onRequest({request:request({...valid,participant_name:'secret'})})).status,400);
    assert.equal((await onRequest({request:request({...valid,method:'bomb'})})).status,400);
    assert.equal((await onRequest({request:request(valid,{origin:'https://example.com'})})).status,403);
    assert.equal(m.calls.length,0);
  }finally{m.restore();}
});
test('headless and qa=1 visits never emit counts',async()=>{
  const m=capture();
  try {
    assert.equal((await onRequest({request:request(valid,{'user-agent':'HeadlessChrome'})})).status,204);
    assert.equal((await onRequest({request:request(valid,{referer:'https://random-ppobgi.pages.dev/?qa=1'})})).status,204);
    assert.equal(m.calls.length,0);
  }finally{m.restore();}
});
test('upstream errors never interfere with the application',async()=>{
  let m=capture(async()=>new Response(null,{status:503}));
  try{assert.equal((await onRequest({request:request()})).status,503);}finally{m.restore();}
  m=capture(async()=>{throw Error('offline')});
  try{assert.equal((await onRequest({request:request()})).status,503);}finally{m.restore();}
});
test('valid bomb events, wrong methods, and content type keep contract',async()=>{
  const m=capture();
  try{
    assert.equal((await onRequest({request:request({...valid,method:'bomb',input_mode:'na',participant_bucket:'na',result_mode:'bomb'})})).status,204);
    assert.equal((await onRequest({request:new Request(url)})).status,405);
    assert.equal((await onRequest({request:request(valid,{'content-type':'text/plain'})})).status,415);
    assert.equal(m.calls.length,1);
  }finally{m.restore();}
});
