// Browser + actual supabase-js contract test. HTTPS API is intercepted locally;
// this is not a hosted Supabase/live Auth test. Database RLS is exercised separately.
import {openView} from './navigation.mjs';
import assert from 'node:assert/strict';
import {build} from 'esbuild';
import {chromium} from 'playwright';
import {writeFile,mkdir,readFile} from 'node:fs/promises';
import {serve} from '../tools/serve.mjs';
const A='aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',B='bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb';
const origin='https://moa-qa.supabase.co',key='sb_publishable_local_contract_test';
const manifest=JSON.parse(await readFile(new URL('../dist/build-manifest.json',import.meta.url),'utf8'));
const bundle=await build({entryPoints:[new URL('../app.mjs',import.meta.url).pathname.replace(/^\/(.:)/,'$1')],bundle:true,write:false,format:'esm',define:{__MOA_CONFIG__:JSON.stringify({url:origin,key}),__MOA_BUILD__:JSON.stringify('cloud-contract-test')}});
const server=await serve(),base='http://127.0.0.1:'+server.address().port,browser=await chromium.launch({channel:process.env.MOA_QA_BROWSER||'chrome',headless:true});
const documents=new Map(),results=[],errors=[];let failWrites=false;
const users=new Map([[A,{id:A,email:'a@example.test',aud:'authenticated',role:'authenticated',app_metadata:{},user_metadata:{},created_at:'2026-11-19T00:00:00Z'}],[B,{id:B,email:'b@example.test',aud:'authenticated',role:'authenticated',app_metadata:{},user_metadata:{},created_at:'2026-11-19T00:00:00Z'}]]);
const token=id=>['e30',Buffer.from(JSON.stringify({sub:id,exp:Math.floor(Date.now()/1000)+3600})).toString('base64url'),'test'].join('.');
const getUser=req=>{try{return users.get(JSON.parse(Buffer.from((req.headers().authorization||'').slice(7).split('.')[1],'base64url')).sub);}catch{return null;}};
async function context(){const c=await browser.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true});await c.route('**/*',async route=>{
 const req=route.request(),url=new URL(req.url());
 if(req.url()===base+'/app.js')return route.fulfill({contentType:'text/javascript',body:bundle.outputFiles[0].text});
 if(req.url()===base+'/'){const r=await route.fetch();return route.fulfill({response:r,headers:{...r.headers(),'content-security-policy':`default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; connect-src 'self' ${origin}; img-src 'self' blob:; media-src 'self' blob:`}});}
 if(url.origin!==origin)return route.continue();
 const send=(data,status=200)=>route.fulfill({status,contentType:'application/json',body:JSON.stringify(data)}),body=req.postDataJSON?.();
 if(url.pathname==='/auth/v1/token'){const user=users.get(body.email==='a@example.test'?A:body.email==='b@example.test'?B:'');if(!user||body.password!=='local-test-password')return send({msg:'Invalid login credentials'},400);return send({access_token:token(user.id),refresh_token:'refresh-'+user.id,token_type:'bearer',expires_in:3600,user});}
 if(url.pathname==='/auth/v1/user'){const user=getUser(req);return user?send(user):send({msg:'Invalid JWT'},401);}
 if(url.pathname==='/auth/v1/logout')return send({});
 if(url.pathname==='/auth/v1/signup')return send({id:A,email:body.email,identities:[]});
 const user=getUser(req);if(!user)return send({message:'AUTH_REQUIRED'},401);
 if(url.pathname==='/rest/v1/moa_documents'){const row=documents.get(user.id);return send(row?[row]:[]);}
 if(url.pathname==='/rest/v1/rpc/moa_account_status')return send({status:'active'});
 if(url.pathname==='/rest/v1/rpc/moa_storage_usage')return send({active:0,reserved:0,count:0});
 if(url.pathname==='/rest/v1/rpc/moa_commit'){if(failWrites)return route.abort('internetdisconnected');const old=documents.get(user.id);if(body.p_expected_version!==(old?.version||0))return send({message:'STALE_WRITE',code:'P0001'},400);const version=(old?.version||0)+1;documents.set(user.id,{document:body.p_document,version});return send(version);}
 return send({message:'unexpected '+url.pathname},404);
});return c;}
async function login(page,email){await page.locator('#accountBtn').click();await page.locator('#email').fill(email);await page.locator('#password').fill('local-test-password');await page.locator('#loginForm button[type=submit]').click();await page.getByText('🔒 내 계정의 비공개 클라우드에 저장됩니다.',{exact:true}).waitFor({state:'attached'});await page.waitForFunction(()=>!document.querySelector('#title').disabled);}
async function add(page,title){await openView(page,'write');await page.locator('#title').fill(title);await page.locator('#entryForm button[type=submit]').click();await page.locator('.entry strong').filter({hasText:title}).waitFor();}
try{
 const c=await context(),page=await c.newPage();page.on('pageerror',e=>errors.push(e.message));await page.goto(base);await page.waitForFunction(()=>!document.querySelector('#title').disabled);await add(page,'기기 전용 기록');await login(page,'a@example.test');assert.equal(await page.locator('.entry').count(),0);await add(page,'A의 클라우드 기록');assert.equal(documents.get(A).document.entries[0].title,'A의 클라우드 기록');results.push('guest records are not automatically uploaded; A saved through supabase-js RPC');
 await page.reload();await page.getByRole('button',{name:'A의 클라우드 기록 기록 열기',exact:true}).waitFor();await openView(page,'write');await page.locator('#title').fill('A의 작성 중인 비밀 초안');await page.locator('#content').fill('A의 비공개 본문');await page.locator('#media').setInputFiles({name:'draft.png',mimeType:'image/png',buffer:Buffer.from('synthetic draft')});results.push('authenticated session reload and cloud readback');
 await page.locator('#importFile').setInputFiles({name:'private-backup.json',mimeType:'application/json',buffer:Buffer.from(JSON.stringify({format:'moa-full-backup-v4',db:{entries:[],habits:[],checks:{}},files:{}}))});await page.locator('#backupPassword').fill('private-backup-password');
 const signout=await c.newPage();await signout.goto(base);await signout.getByRole('button',{name:'A의 클라우드 기록 기록 열기',exact:true}).waitFor();await signout.locator('#accountBtn').click();await signout.locator('#logoutBtn').click();await page.getByRole('button',{name:'기기 전용 기록 기록 열기',exact:true}).waitFor();assert.ok(!(await page.locator('#recentEntries').innerText()).includes('A의 클라우드 기록'));assert.equal(await page.locator('#title').inputValue(),'');assert.equal(await page.locator('#content').inputValue(),'');assert.equal(await page.locator('#media').evaluate(n=>n.files.length),0);assert.equal(await page.locator('#backupPassword').inputValue(),'');assert.ok(!await page.locator('#backupDialog').isVisible());await page.evaluate(()=>document.querySelector('#backupForm').requestSubmit());await page.getByText('복원할 파일을 다시 선택해 주세요.',{exact:true}).waitFor();await signout.close();results.push('cross-tab logout clears private title/body/files, backup password and selected restore file');
 assert.equal(await page.getByText('A의 클라우드 기록',{exact:true}).count(),0);await login(page,'b@example.test');assert.equal(await page.locator('.entry').count(),0);assert.equal(await page.locator('#title').inputValue(),'');await add(page,'B의 클라우드 기록');assert.equal(documents.get(B).document.entries.length,1);results.push('B sees only B data after account switch; guest data preserved');
 failWrites=true;await openView(page,'write');await page.locator('#title').fill('네트워크 오류 초안');await page.locator('#entryForm button[type=submit]').click();await page.locator('#notice').filter({hasText:'연결이 끊겼어요.'}).waitFor();assert.equal(await page.locator('#title').inputValue(),'네트워크 오류 초안');assert.equal(documents.get(B).document.entries.length,1);failWrites=false;results.push('network failure does not report saved or discard draft');
 const c2=await context(),p2=await c2.newPage();await p2.goto(base);await login(p2,'a@example.test');await p2.getByRole('button',{name:'A의 클라우드 기록 기록 열기',exact:true}).waitFor();assert.equal(await p2.getByText('B의 클라우드 기록',{exact:true}).count(),0);results.push('second browser reopens the same A cloud record');await c2.close();await c.close();assert.deepEqual(errors,[]);console.log('DONE cloud contract browser checks:',results.length);
}finally{await mkdir(new URL('../qa-evidence/',import.meta.url),{recursive:true});await writeFile(new URL('../qa-evidence/cloud-contract-results.json',import.meta.url),JSON.stringify({type:'local intercepted Supabase API contract, not live hosted test',manifest,results,errors},null,2));await browser.close();server.close();}
