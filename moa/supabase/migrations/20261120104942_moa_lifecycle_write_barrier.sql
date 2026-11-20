-- Refresh account authorization after acquiring the shared withdrawal lock.
-- VOLATILE PL/pgSQL runs this SELECT with a fresh snapshot after a lock wait.
begin;
create or replace function public.moa_media_budget() returns trigger language plpgsql volatile security invoker set search_path='' as $$
declare v_moa_allowed boolean;
begin
 perform public.moa_media_lock(new.user_id);
 select moa_private.permitted('active') into v_moa_allowed;
 if not v_moa_allowed then raise exception 'MOA_ACCOUNT_CLOSED'; end if;
 if (select coalesce(sum(bytes),0) from public.moa_media where user_id=new.user_id)+new.bytes>100663296
 or (select count(*) from public.moa_media where user_id=new.user_id)>=500 then raise exception 'MOA_STAGING_LIMIT'; end if;
 new.created_at:=now(); return new;
end $$;
create or replace function public.moa_document_media_budget() returns trigger language plpgsql volatile security invoker set search_path='' as $$
declare v_moa_allowed boolean; total bigint; wanted integer; found integer;
begin
 perform public.moa_media_lock(new.user_id);
 select moa_private.permitted('active') into v_moa_allowed;
 if not v_moa_allowed then raise exception 'MOA_ACCOUNT_CLOSED'; end if;
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
commit;
