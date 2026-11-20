-- Moa-only budget ledger. File operations continue through the Storage API.
begin;
create table public.moa_media (
 path text primary key,
 user_id uuid not null references auth.users(id) on delete cascade,
 bytes bigint not null check(bytes between 1 and 26214400),
 mime text not null check(mime in ('image/jpeg','image/png','image/webp','image/gif','video/mp4','video/webm','video/quicktime')),
 created_at timestamptz not null default now(),
 check(path ~ ('^'||user_id::text||'/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'))
);
create index moa_media_owner on public.moa_media(user_id);
alter table public.moa_media enable row level security;
alter table public.moa_media force row level security;
revoke all on public.moa_media from public,anon,authenticated;
grant select,insert,delete on public.moa_media to authenticated;
create policy moa_media_ledger_read on public.moa_media for select to authenticated using(user_id=(select auth.uid()) and coalesce((select auth.jwt()->>'is_anonymous'),'false')='false');
create policy moa_media_ledger_insert on public.moa_media for insert to authenticated with check(user_id=(select auth.uid()) and coalesce((select auth.jwt()->>'is_anonymous'),'false')='false');

create function public.moa_media_lock(owner_id uuid) returns void language plpgsql volatile security invoker set search_path='' as $$
begin
 if owner_id is null or owner_id is distinct from auth.uid() or coalesce(auth.jwt()->>'is_anonymous','false')<>'false' then raise exception 'AUTH_REQUIRED'; end if;
 perform pg_advisory_xact_lock(hashtextextended('moa-media:'||owner_id::text,0));
end $$;
create function public.moa_media_budget() returns trigger language plpgsql security invoker set search_path='' as $$
begin
 perform public.moa_media_lock(new.user_id);
 if (select coalesce(sum(bytes),0) from public.moa_media where user_id=new.user_id)+new.bytes>100663296
 or (select count(*) from public.moa_media where user_id=new.user_id)>=500 then raise exception 'MOA_STAGING_LIMIT'; end if;
 new.created_at:=now(); return new;
end $$;
create trigger moa_media_budget before insert on public.moa_media for each row execute function public.moa_media_budget();

create function public.moa_reserve_media(p_bytes bigint,p_mime text) returns text language plpgsql security invoker set search_path='' as $$
declare p text:=auth.uid()::text||'/'||gen_random_uuid()::text;
begin
 insert into public.moa_media(path,user_id,bytes,mime) values(p,auth.uid(),p_bytes,p_mime);
 return p;
end $$;
-- This restrictive policy also constrains any broad policies introduced by other products.
create function public.moa_allow_upload(bucket text,p text,meta jsonb) returns boolean language plpgsql volatile security invoker set search_path='' as $$
begin
 if bucket<>'moa-private' then return true; end if;
 if auth.uid() is null or coalesce(auth.jwt()->>'is_anonymous','false')<>'false' then return false; end if;
 perform public.moa_media_lock(auth.uid());
 return exists(select 1 from public.moa_media m where m.path=p and m.user_id=auth.uid()
 and m.bytes=(meta->>'size')::bigint and m.mime=meta->>'mimetype');
exception when invalid_text_representation or numeric_value_out_of_range then return false;
end $$;
create policy moa_media_reserved_upload on storage.objects as restrictive for insert to public with check(public.moa_allow_upload(bucket_id,name,metadata));
create policy moa_media_no_overwrite on storage.objects as restrictive for update to public using(bucket_id<>'moa-private') with check(bucket_id<>'moa-private');

create function public.moa_media_referenced(p text) returns boolean language sql stable security invoker set search_path='' as $$
 select exists(select 1 from public.moa_documents d, jsonb_array_elements(d.document->'entries') e, jsonb_array_elements_text(e->'mediaKeys') k where d.user_id=auth.uid() and k=p)
$$;
create function public.moa_allow_delete(bucket text,p text) returns boolean language plpgsql volatile security invoker set search_path='' as $$
begin
 if bucket<>'moa-private' then return true; end if;
 if auth.uid() is null or coalesce(auth.jwt()->>'is_anonymous','false')<>'false' then return false; end if;
 perform public.moa_media_lock(auth.uid());
 return not public.moa_media_referenced(p);
end $$;
create policy moa_media_keep_referenced on storage.objects as restrictive for delete to public using(public.moa_allow_delete(bucket_id,name));
create function public.moa_media_releasable(p text) returns boolean language plpgsql volatile security invoker set search_path='' as $$
begin
 perform public.moa_media_lock(auth.uid());
 return not public.moa_media_referenced(p) and not exists(select 1 from storage.objects where bucket_id='moa-private' and name=p);
end $$;
create policy moa_media_ledger_delete on public.moa_media for delete to authenticated using(user_id=(select auth.uid()) and public.moa_media_releasable(path));

-- Enforce on the table too: direct REST/GraphQL writes cannot bypass RPC validation.
create function public.moa_document_media_budget() returns trigger language plpgsql security invoker set search_path='' as $$
declare total bigint; wanted integer; found integer;
begin
 perform public.moa_media_lock(new.user_id);
 if not public.moa_document_valid(new.document,new.user_id) then raise exception 'moa_document_shape'; end if;
 with keys as (select distinct k from jsonb_array_elements(new.document->'entries') e,jsonb_array_elements_text(e->'mediaKeys') k)
 select count(*),count(m.path),coalesce(sum(m.bytes),0) into wanted,found,total from keys
 left join public.moa_media m on m.path=keys.k and m.user_id=new.user_id
 and exists(select 1 from storage.objects o where o.bucket_id='moa-private' and o.name=m.path
 and (o.metadata->>'size')::bigint=m.bytes and o.metadata->>'mimetype'=m.mime);
 if wanted<>found then raise exception 'MOA_MEDIA_MISSING'; end if;
 if total>50331648 then raise exception 'MOA_ACTIVE_LIMIT'; end if;
 return new;
end $$;
create trigger moa_document_media_budget before insert or update on public.moa_documents for each row execute function public.moa_document_media_budget();

create function public.moa_storage_usage() returns jsonb language sql stable security invoker set search_path='' as $$
 select jsonb_build_object('reserved',coalesce(sum(bytes),0),'count',count(*),'active',coalesce(sum(bytes) filter(where public.moa_media_referenced(path)),0),'activeLimit',50331648,'stagingLimit',100663296,'fileLimit',500)
 from public.moa_media where user_id=auth.uid()
$$;
create function public.moa_unused_media() returns table(path text,bytes bigint,created_at timestamptz) language sql stable security invoker set search_path='' as $$
 select m.path,m.bytes,m.created_at from public.moa_media m where m.user_id=auth.uid() and m.created_at<now()-interval '24 hours' and not public.moa_media_referenced(m.path)
$$;

revoke all on function public.moa_media_lock(uuid),public.moa_media_budget(),public.moa_reserve_media(bigint,text),public.moa_media_referenced(text),public.moa_media_releasable(text),public.moa_document_media_budget(),public.moa_storage_usage(),public.moa_unused_media() from public,anon;
grant execute on function public.moa_media_lock(uuid),public.moa_media_budget(),public.moa_reserve_media(bigint,text),public.moa_media_referenced(text),public.moa_media_releasable(text),public.moa_document_media_budget(),public.moa_storage_usage(),public.moa_unused_media() to authenticated;
revoke all on function public.moa_allow_upload(text,text,jsonb),public.moa_allow_delete(text,text) from public;
grant execute on function public.moa_allow_upload(text,text,jsonb),public.moa_allow_delete(text,text) to anon,authenticated;
commit;
