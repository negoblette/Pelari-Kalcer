-- Jalankan sekali di Supabase setelah teman-lari.sql: SQL Editor > New query > tempel > Run.
-- Feed hanya berisi tipe lari, jarak, pace, dan tanggal. Rute, catatan, dan gear tetap privat.

alter table public.profiles
  add column if not exists avatar integer not null default floor(random() * 1000000)::integer;
grant update (avatar) on public.profiles to authenticated;

create or replace function public.is_friend(other uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.friendships f
    where f.status = 'accepted'
      and ((f.requester = auth.uid() and f.addressee = other)
        or (f.requester = other and f.addressee = auth.uid()))
  );
$$;
revoke all on function public.is_friend(uuid) from public, anon;
grant execute on function public.is_friend(uuid) to authenticated;

create table if not exists public.feed_posts (
  user_id uuid not null default auth.uid() references auth.users on delete cascade,
  run_id text not null,
  run_date date not null,
  run_type text not null default '',
  km numeric not null check (km > 0),
  pace_seconds integer not null default 0,
  created_at timestamptz not null default now(),
  primary key (user_id, run_id)
);

create table if not exists public.feed_likes (
  post_user uuid not null,
  run_id text not null,
  user_id uuid not null default auth.uid() references auth.users on delete cascade,
  created_at timestamptz not null default now(),
  primary key (post_user, run_id, user_id),
  foreign key (post_user, run_id) references public.feed_posts (user_id, run_id) on delete cascade
);

create table if not exists public.feed_comments (
  id uuid primary key default gen_random_uuid(),
  post_user uuid not null,
  run_id text not null,
  user_id uuid not null default auth.uid() references auth.users on delete cascade,
  body text not null check (char_length(body) between 1 and 300),
  created_at timestamptz not null default now(),
  foreign key (post_user, run_id) references public.feed_posts (user_id, run_id) on delete cascade
);

create table if not exists public.messages (
  id uuid primary key default gen_random_uuid(),
  sender uuid not null default auth.uid() references auth.users on delete cascade,
  recipient uuid not null references auth.users on delete cascade,
  body text not null check (char_length(body) between 1 and 1000),
  created_at timestamptz not null default now(),
  read_at timestamptz,
  check (sender <> recipient)
);
create index if not exists messages_pair_idx on public.messages (sender, recipient, created_at);
create index if not exists messages_recipient_idx on public.messages (recipient, read_at);

-- Dipakai server untuk membatasi jumlah analisis AI per hari.
create table if not exists public.ai_requests (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users on delete cascade,
  created_at timestamptz not null default now()
);

alter table public.feed_posts enable row level security;
alter table public.feed_likes enable row level security;
alter table public.feed_comments enable row level security;
alter table public.messages enable row level security;
alter table public.ai_requests enable row level security;

drop policy if exists "Pemilik dan teman melihat post" on public.feed_posts;
create policy "Pemilik dan teman melihat post" on public.feed_posts
  for select to authenticated
  using (user_id = (select auth.uid()) or public.is_friend(user_id));
drop policy if exists "Pemilik menulis post" on public.feed_posts;
create policy "Pemilik menulis post" on public.feed_posts
  for insert to authenticated with check (user_id = (select auth.uid()));
drop policy if exists "Pemilik mengubah post" on public.feed_posts;
create policy "Pemilik mengubah post" on public.feed_posts
  for update to authenticated
  using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
drop policy if exists "Pemilik menghapus post" on public.feed_posts;
create policy "Pemilik menghapus post" on public.feed_posts
  for delete to authenticated using (user_id = (select auth.uid()));

drop policy if exists "Melihat jempol post yang terlihat" on public.feed_likes;
create policy "Melihat jempol post yang terlihat" on public.feed_likes
  for select to authenticated
  using (post_user = (select auth.uid()) or public.is_friend(post_user));
drop policy if exists "Memberi jempol" on public.feed_likes;
create policy "Memberi jempol" on public.feed_likes
  for insert to authenticated
  with check (
    user_id = (select auth.uid())
    and (post_user = (select auth.uid()) or public.is_friend(post_user))
  );
drop policy if exists "Menarik jempol" on public.feed_likes;
create policy "Menarik jempol" on public.feed_likes
  for delete to authenticated using (user_id = (select auth.uid()));

drop policy if exists "Melihat komentar post yang terlihat" on public.feed_comments;
create policy "Melihat komentar post yang terlihat" on public.feed_comments
  for select to authenticated
  using (post_user = (select auth.uid()) or public.is_friend(post_user));
drop policy if exists "Menulis komentar" on public.feed_comments;
create policy "Menulis komentar" on public.feed_comments
  for insert to authenticated
  with check (
    user_id = (select auth.uid())
    and (post_user = (select auth.uid()) or public.is_friend(post_user))
  );
drop policy if exists "Menghapus komentar" on public.feed_comments;
create policy "Menghapus komentar" on public.feed_comments
  for delete to authenticated
  using (user_id = (select auth.uid()) or post_user = (select auth.uid()));

drop policy if exists "Membaca pesan sendiri" on public.messages;
create policy "Membaca pesan sendiri" on public.messages
  for select to authenticated
  using ((select auth.uid()) in (sender, recipient));
drop policy if exists "Mengirim pesan ke teman" on public.messages;
create policy "Mengirim pesan ke teman" on public.messages
  for insert to authenticated
  with check (sender = (select auth.uid()) and public.is_friend(recipient));

drop policy if exists "Melihat kuota AI sendiri" on public.ai_requests;
create policy "Melihat kuota AI sendiri" on public.ai_requests
  for select to authenticated using (user_id = (select auth.uid()));
drop policy if exists "Mencatat kuota AI sendiri" on public.ai_requests;
create policy "Mencatat kuota AI sendiri" on public.ai_requests
  for insert to authenticated with check (user_id = (select auth.uid()));

revoke all on public.feed_posts, public.feed_likes, public.feed_comments, public.messages, public.ai_requests
  from anon, authenticated;
grant select, delete on public.feed_posts to authenticated;
grant insert (run_id, run_date, run_type, km, pace_seconds) on public.feed_posts to authenticated;
grant update (run_date, run_type, km, pace_seconds) on public.feed_posts to authenticated;
grant select, delete on public.feed_likes to authenticated;
grant insert (post_user, run_id) on public.feed_likes to authenticated;
grant select, delete on public.feed_comments to authenticated;
grant insert (post_user, run_id, body) on public.feed_comments to authenticated;
grant select on public.messages to authenticated;
grant insert (recipient, body) on public.messages to authenticated;
grant select on public.ai_requests to authenticated;
grant insert (user_id) on public.ai_requests to authenticated;

drop function if exists public.list_friends();
create function public.list_friends()
returns table (friend_id uuid, name text, area text, avatar integer, stats jsonb, state text)
language sql
stable
security definer
set search_path = ''
as $$
  select
    p.user_id,
    case when f.status = 'accepted' or f.addressee = auth.uid() then p.display_name end,
    case when f.status = 'accepted' then p.area else '' end,
    case when f.status = 'accepted' or f.addressee = auth.uid() then p.avatar end,
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

create or replace function public.list_feed()
returns table (
  author_id uuid, name text, avatar integer, run_id text, run_date date, run_type text,
  km numeric, pace_seconds integer, likes integer, liked boolean, comments jsonb, mine boolean
)
language sql
stable
security definer
set search_path = ''
as $$
  select
    post.user_id,
    author.display_name,
    author.avatar,
    post.run_id,
    post.run_date,
    post.run_type,
    post.km,
    post.pace_seconds,
    (select count(*)::integer from public.feed_likes l
      where l.post_user = post.user_id and l.run_id = post.run_id),
    exists (select 1 from public.feed_likes l
      where l.post_user = post.user_id and l.run_id = post.run_id and l.user_id = auth.uid()),
    coalesce((
      select jsonb_agg(jsonb_build_object(
        'id', c.id, 'name', writer.display_name, 'avatar', writer.avatar, 'body', c.body,
        'mine', c.user_id = auth.uid()
      ) order by c.created_at)
      from public.feed_comments c
      join public.profiles writer on writer.user_id = c.user_id
      where c.post_user = post.user_id and c.run_id = post.run_id
    ), '[]'::jsonb),
    post.user_id = auth.uid()
  from public.feed_posts post
  join public.profiles author on author.user_id = post.user_id
  where post.user_id = auth.uid()
     or exists (
       select 1 from public.friendships f
       where f.status = 'accepted'
         and ((f.requester = auth.uid() and f.addressee = post.user_id)
           or (f.requester = post.user_id and f.addressee = auth.uid()))
     )
  order by post.run_date desc, post.created_at desc
  limit 50;
$$;

create or replace function public.unread_counts()
returns table (friend_id uuid, unread integer)
language sql
stable
security definer
set search_path = ''
as $$
  select sender, count(*)::integer
  from public.messages
  where recipient = auth.uid() and read_at is null
  group by sender;
$$;

create or replace function public.mark_read(friend uuid)
returns void
language sql
security definer
set search_path = ''
as $$
  update public.messages
  set read_at = now()
  where sender = friend and recipient = auth.uid() and read_at is null;
$$;

revoke all on function public.list_friends() from public, anon;
revoke all on function public.list_feed() from public, anon;
revoke all on function public.unread_counts() from public, anon;
revoke all on function public.mark_read(uuid) from public, anon;
grant execute on function public.list_friends() to authenticated;
grant execute on function public.list_feed() to authenticated;
grant execute on function public.unread_counts() to authenticated;
grant execute on function public.mark_read(uuid) to authenticated;
