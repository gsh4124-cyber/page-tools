// Manually invoked against the approved existing project; secrets through stdin only.
import {createInterface} from 'node:readline';
import {createClient} from '@supabase/supabase-js';
import assert from 'node:assert/strict';
import {writeFile} from 'node:fs/promises';
import {randomBytes} from 'node:crypto';
if(process.stdin.isTTY)process.stdin.setRawMode(true);
console.log('READY_FOR_CONFIG');
const input=createInterface({input:process.stdin,terminal:false});
const cfg=await new Promise(r=>input.once('line',line=>{input.close();process.stdin.pause();r(JSON.parse(line));}));
if(process.stdin.isTTY)process.stdin.setRawMode(false);
assert.equal(cfg.url,'https://afiqaibosavbjzkffggr.supabase.co');
const make=()=>createClient(cfg.url,cfg.key,{auth:{persistSession:false,autoRefreshToken:false,detectSessionInUrl:false}});
const c=make(),results=[];
const ok=r=>{if(r.error)throw Error(r.error.code||r.error.name||'AUTH_ERROR');return r.data;};
try{
 if(cfg.mode==='retire'){
  for(const u of cfg.users){const own=make(),d=ok(await own.auth.signInWithPassword({email:u.email,password:u.password}));assert.equal(d.user.id,u.id);assert.equal(d.user.user_metadata.moa_qa_run,u.qa_run);ok(await own.auth.updateUser({password:randomBytes(32).toString('base64url')}));ok(await own.auth.signOut({scope:'global'}));assert.ok((await make().auth.signInWithPassword({email:u.email,password:u.password})).error);results.push({check:'email QA account password discarded, old login denied, sessions globally signed out',status:'DONE'});}
 }else if(cfg.mode==='signup'){
  const r=await c.auth.signUp({email:cfg.email,password:cfg.password,options:{data:{moa_qa_run:cfg.run}}});
  results.push({check:'public signUp with owner QA mailbox alias',status:r.error?'BLOCKED':'DONE',code:r.error?.code||null,message:r.error?.message||null,id:r.data?.user?.id||null,sessionIssued:Boolean(r.data?.session),emailConfirmed:Boolean(r.data?.user?.email_confirmed_at)});
 }else if(cfg.mode==='resend'){
  ok(await c.auth.resend({type:'signup',email:cfg.email}));results.push({check:'resend signup email for the same unconfirmed QA account',status:'DONE'});
 }else if(cfg.mode==='verify'){
  const d=ok(await c.auth.verifyOtp({type:'signup',token_hash:cfg.tokenHash}));assert.ok(d.user.email_confirmed_at);assert.equal(d.user.email,cfg.email);results.push({check:'email confirmation through received message token',status:'DONE'});ok(await c.auth.signOut({scope:'global'}));
 }else{
  const d=ok(await c.auth.signInWithPassword({email:cfg.email,password:cfg.password}));assert.equal(ok(await c.auth.getUser()).user.id,d.user.id);const old=d.session;
  const refreshed=ok(await c.auth.refreshSession());assert.equal(refreshed.user.id,d.user.id);assert.ok(refreshed.session.refresh_token!==old.refresh_token);assert.equal(ok(await c.auth.getUser()).user.id,d.user.id);results.push({check:'real refresh token rotation and verified session continuity',status:'DONE'});
  const bad=await fetch(cfg.url+'/rest/v1/moa_documents?select=user_id',{headers:{apikey:cfg.key,Authorization:'Bearer invalid-expired-session'}});assert.equal(bad.status,401);results.push({check:'invalid access token rejected by hosted REST',status:'DONE'});
  const refresh=refreshed.session.refresh_token;ok(await c.auth.signOut({scope:'global'}));assert.ok((await make().auth.refreshSession({refresh_token:refresh})).error);results.push({check:'globally revoked refresh token cannot renew session',status:'DONE'});
 }
}catch(e){results.push({check:cfg.mode,status:'FAILED',code:e.message});process.exitCode=1;}
await writeFile(new URL('../qa-evidence/auth-'+cfg.mode+'.json',import.meta.url),JSON.stringify(results,null,2));console.log(JSON.stringify(results));
