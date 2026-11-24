import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {ownerGateway,GATE_COOKIE} from '../tools/owner-gateway.mjs';
const owner='11111111-1111-4111-8111-111111111111',other='22222222-2222-4222-8222-222222222222';
const env={MOA_GATE_OWNER_ID:owner,MOA_SUPABASE_URL:'https://afiqaibosavbjzkffggr.supabase.co',MOA_SUPABASE_PUBLISHABLE_KEY:'public-anon-fixture'};
const jwt=(sub=owner,exp=Math.floor(Date.now()/1000)+3600)=>Buffer.from(JSON.stringify({alg:'HS256'})).toString('base64url')+'.'+Buffer.from(JSON.stringify({sub,exp,role:'authenticated'})).toString('base64url')+'.synthetic';
const token=jwt(),headers={'Content-Security-Policy':"default-src 'self'; script-src 'self'",'X-Content-Type-Options':'nosniff'};
const routes=Object.fromEntries([['/','PRIVATE_APP'],['/index.html','PRIVATE_APP'],['/app.js','PRIVATE_JS'],['/build-manifest.json','PRIVATE_MANIFEST'],['/healthz','PRIVATE_HEALTH'],['/404.html','PRIVATE_404'],['/__moa_access','PUBLIC_OWNER_LOGIN'],['/__moa_access.js','PUBLIC_LOGIN_SCRIPT']].map(([path,body])=>[path,{body,type:path.endsWith('.js')?'text/javascript':'text/html'}]));
const request=(path='/',options={})=>new Request('https://moa.test'+path,options);
const post=(value,origin='https://moa.test')=>request('/__moa_session',{method:'POST',headers:{Origin:origin,'Content-Type':'application/json'},body:JSON.stringify({accessToken:value})});
const verified=async(url,init)=>{assert.equal(url,env.MOA_SUPABASE_URL+'/rest/v1/rpc/moa_account_status');assert.equal(init.headers.Authorization,'Bearer '+token);assert.equal(init.headers.apikey,env.MOA_SUPABASE_PUBLISHABLE_KEY);assert.equal(init.redirect,'manual');return Response.json({status:'active'});};

test('owner portal and cookie synchronization share the diary Auth storage key',async()=>{
 const read=p=>readFile(new URL('../'+p,import.meta.url),'utf8');
 const repo=await read('repository.mjs'),portal=await read('tools/owner-access-client.mjs'),sync=await read('tools/owner-session-client.mjs');
 const key=repo.match(/storageKey:'([^']+)'/)[1];
 assert.ok(portal.includes("storageKey:'"+key+"'"));assert.ok(sync.includes("storageKey='"+key+"'"));
});

test('email callback serves only the public portal without unlocking private files',async()=>{
 const withCallback={...routes,'/__moa_auth_callback':routes['/__moa_access']};
 const r=await ownerGateway(request('/__moa_auth_callback?unexpected=fixture'),env,withCallback,headers,()=>{throw Error('No session verification for public HTML');});
 assert.equal(r.status,200);assert.equal(await r.text(),'PUBLIC_OWNER_LOGIN');assert.equal(r.headers.get('cache-control'),'no-store');assert.equal(r.headers.get('set-cookie'),null);
 assert.equal((await ownerGateway(request('/__moa_auth_callback',{method:'POST'}),env,withCallback,headers,verified)).status,405);
 assert.equal((await ownerGateway(request('/app.js'),env,withCallback,headers,()=>{throw Error('No valid token');})).status,401);
});
test('owner gateway fails closed before configuration and never serves diary assets anonymously',async()=>{
 const unexpected=()=>{throw Error('Auth service should not be called');};
 for(const path of Object.keys(routes)){const r=await ownerGateway(request(path),{},routes,headers,unexpected);assert.equal(r.status,503);assert.ok(!(await r.text()).includes('PRIVATE_'));}
 for(const path of ['/','/index.html','/app.js','/build-manifest.json','/healthz','/unknown']){const r=await ownerGateway(request(path),env,routes,headers,unexpected);assert.equal(r.status,path==='/'||path==='/index.html'?303:401);assert.equal(r.headers.get('cache-control'),'no-store');assert.ok(!(await r.text()).includes('PRIVATE_'));}
 assert.equal(await (await ownerGateway(request('/__moa_access'),env,routes,headers,unexpected)).text(),'PUBLIC_OWNER_LOGIN');
});
test('owner gateway verifies token server-side, cookie security, expiry and revoked/forged sessions',async()=>{
 const login=await ownerGateway(post(token),env,routes,headers,verified);assert.equal(login.status,204);assert.equal(await login.text(),'');assert.match(login.headers.get('set-cookie'),/Secure; HttpOnly; SameSite=Strict; Max-Age=\d+/);
 for(const path of ['/','/app.js','/build-manifest.json','/healthz']){const r=await ownerGateway(request(path,{headers:{Cookie:GATE_COOKIE+'='+token}}),env,routes,headers,verified);assert.equal(r.status,200);assert.match(await r.text(),/^PRIVATE_/);}
 for(const bad of [jwt(other),jwt(owner,1),'invalid',token+'\r\n']){const r=await ownerGateway(post(bad),env,routes,headers,()=>{throw Error('Must prefilter');});assert.equal(r.status,401);}
 const denied=async()=>Response.json({message:'AUTH_REQUIRED'},{status:401});assert.equal((await ownerGateway(post(token),env,routes,headers,denied)).status,401);
 assert.equal((await ownerGateway(request('/app.js',{headers:{Cookie:GATE_COOKIE+'='+token}}),env,routes,headers,denied)).status,401);
 const offline=async()=>{throw Error('offline');};assert.equal((await ownerGateway(post(token),env,routes,headers,offline)).status,503);
 assert.equal((await ownerGateway(post(token),env,routes,headers,async()=>Response.json({unexpected:true}))).status,503);
 for(const status of [301,302,307,308])assert.equal((await ownerGateway(post(token),env,routes,headers,async()=>new Response(null,{status,headers:{Location:'https://unexpected.test'}}))).status,503);
});
test('owner gateway blocks login CSRF, oversized bodies, cookie duplicates and unsupported methods',async()=>{
 assert.equal((await ownerGateway(post(token,'https://evil.test'),env,routes,headers,verified)).status,403);
 assert.equal((await ownerGateway(request('/__moa_session',{method:'POST',headers:{Origin:'https://moa.test'},body:token}),env,routes,headers,verified)).status,415);
 assert.equal((await ownerGateway(post('a'.repeat(6000)),env,routes,headers,verified)).status,413);
 const body=new ReadableStream({start(c){c.enqueue(new TextEncoder().encode('a'.repeat(6000)));c.close();}});
 assert.equal((await ownerGateway(request('/__moa_session',{method:'POST',headers:{Origin:'https://moa.test','Content-Type':'application/json'},body,duplex:'half'}),env,routes,headers,verified)).status,413);
 assert.equal((await ownerGateway(request('/app.js',{headers:{Cookie:GATE_COOKIE+'='+token+'; '+GATE_COOKIE+'='+token}}),env,routes,headers,verified)).status,401);
 assert.equal((await ownerGateway(request('/app.js',{method:'POST'}),env,routes,headers,verified)).status,405);
 const logout=await ownerGateway(request('/__moa_logout',{method:'POST',headers:{Origin:'https://moa.test'}}),env,routes,headers,verified);assert.equal(logout.status,204);assert.match(logout.headers.get('set-cookie'),/Max-Age=0/);
 const head=await ownerGateway(request('/',{method:'HEAD',headers:{Cookie:GATE_COOKIE+'='+token}}),env,routes,headers,verified);assert.equal(head.status,200);assert.equal(await head.text(),'');
 const missing=await ownerGateway(request('/not-found',{headers:{Cookie:GATE_COOKIE+'='+token}}),env,routes,headers,verified);assert.equal(missing.status,404);
});
