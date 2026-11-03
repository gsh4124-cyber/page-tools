import test from 'node:test';
import assert from 'node:assert/strict';
import { onRequest } from '../functions/_middleware.js';

test('all previously published foreign information links reach their localized document',async()=>{
  const languages=['en','ja','es','zh','fr','de','pt','id','hi','pl','it','nl','tr','vi','th','ar'];
  for(const lang of languages)for(const document of ['about','guide','privacy','terms','contact']){
    const response=await onRequest({request:new Request(`https://random-ppobgi.pages.dev/${lang}/${document}/?qa=1`),next:()=>new Response('wrong homepage')});
    assert.equal(response.status,308,`${lang}/${document}`);
    const target=new URL(response.headers.get('location'));
    assert.equal(target.pathname,`/${document}/`);
    assert.equal(target.searchParams.get('lang'),lang);
    assert.equal(target.searchParams.get('qa'),'1');
  }
});
