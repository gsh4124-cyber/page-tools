-- Storage has an owner_id column; use scoped variable names in all queries.
begin;
create or replace function moa_private.lifecycle(action text) returns jsonb language plpgsql security definer set search_path='' as $$
declare v_moa_owner uuid:=auth.uid(); v_moa_session uuid:=(auth.jwt()->>'session_id')::uuid; v_moa_started timestamptz; a public.moa_accounts;
begin
 if not moa_private.session_current() then raise exception 'AUTH_REQUIRED'; end if;
 perform pg_advisory_xact_lock(hashtextextended('moa-media:'||v_moa_owner::text,0));
 select created_at into v_moa_started from auth.sessions where id=v_moa_session and user_id=v_moa_owner;
 if action in ('begin','rejoin') and (v_moa_started is null or v_moa_started<now()-interval '5 minutes') then raise exception 'REAUTH_REQUIRED'; end if;
 select * into a from public.moa_accounts where user_id=v_moa_owner;
 if action='begin' then
  if a.status='withdrawn' then return jsonb_build_object('status','withdrawn'); end if;
  insert into public.moa_accounts(user_id,status,deletion_session) values(v_moa_owner,'deleting',v_moa_session)
  on conflict(user_id) do update set status='deleting',deletion_session=v_moa_session,updated_at=clock_timestamp();
  delete from public.moa_documents where user_id=v_moa_owner;
  return jsonb_build_object('status','deleting');
 elsif action='finish' then
  if a.status='withdrawn' then return jsonb_build_object('status','withdrawn'); end if;
  if a.status is distinct from 'deleting' or a.deletion_session is distinct from v_moa_session then raise exception 'DELETION_SESSION_REQUIRED'; end if;
  if exists(select 1 from storage.objects where bucket_id='moa-private' and split_part(name,'/',1)=v_moa_owner::text)
   or exists(select 1 from public.moa_media where user_id=v_moa_owner)
   or exists(select 1 from public.moa_documents where user_id=v_moa_owner) then raise exception 'DELETION_INCOMPLETE'; end if;
  update public.moa_accounts set status='withdrawn',revoked_before=clock_timestamp(),deletion_session=null,updated_at=clock_timestamp() where user_id=v_moa_owner;
  return jsonb_build_object('status','withdrawn');
 elsif action='rejoin' then
  if a.status='deleting' then raise exception 'FINISH_DELETION_FIRST'; end if;
  if a.revoked_before is not null and v_moa_started<=a.revoked_before then raise exception 'NEW_LOGIN_REQUIRED'; end if;
  update public.moa_accounts set status='active',deletion_session=null,updated_at=clock_timestamp() where user_id=v_moa_owner;
  return jsonb_build_object('status','active');
 end if;
 raise exception 'INVALID_ACTION';
end $$;
commit;
