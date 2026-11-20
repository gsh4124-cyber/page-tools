begin;
create or replace function moa_private.account_status() returns jsonb language plpgsql stable security definer set search_path='' as $$
declare state text;
begin
 if not moa_private.session_current() then raise exception 'AUTH_REQUIRED'; end if;
 select status into state from public.moa_accounts where user_id=auth.uid();
 state:=coalesce(state,'active');
 if state='active' and not moa_private.permitted('active') then raise exception 'AUTH_REQUIRED'; end if;
 return jsonb_build_object('status',state);
end $$;
commit;
