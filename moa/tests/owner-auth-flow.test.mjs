import test from 'node:test';
import assert from 'node:assert/strict';
import {OWNER_CALLBACK_PATH,OWNER_EMAIL_REDIRECT,OWNER_GOOGLE_STORAGE_KEY,googleProofStorage,googleAuthorizeURL,readOwnerCallback} from '../tools/owner-auth-flow.mjs';
const origin='https://moa-diary-web.pages.dev';
const fragment='#access_token=header.claims.signature&refresh_token=refresh-fixture&token_type=bearer&type=magiclink';

test('email login has one exact production callback and parses a same-origin email session',()=>{
 assert.equal(OWNER_EMAIL_REDIRECT,origin+OWNER_CALLBACK_PATH);
 assert.deepEqual(readOwnerCallback(OWNER_EMAIL_REDIRECT+fragment,origin),{kind:'session',accessToken:'header.claims.signature',refreshToken:'refresh-fixture'});
 assert.equal(readOwnerCallback(origin+'/__moa_access'+fragment,origin).kind,'session');
 assert.equal(readOwnerCallback('http://127.0.0.1:1234'+OWNER_CALLBACK_PATH+fragment,'http://127.0.0.1:1234').kind,'session');
});

test('callback refuses foreign URLs, recovery flows, duplicate or incomplete/oversized credentials',()=>{
 for(const href of ['https://evil.test'+OWNER_CALLBACK_PATH+fragment,origin+'/unrelated'+fragment,'https://u:p@moa-diary-web.pages.dev'+OWNER_CALLBACK_PATH+fragment])assert.equal(readOwnerCallback(href,origin).kind,'none');
 for(const f of [fragment.replace('magiclink','recovery'),fragment.replace('bearer','other'),fragment+'&access_token=extra',fragment.replace('&refresh_token=refresh-fixture',''),fragment.replace('refresh-fixture','x'.repeat(2049)),fragment.replace('header.claims.signature','x'.repeat(3801))])assert.equal(readOwnerCallback(OWNER_EMAIL_REDIRECT+f,origin).kind,'error');
 assert.equal(readOwnerCallback(OWNER_EMAIL_REDIRECT,origin).kind,'none');
});

test('expired or provider-error callbacks produce fixed retry text without reflecting untrusted content',()=>{
 assert.match(readOwnerCallback(OWNER_EMAIL_REDIRECT+'#error=access_denied&error_code=otp_expired',origin).message,/만료/);
 const result=readOwnerCallback(OWNER_EMAIL_REDIRECT+'#error=%3Cscript%3E&error_description=SECRET_UNTRUSTED',origin);
 assert.equal(result.kind,'error');assert.ok(!JSON.stringify(result).includes('SECRET_UNTRUSTED'));assert.ok(!JSON.stringify(result).includes('<script>'));
});

test('Google code callbacks accept bounded single codes and refuse ambiguous token mixtures',()=>{
 assert.deepEqual(readOwnerCallback(OWNER_EMAIL_REDIRECT+'?code=auth-code',origin),{kind:'code',code:'auth-code'});
 assert.deepEqual(readOwnerCallback(OWNER_EMAIL_REDIRECT+'?code=auth-code&sb_flow_id=flow_id_123',origin),{kind:'code',code:'auth-code',flowId:'flow_id_123'});
 for(const query of ['?code=','?code=a&code=b','?code='+('a'.repeat(2049)),'?code=a&sb_flow_id=bad','?code=a&sb_flow_id=flow_id_123&sb_flow_id=other_id_123','?code=a'+fragment])assert.equal(readOwnerCallback(OWNER_EMAIL_REDIRECT+query,origin).kind,'error');
 assert.equal(readOwnerCallback(origin+'/__moa_access?code=a',origin).kind,'error');
 const error=readOwnerCallback(OWNER_EMAIL_REDIRECT+'?error=access_denied&error_description=UNTRUSTED',origin);assert.equal(error.kind,'error');assert.ok(!JSON.stringify(error).includes('UNTRUSTED'));
});

test('temporary Google storage persists PKCE proof only, never provider or candidate app sessions',()=>{
 const values=new Map(),storage={getItem:key=>values.get(key)??null,setItem:(key,value)=>values.set(key,value),removeItem:key=>values.delete(key)},proof=googleProofStorage(storage),key=OWNER_GOOGLE_STORAGE_KEY;
 for(const suffix of ['-code-verifier','-flows-code-verifier','-flow-flow_id_123-code-verifier']){proof.setItem(key+suffix,'proof');assert.equal(proof.getItem(key+suffix),'proof');proof.removeItem(key+suffix);assert.equal(proof.getItem(key+suffix),null);}
 for(const bad of [key,key+'-user','moa-auth-v1',key+'-flow-../private-code-verifier']){proof.setItem(bad,'candidate/provider-secret');assert.equal(proof.getItem(bad),null);assert.ok(!values.has(bad));}
 storage.setItem('moa-auth-v1','existing-owner');proof.removeItem('moa-auth-v1');assert.equal(storage.getItem('moa-auth-v1'),'existing-owner');
});

test('Google navigation stays on the configured provider with exact callback and PKCE S256',()=>{
 const project='https://afiqaibosavbjzkffggr.supabase.co',url=project+'/auth/v1/authorize?'+new URLSearchParams({provider:'google',redirect_to:OWNER_EMAIL_REDIRECT,code_challenge:'x'.repeat(43),code_challenge_method:'s256'});
 assert.equal(googleAuthorizeURL(url,project),url);
 for(const bad of [url.replace(project,'https://evil.test'),url.replace('provider=google','provider=github'),url.replace('method=s256','method=plain'),url.replace('/authorize?','/token?'),url.replace(encodeURIComponent(OWNER_EMAIL_REDIRECT),encodeURIComponent('https://evil.test')),url+'#secret'])assert.throws(()=>googleAuthorizeURL(bad,project));
});
