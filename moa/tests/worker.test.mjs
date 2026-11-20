import test from 'node:test';
import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {readFile} from 'node:fs/promises';
test('release Worker enforces CSP/no-store, MIME, 404 and read-only methods',async()=>{
 try{await readFile(new URL('../dist/_headers',import.meta.url));}catch(e){if(e.code!=='ENOENT')throw e;execFileSync(process.execPath,['tools/build.mjs'],{cwd:new URL('../',import.meta.url)});}
 execFileSync(process.execPath,['tools/build-worker.mjs'],{cwd:new URL('../',import.meta.url)});
 const source=await readFile(new URL('../dist/server/index.js',import.meta.url),'utf8');
 const worker=(await import('data:text/javascript;base64,'+Buffer.from(source).toString('base64'))).default;
 for(const [path,method,status] of [['/','GET',200],['/app.js','HEAD',200],['/unknown','GET',404],['/','POST',405]]){
  const r=await worker.fetch(new Request('https://moa.invalid'+path,{method}));assert.equal(r.status,status);assert.match(r.headers.get('content-security-policy'),/script-src 'self'/);assert.equal(r.headers.get('cache-control'),'no-store');assert.equal(r.headers.get('x-content-type-options'),'nosniff');if(method==='HEAD')assert.equal(await r.text(),'');
 }
 assert.match((await worker.fetch(new Request('https://moa.invalid/app.js'))).headers.get('content-type'),/javascript/);
});
