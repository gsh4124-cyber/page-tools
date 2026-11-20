import test from 'node:test';
import assert from 'node:assert/strict';
import {verificationToken} from '../media.mjs';
test('recovery links accept only the configured Auth origin, path, purpose and token',()=>{const origin='https://moa.supabase.co';assert.equal(verificationToken(origin+'/auth/v1/verify?type=recovery&token=abc_123',origin,'recovery'),'abc_123');for(const link of ['https://attacker.invalid/auth/v1/verify?type=recovery&token=abc',origin+'/auth/v1/verify?type=signup&token=abc',origin+'/other?type=recovery&token=abc',origin+'/auth/v1/verify?type=recovery&token=abc%20bad'])assert.throws(()=>verificationToken(link,origin,'recovery'));});
