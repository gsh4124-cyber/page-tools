import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import {onRequest} from '../functions/api/tool-uses.js';
test('tool counter accepts only an anonymous tool category and keeps QA and failures out',async()=>{
 const original=globalThis.fetch,calls=[];globalThis.fetch=async(url,init)=>{calls.push({url,body:JSON.parse(init.body)});return new Response(null,{status:204});};
 const request=(body,headers={})=>new Request('https://random-ppobgi.pages.dev/api/tool-uses',{method:'POST',headers:{origin:'https://random-ppobgi.pages.dev','content-type':'application/json',...headers},body:JSON.stringify(body)});
 try{
  for(const tool of ['yut','dice'])assert.equal((await onRequest({request:request({tool})})).status,204);
  assert.deepEqual(calls.map(c=>c.body),[{tool:'yut'},{tool:'dice'}]);
  for(const body of [{tool:'coin'},{tool:'yut',result:'모'},{tool:'dice',name:'private'},[],null])assert.equal((await onRequest({request:request(body)})).status,400);
  assert.equal((await onRequest({request:request({tool:'yut'},{origin:'https://other.example'})})).status,403);
  assert.equal((await onRequest({request:request({tool:'yut'},{referer:'https://random-ppobgi.pages.dev/?qa=1'})})).status,204);
  assert.equal(calls.length,2);
  globalThis.fetch=async()=>{throw Error('offline');};assert.equal((await onRequest({request:request({tool:'dice'})})).status,503);
 }finally{globalThis.fetch=original;}
});
test('client sends no outcome or identifier and suppresses QA, automation and previews',()=>{
 const source=fs.readFileSync(new URL('../tool-metrics.js',import.meta.url),'utf8');
 for(const [hostname,search,webdriver,allowed] of [['random-ppobgi.pages.dev','',false,true],['random-ppobgi.pages.dev','?qa=1',false,false],['random-ppobgi.pages.dev','',true,false],['preview.pages.dev','',false,false]]){
  const calls=[],scope={window:{},location:{hostname,search},navigator:{webdriver,userAgent:'Browser'},URLSearchParams,fetch:(url,options)=>{calls.push({url,body:JSON.parse(options.body)});return Promise.resolve();}};
  vm.runInNewContext(source,scope);for(const tool of ['yut','dice','coin'])scope.window.RandomPickerToolMetrics.record(tool);
  assert.deepEqual(calls,allowed?[{url:'/api/tool-uses',body:{tool:'yut'}},{url:'/api/tool-uses',body:{tool:'dice'}}]:[]);
 }
});
