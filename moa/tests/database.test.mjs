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
 create table storage.objects(id uuid primary key default gen_random_uuid(),bucket_id text,name text);
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
 await pg.close();
});
