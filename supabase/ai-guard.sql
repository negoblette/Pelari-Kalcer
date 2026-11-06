-- Jalankan sekali di Supabase setelah feed-chat.sql: SQL Editor > New query > tempel > Run.
-- Kuota AI dicek dan dicatat dalam satu langkah, jadi permintaan serentak tidak bisa melewatinya.

revoke insert on public.ai_requests from authenticated;
drop policy if exists "Mencatat kuota AI sendiri" on public.ai_requests;

create or replace function public.claim_ai_quota()
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  me uuid := auth.uid();
  daily_limit constant integer := 3;
  day_start timestamptz := date_trunc('day', now() at time zone 'Asia/Jakarta') at time zone 'Asia/Jakarta';
  used integer;
begin
  if me is null then
    return false;
  end if;

  perform pg_advisory_xact_lock(hashtextextended(me::text, 0));

  select count(*) into used
  from public.ai_requests
  where user_id = me and created_at >= day_start;

  if used >= daily_limit then
    return false;
  end if;

  insert into public.ai_requests (user_id) values (me);
  return true;
end;
$$;

revoke all on function public.claim_ai_quota() from public, anon;
grant execute on function public.claim_ai_quota() to authenticated;
