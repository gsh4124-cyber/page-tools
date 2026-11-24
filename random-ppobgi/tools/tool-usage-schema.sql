-- Aggregate completed uses only, dated in Korea time. No results or user identifiers.
create table if not exists public.random_picker_tools_daily (
 event_date date not null,
 tool text not null check (tool in ('yut','dice')),
 event_count bigint not null default 0 check(event_count>=0),
 primary key(event_date,tool)
);
alter table public.random_picker_tools_daily enable row level security;
revoke all on public.random_picker_tools_daily from anon,authenticated;
grant select,insert,update on public.random_picker_tools_daily to service_role;
create or replace function public.increment_random_picker_tool_use(p_tool text)
returns void language plpgsql security invoker set search_path='' as $$
begin
 if p_tool is null or p_tool not in ('yut','dice') then raise exception 'Invalid tool'; end if;
 insert into public.random_picker_tools_daily(event_date,tool,event_count)
 values ((now() at time zone 'Asia/Seoul')::date,p_tool,1)
 on conflict(event_date,tool) do update set event_count=public.random_picker_tools_daily.event_count+1;
end;$$;
revoke all on function public.increment_random_picker_tool_use(text) from public,anon,authenticated;
grant execute on function public.increment_random_picker_tool_use(text) to service_role;
