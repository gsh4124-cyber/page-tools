import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {PGlite} from '@electric-sql/pglite';
import {empty} from '../core.mjs';
const A='aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',B='bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',M='cccccccc-cccc-4ccc-8ccc-cccccccccccc';
test('real PostgreSQL: migration, auth, ownership, CAS, shape and private storage RLS',async t=>{
 const pg=new PGlite();
 await pg.exec(`create role anon nologin; create role authenticated nologin;
 create schema auth; create table auth.users(id uuid primary key);
 create function auth.uid() returns uuid language sql stable as $$ select (current_setting('request.jwt.claims',true)::jsonb->>'sub')::uuid $$;
 create function auth.jwt() returns jsonb language sql stable as $$ select coalesce(nullif(current_setting('request.jwt.claims',true),''),'{}')::jsonb $$;
 grant usage on schema auth to anon,authenticated;grant execute on all functions in schema auth to anon,authenticated;
 create schema storage; create table storage.buckets(id text primary key,name text,public boolean,file_size_limit bigint,allowed_mime_types text[]);
 create table storage.objects(id uuid primary key default gen_random_uuid(),bucket_id text,name text,metadata jsonb);
 alter table storage.objects enable row level security;
 create function storage.foldername(name text) returns text[] language sql immutable as $$select (string_to_array(name,'/'))[1:array_length(string_to_array(name,'/'),1)-1]$$;
 grant usage on schema storage to anon,authenticated;grant select,insert,update,delete on storage.objects to anon,authenticated;grant execute on function storage.foldername(text) to anon,authenticated;
 -- Existing broad permissive policies must not expose Moa's bucket.
 create policy preexisting_broad on storage.objects for all to public using(true) with check(true);
 insert into auth.users values('${A}'),('${B}');`);
 await pg.exec(await readFile(new URL('../db/schema.sql',import.meta.url),'utf8'));
 async function as(role,user,fn,anonymous=false){await pg.exec('begin');try{await pg.query("select set_config('request.jwt.claims',$1,true)",[JSON.stringify({sub:user,is_anonymous:anonymous})]);await pg.exec(`set local role ${role}`);const value=await fn();await pg.exec('commit');return value;}catch(e){await pg.exec('rollback');throw e;}}
 const commit=(v,d)=>pg.query('select public.moa_commit($1,$2::jsonb) as version',[v,JSON.stringify(d)]);
 await t.test('owner can create and read; same expected version cannot overwrite',async()=>{assert.equal((await as('authenticated',A,()=>commit(0,empty()))).rows[0].version,1);await assert.rejects(()=>as('authenticated',A,()=>commit(0,empty())),/STALE_WRITE/);assert.equal((await as('authenticated',A,()=>commit(1,{...empty(),habits:['산책']}))).rows[0].version,2);await assert.rejects(()=>as('authenticated',A,()=>commit(1,empty())),/STALE_WRITE/);});
 await t.test('other user cannot read/update or reassign ownership',async()=>{assert.equal((await as('authenticated',B,()=>pg.query('select * from public.moa_documents'))).rows.length,0);assert.equal((await as('authenticated',B,()=>pg.query('update public.moa_documents set version=99 returning *'))).rows.length,0);await assert.rejects(()=>as('authenticated',A,()=>pg.query('update public.moa_documents set user_id=$1 returning *',[B])),/row-level security/);});
 await t.test('anon and anonymous sign-in cannot access private documents',async()=>{await assert.rejects(()=>as('anon',null,()=>pg.query('select * from public.moa_documents')),/permission denied/);await assert.rejects(()=>as('anon',null,()=>commit(0,empty())),/permission denied/);await assert.rejects(()=>as('authenticated',B,()=>commit(0,empty()),true),/AUTH_REQUIRED/);});
 const entry={id:'test',title:'기록',content:'text',category:'일상',recordDate:'2026-11-19',created:'2026-11-19T09:00:00Z',visibility:'private',decoration:'mint',sticker:'',stickerX:0,stickerY:0,mediaKeys:[A+'/'+M]};
 await t.test('database rejects invalid dates, oversized text and forged media owner',async()=>{for(const change of [e=>e.recordDate='2026-02-31',e=>e.mediaKeys=[B+'/'+M],e=>e.content='a'.repeat(20001),e=>e.visibility='public',e=>delete e.title]){const e=structuredClone(entry);change(e);await assert.rejects(()=>as('authenticated',A,()=>commit(2,{...empty(),entries:[e]})),/moa_document_shape/);}await as('authenticated',A,()=>commit(2,{...empty(),entries:[entry]}));});
 await t.test('bucket is private, MIME restricted, 25MB capped',async()=>{const b=(await pg.query("select * from storage.buckets where id='moa-private'")).rows[0];assert.equal(b.public,false);assert.equal(Number(b.file_size_limit),26214400);assert.ok(!b.allowed_mime_types.includes('image/svg+xml'));});
 await t.test('storage restricts reads, writes, deletes even with broad legacy policy',async()=>{await as('authenticated',A,()=>pg.query('insert into storage.objects(bucket_id,name) values($1,$2)',['moa-private',A+'/'+M]));assert.equal((await as('authenticated',A,()=>pg.query('select * from storage.objects'))).rows.length,1);for(const [role,user,anon] of [['anon',null,false],['authenticated',B,false],['authenticated',A,true]]){assert.equal((await as(role,user,()=>pg.query('select * from storage.objects'),anon)).rows.length,0);assert.equal((await as(role,user,()=>pg.query('delete from storage.objects returning *'),anon)).rows.length,0);await assert.rejects(()=>as(role,user,()=>pg.query('insert into storage.objects(bucket_id,name) values($1,$2)',['moa-private',A+'/'+M]),anon),/row-level security/);}assert.equal((await as('authenticated',A,()=>pg.query('delete from storage.objects returning *'))).rows.length,1);});
 await t.test('media ledger enforces quota, real byte metadata, referenced file retention and REST writes',async()=>{
  await as('authenticated',A,()=>commit(3,empty()));
  await pg.exec(await readFile(new URL('../supabase/migrations/20261120010940_moa_media_budget.sql',import.meta.url),'utf8'));
  await pg.exec(await readFile(new URL('../supabase/migrations/20261120015919_moa_upload_probe_compatibility.sql',import.meta.url),'utf8'));
  const reserve=async(bytes=25*1024*1024)=> (await as('authenticated',A,()=>pg.query("select public.moa_reserve_media($1,'image/png') as path",[bytes]))).rows[0].path;
  const upload=(path,bytes)=>as('authenticated',A,()=>pg.query("insert into storage.objects(bucket_id,name,metadata) values('moa-private',$1,$2)",[path,{size:bytes,mimetype:'image/png'}]));
  const p=await reserve();await assert.rejects(()=>upload(p,1),/MOA_UPLOAD_SIZE_MISMATCH|row-level security/);await upload(p,25*1024*1024);
  // Storage finishes as a privileged role. The scoped trigger must also reject
  // under-declared files when caller RLS is bypassed by its internal transaction.
  await assert.rejects(()=>pg.query("insert into storage.objects(bucket_id,name,metadata) values('moa-private',$1,$2)",[p,{size:1,mimetype:'image/png'}]),/MOA_UPLOAD_SIZE_MISMATCH/);
  const q=await reserve(23*1024*1024);await upload(q,23*1024*1024);
  const doc={...empty(),entries:[{...entry,mediaKeys:[p,q]}]};await as('authenticated',A,()=>commit(4,doc));
  assert.equal(Number((await as('authenticated',A,()=>pg.query('select public.moa_storage_usage() as u'))).rows[0].u.active),48*1024*1024);
  assert.equal((await as('authenticated',A,()=>pg.query('delete from storage.objects returning *'))).rows.length,0);
  assert.equal((await as('authenticated',A,()=>pg.query('delete from public.moa_media returning *'))).rows.length,0);
  assert.equal((await as('authenticated',A,()=>pg.query("update storage.objects set metadata='{}' returning *"))).rows.length,0);
  assert.equal((await as('authenticated',B,()=>pg.query('select * from public.moa_media'))).rows.length,0);
  await assert.rejects(()=>as('anon',null,()=>pg.query('select public.moa_storage_usage()')),/permission denied/);
  const third=await reserve(1);await upload(third,1);const over={...empty(),entries:[{...entry,mediaKeys:[p,q,third]}]};
  await assert.rejects(()=>as('authenticated',A,()=>commit(5,over)),/MOA_ACTIVE_LIMIT/);
  await assert.rejects(()=>as('authenticated',A,()=>pg.query('update public.moa_documents set document=$1',[over])),/MOA_ACTIVE_LIMIT/);
  await assert.rejects(()=>as('authenticated',A,()=>commit(5,{...empty(),entries:[{...entry,mediaKeys:[A+'/'+M]}]})),/MOA_MEDIA_MISSING/);
  await reserve(25*1024*1024);await reserve(23*1024*1024-1);
  await assert.rejects(()=>reserve(1),/MOA_STAGING_LIMIT/);
  assert.equal((await as('authenticated',A,()=>pg.query('select * from public.moa_unused_media()'))).rows.length,0);
  await pg.query("update public.moa_media set created_at=now()-interval '25 hours'");
  const unused=(await as('authenticated',A,()=>pg.query('select * from public.moa_unused_media()'))).rows;
  assert.equal(unused.length,3);assert.ok(!unused.some(x=>x.path===p||x.path===q));
  await as('authenticated',A,()=>commit(5,empty()));
  assert.equal((await as('authenticated',A,()=>pg.query('delete from storage.objects returning *'))).rows.length,3);
  assert.equal((await as('authenticated',A,()=>pg.query('delete from public.moa_media returning *'))).rows.length,5);
  // Restrictive policies must return true for other buckets, including the anon role.
  await as('anon',null,()=>pg.query("insert into storage.objects(bucket_id,name) values('existing-product','untouched')"));
  assert.equal((await as('anon',null,()=>pg.query("update storage.objects set name='preserved' where bucket_id='existing-product' returning *"))).rows.length,1);
  assert.equal((await as('anon',null,()=>pg.query("delete from storage.objects where bucket_id='existing-product' returning *"))).rows.length,1);
 });
 await pg.close();
});
