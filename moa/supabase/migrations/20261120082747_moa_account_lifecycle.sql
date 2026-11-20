-- Moa withdrawal preserves shared Auth identities and other products.
-- Privileged functions live in an unexposed schema, accept no user ID, and check
-- the verified JWT against the caller's live Auth session before touching data.
begin;
create schema moa_private;
revoke all on schema moa_private from public;
grant usage on schema moa_private to anon,authenticated;
create table public.moa_accounts (
 user_id uuid primary key references auth.users(id) on delete cascade,
 status text not null check(status in ('active','deleting','withdrawn')),
 revoked_before timestamptz,
 deletion_session uuid,
 updated_at timestamptz not null default now()
);
alter table public.moa_accounts enable row level security;
alter table public.moa_accounts force row level security;
revoke all on public.moa_accounts from public,anon,authenticated;
grant select on public.moa_accounts to authenticated;

create function moa_private.session_current() returns boolean language plpgsql stable security definer set search_path='' as $$
begin
 if auth.uid() is null or coalesce(auth.jwt()->>'is_anonymous','false')<>'false'
 or coalesce((auth.jwt()->>'exp')::numeric,0)<=extract(epoch from now()) then return false; end if;
 return exists(select 1 from auth.sessions s join auth.users u on u.id=s.user_id
 where s.id=(auth.jwt()->>'session_id')::uuid and s.user_id=auth.uid()
 and (s.not_after is null or s.not_after>now()) and (u.banned_until is null or u.banned_until<now()));
exception when invalid_text_representation or numeric_value_out_of_range then return false;
end $$;
create function moa_private.permitted(mode text) returns boolean language plpgsql stable security definer set search_path='' as $$
declare a public.moa_accounts; started timestamptz;
begin
 if not moa_private.session_current() then return false; end if;
 select * into a from public.moa_accounts where user_id=auth.uid();
 if not found then return true; end if;
 if a.status='deleting' then return mode='cleanup' and a.deletion_session=(auth.jwt()->>'session_id')::uuid; end if;
 if a.status<>'active' then return false; end if;
 select created_at into started from auth.sessions where id=(auth.jwt()->>'session_id')::uuid and user_id=auth.uid();
 return a.revoked_before is null or started>a.revoked_before;
end $$;
create function moa_private.account_status() returns jsonb language plpgsql stable security definer set search_path='' as $$
declare state text;
begin
 if not moa_private.session_current() then raise exception 'AUTH_REQUIRED'; end if;
 select status into state from public.moa_accounts where user_id=auth.uid();
 return jsonb_build_object('status',coalesce(state,'active'));
end $$;
create function moa_private.lifecycle(action text) returns jsonb language plpgsql security definer set search_path='' as $$
declare owner_id uuid:=auth.uid(); sid uuid:=(auth.jwt()->>'session_id')::uuid; started timestamptz; a public.moa_accounts;
begin
 if not moa_private.session_current() then raise exception 'AUTH_REQUIRED'; end if;
 perform pg_advisory_xact_lock(hashtextextended('moa-media:'||owner_id::text,0));
 select created_at into started from auth.sessions where id=sid and user_id=owner_id;
 if action in ('begin','rejoin') and (started is null or started<now()-interval '5 minutes') then raise exception 'REAUTH_REQUIRED'; end if;
 select * into a from public.moa_accounts where user_id=owner_id;
 if action='begin' then
  if a.status='withdrawn' then return jsonb_build_object('status','withdrawn'); end if;
  insert into public.moa_accounts(user_id,status,deletion_session) values(owner_id,'deleting',sid)
  on conflict(user_id) do update set status='deleting',deletion_session=sid,updated_at=clock_timestamp();
  delete from public.moa_documents where user_id=owner_id;
  return jsonb_build_object('status','deleting');
 elsif action='finish' then
  if a.status='withdrawn' then return jsonb_build_object('status','withdrawn'); end if;
  if a.status is distinct from 'deleting' or a.deletion_session is distinct from sid then raise exception 'DELETION_SESSION_REQUIRED'; end if;
  if exists(select 1 from storage.objects where bucket_id='moa-private' and split_part(name,'/',1)=owner_id::text)
   or exists(select 1 from public.moa_media where user_id=owner_id)
   or exists(select 1 from public.moa_documents where user_id=owner_id) then raise exception 'DELETION_INCOMPLETE'; end if;
  update public.moa_accounts set status='withdrawn',revoked_before=clock_timestamp(),deletion_session=null,updated_at=clock_timestamp() where user_id=owner_id;
  return jsonb_build_object('status','withdrawn');
 elsif action='rejoin' then
  if a.status='deleting' then raise exception 'FINISH_DELETION_FIRST'; end if;
  if a.revoked_before is not null and started<=a.revoked_before then raise exception 'NEW_LOGIN_REQUIRED'; end if;
  update public.moa_accounts set status='active',deletion_session=null,updated_at=clock_timestamp() where user_id=owner_id;
  return jsonb_build_object('status','active');
 end if;
 raise exception 'INVALID_ACTION';
end $$;
revoke all on function moa_private.session_current(),moa_private.permitted(text),moa_private.account_status(),moa_private.lifecycle(text) from public,anon,authenticated;
grant execute on function moa_private.session_current(),moa_private.permitted(text) to anon,authenticated;
grant execute on function moa_private.account_status(),moa_private.lifecycle(text) to authenticated;
create policy moa_account_read on public.moa_accounts for select to authenticated using(user_id=(select auth.uid()) and moa_private.session_current());
create policy moa_document_account_guard on public.moa_documents as restrictive for all to public using(moa_private.permitted('active')) with check(moa_private.permitted('active'));
create policy moa_ledger_account_guard on public.moa_media as restrictive for all to public using(moa_private.permitted('cleanup')) with check(moa_private.permitted('active'));
create policy moa_storage_account_guard on storage.objects as restrictive for all to public using(bucket_id<>'moa-private' or moa_private.permitted('cleanup')) with check(bucket_id<>'moa-private' or moa_private.permitted('active'));
create function public.moa_account_status() returns jsonb language sql security invoker set search_path='' as $$ select moa_private.account_status() $$;
create function public.moa_begin_withdrawal() returns jsonb language sql security invoker set search_path='' as $$ select moa_private.lifecycle('begin') $$;
create function public.moa_finish_withdrawal() returns jsonb language sql security invoker set search_path='' as $$ select moa_private.lifecycle('finish') $$;
create function public.moa_rejoin() returns jsonb language sql security invoker set search_path='' as $$ select moa_private.lifecycle('rejoin') $$;
revoke all on function public.moa_account_status(),public.moa_begin_withdrawal(),public.moa_finish_withdrawal(),public.moa_rejoin() from public,anon;
grant execute on function public.moa_account_status(),public.moa_begin_withdrawal(),public.moa_finish_withdrawal(),public.moa_rejoin() to authenticated;
create function public.moa_health() returns jsonb language sql stable security invoker set search_path='' as $$
 select jsonb_build_object('ready',to_regclass('public.moa_documents') is not null and to_regclass('public.moa_media') is not null and to_regclass('public.moa_accounts') is not null,'protocol',2)
$$;
revoke all on function public.moa_health() from public;
grant execute on function public.moa_health() to anon,authenticated;

create or replace function public.moa_storage_completed_budget() returns trigger language plpgsql security invoker set search_path='' as $$
declare m public.moa_media;
begin
 if new.bucket_id<>'moa-private' or new.metadata->>'size' is null then return new; end if;
 select * into m from public.moa_media where path=new.name;
 if not found then raise exception 'MOA_RESERVATION_REQUIRED'; end if;
 perform pg_advisory_xact_lock(hashtextextended('moa-media:'||m.user_id::text,0));
 select * into m from public.moa_media where path=new.name;
 if not found or m.bytes<>(new.metadata->>'size')::bigint or m.mime is distinct from new.metadata->>'mimetype' then raise exception 'MOA_UPLOAD_SIZE_MISMATCH'; end if;
 if exists(select 1 from public.moa_accounts where user_id=m.user_id and status<>'active') then raise exception 'MOA_ACCOUNT_CLOSED'; end if;
 return new;
end $$;
commit;
