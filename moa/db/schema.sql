-- Proposed hosted setup, NOT APPLIED. Run only after owner approval.
-- Additive Moa-only objects. Existing product tables, buckets and policies stay intact.
begin;

create function public.moa_document_valid(doc jsonb, owner_id uuid)
returns boolean language plpgsql immutable set search_path = '' as $$
declare e jsonb; h jsonb; item record; k jsonb; seen text[] := '{}'; d date;
begin
  if jsonb_typeof(doc) <> 'object' or octet_length(doc::text)>2097152
    or jsonb_typeof(doc->'entries') is distinct from 'array'
    or jsonb_typeof(doc->'habits') is distinct from 'array'
    or jsonb_typeof(doc->'checks') is distinct from 'object' then return false; end if;
  if jsonb_array_length(doc->'entries')>2000 or jsonb_array_length(doc->'habits')>100 then return false; end if;
  for h in select value from jsonb_array_elements(doc->'habits') loop
    if jsonb_typeof(h)<>'string' or length(h#>>'{}') not between 1 and 80 or btrim(h#>>'{}')='' or (h#>>'{}')=any(seen) then return false; end if;
    seen:=array_append(seen,h#>>'{}');
  end loop;
  if (select count(*) from jsonb_object_keys(doc->'checks'))>10000 then return false; end if;
  for item in select * from jsonb_each(doc->'checks') loop
    if item.key !~ '^\d{4}-\d{2}-\d{2}$' or item.key<'1900-01-01' or item.key>'2200-12-31' then return false; end if;
    d:=item.key::date;
    if jsonb_typeof(item.value)<>'array' or jsonb_array_length(item.value)>100 then return false; end if;
    seen:='{}';
    for h in select value from jsonb_array_elements(item.value) loop
      if jsonb_typeof(h)<>'string' or length(h#>>'{}') not between 1 and 80 or btrim(h#>>'{}')='' or (h#>>'{}')=any(seen) then return false; end if;
      seen:=array_append(seen,h#>>'{}');
    end loop;
  end loop;
  seen:='{}';
  for e in select value from jsonb_array_elements(doc->'entries') loop
    if jsonb_typeof(e)<>'object' or jsonb_typeof(e->'id') is distinct from 'string' or length(e->>'id') not between 1 and 100 or (e->>'id')=any(seen)
      or jsonb_typeof(e->'title') is distinct from 'string' or length(e->>'title') not between 1 and 100 or btrim(e->>'title')=''
      or jsonb_typeof(e->'content') is distinct from 'string' or length(e->>'content')>20000
      or coalesce(e->>'visibility','')<>'private'
      or coalesce(e->>'category','') not in ('일상','독서·생각','운동·수련','공부','창작','기타')
      or coalesce(e->>'decoration','') not in ('none','pink','lavender','mint','sunny','night','paper')
      or jsonb_typeof(e->'sticker') is distinct from 'string' or length(e->>'sticker')>24
      or jsonb_typeof(e->'stickerX') is distinct from 'number' or (e->>'stickerX')::numeric not between -30 and 230
      or jsonb_typeof(e->'stickerY') is distinct from 'number' or (e->>'stickerY')::numeric not between -15 and 200
      or jsonb_typeof(e->'recordDate') is distinct from 'string' or (e->>'recordDate') !~ '^\d{4}-\d{2}-\d{2}$'
      or (e->>'recordDate')<'1900-01-01' or (e->>'recordDate')>'2200-12-31'
      or jsonb_typeof(e->'created') is distinct from 'string' or length(e->>'created')>40
      or (e->>'created') !~ '^\d{4}-\d{2}-\d{2}T'
      or jsonb_typeof(e->'mediaKeys') is distinct from 'array' or jsonb_array_length(e->'mediaKeys')>6 then return false; end if;
    d:=(e->>'recordDate')::date;
    perform (e->>'created')::timestamptz;
    seen:=array_append(seen,e->>'id');
    for k in select value from jsonb_array_elements(e->'mediaKeys') loop
      if jsonb_typeof(k)<>'string' or (k#>>'{}') !~ ('^'||owner_id::text||'/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$') then return false; end if;
    end loop;
    if (select count(*) from jsonb_array_elements(e->'mediaKeys'))<>(select count(distinct value) from jsonb_array_elements(e->'mediaKeys')) then return false; end if;
  end loop;
  return true;
exception when others then return false;
end $$;

create table public.moa_documents (
  user_id uuid primary key references auth.users(id) on delete cascade,
  document jsonb not null,
  version integer not null default 1 check (version>0),
  updated_at timestamptz not null default now(),
  constraint moa_document_shape check (public.moa_document_valid(document,user_id))
);
alter table public.moa_documents enable row level security;
alter table public.moa_documents force row level security;
revoke all on public.moa_documents from public,anon,authenticated;
grant select,insert,update on public.moa_documents to authenticated;
create policy moa_read on public.moa_documents for select to authenticated
  using ((select auth.uid())=user_id and coalesce((select auth.jwt()->>'is_anonymous'),'false')='false');
create policy moa_insert on public.moa_documents for insert to authenticated
  with check ((select auth.uid())=user_id and coalesce((select auth.jwt()->>'is_anonymous'),'false')='false');
create policy moa_update on public.moa_documents for update to authenticated
  using ((select auth.uid())=user_id and coalesce((select auth.jwt()->>'is_anonymous'),'false')='false')
  with check ((select auth.uid())=user_id and coalesce((select auth.jwt()->>'is_anonymous'),'false')='false');

create function public.moa_commit(p_expected_version integer,p_document jsonb)
returns integer language plpgsql security invoker set search_path = '' as $$
declare new_version integer; owner_id uuid := auth.uid();
begin
  if owner_id is null or coalesce(auth.jwt()->>'is_anonymous','false')<>'false' then raise exception 'AUTH_REQUIRED'; end if;
  if p_expected_version is null or p_expected_version<0 or p_document is null then raise exception 'INVALID_INPUT'; end if;
  if p_expected_version=0 then
    insert into public.moa_documents(user_id,document,version) values(owner_id,p_document,1)
      on conflict(user_id) do nothing returning version into new_version;
  else
    update public.moa_documents set document=p_document,version=version+1,updated_at=now()
      where user_id=owner_id and version=p_expected_version returning version into new_version;
  end if;
  if new_version is null then raise exception 'STALE_WRITE'; end if;
  return new_version;
end $$;
revoke all on function public.moa_commit(integer,jsonb) from public,anon;
grant execute on function public.moa_commit(integer,jsonb) to authenticated;
revoke all on function public.moa_document_valid(jsonb,uuid) from public,anon;
grant execute on function public.moa_document_valid(jsonb,uuid) to authenticated;

insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types)
values ('moa-private','moa-private',false,26214400,array['image/jpeg','image/png','image/webp','image/gif','video/mp4','video/webm','video/quicktime']);
-- A permissive policy alone can be widened by other products' policies (OR).
-- This restrictive boundary prevents that for this bucket without narrowing other buckets.
create policy moa_storage_boundary on storage.objects as restrictive for all to public
  using (bucket_id<>'moa-private' or ((select auth.uid())::text=(storage.foldername(name))[1]
    and coalesce((select auth.jwt()->>'is_anonymous'),'false')='false'))
  with check (bucket_id<>'moa-private' or ((select auth.uid())::text=(storage.foldername(name))[1]
    and coalesce((select auth.jwt()->>'is_anonymous'),'false')='false'));
create policy moa_media_read on storage.objects for select to authenticated
  using (bucket_id='moa-private' and (select auth.uid())::text=(storage.foldername(name))[1]);
create policy moa_media_insert on storage.objects for insert to authenticated
  with check (bucket_id='moa-private' and name ~ ('^'||(select auth.uid())::text||'/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'));
create policy moa_media_delete on storage.objects for delete to authenticated
  using (bucket_id='moa-private' and (select auth.uid())::text=(storage.foldername(name))[1]);
commit;
