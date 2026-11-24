// Packaged Worker/browser integration. Synthetic authentication is mocked here;
// this does not claim a successful real owner sign-in on Cloudflare.
import assert from 'node:assert/strict';
import {createServer} from 'node:http';
import {readFile,writeFile} from 'node:fs/promises';
import {chromium} from 'playwright';
const root=new URL('../',import.meta.url),manifest=JSON.parse(await readFile(new URL('dist/build-manifest.json',root),'utf8'));
const owner='851fc863-0e90-442c-8f6f-34367d185429',exp=Math.floor(Date.now()/1000)+3600;
const token=['eyJhbGciOiJIUzI1NiJ9',Buffer.from(JSON.stringify({sub:owner,role:'authenticated',exp,is_anonymous:false})).toString('base64url'),Buffer.from('synthetic').toString('base64url')].join('.');
const realFetch=globalThis.fetch;globalThis.fetch=async(url,opts)=>String(url).endsWith('/rest/v1/rpc/moa_account_status')?new Response(JSON.stringify({status:'active'}),{headers:{'Content-Type':'application/json'}}):realFetch(url,opts);
const worker=(await import('../dist-cloudflare/_worker.js')).default;
const env={MOA_SUPABASE_URL:'https://afiqaibosavbjzkffggr.supabase.co',MOA_SUPABASE_PUBLISHABLE_KEY:'synthetic-public-key',MOA_GATE_OWNER_ID:owner};
const server=createServer(async(req,res)=>{try{const chunks=[];for await(const c of req)chunks.push(c);const r=await worker.fetch(new Request('http://127.0.0.1:'+server.address().port+req.url,{method:req.method,headers:req.headers,...(['GET','HEAD'].includes(req.method)?{}:{body:Buffer.concat(chunks)})}),env);res.writeHead(r.status,Object.fromEntries(r.headers));res.end(Buffer.from(await r.arrayBuffer()));}catch{res.writeHead(500);res.end('Test adapter failure');}});
await new Promise(r=>server.listen(0,'127.0.0.1',r));const base='http://127.0.0.1:'+server.address().port,results=[],errors=[];let browser;
const check=async(name,fn)=>{await fn();results.push({name,status:'DONE'});console.log('DONE',name);};
try{
 browser=await chromium.launch({channel:'chrome',headless:true});const cx=await browser.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true}),page=await cx.newPage();page.on('pageerror',e=>errors.push(e.message));
 await check('packaged Worker blocks anonymous HTML, assets, manifest and health',async()=>{for(const path of ['/','/index.html','/app.js','/service.css','/build-manifest.json','/healthz','/__moa_session_sync.js']){const r=await cx.request.get(base+path,{maxRedirects:0});assert.ok([303,401].includes(r.status()),path);assert.ok(!(await r.text()).includes('id="entryForm"'));}});
 await check('service introduction renders before login at 304/320/390/768/1280px with protected app assets',async()=>{await page.goto(base);await page.locator('#heroTitle').waitFor();assert.equal(await page.locator('#gateDialog').isVisible(),false);assert.equal(await page.locator('#gateEmail').isVisible(),false);for(const width of [304,320,390,768,1280]){await page.setViewportSize({width,height:844});assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=document.documentElement.clientWidth),'overflow at '+width);assert.ok(await page.locator('.switch button').evaluateAll(buttons=>buttons.every(b=>b.getBoundingClientRect().height<=48)),'preview tabs stay on one line at '+width);await page.screenshot({path:new URL(`qa-evidence/introduction-${width}.png`,root).pathname.replace(/^\/(.:)/,'$1'),fullPage:true});}await page.setViewportSize({width:390,height:844});assert.match((await cx.request.get(base+'/__moa_access')).headers()['content-security-policy'],/script-src 'self'/);});
 await check('photos and calendar dates open the right synthetic record without authentication',async()=>{
  const requests=[];const capture=request=>requests.push({url:request.url(),method:request.method()});page.on('request',capture);
  await page.locator('#previewTitle').waitFor();
  assert.ok(await page.locator('#samplePhoto').evaluate(img=>img.complete&&img.naturalWidth>0));
  await page.getByRole('button',{name:'사진',exact:true}).click();
  assert.ok(await page.locator('#photosExample').isVisible());
  await page.getByRole('button',{name:'11월 21일 바다 예시 기록 보기',exact:true}).click();
  assert.equal(await page.locator('#sampleTitle').textContent(),'주말의 바다');
  assert.equal(await page.locator('#sampleDate').getAttribute('datetime'),'2026-11-21');
  assert.equal(await page.locator('#sampleDate .date-day').textContent(),'21');assert.equal(await page.locator('#sampleDate').getAttribute('aria-label'),'2026년 11월 21일 토요일');
  await page.getByRole('button',{name:'달력',exact:true}).click();
  assert.equal(await page.locator('[data-demo-day]').count(),30);assert.equal(await page.locator('[data-demo-day="21"]').getAttribute('aria-pressed'),'true');
  await page.getByRole('button',{name:'11월 22일',exact:true}).click();
  assert.equal(await page.locator('#calendarText').textContent(),'이날에는 예시 기록이 없어요.');
  assert.equal(await page.locator('#openCalendarRecord').isVisible(),false);
  await page.getByRole('button',{name:'11월 23일 · 예시 기록 있음',exact:true}).click();
  await page.getByRole('button',{name:'이날의 예시 기록 보기',exact:true}).click();
  assert.equal(await page.locator('#sampleTitle').textContent(),'월요일 메모');
  assert.equal(await page.locator('#sampleDate .date-day').textContent(),'23');assert.equal(await page.locator('#sampleDate').getAttribute('aria-label'),'2026년 11월 23일 월요일');
  assert.equal(await page.locator('#showRecordExample').getAttribute('aria-pressed'),'true');
  assert.ok(await page.locator('#showRecordExample').evaluate(el=>el===document.activeElement));
  for(const view of ['달력','사진','기록']){
   await page.getByRole('button',{name:view,exact:true}).click();
   for(const width of [304,320,390,768,1280]){await page.setViewportSize({width,height:844});assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=document.documentElement.clientWidth),view+' overflow at '+width);}
  }
  await page.setViewportSize({width:390,height:844});page.off('request',capture);
  assert.ok(requests.every(request=>request.method==='GET'&&request.url.startsWith(base)),JSON.stringify(requests));
 });
 await check('habit feedback toggles accessibly and resets on reload',async()=>{
  await page.getByRole('button',{name:'산책 10분',exact:true}).click();
  assert.equal(await page.locator('#habitCount').textContent(),'1 / 2 완료');
  await page.getByRole('button',{name:'책 5쪽',exact:true}).focus();await page.keyboard.press('Space');
  assert.equal(await page.locator('#habitCount').textContent(),'2 / 2 완료');
  await page.getByRole('button',{name:'산책 10분',exact:true}).click();
  assert.equal(await page.locator('#habitCount').textContent(),'1 / 2 완료');
  await page.reload();await page.locator('#showRecordExample').waitFor();
  assert.equal(await page.locator('#habitCount').textContent(),'0 / 2 완료');
 });
 await check('owner dialog opens only by choice and Escape restores the trigger focus',async()=>{
  assert.equal(await page.locator('#gateDialog').isVisible(),false);
  await page.getByRole('button',{name:'내 모아 열기',exact:true}).first().click();
  assert.ok(await page.locator('#gateDialog').isVisible());
  await page.setViewportSize({width:304,height:844});assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=document.documentElement.clientWidth));
  assert.ok(await page.locator('#gateGoogle').evaluate(el=>el===document.activeElement));
  assert.equal(await page.locator('#gateEmail').isVisible(),false);assert.equal(await page.locator('#gateAlternative').getAttribute('open'),null);
  for(const width of [304,320,390,768,1280]){await page.setViewportSize({width,height:844});assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=document.documentElement.clientWidth));assert.ok(await page.locator('#gateGoogle').isVisible());if([304,390,1280].includes(width))await page.screenshot({path:new URL(`qa-evidence/google-login-${width}.png`,root).pathname.replace(/^\/(.:)/,'$1'),fullPage:true});}
  await page.getByText('다른 방법으로 로그인',{exact:true}).click();
  assert.equal(await page.locator('#gateVerifyForm').isVisible(),false);
  await page.getByRole('button',{name:'링크가 열리지 않나요?',exact:true}).click();
  assert.ok(await page.locator('#gateVerifyForm').isVisible());
  await page.keyboard.press('Escape');assert.equal(await page.locator('#gateDialog').isVisible(),false);
  assert.ok(await page.getByRole('button',{name:'내 모아 열기',exact:true}).first().evaluate(el=>el===document.activeElement));
  assert.equal((await cx.request.get(base+'/app.js')).status(),401);
 });
 const authOrigin='https://afiqaibosavbjzkffggr.supabase.co';
 const mockAuth=async(context,seen,oauthToken=token)=>{
  await context.route(authOrigin+'/**',async route=>{
   const req=route.request(),url=new URL(req.url());seen.push({path:url.pathname,method:req.method(),redirect:url.searchParams.get('redirect_to'),body:req.postDataJSON()});
   const headers={'access-control-allow-origin':base,'access-control-allow-headers':'authorization,apikey,content-type,x-client-info,x-supabase-api-version','access-control-allow-methods':'GET,POST,OPTIONS'};
   if(req.method()==='OPTIONS')return route.fulfill({status:204,headers});
   if(url.pathname==='/auth/v1/authorize')return route.fulfill({status:200,contentType:'text/html',body:'<p>Mock Google account selection</p>'});
   if(url.pathname==='/auth/v1/token'&&url.searchParams.get('grant_type')==='pkce')return route.fulfill({status:200,headers,contentType:'application/json',body:JSON.stringify({access_token:oauthToken,refresh_token:'oauth-synthetic-refresh',token_type:'bearer',expires_in:3600,provider_token:'synthetic-provider-secret',user:{id:JSON.parse(Buffer.from(oauthToken.split('.')[1],'base64url')).sub,aud:'authenticated',role:'authenticated',email:'owner@example.test',app_metadata:{provider:'google',providers:['google']},user_metadata:{},created_at:'2026-01-01T00:00:00Z'}})});
   if(url.pathname==='/auth/v1/otp')return route.fulfill({status:200,headers,contentType:'application/json',body:'{}'});
   if(url.pathname==='/auth/v1/user')return route.fulfill({status:200,headers,contentType:'application/json',body:JSON.stringify({id:owner,aud:'authenticated',role:'authenticated',email:'owner@example.test',app_metadata:{provider:'email',providers:['email']},user_metadata:{},created_at:'2026-01-01T00:00:00Z'})});
   if(url.pathname==='/auth/v1/logout')return route.fulfill({status:204,headers});
   return route.abort();
  });
 };
 await check('email request uses exact Moa callback without signup or automatic link-paste form',async()=>{
  const seen=[];await mockAuth(cx,seen);
  await page.getByRole('button',{name:'내 모아 열기',exact:true}).click();
  if(!await page.locator('#gateEmail').isVisible())await page.getByText('다른 방법으로 로그인',{exact:true}).click();await page.locator('#gateEmail').fill('owner@example.test');
  await page.getByRole('button',{name:'로그인 메일 받기',exact:true}).click();
  await page.waitForFunction(()=>document.querySelector('#gateNotice').textContent.includes('모아로 돌아와요'));
  const sent=seen.find(x=>x.path==='/auth/v1/otp'&&x.method==='POST');assert.ok(sent);assert.equal(sent.redirect,'https://moa-diary-web.pages.dev/__moa_auth_callback');assert.equal(sent.body.create_user,false);
  assert.equal(await page.locator('#gateVerifyForm').isVisible(),false);await page.keyboard.press('Escape');
 });
 await check('Google PKCE account selection returns to protected app without persisting provider credentials',async()=>{
  const context=await browser.newContext(),seen=[];await mockAuth(context,seen);await context.route(base+'/app.js',route=>route.fulfill({contentType:'text/javascript',body:'// auth fixture'}));
  const cp=await context.newPage();cp.on('pageerror',e=>errors.push(e.message));await cp.goto(base+'/__moa_access');
  await cp.getByRole('button',{name:'내 모아 열기',exact:true}).click();await cp.locator('#gateGoogle').click();await cp.waitForURL(authOrigin+'/auth/v1/authorize?**');
  const start=new URL(cp.url());assert.equal(start.searchParams.get('provider'),'google');assert.equal(start.searchParams.get('prompt'),'select_account');assert.equal(start.searchParams.get('redirect_to'),'https://moa-diary-web.pages.dev/__moa_auth_callback');assert.equal(start.searchParams.get('code_challenge_method'),'s256');assert.match(start.searchParams.get('code_challenge'),/^[-\w]{43}$/);
  await cp.goto(base+'/__moa_auth_callback?code=synthetic-auth-code');await cp.waitForURL(base+'/');await cp.locator('#entryForm').waitFor({state:'attached'});
  const exchange=seen.find(x=>x.path==='/auth/v1/token');assert.equal(exchange.body.auth_code,'synthetic-auth-code');assert.ok(exchange.body.code_verifier);
  const {createHash}=await import('node:crypto');assert.equal(createHash('sha256').update(exchange.body.code_verifier).digest('base64url'),start.searchParams.get('code_challenge'));
  assert.equal(new URL(cp.url()).search,'');assert.equal(new URL(cp.url()).hash,'');
  const persisted=await cp.evaluate(()=>({local:{...localStorage},temporary:{...sessionStorage}}));assert.equal(JSON.parse(persisted.local['moa-auth-v1']).user.id,owner);assert.ok(!JSON.stringify(persisted).includes('synthetic-provider-secret'));assert.ok(!persisted.local['moa-google-auth-v1']);assert.ok(!persisted.temporary['moa-google-auth-v1']);assert.ok(!persisted.temporary['moa-google-auth-v1-code-verifier']);
  assert.equal((await context.request.get(base+'/app.js')).status(),200);assert.ok((await context.cookies()).find(x=>x.name==='__Host-moa_gate')?.httpOnly);
  await cp.reload();assert.equal((await context.request.get(base+'/app.js')).status(),200);await context.close();
 });
 await check('Google missing proof and denied consent clean URL without exchanging or clearing existing login',async()=>{
  const context=await browser.newContext(),seen=[];await mockAuth(context,seen);const cp=await context.newPage();cp.on('pageerror',e=>errors.push(e.message));
  await cp.goto(base+'/__moa_auth_callback?code=unrequested-code');await cp.waitForFunction(()=>document.querySelector('#gateNotice').textContent.includes('같은 브라우저'));
  assert.equal(new URL(cp.url()).search,'');assert.ok(!seen.some(x=>x.path==='/auth/v1/token'));assert.equal(await cp.evaluate(()=>localStorage.getItem('moa-auth-v1')),null);assert.equal((await context.request.get(base+'/app.js')).status(),401);
  assert.equal((await context.request.post(base+'/__moa_session',{headers:{Origin:base},data:{accessToken:token}})).status(),204);const oldCookie=(await context.cookies()).find(x=>x.name==='__Host-moa_gate').value;
  await cp.goto(base+'/__moa_auth_callback?error=access_denied&error_description=UNTRUSTED_SECRET');await cp.waitForFunction(()=>document.querySelector('#gateNotice').textContent.includes('다시 눌러'));
  assert.equal(new URL(cp.url()).search,'');assert.ok(!(await cp.locator('#gateNotice').textContent()).includes('UNTRUSTED_SECRET'));assert.equal((await context.cookies()).find(x=>x.name==='__Host-moa_gate').value,oldCookie);assert.equal((await context.request.get(base+'/app.js')).status(),200);await context.close();
 });
 await check('Google foreign identity cannot replace an existing owner session after code exchange',async()=>{
  const foreign=['eyJhbGciOiJIUzI1NiJ9',Buffer.from(JSON.stringify({sub:'22222222-2222-4222-8222-222222222222',role:'authenticated',exp})).toString('base64url'),Buffer.from('synthetic').toString('base64url')].join('.');
  const context=await browser.newContext(),seen=[];await mockAuth(context,seen,foreign);const cp=await context.newPage();cp.on('pageerror',e=>errors.push(e.message));await cp.goto(base+'/__moa_access');
  await cp.getByRole('button',{name:'내 모아 열기',exact:true}).click();await cp.locator('#gateGoogle').click();await cp.waitForURL(authOrigin+'/auth/v1/authorize?**');
  assert.equal((await context.request.post(base+'/__moa_session',{headers:{Origin:base},data:{accessToken:token}})).status(),204);const oldCookie=(await context.cookies()).find(x=>x.name==='__Host-moa_gate').value;
  await context.addInitScript(session=>{if(location.origin==='http://127.0.0.1:'+session.port)localStorage.setItem('moa-auth-v1',JSON.stringify({access_token:session.token,refresh_token:'old-owner-refresh',expires_at:session.exp,token_type:'bearer',user:{id:session.owner}}));},{port:server.address().port,token,exp,owner});
  await cp.goto(base+'/__moa_auth_callback?code=foreign-code');await cp.waitForFunction(()=>document.querySelector('#gateNotice').textContent.includes('소유자 계정'));
  assert.equal(new URL(cp.url()).search,'');assert.equal((await context.cookies()).find(x=>x.name==='__Host-moa_gate').value,oldCookie);assert.equal(await cp.evaluate(()=>JSON.parse(localStorage.getItem('moa-auth-v1')).user.id),owner);assert.equal((await context.request.get(base+'/app.js')).status(),200);assert.ok(!await cp.evaluate(()=>JSON.stringify({...localStorage,...sessionStorage}).includes('synthetic-provider-secret')));await context.close();
 });
 await check('email callback cleans credentials and establishes SDK session plus private gate',async()=>{
  const context=await browser.newContext(),seen=[];await mockAuth(context,seen);
  // The real private document/gate are exercised; prevent unrelated repository
  // startup requests while checking the authentication handoff itself.
  await context.route(base+'/app.js',route=>route.fulfill({contentType:'text/javascript',body:'// private app startup omitted in auth-only fixture'}));
  const cp=await context.newPage();cp.on('pageerror',e=>errors.push(e.message));
  await cp.goto(base+'/__moa_auth_callback#'+new URLSearchParams({access_token:token,refresh_token:'synthetic-refresh',token_type:'bearer',type:'magiclink'}));
  try{await cp.waitForURL(base+'/',{timeout:8000});}catch(e){console.log('Callback diagnostic',JSON.stringify({path:new URL(cp.url()).pathname,notice:await cp.locator('#gateNotice').textContent().catch(()=>''),authPaths:seen.map(x=>x.path),cookies:(await context.cookies()).map(x=>({name:x.name,secure:x.secure})),errors}));throw e;}await cp.locator('#entryForm').waitFor({state:'attached'});
  assert.equal(new URL(cp.url()).hash,'');const session=await cp.evaluate(()=>JSON.parse(localStorage.getItem('moa-auth-v1')||'null'));assert.equal(session.user.id,owner);assert.equal(session.refresh_token,'synthetic-refresh');
  const cookie=(await context.cookies()).find(c=>c.name==='__Host-moa_gate');assert.ok(cookie?.secure&&cookie.httpOnly&&cookie.sameSite==='Strict');assert.equal((await context.request.get(base+'/app.js')).status(),200);assert.ok(seen.some(x=>x.path==='/auth/v1/user'));
  // A rejected return URL must not sign out a previously authenticated owner.
  const oldCookie=cookie.value,priorUserRequests=seen.filter(x=>x.path==='/auth/v1/user').length;
  const rejected=await context.newPage();
  const foreign=['eyJhbGciOiJIUzI1NiJ9',Buffer.from(JSON.stringify({sub:'22222222-2222-4222-8222-222222222222',role:'authenticated',exp})).toString('base64url'),Buffer.from('synthetic').toString('base64url')].join('.');
  await rejected.goto(base+'/__moa_auth_callback#'+new URLSearchParams({access_token:foreign,refresh_token:'foreign-refresh',token_type:'bearer',type:'magiclink'}));
  await rejected.waitForFunction(()=>document.querySelector('#gateNotice').textContent.includes('소유자 계정'));
  assert.equal((await context.cookies()).find(c=>c.name==='__Host-moa_gate')?.value,oldCookie);
  assert.equal(await rejected.evaluate(()=>JSON.parse(localStorage.getItem('moa-auth-v1')).user.id),owner);
  assert.equal((await context.request.get(base+'/app.js')).status(),200);assert.equal(seen.filter(x=>x.path==='/auth/v1/user').length,priorUserRequests);
  await context.close();
 });
 await check('expired and non-owner callbacks clean URL, show retry and keep private app locked',async()=>{
  const context=await browser.newContext(),seen=[];await mockAuth(context,seen);let cp=await context.newPage();cp.on('pageerror',e=>errors.push(e.message));
  await cp.goto(base+'/__moa_auth_callback#error=access_denied&error_code=otp_expired&error_description=UNTRUSTED_SECRET');
  await cp.waitForFunction(()=>document.querySelector('#gateDialog').open&&document.querySelector('#gateNotice').textContent.includes(' 만료'));
  assert.equal(new URL(cp.url()).hash,'');assert.ok(!(await cp.locator('#gateNotice').textContent()).includes('UNTRUSTED_SECRET'));assert.equal((await context.request.get(base+'/app.js')).status(),401);
  await cp.close();cp=await context.newPage();cp.on('pageerror',e=>errors.push(e.message));
  const other=['eyJhbGciOiJIUzI1NiJ9',Buffer.from(JSON.stringify({sub:'22222222-2222-4222-8222-222222222222',role:'authenticated',exp})).toString('base64url'),Buffer.from('synthetic').toString('base64url')].join('.');
  await cp.goto(base+'/__moa_auth_callback#'+new URLSearchParams({access_token:other,refresh_token:'other-refresh',token_type:'bearer',type:'magiclink'}));
  await cp.waitForFunction(()=>document.querySelector('#gateNotice').textContent.includes('소유자 계정'));
  assert.equal(new URL(cp.url()).hash,'');assert.equal(await cp.evaluate(()=>localStorage.getItem('moa-auth-v1')),null);assert.equal((await context.request.get(base+'/app.js')).status(),401);assert.ok(!seen.some(x=>x.path==='/auth/v1/user'));
  await context.close();
 });
 await check('synthetic owner login establishes HttpOnly cookie and unlocks exact packaged application',async()=>{const r=await cx.request.post(base+'/__moa_session',{headers:{Origin:base},data:{accessToken:token}});assert.equal(r.status(),204);const cookie=(await cx.cookies()).find(c=>c.name==='__Host-moa_gate');assert.ok(cookie?.secure&&cookie.httpOnly&&cookie.sameSite==='Strict');const app=await cx.request.get(base+'/index.html');assert.equal(app.status(),200);assert.match(await app.text(),/id="entryForm"/);assert.equal((await cx.request.get(base+'/app.js')).status(),200);assert.deepEqual(await (await cx.request.get(base+'/build-manifest.json')).json(),manifest);});
 await check('logout removes access immediately; public static fallback contains no application',async()=>{assert.equal((await cx.request.post(base+'/__moa_logout',{headers:{Origin:base}})).status(),204);assert.equal((await cx.request.get(base+'/app.js')).status(),401);assert.ok(!(await readFile(new URL('dist-cloudflare/index.html',root),'utf8')).includes('entryForm'));});
 assert.deepEqual(errors,[]);await cx.close();
}finally{await browser?.close();await new Promise(r=>server.close(r));globalThis.fetch=realFetch;await writeFile(new URL('qa-evidence/owner-gateway-browser-results.json',root),JSON.stringify({checkedAt:new Date().toISOString(),manifest,authentication:'mocked RPC / synthetic JWT; not real Supabase login',results,errors},null,2));}
