-- Storage probes INSERT permissions before file metadata exists. A reservation is
-- required at that stage; validate server-reported bytes again at completion.
-- Scoped trigger: only moa-private, no metadata writes, no effect on other buckets.
-- Custom Storage triggers need revalidation after Supabase Storage upgrades.
begin;
create or replace function public.moa_allow_upload(bucket text,p text,meta jsonb) returns boolean language plpgsql volatile security invoker set search_path='' as $$
begin
 if bucket<>'moa-private' then return true; end if;
 if auth.uid() is null or coalesce(auth.jwt()->>'is_anonymous','false')<>'false' then return false; end if;
 perform public.moa_media_lock(auth.uid());
 return exists(select 1 from public.moa_media m where m.path=p and m.user_id=auth.uid()
 and (meta->>'size' is null or m.bytes=(meta->>'size')::bigint)
 and (meta->>'mimetype' is null or m.mime=meta->>'mimetype'));
exception when invalid_text_representation or numeric_value_out_of_range then return false;
end $$;
create function public.moa_storage_completed_budget() returns trigger language plpgsql security invoker set search_path='' as $$
declare m public.moa_media;
begin
 if new.bucket_id<>'moa-private' or new.metadata->>'size' is null then return new; end if;
 select * into m from public.moa_media where path=new.name;
 if not found then raise exception 'MOA_RESERVATION_REQUIRED'; end if;
 perform pg_advisory_xact_lock(hashtextextended('moa-media:'||m.user_id::text,0));
 -- Re-read after the lock: a concurrent release must not race completion.
 select * into m from public.moa_media where path=new.name;
 if not found or m.bytes<>(new.metadata->>'size')::bigint or m.mime is distinct from new.metadata->>'mimetype' then raise exception 'MOA_UPLOAD_SIZE_MISMATCH'; end if;
 return new;
end $$;
revoke all on function public.moa_storage_completed_budget() from public,anon,authenticated;
create trigger moa_storage_completed_budget before insert or update on storage.objects for each row when(new.bucket_id='moa-private') execute function public.moa_storage_completed_budget();
commit;
