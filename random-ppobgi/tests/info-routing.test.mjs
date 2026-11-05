import test from 'node:test';
import assert from 'node:assert/strict';
import { onRequest } from '../functions/_middleware.js';
import { readFile } from 'node:fs/promises';

test('all language destinations are ordinary HTML links without running scripts',async()=>{
  const html=await readFile(new URL('../index.html',import.meta.url),'utf8');
  const directory=html.match(/<details id="languageDirectory"[\s\S]*?<\/details>/)?.[0];
  assert.ok(directory,'language directory must be in the initial document');
  for(const lang of ['ko','en','ja','es','zh','fr','de','pt','id','hi','pl','it','nl','tr','vi','th','ar']){
    const href=lang==='ko'?'/':`/${lang}/`;
    assert.ok(directory.includes(`<a href="${href}" hreflang="${lang}"`),lang);
  }
  assert.doesNotMatch(directory,/<details[^>]*\bopen\b/,'keep mobile footer compact initially');
});

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

test('privacy disclosures survive foreign query links without client-side replacement',async()=>{
  const policy=await readFile(new URL('../privacy/index.html',import.meta.url),'utf8');
  for(const lang of ['ko','en','ja','ar']){
    const response=await onRequest({request:new Request(`https://random-ppobgi.pages.dev/privacy/?lang=${lang}`),next:()=>new Response(policy,{headers:{'content-type':'text/html; charset=utf-8'}})});
    const body=await response.text();
    assert.equal(response.status,200);
    assert.match(body,/Google AdSense/);
    assert.match(body,/https:\/\/myadcenter.google.com\//);
    assert.match(body,/https:\/\/optout.aboutads.info\//);
    assert.match(body,/id="en" lang="en"/);
    assert.doesNotMatch(body,/info-i18n.js/);
  }
});
