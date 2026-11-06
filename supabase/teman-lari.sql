-- Jalankan sekali di Supabase setelah schema.sql: SQL Editor > New query > tempel > Run.
-- Teman hanya melihat ringkasan di kolom stats. Tabel runs tetap privat untuk tiap akun.

create table if not exists public.profiles (
  user_id uuid primary key default auth.uid() references auth.users on delete cascade,
  display_name text not null check (char_length(display_name) between 1 and 30),
  area text not null default '' check (char_length(area) <= 40),
  friend_code text not null unique
    default upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 8)),
  stats jsonb not null default '{}',
  updated_at timestamptz not null default now()
);

create table if not exists public.friendships (
  requester uuid not null references auth.users on delete cascade,
  addressee uuid not null references auth.users on delete cascade,
  status text not null default 'pending' check (status in ('pending', 'accepted')),
  created_at timestamptz not null default now(),
  primary key (requester, addressee),
  check (requester <> addressee)
);

alter table public.profiles enable row level security;
alter table public.friendships enable row level security;

-- Profil langsung hanya bisa dibaca pemiliknya. Data teman lewat list_friends di bawah.
drop policy if exists "Pemilik mengelola profil sendiri" on public.profiles;
create policy "Pemilik mengelola profil sendiri" on public.profiles
  for all to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

revoke all on public.profiles from anon, authenticated;
revoke all on public.friendships from anon, authenticated;
grant select, delete on public.profiles to authenticated;
grant insert (user_id, display_name, area, stats, updated_at) on public.profiles to authenticated;
grant update (display_name, area, stats, updated_at) on public.profiles to authenticated;

create or replace function public.add_friend(code text)
returns text
language plpgsql
security definer
set search_path = ''
as $$
declare
  me uuid := auth.uid();
  target uuid;
begin
  if me is null then
    return 'not_signed_in';
  end if;
  if not exists (select 1 from public.profiles where user_id = me) then
    return 'no_profile';
  end if;

  select user_id into target
  from public.profiles
  where friend_code = upper(trim(code));

  if target is null then
    return 'not_found';
  end if;
  if target = me then
    return 'self';
  end if;

  update public.friendships
  set status = 'accepted'
  where requester = target and addressee = me and status = 'pending';
  if found then
    return 'accepted';
  end if;

  if exists (
    select 1 from public.friendships
    where (requester = me and addressee = target)
       or (requester = target and addressee = me)
  ) then
    return 'exists';
  end if;

  insert into public.friendships (requester, addressee) values (me, target);
  return 'requested';
end;
$$;

create or replace function public.respond_friend(friend uuid, accept boolean)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if accept then
    update public.friendships
    set status = 'accepted'
    where requester = friend and addressee = auth.uid() and status = 'pending';
  else
    delete from public.friendships
    where requester = friend and addressee = auth.uid() and status = 'pending';
  end if;
end;
$$;

create or replace function public.remove_friend(friend uuid)
returns void
language sql
security definer
set search_path = ''
as $$
  delete from public.friendships
  where (requester = auth.uid() and addressee = friend)
     or (requester = friend and addressee = auth.uid());
$$;

-- Nama muncul setelah berteman atau untuk orang yang meminta pertemanan. Stats hanya setelah disetujui.
create or replace function public.list_friends()
returns table (friend_id uuid, name text, area text, stats jsonb, state text)
language sql
stable
security definer
set search_path = ''
as $$
  select
    p.user_id,
    case when f.status = 'accepted' or f.addressee = auth.uid() then p.display_name end,
    case when f.status = 'accepted' then p.area else '' end,
    case when f.status = 'accepted' then p.stats else '{}'::jsonb end,
    case
      when f.status = 'accepted' then 'accepted'
      when f.addressee = auth.uid() then 'incoming'
      else 'outgoing'
    end
  from public.friendships f
  join public.profiles p
    on p.user_id = case when f.requester = auth.uid() then f.addressee else f.requester end
  where auth.uid() in (f.requester, f.addressee);
$$;

revoke all on function public.add_friend(text) from public, anon;
revoke all on function public.respond_friend(uuid, boolean) from public, anon;
revoke all on function public.remove_friend(uuid) from public, anon;
revoke all on function public.list_friends() from public, anon;
grant execute on function public.add_friend(text) to authenticated;
grant execute on function public.respond_friend(uuid, boolean) to authenticated;
grant execute on function public.remove_friend(uuid) to authenticated;
grant execute on function public.list_friends() to authenticated;
