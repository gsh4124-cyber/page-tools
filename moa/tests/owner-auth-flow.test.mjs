import test from 'node:test';
import assert from 'node:assert/strict';
import {OWNER_CALLBACK_PATH,OWNER_EMAIL_REDIRECT,readOwnerCallback} from '../tools/owner-auth-flow.mjs';
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
